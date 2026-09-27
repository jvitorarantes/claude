# Ligar as notificações da Roça Feliz

Os avisos chegam no celular, no tablet (app) e no computador **mesmo com o jogo fechado**:
colheita pronta, plantas quase estragando, produtos dos animais, fábrica, caminhão e amigos
(visitas, presentes e pedidos de amizade). Tudo grátis: o GitHub roda um programinha a cada
15 minutos (`servidor/notificacoes.js`) que manda os avisos pelo Firebase Cloud Messaging.

São 3 passos, uma vez só.

## 1. Chave pública das notificações (vai no jogo)

1. Firebase Console › ⚙️ **Configurações do projeto** › aba **Cloud Messaging**.
2. Em **Configuração da Web** › **Certificados push da Web**, clique em **Gerar par de chaves**.
3. Copie a chave que aparece (começa com `B…`, bem comprida) e mande para o Claude, ou cole em
   `firebase-config.js`, na linha `window.FIREBASE_VAPID_KEY = "";`. Essa chave é pública, pode mandar.

## 2. Chave da conta de serviço (vai só no GitHub, nunca para ninguém)

1. Firebase Console › ⚙️ **Configurações do projeto** › aba **Contas de serviço**.
2. Clique em **Gerar nova chave privada** › **Gerar chave**. Baixa um arquivo `.json`.
3. No GitHub, no repositório **roca-feliz**: **Settings** › **Secrets and variables** › **Actions** ›
   **New repository secret**.
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Secret**: abra o `.json` num bloco de notas, copie **tudo** e cole aqui.
4. **Add secret**. Depois apague o arquivo `.json` do computador (ele dá acesso total ao Firebase).

## 3. Regras novas do Firestore

Firebase Console › **Firestore Database** › **Regras**: apague tudo, cole o conteúdo de
`firestore.rules` e clique em **Publicar**.

## Testar

1. No GitHub: aba **Actions** › **Notificações da Roça Feliz** › **Run workflow**. Deve terminar com ✅.
   (Se a aba Actions pedir, clique em "I understand my workflows, go ahead and enable them".)
2. No jogo: ⚙️ Configurações › **Notificações** › **Ativar avisos** e permita quando o aparelho perguntar.
3. Plante algo rápido, feche o jogo e espere: o aviso chega em até uns 15–20 minutos depois de ficar pronto.
