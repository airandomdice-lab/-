// 炎フローAIフロー特化版 1.2（AI API v1／AI_AGENT_GUIDE 1.13.x・AIRandomDicesim 4.3.4 で確認）
// 登録ID：fire_flow_flowspec（炎フローロイヤル基本AI fire_flow_royal_basic とは別のAI。同時に読み込める）
// 想定デッキ：炎・フロー・ロイヤル・成長・ジョーカー　想定フィールド：神々の楽園　対戦用
//
// 用語
//   クリティカルマス：神々の楽園の会心マス（2つ）。楽園でなければクリティカルマスの規則は使わない
//   クリマスの条件：どちらかのクリティカルマスに出目2以上の炎がある
//   条件の炎：条件を満たしているクリティカルマスの炎（両方なら出目の高いほう）。合成に使わない
//   フローの合計出目：盤面のフローの出目の合計
//   ペアがない：盤面に同じ種類・同じ出目のダイスがほかにない
//
// 全ウェーブ共通（炎フローロイヤル基本AIから引き継ぐもの）
//   ・炎の残り回数が3回（2W以降は30回＝最大50回の6割）を切ったら別の炎にかざして再点火。やることがないときも再点火
//   ・クリティカルマスのダイスを合成に使うとき：出目2以下ならクリティカルマスへ向かって、3以上なら逃がすように合成
//   ・炎同士の合成は、盤面の炎が4個以上のときだけ
//   ・PUの目標があってSPが足りない間は召喚しない
//   ・ジョーカーでコピーしてペアを作ったら、次の手でそのペアを合成する（ロイヤルの「最高出目のペアは残す」より優先）
//
// 1W
//   召喚（SPがあり空きマスがあれば）
//   フローの合計出目が5を超えたらフローLv2。相手の先頭の敵が2つ目の角（8.5）を越えていたら、ジョーカーでフローをコピーしてフローLv2
//   ジョーカーで成長をコピー
//   出目2の成長があれば（埋まっていなくても）出目1の炎同士・ロイヤル同士・フロー同士。出目2の成長がなく、埋まっていなければ合成しない
//   盤面が埋まったら 炎同士・ロイヤル同士（出目3以上の最高出目のロイヤルのペアは残す）
//     クリマスの条件を満たしていなければ、クリティカルマスのダイスを含む組を先に選ぶ
//   余ったジョーカー：クリマスの条件を満たすために使う（クリティカルマスのジョーカーで炎をコピー → ジョーカーでクリティカルマスのダイスをコピーして相方を作る）。
//     条件を満たしたら成長のために残す
// 2W
//   フローの合計出目が10を超えたらフローLv3（5を超えたらLv2）
//   クリマスの条件を満たしていなければ出目上げ（クリティカルマスのダイス〔ジョーカー以外〕＋同じ出目のダイス → クリティカルマスのジョーカーで外の炎をコピー
//     → ジョーカーでクリティカルマスのダイスをコピーして相方を作る）
//   炎同士・ロイヤル同士（最高出目のロイヤルのペアは残す）
//   詰まったら：出目2以下のジョーカーで、ペアがない出目2以下のロイヤルをコピーして打つ → 出目2以下のジョーカーで、ペアがない炎をコピーして合成
//   出目3以上のジョーカーでフローをコピー
// 3W以降
//   フローLv4までPU
//   残り45秒の時点で相手の先頭の敵がレーンの真ん中を越えていなければ（このウェーブはそれ以降ずっと）：残していたロイヤルも打ち、ジョーカーは全てフローをコピー
//   ロイヤル同士（上の時点までは最高出目のペアを残す）→ 炎同士 → ジョーカーでフローをコピー（上の時点までは出目3以上のジョーカーだけ）
//   → フローをコピーできないジョーカーで、ペアがないロイヤル・炎をコピーして合成 → ジョーカー同士
//   詰まったら：フローLv5 → 炎Lv5 の順にPU
// 4W以降（1.1）：上の「残り45秒で相手の先頭が真ん中の手前」になったら、3Wの手順の前に
//   ロイヤルのペアを作る：盤面で最も高い出目のロイヤル（出目P）にペアがなければ、出目P−1のフロー同士を合成していく
//   ペアができたら：炎同士 → ジョーカーでフローをコピー → ロイヤルを打つ（高い出目から）
//   （出目P−1のフローのペアがなければ、3Wの手順に戻る）
// 変更：1.1　4W以降の残り45秒の手順（ロイヤルのペアを作ってから 炎同士 → フローのコピー → ロイヤルを打つ）を追加
//       1.2　暗殺対面（相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべてある）を追加。ファイル全体を (() => { … })(); で包んだ
//
// 暗殺対面（1.2。asnMode）：ほかの立ち回りは使わない。操作速度・判断速度を0.1秒に（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ時間。asnSpeed）
//   1. 暗殺が飛んできたとき（着弾の早い順。ドラッグが着弾までに終わらないときはしない。ほかの暗殺の予告マスへは動かさない）
//      炎：盤面の最後の炎（炎が1個）なら、同じ出目のジョーカーで炎をコピーする。それ以外の炎は避けない
//      フロー・ロイヤル：懸賞金の付いていない同じ種類・同じ出目のダイスへ合成して逃がす
//      ジョーカー：同じ出目の 炎 → ロイヤル → 成長 の順にコピーして避ける
//      成長：避けない
//   2. 召喚（盤面を広げる）
//   3. こちらの先頭のモンスターが2つ目の角（8.5）を越えたら、フロー同士を合成（低い出目から）
//   4. することがなければ炎の再点火（残り回数が最も少ない炎）
(() => {
'use strict';

// 暗殺対面の判定：相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべて入っている
const FFS_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function ffsIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return FFS_ASN_DECK.every(t => ts.has(t));
}

RD.defineAgent('fire_flow_flowspec', {
  name: '炎フローAIフロー特化版',
  desc: '炎・フロー・ロイヤル・成長・ジョーカー用（楽園・対戦用）。フローを育てる版。クリマスの条件は「どちらかのクリティカルマスに出目2以上の炎」で、その炎は合成に使わない。1W：召喚、ジョーカーで成長をコピー、出目2成長があれば出目1の炎・ロイヤル・フロー同士、埋まったら炎同士・ロイヤル同士（出目3以上の最高出目ペアは残す。条件未達ならクリティカルマスを巻き込む）、余ったジョーカーは条件のために使う、フロー合計出目5超でLv2、相手が2角を越えたらジョーカーでフローをコピーしてLv2。2W：条件未達なら出目上げ、炎同士・ロイヤル同士（最高出目ペアは残す）、詰まったら出目2以下のジョーカーでペアのない出目2以下のロイヤル→炎をコピーして合成、出目3以上のジョーカーでフローをコピー、合計出目10超でLv3。3W以降：フローLv4、残り45秒で相手が真ん中の手前なら残したロイヤルも打ちジョーカーは全てフローへ、ロイヤル・炎同士、あぶれたロイヤル・炎をジョーカーでコピーして合成、ジョーカー同士、詰まったらフロー・炎をLv5へ。4W以降は残り45秒で相手が真ん中の手前なら、最高出目Pのロイヤルにペアがなければ出目P−1のフロー同士を合成してペアを作り、できたら炎同士→ジョーカーでフローをコピー→ロイヤルを打つ。暗殺対面（相手に懸賞金・暗殺・生贄・適応・ジョーカー）は速度0.1秒で、暗殺避け（最後の炎はジョーカーでコピー、フロー・ロイヤルは懸賞金のない同じダイスへ合成、ジョーカーは炎→ロイヤル→成長をコピー）→召喚→2角を越えたらフロー同士→することがなければ再点火。',
  // 暗殺対面では操作速度・判断速度を asnSpeed 秒に（それ以外はシミュレータの設定のまま）
  limits: (o, info) => (o.asnMode && o.asnSpeed && ffsIsAsn(info)) ? { interval: o.asnSpeed, actInterval: o.asnSpeed, summonInterval: o.asnSpeed, dragTime: o.asnSpeed } : null,
  options: {
    asnMode: true,           // 暗殺対面の動きにする（相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカー）
    asnSpeed: 0.1,           // 暗殺対面の操作速度・判断速度（秒）
    asnCorner: 8.5,          // 暗殺対面：こちらの先頭のモンスターがこの位置（2つ目の角）を越えたらフロー同士を合成
    refuelBelow: 3, refuelRatio2: 0.6, idleRefuel: true, shotCost: 0.02,
    critToMax: 2,            // クリティカルマスのダイスの出目がこれ以下なら向かって合成、より大きければ逃がす
    critFireMin: 2,          // クリマスの条件：クリティカルマスの炎の出目がこれ以上
    minFireToMerge: 4,       // 炎同士を合成するのに必要な盤面の炎の数
    flowSumLv2: 5, flowSumLv3: 10, // フローの合計出目がこれを超えたら Lv2／Lv3
    corner2: 8.5,            // 2つ目の角（1Wで相手の先頭がここを越えたらフローをコピー・Lv2）
    w1KeepRoyalMin: 3,       // 1W：残す最高出目のロイヤルのペアの出目の下限
    smallJokerMax: 2,        // 2W：詰まったときに使うジョーカー・ロイヤルの出目の上限
    lateLeft: 45,            // 3W以降：残りこの秒数で相手の先頭を見る
    centerProgress: 0.5,     // 相手の先頭の敵がこれを超えたら「真ん中を越えた」
    flowLv3W: 4, stuckLvMax: 5,
    royalPairFromWave: 4,    // このウェーブ以降、残り45秒の手順でロイヤルのペアを作る
    saveForPU: true,
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options;
    const NAME = { fire: '炎', flow: 'フロー', royal: 'ロイヤル', growth: '成長', joker: 'ジョーカー' };
    const nm = t => NAME[t] || t;
    const TL = ctx.info.trackLength || 12;
    let critCells = null;
    const ASN = !!(o.asnMode && ffsIsAsn(ctx.info));   // 暗殺対面

    const normalDecide = (obs) => {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {}, W = obs.wave;
      let mem; try { mem = JSON.parse(obs.memory || '{}') || {}; } catch (e) { mem = {}; }
      const out = x => { x.memory = JSON.stringify(mem); return x; };
      if (!critCells) critCells = ((obs.field && obs.field.paradise) || []).map(p => p.cell);
      const isCrit = i => critCells.includes(i);
      const is = (i, t) => !!(b[i] && b[i].type === t);
      const cells = t => [...Array(15).keys()].filter(i => is(i, t) && !b[i].sealed);
      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const find = (f, t, res) => { const a = legal.get(f * 15 + t); return a && a.result === res ? a : null; };
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      const full = b.every(Boolean);
      const act = (a, note) => out({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note });

      // ---------- 再点火 ----------
      const shotsLeft = i => Math.round(((b[i].state && b[i].state.power) ?? 1) / o.shotCost);
      const hov = obs.legal.hovers || [];
      const maxShots = Math.round(1 / o.shotCost);
      const refuel = (line, why) => {
        for (const f of cells('fire').filter(i => shotsLeft(i) < line).sort((p, q) => shotsLeft(p) - shotsLeft(q))) {
          const h = hov.filter(x => x.from === f && x.result === 'refuel').sort((p, q) => shotsLeft(p.to) - shotsLeft(q.to))[0];
          if (h) return out({ ops: [{ op: 'hover', from: h.from, to: h.to }], more: true, note: `${why}：${f}の炎（残り${shotsLeft(f)}回）を${h.to}の炎にかざす` });
        }
        return null;
      };
      { const r = refuel(W >= 2 ? maxShots * o.refuelRatio2 : o.refuelBelow, '再点火'); if (r) return r; }
      const idle = note => (o.idleRefuel && refuel(maxShots, 'やることがないので再点火')) || out({ ops: [], note });

      // ---------- 相手・クリマス ----------
      const opp = obs.opponent;
      const oppPos = opp && opp.front ? opp.front.progress * TL : 0;
      const critFire = i => is(i, 'fire') ? b[i].pips : 0;
      const critOK = critCells.length >= 2 && critCells.some(c => critFire(c) >= o.critFireMin);
      const keepFire = critOK ? critCells.filter(c => critFire(c) >= o.critFireMin).sort((p, q) => critFire(q) - critFire(p))[0] : null; // 条件の炎
      // 3W以降：残り45秒の時点で相手の先頭が真ん中の手前なら、このウェーブは「打つ」
      if (W >= 3 && obs.phase === 'wave' && obs.timeLeft != null && obs.timeLeft <= o.lateLeft && mem.lateW !== W && oppPos <= TL * o.centerProgress) mem.lateW = W;
      const late = W >= 3 && mem.lateW === W;

      // ---------- 合成の道具 ----------
      function mergeOf(x, y) {
        let f = x, t = y;
        const cx = isCrit(x), cy = isCrit(y);
        if (cx || cy) { const c = cx ? x : y, other = c === x ? y : x; if (b[c].pips <= o.critToMax) { f = other; t = c; } else { f = c; t = other; } }
        return find(f, t, 'merge');
      }
      const free = i => i !== keepFire;                    // 条件の炎は使わない
      const fireCountOk = () => cells('fire').length >= o.minFireToMerge;
      // 同じ種類・同じ出目の合成（低い出目から。critFirst ならクリティカルマスを含む組を先に）
      const pairsOf = (t, maxPips, filter, critFirst) => {
        const L = cells(t).filter(free), res = [];
        for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) {
          if (b[L[x]].pips !== b[L[y]].pips || b[L[x]].pips > maxPips) continue;
          const m = mergeOf(L[x], L[y]);
          if (m && (!filter || filter(m))) res.push(m);
        }
        const cr = m => (isCrit(m.from) || isCrit(m.to)) ? 0 : 1;
        return res.sort((p, q) => (critFirst ? cr(p) - cr(q) : 0) || b[p.from].pips - b[q.from].pips || p.from - q.from);
      };
      const firePairs = (maxPips = 7, critFirst) => fireCountOk() ? pairsOf('fire', maxPips, null, critFirst) : [];
      // ロイヤル：最高出目のペア（minPips 以上）は残す。同じ出目が4個以上あれば合成してよい
      const royalPairs = (keep, minPips, critFirst) => {
        const cnt = p => cells('royal').filter(i => b[i].pips === p).length;
        let kp = 0; if (keep) for (let p = 7; p >= minPips; p--) if (cnt(p) >= 2) { kp = p; break; }
        const cr = m => (isCrit(m.from) || isCrit(m.to)) ? 0 : 1;
        return pairsOf('royal', 7, m => !(kp && b[m.from].pips === kp && cnt(kp) < 4)).sort((p, q) => (critFirst ? cr(p) - cr(q) : 0) || b[q.from].pips - b[p.from].pips);
      };
      const note = (m, label) => `${label}（${nm(b[m.from].type)}${b[m.from].pips}、${m.from}→${m.to}${isCrit(m.to) ? '・クリティカルマスへ' : isCrit(m.from) ? '・クリティカルマスから逃がす' : ''}）`;
      const jokers = (lo, hi) => cells('joker').filter(j => b[j].pips >= lo && b[j].pips <= hi);
      const copy = (J, t, filt) => { for (const j of J) for (const x of cells(t)) { if (filt && !filt(x, j)) continue; const a = find(j, x, 'copy'); if (a) return a; } return null; };
      const lonely = x => !cells(b[x].type).some(y => y !== x && b[y].pips === b[x].pips);
      // ジョーカーでコピーしてペアを作り、記録する（次の手で合成）
      const makePair = (a, why) => { mem.pair = { j: a.from, x: a.to, t: b[a.to].type, p: b[a.to].pips }; return act(a, `${why}：ジョーカー${a.from}で${nm(b[a.to].type)}${b[a.to].pips}をコピー（ペアを作る）`); };

      // ---------- PU → 召喚 ----------
      const lv = t => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 99; };
      const flowSum = cells('flow').reduce((s, i) => s + b[i].pips, 0);
      let tgt = 0;
      if (flowSum > o.flowSumLv2) tgt = 2;
      if (W >= 2 && flowSum > o.flowSumLv3) tgt = 3;
      if (W === 1 && oppPos > o.corner2) tgt = Math.max(tgt, 2);
      if (W >= 3) tgt = Math.max(tgt, o.flowLv3W);
      let savePU = false;
      if (tgt && lv('flow') < tgt) {
        if (obs.legal.powerUp.includes('flow')) return out({ ops: [{ op: 'powerUp', type: 'flow' }], more: true, note: `PU フロー Lv${lv('flow') + 1}（目標Lv${tgt}、フローの合計出目${flowSum}）` });
        savePU = o.saveForPU;
      }
      // 3W以降で詰まっていたら（前の判断で手がなかった）：フローLv5 → 炎Lv5
      if (W >= 3 && mem.stuckW === W) {
        for (const t of ['flow', 'fire']) if (lv(t) < o.stuckLvMax) {
          if (obs.legal.powerUp.includes(t)) return out({ ops: [{ op: 'powerUp', type: t }], more: true, note: `詰まったのでPU ${nm(t)} Lv${lv(t) + 1}` });
          savePU = savePU || o.saveForPU; break;
        }
      }
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !savePU) return out({ ops: [{ op: 'summon' }], more: true, note: '召喚' });
      if (!actReady) return idle(null);

      // ---------- 作ったペアの合成 ----------
      if (mem.pair) {
        const P = mem.pair; delete mem.pair;
        if (is(P.j, P.t) && is(P.x, P.t) && b[P.j].pips === P.p && b[P.x].pips === P.p && free(P.j) && free(P.x) && (P.t !== 'fire' || fireCountOk())) {
          const m = mergeOf(P.j, P.x); if (m) return act(m, note(m, '作ったペアを合成'));
        }
      }

      // ---------- クリマスの条件を満たすための手 ----------
      function critRaise(withMerge) {
        if (critCells.length < 2 || critOK) return null;
        const order = critCells.filter(c => b[c] && !b[c].sealed).sort((p, q) => critFire(q) - critFire(p) || b[p].pips - b[q].pips);
        if (withMerge) for (const c of order) { // クリティカルマスのダイス（ジョーカー以外）＋同じ出目のダイス
          if (is(c, 'joker')) continue;
          const t = b[c].type;
          if (t === 'fire' && !fireCountOk()) continue;
          for (const x of cells(t)) { if (x === c || b[x].pips !== b[c].pips) continue; const m = mergeOf(c, x); if (m) return act(m, note(m, 'クリマスの出目上げ')); }
        }
        for (const c of order) if (is(c, 'joker')) { const a = copy([c], 'fire', x => !isCrit(x)); if (a) return act(a, `クリマスの出目上げ：クリティカルマス${c}のジョーカーで炎${b[a.to].pips}をコピー`); }
        for (const c of order) { // ジョーカーでクリティカルマスのダイスをコピーして相方を作る
          if (is(c, 'joker') || !lonely(c)) continue;
          const a = copy(cells('joker').filter(j => !isCrit(j)), b[c].type, x => x === c);
          if (a) return makePair(a, 'クリマスの出目上げ');
        }
        return null;
      }

      let m, a;
      // ---------- 1W ----------
      if (W <= 1) {
        if (oppPos > o.corner2 && (a = copy(cells('joker'), 'flow'))) return act(a, `相手が2つ目の角を越えた：ジョーカー${a.from}でフロー${b[a.to].pips}をコピー`);
        if ((a = copy(cells('joker'), 'growth'))) return act(a, `ジョーカー${a.from}で成長${b[a.to].pips}をコピー`);
        if (cells('growth').some(i => b[i].pips === 2)) {
          for (const t of ['fire', 'royal', 'flow']) {
            const L = t === 'fire' ? firePairs(1, !critOK) : pairsOf(t, 1, null, !critOK);
            if ((m = L[0])) return act(m, note(m, `出目2成長あり：出目1の${nm(t)}同士`));
          }
        }
        if (full) {
          if ((m = firePairs(7, !critOK)[0])) return act(m, note(m, '盤面が埋まった：炎同士'));
          if ((m = royalPairs(true, o.w1KeepRoyalMin, !critOK)[0])) return act(m, note(m, '盤面が埋まった：ロイヤル同士'));
        }
        const r = critRaise(false); if (r) return r; // 余ったジョーカーはクリマスの条件のために使う
        return idle(null);
      }
      // ---------- 2W ----------
      if (W === 2) {
        { const r = critRaise(true); if (r) return r; }
        if ((m = firePairs()[0])) return act(m, note(m, '炎同士'));
        if ((m = royalPairs(true, 1)[0])) return act(m, note(m, 'ロイヤル同士'));
        const J2 = jokers(1, o.smallJokerMax);
        if ((a = copy(J2, 'royal', x => b[x].pips <= o.smallJokerMax && free(x) && lonely(x)))) return makePair(a, '詰まった：ペアのないロイヤルを打つ');
        if (cells('fire').length + 1 >= o.minFireToMerge && (a = copy(J2, 'fire', x => free(x) && lonely(x)))) return makePair(a, '詰まった：ペアのない炎を合成');
        if ((a = copy(jokers(3, 7), 'flow'))) return act(a, `出目3以上のジョーカー${a.from}でフロー${b[a.to].pips}をコピー`);
        return idle(null);
      }
      // ---------- 4W以降：残り45秒でロイヤルのペアを作る ----------
      if (late && W >= o.royalPairFromWave) {
        const R = cells('royal');
        const P = R.length ? Math.max(...R.map(i => b[i].pips)) : 0;
        const paired = P && R.filter(i => b[i].pips === P).length >= 2;
        if (P && !paired) {
          if ((m = pairsOf('flow', P - 1).filter(x => b[x.from].pips === P - 1)[0])) return act(m, note(m, `ロイヤル${P}のペアを作る：出目${P - 1}のフロー同士`));
        } else if (paired) {
          if ((m = firePairs()[0])) return act(m, note(m, `ロイヤル${P}のペアができた：炎同士`));
          if ((a = copy(cells('joker'), 'flow'))) return act(a, `ロイヤル${P}のペアができた：ジョーカー${a.from}でフロー${b[a.to].pips}をコピー`);
          if ((m = royalPairs(false, 1)[0])) return act(m, note(m, 'ロイヤルを打つ'));
        }
      }
      // ---------- 3W以降 ----------
      if ((m = royalPairs(!late, 1)[0])) return act(m, note(m, late ? 'ロイヤル同士（残していたペアも打つ）' : 'ロイヤル同士'));
      if ((m = firePairs()[0])) return act(m, note(m, '炎同士'));
      if ((a = copy(late ? cells('joker') : jokers(3, 7), 'flow'))) return act(a, `ジョーカー${a.from}でフロー${b[a.to].pips}をコピー`);
      // フローをコピーできないジョーカーで、あぶれたロイヤル・炎をコピーして合成
      const Jn = cells('joker').filter(j => !cells('flow').some(f => b[f].pips === b[j].pips));
      if ((a = copy(Jn, 'royal', x => free(x) && lonely(x)))) return makePair(a, 'あぶれたロイヤル');
      if (cells('fire').length + 1 >= o.minFireToMerge && (a = copy(Jn, 'fire', x => free(x) && lonely(x)))) return makePair(a, 'あぶれた炎');
      if ((m = pairsOf('joker', 7)[0])) return act(m, note(m, 'ジョーカー同士'));
      if (full) mem.stuckW = W; // 詰まった：次の判断からフロー・炎のPU
      return idle(full ? '詰まった：フロー・炎をPU' : null);
    };

    // ---------- 暗殺対面 ----------
    const asnDone = new Map();   // 避けた暗殺（予告のキー → 避けたときの対象のダイスID）
    const asnDecide = (obs) => {
      if (obs.over) return null;
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {};
      const is = (i, t) => !!(b[i] && b[i].type === t);
      const cells = t => [...Array(15).keys()].filter(i => is(i, t) && !b[i].sealed);
      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const find = (f, t, res) => { const a = legal.get(f * 15 + t); return a && a.result === res ? a : null; };
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 1e-9);
      const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note });
      const dt = ctl.dragTime || 0;
      // 1. 暗殺が飛んできた
      const pend = (obs.pending || []).filter(p => p.kind === 'assassin' && p.cells && p.cells.length).sort((x, y) => x.in - y.in);
      const pendCells = new Set(pend.flatMap(p => p.cells));
      if (actReady) for (const p of pend) {
        const cell = p.cells[0], d = b[cell];
        if (!d || d.sealed || p.in <= dt + 0.02) continue;
        const key = cell + ':' + Math.round((obs.t + p.in) * 10);
        if (asnDone.has(key) && asnDone.get(key) !== d.id) continue;   // もう避けた（対象のダイスが変わった）
        const safe = i => i !== cell && !pendCells.has(i);
        let r = null;
        if (d.type === 'fire') {
          if (cells('fire').length === 1) {
            for (const j of cells('joker')) { if (!safe(j)) continue; const a = find(j, cell, 'copy'); if (a) { r = act(a, `暗殺対面：最後の炎${d.pips}に暗殺。ジョーカー${j}で炎をコピー`); break; } }
          }
        } else if (d.type === 'flow' || d.type === 'royal') {
          const c = cells(d.type).filter(x => safe(x) && b[x].pips === d.pips && !(b[x].bounty > 0)).map(x => find(cell, x, 'merge')).filter(Boolean)[0];
          if (c) r = act(c, `暗殺対面：${nm(d.type)}${d.pips}に暗殺。懸賞金のない${nm(d.type)}（${c.to}）へ合成して逃がす`);
        } else if (d.type === 'joker') {
          for (const t of ['fire', 'royal', 'growth']) {
            const c = cells(t).filter(x => x !== cell).map(x => find(cell, x, 'copy')).filter(Boolean)[0];
            if (c) { r = act(c, `暗殺対面：ジョーカー${d.pips}に暗殺。${nm(t)}をコピーして避ける`); break; }
          }
        }
        if (r) { asnDone.set(key, d.id); return r; }
      }
      // 2. 召喚（盤面を広げる）
      if (obs.legal.summon && !(ctl.summonReadyIn > 1e-9)) return { ops: [{ op: 'summon' }], more: true, note: '暗殺対面：召喚' };
      // 3. 先頭が2つ目の角を越えたらフロー同士を合成
      const fpos = obs.front ? obs.front.pos : 0;
      if (actReady && fpos > o.asnCorner) {
        const L = cells('flow').filter(i => !pendCells.has(i)), res = [];
        for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) {
          if (b[L[x]].pips !== b[L[y]].pips) continue;
          const a = find(L[x], L[y], 'merge') || find(L[y], L[x], 'merge'); if (a) res.push(a);
        }
        res.sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from);
        if (res[0]) return act(res[0], `暗殺対面：先頭が2つ目の角を越えたのでフロー同士（フロー${b[res[0].from].pips}、${res[0].from}→${res[0].to}）`);
      }
      // 4. することがなければ炎の再点火（残り回数が最も少ない炎）
      const power = i => ((b[i].state && b[i].state.power) ?? 1);
      const hov = obs.legal.hovers || [];
      for (const f of cells('fire').filter(i => power(i) < 1 - 1e-9).sort((p, q) => power(p) - power(q))) {
        const h = hov.filter(x => x.from === f && x.result === 'refuel').sort((p, q) => power(p.to) - power(q.to))[0];
        if (h) return { ops: [{ op: 'hover', from: h.from, to: h.to }], more: true, note: `暗殺対面：することがないので再点火（${f}の炎を${h.to}の炎にかざす）` };
      }
      return null;
    };

    return { decide: obs => (ASN ? asnDecide(obs) : normalDecide(obs)) };
  },
});
})();
