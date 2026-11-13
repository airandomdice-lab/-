// 共有ライブラリを使うAIの見本（AI_LIB_GUIDE §3）
RD.defineAgent('example_lib_ai', {
  name: '見本：共有ライブラリを使うAI',
  desc: '共有ライブラリ「example」の道具で、召喚→出目の低い組から合成する。',
  create(ctx) {
    const L = RD.lib('example');          // create の中で取り出す（ファイルを読む順番を気にしなくてよい）
    const merges = L.makeCounter();       // 試合ごとの状態は、create の中で作る
    return { decide(obs) {
      if (obs.legal.summon && !(obs.control.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true };
      const m = L.lowestMerge(obs);
      if (m && !(obs.control.actReadyIn > 0)) return { ops: [{ op: 'act', from: m.from, to: m.to, expect: 'merge' }], note: `合成 ${merges.inc()}回目` };
      return null;
    } };
  },
});
