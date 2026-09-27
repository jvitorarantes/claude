# Roça Feliz

Um jogo de fazenda no navegador, inspirado no clássico *Colheita Feliz* do Orkut.

A fazenda ocupa a tela toda, como no original. O cartão do jogador (foto, nível, experiência e moedas) fica no canto de cima. Os lugares (Roça, Rancho e Casa) ficam à esquerda, e o menu (Loja, Celeiro, Terreno e Amigos) à direita, abrindo uma janela por cima do jogo. As ferramentas são botões redondos embaixo. Os botões + e − do lado direito (ou a roda do mouse, ou a pinça no celular) dão zoom, e arrastando dá para andar pela cena. Uma placa ao lado do celeiro mostra em que nível sai a próxima leva de canteiros.

Não tem build nem dependências: é HTML, CSS e JavaScript puro. Para jogar, abra o `index.html` num servidor qualquer (veja abaixo) ou publique no GitHub Pages.

## O que tem no jogo

- **Roça de até 100 canteiros.** Você começa no nível 1 com 2.000 moedas e 6 canteiros. As expansões (nível 5, 10, 15, 20, 30, 40 e 50) liberam mais canteiros, e você escolhe onde colocar cada um, encostado na sua terra.
- **19 plantações** (do nabo de 2 minutos ao maracujá de 36 horas) e **8 árvores frutíferas** (morangueiro, videira, macieira, laranjeira, bananeira, coqueiro, mangueira e goiabeira). A árvore é plantada uma vez, dá 15 colheitas e depois pede uma poda. Cada colheita rende um número sorteado numa faixa (o nabo dá de 3 a 5, por exemplo). A ferramenta escolhida acompanha o cursor e aparece em cima da planta quando é usada, com som. A terra seca atrapalha, e insetos aparecem de vez em quando, nunca os dois ao mesmo tempo. XP para o próximo nível: 100 + 50 × (nível − 1). Cada planta dá XP em até 50 colheitas por dia.
- **Plantas apodrecem**: uma planta pronta que fica mais de 24 horas sem colher apodrece (fica marrom, com mosquinhas). Para salvar, use uma **poção** (150 moedas, na Loja › Itens) ou peça ajuda a um amigo: cada amigo pode salvar até 3 plantas suas por dia. A dica em cima da planta pronta mostra quanto tempo falta para apodrecer.
- **Mandioca** (nível 2): demora 8 horas, boa para plantar antes de dormir.
- **Enxada** (100 moedas) para arrancar plantações e árvores.
- **3 fertilizantes**: básico (corta 10% do tempo, 50 moedas), rápido (25%, 200) e premium (50%, 1.000). Dá para usar quantos quiser na mesma planta.
- **Música e sons**: 3 músicas calmas de roça e 1 rock rural ("Rock na Porteira": guitarra com distorção, bateria, baixo e viola em terças) e sons para cliques, regar, enxada, colher e mais. Tudo é sintetizado no navegador (`js/audio.js`), sem arquivos de áudio.
- **Configurações** (engrenagem no topo): liga e desliga música e sons, volume de cada um, escolha da música e tema (automático, dia ou noite). O botão **Verificar atualizações** confere se o site tem uma versão nova; se tiver, salva a roça, limpa o cache e recarrega o jogo já atualizado. Ao publicar uma mudança, aumente o número em `rf-version` e nos `?v=` do `index.html`.
- **Rancho com 8 abrigos**, cada um com o seu cercado: galinheiro (galinha e pato), coelheira, chiqueiro (porca e porquinho), apiário (colmeias), redil (cabra e ovelha), curral (bezerro, vaca e búfala), cocheira (cavalo, potro e burro) e viveiro (pavão e avestruz). O galinheiro já vem pronto. Os outros são construídos na Loja (aba Abrigos) ou clicando na placa no rancho. Cada abrigo tem 3 níveis: cabem 4, 6 e 8 animais. No celular, dá para arrastar o rancho para ver tudo.
- **Animais de produção**: galinha, pato, coelho, cabra, ovelha, vaca, colmeia, porca e búfala. Cada produção custa uma ração em moedas. Sem comida o animal só para de produzir. Cada um vive de 30 a 60 dias e depois vai embora, e é preciso comprar outro. Dá para vender antes, por bem menos que a compra e cada dia mais barato. A porca tem leitões, que viram porquinhos no chiqueiro. A ração especial faz a próxima produção render em dobro. Botões para alimentar e recolher tudo de uma vez.
- **Animais para criar e vender**: porquinho, bezerro, burro, potro e avestruz. Comem uma vez por dia e são vendidos adultos.
- **Companhia**: gato, tartaruga e arara moram dentro de casa; o cavalo mora na cocheira e o pavão no viveiro. Dá para trocar o nome e fazer carinho.
- **Cães de guarda**: Dá para ter 2 cachorros, um para a roça e outro para o rancho, de 3 raças com preço, vida e força diferentes. Com ração (dura 8h) o cachorro fica acordado, espanta quem tenta pegar suas coisas e às vezes morde, ganhando até 10 moedas do ladrão. Ele também dá XP por dia e por ladrão pego.
- **Plantação pronta** aparece com um check verde.
- **Casa com 6 lugares de decoração** (tapete, vaso, quadro, luz, sofá e TV), cada um com 3 modelos: tapete de crochê, azul listrado ou xadrez; vaso de flores, cacto ou girassóis; quadro de paisagem, da vaca ou do pôr do sol; abajur, abajur de franja ou lampião; sofá verde, vermelho ou de couro; rádio, TV de tubo ou TV de tela plana. Compre os que quiser e escolha qual fica em uso (Loja › Casa). O conforto do modelo em uso vale +1% de XP por ponto.
- **Celeiro** para vender colheitas e produtos.
- **Pescaria** 🎣: o pesqueiro fica na frente da casinha do cachorro (dá para mudar de lugar com o Mover; no tema Lago dos patos, o lago grande também serve). Clique nele, lance a linha e, quando a boia afundar e aparecer o **!**, puxe rápido. Aí começa a **briga**: um anel vai fechando em volta do peixe; toque (tela, botão ou espaço) quando ele ficar **verde**. Cada acerto puxa o peixe para perto: comum precisa de 2 puxadas, raro de 3 e lendário de 4. Errar (cedo, tarde ou deixar passar) tira uma puxada, e 3 erros seguidos fazem o peixe escapar. Peixe raro tem anel mais rápido e janela verde menor; o domínio de pesca alarga a janela. Cada lançamento gasta 1 isca, e cada peixe só morde algumas: 🪱 minhoca (5 grátis por dia; 10 por 60 moedas) atrai lambari, tilápia e traíra; 🌽 milho (sai do celeiro) atrai lambari, tilápia e pacu; 🦐 camarão (nível 6; 10 por 180) atrai traíra, tucunaré, pintado e dourado; 🎏 isca artificial (nível 12; 5 por 400) atrai tucunaré, dourado e pirarucu. Os peixes raros também pedem nível (tucunaré 6, pintado 9, dourado 12, pirarucu 18) e escapam mais rápido. O **📖 Livro de peixes** mostra os que já pegou (com figura, raridade e quantos), os que faltam (sombra) e do que cada um precisa. Quando pega um peixe pela primeira vez, aparece o selo **NOVO!** no cartão, ele fica marcado no livro (e o botão do livro mostra quantos novos) e a dica da isca marca com ✨ os que você ainda não pegou. Receitas com peixe na Fábrica: lambari frito, caldo de tilápia, moqueca de tucunaré, pintado assado, dourado na brasa e pirarucu de casaca. Os peixes vão para o celeiro, entram no livro de Coleção e dão pontos no ranking. **Peixes de Goiás**: além dos 8 primeiros, há 15 espécies do cerrado: cará, piau, mandi, curimbatá, cascudo, piranha, corvina, matrinxã, peixe-cachorra, aruanã, barbado, tambaqui, pirarara, jaú e piraíba. Os maiores só mordem nos rios grandes (o livro mostra 📍 onde). **Pontos de pesca**: cada ponto dá 3 pescarias de vara e depois descansa 2 horas (o descanso começa quando você tira a 3ª coisa da água; se o peixe escapar, não conta). O Pesqueiro de casa já vem; os outros liberam por nível e se compram na própria pescaria: Córrego Cascavel (nível 5, 1.500 moedas), Rio Meia Ponte (10, 5.000), Ribeirão João Leite (15, 8.000), Rio dos Bois (20, 14.000), Rio Araguaia (25, 22.000) e Rio Amazonas (30, 35.000). Quanto mais longe, mais peixe raro e menos lixo. **Pesque e Solte** 🔄: ponto grátis que libera no nível 5, sempre aberto e sem gastar isca; cada peixe volta para o rio e dá só 10 moedas e 1 XP (não vai para o celeiro, o livro, as conquistas, as missões nem o domínio; a tarrafa não vale lá). **Tarrafa** 🕸️: pega 3 peixes de uma vez, sem isca e sem lixo, uma vez a cada 12 horas (vale em qualquer ponto seu e não gasta o descanso dele). **Domínio de pesca** 🎖️: cada peixe pego dá pontos (comum 1, incomum 2, raro 4, épico 8, lendário 20; conta os que você já tinha pegado). A cada nível de domínio (até o 10), a espera da vara e da tarrafa cai 5%, até 45%: a vara chega a 66 min e a tarrafa a 6h36.
- **Pedidos da vila** (Missões › Vila): Seu Zé e Dona Maria pedem coisas da sua roça (até 2 pedidos cada, válidos por 24h, novos a cada 2h). Cada entrega dá moedas, XP e amizade: a cada 5 entregas, um coração ❤️ e um presente (300 moedas, 10 iscas, enfeite exclusivo — Carroça de feno do Seu Zé ou Roseira da Dona Maria —, +10% nas recompensas e 2.000 moedas no 5º coração).
- **Ranking semanal** (aba Amigos): você e seus amigos somam pontos na semana — colher (1), recolher dos animais (1), fábrica (2), pescar (2), ajudar amigos (3), presentear (3), caminhão (5), pedidos da vila (8). Termina segunda 0h; na primeira vez que abrir o jogo na semana nova, vem o prêmio: 🥇 1.500, 🥈 800, 🥉 400 moedas (e 100 para quem participou).
- **Chat com amigos**: botão 💬 Conversar em cada amigo (aba Amigos). Mensagens em balões, frases rápidas, número de não lidas na aba Amigos, aviso na tela quando chega mensagem e notificação no celular com o jogo fechado. Só amigos conversam; mensagens com mais de 30 dias são apagadas. *Precisa das regras novas do `firestore.rules`.* Com o jogo minimizado ou em outra aba, a mensagem nova vira notificação na hora; com o jogo fechado, vem pelo servidor de avisos (a cada ~15 min).
- **Online / offline**: a lista de amigos e a conversa mostram 🟢 Online (jogando agora) ou "Visto há X min". O jogo marca presença a cada 5 minutos enquanto está na tela (documento `presenca/{uid}`, só com online e horário).
- **Vizinhos da vila** (Seu Zé e Dona Maria), que não são amigos de verdade, para visitar a qualquer hora.
- Clicar num animal (no rancho, na casa ou na roça de um amigo) mostra um balão com o nome dele e uma frase aleatória ("Muuuu!", "Tô fraco! Tô fraco!", "Posso comer seu chapéu?"…) e toca o barulho do bicho: cacarejo, quá-quá, mé, muu, oinc, relincho, ió-ió, zumbido, miau e outros.
- **Nomes dos bichos**: quem acabou de chegar ganha nome de graça. Para trocar depois o nome de qualquer animal (produção, cria ou companhia) ou de um cachorro, toque em **Nome** no abrigo, na Loja › Animais ou na Loja › Cães: custa **50 moedas**. Para vender, clique na casa (abrigo) do bicho: cada um da lista tem o botão **Vender** (clique duas vezes para confirmar). Também dá para trocar o nome do cachorro clicando na casinha dele e o do gato clicando na caminha dele, na sala.
- **Galinha-d'angola** (nível 3, no Galinheiro): 700 moedas, bota **ovo de angola** a cada 5 horas.
- Clicar no cachorro mostra um balão com o nome dele e uma frase sorteada ("Au au! 🐶", "Cadê meu osso? 🦴", "Aqui ninguém pega nada!"…; se estiver dormindo, "Zzz…") e ele late. Clicar no avatar mostra o nome dele e uma frase sorteada ("Cê tá bão?", "Ô trem bão!", "Bora trabaiá!"…).
- **Boas-vindas e tutorial**: quem começa agora escolhe o nome da fazenda e do avatar e monta o avatar logo na chegada; depois o jogo pergunta se quer um tutorial rápido (10 passos, destacando cada botão). Dá para rever o tutorial em ⚙️ › Ajuda.
- **Nomes** (⚙️ › Nomes): dê um nome para a sua fazenda e para o seu avatar. Quem visitar vê "[fazenda] de [avatar]" no aviso do topo, na barra de informações e na viagem de carroça. Os vizinhos da vila também têm fazenda: Sítio Boa Vista de Seu Zé e Chácara das Flores de Dona Maria. Dar o primeiro nome é grátis; trocar um nome depois custa **100 moedas** (cada um), e a troca só vale ao tocar em Salvar. Na roça dos outros, o avatar do dono também passeia (Seu Zé e Dona Maria têm o deles) e fala quando você clica nele.
- **Avatar** (na engrenagem de Configurações): escolha menino ou menina (a menina tem corpo, rosto e guarda-roupa próprios: blusa de babado, florida ou regatinha; saia rodada, jardineira ou calça jeans clara; sapatilha, botinha ou sandália), a cor da pele, o cabelo (curto, cacheado, comprido ou rabo de cavalo) e a cor dele, chapéu (sem, de palha, boné ou de cowboy), camisa (camiseta, xadrez, regata), calça (jeans, bermuda, macacão), sapato (bota, tênis, chinelo) e o que leva na mão (nada, vara de pesca, espingarda de cano duplo ou enxada; e, conforme sobe de nível, facão no 5, foice no 10, laço no 15, viola no 20 e machado no 25). Ele passeia pela sua roça e pelo rancho e vai junto nas visitas.
- Ir ou voltar da roça de alguém mostra uma tela de carregamento de 3 segundos com o seu avatar indo de carroça até a roça do vizinho (e fazendo o caminho inverso na volta). Na roça de outra pessoa só aparecem os botões que servem lá (Amigos e Negócios, e as ferramentas de ajudar).
- Clicar numa terra arada vazia com a Mão abre a Loja para escolher a semente; só planta quando há uma semente na mão.
- **Caixa de correio** no menu: as novidades da sua roça (visitas dos amigos, presentes, o que o cachorro fez e recados da vila) e as **novidades do jogo**: cada atualização interessante chega como uma carta 📰 (lista `NOVIDADES` no `js/game.js`; ao lançar algo novo, acrescente uma linha com o número da versão).
- **Login com Google, salvamento na nuvem e amigos de verdade** (precisa do Firebase, veja abaixo).
  - Cada jogador ganha um **código de amigo** de 6 letras. Digitar o código de alguém manda um **pedido de amizade**, que a pessoa pode **aceitar ou recusar** na aba Amigos. Dá para cancelar um pedido enviado e excluir um amigo.
  - Só amigos veem e visitam a sua roça. Quem recebe um pedido pode espiar a roça de quem pediu antes de aceitar.
  - Na roça de um amigo você pode tirar pragas, regar, alimentar os animais ou pegar um pouquinho: até 3 itens da plantação e 3 dos animais por roça, em no máximo 5 roças por dia (se o cachorro deixar!). Os limites voltam à meia-noite. O dono recebe um aviso na caixa de correio. O nível da roça de cada amigo aparece na lista e durante a visita. Se não der para ler a roça de um amigo (sem internet, login ainda carregando), ele continua na lista com o aviso "Não deu para ver a roça agora". Amigo só sai da lista quando você toca em Excluir. A lista oficial de amigos fica guardada à parte na nuvem (`farms/{você}/amigos`), fora do save: ela só muda quando alguém vira amigo ou toca em Excluir, e é dela que a lista volta se o save se perder. *Precisa das regras novas do `firestore.rules`.* Ao entrar, o jogo também devolve para a lista quem sumiu por engano e ainda tem você como amigo. Se o jogo de um amigo tiver perdido você (erro antigo), o presente ou a visita é recusado e o jogo manda sozinho um pedido de **reatar a amizade**; também há um botão **Reatar** na lista. O amigo aceita com um toque e tudo volta.

- **Um aparelho por vez**: entrar no celular tira o computador (e vice-versa), com um aviso. A roça continua de onde parou em qualquer aparelho. O jogo salva na nuvem no máximo a cada 30 segundos (para caber no plano gratuito do Firebase) e sempre que você sai ou troca de página, e o botão de disquete no topo salva na hora. Para poupar o limite grátis do Firebase, o jogo não fica ouvindo a roça na nuvem: descobre que outro aparelho entrou na hora de salvar (a gravação confere) ou quando volta para a tela. Os pontos do ranking sobem no máximo a cada 5 minutos (e ao sair).

Sem o Firebase configurado, o jogo funciona do mesmo jeito, mas salva só no navegador e não tem amigos de verdade.

- **Missões** (5 por dia, com pescar, peixe raro, cozinhar peixe, vila, visitas e mais): 3 diárias (trocam à meia-noite) e 3 semanais (trocam na segunda-feira à meia-noite), com prêmio em moedas e XP.
- **Presente diário**: 7 dias de presentes (o 7º é um baú). Depois vem uma leva nova.
- **Presente para os amigos**: na aba Amigos, o botão Presentear abre uma janelinha para escolher o presente (100 moedas, fertilizante, ração especial ou ração de cachorro). Um por dia para cada amigo, até 5 amigos. Não custa nada para quem manda. *Precisa das regras novas do `firestore.rules` publicadas no Firebase.*
- **Avisos nos botões**: Roça e Rancho mostram um número verde quando tem coisa pronta para colher, recolher ou vender.
- **Negócios** (no menu, com a Fábrica, a Banca e o Caminhão). **Fábrica**: 12 receitas (farinha de trigo, farinha de mandioca, pipoca, pão, molho de tomate, bolo de cenoura, geleia de morango, novelo de lã, manteiga, queijo, suco de uva e suco de laranja). Começa com 3 espaços que produzem ao mesmo tempo, e ganha mais 1 a cada 10 níveis (até 8). O produto vale mais que os ingredientes.
- **Banca**: clique num lugar livre para abrir uma janelinha com as figuras dos itens do celeiro (e quanto você tem de cada), escolher a quantidade (até 10 por lugar) e o preço com os botões − e +. O preço vai de metade até o dobro do valor no celeiro; o máximo evita preços abusivos. No máximo, o + volta para o mínimo (e o − no mínimo vai para o máximo). São 6 lugares. Os amigos compram quando visitam a sua roça (a banca deles aparece em Negócios durante a visita), e os vizinhos da vila compram de vez em quando se o preço for justo. Tirar da banca avisa que o item e o dinheiro não voltam. *Comprar da banca de um amigo precisa das regras novas do `firestore.rules`.*
- **Caminhão**: 5 pedidos novos a cada 4 horas, com colheitas, produtos dos animais e da fábrica. Paga bem mais que o celeiro. Ao entregar, uma animação de 3 segundos mostra o seu avatar levando a caixa do celeiro até o caminhão e o caminhão indo embora.
- **Celeiro** mostra no botão quantos itens estão guardados.
- **Enfeites** (Loja › Enfeites): canteiro de flores, banco, espantalho, carrinho de mão, poço, fonte e cata-vento. Vão para o **Inventário** (no menu), de onde você escolhe onde pôr, na roça ou no rancho, fora dos canteiros e cercados. Cada um dá conforto (+XP). Também dá para guardar de volta, e vender o que está guardado pela metade do preço (itens de eventos não se vendem). Os móveis da casa também podem ser vendidos pela metade, em Loja › Casa. Os itens de evento mostram o mês e o ano em que foram ganhos (no mouse e no inventário).
- **Mover no celular**: segure o dedo num item (ou use o botão Mover), arraste o item com o dedo até o lugar novo e toque em **Salvar aqui** (fica cinza se o lugar não serve). No computador, o item segue o mouse e um clique solta. Com qualquer ferramenta dá para arrastar a tela para os lados.
- Os botões da tela se ajustam ao tamanho da janela para nunca ficarem um por cima do outro.
- O jogo procura versão nova sozinho toda vez que é aberto e, se tiver, atualiza.
- No Celeiro e no Inventário há um liga/desliga para o número vermelho (aviso de itens) no botão de cada um.
- **Notificações** (⚙️ › Notificações): avisos com o jogo fechado — colheita pronta, plantas quase estragando, animais, fábrica, caminhão e amigos. Cada tipo liga e desliga. Precisa configurar uma vez: veja [`NOTIFICACOES.md`](NOTIFICACOES.md).
- **Progresso protegido**: cada salvamento na nuvem tem um número de versão. Um aparelho só grava se a roça dele foi feita em cima da versão atual da nuvem; se não, carrega a da nuvem em vez de gravar por cima (e guarda a dele como cópia). Nunca grava uma roça de nível menor que o da nuvem, e se a nuvem não carregar ao entrar, não grava nada nela. Se um aparelho tiver uma roça de nível maior que a da nuvem, o jogo pergunta qual usar.
- **Cópias de segurança** (⚙️ › Cópias de segurança): uma cópia por dia na nuvem (as últimas 14) e a última cópia deste aparelho, com botão de restaurar.
- **Modo Mover** (botão à esquerda): clique na casa, no celeiro, na casinha do cachorro, numa árvore ou num enfeite e depois no lugar novo. Uma sombra verde mostra onde pode e vermelha onde não pode. Esc cancela.
- **Celeiro na roça**: clicar nele abre o Celeiro.
- **No celular, segurar o dedo** (no computador, **botão direito**) em cima de uma casa, árvore ou enfeite abre um menu com **Mover** e, nos enfeites, **Guardar no inventário**.
- **Cercados do rancho**: clicar em qualquer parte do cercado abre o abrigo (os bichos lá dentro continuam clicáveis).
- **Presente dos pioneiros**: quem jogar até 31/10/2026 ganha a Bandeira dos Pioneiros e um Bolo de boas-vindas (chegam no Inventário, com aviso no correio) e o celeiro e a casa azuis com detalhes dourados (dá para trocar em Loja › Temas).
- **A casa aparece na roça**, atrás dos canteiros. Clicar nela entra na casa.
- **Abrigos**: clicar num abrigo no rancho mostra quem mora lá, o botão de aumentar e os bichos que dá para comprar para ele.
- **Nome dos animais**: ao comprar, abre uma janelinha para dar o nome (com uma sugestão). Dá para trocar depois na janela do abrigo.
- **Ajuda de volta**: quem ajudou a sua roça (um amigo ou um vizinho da vila) fica marcado por 2 dias. Ajudar de volta dá 50 moedas.
- **Livro de coleção**: cada planta e produto dos animais ganha carimbos de bronze (10 colheitas), prata (50), ouro (200) e diamante (500), com prêmios. Cada carimbo também deixa aquele item mais rápido: 5% (bronze), 10% (prata), 15% (ouro) e 20% (diamante) menos tempo para ficar pronto.
- **Temas da roça**: clássico, cerca branca com roseiras, muro de pedra, tropical com coqueiros e lago dos patos.
- **Estações do ano**: mudam toda segunda-feira. Primavera: muitas flores, árvores floridas e o dobro de borboletas. Verão: árvores com frutas. Outono: árvores peladas, folhas no chão e caindo. Inverno: chão coberto de neve, árvores e telhado com neve e neve fininha caindo. 5 plantas da estação rendem 30% a mais.
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

### Aplicativo (Android, celular e tablet)

O jogo é um app instalável (PWA): tem ícone, abre em tela cheia e funciona sem internet (salvando no aparelho).
No Chrome do celular, use **Instalar app**. Para gerar o app de Android (APK para instalar direto ou AAB para
a Play Store), siga o passo a passo em [`android/COMO-GERAR-O-APP.md`](android/COMO-GERAR-O-APP.md).
O endereço do jogo é https://jvitorarantes.github.io/roca-feliz/.

## Como os dados ficam guardados

- `farms/{uid}`: a roça de cada jogador (o estado do jogo em JSON, mais nome, foto, nível, código e as listas `friends` e `sent`). Podem ler o dono, os amigos e quem recebeu um pedido de amizade dele. Só o dono escreve.
- `farms/{uid}/requests/{quemPediu}`: pedidos de amizade recebidos. Aceitar coloca a pessoa em `friends`; recusar apaga o pedido.
- `farms/{uid}/visits/{id}`: o que os amigos fizeram na sua roça. Só amigos criam, sempre em seu próprio nome. O dono aplica e apaga.
- `codes/{código}`: liga o código de amigo ao jogador.

Ao entrar com o Google pela primeira vez, a roça que já estava no navegador vai para a sua conta.

Toda a lógica do jogo roda no navegador, então quem entende de programação consegue trapacear na própria roça. Para um jogo entre amigos isso não é problema. Se um dia virar algo maior, dá para mover as regras importantes (moedas, colheita) para Cloud Functions.
