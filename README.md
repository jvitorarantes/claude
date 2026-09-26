# Roça Feliz

Um jogo de fazenda no navegador, inspirado no clássico *Colheita Feliz* do Orkut.

Não tem build nem dependências: é HTML, CSS e JavaScript puro. Para jogar, abra o `index.html` num servidor qualquer (veja abaixo) ou publique no GitHub Pages.

## O que tem no jogo

- **Roça com 40 lotes.** Você começa com 6 e escolhe onde crescer: qualquer lote encostado na sua terra pode ser comprado (clique duas vezes para confirmar). A câmera se afasta sozinha à medida que a roça cresce.
- **8 sementes**, de nabo a melancia. Cada uma mostra quantas colheitas dá antes de secar (o morango dá 4). Mato e terra seca atrapalham, e insetos aparecem de vez em quando.
- **3 adubos**: básico (corta 25% do tempo que falta), premium (50%) e pro (deixa pronto na hora). Um por safra.
- **Música e sons**: 3 músicas calmas de roça e sons para cliques, regar, enxada, colher e mais. Tudo é sintetizado no navegador (`js/audio.js`), sem arquivos de áudio.
- **Configurações** (engrenagem no topo): liga e desliga música e sons, volume de cada um, escolha da música e tema (automático, dia ou noite).
- **Animais**: galinha (ovo), vaca (leite), ovelha (lã) e porco (trufa). Eles comem 1 Milho do celeiro ou ração comprada na hora e produzem enquanto estão alimentados. Cabem 12 no cercado.
- **Casa com 6 decorações**: tapete, vaso de planta, quadro, abajur, sofá e televisão. Cada uma dá conforto, e cada ponto de conforto vale +1% de XP.
- **Celeiro** para vender colheitas e produtos.
- **Vizinhos da vila** (Tia Cida, Seu Juca e Dona Neide) para visitar a qualquer hora.
- **Login com Google, salvamento na nuvem e amigos de verdade** (precisa do Firebase, veja abaixo).
  - Cada jogador ganha um **código de amigo** de 6 letras. Digitar o código de alguém manda um **pedido de amizade**, que a pessoa pode **aceitar ou recusar** na aba Amigos. Dá para cancelar um pedido enviado e desfazer uma amizade.
  - Só amigos veem e visitam a sua roça. Quem recebe um pedido pode espiar a roça de quem pediu antes de aceitar.
  - Na roça de um amigo você pode tirar mato e pragas, regar, alimentar os animais ou pegar um pouquinho da colheita (se o cachorro deixar!). O dono vê o que aconteceu quando abre o jogo.

Sem o Firebase configurado, o jogo funciona do mesmo jeito, mas salva só no navegador e não tem amigos de verdade.

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
