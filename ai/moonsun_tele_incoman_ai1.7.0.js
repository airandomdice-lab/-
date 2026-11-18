// 月太陽テレポAI（インコマン式）1.7.0（1.5.10 に対面の定義を足した）  RD.defineAgent('moonsun_tele_incoman', ...)
// デッキ前提：月・太陽・テレポート・成長・ジョーカー。月太陽の部分は月太陽AI（moonsun_ai.js 2026-11-17）の写し（暗殺対面は省略）
// ファイル全体を (() => { … })(); で包んである（ほかのAIファイルと名前がぶつからないように）
//
// インコマン氏の資料（配信のメモ・指南書）に沿った、テレポートの扱い（1.1.0）
//   活性：常に活性させない。次のどれかのときだけ活性を立て直す（それ以外は無理に解きもしない）（teleNeedAct）
//     ・先頭の敵（ボス以外）が2つ目の角（dangerLine）を越えた
//     ・通路の格納できる雑魚の数が、テレポートの空き（上限−格納数の合計）を超えた
//     ・次のボスがレオンで、ウェーブの残り activateLeft 秒以下（レオンは能力の前に倒したい）
//     （中ボスは、雑魚が格納されて通路が空いていれば、太陽が撃ち続けて倒せるので、活性の条件にしない）
//     ボス戦・ボス後の残りは月太陽AIのまま（活性を立て直してボスを倒す）
//   成長：月太陽AIと同じに成長のリレー（コピー）をする
//   送り（格納した敵の使い方）：
//     ・ナイト・マジシャンのウェーブ：送らない（自爆。能力で自陣に出して、自分のSPにする）。格納があればナイトは受ける
//       ただし格納が selfMax（25）体を超えていれば、超えた分はボス前に送る（自陣に出る数が多すぎると処理しきれない。試験で決めた）
//       （シミュレータのIIIIIIIIII〔ハッキング〕はテレポートの格納を出さないので、自爆の対象にしていない）
//     ・レオンのウェーブ：ボス前の送り（ウェーブ終了直前に、送りきるのに要る時間を見て合成）
//     ・ほかのボス：持ち越す。ただしテレポートの空きが fullFree 以下（格納が終わっている）ならボス前の送り
//     ・格納の入ったテレポートは、送り以外では合成しない
//   テレポートのPU：盤面にテレポートが2個以上あれば Lv3 まで。次のボスがレオンなら Lv2 で止める（召喚5回分のSPは残す）
//   速度：判断・重ねる操作・召喚・ドラッグを aiSpeed 秒
// 1.2.0（ユーザー指定）
//   テレポートづくり：空のテレポートどうしも合成しない（テレポートどうしの合成は送りのときだけ）。
//     出目上げの中で、守りでないジョーカーでテレポートをコピーする（成長のコピーの次）
//   活性の消し方：毎ウェーブ、始めから出目上げとテレポートづくりをする（それに伴って活性は勝手に切れる）。
//     出目上げ・テレポートづくりが止まったのに活性していて、盤面が埋まっていれば、
//       序盤（cutSunUntil ウェーブまで）：守りでない太陽どうしを合成して活性を切る
//       それ以降：使わない（守りでない）月どうしを合成して活性を切る（なければ無理に切らない）
//     SPを使う・空きを埋める・守りの太陽や月を潰す、といった無理はしない
// 1.3.0（ユーザー指定）
//   ・（1.4.0で変更）W1は太陽が1個出るまで召喚して貯める。2つ目の角（w1GoLine）・残り w1GoLeft（35）秒・太陽の活性が切れた、のどれかで盤面を広げ始める（以後そのウェーブは広げる）
//   ・W3までの「SPに余裕がないので動かさない」をやめる（W2の召喚3回分の待ち w2Spare 0、出目上げの召喚10回分の待ちはW4から startWave 4）
//   ・1W成長連鎖（growthChain）：W1（盤面を広げ始めた後）、盤面の成長が成長するまで残り chainLeft（3）秒になったら、
//     ほかに成長がなければ（成長しそうなものを除く）、次の成長を作る。成長が出たら止める
//       成長の出目が1：ダイスを召喚 → 召喚できなければ出目1のジョーカーで成長をコピー
//       成長の出目が2以上：出目−1の太陽どうし → 月どうしを合成（新しいダイスが成長になるのを狙う）→ なければ同じ出目のジョーカーで成長をコピー
//     （1.4.1）ジョーカーで成長をコピーするのは、残り3秒の窓で召喚（出目2以上は合成）を試しても成長が出なかったときだけ。
//       召喚は窓の中で続け、召喚できなくなった（盤面が埋まった・SPがない）か、成長まで残り chainCopyAt 秒を切ったらコピーする。
//       W1（chainWaves まで）は、ほかの判断（W1〜2の成長コピー・出目上げの成長コピーなど）でジョーカーで成長をコピーしない
// 1.5.0（ユーザー指定）
//   ・テレポートのPU：成長の連鎖が途切れた（盤面に成長がない）とき、盤面のテレポートの総出目が telePuPips（3）以上なら Lv2、
//     telePuPips3（6）以上なら Lv3 まで（次のボスがレオンなら Lv2 まで）。SPは残さない（PUできるだけあれば上げる）
//   ・活性を切る（W2以降の通常ウェーブ。出目上げで打つ手がないのに太陽が活性しているとき）：
//     守りでない太陽どうし → 守りでない月どうし を合成 → それでも切れなければ召喚（空きがあれば）
//     （W(cutSunUntil+1) 以降は守りでない月どうしだけ。無理に切らない）。盤面が埋まっていなくても行う
//   ・テレポートを出す：テレポートが teleMin（3）個未満で、守りでないジョーカーでコピーできるテレポートもないとき、
//     守りでないダイスどうし（テレポート・成長以外。出目の低い組から）を合成してテレポートを狙う
// 1.5.1（ユーザー指定）
//   ・ウェーブ終盤の送り（ナイト・マジシャン・レオン以外のボス）：盤面全体の空きではなく、テレポートごとの残りの格納数で決める。
//     残りの格納数が nearFull（3）を切ったテレポートを送る。組む相手は、残りの格納数が pairFull（5）を切った同じ出目のテレポートでもよい。
//     相手がいなければジョーカーでコピーして作る（従来どおり）
//   ・レオン（全部送る）・ナイト／マジシャン（自爆、25体を超える分は送る）は従来どおり
// 1.5.9（不具合の修正）W1の始めにジョーカーで太陽をコピーしていた。原因は活性の条件「通路の雑魚がテレポートの空きより多い」で、
//   W1の始めはテレポートがなく空きが0なので、雑魚が1体でも出ると活性が要ると判断し、太陽4個にそろえにいっていた。
//   W1（fullFromWave より前）はこの条件を使わない（W1は「太陽1個で貯めて、2つ目の角・残り35秒・活性切れで広げる」のまま）
// 1.5.10（ユーザー指定）太陽1個も活性と認識する（すべてのウェーブ・場面。sunOneActive: true）
// 1.7.0（ユーザー指定）対面の定義。相手のデッキ（ctx.info.opponentDeck）で決める。上から順に、最初に当てはまったもの（matchup で固定もできる）
//   ・スココン対面（コンボ入り）：これまでの動き（1.5.10）をすべてのウェーブで
//   ・核対面（核入り）：スココン対面の動き＋相手のボスがスライムのとき、相手のスライムが相手のレーンの1つ目の角（slimeCorner 3.5）を
//     越えたら、格納の入ったテレポートを slimeGap（2）秒おきに送る（越えた後はそのボスの間ずっと。相方がいなければジョーカーでコピーして作る）
//     （コンボと核の両方が入っていれば、スココン対面の動き＋スライムの送り）
//   ・暗殺対面（暗殺入り）：通常の月太陽AIに入っている暗殺対面の動き（操作・判断の速さは asnSpeed 0.1秒）
//   ・陰陽対面（陰陽入り）：通常の月太陽AIの動き。ただし出目 yyPips（3）以上のテレポートの組（同じ出目2個）ができたら、
//     危ないとき（ボス以外の敵が2つ目の角を越えた）以外は合成に使わず守り、ボスのナイトの出現演出が終わるところ
//     （残り yyIntroLead 0.4秒。間に合わなければスキルの前）でその組を合成して送る（格納が入っているときだけ）
//   ・炎フロー対面（炎とフローの両方入り）：通常の月太陽AIの動き
//   ・ノーマル対面（上のどれでもない）：W(normalFromWave−1)＝W5まではスココン対面と同じ動き。W6からは通常の月太陽AIの動き。
//     ただしボスがナイト・レオンのウェーブは、ボス前の送りの時間になったら、格納の入ったテレポートを合成できる組（ジョーカーのコピーは使わない）で送る
//   通常の月太陽AI＝プロジェクトの moonsun_ai.js（2026-11-17版）を既定の設定のまま中に写したもの（登録はしない）。途中で切り替えるときは、それまでの試合の記録は持たない
(() => {
'use strict';

const MS_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function msIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return MS_ASN_DECK.every(t => ts.has(t));
}


// ---- 対面の判定 ----
function msTeleMatchup(info, o) {
  if (o && o.matchup && o.matchup !== 'auto') return o.matchup;
  const od = info && info.opponentDeck; if (!od) return 'normal';
  const ts = new Set(od.map(d => d.type));
  if (ts.has('combo')) return ts.has('nuke') ? 'combonuke' : 'scocon';
  if (ts.has('nuke')) return 'nuke';
  if (ts.has('assassin')) return 'asn';
  if (ts.has('yinyang')) return 'yinyang';
  if (ts.has('fire') && ts.has('flow')) return 'fireflow';
  return 'normal';
}

const MS_NORMAL = (() => { let def = null; (function (RD) {
// 月太陽AI（AI API v1）  RD.defineAgent('moonsun', ...)  — プロジェクトの moonsun_ai.js（2026-11-17版）の写し（冒頭の改訂履歴の説明は省略）
// 暗殺対面（asnDecide）も入っている。asnForce: true なら相手のデッキの判定を飛ばして暗殺対面の動きにする

const MS_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function msIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return MS_ASN_DECK.every(t => ts.has(t));
}

RD.defineAgent('moonsun', {
  name: '月太陽',
  desc: '月太陽の組み立て手順に沿うルールベースAI（たたき台）',
  limits: (o, info) => (o.asnMode && o.asnSpeed && msIsAsn(info)) ? { interval: o.asnSpeed, actInterval: o.asnSpeed, summonInterval: o.asnSpeed, dragTime: o.asnSpeed } : null,
  options: {
    prepLine: 6.0, earlyLine: 8.5, corner1: 3.5, w1GoLeft: 55, w2Spare: 3, tsumiLimit: 4, horizon: 10,
    leonIdleKill: 2.0, knightEatKill: 3.0, puReserve: 0,
    freePuGoal: { shield: 5, blizzard: 3 },
    growthW: 2.5, keepJokers: 2, growthFirst: true, resumeGap: 0, weakWave: 5, resumeLine: 3.5, weakMargin: 1.0, capMinTime: 3,
    startSummons: 10, startWave: 3, keepSummons: 5, pairFallback: 'copy', pairUseReserved: false, pairOnlyFull: true,
    w12GrowthCopy: true, dangerRelax: true, idleRepair: false, starSunMin: 3, topSunMode: 'potential', fpMoonGuard: false,
    growthMergeLine: 8.5, noBuildLeft: 15, activateLeft: 10, jokerLast: true, repairMode: 'simple', lowSummons: 5,
    sevenTarget: false, moonNeedsUse: false, simpleDangerOld: true, startOnce: false, summonHyst: true, over7: false,
    highJokerGrowth: 3, sunWaitFix: true, knightRules: true, pairMaxUrg: 1,
    repairJokerFallback: true, sunIdleFix: true, sunIdleFromWave: 3, sun7MergeWave: 6, sun7Summons: 5,
    w12GrowthAlways: true, w12SpFix: true, moonAdjMin: 3,
    sunOneActive: false, reservedGrowth: 3, alwaysBuildWave: 5, freeMerge: true, pairPreferMoon: true, puAdjSun: 2,
    w1MoonMerge: true, mergeDir: true,
    asnMode: true, asnSpeed: 0.1, asnCorner: 8.5, asnSunOneEarly: false, asnPu: false,
  },

  create(ctx) {
    const O = ctx.options;
    const NB = ctx.info.board.neighbors;
    const ASN = !!(O.asnMode && (O.asnForce || msIsAsn(ctx.info)));
    const INFO = {};
    for (const d of ctx.info.deck) INFO[d.type] = d;
    const DECK = ctx.info.deck.map(d => d.type);
    const CD = (ctx.info.cfg && ctx.info.cfg.cd) || 1600;
    const AC = t => (INFO[t] && Array.isArray(INFO[t].activeCounts) && INFO[t].activeCounts.length ? INFO[t].activeCounts.slice() : null);
    const SUN_ALL = AC('sun') || [1, 4, 7];
    const SUN_OK = SUN_ALL.filter(n => O.sunOneActive || n !== 1);
    let sunTargets = [4];
    let over7Now = false;
    let dangerNow = false;
    let leadPos = 0;
    let banPairs = null;
    const banned = (b, a) => !!(banPairs && b[a.from] && b[a.to] && b[a.from].type === b[a.to].type && banPairs.has(b[a.from].type));
    const jokerPair = (b, a) => b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === 'joker';
    const isGrowthPair = (b, a) => !!(b[a.from] && b[a.from].type === 'growth' && b[a.to] && b[a.to].type === 'growth');
    const growthOkInRepair = activation => !activation || leadPos >= O.growthMergeLine;
    const MOON_OK = AC('moon') || [3, 5, 7];

    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);

    const S = {
      wave: 0, frozenWave: 0, lastBossKill: 99, bossSeen: null, bossElapsed: 0, eatKnight: null, idleReason: null,
      buildWave: 0, started: false, spending: false, pair: null, fixPair: null,
      introWave: 0, knightPlanWave: 0, knightPlan: null, asnDone: new Map(),
      weakWave: 0, judgedAt: -1,
      prevHp: new Map(), prevT: null, prevLife: null,
      cap: { dmg: 0, time: 0 },
      seen: new Set(), waveT0: 0,
    };

    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const dist = (c, set) => Math.min(...set.map(x => Math.abs(c - x)));
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };

    function moonRate(obs, pips, active) {
      const c = (INFO.moon && INFO.moon.cls) || 10;
      let r = (0.07 + 0.01 * (c - 7)) * pips + 0.02 * (lv(obs, 'moon') - 1);
      if (active) r *= 1.03;
      return Math.min(0.95, r);
    }
    function mainMoon(b) {
      let best = null;
      b.forEach((d, i) => { if (d && d.type === 'moon' && (!best || d.pips > best.pips)) best = { i, pips: d.pips }; });
      return best;
    }
    function mainMoonCells(b, obs) {
      const m = mainMoon(b); if (!m) return [];
      const out = new Set([m.i]);
      let bs = -1;
      b.forEach((d, i) => {
        if (!d || d.type !== 'moon' || d.pips !== m.pips) return;
        const sc = NB[i].reduce((a, j) => a + (b[j] && b[j].type === 'sun' ? b[j].pips * b[j].pips : 0), 0);
        if (sc > bs) { bs = sc; out.clear(); out.add(i); }
      });
      if (obs) {
        const t = topSun(obs, b);
        if (t >= 0) {
          let sup = -1;
          for (const j of NB[t]) if (b[j] && b[j].type === 'moon' && (sup < 0 || b[j].pips > b[sup].pips)) sup = j;
          if (sup >= 0) out.add(sup);
        }
      }
      return [...out];
    }
    function sunPower(obs, d, b) {
      const sunAct = SUN_ALL.includes(count(b, 'sun'));
      const buf = d.buffs || { spd: 0, atk: 0, crit: 0.05 };
      const iv = (sunAct ? 0.4 : 1.2) / d.pips * (1 - Math.min(0.95, buf.spd));
      const N = O.horizon / iv;
      const s = (d.state && d.state.stage) || 0;
      const hits = N + 0.55 * (N * s + N * N / 2);
      const base = 1 + 0.2 * (lv(obs, 'sun') - 1);
      const crit = buf.crit || 0.05;
      return hits * base * (1 + (buf.atk || 0)) * ((1 - crit) + crit * CD / 100);
    }
    function sunPotential(obs, b, i) {
      const d = b[i];
      let mp = 0;
      for (const j of NB[i]) if (b[j] && b[j].type === 'moon') mp = Math.max(mp, b[j].pips);
      const spd = mp ? moonRate(obs, mp, true) : 0;
      const crit = 0.05 + 0.05 * mp, atkB = 0.10 * mp;
      const sc = (INFO.sun && INFO.sun.cls) || 10;
      const atk = 35 + 5 * (sc - 7) + 11 * (lv(obs, 'sun') - 1);
      const iv = 0.4 / d.pips * (1 - spd);
      const N = O.horizon / iv;
      const hits = N + 0.55 * N * N / 2;
      return hits * atk * (1 + atkB) * ((1 - crit) + crit * CD / 100);
    }
    function topSun(obs, b) {
      let best = -1, bp = -1;
      b.forEach((d, i) => { if (d && d.type === 'sun') { const p = O.topSunMode === 'observed' ? sunPower(obs, d, b) : sunPotential(obs, b, i); if (p > bp) { bp = p; best = i; } } });
      return best;
    }
    function protectedSuns(obs, b, forTsumi = false) {
      const set = new Set();
      const t = topSun(obs, b); if (t >= 0) set.add(t);
      const m = mainMoon(b);
      if (m && m.pips >= 4) for (const mi of mainMoonCells(b, obs)) for (const j of NB[mi]) {
        const d = b[j]; if (d && d.type === 'sun' && d.pips >= 4) set.add(j);
      }
      if (!forTsumi) b.forEach((d, i) => { if (d && d.type === 'moon' && d.pips === 7) for (const j of NB[i]) if (b[j] && b[j].type === 'sun' && b[j].pips >= O.starSunMin) set.add(j); });
      return set;
    }
    function reservedJokers(b, n, preferPips) {
      const js = b.map((d, i) => (d && d.type === 'joker' && d.pips <= 3 ? i : -1)).filter(i => i >= 0);
      js.sort((x, y) => {
        const px = preferPips && preferPips.has(b[x].pips) ? 0 : 1, py = preferPips && preferPips.has(b[y].pips) ? 0 : 1;
        return px - py || b[x].pips - b[y].pips;
      });
      return new Set(js.slice(0, n));
    }
    function guard(obs, b) {
      const g = protectedSuns(obs, b);
      const m = mainMoon(b); if (m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g.add(i);
      const sunPips = new Set(b.filter(d => d && d.type === 'sun').map(d => d.pips));
      const nKeep = O.keepJokers;
      for (const i of reservedJokers(b, nKeep, obs.wave <= 2 ? sunPips : null)) g.add(i);
      return g;
    }
    function tsumi(obs, b) {
      const s = protectedSuns(obs, b, true);
      b.forEach((d, i) => { if (d && d.pips === 7) s.add(i); });
      return s.size > O.tsumiLimit;
    }

    function evalBoard(obs, b, urgency) {
      const m = mainMoon(b);
      const mp = m ? m.pips : 0;
      let v = 0;
      if (mp >= 4) {
        const Vm = p => 1 / (1 - moonRate(obs, p, true));
        v += 2 * Vm(mp) * Vm(mp);
        b.forEach((d, i) => {
          if (!d || d.type !== 'sun') return;
          let best = 0;
          for (const j of NB[i]) if (b[j] && b[j].type === 'moon' && b[j].pips >= 4) best = Math.max(best, b[j].pips);
          if (best) { const V = Vm(best); v += V * V * d.pips * d.pips * (d.pips >= 4 ? 1 : 0.3); }
        });
      } else if (mp > 0) v += 1.5 * mp * mp;
      for (const d of b) {
        if (!d) { v += 0.4; continue; }
        v += 0.3 * Math.pow(2, d.pips - 1) * (1 + 0.15 * (d.pips - 1));
        if (d.type === 'growth' && d.pips < 7) v += O.growthW * Math.pow(2, d.pips - 1);
        if (d.type === 'sun' && mp < 4) v += 0.5 * d.pips * d.pips;
      }
      return v;
    }
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));

    function mergeCands(obs, g) {
      return obs.legal.acts.filter(a => a.result === 'merge' && !g.has(a.from) && !g.has(a.to));
    }
    const starJokerOk = (b, a) => !(b[a.from] && b[a.from].type === 'joker' && b[a.from].pips === 7 && b[a.to] && !['sun', 'moon'].includes(b[a.to].type));
    function copyCands(obs) { return obs.legal.acts.filter(a => a.result === 'copy' && starJokerOk(obs.board, a)); }
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });
    const fixDir = r => { if (r) r.dirFixed = true; return r; };
    const CORNERS = new Set([0, 4, 10, 14]);
    const cellRank = i => { const r = Math.floor(i / 5), c = i % 5; return (r === 1 && c >= 1 && c <= 3 ? 0 : CORNERS.has(i) ? 2 : 1) * 100 + c * 10 + r; };

    function expMerge(obs, b, a, f) {
      let s = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; s += f(nb); }
      return s / DECK.length;
    }
    function distMerge(b, a, f) {
      let e = 0, p0 = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; const v = f(nb); e += v; if (v === 0) p0++; }
      return { e: e / DECK.length, p0: p0 / DECK.length };
    }
    function distSummon(b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let e = 0, p0 = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; const v = f(nb); e += v; if (v === 0) p0++; n++; }
      return { e: e / n, p0: p0 / n };
    }
    function expSummon(obs, b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let s = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; s += f(nb); n++; }
      return s / n;
    }
    function applyCopy(b, a) { const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }

    function actDist(b, needMoon) {
      const sc = count(b, 'sun');
      const ds = SUN_OK.includes(sc) ? 0 : dist(sc, sc > 7 && (O.over7 || over7Now) ? [4, 7] : sunTargets);
      return ds + (needMoon ? dist(count(b, 'moon'), MOON_OK) : 0);
    }
    function engineActive(b, type) { const d = b.find(x => x && x.type === type); return d && typeof d.active === 'boolean' ? d.active : null; }
    function sunActive(b) {
      const sc = count(b, 'sun'), ea = engineActive(b, 'sun');
      if (ea == null) return SUN_OK.includes(sc);
      return ea && (O.sunOneActive || sc !== 1);
    }
    function moonActive(b) { const ea = engineActive(b, 'moon'); return ea == null ? MOON_OK.includes(count(b, 'moon')) : ea; }
    function isActive(b, needMoon) { return sunActive(b) && (!needMoon || moonActive(b)); }

    function copiesOn(b) {
      const out = [];
      b.forEach((a, i) => { if (a && a.type === 'joker') b.forEach((c, j) => { if (c && c.type !== 'joker' && c.pips === a.pips && (a.pips !== 7 || ['sun', 'moon'].includes(c.type))) out.push({ from: i, to: j, result: 'copy' }); }); });
      return out;
    }
    function repairSimple(obs, needMoon, tag, relax, activation) {
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const cur = f1(b);
      if (cur === 0) return null;
      const sc = count(b, 'sun'), mc = count(b, 'moon');
      const sunOk = sunActive(b), moonOk = !needMoon || moonActive(b);
      const full = !b.some(d => !d);
      const low = !obs.legal.summon || obs.sp < costN(obs.summonCost, O.lowSummons);
      const jokerOk = low && (sunOk || moonOk);
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      const m = mainMoon(b); if (!relax && m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g2.add(i);
      const merges = obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !jokerPair(b, a) && !banned(b, a) && (!isGrowthPair(b, a) || (growthOkInRepair(activation) && !banned(b, a))));
      if (jokerOk) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (!['sun', 'moon'].includes(b[a.to].type)) continue;
          const v = f1(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `${tag}：SPが少なく片方が活性しているので、ジョーカーで${b[bc.a.to].type === 'sun' ? '太陽' : '月'}をそろえる`);
      }
      if (!sunOk && sc > 4) {
        let bs = null;
        for (const a of merges) if (b[a.from].type === 'sun' && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `${tag}：太陽が${sc}個なので太陽どうしを合成`);
      }
      if (!full && obs.legal.summon) return opSummon(`${tag}：召喚`);
      let bm = null;
      for (const a of merges) {
        if (b[a.from].type === 'sun' && sc <= 4) continue;
        const r = distMerge(b, a, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        const scv = r.e - r.p0;
        if (!bm || scv < bm.sc - 1e-9 || (Math.abs(scv - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc: scv };
      }
      if (bm) return opAct(bm.a, obs, `${tag}：合成`);
      if (full && obs.legal.summon) {
        let bz = null;
        for (const a of merges) {
          if (b[a.from].type === 'sun' && sc <= 4) continue;
          if (['sun', 'moon'].includes(b[a.from].type)) continue;
          const r = distMerge(b, a, f1);
          if (r.e > cur + 1e-9) continue;
          if (!bz || b[a.to].pips < b[bz.to].pips) bz = a;
        }
        if (bz) return opAct(bz, obs, `${tag}：埋まっているので合成して空ける`);
      }
      if (!jokerOk) return null;
      let bf = null;
      for (const a of copyCands(obs)) {
        if (g2.has(a.to)) continue;
        if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        const r = distMerge(applyCopy(b, a), { from: a.from, to: a.to }, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
      }
      return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
    }
    const CORE = ['moon', 'sun', 'growth', 'joker'];
    function repairFallback(obs, needMoon, tag, activation) {
      const b = obs.board;
      if (!O.repairJokerFallback || isActive(b, needMoon)) return null;
      if (S.fixPair) {
        const P = S.fixPair; S.fixPair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to] && b[x.to].id === P.toId && b[x.from] && b[x.from].id === P.fromId);
        if (a && !banned(b, a)) return opAct(a, obs, `${tag}：ジョーカーで作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      const sc = count(b, 'sun');
      if (!SUN_OK.includes(sc)) {
        let bc = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
        if (bc) return opAct(bc, obs, `${tag}：手がないので、ジョーカー${b[bc.from].pips}で太陽だけ活性させる`);
      }
      const g = guard(obs, b);
      const rank = t => (CORE.includes(t) ? 1 : 0);
      let bp = null;
      for (const a of copyCands(obs)) {
        if (b[a.from].type !== 'joker' || g.has(a.to)) continue;
        const t = b[a.to].type;
        if (t === 'sun' || t === 'moon' || t === 'joker') continue;
        if (t === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        if (!bp || rank(t) < rank(b[bp.to].type) || (rank(t) === rank(b[bp.to].type) && b[a.to].pips < b[bp.to].pips)) bp = a;
      }
      if (!bp) return null;
      S.fixPair = { from: bp.from, to: bp.to, fromId: b[bp.from].id, toId: b[bp.to].id };
      return opAct(bp, obs, `${tag}：手がないので、ジョーカー${b[bp.from].pips}で${b[bp.to].type}${b[bp.to].pips}をコピーして組を作る（次に合成）`);
    }
    function repair(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      const r = repair0(obs, needMoon, tag, urgent, relax, activation);
      if (r || relax) return r;
      return repairFallback(obs, needMoon, tag, activation);
    }
    function repair0(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      if (O.repairMode === 'simple' && !dangerNow) return repairSimple(obs, needMoon, tag, relax, activation);
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const f = (nb, depth = 2) => {
        let m = f1(nb); if (m === 0 || depth === 0) return m;
        for (const a of copiesOn(nb)) if (['sun', 'moon'].includes(nb[a.to].type)) m = Math.min(m, f(applyCopy(nb, a), depth - 1));
        return m;
      };
      if (f1(b) === 0) return null;
      const copies = urgent ? copyCands(obs).filter(a => ['sun', 'moon'].includes(b[a.to].type)) : [];
      for (const a of copies) if (f1(applyCopy(b, a)) === 0) return opAct(a, obs, `${tag}：コピーで活性`);
      const cands = [];
      if (obs.legal.summon) { const r = distSummon(b, f); if (r) cands.push(Object.assign(r, { pr: 0, r: opSummon(`${tag}：召喚`) })); }
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      const m = mainMoon(b); if (!relax && m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g2.add(i);
      if (!relax && O.fpMoonGuard) b.forEach((d, i) => { if (d && d.type === 'moon' && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4)) g2.add(i); });
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !banned(b, a) && (!isGrowthPair(b, a) || growthOkInRepair(activation))))
        cands.push(Object.assign(distMerge(b, a, f), { pr: b[a.from].type === 'moon' ? 0.5 : 1, r: opAct(a, obs, `${tag}：合成`) }));
      for (const a of copies) { const v = f(applyCopy(b, a)); cands.push({ e: v, p0: v === 0 ? 1 : 0, pr: 2, r: opAct(a, obs, `${tag}：コピー`) }); }
      const good = cands.filter(c => c.e < f1(b) - 1e-9 || (c.e <= f1(b) + 1e-9 && c.p0 > 0));
      if (!good.length) {
        if (!urgent) return null;
        let bf = null;
        for (const a of copyCands(obs)) {
          if (g2.has(a.to)) continue;
          if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
          const nb = applyCopy(b, a);
          const r = distMerge(nb, { from: a.from, to: a.to }, f);
          if (!(r.e < f1(b) - 1e-9 || (r.e <= f1(b) + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bf || sc < bf.sc) bf = { a, sc };
        }
        return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
      }
      good.forEach(c => { c.score = c.e - c.p0; });
      good.sort((x, y) => (x.score - y.score) || (x.pr - y.pr));
      const best = good[0];
      if (best.pr === 2) { const alt = good.find(c => c.pr < 2 && c.score <= best.score + 1e-9); if (alt) return alt.r; }
      return good[0].r;
    }

    function breakActive(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (!SUN_ALL.includes(sc)) return null;
      for (const a of copyCands(obs)) {
        const nb = applyCopy(b, a);
        if (!SUN_ALL.includes(count(nb, 'sun'))) return opAct(a, obs, 'ナイトを受ける：活性を切る（コピー）');
      }
      const ps = protectedSuns(obs, b);
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to))) {
        return opAct(a, obs, 'ナイトを受ける：活性を切る（太陽どうしを合成）');
      }
      if (obs.legal.summon) return opSummon('ナイトを受ける：活性を切る（召喚）');
      return null;
    }

    function seekAdjacency(obs, g, tag, inBuild) {
      const b = obs.board;
      const m = mainMoon(b); if (!m || m.pips < 4) return null;
      const t = topSun(obs, b);
      let support = 0;
      if (t >= 0) for (const j of NB[t]) if (b[j] && b[j].type === 'moon') support = Math.max(support, b[j].pips);
      if (m.pips <= support) return null;
      const targets = b.map((d, i) => (d && d.type === 'moon' && d.pips === m.pips ? i : -1)).filter(i => i >= 0);
      if (targets.some(i => NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4))) return null;
      const adj = new Set(); for (const i of targets) for (const j of NB[i]) adj.add(j);
      const note = s => `${tag}：月${m.pips}の隣に太陽を作る（${s}）`;
      let bc = null;
      for (const a of copyCands(obs)) if (adj.has(a.from) && b[a.to].type === 'sun' && (!bc || b[a.from].pips > b[bc.from].pips)) bc = a;
      if (bc) return opAct(bc, obs, note('コピー'));
      if ((inBuild ? canSummonBuild(obs) : obs.legal.summon) && [...adj].some(j => !b[j])) return opSummon(note('召喚'));
      let bm = null;
      for (const a of mergeCands(obs, g)) if (adj.has(a.to) && b[a.to].type !== 'moon' && !isGrowthPair(b, a) && (!bm || b[a.to].pips > b[bm.to].pips)) bm = a;
      if (bm) return fixDir(opAct(bm, obs, note('合成')));
      for (const a of mergeCands(obs, g)) if (adj.has(a.from) && !adj.has(a.to) && b[a.from].type !== 'sun' && b[a.from].type !== 'moon' && !isGrowthPair(b, a)) return fixDir(opAct(a, obs, note('隣を空ける')));
      return null;
    }

    const costN = (c, n) => n * c + 5 * n * (n - 1);
    const reserve5 = obs => obs.wave >= 3 ? costN(obs.summonCost, O.keepSummons) : 0;
    const need10 = obs => costN(obs.summonCost, O.startSummons);
    const canSummonBuild0 = obs => obs.legal.summon && obs.sp - obs.summonCost >= reserve5(Object.assign({}, obs, { summonCost: obs.summonCost + 10 }));
    function canSummonBuild(obs) {
      if (!O.summonHyst || obs.wave < O.startWave) return canSummonBuild0(obs);
      if (!S.spending && obs.sp >= need10(obs)) S.spending = true;
      if (S.spending && !canSummonBuild0(obs)) S.spending = false;
      return S.spending && canSummonBuild0(obs);
    }

    function build(obs, tag, urgency) {
      const b = obs.board, g = guard(obs, b);
      const early = obs.wave <= 2;
      const ev = nb => evalBoard(obs, nb, urgency);
      const base = ev(b);
      const full = !b.some(d => !d);
      if (urgency < 0.5) { const r = seekAdjacency(obs, g, tag, true); if (r) return r; }
      if (S.pair) {
        const P = S.pair; S.pair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to].id === P.toId);
        if (a) return opAct(a, obs, `${tag}：作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      if (O.freeMerge) {
        let bf = null;
        for (const a of mergeCands(obs, g)) {
          if (b[a.from].type === 'sun' || b[a.to].type === 'sun') continue;
          if (isGrowthPair(b, a) || jokerPair(b, a)) continue;
          if (!bf || b[a.to].pips < b[bf.to].pips) bf = a;
        }
        if (bf) return opAct(bf, obs, `${tag}：守り・太陽以外の${b[bf.to].type}${b[bf.to].pips}どうしを合成`);
      }
      if (canSummonBuild(obs)) {
        const e = expSummon(obs, b, ev);
        if (e != null && e - base > -0.5) return opSummon(`${tag}：召喚`);
      }
      if (O.growthFirst) {
        let bg = null;
        for (const a of copyCands(obs)) if (!g.has(a.from) && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：コピー→成長${b[bg.to].pips}`);
      }
      let best = null;
      for (const a of mergeCands(obs, g)) {
        if (early && b[a.from].type === 'sun') continue;
        if (isGrowthPair(b, a)) continue;
        if (O.jokerLast && jokerPair(b, a)) continue;
        const e = expMerge(obs, b, a, ev) - base;
        if (e > 0 && (full || (!early && e >= 5)) && (!best || e > best.e)) best = { a, e };
      }
      const ts = topSun(obs, b);
      const supPips = ts < 0 ? 0 : Math.max(0, ...NB[ts].map(j => (b[j] && b[j].type === 'moon' ? b[j].pips : 0)));
      let bestC = null;
      for (const a of copyCands(obs)) {
        if (g.has(a.from)) continue;
        const tt = b[a.to].type;
        if (!['sun', 'moon', 'growth'].includes(tt)) continue;
        if (early && tt === 'sun') continue;
        if (tt === 'moon' && !(ts >= 0 && NB[ts].includes(a.from) && b[a.from].pips >= 4 && b[a.from].pips > supPips)) continue;
        const e = ev(applyCopy(b, a)) - base;
        if (e > 0 && (!bestC || e > bestC.e)) bestC = { a, e };
      }
      if (bestC && (!best || bestC.e > 2 * best.e)) return opAct(bestC.a, obs, `${tag}：コピー→${b[bestC.a.to].type}（評価+${bestC.e.toFixed(1)}）`);
      if (best) return opAct(best.a, obs, `${tag}：合成（評価+${best.e.toFixed(1)}）`);
      const PF = O.pairFallback === true ? 'copy' : O.pairFallback;
      if (PF === 'merge' || PF === 'both') {
        let bm = null;
        for (const a of mergeCands(obs, g)) {
          if (early && b[a.from].type === 'sun') continue;
          if (isGrowthPair(b, a)) continue;
          const e = expMerge(obs, b, a, ev) - base;
          if (e > 0 && (!bm || e > bm.e)) bm = { a, e };
        }
        if (bm) return opAct(bm.a, obs, `${tag}：合成（評価+${bm.e.toFixed(1)}）`);
      }
      const pfOk = (!O.pairOnlyFull || full) && urgency <= O.pairMaxUrg;
      if (pfOk && (PF === 'copy' || PF === 'both')) {
        let bp = null, bpm = null;
        for (const a of copyCands(obs)) {
          if (g.has(a.to)) continue;
          if (g.has(a.from) && !O.pairUseReserved) continue;
          if (early && b[a.to].type === 'sun') continue;
          if (b[a.to].type === 'growth') continue;
          const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
          if (O.pairPreferMoon && b[a.to].type === 'moon' && (!bpm || e > bpm.e)) bpm = { a, e };
          if (e > 0 && (!bp || e > bp.e)) bp = { a, e };
        }
        if (bpm) bp = bpm;
        if (bp) S.pair = { from: bp.a.from, to: bp.a.to, toId: obs.board[bp.a.to].id };
        if (bp) return opAct(bp.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bp.a.to].type}${b[bp.a.to].pips}）`);
      }
      if (O.jokerLast && full) {
        const jp = obs.legal.acts.filter(a => a.result === 'merge' && jokerPair(b, a));
        if (jp.length) {
          const inPair = new Set(); for (const a of jp) { inPair.add(a.from); inPair.add(a.to); }
          let bc = null;
          for (const a of copyCands(obs)) {
            if (!inPair.has(a.from) || g.has(a.to)) continue;
            const tt = b[a.to].type;
            if (tt === 'growth' || (early && tt === 'sun')) continue;
            const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
            if (!bc || e > bc.e) bc = { a, e };
          }
          if (bc) { S.pair = { from: bc.a.from, to: bc.a.to, toId: obs.board[bc.a.to].id };
            return opAct(bc.a, obs, `${tag}：ジョーカーどうししかないので、片方で${b[bc.a.to].type}${b[bc.a.to].pips}をコピーして合成する`); }
          let bj = null;
          for (const a of jp) { if (g.has(a.from) && g.has(a.to)) continue; const e = expMerge(obs, b, a, ev) - base; if (!bj || e > bj.e) bj = { a, e }; }
          if (bj && bj.e > 0) return opAct(bj.a, obs, `${tag}：ジョーカーどうしを合成（ほかに手がない）`);
        }
      }
      return null;
    }

    function expand(obs, tag) {
      if (O.w12GrowthCopy) {
        let bg = null;
        for (const a of copyCands(obs)) if (obs.board[a.to].type === 'growth' && obs.board[a.to].pips < 7 && (!bg || obs.board[a.from].pips > obs.board[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：ジョーカーで成長${obs.board[bg.to].pips}をコピー`);
      }
      const full = !obs.board.some(d => !d);
      if (!full) return obs.legal.summon ? opSummon(`${tag}：召喚`) : null;
      return build(obs, tag, 0);
    }

    function track(obs) {
      if (obs.wave !== S.wave) return;
      const now = new Map();
      for (const e of obs.enemies) if (!e.bossLike) {
        now.set(e.id, e.hp);
        if (!S.seen.has(e.id)) S.seen.add(e.id);
      }
      if (obs.phase === 'wave' && S.frozenWave === obs.wave && S.prevT != null) {
        if (obs.life === S.prevLife) {
          let d = 0;
          for (const [id, hp] of S.prevHp) { const h = now.get(id); d += h == null ? hp : Math.max(0, hp - h); }
          S.cap.dmg += d; S.cap.time += obs.t - S.prevT;
        }
      }
      S.prevHp = now; S.prevT = obs.t; S.prevLife = obs.life;
    }
    function judgePower(obs) {
      if (S.cap.time < O.capMinTime) return null;
      const have = S.cap.dmg / S.cap.time;
      const el = Math.max(1, obs.t - S.waveT0);
      const rate = S.seen.size / el;
      const w = obs.wave + 1;
      const hp = tableHP(w, waveK(w));
      const need = hp * rate * O.weakMargin;
      return { weak: have < need, have, need, rate };
    }
    const fmt = n => (n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : Math.round(n) + '');

    function powerUp(obs, reserve = 0) {
      const b = obs.board;
      const can = new Set(obs.legal.powerUp || []);
      const cost = t => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
      const ok = t => can.has(t) && obs.sp - cost(t) >= Math.max(O.puReserve, reserve);
      const m = mainMoon(b);
      if (lv(obs, 'sun') < 3 && ok('sun')) return 'sun';
      const puPair = !O.puAdjSun || (isActive(b, true) && b.some((d, i) => d && d.type === 'moon' && d.pips >= 4 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= O.puAdjSun)));
      if (m && m.pips >= 4 && puPair) {
        if (lv(obs, 'moon') < 5 && ok('moon')) return 'moon';
        if (lv(obs, 'sun') < 5 && ok('sun')) return 'sun';
      }
      const w4End = obs.wave >= 5 || (obs.wave === 4 && obs.phase !== 'wave');
      if (w4End) for (const t of DECK) {
        const goal = (O.freePuGoal || {})[t]; if (!goal) continue;
        if (lv(obs, t) < goal && ok(t) && obs.sp - cost(t) >= costN(obs.summonCost, O.keepSummons)) return t;
      }
      if (m && m.pips >= 4)
        for (const t of DECK) if (!['moon', 'sun', 'growth', 'joker'].includes(t) && lv(obs, t) < 5 && ok(t) && obs.sp > 5000) return t;
      return null;
    }

    function idle(reason) {
      if (S.idleReason === reason) return null;
      S.idleReason = reason;
      return { ops: [], note: reason };
    }
    function pu(o, reserve = 0) {
      const t = powerUp(o, reserve);
      return t ? { ops: [{ op: 'powerUp', type: t }], more: true, note: `PU ${t}` } : null;
    }

    function repairDanger(obs, needMoon, tag, activation = false) {
      dangerNow = !!O.simpleDangerOld;
      try { return repair(obs, needMoon, tag, true, false, activation) || (O.dangerRelax ? repair(obs, needMoon, tag + '（守りを外す）', true, true, activation) : null); }
      finally { dangerNow = false; }
    }
    function repairKnight(obs, needMoon, tag, moonStar) {
      const B = obs.boss;
      if (!O.knightRules || moonStar || B.cast < 1) return repairDanger(obs, needMoon, tag);
      if (B.cast === 1) {
        banPairs = new Set(['growth', 'joker']);
        try { return repair(obs, needMoon, tag + '（1回目の変換）') || (O.dangerRelax ? repair(obs, needMoon, tag + '（1回目の変換・守りを外す）', true, true) : null); }
        finally { banPairs = null; }
      }
      if (obs.life >= 3) {
        banPairs = new Set(['growth', 'joker']);
        try { return repairDanger(obs, needMoon, tag + '（2回目の変換・ライフ3）'); } finally { banPairs = null; }
      }
      return repairDanger(obs, needMoon, tag);
    }
    function sunWaitFix(obs) {
      if (!O.sunWaitFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `SP待ち：太陽が${sc}個なので守る太陽以外の太陽どうしを合成`);
      }
      let bc = null;
      for (const a of copyCands(obs)) if (b[a.from].pips <= 2 && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
      return bc ? opAct(bc, obs, `SP待ち：ジョーカー${b[bc.from].pips}で太陽をコピーして活性`) : null;
    }
    function highJokerGrowthCopy(obs, moonStar) {
      if (!O.highJokerGrowth || moonStar) return null;
      const b = obs.board;
      let bg = null;
      for (const a of copyCands(obs)) if (b[a.from].pips >= O.highJokerGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `ジョーカー${b[bg.from].pips}で成長をコピー（月の星なし）`) : null;
    }
    function reservedGrowthCopy(obs) {
      if (!O.reservedGrowth) return null;
      const b = obs.board, res = reservedJokers(b, O.keepJokers, null);
      let bg = null;
      for (const a of copyCands(obs)) if (res.has(a.from) && b[a.from].pips >= O.reservedGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `調整用のジョーカー${b[bg.from].pips}で成長をコピー（先頭が真ん中の手前）`) : null;
    }
    function sun7Merge(obs) {
      if (!O.sun7MergeWave || obs.over || obs.phase !== 'wave' || obs.wave > O.sun7MergeWave) return null;
      const b = obs.board;
      if (count(b, 'sun') !== 7) return null;
      if (obs.sp < costN(obs.summonCost, O.sun7Summons)) return null;
      const front = obs.enemies.find(e => e.kind !== 'boss');
      if (front && front.pos >= O.prepLine) return null;
      const ps = protectedSuns(obs, b);
      let bs = null;
      for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
      return bs ? opAct(bs, obs, `待機中：太陽が7個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
    }
    function sunIdleFix(obs) {
      if (!O.sunIdleFix || obs.over || obs.phase !== 'wave' || obs.wave < O.sunIdleFromWave) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`打つ手なし：太陽が${sc}個で活性していないので召喚`) : null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        return bs ? opAct(bs, obs, `打つ手なし：太陽が${sc}個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
      }
      if (sc <= 3) {
        const g = guard(obs, b);
        let bm = null;
        for (const a of mergeCands(obs, g)) if (b[a.from].type !== 'sun' && b[a.to].type !== 'sun' && (!bm || b[a.to].pips < b[bm.to].pips)) bm = a;
        return bm ? opAct(bm, obs, `打つ手なし：太陽が${sc}個なので${b[bm.to].type}${b[bm.to].pips}どうしを合成（太陽を出す）`) : null;
      }
      return null;
    }
    function w12SpFix(obs, tag) {
      if (!O.w12SpFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_ALL.includes(sc)) return null;
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (b[a.to].type !== t) continue;
        if (sc <= 3 ? !(t === 'moon' || !CORE.includes(t)) : t !== 'sun') continue;
        if (!bm || b[a.to].pips < b[bm.to].pips) bm = a;
      }
      if (!bm) return null;
      const t = b[bm.to].type, nm = t === 'moon' ? '月' : t === 'sun' ? '太陽' : t;
      return opAct(bm, obs, `${tag}：SPに余裕がないので、太陽が${sc}個のうちに${nm}${b[bm.to].pips}どうしを合成（召喚はしない）`);
    }

    // 暗殺対面（このテストでは使わないので省略。ASN のときも通常の動き）
    // ---------- 暗殺対面（プロジェクトの moonsun_ai.js の写し） ----------
    function asnSunOn(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (sc === 1) { const ea = engineActive(b, 'sun'); return !!(O.asnSunOneEarly && obs.wave <= 2 && (ea == null ? SUN_ALL.includes(1) : ea)); }
      return sunActive(b);
    }
    const SUN_GOAL = SUN_OK.filter(n => n > 1).length ? SUN_OK.filter(n => n > 1) : [4];
    const asnDist = nb => { const c = count(nb, 'sun'); return SUN_OK.includes(c) ? 0 : dist(c, SUN_GOAL); };
    const hasBounty = d => !!(d && d.bounty > 0);
    function asnDodge(obs, cell, late, sunOn) {
      const b = obs.board, d = b[cell], sc = count(b, 'sun');
      if (!d || d.type === 'sun') return null;
      if (d.type === 'joker') {
        const cps = copyCands(obs).filter(a => a.from === cell);
        const pick = f => cps.filter(f).sort((x, y) => b[y.to].pips - b[x.to].pips || x.to - y.to)[0] || null;
        const isT = (a, t) => b[a.to].type === t;
        let a = null;
        if (sc === 2 || sc === 3) a = pick(x => isT(x, 'sun'));
        else if (sc === 1 || sc === 4) a = pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || (sc === 1 ? pick(x => isT(x, 'sun')) : null);
        else a = (SUN_OK.includes(sc + 1) ? pick(x => isT(x, 'sun')) : null) || pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || pick(x => !isT(x, 'moon'));
        if (a) return fixDir(opAct(a, obs, `暗殺対面：ジョーカーに暗殺。${b[a.to].type}${b[a.to].pips}をコピーして避ける（太陽${sc}個）`));
        const m = obs.legal.acts.find(x => x.from === cell && x.result === 'merge');
        return m ? fixDir(opAct(m, obs, '暗殺対面：ジョーカーに暗殺。ジョーカーどうしを合成して避ける')) : null;
      }
      let ok;
      if (!late) ok = obs.sp >= costN(obs.summonCost, 2) || b.some(j => j && j.type === 'joker' && b.some(s => s && s.type === 'sun' && s.pips === j.pips));
      else ok = !sunOn;
      if (!ok) return null;
      const cand = obs.legal.acts.filter(x => x.from === cell && x.result === 'merge' && b[x.to].type === d.type && (late || !hasBounty(b[x.to])))
        .sort((x, y) => cellRank(x.to) - cellRank(y.to));
      return cand.length ? fixDir(opAct(cand[0], obs, `暗殺対面：${d.type}${d.pips}に暗殺。同じ種類へ合成して避ける${late ? '（懸賞金の縛りなし）' : ''}`)) : null;
    }
    function asnDecide(obs) {
      if (obs.over) return null;
      const b = obs.board;
      const fpos = obs.front ? obs.front.pos : 0;
      const late = fpos >= O.asnCorner;
      const sunOn = asnSunOn(obs);
      const pend = (obs.pending || []).filter(p => p.kind === 'assassin' && p.cells && p.cells.length).sort((x, y) => x.in - y.in);
      for (const p of pend) {
        const cell = p.cells[0], d = b[cell]; if (!d) continue;
        const key = cell + ':' + Math.round((obs.t + p.in) * 10);
        if (S.asnDone.has(key) && S.asnDone.get(key) !== d.id) continue;
        const r = asnDodge(obs, cell, late, sunOn);
        if (r) { S.asnDone.set(key, d.id); return r; }
      }
      if (sunOn) return (O.asnPu ? pu(obs) : null) || idle('暗殺対面：太陽が活性しているので止める');
      if (obs.legal.summon) return opSummon('暗殺対面：太陽が活性していないので召喚');
      const oppAsn = !!(obs.opponent && obs.opponent.board && obs.opponent.board.some(x => x && x.type === 'assassin'));
      const freeOk = i => late || !hasBounty(b[i]);
      const cur = asnDist(b);
      if (late || !oppAsn) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker' || b[a.to].type !== 'sun' || !freeOk(a.from)) continue;
          const v = asnDist(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `暗殺対面：ジョーカー${b[bc.a.from].pips}で太陽をコピー${late ? '（2つ目の角を越えた）' : ''}`);
        let bm = null;
        for (const a of obs.legal.acts) {
          if (a.result !== 'merge' || !freeOk(a.from) || !freeOk(a.to)) continue;
          const t = b[a.from].type;
          if (t === 'joker' || t === 'growth' || b[a.to].type === 'joker' || b[a.to].type === 'growth') continue;
          const r = distMerge(b, a, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bm || sc < bm.sc - 1e-9 || (Math.abs(sc - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc };
        }
        if (bm) return opAct(bm.a, obs, `暗殺対面：${b[bm.a.to].type}${b[bm.a.to].pips}どうしを合成して太陽を狙う${late ? '（2つ目の角を越えた）' : ''}`);
      }
      if (late) {
        let bf = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker') continue;
          const t = b[a.to].type; if (t === 'growth' || t === 'moon') continue;
          const r = distMerge(applyCopy(b, a), { from: a.from, to: a.to }, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
        }
        if (bf) return opAct(bf.a, obs, `暗殺対面：ジョーカーで${b[bf.a.to].type}${b[bf.a.to].pips}をコピーして合成の組を作る`);
        const jj = obs.legal.acts.find(a => a.result === 'merge' && jokerPair(b, a));
        if (jj) return opAct(jj, obs, '暗殺対面：ジョーカーどうしを合成して太陽を狙う');
      }
      return idle(late ? '暗殺対面：活性の手がない' : oppAsn ? '暗殺対面：召喚できない（相手の盤面に暗殺があるので動かない）' : '暗殺対面：召喚できない（打つ手なし）');
    }

    function decideInner(obs) {
      if (obs.over) return null;
      const b = obs.board;
      const moonNextToSun = b.some((d, i) => d && d.type === 'moon' && d.pips >= O.moonAdjMin && NB[i].some(j => b[j] && b[j].type === 'sun'));
      const needMoon = obs.wave >= 3 && (!O.moonNeedsUse || b.some(d => d && d.type === 'moon' && d.pips >= 4)) && (!O.moonAdjMin || moonNextToSun);
      const front = obs.enemies.find(e => e.kind !== 'boss');
      const frontPos = front ? front.pos : 0;
      const moonStar = b.some(d => d && d.type === 'moon' && d.pips === 7);
      const starDone = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4));
      const otherStar = b.some(d => d && d.type !== 'moon' && d.pips === 7);
      const lead = obs.enemies.length ? obs.enemies[0].pos : 0;
      sunTargets = O.sevenTarget && lead >= 8.5 ? [4, 7] : [4];
      leadPos = lead;

      if (obs.wave !== S.wave) {
        S.wave = obs.wave; S.frozenWave = 0; S.weakWave = 0; S.judgedAt = -1;
        S.seen = new Set(); S.waveT0 = obs.t; S.cap = { dmg: 0, time: 0 }; S.prevHp = new Map(); S.prevT = null;
        S.spending = false;
      }
      track(obs);
      if (obs.boss) {
        if (S.bossSeen !== obs.boss.id) { S.bossSeen = obs.boss.id; S.eatKnight = S.knightPlanWave === obs.wave ? S.knightPlan : null; }
        S.bossElapsed = obs.boss.elapsed;
      } else if (S.bossSeen != null) { S.lastBossKill = S.bossElapsed; S.bossSeen = null; }

      if (O.w12GrowthAlways && obs.wave <= 2 && lead < O.earlyLine) {
        let bg = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `W${obs.wave}：2つ目の角を越えるまではジョーカー${b[bg.from].pips}で成長をコピー`);
      }

      const eatJudge = () => obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill;
      if (obs.phase === 'intro') {
        S.introWave = obs.wave;
        if (obs.nextBoss && obs.nextBoss.type === 'knight' && !starDone) {
          if (S.knightPlanWave !== obs.wave) {
            S.knightPlanWave = obs.wave; S.knightPlan = eatJudge();
            ctx.log(`ナイト：${S.knightPlan ? '受ける' : '受けない'}（演出中に判断。W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.knightPlan) return breakActive(obs) || idle('ナイトを受ける：演出中に活性を切った。スキルを待つ');
        }
        return pu(obs) || idle('ボス出現の演出');
      }

      if (obs.phase === 'boss' && obs.boss) {
        const B = obs.boss;
        if (B.type === 'knight' && !starDone) {
          if (S.eatKnight == null) {
            S.eatKnight = eatJudge();
            ctx.log(`ナイト：${S.eatKnight ? '受ける' : '受けない'}（W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.eatKnight && B.cast === 0) return (S.introWave === obs.wave && !isActive(b, needMoon) ? null : breakActive(obs)) || idle('ナイトを受ける：スキルを待つ');
          if (S.eatKnight && B.cast >= 1) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        }
        if (B.type === 'knight' && B.cast >= 1 && !isActive(b, needMoon)) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        if (!isActive(b, needMoon)) return repairDanger(obs, needMoon, 'ボス戦の立て直し') || idle('ボス戦：打てる立て直しなし');
        return pu(obs) || idle('ボス戦：活性を保って待つ');
      }
      if (obs.phase === 'cleanup') return repairDanger(obs, needMoon, 'ボス後の残りの立て直し') || pu(obs) || idle('ボス後の残りの敵を待つ');
      if (obs.phase !== 'wave') return pu(obs) || idle('ボス抽選・相手待ち');
      if (frontPos < 8.5) { const r = highJokerGrowthCopy(obs, moonStar); if (r) return r; }
      if (frontPos < O.prepLine) { const r = reservedGrowthCopy(obs); if (r) return r; }
      if (O.w1MoonMerge && obs.wave === 1 && frontPos >= O.prepLine) {
        const a = obs.legal.acts.find(x => x.result === 'merge' && b[x.from].type === 'moon' && b[x.to].type === 'moon' && b[x.to].pips === 1);
        if (a) return opAct(a, obs, 'W1：先頭が真ん中を越えたので出目1の月どうしを合成');
      }

      const line = obs.wave <= 2 ? O.earlyLine : O.prepLine;
      if (frontPos >= line) {
        const tag = obs.wave <= 2 ? '活性準備（2つ目の角）' : '活性準備';
        const r = frontPos >= 8.5 ? repairDanger(obs, needMoon, tag, true) : repair(obs, needMoon, tag, true, false, true);
        if (r) return r;
        if (isActive(b, needMoon)) { S.frozenWave = obs.wave; return pu(obs) || idle(`${tag}：活性済み。このウェーブは止めてSPを貯める`); }
        return idle(`${tag}：打てる立て直しなし`);
      }
      if (S.frozenWave === obs.wave && O.resumeGap > 0 && frontPos < O.prepLine - O.resumeGap && obs.wave >= 3) S.frozenWave = 0;
      if (S.frozenWave === obs.wave && O.alwaysBuildWave && obs.wave >= O.alwaysBuildWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        S.judgedAt = obs.t; S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave;
        ctx.log(`W${obs.wave}：押し返したので、火力に関係なく出目上げを再開`);
      }
      if (S.frozenWave === obs.wave && O.weakWave > 0 && obs.wave >= O.weakWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        const j = judgePower(obs);
        if (j) {
          S.judgedAt = obs.t;
          const msg = `火力の判定：実測${fmt(j.have)}/秒 必要${fmt(j.need)}/秒（W${obs.wave + 1}終盤の1体×到着${j.rate.toFixed(2)}体/秒×${O.weakMargin}）`;
          if (j.weak) {
            S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave;
            ctx.log(msg + '→ 足りないので作り込みを再開');
          } else ctx.log(msg + '→ 足りているので止めたまま');
        }
      }
      if (S.frozenWave === obs.wave) {
        const r = sunWaitFix(obs) || repair(obs, needMoon, '停止中の立て直し'); if (r) return r;
        if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '停止中', false); if (a) return a; }
        const why = S.judgedAt >= 0 ? '火力は足りている' : obs.wave >= O.weakWave && O.weakWave > 0 ? '押し返し待ち' : 'レーンの真ん中を越えた';
        return pu(obs) || idle(`停止中：活性を保ってSPを貯める（${why}）`);
      }
      if (S.weakWave === obs.wave && S.judgedAt >= 0 && frontPos > O.resumeLine) S.judgedAt = -1;

      if (obs.wave === 1) {
        const sc = count(b, 'sun');
        const go = frontPos >= O.corner1 || (obs.timeLeft != null && obs.timeLeft <= O.w1GoLeft);
        if (sc === 0 && !go) return obs.legal.summon ? opSummon('W1：太陽が出るまで召喚') : (w12SpFix(obs, 'W1') || idle('W1：SP待ち'));
        if (!go) return w12SpFix(obs, 'W1') || idle('W1：1つ目の角（または35秒）まで貯める');
        return expand(obs, 'W1：盤面を広げる') || pu(obs) || idle('W1：2つ目の角まで広げて待つ');
      }
      if (obs.wave === 2) {
        if (obs.timeLeft != null && obs.timeLeft <= 40 && isActive(b, false)) { S.frozenWave = 2; return pu(obs) || idle('W2中盤：太陽が活性したので止める'); }
        if (obs.sp < costN(obs.summonCost, O.w2Spare)) return w12SpFix(obs, 'W2') || pu(obs) || idle(`W2：SPに余裕がない（召喚${O.w2Spare}回分未満）ので動かさない`);
        return expand(obs, 'W2：盤面を広げる') || pu(obs) || idle('W2：2つ目の角まで広げて待つ');
      }

      if (obs.wave >= 3 && obs.timeLeft != null && obs.timeLeft <= O.noBuildLeft) {
        const late = obs.wave >= 4 && obs.timeLeft <= O.activateLeft;
        if (late && !isActive(b, needMoon)) return repair(obs, needMoon, `残り${O.activateLeft}秒：両活性`, true, false, true) || idle(`残り${O.activateLeft}秒：打てる立て直しなし`);
        return sunWaitFix(obs) || pu(obs, reserve5(obs)) || idle(late ? `残り${O.activateLeft}秒：両活性を保ってボスを待つ` : `残り${O.noBuildLeft}秒以下なので出目上げを始めない`);
      }

      const res = reserve5(obs);
      const weak = S.weakWave === obs.wave;
      const repair7 = tag => { over7Now = true; try { return repair(obs, needMoon, tag); } finally { over7Now = false; } };
      if (tsumi(obs, b)) return repair7('詰み：活性の立て直し') || pu(obs) || idle('詰み：作り込みをやめた');
      if (!weak && starDone && ['leon', 'knight'].includes(obs.bossType))
        return repair7('月の星（太陽隣接済み）：レオン・ナイト前の両活性') || pu(obs) || idle('月の星（太陽隣接済み）：レオン・ナイト前は動かさない（両活性済み）');
      if (!weak && obs.bossType === 'leon' && !(moonStar && !starDone) && isActive(b, needMoon) && S.lastBossKill <= O.leonIdleKill && obs.wave >= 3) return pu(obs) || idle('レオン前：火力に余裕があるので放置');
      if (!weak && obs.wave >= O.startWave && S.buildWave !== obs.wave && !(O.startOnce && S.started)) {
        if (obs.sp >= need10(obs)) { S.buildWave = obs.wave; S.started = true; S.spending = true; }
        else {
          const r = sunWaitFix(obs) || (O.idleRepair === true ? repairDanger(obs, needMoon, '活性の立て直し（出目上げ前）') : repair(obs, needMoon, '活性の立て直し（出目上げ前）')); if (r) return r;
          if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '出目上げ前', false); if (a && a.ops[0].op !== 'summon') return a; }
          return pu(obs, need10(obs)) || idle(`出目上げ：召喚${O.startSummons}回分のSPが貯まるまで始めない`);
        }
      }
      const urgency = Math.max(0, Math.min(1, (frontPos - (O.prepLine - 1.5)) / 1.5));
      return build(obs, weak ? '出目上げ（火力不足）' : '出目上げ', urgency)
        || (O.idleRepair && !isActive(b, needMoon) ? (O.idleRepair === true ? repairDanger : repair)(obs, needMoon, '出目上げの手がないので両活性に戻す') : null)
        || (obs.legal.summon && !canSummonBuild(obs) ? sunWaitFix(obs) : null)
        || pu(obs, res)
        || idle(obs.legal.summon && !canSummonBuild(obs) ? (O.summonHyst ? `出目上げ：召喚${O.startSummons}回分のSPがたまるまで召喚しない` : `出目上げ：召喚${O.keepSummons}回分のSPを貯金中`) : '出目上げ：良い手なし');
    }

    return {
      decide(obs) {
        const savedPair = S.pair, savedFix = S.fixPair;
        let r;
        if (ASN) r = asnDecide(obs);
        else {
          r = decideInner(obs);
          if (!(r && r.ops && r.ops.length)) { const m = sun7Merge(obs) || sunIdleFix(obs); if (m) r = m; }
        }
        if (O.mergeDir && r && r.ops && r.ops.length && r.ops[0].op === 'act' && r.ops[0].expect === 'merge' && !r.dirFixed) {
          const op = r.ops[0];
          const rev = obs.legal.acts.find(x => x.result === 'merge' && x.from === op.to && x.to === op.from);
          if (rev && cellRank(op.from) < cellRank(op.to)) {
            const P = S.pair, F = S.fixPair;
            r.ops[0] = Object.assign({}, op, { from: op.to, to: op.from, fromId: op.toId, toId: op.fromId });
            if (P && P.from === op.from && P.to === op.to) S.pair = Object.assign({}, P, { from: op.to, to: op.from, toId: op.fromId });
            if (F && F.from === op.from && F.to === op.to) S.fixPair = Object.assign({}, F, { from: op.to, to: op.from, toId: op.fromId, fromId: op.toId });
          }
        }
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pair = savedPair; S.fixPair = savedFix; return null; }
        if (r && r.ops && r.ops.length) S.idleReason = null;
        return r;
      },
    };
  },
});

})({ defineAgent: (id, d) => { def = d; } }); return def; })();


RD.defineAgent('moonsun_tele_incoman', {
  name: '月太陽テレポ（インコマン式）',
  desc: '月太陽テレポ用。常に活性させず、雑魚はテレポートに格納させる（危ないときだけ活性）。ナイト・マジシャンは自爆、レオンはボス前に送る、ほかは格納が終わったらボス前に送る。成長のリレーで出目を上げる。',
  limits: (o, info) => { const s = msTeleMatchup(info, o) === 'asn' ? o.asnSpeed : o.aiSpeed; return { interval: s, actInterval: s, summonInterval: s, dragTime: s }; },
  options: {
    // ---- 対面（1.7.0） ----
    matchup: 'auto', normalFromWave: 6, normalSendBosses: ['knight', 'leon'], yyPips: 3, yyIntroLead: 0.4, slimeCorner: 3.5, slimeGap: 2,
    // ---- テレポート（1.1.0） ----
    aiSpeed: 0.3, dangerLine: 8.5, selfBosses: ['knight', 'magician'], sendBosses: ['leon'], fullFree: 2,
    sendMargin: 1.5, sendOpTime: 0.7, selfMin: 5, selfMax: 25, nearFull: 3, pairFull: 5, fullFromWave: 2, teleCopy: true, chainWaves: 1, chainLeft: 3, chainCopyAt: 0.8, cutSunUntil: 5, cutAct: true, telePuPips: 3, telePuPips3: 6, teleMin: 3, telePuMax: 3, telePuLeon: 2, telePuKeep: 5,
    // ---- 月太陽AI ----
    prepLine: 6.0, earlyLine: 8.5, corner1: 3.5, w1GoLeft: 35, w1GoLine: 8.5, w2Spare: 0, tsumiLimit: 4, horizon: 10,
    leonIdleKill: 2.0, knightEatKill: 3.0, puReserve: 0,
    freePuGoal: { shield: 5, blizzard: 3 },
    growthW: 2.5, keepJokers: 2, growthFirst: true, resumeGap: 0, weakWave: 5, resumeLine: 3.5, weakMargin: 1.0, capMinTime: 3,
    startSummons: 10, startWave: 4, keepSummons: 5, pairFallback: 'copy', pairUseReserved: false, pairOnlyFull: true,
    w12GrowthCopy: true, dangerRelax: true, idleRepair: false, starSunMin: 3, topSunMode: 'potential', fpMoonGuard: false,
    growthMergeLine: 8.5, noBuildLeft: 15, activateLeft: 10, jokerLast: true, repairMode: 'simple', lowSummons: 5,
    sevenTarget: false, moonNeedsUse: false, simpleDangerOld: true, startOnce: false, summonHyst: true, over7: false,
    highJokerGrowth: 3, sunWaitFix: false, knightRules: true, pairMaxUrg: 1,
    repairJokerFallback: true, sunIdleFix: false, sunIdleFromWave: 3, sun7MergeWave: 6, sun7Summons: 5,
    w12GrowthAlways: true, w12SpFix: true, moonAdjMin: 3,
    sunOneActive: true, reservedGrowth: 3, alwaysBuildWave: 5, freeMerge: true, pairPreferMoon: true, puAdjSun: 2,
    w1MoonMerge: true, mergeDir: true,
    asnMode: false, asnSpeed: 0.1, asnCorner: 8.5, asnSunOneEarly: false, asnPu: false,
  },

  create(ctx) {
    const O = ctx.options;
    const NB = ctx.info.board.neighbors;
    const ASN = false;   // 暗殺対面は通常の月太陽AI（下の NORMAL）で行う
    const MU = msTeleMatchup(ctx.info, O);
    const SCOCON_MOVE = ['scocon', 'nuke', 'combonuke'].includes(MU);
    const SLIME = MU === 'nuke' || MU === 'combonuke';
    const NORMAL = MS_NORMAL.create(Object.assign({}, ctx, { options: Object.assign({}, MS_NORMAL.options, { asnMode: MU === 'asn', asnForce: MU === 'asn' }) }));
    ctx.log(`対面：${{ scocon: 'スココン', nuke: '核', combonuke: 'コンボ＋核', asn: '暗殺', yinyang: '陰陽', fireflow: '炎フロー', normal: 'ノーマル' }[MU] || MU}`);
    const INFO = {};
    for (const d of ctx.info.deck) INFO[d.type] = d;
    const DECK = ctx.info.deck.map(d => d.type);
    const CD = (ctx.info.cfg && ctx.info.cfg.cd) || 1600;
    const AC = t => (INFO[t] && Array.isArray(INFO[t].activeCounts) && INFO[t].activeCounts.length ? INFO[t].activeCounts.slice() : null);
    const SUN_ALL = AC('sun') || [1, 4, 7];
    const SUN_OK = SUN_ALL.filter(n => O.sunOneActive || n !== 1);
    let sunTargets = [4];
    let over7Now = false;
    let dangerNow = false;
    let leadPos = 0;
    let banPairs = null;
    const banned = (b, a) => !!(banPairs && b[a.from] && b[a.to] && b[a.from].type === b[a.to].type && banPairs.has(b[a.from].type));
    const jokerPair = (b, a) => b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === 'joker';
    const isGrowthPair = (b, a) => !!(b[a.from] && b[a.from].type === 'growth' && b[a.to] && b[a.to].type === 'growth');
    const growthOkInRepair = activation => !activation || leadPos >= O.growthMergeLine;
    const MOON_OK = AC('moon') || [3, 5, 7];

    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);

    const S = {
      wave: 0, frozenWave: 0, lastBossKill: 99, bossSeen: null, bossElapsed: 0, eatKnight: null, idleReason: null,
      buildWave: 0, started: false, spending: false, pair: null, fixPair: null,
      introWave: 0, knightPlanWave: 0, knightPlan: null, asnDone: new Map(),
      weakWave: 0, judgedAt: -1,
      prevHp: new Map(), prevT: null, prevLife: null,
      cap: { dmg: 0, time: 0 },
      seen: new Set(), waveT0: 0,
    };

    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const dist = (c, set) => Math.min(...set.map(x => Math.abs(c - x)));
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };

    function moonRate(obs, pips, active) {
      const c = (INFO.moon && INFO.moon.cls) || 10;
      let r = (0.07 + 0.01 * (c - 7)) * pips + 0.02 * (lv(obs, 'moon') - 1);
      if (active) r *= 1.03;
      return Math.min(0.95, r);
    }
    function mainMoon(b) {
      let best = null;
      b.forEach((d, i) => { if (d && d.type === 'moon' && (!best || d.pips > best.pips)) best = { i, pips: d.pips }; });
      return best;
    }
    function mainMoonCells(b, obs) {
      const m = mainMoon(b); if (!m) return [];
      const out = new Set([m.i]);
      let bs = -1;
      b.forEach((d, i) => {
        if (!d || d.type !== 'moon' || d.pips !== m.pips) return;
        const sc = NB[i].reduce((a, j) => a + (b[j] && b[j].type === 'sun' ? b[j].pips * b[j].pips : 0), 0);
        if (sc > bs) { bs = sc; out.clear(); out.add(i); }
      });
      if (obs) {
        const t = topSun(obs, b);
        if (t >= 0) {
          let sup = -1;
          for (const j of NB[t]) if (b[j] && b[j].type === 'moon' && (sup < 0 || b[j].pips > b[sup].pips)) sup = j;
          if (sup >= 0) out.add(sup);
        }
      }
      return [...out];
    }
    function sunPower(obs, d, b) {
      const sunAct = SUN_ALL.includes(count(b, 'sun'));
      const buf = d.buffs || { spd: 0, atk: 0, crit: 0.05 };
      const iv = (sunAct ? 0.4 : 1.2) / d.pips * (1 - Math.min(0.95, buf.spd));
      const N = O.horizon / iv;
      const s = (d.state && d.state.stage) || 0;
      const hits = N + 0.55 * (N * s + N * N / 2);
      const base = 1 + 0.2 * (lv(obs, 'sun') - 1);
      const crit = buf.crit || 0.05;
      return hits * base * (1 + (buf.atk || 0)) * ((1 - crit) + crit * CD / 100);
    }
    function sunPotential(obs, b, i) {
      const d = b[i];
      let mp = 0;
      for (const j of NB[i]) if (b[j] && b[j].type === 'moon') mp = Math.max(mp, b[j].pips);
      const spd = mp ? moonRate(obs, mp, true) : 0;
      const crit = 0.05 + 0.05 * mp, atkB = 0.10 * mp;
      const sc = (INFO.sun && INFO.sun.cls) || 10;
      const atk = 35 + 5 * (sc - 7) + 11 * (lv(obs, 'sun') - 1);
      const iv = 0.4 / d.pips * (1 - spd);
      const N = O.horizon / iv;
      const hits = N + 0.55 * N * N / 2;
      return hits * atk * (1 + atkB) * ((1 - crit) + crit * CD / 100);
    }
    function topSun(obs, b) {
      let best = -1, bp = -1;
      b.forEach((d, i) => { if (d && d.type === 'sun') { const p = O.topSunMode === 'observed' ? sunPower(obs, d, b) : sunPotential(obs, b, i); if (p > bp) { bp = p; best = i; } } });
      return best;
    }
    function protectedSuns(obs, b, forTsumi = false) {
      const set = new Set();
      const t = topSun(obs, b); if (t >= 0) set.add(t);
      const m = mainMoon(b);
      if (m && m.pips >= 4) for (const mi of mainMoonCells(b, obs)) for (const j of NB[mi]) {
        const d = b[j]; if (d && d.type === 'sun' && d.pips >= 4) set.add(j);
      }
      if (!forTsumi) b.forEach((d, i) => { if (d && d.type === 'moon' && d.pips === 7) for (const j of NB[i]) if (b[j] && b[j].type === 'sun' && b[j].pips >= O.starSunMin) set.add(j); });
      return set;
    }
    function reservedJokers(b, n, preferPips) {
      const js = b.map((d, i) => (d && d.type === 'joker' && d.pips <= 3 ? i : -1)).filter(i => i >= 0);
      js.sort((x, y) => {
        const px = preferPips && preferPips.has(b[x].pips) ? 0 : 1, py = preferPips && preferPips.has(b[y].pips) ? 0 : 1;
        return px - py || b[x].pips - b[y].pips;
      });
      return new Set(js.slice(0, n));
    }
    function guard(obs, b) {
      const g = protectedSuns(obs, b);
      const m = mainMoon(b); if (m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g.add(i);
      const sunPips = new Set(b.filter(d => d && d.type === 'sun').map(d => d.pips));
      const nKeep = O.keepJokers;
      for (const i of reservedJokers(b, nKeep, obs.wave <= 2 ? sunPips : null)) g.add(i);
      return g;
    }
    function tsumi(obs, b) {
      const s = protectedSuns(obs, b, true);
      b.forEach((d, i) => { if (d && d.pips === 7) s.add(i); });
      return s.size > O.tsumiLimit;
    }

    function evalBoard(obs, b, urgency) {
      const m = mainMoon(b);
      const mp = m ? m.pips : 0;
      let v = 0;
      if (mp >= 4) {
        const Vm = p => 1 / (1 - moonRate(obs, p, true));
        v += 2 * Vm(mp) * Vm(mp);
        b.forEach((d, i) => {
          if (!d || d.type !== 'sun') return;
          let best = 0;
          for (const j of NB[i]) if (b[j] && b[j].type === 'moon' && b[j].pips >= 4) best = Math.max(best, b[j].pips);
          if (best) { const V = Vm(best); v += V * V * d.pips * d.pips * (d.pips >= 4 ? 1 : 0.3); }
        });
      } else if (mp > 0) v += 1.5 * mp * mp;
      for (const d of b) {
        if (!d) { v += 0.4; continue; }
        v += 0.3 * Math.pow(2, d.pips - 1) * (1 + 0.15 * (d.pips - 1));
        if (d.type === 'growth' && d.pips < 7) v += O.growthW * Math.pow(2, d.pips - 1);
        if (d.type === 'sun' && mp < 4) v += 0.5 * d.pips * d.pips;
      }
      return v;
    }
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));

    function mergeCands(obs, g) {
      return obs.legal.acts.filter(a => a.result === 'merge' && !g.has(a.from) && !g.has(a.to));
    }
    const starJokerOk = (b, a) => !(b[a.from] && b[a.from].type === 'joker' && b[a.from].pips === 7 && b[a.to] && !['sun', 'moon'].includes(b[a.to].type));
    function copyCands(obs) { return obs.legal.acts.filter(a => a.result === 'copy' && starJokerOk(obs.board, a)); }
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });
    const fixDir = r => { if (r) r.dirFixed = true; return r; };
    const CORNERS = new Set([0, 4, 10, 14]);
    const cellRank = i => { const r = Math.floor(i / 5), c = i % 5; return (r === 1 && c >= 1 && c <= 3 ? 0 : CORNERS.has(i) ? 2 : 1) * 100 + c * 10 + r; };

    function expMerge(obs, b, a, f) {
      let s = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; s += f(nb); }
      return s / DECK.length;
    }
    function distMerge(b, a, f) {
      let e = 0, p0 = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; const v = f(nb); e += v; if (v === 0) p0++; }
      return { e: e / DECK.length, p0: p0 / DECK.length };
    }
    function distSummon(b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let e = 0, p0 = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; const v = f(nb); e += v; if (v === 0) p0++; n++; }
      return { e: e / n, p0: p0 / n };
    }
    function expSummon(obs, b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let s = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; s += f(nb); n++; }
      return s / n;
    }
    function applyCopy(b, a) { const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }

    function actDist(b, needMoon) {
      const sc = count(b, 'sun');
      const ds = SUN_OK.includes(sc) ? 0 : dist(sc, sc > 7 && (O.over7 || over7Now) ? [4, 7] : sunTargets);
      return ds + (needMoon ? dist(count(b, 'moon'), MOON_OK) : 0);
    }
    function engineActive(b, type) { const d = b.find(x => x && x.type === type); return d && typeof d.active === 'boolean' ? d.active : null; }
    function sunActive(b) {
      const sc = count(b, 'sun'), ea = engineActive(b, 'sun');
      if (ea == null) return SUN_OK.includes(sc);
      return ea && (O.sunOneActive || sc !== 1);
    }
    function moonActive(b) { const ea = engineActive(b, 'moon'); return ea == null ? MOON_OK.includes(count(b, 'moon')) : ea; }
    function isActive(b, needMoon) { return sunActive(b) && (!needMoon || moonActive(b)); }

    function copiesOn(b) {
      const out = [];
      b.forEach((a, i) => { if (a && a.type === 'joker') b.forEach((c, j) => { if (c && c.type !== 'joker' && c.pips === a.pips && (a.pips !== 7 || ['sun', 'moon'].includes(c.type))) out.push({ from: i, to: j, result: 'copy' }); }); });
      return out;
    }
    function repairSimple(obs, needMoon, tag, relax, activation) {
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const cur = f1(b);
      if (cur === 0) return null;
      const sc = count(b, 'sun'), mc = count(b, 'moon');
      const sunOk = sunActive(b), moonOk = !needMoon || moonActive(b);
      const full = !b.some(d => !d);
      const low = !obs.legal.summon || obs.sp < costN(obs.summonCost, O.lowSummons);
      const jokerOk = low && (sunOk || moonOk);
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      const m = mainMoon(b); if (!relax && m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g2.add(i);
      const merges = obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !jokerPair(b, a) && !banned(b, a) && (!isGrowthPair(b, a) || (growthOkInRepair(activation) && !banned(b, a))));
      if (jokerOk) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (!['sun', 'moon'].includes(b[a.to].type)) continue;
          const v = f1(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `${tag}：SPが少なく片方が活性しているので、ジョーカーで${b[bc.a.to].type === 'sun' ? '太陽' : '月'}をそろえる`);
      }
      if (!sunOk && sc > 4) {
        let bs = null;
        for (const a of merges) if (b[a.from].type === 'sun' && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `${tag}：太陽が${sc}個なので太陽どうしを合成`);
      }
      if (!full && obs.legal.summon) return opSummon(`${tag}：召喚`);
      let bm = null;
      for (const a of merges) {
        if (b[a.from].type === 'sun' && sc <= 4) continue;
        const r = distMerge(b, a, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        const scv = r.e - r.p0;
        if (!bm || scv < bm.sc - 1e-9 || (Math.abs(scv - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc: scv };
      }
      if (bm) return opAct(bm.a, obs, `${tag}：合成`);
      if (full && obs.legal.summon) {
        let bz = null;
        for (const a of merges) {
          if (b[a.from].type === 'sun' && sc <= 4) continue;
          if (['sun', 'moon'].includes(b[a.from].type)) continue;
          const r = distMerge(b, a, f1);
          if (r.e > cur + 1e-9) continue;
          if (!bz || b[a.to].pips < b[bz.to].pips) bz = a;
        }
        if (bz) return opAct(bz, obs, `${tag}：埋まっているので合成して空ける`);
      }
      if (!jokerOk) return null;
      let bf = null;
      for (const a of copyCands(obs)) {
        if (g2.has(a.to)) continue;
        if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        const r = distMerge(applyCopy(b, a), { from: a.from, to: a.to }, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
      }
      return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
    }
    const CORE = ['moon', 'sun', 'growth', 'joker'];
    function repairFallback(obs, needMoon, tag, activation) {
      const b = obs.board;
      if (!O.repairJokerFallback || isActive(b, needMoon)) return null;
      if (S.fixPair) {
        const P = S.fixPair; S.fixPair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to] && b[x.to].id === P.toId && b[x.from] && b[x.from].id === P.fromId);
        if (a && !banned(b, a)) return opAct(a, obs, `${tag}：ジョーカーで作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      const sc = count(b, 'sun');
      if (!SUN_OK.includes(sc)) {
        let bc = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
        if (bc) return opAct(bc, obs, `${tag}：手がないので、ジョーカー${b[bc.from].pips}で太陽だけ活性させる`);
      }
      const g = guard(obs, b);
      const rank = t => (CORE.includes(t) ? 1 : 0);
      let bp = null;
      for (const a of copyCands(obs)) {
        if (b[a.from].type !== 'joker' || g.has(a.to)) continue;
        const t = b[a.to].type;
        if (t === 'sun' || t === 'moon' || t === 'joker') continue;
        if (t === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        if (!bp || rank(t) < rank(b[bp.to].type) || (rank(t) === rank(b[bp.to].type) && b[a.to].pips < b[bp.to].pips)) bp = a;
      }
      if (!bp) return null;
      S.fixPair = { from: bp.from, to: bp.to, fromId: b[bp.from].id, toId: b[bp.to].id };
      return opAct(bp, obs, `${tag}：手がないので、ジョーカー${b[bp.from].pips}で${b[bp.to].type}${b[bp.to].pips}をコピーして組を作る（次に合成）`);
    }
    function repair(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      const r = repair0(obs, needMoon, tag, urgent, relax, activation);
      if (r || relax) return r;
      return repairFallback(obs, needMoon, tag, activation);
    }
    function repair0(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      if (O.repairMode === 'simple' && !dangerNow) return repairSimple(obs, needMoon, tag, relax, activation);
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const f = (nb, depth = 2) => {
        let m = f1(nb); if (m === 0 || depth === 0) return m;
        for (const a of copiesOn(nb)) if (['sun', 'moon'].includes(nb[a.to].type)) m = Math.min(m, f(applyCopy(nb, a), depth - 1));
        return m;
      };
      if (f1(b) === 0) return null;
      const copies = urgent ? copyCands(obs).filter(a => ['sun', 'moon'].includes(b[a.to].type)) : [];
      for (const a of copies) if (f1(applyCopy(b, a)) === 0) return opAct(a, obs, `${tag}：コピーで活性`);
      const cands = [];
      if (obs.legal.summon) { const r = distSummon(b, f); if (r) cands.push(Object.assign(r, { pr: 0, r: opSummon(`${tag}：召喚`) })); }
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      const m = mainMoon(b); if (!relax && m && m.pips >= 4) for (const i of mainMoonCells(b, obs)) g2.add(i);
      if (!relax && O.fpMoonGuard) b.forEach((d, i) => { if (d && d.type === 'moon' && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4)) g2.add(i); });
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !banned(b, a) && (!isGrowthPair(b, a) || growthOkInRepair(activation))))
        cands.push(Object.assign(distMerge(b, a, f), { pr: b[a.from].type === 'moon' ? 0.5 : 1, r: opAct(a, obs, `${tag}：合成`) }));
      for (const a of copies) { const v = f(applyCopy(b, a)); cands.push({ e: v, p0: v === 0 ? 1 : 0, pr: 2, r: opAct(a, obs, `${tag}：コピー`) }); }
      const good = cands.filter(c => c.e < f1(b) - 1e-9 || (c.e <= f1(b) + 1e-9 && c.p0 > 0));
      if (!good.length) {
        if (!urgent) return null;
        let bf = null;
        for (const a of copyCands(obs)) {
          if (g2.has(a.to)) continue;
          if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
          const nb = applyCopy(b, a);
          const r = distMerge(nb, { from: a.from, to: a.to }, f);
          if (!(r.e < f1(b) - 1e-9 || (r.e <= f1(b) + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bf || sc < bf.sc) bf = { a, sc };
        }
        return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
      }
      good.forEach(c => { c.score = c.e - c.p0; });
      good.sort((x, y) => (x.score - y.score) || (x.pr - y.pr));
      const best = good[0];
      if (best.pr === 2) { const alt = good.find(c => c.pr < 2 && c.score <= best.score + 1e-9); if (alt) return alt.r; }
      return good[0].r;
    }

    function breakActive(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (!SUN_ALL.includes(sc)) return null;
      for (const a of copyCands(obs)) {
        const nb = applyCopy(b, a);
        if (!SUN_ALL.includes(count(nb, 'sun'))) return opAct(a, obs, 'ナイトを受ける：活性を切る（コピー）');
      }
      const ps = protectedSuns(obs, b);
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to))) {
        return opAct(a, obs, 'ナイトを受ける：活性を切る（太陽どうしを合成）');
      }
      if (obs.legal.summon) return opSummon('ナイトを受ける：活性を切る（召喚）');
      return null;
    }

    function seekAdjacency(obs, g, tag, inBuild) {
      const b = obs.board;
      const m = mainMoon(b); if (!m || m.pips < 4) return null;
      const t = topSun(obs, b);
      let support = 0;
      if (t >= 0) for (const j of NB[t]) if (b[j] && b[j].type === 'moon') support = Math.max(support, b[j].pips);
      if (m.pips <= support) return null;
      const targets = b.map((d, i) => (d && d.type === 'moon' && d.pips === m.pips ? i : -1)).filter(i => i >= 0);
      if (targets.some(i => NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4))) return null;
      const adj = new Set(); for (const i of targets) for (const j of NB[i]) adj.add(j);
      const note = s => `${tag}：月${m.pips}の隣に太陽を作る（${s}）`;
      let bc = null;
      for (const a of copyCands(obs)) if (adj.has(a.from) && b[a.to].type === 'sun' && (!bc || b[a.from].pips > b[bc.from].pips)) bc = a;
      if (bc) return opAct(bc, obs, note('コピー'));
      if ((inBuild ? canSummonBuild(obs) : obs.legal.summon) && [...adj].some(j => !b[j])) return opSummon(note('召喚'));
      let bm = null;
      for (const a of mergeCands(obs, g)) if (adj.has(a.to) && b[a.to].type !== 'moon' && !isGrowthPair(b, a) && (!bm || b[a.to].pips > b[bm.to].pips)) bm = a;
      if (bm) return fixDir(opAct(bm, obs, note('合成')));
      for (const a of mergeCands(obs, g)) if (adj.has(a.from) && !adj.has(a.to) && b[a.from].type !== 'sun' && b[a.from].type !== 'moon' && !isGrowthPair(b, a)) return fixDir(opAct(a, obs, note('隣を空ける')));
      return null;
    }

    const costN = (c, n) => n * c + 5 * n * (n - 1);
    const reserve5 = obs => obs.wave >= 3 ? costN(obs.summonCost, O.keepSummons) : 0;
    const need10 = obs => costN(obs.summonCost, O.startSummons);
    const canSummonBuild0 = obs => obs.legal.summon && obs.sp - obs.summonCost >= reserve5(Object.assign({}, obs, { summonCost: obs.summonCost + 10 }));
    function canSummonBuild(obs) {
      if (!O.summonHyst || obs.wave < O.startWave) return canSummonBuild0(obs);
      if (!S.spending && obs.sp >= need10(obs)) S.spending = true;
      if (S.spending && !canSummonBuild0(obs)) S.spending = false;
      return S.spending && canSummonBuild0(obs);
    }

    function build(obs, tag, urgency) {
      const b = obs.board, g = guard(obs, b);
      const early = obs.wave <= 2;
      const ev = nb => evalBoard(obs, nb, urgency);
      const base = ev(b);
      const full = !b.some(d => !d);
      if (urgency < 0.5) { const r = seekAdjacency(obs, g, tag, true); if (r) return r; }
      if (S.pair) {
        const P = S.pair; S.pair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to].id === P.toId);
        if (a) return opAct(a, obs, `${tag}：作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      if (O.freeMerge) {
        let bf = null;
        for (const a of mergeCands(obs, g)) {
          if (b[a.from].type === 'sun' || b[a.to].type === 'sun') continue;
          if (isGrowthPair(b, a) || jokerPair(b, a)) continue;
          if (!bf || b[a.to].pips < b[bf.to].pips) bf = a;
        }
        if (bf) return opAct(bf, obs, `${tag}：守り・太陽以外の${b[bf.to].type}${b[bf.to].pips}どうしを合成`);
      }
      if (canSummonBuild(obs)) {
        const e = expSummon(obs, b, ev);
        if (e != null && e - base > -0.5) return opSummon(`${tag}：召喚`);
      }
      if (O.growthFirst) {
        let bg = null;
        for (const a of copyCands(obs)) if (!g.has(a.from) && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：コピー→成長${b[bg.to].pips}`);
      }
      if (O.teleCopy) {
        let bt = null;
        for (const a of copyCands(obs)) if (!g.has(a.from) && b[a.to].type === 'teleport' && (!bt || b[a.from].pips > b[bt.from].pips)) bt = a;
        if (bt) return opAct(bt, obs, `${tag}：テレポートづくり：ジョーカー${b[bt.from].pips}でテレポートをコピー`);
      }
      let best = null;
      for (const a of mergeCands(obs, g)) {
        if (early && b[a.from].type === 'sun') continue;
        if (isGrowthPair(b, a)) continue;
        if (O.jokerLast && jokerPair(b, a)) continue;
        const e = expMerge(obs, b, a, ev) - base;
        if (e > 0 && (full || (!early && e >= 5)) && (!best || e > best.e)) best = { a, e };
      }
      const ts = topSun(obs, b);
      const supPips = ts < 0 ? 0 : Math.max(0, ...NB[ts].map(j => (b[j] && b[j].type === 'moon' ? b[j].pips : 0)));
      let bestC = null;
      for (const a of copyCands(obs)) {
        if (g.has(a.from)) continue;
        const tt = b[a.to].type;
        if (!['sun', 'moon', 'growth'].includes(tt)) continue;
        if (early && tt === 'sun') continue;
        if (tt === 'moon' && !(ts >= 0 && NB[ts].includes(a.from) && b[a.from].pips >= 4 && b[a.from].pips > supPips)) continue;
        const e = ev(applyCopy(b, a)) - base;
        if (e > 0 && (!bestC || e > bestC.e)) bestC = { a, e };
      }
      if (bestC && (!best || bestC.e > 2 * best.e)) return opAct(bestC.a, obs, `${tag}：コピー→${b[bestC.a.to].type}（評価+${bestC.e.toFixed(1)}）`);
      if (best) return opAct(best.a, obs, `${tag}：合成（評価+${best.e.toFixed(1)}）`);
      const PF = O.pairFallback === true ? 'copy' : O.pairFallback;
      if (PF === 'merge' || PF === 'both') {
        let bm = null;
        for (const a of mergeCands(obs, g)) {
          if (early && b[a.from].type === 'sun') continue;
          if (isGrowthPair(b, a)) continue;
          const e = expMerge(obs, b, a, ev) - base;
          if (e > 0 && (!bm || e > bm.e)) bm = { a, e };
        }
        if (bm) return opAct(bm.a, obs, `${tag}：合成（評価+${bm.e.toFixed(1)}）`);
      }
      const pfOk = (!O.pairOnlyFull || full) && urgency <= O.pairMaxUrg;
      if (pfOk && (PF === 'copy' || PF === 'both')) {
        let bp = null, bpm = null;
        for (const a of copyCands(obs)) {
          if (g.has(a.to)) continue;
          if (g.has(a.from) && !O.pairUseReserved) continue;
          if (early && b[a.to].type === 'sun') continue;
          if (b[a.to].type === 'growth') continue;
          const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
          if (O.pairPreferMoon && b[a.to].type === 'moon' && (!bpm || e > bpm.e)) bpm = { a, e };
          if (e > 0 && (!bp || e > bp.e)) bp = { a, e };
        }
        if (bpm) bp = bpm;
        if (bp) S.pair = { from: bp.a.from, to: bp.a.to, toId: obs.board[bp.a.to].id };
        if (bp) return opAct(bp.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bp.a.to].type}${b[bp.a.to].pips}）`);
      }
      if (O.jokerLast && full) {
        const jp = obs.legal.acts.filter(a => a.result === 'merge' && jokerPair(b, a));
        if (jp.length) {
          const inPair = new Set(); for (const a of jp) { inPair.add(a.from); inPair.add(a.to); }
          let bc = null;
          for (const a of copyCands(obs)) {
            if (!inPair.has(a.from) || g.has(a.to)) continue;
            const tt = b[a.to].type;
            if (tt === 'growth' || (early && tt === 'sun')) continue;
            const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
            if (!bc || e > bc.e) bc = { a, e };
          }
          if (bc) { S.pair = { from: bc.a.from, to: bc.a.to, toId: obs.board[bc.a.to].id };
            return opAct(bc.a, obs, `${tag}：ジョーカーどうししかないので、片方で${b[bc.a.to].type}${b[bc.a.to].pips}をコピーして合成する`); }
          let bj = null;
          for (const a of jp) { if (g.has(a.from) && g.has(a.to)) continue; const e = expMerge(obs, b, a, ev) - base; if (!bj || e > bj.e) bj = { a, e }; }
          if (bj && bj.e > 0) return opAct(bj.a, obs, `${tag}：ジョーカーどうしを合成（ほかに手がない）`);
        }
      }
      return null;
    }

    function expand(obs, tag) {
      if (O.w12GrowthCopy) {
        let bg = null;
        for (const a of copyCands(obs)) if (obs.board[a.to].type === 'growth' && obs.board[a.to].pips < 7 && (!bg || obs.board[a.from].pips > obs.board[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：ジョーカーで成長${obs.board[bg.to].pips}をコピー`);
      }
      const full = !obs.board.some(d => !d);
      if (!full) return obs.legal.summon ? opSummon(`${tag}：召喚`) : null;
      return build(obs, tag, 0);
    }

    function track(obs) {
      if (obs.wave !== S.wave) return;
      const now = new Map();
      for (const e of obs.enemies) if (!e.bossLike) {
        now.set(e.id, e.hp);
        if (!S.seen.has(e.id)) S.seen.add(e.id);
      }
      if (obs.phase === 'wave' && S.frozenWave === obs.wave && S.prevT != null) {
        if (obs.life === S.prevLife) {
          let d = 0;
          for (const [id, hp] of S.prevHp) { const h = now.get(id); d += h == null ? hp : Math.max(0, hp - h); }
          S.cap.dmg += d; S.cap.time += obs.t - S.prevT;
        }
      }
      S.prevHp = now; S.prevT = obs.t; S.prevLife = obs.life;
    }
    function judgePower(obs) {
      if (S.cap.time < O.capMinTime) return null;
      const have = S.cap.dmg / S.cap.time;
      const el = Math.max(1, obs.t - S.waveT0);
      const rate = S.seen.size / el;
      const w = obs.wave + 1;
      const hp = tableHP(w, waveK(w));
      const need = hp * rate * O.weakMargin;
      return { weak: have < need, have, need, rate };
    }
    const fmt = n => (n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : Math.round(n) + '');

    function powerUp(obs, reserve = 0) {
      const b = obs.board;
      const can = new Set(obs.legal.powerUp || []);
      const cost = t => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
      const ok = t => can.has(t) && obs.sp - cost(t) >= Math.max(O.puReserve, reserve);
      const m = mainMoon(b);
      if (lv(obs, 'sun') < 3 && ok('sun')) return 'sun';
      const puPair = !O.puAdjSun || (isActive(b, true) && b.some((d, i) => d && d.type === 'moon' && d.pips >= 4 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= O.puAdjSun)));
      if (m && m.pips >= 4 && puPair) {
        if (lv(obs, 'moon') < 5 && ok('moon')) return 'moon';
        if (lv(obs, 'sun') < 5 && ok('sun')) return 'sun';
      }
      const w4End = obs.wave >= 5 || (obs.wave === 4 && obs.phase !== 'wave');
      if (w4End) for (const t of DECK) {
        const goal = (O.freePuGoal || {})[t]; if (!goal) continue;
        if (lv(obs, t) < goal && ok(t) && obs.sp - cost(t) >= costN(obs.summonCost, O.keepSummons)) return t;
      }
      if (m && m.pips >= 4)
        for (const t of DECK) if (!['moon', 'sun', 'growth', 'joker'].includes(t) && lv(obs, t) < 5 && ok(t) && obs.sp > 5000) return t;
      return null;
    }

    function idle(reason) {
      if (S.idleReason === reason) return null;
      S.idleReason = reason;
      return { ops: [], note: reason };
    }
    function pu(o, reserve = 0) {
      const t = powerUp(o, reserve);
      return t ? { ops: [{ op: 'powerUp', type: t }], more: true, note: `PU ${t}` } : null;
    }

    function repairDanger(obs, needMoon, tag, activation = false) {
      dangerNow = !!O.simpleDangerOld;
      try { return repair(obs, needMoon, tag, true, false, activation) || (O.dangerRelax ? repair(obs, needMoon, tag + '（守りを外す）', true, true, activation) : null); }
      finally { dangerNow = false; }
    }
    function repairKnight(obs, needMoon, tag, moonStar) {
      const B = obs.boss;
      if (!O.knightRules || moonStar || B.cast < 1) return repairDanger(obs, needMoon, tag);
      if (B.cast === 1) {
        banPairs = new Set(['growth', 'joker']);
        try { return repair(obs, needMoon, tag + '（1回目の変換）') || (O.dangerRelax ? repair(obs, needMoon, tag + '（1回目の変換・守りを外す）', true, true) : null); }
        finally { banPairs = null; }
      }
      if (obs.life >= 3) {
        banPairs = new Set(['growth', 'joker']);
        try { return repairDanger(obs, needMoon, tag + '（2回目の変換・ライフ3）'); } finally { banPairs = null; }
      }
      return repairDanger(obs, needMoon, tag);
    }
    function sunWaitFix(obs) {
      if (!O.sunWaitFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `SP待ち：太陽が${sc}個なので守る太陽以外の太陽どうしを合成`);
      }
      let bc = null;
      for (const a of copyCands(obs)) if (b[a.from].pips <= 2 && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
      return bc ? opAct(bc, obs, `SP待ち：ジョーカー${b[bc.from].pips}で太陽をコピーして活性`) : null;
    }
    function highJokerGrowthCopy(obs, moonStar) {
      if (!O.highJokerGrowth || moonStar) return null;
      const b = obs.board;
      let bg = null;
      for (const a of copyCands(obs)) if (b[a.from].pips >= O.highJokerGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `ジョーカー${b[bg.from].pips}で成長をコピー（月の星なし）`) : null;
    }
    function reservedGrowthCopy(obs) {
      if (!O.reservedGrowth) return null;
      const b = obs.board, res = reservedJokers(b, O.keepJokers, null);
      let bg = null;
      for (const a of copyCands(obs)) if (res.has(a.from) && b[a.from].pips >= O.reservedGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `調整用のジョーカー${b[bg.from].pips}で成長をコピー（先頭が真ん中の手前）`) : null;
    }
    function sun7Merge(obs) {
      if (!O.sun7MergeWave || obs.over || obs.phase !== 'wave' || obs.wave > O.sun7MergeWave) return null;
      const b = obs.board;
      if (count(b, 'sun') !== 7) return null;
      if (obs.sp < costN(obs.summonCost, O.sun7Summons)) return null;
      const front = obs.enemies.find(e => e.kind !== 'boss');
      if (front && front.pos >= O.prepLine) return null;
      const ps = protectedSuns(obs, b);
      let bs = null;
      for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
      return bs ? opAct(bs, obs, `待機中：太陽が7個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
    }
    function sunIdleFix(obs) {
      if (!O.sunIdleFix || obs.over || obs.phase !== 'wave' || obs.wave < O.sunIdleFromWave) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`打つ手なし：太陽が${sc}個で活性していないので召喚`) : null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        return bs ? opAct(bs, obs, `打つ手なし：太陽が${sc}個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
      }
      if (sc <= 3) {
        const g = guard(obs, b);
        let bm = null;
        for (const a of mergeCands(obs, g)) if (b[a.from].type !== 'sun' && b[a.to].type !== 'sun' && (!bm || b[a.to].pips < b[bm.to].pips)) bm = a;
        return bm ? opAct(bm, obs, `打つ手なし：太陽が${sc}個なので${b[bm.to].type}${b[bm.to].pips}どうしを合成（太陽を出す）`) : null;
      }
      return null;
    }
    function w12SpFix(obs, tag) {
      if (!O.w12SpFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_ALL.includes(sc)) return null;
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (b[a.to].type !== t) continue;
        if (sc <= 3 ? !(t === 'moon' || !CORE.includes(t)) : t !== 'sun') continue;
        if (!bm || b[a.to].pips < b[bm.to].pips) bm = a;
      }
      if (!bm) return null;
      const t = b[bm.to].type, nm = t === 'moon' ? '月' : t === 'sun' ? '太陽' : t;
      return opAct(bm, obs, `${tag}：SPに余裕がないので、太陽が${sc}個のうちに${nm}${b[bm.to].pips}どうしを合成（召喚はしない）`);
    }

    // 暗殺対面（このテストでは使わないので省略。ASN のときも通常の動き）
    function asnDecide(obs) { return null; }

    // ---------- テレポート（1.1.0） ----------
    const isTele = d => !!(d && d.type === 'teleport');
    const stored = d => (isTele(d) && d.state && d.state.stored) || 0;
    const teleFree = b => b.reduce((s, d) => s + (isTele(d) ? Math.max(0, ((d.state && d.state.cap) || d.pips * 5) - stored(d)) : 0), 0);
    const storedTotal = b => b.reduce((s, d) => s + stored(d), 0);
    // 活性が要るか（通常ウェーブ）
    function teleNeedAct(obs) {
      const es = obs.enemies.filter(e => !e.bossLike || e.kind === 'mid');
      if (es.some(e => e.pos >= O.dangerLine)) return 'danger';
      const zako = obs.enemies.filter(e => !e.bossLike && !e.marked).length;
      if (obs.wave >= O.fullFromWave && zako > teleFree(obs.board)) return 'full';
      if (obs.bossType === 'leon' && obs.timeLeft != null && obs.timeLeft <= O.activateLeft) return 'leon';
      return null;
    }
    // 送り：格納のあるテレポートを合成（格納の多い組から）。相方がいなければジョーカーでコピーして作る
    const teleRem = d => ((d.state && d.state.cap) || d.pips * 5) - stored(d);   // 残りの格納数
    const nearFull = d => isTele(d) && stored(d) > 0 && teleRem(d) < O.nearFull;
    function sendStep(obs, mode) {
      const b = obs.board;
      let bm = null, bs = 0;
      for (const a of obs.legal.acts) {
        if (a.result !== 'merge' || !isTele(b[a.from]) || !isTele(b[a.to])) continue;
        if (mode === 'near' && !((nearFull(b[a.from]) || nearFull(b[a.to])) && teleRem(b[a.from]) < O.pairFull && teleRem(b[a.to]) < O.pairFull)) continue;
        const v = stored(b[a.from]) + stored(b[a.to]);
        if (v > bs) { bm = a; bs = v; }
      }
      if (bm) return opAct(bm, obs, `ボス前の送り：テレポート${b[bm.from].pips}を合成（${bs}体を相手へ）`);
      let bc = null;
      for (const a of obs.legal.acts) {
        if (a.result !== 'copy' || !b[a.from] || b[a.from].type !== 'joker' || stored(b[a.to]) <= 0) continue;
        if (mode === 'near' && !nearFull(b[a.to])) continue;
        if (!bc || stored(b[a.to]) > stored(b[bc.to])) bc = a;
      }
      if (bc) return opAct(bc, obs, `ボス前の送り：ジョーカー${b[bc.from].pips}でテレポート（${stored(b[bc.to])}体）をコピーして相方を作る`);
      return null;
    }
    // 送るかどうか：null（送らない）／'all'（格納のあるテレポートを全部）／'near'（残りの格納数が少ないテレポートだけ）
    function wantSend(obs) {
      if (obs.phase !== 'wave' || obs.timeLeft == null) return null;
      const b = obs.board, tot = storedTotal(b);
      if (!tot) return null;
      const due = (n, k) => obs.timeLeft <= 0.1 * n + Math.ceil(k / 2) * O.sendOpTime + O.sendMargin ? true : false;
      const nT = b.filter(d => stored(d) > 0).length;
      if ((O.selfBosses || []).includes(obs.bossType)) return tot > O.selfMax && due(tot, nT) ? 'all' : null;   // 自爆（多すぎる分は送る）
      if ((O.sendBosses || []).includes(obs.bossType)) return due(tot, nT) ? 'all' : null;
      const near = b.filter(nearFull);
      if (!near.length) return null;                                                                     // 持ち越す
      // 送る見込みのテレポート：残りが少ないものと、それと組める（同じ出目で残りが pairFull 未満の）もの
      const sendable = b.filter(d => isTele(d) && stored(d) > 0 && teleRem(d) < O.pairFull && near.some(x => x !== d && x.pips === d.pips || x === d));
      return due(sendable.reduce((s, d) => s + stored(d), 0), sendable.length) ? 'near' : null;
    }
    // 出目上げ・テレポートづくりが止まったのに活性していたら、無理のない形で活性を切る
    function cutActive(obs) {
      if (!O.cutAct || obs.phase !== 'wave' || obs.wave < 2 || teleNeedAct(obs)) return null;
      const b = obs.board;
      if (!sunActive(b)) return null;   // 太陽が活性していなければ切る必要はない
      const merges = obs.legal.acts.filter(a => a.result === 'merge');
      if (obs.wave <= O.cutSunUntil) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of merges) if (b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `活性を切る：守りでない太陽${b[bs.to].pips}どうしを合成`);
        const gm0 = new Set(mainMoonCells(b, obs));
        let bm0 = null;
        if (moonActive(b)) for (const a of merges) if (b[a.from].type === 'moon' && b[a.to].type === 'moon' && !gm0.has(a.from) && !gm0.has(a.to) && (!bm0 || b[a.to].pips < b[bm0.to].pips)) bm0 = a;
        if (bm0) return opAct(bm0, obs, `活性を切る：守りでない月${b[bm0.to].pips}どうしを合成`);
        if (obs.legal.summon && b.some(d => !d)) return opSummon('活性を切る：召喚（太陽の個数をずらす）');
        return null;
      }
      if (!moonActive(b)) return null;
      const gm = new Set(mainMoonCells(b, obs));
      let bm = null;
      for (const a of merges) if (b[a.from].type === 'moon' && b[a.to].type === 'moon' && !gm.has(a.from) && !gm.has(a.to) && (!bm || b[a.to].pips < b[bm.to].pips)) bm = a;
      return bm ? opAct(bm, obs, `活性を切る：使わない月${b[bm.to].pips}どうしを合成`) : null;
    }
    // 1W成長連鎖
    function growthChain(obs) {
      if (obs.phase !== 'wave' || obs.wave > O.chainWaves) return null;
      if (obs.wave === 1 && S.w1GoWave !== 1) return null;   // W1は盤面を広げ始めてから
      if (!S.chainTried) S.chainTried = new Set();
      const b = obs.board;
      const gl = d => (d && d.type === 'growth' && d.state && d.state.growLeft != null) ? d.state.growLeft : null;
      const soon = b.map((d, i) => i).filter(i => gl(b[i]) != null && gl(b[i]) <= O.chainLeft);
      if (!soon.length) return null;
      if (b.some(d => gl(d) != null && gl(d) > O.chainLeft)) return null;   // ほかに成長がある
      const p = Math.min(...soon.map(i => b[i].pips));
      const ctl = obs.control || {};
      const busy = ctl.dragging || ctl.actReadyIn > 0;
      const tried = soon.some(i => S.chainTried.has(b[i].id));
      const lastMoment = Math.min(...soon.map(i => gl(b[i]))) <= O.chainCopyAt;
      const jokerCopy = () => {
        if (busy) return null;
        if (!tried && !lastMoment && obs.legal.summon && b.some(d => !d)) return null;   // まだ召喚を試せる
        const a = obs.legal.acts.find(x => x.result === 'copy' && b[x.from].type === 'joker' && b[x.to].type === 'growth' && b[x.from].pips === p);
        return a ? opAct(a, obs, `1W成長連鎖：ジョーカー${p}で成長をコピー`) : null;
      };
      if (p === 1) {
        if (obs.legal.summon && b.some(d => !d) && !lastMoment) { soon.forEach(i => S.chainTried.add(b[i].id)); return opSummon('1W成長連鎖：成長が出るまで召喚'); }
        return jokerCopy();
      }
      if (!busy) for (const t of ['sun', 'moon']) {
        const a = obs.legal.acts.find(x => x.result === 'merge' && b[x.from].type === t && b[x.to].type === t && b[x.to].pips === p - 1);
        if (a) { soon.forEach(i => S.chainTried.add(b[i].id)); return opAct(a, obs, `1W成長連鎖：${t === 'sun' ? '太陽' : '月'}${p - 1}どうしを合成（成長${p}を狙う）`); }
      }
      return jokerCopy();
    }
    // テレポートを出す：テレポートが少なく、ジョーカーでコピーできるテレポートもないとき、守りでないダイスどうしを合成
    function teleMake(obs) {
      if (obs.phase !== 'wave' || obs.wave < 2 || teleNeedAct(obs)) return null;
      const b = obs.board;
      if (count(b, 'teleport') >= O.teleMin) return null;
      const g = guard(obs, b);
      if (obs.legal.acts.some(a => a.result === 'copy' && !g.has(a.from) && b[a.to].type === 'teleport')) return null;
      let bm = null;
      for (const a of obs.legal.acts) {
        if (a.result !== 'merge' || g.has(a.from) || g.has(a.to)) continue;
        const t = b[a.from].type;
        if (t === 'teleport' || t === 'growth' || b[a.to].type !== t) continue;
        if (!bm || b[a.to].pips < b[bm.to].pips) bm = a;
      }
      return bm ? opAct(bm, obs, `テレポートを出す：守りでない${b[bm.to].type}${b[bm.to].pips}どうしを合成（テレポート${count(b, 'teleport')}個）`) : null;
    }
    function telePu(obs) {
      const d = obs.deck.find(x => x.type === 'teleport'); if (!d || d.puCost == null) return null;
      if (!(obs.legal.powerUp || []).includes('teleport')) return null;
      const b = obs.board;
      if (b.some(x => x && x.type === 'growth')) return null;   // 成長の連鎖が続いている間は上げない
      const tp = b.reduce((s, x) => s + (isTele(x) ? x.pips : 0), 0);
      if (tp < O.telePuPips) return null;
      let goal = tp >= O.telePuPips3 ? 3 : 2;
      if (obs.bossType === 'leon') goal = Math.min(goal, O.telePuLeon);
      if (d.lv >= goal) return null;
      if (obs.sp < d.puCost) return null;
      return { ops: [{ op: 'powerUp', type: 'teleport' }], more: true, note: `PU テレポート Lv${d.lv}→${d.lv + 1}` };
    }


    // ---------- 対面ごとの動き（1.7.0） ----------
    const busyNow = obs => { const c = obs.control || {}; return !!(c.dragging || c.actReadyIn > 0); };
    const teleMerges = obs => obs.legal.acts.filter(a => a.result === 'merge' && isTele(obs.board[a.from]) && isTele(obs.board[a.to]));
    // 核対面：相手のスライムが1つ目の角を越えたら、slimeGap 秒おきに送る
    function slimeSend(obs) {
      const op = obs.opponent;
      if (!op || op.phase !== 'boss' || !op.boss || op.boss.type !== 'slime') return null;
      const key = op.wave;
      if (S.slimeWave !== key) {
        if (!op.front || op.front.progress * 12 < O.slimeCorner) return null;
        S.slimeWave = key; S.slimeLast = -99;
        ctx.log(`核対面：相手のスライムが1つ目の角を越えた。${O.slimeGap}秒おきにテレポートを送る`);
      }
      if (!storedTotal(obs.board)) return null;
      if (obs.t - S.slimeLast < O.slimeGap - 1e-9) return null;
      if (busyNow(obs)) return 'wait';
      const r = sendStep(obs, 'all'); if (!r) return null;
      if (r.ops[0].expect === 'merge') { S.slimeLast = obs.t; r.note = r.note.replace('ボス前の送り', '相手のスライムに合わせた送り'); }
      else r.note = r.note.replace('ボス前の送り', '相手のスライムに合わせた送り');
      return r;
    }
    // ノーマル対面（W6以降）：通常の月太陽AI。ナイト・レオン前は、格納の入ったテレポートを合成できる組で送る
    function normalLate(obs) {
      if (obs.phase === 'wave' && obs.timeLeft != null && (O.normalSendBosses || []).includes(obs.bossType)) {
        const b = obs.board;
        const ms = teleMerges(obs).filter(a => stored(b[a.from]) + stored(b[a.to]) > 0);
        if (ms.length) {
          const cells = new Set(); for (const a of ms) { cells.add(a.from); cells.add(a.to); }
          let tot = 0, n = 0; for (const i of cells) if (stored(b[i]) > 0) { tot += stored(b[i]); n++; }
          if (obs.timeLeft <= 0.1 * tot + Math.ceil(n / 2) * O.sendOpTime + O.sendMargin) {
            if (busyNow(obs)) return null;
            let bm = null, bs = -1;
            for (const a of ms) { const v = stored(b[a.from]) + stored(b[a.to]); if (v > bs) { bm = a; bs = v; } }
            return opAct(bm, obs, `ノーマル対面：${obs.bossType === 'knight' ? 'ナイト' : 'レオン'}前の送り：テレポート${b[bm.from].pips}を合成（${bs}体を相手へ）`);
          }
        }
      }
      return NORMAL.decide(obs);
    }
    // 陰陽対面：出目 yyPips 以上のテレポートの組を守り、ナイトの出現演出の終わりで送る
    function yyPair(b) {
      let best = null;
      for (let i = 0; i < b.length; i++) for (let j = i + 1; j < b.length; j++) {
        const x = b[i], y = b[j];
        if (!isTele(x) || !isTele(y) || x.pips !== y.pips || x.pips < O.yyPips) continue;
        const k = x.pips * 1000 + stored(x) + stored(y);
        if (!best || k > best.k) best = { i, j, k };
      }
      return best;
    }
    function yyDecide(obs) {
      const b = obs.board, P = yyPair(b);
      if (P) {
        const tot = stored(b[P.i]) + stored(b[P.j]);
        const introEnd = obs.phase === 'intro' && obs.nextBoss && obs.nextBoss.type === 'knight' && obs.introLeft != null && obs.introLeft <= O.yyIntroLead;
        const missed = obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight' && !obs.boss.part && obs.boss.cast === 0;
        if (tot > 0 && (introEnd || missed) && S.yySentWave !== obs.wave) {
          if (busyNow(obs)) return null;
          const a = obs.legal.acts.find(x => x.result === 'merge' && ((x.from === P.i && x.to === P.j) || (x.from === P.j && x.to === P.i)));
          if (a) { S.yySentWave = obs.wave; return opAct(a, obs, `陰陽対面：ナイトの出現に合わせてテレポート${b[a.to].pips}の組を合成（${tot}体を相手へ）`); }
        }
        const danger = obs.enemies.some(e => (!e.bossLike || e.kind === 'mid') && e.pos >= O.dangerLine);
        if (!danger) {
          const o2 = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'merge' && [P.i, P.j].some(c => c === a.from || c === a.to))) }) });
          return NORMAL.decide(o2);
        }
      }
      return NORMAL.decide(obs);
    }

    function decideInner(obs) {
      if (obs.over) return null;
      const b = obs.board;
      const moonNextToSun = b.some((d, i) => d && d.type === 'moon' && d.pips >= O.moonAdjMin && NB[i].some(j => b[j] && b[j].type === 'sun'));
      const needMoon = obs.wave >= 3 && (!O.moonNeedsUse || b.some(d => d && d.type === 'moon' && d.pips >= 4)) && (!O.moonAdjMin || moonNextToSun);
      const front = obs.enemies.find(e => e.kind !== 'boss');
      const frontPos = front ? front.pos : 0;
      const moonStar = b.some(d => d && d.type === 'moon' && d.pips === 7);
      const starDone = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4));
      const otherStar = b.some(d => d && d.type !== 'moon' && d.pips === 7);
      const lead = obs.enemies.length ? obs.enemies[0].pos : 0;
      sunTargets = O.sevenTarget && lead >= 8.5 ? [4, 7] : [4];
      leadPos = lead;

      if (obs.wave !== S.wave) {
        S.wave = obs.wave; S.frozenWave = 0; S.weakWave = 0; S.judgedAt = -1;
        S.seen = new Set(); S.waveT0 = obs.t; S.cap = { dmg: 0, time: 0 }; S.prevHp = new Map(); S.prevT = null;
        S.spending = false;
      }
      track(obs);
      if (obs.boss) {
        if (S.bossSeen !== obs.boss.id) { S.bossSeen = obs.boss.id; S.eatKnight = S.knightPlanWave === obs.wave ? S.knightPlan : null; }
        S.bossElapsed = obs.boss.elapsed;
      } else if (S.bossSeen != null) { S.lastBossKill = S.bossElapsed; S.bossSeen = null; }

      if (O.w12GrowthAlways && obs.wave <= 2 && lead < O.earlyLine) {
        let bg = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `W${obs.wave}：2つ目の角を越えるまではジョーカー${b[bg.from].pips}で成長をコピー`);
      }

      const eatJudge = () => obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill || storedTotal(b) >= O.selfMin; // 格納があれば自爆のために受ける
      if (obs.phase === 'intro') {
        S.introWave = obs.wave;
        if (obs.nextBoss && obs.nextBoss.type === 'knight' && !starDone) {
          if (S.knightPlanWave !== obs.wave) {
            S.knightPlanWave = obs.wave; S.knightPlan = eatJudge();
            ctx.log(`ナイト：${S.knightPlan ? '受ける' : '受けない'}（演出中に判断。W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.knightPlan) return breakActive(obs) || idle('ナイトを受ける：演出中に活性を切った。スキルを待つ');
        }
        return pu(obs) || idle('ボス出現の演出');
      }

      if (obs.phase === 'boss' && obs.boss) {
        const B = obs.boss;
        if (B.type === 'knight' && !starDone) {
          if (S.eatKnight == null) {
            S.eatKnight = eatJudge();
            ctx.log(`ナイト：${S.eatKnight ? '受ける' : '受けない'}（W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.eatKnight && B.cast === 0) return (S.introWave === obs.wave && !isActive(b, needMoon) ? null : breakActive(obs)) || idle('ナイトを受ける：スキルを待つ');
          if (S.eatKnight && B.cast >= 1) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        }
        if (B.type === 'knight' && B.cast >= 1 && !isActive(b, needMoon)) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        if (!isActive(b, needMoon)) return repairDanger(obs, needMoon, 'ボス戦の立て直し') || idle('ボス戦：打てる立て直しなし');
        return pu(obs) || idle('ボス戦：活性を保って待つ');
      }
      if (obs.phase === 'cleanup') return repairDanger(obs, needMoon, 'ボス後の残りの立て直し') || pu(obs) || idle('ボス後の残りの敵を待つ');
      if (obs.phase !== 'wave') return pu(obs) || idle('ボス抽選・相手待ち');
      if (frontPos < 8.5) { const r = highJokerGrowthCopy(obs, moonStar); if (r) return r; }
      if (frontPos < O.prepLine) { const r = reservedGrowthCopy(obs); if (r) return r; }
      if (O.w1MoonMerge && obs.wave === 1 && frontPos >= O.prepLine) {
        const a = obs.legal.acts.find(x => x.result === 'merge' && b[x.from].type === 'moon' && b[x.to].type === 'moon' && b[x.to].pips === 1);
        if (a) return opAct(a, obs, 'W1：先頭が真ん中を越えたので出目1の月どうしを合成');
      }

      const need = teleNeedAct(obs);
      if (need) {
        const tag = { danger: '先頭が2つ目の角を越えた', full: '雑魚がテレポートの空きより多い', leon: 'レオン前' }[need] + '：活性';
        const r = frontPos >= 8.5 ? repairDanger(obs, needMoon, tag, true) : repair(obs, needMoon, tag, true, false, true);
        if (r) return r;
        if (isActive(b, needMoon)) return pu(obs) || idle(`${tag}：活性済み`);
        return idle(`${tag}：打てる立て直しなし`);
      }
      if (S.frozenWave === obs.wave && O.resumeGap > 0 && frontPos < O.prepLine - O.resumeGap && obs.wave >= 3) S.frozenWave = 0;
      if (S.frozenWave === obs.wave && O.alwaysBuildWave && obs.wave >= O.alwaysBuildWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        S.judgedAt = obs.t; S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave;
        ctx.log(`W${obs.wave}：押し返したので、火力に関係なく出目上げを再開`);
      }
      if (S.frozenWave === obs.wave && O.weakWave > 0 && obs.wave >= O.weakWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        const j = judgePower(obs);
        if (j) {
          S.judgedAt = obs.t;
          const msg = `火力の判定：実測${fmt(j.have)}/秒 必要${fmt(j.need)}/秒（W${obs.wave + 1}終盤の1体×到着${j.rate.toFixed(2)}体/秒×${O.weakMargin}）`;
          if (j.weak) {
            S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave;
            ctx.log(msg + '→ 足りないので作り込みを再開');
          } else ctx.log(msg + '→ 足りているので止めたまま');
        }
      }
      if (S.frozenWave === obs.wave) {
        const r = sunWaitFix(obs) || repair(obs, needMoon, '停止中の立て直し'); if (r) return r;
        if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '停止中', false); if (a) return a; }
        const why = S.judgedAt >= 0 ? '火力は足りている' : obs.wave >= O.weakWave && O.weakWave > 0 ? '押し返し待ち' : 'レーンの真ん中を越えた';
        return pu(obs) || idle(`停止中：活性を保ってSPを貯める（${why}）`);
      }
      if (S.weakWave === obs.wave && S.judgedAt >= 0 && frontPos > O.resumeLine) S.judgedAt = -1;

      if (obs.wave === 1) {
        const sc = count(b, 'sun');
        if (S.w1GoWave !== obs.wave && (frontPos >= O.w1GoLine || (obs.timeLeft != null && obs.timeLeft <= O.w1GoLeft) || (sc > 0 && !SUN_ALL.includes(sc)))) S.w1GoWave = obs.wave;
        const go = S.w1GoWave === obs.wave;   // 2つ目の角・残り35秒・太陽の活性が切れた、のどれかで広げ始める
        if (sc === 0 && !go) return obs.legal.summon ? opSummon('W1：太陽が出るまで召喚') : (w12SpFix(obs, 'W1') || idle('W1：SP待ち'));
        if (!go) return idle('W1：太陽1個で貯める（2つ目の角・残り35秒・太陽の活性が切れるまで）');
        return expand(obs, 'W1：盤面を広げる') || pu(obs) || idle('W1：2つ目の角まで広げて待つ');
      }
      if (obs.wave === 2) {
                if (obs.sp < costN(obs.summonCost, O.w2Spare)) return w12SpFix(obs, 'W2') || pu(obs) || idle(`W2：SPに余裕がない（召喚${O.w2Spare}回分未満）ので動かさない`);
        return expand(obs, 'W2：盤面を広げる') || pu(obs) || idle('W2：2つ目の角まで広げて待つ');
      }

      if (obs.wave >= 3 && obs.timeLeft != null && obs.timeLeft <= O.noBuildLeft) {
        const late = false; // 1.1.0：残り10秒の両活性はしない（レオンは teleNeedAct で）
        if (late && !isActive(b, needMoon)) return repair(obs, needMoon, `残り${O.activateLeft}秒：両活性`, true, false, true) || idle(`残り${O.activateLeft}秒：打てる立て直しなし`);
        return sunWaitFix(obs) || pu(obs, reserve5(obs)) || idle(late ? `残り${O.activateLeft}秒：両活性を保ってボスを待つ` : `残り${O.noBuildLeft}秒以下なので出目上げを始めない`);
      }

      const res = reserve5(obs);
      const weak = S.weakWave === obs.wave;
      const repair7 = tag => { if (!teleNeedAct(obs)) return null; over7Now = true; try { return repair(obs, needMoon, tag); } finally { over7Now = false; } };
      if (tsumi(obs, b)) return repair7('詰み：活性の立て直し') || pu(obs) || idle('詰み：作り込みをやめた');
      if (!weak && starDone && ['leon', 'knight'].includes(obs.bossType))
        return repair7('月の星（太陽隣接済み）：レオン・ナイト前の両活性') || pu(obs) || idle('月の星（太陽隣接済み）：レオン・ナイト前は動かさない（両活性済み）');
      if (!weak && obs.bossType === 'leon' && !(moonStar && !starDone) && isActive(b, needMoon) && S.lastBossKill <= O.leonIdleKill && obs.wave >= 3) return pu(obs) || idle('レオン前：火力に余裕があるので放置');
      if (!weak && obs.wave >= O.startWave && S.buildWave !== obs.wave && !(O.startOnce && S.started)) {
        if (obs.sp >= need10(obs)) { S.buildWave = obs.wave; S.started = true; S.spending = true; }
        else {
          // 1.1.0：出目上げ前の活性の立て直しはしない
          if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '出目上げ前', false); if (a && a.ops[0].op !== 'summon') return a; }
          return pu(obs, need10(obs)) || idle(`出目上げ：召喚${O.startSummons}回分のSPが貯まるまで始めない`);
        }
      }
      const urgency = Math.max(0, Math.min(1, (frontPos - (O.prepLine - 1.5)) / 1.5));
      return build(obs, weak ? '出目上げ（火力不足）' : '出目上げ', urgency)
        || (O.idleRepair && !isActive(b, needMoon) ? (O.idleRepair === true ? repairDanger : repair)(obs, needMoon, '出目上げの手がないので両活性に戻す') : null)
        || (obs.legal.summon && !canSummonBuild(obs) ? sunWaitFix(obs) : null)
        || pu(obs, res)
        || idle(obs.legal.summon && !canSummonBuild(obs) ? (O.summonHyst ? `出目上げ：召喚${O.startSummons}回分のSPがたまるまで召喚しない` : `出目上げ：召喚${O.keepSummons}回分のSPを貯金中`) : '出目上げ：良い手なし');
    }

    return {
      decide(obs) {
        if (obs.over) return null;
        if (MU === 'asn' || MU === 'fireflow') return NORMAL.decide(obs);
        if (MU === 'yinyang') return yyDecide(obs);
        if (MU === 'normal' && obs.wave >= O.normalFromWave) return normalLate(obs);
        if (SLIME) { const r = slimeSend(obs); if (r === 'wait') return null; if (r) return r; }
        { const r = growthChain(obs); if (r) return r; }
        const ctl0 = obs.control || {};
        { const mode = wantSend(obs);
          if (mode) {
            if (ctl0.dragging || ctl0.actReadyIn > 0) return null;
            const r = sendStep(obs, mode); if (r) return r;
          } }
        { const r = telePu(obs); if (r) return r; }
        // 格納の入ったテレポートは、送り以外では合成しない（合法手から外す）
        { const b0 = obs.board, noGrowCopy = obs.wave <= O.chainWaves;
          obs = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'merge' && (stored(b0[a.from]) > 0 || stored(b0[a.to]) > 0 || (isTele(b0[a.from]) && isTele(b0[a.to]))))
            && !(noGrowCopy && a.result === 'copy' && b0[a.to] && b0[a.to].type === 'growth')) }) }); }
        const savedPair = S.pair, savedFix = S.fixPair;
        let r;
        if (ASN) r = asnDecide(obs);
        else {
          r = decideInner(obs);
          if (!(r && r.ops && r.ops.length)) { const m = sun7Merge(obs) || sunIdleFix(obs); if (m) r = m; }
          if (!(r && r.ops && r.ops.length)) { const c = cutActive(obs) || teleMake(obs); if (c) r = c; }
        }
        if (O.mergeDir && r && r.ops && r.ops.length && r.ops[0].op === 'act' && r.ops[0].expect === 'merge' && !r.dirFixed) {
          const op = r.ops[0];
          const rev = obs.legal.acts.find(x => x.result === 'merge' && x.from === op.to && x.to === op.from);
          if (rev && cellRank(op.from) < cellRank(op.to)) {
            const P = S.pair, F = S.fixPair;
            r.ops[0] = Object.assign({}, op, { from: op.to, to: op.from, fromId: op.toId, toId: op.fromId });
            if (P && P.from === op.from && P.to === op.to) S.pair = Object.assign({}, P, { from: op.to, to: op.from, toId: op.fromId });
            if (F && F.from === op.from && F.to === op.to) S.fixPair = Object.assign({}, F, { from: op.to, to: op.from, toId: op.fromId, fromId: op.toId });
          }
        }
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pair = savedPair; S.fixPair = savedFix; return null; }
        if (r && r.ops && r.ops.length) S.idleReason = null;
        return r;
      },
    };
  },
});
})();
