# Roça Feliz

Um jogo de fazenda no navegador, inspirado no clássico *Colheita Feliz* do Orkut.

A fazenda ocupa a tela toda, como no original. O cartão do jogador (foto, nível, experiência e moedas) fica no canto de cima. Os lugares (Roça, Rancho e Casa) ficam à esquerda, e o menu (Loja, Celeiro, Terreno e Amigos) à direita, abrindo uma janela por cima do jogo. As ferramentas são botões redondos embaixo. Os botões + e − do lado direito (ou a roda do mouse, ou a pinça no celular) dão zoom, e arrastando dá para andar pela cena. Uma placa ao lado do celeiro mostra em que nível sai a próxima leva de canteiros.

Não tem build nem dependências: é HTML, CSS e JavaScript puro. Para jogar, abra o `index.html` num servidor qualquer (veja abaixo) ou publique no GitHub Pages.

## O que tem no jogo

- **Roça de até 100 canteiros.** Você começa no nível 1 com 2.000 moedas e 6 canteiros. As expansões (nível 5, 10, 15, 20, 30, 40 e 50) liberam mais canteiros, e você escolhe onde colocar cada um, encostado na sua terra.
- **19 plantações** (do nabo de 2 minutos ao maracujá de 36 horas) e **8 árvores frutíferas** (morangueiro, videira, macieira, laranjeira, bananeira, coqueiro, mangueira e goiabeira). A árvore é plantada uma vez, dá 15 colheitas e depois pede uma poda. Cada colheita rende um número sorteado numa faixa (o nabo dá de 3 a 5, por exemplo). A ferramenta escolhida acompanha o cursor e aparece em cima da planta quando é usada, com som. A terra seca atrapalha, e insetos aparecem de vez em quando, nunca os dois ao mesmo tempo. XP para o próximo nível: 100 + 50 × (nível − 1). Cada planta dá XP em até 50 colheitas por dia.
- **Enxada** (100 moedas) para arrancar plantações e árvores.
- **3 fertilizantes**: básico (corta 10% do tempo, 50 moedas), rápido (25%, 200) e premium (50%, 1.000). Dá para usar quantos quiser na mesma planta.
- **Música e sons**: 3 músicas calmas de roça e sons para cliques, regar, enxada, colher e mais. Tudo é sintetizado no navegador (`js/audio.js`), sem arquivos de áudio.
- **Configurações** (engrenagem no topo): liga e desliga música e sons, volume de cada um, escolha da música e tema (automático, dia ou noite). O botão **Verificar atualizações** confere se o site tem uma versão nova; se tiver, salva a roça, limpa o cache e recarrega o jogo já atualizado. Ao publicar uma mudança, aumente o número em `rf-version` e nos `?v=` do `index.html`.
- **Rancho com 8 abrigos**, cada um com o seu cercado: galinheiro (galinha e pato), coelheira, chiqueiro (porca e porquinho), apiário (colmeias), redil (cabra e ovelha), curral (bezerro, vaca e búfala), cocheira (cavalo, potro e burro) e viveiro (pavão e avestruz). O galinheiro já vem pronto. Os outros são construídos na Loja (aba Abrigos) ou clicando na placa no rancho. Cada abrigo tem 3 níveis: cabem 4, 6 e 8 animais. No celular, dá para arrastar o rancho para ver tudo.
- **Animais de produção**: galinha, pato, coelho, cabra, ovelha, vaca, colmeia, porca e búfala. Cada produção custa uma ração em moedas. Sem comida o animal só para de produzir. Cada um vive de 30 a 60 dias e depois vai embora, e é preciso comprar outro. Dá para vender antes, por bem menos que a compra e cada dia mais barato. A porca tem leitões, que viram porquinhos no chiqueiro. A ração especial faz a próxima produção render em dobro. Botões para alimentar e recolher tudo de uma vez.
- **Animais para criar e vender**: porquinho, bezerro, burro, potro e avestruz. Comem uma vez por dia e são vendidos adultos.
- **Companhia**: gato, tartaruga e arara moram dentro de casa; o cavalo mora na cocheira e o pavão no viveiro. Dá para trocar o nome e fazer carinho.
- **Cães de guarda**: a casinha fica do lado do celeiro. Dá para ter 2 cachorros, um para a plantação e outro para os animais, de 3 raças com preço, vida e força diferentes. Com ração (dura 8h) o cachorro fica acordado, espanta quem tenta pegar suas coisas e às vezes morde, ganhando até 10 moedas do ladrão. Ele também dá XP por dia e por ladrão pego.
- **Plantação pronta** aparece com um check verde.
- **Casa com 6 decorações**: tapete, vaso de planta, quadro, abajur, sofá e televisão. Cada uma dá conforto, e cada ponto de conforto vale +1% de XP.
- **Celeiro** para vender colheitas e produtos.
- **Vizinhos da vila** (Seu Zé e Dona Maria), que não são amigos de verdade, para visitar a qualquer hora.
- **Caixa de correio** no menu: as novidades da sua roça (visitas dos amigos, presentes, o que o cachorro fez e recados da vila).
- **Login com Google, salvamento na nuvem e amigos de verdade** (precisa do Firebase, veja abaixo).
  - Cada jogador ganha um **código de amigo** de 6 letras. Digitar o código de alguém manda um **pedido de amizade**, que a pessoa pode **aceitar ou recusar** na aba Amigos. Dá para cancelar um pedido enviado e desfazer uma amizade.
  - Só amigos veem e visitam a sua roça. Quem recebe um pedido pode espiar a roça de quem pediu antes de aceitar.
  - Na roça de um amigo você pode tirar pragas, regar, alimentar os animais ou pegar um pouquinho: até 3 itens da plantação e 3 dos animais por roça, em no máximo 5 roças por dia (se o cachorro deixar!). Os limites voltam à meia-noite. O dono recebe um aviso na caixa de correio. O nível da roça de cada amigo aparece na lista e durante a visita.

- **Um aparelho por vez**: entrar no celular tira o computador (e vice-versa), com um aviso. A roça continua de onde parou em qualquer aparelho. O jogo salva na nuvem poucos segundos depois de cada mudança e quando você sai da página, e o botão de disquete no topo salva na hora.

Sem o Firebase configurado, o jogo funciona do mesmo jeito, mas salva só no navegador e não tem amigos de verdade.

- **Missões**: 3 diárias (trocam à meia-noite) e 3 semanais (trocam na segunda-feira à meia-noite), com prêmio em moedas e XP.
- **Presente diário**: 7 dias de presentes (o 7º é um baú). Depois vem uma leva nova.
- **Presente para os amigos**: na aba Amigos, mande um presente por dia para até 5 amigos (100 moedas, fertilizante, ração especial ou ração de cachorro). Não custa nada para quem manda. *Precisa das regras novas do `firestore.rules` publicadas no Firebase.*
- **Avisos nos botões**: Roça e Rancho mostram um número verde quando tem coisa pronta para colher, recolher ou vender.
- **Ajuda de volta**: quem ajudou a sua roça (um amigo ou um vizinho da vila) fica marcado por 2 dias. Ajudar de volta dá 50 moedas.
- **Livro de coleção**: cada planta e produto dos animais ganha carimbos de bronze (10 colheitas), prata (50) e ouro (200), com prêmios.
- **Temas da roça**: clássico, cerca branca com roseiras, muro de pedra, tropical com coqueiros e lago dos patos.
- **Estações do ano**: mudam toda segunda-feira (primavera, verão, outono e inverno). A grama e as árvores mudam, e 5 plantas da estação rendem 30% a mais.
- **Colheita dourada**: rara (3%), a planta brilha e rende 5 vezes mais.
- **Chuva** (neve no inverno): de vez em quando chove por 5 minutos e rega a roça toda, com som de chuva.
- **Borboletas, sapos, porquinhos-da-índia e grilos** pela grama, um bando de passarinhos no céu e, de noite, **vaga-lumes**. Eles ficam presos ao chão e acompanham o zoom.

## Arquivos

| Arquivo | O que é |
| --- | --- |
| `index.html` | Página e estilos |
| `js/game.js` | O jogo: dados, simulação, desenho e interface |
| `js/audio.js` | Músicas e efeitos sonoros, sintetizados com Web Audio |
| `js/cloud.js` | Login com Google e Firestore (só liga com o Firebase configurado) |
| `firebase-config.js` | Onde você cola a configuração do seu projeto Firebase |
| `firestore.rules` | Regras de segurança do banco de dados |

## Rodar no computador

O login do Google não funciona abrindo o arquivo direto (`file://`). Use um servidor local:

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

## Ligar o login com Google e os amigos (Firebase)

O Firebase é gratuito para um jogo desse tamanho (plano Spark).

1. Entre em <https://console.firebase.google.com> e clique em **Adicionar projeto**. O Google Analytics pode ficar desligado.
2. **Login com Google**: no menu, vá em **Criação > Authentication > Começar > Método de login**, escolha **Google**, ative e salve.
3. **Banco de dados**: vá em **Criação > Firestore Database > Criar banco de dados**. Escolha uma região (por exemplo `southamerica-east1`, em São Paulo) e o **modo de produção**.
4. **Regras**: na aba **Regras** do Firestore, apague o que estiver lá, cole o conteúdo de `firestore.rules` e clique em **Publicar**.
5. **Registrar o app web**: em **Configurações do projeto** (engrenagem) > **Seus apps**, clique no ícone `</>`, dê um nome e registre. Vai aparecer um objeto `firebaseConfig`.
6. Copie `apiKey`, `authDomain`, `projectId` e `appId` para o `firebase-config.js`, no lugar do `null`:

   ```js
   window.FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "seu-projeto.firebaseapp.com",
     projectId: "seu-projeto",
     appId: "1:1234567890:web:abcdef123456"
   };
   ```

   Essas chaves podem ficar públicas no site. Quem protege os dados são as regras do passo 4.
7. **Domínios autorizados**: em **Authentication > Configurações > Domínios autorizados**, adicione o endereço onde o jogo vai ficar (por exemplo `seu-usuario.github.io`). O `localhost` já vem liberado.

### Publicar no GitHub Pages

No repositório do GitHub: **Settings > Pages > Build and deployment**, escolha **Deploy from a branch**, a branch do jogo e a pasta `/ (root)`. Em um ou dois minutos o jogo fica em `https://seu-usuario.github.io/nome-do-repositorio/`. Lembre de adicionar `seu-usuario.github.io` nos domínios autorizados (passo 7).

## Como os dados ficam guardados

- `farms/{uid}`: a roça de cada jogador (o estado do jogo em JSON, mais nome, foto, nível, código e as listas `friends` e `sent`). Podem ler o dono, os amigos e quem recebeu um pedido de amizade dele. Só o dono escreve.
- `farms/{uid}/requests/{quemPediu}`: pedidos de amizade recebidos. Aceitar coloca a pessoa em `friends`; recusar apaga o pedido.
- `farms/{uid}/visits/{id}`: o que os amigos fizeram na sua roça. Só amigos criam, sempre em seu próprio nome. O dono aplica e apaga.
- `codes/{código}`: liga o código de amigo ao jogador.

Ao entrar com o Google pela primeira vez, a roça que já estava no navegador vai para a sua conta.

Toda a lógica do jogo roda no navegador, então quem entende de programação consegue trapacear na própria roça. Para um jogo entre amigos isso não é problema. Se um dia virar algo maior, dá para mover as regras importantes (moedas, colheita) para Cloud Functions.
