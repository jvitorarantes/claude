# Roça Feliz no Android (celular e tablet)

O app é um **TWA** (Trusted Web Activity): um app de verdade que abre o jogo do site em tela cheia,
sem a barra do navegador. Como ele carrega o site, **toda atualização do jogo chega sozinha**: o jogo
confere se há versão nova sempre que é aberto. Não precisa mandar versão nova para a loja a cada mudança.

Endereço do jogo: **https://jvitorarantes.github.io/roca-feliz/**

## 1. Conferir o site

1. No GitHub, no repositório **roca-feliz**: **Settings › Pages**. Em *Build and deployment*, escolha
   **Deploy from a branch** e a branch que tem esta versão do jogo, pasta `/ (root)`.
2. Abra o endereço no celular. O Chrome deve oferecer **Instalar app** (ou em ⋮ › *Adicionar à tela inicial*).
   Isso já funciona como app, e é bom para testar antes.

## 2. Gerar o app no PWABuilder

1. Entre em **https://www.pwabuilder.com**, cole `https://jvitorarantes.github.io/roca-feliz/` e clique em **Start**.
2. Clique em **Package for stores** › **Android** › **Generate Package** (ou *Options*, para conferir):
   - **Package ID**: `io.github.jvitorarantes.rocafeliz`
   - **App name**: `Roça Feliz` · **Launcher name**: `Roça Feliz`
   - **Display mode**: `Fullscreen` · **Orientation**: `Default` (gira no celular e no tablet)
   - **Signing key**: `Create new` (preencha seu nome e uma senha e **guarde a senha**)
3. Baixe o `.zip`. Dentro dele:
   - `*.apk`: para instalar direto no celular ou tablet (testes e amigos);
   - `*.aab`: para mandar para a Play Store;
   - `signing.keystore` e `signing-key-info.txt`: **guarde num lugar seguro**. Sem eles você não consegue
     publicar atualizações do app na loja;
   - `assetlinks.json`: usado no passo 3.

## 3. Tirar a barra de endereço (assetlinks)

O Android só abre o app em tela cheia, sem a barrinha com o endereço, se o site provar que o app é dele.
Esse arquivo precisa ficar na **raiz** do domínio (`https://jvitorarantes.github.io/.well-known/assetlinks.json`),
não dentro de `/roca-feliz/`. Para isso:

1. Crie um repositório novo chamado exatamente **`jvitorarantes.github.io`** (público).
2. Coloque nele:
   - a pasta `.well-known` com o `assetlinks.json` que veio no zip (tem um modelo em `android/assetlinks.exemplo.json`);
   - um arquivo vazio chamado `.nojekyll` (sem ele o GitHub esconde pastas que começam com ponto).
3. Em **Settings › Pages** desse repositório, publique a branch `main`, pasta `/ (root)`.
4. Confira se abre: https://jvitorarantes.github.io/.well-known/assetlinks.json

## 4. Instalar no celular ou tablet

1. Mande o `.apk` para o aparelho (WhatsApp, Drive, cabo…) e toque nele.
2. O Android pede para permitir **instalar apps desta fonte**: permita.
3. O Chrome precisa estar instalado e atualizado (o app usa o Chrome por dentro, e é por isso que o
   login do Google e o salvamento na nuvem funcionam igual ao site).

## 5. Publicar na Play Store (opcional)

1. Crie a conta de desenvolvedor em https://play.google.com/console (taxa única de US$ 25).
2. **Criar app** › mande o arquivo `.aab`, preencha descrição, ícone (use `icons/icon-512.png`), capturas de tela
   (celular e tablet) e a classificação de conteúdo.
3. A Play Store assina o app com uma chave dela (*Play App Signing*). Copie a **impressão digital SHA-256**
   dessa chave (em *Configuração › Integridade do app*) e **acrescente** na lista `sha256_cert_fingerprints`
   do `assetlinks.json` (fica com duas: a do PWABuilder e a da Play Store).
