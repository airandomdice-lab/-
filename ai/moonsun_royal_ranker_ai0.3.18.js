// ランカー月ロイ（moonsun_royal_ranker）0.3.18
// デッキ：月・太陽・ロイヤル・成長・ジョーカー（推奨：月クラス12・その他10以上、クリダメ2500、スキン プラズマシールド＞水晶＞航海日記）
// 0.1.0：ノーマル対面の W1・W2 だけ（W3以降はまだ何もしない）
// 0.1.1：太陽が崩れたとき、太陽が3個以下なら太陽どうしを合成しない（5個以上のときだけ）
// 0.1.2：①は盤面に出目3以下の成長がある間だけ。①が終わり（出目3以下の成長がなくなり）太陽が活性したら、7回分貯めて1回召喚に戻る
// 0.1.3：SPがなく太陽が活性しないとき、まず出目2以下の月どうしを合成。ジョーカーで太陽をコピーするのはモンスターが中央を越えてから
// 0.1.4：7回分貯めて召喚したいのに空きがないとき、ロイヤル3→月2→ロイヤル2→月1→ロイヤル1→太陽1 の順に同じものどうしを合成して空ける
// 0.1.5：不具合の修正。「SPがあるか」を legal.summon（空きがないと false になる）で見ていたため、盤面が埋まると「SPなし」扱いになり、空けるための合成をしていなかった
// 0.1.6：SPがなく太陽が活性しないとき、モンスターが2角を越えたら ロイヤルどうし→月どうし→ジョーカーでロイヤルをコピー→ジョーカーで月をコピー→ジョーカーどうし で太陽を狙う
// 0.1.7：モンスターが2角を越えて太陽が活性していなければ、①より先に活性を取りに行く（空きとSPがあれば召喚→空けるときと同じ順で合成〔太陽は5個以上のときだけ〕→ジョーカー）
// 0.1.8：「1角を越えるまでSPを貯める」はW1だけ。W2は最初から7回分貯めて1回召喚
// 0.1.9：W2でモンスターが中央を越えたとき太陽が1個なら、活性を崩してでもロイヤル・月どうしを合成して太陽4個を狙い、それでも4個にならなければジョーカーで太陽をコピー（コピーできる太陽がなければジョーカーでロイヤル・月をコピーして合成、それもなければジョーカーどうし）
// 0.1.10：上の太陽4個狙いで、空きとSPがあれば召喚もする。成長が残り1秒を切っていれば待つ
// 0.1.11：①で太陽どうしを合成するのは「太陽が活性していないとき」から「太陽が5個以上のとき」に変更
// 0.1.12：太陽4個狙いの「成長があと1秒なら待つ」をやめる
// 0.1.13：太陽4個狙いは一度始めたら（太陽4個になって終わったあとも）二度と始めない
// 0.2.0：星のジョーカー（出目7）でロイヤル・成長をコピーしない（全ウェーブ）。W1・W2の合成の向き（上→横は中央→左）。
//        W3以降のノーマル対面：出目上げ・太陽が消えたとき・中央越え・2角越え・ウェーブ残り10秒（ナイト前の活性切り）
// 0.2.1：出目上げで、ジョーカーで成長以外をコピーする前に召喚。召喚できる回数が4回を切って太陽が活性していたら、9回分になるまで出目上げを止める
// 0.2.2：優先度は数字が小さいほど強い。太陽が消えたとき（優先度4）は中央越え（優先度5）より先に動く
// 0.2.3：レオン前も出目上げをする。太陽が消えたとき（3個以下）・中央越え・2角越え・残り10秒に召喚を入れる。一手で両活性（2角越え）＝優先度2、残り10秒＝優先度3
// 0.2.4：優先度はタイトルの隣に書いたものだけ。優先度2は「一手で両活性」だけで、2角越えの残りの手順は番号なし（太陽が消えた〔優先度4〕のあと）
// 0.2.5：パワーアップ。太陽はW2でLv2、W3以降は残り10秒で活性を取るときに。月は出目4があればLv3、出目5以上があればLv5。どれもSPに余裕があるとき（パワーアップ後に召喚4回分が残る）
// 0.2.6：W3以降はすべての手で火力の半減を禁止（月の星に隣接する出目3以上の太陽を1個以上残せる手は除く）。太陽が消えたとき、5個以上で先頭が1角を越えていればジョーカーで太陽と合成
// 0.2.7：W1でモンスターが中央を越えたら月どうしを合成。最初の4個で太陽が出なかったら月どうしを合成
// 0.2.8：W2でモンスターが1角を越えていて太陽が活性していないときは、一番出目の低い太陽をコピーできるジョーカーを1個残す（太陽のコピー以外に使わない）
// 0.2.9：W1・W2でも、出目4以上の成長をジョーカーでコピーできるときはコピー
// 0.3.0：出目上げを止めたあと再開するのは7回分（9回分から緩和）。出目4以上の一番高い月を0個にする合成を禁止（全ウェーブ）。W3以降、そのウェーブを生き残る火力がなければ（優先度2）召喚→ロイヤルどうし→月どうし→ジョーカーでロイヤル→ジョーカーで月→ジョーカーどうし
// 0.3.1：生き残る火力がないときの合成・ジョーカーは出目の高いものから
// 0.3.2：生き残る火力がないときの合成の向きを出目上げと同じに（一番出目の高い月の隣→一番出目の高い太陽の隣→B2→中央→B3→左→上）
// 0.3.3：優先度は、ぶつかる（競合する）ときだけ上が勝つ。ぶつからなければ下の動きも行う。残り10秒のナイト待ち・手がないときは下の動きに進む。「両活性なので止める」は出目上げだけを止める
// 0.3.4：出目上げで「火力は足りている」で止まるとき、W5以降なら中央越えと同じ手順で月を活性させる
// 0.3.5：先頭が2角とゴールの間の中央（laneMid）を越えたら、両活性に戻す手がないとき 成長どうしの合成→ジョーカーで成長をコピー→火力を8割まで減らす手（減りの少ない手から）も使う。
//        「何ウェーブ先の1角火力を見るか」（aheadWaves）は数か、ウェーブごとの表（{3:2, 10:1} のように。書いたウェーブ以降に効く）で指定できる
// 0.3.6：aheadWaves をハイブリッドに（W5までは1ウェーブ先、W6は2ウェーブ先、W7以降は3ウェーブ先）
// 0.3.7：W6以降、盤面で一番出目の高いダイスが月（同じ出目のほかのダイスがあっても月が含まれていれば）のときは、ナイト前の活性切りをしない
//        W3以降はすべての合成の向きを出目上げの向き（一番出目の高い月の隣→一番出目の高い太陽の隣→B2→中央→B3→左→上）に
// 0.3.8：W6以降も、先頭が1角を越えていて太陽が活性していなければ、一番出目の低い太陽をコピーできるジョーカーを1個残す（W2と同じ）
// 0.3.9：残すジョーカーは「どれかの太陽と同じ出目のジョーカー」のうち一番出目の低いもの。活性のためのジョーカーは使えるものの中で一番出目の低いもの。
//        W7以降は残り10秒の動きを残り15秒から。月の星が出たら、成長をコピーしない・出目上げで月の星の隣にダイスを合成しに行く（出目5以上は星の隣でない方に残す）
// 0.3.10：月の星の隣への合成は、出目上げが止まっているとき（火力は足りている・SPを貯める・成長待ち）も動かす
// 0.3.11：出目上げのボーダー（aheadWaves）をすべてのウェーブで3ウェーブ先に
// 0.3.12：ロイヤル攻撃の手順（優先度6）。フラグの条件はまだ（royalFlag：既定はオフ）
// 0.3.13：ロイヤル攻撃フラグ（対月太陽・核対面・コンボ対面・月対面）。暗殺対面は月太陽AIの暗殺対面の動き＋リミッター解除（判断・操作0.1秒）
// 0.3.14：ナイト前に活性を切ったら、ナイトのスキル（1回目）まで切ったままにする（優先度3が4・5・番号なしに勝つ）。
//         動いてよいのは優先度2（2角越えの一手で両活性・生き残る火力なし）とパワーアップだけ。2角越えでは活性を切らない（優先度2が勝つ）
// 0.3.15：ロイヤル攻撃で盤面にロイヤルがなければ、（太陽5個以上なら）太陽どうし→月どうし→ジョーカーで月と合成→ジョーカーで太陽と合成 でロイヤルを狙う
// 0.3.16：W8以降、月の星に太陽が隣接していないとき（月の星がないときも含む）、太陽が消えたときの手順を延ばす
//         （ふだんの手→召喚→ロイヤルどうし→月どうし→ジョーカーでロイヤルと合成→ジョーカーで月と合成→7個を目指す：太陽は合成せず 月→ロイヤル→召喚→太陽コピー→ジョーカーでロイヤル・月と合成）
// 0.3.17：ロイヤルを狙う手順の最初に召喚。出目上げで良い手がなく、盤面にまだ成長する成長がなければ、出目の低いジョーカーどうし→太陽どうしを合成
// 0.3.18：月太陽対面・W6以降で相手にこのウェーブを生き残る火力がないとき
//         相手に盾・吹雪がない：こちらに生き残る火力があり両活性ならすべての動きを止める
//         相手に盾・吹雪がある：こちらが2ウェーブ先まで1角処理できるならロイヤルの合成を禁止（優先度3。優先度2の動きはしてよい）
(() => {
'use strict';

// 暗殺対面の判定（月太陽AIと同じ）：相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべて入っている
const RR_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function rrIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return RR_ASN_DECK.every(t => ts.has(t));
}

RD.defineAgent('moonsun_royal_ranker', {
  name: 'ランカー月ロイ',
  desc: 'ランカー月ロイ（月・太陽・ロイヤル・成長・ジョーカー）。0.3.18：ノーマル対面（W1・W2、W3以降）',
  // 操作の速さ0.3秒、判断の間隔0.5秒
  // 暗殺対面ではリミッター解除（判断・操作を asnSpeed 秒に。月太陽AIと同じ）
  limits: (o, info) => (o.asnMode && o.asnSpeed && rrIsAsn(info))
    ? { interval: o.asnSpeed, actInterval: o.asnSpeed, summonInterval: o.asnSpeed, dragTime: o.asnSpeed }
    : { interval: o.thinkTime, actInterval: o.opTime, summonInterval: o.opTime, dragTime: o.opTime },
  options: {
    thinkTime: 0.5,     // 判断の間隔（秒）
    opTime: 0.3,        // 操作の速さ（秒）
    corner1: 3.5,       // 1角の位置
    center: 6.0,        // 中央の位置（通路12の半分）
    corner2: 8.5,       // 2角の位置
    laneMid: 10.25,     // 2角とゴール（12）の間の中央
    lowMoonMerge: 2,    // SPがないとき合成する月の出目の上限
    // 7回分貯めて召喚したいのに空きがないとき、空けるために合成する組（上から順に）
    makeRoom: [['royal', 3], ['moon', 2], ['royal', 2], ['moon', 1], ['royal', 1], ['sun', 1]],
    firstSummons: 4,    // W1：最初に出す個数（この個数で太陽が出なければ月どうしを合成）
    saveSummons: 7,     // 1角を越えたあと、この回数分のSPが貯まったら1回召喚
    growWatch: 3,       // ①：最後に成長する成長の残りがこの秒を切ったら動く
    growLast: 1,        // ①：残りがこの秒を切ったらジョーカーで成長をコピー
    growMaxPips: 3,     // ①：見る成長の出目の上限
    // ---- W3以降 ----
    last10: 10,         // ウェーブ残りこの秒以内の動き
    last10Late: 15,     // W(last10LateFrom)以降は残りこの秒から（0.3.9）
    last10LateFrom: 7,
    // ---- ロイヤル攻撃（0.3.12）----
    royalFlag: 'auto',  // ロイヤル攻撃フラグ：'auto'＝対面ごとの条件（0.3.13）／true＝常に立つ（試験用）／false＝立てない
    // 暗殺対面（0.3.13。月太陽AIと同じ）
    asnMode: true,      // 相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがあれば暗殺対面の動きだけにする
    asnSpeed: 0.1,      // 暗殺対面の判断・操作の速さ（秒）＝リミッター解除
    asnCorner: 8.5,     // 暗殺対面：こちらの先頭がこの位置（2角）を越えたら縛りを外す
    royalCopySummons: 7, // ジョーカーでロイヤルをコピーするのは、SPがこの回数分の召喚以上あり、先頭が中央を越えていないときだけ
    starAwayPips: 5,    // 月の星が出たあと、この出目以上の合成は星の隣でない方に残す（0.3.9）
    knightCut: 1,       // ナイト前：残りこの秒で活性を切る
    keepJokerFrom: 6,   // このウェーブ以降も、1角越えで太陽が活性していなければ太陽用のジョーカーを1個残す（0.3.8）
    oppWeakFrom: 6,     // 月太陽対面：このウェーブ以降、相手にこのウェーブを生き残る火力がないかを見る（0.3.18）
    oppWeakAhead: 2,    // 盾・吹雪の相手：こちらが何ウェーブ先まで1角処理できればロイヤルの合成を禁止するか
    sunLostLongFrom: 8, // このウェーブ以降、月の星に太陽が隣接していなければ、太陽が消えたときの手順を延ばす（0.3.16）
    knightMoonOff: 6,   // このウェーブ以降、一番出目の高いダイスが月ならナイト前の活性切りをしない（0.3.7）
    growStop: 3,        // 出目上げ：成長の残りがこの秒を切ったら動かない
    tripleCopy: 3,      // 出目上げ：火力がこの倍になるジョーカーのコピーは使う
    halfLimit: 0.5,     // 火力をこの割合未満にする手は禁止（両活性前提の火力）
    laneEndLimit: 0.2,  // laneMid 越えで最後に許す下限（火力を8割減らす手まで）
    // 何ウェーブ先の1角火力を見るか。数ならいつもその値。表 { ウェーブ: 何ウェーブ先 } なら、そのウェーブ以降に効く（例 {3: 2, 10: 1}）
    aheadWaves: 3,      // 0.3.11：すべてのウェーブで3ウェーブ先（数か、表 { ウェーブ: n } で指定できる）
    holdBelow: 4,       // 出目上げ：召喚できる回数がこれを切って太陽が活性していたら止める
    holdUntil: 7,       // 出目上げ：止めたら召喚できる回数がこれになるまで再開しない（0.3.0で9→7）
    puMargin: 4,        // パワーアップの「SPに余裕」：パワーアップしたあとも、この回数分の召喚SPが残る
  },
  create(ctx) {
    const O = ctx.options;

    // ---------- 共通の部品 ----------
    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const costN = (c, n) => n * c + 5 * n * (n - 1);                 // いまのコストから n 回召喚するSP
    const hasEmpty = b => b.some(d => !d);
    const spOk = obs => !obs.over && obs.sp >= obs.summonCost;        // 召喚1回分のSPがある（空きは見ない）
    const sunActive = b => b.some(d => d && d.type === 'sun' && d.active);
    const growLeft = d => (d && d.type === 'growth' && d.state && d.state.growLeft != null ? d.state.growLeft : null);
    // 合成の候補。出目4以上の一番高い月を0個にする合成は禁止（0.3.0。3個あれば2個は消せる）
    function topMoonOk(b, a) {
      let mp = 0, n = 0;
      for (const d of b) if (d && d.type === 'moon') { if (d.pips > mp) { mp = d.pips; n = 0; } if (d.pips === mp) n++; }
      if (mp < 4) return true;
      let lost = 0;
      for (const c of [a.from, a.to]) if (b[c] && b[c].type === 'moon' && b[c].pips === mp) lost++;
      return n - lost > 0;
    }
    const merges = obs => obs.legal.acts.filter(a => a.result === 'merge' && topMoonOk(obs.board, a));
    // 星のジョーカー（出目7）でロイヤル・成長をコピーするのは禁止（何も変わらないため）
    // 月の星が出たら成長はコピーしない（0.3.9）
    const copies = obs => obs.legal.acts.filter(a => a.result === 'copy' &&
      !(obs.board[a.from].type === 'joker' && obs.board[a.from].pips === 7 && ['royal', 'growth'].includes(obs.board[a.to].type)) &&
      !(obs.board[a.to].type === 'growth' && moonStar(obs.board)));
    // 合成の向き：rank の小さいマスに残す（逆向きも合成できるとき）
    const rankW12 = i => { const r = Math.floor(i / 5), c = i % 5; return r * 100 + Math.abs(c - 2) * 10 + c; };   // 上→横は中央→左
    function orient(obs, a, rank) {
      if (a.result !== 'merge' || !rank) return a;
      const rev = obs.legal.acts.find(x => x.result === 'merge' && x.from === a.to && x.to === a.from);
      return rev && rank(a.from) < rank(a.to) ? rev : a;
    }
    let curRank = null;   // 合成の向きの決め方（W1・W2は rankW12）
    // 月の星が出たあとの合成の向き（0.3.9）：片方だけが星の隣なら、出目4以下は星の隣に、出目5以上は星の隣でない方に残す
    let starMode = false;
    const starNB = b => { const s = new Set(); b.forEach((d, i) => { if (d && d.type === 'moon' && d.pips === 7) for (const j of NB[i]) s.add(j); }); return s; };
    function starOrient(obs, a) {
      if (!starMode || a.result !== 'merge') return null;
      const N = starNB(obs.board), inF = N.has(a.from), inT = N.has(a.to);
      if (inF === inT) return null;
      const wantN = obs.board[a.to].pips < O.starAwayPips;
      if (inT === wantN) return a;
      return obs.legal.acts.find(x => x.result === 'merge' && x.from === a.to && x.to === a.from) || a;
    }
    const opAct = (obs, a0, note) => { const a = starOrient(obs, a0) || orient(obs, a0, curRank);
      return { ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note }; };
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });
    let idleNote = null;
    const idle = note => { if (idleNote === note) return null; idleNote = note; return { ops: [], note }; };
    let keepJoker = null;   // W2・W6以降：残しておくジョーカーのマス（0.2.8、0.3.8）
    // 先頭が1角を越えていて太陽が活性していなければ、一番出目の低い太陽と同じ出目のジョーカーを1個残す
    function setKeepJoker(obs, on) {
      keepJoker = null;
      const b = obs.board;
      if (!on || !obs.front || obs.front.pos < O.corner1 || sunActive(b)) return;
      // どれかの太陽と同じ出目のジョーカーのうち、一番出目の低いもの（0.3.9）
      const sp = new Set(b.filter(d => d && d.type === 'sun').map(d => d.pips));
      b.forEach((d, i) => { if (d && d.type === 'joker' && sp.has(d.pips) && (keepJoker == null || d.pips < b[keepJoker].pips)) keepJoker = i; });
    }
    // 残すジョーカーを使ってよい手か（太陽のコピーだけ）
    const keepOk = (b, a) => keepJoker == null || !((a.from === keepJoker || a.to === keepJoker) && !(a.result === 'copy' && a.from === keepJoker && b[a.to].type === 'sun'));
    // 同じ種類どうしの合成（types の順に、出目の低いものから）。pips を指定するとその出目だけ
    function pairMerge(obs, types, pips) {
      const b = obs.board;
      for (const t of types) {
        let best = null;
        for (const a of merges(obs)) {
          const x = b[a.from], y = b[a.to];
          if (x.type !== t || y.type !== t) continue;
          if (pips != null && x.pips !== pips) continue;
          if (keepJoker != null && (a.from === keepJoker || a.to === keepJoker)) continue;
          if (!best || x.pips < b[best.from].pips) best = a;
        }
        if (best) return best;
      }
      return null;
    }
    // ジョーカー（出目 pips）で type をコピー。pips を省くと出目の低いジョーカーから
    function jokerCopy(obs, type, pips, ok) {
      const b = obs.board;
      let best = null;
      for (const a of copies(obs)) {
        if (b[a.from].type !== 'joker' || b[a.to].type !== type) continue;
        if (pips != null && b[a.from].pips !== pips) continue;
        if (keepJoker != null && a.from === keepJoker && type !== 'sun') continue;   // 残すジョーカーは太陽のコピーにだけ使う
        if (ok && !ok(a)) continue;
        if (!best || b[a.from].pips < b[best.from].pips) best = a;
      }
      return best;
    }

    // ---------- 状態 ----------
    const S = { knightHold: 0, wave: 0, started: false, passed: false, aim4: false, aim4Used: false, pend: null, hold: false };

    // ---------- ① 成長の手入れ ----------
    // 出目1〜3の成長それぞれで「最後に成長する1個」の残りを見る。残りが3秒を切ったら動く
    function growthCare(obs) {
      const b = obs.board;
      // 太陽どうしを合成するのは太陽が5個以上のときだけ
      const freeTypes = count(b, 'sun') >= 5 ? ['sun', 'moon', 'royal'] : ['moon', 'royal'];
      const list = [];
      for (let k = 1; k <= O.growMaxPips; k++) {
        const g = b.filter(d => d && d.type === 'growth' && d.pips === k && growLeft(d) != null);
        if (!g.length) continue;
        const last = Math.max(...g.map(growLeft));
        if (last < O.growWatch) list.push({ k, last });
      }
      list.sort((x, y) => x.last - y.last);
      for (const { k, last } of list) {
        const copy = () => { const a = jokerCopy(obs, 'growth', k); return a ? opAct(obs, a, `①成長${k}：ジョーカーで成長をコピー`) : null; };
        if (last < O.growLast) { const r = copy(); if (r) return r; }
        if (k === 1) {
          if (spOk(obs)) {
            if (hasEmpty(b)) return opSummon('①成長1：召喚');
            const a = pairMerge(obs, freeTypes);
            if (a) return opAct(obs, a, '①成長1：合成して空ける');
          }
          const r = copy(); if (r) return r;
        } else {
          const a = pairMerge(obs, freeTypes, k - 1);
          if (a) return opAct(obs, a, `①成長${k}：出目${k - 1}どうしで出目${k}を作る`);
          const r = copy(); if (r) return r;
        }
      }
      return null;
    }

    // ---------- 太陽の活性の立て直し ----------
    function sunRepair(obs) {
      const b = obs.board, sc = count(b, 'sun');
      // 太陽が崩れた：太陽が3個以下でなければ（5個以上なら）太陽どうしを合成
      if (sc >= 5 && sc !== 7) {
        const a = pairMerge(obs, ['sun']);
        if (a) return opAct(obs, a, '立て直し：太陽どうしを合成');
      }
      if (spOk(obs)) {
        if (hasEmpty(b)) return opSummon('立て直し：召喚');
        // 空きがない：ジョーカー・成長以外の同じ種類どうしを出目の低いものから合成
        let best = null;
        for (const a of merges(obs)) {
          const x = b[a.from];
          if (x.type === 'joker' || x.type === 'growth') continue;
          if (!best || x.pips < b[best.from].pips) best = a;
        }
        if (best) return opAct(obs, best, '立て直し：合成して空ける');
      }
      if (spOk(obs)) return null;
      // SPがない：まず出目2以下の月どうしを合成（太陽が出るのを狙う）
      {
        let best = null;
        for (const a of merges(obs)) {
          const x = b[a.from], y = b[a.to];
          if (x.type !== 'moon' || y.type !== 'moon' || x.pips > O.lowMoonMerge) continue;
          if (!best || x.pips < b[best.from].pips) best = a;
        }
        if (best) return opAct(obs, best, '立て直し：SPなし・出目2以下の月どうしを合成');
      }
      // モンスターが中央を越えていて、残り3秒の成長がなければ、出目の低いジョーカーで太陽をコピー
      const front = obs.front ? obs.front.pos : 0;
      if (front >= O.center && !b.some(d => { const l = growLeft(d); return l != null && d.pips <= O.growMaxPips && l < O.growWatch; })) {
        const a = jokerCopy(obs, 'sun', null, x => { const n = sc + 1; return n === 1 || n === 4 || n === 7; });
        if (a) return opAct(obs, a, '立て直し：ジョーカーで太陽をコピー');
      }
      return null;
    }

    // ---------- 2角越え：太陽の活性を取りに行く（0.1.7） ----------
    // 空きとSPがあれば召喚 → 空けるときと同じ順で合成（その後ろに残りのロイヤル・月どうし。太陽は5個以上のときだけ）
    // → ジョーカーで太陽をコピーして活性の個数に → ジョーカーでロイヤル・月をコピー → ジョーカーどうし
    const JN = { royal: 'ロイヤル', moon: '月', sun: '太陽' };
    function corner2Rush(obs) {
      const b = obs.board, sc = count(b, 'sun');
      const tag = '2角越え';
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      const order = O.makeRoom.filter(([t]) => t !== 'sun' || sc >= 5);
      for (const [t, p] of order) {
        const a = pairMerge(obs, [t], p);
        if (a) return opAct(obs, a, `${tag}：${JN[t]}${p}どうしを合成`);
      }
      const rest = sc >= 5 ? ['royal', 'moon', 'sun'] : ['royal', 'moon'];
      { const a = pairMerge(obs, rest); if (a) return opAct(obs, a, `${tag}：${JN[b[a.from].type]}${b[a.from].pips}どうしを合成`); }
      let a = jokerCopy(obs, 'sun', null, () => { const n = sc + 1; return n === 1 || n === 4 || n === 7; });
      if (a) return opAct(obs, a, `${tag}：ジョーカーで太陽をコピー`);
      a = jokerCopy(obs, 'royal');
      if (a) return opAct(obs, a, `${tag}：ジョーカーでロイヤルをコピー`);
      a = jokerCopy(obs, 'moon');
      if (a) return opAct(obs, a, `${tag}：ジョーカーで月をコピー`);
      a = pairMerge(obs, ['joker']);
      if (a) return opAct(obs, a, `${tag}：ジョーカーどうしを合成`);
      return null;
    }

    // ---------- W2：太陽1個から4個を狙う（0.1.9） ----------
    // 活性を崩してでも、ロイヤル・月どうしを（空けるときの順→残りを出目の低いものから）合成。なければジョーカーで太陽をコピー
    function aimFourSuns(obs) {
      const b = obs.board, tag = 'W2中央越え・太陽1個';
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      for (const [t, p] of O.makeRoom) {
        if (t === 'sun') continue;
        const a = pairMerge(obs, [t], p);
        if (a) return opAct(obs, a, `${tag}：${JN[t]}${p}どうしを合成`);
      }
      { const a = pairMerge(obs, ['royal', 'moon']); if (a) return opAct(obs, a, `${tag}：${JN[b[a.from].type]}${b[a.from].pips}どうしを合成`); }
      let a = jokerCopy(obs, 'sun');
      if (a) return opAct(obs, a, `${tag}：ジョーカーで太陽をコピー`);
      // コピーできる太陽がない：ジョーカーでロイヤル・月をコピーして（次の判断で）合成。それもなければジョーカーどうし
      a = jokerCopy(obs, 'royal');
      if (a) return opAct(obs, a, `${tag}：ジョーカーでロイヤルをコピー`);
      a = jokerCopy(obs, 'moon');
      if (a) return opAct(obs, a, `${tag}：ジョーカーで月をコピー`);
      a = pairMerge(obs, ['joker']);
      if (a) return opAct(obs, a, `${tag}：ジョーカーどうしを合成`);
      return null;
    }

    // ---------- ノーマル対面 W1・W2 ----------
    function earlyWaves(obs) {
      const b = obs.board;
      // W2：モンスターが1角を越えていて太陽が活性していなければ、一番出目の低い太陽をコピーできるジョーカーを1個残す
      setKeepJoker(obs, obs.wave === 2);
      // パワーアップ：月（出目4・5以上の月）、太陽（W2でLv2）
      { const r = moonPU(obs) || (obs.wave === 2 ? sunPU(obs, 2, 'W2でLv2') : null); if (r) return r; }
      // ①：出目3以下の成長が盤面にある間
      const one = b.some(d => d && d.type === 'growth' && d.pips <= O.growMaxPips);
      // モンスターが2角を越えて太陽が活性していなければ、①より先に活性を取りに行く
      if (S.started && !sunActive(b) && obs.front && obs.front.pos >= O.corner2) { const r = corner2Rush(obs); if (r) return r; }
      // W1：モンスターが中央を越えたら月どうしを合成。最初の4個で太陽が出なかったら月どうしを合成
      if (obs.wave === 1 && obs.phase === 'wave') {
        const pastCenter = obs.front && obs.front.pos >= O.center;
        const noSunFirst4 = !S.started && obs.summonCount >= O.firstSummons && count(b, 'sun') === 0;
        if (pastCenter || noSunFirst4) {
          const a = pairMerge(obs, ['moon']);
          if (a) return opAct(obs, a, pastCenter ? 'W1中央越え：月どうしを合成' : 'W1：最初の4個で太陽なし・月どうしを合成');
        }
      }
      // W2：モンスターが中央を越えたとき太陽が1個なら、太陽4個を狙う
      if (obs.wave === 2 && obs.phase === 'wave') {
        const sc = count(b, 'sun');
        if (!S.aim4Used && sc === 1 && obs.front && obs.front.pos >= O.center) { S.aim4 = true; S.aim4Used = true; }
        if (S.aim4 && sc >= 4) S.aim4 = false;
        if (S.aim4) { const r = aimFourSuns(obs); if (r) return r; }
      }
      // 出目4以上の成長をジョーカーでコピーできるならコピー（0.2.9）
      { const a = jokerCopy(obs, 'growth', null, x => b[x.to].pips >= 4 && growLeft(b[x.to]) != null); if (a) return opAct(obs, a, `W${obs.wave}：ジョーカーで出目${b[a.to].pips}の成長をコピー`); }
      if (one) { const r = growthCare(obs); if (r) return r; }
      if (!sunActive(b)) {
        if (!S.started) return obs.legal.summon ? opSummon('W1：太陽が活性するまで1個ずつ召喚') : idle('W1：SP待ち');
        return sunRepair(obs) || idle('立て直し：手なし');
      }
      S.started = true;
      if (obs.phase !== 'wave') return idle(`W${obs.wave}：ボス`);
      const front = obs.front ? obs.front.pos : 0;
      if (!S.passed && front >= O.corner1) S.passed = true;
      if (obs.wave === 1 && !S.passed) return idle('W1：1角までSPを貯める');
      if (one) return idle(`W${obs.wave}：①成長を待つ`);
      if (spOk(obs) && obs.sp >= costN(obs.summonCost, O.saveSummons)) {
        if (hasEmpty(b)) return opSummon(`W${obs.wave}：${O.saveSummons}回分たまったので1回召喚`);
        for (const [t, p] of O.makeRoom) {
          const a = pairMerge(obs, [t], p);
          if (a) return opAct(obs, a, `W${obs.wave}：召喚の空きを作る（${t === 'royal' ? 'ロイヤル' : t === 'moon' ? '月' : '太陽'}${p}どうし）`);
        }
        return idle(`W${obs.wave}：${O.saveSummons}回分あるが空きを作れない`);
      }
      return idle(`W${obs.wave}：${O.saveSummons}回分まで貯める`);
    }

    // =====================================================================
    // W3以降（ノーマル対面）
    // 優先の順：一手で両活性（優先度2）→残り10秒（優先度3。ナイト前の活性切りを含む）→太陽が消えた（優先度4）→2角越えの残りの手順→中央越え（出目上げを止めるのが優先度5）→出目上げ
    // =====================================================================
    const INFO = {}; for (const d of ctx.info.deck) INFO[d.type] = d;
    const ACN = t => (INFO[t] && Array.isArray(INFO[t].activeCounts) && INFO[t].activeCounts.length ? INFO[t].activeCounts : null);
    const SUN_AC = ACN('sun') || [1, 4, 7], MOON_AC = ACN('moon') || [3, 5, 7];
    const NB = ctx.info.board.neighbors;
    const CD = (ctx.info.cfg && ctx.info.cfg.cd) || 2000;
    const MCLS = (INFO.moon && INFO.moon.cls) || 10, SCLS = (INFO.sun && INFO.sun.cls) || 10;
    const lvOf = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };
    const sunOkN = n => SUN_AC.includes(n), moonOkN = n => MOON_AC.includes(n);
    const bothOk = b => sunOkN(count(b, 'sun')) && moonOkN(count(b, 'moon'));
    const JN2 = { royal: 'ロイヤル', moon: '月', sun: '太陽', growth: '成長', joker: 'ジョーカー' };

    // ---- 火力 F（claude/月太陽_雑魚処理能力と必要火力.md）：両活性前提 ----
    function moonSunMult(m, p, L, mcls = MCLS, cd = CD) {
      const r = m > 0 ? Math.min(0.95, 1.03 * ((0.07 + 0.01 * (mcls - 7)) * m + 0.02 * (L - 1))) : 0;
      const cr = Math.min(1, 0.05 + 0.05 * m);
      const E = ((1 - cr) + cr * cd / 100) / (0.95 + 0.05 * cd / 100);
      const v = p / (1 - r);
      return v * v * (1 + 0.10 * m) * E;
    }
    function firepower(b, obs) {
      const L = lvOf(obs, 'moon'), atk = (50 + 5 * (SCLS - 10) + 11 * (lvOf(obs, 'sun') - 1)) / 72;
      let f = 0;
      b.forEach((d, i) => {
        if (!d || d.type !== 'sun') return;
        let m = 0;
        for (const j of NB[i]) if (b[j] && b[j].type === 'moon') m = Math.max(m, b[j].pips);
        f += moonSunMult(m, d.pips, L) * atk;
      });
      return f;
    }
    // 相手の火力 F（同じ式。相手の月・太陽のクラスとLv、相手のクリダメで計算。0.3.18）
    const OPP_INFO = {}; for (const d of ((ctx.info && ctx.info.opponentDeck) || [])) OPP_INFO[d.type] = d;
    const OPP_CD = (ctx.info && ctx.info.opponentCd) || CD;
    function oppFirepower(obs) {
      const op = obs.opponent; if (!op || !op.board) return null;
      const ob = op.board, lv = t => { const d = (op.deck || []).find(x => x.type === t); return d && d.lv ? d.lv : 1; };
      const mcls = (OPP_INFO.moon && OPP_INFO.moon.cls) || 10, scls = (OPP_INFO.sun && OPP_INFO.sun.cls) || 10;
      const L = lv('moon'), atk = (50 + 5 * (scls - 10) + 11 * (lv('sun') - 1)) / 72;
      let f = 0;
      ob.forEach((d, i) => {
        if (!d || d.type !== 'sun') return;
        let m = 0;
        for (const j of NB[i]) if (ob[j] && ob[j].type === 'moon') m = Math.max(m, ob[j].pips);
        f += moonSunMult(m, d.pips, L, mcls, OPP_CD) * atk;
      });
      return f;
    }
    // 1角を越えない火力（何ウェーブ先を見るかは aheadWaves）（即処理・通常。W1〜20の実測、それより先は伸び方で延ばす）
    const NEED1 = {
      '6.0.5': [1.83, 16.7, 55.3, 140, 367, 779, 1210, 1740, 2580, 3490, 4370, 5620, 7200, 8460, 10400, 11900, 14100, 16600, 18500, 21900],
      '6.5.0': [1.78, 18.7, 70.4, 177, 581, 1240, 2130, 3450, 4970, 10400, 14000, 18000, 23600, 29600, 38300, 47900, 62000, 70000, 83400, 108000],
    };
    // そのウェーブを生き残る（ライフが減らない）火力（即処理・通常。W1〜20の実測）
    const NEED_DEAD = {
      '6.0.5': [0.417, 4.28, 14.1, 43.6, 142, 308, 492, 660, 998, 1290, 1660, 2090, 2580, 3160, 3770, 4320, 4910, 5650, 6970, 7650],
      '6.5.0': [0.422, 3.73, 19.7, 50.8, 214, 443, 744, 1280, 1780, 3650, 5250, 6930, 8250, 11200, 14200, 17000, 20700, 25000, 30200, 34900],
    };
    function needDead(obs) {
      const T = NEED_DEAD[obs.hpSpec] || NEED_DEAD[obs.version] || NEED_DEAD['6.0.5'], w = obs.wave;
      if (w <= T.length) return T[Math.max(1, w) - 1];
      return T[T.length - 1] * Math.pow(T[T.length - 1] / T[T.length - 2], w - T.length);
    }
    function needAt(obs, w) {
      const T = NEED1[obs.hpSpec] || NEED1[obs.version] || NEED1['6.0.5'];
      if (w <= T.length) return T[Math.max(1, w) - 1];
      const g = T[T.length - 1] / T[T.length - 2];
      return T[T.length - 1] * Math.pow(g, w - T.length);
    }
    // 何ウェーブ先を見るか（0.3.5：変数化。数か、ウェーブごとの表）
    function aheadOf(obs) {
      const A = O.aheadWaves;
      if (typeof A === 'number') return A;
      let n = 2, k = -1;
      if (A && typeof A === 'object') for (const w in A) { const wi = +w; if (wi <= obs.wave && wi > k) { k = wi; n = +A[w]; } }
      return n;
    }
    const needAhead = obs => needAt(obs, obs.wave + aheadOf(obs));
    // ---- パワーアップ（0.2.5） ----
    function puOk(obs, t) {
      const d = obs.deck.find(x => x.type === t);
      if (!d || d.puCost == null || !(obs.legal.powerUp || []).includes(t)) return false;
      return obs.sp - d.puCost >= costN(obs.summonCost, O.puMargin);
    }
    const opPU = (t, note) => ({ ops: [{ op: 'powerUp', type: t }], more: true, note });
    // 月：出目4の月があればLv3、出目5以上の月があればLv5まで
    function moonPU(obs) {
      const mp = Math.max(0, ...obs.board.filter(d => d && d.type === 'moon').map(d => d.pips));
      const goal = mp >= 5 ? 5 : mp >= 4 ? 3 : 0;
      if (lvOf(obs, 'moon') < goal && puOk(obs, 'moon')) return opPU('moon', `パワーアップ：月（出目${mp}の月があるのでLv${goal}まで）`);
      return null;
    }
    // 太陽：W2はLv2まで。W3以降は残り10秒で活性を取るときに上げられるだけ
    function sunPU(obs, goal, why) {
      if (lvOf(obs, 'sun') < goal && puOk(obs, 'sun')) return opPU('sun', `パワーアップ：太陽（${why}）`);
      return null;
    }
    // いまのSPで召喚できる回数
    function summonsLeft(obs) { let n = 0; while (costN(obs.summonCost, n + 1) <= obs.sp) n++; return n; }

    // ---- 手の結果（盤面だけ）と火力の半減チェック ----
    function simAct(b, a) {
      const nb = b.map(d => (d ? Object.assign({}, d) : null));
      if (a.result === 'copy') nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips };
      else { nb[a.from] = null; nb[a.to] = { type: '?', pips: b[a.to].pips + 1 }; }   // 合成の結果は何が出るかわからないので、太陽・月以外として見る
      return nb;
    }
    let noHalf = false;   // true のとき、火力を半分未満にする手は使わない
    let halfLim = O.halfLimit;   // いまの下限（ふだんは O.halfLimit、laneMid 越えの最後だけ O.laneEndLimit）
    // W3以降はすべての手で火力の半減を禁止（0.2.6）。ただし、手のあとも月の星に隣接する出目3以上の太陽が1個以上残るなら使ってよい
    const keepsStarSun = nb => nb.some((d, i) => d && d.type === 'sun' && d.pips >= 3 && NB[i].some(j => nb[j] && nb[j].type === 'moon' && nb[j].pips === 7));
    function halfOk(obs, a) {
      if (obs.wave < 3) return true;
      const nb = simAct(obs.board, a);
      if (keepsStarSun(nb)) return true;
      const f0 = firepower(obs.board, obs);
      if (f0 <= 0) return true;
      return firepower(nb, obs) >= halfLim * f0;
    }
    // 同じ種類どうしの合成（出目の低いものから）。半減チェックつき
    let highFirst = false;   // true のとき、出目の高いものから選ぶ（0.3.1：生き残る火力がないとき）
    let leastLoss = null;   // obs のとき、火力が一番減らない手を選ぶ（0.3.5：laneMid 越えの最後）
    const better = (b, a, best) => {
      if (!best) return true;
      if (leastLoss) { const o = leastLoss, fa = firepower(simAct(b, a), o), fb = firepower(simAct(b, best), o); if (fa !== fb) return fa > fb; }
      return highFirst ? b[a.from].pips > b[best.from].pips : b[a.from].pips < b[best.from].pips;
    };
    let noRoyal = false;   // true のとき、ロイヤルの合成（ジョーカーでロイヤルと合成も）をしない（0.3.18）
    function pairOf(obs, type, filt) {
      if (noRoyal && type === 'royal') return null;
      const b = obs.board; let best = null;
      for (const a of merges(obs)) {
        if (b[a.from].type !== type || b[a.to].type !== type) continue;
        if (!keepOk(b, a)) continue;
        if (filt && !filt(a)) continue;
        if (!halfOk(obs, a)) continue;
        if (better(b, a, best)) best = a;
      }
      return best;
    }
    function copyOf(obs, type, filt) {
      const b = obs.board; let best = null;
      for (const a of copies(obs)) {
        if (b[a.from].type !== 'joker' || b[a.to].type !== type) continue;
        if (!keepOk(b, a)) continue;
        if (filt && !filt(a)) continue;
        if (!halfOk(obs, a)) continue;
        if (better(b, a, best)) best = a;
      }
      return best;
    }
    // ジョーカーで type をコピーして、次の判断でその組を合成する
    function jokerWith(obs, type, tag, filt) {
      if (noRoyal && type === 'royal') return null;
      const a = copyOf(obs, type, filt);
      if (!a) return null;
      S.pend = { cell: a.from, other: a.to, id: obs.board[a.from].id, otherId: obs.board[a.to].id, type, noHalf, rank: curRank, tag, lim: halfLim };
      return opAct(obs, a, `${tag}：ジョーカーで${JN2[type]}をコピー（このあと合成）`);
    }
    function pendMerge(obs) {
      const P = S.pend; if (!P) return null;
      S.pend = null;
      const b = obs.board, x = b[P.cell], y = b[P.other];
      if (!x || !y || x.id !== P.id || y.id !== P.otherId || x.type !== P.type || y.type !== P.type || x.pips !== y.pips) return null;
      if (noRoyal && P.type === 'royal') return null;
      const a = merges(obs).find(m => (m.from === P.cell && m.to === P.other) || (m.from === P.other && m.to === P.cell));
      if (!a) return null;
      const n0 = noHalf, r0 = curRank, l0 = halfLim; noHalf = P.noHalf; curRank = P.rank; halfLim = P.lim;
      try { if (!halfOk(obs, a)) return null; return opAct(obs, a, `${P.tag}：コピーした${JN2[P.type]}どうしを合成`); }
      finally { noHalf = n0; curRank = r0; halfLim = l0; }
    }
    // 太陽か月をジョーカーでコピーして、一手で両活性にする
    function oneMoveBoth(obs) {
      const b = obs.board; let best = null;
      for (const a of copies(obs)) {
        if (b[a.from].type !== 'joker' || !['sun', 'moon'].includes(b[a.to].type)) continue;
        if (!keepOk(b, a)) continue;
        if (!bothOk(simAct(b, a)) || !halfOk(obs, a)) continue;
        // 使えるジョーカーの中で一番出目の低いもの（0.3.9）。同じ出目なら、ゴール前は火力が一番減らない手
        if (best && b[a.from].pips === b[best.from].pips && leastLoss) { if (firepower(simAct(b, a), obs) > firepower(simAct(b, best), obs)) best = a; continue; }
        if (!best || b[a.from].pips < b[best.from].pips) best = a;
      }
      return best;
    }
    // 両活性に戻す共通の手順（2角越え・残り10秒）
    // 一手で両活性→月どうし→ロイヤルどうし→（太陽5個以上なら）ジョーカーで太陽と合成→召喚→ジョーカーでロイヤルと合成→ジョーカーで月と合成
    function restoreBoth(obs, tag) {
      const b = obs.board;
      let a = oneMoveBoth(obs);
      if (a) return opAct(obs, a, `${tag}：ジョーカーで${JN2[b[a.to].type]}をコピーして両活性`);
      a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：月${b[a.from].pips}どうしを合成`);
      a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤル${b[a.from].pips}どうしを合成`);
      if (count(b, 'sun') >= 5) { const r = jokerWith(obs, 'sun', tag); if (r) return r; }
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      return jokerWith(obs, 'royal', tag) || jokerWith(obs, 'moon', tag);
    }

    // ---- 各場面 ----
    const moonStar = b => b.some(d => d && d.type === 'moon' && d.pips === 7);
    // 盤面で一番出目の高いダイスが月か（同じ出目のほかのダイスがあっても、月が含まれていれば月とみなす）
    const topIsMoon = b => { let mx = 0, moon = 0; for (const d of b) if (d) { mx = Math.max(mx, d.pips); if (d.type === 'moon') moon = Math.max(moon, d.pips); } return moon > 0 && moon === mx; };
    // ナイト前の活性切り。W6以降で一番出目の高いダイスが月ならしない（0.3.7）
    // 2角を越えていれば切らない（一手で両活性〔優先度2〕が勝つ。0.3.14）
    const knightCutNeeded = obs => obs.bossType === 'knight' && !(obs.front && obs.front.pos >= O.corner2) && !moonStar(obs.board) && !(obs.wave >= O.knightMoonOff && topIsMoon(obs.board)) && firepower(obs.board, obs) < needAhead(obs);

    // ナイト前：残り1秒で活性を切る（太陽をジョーカーでコピー→月をジョーカーでコピー→召喚→太陽どうし→ロイヤルどうし→月どうし）
    function knightCut(obs) {
      const b = obs.board, tag = 'ナイト前・残り1秒';
      if (!bothOk(b)) return null;   // 活性は切れている
      const breaks = a => !bothOk(simAct(b, a));
      let a = copyOf(obs, 'sun', breaks); if (a) return opAct(obs, a, `${tag}：ジョーカーで太陽をコピーして活性を切る`);
      a = copyOf(obs, 'moon', breaks); if (a) return opAct(obs, a, `${tag}：ジョーカーで月をコピーして活性を切る`);
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      a = pairOf(obs, 'sun'); if (a) return opAct(obs, a, `${tag}：太陽どうしを合成して活性を切る`);
      a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤルどうしを合成`);
      a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：月どうしを合成して活性を切る`);
      return null;   // 切る手がない
    }
    // 2角越え：一手で両活性→月どうし→ロイヤルどうし→ジョーカー（合成のたびに一手で両活性を見る）
    function corner2W3(obs) {
      if (bothOk(obs.board)) return null;
      const r = restoreBoth(obs, '2角越え');
      if (r) return r;
      const front = obs.front ? obs.front.pos : 0;
      return front >= O.laneMid ? laneEnd(obs) : null;
    }
    // 2角とゴールの間の中央越え（0.3.5）：ふだんの手がないとき
    // 成長どうしの合成→ジョーカーで成長をコピー→最後は火力を8割まで減らす手（両活性に戻す手順と同じ手を、火力が一番減らないものから）
    function laneEnd(obs) {
      const b = obs.board, tag = 'ゴール前';
      let a = pairOf(obs, 'growth'); if (a) return opAct(obs, a, `${tag}：成長${b[a.from].pips}どうしを合成`);
      a = copyOf(obs, 'growth'); if (a) return opAct(obs, a, `${tag}：ジョーカーで成長をコピー`);
      const f0 = firepower(b, obs);
      halfLim = O.laneEndLimit; leastLoss = obs;
      try {
        // 一手で両活性になる手があれば、その中で一番減らない手
        a = oneMoveBoth(obs);
        if (a) return opAct(obs, a, `${tag}（火力${f0.toFixed(0)}→${firepower(simAct(b, a), obs).toFixed(0)}まで許す）：ジョーカーで${JN2[b[a.to].type]}をコピーして両活性`);
        // それ以外：月どうし・ロイヤルどうし・（太陽5個以上なら）太陽どうし・成長どうし・ジョーカーで ロイヤル／月／（太陽5個以上なら）太陽／成長 のうち、一番減らない手
        const cand = [];
        for (const t of ['moon', 'royal', 'growth'].concat(count(b, 'sun') >= 5 ? ['sun'] : [])) { const x = pairOf(obs, t); if (x) cand.push({ a: x, kind: 'pair', t }); }
        for (const t of ['royal', 'moon', 'growth'].concat(count(b, 'sun') >= 5 ? ['sun'] : [])) { const x = copyOf(obs, t); if (x) cand.push({ a: x, kind: 'copy', t }); }
        if (!cand.length) return null;
        let best = cand[0], bf = firepower(simAct(b, best.a), obs);
        for (const c of cand.slice(1)) { const nf = firepower(simAct(b, c.a), obs); if (nf > bf) { best = c; bf = nf; } }
        const why = `${tag}（火力${f0.toFixed(0)}→${bf.toFixed(0)}まで許す）`;
        if (best.kind === 'pair') return opAct(obs, best.a, `${why}：${JN2[best.t]}${b[best.a.from].pips}どうしを合成`);
        if (best.t === 'growth') return opAct(obs, best.a, `${why}：ジョーカーで成長をコピー`);
        return jokerWith(obs, best.t, why);
      } finally { halfLim = O.halfLimit; leastLoss = null; }
    }
    // ウェーブ残り10秒：ナイト前は残り1秒まで待つ。それ以外は両活性なら止まり、崩れていれば戻す
    // 打つ手がないとき・待つときは null を返し、ぶつからない下の動きに進む（0.3.3）。両活性なら { stop: true }（出目上げを止める）
    function last10(obs) {
      if (knightCutNeeded(obs)) return null;   // 残り1秒まではナイト前の活性切りは何もしない
      { const r = sunPU(obs, 5, '残り10秒で活性を取る'); if (r) return r; }
      if (bothOk(obs.board)) return { stop: true };
      return restoreBoth(obs, '残り10秒');
    }
    // 中央越え：月の活性がなければ 月どうし→ロイヤルどうし→（組がなければ）召喚→ジョーカーで月をコピー→ジョーカーでロイヤルと合成。ほかの動き（出目上げ）は止める（優先度5）
    // 月の活性がなければ 月どうし→ロイヤルどうし→（組がなければ）召喚→ジョーカーで月をコピー→ジョーカーでロイヤルと合成
    function moonFix(obs, tag) {
      const b = obs.board;
      if (moonOkN(count(b, 'moon'))) return null;
      let a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：月${b[a.from].pips}どうしを合成`);
      a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤル${b[a.from].pips}どうしを合成`);
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      a = copyOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：ジョーカーで月をコピー`);
      return jokerWith(obs, 'royal', tag);
    }
    // ロイヤル攻撃（優先度6。0.3.12）：フラグが立っているとき
    //   先頭が中央を越えておらず、SPが召喚7回分以上あれば、個数が奇数の出目のロイヤルをジョーカーでコピー（出目の高いものから）
    //   ロイヤルどうしを出目の高いものから合成して打つ（位置・SPに関係なく）
    function royalFlagOn(obs) {
      if (typeof O.royalFlag === 'function') return !!O.royalFlag(obs);
      if (O.royalFlag === 'auto') return !!royalFlagAuto(obs);
      return !!O.royalFlag;
    }
    // ---- ロイヤル攻撃フラグ（0.3.13）：相手のデッキで対面を決め、相手の盤面を見る ----
    const OPP_TYPES = new Set(((ctx.info && ctx.info.opponentDeck) || []).map(d => d.type));
    const oppHas = (...ts) => ts.every(t => OPP_TYPES.has(t));
    const MATCHUP = oppHas('moon', 'sun') ? 'moonsun' : oppHas('typhoon', 'hell', 'nuke') ? 'nuke' : oppHas('combo') ? 'combo' : oppHas('moon') ? 'moon' : null;
    const TRACK = (ctx.info && ctx.info.trackLength) || 12;
    function royalFlagAuto(obs) {
      const op = obs.opponent; if (!op || !op.board || !MATCHUP) return false;
      const ob = op.board, field = op.field;
      const oc = t => ob.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
      const oHas = f => ob.some((d, i) => d && f(d, i));
      const oppStar = oHas(d => d.type === 'moon' && d.pips === 7);
      if (MATCHUP === 'moonsun') {
        // 相手の先頭が2角を越えて相手の太陽が活性している（太陽1・4・7個）／相手に月の星がある
        const ofront = op.front ? op.front.progress * TRACK : 0;
        return (ofront >= O.corner2 && [1, 4, 7].includes(oc('sun'))) || oppStar;
      }
      if (MATCHUP === 'moon') return oppStar;
      if (MATCHUP === 'nuke') {
        if (field === 'blessing') return oc('nuke') >= 10 || oHas(d => d.type === 'hell' && d.pips >= 2);
        return oc('nuke') >= 8;
      }
      if (MATCHUP === 'combo') {
        const scope2 = oHas(d => d.type === 'scope' && d.pips >= 2);
        if (field === 'blessing') return (oc('combo') >= 13 && scope2) || (obs.wave >= 6 && scope2);
        // 出目2以上のコンボと隣接している出目2以上のスコープが1個でもある
        const scopeNextCombo = oHas((d, i) => d.type === 'scope' && d.pips >= 2 && NB[i].some(j => ob[j] && ob[j].type === 'combo' && ob[j].pips >= 2));
        if (oc('combo') >= 8 && scopeNextCombo) return true;
        // 楽園：W8以降、クリマス（会心マス）に出目5以上のコンボがある
        if (field === 'paradise' && obs.wave >= 8) {
          const cells = ((op.fieldInfo && op.fieldInfo.paradise) || []).map(p => p.cell);
          if (cells.some(c => ob[c] && ob[c].type === 'combo' && ob[c].pips >= 5)) return true;
        }
        return false;
      }
      return false;
    }
    function royalAttack(obs) {
      if (!royalFlagOn(obs) || noRoyal) return null;   // ロイヤルの合成を禁止している間はロイヤル攻撃もしない（0.3.18）
      const b = obs.board, tag = 'ロイヤル攻撃';
      const front = obs.front ? obs.front.pos : 0;
      if (front < O.center && obs.sp >= costN(obs.summonCost, O.royalCopySummons)) {
        const cnt = {}; b.forEach(d => { if (d && d.type === 'royal') cnt[d.pips] = (cnt[d.pips] || 0) + 1; });
        const odd = Object.keys(cnt).map(Number).filter(p => cnt[p] % 2 === 1).sort((x, y) => y - x);
        for (const p of odd) {
          const a = copyOf(obs, 'royal', x => b[x.to].pips === p);
          if (a) return opAct(obs, a, `${tag}：ジョーカーでロイヤル${p}をコピー（${cnt[p]}個→${cnt[p] + 1}個）`);
        }
      }
      highFirst = true;
      try { const a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤル${b[a.from].pips}どうしを合成して打つ`); }
      finally { highFirst = false; }
      // ロイヤルがなければ、合成でロイヤルを狙う（0.3.15）：（太陽5個以上なら）太陽どうし→月どうし→ジョーカーで月と合成→ジョーカーで太陽と合成
      if (count(b, 'royal') === 0) {
        const t2 = `${tag}（ロイヤルを狙う）`;
        let a = null;
        if (spOk(obs) && hasEmpty(b)) return opSummon(`${t2}：召喚`);   // 0.3.17
        if (count(b, 'sun') >= 5) { a = pairOf(obs, 'sun'); if (a) return opAct(obs, a, `${t2}：太陽${b[a.from].pips}どうしを合成`); }
        a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${t2}：月${b[a.from].pips}どうしを合成`);
        return jokerWith(obs, 'moon', t2) || jokerWith(obs, 'sun', t2);
      }
      return null;
    }
    function centerW3(obs) {
      return moonFix(obs, '中央越え') || idle('中央越え：止める');
    }
    // 太陽が消えた（優先度4）：3個以下ならロイヤルどうし→月どうし→召喚、5個以上なら太陽どうし→（先頭が1角越えなら）ジョーカーで太陽と合成
    function sunLostW3(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (sunOkN(sc)) return null;
      let a = null;
      if (sc <= 3) {
        a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `太陽が消えた：ロイヤル${b[a.from].pips}どうしを合成`);
        a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `太陽が消えた：月${b[a.from].pips}どうしを合成`);
        if (spOk(obs) && hasEmpty(b)) return opSummon('太陽が消えた：召喚');
      } else {
        a = pairOf(obs, 'sun'); if (a) return opAct(obs, a, `太陽が消えた：太陽${b[a.from].pips}どうしを合成`);
        // 先頭が1角を越えていれば、ジョーカーで太陽を1個コピーして合成
        if (obs.front && obs.front.pos >= O.corner1) { const r = jokerWith(obs, 'sun', '太陽が消えた'); if (r) return r; }
      }
      // W8以降、月の星に太陽が隣接していなければ（月の星がないときも含む）、さらに続ける（0.3.16）
      const starSunAdj = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun'));
      if (obs.wave < O.sunLostLongFrom || starSunAdj) return null;
      const t2 = '太陽が消えた（W8以降）';
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${t2}：召喚`);
      a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${t2}：ロイヤル${b[a.from].pips}どうしを合成`);
      a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${t2}：月${b[a.from].pips}どうしを合成`);
      { const r = jokerWith(obs, 'royal', t2) || jokerWith(obs, 'moon', t2); if (r) return r; }
      // それでもできなければ7個を目指す：7個以下なら太陽は合成しない。月どうし→ロイヤルどうし→召喚→太陽コピー→ジョーカーでロイヤルと合成→ジョーカーで月と合成
      //   （月・ロイヤル・召喚・ジョーカーの手は上で打てなかったので、ここで新しく打てるのは太陽のコピーだけ）
      if (sc < 7) {
        a = copyOf(obs, 'sun'); if (a) return opAct(obs, a, `${t2}・7個を目指す：ジョーカーで太陽をコピー（${sc}個→${sc + 1}個）`);
      }
      return null;
    }
    // 出目上げの合成の向き：最も出目の高い月の隣→最も出目の高い太陽の隣→B2→中央→B3→左→上
    function rankPipUp(obs) {
      const b = obs.board;
      const top = t => { let bi = -1; b.forEach((d, i) => { if (d && d.type === t && (bi < 0 || d.pips > b[bi].pips)) bi = i; }); return bi; };
      const tm = top('moon'), ts = top('sun');
      const nm = new Set(tm >= 0 ? NB[tm] : []), ns = new Set(ts >= 0 ? NB[ts] : []);
      const SPOT = { 6: 2, 7: 3, 8: 4 };
      return i => { const cat = nm.has(i) ? 0 : ns.has(i) ? 1 : (SPOT[i] != null ? SPOT[i] : 5); return cat * 100 + (i % 5) * 10 + Math.floor(i / 5); };
    }
    // 月の星が出たら、星の隣にダイスを合成しに行く（0.3.9。0.3.10からは出目上げが止まっていても動く）：出目上げと同じ順で、星の隣の（太陽でない）出目4以下のダイスを使う組を先に
    function starNear(obs) {
      const b = obs.board, tag = '出目上げ';
      if (!moonStar(b)) return null;
      {
        const N = starNB(b), st = '出目上げ・月の星の隣';
        const near = c => N.has(c) && b[c] && b[c].type !== 'sun' && b[c].pips < O.starAwayPips;
        if (![...N].some(near)) return null;   // 星の隣に、作り直せるダイス（太陽でない・出目4以下）がない
        const pf = x => near(x.from) !== near(x.to);   // 片方だけが星の隣
        let a = pairOf(obs, 'moon', pf); if (a) return opAct(obs, a, `${st}：月${b[a.from].pips}どうしを合成`);
        a = pairOf(obs, 'royal', pf); if (a) return opAct(obs, a, `${st}：ロイヤル${b[a.from].pips}どうしを合成`);
        if (!S.hold && spOk(obs) && hasEmpty(b)) return opSummon(`${st}：召喚`);   // SPを貯めている間は召喚しない
        const jf = x => near(x.from) !== near(x.to);   // ジョーカーかコピー先の片方が星の隣
        const r = jokerWith(obs, 'royal', st, jf) || jokerWith(obs, 'moon', st, jf) || jokerWith(obs, 'sun', st, jf);
        if (r) return r;
      }
      return null;
    }
    // 出目上げ（aheadWaves 先の1角火力に届いていなければ。レオン前もする〔0.2.3〕）
    function pipUp(obs) {
      const b = obs.board, tag = '出目上げ';
      const f = firepower(b, obs), need = needAhead(obs);
      // SPを貯めるかどうかの判定（月の星の隣への合成の召喚にも使う）
      { const n0 = summonsLeft(obs); if (!S.hold && n0 < O.holdBelow && sunOkN(count(b, 'sun'))) S.hold = true; if (S.hold && n0 >= O.holdUntil) S.hold = false; }
      // 月の星の隣への合成は、出目上げが止まっていても動く（0.3.10）
      { const r = starNear(obs); if (r) return r; }
      if (f >= need) {
        // W5以降は、中央越えと同じ手順で月を活性させる（0.3.4）
        if (obs.wave >= 5) { const r = moonFix(obs, '火力は足りている・月の活性'); if (r) return r; }
        return idle(`${tag}：火力は足りている（F ${f.toFixed(0)}／${need.toFixed(0)}）`);
      }
      // 召喚できる回数が4回を切って太陽が活性していたら、9回分になるまで止める
      const nSum = summonsLeft(obs);
      if (!S.hold && nSum < O.holdBelow && sunOkN(count(b, 'sun'))) S.hold = true;
      if (S.hold && nSum >= O.holdUntil) S.hold = false;
      if (S.hold) return idle(`${tag}：SPを${O.holdUntil}回分まで貯める（いま${nSum}回分）`);
      if (b.some(d => { const l = growLeft(d); return l != null && l < O.growStop; })) return idle(`${tag}：成長が残り3秒なので待つ`);
      // ジョーカーのコピーで火力が3倍以上になる手
      let best = null, bf = 0;
      for (const a of copies(obs)) {
        if (b[a.from].type !== 'joker' || !keepOk(b, a)) continue;
        const nf = firepower(simAct(b, a), obs);
        if (nf > 0 && nf >= O.tripleCopy * f && nf > bf) { best = a; bf = nf; }
      }
      if (best) return opAct(obs, best, `${tag}：ジョーカーで${JN2[b[best.to].type]}をコピー（火力${f.toFixed(0)}→${bf.toFixed(0)}）`);
      // 成長があればすべてコピー
      { const a = copyOf(obs, 'growth', x => growLeft(b[x.to]) != null); if (a) return opAct(obs, a, `${tag}：ジョーカーで成長をコピー`); }
      // 月どうし→ロイヤルどうし→ジョーカーでロイヤルと合成→ジョーカーで月と合成→ジョーカーで太陽と合成
      let a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：月${b[a.from].pips}どうしを合成`);
      a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤル${b[a.from].pips}どうしを合成`);
      // ジョーカーで成長以外をコピーする前に召喚
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      { const r = jokerWith(obs, 'royal', tag) || jokerWith(obs, 'moon', tag) || jokerWith(obs, 'sun', tag); if (r) return r; }
      // 7番目（0.3.17）：盤面にまだ成長する成長がなければ、出目の低いジョーカーどうし→（なければ）太陽どうしを合成
      if (!b.some(d => growLeft(d) != null)) {
        a = pairOf(obs, 'joker'); if (a) return opAct(obs, a, `${tag}：良い手がないのでジョーカー${b[a.from].pips}どうしを合成`);
        a = pairOf(obs, 'sun'); if (a) return opAct(obs, a, `${tag}：良い手がないので太陽${b[a.from].pips}どうしを合成`);
      }
      return idle(`${tag}：良い手なし（F ${f.toFixed(0)}／${need.toFixed(0)}）`);
    }

    // そのウェーブを生き残る火力がない（優先度2）：召喚→ロイヤルどうし→月どうし→ジョーカーでロイヤル→ジョーカーで月→ジョーカーどうし（どれも出目の高いものから）
    function survive(obs) {
      const b = obs.board, tag = '生き残る火力なし';
      if (spOk(obs) && hasEmpty(b)) return opSummon(`${tag}：召喚`);
      let a = pairOf(obs, 'royal'); if (a) return opAct(obs, a, `${tag}：ロイヤル${b[a.from].pips}どうしを合成`);
      a = pairOf(obs, 'moon'); if (a) return opAct(obs, a, `${tag}：月${b[a.from].pips}どうしを合成`);
      return jokerWith(obs, 'royal', tag) || jokerWith(obs, 'moon', tag)
        || ((a = pairOf(obs, 'joker')) ? opAct(obs, a, `${tag}：ジョーカーどうしを合成`) : null);
    }
    function laterWaves(obs) {
      const b = obs.board;
      const front = obs.front ? obs.front.pos : 0;
      const inWave = obs.phase === 'wave';
      const fight = inWave || obs.phase === 'boss' || obs.phase === 'cleanup';
      if (!fight) return idle(`W${obs.wave}：待つ`);
      curRank = rankPipUp(obs);   // W3以降はすべての合成で出目上げの向き（0.3.7）
      starMode = moonStar(b);     // 月の星が出たあとの向き（0.3.9）
      // 月太陽対面・W6以降で相手にこのウェーブを生き残る火力がない（0.3.18）
      noRoyal = false;
      if (MATCHUP === 'moonsun' && obs.wave >= O.oppWeakFrom && obs.phase === 'wave') {
        const of = oppFirepower(obs);
        if (of != null && of < needDead(obs)) {
          if (!OPP_TYPES.has('shield') && !OPP_TYPES.has('blizzard')) {
            if (firepower(b, obs) >= needDead(obs) && bothOk(b)) return idle(`相手に生き残る火力なし（相手F ${of.toFixed(0)}）：こちらは生き残れて両活性なので、すべての動きを止める`);
          } else if (firepower(b, obs) >= needAt(obs, obs.wave + O.oppWeakAhead)) noRoyal = true;   // 優先度3：ロイヤルの合成を禁止
        }
      }
      // ナイト前に活性を切ったあと（0.3.14）：ナイトのスキル（1回目）が来るまで、優先度2以外は動かさない
      if (S.knightHold) {
        const B = obs.boss;
        const done = obs.wave !== S.knightHold || (obs.phase === 'boss' && B && (B.type !== 'knight' || B.cast >= 1)) || obs.phase === 'cleanup';
        if (done) S.knightHold = 0;
        else {
          const r = moonPU(obs); if (r) return r;
          const front0 = obs.front ? obs.front.pos : 0;
          if (!bothOk(b) && front0 >= O.corner2) { const a = oneMoveBoth(obs); if (a) return opAct(obs, a, '2角越え：ジョーカーで' + JN2[b[a.to].type] + 'をコピーして両活性（ナイト待ちより優先）'); }
          if (obs.phase === 'wave' && firepower(b, obs) < needDead(obs)) { highFirst = true; try { const r2 = survive(obs); if (r2) return r2; } finally { highFirst = false; } }
          return idle('ナイト待ち：活性を切ったまま、スキルを待つ');
        }
      }
      // コピーした組の合成（ジョーカーで〇〇と合成の2手目）
      { const r = pendMerge(obs); if (r) return r; }
      { const r = moonPU(obs); if (r) return r; }
      const tl = obs.timeLeft;
      const lastSec = obs.wave >= O.last10LateFrom ? O.last10Late : O.last10;   // W7以降は残り15秒から（0.3.9）
      const in10 = inWave && tl != null && tl <= lastSec;
      const knight10 = in10 && knightCutNeeded(obs);
      // 一手で両活性（優先度2）：2角越え、または残り10秒（ナイト前の活性切りのときを除く）で両活性でないとき
      if (!bothOk(b) && (front >= O.corner2 || (in10 && !knight10))) {
        noHalf = in10 && front < O.corner2;   // 残り10秒の手は火力の半減を禁止（2角越えは禁止なし）
        try { const a = oneMoveBoth(obs); if (a) return opAct(obs, a, `${front >= O.corner2 ? '2角越え' : '残り10秒'}：ジョーカーで${JN2[b[a.to].type]}をコピーして両活性`); }
        finally { noHalf = false; }
      }
      // そのウェーブを生き残る火力がない（優先度2。雑魚ウェーブ）
      if (inWave) {
        const f = firepower(b, obs), nd = needDead(obs);
        if (f < nd) {
          highFirst = true; const nr0 = noRoyal; noRoyal = false;   // 優先度2はロイヤルの合成の禁止（優先度3）より強い
          try { const r = survive(obs); if (r) return r; } finally { highFirst = false; noRoyal = nr0; }
        }
      }
      // ウェーブ残り10秒（優先度3）。ナイト前は残り1秒で活性を切る
      let stop10 = false;
      if (in10) {
        noHalf = true;
        let r = null;
        const cutting = tl <= O.knightCut && knight10;
        try { r = cutting ? knightCut(obs) : last10(obs); } finally { noHalf = false; }
        // 活性を切る手を出したら、ナイトのスキルまで切ったままにする（0.3.14）
        if (cutting && r && r.ops && r.ops.length && !bothOk(r.ops[0].op === 'act' ? simAct(b, obs.legal.acts.find(x => x.from === r.ops[0].from && x.to === r.ops[0].to) || { result: 'merge', from: r.ops[0].from, to: r.ops[0].to }) : b)) S.knightHold = obs.wave;
        if (cutting && !(r && r.ops && r.ops.length) && !bothOk(b)) S.knightHold = obs.wave;   // もう切れている
        if (r && r.ops && r.ops.length) return r;
        if (r && r.stop) stop10 = true;
      }
      // 太陽が消えた（優先度4。中央越えでは止められない）
      { noHalf = true; try { const r = sunLostW3(obs); if (r) return r; } finally { noHalf = false; } }
      // 2角越えの残りの手順（番号なし）
      if (front >= O.corner2) { const r = corner2W3(obs); if (r) return r; }
      // 中央越え（優先度5）
      // 中央越えの月の手当て（番号なし）
      if (front >= O.center) { noHalf = true; try { const r = moonFix(obs, '中央越え'); if (r) return r; } finally { noHalf = false; } }
      // ロイヤル攻撃（優先度6。中央越え・残り10秒の「止める」は出目上げだけを止めるので、ここは止めない）
      { noHalf = true; try { const r = royalAttack(obs); if (r) return r; } finally { noHalf = false; } }
      // 中央越え：出目上げを止める（優先度5）
      if (front >= O.center) return idle('中央越え：止める');
      if (!inWave) return idle(`W${obs.wave}：ボス`);
      // 残り10秒で両活性なら出目上げは止める（ここだけがぶつかる）
      if (stop10) return idle('残り10秒：両活性なので止める');
      // 出目上げ
      noHalf = true;
      try { return pipUp(obs); } finally { noHalf = false; }
    }

    function decideInner(obs) {
      if (obs.over) return null;
      if (obs.wave !== S.wave) { S.wave = obs.wave; S.passed = false; S.aim4 = false; }
      if (obs.wave <= 2) { curRank = rankW12; starMode = false; return earlyWaves(obs); }
      setKeepJoker(obs, obs.wave >= O.keepJokerFrom);
      return laterWaves(obs);
    }

    // ======================================================================
    // 暗殺対面（0.3.13）：月太陽AI（moonsun_ai.js 2026-11-17版）の暗殺対面の動きをそのまま移したもの。
    //   相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべてあれば、通常の動きは使わずこの動きだけにする。
    //   リミッター解除：判断・操作の速さを asnSpeed（0.1秒）にする（limits で設定）
    // ======================================================================
    const ASN = !!(O.asnMode && rrIsAsn(ctx.info));
    const A_SUN_ALL = (INFO.sun && Array.isArray(INFO.sun.activeCounts) && INFO.sun.activeCounts.length) ? INFO.sun.activeCounts.slice() : [1, 4, 7];
    const A_SUN_OK = A_SUN_ALL.filter(n => n !== 1);   // 月太陽AIの sunOneActive: false
    const A_DECK = ctx.info.deck.map(d => d.type);
    const A_S = { asnDone: new Map(), idle: null };
    const aDist = (c, set) => Math.min(...set.map(x => Math.abs(c - x)));
    const aClone = b => b.map(d => (d ? Object.assign({}, d) : null));
    const aEngineActive = (b, type) => { const d = b.find(x => x && x.type === type); return d && typeof d.active === 'boolean' ? d.active : null; };
    function aSunActive(b) { const sc = count(b, 'sun'), ea = aEngineActive(b, 'sun'); if (ea == null) return A_SUN_OK.includes(sc); return ea && sc !== 1; }
    const aStarJokerOk = (b, a) => !(b[a.from] && b[a.from].type === 'joker' && b[a.from].pips === 7 && b[a.to] && !['sun', 'moon'].includes(b[a.to].type));
    const aCopyCands = obs => obs.legal.acts.filter(a => a.result === 'copy' && aStarJokerOk(obs.board, a));
    const aOpAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const aFix = r => { if (r) r.dirFixed = true; return r; };
    const A_CORNERS = new Set([0, 4, 10, 14]);
    const aCellRank = i => { const r = Math.floor(i / 5), c = i % 5; return (r === 1 && c >= 1 && c <= 3 ? 0 : A_CORNERS.has(i) ? 2 : 1) * 100 + c * 10 + r; };
    function aApplyCopy(b, a) { const nb = aClone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }
    function aDistMerge(b, a, f) {
      let e = 0, p0 = 0;
      for (const t of A_DECK) { const nb = aClone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; const v = f(nb); e += v; if (v === 0) p0++; }
      return { e: e / A_DECK.length, p0: p0 / A_DECK.length };
    }
    const aJokerPair = (b, a) => b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === 'joker';
    function aIdle(reason) { if (A_S.idle === reason) return null; A_S.idle = reason; return { ops: [], note: reason }; }
    function asnSunOn(obs) { const b = obs.board; if (count(b, 'sun') === 1) return false; return aSunActive(b); }   // asnSunOneEarly: false
    const A_SUN_GOAL = A_SUN_OK.filter(n => n > 1).length ? A_SUN_OK.filter(n => n > 1) : [4];
    const asnDist = nb => { const c = count(nb, 'sun'); return A_SUN_OK.includes(c) ? 0 : aDist(c, A_SUN_GOAL); };
    const hasBounty = d => !!(d && d.bounty > 0);
    function asnDodge(obs, cell, late, sunOn) {
      const b = obs.board, d = b[cell], sc = count(b, 'sun');
      if (!d || d.type === 'sun') return null;
      if (d.type === 'joker') {
        const cps = aCopyCands(obs).filter(a => a.from === cell);
        const pick = f => cps.filter(f).sort((x, y) => b[y.to].pips - b[x.to].pips || x.to - y.to)[0] || null;
        const isT = (a, t) => b[a.to].type === t;
        let a = null;
        if (sc === 2 || sc === 3) a = pick(x => isT(x, 'sun'));
        else if (sc === 1 || sc === 4) a = pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || (sc === 1 ? pick(x => isT(x, 'sun')) : null);
        else a = (A_SUN_OK.includes(sc + 1) ? pick(x => isT(x, 'sun')) : null) || pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || pick(x => !isT(x, 'moon'));
        if (a) return aFix(aOpAct(a, obs, `暗殺対面：ジョーカーに暗殺。${JN2[b[a.to].type] || b[a.to].type}${b[a.to].pips}をコピーして避ける（太陽${sc}個）`));
        const m = obs.legal.acts.find(x => x.from === cell && x.result === 'merge');
        return m ? aFix(aOpAct(m, obs, '暗殺対面：ジョーカーに暗殺。ジョーカーどうしを合成して避ける')) : null;
      }
      let ok;
      if (!late) ok = obs.sp >= costN(obs.summonCost, 2) || b.some(j => j && j.type === 'joker' && b.some(s => s && s.type === 'sun' && s.pips === j.pips));
      else ok = !sunOn;
      if (!ok) return null;
      const cand = obs.legal.acts.filter(x => x.from === cell && x.result === 'merge' && b[x.to].type === d.type && (late || !hasBounty(b[x.to])))
        .sort((x, y) => aCellRank(x.to) - aCellRank(y.to));
      return cand.length ? aFix(aOpAct(cand[0], obs, `暗殺対面：${JN2[d.type] || d.type}${d.pips}に暗殺。同じ種類へ合成して避ける${late ? '（懸賞金の縛りなし）' : ''}`)) : null;
    }
    function asnDecide(obs) {
      if (obs.over) return null;
      const b = obs.board;
      const fpos = obs.front ? obs.front.pos : 0;
      const late = fpos >= O.asnCorner;
      const sunOn = asnSunOn(obs);
      // 1. 暗殺が飛んできた
      const pend = (obs.pending || []).filter(p => p.kind === 'assassin' && p.cells && p.cells.length).sort((x, y) => x.in - y.in);
      for (const p of pend) {
        const cell = p.cells[0], d = b[cell]; if (!d) continue;
        const key = cell + ':' + Math.round((obs.t + p.in) * 10);
        if (A_S.asnDone.has(key) && A_S.asnDone.get(key) !== d.id) continue;
        const r = asnDodge(obs, cell, late, sunOn);
        if (r) { A_S.asnDone.set(key, d.id); return r; }
      }
      // 2. 太陽が活性していれば止める
      if (sunOn) return aIdle('暗殺対面：太陽が活性しているので止める');
      // 3. 召喚して活性を狙う
      if (obs.legal.summon) return opSummon('暗殺対面：太陽が活性していないので召喚');
      // 4. 召喚できない：ジョーカーで太陽をコピー → ジョーカー・成長以外のダイスどうしを合成
      const oppAsn = !!(obs.opponent && obs.opponent.board && obs.opponent.board.some(x => x && x.type === 'assassin'));
      const freeOk = i => late || !hasBounty(b[i]);
      const cur = asnDist(b);
      if (late || !oppAsn) {
        let bc = null;
        for (const a of aCopyCands(obs)) {
          if (b[a.from].type !== 'joker' || b[a.to].type !== 'sun' || !freeOk(a.from)) continue;
          const v = asnDist(aApplyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return aOpAct(bc.a, obs, `暗殺対面：ジョーカー${b[bc.a.from].pips}で太陽をコピー${late ? '（2つ目の角を越えた）' : ''}`);
        let bm = null;
        for (const a of obs.legal.acts) {
          if (a.result !== 'merge' || !freeOk(a.from) || !freeOk(a.to)) continue;
          const t = b[a.from].type;
          if (t === 'joker' || t === 'growth' || b[a.to].type === 'joker' || b[a.to].type === 'growth') continue;
          const r = aDistMerge(b, a, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bm || sc < bm.sc - 1e-9 || (Math.abs(sc - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc };
        }
        if (bm) return aOpAct(bm.a, obs, `暗殺対面：${JN2[b[bm.a.to].type] || b[bm.a.to].type}${b[bm.a.to].pips}どうしを合成して太陽を狙う${late ? '（2つ目の角を越えた）' : ''}`);
      }
      if (late) {
        let bf = null;
        for (const a of aCopyCands(obs)) {
          if (b[a.from].type !== 'joker') continue;
          const t = b[a.to].type; if (t === 'growth' || t === 'moon') continue;
          const r = aDistMerge(aApplyCopy(b, a), { from: a.from, to: a.to }, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
        }
        if (bf) return aOpAct(bf.a, obs, `暗殺対面：ジョーカーで${JN2[b[bf.a.to].type] || b[bf.a.to].type}${b[bf.a.to].pips}をコピーして合成の組を作る`);
        const jj = obs.legal.acts.find(a => a.result === 'merge' && aJokerPair(b, a));
        if (jj) return aOpAct(jj, obs, '暗殺対面：ジョーカーどうしを合成して太陽を狙う');
      }
      return aIdle(late ? '暗殺対面：活性の手がない' : oppAsn ? '暗殺対面：召喚できない（相手の盤面に暗殺があるので動かない）' : '暗殺対面：召喚できない（打つ手なし）');
    }
    // 月太陽AIと同じ合成の向き（向きに目的がない合成：真ん中の列の中央3マス → 4隅以外 → 4隅。同じなら左、次に上）
    function asnDecideDir(obs) {
      const r = asnDecide(obs);
      if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && r.ops[0].expect === 'merge' && !r.dirFixed) {
        const op = r.ops[0];
        const rev = obs.legal.acts.find(x => x.result === 'merge' && x.from === op.to && x.to === op.from);
        if (rev && aCellRank(op.from) < aCellRank(op.to)) r.ops[0] = Object.assign({}, op, { from: op.to, to: op.from, fromId: op.toId, toId: op.fromId });
      }
      if (r && r.ops && r.ops.length) A_S.idle = null;
      return r;
    }

    return {
      decide(obs) {
        if (ASN) return asnDecideDir(obs);   // 暗殺対面：通常の動きは使わない
        const pend0 = S.pend;
        const r = decideInner(obs);
        // 重ねる操作がまだできない（前の操作の待ち）ときは、次の判断でやり直す
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pend = pend0; return null; }
        if (r && r.ops && r.ops.length) idleNote = null;
        return r;
      },
    };
  },
});
})();
