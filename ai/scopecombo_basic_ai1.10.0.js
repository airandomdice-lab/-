// スコープコンボ基礎AI 1.10.0（AI API v1／AI_AGENT_GUIDE 1.7.1・AIRandomDicesim 2.5.3 で確認。1.15.0 でも動く）
// 登録ID：scopecombo_basic（ほかのスコープコンボ系AIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：スコープ・コンボ・ジョーカー・適応・召喚
//
// 1回の判断の優先順（1つ実行するごとに more:true で盤面を見直す）
//   1) PU：ウェーブ2〜 スコープLv3／ウェーブ4〜 スコープLv5・コンボLv3／ウェーブ5〜 コンボLv5（SPが足りれば）
//   2) 召喚：空きマスがあり、SPが足り、召喚の間隔待ちでなければ
//   3) 重ねる操作（ドラッグ中・間隔待ちでなければ。出目の低い組から）
//      ジョーカー→コンボのコピー → 召喚同士 → 出目5以上の召喚同士 → スコープ同士（盤面で最も出目の高いスコープは使わない）
//      → コンボ＋適応（最も出目の高いスコープに隣接するコンボのうち、最も出目の高いコンボは使わない）
//      → コンボ同士（盤面が埋まっているときだけ。コンボ＋適応と同じコンボは使わない）
//   ※ウェーブ2以降、スコープ同士・コンボ＋適応は盤面が埋まっているときだけ行う
//     （ジョーカーのコピーと召喚同士は、盤面が埋まっていなくても行う。PUは上の計画どおり）
//   ※出目1・2のコンボを使う合成（コンボ＋適応・コンボ同士）で、その合成に使うダイス以外に
//     同じ出目のコンボが盤面にないときは、その合成を後回しにする（上の操作がどれもできなければ行う）
//   4) それでも何もできなければ、次の順で合成
//      適応＋召喚（ウェーブ2以降は盤面が埋まっているときだけ）
//      ここから下はウェーブに関係なく、盤面が埋まっているときだけ：
//      適応＋スコープ（最も出目の高いスコープは使わない）
//      → ジョーカー→召喚のコピー → ジョーカー→スコープのコピー（この2つは出目の高い組から）
//      → 適応同士 → 適応＋ジョーカー → ジョーカー同士
//   ※3)・4) は出目4以下のダイスだけ（3) の「出目5以上の召喚同士」を除く）。出目5以上のダイスは次のルール（5+）で扱う
//      （ジョーカーのコピー以外は、ウェーブ2以降は盤面が埋まっているときだけ。
//        スコープ同士・コンボ同士・ジョーカー同士、召喚・スコープへのコピーはしない）
//      5+a) ジョーカー→コンボのコピー → 適応＋召喚 → 適応同士 → 適応＋スコープ（最も出目の高いスコープは使わない）
//           → 適応＋コンボ（最も出目の高いスコープに隣接するコンボは使わない）
//      5+b) 適応＋ジョーカー
//   ※試す順：3)（後回し分を除く）→ 5+a) → 4) の適応＋召喚 → 3) の後回し分 → 4) の適応＋スコープ以下 → 5+b)
//   ※ウェーブ6以降、上の操作のうち「価値」を3割以上減らすものは保留し、上がどれもできないときに同じ順で行う
//     価値＝盤面の各コンボについて（コンボの出目 × 隣接するスコープの最高出目）の合計
//     合成でできるダイスの種類は抽選なので、予測では「コンボでもスコープでもない」として数える
//   6) 完全に詰んだとき（盤面が埋まっていて、上の操作も保留した操作もできない）は次の順で行う
//      （最高出目のスコープ・残すコンボの保護はかけない。出目に関係なく行う）
//      スコープの値＝スコープの出目 × 隣接するコンボの出目の合計、コンボの値＝隣接するスコープの最高出目
//      適応＋スコープ（値の最も低いスコープ）→ ジョーカーでスコープをコピー（値の最も低いスコープ）
//      → スコープ同士（値の最も低いスコープと、次に値の低いスコープ）
//      → 適応＋コンボ（値の最も低いコンボ）→ ジョーカーでコンボをコピー（値の最も低いコンボ）
//      → コンボ同士（値の最も低いコンボと、次に値の低いコンボ）
RD.defineAgent('scopecombo_basic', {
  name: 'スコープコンボ基礎AI',
  desc: '空きがあれば召喚。ジョーカーは基本コンボへコピー。合成は 召喚同士→出目5以上の召喚同士→スコープ同士（最高出目のスコープは残す）→コンボ＋適応（最高出目スコープの隣の最高出目コンボは残す）→コンボ同士（盤面が埋まっているときだけ。同じく最高出目スコープの隣の最高出目コンボは残す）。W2以降、スコープ同士・コンボ＋適応も盤面が埋まっているときだけ（コピーと召喚同士はいつでも）。出目1・2のコンボが盤面から消える合成は後回し。その下に 適応＋召喚→（ここから盤面が埋まっているときだけ）適応＋スコープ（最高出目のスコープは残す）→ジョーカーで召喚・スコープをコピー（出目4以下、高い出目から）→適応同士→適応＋ジョーカー→ジョーカー同士。出目5以上は コピー→適応＋召喚→適応同士→適応＋スコープ（最高出目のスコープは残す）→適応＋コンボ（最高出目スコープの隣のコンボは残す）→適応＋ジョーカー だけ。試す順は 出目4以下の通常→出目5以上（適応＋ジョーカーの前まで）→出目4以下の適応＋召喚→出目4以下の後回し分→出目4以下の適応＋スコープ以下→出目5以上の適応＋ジョーカー。W6以降、価値（コンボの出目×隣接スコープの最高出目の合計）が3割以上減る操作は保留。完全に詰んだら、隣のコンボが少ないスコープ・バフの弱いコンボから崩す。W2でスコープLv3、W4でスコープLv5・コンボLv3、W5でコンボLv5。',
  options: {
    // [ウェーブ, 種類, 目標Lv]。ウェーブがこの値以上になったら、目標Lvまで上げる（上から順）
    puPlan: [[2, 'scope', 3], [4, 'scope', 5], [4, 'combo', 3], [5, 'combo', 5]],
    protectInComboCombo: true,  // 残すコンボをコンボ同士の合成にも使わない（false で使う）
    fullOnlyFromWave: 2,        // このウェーブ以降、スコープ同士・コンボ＋適応は盤面が埋まっているときだけ
    highPips: 5,                // この出目以上のダイスは「出目5以上のルール」で扱う
    lastComboPips: 2,           // この出目以下のコンボが合成で盤面から消えるときは、その合成を最後に回す（0で無効）
    lossFromWave: 6,            // このウェーブ以降、価値を lossRatio 以上減らす操作を保留する
    lossRatio: 0.3,             // 保留する減り方（0.3＝3割）
    stuckRules: true,           // 完全に詰んだときのルールを使う
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, nb = ctx.info.board.neighbors;

    // 残すスコープ：出目が最も高いもの（同点なら隣のコンボが多い方→マス番号が小さい方）
    function keptScope(board) {
      let best = null;
      for (const d of board) {
        if (!d || d.type !== 'scope') continue;
        const combos = nb[d.cell].filter(c => board[c] && board[c].type === 'combo').length;
        if (!best || d.pips > best.d.pips || (d.pips === best.d.pips && combos > best.combos)) best = { d, combos };
      }
      return best ? best.d.cell : null;
    }
    // 残すコンボ：残すスコープの隣のコンボのうち、出目が最も高いもの（同点ならマス番号が小さい方）
    function keptCombo(board, sc) {
      if (sc == null) return null;
      let best = null;
      for (const c of nb[sc]) {
        const d = board[c];
        if (d && d.type === 'combo' && (!best || d.pips > best.pips)) best = d;
      }
      return best ? best.cell : null;
    }

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null; // 操作数の上限に達した

      // 1) PU
      for (const [w, type, lv] of o.puPlan || []) {
        if (obs.wave < w) continue;
        const d = obs.deck.find(x => x.type === type);
        if (!d || d.lv >= lv || d.puCost == null) continue;
        if (obs.sp >= d.puCost) return { ops: [{ op: 'powerUp', type }], more: true, note: `PU ${d.name} Lv${d.lv}→${d.lv + 1}` };
        break; // 足りないときは、この順番を飛ばして後ろのPUはしない（召喚・合成は続ける）
      }

      // 2) 召喚
      const c = obs.control || {};
      if (obs.legal.summon && !(c.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };

      // 3) 重ねる操作
      if (c.dragging || c.actReadyIn > 0) return null;
      const b = obs.board, full = b.every(Boolean);
      const lateOk = full || obs.wave < o.fullOnlyFromWave; // ウェーブ2以降は盤面が埋まっているときだけ
      const sc = keptScope(b), cb = keptCombo(b, sc);
      const T = (a) => [b[a.from].type, b[a.to].type];
      const has = (a, cell) => a.from === cell || a.to === cell;
      const steps = [
        ['ジョーカー→コンボ', a => a.result === 'copy' && b[a.from].type === 'joker' && b[a.to].type === 'combo'],
        ['召喚同士', a => a.result === 'merge' && T(a).every(t => t === 'summon')],
        ['スコープ同士', a => a.result === 'merge' && T(a).every(t => t === 'scope') && lateOk && !has(a, sc)],
        ['コンボ＋適応', a => a.result === 'merge' && T(a).includes('combo') && T(a).includes('adaptive') && lateOk && !has(a, cb)],
        ['コンボ同士', a => a.result === 'merge' && T(a).every(t => t === 'combo') && full && !(o.protectInComboCombo && has(a, cb))],
      ];
      const has2 = (a, x, y) => { const [p, q] = T(a); return (p === x && q === y) || (p === y && q === x); };
      const lastSteps = [ // 4) いちばん下の優先度
        ['適応＋召喚', a => a.result === 'merge' && has2(a, 'adaptive', 'summon') && lateOk],
        // ここから下は、ウェーブに関係なく盤面が埋まっているときだけ
        ['適応＋スコープ', a => a.result === 'merge' && has2(a, 'adaptive', 'scope') && full && !has(a, sc)],
        ['ジョーカー→召喚', a => a.result === 'copy' && b[a.from].type === 'joker' && b[a.to].type === 'summon' && full, true],
        ['ジョーカー→スコープ', a => a.result === 'copy' && b[a.from].type === 'joker' && b[a.to].type === 'scope' && full, true],
        ['適応同士', a => a.result === 'merge' && has2(a, 'adaptive', 'adaptive') && full],
        ['適応＋ジョーカー', a => a.result === 'merge' && has2(a, 'adaptive', 'joker') && full],
        ['ジョーカー同士', a => a.result === 'merge' && has2(a, 'joker', 'joker') && full],
      ];
      // 組の中のコンボが、最も出目の高いスコープに隣接しているか
      const nearScope = (a) => sc != null && [a.from, a.to].some(i => b[i].type === 'combo' && nb[sc].includes(i));
      const highSteps = [ // 出目5以上のルール
        ['ジョーカー→コンボ', steps[0][1]],
        ['適応＋召喚', a => a.result === 'merge' && has2(a, 'adaptive', 'summon') && lateOk],
        ['適応同士', a => a.result === 'merge' && has2(a, 'adaptive', 'adaptive') && lateOk],
        ['適応＋スコープ', a => a.result === 'merge' && has2(a, 'adaptive', 'scope') && lateOk && !has(a, sc)],
        ['適応＋コンボ', a => a.result === 'merge' && has2(a, 'adaptive', 'combo') && lateOk && !nearScope(a)],
        ['適応＋ジョーカー', a => a.result === 'merge' && has2(a, 'adaptive', 'joker') && lateOk],
      ];
      const high = (a) => b[a.from].pips >= o.highPips; // 重ねる2つは同じ出目
      // 後回しにする合成：出目が lastComboPips 以下のコンボを使い、使うダイス以外に同じ出目のコンボがない
      const comboCount = {};
      for (const d of b) if (d && d.type === 'combo') comboCount[d.pips] = (comboCount[d.pips] || 0) + 1;
      const isLast = (a) => {
        if (a.result !== 'merge') return false;
        const used = [b[a.from], b[a.to]].filter(d => d.type === 'combo');
        if (!used.length || used[0].pips > o.lastComboPips) return false;
        return comboCount[used[0].pips] - used.length <= 0;
      };
      const hi = highSteps.map(([l, ok]) => [l + '（出目5以上）', a => high(a) && ok(a)]);
      const passes = [ // 試す順
        [ // 3) 出目4以下（召喚同士のすぐ後に、出目5以上の召喚同士）
          ...steps.slice(0, 2).map(([l, ok]) => [l, a => !high(a) && ok(a)]),
          ['召喚同士（出目5以上）', a => high(a) && steps[1][1](a)],
          ...steps.slice(2).map(([l, ok]) => [l, a => !high(a) && ok(a) && !isLast(a)]),
        ],
        hi.slice(0, -1),                                                                // 5+a) 適応＋ジョーカーの前まで
        lastSteps.slice(0, 1).map(([l, ok, desc]) => [l, a => !high(a) && ok(a), desc]), // 4) 出目4以下の適応＋召喚
        steps.map(([l, ok]) => [l + '（後回し分）', a => !high(a) && ok(a) && isLast(a)]), // 3) 出目4以下の後回し分
        lastSteps.slice(1).map(([l, ok, desc]) => [l, a => !high(a) && ok(a), desc]),   // 4) 出目4以下の適応＋スコープ以下
        hi.slice(-1),                                                                   // 5+b) 適応＋ジョーカー
      ];
      const act = (a, label) => ({
        ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }],
        more: true, note: `${label} 出目${b[a.from].pips} ${a.from}→${a.to}`,
      });

      // 価値：各コンボの（出目 × 隣接するスコープの最高出目）の合計
      const value = (bd) => {
        let v = 0;
        for (const d of bd) {
          if (!d || d.type !== 'combo') continue;
          let m = 0;
          for (const j of nb[d.cell]) if (bd[j] && bd[j].type === 'scope') m = Math.max(m, bd[j].pips);
          v += d.pips * m;
        }
        return v;
      };
      const v0 = value(b);
      // 操作の後の盤面を予測（合成でできる種類は抽選なので「どちらでもない」として数える）
      const after = (a) => {
        const bd = b.slice();
        if (a.result === 'copy') bd[a.from] = { cell: a.from, type: b[a.to].type, pips: b[a.from].pips };
        else if (a.result === 'merge') { bd[a.from] = null; bd[a.to] = { cell: a.to, type: '?', pips: b[a.to].pips + 1 }; }
        return bd;
      };
      const bigLoss = (a) => obs.wave >= o.lossFromWave && v0 > 0 && value(after(a)) <= v0 * (1 - o.lossRatio) + 1e-9;

      const held = [];
      for (const list of passes) {
        for (const [label, ok, desc] of list) {
          const all = obs.legal.acts.filter(ok);
          const cands = all.filter(a => !bigLoss(a));
          if (all.length > cands.length) held.push([label, all.filter(bigLoss), desc]);
          if (!cands.length) continue;
          const better = (q, p) => desc ? b[q.from].pips > b[p.from].pips : b[q.from].pips < b[p.from].pips;
          return act(cands.reduce((p, q) => (better(q, p) ? q : p)), label); // 出目の低い組から（desc なら高い組から）
        }
      }
      // 5) 保留した操作（価値が3割以上減るもの）を同じ順で
      for (const [label, cands, desc] of held) {
        const better = (q, p) => desc ? b[q.from].pips > b[p.from].pips : b[q.from].pips < b[p.from].pips;
        return act(cands.reduce((p, q) => (better(q, p) ? q : p)), label + '（保留分）');
      }

      // 6) 完全に詰んだとき
      if (!o.stuckRules || !full) return null;
      const adjSum = (cell, type) => nb[cell].reduce((s, j) => s + (b[j] && b[j].type === type ? b[j].pips : 0), 0);
      const adjMax = (cell, type) => nb[cell].reduce((m, j) => Math.max(m, b[j] && b[j].type === type ? b[j].pips : 0), 0);
      const sv = (cell) => b[cell].pips * adjSum(cell, 'combo'); // スコープの値
      const cv = (cell) => adjMax(cell, 'scope');                 // コンボの値（受けているバフ）
      const key = (val, cell) => [val(cell), b[cell].pips, cell]; // 値 → 出目 → マス番号 の順に小さいほうを選ぶ
      const less = (x, y) => { for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i]; return false; };
      const pickBy = (cands, k) => cands.reduce((p, q) => (less(k(q), k(p)) ? q : p));
      const cellOf = (a, type) => (b[a.to].type === type ? a.to : a.from);
      const stuck = [];
      for (const [type, val, name] of [['scope', sv, 'スコープ'], ['combo', cv, 'コンボ']]) {
        const k1 = (a) => key(val, cellOf(a, type));
        stuck.push([`詰み:適応＋${name}`, a => a.result === 'merge' && has2(a, 'adaptive', type), k1]);
        stuck.push([`詰み:ジョーカー→${name}`, a => a.result === 'copy' && b[a.from].type === 'joker' && b[a.to].type === type,
          (a) => key(val, a.to)]);
        stuck.push([`詰み:${name}同士`, a => a.result === 'merge' && has2(a, type, type), (a) => {
          const [x, y] = [key(val, a.from), key(val, a.to)].sort((p, q) => (less(p, q) ? -1 : 1));
          return x.concat(y); // 値の最も低いもの → 相手は次に値の低いもの
        }]);
      }
      for (const [label, ok, k] of stuck) {
        const cands = obs.legal.acts.filter(ok);
        if (cands.length) return act(pickBy(cands, k), label);
      }
      return null;
    } };
  },
});
