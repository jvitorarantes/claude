// Nuvem da Roça Feliz: login com Google e dados no Firebase (Firestore).
// Só liga quando firebase-config.js tem uma configuração. Sem ela, o jogo fica offline.
(() => {
  'use strict';
  const cfg = window.FIREBASE_CONFIG;
  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const available = !!(cfg && cfg.apiKey && cfg.projectId);
  let auth = null, db = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = () => reject(new Error('Não carregou ' + src));
      document.head.appendChild(s);
    });
  }

  async function init(onUser) {
    if (!available) return false;
    await loadScript(SDK + 'firebase-app-compat.js');
    await loadScript(SDK + 'firebase-auth-compat.js');
    await loadScript(SDK + 'firebase-firestore-compat.js');
    firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.onAuthStateChanged(u => onUser(u ? { uid: u.uid, name: u.displayName || '', photo: u.photoURL || '' } : null));
    return true;
  }

  async function signIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await auth.signInWithPopup(provider);
    } catch (e) {
      // Alguns celulares bloqueiam popup: cai para o redirecionamento.
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
        await auth.signInWithRedirect(provider);
      } else throw e;
    }
  }
  const signOut = () => auth.signOut();

  const farm = uid => db.collection('farms').doc(uid);

  async function loadFarm(uid) {
    const d = await farm(uid).get();
    return d.exists ? d.data() : null;
  }
  const saveFarm = (uid, data) => farm(uid).set(data);

  // Código de amigo: 6 letras/números, fácil de ditar (sem 0/O, 1/I/L).
  const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  async function claimCode(uid) {
    for (let tries = 0; tries < 8; tries++) {
      let code = '';
      for (let i = 0; i < 6; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      const ref = db.collection('codes').doc(code);
      const d = await ref.get();
      if (!d.exists) { await ref.set({ uid }); return code; }
    }
    throw new Error('Não consegui gerar um código de amigo');
  }
  function normalizeCode(code) { return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }
  async function findCode(code) {
    code = normalizeCode(code);
    if (code.length !== 6) return null;
    const d = await db.collection('codes').doc(code).get();
    return d.exists ? d.data().uid : null;
  }

  // Visitas: o que um amigo fez na sua roça (ajudou, alimentou, pegou colheita).
  // O dono aplica e apaga quando abre o jogo.
  const sendVisit = (toUid, visit) => farm(toUid).collection('visits').add(visit);
  function watchVisits(uid, cb) {
    return farm(uid).collection('visits').onSnapshot(qs => {
      const list = qs.docs.map(d => ({ id: d.id, data: d.data() }));
      if (list.length) cb(list);
    }, e => console.warn('visitas:', e));
  }
  const deleteVisit = (uid, id) => farm(uid).collection('visits').doc(id).delete();

  // Pedidos de amizade: farms/{destino}/requests/{quemPediu}.
  const requestRef = (toUid, fromUid) => farm(toUid).collection('requests').doc(fromUid);
  const sendRequest = (toUid, data) => requestRef(toUid, data.from).set(data);
  const deleteRequest = (toUid, fromUid) => requestRef(toUid, fromUid).delete();
  async function requestExists(toUid, fromUid) { return (await requestRef(toUid, fromUid).get()).exists; }
  function watchRequests(uid, cb) {
    return farm(uid).collection('requests').onSnapshot(qs => {
      cb(qs.docs.map(d => ({ id: d.id, data: d.data() })));
    }, e => console.warn('pedidos:', e));
  }

  window.RFCloud = {
    available, init, signIn, signOut, loadFarm, saveFarm, claimCode, findCode, normalizeCode,
    sendVisit, watchVisits, deleteVisit, sendRequest, deleteRequest, requestExists, watchRequests,
  };
})();
