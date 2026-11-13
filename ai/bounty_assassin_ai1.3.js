// 懸賞金暗殺AI 1.3（AI API v1／AI_AGENT_GUIDE 1.7.x・AIRandomDicesim 2.1.0〜2.5.3 用）
// 登録ID：bounty_assassin（ほかのAIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：生贄・懸賞金・暗殺・適応・ジョーカー　想定フィールド：光のプリズム　想定する本家バージョン：どれでも
// 変更：1.1　中盤以降に、ジョーカーで暗殺をコピー（3番目）・出目3以上の暗殺と適応／暗殺同士・やることがないときの適応＋生贄（出目3以上）と適応同士（出目2以上）を追加
// 変更：1.2　2W以降、生贄の合計出目が4を下回る合成（生贄同士・生贄＋適応）をしない。2W以降、生贄をLv2までPU（召喚より先）
// 変更：1.3　序盤の最後に懸賞金同士の合成を追加
// 対戦用（懸賞金・暗殺は対戦でしか効かない。練習では攻撃と生贄のSPだけ）
//
// 用語
//   序盤：次の召喚のSP（obs.summonCost）が100以下の間（options.earlyCost）。それ以降を「中盤以降」と呼ぶ
//
// PU：2W以降、生贄がLv2未満でSPが足りればPU（召喚より先。options.sacLv・puFromWave）
// 召喚：SPがあれば召喚
// 生贄の合計出目：2W以降、盤面の生贄の出目の合計が4（options.sacMinSum）を下回る合成はしない
//   （生贄同士は2個分、生贄＋適応は1個分減るとして数える。合成でできるダイスの種類は抽選なので数えない）
// 重ねる操作（上から順に、できる最初の1つ）
//   序盤
//     1. ジョーカーで生贄をコピー → なければジョーカーで懸賞金をコピー
//     2. 生贄同士の合成
//     3. 出目2以上の懸賞金と適応の合成
//     4. 懸賞金同士の合成
//   中盤以降
//     1. 生贄同士の合成
//     2. 出目1ジョーカーで暗殺をコピー
//     3. ジョーカーで懸賞金 → 生贄 → 暗殺の順にコピー
//     4. 出目2以上の懸賞金と適応の合成
//     5. 懸賞金同士の合成
//     6. 出目3以上の暗殺と適応の合成
//     7. 出目3以上の暗殺同士の合成
//     8. 出目1・2の暗殺と適応の合成
//     9. 出目2の暗殺同士の合成
//    10. 出目1の暗殺同士の合成
//    11. やることがなければ：出目3以上の適応と生贄の合成
//    12. それでもなければ：出目2以上の適応同士の合成
// 同じ段で候補が複数あるときは、低い出目から（ジョーカーのコピーは高い出目から）
// 適応との合成は、適応を動かして相手のダイスに重ねる（options.adaptiveMoves。合成後のダイスは相手のマスにできる）
RD.defineAgent('bounty_assassin', {
  name: '懸賞金暗殺AI',
  desc: '生贄・懸賞金・暗殺・適応・ジョーカー用（光のプリズム想定・対戦用）。SPがあれば召喚。序盤（召喚SP100以下）はジョーカーで生贄→懸賞金をコピー、生贄同士、出目2以上の懸賞金＋適応、懸賞金同士。中盤以降は生贄同士、出目1ジョーカーで暗殺をコピー、ジョーカーで懸賞金→生贄→暗殺をコピー、出目2以上の懸賞金＋適応、懸賞金同士、出目3以上の暗殺＋適応、出目3以上の暗殺同士、出目1・2の暗殺＋適応、出目2の暗殺同士、出目1の暗殺同士、やることがなければ出目3以上の生贄＋適応、出目2以上の適応同士。2W以降は生贄の合計出目が4を下回る合成をせず、生贄をLv2までPU。',
  options: {
    earlyCost: 100,      // 次の召喚のSPがこれ以下の間を「序盤」とする
    adaptiveMoves: true, // 適応との合成で、適応の側を動かす（false なら相手の側を動かす）
    sacMinSum: 4,        // 2W以降：生贄の合計出目がこれを下回る合成はしない（0で無効）
    sacLv: 2,            // 生贄をこのLvまでPU（0か1で無効）
    puFromWave: 2,       // PUと生贄の合計出目の制限を始めるウェーブ
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options;
    const NAME = { sacrifice: '生贄', bounty: '懸賞金', assassin: '暗殺', adaptive: '適応', joker: 'ジョーカー' };
    const nm = t => NAME[t] || t;

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {};
      const early = obs.summonCost <= o.earlyCost;

      const late = obs.wave >= o.puFromWave;
      // ---------- PU ----------
      const sacDeck = obs.deck.find(x => x.type === 'sacrifice');
      if (late && sacDeck && sacDeck.lv < o.sacLv && obs.legal.powerUp.includes('sacrifice'))
        return { ops: [{ op: 'powerUp', type: 'sacrifice' }], more: true, note: `PU 生贄 Lv${sacDeck.lv + 1}` };
      // ---------- 召喚 ----------
      if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
      if (ctl.dragging || ctl.actReadyIn > 0) return null;

      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const find = (f, t, res) => { const a = legal.get(f * 15 + t); return a && a.result === res ? a : null; };
      const cells = t => [...Array(15).keys()].filter(i => b[i] && b[i].type === t && !b[i].sealed);
      const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note: `${early ? '序盤' : '中盤以降'}：${note}` });
      // 生贄の合計出目の制限（2W以降）
      const sacSum = cells('sacrifice').reduce((x, i) => x + b[i].pips, 0) + b.filter(d => d && d.type === 'sacrifice' && d.sealed).reduce((x, d) => x + d.pips, 0);
      const sacOk = a => {
        if (!late || !o.sacMinSum) return true;
        const lost = [a.from, a.to].filter(i => b[i].type === 'sacrifice').reduce((x, i) => x + b[i].pips, 0);
        return !lost || sacSum - lost >= o.sacMinSum;
      };
      const byLow = (p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from;

      // 同じ種類の合成（低い出目から）
      const pairs = (t, ok = () => true) => {
        const L = cells(t), res = [];
        for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) {
          if (b[L[x]].pips !== b[L[y]].pips || !ok(b[L[x]].pips)) continue;
          const a = find(L[x], L[y], 'merge') || find(L[y], L[x], 'merge');
          if (a && sacOk(a)) res.push(a);
        }
        return res.sort(byLow)[0] || null;
      };
      // t と適応の合成（低い出目から）
      const withAdaptive = (t, ok = () => true) => {
        const res = [];
        for (const x of cells(t)) for (const ad of cells('adaptive')) {
          if (b[x].pips !== b[ad].pips || !ok(b[x].pips)) continue;
          const a = o.adaptiveMoves ? (find(ad, x, 'merge') || find(x, ad, 'merge')) : (find(x, ad, 'merge') || find(ad, x, 'merge'));
          if (a && sacOk(a)) res.push(a);
        }
        return res.sort(byLow)[0] || null;
      };
      // ジョーカーで t をコピー（高い出目から）
      const jokerCopy = (t, ok = () => true) => {
        const res = [];
        for (const j of cells('joker')) { if (!ok(b[j].pips)) continue; for (const x of cells(t)) { const a = find(j, x, 'copy'); if (a) res.push(a); } }
        return res.sort((p, q) => b[q.to].pips - b[p.to].pips || p.from - q.from)[0] || null;
      };
      const mergeNote = (a, label) => `${label}（出目${b[a.from].pips}、${a.from}の${nm(b[a.from].type)}→${a.to}の${nm(b[a.to].type)}）`;
      const copyNote = a => `ジョーカー${a.from}で${nm(b[a.to].type)}（出目${b[a.to].pips}）をコピー`;

      let a;
      if (early) {
        if ((a = jokerCopy('sacrifice')) || (a = jokerCopy('bounty'))) return act(a, copyNote(a));
        if ((a = pairs('sacrifice'))) return act(a, mergeNote(a, '生贄同士'));
        if ((a = withAdaptive('bounty', p => p >= 2))) return act(a, mergeNote(a, '懸賞金＋適応'));
        if ((a = pairs('bounty'))) return act(a, mergeNote(a, '懸賞金同士'));
        return null;
      }
      if ((a = pairs('sacrifice'))) return act(a, mergeNote(a, '生贄同士'));
      if ((a = jokerCopy('assassin', p => p === 1))) return act(a, copyNote(a));
      if ((a = jokerCopy('bounty')) || (a = jokerCopy('sacrifice')) || (a = jokerCopy('assassin'))) return act(a, copyNote(a));
      if ((a = withAdaptive('bounty', p => p >= 2))) return act(a, mergeNote(a, '懸賞金＋適応'));
      if ((a = pairs('bounty'))) return act(a, mergeNote(a, '懸賞金同士'));
      if ((a = withAdaptive('assassin', p => p >= 3))) return act(a, mergeNote(a, '出目3以上の暗殺＋適応'));
      if ((a = pairs('assassin', p => p >= 3))) return act(a, mergeNote(a, '出目3以上の暗殺同士'));
      if ((a = withAdaptive('assassin', p => p <= 2))) return act(a, mergeNote(a, '出目1・2の暗殺＋適応'));
      if ((a = pairs('assassin', p => p === 2))) return act(a, mergeNote(a, '出目2の暗殺同士'));
      if ((a = pairs('assassin', p => p === 1))) return act(a, mergeNote(a, '出目1の暗殺同士'));
      if ((a = withAdaptive('sacrifice', p => p >= 3))) return act(a, mergeNote(a, 'やることがない：生贄＋適応'));
      if ((a = pairs('adaptive', p => p >= 2))) return act(a, mergeNote(a, 'やることがない：適応同士'));
      return null;
    } };
  },
});
