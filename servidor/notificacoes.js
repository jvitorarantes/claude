// Programinha de notificações da Roça Feliz.
// Roda no GitHub Actions a cada 15 minutos (.github/workflows/notificacoes.yml):
//  1) agenda: cada jogador guarda em push/{uid} o que vai ficar pronto (colheita, animais, fábrica,
//     caminhão). Manda um aviso com o que venceu desde a última vez.
//  2) avisos: visitas, presentes e pedidos de amizade que os amigos deixaram em avisos/{id}.
// Precisa do segredo FIREBASE_SERVICE_ACCOUNT (a chave JSON da conta de serviço do Firebase).
const admin = require('firebase-admin');

const SITE = process.env.SITE_URL || 'https://jvitorarantes.github.io/roca-feliz/';
const conta = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!conta) { console.log('Sem FIREBASE_SERVICE_ACCOUNT: nada a fazer.'); process.exit(0); }
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(conta)) });
const db = admin.firestore();
const TOKEN_MORTO = ['messaging/registration-token-not-registered', 'messaging/invalid-registration-token', 'messaging/invalid-argument'];

async function enviar(uid, tokens, title, body, tag) {
  if (!tokens || !tokens.length) return 0;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    data: { title, body, tag, link: SITE },
    webpush: { headers: { Urgency: 'high', TTL: String(6 * 3600) }, fcmOptions: { link: SITE } },
  });
  res.responses.forEach((r, i) => { if (!r.success) console.log(`  falhou para ${uid.slice(0, 6)}… aparelho ${i + 1}: ${r.error && r.error.code}`); });
  // aparelhos que desinstalaram o app ou tiraram a permissão: sai da lista
  const mortos = res.responses.map((r, i) => (!r.success && r.error && TOKEN_MORTO.includes(r.error.code) ? tokens[i] : null)).filter(Boolean);
  if (mortos.length) await db.collection('push').doc(uid).update({ tokens: admin.firestore.FieldValue.arrayRemove(...mortos) });
  return res.successCount;
}

const TITULO = { colheita: '🌽 Roça Feliz', animais: '🐔 Roça Feliz', fabrica: '🏭 Roça Feliz', caminhao: '🚚 Roça Feliz' };

async function agendas(agora) {
  const snap = await db.collection('push').where('proximo', '<=', agora).get();
  console.log(`Agendas vencidas: ${snap.size}`);
  let n = 0;
  for (const doc of snap.docs) {
    const p = doc.data(), prefs = p.prefs || {}, desde = p.enviadoAte || 0;
    const agenda = Array.isArray(p.agenda) ? p.agenda : [];
    const venceu = agenda.filter(x => x.t > desde && x.t <= agora && prefs[x.tipo] !== false);
    const resto = agenda.filter(x => x.t > agora);
    if (venceu.length && p.tokens && p.tokens.length) {
      const x = venceu[venceu.length - 1];
      const body = venceu.length > 1 ? `${x.txt} (e mais ${venceu.length - 1} novidade${venceu.length > 2 ? 's' : ''})` : x.txt;
      n += await enviar(doc.id, p.tokens, TITULO[x.tipo] || 'Roça Feliz', body, 'agenda');
    }
    await doc.ref.update({ enviadoAte: agora, proximo: resto.length ? resto[0].t : 9e15 });
  }
  return n;
}

async function avisos() {
  const snap = await db.collection('avisos').limit(500).get();
  console.log(`Avisos de amigos/testes na fila: ${snap.size}`);
  const porPessoa = {};
  for (const d of snap.docs) { const a = d.data(); (porPessoa[a.para] = porPessoa[a.para] || []).push(a); }
  let n = 0;
  for (let [uid, lista] of Object.entries(porPessoa)) {
    const p = (await db.collection('push').doc(uid).get()).data();
    if (!p || !p.tokens || !p.tokens.length) { console.log(`  ${uid.slice(0, 6)}… não tem aparelho com avisos ligados`); continue; }
    const testes = lista.filter(a => a.tipo === 'teste');
    if (testes.length) n += await enviar(uid, p.tokens, '🧪 Roça Feliz', testes[testes.length - 1].txt, 'teste');
    if (p.prefs && p.prefs.amigos === false) continue;
    lista = lista.filter(a => a.tipo !== 'teste'); if (!lista.length) continue;
    lista.sort((a, b) => (a.at || 0) - (b.at || 0));
    // pedido de ajuda (frutífera seca de um amigo) vem na frente das outras novidades
    const x = [...lista].reverse().find(a => a.tipo === 'ajuda') || lista[lista.length - 1];
    const body = lista.length > 1 ? `${x.txt} (e mais ${lista.length - 1} novidade${lista.length > 2 ? 's' : ''} dos amigos)` : x.txt;
    n += await enviar(uid, p.tokens, x.tipo === 'ajuda' ? '🆘 Roça Feliz' : '👋 Roça Feliz', body, 'amigos');
  }
  // entregues (ou sem aparelho para entregar): apaga
  const lote = db.batch(); snap.docs.forEach(d => lote.delete(d.ref)); if (snap.size) await lote.commit();
  return n;
}

(async () => {
  const agora = Date.now();
  const a = await agendas(agora), b = await avisos();
  console.log(`Notificações enviadas: ${a} da agenda, ${b} de amigos.`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
