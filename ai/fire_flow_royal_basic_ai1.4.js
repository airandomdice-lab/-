// 炎フローロイヤル基本AI（炎フロイ）1.4（AI API v1／AI_AGENT_GUIDE 1.7.x・AIRandomDicesim 2.1.0〜2.5.3 用）
// 登録ID：fire_flow_royal_basic（ほかのAIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：炎・フロー・ロイヤル・成長・ジョーカー　想定フィールド：神々の楽園　想定する本家バージョン：どれでも
// 対戦用（フロー・ロイヤルは対戦でしか効かない。練習では「相手のモンスターが中央を超えていない」扱い）
// 変更：1.1　2W以降は炎の残り回数が6割（30回）を切ったらすぐ再点火。やることがないときは炎の再点火（残り回数が最も少ない炎）
//       1.2　様子見の間も召喚。1Wのジョーカーは出目2以下の成長をコピー、埋まったらフロー同士は出目1だけ、埋まっていなくても炎同士を合成。
//            2Wのクリティカル炎の出目上げを様子見の間も行い、終わる条件を「両方に出目2以上の炎がある、または片方が出目3以上」に。
//            出目上げは炎以外のダイスも使い、合計出目の制限の代わりに「どちらかのクリティカルマスに炎が残る」を条件にする。
//            合計出目の制限で、クリティカルマスの炎を合成に使うとそのマスの炎はなくなるとして数える（できるダイスは炎とは限らない）
//       1.3　2Wで相手が中央の手前のとき、合成するフロー同士を出目1だけに
//       1.4　2Wの出目上げの「クリティカルマスのダイス＋同じ出目のダイス」でジョーカー同士を合成しない（クリティカルマスのジョーカーは炎のコピーに使う）
//
// 用語
//   クリティカルマス：神々の楽園の会心マス（2つ）。楽園でなければクリティカルマスの規則は使わない
//   炎の残り回数：炎の火力 power は1発ごとに0.02下がる（1→0）。残り回数＝power÷0.02
//   クリティカル炎の合計：2つのクリティカルマスの上の炎の出目の合計（炎でなければ0）
//   相手のモンスターが中央を超えている：相手トラックの先頭の敵の進み具合 progress が 0.5 を超えている
//
// 全ウェーブ共通の約束
//   ・炎の残り回数が3回（2W以降は最大50回の6割＝30回）を切ったら、別の炎にかざして再点火（最優先。かざす操作は間隔の制限なし）
//   ・やることがないとき（様子見・ドラッグ待ちを含む）：残り回数が最も少ない炎を別の炎にかざして再点火（満タンの炎しかなければしない）
//   ・クリティカルマスの上のダイスを合成に使うとき：その出目が2以下ならクリティカルマスへ向かって合成（合成先＝クリティカルマス）、
//     3以上ならクリティカルマスから逃がすように合成（合成元＝クリティカルマス）
//   ・炎同士の合成は、盤面の炎が4個以上のときだけ（合成で炎が2個減り、1個以下になるのを避ける）
//   ・炎同士の合成で、クリティカル炎の合計が下がって「1W：2以下」「2W以降：3以下」になるものはしない
//     （合成に使ったクリティカルマスの炎は、向かう合成でも逃がす合成でもなくなるとして数える。2Wの出目上げだけは別の条件）
//
// 1W
//   召喚で盤面を埋める
//   出目2以下のジョーカーで出目2以下の成長をコピー
//   出目2の成長があれば（埋まっていなくても）出目1フロー同士 → 出目1炎同士
//   盤面が埋まったら、出目1のフロー同士
//   埋まっていなくても炎同士（低い出目から）
// 2W（開始15秒は様子見：召喚・再点火・クリティカル炎の出目上げだけ）
//   クリティカル炎が「両方に出目2以上の炎がある、または片方が出目3以上」になるまで、クリティカルマスを含む合成で出目上げ（様子見の間も）
//     クリティカルマスのダイス（ジョーカー以外）＋同じ出目のダイス → クリティカルマスのジョーカーで外の炎をコピー → ジョーカーでクリティカルマスのダイスをコピーして相方を作る
//     条件：合成した後も、どちらかのクリティカルマスに炎が残る（合成に使ったクリティカルマスは炎でなくなるとして数える。合計出目の制限はかけない）
//           クリティカルマスに炎が1つもないときは、この条件はかけない
//   相手のモンスターが中央を超えている：フローLv3までPU → フロー同士は合成しない → ジョーカーでフローをコピー → 炎同士 → 出目1ロイヤルを打つ
//   超えていない：出目1のフロー同士 → ジョーカーでロイヤルをコピー
// 3W以降（開始10秒は様子見：召喚・再点火だけ）
//   フローLv4までPU → ロイヤルを打つ（高い出目から）→ 炎同士 → ジョーカーで全てフローをコピー
//   打てるロイヤル（同じ出目のロイヤルの組）がなければ フローLv5までPU
// 召喚：PUの目標があってSPが足りない間は召喚しない（options.saveForPU）
RD.defineAgent('fire_flow_royal_basic', {
  name: '炎フローロイヤル基本AI',
  desc: '炎・フロー・ロイヤル・成長・ジョーカー用（神々の楽園想定・対戦用）。炎の残り回数が3回（2W以降は6割）を切ったらかざして再点火。やることがないときも炎の再点火。様子見の間も召喚。1Wは盤面を埋め、出目2以下のジョーカーで成長をコピー、出目2成長があれば出目1のフロー同士・炎同士、埋まったら出目1のフロー同士、埋まっていなくても炎同士。2Wは様子見の間もクリティカルマスの炎の出目上げ（両方2以上か片方3以上まで。どちらかのクリティカルマスに炎を残す）、15秒後から相手の先頭が中央を超えていればフローLv3・ジョーカーでフローをコピー・炎同士・出目1ロイヤル、超えていなければ出目1のフロー同士・ジョーカーでロイヤルをコピー。3W以降は10秒様子見の後、フローLv4・ロイヤルを打つ・炎同士・ジョーカーでフローをコピー、打てるロイヤルがなければフローLv5。クリティカルマスのダイスは出目2以下なら向かって、3以上なら逃がして合成。炎は4個以上のときだけ合成し、クリティカル炎の合計を1Wは2以下・2W以降は3以下に下げない。',
  options: {
    refuelBelow: 3,          // 1W：炎の残り回数がこれ未満なら再点火
    refuelRatio2: 0.6,       // 2W以降：炎の残り回数が最大のこの割合を切ったら再点火
    idleRefuel: true,        // やることがないときは炎の再点火
    shotCost: 0.02,          // 炎の1発あたりの火力の減り（エンジンの値と同じ）
    watch2: 15,              // 2Wの様子見（秒）
    watch3: 10,              // 3W以降の様子見（秒）
    summonWhileWatching: true, // 様子見の間も召喚する
    critSumMin1: 2,          // 1W：クリティカル炎の合計をこの値以下に下げる炎の合成はしない
    critSumMin2: 3,          // 2W以降：同上
    critToMax: 2,            // クリティカルマスのダイスの出目がこれ以下なら向かって合成、より大きければ逃がす
    minFireToMerge: 4,       // 炎同士を合成するのに必要な盤面の炎の数（合成後に1個以下にしない）
    centerProgress: 0.5,     // 相手の先頭の敵がこれを超えたら「中央を超えている」
    flowLv2W: 3, flowLv3W: 4, flowLvMax: 5,
    saveForPU: true,         // PUの目標があってSPが足りない間は召喚しない
    jokerGrowthAlways: true, // 1Wの「ジョーカーで成長をコピー」を、盤面が埋まった後も行う
    jokerGrowthMaxPips: 2,   // 1Wでジョーカーで成長をコピーする出目の上限
    w1FlowFullMax: 1,        // 1W：盤面が埋まったら合成するフローの出目の上限
    w2FlowMax: 1,            // 2W（相手が中央の手前）：合成するフローの出目の上限
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options;
    const NAME = { fire: '炎', flow: 'フロー', royal: 'ロイヤル', growth: '成長', joker: 'ジョーカー' };
    const nm = t => NAME[t] || t;
    let critCells = null; // 最初の観測で決める

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {}, W = obs.wave;
      let mem; try { mem = JSON.parse(obs.memory || '{}') || {}; } catch (e) { mem = {}; }
      if (mem.wsW !== W) { mem.wsW = W; mem.wsT = obs.t; } // ウェーブの始まり（このウェーブを初めて見た時刻）
      const elapsed = obs.t - mem.wsT;
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

      // ---------- 全ウェーブ共通：再点火（かざす） ----------
      const shotsLeft = i => Math.round(((b[i].state && b[i].state.power) ?? 1) / o.shotCost);
      const hov = obs.legal.hovers || [];
      const maxShots = Math.round(1 / o.shotCost);
      const refuelLine = W >= 2 ? maxShots * o.refuelRatio2 : o.refuelBelow;
      const refuel = (line, why) => { // 残り回数が line 未満の炎を、残り回数が少ない順に再点火
        const low = cells('fire').filter(i => shotsLeft(i) < line).sort((p, q) => shotsLeft(p) - shotsLeft(q));
        for (const f of low) {
          const h = hov.filter(x => x.from === f && x.result === 'refuel').sort((p, q) => shotsLeft(p.to) - shotsLeft(q.to))[0];
          if (h) return out({ ops: [{ op: 'hover', from: h.from, to: h.to }], more: true, note: `${why}：${f}の炎（残り${shotsLeft(f)}回）を${h.to}の炎にかざす` });
        }
        return null;
      };
      { const r = refuel(refuelLine, '再点火'); if (r) return r; }
      // やることがないとき：残り回数が最も少ない炎を再点火（満タンの炎しかなければ何もしない）
      const idle = note => (o.idleRefuel && refuel(maxShots, 'やることがないので再点火')) || out({ ops: [], note });

      // ---------- 様子見 ----------
      const watch = W === 2 ? o.watch2 : W >= 3 ? o.watch3 : 0;
      const watching = obs.phase === 'wave' && elapsed < watch;

      // ---------- 相手の状態 ----------
      const opp = obs.opponent;
      const crossed = !!(opp && opp.front && opp.front.progress > o.centerProgress);

      // ---------- PU → 召喚 ----------
      const deckOf = t => obs.deck.find(x => x.type === t);
      const lv = t => { const d = deckOf(t); return d ? d.lv : 99; };
      const royalPairs = () => {
        const R = cells('royal'), res = [];
        for (let x = 0; x < R.length; x++) for (let y = x + 1; y < R.length; y++) if (b[R[x]].pips === b[R[y]].pips) { const m = mergeOf(R[x], R[y]); if (m) res.push(m); }
        return res.sort((p, q) => b[q.from].pips - b[p.from].pips);
      };
      let puTarget = 0;
      if (!watching) {
        if (W === 2 && crossed) puTarget = o.flowLv2W;
        if (W >= 3) puTarget = royalPairs().length ? o.flowLv3W : o.flowLvMax;
      }
      let savePU = false;
      if (puTarget && lv('flow') < puTarget) {
        if (obs.legal.powerUp.includes('flow')) return out({ ops: [{ op: 'powerUp', type: 'flow' }], more: true, note: `PU フロー Lv${lv('flow') + 1}（目標Lv${puTarget}）` });
        const d = deckOf('flow');
        if (o.saveForPU && d && d.puCost != null) savePU = true;
      }
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !savePU && (!watching || o.summonWhileWatching))
        return out({ ops: [{ op: 'summon' }], more: true, note: '召喚' });
      if (!actReady) return idle(watching ? `${W}W 様子見（${Math.ceil(watch - elapsed)}秒）` : null);

      // ---------- 合成の向き（クリティカルマスの規則） ----------
      function mergeOf(x, y) {
        let f = x, t = y;
        const cx = isCrit(x), cy = isCrit(y);
        if (cx || cy) {
          const c = cx ? x : y, other = c === x ? y : x;
          if (b[c].pips <= o.critToMax) { f = other; t = c; } else { f = c; t = other; }
        }
        return find(f, t, 'merge');
      }
      // ---------- 炎の合成の制限 ----------
      const critFire = i => is(i, 'fire') ? b[i].pips : 0;
      const critSum = () => critCells.reduce((s, c) => s + critFire(c), 0);
      const sumMin = W <= 1 ? o.critSumMin1 : o.critSumMin2;
      function fireOk(m) {
        if (cells('fire').length < o.minFireToMerge) return false;
        if (!critCells.length) return true;
        const before = critSum();
        let after = 0;
        for (const c of critCells) after += c === m.to || c === m.from ? 0 : critFire(c);
        return !(after < before && after <= sumMin);
      }
      const pairsOf = (t, maxPips, filter) => { // 同じ種類・同じ出目の合成（低い出目から）
        const L = cells(t), res = [];
        for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) {
          if (b[L[x]].pips !== b[L[y]].pips || b[L[x]].pips > maxPips) continue;
          const m = mergeOf(L[x], L[y]);
          if (m && (!filter || filter(m))) res.push(m);
        }
        return res.sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from);
      };
      const firePairs = (maxPips = 7, filter) => pairsOf('fire', maxPips, m => fireOk(m) && (!filter || filter(m)));
      const mergeNote = (m, label) => `${label}（出目${b[m.from].pips}、${m.from}→${m.to}${isCrit(m.to) ? '・クリティカルマスへ' : isCrit(m.from) ? '・クリティカルマスから逃がす' : ''}）`;
      const jokerCopy = (t, pips) => { // ジョーカーで t をコピー（pips 指定があればその出目だけ。高い出目から）
        const res = [];
        for (const j of cells('joker')) { if (pips && b[j].pips !== pips) continue; for (const x of cells(t)) { const a = find(j, x, 'copy'); if (a) res.push(a); } }
        return res.sort((p, q) => b[q.to].pips - b[p.to].pips || p.from - q.from)[0] || null;
      };

      // ---------- 2W：クリティカルマスの炎の出目上げ ----------
      //   終わる条件：両方に出目2以上の炎がある、または片方が出目3以上の炎
      //   条件：合成・コピーの後も、どちらかのクリティカルマスに炎が残る（触ったクリティカルマスは炎でなくなるとして数える）
      function critRaise() {
        if (critCells.length < 2) return null;
        const cf = critCells.map(critFire);
        if (Math.min(...cf) >= 2 || Math.max(...cf) >= 3) return null;
        const anyFire = critCells.some(c => is(c, 'fire')); // クリティカルマスに炎が1つもなければ、残す炎がないので条件はかけない
        const keepsFire = touched => !anyFire || critCells.some(c => !touched.includes(c) && is(c, 'fire'));
        const order = critCells.filter(c => b[c]).sort((p, q) => critFire(p) - critFire(q) || b[p].pips - b[q].pips);
        // a) クリティカルマスのダイス＋同じ出目のダイス（同じ種類。炎同士なら炎の合成の約束も守る。ジョーカー同士は合成しない）
        for (const c of order) {
          if (!b[c] || b[c].sealed || is(c, 'joker') || !keepsFire([c])) continue;
          const t = b[c].type;
          const parts = cells(t).filter(x => x !== c && b[x].pips === b[c].pips && keepsFire([c, x]));
          for (const x of parts) {
            const mm = mergeOf(c, x);
            if (!mm) continue;
            if (t === 'fire' && cells('fire').length < o.minFireToMerge) continue;
            return act(mm, mergeNote(mm, `クリティカル炎の出目上げ：${nm(t)}同士`));
          }
        }
        // b) クリティカルマスのジョーカーで外の炎をコピー
        for (const c of order) if (is(c, 'joker') && !b[c].sealed) for (const x of cells('fire')) {
          if (isCrit(x)) continue;
          const aa = find(c, x, 'copy'); if (aa) return act(aa, `クリティカル炎の出目上げ：クリティカルマス${c}のジョーカーで炎（出目${b[x].pips}）をコピー`);
        }
        // c) ジョーカーでクリティカルマスのダイスをコピーして相方を作る（同じ出目の相方がいないとき）
        for (const c of order) {
          if (!b[c] || b[c].sealed || is(c, 'joker') || !keepsFire([c])) continue;
          if (cells(b[c].type).some(x => x !== c && b[x].pips === b[c].pips)) continue;
          for (const j of cells('joker')) { if (isCrit(j)) continue; const aa = find(j, c, 'copy'); if (aa) return act(aa, `クリティカル炎の出目上げ：ジョーカー${j}でクリティカルマス${c}の${nm(b[c].type)}（出目${b[c].pips}）をコピー（相方を作る）`); }
        }
        return null;
      }

      let m, a;
      // ---------- 1W ----------
      if (W <= 1) {
        if (!full || o.jokerGrowthAlways) {
          for (let p = 1; p <= o.jokerGrowthMaxPips; p++) if ((a = jokerCopy('growth', p))) return act(a, `ジョーカー${a.from}で出目${p}成長をコピー`);
        }
        if (cells('growth').some(i => b[i].pips === 2)) {
          if ((m = pairsOf('flow', 1)[0])) return act(m, mergeNote(m, '出目2成長あり：出目1フロー同士'));
          if ((m = firePairs(1)[0])) return act(m, mergeNote(m, '出目2成長あり：出目1炎同士'));
        }
        if (full && (m = pairsOf('flow', o.w1FlowFullMax)[0])) return act(m, mergeNote(m, '盤面が埋まった：フロー同士'));
        if ((m = firePairs()[0])) return act(m, mergeNote(m, '炎同士'));
        return idle(null);
      }
      // ---------- 2W ----------
      if (W === 2) {
        const r = critRaise(); if (r) return r;
        if (watching) return idle(`2W 様子見（${Math.ceil(watch - elapsed)}秒）`);
        if (crossed) {
          if ((a = jokerCopy('flow'))) return act(a, `相手が中央を超えた：ジョーカー${a.from}でフロー（出目${b[a.to].pips}）をコピー`);
          if ((m = firePairs()[0])) return act(m, mergeNote(m, '相手が中央を超えた：炎同士'));
          if ((m = pairsOf('royal', 1)[0])) return act(m, mergeNote(m, '相手が中央を超えた：出目1ロイヤルを打つ'));
        } else {
          if ((m = pairsOf('flow', o.w2FlowMax)[0])) return act(m, mergeNote(m, '相手は中央の手前：フロー同士'));
          if ((a = jokerCopy('royal'))) return act(a, `相手は中央の手前：ジョーカー${a.from}でロイヤル（出目${b[a.to].pips}）をコピー`);
        }
        return idle(null);
      }
      // ---------- 3W以降 ----------
      if (watching) return idle(`${W}W 様子見（${Math.ceil(watch - elapsed)}秒）`);
      if ((m = royalPairs()[0])) return act(m, mergeNote(m, 'ロイヤルを打つ'));
      if ((m = firePairs()[0])) return act(m, mergeNote(m, '炎同士'));
      if ((a = jokerCopy('flow'))) return act(a, `ジョーカー${a.from}でフロー（出目${b[a.to].pips}）をコピー`);
      return idle(null);
    } };
  },
});
