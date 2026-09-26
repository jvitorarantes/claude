# Roça Feliz

Um joguinho de fazenda no navegador, inspirado no clássico *Colheita Feliz* do Orkut.

É um arquivo só (`index.html`), sem dependências nem build. Para jogar, abra o arquivo no navegador.

## Como jogar

- **Mão (1)**: faz a ação certa no lote. Colhe, rega, tira mato e pragas, limpa planta seca e planta a semente escolhida.
- **Enxada (2)**, **Regar (3)**, **Inseticida (4)**, **Arrancar (5)**, **Semente (6)**: ferramentas específicas.
- **Loja**: escolha a semente. O preço é cobrado quando você planta.
- **Celeiro**: venda o que colheu.
- **Terreno**: compre lotes novos (o próximo aparece com uma placa "À venda").
- **Vizinhos**: visite Tia Cida, Seu Juca e Dona Neide. Tire mato e pragas para ganhar moedas, ou pegue um pouco da colheita madura. Cuidado com o cachorro!

## Regras

- As plantas crescem em tempo real, inclusive com o jogo fechado.
- Mato e pragas diminuem a colheita enquanto ficam no lote. Terra seca faz a planta crescer na metade da velocidade.
- Tomate e morango dão 2 safras antes de secar.
- Subir de nível libera sementes novas e lotes para comprar.
- O céu acompanha o horário do seu relógio (dia, fim de tarde e noite).
- O progresso fica salvo no `localStorage` do navegador.
