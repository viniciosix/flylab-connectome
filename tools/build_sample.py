"""Deterministic, biased high-connectivity sample from public FlyWire FAFB v783 CSVs.

Run from the project root after placing the four official .csv.gz files in data/source.
The source files are excluded from the deployed site.
"""
import collections
import csv
import gzip
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data/source'
DEST = ROOT / 'data/fafb783-sample.json'
SIZE = 420
MIN_SYN = 5

def rows(name):
    with gzip.open(SOURCE / name, 'rt', newline='') as file:
        yield from csv.DictReader(file)

def main():
    degree = collections.Counter()
    full_in = collections.Counter()
    full_out = collections.Counter()
    links = collections.defaultdict(int)
    region_weights = collections.defaultdict(collections.Counter)
    for row in rows('connections.csv.gz'):
        pre, post, weight = row['pre_root_id'], row['post_root_id'], int(row['syn_count'])
        full_out[pre] += weight
        full_in[post] += weight
        if weight < MIN_SYN or pre == post:
            continue
        degree[pre] += weight
        degree[post] += weight
        links[(pre, post)] += weight
        region_weights[pre][row['neuropil']] += weight
        region_weights[post][row['neuropil']] += weight
    selected = [key for key, _ in degree.most_common(SIZE)]
    selected_set = set(selected)
    types = {r['root_id']: r['primary_type'] for r in rows('consolidated_cell_types.csv.gz') if r['root_id'] in selected_set}
    transmitters = {r['root_id']: r['nt_type'] for r in rows('neurons.csv.gz') if r['root_id'] in selected_set}
    positions = {}
    for r in rows('coordinates.csv.gz'):
        if r['root_id'] in selected_set:
            coords = [int(x) for x in re.findall(r'-?\d+', r['position'])]
            if len(coords) == 3:
                positions[r['root_id']] = coords
    idx = {key: i for i, key in enumerate(selected)}
    neurons = []
    for key in selected:
        region = region_weights[key].most_common(1)[0][0]
        neurons.append({'id': key, 'type': types.get(key) or 'Não anotado',
                        'region': region, 'nt': transmitters.get(key) or 'Desconhecido',
                        'position': positions.get(key), 'totalInput': full_in[key],
                        'totalOutput': full_out[key]})
    edges = [[idx[a], idx[b], w] for (a, b), w in links.items() if a in idx and b in idx]
    edges.sort(key=lambda e: (e[0], e[1]))
    payload = {'dataset': 'FlyWire FAFB v783', 'sampleMethod': f'Top {SIZE} neurons by weighted degree over connections with >= {MIN_SYN} synapses; induced directed subgraph',
               'coordinateNote': 'FlyWire coordinates.csv position values; markers only, no neuron morphology or brain mesh',
               'neurons': neurons, 'edges': edges}
    DEST.parent.mkdir(exist_ok=True)
    DEST.write_text(json.dumps(payload, ensure_ascii=False, separators=(',', ':')))
    print(f'{len(neurons)} neurons, {len(edges)} directed edges, {sum(e[2] for e in edges)} sampled synapses; {len(positions)} positions -> {DEST}')

if __name__ == '__main__':
    main()
