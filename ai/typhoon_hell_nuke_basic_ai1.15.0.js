// 台風地獄核基本AI 1.15.0（AI API v1／AI_AGENT_GUIDE 1.7.x〜1.13.x・AIRandomDicesim 2.3.0〜4.3.5 用）
// 登録ID：typhoon_hell_nuke_basic（ほかのAIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：台風・地獄・核・適応・ジョーカー　想定スキン：五番目の航海日記　想定する本家バージョン：6.5.0
// 方針：台風×地獄の即死で雑魚を処理し、中ボス・ボスは核で倒す。
// 変更：1.1　通常行動の先頭に「ジョーカーで核をコピー」。いかなる時もの2角判定にボス・小ボスも含める
//       1.2　4W以降のボス戦で、満タンのボスが2角を超えているときは通常核攻撃よりボス核攻撃を優先
//       1.3　「盤面が埋まったら詰み回避」をやめた（指示にない。詰み回避は核攻撃ができないときだけ）
//       1.4　1Wのボスがレオンなら、台風が出たら召喚を止め、咆哮の後に再開。ジョーカーで台風をコピーを3Wまで。
//            2Wのレオン・3Wのレオンとナイトにもボス核攻撃。核のPUを 3W Lv2・5W Lv3・6W Lv4・7W Lv5 に変更
//       1.5　ボス核攻撃の「満タン」を「HPが8割以上」に変更（options.bossFullRatio）
//       1.6　ボス核攻撃を作り直し：8割以上なら最高出目 → 削りきれる核 → なければ通常核攻撃（できなければ詰み回避）
//       1.7　4W以降に限っていた行動（中ボスへの通常核攻撃・ボス核攻撃・通常行動）を3W以降に。ジョーカーで台風をコピーは2Wまで
//       1.8　通常行動の最後に「次に通常核攻撃をするとき核を合成できない状態なら、詰み回避の行動」を追加
//       1.9　20W以降のレオン・マジシャンはスキルを受けてからボス核攻撃。1Wのレオンは台風3個で召喚を止める。
//            バジリスク（スライム）前のウェーブは詰み回避（ペアに触らない部分）まで進める。
//            最高効率即死ペアの制限：台風×地獄が9を超える隣接ペアが1組でも残るなら制限なし
//       1.10　バジリスク（スライム）前の詰み回避を3W以降に限る
//       1.11　バジリスク（スライム）前の詰み回避は核が6個を超えたらやめる。20W以降のマジシャンはすぐボス核攻撃に戻す（スキル待ちはレオンだけ）
//       1.12　4〜10Wの最初のスライムのボス戦は何もしない（核攻撃・合成・召喚・PUすべて）。その後（またはW11以降）のスライム前は核8個まで詰み回避
//       1.13　スライム放置の条件を「即時に撃てる核の出目の合計が10以下」に（試合で1回だけ）。スライム前の詰み回避はその合計10を目指す
//       1.14　盤面の地獄が1個だけなら、その地獄は合成に使わない（2角を超えた敵がいて、撃てる核がないときだけ使ってよい）
//       1.15.0　暗殺対面（相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべてある）を追加。ファイル全体を (() => { … })(); で包んだ
//
// 暗殺対面（1.15.0。asnMode）：通常の動きは使わない。操作速度・判断速度を0.1秒に（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ時間。asnSpeed）
//   1. 暗殺が飛んできたとき（着弾の早い順。ドラッグが着弾までに終わらないときはしない。ほかの暗殺の予告マスへは合成しない）
//      ジョーカー：同じ出目の 台風 → 核 → 適応 → 地獄 の順にコピーして避ける
//      出目1の台風：懸賞金の付いていない出目1の適応へ合成して避ける（出目2以上の台風は避けない）
//      地獄：懸賞金の付いていない同じ出目の地獄へ合成して避ける
//      核：懸賞金の付いていない同じ出目の 核 → 適応 の順に合成して避ける
//      適応：懸賞金の付いていない同じ出目の 核 → 地獄 → 台風（台風が5個以上のときだけ）の順に合成して避ける
//   2. 盤面のダイスが7個を超え、台風が2個以上なら、台風をLv2にPU（召喚より先）
//   3. 召喚
//   4. 台風が2個以下で、ジョーカーが4個以上なら、ジョーカーで台風を1個コピー
//
// 用語
//   1角・2角：通路の曲がり角。通路の入口からの距離 pos が 3.5（1角）・8.5（2角）の位置
//   最高効率即死ペア：上下左右に隣り合う（台風, 地獄）の組のうち、台風の出目×地獄の出目が最大の1組
//     「ペアに触らない」制限は、その手の後も台風×地獄が9を超える隣接ペアが1組でも残るなら外す（1.9）
//     （即死効率 0.6×台風の出目×地獄の出目 [体/秒]。同じ値なら台風の出目が大きい組 → マス番号が小さい組）
//   即時に撃てる核の出目の合計：同じ出目の「核＋適応」「核＋核」の組を重ならないように最も多く作ったときの、組の出目の合計
//     （出目4以上の核は4として数える。出目ごとに、核＋適応の組を先に作り、残りの核を2個ずつ組にする）
//   核を撃つ：核を含む合成（核同士・核と適応）。合成した側の出目で、合成先のマスから先頭の敵へ核の弾が飛ぶ
//
// 1回の判断の流れ（重ねる操作は1秒に1回なので、上から最初にできたもの1つ。召喚・PUは別枠で先に行う）
//   *) スライム放置：スライムのボス戦が始まったとき、即時に撃てる核の出目の合計が10以下なら、そのボス戦（分裂体が残っている間も含む）は
//      何もしない（ボス核攻撃・通常核攻撃・合成・召喚・PUすべて）。試合で1回だけ
//   0) PU（できるとき。ウェーブごとの目標を順に）→ 召喚（できるとき）
//      ※1Wのボスがレオンなら、盤面の台風が3個になった時点で召喚を止め、レオンの咆哮（1回目のスキル）の後に再開
//   1) いかなる時も：2角を超えた敵（ボスを含む）がいる／3W以降で1角以降の中ボスが先頭 → 通常核攻撃（できなければ詰み回避）
//      ※ただしボス核攻撃をするボス戦で、先頭のHP8割以上のボスが2角を超えているときはボス核攻撃を優先
//      ※核の弾が飛んでいる間（合成の受付から nukeHold 秒）は次の通常核攻撃をしない
//   2) ボス核攻撃をするボス戦（3W以降・2Wのレオン）：先頭がボス・小ボスならボス核攻撃
//      ※20W以降のレオンは、ボスがスキルを1回使うまでボス核攻撃をしない（2角を超えても核を撃たない）
//   3) 1〜2W：ジョーカーで台風をコピー
//   4) 3W以降：通常行動
//   5) 3W以降で、このウェーブのボスがバジリスク（スライム）：詰み回避のうちペアに触らない部分（通常行動〜ジョーカー同士）まで進める（バジリスク前は核が6個を超えたらやめる。スライム前は即時に撃てる核の出目の合計が10になるまで）
//   詰み回避は、通常核攻撃・ボス核攻撃ができなかったときだけ行う
//   ※盤面の地獄が1個だけなら、その地獄はどの合成にも使わない。例外は、2角を超えた敵がいて撃てる核（核＋適応・核同士）がないとき（1.14）
//
// 通常核攻撃（上から）
//   ジョーカーでコピーできる核をコピー
//   出目1核＋出目1適応（出目1核が2個以上のとき）→ 出目1核同士（3個以上）→ 出目2核＋出目2適応
//   → 出目2核同士（3個以上）→ 出目3核＋適応 → 出目3核同士 → 出目2核同士 → 出目1核＋適応 → 出目1核同士
//   → 出目n核＋適応 → 出目n核同士（n=4,5,6）
// ボス核攻撃
//   対象は先頭のボス（ボス・小ボス・今後の分裂体。中ボスは除く）。残りHPは飛んでいる核の分を引いた値
//   a) HPが8割以上：撃てる最高出目の核（同じ出目なら適応との合成を優先）
//   b) 残りHPを削りきれる核があれば、それを撃つ（削りきれる中で最小の出目。適応との合成を優先）
//   c) なければ通常核攻撃（できなければ詰み回避）
// 通常行動（最高効率即死ペアは合成しない。出目の小さい組から）：ジョーカーで核をコピー → 台風同士 → 地獄同士
//   → 次に通常核攻撃をするとき核を合成できない状態（核＋適応・核同士の組が1つもない）なら、詰み回避の行動（通常行動の部分は除く）
// 詰み回避（各項目は高い出目から）
//   通常行動（ジョーカーで核をコピーを含む）→ 台風＋適応 → 適応＋地獄 → ジョーカーで台風をコピー → ジョーカーで地獄をコピー
//   → 適応をジョーカーに合成 → ジョーカー同士（ここまで最高効率即死ペアには触れない）
//   → ペアの台風＋台風 → ペアの台風＋適応 → ペアの地獄＋適応 → ペアの地獄＋地獄
//   → （追加・options.extraStuck）盤面が埋まっていれば 適応同士 → 小さい出目から核を撃つ
// PUの目標（ウェーブに達したら、上から順に）
//   1W：盤面に台風が出たら 台風Lv2　2W：台風Lv3　3W：地獄Lv3・核Lv2　4W：地獄Lv5　5W：核Lv3　6W：核Lv4　7W：核Lv5
(() => {
'use strict';

// 暗殺対面の判定：相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべて入っている
const THN_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function thnIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return THN_ASN_DECK.every(t => ts.has(t));
}

RD.defineAgent('typhoon_hell_nuke_basic', {
  name: '台風地獄核基本AI',
  desc: '台風・地獄・核・適応・ジョーカー用（航海日記・6.5.0想定）。1Wのボスがレオンなら台風が3個になったら召喚を止め、咆哮後に再開。1〜2Wはジョーカーで台風をコピー。台風×地獄の即死で雑魚を処理し、2角を超えた敵（ボスを含む）・3W以降の1角以降の中ボスには通常核攻撃（出目1核を残しつつ低い出目から）。3W以降と2Wのレオンのボス戦は、HP8割以上なら最高出目の核→残りHPを削りきれる核→なければ通常核攻撃。3W以降はジョーカーで核をコピー→同じ出目の台風同士・地獄同士を合成（最高効率即死ペアは残す）→核を合成できない状態なら詰み回避の行動。核攻撃ができないときは詰み回避。20W以降のレオンはスキルを受けてからボス核攻撃。3W以降のバジリスク前のウェーブは詰み回避（ペアに触らない部分）まで進める（バジリスク前は核6個まで、スライム前は即時に撃てる核の出目の合計10まで）。スライムのボス戦開始時に即時に撃てる核の出目の合計が10以下なら、そのボス戦は何もしない（試合で1回だけ）。最高効率即死ペアの制限は、台風×地獄が9を超える隣接ペアが残るなら外す。盤面の地獄が1個だけなら、2角を超えた敵がいて撃てる核がないとき以外は、その地獄を合成に使わない。暗殺対面（相手に懸賞金・暗殺・生贄・適応・ジョーカー）は速度0.1秒で、暗殺避け（ジョーカーは台風→核→適応→地獄をコピー、出目1台風は適応へ、地獄は地獄へ、核は核→適応へ、適応は核→地獄→台風〔台風5個以上〕へ。合成先は懸賞金なし）→盤面7個超・台風2個以上で台風Lv2→召喚→台風2個以下・ジョーカー4個以上ならジョーカーで台風をコピー。',
  // 暗殺対面では操作速度・判断速度を asnSpeed 秒に（それ以外はシミュレータの設定のまま）
  limits: (o, info) => (o.asnMode && o.asnSpeed && thnIsAsn(info)) ? { interval: o.asnSpeed, actInterval: o.asnSpeed, summonInterval: o.asnSpeed, dragTime: o.asnSpeed } : null,
  options: {
    asnMode: true,          // 暗殺対面の動きにする（相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカー）
    asnSpeed: 0.1,          // 暗殺対面の操作速度・判断速度（秒）
    asnTyphoonLv2Dice: 7,   // 暗殺対面：盤面のダイスがこの数を超え、台風が2個以上なら台風Lv2
    asnCopyTyphoonMax: 2,   // 暗殺対面：台風がこの数以下で、ジョーカーが asnCopyJokers 個以上なら、ジョーカーで台風をコピー
    asnCopyJokers: 4,
    asnAdaptTyphoonMin: 5,  // 暗殺対面：適応に暗殺が来たとき、台風へ合成して避けるのは台風がこの数以上のときだけ
    nukeHold: 2.5,          // 核の合成を受け付けてから、次の通常核攻撃をしない秒（ドラッグ1秒＋弾が飛ぶ時間）
    midFromWave: 3,         // 1角以降の中ボスに通常核攻撃をするウェーブ
    bossNukeFromWave: 3,    // ボス核攻撃をするウェーブ（これより前は bossNukeEarly のボスだけ）
    bossNukeEarly: { 2: ['leon'] }, // bossNukeFromWave より前でボス核攻撃をするウェーブとボス
    leonStopWave: 1,        // このウェーブのボスがレオンなら、台風が leonStopTyphoons 個になったら召喚を止め、咆哮の後に再開（0で無効）
    leonStopTyphoons: 3,    // レオン対策で召喚を止める台風の数
    skillFirstWave: 20,     // このウェーブ以降、skillFirstBosses はスキルを受けてからボス核攻撃
    skillFirstBosses: ['leon'],
    prepStuckBosses: ['basilisk', 'slime'], // このボスの前のウェーブは、詰み回避のペアに触らない部分まで進める
    prepStuckFromWave: 3,   // 上を行うウェーブ（このウェーブ以降）
    prepStuckMaxNukes: 6,   // 盤面の核がこの数を超えたら、上をやめる
    slimeIdleMaxSum: 10,    // スライム放置：即時に撃てる核の出目の合計がこれ以下なら、そのスライムのボス戦は何もしない（試合で1回だけ）
    slimePrepSum: 10,       // スライム前の詰み回避：即時に撃てる核の出目の合計がこれになるまで
    nukePipCap: 4,          // 上の合計で、核の出目はこれを上限として数える
    pairFreeTH: 9,          // 台風×地獄がこれを超える隣接ペアが残るなら、最高効率即死ペアの制限を外す
    normalFromWave: 3,      // 通常行動をするウェーブ
    jokerTyphoonUntilWave: 2, // ジョーカーで台風をコピーするウェーブ（このウェーブまで）
    bossFullRatio: 0.8,     // ボス核攻撃で「満タン」とみなすHPの割合（これ以上なら最高出目の核）
    extraStuck: true,       // 詰み回避の手が尽き、盤面が埋まっているとき：適応同士 → 小さい出目の核を撃って盤面を空ける（指定にない追加の手）
    corner1: 3.5, corner2: 8.5,
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, NB = ctx.info.board.neighbors;
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const cellXY = i => [COL_X[i % 5], ROW_Y[Math.floor(i / 5)]];
    const posXY = d => d <= 3.5 ? [0, d] : d <= 8.5 ? [d - 3.5, 3.5] : [5, 3.5 - (d - 8.5)];
    const nukeInfo = ctx.info.deck.find(d => d.type === 'nuke');
    const nukePct = nukeInfo ? 0.20 + 0.02 * (nukeInfo.cls - 7) : 0.2; // ボス・小ボスへの割合（出目1あたり）
    const isBossTarget = e => e && e.bossLike && e.kind !== 'mid';     // ボス核攻撃の対象（ボス・小ボス・今後の分裂体など）

    const ASN = !!(o.asnMode && thnIsAsn(ctx.info));   // 暗殺対面
    const normalDecide = function (obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {}, W = obs.wave;
      let mem; try { mem = JSON.parse(obs.memory || '{}'); } catch (e) { mem = {}; }
      mem.nukes = (mem.nukes || []).filter(n => obs.t - n.t < o.nukeHold);
      // 受け付けた核の合成が離した時点で失敗したら、飛んでいる扱いをやめる
      for (const r of obs.results) if (r.op === 'act' && r.done && !r.ok) mem.nukes = mem.nukes.filter(n => !(n.from === r.from && n.to === r.to));
      const out = (x) => { if (x) { x.memory = JSON.stringify(mem); } return x; };

      // 即時に撃てる核の出目の合計（1.13）：出目ごとに 核＋適応 の組を先に作り、残りの核を2個ずつ組にする。出目は nukePipCap を上限に数える
      const readySum = () => { let sum = 0;
        for (let p = 1; p <= 6; p++) {
          let N = 0, A = 0;
          for (const d of obs.board) if (d && d.pips === p && !d.sealed) { if (d.type === 'nuke') N++; else if (d.type === 'adaptive') A++; }
          const k = Math.min(N, A), pairs = k + Math.floor((N - k) / 2);
          sum += pairs * Math.min(p, o.nukePipCap);
        }
        return sum; };
      // スライム放置（1.13）：スライムのボス戦が始まったとき、即時に撃てる核の出目の合計が slimeIdleMaxSum 以下なら何もしない（試合で1回だけ）
      if (obs.phase === 'boss' && obs.bossType === 'slime' && mem.slimeJudgedW !== W) {
        mem.slimeJudgedW = W;
        const rs = readySum();
        if (!mem.slimeIdleUsed && rs <= o.slimeIdleMaxSum) { mem.slimeIdleUsed = true; mem.slimeIdleW = W; mem.slimeIdleSum = rs; }
      }
      if (mem.slimeIdleW === W && (obs.phase === 'boss' || obs.phase === 'cleanup')) return out({ ops: [], note: `${W}Wのスライム：放置（即時に撃てる核の出目の合計 ${mem.slimeIdleSum}）` });

      const is = (i, t) => !!(b[i] && b[i].type === t);
      const cells = t => [...Array(15).keys()].filter(i => is(i, t));
      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const find = (f, t, res) => { const a = legal.get(f * 15 + t); return a && a.result === res ? a : null; };
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      const full = b.every(Boolean);
      const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note });

      // ---------- 0) PU → 召喚 ----------
      const lv = t => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 99; };
      const steps = [];
      if (W >= 2 || cells('typhoon').length) steps.push(['typhoon', 2]);
      if (W >= 2) steps.push(['typhoon', 3]);
      if (W >= 3) steps.push(['hell', 3], ['nuke', 2]);
      if (W >= 4) steps.push(['hell', 5]);
      if (W >= 5) steps.push(['nuke', 3]);
      if (W >= 6) steps.push(['nuke', 4]);
      if (W >= 7) steps.push(['nuke', 5]);
      const next = steps.find(([t, L]) => lv(t) < L);
      if (next && obs.legal.powerUp.includes(next[0])) return out({ ops: [{ op: 'powerUp', type: next[0] }], more: true, note: `PU ${next[0]} Lv${lv(next[0]) + 1}（目標Lv${next[1]}）` });
      // 1Wのボスがレオン：台風が出たら召喚を止め、咆哮（1回目のスキル）の後に再開
      if (W === o.leonStopWave && obs.bossType === 'leon') {
        if (mem.leon !== 'resumed' && obs.phase === 'boss' && obs.boss && obs.boss.type === 'leon' && obs.boss.cast >= 1) mem.leon = 'resumed';
        else if (!mem.leon && cells('typhoon').length >= o.leonStopTyphoons) mem.leon = 'stop';
      } else if (mem.leon) delete mem.leon;
      const leonStop = mem.leon === 'stop';
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !leonStop) return out({ ops: [{ op: 'summon' }], more: true, note: '召喚' });
      if (!actReady) return out({ ops: [], note: null });

      // ---------- 最高効率即死ペア ----------
      let pair = null;
      for (const ti of cells('typhoon')) for (const hi of NB[ti]) {
        if (!is(hi, 'hell')) continue;
        const v = b[ti].pips * b[hi].pips;
        if (!pair || v > pair.v || (v === pair.v && b[ti].pips > b[pair.ty].pips)) pair = { ty: ti, hl: hi, v };
      }
      const prot = new Set(pair ? [pair.ty, pair.hl] : []);
      // ペアの制限（1.9）：remove のマスのダイスが消えても、台風×地獄が pairFreeTH を超える隣接ペアが残るなら制限なし。
      //   残らないなら touch のマスが最高効率即死ペアに含まれないときだけ許す
      const pairLeft = remove => { const R = new Set(remove);
        for (const ti of cells('typhoon')) { if (R.has(ti)) continue; for (const hi of NB[ti]) if (!R.has(hi) && is(hi, 'hell') && b[ti].pips * b[hi].pips > o.pairFreeTH) return true; }
        return false; };
      const okTouch = (remove, touch) => pairLeft(remove) || !touch.some(i => prot.has(i));
      // 最後の1個の地獄（1.14）：2角を超えた敵がいて撃てる核がないとき以外は、合成に使わない
      const hells = cells('hell');
      const anyNukePair = () => { for (let p = 1; p <= 6; p++) if (withAdaptive(p) || withNuke(p)) return true; return false; };
      let loneHellC; // 判断ごとに1回だけ計算（核の合成の関数は下で定義するので、呼ばれた時点で計算する）
      const loneHell = () => loneHellC !== undefined ? loneHellC
        : (loneHellC = hells.length === 1 && !(obs.enemies.some(e => e.pos > o.corner2) && !anyNukePair()) ? hells[0] : -1);
      // 合成先：台風・地獄に多く隣接しているマス（新しいダイスが台風・地獄ならそのまま効く）
      const near = i => NB[i].filter(j => is(j, 'typhoon') || is(j, 'hell')).length;
      const mergeOf = (x, y) => { // x と y の合成（どちら向きでも）。合成先は near の大きいほう
        const [f, t] = near(y) >= near(x) ? [x, y] : [y, x];
        return find(f, t, 'merge') || find(t, f, 'merge');
      };

      // ---------- 核の合成 ----------
      const front = obs.front;
      const dist = i => { if (!front) return 0; const [x, y] = cellXY(i), [ex, ey] = posXY(front.pos); return Math.hypot(ex - x, ey - y); };
      const nukeMerge = (x, y) => { // 合成先（核の発射元）は先頭の敵に近いほう
        const [f, t] = dist(y) <= dist(x) ? [x, y] : [y, x];
        return find(f, t, 'merge') || find(t, f, 'merge');
      };
      const nukesOf = p => cells('nuke').filter(i => b[i].pips === p);
      const withAdaptive = p => { for (const n of nukesOf(p)) for (const a of cells('adaptive')) { if (b[a].pips !== p) continue; const m = nukeMerge(n, a); if (m) return m; } return null; };
      const withNuke = p => { const L = nukesOf(p); for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) { const m = nukeMerge(L[x], L[y]); if (m) return m; } return null; };
      const fire = (m, note, targetId, pips) => {
        mem.nukes.push({ t: obs.t, from: m.from, to: m.to, targetId, dmg: pips });
        return out(act(m, note));
      };
      const jokerCopyNuke = () => { for (const j of cells('joker')) for (const n of cells('nuke')) { const a = find(j, n, 'copy'); if (a) return a; } return null; };

      function normalNuke(why) {
        const c = jokerCopyNuke();
        if (c) return out(act(c, `${why}：ジョーカー${c.from}で核（出目${b[c.to].pips}）をコピー`));
        const n1 = nukesOf(1).length, n2 = nukesOf(2).length;
        const plan = [
          [1, 'a', n1 >= 2], [1, 'n', n1 >= 3], [2, 'a', true], [2, 'n', n2 >= 3], [3, 'a', true], [3, 'n', true],
          [2, 'n', true], [1, 'a', true], [1, 'n', true], [4, 'a', true], [4, 'n', true], [5, 'a', true], [5, 'n', true], [6, 'a', true], [6, 'n', true],
        ];
        for (const [p, k, ok] of plan) {
          if (!ok) continue;
          const m = k === 'a' ? withAdaptive(p) : withNuke(p);
          if (m) return fire(m, `${why}：出目${p}核＋${k === 'a' ? '適応' : '核'}（${m.from}→${m.to}）`, front ? front.id : null, p);
        }
        return stuck(`${why}：撃てる核なし → 詰み回避`);
      }

      function bossNuke(e) {
        const pend = mem.nukes.filter(n => n.targetId === e.id);
        const dmgOf = p => e.maxHp * nukePct * p;
        const rest = e.hp - pend.reduce((s, n) => s + dmgOf(n.dmg), 0); // 飛んでいる核の分を引いた残りHP
        if (rest <= 0) return null; // 飛んでいる核で足りる
        const pick = p => withAdaptive(p) || withNuke(p); // 同じ出目なら適応との合成を優先
        const pct = Math.round(rest / e.maxHp * 100);
        // a) HP8割以上：撃てる最高出目の核
        if (rest >= e.maxHp * o.bossFullRatio) {
          for (let p = 6; p >= 1; p--) { const m = pick(p); if (m) return fire(m, `ボス核攻撃（HP${pct}%）：最高出目${p}の核（${m.from}→${m.to}、最大HPの${Math.round(nukePct * p * 100)}%）`, e.id, p); }
        }
        // b) 残りHPを削りきれる核があれば、それを撃つ（削りきれる中で最小の出目）
        for (let p = 1; p <= 6; p++) {
          if (dmgOf(p) < rest) continue;
          const m = pick(p);
          if (m) return fire(m, `ボス核攻撃：残りHP ${pct}% を出目${p}の核で削りきる（${m.from}→${m.to}）`, e.id, p);
        }
        // c) なければ通常核攻撃（できなければ詰み回避）
        return normalNuke(`ボス核攻撃（残りHP ${pct}%、削りきれる核なし）→ 通常核攻撃`);
      }

      // ---------- 通常行動・詰み回避 ----------
      const sameMerges = (t, guarded, order) => { // 同じ種類・同じ出目の組（guarded＝ペアの制限をかける）
        const L = cells(t), res = [];
        for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) if (b[L[x]].pips === b[L[y]].pips) {
          if (guarded && !okTouch([L[x], L[y]], [L[x], L[y]])) continue;
          const m = mergeOf(L[x], L[y]); if (m) res.push(m); }
        return res.sort((p, q) => order * (b[p.from].pips - b[q.from].pips));
      };
      function normalAction(order) {
        const c = jokerCopyNuke();
        if (c) return { m: c, note: `通常行動：ジョーカー${c.from}で核（出目${b[c.to].pips}）をコピー` };
        for (const t of ['typhoon', 'hell']) { const m = sameMerges(t, true, order)[0]; if (m) return { m, note: `通常行動：${t === 'typhoon' ? '台風' : '地獄'}同士（出目${b[m.from].pips}、${m.from}→${m.to}）` }; }
        return null;
      }
      const byPipsDesc = L => L.slice().sort((p, q) => b[q].pips - b[p].pips || p - q);
      const withAdaptiveOf = (L, label) => { for (const x of byPipsDesc(L)) for (const a of cells('adaptive')) { if (b[a].pips !== b[x].pips || x === loneHell()) continue; const m = mergeOf(x, a); if (m) return { m, note: `${label}（出目${b[x].pips}、${m.from}→${m.to}）` }; } return null; };
      // 適応との合成（ペアの制限つき）
      const withAdaptiveG = (L, label) => { for (const x of byPipsDesc(L)) for (const a of cells('adaptive')) { if (b[a].pips !== b[x].pips || x === loneHell() || !okTouch([x, a], [x])) continue; const m = mergeOf(x, a); if (m) return { m, note: `${label}（出目${b[x].pips}、${m.from}→${m.to}）` }; } return null; };
      const jokerCopyG = (L, name) => { for (const x of byPipsDesc(L)) for (const j of cells('joker')) { if (!okTouch([j], [x])) continue; const a = find(j, x, 'copy'); if (a) return { m: a, note: `ジョーカー${j}で${name}（出目${b[x].pips}）をコピー` }; } return null; };
      function stuck(why, skipNormal, safeOnly) {
        const pre = why ? why + '／' : '詰み回避：';
        let r = skipNormal ? null : normalAction(1);
        if (r) return out(act(r.m, pre + r.note));
        const ty = cells('typhoon'), hl = cells('hell');
        const tries = [
          () => withAdaptiveG(ty, '台風＋適応'),
          () => withAdaptiveG(hl, '適応＋地獄'),
          () => jokerCopyG(ty, '台風'),
          () => jokerCopyG(hl, '地獄'),
          () => { for (const j of byPipsDesc(cells('joker'))) for (const a of cells('adaptive')) { const m = find(a, j, 'merge'); if (m) return { m, note: `適応をジョーカーに合成（出目${b[j].pips}、${a}→${j}）` }; } return null; },
          () => { const m = sameMerges('joker', false, -1)[0]; return m ? { m, note: `ジョーカー同士（出目${b[m.from].pips}）` } : null; },
          () => safeOnly ? 'stop' : null, // ここから先はペアに触る
          () => { if (!pair) return null; for (const x of cells('typhoon')) if (x !== pair.ty && b[x].pips === b[pair.ty].pips) { const m = mergeOf(pair.ty, x); if (m) return { m, note: `ペアの台風＋台風（出目${b[x].pips}）` }; } return null; },
          () => pair ? withAdaptiveOf([pair.ty], 'ペアの台風＋適応') : null,
          () => pair ? withAdaptiveOf([pair.hl], 'ペアの地獄＋適応') : null,
          () => { if (!pair) return null; for (const x of cells('hell')) if (x !== pair.hl && b[x].pips === b[pair.hl].pips) { const m = mergeOf(pair.hl, x); if (m) return { m, note: `ペアの地獄＋地獄（出目${b[x].pips}）` }; } return null; },
        ];
        for (const f of tries) { r = f(); if (r === 'stop') return null; if (r) return out(act(r.m, pre + r.note)); }
        // 追加の詰み回避（指定にない手。盤面が核と適応だけで埋まって動けなくなるのを防ぐ。options.extraStuck=false で無効）
        if (o.extraStuck && full) {
          const m = sameMerges('adaptive', false, -1)[0];
          if (m) return out(act(m, pre + `（追加）適応同士（出目${b[m.from].pips}）`));
          for (let p = 1; p <= 6; p++) { const n = withAdaptive(p) || withNuke(p); if (n) return fire(n, pre + `（追加）出目${p}の核を撃って空ける（${n.from}→${n.to}）`, front ? front.id : null, p); }
        }
        return why ? out({ ops: [], note: why + '／できる手なし' }) : null;
      }

      // ---------- 1) いかなる時も ----------
      const early = (o.bossNukeEarly || {})[W] || [];
      // 20W以降のレオン（skillFirstBosses）：ボスがスキルを1回使うまでボス核攻撃をしない（1.9）
      const skillWait = obs.phase === 'boss' && W >= o.skillFirstWave && o.skillFirstBosses.includes(obs.bossType) && !(obs.boss && obs.boss.cast >= 1);
      const bossTime = obs.phase === 'boss' && !skillWait && (W >= o.bossNukeFromWave || early.includes(obs.bossType));
      const flying = mem.nukes.length > 0;
      // ボス核攻撃をするボス戦で、HP8割以上のボス（先頭）が2角を超えているなら、ボス核攻撃を優先（1.2・1.5）
      if (bossTime && isBossTarget(front) && front.pos > o.corner2 && front.hp >= front.maxHp * o.bossFullRatio && !mem.nukes.some(n => n.targetId === front.id)) {
        const r = bossNuke(obs.enemies[0]);
        if (r) return r;
      }
      if (!flying) {
        const past2 = obs.enemies.some(e => e.pos > o.corner2 && !(skillWait && e.kind === 'boss')); // ボス・小ボスも含める（スキル待ちのボスは除く）
        if (past2) return normalNuke('2角を超えた敵');
        if (W >= o.midFromWave && front && front.kind === 'mid' && front.pos >= o.corner1) return normalNuke('1角以降の中ボスが先頭');
      }
      // ---------- 2) ボス核攻撃 ----------
      if (bossTime && isBossTarget(front)) {
        const r = bossNuke(obs.enemies[0]);
        if (r) return r;
      }
      // ---------- 3) 1〜2W：ジョーカーで台風をコピー ----------
      if (W <= o.jokerTyphoonUntilWave) {
        for (const j of cells('joker')) for (const t of cells('typhoon')) { const a = find(j, t, 'copy'); if (a) return out(act(a, `ジョーカー${j}で台風（出目${b[t].pips}）をコピー`)); }
      }
      // ---------- 4) 通常行動 ----------
      if (W >= o.normalFromWave) {
        const r = normalAction(1);
        if (r) return out(act(r.m, r.note));
        // 次に通常核攻撃をするとき核を合成できない状態なら、詰み回避の行動（1.8）
        let canNuke = false;
        for (let p = 1; p <= 6 && !canNuke; p++) canNuke = !!(withAdaptive(p) || withNuke(p));
        if (!canNuke) { const s2 = stuck('通常行動：核を合成できない → 詰み回避', true); if (s2 && s2.ops && s2.ops.length) return s2; }
      }
      // ---------- 5) 3W以降のバジリスク（スライム）前：詰み回避のペアに触らない部分まで進める（1.9） ----------
      const prepOk = obs.bossType === 'slime' ? readySum() < o.slimePrepSum : cells('nuke').length <= o.prepStuckMaxNukes;
      if (obs.phase === 'wave' && W >= o.prepStuckFromWave && o.prepStuckBosses.includes(obs.bossType) && prepOk) {
        const s3 = stuck('バジリスク前：詰み回避（ペアに触らない部分）', false, true);
        if (s3 && s3.ops && s3.ops.length) return s3;
      }
      return out({ ops: [], note: null });
    };

    // ---------- 暗殺対面（1.15.0） ----------
    const NAME = { typhoon: '台風', hell: '地獄', nuke: '核', adaptive: '適応', joker: 'ジョーカー' };
    const nm = t => NAME[t] || t;
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
      const noBounty = i => !(b[i].bounty > 0);
      // 1. 暗殺が飛んできた
      const pend = (obs.pending || []).filter(p => p.kind === 'assassin' && p.cells && p.cells.length).sort((x, y) => x.in - y.in);
      const pendCells = new Set(pend.flatMap(p => p.cells));
      if (actReady) for (const p of pend) {
        const cell = p.cells[0], d = b[cell];
        if (!d || d.sealed || p.in <= dt + 0.02) continue;
        const key = cell + ':' + Math.round((obs.t + p.in) * 10);
        if (asnDone.has(key) && asnDone.get(key) !== d.id) continue;   // もう避けた（対象のダイスが変わった）
        const safe = i => i !== cell && !pendCells.has(i);
        // 懸賞金の付いていない同じ出目の t（ほかの暗殺の予告マスは除く）へ合成して逃がす
        const mergeTo = t => cells(t).filter(x => safe(x) && b[x].pips === d.pips && noBounty(x)).map(x => find(cell, x, 'merge')).filter(Boolean)[0];
        let r = null;
        if (d.type === 'joker') {
          for (const t of ['typhoon', 'nuke', 'adaptive', 'hell']) {
            const c = cells(t).filter(x => x !== cell).map(x => find(cell, x, 'copy')).filter(Boolean)[0];
            if (c) { r = act(c, `暗殺対面：ジョーカー${d.pips}に暗殺。${nm(t)}をコピーして避ける`); break; }
          }
        } else if (d.type === 'typhoon') {
          if (d.pips === 1) { const c = mergeTo('adaptive'); if (c) r = act(c, `暗殺対面：出目1の台風に暗殺。懸賞金のない適応（${c.to}）へ合成して避ける`); }
        } else if (d.type === 'hell') {
          const c = mergeTo('hell'); if (c) r = act(c, `暗殺対面：地獄${d.pips}に暗殺。懸賞金のない地獄（${c.to}）へ合成して避ける`);
        } else if (d.type === 'nuke') {
          for (const t of ['nuke', 'adaptive']) { const c = mergeTo(t); if (c) { r = act(c, `暗殺対面：核${d.pips}に暗殺。懸賞金のない${nm(t)}（${c.to}）へ合成して避ける`); break; } }
        } else if (d.type === 'adaptive') {
          const ts = ['nuke', 'hell'];
          if (cells('typhoon').length >= o.asnAdaptTyphoonMin) ts.push('typhoon');
          for (const t of ts) { const c = mergeTo(t); if (c) { r = act(c, `暗殺対面：適応${d.pips}に暗殺。懸賞金のない${nm(t)}（${c.to}）へ合成して避ける`); break; } }
        }
        if (r) { asnDone.set(key, d.id); return r; }
      }
      // 2. 盤面のダイスが7個を超え、台風が2個以上なら台風Lv2（召喚より先）
      const lvT = (obs.deck.find(x => x.type === 'typhoon') || {}).lv || 99;
      const nDice = b.filter(Boolean).length, nTy = cells('typhoon').length;
      if (nDice > o.asnTyphoonLv2Dice && nTy >= 2 && lvT < 2 && obs.legal.powerUp.includes('typhoon'))
        return { ops: [{ op: 'powerUp', type: 'typhoon' }], more: true, note: `暗殺対面：盤面のダイス${nDice}個・台風${nTy}個なので台風Lv2` };
      // 3. 召喚
      if (obs.legal.summon && !(ctl.summonReadyIn > 1e-9)) return { ops: [{ op: 'summon' }], more: true, note: '暗殺対面：召喚' };
      // 4. 台風が2個以下で、ジョーカーが4個以上なら、ジョーカーで台風を1個コピー
      if (actReady && nTy <= o.asnCopyTyphoonMax && cells('joker').length >= o.asnCopyJokers) {
        for (const j of cells('joker')) { if (pendCells.has(j)) continue; for (const t of cells('typhoon')) { const a = find(j, t, 'copy'); if (a) return act(a, `暗殺対面：台風${nTy}個・ジョーカー${cells('joker').length}個なので、ジョーカー${j}で台風${b[t].pips}をコピー`); } }
      }
      return null;
    };

    return { decide: obs => (ASN ? asnDecide(obs) : normalDecide(obs)) };
  },
});
})();
