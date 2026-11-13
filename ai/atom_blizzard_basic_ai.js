// 原子吹雪基礎AI（AI API v1）  RD.defineAgent('atomblizzardbasic', ...)
// デッキ：原子・吹雪・成長・ジョーカー＋火力枠（5枠目。種類を問わず「とどめ役」として抽象化して扱う）。本家 6.5.0 の原子（atom_650）想定
// 仕様：claude/原子AI_仕様案.md（ユーザーの指示）。原子の計算：claude/原子AI_割合ダメージ効率計算式.md
//
// 考え方：原子で削った雑魚を、火力枠で仕留める。原子は入口に近い外周ほど点が高い（原子点数）。
//   原子点数 S＝Σ 点(マス)×出目^1.2（コロシアムは砂に最も近い原子だけ×1.5）。点は入口から 10・15・20・15・10・8・8・4・2、6W以降 10・15・20・15・15・15・20・10・8
//   ボーダー B(w)＝HP表から逆算した必要な原子点数（とどめ役の火力×ゴールまでの時間は小さめの重み。出目^1.2に合わせて×平均出目^0.2。4Wまでは大幅に下げる）
//   ジョーカー：4Wまでは成長をコピーできれば必ずコピー。3W以降は 外周で原子をコピー → 吹雪が足りなければ吹雪をコピー → 適応のようにコピーして合成
//   成長どうし・ジョーカーどうしの合成は、ほかに手がなく評価が大きく上がるときだけ
//   吹雪：4Wまでは減速の目標までの項。5W以降は吹雪の総量で原子の当たる回数が増える分を原子点数に掛ける
//   4Wまで：召喚3回分のSPがあるうちは、規定値を満たしていても合成を止めない
//   火力枠：4W以降の出目1・2は価値なし、外周は0.5倍、一番出目の高い1個は1.3倍
//
// 判断の順番（最初に当てはまったものを行う。1回の判断で操作は1つ、more:true で続ける）
//   0. 重ねる操作のドラッグ中・間隔待ちなら重ねる操作は出さない
//   1. ハッキングされた火力枠を合成して消す
//   2. ナイト戦：ジョーカーで原子をコピー（ナイトがこれから通る位置を射程に入れるマスのジョーカーから）
//   3. ウェーブごとの手順（W1・W2・W3以降）
'use strict';

RD.defineAgent('atomblizzardbasic', {
  name: '原子吹雪基礎AI',
  desc: '原子で削り、火力枠で仕留める。原子は入口に近い外周ほど高い点で評価し、ボーダー（HP表から逆算）に向けて盤面を作るルールベースAI',
  options: {
    // 原子点数（マス→点）。左下・左中・左上角・上列2〜5列目・右中・右下。ほかは0点
    points: { 10: 10, 5: 15, 0: 20, 1: 15, 2: 10, 3: 8, 4: 8, 9: 4, 14: 2 },
    pointsLate: { 10: 10, 5: 15, 0: 20, 1: 15, 2: 15, 3: 15, 4: 20, 9: 10, 14: 8 }, // lateFrom ウェーブ以降の点
    lateFrom: 6,
    pipPow: 1.2,           // 原子点数の出目に掛ける乗数（点×出目^pipPow）
    outer7: [10, 5, 0, 1, 2, 3, 4], // 合成の向きの判定に使う外周（左列3＋上列の2〜5列目4）
    sandMul: 1.5,          // コロシアム：砂に最も近い原子の点の倍率
    // ボーダー B(w)
    hpRef: 1500,           // 火力枠が楽に倒せるとみなすHP（ln で混ぜる）
    fireWeight: 0.1,       // とどめ役のDPS×ゴールまでの時間の重み（小さめ）
    hitsPerPoint: 0.28,    // 原子点1あたりの当たる回数（原子PU5・吹雪あり。計算式の資料から）
    borderMin: 20,         // ボーダーの下限
    bossBorder: { slime: 3, basilisk: 2.5, magician: 1.15 }, // ボス前のボーダーの引き上げ
    basiliskLeftBonus: 3,  // バジリスク前：左列（左下・左中・左上角）の原子点数に足す点
    earlyBorder: { 1: 0.4, 2: 0.4, 3: 0.5, 4: 0.6 }, // 4ウェーブまでのボーダーの倍率（大幅に下げる）
    // 評価の重み（3ウェーブ以降の合成・コピー）
    kappa: 0.3,            // ボーダーを超えた分の原子点の価値（足りない分を1とする）
    wAtom: 100, wBliz: 40, wFire: 15, wGrowth: 15, growthShort: 3.0, wJoker: 2, wPips: 0.5,
    blizGoal: 0.5,         // 1回の吹雪で盤面全体が与えたい減速（上限50%）
    knightBliz: 2.0,       // ナイト前：吹雪の重みの倍率
    // 吹雪×原子（blizAtomFrom ウェーブ以降）：盤面の吹雪の総量（1回の減速の合計 σ）で原子の当たる回数が増える分を原子点数に掛ける
    //   倍率 f(σ)＝1＋blizA×(1−e^(−σ/blizB))（左列に原子3つ・吹雪の数を変えたシミュレーションに合わせた値）。
    //   基準 σ＝blizRef（5W以降のふつうの盤面の吹雪の総量ほど）で1倍になるよう f(σ)÷f(blizRef) を掛ける（ボーダーの目盛りはそのまま）
    blizAtomFrom: 5, blizA: 1.0, blizB: 0.75, blizRef: 0.8,
    earlyReserveSummons: 3, // 4ウェーブまで：召喚この回数分のSPがあるうちは合成を止めない
    earlyUntil: 4,         // 「4ウェーブまで」の境目（合成を止めない・召喚SPを残す）
    fireUnit: 300,         // 火力枠の出目1あたりのDPS（Lv1。抽象化した値）
    firePerLv: 0.9,        // 火力枠のPU1段あたりの火力の増え方（Lv1を1として）
    fireIgnoreFrom: 4,     // このウェーブから、出目 fireIgnorePips 以下の火力枠は価値なし（合成で消してよい）
    fireIgnorePips: 2,
    fireOuterMul: 0.5,     // 外周（原子の点があるマス）にある火力枠の価値の倍率
    topFireMul: 1.3,       // 盤面で一番出目の高い火力枠（1個）の価値の倍率（少し重め）
    hackPen: 30,           // ハッキングされた火力枠1個の罰点
    pip7Pen: 25,           // 出目7を作る罰点
    jgMergePen: 30,        // 成長どうし・ジョーカーどうしの合成の罰点（しにくくする）
    jgMergeMin: 40,        // 成長どうし・ジョーカーどうしは、ほかに手がなく、罰点込みでこれ以上評価が上がるときだけ
    forceGrowthUntil: 4,   // このウェーブまでは、ジョーカーで成長をコピーできるときは必ずコピー
    jokerMergeMin: -2,     // ジョーカーでコピーして合成する手：評価の変化がこれ以上なら行う
    mergeMin: 0.5,         // 3ウェーブ以降：評価がこれ以上上がる手だけ合成・コピーする
    emptyDiscount: 0.8,    // 合成で空いたマスに召喚できる見込み（SPが足りないとき）
    knightHpRatio: 0.25,   // ナイト戦：ボスのHPがこの割合以上残っていれば、射程に入る原子を作りに行く
    knightLook: 6,         // ナイト戦：ボスがこれから何秒ぶん進む範囲を射程に入れたいか
    w2FireLv: 2,           // 2ウェーブ：火力枠をこのLvに
    stuckPu: [['atom', 5], ['blizzard', 3], ['fire', 3], ['fire', 5], ['blizzard', 5]], // 詰まったときのPUの順
    sinkSummons: 3,        // SPが召喚この回数分以上たまっていれば、使い道を作る（低い出目の組を合成して召喚）
    sinkMaxPips: 2,        // そのとき合成してよい出目の上限
    sinkTol: 15,           // そのとき許す評価の下がり幅
    debug: 0,              // このウェーブ以降、合成の評価を判断履歴に出す（0で出さない）
  },

  create(ctx) {
    const O = ctx.options;
    const CFG = ctx.info.cfg || {};
    const DECK = ctx.info.deck.map(d => d.type);
    const CLS = {}; for (const d of ctx.info.deck) CLS[d.type] = d.cls;
    const ROLE_T = ['atom', 'blizzard', 'growth', 'joker'];
    const FIRE = DECK.find(t => !ROLE_T.includes(t)) || null; // 火力枠の種類ID
    const role = t => (t === FIRE ? 'fire' : t);
    const typeOf = r => (r === 'fire' ? FIRE : r);
    const OUTER7 = new Set(O.outer7);
    let POINTS = O.points;
    let LEFT_BONUS = 0; // バジリスク前の左列の上乗せ
    const pt = i => (POINTS[i] || 0) + (POINTS[i] && i % 5 === 0 ? LEFT_BONUS : 0);
    const pw = n => Math.pow(n, O.pipPow);
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const posXY = d => (d <= 3.5 ? [0, d] : d <= 8.5 ? [d - 3.5, 3.5] : [5, 3.5 - (d - 8.5)]);
    const TRACK = ctx.info.trackLength || 12;

    // ---------- HP表（エンジンと同じ式） ----------
    const v650 = ctx.info.hpSpec !== '6.0.5';
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : v650 ? 20 * (w - 1) * (w + 4) * (w + 6) : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const spawnSteps = w => { let n = 0; for (let k = 1; waveT(w) - (k - 1) * waveDt(w) > 0; k++) n++; return n; };
    const lastHP = w => baseHP(w) + spawnSteps(w) * dHP(w);

    // ---------- 原子 ----------
    const atomCls = CLS.atom || 11;
    const atomP = lv => 0.04 + 0.003 * (atomCls - 7) + 0.005 * (lv - 1);
    const L5 = -Math.log(1 - atomP(5));   // ボーダーはPU5の原子で考える（盤面の形の目標）
    // 原子の射程（雑魚。通路の位置）。ナイト戦ではボスの大きさで計算し直す
    function rangeOf(i, enemyD) {
      const x = COL_X[i % 5], y = ROW_Y[Math.floor(i / 5)], R = 1.3 + enemyD / 2, out = [];
      const seg = (dist, c, lo, hi, off, dir) => {
        if (Math.abs(dist) > R) return;
        const h = Math.sqrt(R * R - dist * dist), a = Math.max(lo, c - h), b = Math.min(hi, c + h);
        if (b <= a) return;
        // 通路の位置に直す
        if (dir === 'L') out.push([a, b]);
        else if (dir === 'T') out.push([a + 3.5, b + 3.5]);
        else out.push([8.5 + (3.5 - b), 8.5 + (3.5 - a)]);
      };
      seg(x, y, 0, 3.5, 0, 'L'); seg(3.5 - y, x, 0, 5, 0, 'T'); seg(5 - x, y, 0, 3.5, 0, 'R');
      return out;
    }
    const RANGE = Array.from({ length: 15 }, (_, i) => rangeOf(i, 0.75));
    const rangeEnd = i => RANGE[i].reduce((m, r) => Math.max(m, r[1]), 0);

    // ---------- 状態 ----------
    const S = { wave: 0, pair: null, idle: null, knightSeen: false };

    // ---------- 道具 ----------
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };
    const lvR = (obs, r) => lv(obs, typeOf(r));
    const puCost = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
    const canPu = (obs, t) => !!t && (obs.legal.powerUp || []).includes(t) && obs.sp >= puCost(obs, t);
    // 4ウェーブまで：召喚 earlyReserveSummons 回分のSPがあるうちは、規定値を満たしていても合成を止めない
    const summonsCost = (obs, n) => n * obs.summonCost + 5 * n * (n - 1);
    const keepMerging = obs => obs.wave <= O.earlyUntil && obs.sp >= summonsCost(obs, O.earlyReserveSummons);
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));
    const full = b => !b.some(d => !d);
    const summonReady = obs => obs.legal.summon && !(obs.control && obs.control.summonReadyIn > 1e-9);
    const merges = obs => obs.legal.acts.filter(a => a.result === 'merge');
    const copies = obs => obs.legal.acts.filter(a => a.result === 'copy');
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });
    const opPu = (t, note) => ({ ops: [{ op: 'powerUp', type: t }], more: true, note });
    function idle(reason) { if (S.idle === reason) return null; S.idle = reason; return { ops: [], note: reason }; }
    const nm = { atom: '原子', blizzard: '吹雪', growth: '成長', joker: 'ジョーカー', fire: '火力枠' };
    const dn = d => `${nm[role(d.type)] || d.type}${d.pips}`;
    const avgPips = b => { let s = 0, n = 0; for (const d of b) if (d) { s += d.pips; n++; } return n ? s / n : 0; };

    // ---------- 原子点数 ----------
    // 砂に最も近い原子（点のあるマスの原子のうち）だけ×sandMul
    function atomScore(obs, b) {
      let s = 0, best = -1, bd = Infinity;
      const sand = obs.field && obs.field.sand;
      const sp = sand ? posXY(sand.pos) : null;
      b.forEach((d, i) => {
        if (!d || d.type !== 'atom' || !pt(i)) return;
        s += pt(i) * pw(d.pips);
        if (sp) { const dist = Math.hypot(COL_X[i % 5] - sp[0], ROW_Y[Math.floor(i / 5)] - sp[1]); if (dist < bd) { bd = dist; best = i; } }
      });
      if (best >= 0) s += (O.sandMul - 1) * pt(best) * pw(b[best].pips);
      return s;
    }

    // ---------- 吹雪・火力枠 ----------
    const blizStep = (obs, pips) => (0.05 + 0.005 * ((CLS.blizzard || 11) - 7)) * pips + 0.01 * (lv(obs, 'blizzard') - 1);
    function blizSum(obs, b) { let s = 0; for (const d of b) if (d && d.type === 'blizzard' && !d.sealed) s += blizStep(obs, d.pips); return s; }
    // 吹雪の価値：出目に^pipPow を掛けて高い出目を重くする（減速の目標との比較もこの値で）
    function blizVal(obs, b) { let s = 0; for (const d of b) if (d && d.type === 'blizzard' && !d.sealed) s += blizStep(obs, pw(d.pips)); return s; }
    // 吹雪×原子の倍率（blizAtomFrom ウェーブ以降）。σ＝盤面の吹雪の1回の減速の合計（出目の総量）
    const blizF = sg => 1 + O.blizA * (1 - Math.exp(-sg / O.blizB));
    const blizMul = (obs, b) => (CLS.blizzard && obs.wave >= O.blizAtomFrom ? blizF(blizSum(obs, b)) / blizF(O.blizRef) : 1);
    // 原子点数（吹雪込み）：評価・残りHPの見積もりに使う
    const atomEff = (obs, b) => atomScore(obs, b) * blizMul(obs, b);
    const fireMul = obs => 1 + O.firePerLv * (lvR(obs, 'fire') - 1);
    // 火力枠の火力：fireIgnoreFrom ウェーブ以降は出目 fireIgnorePips 以下を数えない。外周の火力枠は fireOuterMul 倍
    //   盤面で一番出目の高い火力枠（1個だけ）は topFireMul 倍で少し重く数える
    function topFire(b) {
      let best = -1;
      b.forEach((d, i) => { if (d && d.type === FIRE && !d.sealed && !d.hacked && (best < 0 || d.pips > b[best].pips)) best = i; });
      return best;
    }
    function fireW(obs, b, i, top) {
      const d = b[i];
      if (obs.wave >= O.fireIgnoreFrom && d.pips <= O.fireIgnorePips) return 0;
      return ((POINTS[i] || 0) > 0 ? O.fireOuterMul : 1) * (i === top ? O.topFireMul : 1);
    }
    function fireCap(obs, b) {
      let s = 0;
      const top = topFire(b);
      b.forEach((d, i) => {
        if (!d || d.type !== FIRE || d.sealed || d.hacked) return;
        s += d.pips * fireW(obs, b, i, top);
      });
      return s * O.fireUnit * fireMul(obs);
    }
    const speedMul = obs => (obs.deathWave ? 1 + (CFG.deathSpeedUp != null ? CFG.deathSpeedUp : 0.2) : 1);
    // 原子ゾーンを抜けてからゴールまでの秒（点のある原子の射程の終わりから）
    //   原子ゾーンの終わり＝点のある原子の射程の終わりを、点×出目で重みづけした平均
    function afterTime(obs, b) {
      let w = 0, sw = 0;
      b.forEach((d, i) => { if (d && d.type === 'atom' && pt(i)) { w += pt(i) * pw(d.pips); sw += pt(i) * pw(d.pips) * rangeEnd(i); } });
      const end = w ? sw / w : 0;
      const slow = Math.min(0.5, 2 * blizSum(obs, b));
      return (TRACK - end) / (0.6 * speedMul(obs) * (1 - slow));
    }

    // ---------- ボーダー ----------
    function border(obs, b) {
      const w = Math.max(1, obs.wave), hp = lastHP(w);
      const ft = Math.max(1, fireCap(obs, b) * afterTime(obs, b));
      const ref = Math.exp((1 - O.fireWeight) * Math.log(O.hpRef) + O.fireWeight * Math.log(ft));
      let B = Math.max(O.borderMin, Math.log(Math.max(1, hp / ref)) / L5 / O.hitsPerPoint);
      // 原子点数は 点×出目^pipPow なので、ボーダーも同じ単位に直す（盤面の平均出目を基準に ×平均^(pipPow−1)）
      B *= Math.pow(Math.max(1, avgPips(b)), O.pipPow - 1);
      const nb = obs.nextBoss && obs.nextBoss.type;
      if (nb && O.bossBorder[nb] && obs.phase !== 'boss') B *= O.bossBorder[nb];
      if (O.earlyBorder[w]) B = Math.max(O.borderMin, B * O.earlyBorder[w]);
      return B;
    }

    // ---------- 盤面の評価 U ----------
    // 原子：ボーダーまでの点は1、超えた分は kappa。吹雪：1回の減速の合計が目標まで。火力枠：原子を抜けた残りHPを処理できる分まで
    // 成長：1個ごとに（原子点数が足りないほど重い）。出目の合計に少し。ハッキングされた火力枠・出目7は罰点
    function U(obs, b, B, ex) {
      const S0 = atomEff(obs, b), short = Math.max(0, (B - S0) / B);
      let u = O.wAtom * (Math.min(S0, B) + O.kappa * Math.max(0, S0 - B)) / B;
      const bz = blizVal(obs, b), knightNext = obs.nextBoss && obs.nextBoss.type === 'knight' && obs.phase !== 'boss';
      // 吹雪：blizAtomFrom ウェーブより前は減速の目標までの項。以降は原子点数への掛け算（atomEff）で数え、ナイト前だけこの項も足す
      if (obs.wave < O.blizAtomFrom || knightNext)
        u += O.wBliz * (knightNext ? O.knightBliz : 1) * (Math.min(bz, O.blizGoal) + 0.1 * Math.max(0, bz - O.blizGoal)) / O.blizGoal;
      const hp = lastHP(Math.max(1, obs.wave));
      const resid = hp * Math.exp(-O.hitsPerPoint * S0 * L5);
      const need = Math.max(1, resid / Math.max(1, afterTime(obs, b)));
      const fc = fireCap(obs, b);
      u += O.wFire * (Math.min(fc, need) + 0.1 * Math.max(0, fc - need)) / need;
      const top = topFire(b);
      b.forEach((d, i) => {
        if (!d) return;
        if (d.type === 'growth' && d.pips < 7) u += O.wGrowth * (1 + O.growthShort * short) * (7 - d.pips) / 6;
        if (d.type === 'joker') u += O.wJoker * d.pips;
        if (d.type === FIRE && d.hacked) u -= O.hackPen;
        // 火力枠：価値なし（fireIgnoreFrom 以降の低い出目）は出目の分も数えない。外周は fireOuterMul 倍
        const m = d.type === FIRE && !d.hacked ? fireW(obs, b, i, top) : 1;
        u += O.wPips * d.pips * m;
      });
      if (ex && ex.pip7) u -= O.pip7Pen;
      return u;
    }
    // 合成の期待値：to にランダムな種類の出目+1、from は空く（召喚で出目1のランダムな種類が入る見込み）
    function mergeValue(obs, b, a, B) {
      const p = b[a.to].pips + 1, sumOk = obs.sp >= obs.summonCost;
      let tot = 0;
      for (const t of DECK) {
        const nb = clone(b); nb[a.to] = { type: t, pips: p }; nb[a.from] = null;
        let v = U(obs, nb, B, { pip7: p >= 7 }), e = 0;
        for (const t2 of DECK) { const nb2 = clone(nb); nb2[a.from] = { type: t2, pips: 1 }; e += U(obs, nb2, B, { pip7: p >= 7 }); }
        e /= DECK.length;
        tot += v + (e - v) * (sumOk ? 1 : O.emptyDiscount);
      }
      tot /= DECK.length;
      if (['joker', 'growth'].includes(b[a.to].type)) tot -= O.jgMergePen;
      return tot;
    }
    function copyValue(obs, b, a, B) {
      const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips };
      return U(obs, nb, B);
    }
    // 合成の向き：外周7マスと内側の組は、出目が 盤面平均＋1以下なら外周へ、平均＋2以上なら内側へ
    function dirOk(b, a) {
      const fo = OUTER7.has(a.from), to = OUTER7.has(a.to);
      if (fo === to) return true;
      const n = b[a.to].pips, av = avgPips(b);
      if (n <= av + 1) return to;
      if (n >= av + 2) return !to;
      return true;
    }
    // 同じ組は向きの良いほう（評価の高いほう）だけ
    function bestMerges(obs, list, B) {
      const b = obs.board, m = new Map();
      for (const a of list) {
        if (!dirOk(b, a)) continue;
        const key = Math.min(a.from, a.to) * 15 + Math.max(a.from, a.to);
        const v = mergeValue(obs, b, a, B), cur = m.get(key);
        if (!cur || v > cur.v) m.set(key, { a, v });
      }
      return [...m.values()];
    }
    // ジョーカーでコピーした組を合成
    function pairMerge(obs) {
      if (!S.pair) return null;
      const P = S.pair; S.pair = null;
      const b = obs.board;
      if (!b[P.to] || b[P.to].id !== P.toId) return null;
      const a = merges(obs).filter(x => (x.from === P.from && x.to === P.to) || (x.from === P.to && x.to === P.from))
        .sort((x, y) => (dirOk(b, y) ? 1 : 0) - (dirOk(b, x) ? 1 : 0))[0];
      return a ? opAct(a, obs, `作った組を合成（${dn(b[a.to])}）`) : null;
    }
    // 要求（原子点数・吹雪・火力枠）をすべて満たしているか
    function satisfied(obs, b, B) {
      const S0 = atomEff(obs, b);
      if (S0 < B) return false;
      if (CLS.blizzard && blizSum(obs, b) < O.blizGoal) return false;
      const hp = lastHP(Math.max(1, obs.wave)), resid = hp * Math.exp(-O.hitsPerPoint * S0 * L5);
      return fireCap(obs, b) * afterTime(obs, b) >= resid;
    }

    // ---------- 共通の手 ----------
    // ハッキングされた火力枠を合成して消す（相手がいなければジョーカーでコピーして組を作る）
    function killHacked(obs) {
      const b = obs.board;
      const m = merges(obs).find(a => b[a.from].type === FIRE && b[a.from].hacked);
      if (m) return opAct(m, obs, `ハッキングされた${dn(b[m.from])}を合成して消す`);
      const c = copies(obs).find(a => b[a.to].type === FIRE && b[a.to].hacked);
      if (c) { S.pair = { from: c.from, to: c.to, toId: b[c.to].id }; return opAct(c, obs, `ハッキングされた${dn(b[c.to])}をジョーカーでコピーして消す組を作る`); }
      return null;
    }
    // ジョーカーで成長をコピー（出目の高いジョーカーから）
    function copyGrowth(obs, tag) {
      const b = obs.board;
      const a = copies(obs).filter(x => b[x.to].type === 'growth').sort((x, y) => b[y.from].pips - b[x.from].pips)[0];
      return a ? opAct(a, obs, `${tag}：ジョーカー${b[a.from].pips}で成長をコピー`) : null;
    }
    // ナイト戦：ジョーカーで原子をコピー。ボスのHPが残っていれば、ボスがこれから通る位置を射程に入れるマスのジョーカーから
    function knightFight(obs) {
      const B = obs.boss, b = obs.board;
      const e = obs.enemies.find(x => x.id === B.id) || obs.enemies[0];
      const cs = copies(obs).filter(a => b[a.to].type === 'atom');
      if (!cs.length) return null;
      let pick = null;
      if (e && B.hp >= B.maxHp * O.knightHpRatio) {
        const lo = e.pos, hi = Math.min(TRACK, e.pos + Math.max(0.3, e.speed || 0.6) * O.knightLook);
        let best = 0;
        for (const a of cs) {
          const ov = rangeOf(a.from, e.size || 1.12).reduce((s, r) => s + Math.max(0, Math.min(hi, r[1]) - Math.max(lo, r[0])), 0) * b[a.from].pips;
          if (ov > best) { best = ov; pick = a; }
        }
      }
      if (!pick) pick = cs.sort((x, y) => b[y.from].pips - b[x.from].pips)[0];
      return opAct(pick, obs, `ナイト戦：ジョーカー${b[pick.from].pips}（${pick.from}）で原子をコピー`);
    }

    // ジョーカーの役割（3ウェーブ以降。成長の強制コピーの後）
    //   ① 外周（点のあるマス）のジョーカーで原子をコピーして増やす
    //   ② 吹雪の減速が目標に足りなければ、ジョーカーで吹雪をコピーして増やす
    //   ③ 適応のように、ほかのダイスをコピーしてそのダイスと合成する（合成の期待値が最も高い組）
    function jokerRole(obs, B, u0) {
      const b = obs.board, cs = copies(obs);
      if (!cs.length) return null;
      const outerAtom = cs.filter(a => pt(a.from) && b[a.to].type === 'atom').sort((x, y) => pt(y.from) - pt(x.from) || b[y.from].pips - b[x.from].pips)[0];
      if (outerAtom) return opAct(outerAtom, obs, `ジョーカー：外周（${outerAtom.from}）のジョーカー${b[outerAtom.from].pips}で原子をコピー`);
      if (CLS.blizzard && blizSum(obs, b) < O.blizGoal) {
        const bz = cs.filter(a => b[a.to].type === 'blizzard').sort((x, y) => pt(x.from) - pt(y.from) || b[y.from].pips - b[x.from].pips)[0];
        if (bz) return opAct(bz, obs, `ジョーカー：吹雪が足りないのでジョーカー${b[bz.from].pips}で吹雪をコピー`);
      }
      if (!full(b)) return null; // 合成の組を作るのは盤面が埋まってから
      let best = null;
      for (const a of cs) {
        if (b[a.to].type === 'growth') continue;
        const nb = copyBoard(b, a);
        const pair = { from: a.from, to: a.to };
        const back = { from: a.to, to: a.from };
        const ob = Object.assign({}, obs, { board: nb });
        let v = -Infinity, dir = null;
        for (const m of [pair, back]) { if (!dirOk(nb, m)) continue; const x = mergeValue(ob, nb, m, B); if (x > v) { v = x; dir = m; } }
        if (dir && (!best || v > best.v)) best = { a, v };
      }
      if (best && best.v - u0 >= O.jokerMergeMin) {
        S.pair = { from: best.a.from, to: best.a.to, toId: b[best.a.to].id };
        return opAct(best.a, obs, `ジョーカー：${dn(b[best.a.to])}をコピーして合成の組を作る（${(best.v - u0).toFixed(1)}）`);
      }
      return null;
    }
    function copyBoard(b, a) { const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }

    // ---------- 1・2ウェーブの合成順 ----------
    // 0点原子（出目1・2）→ 吹雪どうし（出目1）→ 火力枠どうし（出目1）→ 吹雪どうし（出目2）→ 火力枠どうし（出目2）
    function earlyOrder(obs, B, tag) {
      const b = obs.board, ms = merges(obs);
      const pick = f => {
        const list = ms.filter(a => f(b[a.from], b[a.to], a));
        const best = bestMerges(obs, list, B).sort((x, y) => y.v - x.v)[0];
        return best ? best.a : null;
      };
      const steps = [
        ['0点原子', (x, y, a) => x.type === 'atom' && y.type === 'atom' && x.pips <= 2 && !pt(a.from) && !pt(a.to)],
        ['吹雪1', (x, y) => x.type === 'blizzard' && y.type === 'blizzard' && x.pips === 1],
        ['火力枠1', (x, y) => x.type === FIRE && y.type === FIRE && x.pips === 1],
        ['吹雪2', (x, y) => x.type === 'blizzard' && y.type === 'blizzard' && x.pips === 2],
        ['火力枠2', (x, y) => x.type === FIRE && y.type === FIRE && x.pips === 2],
      ];
      for (const [label, f] of steps) { const a = pick(f); if (a) return opAct(a, obs, `${tag}：${label}どうしを合成（${a.from}→${a.to}）`); }
      return null;
    }
    // 2ウェーブ：ジョーカー（出目 p）で 0点原子→火力枠→吹雪 の順にコピーして、そのダイスと合成する組を作る
    function jokerPair(obs, p, tag, skipLeft) {
      const b = obs.board;
      const cs = copies(obs).filter(a => b[a.from].pips === p && !(skipLeft && a.from % 5 === 0));
      const order = [
        a => b[a.to].type === 'atom' && !pt(a.to),
        a => b[a.to].type === FIRE,
        a => b[a.to].type === 'blizzard',
      ];
      for (const f of order) {
        const a = cs.find(f);
        if (a) { S.pair = { from: a.from, to: a.to, toId: b[a.to].id }; return opAct(a, obs, `${tag}：ジョーカー${p}で${dn(b[a.to])}をコピーして合成の組を作る`); }
      }
      return null;
    }
    // 成長（出目 g）があるとき：出目 g−1 の合成できる組を合成（ジョーカーどうし・成長どうし、exclude に当たる組は除く）
    function growthMerge(obs, B, maxG, tag, exclude) {
      const b = obs.board;
      const gs = [...new Set(b.filter(d => d && d.type === 'growth' && d.pips >= 2 && d.pips <= maxG).map(d => d.pips))].sort((x, y) => x - y);
      for (const g of gs) {
        const list = merges(obs).filter(a => b[a.to].pips === g - 1 && !['joker', 'growth'].includes(b[a.to].type) && !(exclude && exclude(a)));
        const best = bestMerges(obs, list, B).sort((x, y) => y.v - x.v)[0];
        if (best) return opAct(best.a, obs, `${tag}：成長${g}があるので出目${g - 1}の${dn(b[best.a.to])}どうしを合成`);
      }
      return null;
    }
    function stuckPu(obs, tag) {
      for (const [r, L] of O.stuckPu) {
        const t = typeOf(r);
        if (t && lv(obs, t) < L && canPu(obs, t)) return opPu(t, `${tag}：詰まったので${nm[r]}をLv${lv(obs, t) + 1}に`);
      }
      return null;
    }

    function wave1(obs, B) {
      const b = obs.board;
      const r = copyGrowth(obs, 'W1'); if (r) return r;
      const r2 = growthMerge(obs, B, 2, 'W1'); if (r2) return r2;
      if (!full(b)) return summonReady(obs) && obs.sp >= obs.summonCost ? opSummon('W1：並べる') : null;
      if (satisfied(obs, b, B) && !keepMerging(obs)) return idle('W1：規定値を満たしているので合成しない');
      return earlyOrder(obs, B, 'W1');
    }
    function wave2(obs, B) {
      const b = obs.board;
      if (FIRE && lv(obs, FIRE) < O.w2FireLv && canPu(obs, FIRE)) return opPu(FIRE, `W2：火力枠をLv${lv(obs, FIRE) + 1}に`);
      const r0 = pairMerge(obs); if (r0) return r0;
      const r = copyGrowth(obs, 'W2'); if (r) return r;
      // 出目3以下の成長があるタイミング：出目−1の組（左列の出目2原子は除く）
      const r2 = growthMerge(obs, B, 3, 'W2', a => b[a.to].type === 'atom' && b[a.to].pips === 2 && a.from % 5 === 0 && a.to % 5 === 0);
      if (r2) return r2;
      if (!full(b)) return summonReady(obs) && obs.sp >= obs.summonCost ? opSummon('W2：召喚') : null;
      if (!satisfied(obs, b, B) || keepMerging(obs)) {
        const r3 = earlyOrder(obs, B, 'W2') || jokerPair(obs, 1, 'W2', false) || jokerPair(obs, 2, 'W2', true);
        if (r3) return r3;
      }
      return stuckPu(obs, 'W2');
    }
    function wave3(obs, B) {
      const b = obs.board;
      if (lv(obs, 'atom') < 5 && canPu(obs, 'atom')) return opPu('atom', `W${obs.wave}：原子をLv${lv(obs, 'atom') + 1}に`);
      const r0 = pairMerge(obs); if (r0) return r0;
      if (obs.wave <= O.forceGrowthUntil) { const g = copyGrowth(obs, `W${obs.wave}`); if (g) return g; }
      const u0 = U(obs, b, B);
      // ジョーカーのコピー：成長（原子点数が足りないほど重い）は評価で
      let best = null;
      for (const a of copies(obs)) {
        if (b[a.to].type !== 'growth') continue;
        const v = copyValue(obs, b, a, B) - u0;
        if (v > O.mergeMin && (!best || v > best.v)) best = { a, v, copy: true };
      }
      if (best) return opAct(best.a, obs, `W${obs.wave}：ジョーカー${b[best.a.from].pips}で成長をコピー（+${best.v.toFixed(1)}）`);
      const jr = jokerRole(obs, B, u0); if (jr) return jr;
      if (!full(b)) return summonReady(obs) && obs.sp >= obs.summonCost ? opSummon(`W${obs.wave}：召喚`) : null;
      const BM = bestMerges(obs, merges(obs), B);
      if (O.debug && obs.wave >= O.debug) ctx.log(`DBG W${obs.wave} u0=${u0.toFixed(1)} S=${atomScore(obs,b).toFixed(0)} B=${B.toFixed(0)} bz=${blizSum(obs,b).toFixed(2)} fc=${fireCap(obs,b).toFixed(0)} T=${afterTime(obs,b).toFixed(1)} ` + BM.map(m => `${dn(b[m.a.to])}${m.a.from}>${m.a.to}:${(m.v-u0).toFixed(1)}`).join(' '));
      // 成長どうし・ジョーカーどうしは、ほかに評価の上がる合成がないときだけ（罰点込みで評価する）
      const isJG = m => ['joker', 'growth'].includes(b[m.a.to].type);
      for (const pass of [false, true]) {
        for (const m of BM) {
          if (isJG(m) !== pass) continue;
          const v = m.v - u0;
          if (v > (pass ? O.jgMergeMin : O.mergeMin) && (!best || v > best.v)) best = { a: m.a, v };
        }
        if (best) break;
      }
      if (best) {
        const a = best.a;
        return opAct(a, obs, best.copy
          ? `W${obs.wave}：ジョーカー${b[a.from].pips}で${dn(b[a.to])}をコピー（+${best.v.toFixed(1)}）`
          : `W${obs.wave}：${dn(b[a.to])}どうしを合成 ${a.from}→${a.to}（+${best.v.toFixed(1)}、原子点数${atomScore(obs, b).toFixed(0)}/${B.toFixed(0)}）`);
      }
      // 4ウェーブまでは合成を止めない：評価の上がる手がなくても、召喚できるなら評価の下がり方が最も小さい組を合成
      if (keepMerging(obs)) {
        const k = BM.filter(m => !isJG(m)).sort((x, y) => y.v - x.v)[0];
        if (k) return opAct(k.a, obs, `W${obs.wave}：合成を止めない（${dn(b[k.a.to])}どうし ${(k.v - u0).toFixed(1)}）`);
      }
      return stuckPu(obs, `W${obs.wave}`) || spSink(obs, B, BM, u0);
    }
    // SPの使い道がない（盤面が埋まり、評価の上がる手もPUもない）のにSPが余っているとき：
    //   出目 sinkMaxPips 以下の組を、評価の下がり方が小さいものから合成して召喚に回す
    function spSink(obs, B, BM, u0) {
      if (obs.sp < obs.summonCost * O.sinkSummons) return null;
      const b = obs.board;
      const c = BM.filter(m => b[m.a.to].pips <= O.sinkMaxPips && !['joker', 'growth'].includes(b[m.a.to].type))
        .sort((x, y) => y.v - x.v)[0];
      if (!c || c.v - u0 < -O.sinkTol) return null;
      return opAct(c.a, obs, `W${obs.wave}：SPが余っているので${dn(b[c.a.to])}どうしを合成して召喚に回す（${(c.v - u0).toFixed(1)}）`);
    }

    // ---------- 判断 ----------
    function decideInner(obs) {
      if (obs.over) return null;
      POINTS = obs.wave >= O.lateFrom ? O.pointsLate : O.points;
      LEFT_BONUS = obs.nextBoss && obs.nextBoss.type === 'basilisk' && obs.phase !== 'boss' ? O.basiliskLeftBonus : 0;
      if (obs.wave !== S.wave) { S.wave = obs.wave; S.pair = null; ctx.log(`W${obs.wave}：ボーダー ${border(obs, obs.board).toFixed(0)}・原子点数 ${atomScore(obs, obs.board).toFixed(0)}`); }
      POINTS = obs.wave >= O.lateFrom ? O.pointsLate : O.points;
      LEFT_BONUS = obs.nextBoss && obs.nextBoss.type === 'basilisk' && obs.phase !== 'boss' ? O.basiliskLeftBonus : 0;
      const B = border(obs, obs.board);
      const r1 = killHacked(obs); if (r1) return r1;
      if (obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight') { const r = knightFight(obs); if (r) return r; }
      if (obs.wave <= 1) return wave1(obs, B) || idle('W1：待つ');
      if (obs.wave === 2) return wave2(obs, B) || idle('W2：待つ');
      return wave3(obs, B) || idle(`W${obs.wave}：待つ`);
    }

    return {
      decide(obs) {
        const saved = S.pair;
        const r = decideInner(obs);
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pair = saved; return null; }
        if (r && r.ops && r.ops.length) S.idle = null;
        return r;
      },
    };
  },
});
