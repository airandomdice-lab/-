// 1.1.2：ファイル全体を (() => { … })(); で包んだ（ほかのAIファイルと定数名〔PARTS・MS_ASN_DECK など〕がぶつかって読み込めなかったため）。中身は前の版と同じ。
(() => {
// 陰陽転移AI 1.1.1（ランカー陰ロイAI 1.25.0 がもと。AI API v1／AIRandomDicesim 4.3.4 で確認）
// 登録ID：yinyang_metastasis（ランカー陰ロイAI yinyang_royal_ranker とは別。同時に読み込める）
// 想定デッキ：陰陽・スイッチ・養分・ジョーカー・転移（6.5.0〜の転移）。想定フィールド：神々の楽園
// 設計：claude/陰陽転移AI_設計ツリー.md
//
// ■ ロイヤル → 転移の読み替え（2026-11-17 ユーザー確認）
//   自分の盤面の転移（ボス転移も）を、AIの中では「ロイヤル」として扱う（判断の最初に読み替える）。
//   ランカー陰ロイの「ロイヤルを打つ」＝「転移どうしを合成して相手に中ボス（ボス転移が関わればボス）を送る」
//
// ■ 1.1.0：登録IDを yinyang_teleport → yinyang_metastasis（テレポートのダイスと混同しないため）。核対面の転移の間隔を6秒 → 7秒
//   （6秒だと1つ目の角をはさんだ2体の直線距離が最短2.21になり、核の半径2.4に入る。7秒なら最短2.57）
// ■ 1.1.1：ウェーブの終わりに出た中ボスの後、ボス戦に入ってからも7秒を守るようにした（表で知った中ボスの出現時刻も覚える）
//
// ■ 1.0.0 で変えたこと（ランカー陰ロイAI 1.25.0 から）
//   核対面：極の調和ができた後のロイヤルの打つ条件（相手の核・地獄の数）を消した。
//     W3以降は転移攻撃を続ける（転移そろえ → 打てるときに打つ）。ボス転移かどうかは見ない。
//     転移を打つ（転移どうしを合成する）タイミング：（核対面では、ウェーブに関係なくすべての転移の合成にかける）
//       a. 前の転移の合成から trGap（7）秒あける
//       b. 中ボス（自然湧き）の出現から trMidGap（7）秒あける（自然湧きは両者同じ時刻なので、自分の通路の中ボスで見る）
//       c. ボスがスライムのボス戦は、相手の先頭（スライム）がレーン中央（trSlimePos＝6）を越えてから打ち始める
//   ほかの対面は、まだランカー陰ロイAI 1.25.0 と同じ（ロイヤルを転移に読み替えるだけ）。ノーマル対面の転移攻撃（ボス転移を2.5で打つ）は未実装
//
// 用語
//   クリマス：極の調和を作る方のクリティカルマス ／ ライン：クリマスの縦横のマス（6マス）／ ライン外：それ以外の8マス
// ランカー陰ロイAIの部品モジュール（ranker_parts.js と同じ）
const PARTS = (() => {
  const ORDER5 = ['royal', 'nutrient', 'yinyang', 'switch', 'joker'];
  function helpers(V, lv) {
    const b = V.b, P = V.protect || new Map();
    const ok = i => (P.get(i) || 0) <= lv;
    const is = (i, t) => b[i] && b[i].type === t;
    const cells = (t, p) => [...Array(15).keys()].filter(i => ok(i) && is(i, t) && (p == null || b[i].pips === p));
    const act = (f, t, res) => V.acts.find(x => x.from === f && x.to === t && (!res || x.result === res));
    const mergeOf = (t, p, skip) => { const cs = cells(t, p).filter(i => !(skip && skip(i))); for (let x = 0; x < cs.length; x++) for (let y = x + 1; y < cs.length; y++) { const a = act(cs[x], cs[y], 'merge') || act(cs[y], cs[x], 'merge'); if (a) return a; } return null; };
    return { b, ok, is, cells, act, mergeOf };
  }
  function makeNut(V, n, lv = 0) {
    const H = helpers(V, lv), N = p => H.cells('nutrient', p), J = p => H.cells('joker', p);
    if (N(n).length) return 'done';
    let missing = 1, low = null; const useJ = {};
    for (let p = n - 1; p >= 1; p--) {
      const c = N(p).length, j = c ? J(p).length : 0, want = missing * 2;
      if (c + j >= want) { useJ[p] = Math.max(0, want - c); low = p; break; }
      useJ[p] = j; missing = want - c - j;
    }
    if (low == null) return null;
    for (let p = low; p < n; p++) {
      if (useJ[p] > 0) { const n0 = N(p)[0]; for (const j of J(p)) { const x = H.act(j, n0, 'copy'); if (x) return x; } }
      if (N(p).length >= 2) { const x = H.mergeOf('nutrient', p); if (x) return x; }
    }
    return null;
  }
  function makeDie(V, A, n, want = 1) {
    const H = helpers(V, 0), b = H.b;
    const allA = p => [...Array(15).keys()].filter(i => H.is(i, A) && b[i].pips === p);
    if (allA(n).length >= want) return 'done';
    const hasAn = allA(n).length > 0;
    let x;
    if (hasAn) for (const j of H.cells('joker', n)) for (const t of allA(n)) if ((x = H.act(j, t, 'copy'))) return x;
    const cand = [...H.cells(A).filter(i => b[i].pips < n), ...(hasAn ? H.cells('joker').filter(i => b[i].pips < n) : [])]
      .sort((p, q) => b[q].pips - b[p].pips || H.is(q, A) - H.is(p, A) || p - q);
    const X = cand.length ? cand[0] : null, p = X != null ? b[X].pips : n - 1;
    if (X != null) {
      for (const n0 of H.cells('nutrient', p)) if (n0 !== X && (x = H.act(n0, X, 'feed'))) return x;
      const m = makeNut(V, p); if (m && m !== 'done') return m;
    }
    for (const n0 of H.cells('nutrient').filter(i => b[i].pips <= p).sort((u, v) => b[v].pips - b[u].pips))
      for (const j of H.cells('joker', b[n0].pips)) if ((x = H.act(j, n0, 'copy'))) return x;
    const skip = i => i === X || (H.is(i, A) && b[i].pips >= n);
    for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) if ((x = H.mergeOf(t, q, skip))) return x;
    const H1 = helpers(V, 1);
    for (const j of H1.cells('joker').filter(i => i !== X))
      for (const t of ORDER5) if (t !== A) for (const s of H1.cells(t, b[j].pips)) if (s !== j && (x = H1.act(j, s, 'copy'))) return x;
    return null;
  }
  function makeDest(V, S, T, kind) {
    const b = V.b;
    if (!b[S] || b[S].type !== kind) return null;
    if (S === T) return 'done';
    if (!b[T]) return null;
    const n = b[S].pips, m = b[T].pips, A = b[T].type;
    const P = new Map(V.protect || []); P.set(S, 9); P.set(T, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    if (m === n) return V.acts.find(x => x.from === S && x.to === T && (kind === 'switch' ? x.result === 'swap' : kind === 'joker' ? x.result === 'copy' : (x.result === 'feed' || x.result === 'merge'))) || null;
    const others = H.cells(A, m);
    if (m > n) { for (const o of others) { const x = V.acts.find(z => z.from === T && z.to === o && z.result === 'merge'); if (x) return x; } }
    else { for (const o of others) { const x = V.acts.find(z => z.from === o && z.to === T && z.result === 'merge'); if (x) return x; } }
    const cnt = [...Array(15).keys()].filter(i => i !== S && b[i] && b[i].type === A && b[i].pips === m).length;
    const x = makeDie(V2, A, m, cnt + 1);
    return x && x !== 'done' ? x : null;
  }
  const switchDest = (V, S, T) => makeDest(V, S, T, 'switch');
  const nutDest = (V, S, T) => makeDest(V, S, T, 'nutrient');
  function lineRebuild(V, lineCells, crit) {
    const b = V.b, L = new Set(lineCells);
    if (lineCells.every(i => b[i] && b[i].type === 'yinyang')) return 'done';
    const P = new Map(V.protect || []);
    for (const i of lineCells) if (b[i] && b[i].type === 'yinyang') P.set(i, 9);
    if (crit != null) P.set(crit, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    const offc = i => !L.has(i) && H.ok(i);
    const lineNot = lineCells.filter(i => b[i] && b[i].type !== 'yinyang');
    const find = (f, t, r) => V.acts.find(x => x.from === f && x.to === t && x.result === r);
    let x;
    const offY = [...Array(15).keys()].filter(i => offc(i) && H.is(i, 'yinyang'));
    for (const t of lineNot) if (H.is(t, 'switch')) for (const q of offY) if ((x = find(t, q, 'swap'))) return x;
    for (const t of lineNot) if (!H.is(t, 'switch') && offY.some(q => b[q].pips === b[t].pips))
      for (let s2 = 0; s2 < 15; s2++) if (offc(s2) && H.is(s2, 'switch') && (x = find(s2, t, 'swap'))) return x;
    const allY = p => [...Array(15).keys()].filter(i => H.is(i, 'yinyang') && b[i].pips === p);
    const lj = lineNot.filter(i => H.is(i, 'joker'));
    for (const j of lj.filter(i => b[i].pips <= 2)) for (const y of allY(b[j].pips)) if ((x = find(j, y, 'copy'))) return x;
    for (const j of lj.filter(i => b[i].pips >= 3)) {
      for (const n0 of [...Array(15).keys()].filter(i => offc(i) && H.is(i, 'nutrient') && b[i].pips === b[j].pips)) if ((x = find(j, n0, 'copy'))) return x;
      for (const y of allY(b[j].pips)) if ((x = find(j, y, 'copy'))) return x;
    }
    for (const j of lj.filter(i => b[i].pips >= 2)) {
      const n = b[j].pips;
      if (allY(n).length) continue;
      if ([...Array(15).keys()].some(i => offc(i) && H.is(i, 'yinyang') && b[i].pips === n - 1)) {
        const Pj = new Map(P); Pj.set(j, 9);
        const m = makeDie(Object.assign({}, V, { protect: Pj }), 'yinyang', n, 1); if (m && m !== 'done') return m;
      }
      for (const t of ['nutrient', 'royal', 'switch']) for (const q of [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === n)) if ((x = find(j, q, 'copy'))) return x;
      const tq = [...Array(15).keys()].filter(i => offc(i) && b[i] && !H.is(i, 'joker') && b[i].pips < n).sort((u, v) => b[v].pips - b[u].pips || u - v)[0];
      if (tq != null) { const Pj = new Map(P); for (const i of lineCells) Pj.set(i, 9); const m = makeDest(Object.assign({}, V, { protect: Pj }), j, tq, 'joker'); if (m && m !== 'done') return m; }
    }
    for (const s2 of lineNot.filter(i => H.is(i, 'switch') && b[i].pips === 1))
      for (const t of ['joker', 'nutrient', 'royal']) for (const q of [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === 1)) if ((x = find(s2, q, 'swap'))) return x;
    for (const i of lineNot) for (const q of [...Array(15).keys()].filter(k => offc(k) && H.is(k, b[i].type) && b[k].pips === b[i].pips)) if ((x = find(i, q, 'merge'))) return x;
    for (const i of lineNot) {
      if (H.is(i, 'joker')) continue;
      const Pi = new Map(P); for (const k of lineCells) Pi.set(k, 9);
      const cnt = [...Array(15).keys()].filter(k => b[k] && b[k].type === b[i].type && b[k].pips === b[i].pips).length;
      const m = makeDie(Object.assign({}, V, { protect: Pi }), b[i].type, b[i].pips, cnt + 1); if (m && m !== 'done') return m;
    }
    for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) {
      const cs = [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === q);
      for (let u = 0; u < cs.length; u++) for (let v = u + 1; v < cs.length; v++) if ((x = find(cs[u], cs[v], 'merge'))) return x;
    }
    return null;
  }
  function estMake(V, A, n, exclude) {
    const H = helpers(V, 0), b = V.b;
    const has = (t, q) => H.cells(t, q).filter(i => !(exclude && exclude.includes(i))).length;
    if (has(A, n)) return 0;
    const ps = H.cells(A).filter(i => b[i].pips < n && !(exclude && exclude.includes(i))).map(i => b[i].pips);
    if (!ps.length) return 8;
    let c = 0;
    for (let l = Math.max(...ps); l < n; l++) {
      if (l === Math.max(...ps) ? has('nutrient', l) : false) { c += 1; continue; }
      const m = makeNut(V, l); c += 1 + (m === 'done' ? 0 : m ? 2 * l : 4);
    }
    return c;
  }
  function critRebuild(V, crit, lineCells, opt) {
    const b = V.b, L = new Set(lineCells);
    const P = new Map(V.protect || []);
    for (const i of lineCells) if (b[i] && b[i].type === 'yinyang') P.set(i, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    const offc = i => i !== crit && !L.has(i) && H.ok(i);
    const find = (f, t, r) => V.acts.find(x => x.from === f && x.to === t && x.result === r);
    const cells = f => [...Array(15).keys()].filter(f);
    let x;
    const c = b[crit];
    if (c && c.type === 'yinyang') { const r = lineRebuild(V, lineCells, crit); return r; }
    const offMerge0 = () => {
      for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) {
        const cs = cells(i => offc(i) && H.is(i, t) && b[i].pips === q);
        for (let u = 0; u < cs.length; u++) for (let v = u + 1; v < cs.length; v++) if ((x = find(cs[u], cs[v], 'merge'))) return x;
      }
      return null;
    };
    const offMerge = () => (opt && opt.noOffMerge) ? null : offMerge0();
    if (!c) return offMerge();
    const n = c.pips;
    const Pc = new Map(P); Pc.set(crit, 9); for (const i of lineCells) Pc.set(i, 9);
    const Vc = Object.assign({}, V, { protect: Pc });
    if (c.type === 'joker') { for (const y of cells(i => H.is(i, 'yinyang') && b[i].pips === n)) if ((x = find(crit, y, 'copy'))) return x; }
    if (c.type === 'switch') {
      for (const y of cells(i => offc(i) && H.is(i, 'yinyang') && b[i].pips === n)) if ((x = find(crit, y, 'swap'))) return x;
      for (const y of lineCells.filter(i => b[i] && b[i].type === 'yinyang' && b[i].pips === n)) if ((x = find(crit, y, 'swap'))) return x;
      const m = makeDie(Vc, 'yinyang', n, 1); return m && m !== 'done' ? m : offMerge();
    }
    const p1 = estMake(Vc, 'switch', n) + estMake(Vc, 'yinyang', n) + 2;
    const escape = c.type === 'nutrient' ? 2 : estMake(Vc, c.type, n) + 1;
    const p2 = escape + 1 + (cells(i => offc(i) && H.is(i, 'switch') && b[i].pips === 1).length ? 0 : 3) + 2 + 1;
    if (c.type === 'joker' || p1 <= p2) {
      for (const s2 of cells(i => offc(i) && H.is(i, 'switch') && b[i].pips === n)) if ((x = find(s2, crit, 'swap'))) return x;
      const m = makeDie(Vc, 'switch', n, 1); if (m && m !== 'done') return m;
      return offMerge();
    }
    if (c.type === 'nutrient') {
      for (const t of cells(i => offc(i) && b[i] && b[i].pips === n && !H.is(i, 'yinyang'))) if ((x = V.acts.find(z => z.from === crit && z.to === t && (z.result === 'feed' || z.result === 'merge')))) return x;
      const t = cells(i => offc(i) && b[i] && !H.is(i, 'joker') && b[i].pips <= n).sort((u, v) => b[v].pips - b[u].pips || u - v)[0];
      if (t != null) { const m = makeDest(Vc, crit, t, 'nutrient'); if (m && m !== 'done') return m; }
      return offMerge();
    }
    for (const o of cells(i => offc(i) && H.is(i, c.type) && b[i].pips === n)) if ((x = find(crit, o, 'merge'))) return x;
    const m = makeDie(Vc, c.type, n, cells(i => i !== crit && H.is(i, c.type) && b[i].pips === n).length + 1); if (m && m !== 'done') return m;
    return offMerge();
  }
  function jamLv1(V, crit, lineCells) {
    const b = V.b, L = new Set(lineCells);
    const H = helpers(V, 0);
    const offc = i => i !== crit && !L.has(i) && H.ok(i);
    const off = (t, p) => [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === p);
    const ls = lineCells.filter(i => H.is(i, 'yinyang')).sort((u, v) => b[u].pips - b[v].pips || u - v);
    for (const l of ls) {
      const p = b[l].pips;
      if (p >= 7 || !off('switch', p + 1).length || !off('yinyang', p + 1).length) continue;
      for (const y of off('yinyang', p)) { const x = V.acts.find(z => z.from === y && z.to === l && z.result === 'merge'); if (x) return { act: x, cell: l }; }
    }
    return null;
  }
  const PIERCE = (() => {
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1, steps = w => Math.ceil(waveT(w) / waveDt(w));
    const dHP = { '6.0.5': w => w === 1 ? 100 : 100 * (w - 1) * (w + 6), '6.5.0': w => w === 1 ? 100 : 20 * (w - 1) * (w + 4) * (w + 6) };
    const baseHP = (w, hp) => { let B = 0; for (let v = 1; v < w; v++) B += waveK(v) * dHP[hp](v); return B; };
    const bossHP = (w, hp) => 8 * (baseHP(w, hp) + steps(w) * dHP[hp](w));
    const dps1 = (yy, c, L, cd, r, K) => {
      const a = 50 + 10 * (c - 7) + 20 * (L - 1), V = 2.0 + 0.25 * (c - 7) + 0.30 * (L - 1), H = 1.2 + 0.2 * (c - 7) + 0.2 * (L - 1);
      return a * (1 + V) * K * (1 + H) * ((1 - r) + r * cd / 100);
    };
    return { bossHP, dps1 };
  })();
  function pierceJudge(obs, info, crit, o = {}) {
    const wave = obs.phase === 'boss' ? obs.wave : obs.wave + (obs.phase === 'wave' ? 0 : 1);
    const hp = (info.hpSpec || info.version) === '6.0.5' ? '6.0.5' : '6.5.0';
    const yd = (info.deck || []).find(d => d.type === 'yinyang') || {};
    const yy = yd.id === 'yinyang' ? '6.0.5' : '6.5.0';
    const lvNow = ((obs.deck || []).find(d => d.type === 'yinyang') || {}).lv || 1;
    const L = o.lv != null ? o.lv : lvNow, c = yd.cls || 10, cfg = info.cfg || {};
    const pc = ((obs.field && obs.field.paradise) || []).find(x => x.cell === crit);
    const r = Math.min(1, (info.baseCrit != null ? info.baseCrit : 0.05) + (pc ? pc.crit : 0));
    const st = obs.board[crit] && obs.board[crit].type === 'yinyang' ? (obs.board[crit].state || {}) : {};
    const K = yy === '6.0.5' ? 10 : (o.lineN || st.lineDice || 7);
    const time = (hp === '6.5.0' && wave >= (cfg.deathWave || 10)) ? (cfg.deathBossFirst != null ? cfg.deathBossFirst : 1.5) : 2;
    const bhp = PIERCE.bossHP(wave, hp), d1 = PIERCE.dps1(yy, c, L, cfg.cd || 2000, r, K);
    let need = Math.ceil(Math.sqrt((o.mult != null ? o.mult : 1.5) * bhp / time / d1) - 1e-9);
    need = Math.max(1, need > 7 ? 8 : need);
    const have = st.col && st.row ? obs.board[crit].pips : 0;
    return { wave, need, have, ok: have >= need, hp: bhp, time, dps1: d1 };
  }
  return { makeNut, makeDie, makeDest, switchDest, nutDest, lineRebuild, estMake, critRebuild, jamLv1, pierceJudge };
})();

// 月太陽の隣接火力倍率（claude/月太陽_隣接火力倍率の式.md）
const MOONSUN = (() => {
  const ramp = k => 1 + Math.floor(0.55 * (k - 1));
  const sumRamp = N => { let s = 0; for (let k = 1; k <= N; k++) s += ramp(k); return s; };
  function mult(c, m, cd, p, T = null, L = 5, base = 0.05) {
    const r = m > 0 ? Math.min(0.95, 1.03 * ((0.07 + 0.01 * (c - 7)) * m + 0.02 * (L - 1))) : 0;
    const cr = Math.min(1, base + 0.05 * m);
    const E = ((1 - cr) + cr * cd / 100) / ((1 - base) + base * cd / 100);
    const v = p / (1 - r);
    const keep = T == null ? v * v : sumRamp(Math.floor(2.5 * v * T + 1e-9) + 1) / sumRamp(Math.floor(2.5 * T + 1e-9) + 1);
    return keep * (1 + 0.10 * m) * E;
  }
  function boardSum(board, NB, c, cd, T, base) {
    let sum = 0;
    board.forEach((d, i) => {
      if (!d || d.type !== 'sun') return;
      let m = 0; for (const j of NB[i]) if (board[j] && board[j].type === 'moon' && !board[j].sealed) m = Math.max(m, board[j].pips);
      sum += mult(c, m, cd, d.pips, T, 5, base);
    });
    return sum;
  }
  return { mult, boardSum };
})();

const MODULE_NAMES = { harmony: '極の調和目指し通常', royalArrange: '通常転移そろえ', assassin: '暗殺対面', normal: 'ノーマル対面', switchThrottle: 'スイッチ絞り', nuke: '核対面（W3以降は転移攻撃を続ける。前の転移・中ボスから7秒、スライムは中央から）', combo: 'コンボ対面', royalMatch: 'ロイヤル対面', moonsun: '月太陽対面' };
const MATCHUPS = {
  assassin:           { name: '暗殺対面',         cond: { dice: ['assassin'] },                     modules: ['assassin'] },
  nuke:               { name: '核対面',           cond: { dice: ['nuke'] },                         modules: ['nuke'] },
  blessScopeCombo:    { name: '祝福スココン対面', cond: { dice: ['scope', 'combo'], field: 'blessing' }, modules: ['combo'] },
  paradiseScopeCombo: { name: '楽園スココン対面', cond: { dice: ['scope', 'combo'] },               modules: ['combo'] },
  combo:              { name: 'コンボ対面',       cond: { dice: ['combo'] },                        modules: ['combo'] },
  moonsun:            { name: '月太陽対面',       cond: { dice: ['moon', 'sun'] },                  modules: ['moonsun'] },
  royalMoonsun:       { name: '月太陽ロイヤル対面', cond: { dice: ['moon', 'sun', 'royal'] },        modules: ['royalMatch'] },
  royalYinyang:       { name: '陰陽ロイヤル対面', cond: { dice: ['yinyang', 'royal'] },             modules: ['royalMatch'] },
  royal:              { name: 'ノーマルロイヤル対面', cond: { dice: ['royal'] },                    modules: ['royalMatch'] },
  normal:             { name: 'ノーマル対面',     cond: null,                                       modules: ['normal'] },
};
const condItems = c => c ? [...c.dice.map(t => 'dice:' + t), ...(c.field ? ['field:' + c.field] : [])] : [];
RD.defineAgent('yinyang_metastasis', {
  name: '陰陽転移AI',
  desc: '陰陽・スイッチ・養分・ジョーカー・転移用（神々の楽園）。ランカー陰ロイAI 1.25.0 の立ち回りで、ロイヤルを転移に読み替える。核対面はW3以降、転移攻撃を続ける（前の転移の合成と自然湧きの中ボスの出現から7秒あけ、スライムは相手の先頭がレーン中央を越えてから）。',
  options: {
    trGap: 7,            // 核対面：前の転移の合成からこの秒数は、転移どうしを合成しない
    trMidGap: 7,         // 核対面：自然湧きの中ボスの出現からこの秒数は、転移どうしを合成しない
    trFromWave: 3,       // 核対面：このウェーブから転移攻撃を続ける
    trSlimePos: 6,       // 核対面：スライムのボス戦は、相手の先頭がこの位置（レーン中央）を越えてから打ち始める
    // 自然湧きの中ボスが出る時刻（ウェーブの残り秒）。エンジンの midFastAt（6.5.0〜）と同じ値。キーのウェーブ以降はその行（W5以降は5の行）
    //   出てすぐ倒されて見えないことがあるので、見えた中ボスとこの表の両方で判断する（6.0.5 は表なし）
    midTable: { 3: [53, 37, 21, 5], 4: [45, 31, 17, 2], 5: [47, 35, 23, 11] },
    jokerAll: true, jokerAfterFill: true, y2plan: true, raiseSwitch: true, leonW2: true, assassinDodge: true, harmonyBoard: true,
    pierce: true, pierceMult: 1.5, jamFromWave: 6, puLv: 5, fireFromWave: 7, fireSkipSec: 12, dWindow: 5, stopPastPos: 8.5, normalSpeed: 0.6,
    thrFromWave: 2, thrCritUntil: 3, thrLastSec: 15, thrMult: 3, thrBuf: 5, thrHyst: 1.5, thrMoveSec: 0.6,
    nukeThrUntil: 7, nukeKnightFrom: 5, nukeKeepFrom: 4, nukePuFrom: 4, nukeKnightKeep: 6,
    comboFire: 8, comboParadiseWave: 8, comboParadisePips: 5, comboFireBless: 13, comboBlessScopeWave: 6, comboThrUntil: 8,
    msCorner: 8.5, msCenter: 6, msCenterLeft: 30, msEarlyFrom: 4, msLateFrom: 6, msRefMoon: 6, msRefSun: 6,
    rmsSkipSec: 10, rmsLimitPos: 9.5, msT: null,
    paraSwitch: true, paraSwitchOff: ['paradiseScopeCombo'], paraSwitchYY: false,
    raise5From: 7, raise5To: 5, raise4From: 4, deficitArrange: true, critMax: 6, msRaise6: true, stuckJoker: true,
    normalLimit: { interval: 0.5, actInterval: 0.3, summonInterval: 0.3, dragTime: 0.3 },
    critNearGoal: ['nuke', 'blessScopeCombo', 'paradiseScopeCombo'],
    thrPU: true, thrFire: true, knightOtherCrit: true,
    matchup: null, matchupModules: null, sw2Crit: false, dodgeOther: true, dodgeMinIn: null, assassinLimit: 0.1,
  },
  limits(options, info) {
    const od = (info.opponentDeck || []).map(d => d.type);
    const v = options.assassinLimit;
    const forced = options.matchup ? [].concat(options.matchup) : null;
    if (v != null && (forced ? forced.includes('assassin') : od.includes('assassin'))) return { interval: v, actInterval: v, summonInterval: v, dragTime: v };
    if (options.normalLimit) return Object.assign({}, options.normalLimit);
    return null;
  },
  create(ctx) {
    const o = ctx.options;
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const dist = i => Math.hypot(COL_X[i % 5], ROW_Y[Math.floor(i / 5)]);
    const byDist = cs => [...cs].sort((a, b) => dist(a) - dist(b) || a - b);
    const distGoal = i => Math.hypot(5 - COL_X[i % 5], ROW_Y[Math.floor(i / 5)]);
    const byGoal = cs => [...cs].sort((a, b) => distGoal(a) - distGoal(b) || b - a);
    const rowOf = c => { const r = Math.floor(c / 5); return [0, 1, 2, 3, 4].map(k => r * 5 + k); };
    const colOf = c => [0, 1, 2].map(r => r * 5 + (c % 5));
    let crit = null, crit2 = null, filled = false;
    let everH = false, jamCell = null, pt = { wave: -1, need: 0 }, knightCast = null;
    let fHist = [], waveSeen = null, waveStartT = 0, firedWave = null;
    let jkRoyalW = null, leonFiredW = null;
    let thr = null, thrHot = false;
    const vsAssassin = (ctx.info.opponentDeck || []).some(d => d.type === 'assassin');
    let dodges = [];
    let matchup = null, mods = [];
    // 転移を打つタイミング（核対面）
    let lastTrT = -Infinity, lastMidT = -Infinity; const midSeen = new Set();
    function classify(obs) {
      const od = (ctx.info.opponentDeck || []).map(d => d.type);
      const field = obs.opponent && obs.opponent.field;
      const ok = c => c && c.dice.every(t => od.includes(t)) && (!c.field || c.field === field);
      let hit = Object.keys(MATCHUPS).filter(k => ok(MATCHUPS[k].cond));
      const items = k => condItems(MATCHUPS[k].cond);
      hit = hit.filter(k => !hit.some(k2 => k2 !== k && items(k).every(x => items(k2).includes(x)) && items(k2).length > items(k).length));
      return hit.length ? hit : ['normal'];
    }
    let seedJ2 = false;
    return { decide(obs0) {
      // 読み替え：自分の盤面の転移を「ロイヤル」として扱う
      const obs = Object.assign({}, obs0, { board: obs0.board.map(d => d && d.type === 'transfer' ? Object.assign({}, d, { type: 'royal', transfer: true }) : d) });
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return { ops: [] };
      const b = obs.board, ctl = obs.control || {};
      let needRaise = false, noFeed = false, noCritRaise = false;
      const oppV = obs.opponent, TLen = ctx.info.trackLength || 12;
      if (obs.wave !== waveSeen) { waveSeen = obs.wave; waveStartT = obs.t; fHist = []; }
      let Dv = null, Rv = null;
      if (oppV && obs.phase === 'wave' && oppV.phase === 'wave' && obs.timeLeft != null) {
        const pos = oppV.front ? oppV.front.progress * TLen : 0;
        fHist.push({ t: obs.t, pos });
        while (fHist.length && fHist[0].t < obs.t - o.dWindow) fHist.shift();
        if (fHist.length >= 2) {
          const h0 = fHist[0], h1 = fHist[fHist.length - 1], v = (h1.pos - h0.pos) / Math.max(1e-6, h1.t - h0.t);
          Dv = (TLen - pos) - obs.timeLeft * v; Rv = (TLen - pos) - obs.timeLeft * o.normalSpeed;
        }
      } else if (obs.phase !== 'wave') fHist = [];
      if (matchup == null) {
        matchup = o.matchup ? [].concat(o.matchup) : classify(obs);
        matchup.sort((x, y) => Object.keys(MATCHUPS).indexOf(x) - Object.keys(MATCHUPS).indexOf(y));
        mods = [];
        for (const k of matchup) for (const m of ((o.matchupModules && o.matchupModules[k]) || MATCHUPS[k].modules)) if (!mods.includes(m)) mods.push(m);
        ctx.log(`対面：${matchup.map(k => MATCHUPS[k].name).join('＋')}（モジュール：${mods.map(m => MODULE_NAMES[m] || m).join('・')}）`);
      }
      if (crit == null) {
        const pc = ((obs.field && obs.field.paradise) || []).map(p => p.cell);
        const nearGoal = pc.length > 1 && (o.critNearGoal || []).some(k => matchup.includes(k));
        const topRight = pc.length > 1 && ['royal', 'royalYinyang', 'royalMoonsun'].some(k => matchup.includes(k));
        const byTop = cs => [...cs].sort((a, b) => Math.floor(a / 5) - Math.floor(b / 5) || (b % 5) - (a % 5));
        const cs0 = (topRight ? byTop : nearGoal ? byGoal : byDist)(pc.length ? pc : [...Array(15).keys()]); crit = cs0[0]; crit2 = pc.length > 1 ? cs0[1] : null;
        ctx.log(`クリマス：${crit}${pc.length ? (nearGoal ? '（ゴールに近い楽園マス）' : '') : '（楽園でないので入口に最も近いマス）'}`);
      }
      const row = rowOf(crit), col = colOf(crit);
      const line = new Set([...row, ...col]);
      const lineCells = [...line].filter(x => x !== crit);
      const off = i => !line.has(i);
      const is = (i, t) => b[i] && b[i].type === t;
      const cnt = t => b.filter(d => d && d.type === t).length;
      if (b.every(Boolean)) filled = true;
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      const pendA = (obs.pending || []).filter(p => p.kind === 'assassin' && p.from === 'opponent');
      const pendCells = new Set(pendA.flatMap(p => p.cells));
      const sw2At = o.sw2Crit === 'other' ? (crit2 != null && !line.has(crit2) ? crit2 : null) : crit;
      const lockCrit = o.sw2Crit && vsAssassin && sw2At != null && b[sw2At] && b[sw2At].type === 'switch' && b[sw2At].pips >= 2;
      // ---------- 転移を打つタイミング（核対面） ----------
      //   自然湧きの中ボス（印なし）を見つけたら、出現した時刻（いまの位置÷元の速さで逆算）を覚える
      for (const e of (obs.enemies || [])) if (e.kind === 'mid' && !e.marked && !midSeen.has(e.id)) {
        midSeen.add(e.id); lastMidT = Math.max(lastMidT, obs.t - e.pos / Math.max(0.05, e.baseSpeed || 0.52));
      }
      // 表から：合成を離す時刻（いま＋ドラッグ時間）が、中ボスの出現から trMidGap 秒以内なら打たない
      const drag = ctl.dragTime != null ? ctl.dragTime : 0.3;
      //   表で出たとわかった中ボスも出現の時刻を覚える（ウェーブの終わりの中ボスの後、ボス戦に入ってからも7秒を守るため）
      if (o.midTable && ctx.info.version !== '6.0.5' && obs.phase === 'wave' && obs.timeLeft != null) {
        let rowT = null; for (const k of Object.keys(o.midTable).map(Number).sort((x, y) => x - y)) if (k <= obs.wave) rowT = o.midTable[k];
        for (const r of rowT || []) { const ago = r - obs.timeLeft + drag; if (ago >= 0 && ago < o.trMidGap) lastMidT = Math.max(lastMidT, obs.t + drag - ago); }
      }
      const midAgo = obs.t + drag - lastMidT;
      let trWhy = null;
      if (matchup.includes('nuke')) {
        if (obs.t - lastTrT < o.trGap) trWhy = `前の転移から${(obs.t - lastTrT).toFixed(1)}秒`;
        else if (midAgo < o.trMidGap) trWhy = `中ボスの出現から${midAgo.toFixed(1)}秒`;
        else if (obs.phase === 'boss' && obs.bossType === 'slime') {
          const fp = oppV && oppV.front ? oppV.front.progress * TLen : 0;
          if (fp < o.trSlimePos) trWhy = `スライム：相手の先頭が${fp.toFixed(1)}（中央${o.trSlimePos}の手前）`;
        }
      }
      const isTrMerge = a => a.result === 'merge' && b[a.from] && b[a.to] && b[a.from].type === 'royal' && b[a.to].type === 'royal';
      const A = obs.legal.acts.filter(a => !pendCells.has(a.from) && !pendCells.has(a.to) && !(trWhy && isTrMerge(a)));
      const find = (f, t) => A.find(a => a.from === f && a.to === t);
      const act = (a, note) => {
        if (isTrMerge(a)) { lastTrT = obs.t; note = `${note}［転移を打つ］`; }
        return { ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note };
      };
      const summon = () => (obs.legal.summon && !(ctl.summonReadyIn > 0)) ? { ops: [{ op: 'summon' }], more: true, note: '召喚' } : null;
      const yy = cnt('yinyang');
      const allYY = cs => cs.every(i => is(i, 'yinyang'));
      const sw1n = () => b.filter(d => d && d.type === 'switch' && d.pips === 1).length;

      // ---------- 暗殺対面 ----------
      const amode = mods.includes('assassin');
      const paraCells = crit2 != null ? [crit, crit2] : [crit];
      let amCol = null;
      if (amode) {
        const cols = [0, 1, 2, 3, 4].map(colOf), np = cols.filter(cc => !cc.some(i => paraCells.includes(i)));
        const yN = cc => cc.filter(i => is(i, 'yinyang')).length;
        amCol = (np.length ? np : cols).slice().sort((p2, q2) => yN(q2) - yN(p2) || p2[0] - q2[0])[0];
      }
      function modAssassinDodge() {
      if (o.assassinDodge && actReady) {
        const minIn = o.dodgeMinIn != null ? o.dodgeMinIn : (ctl.dragTime || 0);
        const L = obs.legal.acts;
        const nm = t => ({ yinyang: '陰陽', royal: '転移', switch: 'スイッチ', nutrient: '養分', joker: 'ジョーカー' })[t] || t;
        const free = t => !pendCells.has(t);
        const switches = (i, pp) => [...Array(15).keys()].filter(s => s !== i && is(s, 'switch') && b[s].pips === pp && free(s) && !(amode && paraCells.includes(s)))
          .sort((x, y) => line.has(x) - line.has(y) || x - y);
        for (const p of [...pendA].sort((x, y) => x.in - y.in)) {
          if (p.in < minIn) continue;
          for (const i of p.cells) {
            const d = b[i]; if (!d) continue;
            const pp = d.pips, t0 = d.type;
            if (t0 === 'yinyang' || t0 === 'royal' || t0 === 'nutrient' || t0 === 'joker') {
              for (const s of switches(i, pp)) {
                const a = L.find(x => x.from === s && x.to === i && x.result === 'swap');
                if (!a) continue;
                if (t0 === 'yinyang' && (amode ? amCol.includes(i) : line.has(i))) dodges.push({ cell: i, yyId: d.id, swId: b[s].id });
                return act(a, `暗殺避け：${i}の${nm(t0)}（出目${pp}）を${s}のスイッチと入れ替え`);
              }
            }
            if (t0 === 'yinyang' || t0 === 'royal') {
              const a = L.filter(x => x.to === i && x.result === 'feed' && is(x.from, 'nutrient') && !(b[x.from].bounty > 0) && free(x.from))
                .sort((x, y) => line.has(x.from) - line.has(y.from) || x.from - y.from)[0];
              if (a) return act(a, `暗殺避け：${i}の${nm(t0)}（出目${pp}）に${a.from}の養分を重ねる`);
            } else if (t0 === 'switch' && amode && paraCells.includes(i)) {
              const a = L.filter(x => x.to === i && x.result === 'feed' && is(x.from, 'nutrient') && free(x.from))[0];
              if (a) return act(a, `暗殺避け：楽園マス${i}のスイッチ（出目${pp}）に${a.from}の養分を重ねる`);
            } else if (t0 === 'switch') {
              const rank = t => line.has(t) ? 2 : is(t, 'yinyang') ? 1 : 0;
              const a = L.filter(x => x.from === i && x.result === 'swap' && free(x.to) && !(line.has(x.to) && is(x.to, 'yinyang')))
                .sort((x, y) => rank(x.to) - rank(y.to) || x.to - y.to)[0];
              if (a) return act(a, `暗殺避け：${i}のスイッチ（出目${pp}）を${a.to}の${nm(b[a.to].type)}と入れ替え`);
            } else if (o.dodgeOther && t0 === 'nutrient') {
              const rank = t => t === crit ? 0 : ({ royal: 1, yinyang: 2, nutrient: 3, joker: 4 })[b[t].type] ?? 9;
              const ts = [...Array(15).keys()].filter(t => t !== i && b[t] && b[t].pips === pp && free(t) && !(b[t].bounty > 0) && rank(t) < 9)
                .sort((x, y) => rank(x) - rank(y) || line.has(y) - line.has(x) || x - y);
              for (const t of ts) { const a = L.find(x => x.from === i && x.to === t && (x.result === 'feed' || x.result === 'merge')); if (a) return act(a, `暗殺避け：${i}の養分を${t}へ逃がす`); }
            } else if (o.dodgeOther && t0 === 'joker') {
              const rank = t => ({ yinyang: 0, royal: 1, nutrient: 2 })[b[t].type] ?? 9;
              const ts = [...Array(15).keys()].filter(t => t !== i && b[t] && b[t].pips === pp && free(t) && rank(t) < 9).sort((x, y) => rank(x) - rank(y) || x - y);
              for (const t of ts) { const a = L.find(x => x.from === i && x.to === t && x.result === 'copy'); if (a) return act(a, `暗殺避け：${i}のジョーカーで${t}をコピー`); }
            }
          }
        }
        if (o.sw2Crit && sw2At != null && !lockCrit && !(allYY(row) && allYY(col))) {
          const nut1 = [...Array(15).keys()].filter(n => is(n, 'nutrient') && b[n].pips === 1 && free(n));
          if (cnt('switch') >= 2 && nut1.length) {
            if (is(sw2At, 'switch') && b[sw2At].pips === 1) {
              const a = L.find(x => nut1.includes(x.from) && x.to === sw2At && x.result === 'feed');
              if (a) return act(a, `暗殺対策：${sw2At}のスイッチに養分（出目2へ）`);
            } else if (b[sw2At] && !is(sw2At, 'switch') && !is(sw2At, 'yinyang') && b[sw2At].pips === 1 && free(sw2At)) {
              const a = switches(sw2At, 1).map(s2 => L.find(x => x.from === s2 && x.to === sw2At && x.result === 'swap')).find(Boolean);
              if (a) return act(a, `暗殺対策：${a.from}のスイッチを${sw2At}へ（出目2にする）`);
            }
          }
        }
        dodges = dodges.filter(d => b[d.cell] && b[d.cell].id === d.swId && b.some(x => x && x.id === d.yyId));
        for (const d of dodges) {
          if (pendCells.has(d.cell)) continue;
          const q = b.findIndex(x => x && x.id === d.yyId);
          const a = find(d.cell, q);
          if (a && a.result === 'swap') { dodges = dodges.filter(x => x !== d); return act(a, `暗殺避け：${q}の陰陽を${d.cell}に戻す`); }
        }
      }
      return null;
      }

      function fill(targets, protect, tag) {
        if (lockCrit) { targets = targets.filter(t => t !== sw2At); protect = [...(protect || []), sw2At]; }
        const T = new Set(targets), P = new Set(protect || []);
        const out = q => !T.has(q) && !P.has(q);
        const srcY = [...Array(15).keys()].filter(q => is(q, 'yinyang') && out(q));
        for (const t of targets) if (is(t, 'switch')) for (const q of srcY) { const a = find(t, q); if (a && a.result === 'swap') return act(a, `${tag}：引き込み ${q}→${t}`); }
        const yp = new Set(srcY.map(q => b[q].pips));
        for (const t of targets) if (b[t] && !is(t, 'yinyang') && !is(t, 'switch') && yp.has(b[t].pips))
          for (let s = 0; s < 15; s++) if (out(s) && is(s, 'switch')) { const a = find(s, t); if (a && a.result === 'swap') return act(a, `${tag}：スイッチを置く ${s}→${t}`); }
        if (filled && o.raiseSwitch && srcY.length) {
          const hi = q => srcY.some(y => b[y].pips > q);
          const nut = q => [...Array(15).keys()].find(n => out(n) && is(n, 'nutrient') && b[n].pips === q);
          const missN = [crit, ...lineCells].filter(i => !is(i, 'yinyang')).length;
          const y2n = [...Array(15).keys()].filter(i => off(i) && is(i, 'yinyang') && b[i].pips === 2).length;
          const okUse = uses1 => missN - y2n <= 0 || sw1n() - uses1 >= 1;
          for (const t of targets) if (is(t, 'switch') && b[t].pips < 7 && hi(b[t].pips) && okUse(b[t].pips === 1 ? 1 : 0)) {
            const n = nut(b[t].pips); if (n == null) continue;
            const a = find(n, t); if (a && a.result === 'feed') return act(a, `${tag}：スイッチ${t}に養分（出目${b[t].pips}→${b[t].pips + 1}）`);
          }
          for (const t of targets) if (b[t] && !is(t, 'yinyang') && !is(t, 'switch') && hi(b[t].pips) && nut(b[t].pips) != null)
            for (let s = 0; s < 15; s++) if (out(s) && is(s, 'switch') && okUse(b[s].pips === 1 ? 1 : 0)) {
              const a = find(s, t); if (a && a.result === 'swap') return act(a, `${tag}：スイッチを置く ${s}→${t}（養分で出目を上げる）`);
            }
        }
        return null;
      }
      const jokerCopy = () => {
        const y1 = b.filter(d => d && d.type === 'yinyang' && d.pips === 1).length, em = b.filter(d => !d).length;
        if (!o.jokerAll && 7 - (y1 + em * 0.4) <= 0) return null;
        const a = A.find(x => x.result === 'copy' && is(x.from, 'joker') && b[x.from].pips === 1 && is(x.to, 'yinyang'));
        return a ? act(a, 'ジョーカーで陰陽をコピー') : null;
      };

      function modAssassin() { return modAssassinDodge() || assassinPlay(); }
      function assassinPlay() {
        const L = A, free = t => !pendCells.has(t);
        if (actReady) {
          let a, r;
          const jk = L.filter(x => x.result === 'copy' && is(x.from, 'joker'));
          if (cnt('switch') <= 3 && (a = jk.filter(x => is(x.to, 'switch')).sort((x, y) => b[x.from].pips - b[y.from].pips)[0])) return act(a, `暗殺対面：ジョーカー${a.from}でスイッチをコピー`);
          if ((a = jk.filter(x => is(x.to, 'yinyang'))[0])) return act(a, `暗殺対面：ジョーカー${a.from}で陰陽をコピー`);
          for (const c of paraCells) if (b[c] && !is(c, 'switch') && free(c)) {
            const ss = [...Array(15).keys()].filter(s2 => !paraCells.includes(s2) && is(s2, 'switch') && b[s2].pips === b[c].pips && free(s2)).sort((x, y) => amCol.includes(x) - amCol.includes(y) || x - y);
            for (const s2 of ss) { const x = find(s2, c); if (x && x.result === 'swap') return act(x, `暗殺対面：楽園マス${c}にスイッチを置く（${s2}から）`); }
          }
          for (const c of paraCells) if (is(c, 'switch') && b[c].pips === 1 && b.filter((d, k) => k !== c && d && d.type === 'switch' && d.pips === 1).length >= 1) {
            const x = L.find(z => z.to === c && z.result === 'feed' && is(z.from, 'nutrient'));
            if (x) return act(x, `暗殺対面：楽園マス${c}のスイッチに養分（出目2へ）`);
          }
          if (yy >= 3 && !allYY(amCol) && (r = fill(amCol, paraCells, '暗殺対面：縦活性'))) return r;
          if (b.every(Boolean)) {
            const out = i => !paraCells.includes(i) && !amCol.includes(i);
            const mg = (t, c) => L.filter(x => x.result === 'merge' && is(x.from, t) && is(x.to, t) && out(x.from) && out(x.to) && (!c || c(x))).sort((p2, q2) => b[p2.from].pips - b[q2.from].pips)[0];
            if (sw1n() >= 3 && (a = mg('switch', x => b[x.from].pips === 1))) return act(a, '暗殺対面：出目1のスイッチ同士');
            if ((a = mg('nutrient'))) return act(a, '暗殺対面：養分同士');
            if ((a = mg('royal'))) return act(a, '暗殺対面：転移同士');
            if ((a = L.find(x => x.result === 'feed' && is(x.from, 'nutrient') && out(x.from) && amCol.includes(x.to) && is(x.to, 'yinyang')))) return act(a, '暗殺対面：縦活性の陰陽に養分');
          }
        }
        return summon() || { ops: [] };
      }
      let keepCell = null;
      const harmonyNow = allYY(row) && allYY(col);
      function modRoyalArrange() { return harmonyNow ? (raise5() || deficitArrange() || harmonyPlay()) : null; }
      function raise5() {
        if (o.raise5From == null || obs.wave < o.raise5From) return null;
        return raiseTo(o.raise5To, `W${o.raise5From}〜の出目上げ`, true);
      }
      function raiseTo(target, why, deficit) {
        if (!harmonyNow) return null;
        const cp = b[crit].pips, tg = Math.min(o.critMax || 7, target); if (cp >= tg) return null;
        needRaise = true;
        if (!actReady) return null;
        for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
          const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `${why}：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${tg}）`);
        }
        const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
        const x = PARTS.makeNut(Vl, cp);
        return x && x !== 'done' ? act(x, `${why}：出目${cp}の養分を作る（目標${tg}）`) : null;
      }
      // ---------- 極の調和になっているとき（転移そろえ。ランカー陰ロイのロイヤルそろえと同じ） ----------
      function harmonyPlay(stopNull) {
        if (!actReady) return summon() || { ops: [] };
        const H = i => line.has(i) || i === keepCell;
        const cellsOf = (t, p) => [...Array(15).keys()].filter(i => !H(i) && is(i, t) && (p == null || b[i].pips === p));
        const N = p => cellsOf('nutrient', p), J = p => cellsOf('joker', p);
        const mergeOf = (t, p) => { const cs = cellsOf(t, p); for (let x = 0; x < cs.length; x++) for (let y = x + 1; y < cs.length; y++) { const a = find(cs[x], cs[y]); if (a && a.result === 'merge') return a; } return null; };
        const copyOf = (j, t) => A.find(x => x.from === j && x.result === 'copy' && !H(x.to) && is(x.to, t));
        const feedTo = (n, to) => (noFeed && to !== crit) || (noCritRaise && to === crit) ? null : A.find(x => x.from === n && x.to === to && x.result === 'feed');
        const tag = s2 => `調和：${s2}`;
        let a;
        function makeNut(n) {
          if (N(n).length) return 'have';
          let missing = 1, low = null; const useJ = {};
          for (let p = n - 1; p >= 1; p--) {
            const c = N(p).length, j = c ? J(p).length : 0, want = missing * 2;
            if (c + j >= want) { useJ[p] = Math.max(0, want - c); low = p; break; }
            useJ[p] = j; missing = want - c - j;
          }
          if (low == null) return null;
          for (let p = low; p < n; p++) {
            if (useJ[p] > 0) { const n0 = N(p)[0]; for (const j of J(p)) { const x = A.find(z => z.from === j && z.to === n0 && z.result === 'copy'); if (x) return x; } }
            if (N(p).length >= 2) { const x = mergeOf('nutrient', p); if (x) return x; }
          }
          return null;
        }
        const cp = b[crit] ? b[crit].pips : 0;
        if (!noCritRaise && cp < (o.critMax || 7)) {
          for (const n0 of N(cp)) { const x = feedTo(n0, crit); if (x) return act(x, tag(`クリマスの陰陽に養分（出目${cp}→${cp + 1}）`)); }
          if (cp >= 2 && N(cp - 1).length) {
            for (const j of J(cp - 1)) { const x = A.find(z => z.from === j && z.to === N(cp - 1)[0] && z.result === 'copy'); if (x) return act(x, tag(`ジョーカーで出目${cp - 1}の養分をコピー（調和の出目上げ）`)); }
            if ((a = mergeOf('nutrient', cp - 1))) return act(a, tag(`出目${cp - 1}の養分同士（調和の出目上げ）`));
          }
        }
        const T3 = ['switch', 'yinyang', 'royal'];
        const hiPair = T3.some(t => cellsOf(t).some(i => b[i].pips >= 4 && cellsOf(t, b[i].pips - 1).length));
        if (!cellsOf('royal').some(i => b[i].pips >= 4) && !hiPair) {
          for (const n0 of N().filter(i => b[i].pips >= 3).sort((x, y) => b[y].pips - b[x].pips)) {
            const p = b[n0].pips;
            if (N(p).length >= 2 && (a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士（貯め）`));
            for (const j of J(p)) { const x = A.find(z => z.from === j && z.to === n0 && z.result === 'copy'); if (x) return act(x, tag(`ジョーカーで出目${p}の養分をコピー（貯め）`)); }
          }
        }
        if (N().some(i => b[i].pips >= 4)) {
          for (const j of J()) { const x = copyOf(j, 'nutrient'); if (x) return act(x, tag('ジョーカーで養分をコピー')); }
          for (const t of ['royal', 'yinyang']) for (let p = 1; p <= 6; p++) if ((a = mergeOf(t, p))) return act(a, tag(`${t === 'royal' ? '転移' : '陰陽'}同士（出目${p}）`));
          for (const t of ['royal', 'yinyang']) for (const j of J()) { const x = copyOf(j, t); if (x) return act(x, tag(`ジョーカーで${t === 'royal' ? '転移' : '陰陽'}をコピー`)); }
          for (let p = 1; p <= 6; p++) if ((a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士（出目上げ）`));
        }
        for (const t of T3) for (const X of cellsOf(t).filter(i => b[i].pips >= 4).sort((x, y) => b[y].pips - b[x].pips)) {
          const px = b[X].pips;
          if ((a = mergeOf(t, px))) return act(a, tag(`出目${px}の${t}同士`));
          for (const Y of cellsOf(t).filter(i => i !== X && b[i].pips < px && b[i].pips >= px - 2)) {
            const py = b[Y].pips;
            for (const n0 of N(py)) { const x = feedTo(n0, Y); if (x) return act(x, tag(`出目${py}の${t}に養分（出目${px}にそろえる）`)); }
            const m = noFeed ? null : makeNut(py); if (m && m !== 'have') return act(m, tag(`出目${py}の養分を作る（${t}をそろえる）`));
          }
        }
        for (const t of ['yinyang', 'switch']) for (let p = 1; p <= 6; p++) if ((a = mergeOf(t, p))) return act(a, tag(`出目${p}の${t === 'yinyang' ? '陰陽' : 'スイッチ'}同士`));
        const R = p => cellsOf('royal', p);
        if (R(3).length) {
          for (const j of J(3)) { const x = copyOf(j, 'royal'); if (x && b[x.to].pips === 3) return act(x, tag('出目3のジョーカーで出目3の転移をコピー')); }
          if (J(2).length) {
            for (const n0 of N(2)) { const x = feedTo(n0, J(2)[0]); if (x) return act(x, tag('出目2のジョーカーに養分（出目3にして転移をコピー）')); }
            const m = noFeed ? null : makeNut(2); if (m && m !== 'have') return act(m, tag('出目2の養分を作る（ジョーカーを出目3に）'));
          }
        }
        if (R(2).length) {
          if (J(3).length) {
            for (const n0 of N(2)) { const x = feedTo(n0, R(2)[0]); if (x) return act(x, tag('出目2の転移に養分（出目3にしてジョーカーでコピー）')); }
            const m = noFeed ? null : makeNut(2); if (m && m !== 'have') return act(m, tag('出目2の養分を作る（転移を出目3に）'));
          }
          for (const j of J(2)) { const x = copyOf(j, 'royal'); if (x && b[x.to].pips === 2) return act(x, tag('出目2のジョーカーで出目2の転移をコピー')); }
        }
        if (R(1).length && N(1).length) {
          const r1 = R(1).length, j1 = J(1).length, n1 = N(1).length;
          if (r1 >= 2) {
            if (j1 >= 1 && n1 === 1 && seedJ2) { const x = copyOf(J(1)[0], 'nutrient'); if (x && b[x.to].pips === 1) { seedJ2 = false; return act(x, tag('出目1のジョーカーで養分をコピー')); } }
            const x = feedTo(N(1)[0], R(1)[0]); if (x) return act(x, tag('出目1の転移の片方に養分（出目2へ）'));
          } else if (j1 === 0) {
            const x = feedTo(N(1)[0], R(1)[0]); if (x) return act(x, tag('出目1の転移に養分（出目2へ）'));
          } else {
            seedJ2 = j1 >= 2 && n1 === 1;
            const x = copyOf(J(1)[0], 'royal'); if (x && b[x.to].pips === 1) return act(x, tag('出目1のジョーカーで出目1の転移をコピー（種）'));
          }
        }
        for (const n0 of N().filter(i => b[i].pips <= 2)) {
          const p = b[n0].pips;
          for (const r0 of R(p)) { const x = feedTo(n0, r0); if (x) return act(x, tag(`出目${p}の養分を転移に`)); }
        }
        for (let p = 1; p <= 6; p++) if ((a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士`));
        for (const n0 of N().filter(i => b[i].pips <= 2)) for (const j of J(b[n0].pips)) { const x = feedTo(n0, j); if (x) return act(x, tag(`出目${b[n0].pips}の養分をジョーカーに`)); }
        if (o.stuckJoker) {
          const NM = { royal: '転移', nutrient: '養分', yinyang: '陰陽', switch: 'スイッチ' };
          for (const t of (jkRoyalW === obs.wave ? ['royal'] : ['royal', 'nutrient', 'yinyang', 'switch']))
            for (const j of J()) { const x = copyOf(j, t); if (x) { if (t === 'royal') jkRoyalW = obs.wave; return act(x, tag(`打つ手なし：ジョーカー${j}で出目${b[j].pips}の${NM[t]}をコピー`)); } }
        }
        return stopNull ? null : (summon() || { ops: [] });
      }

      function paraSwitch() {
        if (!o.paraSwitch || !actReady || (o.paraSwitchOff || []).some(k => matchup.includes(k))) return null;
        for (const c of paraCells) {
          const d = b[c];
          if (!d || d.type === 'switch' || pendCells.has(c)) continue;
          if (d.type === 'yinyang' && (!o.paraSwitchYY || (d.state && (d.state.col || d.state.row)))) continue;
          for (let s = 0; s < 15; s++) {
            if (s === c || !is(s, 'switch') || line.has(s) || paraCells.includes(s) || pendCells.has(s) || b[s].pips !== d.pips) continue;
            const a = find(s, c); if (a && a.result === 'swap') return act(a, `楽園マス${c}にスイッチを置く（${s}から）`);
          }
        }
        return null;
      }
      // ---------- 極の調和目指し通常 ----------
      function modHarmony() {
      if (harmonyNow) return null;
      if (!filled) {
        if (actReady) {
          let r;
          if ((r = jokerCopy())) return r;
          if (yy >= 7 && (r = fill([crit, ...lineCells], [], '極の調和'))) return r;
          if (yy >= 5 && yy < 7 && row.every(i => b[i]) && !allYY(row) && (r = fill(row, [], '横活性'))) return r;
          if (yy >= 3 && yy < 7 && ![0, 1, 2, 3, 4].some(c => allYY(colOf(c)))) {
            const cs = [0, 1, 2, 3, 4].map(colOf).filter(cc => cc.every(i => b[i]))
              .sort((p, q) => (q.includes(crit) - p.includes(crit)) || q.filter(i => is(i, 'yinyang')).length - p.filter(i => is(i, 'yinyang')).length);
            if (cs.length && (r = fill(cs[0], allYY(row) ? row : [], '縦活性'))) return r;
          }
          if (b[crit] && !is(crit, 'switch') && !is(crit, 'yinyang'))
            for (let s = 0; s < 15; s++) if (s !== crit && is(s, 'switch')) { const a = find(s, crit); if (a && a.result === 'swap') return act(a, 'スイッチをクリマスへ'); }
          if ((r = paraSwitch())) return r;
        }
        return summon() || { ops: [] };
      }
      if (!actReady) return summon() || { ops: [] };
      let r, a;
      const knightStop = obs.wave === 1 && obs.bossType === 'knight';
      if (o.jokerAfterFill && (r = jokerCopy())) return r;
      const RM = mods.includes('royalMatch');
      if (o.y2plan && !knightStop && !RM) {
        const y2off = [...Array(15).keys()].filter(i => off(i) && is(i, 'yinyang') && b[i].pips === 2);
        const lineY1 = lineCells.every(i => is(i, 'yinyang') && b[i].pips === 1);
        const sw2 = b.some(d => d && d.type === 'switch' && d.pips === 2);
        if (y2off.length && lineY1 && !is(crit, 'yinyang')) {
          const c = b[crit];
          if (c && c.pips === 1 && c.type === 'switch') {
            if (!sw2) {
              if ((a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient')))) return act(a, '出目2陰陽：クリマスのスイッチに養分');
            } else {
              if ((a = A.find(x => x.result === 'merge' && x.to === crit && is(x.from, 'switch') && off(x.from)))) return act(a, '出目2陰陽：スイッチをクリマスへ合成');
              for (const t of ['nutrient', 'royal']) {
                const ps = [...Array(15).keys()].filter(i => off(i) && is(i, t) && b[i].pips === 1);
                if (ps.length >= 2 && (a = find(crit, ps[0])) && a.result === 'swap') return act(a, `出目2陰陽：クリマスのスイッチと${t === 'royal' ? '転移' : '養分'}を入れ替え`);
              }
            }
          }
          if (c && c.pips === 1 && (is(crit, 'nutrient') || is(crit, 'royal'))
              && (a = A.find(x => x.result === 'merge' && x.to === crit && off(x.from)))) return act(a, '出目2陰陽：クリマスへ向けて合成');
          if (c && c.pips === 2 && (r = fill([crit], [], '出目2陰陽：クリマスに出目2陰陽'))) return r;
        }
        if (y2off.length && is(crit, 'yinyang') && b[crit].pips === 1 && b.filter(d => d && d.type === 'yinyang' && d.pips === 1).length >= 6) {
          const pairOk = sw2 ? (sw1n() >= 2 || ['nutrient', 'royal'].some(t => [...Array(15).keys()].filter(i => off(i) && is(i, t) && b[i].pips === 1).length >= 2))
            : b.some(d => d && d.type === 'nutrient' && d.pips === 1);
          if (sw1n() >= 1 && pairOk) {
            const miss = lineCells.filter(i => !(is(i, 'yinyang') && b[i].pips === 1));
            if (miss.length === 1 && is(miss[0], 'switch') && b[miss[0]].pips === 1 && (a = find(miss[0], crit)) && a.result === 'swap')
              return act(a, '出目2陰陽：ラインのスイッチをクリマスへ（陰陽をラインへ）');
            const keepS = miss.find(i => is(i, 'switch') && b[i].pips === 1);
            if (keepS != null) {
              const rest = miss.filter(i => i !== keepS);
              if ((r = fill(rest, [crit, keepS, ...lineCells.filter(i => !rest.includes(i))], '出目2陰陽：ラインに陰陽'))) return r;
            } else {
              for (const t of miss) if (b[t] && !is(t, 'switch') && b[t].pips === 1)
                for (let q = 0; q < 15; q++) if (off(q) && is(q, 'switch') && b[q].pips === 1) { const x = find(q, t); if (x && x.result === 'swap') return act(x, '出目2陰陽：ラインにスイッチを置く'); }
              if ((r = fill(miss, [crit], '出目2陰陽：ラインに陰陽'))) return r;
            }
          }
        }
      }
      if (!is(crit, 'yinyang') && (r = fill([crit], [], 'クリマスに陰陽'))) return r;
      if (obs.wave === 1 && obs.bossType === 'leon') {
        if (!allYY(col) && (r = fill(col, [crit], 'レオン：縦活性'))) return r;
        if (!RM && is(crit, 'yinyang') && b[crit].pips < 2 && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient')))) return act(a, 'レオン：クリマスの陰陽を出目2へ');
      } else {
        if (yy >= 7 && (r = fill([crit, ...lineCells], [], '極の調和'))) return r;
        if (yy >= 5 && yy < 7 && !allYY(row) && (r = fill(row, allYY(col) ? col : [crit], '横活性'))) return r;
        if (yy >= 3 && yy < 5 && !allYY(row) && !allYY(col) && (r = fill(col, [crit], '縦活性'))) return r;
      }
      if (knightStop) return summon() || { ops: [] };
      const cp = is(crit, 'yinyang') ? b[crit].pips : 0;
      const mg = (t, c) => A.filter(x => x.result === 'merge' && is(x.from, t) && is(x.to, t) && off(x.from) && off(x.to) && (!c || c(x)))
        .sort((p, q) => b[p.from].pips - b[q.from].pips)[0];
      if (RM) {
        const n1 = [...Array(15).keys()].filter(i => off(i) && is(i, 'nutrient') && b[i].pips === 1).length;
        if ((a = A.filter(x => x.result === 'feed' && is(x.from, 'nutrient') && off(x.from) && is(x.to, 'royal') && off(x.to) && (b[x.from].pips > 1 || n1 >= 2))
          .sort((p, q) => b[p.from].pips - b[q.from].pips)[0])) return act(a, '出目1養分を1個残して転移に養分');
        if ((a = mg('nutrient'))) return act(a, '養分同士');
        if ((a = mg('royal', x => b[x.from].pips === 1))) return act(a, '出目1転移同士');
        if ((a = mg('royal', x => b[x.from].pips === 2))) return act(a, '出目2転移同士');
        if ((a = mg('switch', x => b[x.from].pips !== 1 ? sw1n() >= 1 : sw1n() >= 3))) return act(a, 'スイッチ同士（出目1スイッチを1個残す）');
        if (is(crit, 'yinyang') && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient') && off(x.from) && b[x.from].pips === 1))) return act(a, 'クリマスの陰陽に出目1養分');
        return summon() || { ops: [] };
      }
      if (sw1n() >= 3 && (a = mg('switch', x => b[x.from].pips === 1))) return act(a, '出目1のスイッチ同士');
      if (cp && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient') && off(x.from)))) return act(a, `養分をクリマスの陰陽へ（出目${cp}→${cp + 1}）`);
      if (o.leonW2 && !RM && obs.wave === 2 && obs.bossType === 'leon'
          && (a = A.find(x => x.result === 'feed' && is(x.from, 'nutrient') && off(x.from) && lineCells.includes(x.to) && is(x.to, 'yinyang')))) return act(a, 'W2レオン：ラインの陰陽に養分');
      if ((a = mg('nutrient', x => b[x.from].pips < cp))) return act(a, '養分同士');
      if ((a = mg('royal'))) return act(a, '転移同士');
      if ((r = paraSwitch())) return r;
      return summon() || { ops: [] };
      }
      // ---------- ノーマル対面 ----------
      function modNormal() {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        { let x4; if (o.raise4From != null && obs.wave >= o.raise4From && (x4 = raiseTo(4, `W${o.raise4From}〜：調和の出目4を最優先`, false))) return x4; }
        let x = puStep(); if (x) return x;
        if (!actReady) return summon() || { ops: [] };
        const V = { b, acts: A, protect: new Map() };
        if (!harmonyNow) {
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          if (o.knightOtherCrit && obs.boss && obs.boss.type === 'knight' && b[crit] && !(is(crit, 'yinyang') && b[crit].pips >= 7) && crit2 != null && !line.has(crit2) && knightCast !== obs.boss.cast) {
            knightCast = obs.boss.cast; const c0 = crit; crit = crit2; crit2 = c0;
            return { ops: [], more: true, note: `ナイトの後：クリマスを${c0}から${crit}に移して建て直す` };
          }
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        if (obs.wave >= o.jamFromWave) { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        if ((x = deficitArrange())) return x;
        x = harmonyPlay(true); if (x) return x;
        return fireRoyal() || summon() || { ops: [] };
      }
      function puStep() {
        const yd = (obs.deck || []).find(d => d.type === 'yinyang');
        if (o.puLv && yd && yd.lv < o.puLv && (obs.legal.powerUp || []).includes('yinyang'))
          return { ops: [{ op: 'powerUp', type: 'yinyang' }], more: true, note: `PU 陰陽 Lv${yd.lv}→${yd.lv + 1}` };
        return null;
      }
      // 転移を打つ（ライン外の転移どうしの合成。W7以降は D・R の判断。force で判断なし）
      function fireRoyal(force) {
        if (!actReady) return null;
        const rp = A.filter(a => a.result === 'merge' && is(a.from, 'royal') && is(a.to, 'royal') && !line.has(a.from) && !line.has(a.to))
          .sort((p, q) => b[q.from].pips - b[p.from].pips || p.from - q.from)[0];
        if (rp) {
          let ok = true, why = '';
          if (!force && obs.wave >= o.fireFromWave) {
            const el = obs.t - waveStartT;
            if (obs.phase !== 'wave' || el < o.fireSkipSec) ok = false;
            else if (oppV) {
              const past = !!(oppV.front) && oppV.front.progress * TLen > o.stopPastPos;
              ok = Dv != null && Dv >= 0 && !past && !(Rv > 0 && firedWave !== obs.wave);
              why = Dv == null ? '' : `（D=${Dv.toFixed(1)} R=${Rv.toFixed(1)}）`;
            }
          }
          if (ok) { firedWave = obs.wave; return act(rp, `転移を合成（出目${b[rp.from].pips}）${why}`); }
        }
        return null;
      }
      // ---------- スイッチ絞り ----------
      function modSwitchThrottle(enabledFn, idleFn) {
        const idAt = id => id == null ? -1 : b.findIndex(d => d && d.id === id);
        const ph = obs.phase, tw = ph === 'roll' ? obs.wave + 1 : obs.wave;
        const en = enabledFn ? enabledFn(tw) : tw >= o.thrFromWave;
        if (thr) {
          const yq = idAt(thr.yyId);
          if (yq < 0 || (thr.mode !== 'line' && thr.home !== crit)) { thr = null; thrHot = false; }
        }
        if (!thr && (!harmonyNow || !en)) { thrHot = false; return null; }
        let wantOn;
        if (!en) wantOn = true;
        else if (ph === 'roll') wantOn = false;
        else if (ph !== 'wave') wantOn = true;
        else if (obs.timeLeft != null && obs.timeLeft <= o.thrLastSec) wantOn = true;
        else {
          const yq = thr ? idAt(thr.yyId) : crit, yd = b[yq];
          const cpip = thr && thr.mode === 'line' ? b[crit].pips : (yd ? yd.pips : 1);
          const dps = PARTS.pierceJudge(obs, ctx.info, crit, {}).dps1 * cpip * cpip;
          const movesOn = !thr ? 0 : thr.mode === 'nut' ? 2 : 1;
          const movesFull = (thr ? thr.mode : (tw <= o.thrCritUntil ? 'nut' : 'line')) === 'nut' ? 2 : 1;
          let cum = 0, slack = Infinity;
          const TLn = ctx.info.trackLength || 12;
          for (const e of (obs.enemies || [])) {
            cum += e.hp;
            const eta = e.speed > 0 ? (TLn - e.pos) / e.speed : Infinity;
            slack = Math.min(slack, eta - o.thrMult * cum / dps);
          }
          const hotNow = slack - movesOn * o.thrMoveSec < o.thrBuf;
          const coolOk = slack - movesFull * o.thrMoveSec >= o.thrBuf + o.thrHyst;
          if (hotNow) thrHot = true; else if (coolOk) thrHot = false;
          wantOn = thrHot;
        }
        const idle = () => idleFn ? idleFn() : (o.thrPU ? puStep() : null) || (o.thrFire ? fireRoyal() : null) || summon() || { ops: [] };
        if (!actReady) return wantOn && !thr ? null : idle();
        const swOff = (p, ex) => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'switch') && b[i].pips === p && !ex.includes(i));
        const nutOff = p => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === p);
        const sid = i => b[i] ? b[i].id : null;
        if (wantOn) {
          if (!thr) return null;
          const yq = idAt(thr.yyId), h = thr.home;
          if (b[h] && b[h].id === thr.yyId) { thr = null; return null; }
          let a = null;
          if (is(h, 'switch')) a = find(h, yq);
          else if (thr.mode === 'nut' && is(h, 'nutrient')) {
            for (const s2 of swOff(b[h].pips, [])) { a = find(s2, h); if (a && a.result === 'swap') break; a = null; }
          }
          if (a && a.result === 'swap') return act(a, `スイッチ絞り：活性へ（${a.from}→${a.to}）`);
          thr = null; return null;
        }
        if (!thr) {
          if (!harmonyNow) return null;
          const critMode = tw <= o.thrCritUntil;
          const homes = critMode ? [crit] : lineCells.slice().sort((x, y) => (col.includes(y) - col.includes(x)) || x - y);
          for (const h of homes) {
            const p = b[h].pips;
            for (const s2 of swOff(p, [])) {
              const a = find(s2, h); if (!a || a.result !== 'swap') continue;
              const mode = critMode ? (nutOff(p).length ? 'nut' : 'sw') : 'line';
              thr = { mode, home: h, yyId: b[h].id, swId: b[s2].id, nutId: null };
              return act(a, `スイッチ絞り：${mode === 'line' ? `ラインの陰陽${h}をずらして` : 'クリマスにスイッチを入れて'}活性を切る（${s2}→${h}）`);
            }
          }
          return null;
        }
        const h = thr.home;
        if (b[h] && b[h].id === thr.yyId) {
          for (const s2 of swOff(b[h].pips, [])) { const a = find(s2, h); if (a && a.result === 'swap') { thr.swId = b[s2].id; return act(a, `スイッチ絞り：活性を切る（${s2}→${h}）`); } }
          thr = null; return null;
        }
        if (thr.mode === 'nut' && is(h, 'switch')) {
          for (const n0 of nutOff(b[h].pips)) { const a = find(h, n0); if (a && a.result === 'swap') { thr.nutId = sid(n0); return act(a, `スイッチ絞り：クリマスに養分を置く（${h}↔${n0}）`); } }
        }
        return idle();
      }
      // ---------- 核対面（kind 'nuke'）・コンボ対面（kind 'combo'） ----------
      function modNuke(kind) {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        const ob = (obs.opponent && obs.opponent.board) || [], ofield = obs.opponent && obs.opponent.field, bless = ofield === 'blessing';
        const ot = (i, t, p) => !!(ob[i] && ob[i].type === t && ob[i].pips >= (p || 1));
        const ocnt = t => ob.filter(d => d && d.type === t).length;
        let fireNow;
        if (kind === 'combo') {
          const NB = ctx.info.board.neighbors, sc2 = ob.some((d, i) => ot(i, 'scope', 2));
          const fi = obs.opponent && obs.opponent.fieldInfo;
          const oCrit = fi && fi.paradise ? fi.paradise.map(p => p.cell) : [...Array(15).keys()];
          const adj = ob.some((d, i) => ot(i, 'scope', 2) && NB[i].some(j => ot(j, 'combo', 2)));
          fireNow = bless ? ((ocnt('combo') >= o.comboFireBless && sc2) || (obs.wave >= o.comboBlessScopeWave && sc2))
            : ((ocnt('combo') >= o.comboFire && adj) || (ofield === 'paradise' && obs.wave >= o.comboParadiseWave && oCrit.some(i => ot(i, 'combo', o.comboParadisePips))));
        } else {
          // 核対面（1.0.0）：相手の核・地獄の数は見ない。W3以降は転移攻撃を続ける（打つタイミングは A の絞り込み＝trWhy で決まる）
          fireNow = obs.wave >= o.trFromWave;
        }
        const fire = () => fireNow ? fireRoyal(true) : null;
        let x0 = obs.wave >= o.nukePuFrom ? puStep() : null; if (x0) return x0;
        if (o.nukeKnightKeep != null && !harmonyNow && obs.boss && obs.boss.type === 'knight' && knightCast !== obs.boss.cast && obs.boss.cast > 0
            && b[crit] && !(is(crit, 'yinyang') && b[crit].pips >= o.nukeKnightKeep) && crit2 != null && !line.has(crit2)) {
          knightCast = obs.boss.cast; const c0 = crit; crit = crit2; crit2 = c0; thr = null; jamCell = null;
          return { ops: [], more: true, note: `ナイトの後：クリマスを${c0}から${crit}に移して建て直す` };
        }
        const until = kind === 'combo' ? o.comboThrUntil : o.nukeThrUntil;
        const nb = obs.phase === 'roll' ? (obs.nextBoss && obs.nextBoss.type) : obs.bossType;
        const thrEn = tw => tw >= o.thrFromWave && tw < until && !(tw >= o.nukeKnightFrom && nb === 'knight');
        let x = modSwitchThrottle(thrEn, () => (obs.wave >= o.nukePuFrom ? puStep() : null) || fire() || summon() || { ops: [] });
        if (x) return x;
        if (!actReady) return summon() || { ops: [] };
        if ((x = fire())) return x;
        const V = { b, acts: A, protect: new Map() };
        if (!harmonyNow) {
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          if (b.some(d => !d) && (x = summon())) return Object.assign(x, { note: '建て直し：ダイスを出す' });
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        keepCell = null;
        if (obs.wave >= o.nukeKeepFrom) {
          const lp = new Set(lineCells.filter(i => is(i, 'yinyang')).map(i => b[i].pips));
          keepCell = [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'switch') && lp.has(b[i].pips)).sort((p, q) => b[p].pips - b[q].pips || p - q)[0] ?? null;
        }
        x = deficitArrange() || harmonyPlay(true); keepCell = null;
        if (x) return x;
        return summon() || { ops: [] };
      }
      function deficitArrange() {
        if (!o.deficitArrange || !needRaise || !harmonyNow) return null;
        if (!actReady) return summon() || { ops: [] };
        noFeed = true;
        let x; try { x = harmonyPlay(true); } finally { noFeed = false; }
        if (x) { x.note = '（出目上げ待ち）' + (x.note || ''); return x; }
        const f = fireRoyal(true); if (f) { f.note += '（出目上げ待ちで止まったので打つ）'; return f; }
        return summon() || { ops: [] };
      }
      function royalAttack() {
        if (!actReady) return summon() || { ops: [] };
        const x = harmonyPlay(true); if (x) return x;
        return fireRoyal(true) || summon() || { ops: [] };
      }
      // ---------- 月太陽対面 ----------
      function modMoonsun() {
        const od = ctx.info.opponentDeck || [];
        if (od.some(d => d.type === 'royal')) return null;
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        let x6;
        if (o.raise4From != null && obs.wave >= o.raise4From && (x6 = raiseTo(4, `W${o.raise4From}〜：調和の出目4を最優先`, false))) return x6;
        if (o.msRaise6 && obs.bossType === 'knight' && (x6 = raiseTo(6, 'ナイト前の出目上げ', false))) return x6;
        { const pu = puStep(); if (pu) return pu; }
        if (!actReady) return summon() || { ops: [] };
        const V = { b, acts: A, protect: new Map() };
        let x;
        if (!harmonyNow) {
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        const opp = obs.opponent, ob = (opp && opp.board) || [];
        const front = opp && opp.front ? opp.front.progress * TLen : 0;
        const sunInfo = od.find(d => d.type === 'sun') || {}, moonInfo = od.find(d => d.type === 'moon') || {};
        const sunAC = Array.isArray(sunInfo.activeCounts) && sunInfo.activeCounts.length ? sunInfo.activeCounts : [1, 4, 7];
        const sunAct = sunAC.includes(ob.filter(d => d && d.type === 'sun').length);
        const W = obs.wave;
        let why = null;
        if (W >= o.msEarlyFrom && W < o.msLateFrom) {
          if (front > o.msCorner && sunAct) why = `相手の先頭が${o.msCorner}を越え、太陽が活性`;
          else if (front > o.msCenter && obs.timeLeft != null && obs.timeLeft >= o.msCenterLeft && sunAct) why = `相手の先頭が中央を越え、残り${Math.floor(obs.timeLeft)}秒で太陽が活性`;
          else if (obs.phase === 'intro' && obs.bossType === 'leon') why = 'レオンの演出中';
        } else if (W >= o.msLateFrom) {
          const c = moonInfo.cls || 10, cd = ctx.info.opponentCd || 2000, base = ctx.info.opponentBaseCrit != null ? ctx.info.opponentBaseCrit : 0.05;
          const have = MOONSUN.boardSum(ob, ctx.info.board.neighbors, c, cd, o.msT, base), ref = MOONSUN.mult(c, o.msRefMoon, cd, o.msRefSun, o.msT, 5, base);
          if (have >= ref) why = `相手の月太陽の火力 ${have.toFixed(0)} ≥ 月${o.msRefMoon}・太陽${o.msRefSun}の ${ref.toFixed(0)}`;
          else if (ob.some(d => d && d.type === 'moon' && d.pips >= 7)) why = '相手に月の星';
          else if (front > o.msCorner && sunAct) why = `相手の先頭が${o.msCorner}を越え、太陽が活性`;
        }
        if (o.msRaise6 && b[crit].pips < Math.min(6, o.critMax || 7)) needRaise = true;
        if (why) {
          if (!actReady) return summon() || { ops: [] };
          if ((x = deficitArrange())) return x;
          x = harmonyPlay(true); if (x) return x;
          const f = fireRoyal(true); if (f) { f.note += `（転移攻撃：${why}）`; return f; }
          return summon() || { ops: [] };
        }
        if (o.msRaise6 && (x6 = raiseTo(6, '出目6までの出目上げ', false))) return x6;
        return deficitArrange() || harmonyPlay(true) || summon() || { ops: [] };
      }
      // ---------- ロイヤル対面 ----------
      function royalAttackR() {
        if (!actReady) return summon() || { ops: [] };
        noCritRaise = true;
        let x; try { x = harmonyPlay(true); } finally { noCritRaise = false; }
        if (x) return x;
        return fireRoyal(true) || summon() || { ops: [] };
      }
      function modRoyalMatch() {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        const W = obs.wave, V = { b, acts: A, protect: new Map() };
        let x;
        if (!harmonyNow) {
          if (!actReady) return summon() || { ops: [] };
          if (is(crit, 'yinyang') && W >= 4 && b[crit].pips < 2 && (x = raiseTo(2, 'W4〜：建て直し中のクリマスの陰陽を出目2へ', false))) return x;
          x = PARTS.critRebuild(V, crit, lineCells, { noOffMerge: true });
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return royalAttackR();
        }
        if (W >= 3) {
          const yd = (obs.deck || []).find(d => d.type === 'yinyang');
          if (yd && (obs.legal.powerUp || []).includes('yinyang')) return { ops: [{ op: 'powerUp', type: 'yinyang' }], more: true, note: `PU 陰陽 Lv${yd.lv}→${yd.lv + 1}（ロイヤル対面：最大まで）` };
        }
        if (!actReady) return summon() || { ops: [] };
        const kind = matchup.includes('royalMoonsun') ? 'ms' : matchup.includes('royalYinyang') ? 'yy' : 'n';
        const tg = Math.max(W >= 3 ? 2 : 0, W >= 6 ? 3 : 0, kind !== 'n' && W >= 7 ? 4 : 0);
        if (tg && (x = raiseTo(tg, `W${W}の調和の出目（${tg}まで）`, false))) return x;
        const opp = obs.opponent, ob = (opp && opp.board) || [];
        const front = opp && opp.front ? opp.front.progress * TLen : 0;
        const cnt2 = t => ob.filter(d => d && d.type === t).length;
        let why = null;
        if (kind === 'n') {
          if (W >= 5 && front <= o.stopPastPos) why = `W5〜：相手の先頭が${o.stopPastPos}を越えていない`;
          else if (W >= 4 && Dv != null && Dv >= 0 && front <= o.stopPastPos && !(Rv > 0 && firedWave !== W)) why = `D・R（D=${Dv.toFixed(1)} R=${Rv.toFixed(1)}）`;
        } else if (kind === 'yy') {
          const rowsYY = [0, 1, 2].some(r => [0, 1, 2, 3, 4].every(c => ob[r * 5 + c] && ob[r * 5 + c].type === 'yinyang'));
          const colsYY = [0, 1, 2, 3, 4].some(c => [0, 1, 2].every(r => ob[r * 5 + c] && ob[r * 5 + c].type === 'yinyang'));
          if (W >= 4 && (rowsYY || colsYY)) why = '相手の陰陽が活性';
        } else {
          const sunAct = [1, 4, 7].includes(cnt2('sun')), moonAct = [3, 5, 7].includes(cnt2('moon'));
          if (W >= 2 && obs.bossType === 'leon' && (obs.phase === 'boss' || obs.phase === 'intro') && sunAct && moonAct && leonFiredW !== W) why = 'レオン：相手の月と太陽が活性（1回）';
          else if (W >= 4 && obs.phase === 'wave' && obs.t - waveStartT >= o.rmsSkipSec && front <= o.rmsLimitPos && sunAct) why = `相手の先頭が${o.rmsLimitPos}を越えておらず、太陽が活性`;
        }
        if (why) {
          const r = royalAttackR();
          if (r && r.ops && r.ops[0] && r.ops[0].op === 'act' && /転移を合成/.test(r.note || '')) { firedWave = W; if (/レオン/.test(why)) leonFiredW = W; r.note += `（${why}）`; }
          return r;
        }
        if (kind !== 'yy') {
          const keep = new Set([crit, ...lineCells]);
          const nSw = b.filter(d => d && d.type === 'switch').length;
          const cp = t => A.filter(a => a.result === 'copy' && !keep.has(a.from) && b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === t)
            .sort((p, q) => b[q.from].pips - b[p.from].pips)[0];
          const a = (nSw === 1 && cp('switch')) || cp('yinyang');
          if (a) return act(a, `余ったジョーカー${b[a.from].pips}で${b[a.to].type === 'switch' ? 'スイッチ' : '陰陽'}をコピー（スイッチ${nSw}個）`);
        }
        return summon() || { ops: [] };
      }
      const MOD = { harmony: modHarmony, royalArrange: modRoyalArrange, assassin: modAssassin, normal: modNormal, switchThrottle: () => modSwitchThrottle(), nuke: () => modNuke('nuke'), combo: () => modNuke('combo'), moonsun: modMoonsun, royalAttack, royalMatch: modRoyalMatch };
      for (const m of mods) {
        const r = MOD[m] && MOD[m]();
        if (r) { if (trWhy && r.ops && !r.ops.length && matchup.includes('nuke') && obs.wave >= o.trFromWave) r.note = r.note || `転移待ち（${trWhy}）`; return r; }
      }
      return summon() || { ops: [] };
    } };
  },
});

})();
