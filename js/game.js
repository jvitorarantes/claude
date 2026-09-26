(() => {
'use strict';

// ============================================================
// Dados do jogo
// ============================================================
const COLS = 8, ROWS = 5, N = COLS * ROWS, START_PLOTS = 6;
const PEN_C = 6, PEN_R = 4, ROOM = 5, MAX_ANIMALS = 15;
const HOUR = 3600, DAY = 86400e3; // HOUR em segundos (tempos de produção), DAY em milissegundos (idades)
const SAVE_KEY = 'roca-feliz-v2', OLD_SAVE_KEY = 'roca-feliz-v1', SETTINGS_KEY = 'roca-feliz-config';
const settings = Object.assign(
  { music: true, sfx: true, musicVol: 0.5, sfxVol: 0.7, track: 0, tema: 'auto' },
  (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })(),
);
const Cloud = window.RFCloud || { available: false };

const CROPS = [
  { id: 'nabo',      nome: 'Nabo',      custo: 2,  tempo: 40,   rend: 6,  preco: 1,  xp: 2,  nivel: 1, safras: 1, tipo: 'raiz', cor: '#f5eef7', cor2: '#a45bbb' },
  { id: 'cenoura',   nome: 'Cenoura',   custo: 4,  tempo: 90,   rend: 6,  preco: 2,  xp: 4,  nivel: 1, safras: 1, tipo: 'raiz', cor: '#f08a24', cor2: '#e0761a' },
  { id: 'milho',     nome: 'Milho',     custo: 8,  tempo: 180,  rend: 5,  preco: 4,  xp: 7,  nivel: 2, safras: 2, tipo: 'alto', cor: '#f7d046' },
  { id: 'tomate',    nome: 'Tomate',    custo: 12, tempo: 300,  rend: 8,  preco: 3,  xp: 10, nivel: 3, safras: 3, tipo: 'moita', cor: '#e53b2f' },
  { id: 'berinjela', nome: 'Berinjela', custo: 15, tempo: 420,  rend: 7,  preco: 5,  xp: 13, nivel: 4, safras: 2, tipo: 'pendente', cor: '#6b2e7a' },
  { id: 'morango',   nome: 'Morango',   custo: 22, tempo: 600,  rend: 10, preco: 5,  xp: 18, nivel: 5, safras: 4, tipo: 'moita', cor: '#e0224a', pequeno: true },
  { id: 'abobora',   nome: 'Abóbora',   custo: 30, tempo: 900,  rend: 4,  preco: 18, xp: 26, nivel: 6, safras: 1, tipo: 'chao', cor: '#f28c1b', cor2: '#c9650a' },
  { id: 'melancia',  nome: 'Melancia',  custo: 45, tempo: 1500, rend: 3,  preco: 36, xp: 40, nivel: 8, safras: 2, tipo: 'chao', cor: '#4d9a3e', cor2: '#2a5e27' },
];
const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));

// Produtos dos animais. O esterco do jumento não vai para o celeiro: vira 2 adubos premium.
const PRODUCTS = [
  { id: 'ovo',       nome: 'Ovo',             preco: 10 },
  { id: 'pelo',      nome: 'Pelo de coelho',  preco: 12 },
  { id: 'ovoangola', nome: 'Ovo de angola',   preco: 18 },
  { id: 'ovopata',   nome: 'Ovo de pata',     preco: 22 },
  { id: 'leite',     nome: 'Leite',           preco: 40 },
  { id: 'la',        nome: 'Lã',              preco: 60 },
  { id: 'esterco',   nome: 'Esterco',         preco: 0, vira: 'premium', qtd: 2 },
  { id: 'bacon',     nome: 'Bacon',           preco: 80 },
  { id: 'crina',     nome: 'Crina',           preco: 110 },
  { id: 'pena',      nome: 'Pena de pavão',   preco: 200 },
];
const PRODUCT = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

// tempo = horas para produzir; vida = dias de vida; racao = moedas por refeição (ou milho do celeiro).
// XP por coleta ≈ valor do produto ÷ 4 + 2, para quem espera mais ganhar mais.
const ANIMALS = [
  { id: 'galinha', nome: 'Galinha',          f: 1, custo: 50,   nivel: 1,  tempo: 6 * HOUR,  vida: 10, prod: 'ovo',       racao: 1 },
  { id: 'coelho',  nome: 'Coelho',           f: 0, custo: 80,   nivel: 2,  tempo: 5 * HOUR,  vida: 12, prod: 'pelo',      racao: 1 },
  { id: 'angola',  nome: 'Galinha-d\'angola', f: 1, custo: 100,  nivel: 3,  tempo: 7 * HOUR,  vida: 14, prod: 'ovoangola', racao: 2 },
  { id: 'pato',    nome: 'Pata',             f: 1, custo: 120,  nivel: 3,  tempo: 8 * HOUR,  vida: 15, prod: 'ovopata',   racao: 2 },
  { id: 'vaca',    nome: 'Vaca',             f: 1, custo: 200,  nivel: 4,  tempo: 12 * HOUR, vida: 20, prod: 'leite',     racao: 4 },
  { id: 'ovelha',  nome: 'Ovelha',           f: 1, custo: 300,  nivel: 5,  tempo: 8 * HOUR,  vida: 25, prod: 'la',        racao: 6 },
  { id: 'jumento', nome: 'Jumento',          f: 0, custo: 350,  nivel: 6,  tempo: 12 * HOUR, vida: 25, prod: 'esterco',   racao: 3 },
  { id: 'porco',   nome: 'Porco',            f: 0, custo: 400,  nivel: 6,  tempo: 18 * HOUR, vida: 30, prod: 'bacon',     racao: 8 },
  { id: 'cavalo',  nome: 'Cavalo',           f: 0, custo: 900,  nivel: 8,  tempo: 20 * HOUR, vida: 35, prod: 'crina',     racao: 10 },
  { id: 'pavao',   nome: 'Pavão',            f: 0, custo: 1500, nivel: 10, tempo: 24 * HOUR, vida: 40, prod: 'pena',      racao: 18 },
];
for (const a of ANIMALS) {
  const p = PRODUCTS.find(x => x.id === a.prod);
  a.xp = Math.round((p.vira ? 36 : p.preco) / 4) + 2;
  a.milho = Math.max(1, Math.round(a.racao / 4)); // quantos milhos do celeiro valem uma refeição
}
const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));
const seuSua = a => (a.f ? 'Sua ' : 'Seu ') + a.nome.toLowerCase();

// Cães de guarda: um vigia a plantação, outro os animais. Só protegem acordados (com comida).
const DOGS = [
  { id: 'caramelo', nome: 'Vira-lata caramelo', custo: 150, nivel: 2, vida: 15, protege: 0.55, morde: 0.4, xpDia: 10, xpPega: 15, cor: '#d99a4e', cor2: '#b8793a' },
  { id: 'pastor',   nome: 'Pastor-alemão',      custo: 450, nivel: 5, vida: 25, protege: 0.7,  morde: 0.5, xpDia: 20, xpPega: 25, cor: '#8a5a2e', cor2: '#2a221c' },
  { id: 'fila',     nome: 'Fila brasileiro',    custo: 900, nivel: 8, vida: 35, protege: 0.85, morde: 0.6, xpDia: 30, xpPega: 40, cor: '#b8783e', cor2: '#3a2a20' },
];
const DOG = Object.fromEntries(DOGS.map(d => [d.id, d]));
const DOG_FOOD = { custo: 15, horas: 8 };
const DOG_NAMES = ['Totó', 'Rex', 'Pipoca', 'Thor', 'Mel', 'Bidu', 'Paçoca', 'Nina', 'Bolinha', 'Faísca', 'Pretinha', 'Caramelo'];
const SLOT_NAME = { roca: 'plantação', animais: 'criação' };
const STEAL_MAX = { roca: 3, animais: 2 }; // itens por amigo por dia

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

// Adubos: cortam uma parte do tempo que falta para a planta ficar pronta. Um por safra.
const FERTS = [
  { id: 'basico',  nome: 'Adubo básico',  curto: 'Básico',  corta: 0.25, custo: 6,  nivel: 1, cor: '#c98a4b' },
  { id: 'premium', nome: 'Adubo premium', curto: 'Premium', corta: 0.5,  custo: 18, nivel: 3, cor: '#4a8fd0' },
  { id: 'pro',     nome: 'Adubo pro',     curto: 'Pro',     corta: 1,    custo: 45, nivel: 5, cor: '#e0a020' },
];
const FERT = Object.fromEntries(FERTS.map(f => [f.id, f]));

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

function emptyPlot(s = 'locked') { return { s, c: null, g: 0, dry: false, w: 0, b: 0, sl: 0, dmg: 0, id: null, th: [], fert: false }; }
function newAnimal(k) { return { id: newId(), k, fed: true, g: 0, ready: false, n: 0, born: Date.now() }; }

function newState() {
  const plots = Array.from({ length: N }, () => emptyPlot());
  ORDER.slice(0, START_PLOTS).forEach(i => plots[i].s = 'plowed');
  return {
    v: 2, coins: 60, xp: 0, level: 1, plots, barn: {}, owned: START_PLOTS,
    tool: 'hand', seed: 'nabo', t: Date.now(), nb: {},
    animals: [newAnimal('galinha'), newAnimal('galinha')], decor: {},
    friends: [], sent: {}, code: null, owner: null, log: {},
    fert: { basico: 2 }, fertSel: 'basico',
    dogs: { roca: null, animais: null }, dogFood: 0, news: [], newsSeen: 0, limits: {},
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
  for (const a of s.animals) { if (!a.id) a.id = newId(); a.n = a.n || 0; if (!a.born) a.born = Date.now(); }
  const dogs = s.dogs && typeof s.dogs === 'object' ? s.dogs : {};
  s.dogs = {};
  for (const slot of ['roca', 'animais']) { const d = dogs[slot]; s.dogs[slot] = d && DOG[d.raca] ? d : null; }
  s.dogFood = Math.max(0, Number(s.dogFood) || 0);
  s.news = Array.isArray(s.news) ? s.news.slice(0, 30) : [];
  s.newsSeen = Number(s.newsSeen) || 0;
  s.limits = s.limits && typeof s.limits === 'object' ? s.limits : {};
  if (s.barn && s.barn.trufa) { s.barn.bacon = (s.barn.bacon || 0) + s.barn.trufa; delete s.barn.trufa; } // a trufa virou bacon
  s.decor = s.decor && typeof s.decor === 'object' ? s.decor : {};
  s.friends = Array.isArray(s.friends) ? s.friends.filter(f => typeof f === 'string') : [];
  s.sent = s.sent && typeof s.sent === 'object' && !Array.isArray(s.sent) ? s.sent : {};
  s.fert = s.fert && typeof s.fert === 'object' ? s.fert : {};
  if (!FERT[s.fertSel]) s.fertSel = 'basico';
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
    const old = Date.now() - 2 * 86400e3, today = Math.floor(Date.now() / DAY);
    for (const k of Object.keys(s.log)) if (s.log[k] < old) delete s.log[k];
    for (const k of Object.keys(s.limits)) if (!(s.limits[k] && s.limits[k].d >= today)) delete s.limits[k];
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
function quando(at) {
  const min = Math.round((Date.now() - at) / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  return h < 24 ? `há ${h}h` : `há ${Math.round(h / 24)} ${Math.round(h / 24) > 1 ? 'dias' : 'dia'}`;
}
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
// Dá para comprar qualquer lote encostado (lado com lado) na terra que você já tem.
function neighbors(i) {
  const c = i % COLS, r = Math.floor(i / COLS), out = [];
  if (c > 0) out.push(i - 1); if (c < COLS - 1) out.push(i + 1);
  if (r > 0) out.push(i - COLS); if (r < ROWS - 1) out.push(i + COLS);
  return out;
}
const canBuy = i => state.plots[i].s === 'locked' && neighbors(i).some(j => state.plots[j].s !== 'locked');
let buyPending = null; // lote clicado uma vez, esperando o segundo clique para confirmar
const sfx = name => { if (window.RFAudio) window.RFAudio.play(name); };
const comfort = s => DECOR.reduce((t, d) => t + (s.decor[d.id] ? d.conforto : 0), 0);
const firstName = n => (n || '').split(' ')[0] || 'Você';

function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg;
  if (kind === 'bad') sfx('error');
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
    sfx('level');
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
  if (p.s === 'locked') return clickLot(i);
  if (tool === 'fert') return fertilize(p, pos);
  const has = t => tool === 'hand' || tool === t;
  if (p.s === 'growing' && p.b > 0 && has('pest')) { p.b--; sfx('pest'); addXP(2, pos); addCoins(1, pos); return done(); }
  if (p.s === 'growing' && p.w > 0 && has('weed')) { p.w--; sfx('weed'); addXP(2, pos); addCoins(1, pos); return done(); }
  if (p.s === 'growing' && p.dry && has('water')) { p.dry = false; sfx('water'); addXP(1, pos); return done(); }
  if (ripe(p) && tool === 'hand') return harvest(p, pos);
  if (p.s === 'withered' && has('hoe')) { Object.assign(p, emptyPlot('plowed')); sfx('hoe'); addXP(1, pos); return done(); }
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
  sfx('plant');
  done();
}

function fertilize(p, pos) {
  const f = FERT[state.fertSel], have = state.fert[f.id] || 0;
  if (p.s !== 'growing') return toast('O adubo é para planta que está crescendo.');
  if (ripe(p)) return toast('Essa planta já está pronta para colher.');
  if (p.fert) return toast('Essa safra já foi adubada. Dá para adubar de novo na próxima.');
  if (have <= 0) { tab = 'loja'; shopSeg = 'adubo'; renderPane(); return toast(`Você não tem ${f.nome}. Compre na Loja.`); }
  const crop = CROP[p.c], falta = crop.tempo - p.g;
  state.fert[f.id] = have - 1;
  p.g = Math.min(crop.tempo, p.g + falta * f.corta);
  p.fert = true;
  sfx('fert');
  popupAt(pos, f.corta >= 1 ? 'Pronto!' : `−${fmt(falta * f.corta)}`, '#9be36a');
  addXP(1, pos);
  renderTools();
  done();
}

function buyFert(id, n) {
  const f = FERT[id], cost = f.custo * n;
  if (state.level < f.nivel) return toast(`${f.nome} libera no nível ${f.nivel}.`);
  if (state.coins < cost) return toast(`Faltam moedas: ${n} × ${f.nome} custa ${cost}.`, 'bad');
  state.coins -= cost;
  state.fert[id] = (state.fert[id] || 0) + n;
  sfx('buy');
  toast(`+${n} ${f.nome}`, 'good');
  renderTools();
  done();
}

function clickLot(i) {
  if (!canBuy(i)) return toast('Só dá para comprar terra encostada na sua roça.');
  const cost = lotCost(state.owned), lvl = lotLevel(state.owned);
  if (state.level < lvl) return toast(`O próximo lote exige nível ${lvl}.`);
  if (state.coins < cost) return toast(`O lote custa ${cost} moedas.`, 'bad');
  if (buyPending && buyPending.i === i && performance.now() < buyPending.until) { buyPending = null; return buyLot(i); }
  buyPending = { i, until: performance.now() + 4000 };
  sfx('click');
  toast(`Este lote custa ${cost} moedas. Clique de novo nele para comprar.`);
}

function harvest(p, pos) {
  const crop = CROP[p.c], qty = expectedYield(p);
  sfx('harvest');
  gain(crop.id, qty, pos);
  state.stats.colheitas++;
  addXP(crop.xp, pos);
  if (p.sl > 1) Object.assign(p, { g: crop.tempo * 0.55, sl: p.sl - 1, dmg: 0, w: 0, b: 0, dry: false, id: newId(), th: [], fert: false });
  else Object.assign(p, { s: 'withered', g: 0, w: 0, b: 0, dry: false, th: [] });
  done();
}

function buyLot(i) {
  const cost = lotCost(state.owned), lvl = lotLevel(state.owned);
  if (state.level < lvl) return toast(`Este lote exige nível ${lvl}.`);
  if (state.coins < cost) return toast(`O lote custa ${cost} moedas.`, 'bad');
  const pos = scene === 'roca' ? cellCenter(i) : null;
  sfx('buy');
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
    sfx('collect');
    if (prod.vira) {
      state.fert[prod.vira] = (state.fert[prod.vira] || 0) + prod.qtd;
      popupAt(pos, `+${prod.qtd} ${FERT[prod.vira].nome}`, '#9be36a');
      renderTools();
    } else gain(prod.id, 1, pos);
    addXP(def.xp, pos); state.stats.coletas++;
    return done();
  }
  if (!a.fed) {
    if ((state.barn.milho || 0) >= def.milho) {
      state.barn.milho -= def.milho; if (!state.barn.milho) delete state.barn.milho;
      popupAt(pos, `−${def.milho} Milho`, '#ffe08a');
    } else if (state.coins >= def.racao) addCoins(-def.racao, pos);
    else return toast(`Faltam moedas para a ração (${def.racao}).`, 'bad');
    a.fed = true; sfx('feed'); addXP(1, pos);
    return done();
  }
  toast(`${def.nome} está produzindo ${prod.nome.toLowerCase()}: falta ${fmt(def.tempo - a.g)}.`);
}

// ---------- Cachorros ----------
const dogAlive = d => d && Date.now() - d.born < DOG[d.raca].vida * DAY;
const dogAwake = d => dogAlive(d) && d.fedUntil > Date.now();
function actDog(slot) {
  const d = S().dogs && S().dogs[slot];
  if (!isHome()) {
    if (!d) return;
    return toast(dogAwake(d) ? `${d.nome} está acordado vigiando a ${SLOT_NAME[slot]}. Cuidado!` : `${d.nome} está dormindo… é a sua chance.`);
  }
  if (!d) {
    tab = 'loja'; shopSeg = 'caes'; renderPane();
    return toast(`Compre um cachorro na Loja para vigiar a ${SLOT_NAME[slot]}.`);
  }
  if (!dogAwake(d)) return feedDog(slot);
  const dias = Math.ceil((d.born + DOG[d.raca].vida * DAY - Date.now()) / DAY);
  toast(`${d.nome} está de guarda. Comida por mais ${fmt((d.fedUntil - Date.now()) / 1000)} · vive mais ${dias} ${dias > 1 ? 'dias' : 'dia'}.`);
}
function feedDog(slot) {
  const d = state.dogs[slot];
  if (!d || dogAwake(d)) return;
  if (state.dogFood <= 0) {
    tab = 'loja'; shopSeg = 'caes'; renderPane();
    return toast(`Acabou a ração de cachorro. Compre na Loja (${DOG_FOOD.custo} moedas, dura ${DOG_FOOD.horas}h).`, 'bad');
  }
  state.dogFood--;
  d.fedUntil = Date.now() + DOG_FOOD.horas * 3600e3;
  sfx('feed');
  const pos = dogPos(slot);
  popupAt(pos, 'Acordado!', '#ffe08a');
  addXP(2, pos);
  done();
}
function buyDog(raca, slot) {
  const b = DOG[raca];
  if (state.dogs[slot]) return toast(`Já tem um cachorro vigiando a ${SLOT_NAME[slot]}.`);
  if (state.level < b.nivel) return toast(`${b.nome} libera no nível ${b.nivel}.`);
  if (state.coins < b.custo) return toast(`${b.nome} custa ${b.custo} moedas.`, 'bad');
  const used = Object.values(state.dogs).filter(Boolean).map(d => d.nome);
  const nome = DOG_NAMES.filter(n => !used.includes(n))[Math.floor(Math.random() * (DOG_NAMES.length - used.length))];
  state.coins -= b.custo;
  // O cachorro chega de barriga cheia.
  state.dogs[slot] = { raca, nome, born: Date.now(), fedUntil: Date.now() + DOG_FOOD.horas * 3600e3, lastXp: Date.now() };
  sfx('buy'); sfx('bark');
  addXP(5, null);
  toast(`${nome}, ${b.nome.toLowerCase()}, agora vigia a sua ${SLOT_NAME[slot]}!`, 'good');
  if (isHome()) setScene(slot === 'roca' ? 'roca' : 'animais');
  done();
}
function buyDogFood(n) {
  const cost = DOG_FOOD.custo * n;
  if (state.coins < cost) return toast(`Faltam moedas: ${n} ração custa ${cost}.`, 'bad');
  state.coins -= cost; state.dogFood += n;
  sfx('buy');
  toast(`+${n} ração de cachorro`, 'good');
  done();
}

// ---------- Tempo de vida, XP diário dos cães e avisos ----------
function addNews(msg) {
  state.news.unshift({ at: Date.now(), msg });
  state.news.length = Math.min(state.news.length, 30);
  renderTabs();
}
function tickLife() {
  const now = Date.now();
  let changed = false;
  for (const a of state.animals.slice()) {
    const def = ANIMAL[a.k];
    if (now - a.born < def.vida * DAY) continue;
    state.animals = state.animals.filter(x => x !== a); delete amb[a.id];
    const msg = `${seuSua(def)} ficou ${def.f ? 'velhinha' : 'velhinho'} e foi descansar. Você pode comprar outr${def.f ? 'a' : 'o'} na Loja.`;
    addNews(msg); toast(msg); changed = true;
  }
  for (const slot of ['roca', 'animais']) {
    const d = state.dogs[slot];
    if (!d) continue;
    const b = DOG[d.raca];
    if (!dogAlive(d)) {
      state.dogs[slot] = null;
      const msg = `${d.nome} ficou velhinho e foi descansar. A ${SLOT_NAME[slot]} está sem cachorro.`;
      addNews(msg); toast(msg); changed = true;
      continue;
    }
    const days = Math.floor((now - d.lastXp) / DAY);
    if (days >= 1) {
      const n = Math.min(days, 3) * b.xpDia;
      d.lastXp += days * DAY;
      addXP(n, null);
      addNews(`${d.nome} vigiou a sua ${SLOT_NAME[slot]} e rendeu +${n} XP.`);
      changed = true;
    }
  }
  if (changed) done();
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
  sfx('buy');
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
  sfx('buy');
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
  sfx('coin');
  done();
}
function sellAll() {
  let total = 0;
  for (const [id, q] of Object.entries(state.barn)) total += q * (item(id)?.preco || 0);
  if (!total) return;
  state.barn = {}; state.coins += total; state.stats.vendido += total;
  sfx('coin');
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
      b: Math.random() < 0.08 ? 1 : 0,
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
  if (!cur || Date.now() > cur.refreshAt || !cur.animals || cur.animals.some(a => !a.born)) state.nb[id] = genNeighbor();
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
  if (['seed', 'hoe', 'fert'].includes(state.tool)) state.tool = 'hand';
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
// Limite de itens por amigo por dia: 3 da plantação e 2 dos animais.
function stealLimit() {
  const today = Math.floor(Date.now() / DAY), key = (view.kind === 'friend' ? view.uid : view.id) + ':' + today;
  return state.limits[key] || (state.limits[key] = { d: today, roca: 0, animais: 0 });
}
// O cachorro do dono pode espantar (e às vezes morder) quem tenta pegar.
// Nos vizinhos da vila o cachorro está sempre acordado; nos amigos, só se tiver comida.
function guarded(slot, pos, visit) {
  let nome, protege, morde;
  if (view.kind === 'friend') {
    const d = view.data.dogs && view.data.dogs[slot];
    if (!dogAwake(d)) return false;
    nome = d.nome; protege = DOG[d.raca].protege; morde = DOG[d.raca].morde;
  } else { nome = view.cao; protege = view.pega; morde = 0.7; }
  if (Math.random() >= protege) return false;
  const bitten = Math.random() < morde, loss = bitten ? Math.min(state.coins, 10) : 0;
  if (loss) addCoins(-loss, pos);
  sfx('bark');
  toast(bitten ? `${nome}, o cachorro de ${view.nome}, te mordeu! −${loss} moedas` : `${nome}, o cachorro de ${view.nome}, te espantou!`, 'bad');
  sendVisit(Object.assign(visit, { caught: true, coins: loss }));
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
  if (p.b > 0 && has('pest')) { p.b--; what = 'b'; sfx('pest'); }
  else if (p.w > 0 && has('weed')) { p.w--; what = 'w'; sfx('weed'); }
  else if (p.dry && has('water')) { p.dry = false; what = 'dry'; sfx('water'); }
  if (what) { help(pos); sendVisit({ t: 'help', what, plot: i, pid: p.id }); return done(); }
  if (ripe(p) && tool === 'hand') {
    const key = visitKey(p.id), lim = stealLimit();
    if (alreadyTook(p, key)) return toast('Você já pegou daqui. Não exagere!');
    if (lim.roca >= STEAL_MAX.roca) return toast(`Você já pegou ${STEAL_MAX.roca} itens da plantação de ${view.nome} hoje. Volte amanhã!`);
    p.stolen = true; state.log[key] = Date.now(); lim.roca++;
    if (guarded('roca', pos, { t: 'steal', plot: i, pid: p.id, qty: 0 })) return done();
    const crop = CROP[p.c];
    sfx('harvest');
    gain(crop.id, 1, pos); state.stats.roubado++; addXP(1, pos);
    sendVisit({ t: 'steal', plot: i, pid: p.id, qty: 1 });
    return done();
  }
}

function awayAnimal(a, def, prod, pos) {
  if (!a.fed && !a.ready) { a.fed = true; sfx('feed'); help(pos); sendVisit({ t: 'feed', animal: a.id }); return done(); }
  if (a.ready) {
    const key = visitKey(a.id + ':' + a.n), lim = stealLimit();
    if (alreadyTook(a, key)) return toast('Você já pegou deste bicho. Não exagere!');
    if (lim.animais >= STEAL_MAX.animais) return toast(`Você já pegou ${STEAL_MAX.animais} itens dos animais de ${view.nome} hoje. Volte amanhã!`);
    a.stolen = true; state.log[key] = Date.now(); lim.animais++;
    if (guarded('animais', pos, { t: 'stealA', animal: a.id })) return done();
    sfx('collect');
    if (prod.vira) { state.fert[prod.vira] = (state.fert[prod.vira] || 0) + 1; popupAt(pos, `+1 ${FERT[prod.vira].nome}`, '#9be36a'); }
    else gain(prod.id, 1, pos);
    addXP(1, pos); state.stats.roubado++;
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
    const note = (m, steal) => (msgs[who] = msgs[who] || []).push(m);
    const p = Number.isInteger(v.plot) && v.plot >= 0 && v.plot < N ? state.plots[v.plot] : null;
    const a = typeof v.animal === 'string' ? state.animals.find(x => x.id === v.animal) : null;
    if (!state.friends.includes(v.from)) continue;
    if (v.caught && (v.t === 'steal' || v.t === 'stealA')) {
      // Seu cachorro espantou (ou mordeu) um amigo que tentou pegar coisas.
      const slot = v.t === 'steal' ? 'roca' : 'animais', d = state.dogs[slot];
      const coins = clamp(Math.round(Number(v.coins) || 0), 0, 10), nome = d ? d.nome : 'Seu cachorro';
      if (coins) state.coins += coins;
      addXP(d ? DOG[d.raca].xpPega : 5, null);
      const msg = coins ? `${nome} mordeu ${who}, que tentou pegar da sua ${SLOT_NAME[slot]}, e ganhou ${coins} moedas!`
        : `${nome} espantou ${who}, que tentou pegar da sua ${SLOT_NAME[slot]}.`;
      addNews(msg); toast(msg, 'good');
      continue;
    }
    if (v.t === 'help' && p && p.id === v.pid) {
      if (v.what === 'w') p.w = Math.max(0, p.w - 1);
      if (v.what === 'b') p.b = Math.max(0, p.b - 1);
      if (v.what === 'dry') p.dry = false;
      note('ajudou na sua roça');
    } else if (v.t === 'steal' && p && p.id === v.pid && p.s === 'growing') {
      const qty = 1;
      p.dmg = Math.min(CROP[p.c].rend - 1, p.dmg + qty);
      if (!p.th.includes(v.from)) p.th.push(v.from);
      note(`pegou ${qty} ${CROP[p.c].nome} da sua plantação`, true);
    } else if (v.t === 'feed' && a && !a.fed && !a.ready) {
      a.fed = true; note('alimentou seus animais');
    } else if (v.t === 'stealA' && a && a.ready) {
      a.ready = false; a.g = 0; a.n++;
      note(`pegou 1 ${PRODUCT[ANIMAL[a.k].prod].nome} dos seus animais`, true);
    }
  }
  for (const [who, list2] of Object.entries(msgs)) {
    // Junta repetições: "pegou 1 Milho" duas vezes vira "pegou 2 Milho".
    const count = {};
    for (const m of list2) count[m] = (count[m] || 0) + 1;
    const parts = Object.entries(count).map(([m, n]) => n > 1 && m.startsWith('pegou 1 ') ? m.replace('pegou 1 ', `pegou ${n} `) : m);
    const msg = `${who} ${parts.join(', ')}.`;
    addNews(msg); toast(msg, 'good');
  }
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
    if (p.w < 2 && Math.random() < 0.45 / crop.tempo * dt) p.w++;
    if (p.b < 1 && Math.random() < 0.12 / crop.tempo * dt) p.b++; // insetos só de vez em quando
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
    const k = Math.min(1, (SMALL_ANIMALS.includes(a.k) ? 0.55 : 0.3) * dt / d);
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
    const plots = S().plots, home = isHome();
    let c0 = COLS, c1 = 0, r0 = ROWS, r1 = 0;
    plots.forEach((p, i) => {
      if (p.s === 'locked' && !(home && canBuy(i))) return;
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
  if (settings.tema === 'dia') return 'dia';
  if (settings.tema === 'noite') return 'noite';
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
// Cachorro virado para a esquerda. raca muda as cores; sleeping = deitado dormindo.
function drawDog(x, y, s, t, raca = 'caramelo', sleeping = false) {
  const b = DOG[raca] || DOG.caramelo, body = b.cor, dark = b.cor2;
  ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(x, y, s * 0.32, s * 0.06, 0, 0, 7); ctx.fill();
  ctx.lineCap = 'round';
  if (sleeping) {
    ctx.strokeStyle = body; ctx.lineWidth = s * 0.05;
    ctx.beginPath(); ctx.moveTo(x + s * 0.26, y - s * 0.07); ctx.quadraticCurveTo(x + s * 0.38, y - s * 0.02, x + s * 0.3, y); ctx.stroke();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x + s * 0.04, y - s * 0.08, s * 0.25, s * 0.09, 0, 0, 7); ctx.fill();
    if (raca === 'pastor') { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x + s * 0.08, y - s * 0.13, s * 0.15, s * 0.05, 0, 0, 7); ctx.fill(); }
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(x - s * 0.22, y - s * 0.08, s * 0.11, s * 0.08, 0, 0, 7); ctx.fill();
    ctx.fillStyle = raca === 'caramelo' ? '#a8692f' : dark;
    ctx.beginPath(); ctx.ellipse(x - s * 0.19, y - s * 0.13, s * 0.045, s * 0.07, 0.9, 0, 7); ctx.fill();
    if (raca === 'fila') { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x - s * 0.3, y - s * 0.07, s * 0.05, s * 0.04, 0, 0, 7); ctx.fill(); }
    line({ x: x - s * 0.27, y: y - s * 0.095 }, { x: x - s * 0.225, y: y - s * 0.09 }, '#222', Math.max(1, s * 0.018));
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x - s * 0.33, y - s * 0.075, s * 0.02, 0, 7); ctx.fill();
    const k = (t / 1600) % 1;
    ctx.fillStyle = `rgba(255,255,255,${0.95 - k * 0.9})`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `800 ${Math.max(9, Math.round(s * 0.17))}px 'Baloo 2', sans-serif`;
    ctx.fillText('z', x - s * 0.16 + k * s * 0.12, y - s * 0.26 - k * s * 0.22);
    ctx.font = `800 ${Math.max(8, Math.round(s * 0.12))}px 'Baloo 2', sans-serif`;
    ctx.fillText('z', x - s * 0.05 + k * s * 0.12, y - s * 0.38 - k * s * 0.22);
    ctx.lineCap = 'butt';
    return;
  }
  const wag = Math.sin(t / 120) * 0.5;
  ctx.strokeStyle = body; ctx.lineWidth = s * 0.06;
  ctx.beginPath(); ctx.moveTo(x + s * 0.22, y - s * 0.22); ctx.lineTo(x + s * 0.36, y - s * 0.34 + wag * s * 0.1); ctx.stroke();
  ctx.fillStyle = body;
  ctx.beginPath(); ctx.ellipse(x + s * 0.05, y - s * 0.18, s * 0.22, s * 0.12, 0, 0, 7); ctx.fill();
  ctx.fillRect(x - s * 0.12, y - s * 0.12, s * 0.06, s * 0.12); ctx.fillRect(x + s * 0.16, y - s * 0.12, s * 0.06, s * 0.12);
  if (raca === 'pastor') { ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(x + s * 0.09, y - s * 0.25, s * 0.15, s * 0.06, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x - s * 0.17, y - s * 0.3, s * 0.13, 0, 7); ctx.fill();
  ctx.fillStyle = raca === 'caramelo' ? '#a8692f' : dark;
  ctx.beginPath(); ctx.ellipse(x - s * 0.26, y - s * 0.28, s * 0.05, s * 0.1, 0.4, 0, 7); ctx.fill();
  if (raca === 'pastor') { ctx.beginPath(); ctx.moveTo(x - s * 0.12, y - s * 0.4); ctx.lineTo(x - s * 0.08, y - s * 0.52); ctx.lineTo(x - s * 0.03, y - s * 0.39); ctx.fill(); }
  if (raca === 'fila') { ctx.beginPath(); ctx.ellipse(x - s * 0.28, y - s * 0.26, s * 0.06, s * 0.05, 0, 0, 7); ctx.fill(); }
  ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x - s * 0.21, y - s * 0.32, s * 0.02, 0, 7); ctx.arc(x - s * 0.3, y - s * 0.27, s * 0.025, 0, 7); ctx.fill();
  ctx.lineCap = 'butt';
}
// Casinha de cachorro, com a base centrada em (x, y).
function drawKennel(x, y, s) {
  const w = s * 0.62, h = s * 0.4;
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, w * 0.7, s * 0.06, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#b07a44'; ctx.fillRect(x - w / 2, y - h, w, h);
  ctx.strokeStyle = 'rgba(90,56,26,.45)'; ctx.lineWidth = 1;
  for (let k = 1; k < 4; k++) { ctx.beginPath(); ctx.moveTo(x - w / 2, y - h * k / 4); ctx.lineTo(x + w / 2, y - h * k / 4); ctx.stroke(); }
  ctx.fillStyle = '#c8402f';
  ctx.beginPath(); ctx.moveTo(x - w * 0.64, y - h + s * 0.02); ctx.lineTo(x, y - h - s * 0.3); ctx.lineTo(x + w * 0.64, y - h + s * 0.02); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#8f2a1e'; ctx.fillRect(x - w * 0.64, y - h, w * 1.28, s * 0.035);
  ctx.fillStyle = '#3a2412'; ctx.beginPath(); ctx.arc(x, y - h * 0.5, w * 0.22, Math.PI, 0); ctx.lineTo(x + w * 0.22, y); ctx.lineTo(x - w * 0.22, y); ctx.fill();
  // tigela
  ctx.fillStyle = '#7d8c9a'; ctx.beginPath(); ctx.ellipse(x + w * 0.62, y, s * 0.08, s * 0.035, 0, 0, 7); ctx.fill();
}
// Onde fica o cachorro de cada lugar (na cena atual).
const KENNEL_AT = () => ({ x: L.ox - L.W * 0.8, y: L.oy + L.W * 0.22 });
const DOG_AT = () => ({ x: L.ox - L.W * 1.35, y: L.oy + L.W * 0.55 });
function dogPos(slot) {
  if (scene !== (slot === 'roca' ? 'roca' : 'animais')) return null;
  const p = DOG_AT(); return { x: p.x, y: p.y - L.W * 0.25 };
}
// Casinha + cachorro (ou o lugar vazio) na sua roça ou na de um amigo.
// A casinha vai atrás da cerca; o cachorro, na frente, para aparecer bem.
function drawKennelSpot(slot, s, home) {
  const d = s.dogs && s.dogs[slot];
  if (!home && !dogAlive(d)) return;
  const k = KENNEL_AT();
  drawKennel(k.x, k.y, L.W * 0.85);
}
function drawDogSpot(slot, s, t, home) {
  const W = L.W, k = KENNEL_AT(), p = DOG_AT();
  const d = s.dogs && s.dogs[slot];
  if (!home && !dogAlive(d)) return;
  if (dogAlive(d)) {
    if (hover && hover.kind === 'dog' && hover.slot === slot) {
      ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(p.x, p.y, W * 0.26, W * 0.08, 0, 0, 7); ctx.stroke();
    }
    drawDog(p.x, p.y, W * 0.72, t, d.raca, !dogAwake(d));
  } else {
    const R = clamp(W * 0.1, 9, 14), m = { x: k.x, y: k.y - W * 0.52 };
    ctx.fillStyle = 'rgba(255,253,242,.95)'; ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 7); ctx.fill(); ctx.stroke();
    line({ x: m.x - R * 0.5, y: m.y }, { x: m.x + R * 0.5, y: m.y }, '#4f9a2f', 2.5);
    line({ x: m.x, y: m.y - R * 0.5 }, { x: m.x, y: m.y + R * 0.5 }, '#4f9a2f', 2.5);
  }
  hits.push({ kind: 'dog', slot, x: (k.x + p.x) / 2, y: p.y - W * 0.2, r: W * 0.4 });
}
function dogBubble(slot, s, t, home) {
  const d = s.dogs && s.dogs[slot];
  if (!home || !dogAlive(d) || dogAwake(d)) return;
  const p = DOG_AT();
  drawBubbleAt(p.x, p.y - L.W * 0.55, 'bone', d, t, 3);
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
  } else if (id === 'bacon') {
    for (const dy of [-2.5, 2.5]) {
      ctx.save(); ctx.translate(x, y + dy * s); ctx.rotate(-0.25);
      ctx.fillStyle = '#c8554a'; ctx.beginPath(); ctx.moveTo(-7 * s, -1.6 * s);
      for (let k = -7; k <= 7; k += 2) ctx.lineTo(k * s, (k % 4 === 0 ? -2.4 : -1.2) * s);
      for (let k = 7; k >= -7; k -= 2) ctx.lineTo(k * s, (k % 4 === 0 ? 1.2 : 2.4) * s);
      ctx.fill();
      ctx.strokeStyle = '#f3d2c4'; ctx.lineWidth = 0.9 * s;
      ctx.beginPath(); ctx.moveTo(-6.5 * s, 0); for (let k = -6; k <= 6; k += 2) ctx.lineTo(k * s, (k % 4 === 0 ? -0.5 : 0.5) * s); ctx.stroke();
      ctx.restore();
    }
  } else if (id === 'pelo') {
    ctx.fillStyle = '#ece7de'; ctx.strokeStyle = '#c8bda2';
    for (const [dx, dy, r] of [[-2.5, 1, 3.8], [2.5, 1, 3.8], [0, -2, 4]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#f7f4ef'; ctx.beginPath(); ctx.arc(x - 1 * s, y - 2.5 * s, 1.6 * s, 0, 7); ctx.fill();
  } else if (id === 'ovopata' || id === 'ovoangola') {
    const pata = id === 'ovopata', rx = pata ? 5 : 3.8, ry = pata ? 6.5 : 5.2;
    ctx.fillStyle = pata ? '#dcefe6' : '#efe0c4'; ctx.strokeStyle = pata ? '#a9c9ba' : '#c9b48c';
    ctx.beginPath(); ctx.ellipse(x, y + 1 * s, rx * s, ry * s, 0, 0, 7); ctx.fill(); ctx.stroke();
    if (!pata) { ctx.fillStyle = '#9a7650'; for (const [dx, dy] of [[-1.5, -1], [1.2, 0.5], [-0.5, 2.5], [1.6, 3], [0.3, -2.8], [-2, 2]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, 0.45 * s, 0, 7); ctx.fill(); } }
    ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.beginPath(); ctx.ellipse(x - 1.5 * s, y - 1.5 * s, 1 * s, 1.7 * s, 0.3, 0, 7); ctx.fill();
  } else if (id === 'esterco') {
    ctx.fillStyle = '#6b4a2a';
    ctx.beginPath(); ctx.ellipse(x, y + 4 * s, 6.5 * s, 2.6 * s, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 1 * s, 4.8 * s, 2.3 * s, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 0.5 * s, y - 1.6 * s, 3 * s, 2 * s, 0, 0, 7); ctx.fill();
    leaf(x + 2 * s, y - 2.5 * s, 5 * s, 1.6 * s, 0.5, '#4fa83a');
  } else if (id === 'crina') {
    ctx.strokeStyle = '#5a3a20'; ctx.lineWidth = 1 * s; ctx.lineCap = 'round';
    for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(x + k * 0.6 * s, y - 6 * s); ctx.quadraticCurveTo(x + k * 1.2 * s, y, x + k * 1.6 * s + 1 * s, y + 6 * s); ctx.stroke(); }
    ctx.fillStyle = '#c8402f'; ctx.fillRect(x - 3 * s, y - 4 * s, 6 * s, 1.8 * s);
    ctx.lineCap = 'butt';
  } else if (id === 'pena') {
    line({ x: x + 3 * s, y: y + 7 * s }, { x: x - 2 * s, y: y - 7 * s }, '#8a7a4a', 0.8 * s);
    ctx.save(); ctx.translate(x - 1 * s, y - 3 * s); ctx.rotate(-0.35);
    ctx.fillStyle = '#3f9a5a'; ctx.beginPath(); ctx.ellipse(0, 0, 3.4 * s, 5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#e0b030'; ctx.beginPath(); ctx.ellipse(0, -1 * s, 2 * s, 2.6 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#1f4fa0'; ctx.beginPath(); ctx.ellipse(0, -1 * s, 1.1 * s, 1.5 * s, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
}

// ============================================================
// Animais (desenhados virados para a direita; dir=-1 espelha)
// ============================================================
function drawAnimal(k, x, y, s, t, dir, moving) {
  const step = moving ? Math.sin(t / 90) : 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  const shadow = { galinha: 9, vaca: 22, ovelha: 16, porco: 16, coelho: 9, angola: 9, pato: 10, jumento: 21, cavalo: 23, pavao: 12 }[k];
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
  } else if (k === 'coelho') {
    const hop = moving ? Math.abs(Math.sin(t / 110)) * 3 * s : 0;
    ctx.translate(0, -hop);
    ctx.fillStyle = '#ece6dc'; ctx.beginPath(); ctx.ellipse(3 * s, -1 * s, 3 * s, 1.3 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f4f0ea'; ctx.beginPath(); ctx.ellipse(0, -7 * s, 8 * s, 6 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(-8 * s, -8 * s, 2.6 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#f4f0ea'; ctx.beginPath(); ctx.arc(6 * s, -11 * s, 4.6 * s, 0, 7); ctx.fill();
    for (const [ex, a] of [[4.3, -0.25], [7.4, 0.18]]) {
      ctx.fillStyle = '#f4f0ea'; ctx.beginPath(); ctx.ellipse(ex * s, -19 * s, 1.7 * s, 5.2 * s, a, 0, 7); ctx.fill();
      ctx.fillStyle = '#f2a7b0'; ctx.beginPath(); ctx.ellipse(ex * s, -19 * s, 0.8 * s, 3.6 * s, a, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(7.8 * s, -12 * s, 0.8 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#e98a9a'; ctx.beginPath(); ctx.arc(10.4 * s, -10.5 * s, 0.8 * s, 0, 7); ctx.fill();
  } else if (k === 'angola') {
    ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 1.3 * s;
    ctx.beginPath(); ctx.moveTo(-2 * s, -5 * s); ctx.lineTo(-2 * s + step * 1.5 * s, 0); ctx.moveTo(2 * s, -5 * s); ctx.lineTo(2 * s - step * 1.5 * s, 0); ctx.stroke();
    ctx.fillStyle = '#4a4f5a'; ctx.beginPath(); ctx.ellipse(0, -10 * s, 9 * s, 6.8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy] of [[-5, -12], [-2, -14], [1, -11], [4, -13], [-6, -8], [-3, -9], [0, -7], [3, -8], [6, -10], [-1, -5], [2, -4], [5, -6]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 0.55 * s, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#4a4f5a'; ctx.beginPath(); ctx.ellipse(6 * s, -15 * s, 2 * s, 3.5 * s, 0.3, 0, 7); ctx.fill();
    ctx.fillStyle = '#a9cbe6'; ctx.beginPath(); ctx.arc(7.2 * s, -18 * s, 2.8 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9a441'; ctx.beginPath(); ctx.moveTo(6 * s, -20 * s); ctx.lineTo(7 * s, -23.5 * s); ctx.lineTo(8.2 * s, -20 * s); ctx.fill();
    ctx.fillStyle = '#e03a2f'; ctx.beginPath(); ctx.ellipse(9 * s, -15.5 * s, 0.9 * s, 1.4 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9c29a'; ctx.beginPath(); ctx.moveTo(9.6 * s, -19 * s); ctx.lineTo(12 * s, -18 * s); ctx.lineTo(9.6 * s, -17 * s); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(8 * s, -18.6 * s, 0.7 * s, 0, 7); ctx.fill();
  } else if (k === 'pato') {
    ctx.fillStyle = '#f0a020';
    ctx.beginPath(); ctx.ellipse((-2 + step) * s, -0.5 * s, 2.4 * s, 1 * s, 0, 0, 7); ctx.ellipse((3 - step) * s, -0.5 * s, 2.4 * s, 1 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#fbfbf7';
    ctx.beginPath(); ctx.moveTo(-9 * s, -9 * s); ctx.lineTo(-13 * s, -14 * s); ctx.lineTo(-6 * s, -12 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -7.5 * s, 10 * s, 5.8 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d8d2c4'; ctx.lineWidth = 0.8 * s; ctx.stroke();
    ctx.fillStyle = '#eeeae0'; ctx.beginPath(); ctx.ellipse(-2 * s, -8 * s, 5.5 * s, 3 * s, 0.1, 0, 7); ctx.fill();
    ctx.fillStyle = '#fbfbf7'; ctx.beginPath(); ctx.ellipse(6 * s, -12.5 * s, 2.8 * s, 5 * s, 0.2, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(7.2 * s, -17.5 * s, 3.8 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.ellipse(11.8 * s, -16.8 * s, 3.4 * s, 1.4 * s, 0.05, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(8.5 * s, -18.6 * s, 0.8 * s, 0, 7); ctx.fill();
  } else if (k === 'jumento' || k === 'cavalo') {
    const horse = k === 'cavalo';
    const body = horse ? '#8a5a33' : '#9a9590', light = horse ? '#a8744a' : '#d9d3c8', mane = horse ? '#3a2412' : '#5a5550';
    const legH = horse ? 14 : 11;
    for (const [lx, ph] of [[-12, 1], [-7, -1], [8, -1], [13, 1]]) { leg(lx + step * ph, legH, body, 3); ctx.fillStyle = '#2a1e16'; ctx.fillRect((lx + step * ph) * s - 1.6 * s, -1.8 * s, 3.2 * s, 1.8 * s); }
    ctx.strokeStyle = mane; ctx.lineWidth = (horse ? 3 : 1.4) * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-16 * s, -(legH + 8) * s); ctx.quadraticCurveTo(-21 * s, -(legH + 2) * s, -19 * s, -(legH - 4) * s); ctx.stroke();
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, -(legH + 7) * s, 17 * s, 8.5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(1 * s, -(legH + 3) * s, 12 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    // pescoço e cabeça
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(10 * s, -(legH + 12) * s); ctx.lineTo(17 * s, -(legH + 24) * s); ctx.lineTo(23 * s, -(legH + 20) * s); ctx.lineTo(16 * s, -(legH + 5) * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(21 * s, -(legH + 20) * s, 6.5 * s, 4 * s, 0.55, 0, 7); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(24.5 * s, -(legH + 16.5) * s, 3.4 * s, 2.8 * s, 0.4, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a1e16'; ctx.beginPath(); ctx.arc(25.5 * s, -(legH + 16.5) * s, 0.6 * s, 0, 7); ctx.fill();
    if (horse) {
      ctx.strokeStyle = mane; ctx.lineWidth = 2.4 * s;
      ctx.beginPath(); ctx.moveTo(10 * s, -(legH + 13) * s); ctx.lineTo(17 * s, -(legH + 25) * s); ctx.stroke();
      ctx.fillStyle = '#f3efe6'; ctx.beginPath(); ctx.ellipse(22 * s, -(legH + 20.5) * s, 1 * s, 2.6 * s, 0.55, 0, 7); ctx.fill();
      ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(17 * s, -(legH + 24) * s); ctx.lineTo(17.5 * s, -(legH + 28) * s); ctx.lineTo(19 * s, -(legH + 24.5) * s); ctx.fill();
    } else {
      ctx.strokeStyle = mane; ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.moveTo(10.5 * s, -(legH + 13) * s); ctx.lineTo(17 * s, -(legH + 24) * s); ctx.stroke();
      for (const [ex, a] of [[15.5, -0.35], [18.5, 0.05]]) {
        ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(ex * s, -(legH + 29) * s, 1.8 * s, 6 * s, a, 0, 7); ctx.fill();
        ctx.fillStyle = mane; ctx.beginPath(); ctx.ellipse(ex * s + Math.sin(a) * 4 * s, -(legH + 33.5) * s, 1.2 * s, 1.6 * s, a, 0, 7); ctx.fill();
      }
    }
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(20 * s, -(legH + 22) * s, 0.9 * s, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  } else if (k === 'pavao') {
    // leque de penas atrás do corpo
    const fan = moving ? 0.75 : 1;
    for (let j = 0; j < 9; j++) {
      const a = -Math.PI * (0.08 + 0.84 * j / 8), len = 17 * s * fan, cx = -3 * s, cy = -10 * s;
      const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len * 0.95;
      line({ x: cx, y: cy }, { x: ex, y: ey }, '#2e7d4f', 2.2 * s);
      ctx.fillStyle = '#3f9a5a'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.6 * s, 3.4 * s, a + Math.PI / 2, 0, 7); ctx.fill();
      ctx.fillStyle = '#e0b030'; ctx.beginPath(); ctx.arc(ex, ey, 1.6 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#1f4fa0'; ctx.beginPath(); ctx.arc(ex, ey, 0.9 * s, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = '#8a8f99'; ctx.lineWidth = 1.2 * s;
    ctx.beginPath(); ctx.moveTo(-1 * s, -4 * s); ctx.lineTo(-1 * s + step * 1.4 * s, 0); ctx.moveTo(2 * s, -4 * s); ctx.lineTo(2 * s - step * 1.4 * s, 0); ctx.stroke();
    ctx.fillStyle = '#1f5fa8'; ctx.beginPath(); ctx.ellipse(0, -9 * s, 6 * s, 6.5 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a78c8'; ctx.beginPath(); ctx.ellipse(3 * s, -15 * s, 2 * s, 5 * s, 0.25, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.arc(4.8 * s, -20 * s, 2.5 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#1f5fa8'; ctx.lineWidth = 0.6 * s;
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(4.6 * s, -22 * s); ctx.lineTo((4.6 + d * 1.4) * s, -25.5 * s); ctx.stroke(); ctx.fillStyle = '#2a78c8'; ctx.beginPath(); ctx.arc((4.6 + d * 1.4) * s, -25.8 * s, 0.7 * s, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(5.6 * s, -20.5 * s, 1 * s, 0.6 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(5.8 * s, -20.5 * s, 0.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#c9b27a'; ctx.beginPath(); ctx.moveTo(7 * s, -20.5 * s); ctx.lineTo(8.8 * s, -19.8 * s); ctx.lineTo(7 * s, -19.2 * s); ctx.fill();
  }
  ctx.restore();
}
const ANIMAL_H = { galinha: 24, vaca: 34, ovelha: 25, porco: 25, coelho: 22, angola: 23, pato: 22, jumento: 42, cavalo: 46, pavao: 30 };
const SMALL_ANIMALS = ['galinha', 'coelho', 'angola', 'pato'];

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
    // Pronto para colher: um check verde.
    ctx.fillStyle = '#43a047'; ctx.beginPath(); ctx.arc(x, y, 7.5 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x - 3.6 * s, y + 0.2 * s); ctx.lineTo(x - 1 * s, y + 3 * s); ctx.lineTo(x + 4 * s, y - 2.8 * s); ctx.stroke();
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
  } else if (kind === 'bone') {
    ctx.fillStyle = '#f3ead6'; ctx.strokeStyle = '#b8a47a'; ctx.lineWidth = 0.8 * s;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
    ctx.fillRect(-4.5 * s, -1.3 * s, 9 * s, 2.6 * s);
    for (const dx of [-4.5, 4.5]) for (const dy of [-1.5, 1.5]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, 1.8 * s, 0, 7); ctx.fill(); }
    ctx.restore();
  } else if (kind === 'prod') {
    drawProduct(ANIMAL[obj.k].prod, x, y, s * 0.95);
  } else if (kind === 'feed') {
    ctx.fillStyle = '#f2c14e';
    for (const [dx, dy] of [[-3, 2], [0, -1], [3, 2], [-1.5, 5], [1.5, 5], [0, 2]]) { ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s - 1 * s, 1.5 * s, 2.2 * s, 0, 0, 7); ctx.fill(); }
    ctx.strokeStyle = '#b8862a'; ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x, y - 2 * s); ctx.stroke();
  }
  if (kind === 'prod') {
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
    if (home && canBuy(i)) {
      ctx.setLineDash([4, 4]); quad(p1, p2, p3, p4, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.6)', 1.5); ctx.setLineDash([]);
      const m = cellCenter(i);
      const pending = buyPending && buyPending.i === i && performance.now() < buyPending.until;
      if (!pending) {
        const R = clamp(W * 0.09, 8, 13);
        ctx.fillStyle = 'rgba(255,253,242,.9)'; ctx.strokeStyle = '#6b4220'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 7); ctx.fill(); ctx.stroke();
        line({ x: m.x - R * 0.5, y: m.y }, { x: m.x + R * 0.5, y: m.y }, '#4f9a2f', 2.2);
        line({ x: m.x, y: m.y - R * 0.5 }, { x: m.x, y: m.y + R * 0.5 }, '#4f9a2f', 2.2);
        if (hov) quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.9)', 2);
        return;
      }
      ctx.fillStyle = '#7a4a22'; ctx.fillRect(m.x - W * 0.03, m.y - W * 0.3, W * 0.06, W * 0.3);
      const bw = W * 0.56, bh = W * 0.26;
      ctx.fillStyle = '#d39a5c'; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 2;
      ctx.fillRect(m.x - bw / 2, m.y - W * 0.47, bw, bh); ctx.strokeRect(m.x - bw / 2, m.y - W * 0.47, bw, bh);
      ctx.fillStyle = '#4a2a10'; ctx.font = `800 ${Math.round(clamp(W * 0.11, 9, 15))}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Comprar?', m.x, m.y - W * 0.405);
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
  quad(p1, p2, p3, p4, dry ? '#b88a58' : p.s === 'withered' ? '#94704a' : p.fert ? '#74462a' : '#8b5a33');
  if (p.fert && p.s === 'growing') {
    ctx.fillStyle = 'rgba(255,225,120,.75)';
    for (const [u, v] of [[0.2, 0.5], [0.5, 0.82], [0.8, 0.45], [0.5, 0.2], [0.35, 0.35], [0.65, 0.65]]) { const q = iso(c + u, r + v); ctx.fillRect(q.x - 1, q.y - 1, 2, 2); }
  }
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
  if (view.kind === 'npc') { const q = iso(-0.55, 1.6); drawDog(q.x, q.y, W * 0.7, t); }
  else drawKennelSpot('roca', s, home);
  drawFence(COLS, ROWS, 'back');
  if (view.kind !== 'npc') drawDogSpot('roca', s, t, home);
  for (let sum = 0; sum <= COLS + ROWS - 2; sum++)
    for (let c = 0; c < COLS; c++) { const r = sum - c; if (r >= 0 && r < ROWS) drawPlot(r * COLS + c, s.plots[r * COLS + c], t, home); }
  nightOverlay(tod);
  for (let i = 0; i < N; i++) {
    const k = plotBubble(s.plots[i], home);
    if (k) { const m = cellCenter(i); drawBubbleAt(m.x, m.y - W * 0.55, k, s.plots[i], t, i); }
  }
  dogBubble('roca', s, t, home);
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
  if (view.kind === 'npc') { const q = iso(-0.6, 3.0); drawDog(q.x, q.y, W * 0.6, t); }
  else drawKennelSpot('animais', s, home);
  quad(iso(0, 0), iso(PEN_C, 0), iso(PEN_C, PEN_R), iso(0, PEN_R), '#a9d36c');
  ctx.fillStyle = 'rgba(170,130,70,.35)';
  for (const [c, r, k] of DIRT) { const q = iso(c, r); ctx.beginPath(); ctx.ellipse(q.x, q.y, W * k, W * k * 0.45, 0, 0, 7); ctx.fill(); }
  drawFence(PEN_C, PEN_R, 'back');
  if (view.kind !== 'npc') drawDogSpot('animais', s, t, home);
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
  dogBubble('animais', s, t, home);
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
  const sc = { galinha: 2.6, vaca: 1.6, ovelha: 2.2, porco: 2.1, coelho: 2.7, angola: 2.5, pato: 2.5, jumento: 1.45, cavalo: 1.35, pavao: 2.0 }[k];
  drawAnimal(k, SMALL_ANIMALS.includes(k) ? 46 : k === 'pavao' ? 56 : 38, 86, sc, 0, 1, false);
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
const dogIcon = raca => makeIcon('dog:' + raca, () => drawDog(50, 88, 118, 0, raca, false));
const bowlIcon = () => makeIcon('bowl', () => {
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(48, 74, 32, 7, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#c8402f'; ctx.beginPath(); ctx.moveTo(18, 50); ctx.lineTo(78, 50); ctx.lineTo(70, 72); ctx.lineTo(26, 72); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#a0301f'; ctx.beginPath(); ctx.ellipse(48, 50, 30, 8, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#9a6a3a';
  for (const [dx, dy] of [[-16, 0], [-8, -4], [0, -2], [8, -5], [16, -1], [-4, 3], [6, 2], [-12, -6], [12, 3]]) { ctx.beginPath(); ctx.arc(48 + dx, 49 + dy, 4, 0, 7); ctx.fill(); }
});
const fertIcon = id => makeIcon('f:' + id, () => {
  const f = FERT[id];
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(48, 86, 28, 6, 0, 0, 7); ctx.fill();
  // saco de adubo
  ctx.fillStyle = '#e9d6a8'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(24, 30); ctx.quadraticCurveTo(48, 20, 72, 30); ctx.lineTo(76, 82); ctx.quadraticCurveTo(48, 90, 20, 82); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(30, 30); ctx.lineTo(36, 18); ctx.lineTo(60, 18); ctx.lineTo(66, 30); ctx.fill(); ctx.stroke();
  ctx.fillStyle = f.cor; ctx.fillRect(22, 46, 52, 22);
  leaf(48, 64, 18, 5, -0.5, '#4fa83a'); leaf(48, 64, 18, 5, 0.5, '#6cc24a');
  ctx.fillStyle = '#fff'; ctx.font = "800 13px 'Baloo 2', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(f.id === 'basico' ? '25%' : f.id === 'premium' ? '50%' : '100%', 48, 50);
});

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
  { id: 'fert', nome: 'Adubo' },
];
const HOME_ONLY = ['seed', 'hoe', 'fert'];
const availTools = () => TOOLS.filter(t => isHome() || !HOME_ONLY.includes(t.id));

function renderTools() {
  const box = $('#tools'), hint = $('#sceneHint');
  box.hidden = scene !== 'roca';
  hint.hidden = scene === 'roca';
  hint.textContent = scene === 'animais'
    ? (isHome() ? 'Clique num animal com fome para dar comida (milho do celeiro ou ração comprada na hora) e depois recolha o que ele produzir. O cachorro fica do lado do galinheiro.' : 'Dê comida aos animais com fome para ajudar. Produto pronto dá para pegar um pouquinho.')
    : (isHome() ? 'Os espaços com + são lugares para decoração. Cada peça dá conforto, e conforto aumenta o XP que você ganha.' : 'Esta é a casa do seu vizinho.');
  box.innerHTML = '';
  availTools().forEach((t, k) => {
    const b = document.createElement('button');
    b.className = 'tool'; b.type = 'button';
    b.setAttribute('aria-pressed', String(state.tool === t.id));
    const icon = t.id === 'seed' ? `<img alt="" src="${cropIcon(state.seed)}">`
      : t.id === 'fert' ? `<img alt="" src="${fertIcon(state.fertSel)}">` : TOOL_ICONS[t.id];
    const label = t.id === 'seed' ? CROP[state.seed].nome
      : t.id === 'fert' ? `${FERT[state.fertSel].curto} ×${state.fert[state.fertSel] || 0}` : t.nome;
    b.innerHTML = `${icon}<span>${label}</span><kbd>${k + 1}</kbd>`;
    b.title = t.id === 'hand' ? 'Faz a ação certa: colhe, rega, tira mato e pragas, planta' : t.nome;
    b.addEventListener('click', () => setTool(t.id));
    box.appendChild(b);
  });
}
function setTool(id) {
  if (!isHome() && HOME_ONLY.includes(id)) return;
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
  const unread = state ? state.news.filter(n => n.at > state.newsSeen).length : 0, n = requests.length + unread;
  b.innerHTML = n ? `Amigos<span class="badge" aria-label="${n} novidades">${n}</span>` : 'Amigos';
}
function renderPane() {
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  const pane = $('#pane');
  let html = '';
  if (tab === 'loja') {
    const segs = [['sementes', 'Sementes'], ['adubo', 'Adubo'], ['animais', 'Animais'], ['caes', 'Cães'], ['decor', 'Casa']];
    html += `<div class="seg small" role="tablist">${segs.map(([id, n]) => `<button type="button" role="tab" data-seg="${id}" aria-selected="${shopSeg === id}">${n}</button>`).join('')}</div>`;
    if (shopSeg === 'sementes') {
      html += `<p class="hint">Escolha uma semente e clique na terra arada para plantar. O preço é cobrado no plantio.</p>`;
      for (const c of CROPS) {
        const locked = c.nivel > state.level, sel = state.seed === c.id && state.tool === 'seed';
        const lucro = c.rend * c.preco * c.safras - c.custo;
        html += `<div class="row ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}">
          <img alt="" src="${cropIcon(c.id)}">
          <div><div class="name">${c.nome}</div>
          <div class="meta">${c.custo} moedas · ${fmt(c.tempo)} · rende ${c.rend} × ${c.preco}<br><b>${c.safras} ${c.safras > 1 ? 'colheitas' : 'colheita'}</b> antes de secar · lucro ${lucro} · ${c.xp} XP</div></div>
          ${locked ? `<button class="btn" disabled>Nível ${c.nivel}</button>` : `<button class="btn ${sel ? 'gold' : ''}" data-seed="${c.id}">${sel ? 'Na mão' : 'Escolher'}</button>`}
        </div>`;
      }
    } else if (shopSeg === 'adubo') {
      html += `<p class="hint">Adubo faz a planta crescer mais rápido. Escolha o tipo e clique numa planta com a ferramenta Adubo. Vale um por safra.</p>`;
      for (const f of FERTS) {
        const locked = f.nivel > state.level, have = state.fert[f.id] || 0;
        const sel = state.tool === 'fert' && state.fertSel === f.id;
        html += `<div class="row ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}">
          <img alt="" src="${fertIcon(f.id)}">
          <div><div class="name">${f.nome}</div>
          <div class="meta">${f.corta >= 1 ? 'Deixa a planta pronta na hora' : `Corta ${f.corta * 100}% do tempo que falta`}<br>${f.custo} moedas · você tem <b>${have}</b></div></div>
          ${locked ? `<button class="btn" disabled>Nível ${f.nivel}</button>` : `<div class="stack">
            <button class="btn" data-buy-fert="${f.id}" data-n="1" ${state.coins < f.custo ? 'disabled' : ''}>Comprar 1</button>
            <button class="btn ghost" data-buy-fert="${f.id}" data-n="5" ${state.coins < f.custo * 5 ? 'disabled' : ''}>Comprar 5</button>
            ${have ? `<button class="btn ${sel ? 'gold' : 'ghost'}" data-use-fert="${f.id}">${sel ? 'Na mão' : 'Usar'}</button>` : ''}</div>`}
        </div>`;
      }
    } else if (shopSeg === 'animais') {
      html += `<p class="hint">Depois de produzir, o animal fica com fome: dê milho do celeiro ou compre a ração na hora. Cada animal vive um tempo e depois vai descansar. Você tem ${state.animals.length} de ${MAX_ANIMALS}.</p>`;
      for (const a of ANIMALS) {
        const locked = a.nivel > state.level, prod = PRODUCT[a.prod];
        const full = state.animals.length >= MAX_ANIMALS, have = state.animals.filter(x => x.k === a.id).length;
        const rende = prod.vira ? `vira ${prod.qtd} ${FERT[prod.vira].nome.toLowerCase()}` : `vende por ${prod.preco}`;
        html += `<div class="row ${locked ? 'locked' : ''}">
          <img alt="" src="${animalIcon(a.id)}">
          <div><div class="name">${a.nome}${have ? ` <span class="meta">(${have})</span>` : ''}</div>
          <div class="meta">${a.custo} moedas · vive ${a.vida} dias<br>${prod.nome} a cada ${fmt(a.tempo)} · ${rende}<br>comida: ${a.milho} milho ou ${a.racao} ${a.racao > 1 ? 'moedas' : 'moeda'} · ${a.xp} XP</div></div>
          ${locked ? `<button class="btn" disabled>Nível ${a.nivel}</button>` : `<button class="btn" data-buy-animal="${a.id}" ${full || state.coins < a.custo ? 'disabled' : ''}>Comprar</button>`}
        </div>`;
      }
    } else if (shopSeg === 'caes') {
      html += `<p class="hint">A casinha fica do lado do celeiro. Um cachorro vigia a plantação e outro os animais. Acordado (com ração), ele espanta quem tenta pegar suas coisas e às vezes morde, ganhando até 10 moedas do ladrão. A ração dura ${DOG_FOOD.horas}h.</p>`;
      for (const slot of ['roca', 'animais']) {
        const d = state.dogs[slot];
        if (!d) { html += `<div class="row"><div class="avatar" style="background:#b7b39c">?</div><div><div class="name">${slot === 'roca' ? 'Plantação' : 'Animais'} sem cachorro</div><div class="meta">Escolha uma raça aqui embaixo.</div></div><div></div></div>`; continue; }
        const b = DOG[d.raca], awake = dogAwake(d), dias = Math.max(1, Math.ceil((d.born + b.vida * DAY - Date.now()) / DAY));
        html += `<div class="row ${awake ? '' : 'sel'}"><img alt="" src="${dogIcon(d.raca)}">
          <div><div class="name">${esc(d.nome)} · ${slot === 'roca' ? 'plantação' : 'animais'}</div>
          <div class="meta">${awake ? `Acordado · ração por mais ${fmt((d.fedUntil - Date.now()) / 1000)}` : '<b>Dormindo de fome!</b> Não está vigiando.'}<br>${b.nome} · vive mais ${dias} ${dias > 1 ? 'dias' : 'dia'}</div></div>
          ${awake ? '<div></div>' : `<button class="btn" data-feed-dog="${slot}">Dar ração</button>`}</div>`;
      }
      html += `<div class="row"><img alt="" src="${bowlIcon()}">
        <div><div class="name">Ração de cachorro</div><div class="meta">${DOG_FOOD.custo} moedas · dura ${DOG_FOOD.horas}h · você tem <b>${state.dogFood}</b></div></div>
        <div class="stack"><button class="btn" data-dog-food="1" ${state.coins < DOG_FOOD.custo ? 'disabled' : ''}>Comprar 1</button>
        <button class="btn ghost" data-dog-food="3" ${state.coins < DOG_FOOD.custo * 3 ? 'disabled' : ''}>Comprar 3</button></div></div>`;
      html += `<h3>Raças</h3>`;
      for (const b of DOGS) {
        const locked = b.nivel > state.level;
        const btn = slot => `<button class="btn ${slot === 'animais' ? 'ghost' : ''}" data-buy-dog="${b.id}" data-slot="${slot}" ${state.dogs[slot] || state.coins < b.custo ? 'disabled' : ''}>${slot === 'roca' ? 'Para a plantação' : 'Para os animais'}</button>`;
        html += `<div class="row wide ${locked ? 'locked' : ''}"><img alt="" src="${dogIcon(b.id)}">
          <div><div class="name">${b.nome}</div>
          <div class="meta">${b.custo} moedas · vive ${b.vida} dias<br>espanta ${Math.round(b.protege * 100)}% dos ladrões · morde ${Math.round(b.morde * 100)}% deles<br>+${b.xpDia} XP por dia · +${b.xpPega} XP por ladrão</div></div>
          <div class="actions">${locked ? `<button class="btn" disabled>Nível ${b.nivel}</button>` : btn('roca') + btn('animais')}</div></div>`;
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
    html += `<h3>Terreno</h3><div class="kv">
      <span>Lotes</span><span>${state.owned} de ${N}</span>
      <span>Animais</span><span>${state.animals.length} de ${MAX_ANIMALS}</span>
      <span>Decorações</span><span>${Object.keys(state.decor).length} de ${DECOR.length}</span>
      <span>Colheitas</span><span>${state.stats.colheitas}</span>
      <span>Produtos dos animais</span><span>${state.stats.coletas}</span>
      <span>Moedas vendidas</span><span>${state.stats.vendido}</span>
      <span>Pegos nas visitas</span><span>${state.stats.roubado}</span>
      <span>Ajudas aos amigos</span><span>${state.stats.ajudas}</span></div>`;
    if (state.owned < N) {
      const cost = lotCost(state.owned), lvl = lotLevel(state.owned);
      html += `<div class="row"><div></div><div><div class="name">Próximo lote</div><div class="meta">${cost} moedas · exige nível ${lvl}</div></div>
        <button class="btn gold" data-see-land>Ver na roça</button></div>
        <p class="hint">Você escolhe onde crescer: qualquer lote com <b>+</b> encostado na sua terra está à venda. Clique nele e depois clique de novo para confirmar.</p>`;
    } else html += `<div class="empty">Você comprou todo o terreno!</div>`;
    html += `<p class="hint">Mato e pragas diminuem a colheita enquanto ficam lá. Terra seca faz a planta crescer na metade da velocidade.</p>
      <button class="btn danger" data-reset>${resetArmed ? 'Clique de novo para apagar tudo' : 'Recomeçar do zero'}</button>`;
  } else if (tab === 'amigos') {
    if (state.news.length) {
      html += `<h3>Novidades da sua roça</h3><div class="news">${state.news.slice(0, 8).map(n =>
        `<div class="${n.at > state.newsSeen ? 'new' : ''}"><time>${quando(n.at)}</time>${esc(n.msg)}</div>`).join('')}</div>`;
      if (state.news[0].at > state.newsSeen) { state.newsSeen = state.news[0].at; setTimeout(renderTabs, 0); save(); }
    }
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
  else if ('seeLand' in d) { if (!isHome()) goHome(); setScene('roca'); toast('Clique num lote com + para comprar.'); }
  else if (d.buyFert) buyFert(d.buyFert, Number(d.n) || 1);
  else if (d.buyDog) buyDog(d.buyDog, d.slot);
  else if (d.dogFood) buyDogFood(Number(d.dogFood) || 1);
  else if (d.feedDog) feedDog(d.feedDog);
  else if (d.useFert) { state.fertSel = d.useFert; if (!isHome()) goHome(); setScene('roca'); setTool('fert'); save(); }
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
    if (home && canBuy(i)) return `<b>Lote à venda</b><br>${lotCost(state.owned)} moedas · nível ${lotLevel(state.owned)}<br>Clique duas vezes para comprar.`;
    return home ? 'Pasto. Dá para comprar os lotes com + encostados na sua terra.' : null;
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
  h += `Colheita ${crop.safras - p.sl + 1} de ${crop.safras}${p.fert ? ' · adubada' : ''}`;
  if (home) h += `<br>Vai render ${expectedYield(p)} de ${crop.rend}`;
  return h;
}
function tipAnimal(id) {
  const a = S().animals.find(x => x.id === id); if (!a) return null;
  const def = ANIMAL[a.k], prod = PRODUCT[def.prod];
  let h = `<b>${def.nome}</b><br>`;
  if (a.ready) h += `${prod.nome} pronto! Clique para recolher.`;
  else if (!a.fed) h += `Com fome. ${isHome() ? `Clique para dar comida (${def.milho} milho ou ${def.racao} ${def.racao > 1 ? 'moedas' : 'moeda'}).` : 'Clique para dar comida e ajudar.'}`;
  else h += `Produzindo ${prod.nome.toLowerCase()}: falta ${fmt(def.tempo - a.g)}<div class="bar"><i style="width:${a.g / def.tempo * 100}%"></i></div>`;
  const dias = Math.max(1, Math.ceil((a.born + def.vida * DAY - Date.now()) / DAY));
  h += `<br>Vive mais ${dias} ${dias > 1 ? 'dias' : 'dia'}`;
  return h;
}
function tipDog(slot) {
  const d = S().dogs && S().dogs[slot];
  if (!dogAlive(d)) return isHome() ? `<b>Casinha vazia</b><br>Compre um cachorro para vigiar a ${SLOT_NAME[slot]}.` : null;
  const b = DOG[d.raca], awake = dogAwake(d);
  let h = `<b>${esc(d.nome)}</b> · ${b.nome}<br>`;
  if (!isHome()) return h + (awake ? 'Acordado e de olho em você!' : 'Dormindo… pode ser a sua chance.');
  h += awake ? `De guarda. Ração por mais ${fmt((d.fedUntil - Date.now()) / 1000)}` : `<span class="warn">Dormindo de fome. Clique para dar ração (você tem ${state.dogFood}).</span>`;
  const dias = Math.max(1, Math.ceil((d.born + b.vida * DAY - Date.now()) / DAY));
  return h + `<br>Vive mais ${dias} ${dias > 1 ? 'dias' : 'dia'}`;
}
function tipDecor(id) {
  const d = DECO[id];
  if (S().decor[id]) return `<b>${d.nome}</b><br>+${d.conforto} de conforto`;
  return `<b>Espaço para ${d.nome}</b><br>${d.custo} moedas na Loja · nível ${d.nivel}`;
}
let lastTip = '';
function updateTip() {
  const show = hover && (pointer.inside && !pointer.touch || performance.now() < pointer.tipUntil);
  const html = !show ? null : hover.kind === 'plot' ? tipPlot(hover.i) : hover.kind === 'animal' ? tipAnimal(hover.id) : hover.kind === 'dog' ? tipDog(hover.slot) : tipDecor(hover.id);
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
  else if (target.kind === 'dog') actDog(target.slot);
});
window.addEventListener('keydown', e => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (scene !== 'roca' || isGated() || !$('#settings').hidden) return;
  const k = parseInt(e.key, 10), avail = availTools();
  if (k >= 1 && k <= avail.length) setTool(avail[k - 1].id);
});
new ResizeObserver(resize).observe(stage);

// ============================================================
// Configurações: música, sons e tema (ficam salvas neste aparelho)
// ============================================================
function applySettings() {
  if (window.RFAudio) window.RFAudio.configure({
    music: settings.music, sfx: settings.sfx, musicVol: settings.musicVol, sfxVol: settings.sfxVol, track: settings.track,
  });
  root.dataset.tema = timeOfDay() === 'noite' ? 'noite' : 'dia';
}
function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* sem armazenamento */ }
  applySettings();
}
const TRACK_INFO = ['Violão e flauta, bem tranquila', 'Valsa lenta de sanfona', 'Viola caipira no fim da tarde'];
function renderSettings() {
  $('#optMusic').checked = settings.music;
  $('#optSfx').checked = settings.sfx;
  $('#volMusic').value = Math.round(settings.musicVol * 100); $('#volMusicOut').textContent = $('#volMusic').value;
  $('#volSfx').value = Math.round(settings.sfxVol * 100); $('#volSfxOut').textContent = $('#volSfx').value;
  const names = window.RFAudio ? window.RFAudio.tracks : ['Música 1', 'Música 2', 'Música 3'];
  $('#tracks').innerHTML = names.map((n, k) => `<button type="button" class="track" role="radio" aria-checked="${settings.track === k}" data-track="${k}">
    <span class="dot"></span><span>${esc(n)}<small>${TRACK_INFO[k] || ''}</small></span></button>`).join('');
  document.querySelectorAll('#temaSeg button').forEach(b => b.setAttribute('aria-checked', String(b.dataset.tema === settings.tema)));
  document.querySelectorAll('#temaSeg button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.tema === settings.tema)));
}
function openSettings() { renderSettings(); $('#settings').hidden = false; $('#settings [data-close]').focus(); }
function closeSettings() { $('#settings').hidden = true; $('#openSettings').focus(); }
$('#openSettings').addEventListener('click', openSettings);
$('#settings').addEventListener('click', e => {
  if (e.target === $('#settings') || e.target.closest('[data-close]')) return closeSettings();
  const tr = e.target.closest('[data-track]');
  if (tr) { settings.track = Number(tr.dataset.track); settings.music = true; saveSettings(); renderSettings(); }
  const tm = e.target.closest('[data-tema]');
  if (tm) { settings.tema = tm.dataset.tema; saveSettings(); renderSettings(); }
});
$('#optMusic').addEventListener('change', e => { settings.music = e.target.checked; saveSettings(); });
$('#optSfx').addEventListener('change', e => { settings.sfx = e.target.checked; saveSettings(); });
$('#volMusic').addEventListener('input', e => { settings.musicVol = e.target.value / 100; $('#volMusicOut').textContent = e.target.value; saveSettings(); });
$('#volSfx').addEventListener('input', e => { settings.sfxVol = e.target.value / 100; $('#volSfxOut').textContent = e.target.value; saveSettings(); });
$('#volSfx').addEventListener('change', () => sfx('coin'));
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#settings').hidden) closeSettings(); });
// O som só pode começar depois de um toque ou clique do jogador.
const unlockAudio = () => { if (window.RFAudio) window.RFAudio.unlock(); };
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
// Clique em qualquer botão faz um "tic".
document.addEventListener('click', e => { if (e.target.closest('button')) sfx('click'); }, true);

// ============================================================
// Laço principal
// ============================================================
let last = performance.now(), lastSave = 0, lastUI = 0, lastInfo = 0, lastSentCheck = 0;
function frame(now) {
  const dt = Math.min(1, (now - last) / 1000); last = now;
  tick(dt);
  if (!isGated() && L.cw > 20) draw(now, dt);
  if (now - lastUI > 250) { updateTip(); lastUI = now; }
  if (now - lastInfo > 2000) { tickLife(); renderSceneInfo(); root.dataset.tema = timeOfDay() === 'noite' ? 'noite' : 'dia'; lastInfo = now; }
  if (now - lastSave > 5000) { save(); lastSave = now; }
  if (user && dirty && now - lastCloud > 15000) cloudSave();
  if (user && now - lastSentCheck > 60000) { lastSentCheck = now; checkSent(); }
  requestAnimationFrame(frame);
}

function start(data) {
  state = (data && data.state && migrate(data.state)) || load() || newState();
  applySettings();
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
