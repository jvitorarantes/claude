(() => {
'use strict';

// ============================================================
// Dados do jogo
// ============================================================
const COLS = 10, ROWS = 10, N = COLS * ROWS;
const START_LOTS = [0, 1, 2, 10, 11, 12]; // os 6 canteiros iniciais, no canto perto do celeiro
const ROOM = 5;
const HOUR = 3600, DAY = 86400e3; // HOUR em segundos (tempos de produção), DAY em milissegundos (idades)
const SAVE_KEY = 'roca-feliz-v3', OLD_SAVE_KEYS = ['roca-feliz-v2', 'roca-feliz-v1'], SETTINGS_KEY = 'roca-feliz-config';
const settings = Object.assign(
  { music: true, sfx: true, musicVol: 0.5, sfxVol: 0.7, track: 0, tema: 'auto' },
  (() => { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; } catch (e) { return {}; } })(),
);
const Cloud = window.RFCloud || { available: false };

// Plantações. custo = semente de 1 canteiro; venda = quanto vale a colheita inteira do canteiro
// (sempre 1,6 × a semente), dividida em "rend" unidades.
const MIN = 60;
const CROP_LIST = [
  // id, nome, nível, semente, venda, tempo, XP, unidades, tipo, cores
  ['nabo',     'Nabo',           1,  10,   16,   2 * MIN,       2,  4,  'raiz',     '#f5eef7', '#a45bbb'],
  ['cenoura',  'Cenoura',        1,  20,   32,   5 * MIN,       3,  4,  'raiz',     '#f08a24', '#e0761a'],
  ['trigo',    'Trigo',          2,  30,   48,   10 * MIN,      4,  6,  'grao',     '#e8c35a'],
  ['milho',    'Milho',          3,  50,   80,   20 * MIN,      5,  5,  'alto',     '#f7d046'],
  ['batata',   'Batata',         4,  80,   128,  30 * MIN,      6,  8,  'raiz',     '#c9a06a', '#a47a48'],
  ['tomate',   'Tomate',         5,  120,  192,  HOUR,          8,  8,  'moita',    '#e53b2f'],
  ['alface',   'Alface',         6,  150,  240,  1.5 * HOUR,    9,  6,  'folha',    '#8fd05a'],
  ['cebola',   'Cebola',         8,  200,  320,  2.5 * HOUR,    11, 8,  'raiz',     '#b8617e', '#e6c07a'],
  ['abobora',  'Abóbora',        9,  250,  400,  4 * HOUR,      12, 4,  'chao',     '#f28c1b', '#c9650a'],
  ['melancia', 'Melancia',       12, 400,  640,  6 * HOUR,      15, 4,  'chao',     '#4d9a3e', '#2a5e27'],
  ['pepino',   'Pepino',         13, 450,  720,  5 * HOUR,      15, 8,  'pendente', '#4f8f3a', null, 'longo'],
  ['pimentao', 'Pimentão',       14, 500,  800,  7 * HOUR,      16, 8,  'pendente', '#d8342a'],
  ['abacaxi',  'Abacaxi',        16, 700,  1120, 10 * HOUR,     20, 4,  'abacaxi',  '#e0a83a'],
  ['mamao',    'Mamão',          17, 800,  1280, 12 * HOUR,     20, 4,  'pendente', '#f39a3a'],
  ['pera',     'Pera',           20, 1100, 1760, 16 * HOUR,     25, 8,  'pendente', '#c9d45a'],
  ['limao',    'Limão',          23, 1400, 2240, 20 * HOUR,     27, 16, 'moita',    '#9ccf3a'],
  ['cafe',     'Café',           26, 1800, 2880, 24 * HOUR,     30, 16, 'moita',    '#c0302a', null, 'pequeno'],
  ['conde',    'Fruta-do-conde', 29, 2400, 3840, 32 * HOUR,     38, 6,  'pendente', '#8fbf6a', null, 'redondo'],
  ['maracuja', 'Maracujá',       30, 2500, 4000, 36 * HOUR,     40, 10, 'pendente', '#f2d03a', null, 'redondo'],
];
// Árvores: compra a muda uma vez, a primeira colheita demora mais e depois repete na metade do tempo.
// Cada colheita vale 0,6 × a muda. Depois de 15 colheitas a árvore pede uma poda.
const TREE_LIST = [
  // id, nome, fruta, nome da fruta, nível, muda, 1ª colheita, próximas, XP, unidades, tipo, cores
  ['morangueiro', 'Morangueiro', 'morango', 'Morango', 7,  180,  2 * HOUR,  HOUR,      10, 12, 'moita',     '#e0224a', null, 'pequeno'],
  ['videira',     'Videira',     'uva',     'Uva',     15, 600,  8 * HOUR,  4 * HOUR,  18, 8,  'videira',   '#6b3a8a'],
  ['macieira',    'Macieira',    'maca',    'Maçã',    18, 900,  12 * HOUR, 6 * HOUR,  22, 10, 'arvore',    '#d8342a'],
  ['laranjeira',  'Laranjeira',  'laranja', 'Laranja', 19, 1000, 14 * HOUR, 7 * HOUR,  23, 10, 'arvore',    '#f28c1b'],
  ['bananeira',   'Bananeira',   'banana',  'Banana',  22, 1300, 18 * HOUR, 9 * HOUR,  25, 12, 'bananeira', '#f2d03a'],
  ['coqueiro',    'Coqueiro',    'coco',    'Coco',    24, 1500, 22 * HOUR, 11 * HOUR, 28, 6,  'palmeira',  '#7a5a3a'],
  ['mangueira',   'Mangueira',   'manga',   'Manga',   27, 2000, 28 * HOUR, 14 * HOUR, 32, 8,  'arvore',    '#f2a03a', '#d8442a'],
  ['goiabeira',   'Goiabeira',   'goiaba',  'Goiaba',  28, 2200, 30 * HOUR, 15 * HOUR, 35, 10, 'arvore',    '#c9d45a', '#e8788a'],
];
const TREE_HARVESTS = 15;
const CROPS = [
  ...CROP_LIST.map(([id, nome, nivel, custo, venda, tempo, xp, rend, tipo, cor, cor2, forma]) =>
    ({ id, nome, nivel, custo, tempo, xp, rend, preco: Math.round(venda / rend), prod: id, prodNome: nome, tipo, cor, cor2: cor2 || cor, forma, pequeno: forma === 'pequeno' })),
  ...TREE_LIST.map(([id, nome, prod, prodNome, nivel, custo, tempo, tempo2, xp, rend, tipo, cor, cor2, forma]) =>
    ({ id, nome, nivel, custo, tempo, tempo2, xp, rend, preco: Math.round(custo * 0.6 / rend), prod, prodNome, tipo, cor, cor2: cor2 || cor, forma, pequeno: forma === 'pequeno', arvore: true, poda: Math.round(custo * 0.3) })),
];
const CROP = Object.fromEntries(CROPS.map(c => [c.id, c]));
// O que vai para o celeiro: a fruta/verdura de cada plantação.
const PRODUCE = Object.fromEntries(CROPS.map(c => [c.prod, { id: c.prod, nome: c.prodNome, preco: c.preco, planta: c.id }]));

// Produtos dos animais de produção (o leitão da porca não vai para o celeiro: vira um porquinho).
const PRODUCTS = [
  { id: 'ovo',         nome: 'Ovo',             preco: 60 },
  { id: 'ovopata',     nome: 'Ovo de pata',     preco: 90 },
  { id: 'pelo',        nome: 'Pelo de coelho',  preco: 120 },
  { id: 'leitecabra',  nome: 'Leite de cabra',  preco: 180 },
  { id: 'la',          nome: 'Lã',              preco: 250 },
  { id: 'leite',       nome: 'Leite',           preco: 300 },
  { id: 'mel',         nome: 'Mel',             preco: 400 },
  { id: 'leitebufala', nome: 'Leite de búfala', preco: 500 },
];
const PRODUCT = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
PRODUCT.leitao = { id: 'leitao', nome: 'Leitão', preco: 700 };

// tipo 'prod': produz a cada "tempo" se alimentado (racao = moedas por produção) durante "periodo" dias;
//   depois para até a visita do veterinário.
// tipo 'cria': compra pequeno, alimenta 1 vez por dia (racao) e vende adulto por "venda".
// tipo 'pet': companhia, não come nem produz. lugar: 'casa' ou 'curral'.
const ANIMALS = [
  { id: 'galinha',   tipo: 'prod', nome: 'Galinha',   f: 1, nivel: 2,  custo: 500,  racao: 20,  tempo: 4 * HOUR,  prod: 'ovo',         periodo: 30, xp: 2 },
  { id: 'pato',      tipo: 'prod', nome: 'Pato',      f: 0, nivel: 4,  custo: 900,  racao: 30,  tempo: 6 * HOUR,  prod: 'ovopata',     periodo: 30, xp: 3 },
  { id: 'coelho',    tipo: 'prod', nome: 'Coelho',    f: 0, nivel: 5,  custo: 1200, racao: 40,  tempo: 8 * HOUR,  prod: 'pelo',        periodo: 30, xp: 3 },
  { id: 'cabra',     tipo: 'prod', nome: 'Cabra',     f: 1, nivel: 7,  custo: 2000, racao: 60,  tempo: 8 * HOUR,  prod: 'leitecabra',  periodo: 45, xp: 4 },
  { id: 'ovelha',    tipo: 'prod', nome: 'Ovelha',    f: 1, nivel: 8,  custo: 2500, racao: 80,  tempo: 10 * HOUR, prod: 'la',          periodo: 45, xp: 5 },
  { id: 'vaca',      tipo: 'prod', nome: 'Vaca',      f: 1, nivel: 10, custo: 4000, racao: 120, tempo: 8 * HOUR,  prod: 'leite',       periodo: 45, xp: 5 },
  { id: 'abelha',    tipo: 'prod', nome: 'Colmeia',   f: 1, nivel: 12, custo: 3000, racao: 100, tempo: 12 * HOUR, prod: 'mel',         periodo: 60, xp: 6, fixo: true },
  { id: 'porca',     tipo: 'prod', nome: 'Porca',     f: 1, nivel: 15, custo: 5000, racao: 150, tempo: 24 * HOUR, prod: 'leitao',      periodo: 45, xp: 5, desenho: 'porco', escala: 1.15 },
  { id: 'bufala',    tipo: 'prod', nome: 'Búfala',    f: 1, nivel: 18, custo: 8000, racao: 250, tempo: 12 * HOUR, prod: 'leitebufala', periodo: 60, xp: 7 },
  { id: 'porco',     tipo: 'cria', nome: 'Porquinho', f: 0, nivel: 3,  custo: 1000, racao: 50,  tempo: 24 * HOUR, venda: 1600,  xp: 10 },
  { id: 'bezerro',   tipo: 'cria', nome: 'Bezerro',   f: 0, nivel: 6,  custo: 2000, racao: 80,  tempo: 48 * HOUR, venda: 3200,  xp: 15, desenho: 'vaca' },
  { id: 'potro',     tipo: 'cria', nome: 'Potro',     f: 0, nivel: 12, custo: 5000, racao: 120, tempo: 72 * HOUR, venda: 8000,  xp: 25, desenho: 'cavalo' },
  { id: 'burro',     tipo: 'cria', nome: 'Burro',     f: 0, nivel: 14, custo: 3500, racao: 100, tempo: 60 * HOUR, venda: 5500,  xp: 20, desenho: 'jumento' },
  { id: 'avestruz',  tipo: 'cria', nome: 'Avestruz',  f: 1, nivel: 20, custo: 8000, racao: 200, tempo: 96 * HOUR, venda: 13000, xp: 35 },
  { id: 'gato',      tipo: 'pet',  nome: 'Gato',      f: 0, nivel: 4,  custo: 800,  lugar: 'casa' },
  { id: 'cavalo',    tipo: 'pet',  nome: 'Cavalo',    f: 0, nivel: 10, custo: 4000, lugar: 'curral' },
  { id: 'pavao',     tipo: 'pet',  nome: 'Pavão',     f: 0, nivel: 15, custo: 6000, lugar: 'curral' },
  { id: 'tartaruga', tipo: 'pet',  nome: 'Tartaruga', f: 1, nivel: 18, custo: 5000, lugar: 'casa' },
  { id: 'arara',     tipo: 'pet',  nome: 'Arara',     f: 1, nivel: 22, custo: 8000, lugar: 'casa', fixo: true },
];
const ANIMAL = Object.fromEntries(ANIMALS.map(a => [a.id, a]));
const RACAO_ESP = 100; // ração especial: a próxima produção rende em dobro
const vetCost = d => Math.round(d.custo * 0.25);
const inPen = a => ANIMAL[a.k].tipo !== 'pet' || ANIMAL[a.k].lugar === 'curral';

// Abrigos do rancho: cada bicho mora no seu. Cada nível aumenta quantos cabem.
// precos: construir (nível 1), depois aumentar para o nível 2 e o 3.
const ABRIGOS = [
  { id: 'galinheiro', nome: 'Galinheiro',   o: 'o', nivel: 1,  precos: [0, 1500, 4000],     bichos: ['galinha', 'pato'] },
  { id: 'coelheira',  nome: 'Coelheira',    o: 'a', nivel: 5,  precos: [2000, 3000, 6000],  bichos: ['coelho'] },
  { id: 'chiqueiro',  nome: 'Chiqueiro',    o: 'o', nivel: 3,  precos: [1500, 3000, 6000],  bichos: ['porco', 'porca'] },
  { id: 'apiario',    nome: 'Apiário',      o: 'o', nivel: 12, precos: [3000, 4500, 9000],  bichos: ['abelha'] },
  { id: 'aprisco',    nome: 'Redil',        o: 'o', nivel: 7,  precos: [3500, 5000, 10000], bichos: ['cabra', 'ovelha'] },
  { id: 'estabulo',   nome: 'Curral',       o: 'o', nivel: 6,  precos: [4000, 6000, 12000], bichos: ['bezerro', 'vaca', 'bufala'] },
  { id: 'cocheira',   nome: 'Cocheira',     o: 'a', nivel: 10, precos: [6000, 9000, 18000], bichos: ['cavalo', 'potro', 'burro'] },
  { id: 'cercado',    nome: 'Viveiro',      o: 'o', nivel: 15, precos: [8000, 12000, 24000], bichos: ['pavao', 'avestruz'] },
];
const ABRIGO = Object.fromEntries(ABRIGOS.map(b => [b.id, b]));
const ABRIGO_CAP = [0, 4, 6, 8];               // animais que cabem em cada nível
const ABRIGO_NIVEL = [0, 0, 3, 6];             // níveis de jogador a mais para aumentar
const abrigoOf = k => ABRIGOS.find(b => b.bichos.includes(k));
// O rancho é uma grade de 4 × 2 cercados, cada um com 4 × 3,8 casas.
const YARD_W = 4, YARD_D = 3.8, RANCH_C = YARD_W * 4, RANCH_R = YARD_D * 2;
const yardOf = id => { const k = ABRIGOS.findIndex(b => b.id === id); return { u0: (k % 4) * YARD_W, v0: Math.floor(k / 4) * YARD_D, u1: (k % 4 + 1) * YARD_W, v1: (Math.floor(k / 4) + 1) * YARD_D }; };
const abrigoLv = (s, id) => (s.abrigos && s.abrigos[id]) || 0;
const livesIn = (s, id) => s.animals.filter(a => inPen(a) && abrigoOf(a.k).id === id);
const vagas = (s, id) => ABRIGO_CAP[abrigoLv(s, id)] - livesIn(s, id).length;
// Saves antigos e roças de vizinhos não têm abrigos: constrói os que os bichos já usam.
function ensureAbrigos(s) {
  const ab = s.abrigos && typeof s.abrigos === 'object' ? s.abrigos : {};
  s.abrigos = {};
  for (const b of ABRIGOS) {
    const n = s.animals.filter(a => inPen(a) && abrigoOf(a.k) === b).length;
    let lv = clamp(Number(ab[b.id]) || 0, 0, 3);
    while (lv < 3 && ABRIGO_CAP[lv] < n) lv++;
    if (b.id === 'galinheiro') lv = Math.max(1, lv);
    if (lv) s.abrigos[b.id] = lv;
  }
  return s;
}
const drawKind = a => ANIMAL[a.k].desenho || a.k;
const isTired = a => ANIMAL[a.k].tipo === 'prod' && Date.now() - a.born > ANIMAL[a.k].periodo * DAY;
const isAdult = a => ANIMAL[a.k].tipo === 'cria' && a.g >= ANIMAL[a.k].tempo;
function isHungry(a) {
  const d = ANIMAL[a.k];
  if (d.tipo === 'prod') return !a.fed && !a.ready && !isTired(a);
  if (d.tipo === 'cria') return !isAdult(a) && (a.food || 0) <= 0;
  return false;
}
const seuSua = a => (a.f ? 'Sua ' : 'Seu ') + a.nome.toLowerCase();

// Cães de guarda: um vigia a plantação, outro os animais. Só protegem acordados (com comida).
const DOGS = [
  { id: 'caramelo', nome: 'Vira-lata caramelo', custo: 1000, nivel: 3, vida: 15, protege: 0.55, morde: 0.4, xpDia: 10, xpPega: 15, cor: '#d99a4e', cor2: '#b8793a' },
  { id: 'pastor',   nome: 'Pastor-alemão',      custo: 3000, nivel: 8, vida: 25, protege: 0.7,  morde: 0.5, xpDia: 20, xpPega: 25, cor: '#8a5a2e', cor2: '#2a221c' },
  { id: 'fila',     nome: 'Fila brasileiro',    custo: 6000, nivel: 15, vida: 35, protege: 0.85, morde: 0.6, xpDia: 30, xpPega: 40, cor: '#b8783e', cor2: '#3a2a20' },
];
const DOG = Object.fromEntries(DOGS.map(d => [d.id, d]));
const DOG_FOOD = { custo: 50, horas: 8 };
const DOG_NAMES = ['Totó', 'Rex', 'Pipoca', 'Thor', 'Mel', 'Bidu', 'Paçoca', 'Nina', 'Bolinha', 'Faísca', 'Pretinha', 'Caramelo'];
const SLOT_NAME = { roca: 'plantação', animais: 'criação' };
const STEAL_MAX = { roca: 3, animais: 2 }; // itens por amigo por dia

const DECOR = [
  { id: 'tapete', nome: 'Tapete de crochê', custo: 600,  nivel: 1, conforto: 3 },
  { id: 'vaso',   nome: 'Vaso de planta',   custo: 800,  nivel: 2, conforto: 3 },
  { id: 'quadro', nome: 'Quadro',           custo: 1200, nivel: 3, conforto: 4 },
  { id: 'abajur', nome: 'Abajur',           custo: 1500, nivel: 4, conforto: 4 },
  { id: 'sofa',   nome: 'Sofá',             custo: 2500, nivel: 6, conforto: 6 },
  { id: 'tv',     nome: 'Televisão',        custo: 4000, nivel: 8, conforto: 8 },
];
const DECO = Object.fromEntries(DECOR.map(d => [d.id, d]));
// Onde cada decoração fica na sala: [coluna, linha, altura] do centro.
const DECOR_SPOT = {
  tapete: [2.6, 2.65, 0], vaso: [4.4, 4.3, 0.35], quadro: [3.7, 0, 0.92],
  abajur: [0.6, 0.6, 0.6], sofa: [0.55, 1.95, 0.35], tv: [3.65, 0.38, 0.45],
};

// Fertilizantes: cortam uma parte do tempo total da planta. Um por colheita.
const FERTS = [
  { id: 'basico',  nome: 'Fertilizante básico',  curto: 'Básico',  corta: 0.1,  custo: 50,   nivel: 1,  cor: '#c98a4b' },
  { id: 'rapido',  nome: 'Fertilizante rápido',  curto: 'Rápido',  corta: 0.25, custo: 200,  nivel: 5,  cor: '#4a8fd0' },
  { id: 'premium', nome: 'Fertilizante premium', curto: 'Premium', corta: 0.5,  custo: 1000, nivel: 10, cor: '#e0a020' },
];
const FERT = Object.fromEntries(FERTS.map(f => [f.id, f]));

const item = id => PRODUCE[id] || PRODUCT[id];
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

const need = l => 100 + 50 * (l - 1);
// Expansões: cada uma libera mais canteiros, que você coloca onde quiser (encostados na sua terra).
const EXPANSOES = [
  { nivel: 1,  preco: 0,      total: 6 },
  { nivel: 5,  preco: 2000,   total: 12 },
  { nivel: 10, preco: 8000,   total: 20 },
  { nivel: 15, preco: 20000,  total: 30 },
  { nivel: 20, preco: 50000,  total: 42 },
  { nivel: 30, preco: 120000, total: 60 },
  { nivel: 40, preco: 250000, total: 80 },
  { nivel: 50, preco: 500000, total: 100 },
];
const XP_CAP = 50; // colheitas por planta por dia que ainda dão XP (evita ganhar XP infinito com o nabo)
const newId = () => Math.random().toString(36).slice(2, 10);

function emptyPlot(s = 'locked') { return { s, c: null, g: 0, dry: false, w: 0, b: 0, dmg: 0, id: null, th: [], fert: false, h: 0, adult: false, poda: false }; }
function newAnimal(k) {
  const d = ANIMAL[k], a = { id: newId(), k, born: Date.now() };
  if (d.tipo === 'prod') Object.assign(a, { fed: true, g: 0, ready: false, n: 0 }); // a primeira refeição vem junto
  else if (d.tipo === 'cria') Object.assign(a, { g: 0, food: Math.min(24 * HOUR, d.tempo) });
  else Object.assign(a, { nome: d.nome, lastPet: 0 });
  return a;
}
// Faz o animal produzir ou crescer por "sec" segundos.
function growAnimal(a, sec) {
  const d = ANIMAL[a.k];
  if (d.tipo === 'prod') {
    if (a.fed && !a.ready) { a.g += sec; if (a.g >= d.tempo) { a.g = d.tempo; a.ready = true; a.fed = false; } }
  } else if (d.tipo === 'cria' && a.g < d.tempo) {
    const use = Math.min(sec, a.food || 0);
    a.g = Math.min(d.tempo, a.g + use); a.food = (a.food || 0) - use;
  }
}

function newState() {
  const plots = Array.from({ length: N }, () => emptyPlot());
  START_LOTS.forEach(i => plots[i].s = 'plowed');
  return {
    v: 3, coins: 2000, xp: 0, level: 1, plots, barn: {}, owned: START_LOTS.length, exp: 0,
    tool: 'hand', seed: 'nabo', t: Date.now(), nb: {}, tools: { enxada: false }, xpDay: { d: 0, c: {} },
    animals: [], decor: {}, abrigos: { galinheiro: 1 },
    friends: [], sent: {}, code: null, owner: null, log: {},
    fert: { basico: 2 }, fertSel: 'basico',
    dogs: { roca: null, animais: null }, dogFood: 0, news: [], newsSeen: 0, limits: {},
    stats: { colheitas: 0, coletas: 0, vendido: 0, roubado: 0, ajudas: 0 },
  };
}

// Aceita saves antigos (v1, grade 6×4) e dados vindos da nuvem.
function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  if (s.v === 1 || s.v === 2) {
    // A economia mudou inteira: a roça recomeça, mas amigos, código e avisos ficam.
    const keep = { friends: s.friends, sent: s.sent, code: s.code, owner: s.owner, news: s.news, newsSeen: s.newsSeen };
    s = Object.assign(newState(), keep);
    s.news = [{ at: Date.now(), msg: 'A Roça Feliz foi renovada! Tem 27 plantações novas, árvores frutíferas e expansões. Você recomeça com 2.000 moedas.' }].concat(Array.isArray(s.news) ? s.news : []);
  }
  if (s.v !== 3 || !Array.isArray(s.plots) || s.plots.length !== N) return null;
  s.animals = Array.isArray(s.animals) ? s.animals.filter(a => a && ANIMAL[a.k]) : [];
  s.animals = s.animals.map(a => Object.assign(newAnimal(a.k), a));
  s.racaoEsp = Math.max(0, Number(s.racaoEsp) || 0);
  ensureAbrigos(s);
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
  s.tools = Object.assign({ enxada: false }, s.tools);
  s.xpDay = s.xpDay && s.xpDay.c ? s.xpDay : { d: 0, c: {} };
  s.exp = clamp(Number(s.exp) || 0, 0, EXPANSOES.length - 1);
  for (const p of s.plots) {
    if (!Array.isArray(p.th)) p.th = [];
    if ((p.s === 'growing' || p.s === 'withered') && !CROP[p.c]) Object.assign(p, emptyPlot('plowed'));
    p.h = p.h || 0; p.adult = !!p.adult; p.poda = !!p.poda;
    p.w = 0; // não tem mais mato
    if (p.b && p.dry) p.dry = false; // nunca os dois problemas juntos
    p.b = Math.min(1, p.b || 0);
    if (p.s === 'growing' && !p.id) p.id = newId();
  }
  s.owned = s.plots.filter(p => p.s !== 'locked').length;
  if (!CROP[s.seed]) s.seed = 'nabo';
  if (!s.tool || s.tool === 'weed') s.tool = 'hand';
  return s;
}

// O tempo passou enquanto a roça estava fechada.
// Tempo da fase atual: árvore adulta usa o tempo das próximas colheitas.
function phaseTempo(p) { const c = CROP[p.c]; return c.arvore && p.adult ? c.tempo2 : c.tempo; }
// Faz a planta crescer "sec" segundos. Terra seca cresce mais devagar; pragas
// vão comendo parte da colheita (no máximo 35%), proporcional ao tempo da planta.
function growPlot(p, sec, events) {
  if (p.s !== 'growing' || p.poda) return;
  const crop = CROP[p.c], T = phaseTempo(p);
  if (p.g >= T) return;
  if (events) {
    // Um problema de cada vez: ou a terra seca, ou aparecem insetos (de vez em quando).
    if (!p.dry && !p.b && Math.random() < 0.12 / T * sec) p.b = 1;
    else if (!p.dry && !p.b && Math.random() < 0.5 / T * sec) p.dry = true;
  }
  p.g = Math.min(T, p.g + sec * (p.dry ? 0.7 : 1));
  const trouble = p.w + p.b + (p.dry ? 0.5 : 0);
  if (trouble) p.dmg = Math.min(crop.rend * 0.35, p.dmg + trouble * crop.rend * sec / (T * 4));
}
function catchUp(s, sec) {
  sec = Math.max(0, sec || 0);
  for (const p of s.plots) growPlot(p, sec, false);
  for (const a of s.animals) growAnimal(a, sec);
}

function load() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    for (const k of OLD_SAVE_KEYS) raw = raw || localStorage.getItem(k);
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
const L = { W: 60, ox: 0, oy: 0, cw: 0, ch: 0, horizon: 0, dpr: 1, pan: { x: 0, y: 0 }, canPan: false };

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
  const T = phaseTempo(p), k = p.g / T;
  if (CROP[p.c].arvore && p.adult) return !p.poda && k >= 1 ? 4 : 3; // árvore adulta: com ou sem fruta
  return k >= 1 ? 4 : k < 0.12 ? 0 : k < 0.4 ? 1 : k < 0.7 ? 2 : 3;
}
const ripe = p => p.s === 'growing' && !p.poda && p.g >= phaseTempo(p);
const expectedYield = p => Math.max(1, Math.round(CROP[p.c].rend - p.dmg));
// Dá para comprar qualquer lote encostado (lado com lado) na terra que você já tem.
function neighbors(i) {
  const c = i % COLS, r = Math.floor(i / COLS), out = [];
  if (c > 0) out.push(i - 1); if (c < COLS - 1) out.push(i + 1);
  if (r > 0) out.push(i - COLS); if (r < ROWS - 1) out.push(i + COLS);
  return out;
}
const touches = i => state.plots[i].s === 'locked' && neighbors(i).some(j => state.plots[j].s !== 'locked');
const allowedLots = () => EXPANSOES[state.exp].total;
const freeLots = () => Math.max(0, allowedLots() - state.owned);
const canBuy = i => freeLots() > 0 && touches(i); // lote onde dá para colocar um canteiro agora
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
    const bonus = state.level * 50; state.coins += bonus;
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
  if (p.s === 'growing' && p.poda && tool === 'hand') return prune(p, pos);
  if (p.s === 'withered' && has('hoe')) { Object.assign(p, emptyPlot('plowed')); sfx('hoe'); addXP(1, pos); return done(); }
  if (p.s === 'growing' && tool === 'hoe') {
    // A enxada arranca qualquer plantação (ou árvore). Pede um segundo clique.
    if (buyPending && buyPending.i === 'hoe' + i && performance.now() < buyPending.until) {
      buyPending = null; Object.assign(p, emptyPlot('plowed')); sfx('hoe');
      return done();
    }
    buyPending = { i: 'hoe' + i, until: performance.now() + 4000 };
    return toast(`Arrancar ${CROP[p.c].nome.toLowerCase()}? Clique de novo para confirmar.`);
  }
  if (p.s === 'plowed' && (tool === 'seed' || tool === 'hand')) return plant(p, pos);
  const hints = {
    hoe: 'A enxada limpa plantas secas e arranca plantações.', water: 'Essa terra não precisa de água.',
    pest: 'Não há pragas aqui.', weed: 'Não há mato aqui.', seed: 'Só dá para plantar em terra arada.',
  };
  if (hints[tool]) toast(hints[tool]);
}

function plant(p, pos) {
  const crop = CROP[state.seed];
  if (crop.nivel > state.level) return toast(`${crop.nome} libera no nível ${crop.nivel}.`);
  if (state.coins < crop.custo) return toast(`Faltam moedas para ${crop.arvore ? 'a muda de ' : ''}${crop.nome} (${crop.custo}).`, 'bad');
  addCoins(-crop.custo, pos);
  Object.assign(p, emptyPlot('growing'), { c: crop.id, id: newId() });
  sfx('plant');
  if (xpAllowed(crop.id)) addXP(1, pos);
  done();
}

// Quantas colheitas de cada planta já deram XP hoje.
function xpAllowed(id) {
  const today = Math.floor(Date.now() / DAY);
  if (state.xpDay.d !== today) state.xpDay = { d: today, c: {} };
  return (state.xpDay.c[id] || 0) < XP_CAP;
}
function prune(p, pos) {
  const crop = CROP[p.c];
  if (state.coins < crop.poda) return toast(`A poda da ${crop.nome.toLowerCase()} custa ${crop.poda} moedas.`, 'bad');
  addCoins(-crop.poda, pos);
  Object.assign(p, { poda: false, h: 0, g: 0 });
  sfx('hoe');
  toast(`${crop.nome} podada! Mais ${TREE_HARVESTS} colheitas pela frente.`, 'good');
  addXP(3, pos);
  done();
}

function fertilize(p, pos) {
  const f = FERT[state.fertSel], have = state.fert[f.id] || 0;
  if (p.s !== 'growing') return toast('O adubo é para planta que está crescendo.');
  if (ripe(p)) return toast('Essa planta já está pronta para colher.');
  if (p.fert) return toast('Essa colheita já foi adubada. Dá para adubar de novo na próxima.');
  if (p.poda) return toast('Essa árvore precisa de poda antes.');
  if (have <= 0) { openPanel('loja', 'adubo'); return toast(`Você não tem ${f.nome}. Compre na Loja.`); }
  const T = phaseTempo(p), corte = Math.min(T - p.g, T * f.corta);
  state.fert[f.id] = have - 1;
  p.g += corte;
  p.fert = true;
  sfx('fert');
  popupAt(pos, `−${fmt(corte)}`, '#9be36a');
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
  if (!touches(i)) return toast('Os canteiros novos precisam encostar na sua terra.');
  if (!freeLots()) {
    const next = EXPANSOES[state.exp + 1];
    return toast(next ? `Para ter mais canteiros, compre a próxima expansão na aba Terreno (nível ${next.nivel}).` : 'Sua roça já está no tamanho máximo.');
  }
  if (buyPending && buyPending.i === i && performance.now() < buyPending.until) {
    buyPending = null;
    state.plots[i] = emptyPlot('plowed'); state.owned++;
    sfx('hoe');
    toast(freeLots() ? `Canteiro novo! Ainda dá para colocar ${freeLots()}.` : 'Canteiro novo pronto para plantar!', 'good');
    return done();
  }
  buyPending = { i, until: performance.now() + 4000 };
  sfx('click');
  toast('Clique de novo neste lugar para colocar o canteiro aqui.');
}
function buyExpansion() {
  const next = EXPANSOES[state.exp + 1];
  if (!next) return;
  if (state.level < next.nivel) return toast(`Essa expansão libera no nível ${next.nivel}.`);
  if (state.coins < next.preco) return toast(`A expansão custa ${next.preco.toLocaleString('pt-BR')} moedas.`, 'bad');
  state.coins -= next.preco; state.exp++;
  sfx('buy');
  addXP(10, null);
  toast(`Expansão comprada! Coloque ${freeLots()} canteiros novos onde quiser: clique nos + da roça.`, 'good');
  if (!isHome()) goHome();
  setScene('roca');
  done();
}

function harvest(p, pos) {
  const crop = CROP[p.c], qty = expectedYield(p);
  sfx('harvest');
  gain(crop.prod, qty, pos);
  state.stats.colheitas++;
  if (xpAllowed(crop.id)) { state.xpDay.c[crop.id] = (state.xpDay.c[crop.id] || 0) + 1; addXP(crop.xp, pos); }
  else if (state.xpDay.c[crop.id] === XP_CAP) { state.xpDay.c[crop.id]++; toast(`Hoje ${crop.nome.toLowerCase()} já deu todo o XP (${XP_CAP} colheitas). Ainda rende moedas; o XP volta amanhã.`); }
  if (crop.arvore) {
    // A árvore fica: volta a produzir. Depois de 15 colheitas, pede poda.
    Object.assign(p, { g: 0, adult: true, h: p.h + 1, dmg: 0, w: 0, b: 0, dry: false, id: newId(), th: [], fert: false });
    if (p.h >= TREE_HARVESTS) { p.poda = true; toast(`${crop.nome} deu ${TREE_HARVESTS} colheitas e precisa de poda (${crop.poda} moedas).`); }
  } else Object.assign(p, { s: 'withered', g: 0, w: 0, b: 0, dry: false, th: [] });
  done();
}


function actAnimal(id) {
  const s = S(), a = s.animals.find(x => x.id === id);
  if (!a) return;
  const d = ANIMAL[a.k], pos = animalPos(a.id);
  if (!isHome()) return awayAnimal(a, d, PRODUCT[d.prod], pos);
  if (d.tipo === 'pet') return petAnimal(a, pos);
  if (d.tipo === 'cria') {
    if (isAdult(a)) return confirmTwice('sell' + a.id, `Vender ${d.nome.toLowerCase()} adulto por ${d.venda.toLocaleString('pt-BR')} moedas? Clique de novo para vender.`, () => sellAdult(a, pos));
    if (isHungry(a)) return feedAnimal(a, pos) && done();
    return toast(`${d.nome} está crescendo: falta ${fmt(d.tempo - a.g)}. Comida por mais ${fmt(a.food)}.`);
  }
  if (a.ready) { collectAnimal(a, pos); return done(); }
  if (!a.fed && isTired(a)) return confirmTwice('vet' + a.id, `${seuSua(d)} precisa do veterinário para voltar a produzir (${vetCost(d)} moedas). Clique de novo para chamar.`, () => callVet(a, pos));
  if (!a.fed) return feedAnimal(a, pos, true) && done();
  toast(`${d.nome} está produzindo ${PRODUCT[d.prod].nome.toLowerCase()}: falta ${fmt(d.tempo - a.g)}.`);
}
// Ações que pedem um segundo clique para confirmar.
function confirmTwice(key, msg, fn) {
  if (buyPending && buyPending.i === key && performance.now() < buyPending.until) { buyPending = null; return fn(); }
  buyPending = { i: key, until: performance.now() + 4000 };
  toast(msg);
}
function collectAnimal(a, pos) {
  const d = ANIMAL[a.k], qty = a.dobro ? 2 : 1;
  a.ready = false; a.g = 0; a.n++; a.dobro = false;
  sfx('collect');
  if (d.prod === 'leitao') {
    // A porca teve leitões: vão para o chiqueiro para crescer (se couber).
    let born = 0;
    while (born < qty && vagas(state, 'chiqueiro') > 0) { state.animals.push(newAnimal('porco')); born++; }
    if (born) popupAt(pos, born > 1 ? '+2 porquinhos!' : '+1 porquinho!', '#ffffff');
    if (born < qty) { const n = qty - born; addCoins(PRODUCT.leitao.preco * n, pos); toast(`O chiqueiro está cheio: ${n > 1 ? 'os leitões foram vendidos' : 'o leitão foi vendido'} por ${PRODUCT.leitao.preco * n} moedas.`); }
  } else gain(d.prod, qty, pos);
  addXP(d.xp, pos); state.stats.coletas++;
}
// Alimenta um animal pagando a ração. Clicando nele, usa a ração especial se você tiver.
function feedAnimal(a, pos, allowSpecial) {
  const d = ANIMAL[a.k];
  if (state.coins < d.racao) { toast(`Faltam moedas para a ração (${d.racao}).`, 'bad'); return false; }
  addCoins(-d.racao, pos);
  if (d.tipo === 'prod') {
    a.fed = true;
    if (allowSpecial && state.racaoEsp > 0) { state.racaoEsp--; a.dobro = true; popupAt(pos, 'Ração especial: produção em dobro!', '#ffe08a', 500); }
  } else a.food = Math.min(24 * HOUR, d.tempo - a.g);
  sfx('feed'); addXP(1, pos);
  return true;
}
function callVet(a, pos) {
  const d = ANIMAL[a.k], cost = vetCost(d);
  if (state.coins < cost) return toast(`O veterinário cobra ${cost} moedas.`, 'bad');
  addCoins(-cost, pos);
  a.born = Date.now(); a.tiredNews = false;
  sfx('level');
  toast(`${seuSua(d)} está novinha em folha: mais ${d.periodo} dias produzindo!`.replace('novinha', d.f ? 'novinha' : 'novinho'), 'good');
  done();
}
function sellAdult(a, pos) {
  const d = ANIMAL[a.k];
  state.animals = state.animals.filter(x => x !== a); delete amb[a.id];
  addCoins(d.venda, pos);
  state.stats.vendido += d.venda;
  sfx('coin');
  addXP(d.xp, pos);
  toast(`Você vendeu ${d.f ? 'a' : 'o'} ${d.nome.toLowerCase()} por ${d.venda.toLocaleString('pt-BR')} moedas!`, 'good');
  done();
}
function petAnimal(a, pos) {
  const d = ANIMAL[a.k];
  popupAt(pos, '♥', '#ff6b8a'); popupAt(pos, '♥', '#ff8aa3', 200);
  sfx('collect');
  if (Date.now() - (a.lastPet || 0) > DAY) { a.lastPet = Date.now(); addXP(2, pos); done(); }
  else toast(`${a.nome || d.nome} adorou o carinho!`);
}
function feedAll() {
  const list = state.animals.filter(isHungry);
  if (!list.length) return toast('Nenhum animal com fome agora.');
  let n = 0, spent = 0;
  for (const a of list) {
    const d = ANIMAL[a.k];
    if (state.coins < d.racao) break;
    const before = state.coins;
    if (feedAnimal(a, animalPos(a.id), false)) { n++; spent += before - state.coins; }
  }
  if (n < list.length) toast(`Alimentou ${n} de ${list.length}: faltaram moedas para o resto.`, 'bad');
  else toast(`Alimentou ${n} ${n > 1 ? 'animais' : 'animal'} por ${spent.toLocaleString('pt-BR')} moedas.`, 'good');
  done();
}
function collectAll() {
  const list = state.animals.filter(a => ANIMAL[a.k].tipo === 'prod' && a.ready);
  if (!list.length) return toast('Nada pronto para recolher.');
  for (const a of list) collectAnimal(a, animalPos(a.id));
  toast(`Recolheu ${list.length} ${list.length > 1 ? 'produtos' : 'produto'}.`, 'good');
  done();
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
    openPanel('loja', 'caes');
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
    openPanel('loja', 'caes');
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
  for (const a of state.animals) {
    if (!isTired(a) || a.tiredNews) continue;
    const d = ANIMAL[a.k];
    a.tiredNews = true;
    addNews(`${seuSua(d)} terminou o período produtivo. Chame o veterinário (${vetCost(d)} moedas) para voltar a produzir.`);
    changed = true;
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

function actAbrigo(id) {
  if (!isHome()) return toast(`${ABRIGO[id].nome} de ${view.nome}.`);
  openPanel('loja', 'abrigos', id);
}
function actDecor(id) {
  const d = DECO[id];
  if (!isHome()) return toast(`${d.nome} de ${view.nome}.`);
  if (state.decor[id]) return toast(`${d.nome}: +${d.conforto}% de XP.`);
  openPanel('loja', 'decor');
  toast(`Compre ${d.nome} na Loja para colocar aqui.`);
}

function buyAnimal(k) {
  const d = ANIMAL[k];
  if (d.lugar === 'casa' && state.animals.some(a => a.k === k)) return toast(`Você já tem ${d.f ? 'uma' : 'um'} ${d.nome.toLowerCase()} em casa.`);
  if (state.level < d.nivel) return toast(`${d.nome} libera no nível ${d.nivel}.`);
  const ab = d.lugar !== 'casa' && abrigoOf(k);
  if (ab && !abrigoLv(state, ab.id)) return toast(`${d.nome} precisa de um${ab.o === 'a' ? 'a' : ''} ${ab.nome.toLowerCase()}. Construa na aba Abrigos.`, 'bad');
  if (ab && vagas(state, ab.id) <= 0) return toast(`${ab.o === 'a' ? 'A' : 'O'} ${ab.nome.toLowerCase()} está ${ab.o === 'a' ? 'cheia' : 'cheio'}. Aumente na aba Abrigos.`, 'bad');
  if (state.coins < d.custo) return toast(`${d.nome} custa ${d.custo} moedas.`, 'bad');
  state.coins -= d.custo;
  state.animals.push(newAnimal(k));
  sfx('buy');
  addXP(4, null);
  toast(d.lugar === 'casa' ? `${d.nome} chegou em casa!` : `${d.nome} chegou ${ab.o === 'a' ? 'na' : 'no'} ${ab.nome.toLowerCase()}!`, 'good');
  if (isHome()) setScene(d.lugar === 'casa' ? 'casa' : 'animais');
  done();
}
// Constrói um abrigo ou aumenta o nível dele.
function buyAbrigo(id) {
  const b = ABRIGO[id], lv = abrigoLv(state, id);
  if (lv >= 3) return toast(`${b.nome} já está no nível máximo.`);
  const preco = b.precos[lv], nivel = b.nivel + ABRIGO_NIVEL[lv + 1];
  if (state.level < nivel) return toast(`${lv ? 'Aumentar' : 'Construir'} ${b.o} ${b.nome.toLowerCase()} libera no nível ${nivel}.`);
  if (state.coins < preco) return toast(`Faltam moedas: custa ${preco.toLocaleString('pt-BR')}.`, 'bad');
  state.coins -= preco; state.abrigos[id] = lv + 1;
  sfx('buy'); addXP(lv ? 10 : 15, null);
  toast(lv ? `${b.nome} no nível ${lv + 1}: agora cabem ${ABRIGO_CAP[lv + 1]} animais!` : `${b.nome} construíd${b.o}! Cabem ${ABRIGO_CAP[1]} animais.`, 'good');
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
    const pool = CROPS.filter(c => !c.arvore && c.nivel <= Math.max(5, state.level + 3));
    const crop = pool[Math.floor(Math.random() * pool.length)];
    if (Math.random() < 0.12) { plots[i] = emptyPlot('plowed'); continue; }
    const mature = Math.random() < 0.5, bug = Math.random() < 0.08;
    plots[i] = Object.assign(emptyPlot('growing'), {
      c: crop.id, id: newId(),
      g: mature ? crop.tempo : crop.tempo * rand(0.15, 0.95),
      b: bug ? 1 : 0,
      dry: !bug && !mature && Math.random() < 0.25,
    });
  }
  const animals = [];
  const nA = 3 + Math.floor(Math.random() * 5);
  for (let k = 0; k < nA; k++) {
    const pool = ANIMALS.filter(x => x.tipo === 'prod' && x.prod !== 'leitao');
    const a = newAnimal(pool[Math.floor(Math.random() * pool.length)].id), r = Math.random();
    if (r < 0.45) { a.ready = true; a.fed = false; a.g = ANIMAL[a.k].tempo; }
    else if (r < 0.7) { a.fed = false; }
    else a.g = ANIMAL[a.k].tempo * rand(0.1, 0.9);
    animals.push(a);
  }
  const decor = {};
  for (const d of DECOR) if (Math.random() < 0.55) decor[d.id] = true;
  return ensureAbrigos({ plots, animals, decor, refreshAt: Date.now() + 4 * 60 * 1000 });
}

function visitNpc(id) {
  const nb = NEIGHBORS.find(n => n.id === id);
  const cur = state.nb[id];
  if (!cur || Date.now() > cur.refreshAt || !cur.animals || cur.animals.some(a => !a.born) || !cur.abrigos || cur.plots.some(p => p.w || (p.b && p.dry))) state.nb[id] = genNeighbor();
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
  $('#bannerTxt').textContent = `Você está na roça de ${view.nome}. Regue, tire as pragas, alimente os animais ou pegue um pouquinho da colheita… cuidado com ${view.cao}!`;
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
    gain(crop.prod, 1, pos); state.stats.roubado++; addXP(1, pos);
    sendVisit({ t: 'steal', plot: i, pid: p.id, qty: 1 });
    return done();
  }
}

function awayAnimal(a, def, prod, pos) {
  if (def.tipo === 'pet') return petAnimal(a, pos);
  if (def.tipo === 'cria') return toast(`${def.nome} de ${view.nome} ainda está crescendo.`);
  if (def.prod === 'leitao' && a.ready) return toast('Leitão não dá para levar!');
  if (!a.fed && !a.ready && !isTired(a)) { a.fed = true; sfx('feed'); help(pos); sendVisit({ t: 'feed', animal: a.id }); return done(); }
  if (a.ready) {
    const key = visitKey(a.id + ':' + a.n), lim = stealLimit();
    if (alreadyTook(a, key)) return toast('Você já pegou deste bicho. Não exagere!');
    if (lim.animais >= STEAL_MAX.animais) return toast(`Você já pegou ${STEAL_MAX.animais} itens dos animais de ${view.nome} hoje. Volte amanhã!`);
    a.stolen = true; state.log[key] = Date.now(); lim.animais++;
    if (guarded('animais', pos, { t: 'stealA', animal: a.id })) return done();
    sfx('collect');
    gain(prod.id, 1, pos);
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
      note(`pegou ${qty} ${CROP[p.c].prodNome} da sua plantação`, true);
    } else if (v.t === 'feed' && a && ANIMAL[a.k].tipo === 'prod' && isHungry(a)) {
      a.fed = true; note('alimentou seus animais');
    } else if (v.t === 'stealA' && a && ANIMAL[a.k].tipo === 'prod' && a.ready) {
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
    const crops = ['tomate', 'milho', 'abobora', 'cenoura', 'alface', 'melancia'];
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
  for (const p of state.plots) growPlot(p, dt, true);
  for (const a of state.animals) growAnimal(a, dt);
}

// Faz os bichos passearem dentro de uma área (cercado ou sala). Os com fome vão para o cocho.
const ROOM_AREA = { u0: 1.3, u1: 4.1, v0: 1.2, v1: 4.2 };
function fixedSpot(a, list) {
  const same = list.filter(x => ANIMAL[x.k].fixo), n = same.indexOf(a);
  if (ANIMAL[a.k].lugar === 'casa') return [4.45, 1.5];
  const y = yardOf('apiario'), [u, v] = HIVE_SPOTS[n % HIVE_SPOTS.length];
  return [y.u0 + u, y.v0 + v];
}
function updateWander(list, dt, area) {
  for (const a of list) {
    const d = ANIMAL[a.k];
    let m = amb[a.id];
    if (!m) {
      let u, v;
      if (d.fixo) [u, v] = fixedSpot(a, list);
      else { u = rand(area.u0, area.u1); v = rand(area.v0, area.v1); }
      m = amb[a.id] = { u, v, tu: u, tv: v, wait: rand(0, 2), dir: Math.random() < 0.5 ? 1 : -1, moving: false };
    }
    if (d.fixo) { m.moving = false; continue; }
    const hungry = area.trough && isHungry(a);
    if (m.wait > 0) { m.wait -= dt; m.moving = false; continue; }
    const du = m.tu - m.u, dv = m.tv - m.v, dist = Math.hypot(du, dv);
    if (dist < 0.05) {
      m.wait = hungry ? rand(2, 5) : rand(1, 4); m.moving = false;
      if (hungry) { m.tu = rand(area.trough.u0, area.trough.u1); m.tv = rand(area.trough.v0, area.trough.v1); }
      else { m.tu = rand(area.u0, area.u1); m.tv = rand(area.v0, area.v1); }
      continue;
    }
    const kind = drawKind(a), speed = kind === 'tartaruga' ? 0.06 : SMALL_ANIMALS.includes(kind) ? 0.55 : 0.3;
    const k = Math.min(1, speed * dt / dist);
    m.u += du * k; m.v += dv * k; m.moving = true;
    const sx = du - dv; if (Math.abs(sx) > 0.01) m.dir = sx > 0 ? 1 : -1;
  }
}
// Tamanho do bicho na tela: os de criação crescem de 60% até o tamanho adulto.
function animalScale(a, base) {
  const d = ANIMAL[a.k];
  let k = base * (d.escala || 1);
  if (d.tipo === 'cria') k *= 0.6 + 0.4 * Math.min(1, a.g / d.tempo);
  return k;
}
function drawAnimalAt(a, m, base, t) {
  const p = iso(m.u, m.v), W = L.W, kind = drawKind(a), sc = animalScale(a, base);
  if (hover && hover.kind === 'animal' && hover.id === a.id) {
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.ellipse(p.x, p.y, W * 0.26, W * 0.09, 0, 0, 7); ctx.stroke();
  }
  drawAnimal(kind, p.x, p.y, sc, t, m.dir, m.moving);
  const h = ANIMAL_H[kind] * sc;
  hits.push({ kind: 'animal', id: a.id, x: p.x, y: p.y - h * 0.5, r: Math.max(W * 0.22, h * 0.7) });
}
function animalBubble(a, home) {
  const d = ANIMAL[a.k];
  if (d.tipo === 'pet') return null;
  if (d.tipo === 'cria') return home ? (isAdult(a) ? 'sell' : isHungry(a) ? 'feed' : null) : null;
  const took = !home && (a.stolen || state.log[visitKey(a.id + ':' + a.n)]);
  if (a.ready) return took ? null : 'prod';
  if (!a.fed && isTired(a)) return home ? 'vet' : null;
  return !a.fed ? 'feed' : null;
}

// ============================================================
// Geometria isométrica
// ============================================================
function resize() {
  const r = stage.getBoundingClientRect();
  const cw = Math.max(0, r.width), ch = Math.max(0, r.height);
  L.dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(cw * L.dpr); cv.height = Math.round(ch * L.dpr);
  L.cw = cw; L.ch = ch;
}
const ZOOM_MIN = 0.6, ZOOM_MAX = 2.5;
const zoomOf = sc => clamp(Number(settings.zoom && settings.zoom[sc]) || 1, ZOOM_MIN, ZOOM_MAX);
function setZoom(z, sc = scene) {
  const old = zoomOf(sc), nz = clamp(Math.round(z * 100) / 100, ZOOM_MIN, ZOOM_MAX);
  settings.zoom = Object.assign({}, settings.zoom, { [sc]: nz });
  L.pan.x *= nz / old; L.pan.y *= nz / old;
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (e) { /* sem armazenamento */ }
  renderZoom();
}
function renderZoom() {
  const z = zoomOf(scene);
  $('#zoomIn').disabled = z >= ZOOM_MAX; $('#zoomOut').disabled = z <= ZOOM_MIN;
  $('#zoomReset').textContent = `${Math.round(z * 100)}%`;
}
// Espaço da tela que os botões por cima do jogo cobrem.
function insets() {
  return L.cw < 700 ? { t: 70, b: 92, l: 44, r: 52 } : { t: 76, b: 104, l: 96, r: 104 };
}
function layout(sc) {
  const { cw, ch } = L, I = insets();
  const aw = Math.max(80, cw - I.l - I.r), ah = Math.max(80, ch - I.t - I.b), cx = I.l + aw / 2, cy = I.t + ah / 2;
  let box = { w: aw, h: ah }; // tamanho do que precisa aparecer, no zoom normal
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
    const full = Math.min(aw / 7.4, ah / 4.9);
    L.W = Math.max(full, Math.min(aw * 1.8 / span, ah * 0.86 / (span / 4 + 0.9), aw / 5, ah / 3.6));
    const cc = (c0 + c1) / 2, rc = (r0 + r1) / 2;
    L.ox = cx - (cc - rc) * L.W / 2;
    L.oy = Math.min(I.t + ah * 0.6 - (cc + rc) * L.W / 4, I.t + ah - (c1 + r1) * L.W / 4 - 0.25 * L.W);
  } else if (sc === 'animais') {
    // O rancho inteiro cabe na tela; no celular fica maior e dá para arrastar.
    const bw = (RANCH_C + RANCH_R) / 2 + 0.8, bh = (RANCH_C + RANCH_R) / 4 + 1.6;
    L.W = Math.max(Math.min(aw / bw, ah / bh), cw < 700 ? 66 : 0);
    L.ox = cx - (RANCH_C - RANCH_R) * L.W / 4 + 0.1 * L.W;
    L.oy = I.t + ah / 2 - ((RANCH_C + RANCH_R) / 8 - 0.55) * L.W;
    box = { w: bw * L.W, h: bh * L.W };
  } else {
    L.W = Math.min(aw / 5.9, ah / 4.35);
    L.ox = cx;
    L.oy = I.t + ah - ROOM / 2 * L.W - 0.3 * L.W;
  }
  // Zoom em volta do meio da tela; arrastar anda pela parte que ficou de fora.
  const z = zoomOf(sc);
  L.W *= z; L.ox = cx + (L.ox - cx) * z; L.oy = cy + (L.oy - cy) * z;
  const ovx = Math.max(0, (box.w * z - aw) / 2), ovy = Math.max(0, (box.h * z - ah) / 2);
  L.pan.x = clamp(L.pan.x, -ovx, ovx); L.pan.y = clamp(L.pan.y, -ovy, ovy);
  L.ox += L.pan.x; L.oy += L.pan.y;
  L.canPan = ovx > 0 || ovy > 0;
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
  const FL = ['#ffffff', '#ffd54a', '#f06292', '#ffffff', '#ba68c8'];
  TUFTS.forEach(([x, y, k], n) => {
    if (n % 9) return;
    const px = x * cw, py = horizon + 10 + y * (ch - horizon - 10), r = Math.max(1.8, W * 0.025);
    for (let f = 0; f < 3; f++) { ctx.fillStyle = FL[(n + f) % FL.length]; ctx.beginPath(); ctx.arc(px + f * r * 2.4 - r * 2.4, py + (f % 2) * r * 1.5, r, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(px, py, r * 0.45, 0, 7); ctx.fill();
  });
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
    hits.push({ kind: 'dog', slot, x: m.x, y: m.y, r: Math.max(R * 1.8, 22) }); // o + também abre a loja de cães
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
function drawFence(cols, rows, side) { const e = -0.14; drawFenceRect(e, e, cols - e, rows - e, side); }
function drawFenceRect(u0, v0, u1, v1, side) {
  const W = L.W;
  const post = p => {
    ctx.fillStyle = '#a4703f'; ctx.fillRect(p.x - W * 0.025, p.y - W * 0.2, W * 0.05, W * 0.2);
    ctx.fillStyle = '#c99260'; ctx.fillRect(p.x - W * 0.025, p.y - W * 0.2, W * 0.05, W * 0.03);
  };
  const run = (c0, r0, c1, r1, steps, skipFirst) => {
    const a = iso(c0, r0), b = iso(c1, r1);
    for (const h of [0.08, 0.16]) line({ x: a.x, y: a.y - W * h }, { x: b.x, y: b.y - W * h }, '#b98050', W * 0.03);
    for (let k = skipFirst ? 1 : 0; k <= steps; k++) post(lerp(a, b, k / steps));
  };
  const nu = Math.round((u1 - u0) * 2), nv = Math.round((v1 - v0) * 2);
  if (side === 'back') { run(u0, v0, u1, v0, nu); run(u0, v0, u0, v1, nv, true); }
  else { run(u0, v1, u1, v1, nu, true); run(u1, v0, u1, v1, nv, true); }
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
        if (crop.id === 'cebola') {
          if (ripeNow) {
            ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 6 * s, 5 * s, 0, 0, 7); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.beginPath(); ctx.ellipse(x - 2 * s, y - 4 * s, 1.5 * s, 3 * s, 0, 0, 7); ctx.fill();
          }
          ctx.strokeStyle = '#5aa83a'; ctx.lineWidth = 1.6 * s; ctx.lineCap = 'round';
          for (const a of [-0.35, -0.12, 0.1, 0.3]) { ctx.beginPath(); ctx.moveTo(x, y - 6 * s); ctx.lineTo(x + Math.sin(a + sway) * 22 * s, y - 6 * s - Math.cos(a) * 22 * s); ctx.stroke(); }
          ctx.lineCap = 'butt';
          break;
        }
        if (crop.id === 'batata') {
          if (ripeNow) for (const [dx, dy] of [[-7, 1], [6, 2], [0, 3]]) { ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x + dx * s, y + dy * s, 3.6 * s, 2.6 * s, 0.3, 0, 7); ctx.fill(); }
          ctx.fillStyle = GD; ctx.beginPath(); ctx.arc(x - 5 * s, y - 7 * s, 6 * s, 0, 7); ctx.arc(x + 5 * s, y - 7 * s, 6 * s, 0, 7); ctx.fill();
          ctx.fillStyle = G; ctx.beginPath(); ctx.arc(x + sway * 5 * s, y - 11 * s, 7 * s, 0, 7); ctx.fill();
          if (ripeNow) { ctx.fillStyle = '#f2f0f5'; for (const [dx, dy] of [[-4, -13], [3, -15], [5, -9]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, 1.3 * s, 0, 7); ctx.fill(); } }
          break;
        }
        if (ripeNow) {
          ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x, y - 1 * s, 6.5 * s, 4.5 * s, 0, 0, 7); ctx.fill();
          ctx.fillStyle = crop.cor2; ctx.beginPath(); ctx.ellipse(x, y - 3 * s, 6 * s, 2.4 * s, 0, 0, 7); ctx.fill();
        }
        for (const a of [-1.1, -0.55, 0, 0.55, 1.1]) leaf(x, y - 3 * s, (ripeNow ? 22 : 18) * s, 4.2 * s, a + sway, a === 0 ? GL : G);
        break;
      }
      case 'grao': {
        ctx.lineCap = 'round';
        for (const dx of [-5, -2, 1, 4, 6.5]) {
          const tx = x + dx * s + sway * 14 * s, ty = y - 26 * s;
          ctx.strokeStyle = ripeNow ? '#c9a24a' : '#6aa83a'; ctx.lineWidth = 1.2 * s;
          ctx.beginPath(); ctx.moveTo(x + dx * s * 0.5, y); ctx.lineTo(tx, ty); ctx.stroke();
          ctx.fillStyle = ripeNow ? crop.cor : '#9cc85a';
          ctx.beginPath(); ctx.ellipse(tx, ty - 3 * s, 1.8 * s, 4.5 * s, dx * 0.03, 0, 7); ctx.fill();
          ctx.strokeStyle = ripeNow ? '#d9b25a' : '#8ab84a'; ctx.lineWidth = 0.6 * s;
          ctx.beginPath(); ctx.moveTo(tx, ty - 7 * s); ctx.lineTo(tx - 1 * s, ty - 11 * s); ctx.moveTo(tx, ty - 7 * s); ctx.lineTo(tx + 1 * s, ty - 11 * s); ctx.stroke();
        }
        ctx.lineCap = 'butt';
        break;
      }
      case 'folha': {
        const r = (ripeNow ? 11 : 8) * s;
        ctx.fillStyle = '#5a9e3a'; ctx.beginPath(); ctx.ellipse(x, y - r * 0.5, r * 1.1, r * 0.6, 0, 0, 7); ctx.fill();
        ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.arc(x, y - r * 0.8, r * 0.8, 0, 7); ctx.fill();
        ctx.fillStyle = '#b8e87a'; ctx.beginPath(); ctx.arc(x - r * 0.15, y - r * 0.95, r * 0.45, 0, 7); ctx.fill();
        ctx.strokeStyle = 'rgba(60,110,30,.45)'; ctx.lineWidth = 1;
        for (const a of [-0.9, -0.3, 0.3, 0.9]) { ctx.beginPath(); ctx.arc(x, y - r * 0.8, r * 0.8, a - 0.2 - Math.PI / 2, a + 0.2 - Math.PI / 2); ctx.stroke(); }
        break;
      }
      case 'abacaxi': {
        ctx.fillStyle = '#4f8a3a';
        for (const a of [-1.2, -0.8, -0.4, 0.4, 0.8, 1.2]) { ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-1.5 * s, 0); ctx.lineTo(0, -16 * s); ctx.lineTo(1.5 * s, 0); ctx.fill(); ctx.restore(); }
        if (ripeNow) {
          ctx.fillStyle = crop.cor; ctx.beginPath(); ctx.ellipse(x, y - 11 * s, 4.5 * s, 6.5 * s, 0, 0, 7); ctx.fill();
          ctx.strokeStyle = 'rgba(120,70,20,.5)'; ctx.lineWidth = 0.7 * s;
          for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(x - 4 * s, y - 11 * s + k * 2.5 * s); ctx.lineTo(x + 4 * s, y - 13 * s + k * 2.5 * s); ctx.stroke(); }
          ctx.fillStyle = '#5aa83a';
          for (const a of [-0.5, 0, 0.5]) { ctx.save(); ctx.translate(x, y - 17 * s); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-1 * s, 0); ctx.lineTo(0, -6 * s); ctx.lineTo(1 * s, 0); ctx.fill(); ctx.restore(); }
        }
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
          const [rx, ry] = crop.forma === 'longo' ? [1.8, 7] : crop.forma === 'redondo' ? [3.6, 3.8] : [2.8, 6];
          for (const dx of [-6, 1, 7]) {
            const fx = x + dx * s, fy = cy + r * 0.55;
            ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx, fy + 4 * s, rx * s, (ripeNow ? ry : ry * 0.66) * s, 0.1, 0, 7); ctx.fill();
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

// Árvores frutíferas (uma por canteiro). stage: 0 muda, 1-2 crescendo, 3 adulta, 4 com frutas.
function drawFruitTree(x, y, s, crop, stage, t) {
  const sway = Math.sin(t / 900 + x * 0.03) * 0.04;
  ctx.fillStyle = 'rgba(0,0,0,.14)'; ctx.beginPath(); ctx.ellipse(x, y, 16 * s, 5 * s, 0, 0, 7); ctx.fill();
  if (stage === 0) {
    line({ x, y }, { x, y: y - 10 * s }, '#7a5a3a', 1.6 * s);
    leaf(x, y - 9 * s, 8 * s, 3 * s, -0.8 + sway, '#6cc24a'); leaf(x, y - 9 * s, 8 * s, 3 * s, 0.8 + sway, '#4fa83a');
    return;
  }
  const grow = stage === 1 ? 0.45 : stage === 2 ? 0.7 : 1, ripeNow = stage === 4;
  const tipo = crop.tipo;
  if (tipo === 'palmeira') {
    const h = 44 * s * grow, top = { x: x + 5 * s * grow, y: y - h };
    ctx.strokeStyle = '#9a7a52'; ctx.lineWidth = 4.5 * s * grow; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 3 * s, y - h * 0.5, top.x, top.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(90,60,30,.35)'; ctx.lineWidth = 1;
    for (let k = 1; k < 7; k++) { const q = y - h * k / 7; ctx.beginPath(); ctx.moveTo(x - 2.5 * s * grow + (top.x - x) * k / 7, q); ctx.lineTo(x + 2.5 * s * grow + (top.x - x) * k / 7, q); ctx.stroke(); }
    for (const a of [-2.7, -2.1, -1.5, -0.9, -0.35, 0.3]) {
      ctx.save(); ctx.translate(top.x, top.y); ctx.rotate(a + Math.PI / 2 + sway);
      ctx.fillStyle = a < -1.2 ? '#4fa83a' : '#3a8a2c';
      ctx.beginPath(); ctx.ellipse(0, -13 * s * grow, 3.2 * s * grow, 13 * s * grow, 0, 0, 7); ctx.fill();
      ctx.restore();
    }
    if (ripeNow) { ctx.fillStyle = crop.cor; for (const [dx, dy] of [[-3, 3], [2, 4], [-0.5, 6]]) { ctx.beginPath(); ctx.arc(top.x + dx * s, top.y + dy * s, 2.8 * s, 0, 7); ctx.fill(); } }
    ctx.lineCap = 'butt';
    return;
  }
  if (tipo === 'bananeira') {
    const h = 26 * s * grow;
    ctx.fillStyle = '#7f9a4a'; ctx.fillRect(x - 3 * s * grow, y - h, 6 * s * grow, h);
    for (const [a, len] of [[-1.3, 1], [-0.6, 1.1], [0.1, 1], [0.8, 1.1], [1.4, 0.9]]) {
      ctx.save(); ctx.translate(x, y - h); ctx.rotate(a + sway);
      ctx.fillStyle = a > 0 ? '#5cb04a' : '#4a9a3a';
      ctx.beginPath(); ctx.ellipse(0, -11 * s * grow * len, 5.5 * s * grow, 12 * s * grow * len, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(30,80,20,.4)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22 * s * grow * len); ctx.stroke();
      ctx.restore();
    }
    if (ripeNow) {
      ctx.strokeStyle = crop.cor; ctx.lineWidth = 2.6 * s; ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + 4 * s, y - h + 5 * s + k * 2.2 * s, 4 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
      ctx.lineCap = 'butt';
    }
    return;
  }
  if (tipo === 'videira') {
    const h = 30 * s;
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(x - 13 * s, y - h, 2.4 * s, h); ctx.fillRect(x + 11 * s, y - h, 2.4 * s, h);
    ctx.fillRect(x - 14 * s, y - h, 28 * s, 2.2 * s);
    ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - 4 * s, y - h * 0.5, x, y - h * grow); ctx.stroke();
    const n = Math.round(6 * grow);
    for (let k = 0; k < n; k++) { const lx = x - 12 * s + k * 24 * s / Math.max(1, n - 1); leaf(lx, y - h + 2 * s, 7 * s, 3.5 * s, (k % 2 ? 0.6 : -0.6) + Math.PI + sway, k % 2 ? '#4fa83a' : '#3a8a2c'); }
    if (ripeNow) for (const bx of [-7, 1, 8]) {
      ctx.fillStyle = crop.cor;
      for (const [dx, dy] of [[-1.6, 0], [1.6, 0], [0, 2.2], [-1.6, 4.2], [1.6, 4.2], [0, 6.2]]) { ctx.beginPath(); ctx.arc(x + bx * s + dx * s * 0.9, y - h + 6 * s + dy * s, 1.7 * s, 0, 7); ctx.fill(); }
    }
    return;
  }
  // árvore frutífera comum (maçã, laranja, manga, goiaba)
  const th = 18 * s * grow, R = 15 * s * grow;
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(x - 2.5 * s * grow, y - th, 5 * s * grow, th);
  const cx = x + sway * 20 * s, cy = y - th - R * 0.7;
  ctx.fillStyle = '#3a8a2c'; ctx.beginPath(); ctx.arc(cx - R * 0.6, cy + R * 0.25, R * 0.75, 0, 7); ctx.arc(cx + R * 0.6, cy + R * 0.25, R * 0.75, 0, 7); ctx.fill();
  ctx.fillStyle = '#4fa83a'; ctx.beginPath(); ctx.arc(cx, cy - R * 0.2, R, 0, 7); ctx.fill();
  ctx.fillStyle = '#6cc24a'; ctx.beginPath(); ctx.arc(cx - R * 0.35, cy - R * 0.55, R * 0.4, 0, 7); ctx.fill();
  if (ripeNow || stage === 3) {
    const spots = [[-0.55, 0.1], [0.4, -0.35], [0.6, 0.35], [-0.2, -0.65], [0.05, 0.4], [-0.75, -0.3]];
    spots.forEach(([dx, dy], k) => ball(cx + dx * R, cy + dy * R, (ripeNow ? 2.8 : 1.8) * s, ripeNow ? (k % 2 ? crop.cor2 : crop.cor) : '#9bc36a'));
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
  } else if (id === 'leite' || id === 'leitecabra' || id === 'leitebufala') {
    ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#9fb4c8';
    ctx.beginPath(); ctx.moveTo(x - 4 * s, y + 7 * s); ctx.lineTo(x - 4 * s, y - 1 * s); ctx.lineTo(x - 2 * s, y - 4 * s); ctx.lineTo(x + 2 * s, y - 4 * s); ctx.lineTo(x + 4 * s, y - 1 * s); ctx.lineTo(x + 4 * s, y + 7 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = { leite: '#3a7bd5', leitecabra: '#b07a44', leitebufala: '#3a3a3a' }[id]; ctx.fillRect(x - 2.3 * s, y - 6.5 * s, 4.6 * s, 2.6 * s);
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
  } else if (id === 'mel') {
    ctx.fillStyle = '#f2b52a'; ctx.strokeStyle = '#b07a14';
    ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 3 * s); ctx.lineTo(x - 5 * s, y + 6 * s); ctx.quadraticCurveTo(x, y + 8 * s, x + 5 * s, y + 6 * s); ctx.lineTo(x + 5 * s, y - 3 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#c8402f'; ctx.fillRect(x - 5.8 * s, y - 6 * s, 11.6 * s, 3.2 * s);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - 3.5 * s, y - 1 * s, 1.4 * s, 5 * s);
  } else if (id === 'leitao') {
    ctx.fillStyle = '#f5aebb'; ctx.beginPath(); ctx.arc(x, y, 6 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#e991a0'; ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 3 * s); ctx.lineTo(x - 4 * s, y - 8 * s); ctx.lineTo(x - 1.5 * s, y - 5 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x + 5 * s, y - 3 * s); ctx.lineTo(x + 4 * s, y - 8 * s); ctx.lineTo(x + 1.5 * s, y - 5 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + 2 * s, 2.8 * s, 2 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8606e'; ctx.beginPath(); ctx.arc(x - 1 * s, y + 2 * s, 0.6 * s, 0, 7); ctx.arc(x + 1 * s, y + 2 * s, 0.6 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(x - 2.3 * s, y - 1.5 * s, 0.7 * s, 0, 7); ctx.arc(x + 2.3 * s, y - 1.5 * s, 0.7 * s, 0, 7); ctx.fill();
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
  const shadow = { galinha: 9, vaca: 22, ovelha: 16, porco: 16, coelho: 9, angola: 9, pato: 10, jumento: 21, cavalo: 23, pavao: 12, cabra: 14, bufala: 23, abelha: 11, avestruz: 13, gato: 8, tartaruga: 9, arara: 7 }[k];
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
  } else if (k === 'cabra') {
    for (const [lx, ph] of [[-9, 1], [-5, -1], [5, -1], [9, 1]]) { leg(lx + step * ph, 9, '#d8d0c2', 2.2); ctx.fillStyle = '#3a2a1e'; ctx.fillRect((lx + step * ph) * s - 1.1 * s, -1.4 * s, 2.2 * s, 1.4 * s); }
    ctx.fillStyle = '#f0ebe0'; ctx.beginPath(); ctx.moveTo(-12 * s, -18 * s); ctx.lineTo(-15 * s, -23 * s); ctx.lineTo(-10 * s, -20 * s); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, -15 * s, 12.5 * s, 6.8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#b8895a'; ctx.beginPath(); ctx.ellipse(-4 * s, -17 * s, 5 * s, 3.5 * s, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#f0ebe0';
    ctx.beginPath(); ctx.moveTo(8 * s, -18 * s); ctx.lineTo(12 * s, -26 * s); ctx.lineTo(16 * s, -24 * s); ctx.lineTo(12 * s, -14 * s); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(15 * s, -25 * s, 5 * s, 3.4 * s, 0.35, 0, 7); ctx.fill();
    ctx.strokeStyle = '#6b6258'; ctx.lineWidth = 1.4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(12.5 * s, -28 * s); ctx.quadraticCurveTo(9 * s, -34 * s, 7 * s, -30 * s); ctx.stroke();
    ctx.fillStyle = '#e8e0d0'; ctx.beginPath(); ctx.moveTo(17 * s, -22.5 * s); ctx.lineTo(18.5 * s, -18 * s); ctx.lineTo(16 * s, -21.5 * s); ctx.fill();
    ctx.fillStyle = '#c9bfae'; ctx.beginPath(); ctx.ellipse(11 * s, -27 * s, 2.8 * s, 1.1 * s, -0.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(15.5 * s, -26.5 * s, 0.8 * s, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  } else if (k === 'bufala') {
    for (const [lx, ph] of [[-12, 1], [-6, -1], [6, -1], [12, 1]]) { leg(lx + step * ph, 11, '#2e2b2b', 3.4); }
    ctx.strokeStyle = '#2e2b2b'; ctx.lineWidth = 1.3 * s;
    ctx.beginPath(); ctx.moveTo(-18 * s, -20 * s); ctx.quadraticCurveTo(-21 * s, -14 * s, -20 * s, -8 * s); ctx.stroke();
    ctx.fillStyle = '#3d3a3a'; ctx.beginPath(); ctx.ellipse(0, -18 * s, 19 * s, 10 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a4646'; ctx.beginPath(); ctx.ellipse(-2 * s, -22 * s, 12 * s, 4 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#3d3a3a'; ctx.beginPath(); ctx.ellipse(19 * s, -22 * s, 7 * s, 6 * s, 0.2, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a5454'; ctx.beginPath(); ctx.ellipse(23 * s, -19 * s, 4.2 * s, 3.2 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9d0c0'; ctx.lineWidth = 2.4 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(17 * s, -27 * s); ctx.quadraticCurveTo(8 * s, -32 * s, 9 * s, -24 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(21 * s, -27 * s); ctx.quadraticCurveTo(28 * s, -33 * s, 27 * s, -25 * s); ctx.stroke();
    ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(20 * s, -23.5 * s, 1 * s, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  } else if (k === 'abelha') {
    // colmeia de madeira com abelhas voando em volta
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(-9 * s, -3 * s, 18 * s, 3 * s);
    ctx.fillStyle = '#e8b04a'; ctx.fillRect(-8 * s, -13 * s, 16 * s, 10 * s);
    ctx.fillStyle = '#d99a3a'; ctx.fillRect(-8 * s, -23 * s, 16 * s, 10 * s);
    ctx.strokeStyle = 'rgba(120,70,20,.5)'; ctx.lineWidth = 1; ctx.strokeRect(-8 * s, -13 * s, 16 * s, 10 * s); ctx.strokeRect(-8 * s, -23 * s, 16 * s, 10 * s);
    ctx.fillStyle = '#c8402f'; ctx.fillRect(-10 * s, -26 * s, 20 * s, 3.2 * s);
    ctx.fillStyle = '#3a2412'; ctx.fillRect(-4 * s, -5.5 * s, 8 * s, 1.6 * s);
    for (let j = 0; j < 4; j++) {
      const a = t / 400 + j * 1.6, bx = Math.cos(a) * 13 * s, by = -16 * s + Math.sin(a * 1.3) * 7 * s;
      ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(bx, by, 1.8 * s, 1.3 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#222'; ctx.fillRect(bx - 0.3 * s, by - 1.2 * s, 0.7 * s, 2.4 * s);
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.beginPath(); ctx.ellipse(bx, by - 1.6 * s, 1.1 * s, 0.7 * s, 0, 0, 7); ctx.fill();
    }
  } else if (k === 'avestruz') {
    ctx.strokeStyle = '#e8a9a0'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-2 * s, -20 * s); ctx.lineTo(-3 * s + step * 2 * s, 0); ctx.moveTo(3 * s, -20 * s); ctx.lineTo(4 * s - step * 2 * s, 0); ctx.stroke();
    ctx.fillStyle = '#2a2624'; ctx.beginPath(); ctx.ellipse(0, -26 * s, 11 * s, 8 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#f3efe6'; ctx.beginPath(); ctx.ellipse(-10 * s, -28 * s, 4 * s, 3 * s, -0.4, 0, 7); ctx.fill();
    ctx.strokeStyle = '#e8b0a4'; ctx.lineWidth = 2.6 * s;
    ctx.beginPath(); ctx.moveTo(7 * s, -30 * s); ctx.quadraticCurveTo(12 * s, -40 * s, 9 * s, -48 * s); ctx.stroke();
    ctx.fillStyle = '#e8b0a4'; ctx.beginPath(); ctx.ellipse(10 * s, -49 * s, 3 * s, 2.3 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#d9a06a'; ctx.beginPath(); ctx.moveTo(12.5 * s, -49.5 * s); ctx.lineTo(15.5 * s, -48.5 * s); ctx.lineTo(12.5 * s, -47.8 * s); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(10.8 * s, -49.8 * s, 0.7 * s, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  } else if (k === 'gato') {
    const tail = Math.sin(t / 400) * 0.4;
    ctx.strokeStyle = '#e08a3a'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-6 * s, -8 * s); ctx.quadraticCurveTo(-11 * s, -10 * s, -10 * s + tail * 4 * s, -17 * s); ctx.stroke();
    for (const [lx, ph] of [[-4, 1], [-1.5, -1], [2.5, -1], [5, 1]]) leg(lx + step * ph * 0.6, 4, '#e08a3a', 1.6);
    ctx.fillStyle = '#e8963f'; ctx.beginPath(); ctx.ellipse(0, -7 * s, 7.5 * s, 3.8 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#c06a22'; ctx.lineWidth = 0.9 * s;
    for (const dx of [-3.5, -1, 1.5]) { ctx.beginPath(); ctx.moveTo(dx * s, -10.4 * s); ctx.lineTo(dx * s + 0.6 * s, -7.5 * s); ctx.stroke(); }
    ctx.fillStyle = '#e8963f'; ctx.beginPath(); ctx.arc(7 * s, -11 * s, 3.6 * s, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(4.8 * s, -13.3 * s); ctx.lineTo(5.4 * s, -16.8 * s); ctx.lineTo(7.2 * s, -14.2 * s); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7.6 * s, -14.3 * s); ctx.lineTo(9.2 * s, -16.6 * s); ctx.lineTo(9.8 * s, -13 * s); ctx.fill();
    ctx.fillStyle = '#2f6e1e'; ctx.beginPath(); ctx.arc(8.4 * s, -11.6 * s, 0.75 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#e98a9a'; ctx.beginPath(); ctx.arc(10.3 * s, -10.4 * s, 0.6 * s, 0, 7); ctx.fill();
    ctx.lineCap = 'butt';
  } else if (k === 'tartaruga') {
    const head = Math.sin(t / 900) * 0.8;
    ctx.fillStyle = '#8fae5a';
    for (const [lx, ly] of [[-5, -1], [5, -1], [-4, 0.5], [4, 0.5]]) { ctx.beginPath(); ctx.ellipse(lx * s, ly * s, 1.8 * s, 1.3 * s, 0, 0, 7); ctx.fill(); }
    ctx.beginPath(); ctx.ellipse((9 + head) * s, -3 * s, 2.6 * s, 2 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc((10 + head) * s, -3.5 * s, 0.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#6b7a3a'; ctx.beginPath(); ctx.ellipse(0, -3.5 * s, 7.5 * s, 4.8 * s, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#5a6630'; ctx.fillRect(-7.5 * s, -3.8 * s, 15 * s, 1.2 * s);
    ctx.strokeStyle = '#4a5528'; ctx.lineWidth = 0.8 * s;
    for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(dx * s - 1.8 * s, -4 * s); ctx.lineTo(dx * s, -7.2 * s); ctx.lineTo(dx * s + 1.8 * s, -4 * s); ctx.stroke(); }
  } else if (k === 'arara') {
    // poleiro com a arara em cima
    ctx.fillStyle = '#8a5a33'; ctx.fillRect(-1 * s, -30 * s, 2 * s, 30 * s); ctx.fillRect(-7 * s, -30 * s, 14 * s, 1.6 * s);
    ctx.fillStyle = '#6b4424'; ctx.beginPath(); ctx.ellipse(0, 0, 6 * s, 1.8 * s, 0, 0, 7); ctx.fill();
    const bob = Math.sin(t / 700) * 0.5 * s;
    ctx.fillStyle = '#d8342a';
    ctx.beginPath(); ctx.moveTo(-1.5 * s, -32 * s); ctx.lineTo(-3.5 * s, -18 * s + bob); ctx.lineTo(0.5 * s, -32 * s); ctx.fill();
    ctx.fillStyle = '#2a6fc8'; ctx.beginPath(); ctx.moveTo(-0.5 * s, -32 * s); ctx.lineTo(-1.5 * s, -20 * s + bob); ctx.lineTo(1.5 * s, -32 * s); ctx.fill();
    ctx.fillStyle = '#d8342a'; ctx.beginPath(); ctx.ellipse(0, -36 * s + bob, 3.6 * s, 5.5 * s, 0.15, 0, 7); ctx.fill();
    ctx.fillStyle = '#f2c230'; ctx.beginPath(); ctx.ellipse(-1.8 * s, -35 * s + bob, 2 * s, 3.4 * s, 0.25, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a6fc8'; ctx.beginPath(); ctx.ellipse(-2.2 * s, -33 * s + bob, 1.8 * s, 3 * s, 0.25, 0, 7); ctx.fill();
    ctx.fillStyle = '#d8342a'; ctx.beginPath(); ctx.arc(1.2 * s, -42 * s + bob, 3 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#f3efe6'; ctx.beginPath(); ctx.ellipse(2.4 * s, -42 * s + bob, 1.4 * s, 1.1 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(2.5 * s, -42.2 * s + bob, 0.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a3a3a'; ctx.beginPath(); ctx.moveTo(3.8 * s, -43 * s + bob); ctx.quadraticCurveTo(6.5 * s, -42 * s + bob, 4.3 * s, -39.5 * s + bob); ctx.lineTo(3.8 * s, -41 * s + bob); ctx.fill();
  }
  ctx.restore();
}
const ANIMAL_H = { galinha: 24, vaca: 34, ovelha: 25, porco: 25, coelho: 22, angola: 23, pato: 22, jumento: 42, cavalo: 46, pavao: 30, cabra: 32, bufala: 36, abelha: 26, avestruz: 52, gato: 16, tartaruga: 9, arara: 46 };
const SMALL_ANIMALS = ['galinha', 'coelho', 'angola', 'pato', 'gato'];

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
  } else if (kind === 'poda') {
    // tesoura de poda
    ctx.strokeStyle = '#6b7780'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - 5 * s, y - 5 * s); ctx.lineTo(x + 4 * s, y + 3 * s); ctx.moveTo(x + 5 * s, y - 5 * s); ctx.lineTo(x - 4 * s, y + 3 * s); ctx.stroke();
    ctx.strokeStyle = '#c8402f'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.arc(x - 5 * s, y + 5 * s, 2.2 * s, 0, 7); ctx.moveTo(x + 7.2 * s, y + 5 * s); ctx.arc(x + 5 * s, y + 5 * s, 2.2 * s, 0, 7); ctx.stroke();
    ctx.lineCap = 'butt';
  } else if (kind === 'vet') {
    ctx.fillStyle = '#e03a2f'; ctx.fillRect(x - 1.8 * s, y - 6 * s, 3.6 * s, 12 * s); ctx.fillRect(x - 6 * s, y - 1.8 * s, 12 * s, 3.6 * s);
  } else if (kind === 'sell') {
    ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.arc(x, y, 6.5 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = '#b77f00'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(x, y, 4.6 * s, 0, 7); ctx.stroke();
    ctx.fillStyle = '#8a5a00'; ctx.font = `800 ${Math.round(8 * s)}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, y + 0.5 * s);
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
      ctx.fillText('Colocar', m.x, m.y - W * 0.405);
      ctx.fillText('aqui?', m.x, m.y - W * 0.29);
    }
    if (hov) quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.9)', 2);
    return;
  }
  // Terra fofa: borda mais clara, miolo escuro com leiras e torrões.
  const d = W * 0.09;
  const dry = p.s === 'growing' && p.dry;
  const dn = pt => ({ x: pt.x, y: pt.y + d });
  const tone = dry ? ['#c29266', '#a87a4e', '#8a6038'] : p.s === 'withered' ? ['#a8825a', '#8f6b45', '#6e5034'] : p.fert ? ['#9a5f34', '#6e3e1e', '#58300f'] : ['#a86b3c', '#7e4a26', '#633718'];
  quad(p4, p3, dn(p3), dn(p4), '#6b3f1d');
  quad(p3, p2, dn(p2), dn(p3), '#52301a');
  quad(p1, p2, p3, p4, tone[0]);
  line(p4, p1, 'rgba(255,230,190,.35)', 1.5); line(p1, p2, 'rgba(255,230,190,.35)', 1.5);
  const [q1, q2, q3, q4] = diamond(c, r, 0.14);
  quad(q1, q2, q3, q4, tone[1]);
  for (let k = 0; k < 4; k++) {
    const a = lerp(q1, q4, (k + 0.5) / 4), b = lerp(q2, q3, (k + 0.5) / 4);
    line({ x: a.x, y: a.y + 1 }, { x: b.x, y: b.y + 1 }, tone[2], Math.max(1.5, W * 0.035));
    line({ x: a.x, y: a.y - W * 0.012 }, { x: b.x, y: b.y - W * 0.012 }, 'rgba(255,220,170,.18)', Math.max(1, W * 0.012));
  }
  ctx.fillStyle = p.fert && p.s === 'growing' ? 'rgba(255,225,120,.85)' : 'rgba(40,20,5,.35)';
  for (const [u, v] of [[0.25, 0.5], [0.5, 0.8], [0.78, 0.42], [0.5, 0.22], [0.35, 0.3], [0.66, 0.66]]) { const q = iso(c + u, r + v); ctx.fillRect(q.x - 1, q.y - 1, 2.5, 2); }
  if (dry) {
    const m = cellCenter(i); ctx.strokeStyle = 'rgba(90,60,30,.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(m.x - W * .15, m.y); ctx.lineTo(m.x - W * .05, m.y + W * .03); ctx.lineTo(m.x + W * .02, m.y - W * .02); ctx.lineTo(m.x + W * .14, m.y + W * .02); ctx.stroke();
  }
  if (hov) quad(p1, p2, p3, p4, null, 'rgba(255,255,255,.95)', 2.5);
  if (p.s === 'growing' || p.s === 'withered') {
    const crop = CROP[p.c];
    for (let k = 0; k < p.w; k++) { const [u, v] = WEED_SPOTS[k]; const q = iso(c + u, r + v); drawWeed(q.x, q.y, W / 100); }
    const st = p.s === 'growing' ? stageOf(p) : 4;
    if (crop && crop.arvore && crop.tipo !== 'moita' && p.s === 'growing') {
      const q = iso(c + 0.5, r + 0.58);
      drawFruitTree(q.x, q.y, W / 100 * 1.05, crop, st, t);
      for (let k = 0; k < p.b; k++) { const qb = iso(c + 0.3 + k * 0.15, r + 0.75); drawBug(qb.x, qb.y, W / 100, t, k + i); }
      return;
    }
    const big = crop && crop.tipo === 'chao' && st >= 3;
    const s = W / 100 * (big ? 1.25 : 0.72) * (st === 0 ? 1.2 : 1);
    for (const [u, v] of (big ? BIG_SPOTS : PLANT_SPOTS)) { const q = iso(c + u, r + v); drawPlant(q.x, q.y, s, crop, st, t, p.s === 'withered'); }
    for (let k = 0; k < p.b; k++) { const q = iso(c + 0.45 + k * 0.15, r + 0.5); drawBug(q.x, q.y, W / 100, t, k + i); }
  }
}

// Placa do terreno: avisa quando sai a próxima expansão (ou que ela já pode ser comprada).
function landSignText() {
  if (freeLots()) return [`${freeLots()} ${freeLots() > 1 ? 'canteiros' : 'canteiro'}`, 'para colocar no +', '#2f5e14'];
  const next = EXPANSOES[state.exp + 1];
  if (!next) return null;
  const extra = next.total - EXPANSOES[state.exp].total;
  if (state.level < next.nivel) return [`+${extra} canteiros`, `no nível ${next.nivel}`, '#7a1d10'];
  return [`+${extra} canteiros`, `comprar · ${next.preco.toLocaleString('pt-BR')}`, '#2f5e14'];
}
function drawLandSign() {
  const txt = landSignText(); if (!txt) return;
  const W = L.W, x = L.ox - W * 2.35, y = L.oy + W * 1.15;
  const hov = hover && hover.kind === 'land';
  ctx.fillStyle = 'rgba(0,0,0,.15)'; ctx.beginPath(); ctx.ellipse(x, y, W * 0.18, W * 0.05, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(x - W * 0.035, y - W * 0.5, W * 0.07, W * 0.5);
  const fs = Math.round(clamp(W * 0.13, 11, 16));
  ctx.font = `800 ${fs}px 'Baloo 2', sans-serif`;
  const bw = Math.max(ctx.measureText(txt[0]).width, ctx.measureText(txt[1]).width) + fs * 1.6, bh = fs * 2.9, top = y - W * 0.5 - bh * 0.7;
  ctx.fillStyle = hov ? '#e8b273' : '#d39a5c'; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(x - bw / 2, top, bw, bh, 7); ctx.fill(); ctx.stroke();
  line({ x: x - bw / 2 + 5, y: top + bh / 2 }, { x: x + bw / 2 - 5, y: top + bh / 2 }, 'rgba(122,74,34,.35)', 1);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#4a2a10'; ctx.fillText(txt[0], x, top + bh * 0.3);
  ctx.fillStyle = txt[2]; ctx.fillText(txt[1], x, top + bh * 0.72);
  hits.push({ kind: 'land', x, y: top + bh / 2, r: Math.max(bw / 2, 30) });
}
function plotBubble(p, home) {
  if (p.s === 'withered') return home ? 'hoe' : null;
  if (p.s !== 'growing') return null;
  if (p.poda) return home ? 'poda' : null;
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
  if (home) drawLandSign();
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
// Cada abrigo tem um cercado. O prédio fica no fundo, o cocho à direita e os bichos passeiam na frente.
const SHED = { u: 0.3, v: 0.25, w: 1.7, d: 1.1 };
const yardArea = id => {
  const y = yardOf(id);
  return { u0: y.u0 + 0.45, u1: y.u1 - 0.4, v0: y.v0 + 1.65, v1: y.v1 - 0.4, trough: id !== 'apiario' && { u0: y.u0 + 2.45, u1: y.u0 + 3.45, v0: y.v0 + 0.95, v1: y.v0 + 1.15 } };
};
const HIVE_SPOTS = [[0.9, 1.95], [1.9, 1.95], [2.9, 1.95], [0.9, 2.9], [1.9, 2.9], [2.9, 2.9], [3.5, 2.4], [3.5, 3.3]];
// Estilo de cada prédio: paredes, telhado e detalhes.
const SHED_LOOK = {
  galinheiro: { wall: '#ecc98c', wallR: '#d2a869', roof: '#c8402f', roofD: '#8f2a1e', chao: '#dccb8e', h: 0.55, legs: 0.12 },
  coelheira:  { wall: '#d9a86a', wallR: '#bf8c50', roof: '#5a9a3a', roofD: '#3d7326', chao: '#b5dc7a', h: 0.45, legs: 0.2, small: true },
  chiqueiro:  { wall: '#d99a7c', wallR: '#bd7f62', roof: '#8a5a33', roofD: '#6b4220', chao: '#b99264', h: 0.5 },
  apiario:    { wall: '#f4d774', wallR: '#dcb957', roof: '#e08a2e', roofD: '#b86a1a', chao: '#b5dc7a', h: 0.45, small: true },
  aprisco:    { wall: '#cfc8b8', wallR: '#b3ab98', roof: '#6c8f3a', roofD: '#4f6e28', chao: '#bfe08a', h: 0.6, pedra: true },
  estabulo:   { wall: '#c8402f', wallR: '#a53325', roof: '#7a2a1e', roofD: '#5a1d14', chao: '#cdb97c', h: 0.75, trim: true },
  cocheira:   { wall: '#b07a44', wallR: '#94622f', roof: '#3f6fa8', roofD: '#2c5282', chao: '#c9b27a', h: 0.72, trim: true },
  cercado:    { wall: '#e3bf62', wallR: '#c9a24a', roof: '#e3bf62', roofD: '#b8943a', chao: '#b5dc7a', h: 0.8, aberto: true },
};
// Prédio com telhado de duas águas. A cumeeira corre no sentido u.
function drawShed(id, u0, v0, lv, t) {
  const k = SHED_LOOK[id], sm = k.small ? 0.78 : 1;
  const a0 = u0 + SHED.u, b0 = v0 + SHED.v, a1 = a0 + SHED.w * sm, b1 = b0 + SHED.d * sm;
  const h0 = k.legs || 0, h = h0 + k.h * sm, rh = 0.42 * sm, vm = (b0 + b1) / 2, o = 0.1;
  const W = L.W;
  ctx.fillStyle = 'rgba(0,0,0,.16)'; poly([P(a0, b1 + 0.12), P(a1 + 0.15, b1 + 0.12), P(a1 + 0.15, b0), P(a0, b0)]); ctx.fill();
  if (k.legs) for (const [u, v] of [[a0 + 0.08, b1 - 0.08], [a1 - 0.08, b1 - 0.08], [a1 - 0.08, b0 + 0.1]]) { const q = P(u, v); ctx.fillStyle = '#6e4424'; ctx.fillRect(q.x - W * 0.02, q.y - h0 * W, W * 0.04, h0 * W); }
  if (k.aberto) {
    // viveiro: telhado de palha em quatro postes, com um poleiro
    for (const [u, v] of [[a0 + 0.1, b1 - 0.1], [a1 - 0.1, b1 - 0.1], [a1 - 0.1, b0 + 0.1], [a0 + 0.1, b0 + 0.1]]) {
      const q = P(u, v); ctx.fillStyle = '#8a5a33'; ctx.fillRect(q.x - W * 0.025, q.y - h * W, W * 0.05, h * W);
    }
    line(P(a0 + 0.3, vm, 0.35), P(a1 - 0.3, vm, 0.35), '#8a5a33', W * 0.04);
  } else {
    isoBox(a0, b0, a1, b1, h0, h, k.wall, k.wall, k.wallR);
    if (k.pedra) {
      ctx.strokeStyle = 'rgba(90,80,60,.35)'; ctx.lineWidth = 1;
      for (let r = 1; r < 4; r++) { const hh = h0 + (h - h0) * r / 4; line(P(a0, b1, hh), P(a1, b1, hh), 'rgba(90,80,60,.35)', 1); line(P(a1, b0, hh), P(a1, b1, hh), 'rgba(90,80,60,.3)', 1); }
    } else {
      for (let r = 1; r < 4; r++) { const hh = h0 + (h - h0) * r / 4; line(P(a0, b1, hh), P(a1, b1, hh), 'rgba(80,40,10,.22)', 1); line(P(a1, b0, hh), P(a1, b1, hh), 'rgba(80,40,10,.2)', 1); }
    }
    // porta virada para o cercado
    const dm = (a0 + a1) / 2, dw = 0.26 * sm, dh = h0 + (h - h0) * 0.72;
    if (k.trim) {
      quad(P(dm - dw, b1, h0), P(dm + dw, b1, h0), P(dm + dw, b1, dh), P(dm - dw, b1, dh), '#fff4e0');
      quad(P(dm - dw + 0.04, b1, h0), P(dm + dw - 0.04, b1, h0), P(dm + dw - 0.04, b1, dh - 0.04), P(dm - dw + 0.04, b1, dh - 0.04), k.wallR);
      line(P(dm - dw + 0.04, b1, h0), P(dm + dw - 0.04, b1, dh - 0.04), '#fff4e0', 2);
      line(P(dm + dw - 0.04, b1, h0), P(dm - dw + 0.04, b1, dh - 0.04), '#fff4e0', 2);
      quad(P(a1, vm - 0.14, h * 0.55), P(a1, vm + 0.14, h * 0.55), P(a1, vm + 0.14, h * 0.8), P(a1, vm - 0.14, h * 0.8), '#fff4e0');
      quad(P(a1, vm - 0.1, h * 0.58), P(a1, vm + 0.1, h * 0.58), P(a1, vm + 0.1, h * 0.77), P(a1, vm - 0.1, h * 0.77), '#3a2412');
    } else {
      quad(P(dm - dw, b1, h0), P(dm + dw, b1, h0), P(dm + dw, b1, dh), P(dm - dw, b1, dh), '#3a2412');
      if (id === 'coelheira') { ctx.strokeStyle = 'rgba(230,230,230,.7)'; ctx.lineWidth = 1; for (let q = 1; q < 4; q++) line(P(dm - dw + q * dw / 2, b1, h0), P(dm - dw + q * dw / 2, b1, dh), 'rgba(230,230,230,.7)', 1); }
    }
    if (id === 'galinheiro') line(P(dm, b1, h0), P(dm + 0.1, b1 + 0.4), '#a0703f', W * 0.05); // rampa
    if (id === 'apiario') { const q = P(a1, vm, h * 0.55); ctx.fillStyle = '#f2b705'; ctx.beginPath(); ctx.ellipse(q.x + W * 0.04, q.y, W * 0.07, W * 0.09, 0, 0, 7); ctx.fill(); }
    // oitão (a ponta triangular do telhado)
    ctx.fillStyle = k.wallR; poly([P(a1, b0, h), P(a1, b1, h), P(a1, vm, h + rh)]); ctx.fill();
  }
  // telhado: a água de trás, a da frente e a beirada
  quad(P(a0 - o, b0 - o, h - 0.04), P(a1 + o, b0 - o, h - 0.04), P(a1 + o, vm, h + rh), P(a0 - o, vm, h + rh), k.roofD);
  quad(P(a0 - o, vm, h + rh), P(a1 + o, vm, h + rh), P(a1 + o, b1 + o, h - 0.04), P(a0 - o, b1 + o, h - 0.04), k.roof);
  quad(P(a1 + o, vm, h + rh), P(a1 + o, b1 + o, h - 0.04), P(a1 + o, b1 + o, h - 0.1), P(a1 + o, vm, h + rh - 0.06), k.roofD);
  quad(P(a1 + o, vm, h + rh), P(a1 + o, b0 - o, h - 0.04), P(a1 + o, b0 - o, h - 0.1), P(a1 + o, vm, h + rh - 0.06), k.roofD);
  for (let r = 1; r < 4; r++) { const f = r / 4; line(lerp(P(a0 - o, vm, h + rh), P(a0 - o, b1 + o, h - 0.04), f), lerp(P(a1 + o, vm, h + rh), P(a1 + o, b1 + o, h - 0.04), f), 'rgba(0,0,0,.14)', 1); }
  line(P(a0 - o, vm, h + rh), P(a1 + o, vm, h + rh), k.roofD, W * 0.03);
  // estrelinhas do nível no telhado
  for (let s = 0; s < lv; s++) { const q = lerp(P(a0, vm, h + rh * 0.55), P(a1, vm, h + rh * 0.55), (s + 1) / (lv + 1)); star(q.x, q.y + W * 0.08, W * 0.07); }
  return { x: P((a0 + a1) / 2, (b0 + b1) / 2, h).x, y: P((a0 + a1) / 2, (b0 + b1) / 2, h * 0.6).y, top: P(a0, vm, h + rh).y };
}
function star(x, y, r) {
  ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = '#a87400'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
}
// Cocho com ração (ou flores, no apiário).
function drawTrough(y, id) {
  if (id === 'apiario') {
    for (const [u, v, c] of [[2.6, 0.6, '#f06292'], [3.0, 0.9, '#ffd54a'], [3.4, 0.55, '#ffffff'], [2.8, 1.2, '#ba68c8'], [3.5, 1.15, '#ff8a65']]) {
      const q = iso(y.u0 + u, y.v0 + v); ctx.fillStyle = '#4f9a2f'; ctx.beginPath(); ctx.ellipse(q.x, q.y, L.W * 0.12, L.W * 0.05, 0, 0, 7); ctx.fill();
      for (let p = 0; p < 5; p++) { const a = p * 1.26; ctx.fillStyle = c; ctx.beginPath(); ctx.arc(q.x + Math.cos(a) * L.W * 0.035, q.y - L.W * 0.05 + Math.sin(a) * L.W * 0.02, L.W * 0.025, 0, 7); ctx.fill(); }
    }
    return;
  }
  isoBox(y.u0 + 2.5, y.v0 + 0.45, y.u0 + 3.5, y.v0 + 0.75, 0, 0.14, '#e3bf62', '#8a5a33', '#6e4424');
  ctx.fillStyle = '#c9a24a'; for (let k = 0; k < 6; k++) { const q = P(y.u0 + 2.6 + k * 0.15, y.v0 + 0.6, 0.14); ctx.fillRect(q.x - 1, q.y - 1.5, 2, 2); }
}
// Lugar vazio de um abrigo: contorno pontilhado e uma placa.
function drawEmptyYard(b, y, home) {
  const W = L.W;
  if (!home) return;
  const lv = 0, nivel = b.nivel, locked = state.level < nivel;
  const pts = [iso(y.u0 + 0.15, y.v0 + 0.15), iso(y.u1 - 0.15, y.v0 + 0.15), iso(y.u1 - 0.15, y.v1 - 0.15), iso(y.u0 + 0.15, y.v1 - 0.15)];
  ctx.setLineDash([6, 6]); quad(...pts, 'rgba(255,255,255,.08)', 'rgba(255,255,255,.7)', 2); ctx.setLineDash([]);
  const m = iso((y.u0 + y.u1) / 2, (y.v0 + y.v1) / 2);
  const hov = hover && hover.kind === 'abrigo' && hover.id === b.id;
  ctx.fillStyle = '#7a4a22'; ctx.fillRect(m.x - W * 0.035, m.y - W * 0.45, W * 0.07, W * 0.45);
  const bw = Math.max(W * 1.25, 84), bh = Math.max(W * 0.5, 34), top = m.y - W * 0.45 - bh * 0.6;
  ctx.fillStyle = hov ? '#e8b273' : '#d39a5c'; ctx.strokeStyle = '#7a4a22'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.roundRect(m.x - bw / 2, top, bw, bh, 6); ctx.fill(); ctx.stroke();
  const fs = Math.round(clamp(W * 0.15, 11, 16));
  ctx.fillStyle = '#4a2a10'; ctx.font = `800 ${fs}px 'Baloo 2', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(b.nome, m.x, top + bh * 0.32);
  ctx.font = `700 ${Math.round(fs * 0.85)}px 'Baloo 2', sans-serif`;
  ctx.fillStyle = locked ? '#7a1d10' : '#2f5e14';
  ctx.fillText(locked ? `Nível ${nivel}` : `Construir · ${b.precos[lv].toLocaleString('pt-BR')}`, m.x, top + bh * 0.72);
  hits.push({ kind: 'abrigo', id: b.id, x: m.x, y: top + bh / 2, r: Math.max(W * 0.7, 44) });
}
function drawYard(b, s, t, home, dt, bubbles) {
  const y = yardOf(b.id), lv = abrigoLv(s, b.id), W = L.W, k = SHED_LOOK[b.id];
  if (!lv) return drawEmptyYard(b, y, home);
  const e = 0.12, R = [y.u0 + e, y.v0 + e, y.u1 - e, y.v1 - e];
  quad(iso(R[0], R[1]), iso(R[2], R[1]), iso(R[2], R[3]), iso(R[0], R[3]), k.chao);
  if (b.id === 'chiqueiro') { const q = iso(y.u0 + 1.4, y.v0 + 2.6); ctx.fillStyle = '#8a6a44'; ctx.beginPath(); ctx.ellipse(q.x, q.y, W * 0.5, W * 0.2, 0, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.15)'; ctx.beginPath(); ctx.ellipse(q.x - W * 0.12, q.y - W * 0.04, W * 0.18, W * 0.05, 0, 0, 7); ctx.fill(); }
  if (b.id === 'galinheiro') { ctx.fillStyle = 'rgba(200,160,70,.5)'; for (let j = 0; j < 14; j++) { const q = iso(y.u0 + 0.5 + (j * 0.37) % 3, y.v0 + 1.7 + (j * 0.61) % 1.8); ctx.fillRect(q.x, q.y, W * 0.08, 1.5); } }
  drawFenceRect(R[0], R[1], R[2], R[3], 'back');
  drawTrough(y, b.id);
  const c = drawShed(b.id, y.u0, y.v0, lv, t);
  const hov = hover && hover.kind === 'abrigo' && hover.id === b.id;
  if (hov) { ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(c.x, c.y, W * 0.75, W * 0.45, 0, 0, 7); ctx.stroke(); }
  hits.push({ kind: 'abrigo', id: b.id, x: c.x, y: c.y, r: W * 0.55 });
  const list = livesIn(s, b.id);
  updateWander(list, dt, yardArea(b.id));
  const base = W / 100 * 1.35;
  const sorted = list.map(a => ({ a, m: amb[a.id] })).sort((p, q) => (p.m.u + p.m.v) - (q.m.u + q.m.v));
  for (const { a, m } of sorted) drawAnimalAt(a, m, base, t);
  drawFenceRect(R[0], R[1], R[2], R[3], 'front');
  for (const { a, m } of sorted) {
    const kk = animalBubble(a, home);
    if (kk) bubbles.push([a, m, kk, animalScale(a, base)]);
  }
}
function drawPen(s, t, home, dt) {
  const tod = timeOfDay(), W = L.W;
  drawSky(t, tod); drawGround();
  drawTree(iso(-0.9, RANCH_R - 0.6).x, iso(-0.9, RANCH_R - 0.6).y, W * 1.0, t);
  drawTree(iso(RANCH_C + 0.8, 0.8).x, iso(RANCH_C + 0.8, 0.8).y, W * 1.1, t);
  if (view.kind === 'npc') { const q = DOG_AT(); drawDog(q.x, q.y, W * 0.72, t); }
  else { drawKennelSpot('animais', s, home); drawDogSpot('animais', s, t, home); }
  const bubbles = [];
  const order = ABRIGOS.slice().sort((a, b) => { const p = yardOf(a.id), q = yardOf(b.id); return (p.u0 + p.v0) - (q.u0 + q.v0); });
  for (const b of order) drawYard(b, s, t, home, dt, bubbles);
  nightOverlay(tod);
  for (const [a, m, k, sc] of bubbles) { const p = iso(m.u, m.v); drawBubbleAt(p.x, p.y - ANIMAL_H[drawKind(a)] * sc - W * 0.2, k, a, t, m.u * 7); }
  dogBubble('animais', s, t, home);
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
  // bichos de companhia que moram dentro de casa
  const pets = s.animals.filter(a => ANIMAL[a.k].lugar === 'casa');
  updateWander(pets, Math.min(0.05, 1 / 60), ROOM_AREA);
  pets.map(a => ({ a, m: amb[a.id] })).sort((x, y) => (x.m.u + x.m.v) - (y.m.u + y.m.v)).forEach(({ a, m }) => drawAnimalAt(a, m, W / 100 * (a.k === 'arara' ? 1.35 : 2.1), t));
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
  const crop = CROP[id];
  if (crop.arvore && crop.tipo !== 'moita') { drawFruitTree(48, 90, crop.tipo === 'palmeira' ? 1.35 : crop.tipo === 'arvore' ? 1.45 : 1.6, crop, 4, 0); return; }
  ctx.fillStyle = '#8b5a33'; ctx.beginPath(); ctx.ellipse(48, 76, 34, 13, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(60,34,14,.35)'; ctx.beginPath(); ctx.ellipse(48, 78, 26, 8, 0, 0, 7); ctx.fill();
  const sc = { chao: 2.3, alto: 1.6, grao: 2.2, abacaxi: 2.6, folha: 2.8 }[crop.tipo] || 2.4;
  drawPlant(48, 78, sc, crop, 4, 0, false);
});
const animalIcon = id => makeIcon('a:' + id, () => {
  const k = ANIMAL[id].desenho || id;
  const sc = { galinha: 2.6, vaca: 1.6, ovelha: 2.2, porco: 2.1, coelho: 2.7, angola: 2.5, pato: 2.5, jumento: 1.45, cavalo: 1.35, pavao: 2.0, cabra: 1.9, bufala: 1.5, abelha: 2.6, avestruz: 1.45, gato: 3.4, tartaruga: 3.6, arara: 1.75 }[k];
  const x = SMALL_ANIMALS.includes(k) || k === 'tartaruga' ? 46 : k === 'pavao' ? 56 : k === 'abelha' || k === 'arara' ? 48 : k === 'avestruz' ? 42 : 38;
  drawAnimal(k, x, 88, sc, 0, 1, false);
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
const abrigoIcon = id => makeIcon('ab:' + id, () => {
  L.W = 58; L.ox = 0; L.oy = 0;
  const m = P(SHED.u + SHED.w / 2, SHED.v + SHED.d / 2, 0.3);
  L.ox = 44 - m.x; L.oy = 60 - m.y;
  drawShed(id, 0, 0, 0, 0);
});
const itemIcon = id => PRODUCE[id] ? cropIcon(PRODUCE[id].planta) : productIcon(id);
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
  ctx.fillText(`${f.corta * 100}%`, 48, 50);
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
  { id: 'pest', nome: 'Inseticida' }, { id: 'seed', nome: 'Semente' },
  { id: 'fert', nome: 'Adubo' },
];
const HOME_ONLY = ['seed', 'hoe', 'fert'];
const availTools = () => TOOLS.filter(t => (isHome() || !HOME_ONLY.includes(t.id)) && (t.id !== 'hoe' || state.tools.enxada));

function renderTools() {
  const box = $('#tools'), hint = $('#sceneHint');
  box.hidden = scene !== 'roca';
  hint.hidden = scene === 'roca';
  hint.textContent = scene === 'animais'
    ? (isHome() ? 'Clique num animal para alimentar, recolher ou vender. Clique num abrigo para aumentar ou para construir um novo.' : 'Dê comida aos animais com fome para ajudar. Produto pronto dá para pegar um pouquinho.')
    : (isHome() ? 'Os espaços com + são lugares para decoração. Cada peça dá conforto, e conforto aumenta o XP que você ganha. Gato, tartaruga e arara moram aqui: clique neles para fazer carinho.' : 'Esta é a casa do seu vizinho.');
  box.innerHTML = '';
  availTools().forEach((t, k) => {
    const b = document.createElement('button');
    b.className = 'roundbtn tool'; b.type = 'button';
    b.setAttribute('aria-pressed', String(state.tool === t.id));
    const icon = t.id === 'seed' ? `<img alt="" src="${cropIcon(state.seed)}">`
      : t.id === 'fert' ? `<img alt="" src="${fertIcon(state.fertSel)}">` : TOOL_ICONS[t.id];
    const label = t.id === 'seed' ? CROP[state.seed].nome
      : t.id === 'fert' ? `${FERT[state.fertSel].curto} ×${state.fert[state.fertSel] || 0}` : t.nome;
    b.innerHTML = `<span class="ic">${icon}</span><span class="lb">${label}</span>`;
    b.title = (t.id === 'hand' ? 'Faz a ação certa: colhe, rega, tira pragas, planta' : t.nome) + ` (tecla ${k + 1})`;
    b.addEventListener('click', () => setTool(t.id));
    box.appendChild(b);
  });
}
function setTool(id) {
  if (!isHome() && HOME_ONLY.includes(id)) return;
  state.tool = id; renderTools(); renderPane();
}
function setScene(sc) {
  if (sc !== scene) L.pan = { x: 0, y: 0 };
  scene = sc; hover = null; renderZoom();
  document.querySelectorAll('#scenes button').forEach(b => b.setAttribute('aria-selected', String(b.dataset.scene === sc)));
  renderTools(); renderSceneInfo();
}

function renderHUD() {
  $('#lvl').textContent = state.level;
  const n = need(state.level);
  $('#xptxt').textContent = `${state.xp} / ${n}`;
  $('#xpbar').style.width = `${Math.min(100, state.xp / n * 100)}%`;
  $('#coins').textContent = state.coins.toLocaleString('pt-BR');
  const nome = user ? firstName(user.name) : 'Roça Feliz';
  if ($('#pname').textContent !== nome) $('#pname').textContent = nome;
  const face = user && user.photo ? `<img alt="" referrerpolicy="no-referrer" src="${esc(user.photo)}">` : esc(user ? nome[0] : '☺');
  if ($('#face').dataset.k !== face) { $('#face').innerHTML = face; $('#face').dataset.k = face; }
}

function renderPenActions() {
  const el = $('#penActions');
  if (!el) return;
  const show = scene === 'animais' && isHome() && !isGated();
  el.hidden = !show;
  if (!show) return;
  const hungry = state.animals.filter(isHungry), ready = state.animals.filter(a => ANIMAL[a.k].tipo === 'prod' && a.ready);
  const cost = hungry.reduce((t, a) => t + ANIMAL[a.k].racao, 0);
  const key = hungry.length + ':' + cost + ':' + ready.length;
  if (el.dataset.key === key) return;
  el.dataset.key = key;
  el.innerHTML = `<button class="btn" type="button" data-feed-all ${hungry.length ? '' : 'disabled'} aria-label="Alimentar todos${hungry.length ? ` (${hungry.length}) por ${cost} moedas` : ''}">Alimentar<span class="wide"> todos</span>${hungry.length ? ` (${hungry.length}) · <span class="coin"></span>${cost.toLocaleString('pt-BR')}` : ''}</button>
    <button class="btn gold" type="button" data-collect-all ${ready.length ? '' : 'disabled'}>Recolher<span class="wide"> tudo</span>${ready.length ? ` (${ready.length})` : ''}</button>`;
}
function renderSceneInfo() {
  renderPenActions();
  const s = S(), el = $('#sceneInfo');
  const owner = isHome() ? '' : `${view.nome} · `;
  if (scene === 'roca') el.textContent = owner + `${s.plots.filter(p => p.s !== 'locked').length}${isHome() ? ` de ${allowedLots()}` : ''} canteiros`;
  else if (scene === 'animais') {
    const cap = ABRIGOS.reduce((t, b) => t + ABRIGO_CAP[abrigoLv(s, b.id)], 0);
    el.textContent = owner + `${s.animals.filter(inPen).length}${isHome() ? ` de ${cap}` : ''} animais`;
  }
  else el.textContent = owner + `Conforto ${comfort(s)} · +${comfort(s)}% de XP`;
}

function renderAccount() {
  if (state) renderHUD();
  const el = $('#account');
  if (!Cloud.available) { el.innerHTML = '<span class="acct-note">Salvo neste navegador</span>'; return; }
  if (cloudStatus === 'loading') { el.innerHTML = '<span class="acct-note">Conectando…</span>'; return; }
  if (user) {
    el.innerHTML = `${user.photo ? `<img alt="" referrerpolicy="no-referrer" src="${esc(user.photo)}">` : ''}
      <span class="who"><span>${esc(firstName(user.name))}</span><small>${esc(syncStatus)}</small></span>
      <button class="btn ghost" type="button" data-logout>Sair</button>`;
    return;
  }
  el.innerHTML = `<button class="gbtn" type="button" data-login>${GOOGLE_G}Entrar com Google</button>`;
}
$('#account').addEventListener('click', e => {
  if (e.target.closest('[data-login]')) { closeSettings(); login(); }
  if (e.target.closest('[data-logout]')) { closeSettings(); logout(); }
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
  const old = b.querySelector('.badge'); if (old) old.remove();
  if (n) b.insertAdjacentHTML('beforeend', `<span class="badge" aria-label="${n} novidades">${n}</span>`);
}
const TAB_NAMES = { loja: 'Loja', celeiro: 'Celeiro', terreno: 'Terreno', amigos: 'Amigos' };
// A janela abre por cima do jogo. Clicar de novo no mesmo botão fecha.
function openPanel(t, seg, focus) {
  tab = t; if (seg) shopSeg = seg;
  $('#panel').hidden = false;
  renderPane(); $('#pane').scrollTop = 0;
  if (t === 'amigos') checkSent();
  if (focus) focusRow('abrigo-' + focus);
}
function closePanel() { $('#panel').hidden = true; renderPane(); }
function focusRow(id) {
  const el = document.getElementById(id); if (!el) return;
  el.scrollIntoView({ block: 'center' }); el.classList.add('flash');
}
function renderPane() {
  const open = !$('#panel').hidden;
  document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', String(open && b.dataset.tab === tab)));
  $('#panelTitle').textContent = TAB_NAMES[tab];
  if (!open) return;
  const pane = $('#pane');
  let html = '';
  if (tab === 'loja') {
    const segs = [['sementes', 'Sementes'], ['mudas', 'Mudas'], ['adubo', 'Itens'], ['animais', 'Animais'], ['abrigos', 'Abrigos'], ['caes', 'Cães'], ['decor', 'Casa']];
    html += `<div class="seg small" role="tablist">${segs.map(([id, n]) => `<button type="button" role="tab" data-seg="${id}" aria-selected="${shopSeg === id}">${n}</button>`).join('')}</div>`;
    if (shopSeg === 'sementes' || shopSeg === 'mudas') {
      const trees = shopSeg === 'mudas';
      html += trees
        ? `<p class="hint">Árvores ocupam um canteiro e ficam lá: a primeira colheita demora mais, depois repete na metade do tempo. Depois de ${TREE_HARVESTS} colheitas pedem uma poda.</p>`
        : `<p class="hint">Escolha uma semente e clique na terra arada para plantar. Cada semente vale para um canteiro e é cobrada no plantio.</p>`;
      const list = CROPS.filter(c => !!c.arvore === trees);
      const shown = list.filter(c => c.nivel <= state.level);
      const upcoming = list.filter(c => c.nivel > state.level);
      for (const c of [...shown, ...upcoming.slice(0, 2)]) {
        const locked = c.nivel > state.level, sel = state.seed === c.id && state.tool === 'seed';
        const total = c.rend * c.preco;
        const meta = trees
          ? `Muda ${c.custo.toLocaleString('pt-BR')} · 1ª colheita em ${fmt(c.tempo)}, depois a cada ${fmt(c.tempo2)}<br>${c.rend} ${c.prodNome.toLowerCase()} × ${c.preco} = ${total} por colheita · ${c.xp} XP`
          : `Semente ${c.custo.toLocaleString('pt-BR')} · ${fmt(c.tempo)}<br>${c.rend} × ${c.preco} = ${total.toLocaleString('pt-BR')} · lucro ${(total - c.custo).toLocaleString('pt-BR')} · ${c.xp} XP`;
        html += `<div class="row ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}">
          <img alt="" src="${cropIcon(c.id)}">
          <div><div class="name">${c.nome}</div><div class="meta">${meta}</div></div>
          ${locked ? `<button class="btn" disabled>Nível ${c.nivel}</button>` : `<button class="btn ${sel ? 'gold' : ''}" data-seed="${c.id}">${sel ? 'Na mão' : 'Escolher'}</button>`}
        </div>`;
      }
      if (upcoming.length > 2) html += `<p class="hint">Mais ${upcoming.length - 2} ${trees ? 'árvores' : 'plantações'} liberam nos próximos níveis, até o nível ${upcoming[upcoming.length - 1].nivel}.</p>`;
    } else if (shopSeg === 'adubo') {
      html += `<div class="row ${state.tools.enxada ? 'sel' : ''}"><div class="avatar" style="background:#8a5a33">${TOOL_ICONS.hoe}</div>
        <div><div class="name">Enxada</div><div class="meta">100 moedas · arranca qualquer plantação ou árvore</div></div>
        ${state.tools.enxada ? '<button class="btn ghost" disabled>Sua</button>' : `<button class="btn" data-buy-hoe ${state.coins < 100 ? 'disabled' : ''}>Comprar</button>`}</div>`;
      html += `<div class="row"><img alt="" src="${bowlIcon()}">
        <div><div class="name">Ração especial</div><div class="meta">${RACAO_ESP} moedas · a próxima produção do animal rende em dobro. É usada quando você alimenta um animal clicando nele. Você tem <b>${state.racaoEsp}</b></div></div>
        <div class="stack"><button class="btn" data-racao-esp="1" ${state.coins < RACAO_ESP ? 'disabled' : ''}>Comprar 1</button><button class="btn ghost" data-racao-esp="5" ${state.coins < RACAO_ESP * 5 ? 'disabled' : ''}>Comprar 5</button></div></div>`;
      html += `<p class="hint">O regador é grátis. Fertilizante corta uma parte do tempo total da planta; escolha o tipo e clique numa planta com a ferramenta Adubo. Vale um por colheita.</p>`;
      for (const f of FERTS) {
        const locked = f.nivel > state.level, have = state.fert[f.id] || 0;
        const sel = state.tool === 'fert' && state.fertSel === f.id;
        html += `<div class="row ${locked ? 'locked' : ''} ${sel ? 'sel' : ''}">
          <img alt="" src="${fertIcon(f.id)}">
          <div><div class="name">${f.nome}</div>
          <div class="meta">Corta ${f.corta * 100}% do tempo da planta<br>${f.custo.toLocaleString('pt-BR')} moedas · você tem <b>${have}</b></div></div>
          ${locked ? `<button class="btn" disabled>Nível ${f.nivel}</button>` : `<div class="stack">
            <button class="btn" data-buy-fert="${f.id}" data-n="1" ${state.coins < f.custo ? 'disabled' : ''}>Comprar 1</button>
            <button class="btn ghost" data-buy-fert="${f.id}" data-n="5" ${state.coins < f.custo * 5 ? 'disabled' : ''}>Comprar 5</button>
            ${have ? `<button class="btn ${sel ? 'gold' : 'ghost'}" data-use-fert="${f.id}">${sel ? 'Na mão' : 'Usar'}</button>` : ''}</div>`}
        </div>`;
      }
    } else if (shopSeg === 'animais') {
      html += `<p class="hint">Cada bicho mora no seu abrigo, que você constrói e aumenta na aba Abrigos. Nenhum animal morre: sem comida ele só para, e quem termina o período produtivo precisa do veterinário.</p>`;
      const row = (d, meta, btn) => `<div class="row ${d.nivel > state.level ? 'locked' : ''}"><img alt="" src="${animalIcon(d.id)}">
        <div><div class="name">${d.nome}${state.animals.some(x => x.k === d.id) ? ` <span class="meta">(${state.animals.filter(x => x.k === d.id).length})</span>` : ''}</div><div class="meta">${meta}</div></div>${btn}</div>`;
      const buyBtn = d => {
        if (d.nivel > state.level) return `<button class="btn" disabled>Nível ${d.nivel}</button>`;
        const ab = d.lugar !== 'casa' && abrigoOf(d.id);
        if (ab && !abrigoLv(state, ab.id)) return `<button class="btn ghost" data-seg="abrigos" data-focus="${ab.id}">Precisa ${ab.o === 'a' ? 'da' : 'do'} ${ab.nome.toLowerCase()}</button>`;
        if (ab && vagas(state, ab.id) <= 0) return `<button class="btn ghost" data-seg="abrigos" data-focus="${ab.id}">${ab.nome} ${ab.o === 'a' ? 'cheia' : 'cheio'}</button>`;
        return `<button class="btn" data-buy-animal="${d.id}" ${state.coins < d.custo ? 'disabled' : ''}>Comprar</button>`;
      };
      const visible = tipo => { const l = ANIMALS.filter(d => d.tipo === tipo); const up = l.filter(d => d.nivel > state.level); return [...l.filter(d => d.nivel <= state.level), ...up.slice(0, 2)]; };
      html += `<h3>Produção</h3>`;
      for (const d of visible('prod')) {
        const prodTxt = d.prod === 'leitao' ? 'leitões (viram porquinhos no chiqueiro)' : `${PRODUCT[d.prod].nome.toLowerCase()} (vende por ${PRODUCT[d.prod].preco})`;
        html += row(d, `${d.custo.toLocaleString('pt-BR')} moedas · ração ${d.racao} por produção<br>${prodTxt} a cada ${fmt(d.tempo)}<br>produz por ${d.periodo} dias · ${d.xp} XP por coleta`, buyBtn(d));
      }
      html += `<h3>Para criar e vender</h3>`;
      for (const d of visible('cria')) {
        html += row(d, `${d.custo.toLocaleString('pt-BR')} moedas · ração ${d.racao} por dia<br>cresce em ${fmt(d.tempo)} e vende por ${d.venda.toLocaleString('pt-BR')}<br>lucro ${(d.venda - d.custo - d.racao * Math.ceil(d.tempo / (24 * HOUR))).toLocaleString('pt-BR')} · ${d.xp} XP na venda`, buyBtn(d));
      }
      html += `<h3>Companhia</h3>`;
      for (const d of visible('pet')) html += row(d, `${d.custo.toLocaleString('pt-BR')} moedas · mora ${d.lugar === 'casa' ? 'dentro de casa' : (abrigoOf(d.id).o === 'a' ? 'na ' : 'no ') + abrigoOf(d.id).nome.toLowerCase()}<br>não come nem produz · carinho dá 2 XP por dia`, buyBtn(d));
      const pets = state.animals.filter(a => ANIMAL[a.k].tipo === 'pet');
      if (pets.length) {
        html += `<h3>Nomes dos seus bichos</h3>`;
        for (const a of pets) html += `<form class="addform" data-rename="${a.id}"><input id="pet-${a.id}" maxlength="18" value="${esc(a.nome || ANIMAL[a.k].nome)}" aria-label="Nome do ${esc(ANIMAL[a.k].nome.toLowerCase())}" style="text-transform:none;letter-spacing:0"><button class="btn" type="submit">Salvar</button></form>`;
      }
    } else if (shopSeg === 'abrigos') {
      html += `<p class="hint">Cada abrigo tem o seu cercado no rancho. Nível 1 cabe ${ABRIGO_CAP[1]} animais, nível 2 cabe ${ABRIGO_CAP[2]} e nível 3 cabe ${ABRIGO_CAP[3]}.</p>`;
      for (const b of ABRIGOS) {
        const lv = abrigoLv(state, b.id), max = lv >= 3, nivel = b.nivel + ABRIGO_NIVEL[Math.min(3, lv + 1)], preco = b.precos[Math.min(2, lv)];
        const quem = b.bichos.map(k => ANIMAL[k].nome).join(', ');
        const btn = max ? '<button class="btn ghost" disabled>Nível máximo</button>'
          : state.level < nivel ? `<button class="btn" disabled>Nível ${nivel}</button>`
          : `<button class="btn ${lv ? '' : 'gold'}" data-abrigo="${b.id}" ${state.coins < preco ? 'disabled' : ''}>${lv ? 'Aumentar' : 'Construir'}<br><small>${preco ? preco.toLocaleString('pt-BR') : 'grátis'}</small></button>`;
        html += `<div class="row ${state.level < b.nivel ? 'locked' : ''} ${lv ? 'sel' : ''}" id="abrigo-${b.id}"><img alt="" src="${abrigoIcon(b.id)}">
          <div><div class="name">${b.nome}${lv ? ` · nível ${lv}` : ''}</div>
          <div class="meta">${quem}<br>${lv ? `${livesIn(state, b.id).length} de ${ABRIGO_CAP[lv]} animais${max ? '' : ` · nível ${lv + 1} cabe ${ABRIGO_CAP[lv + 1]}`}` : `cabe ${ABRIGO_CAP[1]} animais`}</div></div>${btn}</div>`;
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
    const items = [...Object.values(PRODUCE), ...PRODUCTS].filter(it => state.barn[it.id] > 0);
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
      <span>Canteiros</span><span>${state.owned} de ${allowedLots()}</span>
      <span>Animais</span><span>${state.animals.length}</span>
      <span>Abrigos</span><span>${Object.keys(state.abrigos).length} de ${ABRIGOS.length}</span>
      <span>Decorações</span><span>${Object.keys(state.decor).length} de ${DECOR.length}</span>
      <span>Colheitas</span><span>${state.stats.colheitas}</span>
      <span>Produtos dos animais</span><span>${state.stats.coletas}</span>
      <span>Moedas vendidas</span><span>${state.stats.vendido}</span>
      <span>Pegos nas visitas</span><span>${state.stats.roubado}</span>
      <span>Ajudas aos amigos</span><span>${state.stats.ajudas}</span></div>`;
    if (freeLots()) html += `<div class="row sel"><div></div><div><div class="name">${freeLots()} ${freeLots() > 1 ? 'canteiros' : 'canteiro'} para colocar</div><div class="meta">Clique num + encostado na sua terra (duas vezes) para escolher o lugar.</div></div>
        <button class="btn gold" data-see-land>Ver na roça</button></div>`;
    html += `<h3>Expansões</h3>`;
    EXPANSOES.forEach((e, k) => {
      if (k === 0) return;
      const have = k <= state.exp, next = k === state.exp + 1, extra = e.total - EXPANSOES[k - 1].total;
      if (!have && !next && k > state.exp + 3) return;
      html += `<div class="row ${have ? '' : next ? '' : 'locked'}"><div class="avatar" style="background:${have ? '#4f9a2f' : '#b7b39c'}">${k + 1}</div>
        <div><div class="name">+${extra} canteiros (total ${e.total})</div><div class="meta">${e.preco.toLocaleString('pt-BR')} moedas · nível ${e.nivel}</div></div>
        ${have ? '<button class="btn ghost" disabled>Comprada</button>' : next ? `<button class="btn gold" data-expand ${state.level >= e.nivel && state.coins >= e.preco ? '' : 'disabled'}>Comprar</button>` : `<button class="btn" disabled>Nível ${e.nivel}</button>`}</div>`;
    });
    html += `<p class="hint">Pragas comem parte da colheita enquanto ficam lá. Terra seca faz a planta crescer mais devagar. Nunca acontecem os dois juntos. Cada planta dá XP em até ${XP_CAP} colheitas por dia.</p>
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
  if (d.seg) { shopSeg = d.seg; renderPane(); $('#pane').scrollTop = 0; if (d.focus) focusRow('abrigo-' + d.focus); }
  else if (d.abrigo) buyAbrigo(d.abrigo);
  else if (d.seed) { state.seed = d.seed; state.tool = 'seed'; if (!isHome()) goHome(); setScene('roca'); closePanel(); save(); toast(`${CROP[d.seed].nome} na mão: clique na terra arada para plantar.`); }
  else if (d.buyAnimal) buyAnimal(d.buyAnimal);
  else if (d.buyDecor) buyDecor(d.buyDecor);
  else if ('seeHouse' in d) { if (!isHome()) goHome(); setScene('casa'); closePanel(); }
  else if (d.sell) sell(d.sell, false);
  else if (d.sellallOf) sell(d.sellallOf, true);
  else if ('sellall' in d) sellAll();
  else if ('seeLand' in d) { if (!isHome()) goHome(); setScene('roca'); closePanel(); toast('Clique num + encostado na sua terra para colocar um canteiro.'); }
  else if ('expand' in d) buyExpansion();
  else if (d.buyFert) buyFert(d.buyFert, Number(d.n) || 1);
  else if (d.racaoEsp) {
    const n = Number(d.racaoEsp) || 1;
    if (state.coins < RACAO_ESP * n) toast(`Faltam moedas: ${n} ração especial custa ${RACAO_ESP * n}.`, 'bad');
    else { state.coins -= RACAO_ESP * n; state.racaoEsp += n; sfx('buy'); toast(`+${n} ração especial`, 'good'); done(); }
  }
  else if ('buyHoe' in d) {
    if (state.coins < 100) toast('A enxada custa 100 moedas.', 'bad');
    else { state.coins -= 100; state.tools.enxada = true; sfx('buy'); toast('Enxada comprada! Agora ela aparece nas ferramentas.', 'good'); renderTools(); done(); }
  }
  else if (d.buyDog) buyDog(d.buyDog, d.slot);
  else if (d.dogFood) buyDogFood(Number(d.dogFood) || 1);
  else if (d.feedDog) feedDog(d.feedDog);
  else if (d.useFert) { state.fertSel = d.useFert; if (!isHome()) goHome(); setScene('roca'); setTool('fert'); closePanel(); save(); }
  else if (d.visit) { visitNpc(d.visit); closePanel(); }
  else if (d.visitFriend) { visitFriend(d.visitFriend); closePanel(); }
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
  const rn = e.target.dataset && e.target.dataset.rename;
  if (rn) {
    e.preventDefault();
    const a = state.animals.find(x => x.id === rn), v = $('#pet-' + rn).value.trim().slice(0, 18);
    if (a && v) { a.nome = v; toast(`Agora ele${ANIMAL[a.k].f ? 'a' : ''} se chama ${v}!`, 'good'); done(); }
    return;
  }
  if (e.target.id !== 'addFriend') return;
  e.preventDefault();
  addFriend($('#friendCode').value);
});
document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => {
  if (!$('#panel').hidden && tab === b.dataset.tab) closePanel(); else openPanel(b.dataset.tab);
}));
$('#closePanel').addEventListener('click', closePanel);
window.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#panel').hidden && $('#settings').hidden) closePanel(); });
// Ícones dos botões redondos
const MENU_ICONS = {
  loja: '<svg viewBox="0 0 32 32"><path d="M5 14h22v13H5z" fill="#f1dcae" stroke="#7a4a22" stroke-width="1.6"/><path d="M12 19h8v8h-8z" fill="#8a5a33"/><path d="M3 8h26l-2 7H5z" fill="#fff" stroke="#7a4a22" stroke-width="1.6" stroke-linejoin="round"/><path d="M8 8l-1 7M13.5 8 13 15M18.5 8l.5 7M24 8l1 7" stroke="#e0463a" stroke-width="3"/><path d="M3 8l3-4h20l3 4" fill="#e0463a" stroke="#7a4a22" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  celeiro: '<svg viewBox="0 0 32 32"><path d="M4 14 16 5l12 9v14H4z" fill="#c8402f" stroke="#6b1f14" stroke-width="1.6" stroke-linejoin="round"/><path d="M11 28V18h10v10" fill="#fff4e0"/><path d="M11 18l10 10M21 18 11 28" stroke="#c8402f" stroke-width="1.6"/><circle cx="16" cy="12" r="2.2" fill="#fff4e0"/></svg>',
  terreno: '<svg viewBox="0 0 32 32"><path d="M16 9 29 17 16 25 3 17z" fill="#8b5a33" stroke="#4a2c14" stroke-width="1.6" stroke-linejoin="round"/><path d="M9 17l7-4.3M12 19l7-4.3M15 21l7-4.3" stroke="#5e3a1c" stroke-width="1.2"/><circle cx="24" cy="8" r="6" fill="#4f9a2f" stroke="#2f6e1e" stroke-width="1.4"/><path d="M24 5v6M21 8h6" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>',
  amigos: '<svg viewBox="0 0 32 32"><circle cx="11" cy="12" r="5" fill="#ffd9b0" stroke="#6b4220" stroke-width="1.5"/><path d="M3 27c0-5 3.5-8 8-8s8 3 8 8z" fill="#4aa3df" stroke="#1d5f8f" stroke-width="1.5"/><circle cx="22" cy="13" r="4.5" fill="#f3c08e" stroke="#6b4220" stroke-width="1.5"/><path d="M15 27c0-4.5 3-7.5 7-7.5s7 3 7 7.5z" fill="#e9a800" stroke="#a87400" stroke-width="1.5"/></svg>',
  casa: '<svg viewBox="0 0 32 32"><path d="M5 15 16 6l11 9v13H5z" fill="#f1dcae" stroke="#7a4a22" stroke-width="1.6" stroke-linejoin="round"/><path d="M2 16 16 4l14 12" fill="none" stroke="#b5532f" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 28v-8h6v8" fill="#8a5a33"/><path d="M20 15h5v4h-5z" fill="#9fd4f5" stroke="#7a4a22" stroke-width="1.2"/></svg>',
};
function paintMenuIcons() {
  document.querySelectorAll('.tab .ic').forEach(el => { el.innerHTML = MENU_ICONS[el.parentNode.dataset.tab]; });
  const sc = { roca: `<img alt="" src="${cropIcon('milho')}">`, animais: `<img alt="" src="${animalIcon('vaca')}">`, casa: MENU_ICONS.casa };
  document.querySelectorAll('#scenes .ic').forEach(el => { el.innerHTML = sc[el.parentNode.dataset.scene]; });
}
document.querySelectorAll('#scenes button').forEach(b => b.addEventListener('click', () => setScene(b.dataset.scene)));
$('#goHome').addEventListener('click', () => goHome());
$('#penActions').addEventListener('click', e => {
  if (e.target.closest('[data-feed-all]')) feedAll();
  else if (e.target.closest('[data-collect-all]')) collectAll();
});

// ============================================================
// Dicas ao passar o mouse
// ============================================================
function tipPlot(i) {
  const p = S().plots[i], home = isHome();
  if (p.s === 'locked') {
    if (home && canBuy(i)) return `<b>Espaço livre</b><br>Clique duas vezes para colocar um canteiro aqui.<br>Você tem ${freeLots()} para colocar.`;
    if (home && touches(i)) return '<b>Pasto</b><br>Compre uma expansão na aba Terreno para ter mais canteiros.';
    return home ? 'Pasto.' : null;
  }
  if (p.s === 'plowed') return home ? `<b>Terra arada</b><br>Clique para plantar ${CROP[state.seed].nome}.` : '<b>Terra arada</b>';
  if (p.s === 'withered') return '<b>Planta seca</b><br>Use a Mão ou a enxada para limpar.';
  const crop = CROP[p.c], st = stageOf(p), T = phaseTempo(p), k = Math.min(1, p.g / T);
  if (p.poda) return `<b>${crop.nome}</b><br>Precisa de poda para voltar a produzir.<br>${home ? `Clique com a Mão para podar (${crop.poda} moedas).` : ''}`;
  let h = `<b>${crop.nome}</b> · ${crop.arvore && p.adult ? (st === 4 ? 'Com frutas' : 'Dando frutas') : STAGE_NAMES[st]}`;
  if (st < 4 || k < 1) h += `<br>Fica pronto em ${fmt((T - p.g) / (p.dry ? 0.7 : 1))}`;
  else h += !home && (p.stolen || state.log[visitKey(p.id)]) ? '<br>Você já pegou daqui.' : '<br>Pronto para colher!';
  h += `<div class="bar"><i style="width:${k * 100}%"></i></div>`;
  const probs = [];
  if (p.w) probs.push(`${p.w} mato`); if (p.b) probs.push(`${p.b} praga${p.b > 1 ? 's' : ''}`); if (p.dry) probs.push('terra seca');
  if (probs.length) h += `<div class="warn">${probs.join(' · ')}</div>`;
  if (crop.arvore) h += `Colheita ${p.h + 1} de ${TREE_HARVESTS} até a poda`;
  if (p.fert) h += `${crop.arvore ? ' · ' : ''}adubada`;
  if (home) h += `<br>Vai render ${expectedYield(p)} ${crop.prodNome.toLowerCase()} (de ${crop.rend})`;
  return h;
}
function tipAnimal(id) {
  const a = S().animals.find(x => x.id === id); if (!a) return null;
  const d = ANIMAL[a.k], home = isHome();
  if (d.tipo === 'pet') return `<b>${esc(a.nome || d.nome)}</b> · ${d.nome.toLowerCase()}<br>Clique para fazer carinho.`;
  let h = `<b>${d.nome}</b><br>`;
  if (d.tipo === 'cria') {
    if (isAdult(a)) return h + `Adulto! ${home ? `Clique para vender por ${d.venda.toLocaleString('pt-BR')} moedas.` : ''}`;
    h += `Crescendo: falta ${fmt(d.tempo - a.g)}<div class="bar"><i style="width:${a.g / d.tempo * 100}%"></i></div>`;
    return h + (a.food > 0 ? `Comida por mais ${fmt(a.food)}` : `<span class="warn">Com fome, parou de crescer.</span>${home ? ` Clique para dar ração (${d.racao}).` : ''}`);
  }
  const prod = PRODUCT[d.prod];
  if (a.ready) h += `${prod.nome} pronto${a.dobro ? ' (em dobro!)' : ''}! Clique para recolher.`;
  else if (!a.fed && isTired(a)) h += `<span class="warn">Terminou o período produtivo.</span>${home ? ` Clique para chamar o veterinário (${vetCost(d)} moedas).` : ''}`;
  else if (!a.fed) h += `Com fome. ${home ? `Clique para dar ração (${d.racao} moedas${state.racaoEsp ? ', usa 1 ração especial' : ''}).` : 'Clique para dar comida e ajudar.'}`;
  else h += `Produzindo ${prod.nome.toLowerCase()}${a.dobro ? ' em dobro' : ''}: falta ${fmt(d.tempo - a.g)}<div class="bar"><i style="width:${a.g / d.tempo * 100}%"></i></div>`;
  if (!isTired(a)) { const dias = Math.max(1, Math.ceil((a.born + d.periodo * DAY - Date.now()) / DAY)); h += `<br>Produz por mais ${dias} ${dias > 1 ? 'dias' : 'dia'}`; }
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
function tipAbrigo(id) {
  const b = ABRIGO[id], s = S(), lv = abrigoLv(s, id);
  const quem = b.bichos.map(k => ANIMAL[k].nome.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' e $1');
  if (!lv) return `<b>${b.nome}</b><br>Para ${quem}.<br>${state.level < b.nivel ? `Libera no nível ${b.nivel}.` : `Construir por ${b.precos[0].toLocaleString('pt-BR')} moedas. Clique para ver.`}`;
  let h = `<b>${b.nome}</b> · nível ${lv}<br>${livesIn(s, id).length} de ${ABRIGO_CAP[lv]} animais · ${quem}`;
  if (isHome()) h += lv < 3 ? `<br>Clique para aumentar ou comprar animais.` : `<br>Clique para comprar animais.`;
  return h;
}
function tipLand() {
  const next = EXPANSOES[state.exp + 1];
  if (freeLots()) return `<b>Terra para colocar</b><br>Clique duas vezes num + encostado na sua terra.`;
  if (!next) return null;
  return `<b>Próxima expansão</b><br>+${next.total - EXPANSOES[state.exp].total} canteiros · ${next.preco.toLocaleString('pt-BR')} moedas · nível ${next.nivel}<br>Clique para ver todas.`;
}
function tipDecor(id) {
  const d = DECO[id];
  if (S().decor[id]) return `<b>${d.nome}</b><br>+${d.conforto} de conforto`;
  return `<b>Espaço para ${d.nome}</b><br>${d.custo} moedas na Loja · nível ${d.nivel}`;
}
let lastTip = '';
function updateTip() {
  const show = hover && (pointer.inside && !pointer.touch || performance.now() < pointer.tipUntil);
  const html = !show ? null : hover.kind === 'plot' ? tipPlot(hover.i) : hover.kind === 'animal' ? tipAnimal(hover.id) : hover.kind === 'dog' ? tipDog(hover.slot) : hover.kind === 'abrigo' ? tipAbrigo(hover.id) : hover.kind === 'land' ? tipLand() : tipDecor(hover.id);
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
// Arrastar move a câmera quando a cena não cabe na tela. Roda do mouse e pinça dão zoom.
let drag = null;
const fingers = new Map();
cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(zoomOf(scene) * (e.deltaY < 0 ? 1.1 : 1 / 1.1)); }, { passive: false });
function pinch(e) {
  if (!fingers.has(e.pointerId)) return false;
  fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (fingers.size < 2) return false;
  const [a, b] = [...fingers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
  if (!drag || !drag.pinch) drag = { pinch: d, z: zoomOf(scene), moved: true };
  else setZoom(drag.z * d / drag.pinch);
  return true;
}
const endTouch = e => { fingers.delete(e.pointerId); if (drag && drag.pinch && fingers.size < 2) drag = { x: 0, y: 0, moved: true, dead: true }; };
cv.addEventListener('pointercancel', endTouch);
$('#zoomIn').addEventListener('click', () => setZoom(zoomOf(scene) * 1.25));
$('#zoomOut').addEventListener('click', () => setZoom(zoomOf(scene) / 1.25));
$('#zoomReset').addEventListener('click', () => { setZoom(1); L.pan = { x: 0, y: 0 }; });
cv.addEventListener('pointermove', e => {
  const q = localPos(e); pointer.x = q.x; pointer.y = q.y; pointer.inside = true; pointer.touch = e.pointerType === 'touch';
  if (pinch(e)) { hover = null; return; }
  if (drag && drag.dead) return;
  if (drag && L.canPan) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) > 8) { drag.moved = true; try { cv.setPointerCapture(e.pointerId); } catch (err) { /* sem captura */ } }
    if (drag.moved) { L.pan.x = drag.px + dx; L.pan.y = drag.py + dy; hover = null; return; }
  }
  hover = pick(q.x, q.y);
});
cv.addEventListener('pointerleave', () => { pointer.inside = false; if (!pointer.touch) hover = null; });
cv.addEventListener('pointerdown', e => {
  pointer.touch = e.pointerType === 'touch';
  if (e.pointerType === 'touch') fingers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (fingers.size >= 2) return;
  drag = { x: e.clientX, y: e.clientY, px: L.pan.x, py: L.pan.y, moved: false };
});
cv.addEventListener('pointerup', e => {
  endTouch(e);
  if (drag && !drag.moved) drag = null;
  else if (drag && drag.dead && !fingers.size) setTimeout(() => { if (drag && drag.dead) drag = null; }, 0);
});
cv.addEventListener('click', e => {
  if (drag && (drag.moved || drag.dead)) { drag = null; return; }
  drag = null;
  const q = localPos(e); pointer.x = q.x; pointer.y = q.y;
  const target = pick(q.x, q.y); hover = target;
  if (pointer.touch) pointer.tipUntil = performance.now() + 2200;
  if (!target) return;
  if (target.kind === 'plot') actPlot(target.i);
  else if (target.kind === 'animal') actAnimal(target.id);
  else if (target.kind === 'decor') actDecor(target.id);
  else if (target.kind === 'dog') actDog(target.slot);
  else if (target.kind === 'abrigo') actAbrigo(target.id);
  else if (target.kind === 'land') openPanel('terreno');
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
  // Só os botões de dentro da janela (a página inteira também tem data-tema).
  const tr = e.target.closest('#tracks [data-track]');
  if (tr) { settings.track = Number(tr.dataset.track); settings.music = true; saveSettings(); renderSettings(); }
  const tm = e.target.closest('#temaSeg [data-tema]');
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
  resize(); setScene('roca'); renderHUD(); renderAccount(); renderPane(); paintMenuIcons();
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
