// Sons da Roça Feliz: 3 músicas calmas e efeitos, tudo sintetizado no navegador (Web Audio).
// Nada é baixado: as notas estão escritas aqui e os instrumentos são montados com osciladores.
(() => {
  'use strict';
  const AC = window.AudioContext || window.webkitAudioContext;
  let ac = null, master, musicBus, sfxBus, noiseBuf;
  const cfg = { music: true, sfx: true, musicVol: 0.5, sfxVol: 0.7, track: 0 };

  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function ensure() {
    if (ac || !AC) return ac;
    ac = new AC();
    master = ac.createGain(); master.gain.value = 0.9; master.connect(ac.destination);
    musicBus = ac.createGain(); sfxBus = ac.createGain();
    // Um pouco de "sala" (reverb) deixa a música mais macia.
    const rev = ac.createConvolver(); rev.buffer = impulse(2.4);
    const revGain = ac.createGain(); revGain.gain.value = 0.28;
    musicBus.connect(master); musicBus.connect(rev); rev.connect(revGain); revGain.connect(master);
    sfxBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    applyVolumes();
    document.addEventListener('visibilitychange', () => {
      if (!ac) return;
      if (document.hidden) ac.suspend(); else if (unlocked) ac.resume();
    });
    return ac;
  }
  function impulse(sec) {
    const len = Math.floor(ac.sampleRate * sec), b = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return b;
  }
  function applyVolumes() {
    if (!ac) return;
    const t = ac.currentTime;
    musicBus.gain.setTargetAtTime(cfg.music ? cfg.musicVol * 0.55 : 0, t, 0.15);
    sfxBus.gain.setTargetAtTime(cfg.sfx ? cfg.sfxVol * 0.8 : 0, t, 0.03);
  }

  // ---------- Instrumentos ----------
  function env(g, t, a, peak, dec, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, peak * sus), t + a + dec);
    g.gain.setValueAtTime(Math.max(0.0001, peak * sus), end);
    g.gain.exponentialRampToValueAtTime(0.0001, end + rel);
  }
  function osc(type, f, t, stop, dest, detune = 0) {
    const o = ac.createOscillator(); o.type = type; o.frequency.value = f; o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(stop); return o;
  }
  function lowpass(f, q = 0.7) { const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; return b; }

  // Corda dedilhada (violão/viola): ataque rápido, decaimento longo, brilho que some.
  function pluck(bus, t, m, dur, vel = 0.2, bright = 2600) {
    const f = lowpass(bright, 1); f.frequency.setValueAtTime(bright, t); f.frequency.exponentialRampToValueAtTime(500, t + 1.2);
    const g = ac.createGain(); f.connect(g); g.connect(bus);
    const end = t + Math.max(0.5, dur * 1.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc('triangle', mtof(m), t, end + 0.05, f);
    osc('sine', mtof(m + 12), t, end + 0.05, f, 4).frequency.value = mtof(m + 12);
    osc('sawtooth', mtof(m), t, t + 0.08, f, -5);
  }
  // Flauta doce: seno com vibrato que entra devagar.
  function flute(bus, t, m, dur, vel = 0.11) {
    const g = ac.createGain(), f = lowpass(3200); f.connect(g); g.connect(bus);
    const end = t + dur;
    env(g, t, 0.07, vel, 0.2, 0.8, 0.25, end);
    const o = osc('sine', mtof(m), t, end + 0.3, f);
    const o2 = osc('triangle', mtof(m), t, end + 0.3, f); o2.detune.value = 3;
    const lfo = ac.createOscillator(), lg = ac.createGain();
    lfo.frequency.value = 5.2; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(mtof(m) * 0.006, t + 0.35);
    lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(end + 0.3);
  }
  // Sanfona suave: duas ondas levemente desafinadas, filtradas.
  function accordion(bus, t, m, dur, vel = 0.05) {
    const g = ac.createGain(), f = lowpass(1500, 1.2); f.connect(g); g.connect(bus);
    const end = t + dur;
    env(g, t, 0.05, vel, 0.1, 0.85, 0.18, end);
    osc('sawtooth', mtof(m), t, end + 0.25, f, -7);
    osc('sawtooth', mtof(m), t, end + 0.25, f, 7);
    osc('square', mtof(m - 12), t, end + 0.25, f).detune.value = 0;
    const trem = ac.createOscillator(), tg = ac.createGain();
    trem.frequency.value = 4.5; tg.gain.value = vel * 0.25; trem.connect(tg); tg.connect(g.gain); trem.start(t); trem.stop(end + 0.25);
  }
  function bass(bus, t, m, dur, vel = 0.16) {
    const g = ac.createGain(), f = lowpass(700); f.connect(g); g.connect(bus);
    const end = t + dur;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, end + 0.3);
    osc('triangle', mtof(m), t, end + 0.35, f); osc('sine', mtof(m), t, end + 0.35, f);
  }
  function shaker(bus, t, vel = 0.03) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = 7000; b.Q.value = 1.5;
    const g = ac.createGain(); s.connect(b); b.connect(g); g.connect(bus);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
    s.start(t, Math.random() * 0.5); s.stop(t + 0.1);
  }

  // ---------- As músicas ----------
  // Cada compasso: acorde (notas MIDI) + melodia [nota, duração em colcheias] (0 = pausa).
  const N = { C4: 60, D4: 62, E4: 64, F4: 65, Fs4: 66, G4: 67, A4: 69, B4: 71, C5: 72, Cs5: 73, D5: 74, E5: 76, F5: 77, Fs5: 78, G5: 79, A5: 81, B5: 83, C6: 84 };
  const TRACKS = [
    { // Violão dedilhado e flauta, 4/4
      nome: 'Manhã no Campo', bpm: 86, steps: 8, lead: 'flute', shaker: true,
      chords: [[48, 60, 64, 67], [53, 60, 65, 69], [48, 60, 64, 67], [43, 59, 62, 67], [45, 60, 64, 69], [53, 60, 65, 69], [43, 59, 62, 67], [48, 60, 64, 67]],
      arp: [1, 2, 3, 2, 1, 2, 3, 2],
      melody: [
        [[N.E5, 2], [N.G5, 2], [N.A5, 2], [N.G5, 2]],
        [[N.A5, 3], [N.G5, 1], [N.F5, 2], [N.E5, 2]],
        [[N.E5, 2], [N.D5, 2], [N.C5, 2], [N.D5, 2]],
        [[N.E5, 4], [N.D5, 4]],
        [[N.C6, 2], [N.A5, 2], [N.G5, 2], [N.E5, 2]],
        [[N.F5, 2], [N.A5, 2], [N.G5, 4]],
        [[N.E5, 2], [N.D5, 2], [N.C5, 2], [N.D5, 2]],
        [[N.C5, 8]],
      ],
    },
    { // Valsa lenta de sanfona, 3/4
      nome: 'Rede na Varanda', bpm: 70, steps: 6, lead: 'accordion', waltz: true,
      chords: [[43, 59, 62, 67], [40, 59, 64, 67], [48, 60, 64, 67], [50, 57, 62, 66], [43, 59, 62, 67], [48, 60, 64, 67], [50, 57, 62, 66], [43, 59, 62, 67]],
      melody: [
        [[N.B4, 2], [N.D5, 2], [N.G5, 2]],
        [[N.G5, 4], [N.E5, 2]],
        [[N.E5, 2], [N.G5, 2], [N.E5, 2]],
        [[N.D5, 6]],
        [[N.B4, 2], [N.D5, 2], [N.G5, 2]],
        [[N.A5, 3], [N.G5, 1], [N.E5, 2]],
        [[N.Fs5, 2], [N.E5, 2], [N.D5, 2]],
        [[N.G5, 6]],
      ],
    },
    { // Viola caipira em terças, 4/4
      nome: 'Viola ao Entardecer', bpm: 92, steps: 8, lead: 'viola', shaker: false,
      chords: [[50, 62, 66, 69], [43, 59, 62, 67], [50, 62, 66, 69], [45, 61, 64, 69], [50, 62, 66, 69], [43, 59, 62, 67], [45, 61, 64, 69], [50, 62, 66, 69]],
      arp: [0, 2, 1, 3, 2, 1, 3, 2],
      melody: [
        [[N.Fs5, 2], [N.A5, 2], [N.Fs5, 2], [N.E5, 2]],
        [[N.D5, 2], [N.E5, 2], [N.G5, 4]],
        [[N.Fs5, 2], [N.E5, 2], [N.D5, 4]],
        [[N.E5, 4], [N.A4, 4]],
        [[N.A5, 2], [N.B5, 2], [N.A5, 2], [N.Fs5, 2]],
        [[N.G5, 2], [N.B5, 2], [N.A5, 4]],
        [[N.G5, 2], [N.Fs5, 2], [N.E5, 4]],
        [[N.D5, 8]],
      ],
    },
  ];
  // Terça abaixo dentro de ré maior (a "segunda voz" da viola).
  const D_MAJOR = [2, 4, 6, 7, 9, 11, 1];
  function thirdBelow(m) {
    for (let k = 3; k <= 4; k++) if (D_MAJOR.includes(((m - k) % 12 + 12) % 12)) return m - k;
    return m - 3;
  }

  let playing = false, timer = null, step = 0, loop = 0, nextTime = 0;
  function startMusic() {
    if (!ac || playing || !cfg.music) return;
    playing = true; step = 0; loop = 0; nextTime = ac.currentTime + 0.15;
    timer = setInterval(schedule, 90);
    schedule();
  }
  function stopMusic() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
  }
  function schedule() {
    if (!playing) return;
    const tr = TRACKS[cfg.track] || TRACKS[0];
    const eighth = 60 / tr.bpm / 2, barLen = tr.steps, total = barLen * tr.chords.length;
    while (nextTime < ac.currentTime + 0.4) {
      const bar = Math.floor(step / barLen), s = step % barLen, t = nextTime;
      const ch = tr.chords[bar];
      // A melodia descansa de vez em quando (a cada 3ª volta) para a música respirar.
      const withMelody = loop % 3 !== 2;
      if (s === 0) bass(musicBus, t, ch[0] - 12 + (tr.waltz ? 12 : 0), eighth * (tr.waltz ? 2 : 3));
      if (!tr.waltz && s === 4) bass(musicBus, t, ch[0] - 5, eighth * 3, 0.1); // a quinta, uma oitava abaixo
      if (tr.waltz) {
        if (s === 2 || s === 4) for (const n of ch.slice(1)) pluck(musicBus, t, n, eighth * 1.5, 0.05, 1800);
      } else {
        const n = ch[tr.arp[s]];
        pluck(musicBus, t, n, eighth * 2, tr.lead === 'viola' ? 0.1 : 0.085, tr.lead === 'viola' ? 3400 : 2400);
      }
      if (tr.shaker && s % 2 === 1) shaker(musicBus, t);
      if (withMelody) {
        let pos = 0;
        for (const [m, len] of tr.melody[bar]) {
          if (pos === s && m) {
            const d = len * eighth;
            if (tr.lead === 'flute') flute(musicBus, t, m, d * 0.95);
            else if (tr.lead === 'accordion') accordion(musicBus, t, m, d * 0.92);
            else { pluck(musicBus, t, m, d, 0.13, 3800); pluck(musicBus, t + 0.012, thirdBelow(m), d, 0.09, 3200); }
          }
          pos += len;
        }
      }
      nextTime += eighth;
      step++;
      if (step >= total) { step = 0; loop++; }
    }
  }

  // ---------- Efeitos ----------
  function noise(t, dur, type, f0, f1, vel, q = 1) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const b = ac.createBiquadFilter(); b.type = type; b.Q.value = q;
    b.frequency.setValueAtTime(f0, t); b.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ac.createGain(); s.connect(b); b.connect(g); g.connect(sfxBus);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + Math.min(0.02, dur / 4)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.start(t, Math.random() * 0.4); s.stop(t + dur + 0.05);
  }
  function blip(t, type, f0, f1, dur, vel) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type;
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    o.connect(g); g.connect(sfxBus);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vel, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  const SFX = {
    click: t => blip(t, 'sine', 880, 620, 0.05, 0.12),
    water: t => { noise(t, 0.5, 'bandpass', 900, 2600, 0.22, 1.2); for (let k = 0; k < 4; k++) blip(t + 0.08 + k * 0.09 + Math.random() * 0.04, 'sine', 1400 + Math.random() * 900, 700, 0.06, 0.05); },
    hoe: t => { blip(t, 'sine', 150, 55, 0.16, 0.45); noise(t, 0.18, 'lowpass', 1400, 300, 0.25); noise(t + 0.05, 0.12, 'bandpass', 2400, 900, 0.08, 2); },
    plant: t => { blip(t, 'sine', 260, 520, 0.09, 0.22); noise(t, 0.08, 'lowpass', 900, 400, 0.1); },
    harvest: t => { [72, 76, 79, 84].forEach((m, k) => pluck(sfxBus, t + k * 0.055, m, 0.25, 0.16, 4200)); noise(t, 0.15, 'highpass', 2000, 3000, 0.05); },
    pest: t => noise(t, 0.35, 'highpass', 5000, 3000, 0.16),
    weed: t => { noise(t, 0.2, 'bandpass', 400, 2200, 0.2, 1.5); blip(t + 0.17, 'sine', 400, 800, 0.06, 0.15); },
    fert: t => { noise(t, 0.3, 'bandpass', 800, 3000, 0.1); for (let k = 0; k < 6; k++) blip(t + 0.05 + k * 0.05, 'sine', 1500 + k * 250, 2200 + k * 250, 0.07, 0.07); },
    coin: t => { blip(t, 'square', 988, 988, 0.07, 0.06); blip(t + 0.07, 'square', 1319, 1319, 0.18, 0.06); },
    buy: t => { blip(t, 'sine', 180, 90, 0.15, 0.3); SFX.coin(t + 0.05); },
    level: t => { [60, 64, 67, 72, 76].forEach((m, k) => pluck(sfxBus, t + k * 0.09, m + 12, 0.4, 0.16, 4500)); },
    feed: t => { for (let k = 0; k < 3; k++) noise(t + k * 0.07, 0.07, 'bandpass', 3000, 1800, 0.12, 2); },
    collect: t => { pluck(sfxBus, t, 79, 0.3, 0.16, 4000); pluck(sfxBus, t + 0.08, 84, 0.4, 0.16, 4000); },
    error: t => { blip(t, 'square', 220, 200, 0.09, 0.05); blip(t + 0.11, 'square', 185, 165, 0.12, 0.05); },
    // Sapo: dois "croac" graves com o som tremendo.
    sapo: t => {
      for (const d of [0, 0.28]) {
        const o = ac.createOscillator(), f = ac.createBiquadFilter(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
        o.type = 'sawtooth'; o.frequency.setValueAtTime(150, t + d); o.frequency.linearRampToValueAtTime(110, t + d + 0.18);
        f.type = 'bandpass'; f.frequency.value = 600; f.Q.value = 3;
        lfo.frequency.value = 38; lg.gain.value = 0.25; lfo.connect(lg); lg.connect(g.gain);
        o.connect(f); f.connect(g); g.connect(sfxBus);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.4, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
        o.start(t + d); o.stop(t + d + 0.22); lfo.start(t + d); lfo.stop(t + d + 0.22);
      }
    },
    // Grilo: "cri-cri" agudo, em pulsinhos.
    grilo: t => {
      for (let k = 0; k < 6; k++) {
        const d = (k % 3) * 0.045 + Math.floor(k / 3) * 0.3, o = ac.createOscillator(), g = ac.createGain();
        o.type = 'sine'; o.frequency.value = 4400; o.connect(g); g.connect(sfxBus);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.18, t + d + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.035);
        o.start(t + d); o.stop(t + d + 0.04);
      }
    },
    // Porquinho-da-índia: "uíí!" que sobe, duas vezes.
    prea: t => {
      for (const d of [0, 0.22]) {
        const o = ac.createOscillator(), g = ac.createGain();
        o.type = 'triangle'; o.frequency.setValueAtTime(900, t + d); o.frequency.exponentialRampToValueAtTime(2000, t + d + 0.16);
        o.connect(g); g.connect(sfxBus);
        g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.18);
        o.start(t + d); o.stop(t + d + 0.2);
      }
    },
    bark: t => { for (const d of [0, 0.22]) { const o = ac.createOscillator(), b = ac.createBiquadFilter(), g = ac.createGain(); o.type = 'sawtooth'; b.type = 'bandpass'; b.frequency.value = 900; b.Q.value = 2; o.frequency.setValueAtTime(380, t + d); o.frequency.exponentialRampToValueAtTime(170, t + d + 0.14); o.connect(b); b.connect(g); g.connect(sfxBus); g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.16); o.start(t + d); o.stop(t + d + 0.2); } },
  };

  let unlocked = false, rainSrc = null, rainGain = null;
  const RFAudio = {
    tracks: TRACKS.map(t => t.nome),
    // Navegadores só liberam som depois de um toque/clique do jogador.
    unlock() {
      if (!ensure()) return;
      if (ac.state === 'suspended') ac.resume();
      unlocked = true;
      if (cfg.music) startMusic();
    },
    configure(c) {
      const trackChanged = c.track !== undefined && c.track !== cfg.track;
      Object.assign(cfg, c);
      applyVolumes();
      if (!ac || !unlocked) return;
      if (!cfg.music) stopMusic();
      else if (trackChanged) { stopMusic(); startMusic(); }
      else startMusic();
    },
    // Chuva: um chiado baixinho em loop (segue o botão de sons).
    rain(on) {
      if (!ac || !unlocked) return;
      if (on && !rainSrc) {
        rainSrc = ac.createBufferSource(); rainSrc.buffer = noiseBuf; rainSrc.loop = true;
        const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1400;
        rainGain = ac.createGain(); rainGain.gain.setValueAtTime(0.0001, ac.currentTime); rainGain.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 2);
        rainSrc.connect(f); f.connect(rainGain); rainGain.connect(sfxBus); rainSrc.start();
      } else if (!on && rainSrc) {
        const src = rainSrc; rainGain.gain.setTargetAtTime(0.0001, ac.currentTime, 0.6);
        setTimeout(() => { try { src.stop(); } catch (e) { /* já parou */ } }, 3000);
        rainSrc = null;
      }
    },
    play(name) {
      if (!ac || !unlocked || !cfg.sfx || !SFX[name]) return;
      try { SFX[name](ac.currentTime + 0.01); } catch (e) { /* som é enfeite: nunca quebra o jogo */ }
    },
  };
  window.RFAudio = RFAudio;
})();
