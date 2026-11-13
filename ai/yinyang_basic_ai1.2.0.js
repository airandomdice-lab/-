// 陰陽基礎AI（AI API v1／AI_AGENT_GUIDE 1.6.0・AIRandomDicesim 1.15.0 用）
// 登録ID：yinyang_basic（ほかの陰陽系AIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：陰陽・スイッチ・養分・ジョーカー（固定）＋自由枠1つ。想定フィールド：神々の楽園
//
// 用語
//   クリティカルマス：神々の楽園フィールドの会心率が上がるマス（2つ。試合ごとにランダム、obs.field.paradise）。
//     ここで極の調和（縦3つ・横5つの両方がそろう）を組む。優先度は入口（盤面の左下）に近い順。
//     楽園以外のフィールドでは、全マスを入口に近い順に並べ、最も近いマス（マス10＝3行1列）を使う
//   ライン：クリティカルマスと、その縦・横の計7マス
//   自由枠：デッキのうち、陰陽・スイッチ・養分・ジョーカー以外の種類
//
// 基礎操作：スイッチ（from）を同じ出目の別種のダイス（to）に重ねると、2つの位置が入れ替わる。
//   ・ラインのマスにあるスイッチを、ライン外の同じ出目の陰陽に重ねる → 陰陽がラインに入る（「引き込み」）
//   ・ライン外のスイッチを、ラインのマスにある同じ出目の別種に重ねる → スイッチがラインに入る（「スイッチを置く」）
//
// 1回の判断の優先順（1つ実行するごとに more:true で盤面を見直す）
//   [盤面が埋まっていないとき]
//     1) クリティカルマスにスイッチも陰陽もなければ、盤面のスイッチをクリティカルマスへ置く（同じ出目のときだけ）
//     2) 召喚
//   [盤面が埋まっているとき]
//     ※陰陽の数は「有効な陰陽」＝ライン上の陰陽＋ライン外の出目1の陰陽 で数える
//       （ライン外の出目2以上の陰陽は、出目1のスイッチで引き込めないので数えない）
//     3) 有効な陰陽が7個以上：ライン7マスに陰陽を引き込む（極の調和）
//     4) 有効な陰陽が7個未満：出目1のジョーカーで陰陽をコピー（7−有効な陰陽 の数だけ。ラインのマスのジョーカーを優先）
//     5) それでも7個未満：横活性（クリティカルマスを含む横5マス）に引き込む（有効な陰陽5個以上のとき）
//        それもできなければ縦活性（クリティカルマスを含む縦3マス）に引き込む（有効な陰陽3個以上のとき）
//     6) 縦のみ・横のみ活性のとき：クリティカルマスの陰陽に養分を当てる（出目が同じ養分なら出目2以上でもよい）
//     7) 盤面を空ける合成（合成先はライン外。出目1だけ＝出目2以上には手を付けない）
//        スイッチが3つ以上ならスイッチ同士 → 養分同士 → 自由枠同士
//     8) 最後の手段（ここまで何もできないとき）：7) を出目2以上でも行う → ジョーカー同士
//   陰陽同士の合成・ジョーカーで陰陽以外をコピー・出目2以上のジョーカーでのコピーは行わない。PUは行わない。
RD.defineAgent('yinyang_basic', {
  name: '陰陽基礎AI',
  desc: '神々の楽園用。陰陽・スイッチ・養分・ジョーカー＋自由枠。クリティカルマスは楽園の会心マス（入口に近い方を優先）。スイッチの入れ替えで陰陽をライン（クリティカルマスの縦横7マス）へ集める。空きがあればクリティカルマスにスイッチを置いて召喚。埋まったら 有効な陰陽（ライン上＋ライン外の出目1）7個で極の調和 → 出目1ジョーカーで陰陽をコピー（7−(ライン上の陰陽＋ライン外の出目1陰陽) 個まで） → 横活性 → 縦活性 → 縦か横のみ活性ならクリティカルマスの陰陽に養分 → ライン外へ出目1の合成（スイッチ3つ以上ならスイッチ→養分→自由枠）で盤面を空ける。',
  options: {
    critOrder: null,        // クリティカルマスの優先順（マス番号の配列）。null なら楽園のマスを入口に近い順
    clearMaxPips: 1,        // 盤面を空ける合成（7）で使う出目の上限（1＝出目2に手を付けない）
    switchMergeMin: 3,      // スイッチ同士を合成する、盤面のスイッチの数の下限
    feedBeforeClear: true,  // 6) の養分を 7) の合成より先に行う（false なら 7) の後）
    feedAfterHarmony: true, // 極の調和ができた後も、クリティカルマスの陰陽に養分を当てる
    lastResort: true,       // 8) 最後の手段を使う
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options;
    const CORE = ['yinyang', 'switch', 'nutrient', 'joker'];
    const FREE = ctx.info.deck.map(d => d.type).filter(t => !CORE.includes(t));

    // マスの位置（エンジンの COL_X・ROW_Y と同じ値）。敵の入口は通路の始点 (0, 0)＝盤面の左下
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const dist = i => Math.hypot(COL_X[i % 5], ROW_Y[Math.floor(i / 5)]);
    const byDist = (cells) => [...cells].sort((a, b) => dist(a) - dist(b) || a - b);
    let critOrder = o.critOrder || null; // 楽園のマスは最初の観測で決める
    const rowOf = c => { const r = Math.floor(c / 5); return [0, 1, 2, 3, 4].map(k => r * 5 + k); };
    const colOf = c => [0, 1, 2].map(r => r * 5 + (c % 5));
    // ターゲットの並び：クリティカルマス → 残りは近い順
    const ordered = (cells, crit) => [crit, ...cells.filter(x => x !== crit)];

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null; // 操作数の上限
      const b = obs.board, ctl = obs.control || {};
      const full = b.every(Boolean);
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      if (!critOrder) {
        const pc = (obs.field && obs.field.paradise || []).map(p => p.cell);
        critOrder = pc.length ? byDist(pc) : byDist([...Array(15).keys()]);
        ctx.log(`クリティカルマス（優先順）：${critOrder.slice(0, pc.length || 1).join('、')}${pc.length ? '' : '（楽園でないので入口に最も近いマス）'}`);
      }
      const crit = critOrder[0];
      const row = rowOf(crit), col = colOf(crit);
      const line = new Set([...row, ...col]);
      const is = (i, t) => b[i] && b[i].type === t;
      const count = t => b.filter(d => d && d.type === t).length;
      // 有効な陰陽＝ライン上の陰陽＋ライン外の出目1の陰陽
      const E = b.filter((d, i) => d && d.type === 'yinyang' && (line.has(i) || d.pips === 1)).length;
      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const findAct = (f, t) => legal.get(f * 15 + t);
      const act = (a, note) => ({
        ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }],
        more: true, note,
      });
      const lines = () => (b[crit] && b[crit].state) || { col: false, row: false };

      // ---------- スイッチによる位置の移動 ----------
      // targets のマスに陰陽を入れる手を探す（targets は優先順）
      function placeInto(targets) {
        const T = new Set(targets);
        // 引き込み元の陰陽・スイッチは、いつもライン（7マス）の外だけ。
        // ラインの中から抜くと、横活性と縦活性が互いの陰陽を引き抜き合って往復してしまうため
        const srcY = [...Array(15).keys()].filter(q => is(q, 'yinyang') && !line.has(q));
        // a) target にあるスイッチを、同じ出目の陰陽に重ねる（陰陽が target に入る）
        for (const t of targets) {
          if (!is(t, 'switch')) continue;
          for (const q of srcY) {
            const a = findAct(t, q);
            if (a && a.result === 'swap') return act(a, `引き込み：${q}の陰陽(出目${b[q].pips})→${t}`);
          }
        }
        // b) target の外のスイッチを、target にある同じ出目の別種に重ねる（スイッチを置く）。
        //    同じ出目の陰陽がライン外にあるときだけ（次の判断で a) の引き込みができる）
        const yPips = new Set(srcY.map(q => b[q].pips));
        const tgt = targets.filter(t => b[t] && !['yinyang', 'switch'].includes(b[t].type) && yPips.has(b[t].pips))
          .sort((p, q) => (is(p, 'joker') - is(q, 'joker'))); // ジョーカーはなるべく動かさない（コピーに使えるため）
        for (const t of tgt) {
          for (let s = 0; s < 15; s++) {
            if (line.has(s) || !is(s, 'switch')) continue;
            const a = findAct(s, t);
            if (a && a.result === 'swap') return act(a, `スイッチを置く：${s}→${t}（出目${b[t].pips}）`);
          }
        }
        return null;
      }

      // ---------- 盤面が埋まっていないとき ----------
      if (!full) {
        // 1) クリティカルマスにスイッチを置く
        if (actReady && b[crit] && !is(crit, 'switch') && !is(crit, 'yinyang')) {
          for (let s = 0; s < 15; s++) {
            if (s === crit || !is(s, 'switch')) continue;
            const a = findAct(s, crit);
            if (a && a.result === 'swap') return act(a, `クリティカルマス${crit}にスイッチを置く（${s}から）`);
          }
        }
        // 2) 召喚
        if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
        return null;
      }

      // ---------- 盤面が埋まっているとき ----------
      if (!actReady) return null;
      const ln = is(crit, 'yinyang') ? lines() : { col: false, row: false };
      const harmony = ln.col && ln.row;

      // 3) 有効な陰陽7個以上：極の調和
      if (E >= 7 && !harmony) {
        const r = placeInto(ordered([...line], crit));
        if (r) { r.note = '極の調和へ ' + r.note; return r; }
      }
      if (E < 7) {
        // 4) 出目1のジョーカーで陰陽をコピー（7−E 個まで。1回ごとに見直すので、E が7になったら止まる）
        //    ラインのジョーカー優先：クリティカルマス→横→縦→ライン外
        const rank = i => i === crit ? 0 : row.includes(i) ? 1 : col.includes(i) ? 2 : 3;
        const cp = obs.legal.acts.filter(a => a.result === 'copy' && is(a.from, 'joker') && b[a.from].pips === 1 && is(a.to, 'yinyang'))
          .sort((p, q) => rank(p.from) - rank(q.from) || p.from - q.from);
        if (cp.length) return act(cp[0], `ジョーカー${cp[0].from}で陰陽をコピー（有効な陰陽${E}→${E + 1}、あと${7 - E}個必要）`);
        // 5) 横活性 → 縦活性
        if (E >= 5 && !ln.row) {
          const r = placeInto(ordered(row, crit));
          if (r) { r.note = '横活性へ ' + r.note; return r; }
        }
        if (E >= 3 && !ln.col && !ln.row) {
          const r = placeInto(ordered(col, crit));
          if (r) { r.note = '縦活性へ ' + r.note; return r; }
        }
      }

      // 6) 縦のみ・横のみ活性：クリティカルマスの陰陽に養分
      const feedOk = (ln.col !== ln.row) || (harmony && o.feedAfterHarmony);
      const feed = () => {
        if (!feedOk) return null;
        const a = obs.legal.acts.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient'));
        return a ? act(a, `クリティカルマスの陰陽に養分（出目${b[crit].pips}→${b[crit].pips + 1}）`) : null;
      };
      if (o.feedBeforeClear) { const r = feed(); if (r) return r; }

      // 7) 盤面を空ける合成（合成先はライン外。陰陽・ジョーカーは使わない）
      const clear = (maxPips) => {
        const merges = obs.legal.acts.filter(a => a.result === 'merge' && !line.has(a.to)
          && b[a.from].type === b[a.to].type && b[a.from].pips <= maxPips);
        const pick = (type, fromLineFirst) => {
          const c = merges.filter(a => b[a.from].type === type && a.from !== crit)
            .sort((p, q) => b[p.from].pips - b[q.from].pips
              || (fromLineFirst ? line.has(q.from) - line.has(p.from) : line.has(p.from) - line.has(q.from))
              || p.from - q.from);
          return c[0];
        };
        let a;
        // スイッチはラインの中にあると引き込みに使えるので、ライン外のものから合成する
        if (count('switch') >= o.switchMergeMin && (a = pick('switch', false))) return act(a, `盤面を空ける：スイッチ同士 ${a.from}→${a.to}`);
        // 養分・自由枠はラインの中のものから合成する（ラインのマスを空ける）
        if ((a = pick('nutrient', true))) return act(a, `盤面を空ける：養分同士 ${a.from}→${a.to}`);
        for (const t of FREE) if ((a = pick(t, true))) return act(a, `盤面を空ける：自由枠同士 ${a.from}→${a.to}`);
        return null;
      };
      let r = clear(o.clearMaxPips);
      if (r) return r;
      if (!o.feedBeforeClear) { r = feed(); if (r) return r; }

      // 8) 最後の手段
      if (o.lastResort) {
        r = clear(7);
        if (r) { r.note = '（最後の手段）' + r.note; return r; }
        const jj = obs.legal.acts.find(a => a.result === 'merge' && is(a.from, 'joker') && is(a.to, 'joker'));
        if (jj) return act(jj, `（最後の手段）ジョーカー同士 ${jj.from}→${jj.to}`);
      }
      return null;
    } };
  },
});
