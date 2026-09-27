# FlyLab — Drosophila Connectome Lab

Laboratório web estático para exploração de um subgrafo **real** do FlyWire FAFB v783 e simulação **didática** LIF. Interface em português, responsiva e sem dependências de execução. A visualização 3D é uma projeção interativa dos pontos de referência do arquivo de coordenadas: não é uma malha cerebral nem mostra as arborizações.

## Executar

```bash
python3 -m http.server 8080
# http://localhost:8080
```

A raiz contém `index.html`, `src/`, `data/fafb783-sample.json` e `netlify.toml`. No Netlify, comando de build vazio e diretório de publicação `.`. É preciso um servidor HTTP, pois módulos e Web Worker não funcionam de modo confiável via `file://`.

## Dados

O arquivo implantado contém **420 neurônios, 5.742 conexões dirigidas, 338.945 sinapses somadas nas conexões da amostra**. IDs, tipo celular, rótulo de região dominante, neurotransmissor previsto e posições de referência foram derivados dos CSVs públicos `connections.csv.gz`, `neurons.csv.gz`, `consolidated_cell_types.csv.gz` e `coordinates.csv.gz` de [FlyWire Codex FAFB v783](https://codex.flywire.ai/api/download). O algoritmo escolhe os 420 maiores graus ponderados em conexões com pelo menos cinco sinapses, soma regiões e retém o subgrafo induzido. É deliberadamente enviesado para hubs. A soma de sinapses no site representa só as conexões internas, não o cérebro completo. IDs são strings para preservar precisão de 64 bits em JavaScript.

Para reproduzir o arquivo: baixe os quatro CSVs `.gz` de `https://storage.googleapis.com/flywire-data/codex/data/fafb/783/` em `data/source/` e execute `python3 tools/build_sample.py`. Os arquivos brutos (cerca de 55 MB compactados) ficam fora do deploy. O JSON da amostra tem cerca de 128 KB. A origem é carregada sob demanda uma vez; se indisponível, `src/demo-data.js` fornece um dataset **sintético**, sinalizado como DEMO DATASET.

## Simulação

`src/sim-worker.js` usa 5 ms por passo, vazamento discreto (constante nominal 22 ms), um passo de atraso, um passo refratário, drive pseudoaleatório com semente fixa, pesos `log(1 + syn_count) / 6` e limiar configurável. Sinais são todos efetivamente excitatórios; o campo `nt_type` é informativo e não altera a dinâmica. Nenhum parâmetro foi calibrado para uma população biológica. Controle vs experimento reutiliza a mesma semente e drive; o controle remove apenas os neurônios silenciados, mantendo os ativados. Saídas e taxas são do modelo, não medidas experimentais.

A reprodução mostra bins de 25 ms; pausá-la não pausa o cálculo em lote do Worker. O Path Finder percorre arestas dirigidas da amostra; no modo peso maximiza o produto de pesos relativos sob limite de saltos, com busca limitada a 2.500 candidatos por camada. Portanto o resultado ponderado é heurístico para grafos muito ramificados. A análise de regiões usa a região dominante por neurônio, não a localização de cada sinapse. Clusters/comunidades genuínas e uma malha anatômica não estão implementados.

## Testes

```bash
node --check src/app.js
node --check src/brain-view.js
node --check src/sim-worker.js
python3 -m http.server 8080
```

Verifique em desktop e mobile: seleção, filtros, zoom/rotação, intervenções, execução, comparação, timeline, gráficos, path finder, restauração e fallback. O Worker é isolado da UI.

## Fontes e atribuição

- [FlyWire / Codex data downloads](https://codex.flywire.ai/api/download)
- [Dorkenwald et al. 2024, Nature — neuronal wiring diagram](https://www.nature.com/articles/s41586-024-07558-y)
- [Schlegel et al. 2024, Nature — annotations](https://www.nature.com/articles/s41586-024-07686-5)
- [FlyWire annotation repository](https://github.com/flyconnectome/flywire_annotations)
- [Janelia FlyEM](https://www.janelia.org/project-team/flyem)
- [Shiu et al. computational model repository](https://github.com/philshiu/Drosophila_brain_model) — referência externa; este aplicativo executa um modelo LIF próprio e simplificado.

Código do FlyLab: MIT (`LICENSE`). Dados originais seguem os termos e citações dos produtores.
