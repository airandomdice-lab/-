// 赤ロイ基本AI（AI API v1）  RD.defineAgent('bloodsirius_royal', ...)
//   月太陽ロイヤル基本AI（moonsun_royal_ai1.8speed）の動きをもとに、月→ブラッドムーン（赤月）・太陽→シリウスに置き換えたもの
// デッキ前提：ブラッドムーン・シリウス・ロイヤル・成長・ジョーカー（総合環境 version:'mix' 専用。EXダイス）
//
// 1.1.2（2026-11-17）盤面の最高出目の赤月がシリウスに隣接していれば、出目3以下でも、その赤月と
//   隣の最高出目のシリウスを守る（合成・コピーの組・ロイヤル攻撃のたたみに使わない）（topPairGuard）。
//   ジョーカーで作った組を次の判断で合成するときも、そのときの守りに当たれば合成しない。
//   危ない場面（先頭が2つ目の角を越えた・ボス戦）で守りを外す立て直しは今までどおり
//
// 1.1.1（2026-11-17）星のジョーカー（出目7）はシリウスか赤月しかコピーしない（starJokerOnlyBS。合法手から外すので全場面に効く）
//
// 1.1.0（2026-11-17）序盤とPUをユーザーの手順に
//   ・W1：シリウスが3個になるまで召喚（埋まったらシリウス以外を合成して空ける）。そろったら2つ目の角まで貯める（w1SiriusN）。
//     「1つ目の角・35秒まで貯める」「角から盤面を広げる」はしない
//   ・赤月の活性は、シリウスに赤月が1個でも隣接しているときだけ求める（moonAdjMin 1・noMoonNeed false）
//   ・W2：残り40秒で止める判定と、SP待ちの立て直しの判定を「シリウスに隣接している出目2以上の赤月が活性しているか」に（w2BmGate）。
//     SP待ちで活性していなければ、合成だけでそろえる（召喚しない）
//   ・SP待ち：「シリウスが5個より多ければシリウスどうしを合成」をやめ、赤月が活性していなければたためる赤月どうしを合成
//     （シリウスに隣接していない赤月を優先、次に出目の低いもの）（waitBmFold）
//   ・PU：出目2以上の赤月と出目2以上のシリウスが隣接し、赤月が活性していれば、赤月をLv3 →（召喚5回分を残して）Lv5。シリウスのPUはその後（bmPuFirst・siriusPuLate）
//   試験：練習100試合 平均W16.3（1.0.0は17.1）、W2〜W4で終わる試合 6（1.0.0は8）。
//         月太陽AI（月クラス12・会心3000%）との対戦60試合 52勝8敗（1.0.0は48勝12敗）
//
// 1.0.0（2026-11-17）月太陽ロイヤル基本AIから変えたところ
//   ・活性の個数：赤月 2・3・5／シリウス 3・5・8（ctx.info.deck の activeCounts から）
//     立て直しの目標：シリウスは 3 か 5（siriusTargets）。赤月は 2・3・5 のどれか
//     「太陽が5個以上なら太陽どうしを合成」→「シリウスが目標の最大（5）より多ければシリウスどうしを合成」
//     「太陽が4個以下なら太陽どうしは合成しない」→「シリウスが5個以下なら合成しない」
//   ・W1〜W2：シリウス1個は活性しないが、月太陽の「太陽1つで止めて貯める」と同じく、1個で止めて貯めるのを許す（w12SiriusOne）
//   ・最高火力のシリウス：隣の赤月の倍率（活性時 攻撃回数×(1＋クラス÷20)×出目、攻撃力×出目）と、
//     シリウスの活性（攻撃速度2倍）、同じ敵への攻撃回数 m で 攻撃力×(1＋0.5×⌊(m−1)÷2⌋)（累積 ≈ N＋N²/8）で計算
//   ・作り込みの評価：赤月の価値 V(p)＝(1＋クラス÷20)×p×√p（攻撃回数の2乗と攻撃力の1乗が効く）
//   ・パワーアップ：シリウス（攻撃力+100/PU）を先に。赤月のPUはスプラッシュの半径だけなので、シリウスLv5の後・SPに余裕があるとき（bmPuGoal）
//   ・ナイトを受けるときの「活性を切る」：シリウスの個数が活性（3・5・8）でなくなる手
//   ・太陽7個の合成（sun7Merge）は切ってある
//   ・相手のデッキが赤ロイ（ブラッドムーン・シリウス）でも、両活性でないときはロイヤル攻撃をしない（oppMoonsunBoth を広げた）
//   ・赤月の活性は W2 から、隣接に関係なく求める（needMoonFrom 2・moonAdjMin 0）。赤月は2個で活性し、隣を何倍にもするので
//     （月太陽と同じ「W3から・隣の月の出目3以上」だと、シリウスだけでW3に止まってしまい、W3の負けが多かった）
//   ・作り込みの評価で、シリウスの隣の赤月を出目1から数える（evalMoonMin 1。月太陽は4）
//   ・W1〜W2のシリウス1個での待ちはしない（w12SiriusOne false。シリウス1個は活性しないので弱い）
//   ほかの判断（ロイヤル攻撃・相手の判定 D/R・ナイト・詰み・火力の判定・立て直しの手順）は月太陽ロイヤル基本AIと同じ
//
// 試験（シミュレータ4.3.4・総合環境・HP6.5.0・既定クラス〔伝説10〕）
//   練習100試合：平均W17前後（赤月のPUなしだと W10.6。スプラッシュの半径が大きく効く）。W2〜W4で終わる試合が約8%
//   対戦：月太陽AI（moonsun_ai_lite・月クラス12・会心3000%・判断0.5秒/操作0.3秒）に 48勝12敗（60試合。スキンなし）
//         ロイヤル攻撃を切っても 47勝13敗（この相手ではロイヤル攻撃はほとんど効いていない）
'use strict';

RD.defineAgent('bloodsirius_royal', {
  name: '赤ロイ基本AI',
  desc: 'ブラッドムーン・シリウス・ロイヤル・成長・ジョーカー（総合環境）。月太陽ロイヤル基本AIの動き（活性準備・出目上げ・隣接づくり・ロイヤル攻撃・ナイトの受け方）を、赤月（2・3・5で活性）とシリウス（3・5・8で活性）に合わせたもの。',
  limits: o => ({ interval: o.aiSpeed, actInterval: o.aiSpeed, summonInterval: o.aiSpeed, dragTime: o.aiSpeed }),
  options: {
    aiSpeed: 0.3,
    // ---- 赤ロイで追加 ----
    siriusTargets: [3, 5],  // シリウスの立て直しの目標の個数（活性は 3・5・8）
    w12SiriusOne: false,    // W1〜W2：シリウス1個でも止めて貯めてよい（月太陽の太陽1個と同じ扱い）
    bmPuAfter: 5,           // 赤月のPUを始めるシリウスのLv（下の bmPuFirst の後の、Lv5までのPU）
    bmPuFirst: 3,           // 出目2以上の赤月と出目2以上のシリウスが隣接し、赤月が活性していれば、まず赤月をこのLvまでPU（0で切る）
    siriusPuLate: true,     // シリウスのPUは後回し（赤月のPUが終わってから。false＝赤月Lv3の後すぐシリウスLv3）
    topPairGuard: true,     // 盤面の最高出目の赤月がシリウスに隣接していれば、その赤月と隣の最高出目のシリウスは出目3以下でも潰さない
    starJokerOnlyBS: true,  // 星のジョーカー（出目7）はシリウスか赤月しかコピーしない（どの場面でも）
    w1SiriusN: 3,           // W1：シリウスがこの数になるまで召喚して、そろったら貯める（0で切る＝前の動き）
    w1Pu: false,            // W1：シリウスがそろって貯めている間もPUする
    w2BmGate: true,         // W2：止める・SP待ちの判定を「シリウスに隣接している出目2以上の赤月が活性しているか」で行う
    waitBmFold: true,       // SP待ち：赤月が活性していなければ、たためる赤月どうしを合成（シリウスに隣接していないもの優先、次に出目の低いもの）
    waitSiriusFold: false,  // SP待ち：シリウスが5個より多ければシリウスどうしを合成（前の動き）
    bmPuGoal: 5,            // シリウスLv5の後、赤月をこのLvまでPU（スプラッシュの半径。召喚5回分のSPを残して）
    // ---- ロイヤル攻撃 ----
    royalAttack: true,
    royalFromWave: 5,
    royalStartMax: 45,
    royalStartMin: 15,
    royalStartSummons: 10,
    royalStopSummons: 5,
    oppFrontLine: 3.5,
    royalSummon: true,
    dSkip: 5,
    dWindow: 5,
    stopPastPos: 8.5,
    reachCheck: true,
    normalSpeed: 0.6,
    knightRoyal: true,
    knightRoyalLeft: 5,
    knightRoyalMaxFront: 8.5,
    repairLastResort: true,
    repairJokerFallback: true,
    starIdleUntil: { '6.0.5': 10, '6.5.0': 8 },
    growthPairLine: 8.5,
    oppMoonsunBoth: true,
    oppMoonPipsMin: 5,
    oppMoonPipsUntil: 19,
    oppMoonSpdMin: 0.90,
    starGuardOnly: true,
    starStopsBuild: true,
    moonAdjMin: 1,          // シリウスに隣接している赤月にこの出目以上がなければ赤月の活性は求めない（0で切る＝いつも求める。月太陽は3）
    noMoonNeed: false,      // 盤面に赤月が1つもないときも赤月の活性を求める（前の動き）
    needMoonFrom: 2,        // このウェーブから赤月の活性も求める（月太陽はW3。赤月は2個で活性し、隣を何倍にもするので早くから）
    overMoonPenalty: false, // 作り込みの評価で、赤月が5個より多い盤面は赤月を非活性として数える（作りすぎない）
    evalMoonMin: 1,         // 作り込みの評価で、シリウスの隣の赤月をこの出目から数える（月太陽は4）
    sun7MergeWave: 0,
    sun7Summons: 5,
    sunIdleFromWave: 3,
    w12GrowthAlways: true,
    w12SpFix: true,
    sunIdleFix: true,
    // ---- 月太陽AIから ----
    prepLine: 6.0,
    earlyLine: 8.5,
    corner1: 3.5,
    w1GoLeft: 55,
    w2Spare: 3,
    tsumiLimit: 5,
    horizon: 10,
    leonIdleKill: 2.0,
    knightEatKill: 3.0,
    puReserve: 0,
    growthW: 2.5,
    keepJokers: 2,
    growthFirst: true,
    resumeGap: 0,
    weakWave: 5,
    resumeLine: 3.5,
    weakMargin: 1.0,
    capMinTime: 3,
    startSummons: 10,
    startWave: 3,
    keepSummons: 5,
    pairFallback: 'copy',
    pairUseReserved: false,
    pairOnlyFull: true,
    w12GrowthCopy: true,
    dangerRelax: true,
    idleRepair: false,
    starSunMin: 3,
    topSunMode: 'potential',
    fpMoonGuard: false,
    growthMergeLine: 8.5,
    noBuildLeft: 15,
    activateLeft: 10,
    jokerLast: true,
    repairMode: 'simple',
    lowSummons: 5,
    sevenTarget: false,
    moonNeedsUse: false,
    simpleDangerOld: true,
    startOnce: false,
    summonHyst: true,
    over7: false,
    highJokerGrowth: 4,
    sunWaitFix: true,
    knightRules: true,
    pairMaxUrg: 1,
  },

  create(ctx) {
    const O = ctx.options;
    const NB = ctx.info.board.neighbors;
    const INFO = {};
    for (const d of ctx.info.deck) INFO[d.type] = d;
    const DECK = ctx.info.deck.map(d => d.type);
    const CD = (ctx.info.cfg && ctx.info.cfg.cd) || 2000;
    const BASE_CRIT = ctx.info.baseCrit || 0.05;
    const MOON = 'bloodmoon', SUN = 'sirius';   // 月→赤月、太陽→シリウス
    const SUN_OK = (INFO[SUN] && INFO[SUN].activeCounts) || [3, 5, 8];
    const MOON_OK = (INFO[MOON] && INFO[MOON].activeCounts) || [2, 3, 5];
    const MOON_MAX = Math.max(...MOON_OK);
    const SUN_T = (O.siriusTargets || [3, 5]).slice();
    const SUN_MAXT = Math.max(...SUN_T), SUN_MINT = Math.min(...SUN_T), SUN_TOP = Math.max(...SUN_OK);
    // W1〜W2：シリウス1個で止めてよい
    const earlyOk = (sc, wave) => SUN_OK.includes(sc) || (O.w12SiriusOne && wave <= 2 && sc === 1);
    let sunTargets = SUN_T;
    let over7Now = false;
    let dangerNow = false;
    let leadPos = 0;
    let banPairs = null;
    const banned = (b, a) => !!(banPairs && b[a.from] && b[a.to] && b[a.from].type === b[a.to].type && banPairs.has(b[a.from].type));
    const jokerPair = (b, a) => b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === 'joker';
    const isGrowthPair = (b, a) => !!(b[a.from] && b[a.from].type === 'growth' && b[a.to] && b[a.to].type === 'growth');
    const growthOkInRepair = activation => !activation || leadPos >= O.growthMergeLine;
    const NM = { [MOON]: '赤月', [SUN]: 'シリウス', royal: 'ロイヤル', growth: '成長', joker: 'ジョーカー' };
    const nm = t => NM[t] || t;

    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);

    const S = {
      wave: 0, frozenWave: 0, lastBossKill: 99, bossSeen: null, bossElapsed: 0, eatKnight: null, idleReason: null,
      buildWave: 0, started: false, spending: false, pair: null, fixPair: null, weakWave: 0, judgedAt: -1,
      prevHp: new Map(), prevT: null, prevLife: null, cap: { dmg: 0, time: 0 }, seen: new Set(), waveT0: 0, judgeOk: false,
      royal: { started: false, stopped: false, gaveUp: false }, firedWave: 0, fHist: [],
    };

    // ---------- 盤面の道具 ----------
    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const dist = (c, set) => Math.min(...set.map(x => Math.abs(c - x)));
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };
    const clsOf = t => (INFO[t] && INFO[t].cls) || 10;

    // 赤月の攻撃回数の倍率：非活性 ×出目、活性 ×(1＋クラス÷20)×出目
    const bmMult = (pips, active) => (active ? 1 + clsOf(MOON) / 20 : 1) * pips;
    function mainMoon(b) {
      let best = null;
      b.forEach((d, i) => { if (d && d.type === MOON && (!best || d.pips > best.pips)) best = { i, pips: d.pips }; });
      return best;
    }
    function mainMoonCells(b, obs) {
      const m = mainMoon(b); if (!m) return [];
      const out = new Set([m.i]);
      let bs = -1;
      b.forEach((d, i) => {
        if (!d || d.type !== MOON || d.pips !== m.pips) return;
        const sc = NB[i].reduce((a, j) => a + (b[j] && b[j].type === SUN ? b[j].pips * b[j].pips : 0), 0);
        if (sc > bs) { bs = sc; out.clear(); out.add(i); }
      });
      if (obs) {
        const t = topSun(obs, b);
        if (t >= 0) {
          let sup = -1;
          for (const j of NB[t]) if (b[j] && b[j].type === MOON && (sup < 0 || b[j].pips > b[sup].pips)) sup = j;
          if (sup >= 0) out.add(sup);
        }
      }
      return [...out];
    }
    // シリウスの攻撃力（クラス10で100、クラス+10、PU+100）
    const siriusAtk = obs => 70 + 10 * (clsOf(SUN) - 7) + 100 * (lv(obs, SUN) - 1);
    // 同じ敵への N 発の累積倍率：Σ(1＋0.5×⌊(m−1)÷2⌋) ≈ N＋N²/8
    const stackHits = N => N + N * N / 8;
    // シリウス1つの火力（今のバフで。horizon秒撃ち続けたときの累積の目安）
    function sunPower(obs, d, b) {
      const act = SUN_OK.includes(count(b, SUN));
      const buf = d.buffs || { spd: 0, atk: 0, crit: BASE_CRIT };
      const iv = 1.2 / (act ? 2 : 1) / d.pips * (1 - Math.min(0.95, buf.spd || 0));
      const N = O.horizon / iv;
      const crit = buf.crit || BASE_CRIT;
      return stackHits(N) * siriusAtk(obs) * (1 + (buf.atk || 0)) * Math.max(1, buf.bmAtk || 1) * ((1 - crit) + crit * CD / 100);
    }
    // シリウス1つの火力（両活性の後の見込み）：隣の赤月のうち出目が最大のものから受けるとして
    function sunPotential(obs, b, i) {
      const d = b[i];
      let mp = 0;
      for (const j of NB[i]) if (b[j] && b[j].type === MOON) mp = Math.max(mp, b[j].pips);
      const mult = mp ? Math.max(1, bmMult(mp, true)) : 1;
      const iv = 1.2 / 2 / d.pips / mult;
      const N = O.horizon / iv;
      return stackHits(N) * siriusAtk(obs) * (mp || 1) * ((1 - BASE_CRIT) + BASE_CRIT * CD / 100);
    }
    function topSun(obs, b) {
      let best = -1, bp = -1;
      b.forEach((d, i) => { if (d && d.type === SUN) { const p = O.topSunMode === 'observed' ? sunPower(obs, d, b) : sunPotential(obs, b, i); if (p > bp) { bp = p; best = i; } } });
      return best;
    }
    const starCells = b => b.map((d, i) => (d && d.type === MOON && d.pips === 7 ? i : -1)).filter(i => i >= 0);
    function starTopSun(b) {
      let best = -1;
      for (const s of starCells(b)) for (const j of NB[s]) if (b[j] && b[j].type === SUN && (best < 0 || b[j].pips > b[best].pips)) best = j;
      return best;
    }
    const starMode = b => !!O.starGuardOnly && starCells(b).length > 0;
    // 最高出目の赤月がシリウスに隣接していれば、その赤月と、その赤月に隣接するシリウスのうち最高出目のもの（出目に関係なく守る）
    //   最高出目の赤月が複数あれば、隣のシリウスの出目が高いほう。シリウスに隣接していなければ守らない
    function topPair(b) {
      if (!O.topPairGuard) return null;
      const m = mainMoon(b); if (!m) return null;
      let best = null;
      b.forEach((d, i) => {
        if (!d || d.type !== MOON || d.pips !== m.pips) return;
        for (const j of NB[i]) if (b[j] && b[j].type === SUN && (!best || b[j].pips > b[best.s].pips)) best = { m: i, s: j };
      });
      return best;
    }
    function protectedSuns(obs, b, forTsumi = false) {
      if (starMode(b)) { const t = starTopSun(b); return new Set(t >= 0 ? [t] : []); }
      const set = new Set();
      const tp = topPair(b); if (tp) set.add(tp.s);
      const t = topSun(obs, b); if (t >= 0) set.add(t);
      const m = mainMoon(b);
      if (m && m.pips >= 4) for (const mi of mainMoonCells(b, obs)) for (const j of NB[mi]) {
        const d = b[j]; if (d && d.type === SUN && d.pips >= 4) set.add(j);
      }
      if (!forTsumi) b.forEach((d, i) => { if (d && d.type === MOON && d.pips === 7) for (const j of NB[i]) if (b[j] && b[j].type === SUN && b[j].pips >= O.starSunMin) set.add(j); });
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
    function guardMoons(obs, b) {
      if (starMode(b)) return starCells(b);
      const m = mainMoon(b);
      const out = m && m.pips >= 4 ? mainMoonCells(b, obs) : [];
      const tp = topPair(b); if (tp && !out.includes(tp.m)) out.push(tp.m);
      return out;
    }
    function guard(obs, b) {
      const g = protectedSuns(obs, b);
      for (const i of guardMoons(obs, b)) g.add(i);
      const sunPips = new Set(b.filter(d => d && d.type === SUN).map(d => d.pips));
      for (const i of reservedJokers(b, O.keepJokers, obs.wave <= 2 ? sunPips : null)) g.add(i);
      return g;
    }
    function tsumi(obs, b) {
      const s = protectedSuns(obs, b, true);
      b.forEach((d, i) => { if (d && d.pips === 7) s.add(i); });
      return s.size > O.tsumiLimit;
    }

    // ---------- 盤面の評価（作り込み用） ----------
    // 赤月の価値 V(p)＝活性時の攻撃回数の倍率×√(攻撃力の倍率)。シリウスの累積は回数の2乗・攻撃力の1乗で効く
    const Vm = p => bmMult(p, true) * Math.sqrt(p);
    function evalBoard(obs, b, urgency) {
      const m = mainMoon(b);
      const mp = m ? m.pips : 0;
      // 赤月が活性の最大（5個）より多いと、合成で減らすしかなく活性に戻しにくい：非活性の倍率（×出目だけ）で数える
      const Vx = O.overMoonPenalty && count(b, MOON) > MOON_MAX ? (p => p) : Vm;
      let v = 0;
      if (mp >= O.evalMoonMin) v += 2 * Vx(mp) * Vx(mp) / 8;
      else if (mp > 0) v += 1.5 * mp * mp;
      b.forEach((d, i) => {
        if (!d || d.type !== SUN) return;
        let best = 0;
        for (const j of NB[i]) if (b[j] && b[j].type === MOON && b[j].pips >= O.evalMoonMin) best = Math.max(best, b[j].pips);
        if (best) { const V = Vx(best); v += V * V / 8 * d.pips * d.pips * (d.pips >= 4 ? 1 : 0.3); }
        else v += 0.5 * d.pips * d.pips;
      });
      for (const d of b) {
        if (!d) { v += 0.4; continue; }
        v += 0.3 * Math.pow(2, d.pips - 1) * (1 + 0.15 * (d.pips - 1));
        if (d.type === 'growth' && d.pips < 7) v += O.growthW * Math.pow(2, d.pips - 1);
      }
      return v;
    }
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));

    // ---------- 操作の候補 ----------
    function mergeCands(obs, g) { return obs.legal.acts.filter(a => a.result === 'merge' && !g.has(a.from) && !g.has(a.to)); }
    function copyCands(obs) { return obs.legal.acts.filter(a => a.result === 'copy'); }
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });

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

    // ---------- 活性 ----------
    function actDist(b, needMoon) {
      const sc = count(b, SUN);
      const tg = sc > SUN_TOP && (O.over7 || over7Now) ? sunTargets.concat([SUN_TOP]) : sunTargets;
      const ds = SUN_OK.includes(sc) ? 0 : dist(sc, tg);
      return ds + (needMoon ? dist(count(b, MOON), MOON_OK) : 0);
    }
    function isActive(b, needMoon) { return actDist(b, needMoon) === 0; }
    function copiesOn(b) {
      const out = [];
      b.forEach((a, i) => { if (a && a.type === 'joker') b.forEach((c, j) => { if (c && c.type !== 'joker' && c.pips === a.pips) out.push({ from: i, to: j, result: 'copy' }); }); });
      return out;
    }
    const isBS = t => t === SUN || t === MOON;
    function repairSimple(obs, needMoon, tag, relax, activation) {
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const cur = f1(b);
      if (cur === 0) return null;
      const sc = count(b, SUN), mc = count(b, MOON);
      const sunOk = SUN_OK.includes(sc), moonOk = !needMoon || MOON_OK.includes(mc);
      const full = !b.some(d => !d);
      const low = !obs.legal.summon || obs.sp < costN(obs.summonCost, O.lowSummons);
      const jokerOk = low && (sunOk || moonOk);
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      if (!relax) for (const i of guardMoons(obs, b)) g2.add(i);
      const merges = obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !jokerPair(b, a) && !banned(b, a) && (!isGrowthPair(b, a) || growthOkInRepair(activation)));
      if (jokerOk) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (!isBS(b[a.to].type)) continue;
          const v = f1(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `${tag}：SPが少なく片方が活性しているので、ジョーカーで${nm(b[bc.a.to].type)}をそろえる`);
      }
      // シリウスが目標の最大より多い：シリウスどうしを合成（出目の低い組から）
      if (!sunOk && sc > SUN_MAXT) {
        let bs = null;
        for (const a of merges) if (b[a.from].type === SUN && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `${tag}：シリウスが${sc}個なのでシリウスどうしを合成`);
      }
      if (!full && obs.legal.summon) return opSummon(`${tag}：召喚`);
      let bm = null;
      for (const a of merges) {
        if (b[a.from].type === SUN && sc <= SUN_MAXT) continue;
        const r = distMerge(b, a, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        const scv = r.e - r.p0;
        if (!bm || scv < bm.sc - 1e-9 || (Math.abs(scv - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc: scv };
      }
      if (bm) return opAct(bm.a, obs, `${tag}：合成`);
      if (full && obs.legal.summon) {
        let bz = null;
        for (const a of merges) {
          if (isBS(b[a.from].type)) continue;
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
      return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${nm(b[bf.a.to].type)}${b[bf.a.to].pips}）`) : null;
    }
    function repairFallback(obs, needMoon, tag, activation) {
      const b = obs.board;
      if (!O.repairJokerFallback || isActive(b, needMoon)) return null;
      if (S.fixPair) {
        const P = S.fixPair; S.fixPair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to] && b[x.to].id === P.toId && b[x.from] && b[x.from].id === P.fromId);
        const tp = O.topPairGuard ? topPair(b) : null;
        if (a && !banned(b, a) && !(tp && [tp.m, tp.s].some(x => x === a.from || x === a.to))) return opAct(a, obs, `${tag}：ジョーカーで作った組を合成（${nm(b[a.to].type)}${b[a.to].pips}）`);
      }
      const sc = count(b, SUN);
      if (!SUN_OK.includes(sc)) {
        let bc = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === SUN && SUN_OK.includes(count(applyCopy(b, a), SUN)) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
        if (bc) return opAct(bc, obs, `${tag}：手がないので、ジョーカー${b[bc.from].pips}でシリウスだけ活性させる`);
      }
      const g = guard(obs, b);
      const rank = t => (t === 'royal' ? 0 : 1);
      let bp = null;
      for (const a of copyCands(obs)) {
        if (b[a.from].type !== 'joker' || g.has(a.to)) continue;
        const t = b[a.to].type;
        if (isBS(t) || t === 'joker') continue;
        if (t === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        if (!bp || rank(t) < rank(b[bp.to].type) || (rank(t) === rank(b[bp.to].type) && b[a.to].pips < b[bp.to].pips)) bp = a;
      }
      if (!bp) return lastResort(obs, tag);
      S.fixPair = { from: bp.from, to: bp.to, fromId: b[bp.from].id, toId: b[bp.to].id };
      return opAct(bp, obs, `${tag}：手がないので、ジョーカー${b[bp.from].pips}で${nm(b[bp.to].type)}${b[bp.to].pips}をコピーして組を作る（次に合成）`);
    }
    function lastResort(obs, tag) {
      if (!O.repairLastResort) return null;
      const b = obs.board;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`${tag}：手がないので召喚`) : null;
      const g = guard(obs, b);
      const rank = t => (t === 'royal' ? 0 : 1);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (isBS(t) || banned(b, a)) continue;
        if (!bm || rank(t) < rank(b[bm.from].type) || (rank(t) === rank(b[bm.from].type) && b[a.to].pips < b[bm.to].pips)) bm = a;
      }
      return bm ? opAct(bm, obs, `${tag}：手がないので${nm(b[bm.to].type)}${b[bm.to].pips}どうしを合成してマスを空ける`) : null;
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
        for (const a of copiesOn(nb)) if (isBS(nb[a.to].type)) m = Math.min(m, f(applyCopy(nb, a), depth - 1));
        return m;
      };
      if (f1(b) === 0) return null;
      const copies = urgent ? copyCands(obs).filter(a => isBS(b[a.to].type)) : [];
      for (const a of copies) if (f1(applyCopy(b, a)) === 0) return opAct(a, obs, `${tag}：コピーで活性`);
      const cands = [];
      if (obs.legal.summon) { const r = distSummon(b, f); if (r) cands.push(Object.assign(r, { pr: 0, r: opSummon(`${tag}：召喚`) })); }
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      if (!relax) for (const i of guardMoons(obs, b)) g2.add(i);
      if (!relax && O.fpMoonGuard) b.forEach((d, i) => { if (d && d.type === MOON && NB[i].some(j => b[j] && b[j].type === SUN && b[j].pips >= 4)) g2.add(i); });
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !banned(b, a) && (!isGrowthPair(b, a) || growthOkInRepair(activation))))
        cands.push(Object.assign(distMerge(b, a, f), { pr: b[a.from].type === MOON ? 0.5 : 1, r: opAct(a, obs, `${tag}：合成`) }));
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
        return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${nm(b[bf.a.to].type)}${b[bf.a.to].pips}）`) : null;
      }
      good.forEach(c => { c.score = c.e - c.p0; });
      good.sort((x, y) => (x.score - y.score) || (x.pr - y.pr));
      const best = good[0];
      if (best.pr === 2) { const alt = good.find(c => c.pr < 2 && c.score <= best.score + 1e-9); if (alt) return alt.r; }
      return good[0].r;
    }

    // 活性を切る（ナイトを受けるため）：シリウスの個数が活性でなくなる手
    function breakActive(obs) {
      const b = obs.board, sc = count(b, SUN);
      if (!SUN_OK.includes(sc)) return null;
      for (const a of copyCands(obs)) {
        if (!SUN_OK.includes(count(applyCopy(b, a), SUN))) return opAct(a, obs, 'ナイトを受ける：活性を切る（コピー）');
      }
      if (!SUN_OK.includes(sc - 2) && !SUN_OK.includes(sc - 1)) {
        const ps = protectedSuns(obs, b);
        for (const a of obs.legal.acts.filter(a => a.result === 'merge' && b[a.from].type === SUN && !ps.has(a.from) && !ps.has(a.to)))
          return opAct(a, obs, 'ナイトを受ける：活性を切る（シリウスどうしを合成）');
      }
      if (obs.legal.summon) return opSummon('ナイトを受ける：活性を切る（召喚）');
      return null;
    }

    // ---------- より高い赤月への隣接づくり ----------
    function seekAdjacency(obs, g, tag, inBuild) {
      const b = obs.board;
      const m = mainMoon(b); if (!m || m.pips < 4) return null;
      const t = topSun(obs, b);
      let support = 0;
      if (t >= 0) for (const j of NB[t]) if (b[j] && b[j].type === MOON) support = Math.max(support, b[j].pips);
      if (m.pips <= support) return null;
      const targets = b.map((d, i) => (d && d.type === MOON && d.pips === m.pips ? i : -1)).filter(i => i >= 0);
      if (targets.some(i => NB[i].some(j => b[j] && b[j].type === SUN && b[j].pips >= 4))) return null;
      const adj = new Set(); for (const i of targets) for (const j of NB[i]) adj.add(j);
      const note = s => `${tag}：赤月${m.pips}の隣にシリウスを作る（${s}）`;
      let bc = null;
      for (const a of copyCands(obs)) if (adj.has(a.from) && b[a.to].type === SUN && (!bc || b[a.from].pips > b[bc.from].pips)) bc = a;
      if (bc) return opAct(bc, obs, note('コピー'));
      if ((inBuild ? canSummonBuild(obs) : obs.legal.summon) && [...adj].some(j => !b[j])) return opSummon(note('召喚'));
      let bm = null;
      for (const a of mergeCands(obs, g)) if (adj.has(a.to) && b[a.to].type !== MOON && !isGrowthPair(b, a) && (!bm || b[a.to].pips > b[bm.to].pips)) bm = a;
      if (bm) return opAct(bm, obs, note('合成'));
      for (const a of mergeCands(obs, g)) if (adj.has(a.from) && !adj.has(a.to) && !isBS(b[a.from].type) && !isGrowthPair(b, a)) return opAct(a, obs, note('隣を空ける'));
      return null;
    }

    // ---------- SPの貯金 ----------
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

    // ---------- 作り込み ----------
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
        if (a && !(O.topPairGuard && (g.has(a.from) || g.has(a.to)))) return opAct(a, obs, `${tag}：作った組を合成（${nm(b[a.to].type)}${b[a.to].pips}）`);
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
        if (early && b[a.from].type === SUN) continue;
        if (isGrowthPair(b, a)) continue;
        if (O.jokerLast && jokerPair(b, a)) continue;
        const e = expMerge(obs, b, a, ev) - base;
        if (e > 0 && (full || (!early && e >= 5)) && (!best || e > best.e)) best = { a, e };
      }
      const ts = topSun(obs, b);
      const supPips = ts < 0 ? 0 : Math.max(0, ...NB[ts].map(j => (b[j] && b[j].type === MOON ? b[j].pips : 0)));
      let bestC = null;
      for (const a of copyCands(obs)) {
        if (g.has(a.from)) continue;
        const tt = b[a.to].type;
        if (![SUN, MOON, 'growth'].includes(tt)) continue;
        if (early && tt === SUN) continue;
        if (tt === MOON && !(ts >= 0 && NB[ts].includes(a.from) && b[a.from].pips >= 4 && b[a.from].pips > supPips)) continue;
        const e = ev(applyCopy(b, a)) - base;
        if (e > 0 && (!bestC || e > bestC.e)) bestC = { a, e };
      }
      if (bestC && (!best || bestC.e > 2 * best.e)) return opAct(bestC.a, obs, `${tag}：コピー→${nm(b[bestC.a.to].type)}（評価+${bestC.e.toFixed(1)}）`);
      if (best) return opAct(best.a, obs, `${tag}：合成（評価+${best.e.toFixed(1)}）`);
      const PF = O.pairFallback === true ? 'copy' : O.pairFallback;
      const pfOk = (!O.pairOnlyFull || full) && urgency <= O.pairMaxUrg;
      if (pfOk && (PF === 'copy' || PF === 'both')) {
        let bp = null;
        for (const a of copyCands(obs)) {
          if (g.has(a.to)) continue;
          if (g.has(a.from) && !O.pairUseReserved) continue;
          if (early && b[a.to].type === SUN) continue;
          if (b[a.to].type === 'growth') continue;
          const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
          if (e > 0 && (!bp || e > bp.e)) bp = { a, e };
        }
        if (bp) { S.pair = { from: bp.a.from, to: bp.a.to, toId: obs.board[bp.a.to].id };
          return opAct(bp.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${nm(b[bp.a.to].type)}${b[bp.a.to].pips}）`); }
      }
      if (O.jokerLast && full) {
        const jp = obs.legal.acts.filter(a => a.result === 'merge' && jokerPair(b, a));
        if (jp.length) {
          const inPair = new Set(); for (const a of jp) { inPair.add(a.from); inPair.add(a.to); }
          let bc = null;
          for (const a of copyCands(obs)) {
            if (!inPair.has(a.from) || g.has(a.to)) continue;
            const tt = b[a.to].type;
            if (tt === 'growth' || (early && tt === SUN)) continue;
            const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
            if (!bc || e > bc.e) bc = { a, e };
          }
          if (bc) { S.pair = { from: bc.a.from, to: bc.a.to, toId: obs.board[bc.a.to].id };
            return opAct(bc.a, obs, `${tag}：ジョーカーどうししかないので、片方で${nm(b[bc.a.to].type)}${b[bc.a.to].pips}をコピーして合成する`); }
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

    // ---------- 火力の判定（W5以降） ----------
    function track(obs) {
      if (obs.wave !== S.wave) return;
      const now = new Map();
      for (const e of obs.enemies) if (!e.bossLike) { now.set(e.id, e.hp); if (!S.seen.has(e.id)) S.seen.add(e.id); }
      if (obs.phase === 'wave' && S.frozenWave === obs.wave && S.prevT != null && obs.life === S.prevLife) {
        let d = 0;
        for (const [id, hp] of S.prevHp) { const h = now.get(id); d += h == null ? hp : Math.max(0, hp - h); }
        S.cap.dmg += d; S.cap.time += obs.t - S.prevT;
      }
      S.prevHp = now; S.prevT = obs.t; S.prevLife = obs.life;
    }
    function judgePower(obs) {
      if (S.cap.time < O.capMinTime) return null;
      const have = S.cap.dmg / S.cap.time;
      const el = Math.max(1, obs.t - S.waveT0);
      const rate = S.seen.size / el;
      const w = obs.wave + 1;
      const need = tableHP(w, waveK(w)) * rate * O.weakMargin;
      return { weak: have < need, have, need, rate };
    }
    const fmt = n => (n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : Math.round(n) + '');

    // ---------- パワーアップ ----------
    // シリウス（攻撃力+100/PU）を先に。赤月のPUはスプラッシュの半径だけなので、シリウスLv5の後に余ったSPで
    function powerUp(obs, reserve = 0) {
      const b = obs.board;
      const can = new Set(obs.legal.powerUp || []);
      const cost = t => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
      const ok = t => can.has(t) && obs.sp - cost(t) >= Math.max(O.puReserve, reserve);
      const m = mainMoon(b);
      // 出目2以上の赤月と出目2以上のシリウスが隣接していて、赤月が活性：まず赤月を bmPuFirst まで
      const bmFire = bmAdj(b, 2, 2) && bmActive(b);
      if (O.bmPuFirst && bmFire && lv(obs, MOON) < O.bmPuFirst && ok(MOON)) return MOON;
      if (O.siriusPuLate && bmFire && O.bmPuGoal && lv(obs, MOON) < O.bmPuGoal && ok(MOON) && obs.sp - cost(MOON) >= costN(obs.summonCost, O.keepSummons)) return MOON;
      if (lv(obs, SUN) < 3 && ok(SUN)) return SUN;
      if (lv(obs, SUN) >= O.bmPuAfter && O.bmPuGoal && lv(obs, MOON) < O.bmPuGoal && ok(MOON) && obs.sp - cost(MOON) >= costN(obs.summonCost, O.keepSummons)) return MOON;
      if (m && m.pips >= 4 && lv(obs, SUN) < 5 && ok(SUN)) return SUN;
      if (m && m.pips >= 4)
        for (const t of DECK) if (![MOON, SUN, 'growth', 'joker', 'royal'].includes(t) && lv(obs, t) < 5 && ok(t) && obs.sp > 5000) return t;
      return null;
    }

    function idle(reason) {
      if (S.idleReason === reason) return null;
      S.idleReason = reason;
      return { ops: [], note: reason };
    }
    const hold = reason => Object.assign(idle(reason) || { ops: [] }, { hold: true });

    // ---------- ロイヤル攻撃 ----------
    const TL = ctx.info.trackLength || 12;
    const isRoyalPair = (b, a) => a.result === 'merge' && b[a.from] && b[a.to] && b[a.from].type === 'royal' && b[a.to].type === 'royal';
    const royalPairs = obs => obs.legal.acts.filter(a => isRoyalPair(obs.board, a)).sort((p, q) => obs.board[q.from].pips - obs.board[p.from].pips);
    function trackOpp(obs) {
      const opp = obs.opponent;
      if (opp && obs.phase === 'wave' && opp.phase === 'wave' && obs.timeLeft != null) {
        S.fHist.push({ t: obs.t, pos: opp.front ? opp.front.progress * TL : 0 });
        while (S.fHist.length && S.fHist[0].t < obs.t - O.dWindow) S.fHist.shift();
      } else if (obs.phase !== 'wave') S.fHist = [];
    }
    function oppCheck(obs) {
      const opp = obs.opponent;
      if (!opp) return { ok: true, txt: '' };
      if (obs.t - S.waveT0 < O.dSkip) return { ok: false };
      const pos = opp.front ? opp.front.progress * TL : 0;
      if (O.stopPastPos != null && opp.front && pos > O.stopPastPos) return { ok: false };
      if (opp.phase !== 'wave' || S.fHist.length < 2) return { ok: false };
      const h0 = S.fHist[0], h1 = S.fHist[S.fHist.length - 1];
      const v = (h1.pos - h0.pos) / Math.max(1e-6, h1.t - h0.t);
      const D = (TL - pos) - obs.timeLeft * v;
      const R = (TL - pos) - obs.timeLeft * O.normalSpeed;
      const txt = `D=${D.toFixed(1)} R=${R.toFixed(1)}`;
      if (D < 0) return { ok: false, txt };
      if (O.reachCheck && R > 0 && S.firedWave !== obs.wave) return { ok: false, txt };
      return { ok: true, txt };
    }
    const VER = ctx.info.version === 'mix' ? (ctx.info.hpSpec || '6.5.0') : (ctx.info.version || '6.0.5');
    const starIdleWave = () => (O.starIdleUntil || {})[VER] ?? (VER === '6.0.5' ? 10 : 8);
    const starDoneOn = b => b.some((d, i) => d && d.type === MOON && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === SUN && b[j].pips >= 4));
    function starIdle(obs, b) {
      if (!O.starIdleUntil || obs.wave > starIdleWave()) return false;
      return starDoneOn(b) && isActive(b, true);
    }
    // 相手のデッキ：月太陽（月・太陽・成長・ジョーカー）か赤ロイ（ブラッドムーン・シリウス）
    const OPP_TYPES = (ctx.info.opponentDeck || []).map(d => d.type);
    const OPP_MS = ['moon', 'sun', 'growth', 'joker'].every(t => OPP_TYPES.includes(t));
    const OPP_RR = [MOON, SUN].every(t => OPP_TYPES.includes(t));
    // 相手の月（本物の月）の条件（月太陽ロイヤル基本AIと同じ）
    const OPP_INFO = Object.fromEntries((ctx.info.opponentDeck || []).map(d => [d.type, d]));
    const OPP_MOON = !!OPP_INFO.moon;
    function oppMoonBlock(obs, b) {
      const opp = obs.opponent;
      if (!starDoneOn(b) || !opp || !opp.board) return false;
      const moons = opp.board.filter(d => d && d.type === 'moon');
      if (O.oppMoonPipsMin && OPP_MOON && obs.wave <= O.oppMoonPipsUntil && !moons.some(d => d.pips >= O.oppMoonPipsMin)) return true;
      if (O.oppMoonSpdMin && OPP_MS) {
        const c = OPP_INFO.moon.cls || 10;
        const L = ((opp.deck || []).find(d => d.type === 'moon') || {}).lv || 1;
        const act = (OPP_INFO.moon.activeCounts || [3, 5, 7]).includes(moons.length);
        const spd = p => Math.min(0.95, ((0.07 + 0.01 * (c - 7)) * p + 0.02 * (L - 1)) * (act ? 1.03 : 1));
        if (!moons.some(d => spd(d.pips) >= O.oppMoonSpdMin - 1e-9)) return true;
      }
      return false;
    }
    const royalStopLine = obs => obs.sp - obs.summonCost < costN(obs.summonCost + 10, O.royalStopSummons);
    function royalAttack(obs, needMoon, frontPos, tag) {
      if (!O.royalAttack) return null;
      const R = S.royal, b = obs.board, tl = obs.timeLeft;
      if (R.stopped || R.gaveUp || obs.phase !== 'wave' || tl == null) return null;
      if (tsumi(obs, b)) return null;
      if (!R.started) {
        if (tl > O.royalStartMax) return null;
        if (obs.sp < costN(obs.summonCost, O.royalStartSummons)) return null;
      } else if (royalStopLine(obs)) {
        R.stopped = true;
        ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：召喚${O.royalStopSummons}回分のSPに差し掛かったのでロイヤル攻撃をやめる`);
        return null;
      }
      if (obs.wave >= 4 && tl <= O.activateLeft) return null;
      if (!isActive(b, needMoon)) return null;
      if (O.oppMoonsunBoth && (OPP_MS || OPP_RR) && !isActive(b, true)) return null;
      if (starIdle(obs, b)) return null;
      if (oppMoonBlock(obs, b)) return null;
      if (!R.started && tl < O.royalStartMin) return null;
      const opp0 = obs.opponent;
      if (!R.started && opp0 && opp0.front && opp0.front.progress * TL > O.oppFrontLine) return null;
      const oc = oppCheck(obs); if (!oc.ok) return null;

      const g = guard(obs, b);
      const note = s => `ロイヤル攻撃（${tag}）：${s}${oc.txt ? `（${oc.txt}）` : ''}`;
      const begin = () => { if (!R.started) { R.started = true; ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：ロイヤル攻撃を始める（${tag}${oc.txt ? ' ' + oc.txt : ''}）`); } };
      const royalCopy = useReserved => {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker' || b[a.to].type !== 'royal' || g.has(a.from) !== useReserved) continue;
          if (!bc || (useReserved ? b[a.from].pips > b[bc.from].pips : b[a.to].pips > b[bc.to].pips)) bc = a;
        }
        return bc;
      };
      let a = royalCopy(false);
      if (a) { begin(); return opAct(a, obs, note(`ジョーカー${b[a.from].pips}でロイヤルをコピー`)); }
      const pairs = royalPairs(obs);
      if (pairs.length) { begin(); return opAct(pairs[0], obs, note(`ロイヤル${b[pairs[0].from].pips}のペアを合成`)); }
      if (O.royalSummon && b.some(d => !d)) {
        if (!obs.legal.summon) return null;
        begin(); return opSummon(note('召喚'));
      }
      a = royalCopy(true);
      if (a) { begin(); return opAct(a, obs, note(`守りのジョーカー${b[a.from].pips}でロイヤルをコピー`)); }
      let bm = null;
      for (const x of mergeCands(obs, g)) if (b[x.from].type === MOON && b[x.to].type === MOON && (!bm || b[x.to].pips < b[bm.to].pips)) bm = x;
      if (bm) { begin(); return opAct(bm, obs, note(`守り以外の赤月${b[bm.to].pips}どうしを合成`)); }
      R.gaveUp = true;
      ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：ロイヤル攻撃の手がないので、このウェーブは諦める`);
      return null;
    }
    function royalReserve(obs) {
      const R = S.royal;
      if (!O.royalAttack || R.stopped || R.gaveUp || obs.phase !== 'wave') return 0;
      if (R.started) return obs.summonCost + costN(obs.summonCost + 10, O.royalStopSummons);
      if (obs.timeLeft != null && obs.timeLeft < O.royalStartMin) return 0;
      return costN(obs.summonCost, O.royalStartSummons);
    }
    const willEatKnight = (obs, starDone, moonStar, otherStar) =>
      obs.bossType === 'knight' && !starDone && (obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill);
    function knightRoyal(obs, frontPos, starDone, moonStar, otherStar) {
      if (!O.knightRoyal || obs.phase !== 'wave' || obs.timeLeft == null || obs.timeLeft > O.knightRoyalLeft) return null;
      if (!willEatKnight(obs, starDone, moonStar, otherStar) || frontPos >= O.knightRoyalMaxFront) return null;
      const b = obs.board;
      if (!SUN_OK.includes(count(b, SUN))) return hold('ナイト前：シリウスの活性が切れたのでナイトを待つ');
      const pairs = royalPairs(obs);
      if (pairs.length) return opAct(pairs[0], obs, `ナイト前（残り${obs.timeLeft.toFixed(1)}秒）：ロイヤル${b[pairs[0].from].pips}のペアを合成`);
      if (obs.legal.summon && b.some(d => !d)) return opSummon('ナイト前：ロイヤルを打ち切ってもシリウスが活性しているので召喚');
      return hold('ナイト前：ロイヤルのペアも召喚もないのでボスを待つ');
    }
    function pu(o, reserve = 0) {
      const t = powerUp(o, reserve);
      return t ? { ops: [{ op: 'powerUp', type: t }], more: true, note: `PU ${nm(t)}` } : null;
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
    // シリウスに隣接している出目 p 以上の赤月があるか／それが活性しているか
    const bmAdj = (b, p, sp = 1) => b.some((d, i) => d && d.type === MOON && d.pips >= p && NB[i].some(j => b[j] && b[j].type === SUN && b[j].pips >= sp));
    const bmActive = b => MOON_OK.includes(count(b, MOON));
    const bmAdjActive = b => bmAdj(b, 2) && bmActive(b);
    // 赤月をたたむ（赤月が活性していないとき）：シリウスに隣接していない赤月を優先、次に出目の低いもの
    function bmFold(obs, tag) {
      const b = obs.board;
      if (bmActive(b) || count(b, MOON) < 2) return null;
      const gm = new Set(guardMoons(obs, b));
      const adjS = i => NB[i].some(j => b[j] && b[j].type === SUN) ? 1 : 0;
      let best = null, bk = null;
      for (const a of obs.legal.acts) {
        if (a.result !== 'merge' || b[a.from].type !== MOON || b[a.to].type !== MOON || gm.has(a.from) || gm.has(a.to)) continue;
        // 空くのは from のマス。隣接しているほうを残す（from を隣接していない側に）
        const k = [adjS(a.from) + adjS(a.to), b[a.to].pips, adjS(a.from)];
        if (!bk || k[0] < bk[0] || (k[0] === bk[0] && (k[1] < bk[1] || (k[1] === bk[1] && k[2] < bk[2])))) { best = a; bk = k; }
      }
      return best ? opAct(best, obs, `${tag}：赤月が${count(b, MOON)}個で活性していないので赤月${b[best.to].pips}どうしをたたむ`) : null;
    }
    // SPを貯めていて動かさないとき：赤月が活性していなければ赤月をたたむ／シリウスが活性していなければジョーカーでそろえる
    function sunWaitFix(obs) {
      if (!O.sunWaitFix) return null;
      if (O.waitBmFold) { const f = bmFold(obs, 'SP待ち'); if (f) return f; }
      const b = obs.board, sc = count(b, SUN);
      if (SUN_OK.includes(sc)) return null;
      if (O.waitSiriusFold && sc > SUN_MAXT) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === SUN && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `SP待ち：シリウスが${sc}個なので守るシリウス以外のシリウスどうしを合成`);
      }
      let bc = null;
      for (const a of copyCands(obs)) if (b[a.from].pips <= 2 && b[a.to].type === SUN && SUN_OK.includes(count(applyCopy(b, a), SUN)) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
      return bc ? opAct(bc, obs, `SP待ち：ジョーカー${b[bc.from].pips}でシリウスをコピーして活性`) : null;
    }
    function highJokerGrowthCopy(obs, moonStar) {
      if (!O.highJokerGrowth || moonStar) return null;
      const b = obs.board;
      let bg = null;
      for (const a of copyCands(obs)) if (b[a.from].pips >= O.highJokerGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `ジョーカー${b[bg.from].pips}で成長をコピー（赤月の星なし）`) : null;
    }
    // 待機中：シリウスが最大の活性の個数（8）なら守りでないシリウスどうしを合成（既定は切ってある）
    function sun7Merge(obs) {
      if (!O.sun7MergeWave || obs.over || obs.phase !== 'wave' || obs.wave > O.sun7MergeWave) return null;
      const b = obs.board;
      if (count(b, SUN) !== SUN_TOP) return null;
      if (obs.sp < costN(obs.summonCost, O.sun7Summons)) return null;
      const front = obs.enemies.find(e => e.kind !== 'boss');
      if (front && front.pos >= O.prepLine) return null;
      const ps = protectedSuns(obs, b);
      let bs = null;
      for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === SUN && b[a.to].type === SUN && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
      return bs ? opAct(bs, obs, `待機中：シリウスが${SUN_TOP}個なので守りでないシリウス${b[bs.to].pips}どうしを合成`) : null;
    }
    // W1〜W2：SPに余裕がない放置中、シリウスが活性（W1〜W2は1個も可）していなければ合成だけでそろえる
    //   目標の最大（5）より少ない：ロイヤルどうし・赤月どうし／多い：シリウスどうし
    function w12SpFix(obs, tag) {
      if (!O.w12SpFix) return null;
      const b = obs.board, sc = count(b, SUN);
      if (earlyOk(sc, obs.wave)) return null;
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (b[a.to].type !== t) continue;
        if (sc < SUN_MAXT ? !['royal', MOON].includes(t) : t !== SUN) continue;
        if (!bm || b[a.to].pips < b[bm.to].pips) bm = a;
      }
      if (!bm) return null;
      return opAct(bm, obs, `${tag}：SPに余裕がないので、シリウスが${sc}個のうちに${nm(b[bm.to].type)}${b[bm.to].pips}どうしを合成（召喚はしない）`);
    }
    // W2のSP待ち：シリウスに隣接している出目2以上の赤月が活性していなければ、合成だけでそろえる（召喚しない）
    function w2BmFix(obs, tag) {
      const b = obs.board;
      if (bmAdjActive(b)) return null;
      const f = nb => dist(count(nb, MOON), MOON_OK) + (bmAdj(nb, 2) ? 0 : 1) + (SUN_OK.includes(count(nb, SUN)) ? 0 : dist(count(nb, SUN), SUN_T));
      const cur = f(b);
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        if (jokerPair(b, a) || isGrowthPair(b, a) || b[a.from].type === SUN) continue;
        const r = distMerge(b, a, f);
        if (!(r.e < cur - 1e-9)) continue;
        const sc = r.e - r.p0;
        if (!bm || sc < bm.sc - 1e-9 || (Math.abs(sc - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc };
      }
      return bm ? opAct(bm.a, obs, `${tag}：SPに余裕がなく、シリウスの隣の赤月が活性していないので${nm(b[bm.a.to].type)}${b[bm.a.to].pips}どうしを合成（召喚はしない）`) : null;
    }
    function sunIdleFix(obs) {
      if (!O.sunIdleFix || obs.over || obs.phase !== 'wave' || obs.wave < O.sunIdleFromWave) return null;
      const b = obs.board, sc = count(b, SUN);
      if (SUN_OK.includes(sc)) return null;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`打つ手なし：シリウスが${sc}個で活性していないので召喚`) : null;
      if (sc > SUN_MAXT) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === SUN && b[a.to].type === SUN && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        return bs ? opAct(bs, obs, `打つ手なし：シリウスが${sc}個なので守りでないシリウス${b[bs.to].pips}どうしを合成`) : null;
      }
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) if (b[a.from].type !== SUN && b[a.to].type !== SUN && (!bm || b[a.to].pips < b[bm.to].pips)) bm = a;
      return bm ? opAct(bm, obs, `打つ手なし：シリウスが${sc}個なので${nm(b[bm.to].type)}${b[bm.to].pips}どうしを合成（シリウスを出す）`) : null;
    }

    function decideInner(obs) {
      if (obs.over) return null;
      const b = obs.board;
      const moonNextToSun = b.some((d, i) => d && d.type === MOON && d.pips >= O.moonAdjMin && NB[i].some(j => b[j] && b[j].type === SUN));
      const noMoon = !b.some(d => d && d.type === MOON);
      const needMoon = obs.wave >= O.needMoonFrom && (!O.moonNeedsUse || b.some(d => d && d.type === MOON && d.pips >= 4)) && (!O.moonAdjMin || moonNextToSun || (O.noMoonNeed && noMoon));
      const front = obs.enemies.find(e => e.kind !== 'boss');
      const frontPos = front ? front.pos : 0;
      const moonStar = b.some(d => d && d.type === MOON && d.pips === 7);
      const starDone = starDoneOn(b);
      const otherStar = b.some(d => d && d.type !== MOON && d.pips === 7);
      const lead = obs.enemies.length ? obs.enemies[0].pos : 0;
      sunTargets = O.sevenTarget && lead >= 8.5 ? SUN_T.concat([SUN_TOP]) : SUN_T;
      leadPos = lead;

      if (obs.wave !== S.wave) {
        S.wave = obs.wave; S.frozenWave = 0; S.weakWave = 0; S.judgedAt = -1;
        S.seen = new Set(); S.waveT0 = obs.t; S.cap = { dmg: 0, time: 0 }; S.prevHp = new Map(); S.prevT = null;
        S.spending = false;
        S.judgeOk = false; S.royal = { started: false, stopped: false, gaveUp: false }; S.fHist = [];
      }
      track(obs);
      trackOpp(obs);
      if (obs.boss) {
        if (S.bossSeen !== obs.boss.id) { S.bossSeen = obs.boss.id; S.eatKnight = null; }
        S.bossElapsed = obs.boss.elapsed;
      } else if (S.bossSeen != null) { S.lastBossKill = S.bossElapsed; S.bossSeen = null; }

      if (O.w12GrowthAlways && obs.wave <= 2 && lead < O.earlyLine) {
        let bg = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `W${obs.wave}：2つ目の角を越えるまではジョーカー${b[bg.from].pips}で成長をコピー`);
      }

      // 1. ボス戦
      if (obs.phase === 'boss' && obs.boss) {
        const B = obs.boss;
        if (B.type === 'knight' && !starDone) {
          if (S.eatKnight == null) {
            S.eatKnight = obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill;
            ctx.log(`ナイト：${S.eatKnight ? '受ける' : '受けない'}（W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.eatKnight && B.cast === 0) return breakActive(obs) || idle('ナイトを受ける：スキルを待つ');
          if (S.eatKnight && B.cast >= 1) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        }
        if (B.type === 'knight' && B.cast >= 1 && !isActive(b, needMoon)) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        if (!isActive(b, needMoon)) return repairDanger(obs, needMoon, 'ボス戦の立て直し') || idle('ボス戦：打てる立て直しなし');
        return pu(obs) || idle('ボス戦：活性を保って待つ');
      }
      if (obs.phase === 'cleanup') return repairDanger(obs, needMoon, 'ボス後の残りの立て直し') || pu(obs) || idle('ボス後の残りの敵を待つ');
      if (obs.phase !== 'wave') return pu(obs) || idle('ボス抽選・相手待ち');
      { const r = knightRoyal(obs, frontPos, starDone, moonStar, otherStar); if (r) return r; }
      if (frontPos < 8.5) { const r = highJokerGrowthCopy(obs, moonStar); if (r) return r; }

      // 2. 活性準備
      const line = obs.wave <= 2 ? O.earlyLine : O.prepLine;
      if (frontPos >= line) {
        const tag = obs.wave <= 2 ? '活性準備（2つ目の角）' : '活性準備';
        const r = frontPos >= 8.5 ? repairDanger(obs, needMoon, tag, true) : repair(obs, needMoon, tag, true, false, true);
        if (r) return r;
        if (isActive(b, needMoon)) { S.frozenWave = obs.wave; return pu(obs) || idle(`${tag}：活性済み。このウェーブは止めてSPを貯める`); }
        return idle(`${tag}：打てる立て直しなし`);
      }
      if (S.frozenWave === obs.wave && O.resumeGap > 0 && frontPos < O.prepLine - O.resumeGap && obs.wave >= 3) S.frozenWave = 0;
      // 2.5 W5以降の火力の判定
      if (S.frozenWave === obs.wave && O.weakWave > 0 && obs.wave >= O.weakWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        const j = judgePower(obs);
        if (j) {
          S.judgedAt = obs.t; S.judgeOk = !j.weak;
          const msg = `火力の判定：実測${fmt(j.have)}/秒 必要${fmt(j.need)}/秒（W${obs.wave + 1}終盤の1体×到着${j.rate.toFixed(2)}体/秒×${O.weakMargin}）`;
          if (j.weak) { S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave; ctx.log(msg + '→ 足りないので作り込みを再開'); }
          else ctx.log(msg + '→ 足りているので止めたまま');
        }
      }
      if (S.frozenWave === obs.wave) {
        const r = sunWaitFix(obs) || repair(obs, needMoon, '停止中の立て直し'); if (r) return r;
        if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '停止中', false); if (a) return a; }
        const okA = obs.wave >= O.royalFromWave && S.judgedAt >= 0 && S.judgeOk;
        if ((okA || starDone) && !starIdle(obs, b)) {
          const ra = royalAttack(obs, needMoon, frontPos, okA ? '火力が足りて停止中' : '赤月の星'); if (ra) return ra;
        }
        const why = S.judgedAt >= 0 ? (S.judgeOk ? '火力は足りている' : '火力不足の再判定待ち') : obs.wave >= O.weakWave && O.weakWave > 0 ? '押し返し待ち' : 'レーンの真ん中を越えた';
        return pu(obs, okA || starDone ? royalReserve(obs) : 0) || idle(`停止中：活性を保ってSPを貯める（${why}）`);
      }
      if (S.weakWave === obs.wave && S.judgedAt >= 0 && frontPos > O.resumeLine) S.judgedAt = -1;

      // 3. W1
      if (obs.wave === 1 && O.w1SiriusN) {
        const sc = count(b, SUN);
        if (sc < O.w1SiriusN) {
          if (b.some(d => !d)) return obs.legal.summon ? opSummon(`W1：シリウスが${O.w1SiriusN}個になるまで召喚（いま${sc}個）`) : idle('W1：SP待ち（シリウスをそろえる）');
          // 埋まっていれば、シリウス以外のダイスどうしを合成してマスを空ける（ロイヤル・赤月・ジョーカーの順、出目の低い組から）
          const g = guard(obs, b), rank = t => ({ royal: 0, [MOON]: 1, joker: 2 }[t] ?? 3);
          let bm = null;
          for (const a of mergeCands(obs, g)) { const t = b[a.from].type; if (t === SUN) continue;
            if (!bm || rank(t) < rank(b[bm.from].type) || (rank(t) === rank(b[bm.from].type) && b[a.to].pips < b[bm.to].pips)) bm = a; }
          return bm ? opAct(bm, obs, `W1：埋まっているので${nm(b[bm.to].type)}${b[bm.to].pips}どうしを合成して空ける（シリウス${sc}個）`) : idle('W1：シリウスがそろわず、空けられない');
        }
        return (O.w1Pu ? pu(obs) : null) || idle(`W1：シリウスが${sc}個そろったので、2つ目の角まで貯める`);
      }
      if (obs.wave === 1) {
        const sc = count(b, SUN);
        const go = frontPos >= O.corner1 || (obs.timeLeft != null && obs.timeLeft <= O.w1GoLeft);
        if (sc === 0 && !go) return obs.legal.summon ? opSummon('W1：シリウスが出るまで召喚') : (w12SpFix(obs, 'W1') || idle('W1：SP待ち'));
        if (!go) return w12SpFix(obs, 'W1') || idle('W1：1つ目の角（または35秒）まで貯める');
        return expand(obs, 'W1：盤面を広げる') || pu(obs) || idle('W1：2つ目の角まで広げて待つ');
      }
      // 3.5 W2
      if (obs.wave === 2) {
        if (O.w2BmGate) {
          if (obs.timeLeft != null && obs.timeLeft <= 40 && bmAdjActive(b)) { S.frozenWave = 2; return pu(obs) || idle('W2中盤：シリウスの隣の出目2以上の赤月が活性したので止める'); }
          if (obs.sp < costN(obs.summonCost, O.w2Spare)) return w2BmFix(obs, 'W2') || pu(obs) || idle(`W2：SPに余裕がない（召喚${O.w2Spare}回分未満）ので動かさない`);
          return expand(obs, 'W2：盤面を広げる') || pu(obs) || idle('W2：2つ目の角まで広げて待つ');
        }
        if (obs.timeLeft != null && obs.timeLeft <= 40 && isActive(b, false)) { S.frozenWave = 2; return pu(obs) || idle('W2中盤：シリウスが活性したので止める'); }
        if (obs.sp < costN(obs.summonCost, O.w2Spare)) return w12SpFix(obs, 'W2') || pu(obs) || idle(`W2：SPに余裕がない（召喚${O.w2Spare}回分未満）ので動かさない`);
        return expand(obs, 'W2：盤面を広げる') || pu(obs) || idle('W2：2つ目の角まで広げて待つ');
      }

      // 3.9 W3以降のウェーブ終盤
      if (obs.wave >= 3 && obs.timeLeft != null && obs.timeLeft <= O.noBuildLeft) {
        const late = obs.wave >= 4 && obs.timeLeft <= O.activateLeft;
        if (late && !isActive(b, needMoon)) return repair(obs, needMoon, `残り${O.activateLeft}秒：両活性`, true, false, true) || idle(`残り${O.activateLeft}秒：打てる立て直しなし`);
        if (starDone && O.starStopsBuild) {
          const r = sunWaitFix(obs) || repair(obs, needMoon, '赤月の星（シリウス隣接済み）：両活性'); if (r) return r;
          if (starIdle(obs, b)) return pu(obs, reserve5(obs)) || idle(`赤月の星（シリウス隣接済み）・両活性：W${starIdleWave()}までは何もしない`);
          const ra = royalAttack(obs, needMoon, frontPos, '赤月の星'); if (ra) return ra;
        }
        return sunWaitFix(obs) || pu(obs, Math.max(reserve5(obs), starDone ? royalReserve(obs) : 0)) || idle(late ? `残り${O.activateLeft}秒：両活性を保ってボスを待つ` : `残り${O.noBuildLeft}秒以下なので出目上げを始めない`);
      }

      // 4. 作り込み（W3〜）
      const res = reserve5(obs);
      const weak = S.weakWave === obs.wave;
      const repair7 = tag => { over7Now = true; try { return repair(obs, needMoon, tag); } finally { over7Now = false; } };
      if (tsumi(obs, b)) return repair7('詰み：活性の立て直し') || pu(obs) || idle('詰み：作り込みをやめた');
      if (starDone && O.starStopsBuild) {
        const r = sunWaitFix(obs) || repair7('赤月の星（シリウス隣接済み）：両活性'); if (r) return r;
        if (starIdle(obs, b)) return pu(obs, res) || idle(`赤月の星（シリウス隣接済み）・両活性：W${starIdleWave()}までは何もしない`);
        const ra = royalAttack(obs, needMoon, frontPos, '赤月の星'); if (ra) return ra;
        return pu(obs, Math.max(res, royalReserve(obs))) || idle('赤月の星（シリウス隣接済み）：出目上げ・盤面づくりを止める（両活性済み）');
      }
      if (!weak && starDone && ['leon', 'knight'].includes(obs.bossType))
        return repair7('赤月の星：レオン・ナイト前の両活性') || pu(obs) || idle('赤月の星：レオン・ナイト前は動かさない（両活性済み）');
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
        if (O.growthPairLine != null && obs.legal && obs.legal.acts) {
          const lead = obs.enemies && obs.enemies.length ? Math.max(...obs.enemies.map(e => e.pos)) : 0;
          if (lead < O.growthPairLine) {
            const b0 = obs.board;
            obs = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'merge' && b0[a.from] && b0[a.to] && b0[a.from].type === 'growth' && b0[a.to].type === 'growth')) }) });
          }
        }
        // 星のジョーカー（出目7）でシリウス・赤月以外をコピーしない：合法手から外してから判断する（どの判断にも効く）
        if (O.starJokerOnlyBS && obs.legal && obs.legal.acts) {
          const b0 = obs.board;
          obs = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'copy' && b0[a.from] && b0[a.from].type === 'joker' && b0[a.from].pips === 7 && b0[a.to] && b0[a.to].type !== SUN && b0[a.to].type !== MOON)) }) });
        }
        const savedPair = S.pair, savedFix = S.fixPair;
        let r = decideInner(obs);
        if (!(r && r.ops && r.ops.length)) { const m = sun7Merge(obs); if (m) r = m; }
        if (!(r && r.ops && r.ops.length) && !(r && r.hold)) { const m = sunIdleFix(obs); if (m) r = m; }
        if (r) delete r.hold;
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pair = savedPair; S.fixPair = savedFix; return null; }
        if (r && r.ops && r.ops.length) S.idleReason = null;
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.phase === 'wave') {
          const o0 = r.ops[0], b = obs.board;
          if (o0.expect === 'merge' && b[o0.from] && b[o0.to] && b[o0.from].type === 'royal' && b[o0.to].type === 'royal') S.firedWave = obs.wave;
        }
        return r;
      },
    };
  },
});
