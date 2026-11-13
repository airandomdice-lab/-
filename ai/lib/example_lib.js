// 共有ライブラリの見本（AI_LIB_GUIDE §3）。盤面を調べる小さな道具をまとめたもの。
// 守ること：試合ごとの状態をここ（ファイルの直下）に持たない。乱数は呼び出し側から渡された ctx.rng だけを使う。
RD.defineLib('example', {
  version: '1.0.0',
  // 合成できる組のうち、出目が最も低いもの（なければ null）
  lowestMerge(obs) {
    let best = null;
    for (const a of obs.legal.acts) if (a.result === 'merge' && (!best || obs.board[a.from].pips < obs.board[best.from].pips)) best = a;
    return best;
  },
  // 予告中のスキルの対象になっているマスの集合
  doomedCells(obs) { return new Set(obs.pending.flatMap(p => p.cells)); },
  // 試合ごとの状態を持つ部品は「作る関数」にする（AIの create の中で呼ぶ）
  makeCounter() { let n = 0; return { inc() { return ++n; }, get value() { return n; } }; },
});
