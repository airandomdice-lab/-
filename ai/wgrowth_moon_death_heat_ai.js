// w成月死加熱AI（AI API v1）  RD.defineAgent('wgrowth_moondeathheat', ...)
// 月死加熱AI（moondeathheat）をもとに、ジョーカーを壊れた成長に替えたデッキ用にしたもの
// デッキ：壊れた成長・成長・月・死・過熱（加熱）。フィールド：プラズマシールド想定。本家 6.5.0 以降
// 月死加熱AIとの違い：ジョーカーの操作（成長のコピー・月のコピー・コピーして合成）をすべて抜いた。
//   壊れた成長どうしの合成は禁止（どのウェーブ・どの手順でも）。「成長の出目」を見る決まりは成長だけを見る
//
// コンセプト：雑魚は月で速くした死の即死に任せ、ボス・中ボスは月で火力を上げた加熱で倒す
//
// 判断の順番（最初に当てはまったものを行う。1回の判断で操作は1つ、more:true で続ける）
//   1. ボス戦：受けるボス（月の星のないナイト・詰みで月の星のないレオン）はスキルを待つ。
//      それ以外は、スキル（スライムは2つ目の角）までに倒せなければ危ない場面の手順
//   2. 通常ウェーブで先頭が2つ目の角を越えた：危ない場面の手順（月を活性 → 加熱を毎秒上げる）
//   3. 貫通の手順：次のボスをスキルまでに倒せる加熱の段階＋1段を目標に、残り0秒でその段階になるよう4秒ごとに1段上げる。
//      上げ始めたら（または残り10秒から）月を活性させる
//   4. 死のPU（W2以降：死の総出目 3・5・7・9 で Lv2・3・4・5／W4以降：SPがあればLv5まで）
//   5. 詰み（出目7のダイスが5個以上）なら盤面づくりはしない
//   5.4 W3まで：出目2以下の月どうしを、合成できるならすぐ合成
//   6. ウェーブごとの盤面づくり（W1・W2・W3・W4以降）
//
// 月の活性の手順：空きがあれば召喚、なければ守るダイス以外を 月どうし → 死どうし → 加熱どうし → 成長どうし の順で合成（月を3・5・7個に）
//   加熱のDPSを3割以上減らす手、W4以降は即死効率を5割以上下げる手も後回し（5割以上DPSを減らす手は禁止）
// 守るダイス：盤面で最高出目の月、月の星に隣接する最高出目の加熱
// 合成先の向き（どの手順でも）：①月4以上と隣接していない最高出目の加熱4以上の隣 ②加熱4以上と隣接していない最高出目の月4以上の隣
//   ③中央の行の真ん中の3マス ④4隅以外 ⑤4隅 の順で上のマスへ合成する。同じ優先度なら左のマス（同じ列なら上）
// どの手順でも：盤面の加熱のDPS（月のバフ・活性込み）を3割以上減らす手は後回し、5割以上減らす手は禁止
// W3まで：出目2以上の死どうしは合成しない
// W4以降：盤面の即死効率を5割以上下げる手は後回し。月6以上の隣にいない出目1の死は即死効率に数えない
// W4以降：中ボスを通路の1/4の長さで倒せる加熱の段階を保つ（貫通の手順の次）
// W1・W2：出目2以上の成長があれば、出目1の月・死・加熱どうしを合成。成長どうしの合成は禁止。壊れた成長どうしはずっと禁止
// 出目4以上の月が一度出るまでは、月の活性を気にしない（危ない場面でも加熱を上げるだけ）
// ボスのHPの見積もり：最後の湧きの雑魚1体のHP×(8＋5)＝ボスの基礎HP＋雑魚5体分
'use strict';

RD.defineAgent('wgrowth_moondeathheat', {
  name: 'w成月死加熱',
  desc: '壊れた成長・成長・月・死・加熱。月死加熱AIからジョーカーの操作を抜き、壊れた成長どうしの合成を禁止したもの',
  options: {
    dangerLine: 8.5,      // 危ない場面：先頭（ボス戦はボス）がこの位置（2つ目の角）を越えた
    reserveLead: 15,      // 貫通の手順：上げ始めるこの秒数前から、加熱に使うSPを残す
    heatGap: 4,           // 貫通の手順：加熱を1段上げる間隔（秒）。7秒より短くする（7秒で1段下がるため）
    pierceExtra: 1,       // 貫通の手順：貫通できる段階よりこの段数だけ上を目指す（上限は段階11）
    moonPrepLeft: 10,     // 貫通の手順：通常ウェーブの残りがこの秒数以下なら月を活性させる
    hpMargin: 1.15,       // 必要な火力に掛ける余裕
    travel: 0.3,          // 弾が届くまでの秒（倒す時間から引く）
    bossHpMul: 8,         // ボスの基礎HP＝最後の湧きのHP×この値（シミュの既定値）
    knightNoStarEat: true, // 月の星がなければナイトは受ける
    leonEatTime: 4,       // 詰みで月の星がないとき：レオンをこの秒数くらいで倒せる段階に抑える（咆哮を受ける）
    magicianHeal: 0.15,   // マジシャン：メテオの着弾までに倒す。1回目の回復の分だけHPに上乗せ
    tsumiStars: 5,        // 出目7のダイスがこの数以上で詰み（盤面づくりをやめる）
    refStage: 6,          // 手の良し悪しを比べるときの加熱の段階（DPSの比を見るだけ）
    dpsLate: 0.3,         // 盤面の加熱のDPSがこの割合以上減る手は後回し（どの手順でも）
    dpsBan: 0.5,          // 盤面の加熱のDPSがこの割合以上減る手は禁止（どの手順でも）
    killLate: 0.5,        // W4以降：盤面の即死効率がこの割合以上下がる手は後回し
    deathKeepPips: 2,     // W3まで：この出目以上の死どうしは合成しない
    deathMaxLv: 5,        // W4以降：SPがあれば死をこのLvまで
    bossZako: 5,          // ボスのHP＝ボスの基礎HP（最後の湧き×bossHpMul）＋雑魚この体数分
    starMaxDrop: 0.3,     // 月の星があるとき：星の隣の加熱を増やす手は、DPSがこの割合まで下がってもよい
    freePu: { moon: 5 },  // W4以降：SPが余っていれば（召喚5回分＋貫通の分を残して）このLvまで
    deathLvPips: [3, 5, 7, 9], // W2以降：盤面の死の総出目がこの値以上で Lv2・3・4・5
    midFrom: 4,           // このウェーブ以降：中ボスを通路の midLane の長さで倒せる加熱の段階を保つ
    midLane: 0.25,        // 中ボスを倒しきる距離（通路の長さに対する割合）
    midHpMul: 5,          // 中ボスのHP＝湧いた時点の雑魚のHP×この値（シミュの既定値）
    midSpeed: 0.52,       // 中ボスの元の速さ（単位/秒。シミュの既定値）
    ignoreDeath1Moon: 6,  // W4以降：この出目以上の月の隣にいない出目1の死は、即死効率に数えない
    noJGMergeUntil: 2,    // このウェーブまでは、成長どうしの合成を禁止（どの手順でも）。壊れた成長どうしはいつでも禁止
    lowMoonMergeUntil: 3, // このウェーブまでは、出目2以下の月どうしを合成できるならすぐ合成
    moonCareFrom: 4,      // この出目以上の月が一度出るまでは、月の活性を気にしない（月の活性の手順を使わない）
  },

  create(ctx) {
    const O = ctx.options;
    const NB = ctx.info.board.neighbors;
    const CFG = ctx.info.cfg || {};
    const CD = CFG.cd || 2000;
    const DECK = ctx.info.deck.map(d => d.type);
    const CLS = {}; for (const d of ctx.info.deck) CLS[d.type] = d.cls;
    const MOON_OK = [3, 5, 7];
    const HEAT = 'overheat';

    // ---------- HP表（エンジンと同じ式。本家 6.5.0 の増加幅） ----------
    const v650 = ctx.info.hpSpec !== '6.0.5';
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : v650 ? 20 * (w - 1) * (w + 4) * (w + 6) : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const spawnSteps = w => { let n = 0; for (let k = 1; waveT(w) - (k - 1) * waveDt(w) > 0; k++) n++; return n; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);

    const S = { wave: 0, plan: null, planKey: '', leonEat: false, idle: null, moon4: false };
    // 出目4以上の月が一度でも盤面に出たか（出たら以後ずっと月の活性を気にする）
    const moon4Seen = obs => S.moon4 || (S.moon4 = obs.board.some(d => d && d.type === 'moon' && d.pips >= O.moonCareFrom));

    // ---------- 道具 ----------
    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const md = n => Math.min(...MOON_OK.map(x => Math.abs(n - x)));
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };
    const puCost = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
    const canPu = (obs, t, reserve = 0) => (obs.legal.powerUp || []).includes(t) && obs.sp - puCost(obs, t) >= reserve;
    const costN = (c, n) => n * c + 5 * n * (n - 1);
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));
    const heatStage = obs => lv(obs, HEAT) - 1;
    const heatDecay = obs => { const d = obs.board.find(x => x && x.type === HEAT && x.state); return d ? d.state.decayIn : null; };
    const moonActive = b => MOON_OK.includes(count(b, 'moon'));
    const moonStarCells = b => b.map((d, i) => (d && d.type === 'moon' && d.pips === 7 ? i : -1)).filter(i => i >= 0);

    // ---------- 火力の式（月と加熱だけ） ----------
    // 加熱1個：P×{(1−c)+c×CD/100×(1+q)^s}÷I。R・P・c は隣の最大の月から
    function paradiseOf(obs) { const m = {}; for (const p of (obs.field && obs.field.paradise) || []) m[p.cell] = p.crit; return m; }
    function moonAt(b, i) { let m = 0; for (const j of NB[i]) { const n = b[j]; if (n && n.type === 'moon' && !n.sealed) m = Math.max(m, n.pips); } return m; }
    function moonR(obs, m, A) {
      if (!m) return 0;
      return Math.min(0.95, (0.01 * CLS.moon * m + 0.02 * (lv(obs, 'moon') - 1)) * (1 + 0.03 * A));
    }
    function heatDps(obs, b, s, forceA) {
      if (!CLS[HEAT]) return 0;
      const A = forceA != null ? forceA : (moonActive(b) ? 1 : 0);
      const ch = CLS[HEAT], base = Math.floor(400 * Math.pow(1.30 + 0.02 * (ch - 7), s));
      const cm = CD / 100 * Math.pow(1.40 + 0.02 * (ch - 7), s);
      const par = paradiseOf(obs);
      let sum = 0;
      b.forEach((d, i) => {
        if (!d || d.type !== HEAT || d.sealed || d.hacked) return;
        const m = moonAt(b, i);
        const R = moonR(obs, m, A);
        const I = 1.7 / d.pips * (1 - R);
        const c = Math.min(1, 0.05 + Math.max(0.05 * m * A, par[i] || 0));
        sum += base * (1 + 0.10 * m * A) * ((1 - c) + c * cm) / I;
      });
      return sum;
    }
    // 即死効率（体/秒）：Σ k×出目÷{1.2×(1−R)}、k＝5%＋0.2%×(クラス−5)＋0.5%×(Lv−1)
    function killEff(obs, b, forceA) {
      if (!CLS.death) return 0;
      const A = forceA != null ? forceA : (moonActive(b) ? 1 : 0);
      const k = 0.05 + 0.002 * (CLS.death - 5) + 0.005 * (lv(obs, 'death') - 1);
      let sum = 0;
      b.forEach((d, i) => {
        if (!d || d.type !== 'death' || d.sealed || d.hacked) return;
        const m = moonAt(b, i);
        if (obs.wave >= 4 && d.pips === 1 && m < O.ignoreDeath1Moon) return; // W4以降：月6以上の隣にいない出目1の死は数えない
        sum += k * d.pips / (1.2 * (1 - moonR(obs, m, A)));
      });
      return sum;
    }
    // 合成・コピーの結果（合成は種類がランダムなので、デッキの種類ごとの盤面を返す）
    function mergeBoards(b, a) {
      return DECK.map(t => { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; return nb; });
    }
    function copyBoard(b, a) { const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }
    const avg = (bs, f) => bs.reduce((s, x) => s + f(x), 0) / bs.length;
    // W4以降：盤面の即死効率が5割以上下がる手は後回し（期待値で判定）。true＝後回しにしなくてよい
    function killOk(obs, boards, before) {
      if (obs.wave < 4) return true;
      if (before == null) before = killEff(obs, obs.board);
      if (!(before > 0)) return true;
      return avg(boards, nb => killEff(obs, nb)) > before * (1 - O.killLate) + 1e-9;
    }
    // 盤面の加熱のDPSの判定：boards（合成・コピー後の盤面。合成はデッキの種類ごと）の平均が、今の何割になるか
    //   'ban'＝5割以上減る（禁止）／'late'＝3割以上減る（後回し）／'ok'。今のDPSが0なら判定しない
    function dpsJudge(obs, boards) {
      const now = heatDps(obs, obs.board, O.refStage);
      if (!(now > 0)) return 'ok';
      const r = avg(boards, nb => heatDps(obs, nb, O.refStage)) / now;
      return r <= 1 - O.dpsBan + 1e-9 ? 'ban' : r <= 1 - O.dpsLate + 1e-9 ? 'late' : 'ok';
    }
    const judgeMerge = (obs, a) => dpsJudge(obs, mergeBoards(obs.board, a));
    // 後回しにした手は、DPSの下がり方が小さいものから
    const dpsAfter = (obs, boards) => avg(boards, nb => heatDps(obs, nb, O.refStage));
    // W3まで：出目2以上の死どうしは合成しない
    const deathLocked = (obs, b, a) => obs.wave <= 3 && b[a.from].type === 'death' && b[a.to].type === 'death' && b[a.to].pips >= O.deathKeepPips;

    // ---------- 守るダイス ----------
    function topMoon(b) {
      let best = -1, bs = -1;
      b.forEach((d, i) => {
        if (!d || d.type !== 'moon') return;
        const adj = NB[i].reduce((a, j) => a + (b[j] && b[j].type === HEAT ? b[j].pips : 0), 0);
        const sc = d.pips * 100 + adj;
        if (sc > bs) { bs = sc; best = i; }
      });
      return best;
    }
    function topStarHeat(b) {
      let best = -1;
      for (const s of moonStarCells(b)) for (const j of NB[s]) if (b[j] && b[j].type === HEAT && (best < 0 || b[j].pips > b[best].pips)) best = j;
      return best;
    }
    function guard(b) {
      const g = new Set();
      const m = topMoon(b); if (m >= 0) g.add(m);
      const h = topStarHeat(b); if (h >= 0) g.add(h);
      return g;
    }

    // ---------- 操作 ----------
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });
    const opPu = (t, note) => ({ ops: [{ op: 'powerUp', type: t }], more: true, note });
    // W1・W2は成長どうしの合成を禁止（noJGMergeUntil）。壊れた成長どうしはいつでも禁止
    const jgLocked = (obs, a) => {
      const f = obs.board[a.from], t = obs.board[a.to];
      if (!f || !t || f.type !== t.type) return false;
      if (t.type === 'brokengrowth') return true;
      return obs.wave <= O.noJGMergeUntil && t.type === 'growth';
    };
    // 合成先の向き：合成の組（2マス）は、合成先がこの順で上のマスになる向きだけを使う
    //   0：月4以上と隣接していない、出目4以上で最高出目の加熱の隣
    //   1：加熱4以上と隣接していない、出目4以上で最高出目の月の隣
    //   2：中央の行の真ん中の3マス（6・7・8）
    //   3：4隅以外のマス
    //   4：4隅（0・4・10・14）
    //   組の2つのダイスは消える前提で見る（組の中の加熱・月は「最高出目」にも「隣接」にも数えない）
    const CORNERS = [0, 4, 10, 14], CENTER3 = [6, 7, 8];
    function destRank(b, c, pair) {
      const ex = new Set(pair);
      const lonely = (type, other) => {
        let best = 0, cells = [];
        b.forEach((d, i) => {
          if (!d || ex.has(i) || d.type !== type || d.pips < 4) return;
          if (NB[i].some(j => b[j] && !ex.has(j) && b[j].type === other && b[j].pips >= 4)) return;
          if (d.pips > best) { best = d.pips; cells = [i]; } else if (d.pips === best) cells.push(i);
        });
        return cells;
      };
      if (lonely(HEAT, 'moon').some(i => NB[i].includes(c))) return 0;
      if (lonely('moon', HEAT).some(i => NB[i].includes(c))) return 1;
      if (CENTER3.includes(c)) return 2;
      return CORNERS.includes(c) ? 4 : 3;
    }
    function merges(obs) {
      const b = obs.board, best = new Map();
      for (const a of obs.legal.acts) {
        if (a.result !== 'merge' || jgLocked(obs, a)) continue;
        const key = Math.min(a.from, a.to) * 15 + Math.max(a.from, a.to);
        const r = destRank(b, a.to, [a.from, a.to]);
        const cur = best.get(key);
        // 同じ優先度なら左のマス（同じ列なら上のマス）を合成先にする
        const left = cur && r === cur.r && (a.to % 5 < cur.a.to % 5 || (a.to % 5 === cur.a.to % 5 && a.to < cur.a.to));
        if (!cur || r < cur.r || left) best.set(key, { a, r });
      }
      return [...best.values()].map(x => x.a);
    }
    const summonReady = obs => obs.legal.summon && !(obs.control && obs.control.summonReadyIn > 1e-9);
    const canSummon = (obs, reserve) => summonReady(obs) && obs.sp - obs.summonCost >= reserve;
    const full = b => !b.some(d => !d);
    function idle(reason) { if (S.idle === reason) return null; S.idle = reason; return { ops: [], note: reason }; }

    // ---------- 月の活性の手順 ----------
    // 空きがあって召喚できれば召喚、なければ守り以外のダイスを次の順で合成（どの段も出目の低い組から）：
    //   月どうし → 死どうし → 加熱どうし → 成長どうし（壊れた成長どうしは禁止）
    //   どの手も「月の個数が3・5・7から遠ざからない見込み」のものだけ（月どうしの合成で個数が足りなくなる、など）
    function repairMoon(obs, _danger, tag, reserve = 0) {
      if (!CLS.moon) return null;
      if (!moon4Seen(obs)) return null;   // 出目4以上の月が出るまでは月の活性を気にしない
      const b = obs.board, mc = count(b, 'moon'), cur = md(mc);
      if (cur === 0) return null;
      const pMoon = DECK.includes('moon') ? 1 / DECK.length : 0;
      // 合成後の月の個数の見込み：月の個数が目標から遠ざからず、近づく見込みがあるか
      const mergeOk = a => {
        const n0 = mc - (b[a.from].type === 'moon' ? 1 : 0) - (b[a.to].type === 'moon' ? 1 : 0);
        const e = pMoon * md(n0 + 1) + (1 - pMoon) * md(n0);
        const p0 = (md(n0 + 1) === 0 ? pMoon : 0) + (md(n0) === 0 ? 1 - pMoon : 0);
        return e < cur - 1e-9 || (e <= cur + 1e-9 && p0 > 0);
      };
      // 召喚（空きがあれば）
      if (!full(b) && canSummon(obs, reserve)) {
        const e = pMoon * md(mc + 1) + (1 - pMoon) * cur;
        if (e < cur - 1e-9 || md(mc + 1) === 0) return opSummon(`${tag}：召喚（月${mc}個）`);
      }
      const g = guard(b), k0 = killEff(obs, b);
      // 後回しの手：加熱のDPSを3割以上減らす手、W4以降は即死効率を5割以上下げる手も {a, d（後のDPS）, k（後の即死効率）, copy}
      const late = [];
      const sortOut = (a, bs) => {
        const j = dpsJudge(obs, bs);
        if (j === 'ban') return false;
        if (j === 'late' || !killOk(obs, bs, k0)) { late.push({ a, d: dpsAfter(obs, bs), k: avg(bs, nb => killEff(obs, nb)) }); return false; }
        return true;
      };
      const pairs = t => merges(obs).filter(a => b[a.from].type === t && b[a.to].type === t && !g.has(a.from) && !g.has(a.to)
        && !deathLocked(obs, b, a) && mergeOk(a)).sort((x, y) => b[x.to].pips - b[y.to].pips)
        .filter(a => sortOut(a, mergeBoards(b, a)));
      const name = { moon: '月', death: '死', [HEAT]: '加熱', growth: '成長' };
      for (const t of ['moon', 'death', HEAT]) {
        const a = pairs(t)[0];
        if (a) return opAct(a, obs, `${tag}：${name[t]}${b[a.to].pips}どうしを合成（月${mc}個）`);
      }
      for (const t of ['growth']) {
        const a = pairs(t)[0];
        if (a) return opAct(a, obs, `${tag}：${name[t]}${b[a.to].pips}どうしを合成（月${mc}個）`);
      }
      // 後回しにした手（加熱のDPSの下がり方が小さいもの、次に即死効率の下がり方が小さいものから）
      if (late.length) {
        late.sort((x, y) => y.d - x.d || y.k - x.k);
        const L = late[0];
        return opAct(L.a, obs, `${tag}（後回しの手）：${name[b[L.a.to].type] || b[L.a.to].type}${b[L.a.to].pips}どうしを合成（月${mc}個）`);
      }
      return null;
    }

    // ---------- 危ない場面の手順：月を活性 → 加熱を毎秒上げる ----------
    function danger(obs, tag) {
      return repairMoon(obs, true, tag) || (canPu(obs, HEAT) ? opPu(HEAT, `${tag}：加熱を上げる（段階${heatStage(obs) + 1}へ）`) : null);
    }

    // ---------- 次のボスの計画 ----------
    // 戻り値 {type, mode（'pierce'／'eat'／'eatLeon'）, hp, time（倒す時間）, target（目標の段階）}
    function bossPlan(obs, tsumi) {
      const type = (obs.nextBoss && obs.nextBoss.type) || obs.bossType;
      const w = obs.wave, star = moonStarCells(obs.board).length > 0;
      const t0 = obs.deathWave ? (CFG.deathBossFirst != null ? CFG.deathBossFirst : 1.5) : 2;
      const last = tableHP(w, spawnSteps(w));                                // 最後の湧きの雑魚1体のHP
      let hp = last * (O.bossHpMul + O.bossZako);                              // 基礎HP＋雑魚5体分（吸収の見込み）
      const plan = { type, mode: 'pierce', hp, time: t0 };
      if (type === 'knight' && !star && O.knightNoStarEat) plan.mode = 'eat';
      else if (type === 'leon' && tsumi && !star) { plan.mode = 'eatLeon'; plan.time = O.leonEatTime; }
      else if (type === 'hacker') plan.time = t0 + 3;                         // ハッキングは予告から3秒後に効く
      else if (type === 'magician') { plan.time = t0 + 8 + 2; plan.hp *= 1 + O.magicianHeal; } // メテオの着弾まで（1回目は回復）
      else if (type === 'slime') {                                            // 分裂体まで全部（1＋0.6＋0.36倍）を2つ目の角まで
        const flow = obs.opponent && obs.opponent.flow ? obs.opponent.flow : 0;
        const v = 0.6 * (obs.deathWave ? 1 + (CFG.deathSpeedUp || 0.2) : 1) * (1 + flow);
        plan.time = O.dangerLine / v; plan.hp *= 1.96;
      }
      if (plan.mode === 'eat') { plan.target = 0; return plan; }
      const tEff = Math.max(0.1, plan.time - O.travel);
      const A = count(obs.board, 'moon') >= 3 ? 1 : 0;                        // 貫通の手順で月を活性させる前提
      let s = 0;
      while (s < 11 && heatDps(obs, obs.board, s, A) * tEff < plan.hp * (plan.mode === 'eatLeon' ? 1 : O.hpMargin)) s++;
      if (plan.mode === 'eatLeon' && s > 0 && plan.hp / Math.max(1, heatDps(obs, obs.board, s, A)) < t0 + 0.5) s--; // 咆哮の前に倒さない
      if (plan.mode === 'pierce') s = Math.min(11, s + O.pierceExtra);           // 貫通できる段階より1段上を目指す
      plan.target = s;
      return plan;
    }
    // 貫通に使うSP（目標の段階まで上げる分）。上げ始める reserveLead 秒前から取っておく
    const heatReserve = (obs, plan) => {
      const s = heatStage(obs);
      if (!plan || plan.target <= s || obs.timeLeft == null) return 0;
      if (obs.timeLeft > (plan.target - s) * O.heatGap + O.reserveLead) return 0;
      return 10 * (Math.pow(2, plan.target) - Math.pow(2, s));
    };

    // 貫通の手順（通常ウェーブ）：残り0秒で目標の段階になるように heatGap 秒ごとに1段。上げ始めたら（残り10秒からも）月を活性
    function pierce(obs, plan) {
      if (plan.mode === 'eat' || obs.timeLeft == null) return null;
      const s = heatStage(obs), n = plan.target - s, left = obs.timeLeft;
      const window = Math.max(0, n) * O.heatGap;
      if ((left <= O.moonPrepLeft || (n > 0 && left <= window + O.heatGap)) && !moonActive(obs.board)) {
        const r = repairMoon(obs, false, '貫通の準備：月を活性', heatReserve(obs, plan)); if (r) return r;
      }
      if (n > 0 && left <= window && canPu(obs, HEAT)) return opPu(HEAT, `貫通の準備：加熱を上げる（${s}→${plan.target}段・残り${left.toFixed(0)}秒）`);
      // 上げている途中で下がらないように（7秒で1段下がる）
      const dc = heatDecay(obs);
      if (s > 0 && s <= plan.target && dc != null && dc <= 1.2 && left <= plan.target * O.heatGap + O.heatGap && canPu(obs, HEAT))
        return opPu(HEAT, `貫通の準備：加熱が下がる前に上げる（${s}段）`);
      return null;
    }

    // ---------- W4以降：中ボスを通路の1/4で倒せる段階を保つ ----------
    // HP＝いま湧いている雑魚のHP×5（中ボスが通路にいればその最大HP）。速さ＝0.52×デスウェーブ×相手のフロー（いればその速さ）
    // 倒す時間＝通路の長さ×1/4÷速さ。その時間で倒せる最小の段階まで上げ、下がる前に押して保つ（どの段階でも倒せないなら何もしない）
    function midTarget(obs) {
      if (obs.wave < O.midFrom || obs.timeLeft == null || !CLS[HEAT]) return null;
      const w = obs.wave, el = waveT(w) - obs.timeLeft, k = Math.min(spawnSteps(w), Math.floor(Math.max(0, el) / waveDt(w)) + 2);
      const mids = obs.enemies.filter(e => e.kind === 'mid');
      const hp = Math.max(tableHP(w, k) * O.midHpMul, ...mids.map(e => e.maxHp));
      const flow = obs.opponent && obs.opponent.flow ? obs.opponent.flow : 0;
      const v = Math.max(O.midSpeed * (obs.deathWave ? 1 + (CFG.deathSpeedUp || 0.2) : 1) * (1 + flow), ...mids.map(e => e.speed || 0));
      const t = Math.max(0.1, (ctx.info.trackLength || 12) * O.midLane / v - O.travel);
      for (let s = 0; s <= 11; s++) if (heatDps(obs, obs.board, s) * t >= hp * O.hpMargin) return { s, hp, t };
      return null;
    }
    function keepMid(obs) {
      const m = midTarget(obs); if (!m) return null;
      const s = heatStage(obs), dc = heatDecay(obs);
      if (s < m.s && canPu(obs, HEAT)) return opPu(HEAT, `中ボス対策：加熱を上げる（${s}→${m.s}段・HP約${Math.round(m.hp)}を${m.t.toFixed(1)}秒で）`);
      if (s > 0 && s <= m.s && dc != null && dc <= 1.2 && canPu(obs, HEAT)) return opPu(HEAT, `中ボス対策：加熱が下がる前に上げる（${s}段）`);
      return null;
    }

    // ---------- ボス戦 ----------
    function bossFight(obs, tsumi) {
      const B = obs.boss, b = obs.board, star = moonStarCells(b).length > 0;
      if (B.type === 'knight' && !star && O.knightNoStarEat && B.cast === 0) return idle('ナイト：月の星がないので受ける');
      if (B.type === 'leon' && S.leonEat && B.cast === 0) return repairMoon(obs, false, 'レオン（咆哮を受ける）：月を活性') || idle('レオン：詰みで月の星がないので咆哮を受ける');
      const e = obs.enemies.find(x => x.id === B.id) || obs.enemies[0];
      const pos = e ? e.pos : 0;
      const dps = Math.max(1, heatDps(obs, b, heatStage(obs)));
      let hpRem = B.hp, deadline;
      if (B.type === 'slime') {
        hpRem = B.part ? B.partsHp * ((B.gen || 1) < 2 ? 1.6 : 1) : B.hp + 0.96 * B.maxHp;
        deadline = (O.dangerLine - pos) / Math.max(0.01, e && e.speed ? e.speed : 0.6);
      } else {
        deadline = B.skillIn == null ? Infinity : B.skillIn;
        if (B.type === 'hacker') deadline += 3;
        if (B.type === 'magician') deadline += B.cast % 2 === 0 ? 8 + 2 : 2;
      }
      if (pos >= O.dangerLine || hpRem / dps > deadline - 0.2)
        return danger(obs, `ボス戦（${B.name}）`) || idle(`ボス戦：打てる手なし`);
      return repairMoon(obs, false, 'ボス戦：月を活性') || idle(`ボス戦：${(hpRem / dps).toFixed(1)}秒で倒せる見込み`);
    }

    // ---------- W1〜W3 の盤面づくり ----------
    const sameTypeMerge = (b, a, types) => b[a.from].type === b[a.to].type && types.includes(b[a.to].type);
    function earlyBuild(obs, reserve) {
      const b = obs.board, w = obs.wave, tag = `W${w}`;
      const late = [];
      // 加熱のDPSの判定：禁止は外し、後回しは late へ
      const okM = list => list.filter(a => { const j = judgeMerge(obs, a); if (j === 'late') late.push(a); return j === 'ok'; });
      const hasGrowth = p => b.some(d => d && d.type === 'growth' && d.pips >= p);
      if (w === 1) {
        if (hasGrowth(2)) {
          const a = okM(merges(obs).filter(a => b[a.to].pips === 1 && sameTypeMerge(b, a, ['moon', 'death', HEAT])))[0];
          if (a) return opAct(a, obs, `${tag}：成長2が出たので出目1の${b[a.to].type}どうしを合成`);
        }
        return canSummon(obs, reserve) ? opSummon(`${tag}：並べる`) : null;
      }
      // W2・W3
      if (w === 2 && hasGrowth(2)) {
        const a = okM(merges(obs).filter(a => b[a.to].pips === 1 && sameTypeMerge(b, a, ['moon', 'death', HEAT])))[0];
        if (a) return opAct(a, obs, `${tag}：成長2があるので出目1の${b[a.to].type}どうしを合成`);
      }
      if (hasGrowth(3)) {
        const a = okM(merges(obs).filter(a => b[a.to].pips === 2 && b[a.to].type !== 'growth' && b[a.to].type !== 'brokengrowth' && b[a.from].type === b[a.to].type && !deathLocked(obs, b, a)))[0];
        if (a) return opAct(a, obs, `${tag}：成長3が出たので出目2の組を合成`);
      }
      if (!full(b)) return canSummon(obs, reserve) ? opSummon(`${tag}：召喚`) : null;
      const ms = okM(merges(obs));
      const lowMoon = ms.filter(a => b[a.to].pips <= 2 && sameTypeMerge(b, a, ['moon'])).sort((x, y) => b[x.to].pips - b[y.to].pips)[0];
      if (lowMoon) return opAct(lowMoon, obs, `${tag}：出目2以下の月どうしを合成`);
      const order = [HEAT, 'death', 'moon'];
      const rest = ms.filter(a => sameTypeMerge(b, a, order) && !deathLocked(obs, b, a))
        .sort((x, y) => b[x.to].pips - b[y.to].pips || order.indexOf(b[x.to].type) - order.indexOf(b[y.to].type))[0];
      if (rest) return opAct(rest, obs, `${tag}：${b[rest.to].type}${b[rest.to].pips}どうしを合成`);
      // 後回しにした手（月・死・加熱どうしのうち、加熱のDPSの下がり方が小さいものから）
      const lt = [...new Set(late)].filter(a => sameTypeMerge(b, a, order) && !deathLocked(obs, b, a))
        .sort((x, y) => dpsAfter(obs, mergeBoards(b, y)) - dpsAfter(obs, mergeBoards(b, x)))[0];
      if (lt) return opAct(lt, obs, `${tag}（後回しの手）：${b[lt.to].type}${b[lt.to].pips}どうしを合成`);
      return null;
    }

    // ---------- W4以降：火力上げ ----------
    function evalMove(obs, before, boards) {
      const s = O.refStage;
      return { dps: avg(boards, nb => heatDps(obs, nb, s)) / Math.max(1e-9, before.dps), kill: avg(boards, nb => killEff(obs, nb)) };
    }
    function starMove(obs, g, before, reserve) {
      const b = obs.board, stars = moonStarCells(b);
      const adj = new Set(); for (const s of stars) for (const j of NB[s]) adj.add(j);
      const top = topStarHeat(b);
      const metric = nb => [...adj].reduce((a, j) => a + (nb[j] && nb[j].type === HEAT ? nb[j].pips : 0), 0);
      const m0 = metric(b);
      const ok = (boards) => evalMove(obs, before, boards).dps >= 1 - O.starMaxDrop && dpsJudge(obs, boards) !== 'ban' && killOk(obs, boards, before.kill);
      // イ) 星の隣のマスへ合成（1/5で加熱）
      let bm = null;
      for (const a of merges(obs)) {
        if (!adj.has(a.to) || a.to === top || a.from === top || g.has(a.from) || g.has(a.to) || b[a.to].type === 'moon') continue;
        const boards = mergeBoards(b, a);
        const gain = avg(boards, metric) - m0;
        if (gain > 1e-9 && ok(boards) && (!bm || gain > bm.gain)) bm = { a, gain };
      }
      if (bm) return opAct(bm.a, obs, `月の星：隣のマスへ合成（隣の加熱の出目 +${bm.gain.toFixed(2)}見込み）`);
      // ウ) 星の隣が空いていれば召喚
      if ([...adj].some(j => !b[j]) && canSummon(obs, reserve)) return opSummon('月の星：隣の空きに召喚');
      // エ) 星の隣の加熱以外（月・守り以外）を、隣でないマスへ合成して空ける
      for (const a of merges(obs)) {
        if (!adj.has(a.from) || adj.has(a.to) || g.has(a.from) || g.has(a.to)) continue;
        if (b[a.from].type === HEAT || b[a.from].type === 'moon') continue;
        if (ok(mergeBoards(b, a))) return opAct(a, obs, '月の星：隣を空ける');
      }
      return null;
    }
    function build4(obs, reserve) {
      const b = obs.board, g = guard(b);
      const before = { dps: heatDps(obs, b, O.refStage), kill: killEff(obs, b) };
      if (moonStarCells(b).length) { const r = starMove(obs, g, before, reserve); if (r) return r; }
      if (!full(b)) return canSummon(obs, reserve) ? opSummon('火力上げ：召喚') : null;
      const deferred = [];
      const judge = boards => dpsJudge(obs, boards);                                           // 'ban'＝禁止／'late'＝後回し
      const killLate = boards => !killOk(obs, boards, before.kill);                              // 即死効率が5割以上下がる → 後回し
      // 死どうし → 月どうし → 加熱どうし（出目の低い組から）
      for (const t of ['death', 'moon', HEAT]) {
        const ms = merges(obs).filter(a => b[a.from].type === t && b[a.to].type === t && !g.has(a.from) && !g.has(a.to)).sort((x, y) => b[x.to].pips - b[y.to].pips);
        for (const a of ms) {
          const bs = mergeBoards(b, a);
          const j = judge(bs);
          if (j === 'ban') continue;
          if (j === 'late' || killLate(bs)) { deferred.push({ a, d: dpsAfter(obs, bs), k: avg(bs, nb => killEff(obs, nb)) }); continue; }
          return opAct(a, obs, `火力上げ：${t}${b[a.to].pips}どうしを合成`);
        }
      }
      // 後回しにした手
      if (deferred.length) {
        deferred.sort((x, y) => y.d - x.d || y.k - x.k);   // 加熱のDPSの下がり方が小さいもの、次に即死効率の下がり方が小さいものから
        const D = deferred[0];
        return opAct(D.a, obs, `火力上げ（後回しの手）：${b[D.a.to].type}${b[D.a.to].pips}どうしを合成`);
      }
      return null;
    }

    // ---------- PU ----------
    function deathPu(obs, reserve) {
      if (!CLS.death) return null;
      const L = lv(obs, 'death'), w = obs.wave;
      // W2以降：死の総出目で目標Lv（3→Lv2・5→Lv3・7→Lv4・9→Lv5）。W4以降は総出目に関係なく最大まで
      const sum = obs.board.reduce((a, d) => a + (d && d.type === 'death' ? d.pips : 0), 0);
      let goal = 1;
      if (w >= 4) goal = O.deathMaxLv;
      else if (w >= 2) O.deathLvPips.forEach((p, k) => { if (sum >= p) goal = k + 2; });
      if (L < goal && canPu(obs, 'death', reserve)) return opPu('death', `死をLv${L + 1}に${w >= 4 ? '（SPがあるので最大まで）' : ''}`);
      return null;
    }
    function freePu(obs, reserve) {
      if (obs.wave < 4) return null;
      for (const t of Object.keys(O.freePu || {})) {
        if (!CLS[t] || lv(obs, t) >= O.freePu[t]) continue;
        if (canPu(obs, t, reserve + costN(obs.summonCost, 5))) return opPu(t, `${t}をLv${lv(obs, t) + 1}に（SPに余裕）`);
      }
      return null;
    }

    // ---------- 判断 ----------
    function decideInner(obs) {
      if (obs.over) return null;
      const b = obs.board;
      if (obs.wave !== S.wave) { S.wave = obs.wave; S.planKey = ''; }
      const tsumi = b.filter(d => d && d.pips === 7).length >= O.tsumiStars;

      // 1. ボス戦
      if (obs.phase === 'boss' && obs.boss) return bossFight(obs, tsumi);
      const front = obs.enemies[0];
      // ボス後の残り・抽選など
      if (obs.phase !== 'wave') {
        if (front && front.pos >= O.dangerLine) return danger(obs, '残りの敵が2つ目の角を越えた') || idle('残りの敵：打てる手なし');
        return repairMoon(obs, false, 'ボス後：月を活性') || idle('ボス後・抽選中');
      }

      // 2. 危ない場面
      if (front && front.pos >= O.dangerLine) return danger(obs, '危ない場面') || idle('危ない場面：打てる手なし');

      // 3. 貫通の手順
      const plan = bossPlan(obs, tsumi);
      S.leonEat = plan.mode === 'eatLeon';
      const key = `${plan.type}/${plan.mode}/${plan.target}`;
      if (key !== S.planKey) { S.planKey = key; ctx.log(`W${obs.wave} ${plan.type}：${plan.mode === 'eat' ? '受ける' : plan.mode === 'eatLeon' ? '咆哮を受ける' : '貫通'}　HP約${Math.round(plan.hp)}・${plan.time.toFixed(1)}秒以内 → 加熱の目標 ${plan.target}段`); }
      const r3 = pierce(obs, plan); if (r3) return r3;
      // 3.5 W4以降：中ボスを通路の1/4で倒せる加熱の段階を保つ
      const r35 = keepMid(obs); if (r35) return r35;
      const reserve = heatReserve(obs, plan);

      // 4. 死のPU
      const r4 = deathPu(obs, reserve); if (r4) return r4;

      // 5. 詰み
      if (tsumi) return freePu(obs, reserve) || idle('詰み（出目7が5個以上）：盤面づくりをやめた');

      // 5.4 W3まで：出目2以下の月どうしは、合成できるならすぐ合成（盤面が埋まっていなくても。加熱のDPSを5割以上減らす手だけは打たない）
      if (obs.wave <= O.lowMoonMergeUntil) {
        const a = merges(obs).filter(a => b[a.from].type === 'moon' && b[a.to].type === 'moon' && b[a.to].pips <= 2 && judgeMerge(obs, a) !== 'ban')
          .sort((x, y) => b[x.to].pips - b[y.to].pips)[0];
        if (a) return opAct(a, obs, `W${obs.wave}：出目${b[a.to].pips}の月どうしをすぐ合成`);
      }

      // 6. 盤面づくり
      if (obs.wave <= 3) return earlyBuild(obs, reserve) || idle(`W${obs.wave}：待つ`);
      return build4(obs, reserve) || freePu(obs, reserve) || idle('火力上げ：打つ手なし（SP待ち）');
    }

    return {
      decide(obs) {
        const r = decideInner(obs);
        // 重ねる操作のドラッグ中・間隔待ちなら、重ねる操作は出さずに待つ
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) return null;
        if (r && r.ops && r.ops.length) S.idle = null;
        return r;
      },
    };
  },
});
