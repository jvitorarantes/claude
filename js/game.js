(() => {
'use strict';

// ============================================================
// Dados do jogo
// ============================================================
const COLS = 8, ROWS = 5, N = COLS * ROWS, START_PLOTS = 6;
const PEN_C = 6, PEN_R = 4, ROOM = 5, MAX_ANIMALS = 12;
const SAVE_KEY = 'roca-feliz-v2', OLD_SAVE_KEY = 'roca-feliz-v1';
const Cloud = window.RFCloud || { available: false };

const CROPS = [
  { id: 'nabo',      nome: 'Nabo',      custo: 2,  tempo: 40,   rend: 6,  preco: 1,  xp: 2,  nivel: 1, safras: 1, tipo: 'raiz', cor: '#f5eef7', cor2: '#a45bbb' },
  { id: 'cenoura',   nome: 'Cenoura',   custo: 4,  tempo: 90,   rend: 6,  preco: 2,  xp: 4,  nivel: 1, safras: 1, tipo: 'raiz', cor: '#f08a24', cor2: '#e0761a' },
  { id: 'milho',     nome: 'Milho',     custo: 8,  tempo: 180,  rend: 5,  preco: 4,  xp: 7,  nivel: 2, safras: 1, tipo: 'alto', cor: '#f7d046' },
  { id: 'tomate',    nome: 'Tomate',    custo: 12, tempo: 300,  rend: 8,  preco: 3,  xp: 10, nivel: 3, safras: 2, tipo: 'moita', cor: '#e53b2f' },
  { id: 'berinjela', nome: 'Berinjela', custo: 15, tempo: 420,  rend: 7,  preco: 5,  xp: 13, nivel: 4, safras: 1, tipo: 'pendente', cor: '#6b2e7a' },
  { id: 'morango',   nome: 'Morango',   custo: 22, tempo: 600,  rend: 10, preco: 5,  xp: 18, nivel: 5, safras: 2, tipo: 'moita', cor: '#e0224a', pequeno: true },
  { id: 'abobora',   nome: 'Abóbora',   custo: 30, tempo: 900,  rend: 4,  preco: 18, xp: 26, nivel: 6, safras: 1, tipo: 'chao', cor: '#f28c1b', cor2: '#c9650a' },
  { id: 'melancia',  nome: 'Melancia',  custo: 45, tempo: 1500, rend: 3,  preco: 36, xp: 40, nivel: 8, safras: 1, tipo: 'chao', cor: '#4d9a3e', cor2: '#2a5e27' },
];
const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));

const PRODUCTS = [
  { id: 'ovo',   nome: 'Ovo',   preco: 6 },
  { id: 'leite', nome: 'Leite', preco: 18 },
  { id: 'la',    nome: 'Lã',    preco: 26 },
  { id: 'trufa', nome: 'Trufa', preco: 48 },
];
const PRODUCT = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

const ANIMALS = [
  { id: 'galinha', nome: 'Galinha', custo: 60,  nivel: 1, tempo: 120, prod: 'ovo',   racao: 2,  xp: 3 },
  { id: 'vaca',    nome: 'Vaca',    custo: 220, nivel: 3, tempo: 300, prod: 'leite', racao: 6,  xp: 8 },
  { id: 'ovelha',  nome: 'Ovelha',  custo: 300, nivel: 4, tempo: 420, prod: 'la',    racao: 7,  xp: 11 },
  { id: 'porco',   nome: 'Porco',   custo: 450, nivel: 6, tempo: 600, prod: 'trufa', racao: 10, xp: 18 },
];
const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));

const DECOR = [
  { id: 'tapete', nome: 'Tapete de crochê', custo: 60,  nivel: 1, conforto: 3 },
  { id: 'vaso',   nome: 'Vaso de planta',   custo: 80,  nivel: 1, conforto: 3 },
  { id: 'quadro', nome: 'Quadro',           custo: 120, nivel: 2, conforto: 4 },
  { id: 'abajur', nome: 'Abajur',           custo: 150, nivel: 3, conforto: 4 },
  { id: 'sofa',   nome: 'Sofá',             custo: 200, nivel: 3, conforto: 6 },
  { id: 'tv',     nome: 'Televisão',        custo: 350, nivel: 5, conforto: 8 },
];
const DECO = Object.fromEntries(DECOR.map(d => [d.id, d]));
// Onde cada decoração fica na sala: [coluna, linha, altura] do centro.
const DECOR_SPOT = {
  tapete: [2.6, 2.65, 0], vaso: [4.4, 4.3, 0.35], quadro: [3.7, 0, 0.92],
  abajur: [0.6, 0.6, 0.6], sofa: [0.55, 1.95, 0.35], tv: [3.65, 0.38, 0.45],
};

const item = id => CROP[id] || PRODUCT[id];
const STAGE_NAMES = ['Semente', 'Broto', 'Crescendo', 'Quase lá', 'Maduro'];

const NEIGHBORS = [
  { id: 'cida',  nome: 'Tia Cida',   cao: 'Totó',   casa: '#5a8fc7', pega: 0.10 },
  { id: 'juca',  nome: 'Seu Juca',   cao: 'Rex',    casa: '#d9a441', pega: 0.18 },
  { id: 'neide', nome: 'Dona Neide', cao: 'Pipoca', casa: '#c7658f', pega: 0.06 },
];

// Ordem em que os lotes são liberados: do centro para as bordas.
function orderFor(cols, rows) {
  const d = i => { const c = i % cols, r = Math.floor(i / cols); return (c + .5 - cols / 2) ** 2 + ((r + .5 - rows / 2) * 1.4) ** 2; };
  return [...Array(cols * rows).keys()].sort((a, b) => d(a) - d(b) || a - b);
}
const ORDER = orderFor(COLS, ROWS);

const need = l => 30 + (l - 1) * 40 + (l - 1) * (l - 1) * 12;
const lotCost = owned => Math.round(40 * Math.pow(owned - START_PLOTS + 1, 1.5) / 10) * 10;
const lotLevel = owned => 2 + Math.floor((owned - START_PLOTS) / 3);
const newId = () => Math.random().toString(36).slice(2, 10);

function emptyPlot(s = 'locked') { return { s, c: null, g: 0, dry: false, w: 0, b: 0, sl: 0, dmg: 0, id: null, th: [] }; }
function newAnimal(k) { return { id: newId(), k, fed: true, g: 0, ready: false, n: 0 }; }

function newState() {
  const plots = Array.from({ length: N }, () => emptyPlot());
  ORDER.slice(0, START_PLOTS).forEach(i => plots[i].s = 'plowed');
  return {
    v: 2, coins: 60, xp: 0, level: 1, plots, barn: {}, owned: START_PLOTS,
    tool: 'hand', seed: 'nabo', t: Date.now(), nb: {},
    animals: [newAnimal('galinha'), newAnimal('galinha')], decor: {},
    friends: [], sent: {}, code: null, owner: null, log: {},
    stats: { colheitas: 0, coletas: 0, vendido: 0, roubado: 0, ajudas: 0 },
  };
}

// Aceita saves antigos (v1, grade 6×4) e dados vindos da nuvem.
function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.v === 1 && Array.isArray(s.plots)) {
    const oldOrder = orderFor(6, 4);
    const plots = Array.from({ length: N }, () => emptyPlot());
    oldOrder.forEach((oi, k) => { if (s.plots[oi]) plots[ORDER[k]] = Object.assign(emptyPlot(), s.plots[oi]); });
    s.plots = plots; s.v = 2; s.nb = {};
  }
  if (s.v !== 2 || !Array.isArray(s.plots) || s.plots.length !== N) return null;
  s.animals = Array.isArray(s.animals) ? s.animals.filter(a => a && ANIMAL[a.k]) : [];
  for (const a of s.animals) { if (!a.id) a.id = newId(); a.n = a.n || 0; }
  s.decor = s.decor && typeof s.decor === 'object' ? s.decor : {};
  s.friends = Array.isArray(s.friends) ? s.friends.filter(f => typeof f === 'string') : [];
  s.sent = s.sent && typeof s.sent === 'object' && !Array.isArray(s.sent) ? s.sent : {};
  s.log = s.log && typeof s.log === 'object' ? s.log : {};
  s.nb = s.nb && typeof s.nb === 'object' ? s.nb : {};
  s.barn = s.barn && typeof s.barn === 'object' ? s.barn : {};
  s.stats = Object.assign({ colheitas: 0, coletas: 0, vendido: 0, roubado: 0, ajudas: 0 }, s.stats);
  for (const p of s.plots) {
    if (!Array.isArray(p.th)) p.th = [];
    if (p.s === 'growing' && !CROP[p.c]) Object.assign(p, emptyPlot('plowed'));
    if (p.s === 'growing' && !p.id) p.id = newId();
  }
  s.owned = s.plots.filter(p => p.s !== 'locked').length;
  if (!CROP[s.seed]) s.seed = 'nabo';
  if (!s.tool) s.tool = 'hand';
  return s;
}

// O tempo passou enquanto a roça estava fechada.
function catchUp(s, sec) {
  sec = Math.max(0, sec || 0);
  for (const p of s.plots) {
    if (p.s !== 'growing') continue;
    const crop = CROP[p.c];
    if (p.g < crop.tempo) {
      p.g = Math.min(crop.tempo, p.g + sec * (p.dry ? 0.5 : 1));
      p.dmg = Math.min(crop.rend * 0.5, p.dmg + sec / 60 * (p.w + p.b + (p.dry ? 0.5 : 0)));
    }
  }
  for (const a of s.animals) {
    const def = ANIMAL[a.k];
    if (a.fed && !a.ready) { a.g += sec; if (a.g >= def.tempo) { a.g = def.tempo; a.ready = true; a.fed = false; } }
  }
}

function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY) || localStorage.getItem(OLD_SAVE_KEY);
    if (!raw) return null;
    const s = migrate(JSON.parse(raw));
    if (!s) return null;
    catchUp(s, (Date.now() - (s.t || Date.now())) / 1000);
    const old = Date.now() - 2 * 86400e3;
    for (const k of Object.keys(s.log)) if (s.log[k] < old) delete s.log[k];
    return s;
  } catch (e) { return null; }
}
function save() {
  try { state.t = Date.now(); localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* sem armazenamento */ }
}

// ============================================================
// Estado da tela
// ============================================================
let state;
let view = { kind: 'home' };        // home | npc | friend
let scene = 'roca';                 // roca | animais | casa
let tab = 'loja', shopSeg = 'sementes';
let hover = null;
const pointer = { x: 0, y: 0, inside: false, touch: false, tipUntil: 0 };
const popups = [];
let hits = [];                      // alvos clicáveis desenhados no último quadro
const amb = {};                     // posição dos animais andando (só na tela)
const L = { W: 60, ox: 0, oy: 0, cw: 0, ch: 0, horizon: 0, dpr: 1 };

// Nuvem
let user = null, cloudStatus = Cloud.available ? 'loading' : 'off', syncStatus = '', dirty = false, lastCloud = 0;
let unsubVisits = null, unsubRequests = null;
let requests = [];                  // pedidos de amizade recebidos (ao vivo)
const friendInfo = {};

const $ = s => document.querySelector(s);
const cv = $('#cv'), mainCtx = cv.getContext('2d');
let ctx = mainCtx; // as funções de desenho usam este contexto; os ícones trocam por outro
const stage = $('#stage'), tip = $('#tip');

const S = () => view.kind === 'home' ? state : view.data;
const isHome = () => view.kind === 'home';

// ============================================================
// Utilidades
// ============================================================
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function fmt(sec) {
  sec = Math.max(0, Math.ceil(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  if (h) return `${h}h ${m}min`;
  if (m) return s ? `${m}min ${s}s` : `${m}min`;
  return `${s}s`;
}
function stageOf(p) {
  const k = p.g / CROP[p.c].tempo;
  return k >= 1 ? 4 : k < 0.12 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
}
const ripe = p => p.s === 'growing' && p.g >= CROP[p.c].tempo;
const expectedYield = p => Math.max(1, Math.round(CROP[p.c].rend - p.dmg));
const nextLot = () => ORDER.find(i => state.plots[i].s === 'locked');
const comfort = s => DECOR.reduce((t, d) => t + (s.decor[d.id] ? d.conforto : 0), 0);
const firstName = n => (n || '').split(' ')[0] || 'Você';

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 2800);
  const all = $('#toasts').children; if (all.length > (L.cw < 500 ? 2 : 3)) all[0].remove();
}
function popupAt(pos, text, color, delay = 0) {
  if (!pos) return;
  popups.push({ x: pos.x, y: pos.y - L.W * 0.2, text, color, t0: performance.now() + delay });
}
function addXP(n, pos) {
  n = Math.max(n, Math.round(n * (1 + comfort(state) / 100)));
  state.xp += n;
  popupAt(pos, `+${n} XP`, '#4aa3df', 180);
  while (state.xp >= need(state.level)) {
    state.xp -= need(state.level); state.level++;
    const bonus = state.level * 5; state.coins += bonus;
    const novas = [...CROPS, ...ANIMALS, ...DECOR].filter(c => c.nivel === state.level).map(c => c.nome);
    toast(`Nível ${state.level}! +${bonus} moedas` + (novas.length ? ` · novidades: ${novas.join(', ')}` : ''), 'good');
  }
}
function addCoins(n, pos) {
  state.coins += n;
  if (n) popupAt(pos, `${n > 0 ? '+' : ''}${n} moedas`, n > 0 ? '#f2b705' : '#e05a3a', 360);
}
function gain(id, qty, pos) {
  state.barn[id] = (state.barn[id] || 0) + qty;
  popupAt(pos, `+${qty} ${item(id).nome}`, '#ffffff');
}
function done() { save(); dirty = true; renderHUD(); renderPane(); renderSceneInfo(); }

// ============================================================
// Ações na sua roça
// ============================================================
function actPlot(i) {
  const p = S().plots[i];
  if (!isHome()) return awayPlot(i, p);
  const tool = state.tool, pos = cellCenter(i);
  if (p.s === 'locked') {
    if (i === nextLot()) buyLot(i); else toast('Compre primeiro o lote com a placa.');
    return;
  }
  const has = t => tool === 'hand' || tool === t;
  if (p.s === 'growing' && p.b > 0 && has('pest')) { p.b--; addXP(2, pos); addCoins(1, pos); return done(); }
  if (p.s === 'growing' && p.w > 0 && has('weed')) { p.w--; addXP(2, pos); addCoins(1, pos); return done(); }
  if (p.s === 'growing' && p.dry && has('water')) { p.dry = false; addXP(1, pos); return done(); }
  if (ripe(p) && tool === 'hand') return harvest(p, pos);
  if (p.s === 'withered' && has('hoe')) { Object.assign(p, emptyPlot('plowed')); addXP(1, pos); return done(); }
  if (p.s === 'plowed' && (tool === 'seed' || tool === 'hand')) return plant(p, pos);
  const hints = {
    hoe: 'A enxada limpa plantas secas.', water: 'Essa terra não precisa de água.',
    pest: 'Não há pragas aqui.', weed: 'Não há mato aqui.', seed: 'Só dá para plantar em terra arada.',
  };
  if (hints[tool]) toast(hints[tool]);
}

function plant(p, pos) {
  const crop = CROP[state.seed];
  if (crop.nivel > state.level) return toast(`${crop.nome} libera no nível ${crop.nivel}.`);
  if (state.coins < crop.custo) return toast(`Faltam moedas para ${crop.nome} (${crop.custo}).`, 'bad');
  addCoins(-crop.custo, pos);
  Object.assign(p, emptyPlot('growing'), { c: crop.id, sl: crop.safras, id: newId() });
  done();
}

function harvest(p, pos) {
  const crop = CROP[p.c], qty = expectedYield(p);
  gain(crop.id, qty, pos);
  state.stats.colheitas++;
  addXP(crop.xp, pos);
  if (p.sl > 1) Object.assign(p, { g: crop.tempo * 0.55, sl: p.sl - 1, dmg: 0, w: 0, b: 0, dry: false, id: newId(), th: [] });
  else Object.assign(p, { s: 'withered', g: 0, w: 0, b: 0, dry: false, th: [] });
  done();
}

function buyLot(i) {
  const cost = lotCost(state.owned), lvl = lotLevel(state.owned);
  if (state.level < lvl) return toast(`Este lote exige nível ${lvl}.`);
  if (state.coins < cost) return toast(`O lote custa ${cost} moedas.`, 'bad');
  const pos = scene === 'roca' ? cellCenter(i) : null;
  addCoins(-cost, pos);
  state.plots[i] = emptyPlot('plowed'); state.owned++;
  addXP(5, pos);
  toast('Lote novo comprado!', 'good');
  done();
}

function actAnimal(id) {
  const s = S(), a = s.animals.find(x => x.id === id);
  if (!a) return;
  const def = ANIMAL[a.k], prod = PRODUCT[def.prod], pos = animalPos(a.id);
  if (!isHome()) return awayAnimal(a, def, prod, pos);
  if (a.ready) {
    a.ready = false; a.g = 0; a.n++;
    gain(prod.id, 1, pos); addXP(def.xp, pos); state.stats.coletas++;
    return done();
  }
  if (!a.fed) {
    if ((state.barn.milho || 0) > 0) {
      state.barn.milho--; if (!state.barn.milho) delete state.barn.milho;
      popupAt(pos, '−1 Milho', '#ffe08a');
    } else if (state.coins >= def.racao) addCoins(-def.racao, pos);
    else return toast(`Faltam moedas para a ração (${def.racao}).`, 'bad');
    a.fed = true; addXP(1, pos);
    return done();
  }
  toast(`${def.nome} está produzindo ${prod.nome.toLowerCase()}: falta ${fmt(def.tempo - a.g)}.`);
}

function actDecor(id) {
  const d = DECO[id];
  if (!isHome()) return toast(`${d.nome} de ${view.nome}.`);
  if (state.decor[id]) return toast(`${d.nome}: +${d.conforto}% de XP.`);
  tab = 'loja'; shopSeg = 'decor'; renderPane();
  toast(`Compre ${d.nome} na Loja para colocar aqui.`);
}

function buyAnimal(k) {
  const d = ANIMAL[k];
  if (state.animals.length >= MAX_ANIMALS) return toast(`O cercado cabe ${MAX_ANIMALS} animais.`);
  if (state.level < d.nivel) return toast(`${d.nome} libera no nível ${d.nivel}.`);
  if (state.coins < d.custo) return toast(`${d.nome} custa ${d.custo} moedas.`, 'bad');
  state.coins -= d.custo;
  state.animals.push(newAnimal(k));
  addXP(4, null);
  toast(`${d.nome} chegou no cercado!`, 'good');
  if (isHome()) setScene('animais');
  done();
}
function buyDecor(id) {
  const d = DECO[id];
  if (state.decor[id]) return;
  if (state.level < d.nivel) return toast(`${d.nome} libera no nível ${d.nivel}.`);
  if (state.coins < d.custo) return toast(`${d.nome} custa ${d.custo} moedas.`, 'bad');
  state.coins -= d.custo; state.decor[id] = true;
  addXP(3, null);
  toast(`${d.nome} na sua casa! Agora você ganha +${comfort(state)}% de XP.`, 'good');
  if (isHome()) setScene('casa');
  done();
}

function sell(id, all) {
  const it = item(id), q = state.barn[id] || 0; if (!q || !it) return;
  const n = all ? q : 1;
  state.barn[id] = q - n; if (!state.barn[id]) delete state.barn[id];
  state.coins += n * it.preco; state.stats.vendido += n * it.preco;
  done();
}
function sellAll() {
  let total = 0;
  for (const [id, q] of Object.entries(state.barn)) total += q * (item(id)?.preco || 0);
  if (!total) return;
  state.barn = {}; state.coins += total; state.stats.vendido += total;
  toast(`Vendeu tudo por ${total} moedas`, 'good');
  done();
}

// ============================================================
// Visitas (vizinhos da vila e amigos de verdade)
// ============================================================
function genNeighbor() {
  const plots = Array.from({ length: N }, () => emptyPlot());
  const count = 12 + Math.floor(Math.random() * 16);
  for (const i of ORDER.slice(0, count)) {
    const crop = CROPS[Math.floor(Math.random() * CROPS.length)];
    if (Math.random() < 0.12) { plots[i] = emptyPlot('plowed'); continue; }
    const mature = Math.random() < 0.5;
    plots[i] = Object.assign(emptyPlot('growing'), {
      c: crop.id, sl: 1, id: newId(),
      g: mature ? crop.tempo : crop.tempo * rand(0.15, 0.95),
      w: Math.random() < 0.25 ? 1 + Math.floor(Math.random() * 2) : 0,
      b: Math.random() < 0.2 ? 1 : 0,
      dry: !mature && Math.random() < 0.25,
    });
  }
  const animals = [];
  const nA = 3 + Math.floor(Math.random() * 5);
  for (let k = 0; k < nA; k++) {
    const a = newAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)].id), r = Math.random();
    if (r < 0.45) { a.ready = true; a.fed = false; a.g = ANIMAL[a.k].tempo; }
    else if (r < 0.7) { a.fed = false; }
    else a.g = ANIMAL[a.k].tempo * rand(0.1, 0.9);
    animals.push(a);
  }
  const decor = {};
  for (const d of DECOR) if (Math.random() < 0.55) decor[d.id] = true;
  return { plots, animals, decor, refreshAt: Date.now() + 4 * 60 * 1000 };
}

function visitNpc(id) {
  const nb = NEIGHBORS.find(n => n.id === id);
  const cur = state.nb[id];
  if (!cur || Date.now() > cur.refreshAt || !cur.animals) state.nb[id] = genNeighbor();
  view = { kind: 'npc', id, nome: nb.nome, cao: nb.cao, pega: nb.pega, casa: nb.casa, data: state.nb[id] };
  afterVisit();
  save();
}

async function visitFriend(uid) {
  if (!user) return;
  toast('Indo até a roça do amigo…');
  try {
    const f = await Cloud.loadFarm(uid);
    const data = f && f.stateJson ? migrate(JSON.parse(f.stateJson)) : null;
    if (!data) return toast('Essa roça ainda não existe na nuvem.', 'bad');
    catchUp(data, (Date.now() - (f.updatedAt || Date.now())) / 1000);
    view = { kind: 'friend', uid, nome: firstName(f.name) === 'Você' ? 'Amigo' : f.name, cao: 'Bidu', pega: 0.12, casa: '#7aa35a', data };
    afterVisit();
  } catch (e) {
    console.warn(e);
    toast('Não consegui abrir a roça do amigo agora.', 'bad');
  }
}

function afterVisit() {
  hover = null; setScene('roca');
  if (state.tool === 'seed' || state.tool === 'hoe') state.tool = 'hand';
  $('#bannerTxt').textContent = `Você está na roça de ${view.nome}. Tire mato e pragas, alimente os animais ou pegue um pouquinho da colheita… cuidado com ${view.cao}!`;
  $('#banner').hidden = false;
  cv.setAttribute('aria-label', `Roça de ${view.nome}`);
  renderTools(); renderPane(); renderSceneInfo();
}
function goHome() {
  view = { kind: 'home' }; hover = null;
  $('#banner').hidden = true; cv.setAttribute('aria-label', 'Sua roça');
  renderTools(); renderPane(); renderSceneInfo();
}

const visitKey = id => (view.kind === 'friend' ? view.uid : view.id) + ':' + id;
function help(pos) { state.stats.ajudas++; addXP(2, pos); addCoins(2, pos); }
function caught(pos) {
  if (Math.random() >= view.pega) return false;
  const loss = Math.min(state.coins, Math.round(rand(5, 15)));
  addCoins(-loss, pos);
  toast(`${view.cao}, o cachorro de ${view.nome}, te pegou! −${loss} moedas`, 'bad');
  return true;
}
function sendVisit(v) {
  if (view.kind !== 'friend' || !user) return;
  Cloud.sendVisit(view.uid, Object.assign({ from: user.uid, fromName: user.name || 'Um amigo', at: Date.now() }, v))
    .catch(e => console.warn('visita não enviada:', e));
}
function alreadyTook(obj, key) {
  return obj.stolen || state.log[key] || (user && Array.isArray(obj.th) && obj.th.includes(user.uid));
}

function awayPlot(i, p) {
  if (p.s !== 'growing') return;
  const tool = state.tool, has = t => tool === 'hand' || tool === t, pos = cellCenter(i);
  let what = null;
  if (p.b > 0 && has('pest')) { p.b--; what = 'b'; }
  else if (p.w > 0 && has('weed')) { p.w--; what = 'w'; }
  else if (p.dry && has('water')) { p.dry = false; what = 'dry'; }
  if (what) { help(pos); sendVisit({ t: 'help', what, plot: i, pid: p.id }); return done(); }
  if (ripe(p) && tool === 'hand') {
    const key = visitKey(p.id);
    if (alreadyTook(p, key)) return toast('Você já pegou daqui. Não exagere!');
    p.stolen = true; state.log[key] = Date.now();
    if (caught(pos)) return done();
    const crop = CROP[p.c], qty = 1 + (Math.random() < 0.4 ? 1 : 0);
    gain(crop.id, qty, pos); state.stats.roubado += qty; addXP(1, pos);
    sendVisit({ t: 'steal', plot: i, pid: p.id, qty });
    return done();
  }
}

function awayAnimal(a, def, prod, pos) {
  if (!a.fed && !a.ready) { a.fed = true; help(pos); sendVisit({ t: 'feed', animal: a.id }); return done(); }
  if (a.ready) {
    const key = visitKey(a.id + ':' + a.n);
    if (alreadyTook(a, key)) return toast('Você já pegou deste bicho. Não exagere!');
    a.stolen = true; state.log[key] = Date.now();
    if (caught(pos)) return done();
    gain(prod.id, 1, pos); addXP(1, pos); state.stats.roubado++;
    sendVisit({ t: 'stealA', animal: a.id });
    return done();
  }
  toast(`${def.nome} de ${view.nome} está produzindo.`);
}

// O que seus amigos fizeram na sua roça enquanto você estava fora.
function applyVisits(list) {
  const msgs = {};
  for (const { id, data: v } of list) {
    Cloud.deleteVisit(user.uid, id).catch(() => {});
    if (!v || typeof v !== 'object' || typeof v.from !== 'string' || v.from === user.uid) continue;
    const who = firstName(String(v.fromName || 'Um amigo').slice(0, 40));
    const note = m => (msgs[who] = msgs[who] || []).push(m);
    const p = Number.isInteger(v.plot) && v.plot >= 0 && v.plot < N ? state.plots[v.plot] : null;
    const a = typeof v.animal === 'string' ? state.animals.find(x => x.id === v.animal) : null;
    if (!state.friends.includes(v.from)) continue;
    if (v.t === 'help' && p && p.id === v.pid) {
      if (v.what === 'w') p.w = Math.max(0, p.w - 1);
      if (v.what === 'b') p.b = Math.max(0, p.b - 1);
      if (v.what === 'dry') p.dry = false;
      note('ajudou na sua roça');
    } else if (v.t === 'steal' && p && p.id === v.pid && p.s === 'growing') {
      const qty = clamp(Number(v.qty) || 1, 1, 2);
      p.dmg = Math.min(CROP[p.c].rend - 1, p.dmg + qty);
      if (!p.th.includes(v.from)) p.th.push(v.from);
      note(`pegou ${qty} ${CROP[p.c].nome}`);
    } else if (v.t === 'feed' && a && !a.fed && !a.ready) {
      a.fed = true; note('alimentou seus animais');
    } else if (v.t === 'stealA' && a && a.ready) {
      a.ready = false; a.g = 0; a.n++;
      note(`pegou 1 ${PRODUCT[ANIMAL[a.k].prod].nome}`);
    }
  }
  for (const [who, list2] of Object.entries(msgs)) toast(`${who} ${[...new Set(list2)].join(', ')}`, 'good');
  done();
}

// ============================================================
// Nuvem: login com Google, salvamento e amigos
// ============================================================
async function cloudSave() {
  if (!user) return;
  dirty = false; lastCloud = performance.now();
  syncStatus = 'Salvando…'; renderAccount();
  try {
    state.owner = user.uid;
    // friends e sent ficam fora do JSON para as regras do Firestore decidirem quem pode ver a roça.
    await Cloud.saveFarm(user.uid, {
      stateJson: JSON.stringify(state), name: user.name || '', photo: user.photo || '',
      level: state.level, code: state.code || '', updatedAt: Date.now(),
      friends: state.friends.slice(), sent: Object.keys(state.sent),
    });
    syncStatus = 'Salvo na nuvem';
  } catch (e) {
    console.warn(e); dirty = true; syncStatus = 'Sem conexão';
  }
  renderAccount();
}

async function onUser(u) {
  if (unsubVisits) { unsubVisits(); unsubVisits = null; }
  if (unsubRequests) { unsubRequests(); unsubRequests = null; }
  user = u; requests = [];
  for (const k of Object.keys(friendInfo)) delete friendInfo[k];
  if (!u) {
    cloudStatus = 'out'; syncStatus = '';
    if (view.kind === 'friend') goHome();
    renderAccount(); renderPane(); renderTabs();
    showGate('login');
    return;
  }
  cloudStatus = 'loading'; renderAccount();
  showGate('entering');
  try {
    const remote = await Cloud.loadFarm(u.uid);
    const rs = remote && remote.stateJson ? migrate(JSON.parse(remote.stateJson)) : null;
    if (rs) {
      const localIsNewer = state.owner === u.uid && state.t > (remote.updatedAt || 0);
      if (!localIsNewer) { catchUp(rs, (Date.now() - (remote.updatedAt || Date.now())) / 1000); state = rs; }
    } else if (state.owner && state.owner !== u.uid) {
      state = newState(); // a roça deste navegador é de outra conta
    }
    state.owner = u.uid;
    if (!state.code) state.code = await Cloud.claimCode(u.uid);
    view = { kind: 'home' }; $('#banner').hidden = true;
    save();
    cloudStatus = 'ready';
    await cloudSave();
    unsubVisits = Cloud.watchVisits(u.uid, applyVisits);
    unsubRequests = Cloud.watchRequests(u.uid, onRequests);
    checkSent();
    enterGame();
    toast(`Olá, ${firstName(u.name)}! Bom te ver na roça.`, 'good');
  } catch (e) {
    console.warn(e);
    cloudStatus = 'ready'; syncStatus = 'Sem conexão';
    enterGame();
    toast('Não consegui falar com a nuvem. Seguimos salvando neste aparelho.', 'bad');
  }
  renderTools(); renderHUD(); renderAccount(); renderPane(); renderSceneInfo(); renderTabs();
}

// ---------- Tela de entrada (só quando o login está ligado) ----------
const root = document.documentElement;
const isGated = () => root.classList.contains('gated');
function showGate(mode, msg) {
  root.classList.add('gated');
  tip.hidden = true;
  drawGateArt();
  $('#gateLogin').hidden = mode !== 'login';
  $('#gateRetry').hidden = mode !== 'error';
  const st = $('#gateStatus');
  st.className = 'gate-status' + (mode === 'error' ? ' bad' : '');
  st.textContent = msg || { loading: 'Abrindo a porteira…', entering: 'Carregando sua roça…', waiting: 'Esperando o Google…' }[mode] || '';
}
function enterGame() {
  root.classList.remove('gated');
  resize(); setScene(scene);
}
// Recado para o jogador: na tela de entrada, vai no status; no jogo, vira aviso.
function notify(msg, kind) {
  if (isGated()) { const st = $('#gateStatus'); st.className = 'gate-status' + (kind === 'bad' ? ' bad' : ''); st.textContent = msg; }
  else toast(msg, kind);
}
$('#gateLogin').addEventListener('click', () => login());
$('#gateRetry').addEventListener('click', () => location.reload());

// Ilustração da tela de entrada, feita com os mesmos desenhos do jogo.
let gateArtDone = false;
function drawGateArt() {
  if (gateArtDone) return;
  const g = $('#gateArt'), saved = Object.assign({}, L);
  ctx = g.getContext('2d');
  try {
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    Object.assign(L, { cw: 480, ch: 280, W: 96, ox: 262, oy: 108, horizon: 86, dpr: 2 });
    drawSky(0, 'dia'); drawGround();
    drawBarn(72, 172, 96);
    drawTree(430, 150, 80, 0);
    drawFence(3, 2, 'back');
    const crops = ['tomate', 'milho', 'abobora', 'cenoura', 'morango', 'melancia'];
    for (let sum = 0; sum <= 3; sum++) for (let c = 0; c < 3; c++) {
      const r = sum - c; if (r < 0 || r > 1) continue;
      const crop = CROP[crops[r * 3 + c]];
      drawPlot(r * COLS + c, Object.assign(emptyPlot('growing'), { c: crop.id, g: crop.tempo, id: 'g' }), 0, true);
    }
    const q1 = iso(3.4, 1.2), q3 = iso(3.0, 2.0);
    drawAnimal('vaca', 150, 256, 1.15, 0, 1, false);
    drawAnimal('galinha', q1.x, q1.y, 1.1, 0, -1, false);
    drawAnimal('galinha', q3.x, q3.y, 1.0, 0, 1, false);
    gateArtDone = true;
  } finally { ctx = mainCtx; Object.assign(L, saved); }
}

// ---------- Pedidos de amizade ----------
// Quem digita o código cria farms/{outro}/requests/{eu}. O outro aceita ou recusa.
// Aceitar = colocar na lista friends e salvar; quem pediu percebe isso em checkSent().
function onRequests(list) {
  const seen = new Set(requests.map(r => r.from));
  requests = list
    .map(r => r.data)
    .filter(r => r && typeof r.from === 'string' && r.from !== user.uid && !state.friends.includes(r.from))
    .map(r => ({ from: r.from, name: String(r.fromName || 'Alguém').slice(0, 60), photo: typeof r.fromPhoto === 'string' ? r.fromPhoto : '', at: r.at || 0 }));
  // Se a pessoa já é amiga (ex.: pediu de novo), o pedido é só apagado.
  for (const r of list) if (r.data && state.friends.includes(r.data.from)) Cloud.deleteRequest(user.uid, r.data.from).catch(() => {});
  for (const r of requests) if (!seen.has(r.from)) toast(`${firstName(r.name)} quer ser seu amigo! Veja na aba Amigos.`, 'good');
  renderTabs();
  if (tab === 'amigos') renderPane();
}

async function addFriend(code) {
  if (!user) return;
  code = Cloud.normalizeCode(code);
  if (code.length !== 6) return toast('O código tem 6 letras e números.');
  if (code === state.code) return toast('Esse é o seu próprio código!');
  try {
    const uid = await Cloud.findCode(code);
    if (!uid) return toast('Não achei ninguém com esse código.', 'bad');
    if (state.friends.includes(uid)) return toast('Vocês já são amigos.');
    if (requests.some(r => r.from === uid)) return acceptRequest(uid);
    if (state.sent[uid]) return toast('Você já mandou um pedido para essa pessoa.');
    state.sent[uid] = { at: Date.now(), code };
    await cloudSave(); // libera a sua roça para essa pessoa espiar antes de aceitar
    await Cloud.sendRequest(uid, { from: user.uid, fromName: user.name || 'Alguém', fromPhoto: user.photo || '', at: Date.now() });
    toast('Pedido enviado! A amizade começa quando a pessoa aceitar.', 'good');
    done();
  } catch (e) {
    console.warn(e);
    toast('Não consegui mandar o pedido agora. Tente de novo.', 'bad');
  }
}

async function acceptRequest(uid) {
  if (!user) return;
  if (!state.friends.includes(uid)) state.friends.push(uid);
  delete state.sent[uid];
  const r = requests.find(x => x.from === uid);
  requests = requests.filter(x => x.from !== uid);
  delete friendInfo[uid];
  save(); await cloudSave();
  Cloud.deleteRequest(user.uid, uid).catch(e => console.warn(e));
  toast(`Agora você e ${firstName(r ? r.name : 'seu amigo')} são amigos!`, 'good');
  renderTabs(); renderPane();
}

function refuseRequest(uid) {
  if (!user) return;
  requests = requests.filter(x => x.from !== uid);
  Cloud.deleteRequest(user.uid, uid).catch(e => console.warn(e));
  renderTabs(); renderPane();
}

async function cancelRequest(uid) {
  if (!user) return;
  delete state.sent[uid];
  Cloud.deleteRequest(uid, user.uid).catch(e => console.warn(e));
  done(); await cloudSave();
}

async function unfriend(uid) {
  state.friends = state.friends.filter(f => f !== uid);
  delete friendInfo[uid];
  if (view.kind === 'friend' && view.uid === uid) goHome();
  done(); await cloudSave();
  toast('Amizade desfeita.');
}

// Confere os pedidos que você mandou: aceito (a pessoa te colocou na lista) ou recusado (o pedido sumiu).
let checkingSent = false;
async function checkSent() {
  if (!user || checkingSent) return;
  const pending = Object.keys(state.sent);
  if (!pending.length) return;
  checkingSent = true;
  let changed = false;
  try {
    for (const uid of pending) {
      let farm = null;
      try { farm = await Cloud.loadFarm(uid); } catch (e) { farm = null; }
      if (farm && Array.isArray(farm.friends) && farm.friends.includes(user.uid)) {
        delete state.sent[uid];
        if (!state.friends.includes(uid)) state.friends.push(uid);
        toast(`${firstName(farm.name || 'Seu amigo')} aceitou seu pedido de amizade!`, 'good');
        changed = true;
        continue;
      }
      const still = await Cloud.requestExists(uid, user.uid).catch(() => true);
      if (!still) { delete state.sent[uid]; changed = true; }
    }
  } finally { checkingSent = false; }
  if (changed) { done(); cloudSave(); }
}

function fetchFriendInfo(uid) {
  if (friendInfo[uid] !== undefined) return;
  friendInfo[uid] = 'loading';
  Cloud.loadFarm(uid).then(f => {
    friendInfo[uid] = f ? { name: f.name || 'Amigo', photo: f.photo || '', level: f.level || 1 } : null;
  }).catch(e => {
    friendInfo[uid] = null;
    // Sem permissão = a pessoa desfez a amizade. Tira da sua lista também.
    if (e && e.code === 'permission-denied' && state.friends.includes(uid)) {
      state.friends = state.friends.filter(f => f !== uid);
      done(); cloudSave();
    }
  }).finally(() => { if (tab === 'amigos') renderPane(); });
}

// ============================================================
// Simulação
// ============================================================
function tick(dt) {
  for (const p of state.plots) {
    if (p.s !== 'growing') continue;
    const crop = CROP[p.c];
    if (p.g >= crop.tempo) continue;
    p.g = Math.min(crop.tempo, p.g + dt * (p.dry ? 0.5 : 1));
    if (p.w < 2 && Math.random() < 0.6 / crop.tempo * dt) p.w++;
    if (p.b < 2 && Math.random() < 0.45 / crop.tempo * dt) p.b++;
    if (!p.dry && Math.random() < 0.7 / crop.tempo * dt) p.dry = true;
    p.dmg = Math.min(crop.rend * 0.5, p.dmg + dt / 60 * (p.w + p.b + (p.dry ? 0.5 : 0)));
  }
  for (const a of state.animals) {
    const def = ANIMAL[a.k];
    if (a.fed && !a.ready) { a.g += dt; if (a.g >= def.tempo) { a.g = def.tempo; a.ready = true; a.fed = false; } }
  }
}

function updateWander(list, dt) {
  for (const a of list) {
    let m = amb[a.id];
    if (!m) {
      const u = rand(0.6, PEN_C - 0.6), v = rand(1.0, PEN_R - 0.5);
      m = amb[a.id] = { u, v, tu: u, tv: v, wait: rand(0, 2), dir: Math.random() < 0.5 ? 1 : -1, moving: false };
    }
    const hungry = !a.fed && !a.ready;
    if (m.wait > 0) { m.wait -= dt; m.moving = false; continue; }
    const du = m.tu - m.u, dv = m.tv - m.v, d = Math.hypot(du, dv);
    if (d < 0.05) {
      m.wait = hungry ? rand(2, 5) : rand(1, 4); m.moving = false;
      if (hungry) { m.tu = rand(0.8, 2.2); m.tv = rand(0.75, 1.0); }
      else { m.tu = rand(0.5, PEN_C - 0.5); m.tv = rand(0.9, PEN_R - 0.4); }
      continue;
    }
    const k = Math.min(1, (a.k === 'galinha' ? 0.55 : 0.3) * dt / d);
    m.u += du * k; m.v += dv * k; m.moving = true;
    const sx = du - dv; if (Math.abs(sx) > 0.01) m.dir = sx > 0 ? 1 : -1;
  }
}

// ============================================================
// Geometria isométrica
// ============================================================
function resize() {
  const r = stage.getBoundingClientRect();
  const cw = Math.max(0, r.width - 10), ch = Math.max(0, r.height - 10); // borda de 5px
  L.dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(cw * L.dpr); cv.height = Math.round(ch * L.dpr);
  L.cw = cw; L.ch = ch;
}
function layout(sc) {
  const { cw, ch } = L;
  if (sc === 'roca') {
    // A câmera enquadra só a terra em uso (mais o lote à venda) e se afasta conforme a roça cresce.
    const plots = S().plots, next = isHome() ? nextLot() : -1;
    let c0 = COLS, c1 = 0, r0 = ROWS, r1 = 0;
    plots.forEach((p, i) => {
      if (p.s === 'locked' && i !== next) return;
      const c = i % COLS, r = Math.floor(i / COLS);
      c0 = Math.min(c0, c); c1 = Math.max(c1, c + 1); r0 = Math.min(r0, r); r1 = Math.max(r1, r + 1);
    });
    if (c0 > c1) { c0 = 0; c1 = COLS; r0 = 0; r1 = ROWS; }
    c0 = Math.max(0, c0 - 1); c1 = Math.min(COLS, c1 + 1); r0 = Math.max(0, r0 - 1); r1 = Math.min(ROWS, r1 + 1);
    const span = (c1 - c0) + (r1 - r0);
    const full = Math.min(cw / 7.4, ch / 4.9);
    L.W = Math.max(full, Math.min(cw * 1.8 / span, ch * 0.86 / (span / 4 + 0.9), cw / 5, ch / 3.6));
    const cc = (c0 + c1) / 2, rc = (r0 + r1) / 2;
    L.ox = cw / 2 - (cc - rc) * L.W / 2;
    L.oy = Math.min(ch * 0.6 - (cc + rc) * L.W / 4, ch - (c1 + r1) * L.W / 4 - 0.25 * L.W);
  } else if (sc === 'animais') {
    L.W = Math.min(cw / 6.6, ch / 4.5);
    L.ox = cw / 2 - (PEN_C - PEN_R) * L.W / 4 + L.W * 0.4;
    L.oy = ch - (PEN_C + PEN_R) * L.W / 4 - 0.4 * L.W;
  } else {
    L.W = Math.min(cw / 5.9, ch / 4.35);
    L.ox = cw / 2;
    L.oy = ch - ROOM / 2 * L.W - 0.3 * L.W;
  }
  L.horizon = Math.max(ch * 0.08, L.oy - L.W * 0.9);
}
function iso(c, r) { return { x: L.ox + (c - r) * L.W / 2, y: L.oy + (c + r) * L.W / 4 }; }
function P(c, r, h = 0) { const q = iso(c, r); return { x: q.x, y: q.y - h * L.W }; }
function cellAt(x, y) {
  const a = (x - L.ox) / (L.W / 2), b = (y - L.oy) / (L.W / 4);
  const c = Math.floor((a + b) / 2), r = Math.floor((b - a) / 2);
  if (c < 0 || r < 0 || c >= COLS || r >= ROWS) return -1;
  return r * COLS + c;
}
function cellCenter(i) { const c = i % COLS, r = Math.floor(i / COLS); return iso(c + .5, r + .5); }
function animalPos(id) { const m = amb[id]; return m ? iso(m.u, m.v) : null; }

function poly(pts) { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k].x, pts[k].y); ctx.closePath(); }
function quad(a, b, c, d, fill, stroke, lw) {
  poly([a, b, c, d]);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); }
}
// Caixa isométrica: mostra o topo e as duas faces viradas para quem olha.
function isoBox(c0, r0, c1, r1, h0, h1, top, left, right) {
  quad(P(c0, r1, h0), P(c1, r1, h0), P(c1, r1, h1), P(c0, r1, h1), left);
  quad(P(c1, r0, h0), P(c1, r1, h0), P(c1, r1, h1), P(c1, r0, h1), right);
  quad(P(c0, r0, h1), P(c1, r0, h1), P(c1, r1, h1), P(c0, r1, h1), top);
}
const lerp = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
function line(a, b, color, w) { ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }

// ============================================================
// Cenário
// ============================================================
const TUFTS = Array.from({ length: 140 }, () => [Math.random(), Math.random(), Math.random()]);
const STARS = Array.from({ length: 40 }, () => [Math.random(), Math.random() * 0.9, Math.random()]);

function timeOfDay() {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6.5 && h < 17) return 'dia';
  if (h >= 17 && h < 19) return 'tarde';
  if (h >= 5 && h < 6.5) return 'aurora';
  return 'noite';
}
const SKIES = { dia: ['#7cc4ef', '#c5ebfa'], tarde: ['#f28b5b', '#ffd49a'], aurora: ['#8a8fcf', '#ffc9a8'], noite: ['#101b3f', '#2f4a7c'] };

function drawSky(t, tod) {
  const { cw, horizon } = L;
  const [a, b] = SKIES[tod];
  const g = ctx.createLinearGradient(0, 0, 0, horizon);
  g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.fillRect(0, 0, cw, horizon + 2);
  if (tod === 'noite') {
    ctx.fillStyle = '#fff';
    for (const [x, y, k] of STARS) { ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t / 900 + k * 9)); ctx.fillRect(x * cw, y * horizon, 1.5, 1.5); }
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#f4f1d0'; ctx.beginPath(); ctx.arc(cw * 0.86, horizon * 0.42, L.W * 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = b; ctx.beginPath(); ctx.arc(cw * 0.86 + L.W * 0.08, horizon * 0.38, L.W * 0.17, 0, 7); ctx.fill();
  } else {
    ctx.fillStyle = tod === 'dia' ? '#fff3a6' : '#ffb35c';
    ctx.beginPath(); ctx.arc(cw * 0.88, tod === 'dia' ? horizon * 0.4 : horizon * 0.8, L.W * 0.22, 0, 7); ctx.fill();
  }
  ctx.fillStyle = tod === 'noite' ? 'rgba(200,210,240,.18)' : 'rgba(255,255,255,.85)';
  for (let k = 0; k < 3; k++) {
    const sp = 8 + k * 5, span = cw + L.W * 3;
    const x = ((t / 1000) * sp + k * span / 3) % span - L.W * 1.5;
    const y = horizon * (0.25 + k * 0.2), s = L.W * (0.28 + k * 0.05);
    ctx.beginPath();
    ctx.ellipse(x, y, s * 1.3, s * 0.5, 0, 0, 7);
    ctx.ellipse(x - s * 0.6, y + s * 0.1, s * 0.7, s * 0.4, 0, 0, 7);
    ctx.ellipse(x + s * 0.6, y + s * 0.05, s * 0.8, s * 0.45, 0, 0, 7);
    ctx.fill();
  }
}

function drawGround() {
  const { cw, ch, horizon, W } = L;
  ctx.fillStyle = '#6fae43';
  ctx.beginPath(); ctx.moveTo(0, horizon + 4);
  for (let x = 0; x <= cw + 20; x += 20) ctx.lineTo(x, horizon - Math.sin(x / cw * 7 + 1) * W * 0.12 - W * 0.08);
  ctx.lineTo(cw, horizon + 10); ctx.closePath(); ctx.fill();
  const g = ctx.createLinearGradient(0, horizon, 0, ch);
  g.addColorStop(0, '#86c450'); g.addColorStop(1, '#9ad35e');
  ctx.fillStyle = g; ctx.fillRect(0, horizon, cw, ch - horizon);
  ctx.strokeStyle = 'rgba(46,110,30,.45)'; ctx.lineWidth = 1.2;
  for (const [x, y, k] of TUFTS) {
    const px = x * cw, py = horizon + 6 + y * (ch - horizon - 6), s = W * (0.04 + k * 0.04);
    ctx.beginPath();
    ctx.moveTo(px - s, py - s); ctx.lineTo(px - s * 0.3, py);
    ctx.moveTo(px, py - s * 1.3); ctx.lineTo(px, py);
    ctx.moveTo(px + s, py - s); ctx.lineTo(px + s * 0.3, py);
    ctx.stroke();
  }
}

function nightOverlay(tod) {
  if (tod === 'dia') return;
  ctx.fillStyle = tod === 'noite' ? 'rgba(15,25,70,.32)' : tod === 'tarde' ? 'rgba(255,120,40,.1)' : 'rgba(120,100,200,.12)';
  ctx.fillRect(0, 0, L.cw, L.ch);
}

function drawBarn(x, y, s) {
  const w = s * 1.0, h = s * 0.62;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.62, s * 0.08, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8402f'; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = '#8f2a1e';
  ctx.beginPath(); ctx.moveTo(x - w * 0.58, y - h); ctx.lineTo(x, y - h - s * 0.42); ctx.lineTo(x + w * 0.58, y - h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#fff4e0'; ctx.lineWidth = Math.max(1.5, s * 0.03);
  ctx.strokeRect(x - w / 2, y - h, w, h);
  const dw = w * 0.42, dh = h * 0.7;
  ctx.strokeRect(x - dw / 2, y - dh, dw, dh);
  ctx.beginPath(); ctx.moveTo(x - dw / 2, y - dh); ctx.lineTo(x + dw / 2, y); ctx.moveTo(x + dw / 2, y - dh); ctx.lineTo(x - dw / 2, y); ctx.stroke();
  ctx.fillStyle = '#fff4e0'; ctx.beginPath(); ctx.arc(x, y - h - s * 0.14, s * 0.08, 0, 7); ctx.fill();
  ctx.fillStyle = '#6b3a1a'; ctx.beginPath(); ctx.arc(x, y - h - s * 0.14, s * 0.05, 0, 7); ctx.fill();
}
function drawHouse(x, y, s, cor) {
  const w = s * 0.95, h = s * 0.55;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.62, s * 0.08, 0, 0, 7); ctx.fill();
  ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = '#b5532f';
  ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x - w * 0.3, y - h - s * 0.35); ctx.lineTo(x + w * 0.3, y - h - s * 0.35); ctx.lineTo(x + w * 0.62, y - h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6b3a1a'; ctx.fillRect(x - w * 0.1, y - h * 0.62, w * 0.2, h * 0.62);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(x - w * 0.38, y - h * 0.7, w * 0.18, h * 0.3); ctx.fillRect(x + w * 0.2, y - h * 0.7, w * 0.18, h * 0.3);
}
function drawCoop(x, y, s) {
  const w = s * 0.8, h = s * 0.45;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.65, s * 0.07, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#6e4424'; ctx.fillRect(x - w * 0.42, y - s * 0.12, s * 0.05, s * 0.12); ctx.fillRect(x + w * 0.36, y - s * 0.12, s * 0.05, s * 0.12);
  ctx.fillStyle = '#d9a86a'; ctx.fillRect(x - w / 2, y - s * 0.12 - h, w, h);
  ctx.strokeStyle = 'rgba(110,68,36,.5)'; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - s * 0.12 - h * k / 4); ctx.lineTo(x + w / 2, y - s * 0.12 - h * k / 4); ctx.stroke(); }
  ctx.fillStyle = '#c8402f';
  ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - s * 0.12 - h); ctx.lineTo(x, y - s * 0.12 - h - s * 0.32); ctx.lineTo(x + w * 0.62, y - s * 0.12 - h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2412'; ctx.beginPath(); ctx.arc(x, y - s * 0.12 - h * 0.45, s * 0.1, Math.PI, 0); ctx.lineTo(x + s * 0.1, y - s * 0.12 - h * 0.1); ctx.lineTo(x - s * 0.1, y - s * 0.12 - h * 0.1); ctx.fill();
  ctx.strokeStyle = '#a0703f'; ctx.lineWidth = s * 0.04;
  ctx.beginPath(); ctx.moveTo(x - s * 0.08, y - s * 0.12 - h * 0.1); ctx.lineTo(x + s * 0.25, y); ctx.stroke();
}
function drawTree(x, y, s, t) {
  const sw = Math.sin(t / 1400 + x) * s * 0.02;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.35, s * 0.08, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(x - s * 0.06, y - s * 0.5, s * 0.12, s * 0.5);
  ctx.fillStyle = '#3f8a2a';
  ctx.beginPath(); ctx.arc(x + sw, y - s * 0.72, s * 0.32, 0, 7); ctx.arc(x - s * 0.22 + sw, y - s * 0.55, s * 0.24, 0, 7); ctx.arc(x + s * 0.22 + sw, y - s * 0.56, s * 0.25, 0, 7); ctx.fill();
  ctx.fillStyle = '#e53b2f';
  for (const [dx, dy] of [[-.15, -.7], [.12, -.8], [.2, -.55], [-.25, -.5]]) { ctx.beginPath(); ctx.arc(x + dx * s + sw, y + dy * s, s * 0.035, 0, 7); ctx.fill(); }
}
function drawDog(x, y, s, t) {
  const wag = Math.sin(t / 120) * 0.5;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.3, s * 0.06, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#8a5a2b'; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x + s * 0.22, y - s * 0.22); ctx.lineTo(x + s * 0.36, y - s * 0.34 + wag * s * 0.1); ctx.stroke();
  ctx.fillStyle = '#b0773d';
  ctx.beginPath(); ctx.ellipse(x + s * 0.05, y - s * 0.18, s * 0.22, s * 0.12, 0, 0, 7); ctx.fill();
  ctx.fillRect(x - s * 0.12, y - s * 0.12, s * 0.06, s * 0.12); ctx.fillRect(x + s * 0.16, y - s * 0.12, s * 0.06, s * 0.12);
  ctx.beginPath(); ctx.arc(x - s * 0.17, y - s * 0.3, s * 0.13, 0, 7); ctx.fill();
  ctx.fillStyle = '#6e4420'; ctx.beginPath(); ctx.ellipse(x - s * 0.26, y - s * 0.28, s * 0.05, s * 0.1, 0.4, 0, 7); ctx.fill();
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x - s * 0.21, y - s * 0.32, s * 0.02, 0, 7); ctx.arc(x - s * 0.29, y - s * 0.27, s * 0.025, 0, 7); ctx.fill();
  ctx.lineCap = 'butt';
}

// Cerca do lado de trás ('back') ou da frente ('front') de uma área cols×rows.
function drawFence(cols, rows, side) {
  const W = L.W, e = -0.14;
  const post = p => {
    ctx.fillStyle = '#a4703f'; ctx.fillRect(p.x - W * 0.025, p.y - W * 0.2, W * 0.05, W * 0.2);
    ctx.fillStyle = '#c99260'; ctx.fillRect(p.x - W * 0.025, p.y - W * 0.2, W * 0.05, W * 0.03);
  };
  const run = (c0, r0, c1, r1, steps, skipFirst) => {
    const a = iso(c0, r0), b = iso(c1, r1);
    for (const h of [0.08, 0.16]) line({ x: a.x, y: a.y - W * h }, { x: b.x, y: b.y - W * h }, '#b98050', W * 0.03);
    for (let k = skipFirst ? 1 : 0; k <= steps; k++) post(lerp(a, b, k / steps));
  };
  if (side === 'back') { run(e, e, cols - e, e, cols * 2); run(e, e, e, rows - e, rows * 2, true); }
  else { run(e, rows - e, cols - e, rows - e, cols * 2, true); run(cols - e, e, cols - e, rows - e, rows * 2, true); }
}

// ============================================================
// Plantas, pragas e produtos
// ============================================================
function leaf(x, y, len, wid, ang, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.ellipse(0, -len / 2, wid, len / 2, 0, 0, 7);
  ctx.fillStyle = col; ctx.fill();
  ctx.strokeStyle = 'rgba(20,50,10,.35)'; ctx.lineWidth = Math.max(0.8, wid * 0.18); ctx.stroke();
  ctx.restore();
}
function ball(x, y, r, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.45)'; ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.3, 0, 7); ctx.fill();
}

// Planta com a base em (x, y); s = escala.
function drawPlant(x, y, s, crop, stage, t, withered) {
  const sway = Math.sin(t / 700 + x * 0.05) * 0.08;
  const G = '#4fa83a', GD = '#3a8a2c', GL = '#6cc24a';
  if (withered) {
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2 * s; ctx.lineCap = 'round';
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(x + d * 3 * s, y); ctx.quadraticCurveTo(x + d * 5 * s, y - 14 * s, x + d * 11 * s, y - 6 * s); ctx.stroke(); }
    leaf(x - 8 * s, y - 2 * s, 7 * s, 2.5 * s, -1.6, '#a88b55');
    ctx.lineCap = 'butt';
    return;
  }
  if (stage === 0) {
    ctx.fillStyle = '#4a2c14';
    for (const [dx, dy] of [[-4, 0], [3, -1], [0, 2]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, 1.6 * s, 1.1 * s, 0, 0, 7); ctx.fill(); }
  } else if (stage === 1) {
    ctx.strokeStyle = GD; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 5 * s); ctx.stroke();
    leaf(x, y - 4 * s, 8 * s, 3 * s, -0.8 + sway, GL); leaf(x, y - 4 * s, 8 * s, 3 * s, 0.8 + sway, GL);
  } else if (stage === 2) {
    for (const a of [-1.0, -0.35, 0.35, 1.0]) leaf(x, y, 14 * s, 4 * s, a + sway, G);
  } else {
    const ripeNow = stage === 4;
    switch (crop.tipo) {
      case 'raiz': {
        if (ripeNow) {
          ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x, y - 1 * s, 6.5 * s, 4.5 * s, 0, 0, 7); ctx.fill();
          ctx.fillStyle = crop.cor2; ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 6 * s, 2.4 * s, 0, 0, 7); ctx.fill();
        }
        for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) leaf(x, y - 3 * s, (ripeNow ? 22 : 18) * s, 4.2 * s, a + sway, a === 0 ? GL : G);
        break;
      }
      case 'alto': {
        const h = (ripeNow ? 40 : 32) * s;
        ctx.strokeStyle = '#5a9e33'; ctx.lineWidth = 3.2 * s;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + sway * 20 * s, y - h); ctx.stroke();
        for (const [k, a] of [[0.2, -1.2], [0.35, 1.2], [0.55, -1.1], [0.72, 1.1]]) leaf(x + sway * 20 * s * k, y - h * k, 17 * s, 3.2 * s, a + sway, k > 0.5 ? GL : G);
        if (ripeNow) {
          ctx.save(); ctx.translate(x + sway * 10 * s + 4 * s, y - h * 0.5); ctx.rotate(0.35);
          ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(0, 0, 3.6 * s, 8.5 * s, 0, 0, 7); ctx.fill();
          ctx.fillStyle = 'rgba(160,110,0,.4)'; for (let k = -2; k <= 2; k++) ctx.fillRect(-2.6 * s, k * 3 * s, 5.2 * s, 0.8 * s);
          ctx.restore();
          leaf(x + 2 * s, y - h * 0.38, 12 * s, 2.6 * s, 0.7, '#7fbf4a');
        }
        ctx.strokeStyle = '#d9b25a'; ctx.lineWidth = 1.3 * s;
        const tx = x + sway * 20 * s, ty = y - h;
        for (const a of [-0.6, 0, 0.6]) { ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.sin(a) * 6 * s, ty - Math.cos(a) * 6 * s); ctx.stroke(); }
        break;
      }
      case 'moita':
      case 'pendente': {
        const small = crop.pequeno, r = (small ? 7.5 : 9.5) * s, cy = y - (small ? 7 : 11) * s;
        ctx.fillStyle = GD; ctx.beginPath(); ctx.arc(x - r * 0.6, cy + r * 0.2, r * 0.8, 0, 7); ctx.arc(x + r * 0.6, cy + r * 0.2, r * 0.8, 0, 7); ctx.fill();
        ctx.fillStyle = G; ctx.beginPath(); ctx.arc(x + sway * 6 * s, cy - r * 0.2, r, 0, 7); ctx.fill();
        ctx.fillStyle = GL; ctx.beginPath(); ctx.arc(x - r * 0.3 + sway * 6 * s, cy - r * 0.5, r * 0.45, 0, 7); ctx.fill();
        if (crop.tipo === 'moita') {
          const col = ripeNow ? crop.cor : '#a4cf45', fr = (small ? 2.6 : 3.3) * s, k = r / (9.5 * s);
          for (const [dx, dy] of [[-6, -1], [5, -4], [1, 3], [-2, -9], [7, 3]]) ball(x + dx * s * k, cy + dy * s * k, fr, col);
        } else {
          const col = ripeNow ? crop.cor : '#9bc36a';
          for (const dx of [-6, 1, 7]) {
            const fx = x + dx * s, fy = cy + r * 0.55;
            ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fy + 4 * s, 2.8 * s, (ripeNow ? 6 : 4) * s, 0.1, 0, 7); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.ellipse(fx - 1 * s, fy + 2 * s, 0.8 * s, 2 * s, 0.1, 0, 7); ctx.fill();
            ctx.fillStyle = '#3f7a2a'; ctx.beginPath(); ctx.ellipse(fx, fy - 1 * s, 2.4 * s, 1.4 * s, 0, 0, 7); ctx.fill();
          }
        }
        break;
      }
      case 'chao': {
        for (const [dx, dy, a] of [[-10, 0, -1.4], [10, -1, 1.4], [-5, -4, -0.6], [6, -5, 0.7], [0, 2, 0]]) {
          ctx.save(); ctx.translate(x + dx * s, y + dy * s); ctx.scale(1, 0.55);
          leaf(0, 0, 13 * s, 6 * s, a, a === 0 ? GL : G); ctx.restore();
        }
        if (ripeNow) {
          const rx = 11 * s, ry = 8 * s, fy = y - 5 * s;
          ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x, fy, rx, ry, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = crop.cor2; ctx.lineWidth = (crop.id === 'melancia' ? 2 : 1.2) * s;
          for (const k of [-0.6, -0.2, 0.2, 0.6]) { ctx.beginPath(); ctx.ellipse(x + k * rx * 0.9, fy, rx * 0.22, ry * 0.95, 0, -1.4, 1.4); ctx.stroke(); }
          ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(x - rx * 0.4, fy - ry * 0.4, rx * 0.25, ry * 0.18, -0.4, 0, 7); ctx.fill();
          ctx.strokeStyle = '#6b4a1a'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, fy - ry); ctx.lineTo(x + 2 * s, fy - ry - 3 * s); ctx.stroke();
        } else {
          ctx.fillStyle = '#9cc85a'; ctx.beginPath(); ctx.ellipse(x + 2 * s, y - 3 * s, 5 * s, 4 * s, 0, 0, 7); ctx.fill();
        }
        break;
      }
    }
  }
}

function drawWeed(x, y, s) {
  ctx.strokeStyle = '#2d5e1a'; ctx.lineWidth = 1.4 * s; ctx.lineCap = 'round';
  for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(a) * 9 * s, y - Math.cos(a) * 9 * s); ctx.stroke(); }
  ctx.fillStyle = '#f5d33a'; ctx.beginPath(); ctx.arc(x + 1 * s, y - 9 * s, 1.8 * s, 0, 7); ctx.fill();
  ctx.lineCap = 'butt';
}
function drawBug(x, y, s, t, k) {
  const a = t / 500 + k * 2.3;
  const bx = x + Math.cos(a) * 5 * s, by = y + Math.sin(a) * 2.5 * s;
  ctx.save(); ctx.translate(bx, by); ctx.rotate(a + Math.PI / 2);
  ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = 0.8 * s;
  for (const d of [-1, 1]) for (const e of [-1.5, 0, 1.5]) { ctx.beginPath(); ctx.moveTo(0, e * s); ctx.lineTo(d * 3.5 * s, e * s + Math.sin(t / 60 + e) * s); ctx.stroke(); }
  ctx.fillStyle = '#3b2a18'; ctx.beginPath(); ctx.ellipse(0, 0, 2.4 * s, 3.4 * s, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7d9a2a'; ctx.beginPath(); ctx.ellipse(0, 0.6 * s, 1.8 * s, 2.3 * s, 0, 0, 7); ctx.fill();
  ctx.restore();
}

// Produtos dos animais, centrados em (x, y); s ≈ 1/10 do tamanho.
function drawProduct(id, x, y, s) {
  ctx.lineWidth = Math.max(1, 0.6 * s);
  if (id === 'ovo') {
    ctx.fillStyle = '#fff6df'; ctx.strokeStyle = '#cdb88c';
    ctx.beginPath(); ctx.ellipse(x, y + 1 * s, 4.6 * s, 6 * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(x - 1.6 * s, y - 1.5 * s, 1.1 * s, 1.8 * s, 0.3, 0, 7); ctx.fill();
  } else if (id === 'leite') {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9fb4c8';
    ctx.beginPath(); ctx.moveTo(x - 4 * s, y + 7 * s); ctx.lineTo(x - 4 * s, y - 1 * s); ctx.lineTo(x - 2 * s, y - 4 * s); ctx.lineTo(x + 2 * s, y - 4 * s); ctx.lineTo(x + 4 * s, y - 1 * s); ctx.lineTo(x + 4 * s, y + 7 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#3a7bd5'; ctx.fillRect(x - 2.3 * s, y - 6.5 * s, 4.6 * s, 2.6 * s);
    ctx.fillRect(x - 4 * s, y + 1.5 * s, 8 * s, 2.4 * s);
  } else if (id === 'la') {
    ctx.fillStyle = '#f3eee2'; ctx.strokeStyle = '#c8bda2';
    ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, 7); ctx.fill(); ctx.stroke();
    for (const a of [-0.8, 0, 0.8]) { ctx.beginPath(); ctx.ellipse(x, y, 6 * s, 2.5 * s, a + 1.2, 0, Math.PI); ctx.stroke(); }
  } else if (id === 'trufa') {
    ctx.fillStyle = '#5b3a24';
    ctx.beginPath(); ctx.arc(x, y + 1 * s, 5.5 * s, 0, 7); ctx.arc(x - 3 * s, y - 2 * s, 3 * s, 0, 7); ctx.arc(x + 3 * s, y - 1.5 * s, 3.2 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#8a6448';
    for (const [dx, dy] of [[-2, 0], [2, 2], [0, -3], [3, -2]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, 0.8 * s, 0, 7); ctx.fill(); }
  }
}

// ============================================================
// Animais (desenhados virados para a direita; dir=-1 espelha)
// ============================================================
function drawAnimal(k, x, y, s, t, dir, moving) {
  const step = moving ? Math.sin(t / 90) : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  const shadow = { galinha: 9, vaca: 22, ovelha: 16, porco: 16 }[k];
  ctx.beginPath(); ctx.ellipse(0, 0, shadow * s, shadow * 0.28 * s, 0, 0, 7); ctx.fill();
  const leg = (lx, len, col, w) => { ctx.fillStyle = col; ctx.fillRect(lx * s - w * s / 2, -len * s, w * s, len * s); };
  if (k === 'galinha') {
    ctx.strokeStyle = '#e8a02a'; ctx.lineWidth = 1.4 * s;
    ctx.beginPath(); ctx.moveTo(-2 * s, -5 * s); ctx.lineTo(-2 * s + step * 1.5 * s, 0); ctx.moveTo(2 * s, -5 * s); ctx.lineTo(2 * s - step * 1.5 * s, 0); ctx.stroke();
    ctx.fillStyle = '#f7f4ea';
    ctx.beginPath(); ctx.moveTo(-8 * s, -12 * s); ctx.lineTo(-12 * s, -19 * s); ctx.lineTo(-5 * s, -15 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -10 * s, 9 * s, 6.5 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d3cbb5'; ctx.lineWidth = 0.8 * s; ctx.stroke();
    ctx.fillStyle = '#e9e3d1'; ctx.beginPath(); ctx.ellipse(-1 * s, -10 * s, 5 * s, 3.4 * s, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7f4ea'; ctx.beginPath(); ctx.arc(6.5 * s, -17 * s, 4.3 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#e03a2f'; ctx.beginPath(); ctx.arc(5 * s, -21.5 * s, 1.6 * s, 0, 7); ctx.arc(7.2 * s, -22 * s, 1.7 * s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9.5 * s, -14 * s, 1.1 * s, 1.8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.moveTo(10.3 * s, -18 * s); ctx.lineTo(13.5 * s, -16.8 * s); ctx.lineTo(10.3 * s, -15.6 * s); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(7.6 * s, -18 * s, 0.8 * s, 0, 7); ctx.fill();
  } else if (k === 'vaca') {
    for (const [lx, ph] of [[-12, 1], [-6, -1], [6, -1], [12, 1]]) { leg(lx + step * ph, 11, '#f1ede5', 3.2); ctx.fillStyle = '#3a2a1e'; ctx.fillRect((lx + step * ph) * s - 1.6 * s, -2 * s, 3.2 * s, 2 * s); }
    ctx.strokeStyle = '#8a7a6a'; ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.moveTo(-17 * s, -20 * s); ctx.quadraticCurveTo(-21 * s, -14 * s, -20 * s, -8 * s); ctx.stroke();
    ctx.fillStyle = '#3a2a1e'; ctx.beginPath(); ctx.ellipse(-20 * s, -7 * s, 1.4 * s, 2.2 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7f4ee'; ctx.beginPath(); ctx.ellipse(0, -18 * s, 18 * s, 9.5 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#cfc6b8'; ctx.lineWidth = 0.8 * s; ctx.stroke();
    ctx.fillStyle = '#2e2622';
    for (const [dx, dy, rx, ry] of [[-7, -20, 5, 4], [6, -15, 4, 3], [-12, -14, 3, 3], [9, -23, 3, 2.4]]) { ctx.beginPath(); ctx.ellipse(dx * s, dy * s, rx * s, ry * s, 0.3, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#f2a7b0'; ctx.beginPath(); ctx.ellipse(3 * s, -9 * s, 4 * s, 2.4 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#efe6c8'; ctx.beginPath(); ctx.moveTo(15 * s, -29 * s); ctx.lineTo(14 * s, -34 * s); ctx.lineTo(17 * s, -30 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(20 * s, -29 * s); ctx.lineTo(21 * s, -34 * s); ctx.lineTo(22 * s, -29 * s); ctx.fill();
    ctx.fillStyle = '#f7f4ee'; ctx.beginPath(); ctx.ellipse(19 * s, -24 * s, 6.5 * s, 6 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2e2622'; ctx.beginPath(); ctx.ellipse(12.5 * s, -27 * s, 3.2 * s, 1.6 * s, -0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2a7b0'; ctx.beginPath(); ctx.ellipse(22 * s, -20.5 * s, 4.6 * s, 3.4 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7a4a4a'; ctx.beginPath(); ctx.arc(21 * s, -20.5 * s, 0.7 * s, 0, 7); ctx.arc(23.6 * s, -20.5 * s, 0.7 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(19.5 * s, -26 * s, 1 * s, 0, 7); ctx.fill();
  } else if (k === 'ovelha') {
    for (const [lx, ph] of [[-8, 1], [-4, -1], [4, -1], [8, 1]]) leg(lx + step * ph, 8, '#2e2a28', 2.2);
    ctx.fillStyle = '#f5f1e8'; ctx.strokeStyle = '#d5ccb8'; ctx.lineWidth = 0.8 * s;
    for (const [dx, dy, r] of [[-8, -13, 6], [-2, -17, 7], [5, -15, 6.5], [0, -11, 6.5], [-6, -18, 5], [8, -11, 5]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#2e2a28'; ctx.beginPath(); ctx.ellipse(13 * s, -18 * s, 4.6 * s, 3.8 * s, 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(10 * s, -21 * s, 2.6 * s, 1.2 * s, -0.6, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5f1e8'; ctx.beginPath(); ctx.arc(11 * s, -22 * s, 3 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(14.5 * s, -19 * s, 0.9 * s, 0, 7); ctx.fill();
  } else if (k === 'porco') {
    for (const [lx, ph] of [[-9, 1], [-4, -1], [5, -1], [10, 1]]) leg(lx + step * ph, 6, '#e991a0', 3);
    ctx.strokeStyle = '#e07f90'; ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.arc(-16 * s, -14 * s, 2 * s, 0, 5); ctx.stroke();
    ctx.fillStyle = '#f5aebb'; ctx.beginPath(); ctx.ellipse(0, -12 * s, 15 * s, 8.5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f7bcc7'; ctx.beginPath(); ctx.ellipse(-2 * s, -15 * s, 9 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5aebb'; ctx.beginPath(); ctx.arc(13 * s, -15 * s, 6.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#e991a0'; ctx.beginPath(); ctx.moveTo(9 * s, -20 * s); ctx.lineTo(11 * s, -25 * s); ctx.lineTo(14 * s, -20 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(19 * s, -14 * s, 2.8 * s, 3.4 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8606e'; ctx.beginPath(); ctx.arc(18.6 * s, -15 * s, 0.7 * s, 0, 7); ctx.arc(19.6 * s, -13 * s, 0.7 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(14.5 * s, -17.5 * s, 0.9 * s, 0, 7); ctx.fill();
  }
  ctx.restore();
}
const ANIMAL_H = { galinha: 24, vaca: 34, ovelha: 25, porco: 25 };

// ============================================================
// Balões de aviso
// ============================================================
function drawBubbleAt(x, y, kind, obj, t, seed) {
  const W = L.W, R = clamp(W * 0.13, 11, 20);
  y += Math.sin(t / 300 + seed) * W * 0.02;
  ctx.fillStyle = '#fffdf2'; ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - R * 0.3, y + R * 0.9); ctx.lineTo(x, y + R * 1.45); ctx.lineTo(x + R * 0.3, y + R * 0.9); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - R * 0.3, y + R * 0.95); ctx.lineTo(x, y + R * 1.45); ctx.lineTo(x + R * 0.3, y + R * 0.95); ctx.stroke();
  const s = R / 11;
  if (kind === 'water') {
    ctx.fillStyle = '#3aa0e8'; ctx.beginPath(); ctx.moveTo(x, y - 7 * s);
    ctx.bezierCurveTo(x + 6 * s, y, x + 5 * s, y + 6 * s, x, y + 6 * s); ctx.bezierCurveTo(x - 5 * s, y + 6 * s, x - 6 * s, y, x, y - 7 * s); ctx.fill();
  } else if (kind === 'pest') drawBug(x, y, s * 1.3, 0, 0);
  else if (kind === 'weed') drawWeed(x, y + 5 * s, s * 1.1);
  else if (kind === 'hoe') {
    line({ x: x - 6 * s, y: y + 6 * s }, { x: x + 4 * s, y: y - 5 * s }, '#8a5a2b', 2 * s);
    ctx.fillStyle = '#8f9aa3'; ctx.beginPath(); ctx.moveTo(x + 1 * s, y - 7 * s); ctx.lineTo(x + 8 * s, y - 2 * s); ctx.lineTo(x + 6 * s, y); ctx.lineTo(x + 2 * s, y - 4 * s); ctx.fill();
  } else if (kind === 'ripe') {
    const crop = CROP[obj.c]; ball(x, y + 1 * s, 5.5 * s, crop.cor);
    leaf(x, y - 4 * s, 5 * s, 1.8 * s, 0.6, '#4fa83a');
  } else if (kind === 'prod') {
    drawProduct(ANIMAL[obj.k].prod, x, y, s * 0.95);
  } else if (kind === 'feed') {
    ctx.fillStyle = '#f2c14e';
    for (const [dx, dy] of [[-3, 2], [0, -1], [3, 2], [-1.5, 5], [1.5, 5], [0, 2]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s - 1 * s, 1.5 * s, 2.2 * s, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#b8862a'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x, y - 2 * s); ctx.stroke();
  }
  if (kind === 'ripe' || kind === 'prod') {
    ctx.fillStyle = '#ffd54a'; const sp = 1 + Math.sin(t / 200 + seed) * 0.3;
    ctx.beginPath(); ctx.arc(x + 7 * s, y - 6 * s, 1.5 * s * sp, 0, 7); ctx.fill();
  }
}

// ============================================================
// Cena: roça
// ============================================================
function diamond(c, r, inset) {
  return [iso(c + inset, r + inset), iso(c + 1 - inset, r + inset), iso(c + 1 - inset, r + 1 - inset), iso(c + inset, r + 1 - inset)];
}
const PLANT_SPOTS = [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]];
const BIG_SPOTS = [[0.62, 0.34], [0.36, 0.64]];
const WEED_SPOTS = [[0.5, 0.16], [0.86, 0.55], [0.16, 0.86]];

function drawPlot(i, p, t, home) {
  const c = i % COLS, r = Math.floor(i / COLS), W = L.W;
  const [p1, p2, p3, p4] = diamond(c, r, 0.05);
  const hov = hover && hover.kind === 'plot' && hover.i === i;
  if (p.s === 'locked') {
    quad(p1, p2, p3, p4, 'rgba(255,255,255,.07)', 'rgba(40,90,20,.22)', 1);
    if (home && i === nextLot()) {
      ctx.setLineDash([4, 4]); quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.7)', 2); ctx.setLineDash([]);
      const m = cellCenter(i);
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(m.x - W * 0.03, m.y - W * 0.3, W * 0.06, W * 0.3);
      const bw = W * 0.56, bh = W * 0.26;
      ctx.fillStyle = '#d39a5c'; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 2;
      ctx.fillRect(m.x - bw / 2, m.y - W * 0.47, bw, bh); ctx.strokeRect(m.x - bw / 2, m.y - W * 0.47, bw, bh);
      ctx.fillStyle = '#4a2a10'; ctx.font = `800 ${Math.round(clamp(W * 0.11, 9, 15))}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('À venda', m.x, m.y - W * 0.405);
      ctx.fillText(`${lotCost(state.owned)}`, m.x, m.y - W * 0.29);
    }
    if (hov) quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.9)', 2);
    return;
  }
  const d = W * 0.07;
  const dry = p.s === 'growing' && p.dry;
  const dn = pt => ({ x: pt.x, y: pt.y + d });
  quad(p4, p3, dn(p3), dn(p4), '#5e3a1c');
  quad(p3, p2, dn(p2), dn(p3), '#4a2c14');
  quad(p1, p2, p3, p4, dry ? '#b88a58' : p.s === 'withered' ? '#94704a' : '#8b5a33');
  for (let k = 1; k <= 3; k++) line(lerp(p1, p4, k / 4), lerp(p2, p3, k / 4), dry ? 'rgba(120,80,40,.5)' : 'rgba(60,34,14,.5)', Math.max(1, W * 0.018));
  if (dry) {
    const m = cellCenter(i); ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.x - W * .15, m.y); ctx.lineTo(m.x - W * .05, m.y + W * .03); ctx.lineTo(m.x + W * .02, m.y - W * .02); ctx.lineTo(m.x + W * .14, m.y + W * .02); ctx.stroke();
  }
  if (hov) quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.95)', 2.5);
  if (p.s === 'growing' || p.s === 'withered') {
    const crop = CROP[p.c];
    for (let k = 0; k < p.w; k++) { const [u, v] = WEED_SPOTS[k]; const q = iso(c + u, r + v); drawWeed(q.x, q.y, W / 100); }
    const st = p.s === 'growing' ? stageOf(p) : 4;
    const big = crop && crop.tipo === 'chao' && st >= 3;
    const s = W / 100 * (big ? 1.25 : 0.72) * (st === 0 ? 1.2 : 1);
    for (const [u, v] of (big ? BIG_SPOTS : PLANT_SPOTS)) { const q = iso(c + u, r + v); drawPlant(q.x, q.y, s, crop, st, t, p.s === 'withered'); }
    for (let k = 0; k < p.b; k++) { const q = iso(c + 0.45 + k * 0.15, r + 0.5); drawBug(q.x, q.y, W / 100, t, k + i); }
  }
}

function plotBubble(p, home) {
  if (p.s === 'withered') return home ? 'hoe' : null;
  if (p.s !== 'growing') return null;
  if (p.b) return 'pest';
  if (p.w) return 'weed';
  if (p.dry) return 'water';
  if (ripe(p) && (home || !(p.stolen || state.log[visitKey(p.id)]))) return 'ripe';
  return null;
}

function drawRoca(s, t, home) {
  const tod = timeOfDay(), W = L.W;
  drawSky(t, tod); drawGround();
  if (home) drawBarn(L.ox - W * 1.9, L.oy + W * 0.3, W * 1.15);
  else drawHouse(L.ox - W * 1.9, L.oy + W * 0.3, W * 1.15, view.casa);
  drawTree(L.ox + W * 2.6, L.oy + W * 0.5, W * 1.0, t);
  drawTree(L.ox + W * 3.6, L.oy + W * 1.1, W * 0.8, t);
  if (!home) { const q = iso(-0.55, 1.6); drawDog(q.x, q.y, W * 0.7, t); }
  drawFence(COLS, ROWS, 'back');
  for (let sum = 0; sum <= COLS + ROWS - 2; sum++)
    for (let c = 0; c < COLS; c++) { const r = sum - c; if (r >= 0 && r < ROWS) drawPlot(r * COLS + c, s.plots[r * COLS + c], t, home); }
  nightOverlay(tod);
  for (let i = 0; i < N; i++) {
    const k = plotBubble(s.plots[i], home);
    if (k) { const m = cellCenter(i); drawBubbleAt(m.x, m.y - W * 0.55, k, s.plots[i], t, i); }
  }
}

// ============================================================
// Cena: animais
// ============================================================
const DIRT = [[1.2, 2.2, .5], [3.6, 1.6, .4], [4.4, 3.1, .45], [2.4, 3.3, .35]];
function drawPen(s, t, home, dt) {
  const tod = timeOfDay(), W = L.W;
  drawSky(t, tod); drawGround();
  drawCoop(L.ox - W * 1.8, L.oy + W * 0.35, W * 1.2);
  drawTree(L.ox + W * 2.3, L.oy + W * 0.45, W * 0.9, t);
  if (!home) { const q = iso(-0.6, 3.0); drawDog(q.x, q.y, W * 0.6, t); }
  quad(iso(0, 0), iso(PEN_C, 0), iso(PEN_C, PEN_R), iso(0, PEN_R), '#a9d36c');
  ctx.fillStyle = 'rgba(170,130,70,.35)';
  for (const [c, r, k] of DIRT) { const q = iso(c, r); ctx.beginPath(); ctx.ellipse(q.x, q.y, W * k, W * k * 0.45, 0, 0, 7); ctx.fill(); }
  drawFence(PEN_C, PEN_R, 'back');
  // cocho com ração e fardo de feno
  isoBox(0.6, 0.15, 2.4, 0.55, 0, 0.2, '#e3bf62', '#8a5a33', '#6e4424');
  ctx.fillStyle = '#c9a24a'; for (let k = 0; k < 8; k++) { const q = P(0.75 + k * 0.2, 0.35, 0.2); ctx.fillRect(q.x - 1, q.y - 2, 2, 2); }
  isoBox(4.9, 0.15, 5.8, 0.8, 0, 0.35, '#efcf6a', '#d6b24c', '#bf9a3e');
  line(P(4.9, 0.8, 0.12), P(5.8, 0.8, 0.12), '#a8852e', 1.5); line(P(4.9, 0.8, 0.24), P(5.8, 0.8, 0.24), '#a8852e', 1.5);

  updateWander(s.animals, dt);
  const list = s.animals.map(a => ({ a, m: amb[a.id] })).sort((x, y) => (x.m.u + x.m.v) - (y.m.u + y.m.v));
  const sc = W / 100 * 1.15;
  for (const { a, m } of list) {
    const p = iso(m.u, m.v);
    if (hover && hover.kind === 'animal' && hover.id === a.id) {
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, W * 0.26, W * 0.09, 0, 0, 7); ctx.stroke();
    }
    drawAnimal(a.k, p.x, p.y, sc, t, m.dir, m.moving);
    hits.push({ kind: 'animal', id: a.id, x: p.x, y: p.y - ANIMAL_H[a.k] * sc * 0.5, r: Math.max(W * 0.22, ANIMAL_H[a.k] * sc * 0.7) });
  }
  drawFence(PEN_C, PEN_R, 'front');
  nightOverlay(tod);
  for (const { a, m } of list) {
    const took = !home && (a.stolen || state.log[visitKey(a.id + ':' + a.n)]);
    const k = a.ready && !took ? 'prod' : (!a.fed && !a.ready) ? 'feed' : null;
    if (k) { const p = iso(m.u, m.v); drawBubbleAt(p.x, p.y - ANIMAL_H[a.k] * sc - W * 0.2, k, a, t, m.u * 7); }
  }
  if (!s.animals.length) {
    const q = iso(PEN_C / 2, PEN_R / 2);
    ctx.fillStyle = '#4a2a10'; ctx.font = `800 ${Math.round(clamp(W * 0.16, 13, 20))}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(home ? 'Compre animais na Loja' : 'Nenhum animal por aqui', q.x, q.y);
  }
}

// ============================================================
// Cena: casa
// ============================================================
const DRAW_DECOR = {
  quadro() {
    quad(P(3.1, 0, 0.72), P(4.3, 0, 0.72), P(4.3, 0, 1.12), P(3.1, 0, 1.12), '#c9962e', '#8a6420', 1.5);
    quad(P(3.18, 0, 0.77), P(4.22, 0, 0.77), P(4.22, 0, 1.07), P(3.18, 0, 1.07), '#9fd6f2');
    poly([P(3.18, 0, 0.77), P(4.22, 0, 0.77), P(4.22, 0, 0.86), P(3.7, 0, 0.93), P(3.18, 0, 0.87)]); ctx.fillStyle = '#5ea83a'; ctx.fill();
    const sun = P(3.98, 0, 1.0); ctx.fillStyle = '#ffd54a'; ctx.beginPath(); ctx.arc(sun.x, sun.y, L.W * 0.04, 0, 7); ctx.fill();
    const h = P(3.45, 0, 0.9); ctx.fillStyle = '#c8402f'; ctx.fillRect(h.x - L.W * 0.035, h.y - L.W * 0.03, L.W * 0.07, L.W * 0.05);
  },
  tapete() {
    quad(P(1.3, 1.4), P(3.9, 1.4), P(3.9, 3.9), P(1.3, 3.9), '#b8433a');
    quad(P(1.5, 1.6), P(3.7, 1.6), P(3.7, 3.7), P(1.5, 3.7), null, '#f2c14e', 2);
    quad(P(2.6, 2.05), P(3.2, 2.65), P(2.6, 3.25), P(2.0, 2.65), '#f2c14e');
    quad(P(2.6, 2.35), P(2.9, 2.65), P(2.6, 2.95), P(2.3, 2.65), '#b8433a');
    for (let k = 0; k <= 12; k++) { const a = P(1.3 + k * 2.6 / 12, 3.9), b = P(1.3 + k * 2.6 / 12, 4.0); line(a, b, '#f2c14e', 1.2); }
  },
  abajur(t) {
    const b = P(0.6, 0.6, 0), top = P(0.6, 0.6, 1.05), bot = P(0.6, 0.6, 0.8), W = L.W;
    const night = timeOfDay() !== 'dia';
    const g = ctx.createRadialGradient(bot.x, bot.y, 0, bot.x, bot.y, W * 1.3);
    g.addColorStop(0, `rgba(255,233,160,${night ? 0.5 : 0.22})`); g.addColorStop(1, 'rgba(255,233,160,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bot.x, bot.y, W * 1.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a3a22'; ctx.beginPath(); ctx.ellipse(b.x, b.y, W * 0.12, W * 0.05, 0, 0, 7); ctx.fill();
    line(b, bot, '#5a3a22', W * 0.025);
    poly([{ x: top.x - W * 0.09, y: top.y }, { x: top.x + W * 0.09, y: top.y }, { x: bot.x + W * 0.16, y: bot.y }, { x: bot.x - W * 0.16, y: bot.y }]);
    ctx.fillStyle = '#f6d27a'; ctx.fill(); ctx.strokeStyle = '#c99a3c'; ctx.lineWidth = 1.5; ctx.stroke();
  },
  tv(t) {
    isoBox(2.9, 0.1, 4.4, 0.65, 0, 0.28, '#9a6a3e', '#7a4a22', '#653c1b');
    line(P(3.65, 0.65, 0.05), P(3.65, 0.65, 0.23), '#4a2c14', 1.5);
    isoBox(3.1, 0.18, 4.2, 0.4, 0.28, 0.74, '#3a3a3a', '#2a2a2a', '#1e1e1e');
    const hue = (t / 60) % 360;
    quad(P(3.18, 0.4, 0.34), P(4.12, 0.4, 0.34), P(4.12, 0.4, 0.68), P(3.18, 0.4, 0.68), `hsl(${hue}, 45%, 58%)`);
    const k = (Math.sin(t / 600) + 1) / 2, q = P(3.3 + k * 0.7, 0.4, 0.46);
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.arc(q.x, q.y, L.W * 0.035, 0, 7); ctx.fill();
    line(P(3.65, 0.29, 0.74), P(3.3, 0.29, 0.98), '#555', 1.5); line(P(3.65, 0.29, 0.74), P(4.0, 0.29, 0.98), '#555', 1.5);
  },
  sofa() {
    isoBox(0.1, 1.0, 1.0, 2.9, 0, 0.3, '#5c9a78', '#4a8466', '#3f7358');
    quad(P(0.42, 1.25, 0.3), P(0.95, 1.25, 0.3), P(0.95, 1.9, 0.3), P(0.42, 1.9, 0.3), '#6fb08c');
    quad(P(0.42, 2.0, 0.3), P(0.95, 2.0, 0.3), P(0.95, 2.65, 0.3), P(0.42, 2.65, 0.3), '#6fb08c');
    isoBox(0.1, 1.0, 0.38, 2.9, 0.3, 0.7, '#5c9a78', '#4a8466', '#3f7358');
    isoBox(0.1, 1.0, 1.0, 1.22, 0.3, 0.46, '#66a482', '#4a8466', '#3f7358');
    isoBox(0.1, 2.68, 1.0, 2.9, 0.3, 0.46, '#66a482', '#4a8466', '#3f7358');
  },
  vaso(t) {
    isoBox(4.15, 4.05, 4.65, 4.55, 0, 0.28, '#d0703f', '#b85e33', '#9c4e2a');
    quad(P(4.18, 4.08, 0.28), P(4.62, 4.08, 0.28), P(4.62, 4.52, 0.28), P(4.18, 4.52, 0.28), '#5a3a20');
    const b = P(4.4, 4.3, 0.28), W = L.W, sw = Math.sin(t / 900) * 0.05;
    [-1.1, -0.6, -0.15, 0.3, 0.75, 1.15].forEach((a, i) => leaf(b.x, b.y, W * (0.32 + (i % 2) * 0.08), W * 0.055, a + sw, i % 2 ? '#4fa83a' : '#3a8a2c'));
    ctx.fillStyle = '#ef7aa0';
    for (const [dx, dy] of [[-0.08, -0.38], [0.1, -0.42], [0.02, -0.46]]) { ctx.beginPath(); ctx.arc(b.x + dx * W, b.y + dy * W, W * 0.035, 0, 7); ctx.fill(); }
  },
};
const DECOR_ORDER = ['quadro', 'tapete', 'abajur', 'tv', 'sofa', 'vaso'];
const DECOR_FOOT = {
  tapete: [1.3, 1.4, 3.9, 3.9], vaso: [4.1, 4.0, 4.7, 4.6], abajur: [0.35, 0.35, 0.85, 0.85],
  sofa: [0.1, 1.0, 1.0, 2.9], tv: [2.9, 0.1, 4.4, 0.65],
};
function decorCenter(id) { const [c, r, h] = DECOR_SPOT[id]; return P(c, r, h); }

function drawSlotHint(id) {
  ctx.setLineDash([5, 4]);
  if (id === 'quadro') quad(P(3.1, 0, 0.72), P(4.3, 0, 0.72), P(4.3, 0, 1.12), P(3.1, 0, 1.12), 'rgba(255,255,255,.12)', 'rgba(255,255,255,.75)', 1.5);
  else { const [c0, r0, c1, r1] = DECOR_FOOT[id]; quad(P(c0, r0), P(c1, r0), P(c1, r1), P(c0, r1), 'rgba(255,255,255,.12)', 'rgba(255,255,255,.75)', 1.5); }
  ctx.setLineDash([]);
  const m = decorCenter(id), R = clamp(L.W * 0.1, 9, 15);
  ctx.fillStyle = 'rgba(255,253,242,.95)'; ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 7); ctx.fill(); ctx.stroke();
  line({ x: m.x - R * 0.5, y: m.y }, { x: m.x + R * 0.5, y: m.y }, '#4f9a2f', 2.5);
  line({ x: m.x, y: m.y - R * 0.5 }, { x: m.x, y: m.y + R * 0.5 }, '#4f9a2f', 2.5);
}

function drawRoom(s, t, home) {
  const W = L.W, H = 1.3, tod = timeOfDay();
  const g = ctx.createRadialGradient(L.cw / 2, L.ch * 0.55, W * 0.5, L.cw / 2, L.ch * 0.55, L.cw * 0.7);
  g.addColorStop(0, '#6b4a30'); g.addColorStop(1, '#2e1f14');
  ctx.fillStyle = g; ctx.fillRect(0, 0, L.cw, L.ch);
  // piso de tábuas
  quad(P(0, ROOM, -0.12), P(ROOM, ROOM, -0.12), P(ROOM, ROOM), P(0, ROOM), '#5a3a20');
  quad(P(ROOM, 0, -0.12), P(ROOM, ROOM, -0.12), P(ROOM, ROOM), P(ROOM, 0), '#4a2f18');
  for (let k = 0; k < ROOM * 2; k++) {
    quad(P(k / 2, 0), P((k + 1) / 2, 0), P((k + 1) / 2, ROOM), P(k / 2, ROOM), k % 2 ? '#c48a52' : '#b98049');
    for (let j = 1; j <= 2; j++) { const r = (k * 1.7 + j * 2.1) % ROOM; line(P(k / 2, r), P((k + 1) / 2, r), 'rgba(0,0,0,.15)', 1); }
  }
  // paredes
  quad(P(0, 0), P(0, ROOM), P(0, ROOM, H), P(0, 0, H), '#e6cf9c');
  quad(P(0, 0), P(ROOM, 0), P(ROOM, 0, H), P(0, 0, H), '#f1dcae');
  for (let k = 0.25; k < ROOM; k += 0.5) {
    line(P(0, k, 0.08), P(0, k, H), 'rgba(160,110,60,.13)', 2);
    line(P(k, 0, 0.08), P(k, 0, H), 'rgba(160,110,60,.13)', 2);
  }
  quad(P(0, 0), P(0, ROOM), P(0, ROOM, 0.08), P(0, 0, 0.08), '#8a5a33');
  quad(P(0, 0), P(ROOM, 0), P(ROOM, 0, 0.08), P(0, 0, 0.08), '#9a6a3e');
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 4; poly([P(0, ROOM, H), P(0, 0, H), P(ROOM, 0, H)]); ctx.stroke();
  // janela
  quad(P(0.85, 0, 0.4), P(1.12, 0, 0.4), P(1.12, 0, 1.14), P(0.85, 0, 1.14), '#c8402f');
  quad(P(2.18, 0, 0.4), P(2.45, 0, 0.4), P(2.45, 0, 1.14), P(2.18, 0, 1.14), '#c8402f');
  quad(P(1.0, 0, 0.45), P(2.3, 0, 0.45), P(2.3, 0, 1.08), P(1.0, 0, 1.08), '#fffaf0');
  quad(P(1.08, 0, 0.52), P(2.22, 0, 0.52), P(2.22, 0, 1.0), P(1.08, 0, 1.0), SKIES[tod][1]);
  if (tod === 'noite') { const m = P(1.9, 0, 0.88); ctx.fillStyle = '#f4f1d0'; ctx.beginPath(); ctx.arc(m.x, m.y, W * 0.05, 0, 7); ctx.fill(); }
  else quad(P(1.08, 0, 0.52), P(2.22, 0, 0.52), P(2.22, 0, 0.66), P(1.08, 0, 0.72), '#7cbf4f');
  line(P(1.65, 0, 0.52), P(1.65, 0, 1.0), '#fffaf0', 3); line(P(1.08, 0, 0.76), P(2.22, 0, 0.76), '#fffaf0', 3);
  // porta
  quad(P(0, 3.4), P(0, 4.5), P(0, 4.5, 0.9), P(0, 3.4, 0.9), '#7a4a22', '#4a2c14', 2);
  quad(P(0, 3.55, 0.5), P(0, 4.35, 0.5), P(0, 4.35, 0.8), P(0, 3.55, 0.8), null, 'rgba(0,0,0,.25)', 1.5);
  quad(P(0, 3.55, 0.1), P(0, 4.35, 0.1), P(0, 4.35, 0.42), P(0, 3.55, 0.42), null, 'rgba(0,0,0,.25)', 1.5);
  const kn = P(0, 3.6, 0.45); ctx.fillStyle = '#e8c35a'; ctx.beginPath(); ctx.arc(kn.x, kn.y, W * 0.025, 0, 7); ctx.fill();
  // decorações
  for (const id of DECOR_ORDER) if (s.decor[id]) DRAW_DECOR[id](t);
  for (const id of DECOR_ORDER) {
    if (home && !s.decor[id]) drawSlotHint(id);
    if (home || s.decor[id]) { const m = decorCenter(id); hits.push({ kind: 'decor', id, x: m.x, y: m.y, r: W * 0.4 }); }
  }
  const hv = hover && hover.kind === 'decor' && decorCenter(hover.id);
  if (hv) { ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hv.x, hv.y, W * 0.42, 0, 7); ctx.stroke(); }
}

function drawPopups(t) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(clamp(L.W * 0.16, 12, 20))}px 'Baloo 2', sans-serif`;
  for (let k = popups.length - 1; k >= 0; k--) {
    const pp = popups[k], age = (t - pp.t0) / 1300;
    if (age < 0) continue;
    if (age > 1) { popups.splice(k, 1); continue; }
    ctx.globalAlpha = 1 - age * age;
    const y = pp.y - age * L.W * 0.5;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,24,8,.85)'; ctx.strokeText(pp.text, pp.x, y);
    ctx.fillStyle = pp.color; ctx.fillText(pp.text, pp.x, y);
  }
  ctx.globalAlpha = 1;
}

function draw(t, dt) {
  ctx.setTransform(L.dpr, 0, 0, L.dpr, 0, 0);
  layout(scene); hits = [];
  const s = S(), home = isHome();
  if (scene === 'roca') drawRoca(s, t, home);
  else if (scene === 'animais') drawPen(s, t, home, dt);
  else drawRoom(s, t, home);
  drawPopups(t);
}

// ============================================================
// Ícones para a loja e o celeiro
// ============================================================
const ICONS = {};
function makeIcon(key, fn) {
  if (ICONS[key]) return ICONS[key];
  const g = document.createElement('canvas'); g.width = g.height = 96;
  const saved = Object.assign({}, L);
  ctx = g.getContext('2d');
  try { fn(); } finally { ctx = mainCtx; Object.assign(L, saved); }
  return (ICONS[key] = g.toDataURL());
}
const cropIcon = id => makeIcon('c:' + id, () => {
  ctx.fillStyle = '#8b5a33'; ctx.beginPath(); ctx.ellipse(48, 76, 34, 13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(60,34,14,.35)'; ctx.beginPath(); ctx.ellipse(48, 78, 26, 8, 0, 0, 7); ctx.fill();
  const crop = CROP[id];
  drawPlant(48, 78, crop.tipo === 'chao' ? 2.3 : crop.tipo === 'alto' ? 1.6 : 2.4, crop, 4, 0, false);
});
const animalIcon = k => makeIcon('a:' + k, () => {
  const sc = { galinha: 2.6, vaca: 1.6, ovelha: 2.2, porco: 2.1 }[k];
  drawAnimal(k, k === 'galinha' ? 46 : 42, 84, sc, 0, 1, false);
});
const productIcon = id => makeIcon('p:' + id, () => drawProduct(id, 48, 48, 5.5));
const decorIcon = id => makeIcon('d:' + id, () => {
  L.W = { tapete: 34, sofa: 48, tv: 64, quadro: 100, abajur: 70, vaso: 105 }[id];
  L.ox = 0; L.oy = 0;
  const m = decorCenter(id);
  L.ox = 48 - m.x; L.oy = (id === 'abajur' ? 52 : 56) - m.y;
  if (id === 'quadro') { ctx.fillStyle = '#f1dcae'; ctx.fillRect(8, 8, 80, 80); }
  DRAW_DECOR[id](0);
});
const itemIcon = id => CROP[id] ? cropIcon(id) : productIcon(id);

// ============================================================
// Interface
// ============================================================
const TOOL_ICONS = {
  hand: '<svg viewBox="0 0 24 24" fill="#ffd9b0" stroke="#6b4220" stroke-width="1.6" stroke-linejoin="round"><path d="M8 13V6a1.5 1.5 0 0 1 3 0v5V4.5a1.5 1.5 0 0 1 3 0V11V5.5a1.5 1.5 0 0 1 3 0V12V8.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-5-2.7L4.3 14a1.6 1.6 0 0 1 2.6-1.8L8 13.5z"/></svg>',
  hoe: '<svg viewBox="0 0 24 24"><path d="M4 21 17 6" stroke="#8a5a2b" stroke-width="2.4" stroke-linecap="round"/><path d="M14.5 3.5 21 8l-2.5 1.5-5-4z" fill="#8f9aa3" stroke="#4d565c" stroke-width="1.2" stroke-linejoin="round"/></svg>',
  water: '<svg viewBox="0 0 24 24" stroke="#1d5f8f" stroke-width="1.4" stroke-linejoin="round"><path d="M6 10h9v9a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1z" fill="#5cb4ee"/><path d="M15 12l5-5 1.5 1.5-5.5 6" fill="#5cb4ee"/><path d="M8 10a2.5 2.5 0 0 1 5 0" fill="none"/><path d="M21 11.5v1.5M19 13v1.5" stroke="#3aa0e8" stroke-linecap="round"/></svg>',
  pest: '<svg viewBox="0 0 24 24" stroke="#3b2a18" stroke-width="1.4" stroke-linejoin="round"><rect x="7" y="8" width="9" height="13" rx="2" fill="#e05a3a"/><path d="M9 8V5h5v3" fill="#bbb"/><path d="M14 5h3l2-1" fill="none"/><path d="M19 7l2-1M19 9l2 0" stroke="#7aa" stroke-linecap="round"/><circle cx="11.5" cy="14.5" r="2.2" fill="#fff"/></svg>',
  weed: '<svg viewBox="0 0 24 24" fill="none" stroke-linecap="round"><path d="M12 21v-7M12 14c-3 0-5-2-5-5 3 0 5 2 5 5zM12 14c3 0 5-2 5-5-3 0-5 2-5 5z" stroke="#2f6e1e" stroke-width="1.8" fill="#6cc24a"/><path d="M12 7V2M9.5 4.5 12 2l2.5 2.5" stroke="#6b4220" stroke-width="1.8"/></svg>',
};
const GOOGLE_G = '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';
const TOOLS = [
  { id: 'hand', nome: 'Mão' }, { id: 'hoe', nome: 'Enxada' }, { id: 'water', nome: 'Regar' },
  { id: 'pest', nome: 'Inseticida' }, { id: 'weed', nome: 'Arrancar' }, { id: 'seed', nome: 'Semente' },
];
const availTools = () => TOOLS.filter(t => isHome() || (t.id !== 'seed' && t.id !== 'hoe'));

function renderTools() {
  const box = $('#tools'), hint = $('#sceneHint');
  box.hidden = scene !== 'roca';
  hint.hidden = scene === 'roca';
  hint.textContent = scene === 'animais'
    ? (isHome() ? 'Clique num animal com fome para dar comida (1 Milho do celeiro ou ração comprada na hora) e depois colha o que ele produzir.' : 'Dê comida aos animais com fome para ajudar. Produto pronto dá para pegar um pouquinho.')
    : (isHome() ? 'Os espaços com + são lugares para decoração. Cada peça dá conforto, e conforto aumenta o XP que você ganha.' : 'Esta é a casa do seu vizinho.');
  box.innerHTML = '';
  availTools().forEach((t, k) => {
    const b = document.createElement('button');
    b.className = 'tool'; b.type = 'button';
    b.setAttribute('aria-pressed', String(state.tool === t.id));
    const icon = t.id === 'seed' ? `<img alt="" src="${cropIcon(state.seed)}">` : TOOL_ICONS[t.id];
    b.innerHTML = `${icon}<span>${t.id === 'seed' ? CROP[state.seed].nome : t.nome}</span><kbd>${k + 1}</kbd>`;
    b.title = t.id === 'hand' ? 'Faz a ação certa: colhe, rega, tira mato e pragas, planta' : t.nome;
    b.addEventListener('click', () => setTool(t.id));
    box.appendChild(b);
  });
}
function setTool(id) {
  if (!isHome() && (id === 'seed' || id === 'hoe')) return;
  state.tool = id; renderTools(); renderPane();
}
function setScene(sc) {
  scene = sc; hover = null;
  document.querySelectorAll('#scenes button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === sc)));
  renderTools(); renderSceneInfo();
}

function renderHUD() {
  $('#lvl').textContent = state.level;
  const n = need(state.level);
  $('#xptxt').textContent = `${state.xp} / ${n} XP`;
  $('#xpbar').style.width = `${Math.min(100, state.xp / n * 100)}%`;
  $('#coins').textContent = state.coins.toLocaleString('pt-BR');
}

function renderSceneInfo() {
  const s = S(), el = $('#sceneInfo');
  const owner = isHome() ? '' : `${view.nome} · `;
  if (scene === 'roca') el.textContent = owner + `${s.plots.filter(p => p.s !== 'locked').length} de ${N} lotes`;
  else if (scene === 'animais') el.textContent = owner + `${s.animals.length} de ${MAX_ANIMALS} animais`;
  else el.textContent = owner + `Conforto ${comfort(s)} · +${comfort(s)}% de XP`;
}

function renderAccount() {
  const el = $('#account');
  if (!Cloud.available) { el.innerHTML = '<span class="acct-note">Salvo neste navegador</span>'; return; }
  if (cloudStatus === 'loading') { el.innerHTML = '<span class="acct-note">Conectando…</span>'; return; }
  if (user) {
    el.innerHTML = `${user.photo ? `<img alt="" referrerpolicy="no-referrer" src="${esc(user.photo)}">` : ''}
      <span class="who"><span>${esc(firstName(user.name))}</span><small>${esc(syncStatus)}</small></span>
      <button class="linkbtn" type="button" data-logout>Sair</button>`;
    return;
  }
  el.innerHTML = `<button class="gbtn" type="button" data-login>${GOOGLE_G}Entrar com Google</button>`;
}
$('#account').addEventListener('click', e => {
  if (e.target.closest('[data-login]')) login();
  if (e.target.closest('[data-logout]')) logout();
});
function login() {
  if (!Cloud.available) return;
  if (isGated()) showGate('login', 'Esperando o Google…');
  Cloud.signIn().catch(e => {
    if (e && (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request')) {
      if (isGated()) showGate('login');
      return;
    }
    console.warn(e);
    const why = e && e.code === 'auth/unauthorized-domain'
      ? 'Este endereço ainda não foi autorizado no Firebase (Authentication > Configurações > Domínios autorizados).'
      : 'Não deu para entrar com o Google agora. Tente de novo.';
    if (isGated()) showGate('login', why); else toast(why, 'bad');
  });
}
async function logout() {
  save();
  if (dirty) await cloudSave();
  showGate('loading', 'Saindo…');
  try { await Cloud.signOut(); } catch (e) { console.warn(e); showGate('login'); }
}

let resetArmed = false, unfriendArmed = null;
function renderTabs() {
  const b = document.querySelector('.tab[data-tab="amigos"]');
  b.innerHTML = requests.length ? `Amigos<span class="badge" aria-label="${requests.length} pedidos">${requests.length}</span>` : 'Amigos';
}
function renderPane() {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  const pane = $('#pane');
  let html = '';
  if (tab === 'loja') {
    const segs = [['sementes', 'Sementes'], ['animais', 'Animais'], ['decor', 'Decoração']];
    html += `<div class="seg small" role="tablist">${segs.map(([id, n]) => `<button type="button" role="tab" data-seg="${id}" aria-selected="${shopSeg === id}">${n}</button>`).join('')}</div>`;
    if (shopSeg === 'sementes') {
      html += `<p class="hint">Escolha uma semente e clique na terra arada para plantar. O preço é cobrado no plantio.</p>`;
      for (const c of CROPS) {
        const locked = c.nivel > state.level, sel = state.seed === c.id && state.tool === 'seed';
        const lucro = c.rend * c.preco * c.safras - c.custo;
        html += `<div class="row ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}">
          <img alt="" src="${cropIcon(c.id)}">
          <div><div class="name">${c.nome}</div>
          <div class="meta">${c.custo} moedas · ${fmt(c.tempo)}${c.safras > 1 ? ` · ${c.safras} safras` : ''}<br>rende ${c.rend} × ${c.preco} · lucro ${lucro} · ${c.xp} XP</div></div>
          ${locked ? `<button class="btn" disabled>Nível ${c.nivel}</button>` : `<button class="btn ${sel ? 'gold' : ''}" data-seed="${c.id}">${sel ? 'Na mão' : 'Escolher'}</button>`}
        </div>`;
      }
    } else if (shopSeg === 'animais') {
      html += `<p class="hint">Os animais comem 1 Milho do celeiro. Sem milho, a ração é comprada na hora. Você tem ${state.animals.length} de ${MAX_ANIMALS}.</p>`;
      for (const a of ANIMALS) {
        const locked = a.nivel > state.level, prod = PRODUCT[a.prod];
        const full = state.animals.length >= MAX_ANIMALS, have = state.animals.filter(x => x.k === a.id).length;
        html += `<div class="row ${locked ? 'locked' : ''}">
          <img alt="" src="${animalIcon(a.id)}">
          <div><div class="name">${a.nome}${have ? ` <span class="meta">(${have})</span>` : ''}</div>
          <div class="meta">${a.custo} moedas · ${prod.nome} a cada ${fmt(a.tempo)}<br>vende por ${prod.preco} · ração ${a.racao} · ${a.xp} XP</div></div>
          ${locked ? `<button class="btn" disabled>Nível ${a.nivel}</button>` : `<button class="btn" data-buy-animal="${a.id}" ${full || state.coins < a.custo ? 'disabled' : ''}>Comprar</button>`}
        </div>`;
      }
    } else {
      html += `<p class="hint">Decore a sua casa. Cada peça dá conforto, e cada ponto de conforto vale +1% de XP. Agora: +${comfort(state)}%.</p>`;
      for (const d of DECOR) {
        const locked = d.nivel > state.level, owned = !!state.decor[d.id];
        html += `<div class="row ${locked ? 'locked' : ''} ${owned ? 'sel' : ''}">
          <img alt="" src="${decorIcon(d.id)}">
          <div><div class="name">${d.nome}</div><div class="meta">${d.custo} moedas · +${d.conforto} de conforto</div></div>
          ${owned ? `<button class="btn ghost" data-see-house>Na casa</button>` : locked ? `<button class="btn" disabled>Nível ${d.nivel}</button>` : `<button class="btn" data-buy-decor="${d.id}" ${state.coins < d.custo ? 'disabled' : ''}>Comprar</button>`}
        </div>`;
      }
    }
  } else if (tab === 'celeiro') {
    const items = [...CROPS, ...PRODUCTS].filter(it => state.barn[it.id] > 0);
    let total = 0; for (const it of items) total += state.barn[it.id] * it.preco;
    html += `<h3>Celeiro</h3>`;
    if (!items.length) html += `<div class="empty">O celeiro está vazio.<br>Colha na roça e recolha ovos, leite, lã e trufas dos animais.</div>`;
    else {
      html += `<div class="total"><span>Total: ${total} moedas</span><button class="btn gold" data-sellall>Vender tudo</button></div>`;
      for (const it of items) {
        const q = state.barn[it.id];
        html += `<div class="row"><img alt="" src="${itemIcon(it.id)}">
          <div><div class="name">${it.nome} × ${q}</div><div class="meta">${it.preco} moedas cada · ${q * it.preco} no total${it.id === 'milho' ? '<br>também serve de comida para os animais' : ''}</div></div>
          <div class="stack"><button class="btn" data-sell="${it.id}">Vender 1</button><button class="btn ghost" data-sellall-of="${it.id}">Todos</button></div></div>`;
      }
    }
  } else if (tab === 'terreno') {
    const i = nextLot();
    html += `<h3>Terreno</h3><div class="kv">
      <span>Lotes</span><span>${state.owned} de ${N}</span>
      <span>Animais</span><span>${state.animals.length} de ${MAX_ANIMALS}</span>
      <span>Decorações</span><span>${Object.keys(state.decor).length} de ${DECOR.length}</span>
      <span>Colheitas</span><span>${state.stats.colheitas}</span>
      <span>Produtos dos animais</span><span>${state.stats.coletas}</span>
      <span>Moedas vendidas</span><span>${state.stats.vendido}</span>
      <span>Pegos nas visitas</span><span>${state.stats.roubado}</span>
      <span>Ajudas aos amigos</span><span>${state.stats.ajudas}</span></div>`;
    if (i != null) {
      const cost = lotCost(state.owned), lvl = lotLevel(state.owned);
      html += `<div class="row"><div></div><div><div class="name">Próximo lote</div><div class="meta">${cost} moedas · exige nível ${lvl}</div></div>
        <button class="btn gold" data-buylot ${state.level >= lvl && state.coins >= cost ? '' : 'disabled'}>Comprar</button></div>
        <p class="hint">O lote à venda aparece com uma placa na roça.</p>`;
    } else html += `<div class="empty">Você comprou todo o terreno!</div>`;
    html += `<p class="hint">Mato e pragas diminuem a colheita enquanto ficam lá. Terra seca faz a planta crescer na metade da velocidade.</p>
      <button class="btn danger" data-reset>${resetArmed ? 'Clique de novo para apagar tudo' : 'Recomeçar do zero'}</button>`;
  } else if (tab === 'amigos') {
    html += `<h3>Amigos</h3>`;
    if (!Cloud.available) {
      html += `<p class="hint">Login com Google e amigos de verdade funcionam quando o jogo está publicado com o Firebase ligado (o passo a passo está no README). Nesta versão, a roça fica salva só neste navegador.</p>`;
    } else if (!user) {
      html += `<p class="hint">Entre com o Google para salvar a roça na nuvem, jogar em qualquer aparelho e visitar seus amigos.</p>
        <button class="gbtn" type="button" data-login style="justify-self:start">${GOOGLE_G}Entrar com Google</button>`;
    } else {
      html += `<div class="codebox"><div><div class="meta">Seu código de amigo</div><strong>${esc(state.code || '······')}</strong></div>
          <button class="btn ghost" data-copy-code type="button">Copiar</button></div>
        <form class="addform" id="addFriend"><input id="friendCode" maxlength="7" placeholder="Código do amigo" autocomplete="off" aria-label="Código do amigo"><button class="btn" type="submit">Adicionar</button></form>`;
      const avatar = (photo, name, color) => photo
        ? `<img class="avatar" alt="" referrerpolicy="no-referrer" src="${esc(photo)}">`
        : `<div class="avatar" style="background:${color}">${esc((name || '?')[0])}</div>`;
      if (requests.length) {
        html += `<h3>Pedidos de amizade</h3>`;
        for (const r of requests) {
          html += `<div class="row sel">${avatar(r.photo, r.name, '#d9a441')}
            <div><div class="name">${esc(r.name)}</div><div class="meta">quer ser seu amigo</div></div>
            <div class="stack"><button class="btn" data-accept="${esc(r.from)}">Aceitar</button><button class="btn ghost" data-refuse="${esc(r.from)}">Recusar</button></div></div>`;
        }
      }
      html += `<h3>Seus amigos</h3>`;
      if (!state.friends.length) html += `<div class="empty">Mande seu código para um amigo e peça o dele. A amizade começa quando um aceitar o pedido do outro.</div>`;
      for (const uid of state.friends) {
        fetchFriendInfo(uid);
        const f = friendInfo[uid];
        const here = view.kind === 'friend' && view.uid === uid;
        if (f === 'loading') { html += `<div class="row"><div class="avatar" style="background:#c9c3a8"></div><div class="meta">Carregando…</div><div></div></div>`; continue; }
        const name = f ? f.name : 'Amigo';
        const armed = unfriendArmed === uid;
        html += `<div class="row ${here ? 'sel' : ''}">${avatar(f && f.photo, name, '#7aa35a')}
          <div><div class="name">${esc(name)}</div><div class="meta">${f ? `Nível ${f.level}` : 'Ainda não entrou no jogo'}</div></div>
          <div class="stack">${here ? `<button class="btn ghost" data-home>Voltar</button>` : `<button class="btn" data-visit-friend="${esc(uid)}" ${f ? '' : 'disabled'}>Visitar</button>`}
          <button class="btn ${armed ? 'danger' : 'ghost'}" data-unfriend="${esc(uid)}">${armed ? 'Confirmar' : 'Desfazer'}</button></div></div>`;
      }
      const sent = Object.entries(state.sent);
      if (sent.length) {
        html += `<h3>Pedidos enviados</h3>`;
        for (const [uid, info] of sent) {
          html += `<div class="row">${avatar('', '?', '#b7b39c')}
            <div><div class="name">Código ${esc(info.code || '')}</div><div class="meta">Esperando a pessoa aceitar</div></div>
            <button class="btn ghost" data-cancel-request="${esc(uid)}">Cancelar</button></div>`;
        }
      }
    }
    html += `<h3>Vizinhos da vila</h3><p class="hint">Sempre tem alguém em casa por aqui. Cada vizinho tem um cachorro de guarda.</p>`;
    for (const n of NEIGHBORS) {
      const here = view.kind === 'npc' && view.id === n.id;
      html += `<div class="row ${here ? 'sel' : ''}"><div class="avatar" style="background:${n.casa}">${n.nome.split(' ').pop()[0]}</div>
        <div><div class="name">${n.nome}</div><div class="meta">Cachorro: ${n.cao} · ${n.pega >= .15 ? 'bravo' : n.pega >= .09 ? 'atento' : 'dorminhoco'}</div></div>
        ${here ? `<button class="btn ghost" data-home>Voltar</button>` : `<button class="btn" data-visit="${n.id}">Visitar</button>`}</div>`;
    }
  }
  pane.innerHTML = html;
}

$('#pane').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  const d = b.dataset;
  if (d.seg) { shopSeg = d.seg; renderPane(); }
  else if (d.seed) { state.seed = d.seed; state.tool = 'seed'; if (!isHome()) goHome(); setScene('roca'); renderPane(); save(); }
  else if (d.buyAnimal) buyAnimal(d.buyAnimal);
  else if (d.buyDecor) buyDecor(d.buyDecor);
  else if ('seeHouse' in d) { if (!isHome()) goHome(); setScene('casa'); }
  else if (d.sell) sell(d.sell, false);
  else if (d.sellallOf) sell(d.sellallOf, true);
  else if ('sellall' in d) sellAll();
  else if ('buylot' in d) { const i = nextLot(); if (i != null) { if (!isHome()) goHome(); buyLot(i); } }
  else if (d.visit) { visitNpc(d.visit); }
  else if (d.visitFriend) { visitFriend(d.visitFriend); }
  else if (d.accept) acceptRequest(d.accept);
  else if (d.refuse) refuseRequest(d.refuse);
  else if (d.cancelRequest) cancelRequest(d.cancelRequest);
  else if (d.unfriend) {
    if (unfriendArmed !== d.unfriend) {
      unfriendArmed = d.unfriend; renderPane();
      setTimeout(() => { if (unfriendArmed === d.unfriend) { unfriendArmed = null; if (tab === 'amigos') renderPane(); } }, 4000);
    } else { unfriendArmed = null; unfriend(d.unfriend); }
  }
  else if ('home' in d) goHome();
  else if ('login' in d) login();
  else if ('copyCode' in d) {
    const code = state.code || '';
    const ok = () => toast('Código copiado!', 'good');
    try { navigator.clipboard.writeText(code).then(ok, () => toast(`Seu código: ${code}`)); } catch (err) { toast(`Seu código: ${code}`); }
  }
  else if ('reset' in d) {
    if (!resetArmed) { resetArmed = true; renderPane(); setTimeout(() => { resetArmed = false; if (tab === 'terreno') renderPane(); }, 4000); return; }
    resetArmed = false;
    const keep = { owner: state.owner, code: state.code, friends: state.friends, sent: state.sent };
    state = Object.assign(newState(), keep);
    goHome(); setScene('roca'); done();
    toast('Roça nova em folha!', 'good');
  }
});
$('#pane').addEventListener('submit', e => {
  if (e.target.id !== 'addFriend') return;
  e.preventDefault();
  addFriend($('#friendCode').value);
});
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; renderPane(); if (tab === 'amigos') checkSent(); }));
document.querySelectorAll('#scenes button').forEach(b => b.addEventListener('click', () => setScene(b.dataset.scene)));
$('#goHome').addEventListener('click', () => goHome());

// ============================================================
// Dicas ao passar o mouse
// ============================================================
function tipPlot(i) {
  const p = S().plots[i], home = isHome();
  if (p.s === 'locked') {
    if (home && i === nextLot()) return `<b>Lote à venda</b><br>${lotCost(state.owned)} moedas · nível ${lotLevel(state.owned)}`;
    return home ? 'Pasto. Compre os lotes com placa para crescer.' : null;
  }
  if (p.s === 'plowed') return home ? `<b>Terra arada</b><br>Clique para plantar ${CROP[state.seed].nome}.` : '<b>Terra arada</b>';
  if (p.s === 'withered') return '<b>Planta seca</b><br>Use a enxada (ou a Mão) para limpar.';
  const crop = CROP[p.c], st = stageOf(p), k = Math.min(1, p.g / crop.tempo);
  let h = `<b>${crop.nome}</b> · ${STAGE_NAMES[st]}`;
  if (st < 4) h += `<br>Fica pronto em ${fmt((crop.tempo - p.g) / (p.dry ? 0.5 : 1))}`;
  else h += !home && (p.stolen || state.log[visitKey(p.id)]) ? '<br>Você já pegou daqui.' : '<br>Pronto para colher!';
  h += `<div class="bar"><i style="width:${k * 100}%"></i></div>`;
  const probs = [];
  if (p.w) probs.push(`${p.w} mato`); if (p.b) probs.push(`${p.b} praga${p.b > 1 ? 's' : ''}`); if (p.dry) probs.push('terra seca');
  if (probs.length) h += `<div class="warn">${probs.join(' · ')}</div>`;
  if (home) { h += `Colheita prevista: ${expectedYield(p)} de ${crop.rend}`; if (p.sl > 1) h += ` · +${p.sl - 1} safra`; }
  return h;
}
function tipAnimal(id) {
  const a = S().animals.find(x => x.id === id); if (!a) return null;
  const def = ANIMAL[a.k], prod = PRODUCT[def.prod];
  let h = `<b>${def.nome}</b><br>`;
  if (a.ready) h += `${prod.nome} pronto! Clique para recolher.`;
  else if (!a.fed) h += `Com fome. ${isHome() ? `Clique para dar comida (1 Milho ou ${def.racao} moedas).` : 'Clique para dar comida e ajudar.'}`;
  else h += `Produzindo ${prod.nome.toLowerCase()}: falta ${fmt(def.tempo - a.g)}<div class="bar"><i style="width:${a.g / def.tempo * 100}%"></i></div>`;
  return h;
}
function tipDecor(id) {
  const d = DECO[id];
  if (S().decor[id]) return `<b>${d.nome}</b><br>+${d.conforto} de conforto`;
  return `<b>Espaço para ${d.nome}</b><br>${d.custo} moedas na Loja · nível ${d.nivel}`;
}
let lastTip = '';
function updateTip() {
  const show = hover && (pointer.inside && !pointer.touch || performance.now() < pointer.tipUntil);
  const html = !show ? null : hover.kind === 'plot' ? tipPlot(hover.i) : hover.kind === 'animal' ? tipAnimal(hover.id) : tipDecor(hover.id);
  if (!html) { tip.hidden = true; lastTip = ''; return; }
  if (html !== lastTip) { tip.innerHTML = html; lastTip = html; }
  tip.hidden = false;
  const w = tip.offsetWidth, h = tip.offsetHeight;
  let x = pointer.x + 16, y = pointer.y + 16;
  if (x + w > L.cw) x = pointer.x - w - 12;
  if (y + h > L.ch) y = pointer.y - h - 12;
  tip.style.left = `${Math.max(4, x)}px`; tip.style.top = `${Math.max(4, y)}px`;
}

// ============================================================
// Mouse, toque e teclado
// ============================================================
function pick(x, y) {
  let best = null, bd = Infinity;
  for (const h of hits) { const d = Math.hypot(x - h.x, y - h.y); if (d < h.r && d < bd) { best = h; bd = d; } }
  if (best) return best;
  if (scene === 'roca') { const i = cellAt(x, y); if (i >= 0) return { kind: 'plot', i }; }
  return null;
}
function localPos(e) { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
cv.addEventListener('pointermove', e => {
  const q = localPos(e); pointer.x = q.x; pointer.y = q.y; pointer.inside = true; pointer.touch = e.pointerType === 'touch';
  hover = pick(q.x, q.y);
});
cv.addEventListener('pointerleave', () => { pointer.inside = false; if (!pointer.touch) hover = null; });
cv.addEventListener('pointerdown', e => { pointer.touch = e.pointerType === 'touch'; });
cv.addEventListener('click', e => {
  const q = localPos(e); pointer.x = q.x; pointer.y = q.y;
  const target = pick(q.x, q.y); hover = target;
  if (pointer.touch) pointer.tipUntil = performance.now() + 2200;
  if (!target) return;
  if (target.kind === 'plot') actPlot(target.i);
  else if (target.kind === 'animal') actAnimal(target.id);
  else if (target.kind === 'decor') actDecor(target.id);
});
window.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (scene !== 'roca') return;
  const k = parseInt(e.key, 10), avail = availTools();
  if (k >= 1 && k <= avail.length) setTool(avail[k - 1].id);
});
new ResizeObserver(resize).observe(stage);

// ============================================================
// Laço principal
// ============================================================
let last = performance.now(), lastSave = 0, lastUI = 0, lastInfo = 0, lastSentCheck = 0;
function frame(now) {
  const dt = Math.min(1, (now - last) / 1000); last = now;
  tick(dt);
  if (!isGated() && L.cw > 20) draw(now, dt);
  if (now - lastUI > 250) { updateTip(); lastUI = now; }
  if (now - lastInfo > 2000) { renderSceneInfo(); lastInfo = now; }
  if (now - lastSave > 5000) { save(); lastSave = now; }
  if (user && dirty && now - lastCloud > 15000) cloudSave();
  if (user && now - lastSentCheck > 60000) { lastSentCheck = now; checkSent(); }
  requestAnimationFrame(frame);
}

function start(data) {
  state = (data && data.state && migrate(data.state)) || load() || newState();
  resize(); setScene('roca'); renderHUD(); renderAccount(); renderPane();
  requestAnimationFrame(t => { last = t; frame(t); });
  if (Cloud.available) {
    showGate('loading');
    Cloud.init(onUser).catch(e => {
      console.warn(e); cloudStatus = 'off';
      showGate('error', 'Não consegui abrir o login do Google. Confira a internet e tente de novo.');
      renderAccount();
    });
  }
}
window.addEventListener('pagehide', () => { save(); if (user && dirty) cloudSave(); });
window.claude?.hot?.snapshot?.(() => ({ state }));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
