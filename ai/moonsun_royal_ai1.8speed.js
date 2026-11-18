// 月太陽ロイヤル基本AI（AI API v1）  RD.defineAgent('moonsun_royal', ...)
//   月太陽AI（moonsun）をもとに、ロイヤル攻撃を加えたもの。登録IDは別なので月太陽AIと同時に読み込める
// デッキ前提：月・太陽・成長・ジョーカー・ロイヤル（ロイヤルが自由枠）
//
// 2026-11-10 月太陽ロイヤル基本AIとして追加したこと
//   ・詰みの判断の個数の上限を1つ増やす（tsumiLimit 4→5）
//   ・ロイヤル攻撃（royalAttack）。上から順に確認する
//       詰んでいればしない／ウェーブの残りが45秒より多ければ始めない／召喚10回分のSPがなければ始めない（始めたらそのウェーブ中は解除）／
//       召喚5回分のSPに差し掛かったら（次の召喚で5回分を切る）やめて、そのウェーブ中は再開しない／
//       活性判断（活性準備・W4以降の残り10秒の両活性）・立て直し判断があればしない／残り15秒を切っていれば始めない
//     手順：盤面のロイヤルをジョーカー（守りのジョーカー以外）でコピー → ロイヤルのペアを合成 → 空きがあれば召喚 →
//           守りのジョーカーのうちロイヤルをコピーできる出目の高い方でコピー → 守りのダイス以外の月どうしを合成 → どれもできなければそのウェーブは諦める
//     行う場面：
//       A) W5以降、火力の判定で「足りている」として止めているとき
//       B) 月の星の隣に出目4以上の太陽がいるとき（月の星の完成）
//       どちらも、始めるときに相手の先頭のモンスターが1つ目の角（3.5）を越えていないこと（相手の火力が十分＝ロイヤルで崩す。始めた後はこの条件では止めない）、
//       陰陽ロイヤルAIと同じ相手の判定（始めた後も毎回見る）
//       （相手の先頭が2つ目の角を越えていない・5秒窓の移動平均で D≥0・まだ打っていないウェーブで R>0 なら打たない・ウェーブ開始5秒は判断しない）
//   ・ナイトを受ける判断のとき（knightRoyal）：ウェーブの残り5秒で、ロイヤルのペアを1組ずつ合成し、太陽の活性が切れていなければ次のペアへ（召喚しない）。
//     ペアを打ち切っても太陽が活性していれば、活性が切れるまで召喚する。活性が切れたら何もせずナイトを待つ
//   ・月の星の隣に出目4以上の太陽がいる間は、出目上げ・盤面づくり（隣接づくり）をしない。いなくなれば通常どおり
//   ・ロイヤルはパワーアップしない
//   ・W6まで：太陽7個・召喚5回分のSP・先頭がレーンの真ん中の手前で、それでも待機しているなら、守りでない同じ出目の太陽どうしを合成（sun7Merge）
//   ・すべての場面で、太陽に隣接している月に出目3以上がなければ月の活性は求めない（moonAdjMin）
//   ・W1〜W2のSPに余裕がない放置中、太陽が活性していなければ、合成だけで太陽をそろえる（3個以下はロイヤル・月どうし、5個以上は太陽どうし。召喚しない）（w12SpFix）
//   ・月の星ができた後は、守るのは月の星と、月の星に隣接している最高出目の太陽だけ（starGuardOnly）
//   ・立て直しの手がすべてないとき（守りを外す前）：月が活性していなくてもジョーカーで太陽だけ活性。無理ならジョーカーで守り以外（ロイヤル優先）をコピーして合成（repairJokerFallback）
//   ・月の星に出目4以上の太陽が隣接して両活性しているなら、6.0.5はW10まで・6.5.0はW8まで何もしない（ロイヤル攻撃もしない。PUはする）（starIdleUntil）
//   ・相手のデッキに月・太陽・成長・ジョーカーがあれば、両活性でないときはロイヤル攻撃をしない（oppMoonsunBoth）
//   ・月の星の隣接が完了した後：相手のデッキに月があれば、相手の盤面に出目5以上の月がないときはロイヤル攻撃をしない（20ウェーブ以降は除く）（oppMoonPipsMin）。
//     相手が月太陽なら、相手の盤面に攻撃速度バフ90%以上の月がないときはロイヤル攻撃をしない（oppMoonSpdMin）
//   ・いかなるときも、モンスター（ボスも含む）が2つ目の角を越えていなければ、成長どうしの合成を禁止（growthPairLine）
//   ・2026-11-15：立て直しの手がすべてない（ジョーカーもない）とき、空きがあれば召喚、埋まっていれば守り以外の太陽・月以外のダイスどうし
//     （ロイヤル優先・出目の低い組から）を合成してマスを空ける（repairLastResort）。期待値が変わらない手でも、動かずに流れるよりよい
//   ・2026-11-17：出目7（星）のジョーカーでは、ロイヤルと成長をコピーしない（starJokerNoCopy）
//   ・2026-11-17：暗殺対面（相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカー）。月太陽AI（moonsun_ai.js 2026-11-17）の暗殺対面をそのまま入れた。
//     動きは通常とまったく別（asnMode）。ロイヤル攻撃もしない
//     ・操作速度・判断速度を0.1秒に（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ時間）（asnSpeed）
//     ・太陽が活性していれば止める。活性していなければ召喚して活性を狙う
//     ・召喚できず太陽が活性していないとき：相手の盤面に暗殺がなければ、懸賞金の付いていないジョーカーで太陽をコピー →
//       それでも活性しなければ、懸賞金の付いていない（ジョーカー・成長以外の）ダイスどうしを合成。それでも無理なら止まる
//     ・こちらの先頭のモンスターが2つ目の角を越えたら、懸賞金の縛りを外して活性を試みる（相手の暗殺の有無も見ない）。
//       それでも無理なら、ジョーカーでほかのダイスをコピーして合成。それでも無理ならジョーカーどうしを合成
//     ・暗殺が飛んできたとき
//       ジョーカー：太陽が2・3個なら太陽をコピー。1・4個なら月以外をコピー（4個のときは太陽も避ける）
//       太陽：何もしない
//       ほかのダイス：先頭が2つ目の角の手前なら、召喚2回分のSPがあるか、盤面の太陽と同じ出目のジョーカーがあれば、
//         懸賞金の付いていない同じ種類のダイスへ合成して避ける。2つ目の角を越えていて太陽が活性していれば何もしない。
//         2つ目の角を越えていて太陽が活性していなければ、懸賞金の縛りなしで同じ種類のダイスへ合成して避ける
//   ・AIの速度系（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ時間）を0.3秒にする（limits。オプション aiSpeed）
//   ・W1〜W2：いかなるときも、先頭が2つ目の角を越えるまでは、ジョーカーで成長をコピーできれば全部コピーする（w12GrowthAlways）
//   ・W3以降、何も打つ手がないとき、太陽が活性していなければ、そろうまで 召喚 → 太陽5個以上は守りでない太陽どうし／3個以下は太陽以外を合成（sunIdleFix）
//
// 以下は月太陽AIの説明
// 方針：プロジェクト資料「月太陽AIの判断分岐（言語化案）」「月太陽の組み立て手順（プレイヤー視点）」
// デッキ前提：月・太陽・成長・ジョーカー・（吹雪などの数合わせ1種）
//
// 1回の decide で操作は1つだけ返し、more:true で結果を見てから次を決める。
// 判断の順番（最初に当てはまったものを行う）
//   1. ボス戦（ナイトを受ける／活性の立て直し）
//   2. 活性準備（W3〜：先頭の雑魚がレーンの真ん中を越えた／W1〜W2：2つ目の角を越えた）
//   2.5 停止中（W5〜：押し返したときに次のウェーブの火力が足りなければ、作り込みを再開）
//   3. W1（太陽1つで止めて貯める → 1つ目の角で盤面を広げる → 2つ目の角で太陽4つ）
//   3.5 W2（SPに余裕があれば盤面を広げる。なければ動かさない → 2つ目の角で太陽4つ）
//   4. 作り込み（W3〜：出目上げ・隣接づくり）
//   5. パワーアップ
//
// 2026-11-07 改訂
//   ・W1〜W2：太陽4つを強制しない。1つ目の角（W1）／SPの余裕（W2）から召喚で盤面を広げ、合成は埋まってから。
//     太陽を作るためにジョーカーを使わない。太陽4つへの立て直しは先頭が2つ目の角（earlyLine）を越えてから
//   ・W5〜（weakWave）：活性して止めた後、先頭が1つ目の角（resumeLine）まで押し返したら火力を判定し、
//     次のウェーブに足りなければ作り込みを再開する（レオン・ナイト前の放置、召喚10回分の待ちは飛ばす。詰みは残す）
//   ・W1〜W2の盤面展開：ジョーカーは成長をコピーできるなら全部コピーする（w12GrowthCopy）
//   ・危ない場面（ボス戦〔わざと受けるナイト以外〕・ボス後の残り・通常ウェーブで先頭が2つ目の角を越えた）：
//     守り（守る太陽・主力の月）のせいで立て直しがなければ、守りを外してもう一度探す（dangerRelax）
//   ・活性準備で活性していないときはPUしない（立て直しの召喚に使うSPを残す）
//   ・ボス後の残りの敵がいる間も、活性していなければ立て直す
//   ・重ねる操作のドラッグ中・間隔待ち（1.9.0のAIコントローラ）は、重ねる操作を出さずに待つ
// 2026-11-08 改訂
//   ・月の星の隣の太陽は、出目3以上を守る（starSunMin。出目1・2の太陽は合成してよい）
//   ・最高火力の太陽は、隣の月のバフ込みの見込み火力で決める（topSunMode。月・太陽のクラスとLvを使う。月のクラスは12を想定）
//   ・立て直しで守る月は、最高火力の組（太陽＋隣の月）の月と最大出目の月だけ（fpMoonGuard: false）
//   ・成長どうしの合成は、出目上げ・盤面展開・隣接づくりでは使わない（ジョーカーで成長のコピーはよい）。
//     立て直しでは使ってよい。活性の手順（活性準備・残り10秒の活性）では先頭が2つ目の角を越えてから（growthMergeLine）
//   ・W3以降：残り15秒以下では出目上げを（再）開しない（noBuildLeft）。W4以降：残り10秒以下では両活性させる（activateLeft）
//   ・出目上げのジョーカーどうしの合成は、ほかに手がないときだけ。片方は残し、守るダイス以外をコピーして合成する手を先に（jokerLast）
//   ・立て直し・活性の手順をユーザーの手順に（repairMode 'simple'）：目標は太陽4・月3か5。
//     ジョーカーは召喚5回分のラインを切って、かつ片方が活性しているときだけ（もう片方をそろえる）。
//     太陽5個以上は太陽どうしを合成。あとは召喚 → 埋まったら合成 の繰り返し。危ない場面は旧版（simpleDangerOld）
//   ・太陽7個を目標にしない（sevenTarget: false。すでに7個なら崩さない）
//   ・出目上げの召喚（W3以降・ウェーブごと）：召喚10回分たまったら5回分を残すところまで続けて使う。
//     使い切ったら、また10回分たまるまで召喚しない（合成・コピーの出目上げは続ける）。新しいウェーブでは10回分の待ちから（summonHyst）
//   ・立て直しの召喚 → 合成の流れでは、ジョーカーどうしを合成しない
//   ・月の星がなければ、危ない場面以外はいつでも、出目4以上のジョーカーで成長をコピーする（highJokerGrowth）
//   ・ナイトの変換後（knightRules）：1回目はユーザーの手順で、成長どうし・ジョーカーどうしの合成を禁止。
//     変換で月の星が出ていれば何としてでも活性（禁止なし）。2回目以降はライフ3なら成長どうし・ジョーカーどうしの合成を禁止
//   ・SPを貯めていて動かさないとき（召喚10回分待ち・停止中・残り15秒以下）：太陽が活性していなければ、
//     太陽5個以上なら守る太陽以外の太陽どうしを合成。出目1・2のジョーカー1個のコピーで太陽が活性するならコピー（sunWaitFix）
'use strict';

// 暗殺対面の判定：相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがすべて入っている（月太陽AIと同じ）
const MSR_ASN_DECK = ['bounty', 'assassin', 'sacrifice', 'adaptive', 'joker'];
function msrIsAsn(info) {
  const od = info && info.opponentDeck; if (!od) return false;
  const ts = new Set(od.map(d => d.type));
  return MSR_ASN_DECK.every(t => ts.has(t));
}

RD.defineAgent('moonsun_royal', {
  name: '月太陽ロイヤル基本AI',
  desc: '月太陽AIにロイヤル攻撃を加えたもの。W5以降で火力が足りて止めているとき・月の星の隣に出目4以上の太陽がいるときに、相手の先頭が1つ目の角の手前（相手の火力が十分）で、陰陽ロイヤルAIと同じ相手の判定（D）を満たせばロイヤルを打つ。ナイトを受けるときは残り5秒でロイヤルのペアを打って太陽の活性を切る。月の星が完成したら出目上げを止める。',
  // AIの速度系の制限（判断の間隔・重ねる操作の最短間隔・召喚の最短間隔・ドラッグ時間）を aiSpeed 秒にする（UIの設定より優先）
  //   暗殺対面では asnSpeed 秒（月太陽AIと同じ）
  limits: (o, info) => {
    const v = (o.asnMode && o.asnSpeed && msrIsAsn(info)) ? o.asnSpeed : o.aiSpeed;
    return { interval: v, actInterval: v, summonInterval: v, dragTime: v };
  },
  options: {
    aiSpeed: 0.3,           // AIの速度系（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ時間）の秒数
    // ---- 暗殺対面（2026-11-17、月太陽AIから） ----
    asnMode: true,          // 相手のデッキに懸賞金・暗殺・生贄・適応・ジョーカーがあれば、暗殺対面の動きにする
    asnSpeed: 0.1,          // 暗殺対面の操作速度・判断速度（秒）
    asnCorner: 8.5,         // 暗殺対面：こちらの先頭のモンスターがこの位置（2つ目の角）を越えたら縛りを外す
    asnSunOneEarly: false,  // 暗殺対面：W1〜W2は太陽1個の活性も活性に数える（false＝数えない）
    asnPu: false,           // 暗殺対面：太陽が活性して止めている間にPUする
    // ---- ロイヤル攻撃（月太陽ロイヤル基本AIで追加） ----
    royalAttack: true,      // ロイヤル攻撃をする
    royalFromWave: 5,       // A)「火力が足りて止めている」でロイヤル攻撃をするのはこのウェーブ以降
    royalStartMax: 45,      // ウェーブの残りがこの秒数より多ければ始めない
    royalStartMin: 15,      // ウェーブの残りがこの秒数を切っていれば始めない
    royalStartSummons: 10,  // 召喚この回数分のSPがなければ始めない（始めたらそのウェーブ中は解除）
    royalStopSummons: 5,    // 召喚この回数分のSPに差し掛かったらやめる（そのウェーブ中は再開しない）
    oppFrontLine: 3.5,      // 相手の先頭のモンスターがこの位置（1つ目の角）を越えていたらロイヤル攻撃を始めない（越えていない＝相手の火力が十分なので、ロイヤルで崩す）。始めた後はこの条件では止めない
    royalSummon: true,      // ロイヤル攻撃中、ペアを打った後に空きがあれば召喚する
    // 陰陽ロイヤルAIと同じ相手の判定（相手がいないとき〔練習〕はしない）
    dSkip: 5,               // ウェーブ開始からこの秒数は判断しない
    dWindow: 5,             // 相手の先頭の位置の移動平均をとる秒数
    stopPastPos: 8.5,       // 相手の先頭の敵がこの位置（2つ目の角）を越えていたら打たない
    reachCheck: true,       // このウェーブでまだ打っていなくて R > 0 なら打たない
    normalSpeed: 0.6,       // 通常モンスターの速さ（R の計算用。エンジンの定義と同じ値）
    // ナイトを受けるとき
    knightRoyal: true,      // ナイトを受ける判断のとき、残り knightRoyalLeft 秒でロイヤルのペアを打って太陽の活性を切る
    knightRoyalLeft: 5,
    knightRoyalMaxFront: 8.5, // 自分の先頭の雑魚がこの位置（2つ目の角）を越えていたらしない（危ない場面では活性を切らない）
    repairLastResort: true, // 立て直しの手がすべてない（ジョーカーもない）とき：召喚、埋まっていれば守り以外の太陽・月以外のダイスどうし（ロイヤル優先）を合成してマスを空ける
    repairJokerFallback: true, // 立て直しの手がないとき（守りを外す前）：ジョーカーで太陽だけ活性 → ジョーカーで守り以外をコピーして組を作り合成
    starIdleUntil: { '6.0.5': 10, '6.5.0': 8 }, // 月の星に出目4以上の太陽が隣接して両活性なら、このウェーブまで何もしない（null で切る）
    starJokerNoCopy: ['royal', 'growth'], // 出目7（星）のジョーカーでコピーしない種類（[] で切る）
    growthPairLine: 8.5,    // いかなるときも、モンスター（ボスも含む）がこの位置（2つ目の角）を越えていなければ成長どうしの合成を禁止（null で切る）
    oppMoonsunBoth: true,
    // 月の星の隣接が完了した後（月の星の隣に出目4以上の太陽）の条件
    oppMoonPipsMin: 5,      // 相手のデッキに月があるとき、相手の盤面に出目この値以上の月がなければロイヤル攻撃をしない（0で切る）
    oppMoonPipsUntil: 19,   // 上の条件はこのウェーブまで（20ウェーブ以降はその限りではない）
    oppMoonSpdMin: 0.90,    // 相手が月太陽のとき、相手の盤面に攻撃速度バフがこの値以上の月がなければロイヤル攻撃をしない（0で切る）   // 相手のデッキに月・太陽・成長・ジョーカーがあれば、両活性でないときはロイヤル攻撃をしない
    starGuardOnly: true,    // 月の星ができた後は、守るダイスを「月の星」と「月の星に隣接している最高出目の太陽」だけにする（ほかの太陽・月は守らない）
    starStopsBuild: true,   // 月の星の隣に出目4以上の太陽がいる間は、出目上げ・盤面づくりをしない
    moonAdjMin: 3,          // 太陽に隣接している月の中にこの出目以上がなければ、月の活性は求めない（0で切る）
    sun7MergeWave: 6,       // このウェーブまで：太陽7個・召喚sun7Summons回分のSP・先頭がレーンの真ん中の手前で、待機しているなら、守りでない同じ出目の太陽どうしを合成（0で切る）
    sun7Summons: 5,
    sunIdleFromWave: 3,     // 下の sunIdleFix をこのウェーブから行う（W1〜W2の「太陽1個で止めてSPを貯める」を崩さないため3）
    w12GrowthAlways: true,  // W1〜W2：いかなるときも、先頭が2つ目の角を越えるまでは、ジョーカーで成長をコピーできれば全部コピーする（守りのジョーカーも）
    w12SpFix: true,         // W1〜W2のSPに余裕がない放置中：太陽が活性（1・4・7個）していなければ、3個以下はロイヤル・月どうし、5個以上は太陽どうしを合成（召喚しない）
    sunIdleFix: true,       // 何も打つ手がないとき、太陽が活性していなければ 召喚（空きがあれば）→ 太陽5個以上は守りでない太陽どうし／3個以下は太陽以外を合成。そろったら止める
    // ---- ここから月太陽AIのオプション ----
    prepLine: 6.0,      // 活性準備に入る先頭の雑魚の位置（レーンの真ん中＝全長12の半分）。W3以降
    earlyLine: 8.5,     // W1〜W2の活性準備（太陽4つにする）位置＝2つ目の角
    corner1: 3.5,       // 1つ目の角
    w1GoLeft: 55,       // W1：残りがこの秒数になったら（35秒経過）、角に来ていなくても盤面を広げ始める
    w2Spare: 3,         // W2：召喚この回数分のSPがあれば動かす（盤面を広げる）。なければ動かさない
    tsumiLimit: 5,      // 動かせないダイス（星＋守る太陽）がこの数を超えたら作り込みを止める（月太陽AIの4から1つ増やした）
    horizon: 10,        // 太陽の火力を比べるときの撃ち続ける秒数
    leonIdleKill: 2.0,  // 直前のボスをこの秒数以内に倒せていれば、レオン前は放置
    knightEatKill: 3.0, // （月の星も他の星もなくW4以降）直前のボスをこの秒数以内に倒せていればナイトを受ける
    puReserve: 0,       // PU後に残すSP
    freePuGoal: { shield: 5, blizzard: 3 }, // 自由枠のPU：W4の終わりからSPが余っていればこのLvまで（ほかの自由枠は従来どおり）
    growthW: 2.5,       // 成長のダイスの評価の上乗せ（出目の価値に対する倍率）
    keepJokers: 2,      // 調整用に取っておくジョーカーの数（出目3以下から）
    growthFirst: true,  // 調整用以外のジョーカーは、合成より先に成長のコピーへ回す
    resumeGap: 0,       // 活性して止めた後、先頭がラインよりこれだけ手前に戻ったら作り込みを再開（0なら再開しない）
    weakWave: 5,        // このウェーブ以降、押し返したときに火力を判定する（0で判定しない）
    resumeLine: 3.5,    // 火力の判定をする押し返しの位置（1つ目の角＝最初の縦レーンの終わり）
    weakMargin: 1.0,    // 必要な火力に掛ける係数（大きいほど作りに行きやすい。シミュレータで調整）
    capMinTime: 3,      // 火力の実測に使う最短の秒数（これより短ければ判定しない）
    startSummons: 10,   // startWave以降：召喚この回数分のSPがあるときだけ出目上げを始める（0で制限なし）
    startWave: 3,       // 上の「召喚◯回分のSPで出目上げを始める」を適用し始めるウェーブ
    keepSummons: 5,     // W3以降の出目上げ中：召喚この回数分のSPは残す（0で制限なし）
    pairFallback: 'copy', // 出目上げで良い手がないとき：'copy'＝ジョーカーで合成の組を作り、次に合成する／'off'
    pairUseReserved: false, // 上で調整用ジョーカーも使う
    pairOnlyFull: true,   // 上を盤面が埋まっているときだけにする（空きがあるときは召喚のSP待ちが正しい）
    w12GrowthCopy: true,  // W1〜W2の盤面展開：ジョーカーは成長をコピーできるなら全部コピーする
    dangerRelax: true,    // 危ない場面（下記）で守りのせいで立て直しがないときは、守りを外してもう一度探す
    idleRepair: false,    // W3以降：作り込みで打つ手がなく両活性していなければ立て直す（true＝守りを外してでも／'normal'＝守りは外さない）。試験で悪化したので切ってある
    starSunMin: 3,        // 月の星の隣の太陽を守る最低の出目（3＝出目3以上は守る。1にすると出目に関係なく守る）
    topSunMode: 'potential', // 最高火力の太陽の決め方：'potential'＝隣の月のバフ（月・太陽のクラスとLv、活性時の速度・会心・攻撃）込みで計算／'observed'＝今のバフで計算
    fpMoonGuard: false,   // 立て直しで「出目4以上の太陽の隣の月」も守る（false＝守る月は最高火力の組の月と最大出目の月だけ）
    growthMergeLine: 8.5, // 成長どうしの合成：出目上げでは使わない。立て直しでは使う。活性の手順では先頭がこの位置（2つ目の角）を越えてから
    noBuildLeft: 15,      // W3以降：通常ウェーブの残りがこの秒数以下なら出目上げを（再）開しない
    activateLeft: 10,     // W4以降：通常ウェーブの残りがこの秒数以下なら両活性させる
    jokerLast: true,      // 出目上げのジョーカーどうしの合成は、ほかに手がないときだけ。そのときも片方は残し、コピーして合成する手を先に探す
    repairMode: 'simple', // 立て直し・活性の手順：'simple'＝ユーザーの手順（下記）／'old'＝期待距離で1手ずつ選ぶ旧版
    lowSummons: 5,        // 'simple'：SPが召喚この回数分を切ったら「SPが少ない」（片方が活性していればジョーカーを使う）
    sevenTarget: false,   // 先頭が2つ目の角を越えたら太陽7個も目標にする（false＝目標は4個だけ。すでに7個なら崩さない）
    moonNeedsUse: false,  // 出目4以上の月が盤面にないときは月の活性を求めない（試験で効果なし）
    simpleDangerOld: true, // 'simple'でも、危ない場面（ボス戦・ボス後の残り・2つ目の角を越えた）は旧版の立て直しを使う（ジョーカーで即活性を優先）
    startOnce: false,     // true＝召喚startSummons回分のSPで出目上げを始めるのは試合で最初の1回だけ（false＝ウェーブごとに10回分を待つ）
    summonHyst: true,     // 出目上げの召喚：召喚startSummons回分たまったら、keepSummons回分まで続けて使う。使い切ったら、またstartSummons回分たまるまで召喚しない（ポツポツ出しを防ぐ）
    over7: false,         // 太陽が8個以上なら7個に戻すのも立て直しの目標にする
    highJokerGrowth: 4,   // 月の星がなければ、危ない場面以外はいつでも、この出目以上のジョーカーで成長をコピーする（0で切る）
    sunWaitFix: true,     // SPを貯めていて動かさないとき、太陽が活性していなければ太陽どうしの合成（5個以上）・出目1・2のジョーカーで太陽をコピー
    knightRules: true,    // ナイトの変換後：1回目は合成の禁止つきでユーザーの手順（月の星が出ていれば何としてでも）。2回目でライフ3なら合成の禁止つき
    pairMaxUrg: 1,        // 上を urgency がこの値以下のときだけにする（0＝先頭がレーンの真ん中の1.5手前まで）
  },

  create(ctx) {
    const O = ctx.options;
    const NB = ctx.info.board.neighbors;
    const ASN = !!(O.asnMode && msrIsAsn(ctx.info));   // 暗殺対面
    const INFO = {};
    for (const d of ctx.info.deck) INFO[d.type] = d;
    const DECK = ctx.info.deck.map(d => d.type);
    const CD = (ctx.info.cfg && ctx.info.cfg.cd) || 1600;
    const SUN_OK = [4, 7];   // 太陽の活性（1個の活性は弱いので数えない）
    // 立て直しの目標：基本は4個。7個を目指すのは、先頭の雑魚が2つ目の角を越えていて、7個のほうが手数が少ないときだけ
    let sunTargets = [4];
    let over7Now = false;   // 動かさない判断の前の立て直しだけ：太陽8個以上は7個に戻すのも目標
    let dangerNow = false;  // repairDanger の中（simpleDangerOld のとき旧版の立て直しを使う）
    let leadPos = 0;        // 先頭（ボス戦中はボス）の位置。成長どうしの合成の解禁に使う
    let banPairs = null;    // 立て直しで合成を禁止する種類（ナイトの変換後：成長どうし・ジョーカーどうし）
    const banned = (b, a) => !!(banPairs && b[a.from] && b[a.to] && b[a.from].type === b[a.to].type && banPairs.has(b[a.from].type));
    // 成長どうしの合成：出目上げ・盤面展開・隣接づくりでは使わない（ジョーカーで成長をコピーするのはよい）。
    //   立て直しでは使ってよい。活性の手順では先頭（ボス戦はボス）が2つ目の角を越えてから
    const jokerPair = (b, a) => b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === 'joker';
    const isGrowthPair = (b, a) => !!(b[a.from] && b[a.from].type === 'growth' && b[a.to] && b[a.to].type === 'growth');
    // 立て直しでの成長どうしの合成：立て直しはいつでもよい。活性の手順（activation）は2つ目の角を越えてから
    const growthOkInRepair = activation => !activation || leadPos >= O.growthMergeLine;
    const MOON_OK = [3, 5, 7];

    // HP表（仕様書の式。エンジンの RD.tableHP と同じ）
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = w => (w === 1 ? 100 : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const baseHP = w => { let s = 0; for (let k = 1; k < w; k++) s += waveK(k) * dHP(k); return s; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);

    // 試合中に持つ状態
    const S = {
      wave: 0,
      frozenWave: 0,       // このウェーブは活性して止めた
      lastBossKill: 99,    // 直前のボスを倒すのにかかった秒
      bossSeen: null,      // ボス戦中のボスID
      bossElapsed: 0,
      eatKnight: null,     // このウェーブのナイトを受けるか（決めたら固定）
      idleReason: null,    // 直前に出した「何もしない理由」
      buildWave: 0,        // 出目上げを始めたウェーブ
      started: false,      // 出目上げを一度始めた（startOnce）
      spending: false,     // 召喚10回分たまって、5回分まで使っている途中（summonHyst）
      pair: null,          // ジョーカーで作った合成の組（ダイスID）。次の判断で合成する
      fixPair: null,       // 立て直しの手がないときにジョーカーで作った組（次の判断で合成する）
      weakWave: 0,         // このウェーブは火力不足と判定して作り込みを再開した
      judgedAt: -1,        // 火力を判定した時刻（同じ押し返しで何度も判定しない）
      // 火力の実測：活性して止めている間に、敵のHPがどれだけ減ったか
      prevHp: new Map(), prevT: null, prevLife: null,
      cap: { dmg: 0, time: 0 },
      // 到着の実測：このウェーブに出てきた雑魚の数
      seen: new Set(), waveT0: 0,
      judgeOk: false,      // このウェーブの最後の火力の判定が「足りている」
      // ロイヤル攻撃（ウェーブごと）：started＝始めた（召喚10回分の条件を解除）／stopped＝SPで終えた／gaveUp＝手がなく諦めた
      royal: { started: false, stopped: false, gaveUp: false },
      firedWave: 0,        // ロイヤルのペアを最後に合成したウェーブ（R の判定用）
      fHist: [],           // 相手の先頭の位置の履歴（D の判定用）
      asnDone: new Map(),  // 暗殺対面：避けた暗殺（予告のキー → 避けたときの対象のダイスID）
    };

    // ---------- 盤面の道具 ----------
    const count = (b, t) => b.reduce((n, d) => n + (d && d.type === t ? 1 : 0), 0);
    const dist = (c, set) => Math.min(...set.map(x => Math.abs(c - x)));
    const lv = (obs, t) => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 1; };

    function moonRate(obs, pips, active) {
      // 月の速度バフ（月仕様書の式）
      const c = (INFO.moon && INFO.moon.cls) || 10;
      let r = (0.07 + 0.01 * (c - 7)) * pips + 0.02 * (lv(obs, 'moon') - 1);
      if (active) r *= 1.03;
      return Math.min(0.95, r);
    }
    function mainMoon(b) {
      let best = null;
      b.forEach((d, i) => { if (d && d.type === 'moon' && (!best || d.pips > best.pips)) best = { i, pips: d.pips }; });
      return best;
    }
    // 主力の月のマス（守る月）：
    //   ・最高火力の太陽に接している月のうち、出目が最大のもの（今の火力を支えている月）
    //   ・盤面で出目が最大の月（次に太陽を隣に置きたい月）
    //   それ以外の月は数合わせとして合成してよい
    function mainMoonCells(b, obs) {
      const m = mainMoon(b); if (!m) return [];
      const out = new Set([m.i]);
      // 同じ出目の最大の月が複数あるなら、太陽が隣にいるものを優先
      let bs = -1;
      b.forEach((d, i) => {
        if (!d || d.type !== 'moon' || d.pips !== m.pips) return;
        const sc = NB[i].reduce((a, j) => a + (b[j] && b[j].type === 'sun' ? b[j].pips * b[j].pips : 0), 0);
        if (sc > bs) { bs = sc; out.clear(); out.add(i); }
      });
      if (obs) {
        const t = topSun(obs, b);
        if (t >= 0) {
          let sup = -1;
          for (const j of NB[t]) if (b[j] && b[j].type === 'moon' && (sup < 0 || b[j].pips > b[sup].pips)) sup = j;
          if (sup >= 0) out.add(sup);
        }
      }
      return [...out];
    }
    // 太陽1つの火力（horizon秒撃ち続けたときの累積ダメージの目安）
    function sunPower(obs, d, b) {
      const sunAct = SUN_OK.concat([1]).includes(count(b, 'sun'));
      const buf = d.buffs || { spd: 0, atk: 0, crit: 0.05 };
      const iv = (sunAct ? 0.4 : 1.2) / d.pips * (1 - Math.min(0.95, buf.spd));
      const N = O.horizon / iv;
      const s = (d.state && d.state.stage) || 0;
      const hits = N + 0.55 * (N * s + N * N / 2);
      const base = 1 + 0.2 * (lv(obs, 'sun') - 1);
      const crit = buf.crit || 0.05;
      return hits * base * (1 + (buf.atk || 0)) * ((1 - crit) + crit * CD / 100);
    }
    // 太陽1つの火力（活性させた後の見込み）：隣の月のうち出目が最大のものからバフを受けるとして計算する
    //   月の速度バフは月のクラスとLv（活性時×1.03、上限95%）、会心率＋5%×出目、攻撃力＋10%×出目（活性時）
    //   太陽は活性時の基礎間隔0.4秒、攻撃力は太陽のクラスとLvから。horizon秒撃ち続けたときの累積ダメージ
    function sunPotential(obs, b, i) {
      const d = b[i];
      let mp = 0;
      for (const j of NB[i]) if (b[j] && b[j].type === 'moon') mp = Math.max(mp, b[j].pips);
      const spd = mp ? moonRate(obs, mp, true) : 0;
      const crit = 0.05 + 0.05 * mp, atkB = 0.10 * mp;
      const sc = (INFO.sun && INFO.sun.cls) || 10;
      const atk = 35 + 5 * (sc - 7) + 11 * (lv(obs, 'sun') - 1);
      const iv = 0.4 / d.pips * (1 - spd);
      const N = O.horizon / iv;
      const hits = N + 0.55 * N * N / 2;
      return hits * atk * (1 + atkB) * ((1 - crit) + crit * CD / 100);
    }
    function topSun(obs, b) {
      let best = -1, bp = -1;
      b.forEach((d, i) => { if (d && d.type === 'sun') { const p = O.topSunMode === 'observed' ? sunPower(obs, d, b) : sunPotential(obs, b, i); if (p > bp) { bp = p; best = i; } } });
      return best;
    }
    // 守る太陽：最高火力の太陽＋主力の月（出目4以上）に接する出目4以上の太陽
    // 月の星ができた後（starGuardOnly）：守る太陽は「月の星に隣接している最高出目の太陽」1個だけ
    const starCells = b => b.map((d, i) => (d && d.type === 'moon' && d.pips === 7 ? i : -1)).filter(i => i >= 0);
    function starTopSun(b) {
      let best = -1;
      for (const s of starCells(b)) for (const j of NB[s]) if (b[j] && b[j].type === 'sun' && (best < 0 || b[j].pips > b[best].pips)) best = j;
      return best;
    }
    const starMode = b => !!O.starGuardOnly && starCells(b).length > 0;
    function protectedSuns(obs, b, forTsumi = false) {
      if (starMode(b)) { const t = starTopSun(b); return new Set(t >= 0 ? [t] : []); }
      const set = new Set();
      const t = topSun(obs, b); if (t >= 0) set.add(t);
      const m = mainMoon(b);
      if (m && m.pips >= 4) for (const mi of mainMoonCells(b, obs)) for (const j of NB[mi]) {
        const d = b[j]; if (d && d.type === 'sun' && d.pips >= 4) set.add(j);
      }
      // 月の星の隣の太陽は、出目に関係なく守る（隣接づくりで置いた太陽を立て直しで消さない）
      if (!forTsumi) b.forEach((d, i) => { if (d && d.type === 'moon' && d.pips === 7) for (const j of NB[i]) if (b[j] && b[j].type === 'sun' && b[j].pips >= O.starSunMin) set.add(j); });
      return set;
    }
    // 調整用ジョーカー：出目の低いもの（3以下）から n 個。出目の高いジョーカーは成長・隣接づくりに回す
    function reservedJokers(b, n, preferPips) {
      const js = b.map((d, i) => (d && d.type === 'joker' && d.pips <= 3 ? i : -1)).filter(i => i >= 0);
      js.sort((x, y) => {
        const px = preferPips && preferPips.has(b[x].pips) ? 0 : 1, py = preferPips && preferPips.has(b[y].pips) ? 0 : 1;
        return px - py || b[x].pips - b[y].pips;
      });
      return new Set(js.slice(0, n));
    }
    // 守る月：月の星ができた後は月の星だけ（ほかの月は守らない）。それまでは主力の月（出目4以上のとき）
    function guardMoons(obs, b) {
      if (starMode(b)) return starCells(b);
      const m = mainMoon(b);
      return m && m.pips >= 4 ? mainMoonCells(b, obs) : [];
    }
    function guard(obs, b) {
      // 守るダイス：主力の月・守る太陽・調整用ジョーカー
      const g = protectedSuns(obs, b);
      for (const i of guardMoons(obs, b)) g.add(i);
      const sunPips = new Set(b.filter(d => d && d.type === 'sun').map(d => d.pips));
      const nKeep = O.keepJokers;
      for (const i of reservedJokers(b, nKeep, obs.wave <= 2 ? sunPips : null)) g.add(i);
      return g;
    }
    // 詰み：動かせないダイス（星＋守る太陽、重複は1つ）が上限を超えた
    function tsumi(obs, b) {
      const s = protectedSuns(obs, b, true);
      b.forEach((d, i) => { if (d && d.pips === 7) s.add(i); });
      return s.size > O.tsumiLimit;
    }

    // ---------- 盤面の評価（作り込み用） ----------
    // urgency：0（ウェーブ序盤）〜1（先頭がレーンの真ん中）。活性が崩れる減点の重さ
    function evalBoard(obs, b, urgency) {
      const m = mainMoon(b);
      const mp = m ? m.pips : 0;
      let v = 0;
      if (mp >= 4) {
        // 作り込みでは「活性させた後の強さ」で比べる（崩れる心配は urgency の減点だけで見る）
        const Vm = p => 1 / (1 - moonRate(obs, p, true));
        v += 2 * Vm(mp) * Vm(mp);                        // 最高出目の月（隣に太陽が来れば2乗で効く）
        b.forEach((d, i) => {                             // 太陽ごとに、隣の月（出目4以上）のうち最も強いもの
          if (!d || d.type !== 'sun') return;
          let best = 0;
          for (const j of NB[i]) if (b[j] && b[j].type === 'moon' && b[j].pips >= 4) best = Math.max(best, b[j].pips);
          if (best) { const V = Vm(best); v += V * V * d.pips * d.pips * (d.pips >= 4 ? 1 : 0.3); }
        });
      } else if (mp > 0) v += 1.5 * mp * mp;
      for (const d of b) {
        if (!d) { v += 0.4; continue; }                   // 空きマス＝次の召喚の余地
        v += 0.3 * Math.pow(2, d.pips - 1) * (1 + 0.15 * (d.pips - 1)); // 高い出目ほど少し得（合成すると上がる）
        if (d.type === 'growth' && d.pips < 7) v += O.growthW * Math.pow(2, d.pips - 1); // 成長は先で育つ（召喚なしで出目が上がる）
        if (d.type === 'sun' && mp < 4) v += 0.5 * d.pips * d.pips;
      }
      return v;
    }
    const clone = b => b.map(d => (d ? Object.assign({}, d) : null));

    // ---------- 操作の候補 ----------
    function mergeCands(obs, g) {
      return obs.legal.acts.filter(a => a.result === 'merge' && !g.has(a.from) && !g.has(a.to));
    }
    function copyCands(obs) { return obs.legal.acts.filter(a => a.result === 'copy'); }
    const opAct = (a, obs, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    const opSummon = note => ({ ops: [{ op: 'summon' }], more: true, note });

    // 合成・召喚の結果は種類がランダム（デッキから均等）。期待値で評価する
    function expMerge(obs, b, a, f) {
      let s = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; s += f(nb); }
      return s / DECK.length;
    }
    // 結果の分布（活性までの距離が0になる確率つき）
    function distMerge(b, a, f) {
      let e = 0, p0 = 0;
      for (const t of DECK) { const nb = clone(b); nb[a.from] = null; nb[a.to] = { type: t, pips: b[a.to].pips + 1 }; const v = f(nb); e += v; if (v === 0) p0++; }
      return { e: e / DECK.length, p0: p0 / DECK.length };
    }
    function distSummon(b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let e = 0, p0 = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; const v = f(nb); e += v; if (v === 0) p0++; n++; }
      return { e: e / n, p0: p0 / n };
    }
    function expSummon(obs, b, f) {
      const em = b.map((d, i) => (d ? -1 : i)).filter(i => i >= 0);
      if (!em.length) return null;
      let s = 0, n = 0;
      for (const i of em) for (const t of DECK) { const nb = clone(b); nb[i] = { type: t, pips: 1 }; s += f(nb); n++; }
      return s / n;
    }
    function applyCopy(b, a) { const nb = clone(b); nb[a.from] = { type: b[a.to].type, pips: b[a.from].pips }; return nb; }

    // ---------- 活性 ----------
    function actDist(b, needMoon) {
      const sc = count(b, 'sun');
      // すでに4か7で活性していれば崩さない。8個以上は7個に戻すのが最短なので7も目標に入れる
      const ds = SUN_OK.includes(sc) ? 0 : dist(sc, sc > 7 && (O.over7 || over7Now) ? [4, 7] : sunTargets);
      return ds + (needMoon ? dist(count(b, 'moon'), MOON_OK) : 0);
    }
    function isActive(b, needMoon) { return actDist(b, needMoon) === 0; }

    // 活性の立て直し：期待距離が最も小さくなる操作を1つ選ぶ
    //   コピーで確定して活性になるなら最優先（「最後をコピーにすると安心」）
    //   それ以外は 召喚 → 合成 → コピー の順で、期待距離が下がるもの
    // 盤面からコピーできる組（ジョーカー → 同じ出目の別種）
    function copiesOn(b) {
      const out = [];
      b.forEach((a, i) => { if (a && a.type === 'joker') b.forEach((c, j) => { if (c && c.type !== 'joker' && c.pips === a.pips) out.push({ from: i, to: j, result: 'copy' }); }); });
      return out;
    }
    // urgent=false のときはジョーカーのコピーを使わない（ジョーカーは成長・隣接づくりに回す）
    // ユーザーの手順（repairMode 'simple'）
    //   目標は太陽4・月3か5（すでに7で活性していれば崩さない）
    //   ジョーカーは「SPが召喚lowSummons回分（5回分）を切った」かつ「月か太陽の片方が活性している」ときだけ使う
    //   1) ジョーカーを使ってよいとき：もう片方をジョーカーでそろえる
    //   2) 太陽が5個以上：太陽どうしを合成（出目の低い組から）
    //   3) 空きがあれば召喚 → 4) 埋まったら合成（太陽が4個以下なら太陽どうしは合成しない）→ 3) に戻る
    //   5) ジョーカーを使ってよいときだけ、ジョーカーでコピーして合成の組を作る
    function repairSimple(obs, needMoon, tag, relax, activation) {
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      const cur = f1(b);
      if (cur === 0) return null;
      const sc = count(b, 'sun'), mc = count(b, 'moon');
      const sunOk = SUN_OK.includes(sc), moonOk = !needMoon || MOON_OK.includes(mc);
      const full = !b.some(d => !d);
      // SPが少ない＝召喚lowSummons回分（5回分）のラインを切った（召喚できないときも含む）
      const low = !obs.legal.summon || obs.sp < costN(obs.summonCost, O.lowSummons);
      // ジョーカーを使ってよいのは「SPが少ない」かつ「月か太陽の片方が活性している」ときだけ
      const jokerOk = low && (sunOk || moonOk);
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      if (!relax) for (const i of guardMoons(obs, b)) g2.add(i);
      // 召喚 → 合成の流れでは、ジョーカーどうしは合成しない
      const merges = obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !jokerPair(b, a) && !banned(b, a) && (!isGrowthPair(b, a) || (growthOkInRepair(activation) && !banned(b, a))));
      // 1) SPが少なく、片方が活性している：ジョーカーでもう片方をそろえる
      if (jokerOk) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (!['sun', 'moon'].includes(b[a.to].type)) continue;
          const v = f1(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `${tag}：SPが少なく片方が活性しているので、ジョーカーで${b[bc.a.to].type === 'sun' ? '太陽' : '月'}をそろえる`);
      }
      // 2) 太陽が5個以上：太陽どうしを合成（出目の低い組から）
      if (!sunOk && sc > 4) {
        let bs = null;
        for (const a of merges) if (b[a.from].type === 'sun' && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `${tag}：太陽が${sc}個なので太陽どうしを合成`);
      }
      // 3) 空きがあれば召喚
      if (!full && obs.legal.summon) return opSummon(`${tag}：召喚`);
      // 4) 埋まっていれば（または召喚できなければ）合成：活性までの距離の期待値が下がるもの。太陽が4個以下なら太陽どうしは合成しない
      let bm = null;
      for (const a of merges) {
        if (b[a.from].type === 'sun' && sc <= 4) continue;
        const r = distMerge(b, a, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        const scv = r.e - r.p0;
        if (!bm || scv < bm.sc - 1e-9 || (Math.abs(scv - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc: scv };
      }
      if (bm) return opAct(bm.a, obs, `${tag}：合成`);
      // 期待値が下がる合成がなくても、埋まっていて召喚できるなら空きを作る合成（活性までの距離が悪くならないもの）
      if (full && obs.legal.summon) {
        let bz = null;
        for (const a of merges) {
          if (b[a.from].type === 'sun' && sc <= 4) continue;
          if (['sun', 'moon'].includes(b[a.from].type)) continue;
          const r = distMerge(b, a, f1);
          if (r.e > cur + 1e-9) continue;
          if (!bz || b[a.to].pips < b[bz.to].pips) bz = a;
        }
        if (bz) return opAct(bz, obs, `${tag}：埋まっているので合成して空ける`);
      }
      // 5) ジョーカーで合成の組を作る（ジョーカーを使ってよいときだけ）
      if (!jokerOk) return null;
      let bf = null;
      for (const a of copyCands(obs)) {
        if (g2.has(a.to)) continue;
        if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        const r = distMerge(applyCopy(b, a), { from: a.from, to: a.to }, f1);
        if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
        if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
      }
      return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
    }
    // 立て直しの手がすべてないとき（守りを外す前）：
    //   ア) 月が活性していなくても、ジョーカー（守りのジョーカーも）で太陽だけ活性させる（太陽4か7個になるコピー）
    //   イ) それも無理なら、ジョーカーで守りのダイス以外（太陽・月以外。ロイヤル優先）をコピーし、次の判断でその組を合成する
    function repairFallback(obs, needMoon, tag, activation) {
      const b = obs.board;
      if (!O.repairJokerFallback || isActive(b, needMoon)) return null;
      // 前の判断で作った組があれば合成する
      if (S.fixPair) {
        const P = S.fixPair; S.fixPair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to] && b[x.to].id === P.toId && b[x.from] && b[x.from].id === P.fromId);
        if (a && !banned(b, a)) return opAct(a, obs, `${tag}：ジョーカーで作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      const sc = count(b, 'sun');
      if (!SUN_OK.includes(sc)) {
        let bc = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
        if (bc) return opAct(bc, obs, `${tag}：手がないので、ジョーカー${b[bc.from].pips}で太陽だけ活性させる`);
      }
      const g = guard(obs, b);
      const rank = t => (t === 'royal' ? 0 : 1);
      let bp = null;
      for (const a of copyCands(obs)) {
        if (b[a.from].type !== 'joker' || g.has(a.to)) continue;
        const t = b[a.to].type;
        if (t === 'sun' || t === 'moon' || t === 'joker') continue;
        if (t === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue;
        if (!bp || rank(t) < rank(b[bp.to].type) || (rank(t) === rank(b[bp.to].type) && b[a.to].pips < b[bp.to].pips)) bp = a;
      }
      if (!bp) return lastResort(obs, tag);
      S.fixPair = { from: bp.from, to: bp.to, fromId: b[bp.from].id, toId: b[bp.to].id };
      return opAct(bp, obs, `${tag}：手がないので、ジョーカー${b[bp.from].pips}で${b[bp.to].type}${b[bp.to].pips}をコピーして組を作る（次に合成）`);
    }
    // 立て直しの最後の手（ジョーカーもなく、活性までの距離が縮む手が1つもないとき）：
    //   動かなければ確実に流れるので、期待値が変わらない手でも打つ
    //   ア) 空きがあって召喚できれば召喚（月・同じ出目の太陽が出る見込み）
    //   イ) 埋まっていれば、守りでない太陽・月以外のダイスどうしを合成してマスを空ける（ロイヤル優先、出目の低い組から）
    function lastResort(obs, tag) {
      if (!O.repairLastResort) return null;
      const b = obs.board;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`${tag}：手がないので召喚（月・太陽の組が出るのを待つ）`) : null;
      const g = guard(obs, b);
      const rank = t => (t === 'royal' ? 0 : 1);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (t === 'sun' || t === 'moon' || banned(b, a)) continue;
        if (!bm || rank(t) < rank(b[bm.from].type) || (rank(t) === rank(b[bm.from].type) && b[a.to].pips < b[bm.to].pips)) bm = a;
      }
      return bm ? opAct(bm, obs, `${tag}：手がないので${b[bm.to].type}${b[bm.to].pips}どうしを合成してマスを空ける（次に召喚）`) : null;
    }
    function repair(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      const r = repair0(obs, needMoon, tag, urgent, relax, activation);
      if (r || relax) return r;   // 守りを外した立て直しの後には入れない（守りを外す前に行う）
      return repairFallback(obs, needMoon, tag, activation);
    }
    function repair0(obs, needMoon, tag, urgent = true, relax = false, activation = false) {
      if (O.repairMode === 'simple' && !dangerNow) return repairSimple(obs, needMoon, tag, relax, activation);
      const b = obs.board;
      const f1 = nb => actDist(nb, needMoon);
      // 2手目にコピーで合わせられる分まで見る（「片方を召喚か合成で、もう片方をコピーで」）
      // コピーは2回まで先読み
      const f = (nb, depth = 2) => {
        let m = f1(nb); if (m === 0 || depth === 0) return m;
        for (const a of copiesOn(nb)) if (['sun', 'moon'].includes(nb[a.to].type)) m = Math.min(m, f(applyCopy(nb, a), depth - 1));
        return m;
      };
      if (f1(b) === 0) return null;
      const copies = urgent ? copyCands(obs).filter(a => ['sun', 'moon'].includes(b[a.to].type)) : [];
      for (const a of copies) if (f1(applyCopy(b, a)) === 0) return opAct(a, obs, `${tag}：コピーで活性`);
      const cands = [];
      if (obs.legal.summon) { const r = distSummon(b, f); if (r) cands.push(Object.assign(r, { pr: 0, r: opSummon(`${tag}：召喚`) })); }
      // 守る太陽・主力の月・火力になっている月（出目4以上の太陽の隣の月）は崩さない。調整用ジョーカーは合成に使ってよい
      const g2 = new Set(relax ? [] : [...protectedSuns(obs, b)]);
      if (!relax) for (const i of guardMoons(obs, b)) g2.add(i);
      if (!relax && O.fpMoonGuard) b.forEach((d, i) => { if (d && d.type === 'moon' && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4)) g2.add(i); });
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && !g2.has(a.from) && !g2.has(a.to) && !banned(b, a) && (!isGrowthPair(b, a) || growthOkInRepair(activation))))
        cands.push(Object.assign(distMerge(b, a, f), { pr: b[a.from].type === 'moon' ? 0.5 : 1, r: opAct(a, obs, `${tag}：合成`) }));
      for (const a of copies) { const v = f(applyCopy(b, a)); cands.push({ e: v, p0: v === 0 ? 1 : 0, pr: 2, r: opAct(a, obs, `${tag}：コピー`) }); }
      // 期待距離が下がるもの、または（悪くならずに）活性できる確率があるもの
      const good = cands.filter(c => c.e < f1(b) - 1e-9 || (c.e <= f1(b) + 1e-9 && c.p0 > 0));
      if (!good.length) {
        // 打てる手がないとき：ジョーカーで同じ出目のダイス（種類は問わない）をコピーして合成できる組を作る。
        // 次の判断で、その組の合成を含めて立て直しの手順を最初から探し直す
        if (!urgent) return null;
        let bf = null;
        for (const a of copyCands(obs)) {
          if (g2.has(a.to)) continue;                      // 守るダイスとは組にしない
          if (b[a.to].type === 'growth' && (!growthOkInRepair(activation) || (banPairs && banPairs.has('growth')))) continue; // 活性の手順では成長の組は2つ目の角まで作らない
          const nb = applyCopy(b, a);
          const r = distMerge(nb, { from: a.from, to: a.to }, f);
          if (!(r.e < f1(b) - 1e-9 || (r.e <= f1(b) + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bf || sc < bf.sc) bf = { a, sc };
        }
        return bf ? opAct(bf.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bf.a.to].type}${b[bf.a.to].pips}）`) : null;
      }
      // ランダムな手（月どうしの合成→その他の合成・召喚）を先に、確定するコピーは最後に
      good.forEach(c => { c.score = c.e - c.p0; });
      good.sort((x, y) => (x.score - y.score) || (x.pr - y.pr));
      const best = good[0];
      if (best.pr === 2) { const alt = good.find(c => c.pr < 2 && c.score <= best.score + 1e-9); if (alt) return alt.r; }
      return good[0].r;
    }

    // 活性を切る（ナイトを受けるため）。確実に太陽の活性を崩せる操作
    function breakActive(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (!SUN_OK.concat([1]).includes(sc)) return null;
      for (const a of copyCands(obs)) {
        const nb = applyCopy(b, a);
        if (![1, 4, 7].includes(count(nb, 'sun'))) return opAct(a, obs, 'ナイトを受ける：活性を切る（コピー）');
      }
      const ps = protectedSuns(obs, b);
      for (const a of obs.legal.acts.filter(a => a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to))) {
        // 太陽−2、+1は1/5。4→2か3、7→5か6で必ず崩れる
        return opAct(a, obs, 'ナイトを受ける：活性を切る（太陽どうしを合成）');
      }
      if (obs.legal.summon) return opSummon('ナイトを受ける：活性を切る（召喚）'); // 確実ではない
      return null;
    }

    // ---------- より高い月への隣接づくり ----------
    // 最高火力の太陽が接している月より出目の高い月（出目4以上）があれば、その月の隣に太陽を作る
    function seekAdjacency(obs, g, tag, inBuild) {
      const b = obs.board;
      const m = mainMoon(b); if (!m || m.pips < 4) return null;
      const t = topSun(obs, b);
      let support = 0;
      if (t >= 0) for (const j of NB[t]) if (b[j] && b[j].type === 'moon') support = Math.max(support, b[j].pips);
      if (m.pips <= support) return null;
      // 隣に出目4以上の太陽がすでにいる最高出目の月があれば、それで足りている
      const targets = b.map((d, i) => (d && d.type === 'moon' && d.pips === m.pips ? i : -1)).filter(i => i >= 0);
      if (targets.some(i => NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4))) return null;
      const adj = new Set(); for (const i of targets) for (const j of NB[i]) adj.add(j);
      const note = s => `${tag}：月${m.pips}の隣に太陽を作る（${s}）`;
      // ア) 隣のジョーカーで太陽をコピー（出目の高いものから）
      let bc = null;
      for (const a of copyCands(obs)) if (adj.has(a.from) && b[a.to].type === 'sun' && (!bc || b[a.from].pips > b[bc.from].pips)) bc = a;
      if (bc) return opAct(bc, obs, note('コピー'));
      // イ) 隣が空いていれば召喚（空きマスのどこかに出るので、隣に出る確率は 隣の空き÷全部の空き）
      if ((inBuild ? canSummonBuild(obs) : obs.legal.summon) && [...adj].some(j => !b[j])) return opSummon(note('召喚'));
      // ウ) 隣のマスに向けて合成（1/5で太陽。出目の高い組から）
      let bm = null;
      for (const a of mergeCands(obs, g)) if (adj.has(a.to) && b[a.to].type !== 'moon' && !isGrowthPair(b, a) && (!bm || b[a.to].pips > b[bm.to].pips)) bm = a;
      if (bm) return opAct(bm, obs, note('合成'));
      // エ) 隣のマスの太陽以外を、別のマスへ合成して空ける
      for (const a of mergeCands(obs, g)) if (adj.has(a.from) && !adj.has(a.to) && b[a.from].type !== 'sun' && b[a.from].type !== 'moon' && !isGrowthPair(b, a)) return opAct(a, obs, note('隣を空ける'));
      return null;
    }

    // ---------- SPの貯金（W3以降の作り込みだけ） ----------
    // 今の召喚コスト c から、あと5回召喚できる分（c + (c+10) + … + (c+40) = 5c + 100）を残す
    const costN = (c, n) => n * c + 5 * n * (n - 1);   // 今のコスト c から n 回召喚する合計（c + (c+10) + …）
    const reserve5 = obs => obs.wave >= 3 ? costN(obs.summonCost, O.keepSummons) : 0;
    // 出目上げを始める条件：召喚10回分（c + … + (c+90) = 10c + 450）のSPがある
    const need10 = obs => costN(obs.summonCost, O.startSummons);
    const canSummonBuild0 = obs => obs.legal.summon && obs.sp - obs.summonCost >= reserve5(Object.assign({}, obs, { summonCost: obs.summonCost + 10 }));
    // ヒステリシス：10回分たまったら使い始め、5回分を切るところまで続けて使う。切ったら、また10回分たまるまで召喚しない
    function canSummonBuild(obs) {
      if (!O.summonHyst || obs.wave < O.startWave) return canSummonBuild0(obs);
      if (!S.spending && obs.sp >= need10(obs)) S.spending = true;
      if (S.spending && !canSummonBuild0(obs)) S.spending = false;
      return S.spending && canSummonBuild0(obs);
    }

    // ---------- 作り込み ----------
    function build(obs, tag, urgency) {
      const b = obs.board, g = guard(obs, b);
      const early = obs.wave <= 2;
      const ev = nb => evalBoard(obs, nb, urgency);
      const base = ev(b);
      const full = !b.some(d => !d);
      // 0) より高い月（特に月の星）への隣接づくり（最優先）
      if (urgency < 0.5) { const r = seekAdjacency(obs, g, tag, true); if (r) return r; }
      // 0.5) 直前にジョーカーで作った組があれば、それを合成する
      if (S.pair) {
        const P = S.pair; S.pair = null;
        const a = obs.legal.acts.find(x => x.result === 'merge' && x.from === P.from && x.to === P.to && b[x.to].id === P.toId);
        if (a) return opAct(a, obs, `${tag}：作った組を合成（${b[a.to].type}${b[a.to].pips}）`);
      }
      // 1) 召喚：期待値が下がらなければ（活性が崩れる心配が小さいうちは）出す。W3以降は5回分のSPを残す
      if (canSummonBuild(obs)) {
        const e = expSummon(obs, b, ev);
        if (e != null && e - base > -0.5) return opSummon(`${tag}：召喚`);
      }
      // 1.5) 成長のコピー（人のログで一番多い使い方）
      if (O.growthFirst) {
        let bg = null;
        for (const a of copyCands(obs)) if (!g.has(a.from) && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：コピー→成長${b[bg.to].pips}`);
      }
      // 2) 合成：盤面が埋まっているとき。ただし評価が大きく上がる合成（隣接づくりなど）はいつでも
      //    W1〜W2は盤面が埋まってからだけ（評価が大きく上がる合成も待つ）
      let best = null;
      for (const a of mergeCands(obs, g)) {
        if (early && b[a.from].type === 'sun') continue; // W1〜W2は活性している太陽に触らない
        if (isGrowthPair(b, a)) continue;               // 出目上げ・盤面展開では成長どうしは合成しない
        if (O.jokerLast && jokerPair(b, a)) continue;   // ジョーカーどうしは最後（下の 5）
        const e = expMerge(obs, b, a, ev) - base;
        if (e > 0 && (full || (!early && e >= 5)) && (!best || e > best.e)) best = { a, e };
      }
      // 3) コピー：主力の月の隣のジョーカーを太陽に／成長のコピー（出目の高いジョーカー）
      //    月へのコピーは、最高火力の太陽の隣の月が強くなるときだけ（それ以外は月の個数を崩すだけ）
      //    W1〜W2は太陽を作るためにジョーカーを使わない
      const ts = topSun(obs, b);
      const supPips = ts < 0 ? 0 : Math.max(0, ...NB[ts].map(j => (b[j] && b[j].type === 'moon' ? b[j].pips : 0)));
      let bestC = null;
      for (const a of copyCands(obs)) {
        if (g.has(a.from)) continue; // 調整用ジョーカーは使わない
        const tt = b[a.to].type;
        if (!['sun', 'moon', 'growth'].includes(tt)) continue;
        if (early && tt === 'sun') continue;
        if (tt === 'moon' && !(ts >= 0 && NB[ts].includes(a.from) && b[a.from].pips >= 4 && b[a.from].pips > supPips)) continue;
        const e = ev(applyCopy(b, a)) - base;
        if (e > 0 && (!bestC || e > bestC.e)) bestC = { a, e };
      }
      // 合成を優先。ただしコピーの方が明らかに良い（2倍超）ならコピー
      if (bestC && (!best || bestC.e > 2 * best.e)) return opAct(bestC.a, obs, `${tag}：コピー→${b[bestC.a.to].type}（評価+${bestC.e.toFixed(1)}）`);
      if (best) return opAct(best.a, obs, `${tag}：合成（評価+${best.e.toFixed(1)}）`);
      // 4) 良い手がないとき：
      //   ア)（'merge'/'both'のみ・試験用）空きマスがあっても評価が上がる合成をする
      //   イ) 盤面が埋まっていれば、ジョーカーで同じ出目のダイス（種類は問わない）をコピーして合成の組を作る。
      //       次の判断で 0.5) がその組を合成する
      const PF = O.pairFallback === true ? 'copy' : O.pairFallback;
      if (PF === 'merge' || PF === 'both') {
        let bm = null;
        for (const a of mergeCands(obs, g)) {
          if (early && b[a.from].type === 'sun') continue;
          if (isGrowthPair(b, a)) continue;
          const e = expMerge(obs, b, a, ev) - base;
          if (e > 0 && (!bm || e > bm.e)) bm = { a, e };
        }
        if (bm) return opAct(bm.a, obs, `${tag}：合成（評価+${bm.e.toFixed(1)}）`);
      }
      const pfOk = (!O.pairOnlyFull || full) && urgency <= O.pairMaxUrg;
      if (pfOk && (PF === 'copy' || PF === 'both')) {
        let bp = null;
        for (const a of copyCands(obs)) {
          if (g.has(a.to)) continue;                       // 守るダイスとは組にしない
          if (g.has(a.from) && !O.pairUseReserved) continue; // 調整用ジョーカーは（設定しない限り）使わない
          if (early && b[a.to].type === 'sun') continue;
          if (b[a.to].type === 'growth') continue;         // 成長どうしの組は作らない（成長のコピーだけなら 1.5 で行う）
          const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
          if (e > 0 && (!bp || e > bp.e)) bp = { a, e };
        }
        if (bp) S.pair = { from: bp.a.from, to: bp.a.to, toId: obs.board[bp.a.to].id };
        if (bp) return opAct(bp.a, obs, `${tag}：ジョーカーでコピーして合成の組を作る（${b[bp.a.to].type}${b[bp.a.to].pips}）`);
      }
      // 5) ジョーカーどうしの合成しか残っていないとき：片方は残し、もう片方で守るダイス以外をコピーして合成する。
      //    コピーできるダイスがなければ、ジョーカーどうしを合成する（盤面が埋まっているときだけ）
      if (O.jokerLast && full) {
        const jp = obs.legal.acts.filter(a => a.result === 'merge' && jokerPair(b, a));
        if (jp.length) {
          const inPair = new Set(); for (const a of jp) { inPair.add(a.from); inPair.add(a.to); }
          let bc = null;
          for (const a of copyCands(obs)) {
            if (!inPair.has(a.from) || g.has(a.to)) continue;
            const tt = b[a.to].type;
            if (tt === 'growth' || (early && tt === 'sun')) continue; // 成長どうしの組は作らない
            const e = expMerge(obs, applyCopy(b, a), { from: a.from, to: a.to }, ev) - base;
            if (!bc || e > bc.e) bc = { a, e };
          }
          if (bc) { S.pair = { from: bc.a.from, to: bc.a.to, toId: obs.board[bc.a.to].id };
            return opAct(bc.a, obs, `${tag}：ジョーカーどうししかないので、片方で${b[bc.a.to].type}${b[bc.a.to].pips}をコピーして合成する`); }
          let bj = null;
          for (const a of jp) { if (g.has(a.from) && g.has(a.to)) continue; const e = expMerge(obs, b, a, ev) - base; if (!bj || e > bj.e) bj = { a, e }; }
          if (bj && bj.e > 0) return opAct(bj.a, obs, `${tag}：ジョーカーどうしを合成（ほかに手がない）`);
        }
      }
      return null;
    }

    // W1〜W2：盤面を広げる。埋まるまでは召喚だけ、埋まってから合成（太陽には触らない・ジョーカーで太陽を作らない）
    function expand(obs, tag) {
      // ジョーカーは成長をコピーできるなら全部コピーする（調整用も含む。出目の高いジョーカーから）
      if (O.w12GrowthCopy) {
        let bg = null;
        for (const a of copyCands(obs)) if (obs.board[a.to].type === 'growth' && obs.board[a.to].pips < 7 && (!bg || obs.board[a.from].pips > obs.board[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `${tag}：ジョーカーで成長${obs.board[bg.to].pips}をコピー`);
      }
      const full = !obs.board.some(d => !d);
      if (!full) return obs.legal.summon ? opSummon(`${tag}：召喚`) : null;
      return build(obs, tag, 0);
    }

    // ---------- 火力の判定（W5以降） ----------
    // 毎回の観測で、雑魚のHPの減り（倒した雑魚は残りHPを全部）と、新しく出てきた雑魚を数える
    function track(obs) {
      if (obs.wave !== S.wave) return; // 切り替わりは decideInner で
      const now = new Map();
      for (const e of obs.enemies) if (!e.bossLike) {
        now.set(e.id, e.hp);
        if (!S.seen.has(e.id)) S.seen.add(e.id);
      }
      if (obs.phase === 'wave' && S.frozenWave === obs.wave && S.prevT != null) {
        // 活性して止めている間だけ、火力の実測に入れる（ゴールした雑魚がいた区間は入れない）
        if (obs.life === S.prevLife) {
          let d = 0;
          for (const [id, hp] of S.prevHp) { const h = now.get(id); d += h == null ? hp : Math.max(0, hp - h); }
          S.cap.dmg += d; S.cap.time += obs.t - S.prevT;
        }
      }
      S.prevHp = now; S.prevT = obs.t; S.prevLife = obs.life;
    }
    // 次のウェーブを今の盤面で耐えられるか
    //   実測の火力（止めている間の、1秒あたりに削ったHP）と、
    //   必要な火力（次のウェーブ終盤の雑魚1体のHP × このウェーブの1秒あたりの到着数 × 係数）を比べる
    function judgePower(obs) {
      if (S.cap.time < O.capMinTime) return null;
      const have = S.cap.dmg / S.cap.time;
      const el = Math.max(1, obs.t - S.waveT0);
      const rate = S.seen.size / el;
      const w = obs.wave + 1;
      const hp = tableHP(w, waveK(w));
      const need = hp * rate * O.weakMargin;
      return { weak: have < need, have, need, rate };
    }
    const fmt = n => (n >= 1e8 ? (n / 1e8).toFixed(2) + '億' : n >= 1e4 ? (n / 1e4).toFixed(1) + '万' : Math.round(n) + '');

    // ---------- パワーアップ ----------
    function powerUp(obs, reserve = 0) {
      const b = obs.board;
      const can = new Set(obs.legal.powerUp || []);
      const cost = t => { const d = obs.deck.find(x => x.type === t); return d && d.puCost != null ? d.puCost : Infinity; };
      const ok = t => can.has(t) && obs.sp - cost(t) >= Math.max(O.puReserve, reserve);
      const m = mainMoon(b);
      if (lv(obs, 'sun') < 3 && ok('sun')) return 'sun';
      if (m && m.pips >= 4) {
        if (lv(obs, 'moon') < 5 && ok('moon')) return 'moon';
        if (lv(obs, 'sun') < 5 && ok('sun')) return 'sun';
      }
      // 自由枠：盾・吹雪は W4 の終わり（ボス戦以降）から、SPが余っていれば（召喚5回分を残して）目標Lvまで
      const w4End = obs.wave >= 5 || (obs.wave === 4 && obs.phase !== 'wave');
      if (w4End) for (const t of DECK) {
        const goal = (O.freePuGoal || {})[t]; if (!goal) continue;
        if (lv(obs, t) < goal && ok(t) && obs.sp - cost(t) >= costN(obs.summonCost, O.keepSummons)) return t;
      }
      if (m && m.pips >= 4)
        for (const t of DECK) if (!['moon', 'sun', 'growth', 'joker', 'royal'].includes(t) && lv(obs, t) < 5 && ok(t) && obs.sp > 5000) return t;
      return null;
    }

    // ---------- 判断 ----------
    // 何もしないときは理由をメモに出す（同じ理由が続く間は1回だけ）
    function idle(reason) {
      if (S.idleReason === reason) return null;
      S.idleReason = reason;
      return { ops: [], note: reason };
    }
    // 何もしないが、後ろの判断（立て直しなど）にも進ませない
    const hold = reason => Object.assign(idle(reason) || { ops: [] }, { hold: true });

    // ---------- ロイヤル攻撃（月太陽ロイヤル基本AIで追加） ----------
    const TL = ctx.info.trackLength || 12;
    const isRoyalPair = (b, a) => a.result === 'merge' && b[a.from] && b[a.to] && b[a.from].type === 'royal' && b[a.to].type === 'royal';
    const royalPairs = obs => obs.legal.acts.filter(a => isRoyalPair(obs.board, a)).sort((p, q) => obs.board[q.from].pips - obs.board[p.from].pips);
    // 相手の先頭の位置を毎回記録する（陰陽ロイヤルAIと同じ）
    function trackOpp(obs) {
      const opp = obs.opponent;
      if (opp && obs.phase === 'wave' && opp.phase === 'wave' && obs.timeLeft != null) {
        S.fHist.push({ t: obs.t, pos: opp.front ? opp.front.progress * TL : 0 });
        while (S.fHist.length && S.fHist[0].t < obs.t - O.dWindow) S.fHist.shift();
      } else if (obs.phase !== 'wave') S.fHist = [];
    }
    // 相手の判定（陰陽ロイヤルAIの 'D' と同じ）
    //   D = (相手の先頭からゴールまでの距離) − (ウェーブの残り時間 × 先頭の位置の5秒の移動平均速度)。D ≥ 0 なら打つ
    //   R = (相手の先頭からゴールまでの距離) − (ウェーブの残り時間 × 通常モンスターの速さ)。このウェーブでまだ打っていなくて R > 0 なら打たない
    //   相手の先頭が2つ目の角を越えていたら打たない。ウェーブ開始5秒は判断しない
    //   相手がいない（練習）ときは判定しない
    function oppCheck(obs) {
      const opp = obs.opponent;
      if (!opp) return { ok: true, txt: '' };
      if (obs.t - S.waveT0 < O.dSkip) return { ok: false };
      const pos = opp.front ? opp.front.progress * TL : 0;
      if (O.stopPastPos != null && opp.front && pos > O.stopPastPos) return { ok: false };
      if (opp.phase !== 'wave' || S.fHist.length < 2) return { ok: false };
      const h0 = S.fHist[0], h1 = S.fHist[S.fHist.length - 1];
      const v = (h1.pos - h0.pos) / Math.max(1e-6, h1.t - h0.t);
      const D = (TL - pos) - obs.timeLeft * v;
      const R = (TL - pos) - obs.timeLeft * O.normalSpeed;
      const txt = `D=${D.toFixed(1)} R=${R.toFixed(1)}`;
      if (D < 0) return { ok: false, txt };
      if (O.reachCheck && R > 0 && S.firedWave !== obs.wave) return { ok: false, txt };
      return { ok: true, txt };
    }
    // 月の星に出目4以上の太陽が隣接して両活性しているなら、このウェーブまで何もしない（ロイヤル攻撃もしない）
    //   6.0.5：W10まで／6.5.0：W8まで（複合はHPの仕様のバージョンで決める）
    const VER = ctx.info.version === 'mix' ? (ctx.info.hpSpec || '6.5.0') : (ctx.info.version || '6.0.5');
    const starIdleWave = () => (O.starIdleUntil || {})[VER] ?? (VER === '6.0.5' ? 10 : 8);
    function starIdle(obs, b) {
      if (!O.starIdleUntil || obs.wave > starIdleWave()) return false;
      const done = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4));
      return done && isActive(b, true);
    }
    // 相手のデッキに月・太陽・成長・ジョーカーが入っていれば、こちらが両活性していないときはロイヤル攻撃をしない
    const OPP_MS = (() => { const od = (ctx.info.opponentDeck || []).map(d => d.type); return ['moon', 'sun', 'growth', 'joker'].every(t => od.includes(t)); })();
    // 月の星の隣接が完了した後（月の星の隣に出目4以上の太陽がいる）の、相手の月の条件
    //   ア) 相手のデッキに月があるとき、相手の盤面に出目5以上の月がなければ打たない（20ウェーブ以降はその限りではない）
    //   イ) 相手が月太陽のとき、相手の盤面に攻撃速度バフ90%以上の月がなければ打たない
    //       バフ＝(0.07＋0.01×(クラス−7))×出目＋0.02×(Lv−1)、活性していれば×1.03、上限95%（エンジンの月と同じ式。相手のクラス・Lv・活性で計算）
    const OPP_INFO = Object.fromEntries((ctx.info.opponentDeck || []).map(d => [d.type, d]));
    const OPP_MOON = !!OPP_INFO.moon;
    function oppMoonBlock(obs, b) {
      const starDoneNow = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4));
      const opp = obs.opponent;
      if (!starDoneNow || !opp || !opp.board) return false;
      const moons = opp.board.filter(d => d && d.type === 'moon');
      if (O.oppMoonPipsMin && OPP_MOON && obs.wave <= O.oppMoonPipsUntil && !moons.some(d => d.pips >= O.oppMoonPipsMin)) return true;
      if (O.oppMoonSpdMin && OPP_MS) {
        const c = OPP_INFO.moon.cls || 10;
        const L = ((opp.deck || []).find(d => d.type === 'moon') || {}).lv || 1;
        const act = (OPP_INFO.moon.activeCounts || [3, 5, 7]).includes(moons.length);
        const spd = p => Math.min(0.95, ((0.07 + 0.01 * (c - 7)) * p + 0.02 * (L - 1)) * (act ? 1.03 : 1));
        if (!moons.some(d => spd(d.pips) >= O.oppMoonSpdMin - 1e-9)) return true;
      }
      return false;
    }
    // 次の召喚で、召喚 royalStopSummons 回分のSPを切る
    const royalStopLine = obs => obs.sp - obs.summonCost < costN(obs.summonCost + 10, O.royalStopSummons);
    // ロイヤル攻撃：上から順に確認する
    function royalAttack(obs, needMoon, frontPos, tag) {
      if (!O.royalAttack) return null;
      const R = S.royal, b = obs.board, tl = obs.timeLeft;
      if (R.stopped || R.gaveUp || obs.phase !== 'wave' || tl == null) return null;
      // 1) 詰んでいればしない
      if (tsumi(obs, b)) return null;
      // 2) 残り45秒より多ければ始めない　3) 召喚10回分のSPがなければ始めない（始めたら解除）
      if (!R.started) {
        if (tl > O.royalStartMax) return null;
        if (obs.sp < costN(obs.summonCost, O.royalStartSummons)) return null;
      } else if (royalStopLine(obs)) {
        // 4) 召喚5回分のSPに差し掛かったらやめる（このウェーブ中は再開しない）
        R.stopped = true;
        ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：召喚${O.royalStopSummons}回分のSPに差し掛かったのでロイヤル攻撃をやめる`);
        return null;
      }
      // 5) 活性判断（W4以降の残り10秒の両活性）・立て直し判断（活性していない）があればしない
      if (obs.wave >= 4 && tl <= O.activateLeft) return null;
      if (!isActive(b, needMoon)) return null;
      if (O.oppMoonsunBoth && OPP_MS && !isActive(b, true)) return null;   // 相手が月太陽：両活性のときだけ打つ
      if (starIdle(obs, b)) return null;
      if (oppMoonBlock(obs, b)) return null;
      // 6) 残り15秒を切っていれば始めない
      if (!R.started && tl < O.royalStartMin) return null;
      // 始める条件：相手の先頭が1つ目の角を越えていない（相手の火力が十分）。始めた後はこの条件では止めない
      const opp0 = obs.opponent;
      if (!R.started && opp0 && opp0.front && opp0.front.progress * TL > O.oppFrontLine) return null;
      // 相手の判定（移動平均の D・R、2つ目の角）は始めた後も毎回見る
      const oc = oppCheck(obs); if (!oc.ok) return null;

      const g = guard(obs, b);
      const note = s => `ロイヤル攻撃（${tag}）：${s}${oc.txt ? `（${oc.txt}）` : ''}`;
      const begin = () => { if (!R.started) { R.started = true; ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：ロイヤル攻撃を始める（${tag}${oc.txt ? ' ' + oc.txt : ''}）`); } };
      // ジョーカーでロイヤルをコピーする手（useReserved：守りのジョーカーを使う）
      const royalCopy = useReserved => {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker' || b[a.to].type !== 'royal' || g.has(a.from) !== useReserved) continue;
          // 守りのジョーカー以外は高い出目のロイヤルから／守りのジョーカーは出目の高い方
          if (!bc || (useReserved ? b[a.from].pips > b[bc.from].pips : b[a.to].pips > b[bc.to].pips)) bc = a;
        }
        return bc;
      };
      // ア) 盤面のロイヤルをジョーカーでコピー
      let a = royalCopy(false);
      if (a) { begin(); return opAct(a, obs, note(`ジョーカー${b[a.from].pips}でロイヤルをコピー`)); }
      // イ) ロイヤルのペアを合成（高い出目から）
      const pairs = royalPairs(obs);
      if (pairs.length) { begin(); return opAct(pairs[0], obs, note(`ロイヤル${b[pairs[0].from].pips}のペアを合成`)); }
      // ウ) 空きがあれば召喚（召喚できるようになるのを待つ）
      if (O.royalSummon && b.some(d => !d)) {
        if (!obs.legal.summon) return null;
        begin(); return opSummon(note('召喚'));
      }
      // エ) 守りのジョーカーのうち、ロイヤルをコピーできる出目の高い方でコピー
      a = royalCopy(true);
      if (a) { begin(); return opAct(a, obs, note(`守りのジョーカー${b[a.from].pips}でロイヤルをコピー`)); }
      // オ) 守りのダイス以外の月どうしを合成（出目の低い組から）
      let bm = null;
      for (const x of mergeCands(obs, g)) if (b[x.from].type === 'moon' && b[x.to].type === 'moon' && (!bm || b[x.to].pips < b[bm.to].pips)) bm = x;
      if (bm) { begin(); return opAct(bm, obs, note(`守り以外の月${b[bm.to].pips}どうしを合成`)); }
      // カ) どれもできなければ、このウェーブは諦める
      R.gaveUp = true;
      ctx.log(`W${obs.wave} 残り${tl.toFixed(0)}秒：ロイヤル攻撃の手がないので、このウェーブは諦める`);
      return null;
    }
    // ロイヤル攻撃のためにPUで使わずに残すSP
    function royalReserve(obs) {
      const R = S.royal;
      if (!O.royalAttack || R.stopped || R.gaveUp || obs.phase !== 'wave') return 0;
      if (R.started) return obs.summonCost + costN(obs.summonCost + 10, O.royalStopSummons);
      if (obs.timeLeft != null && obs.timeLeft < O.royalStartMin) return 0;
      return costN(obs.summonCost, O.royalStartSummons);
    }
    // ナイトを受ける判断（ボス戦の判断と同じ式）
    const willEatKnight = (obs, starDone, moonStar, otherStar) =>
      obs.bossType === 'knight' && !starDone && (obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill);
    // ナイトを受けるとき：残り5秒で、ロイヤルのペアを1組ずつ合成（召喚しない）し、太陽の活性が切れていなければ次のペアへ。
    //   ペアを打ち切っても太陽が活性していれば、活性が切れるまで召喚する。切れたら何もせずナイトを待つ
    function knightRoyal(obs, frontPos, starDone, moonStar, otherStar) {
      if (!O.knightRoyal || obs.phase !== 'wave' || obs.timeLeft == null || obs.timeLeft > O.knightRoyalLeft) return null;
      if (!willEatKnight(obs, starDone, moonStar, otherStar) || frontPos >= O.knightRoyalMaxFront) return null;
      const b = obs.board;
      if (![1, 4, 7].includes(count(b, 'sun'))) return hold('ナイト前：太陽の活性が切れたのでナイトを待つ');
      const pairs = royalPairs(obs);
      if (pairs.length) return opAct(pairs[0], obs, `ナイト前（残り${obs.timeLeft.toFixed(1)}秒）：ロイヤル${b[pairs[0].from].pips}のペアを合成`);
      if (obs.legal.summon && b.some(d => !d)) return opSummon('ナイト前：ロイヤルを打ち切っても太陽が活性しているので召喚');
      return hold('ナイト前：ロイヤルのペアも召喚もないのでボスを待つ');
    }
    function pu(o, reserve = 0) {
      const t = powerUp(o, reserve);
      return t ? { ops: [{ op: 'powerUp', type: t }], more: true, note: `PU ${t}` } : null;
    }

    // 危ない場面の立て直し：ふつうの立て直しがなければ、守り（守る太陽・主力の月）を外してもう一度探す
    //   危ない場面＝ボス戦（わざと受けるナイト以外）／通常ウェーブで先頭が2つ目の角（8.5）を越えた
    function repairDanger(obs, needMoon, tag, activation = false) {
      dangerNow = !!O.simpleDangerOld;
      try { return repair(obs, needMoon, tag, true, false, activation) || (O.dangerRelax ? repair(obs, needMoon, tag + '（守りを外す）', true, true, activation) : null); }
      finally { dangerNow = false; }
    }
    // ナイトの変換後の立て直し
    //   変換で月の星が出ている：何としてでも活性させる（危ない場面の立て直し、禁止なし）
    //   1回目の変換：ユーザーの手順で、成長どうし・ジョーカーどうしの合成は禁止
    //   2回目以降の変換：ライフが3なら成長どうし・ジョーカーどうしの合成は禁止（立て直しは危ない場面のもの）
    function repairKnight(obs, needMoon, tag, moonStar) {
      const B = obs.boss;
      if (!O.knightRules || moonStar || B.cast < 1) return repairDanger(obs, needMoon, tag);
      if (B.cast === 1) {
        banPairs = new Set(['growth', 'joker']);
        try { return repair(obs, needMoon, tag + '（1回目の変換）') || (O.dangerRelax ? repair(obs, needMoon, tag + '（1回目の変換・守りを外す）', true, true) : null); }
        finally { banPairs = null; }
      }
      if (obs.life >= 3) {
        banPairs = new Set(['growth', 'joker']);
        try { return repairDanger(obs, needMoon, tag + '（2回目の変換・ライフ3）'); } finally { banPairs = null; }
      }
      return repairDanger(obs, needMoon, tag);
    }
    // SPを貯めていて動かさないとき（召喚10回分待ち・停止中）：太陽が活性していなければ
    //   ア) 太陽が5個以上で、守る太陽以外の太陽どうしの組があれば合成（出目の低い組から）
    //   イ) 出目1・2のジョーカー1個のコピーで太陽が活性するならコピー
    function sunWaitFix(obs) {
      if (!O.sunWaitFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        if (bs) return opAct(bs, obs, `SP待ち：太陽が${sc}個なので守る太陽以外の太陽どうしを合成`);
      }
      let bc = null;
      for (const a of copyCands(obs)) if (b[a.from].pips <= 2 && b[a.to].type === 'sun' && SUN_OK.includes(count(applyCopy(b, a), 'sun')) && (!bc || b[a.from].pips < b[bc.from].pips)) bc = a;
      return bc ? opAct(bc, obs, `SP待ち：ジョーカー${b[bc.from].pips}で太陽をコピーして活性`) : null;
    }
    // 月の星がないとき：出目4以上のジョーカーは成長をコピーする（危ない場面以外はいつでも）
    function highJokerGrowthCopy(obs, moonStar) {
      if (!O.highJokerGrowth || moonStar) return null;
      const b = obs.board;
      let bg = null;
      for (const a of copyCands(obs)) if (b[a.from].pips >= O.highJokerGrowth && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
      return bg ? opAct(bg, obs, `ジョーカー${b[bg.from].pips}で成長をコピー（月の星なし）`) : null;
    }

    // W6まで：太陽が7個あり、召喚5回分のSPがあり、先頭のモンスターがレーンの真ん中まで行っておらず、それでも待機しているなら、
    //   守りでない同じ出目の太陽どうしを合成する（出目の低い組から）
    function sun7Merge(obs) {
      if (!O.sun7MergeWave || obs.over || obs.phase !== 'wave' || obs.wave > O.sun7MergeWave) return null;
      const b = obs.board;
      if (count(b, 'sun') !== 7) return null;
      if (obs.sp < costN(obs.summonCost, O.sun7Summons)) return null;
      const front = obs.enemies.find(e => e.kind !== 'boss');
      if (front && front.pos >= O.prepLine) return null;
      const ps = protectedSuns(obs, b);
      let bs = null;
      for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
      return bs ? opAct(bs, obs, `待機中：太陽が7個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
    }

    // 何も打つ手がないとき、太陽が活性していなければ（通常ウェーブだけ）。太陽がそろった（4か7個）ところで止める
    //   ア) 盤面が空いていれば1個ずつ召喚
    //   イ) 太陽が5個以上：守りでない太陽どうしを合成（出目の低い組から）
    //   ウ) 太陽が3個以下：太陽以外の、守りでないダイスどうしを合成（出目の低い組から）
    // W1〜W2：SPに余裕がなく放置しているとき、太陽が活性していなければ合成だけで太陽をそろえる（召喚はしない）。
    //   太陽が活性（1・4・7個）したら止める
    //   ア) 太陽が3個以下：盤面のロイヤルどうし・月どうしを合成（出目の低い組から）
    //   イ) 太陽が5個以上：太陽どうしを合成（出目の低い組から）
    function w12SpFix(obs, tag) {
      if (!O.w12SpFix) return null;
      const b = obs.board, sc = count(b, 'sun');
      if ([1, 4, 7].includes(sc)) return null;
      const g = guard(obs, b);
      let bm = null;
      for (const a of mergeCands(obs, g)) {
        const t = b[a.from].type;
        if (b[a.to].type !== t) continue;
        if (sc <= 3 ? !['royal', 'moon'].includes(t) : t !== 'sun') continue;
        if (!bm || b[a.to].pips < b[bm.to].pips) bm = a;
      }
      if (!bm) return null;
      const nm = { royal: 'ロイヤル', moon: '月', sun: '太陽' }[b[bm.to].type];
      return opAct(bm, obs, `${tag}：SPに余裕がないので、太陽が${sc}個のうちに${nm}${b[bm.to].pips}どうしを合成（召喚はしない）`);
    }

    function sunIdleFix(obs) {
      if (!O.sunIdleFix || obs.over || obs.phase !== 'wave' || obs.wave < O.sunIdleFromWave) return null;
      const b = obs.board, sc = count(b, 'sun');
      if (SUN_OK.includes(sc)) return null;
      if (b.some(d => !d)) return obs.legal.summon ? opSummon(`打つ手なし：太陽が${sc}個で活性していないので召喚`) : null;
      if (sc >= 5) {
        const ps = protectedSuns(obs, b);
        let bs = null;
        for (const a of obs.legal.acts) if (a.result === 'merge' && b[a.from].type === 'sun' && b[a.to].type === 'sun' && !ps.has(a.from) && !ps.has(a.to) && (!bs || b[a.to].pips < b[bs.to].pips)) bs = a;
        return bs ? opAct(bs, obs, `打つ手なし：太陽が${sc}個なので守りでない太陽${b[bs.to].pips}どうしを合成`) : null;
      }
      if (sc <= 3) {
        const g = guard(obs, b);
        let bm = null;
        for (const a of mergeCands(obs, g)) if (b[a.from].type !== 'sun' && b[a.to].type !== 'sun' && (!bm || b[a.to].pips < b[bm.to].pips)) bm = a;
        return bm ? opAct(bm, obs, `打つ手なし：太陽が${sc}個なので${b[bm.to].type}${b[bm.to].pips}どうしを合成（太陽を出す）`) : null;
      }
      return null;
    }

    // ---------- 暗殺対面（月太陽AI 2026-11-17 と同じ） ----------
    // 活性：エンジンが渡す活性状態（各ダイスの active）。無ければ個数で判断
    const SUN_ALL = (INFO.sun && Array.isArray(INFO.sun.activeCounts) && INFO.sun.activeCounts.length) ? INFO.sun.activeCounts.slice() : [1, 4, 7];
    function engineActive(b, type) { const d = b.find(x => x && x.type === type); return d && typeof d.active === 'boolean' ? d.active : null; }
    function asnSunActive(b) {
      const sc = count(b, 'sun'), ea = engineActive(b, 'sun');
      if (ea == null) return SUN_OK.includes(sc);
      return ea && sc !== 1;
    }
    // 太陽の活性：太陽1個はW1〜W2だけ数える（asnSunOneEarly）
    function asnSunOn(obs) {
      const b = obs.board, sc = count(b, 'sun');
      if (sc === 1) { const ea = engineActive(b, 'sun'); return !!(O.asnSunOneEarly && obs.wave <= 2 && (ea == null ? SUN_ALL.includes(1) : ea)); }
      return asnSunActive(b);
    }
    const SUN_GOAL = SUN_OK.filter(n => n > 1).length ? SUN_OK.filter(n => n > 1) : [4];
    const asnDist = nb => { const c = count(nb, 'sun'); return SUN_OK.includes(c) ? 0 : dist(c, SUN_GOAL); };
    const hasBounty = d => !!(d && d.bounty > 0);
    const fixDir = r => r;   // （月太陽AIの合成の向きの印。このAIには合成の向きの優先がないので何もしない）
    // 合成の向きの優先：真ん中の列の中央3マス → 4隅以外 → 4隅。同じなら左、次に上（暗殺避けの合成先の選び方に使う）
    const CORNERS = new Set([0, 4, 10, 14]);
    const cellRank = i => { const r = Math.floor(i / 5), c = i % 5; return (r === 1 && c >= 1 && c <= 3 ? 0 : CORNERS.has(i) ? 2 : 1) * 100 + c * 10 + r; };
    // 暗殺を避ける（対象マス cell）
    function asnDodge(obs, cell, late, sunOn) {
      const b = obs.board, d = b[cell], sc = count(b, 'sun');
      if (!d || d.type === 'sun') return null;
      if (d.type === 'joker') {
        const cps = copyCands(obs).filter(a => a.from === cell);
        const pick = f => cps.filter(f).sort((x, y) => b[y.to].pips - b[x.to].pips || x.to - y.to)[0] || null;
        const isT = (a, t) => b[a.to].type === t;
        let a = null;
        if (sc === 2 || sc === 3) a = pick(x => isT(x, 'sun'));
        else if (sc === 1 || sc === 4) a = pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || (sc === 1 ? pick(x => isT(x, 'sun')) : null);
        else a = (SUN_OK.includes(sc + 1) ? pick(x => isT(x, 'sun')) : null) || pick(x => !isT(x, 'moon') && !isT(x, 'sun')) || pick(x => !isT(x, 'moon'));
        if (a) return fixDir(opAct(a, obs, `暗殺対面：ジョーカーに暗殺。${b[a.to].type}${b[a.to].pips}をコピーして避ける（太陽${sc}個）`));
        const m = obs.legal.acts.find(x => x.from === cell && x.result === 'merge');
        return m ? fixDir(opAct(m, obs, '暗殺対面：ジョーカーに暗殺。ジョーカーどうしを合成して避ける')) : null;
      }
      let ok;
      if (!late) ok = obs.sp >= costN(obs.summonCost, 2) || b.some(j => j && j.type === 'joker' && b.some(s => s && s.type === 'sun' && s.pips === j.pips));
      else ok = !sunOn;
      if (!ok) return null;
      const cand = obs.legal.acts.filter(x => x.from === cell && x.result === 'merge' && b[x.to].type === d.type && (late || !hasBounty(b[x.to])))
        .sort((x, y) => cellRank(x.to) - cellRank(y.to));
      return cand.length ? fixDir(opAct(cand[0], obs, `暗殺対面：${d.type}${d.pips}に暗殺。同じ種類へ合成して避ける${late ? '（懸賞金の縛りなし）' : ''}`)) : null;
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
        if (S.asnDone.has(key) && S.asnDone.get(key) !== d.id) continue;   // もう避けた（対象のダイスが変わった）
        const r = asnDodge(obs, cell, late, sunOn);
        if (r) { S.asnDone.set(key, d.id); return r; }
      }
      // 2. 太陽が活性していれば止める
      if (sunOn) return (O.asnPu ? pu(obs) : null) || idle('暗殺対面：太陽が活性しているので止める');
      // 3. 召喚して活性を狙う
      if (obs.legal.summon) return opSummon('暗殺対面：太陽が活性していないので召喚');
      // 4. 召喚できない：ジョーカーで太陽をコピー → ジョーカー・成長以外のダイスどうしを合成（2つ目の角の手前は、相手の盤面に暗殺がないときだけ・懸賞金の付いていないダイスだけ）
      const oppAsn = !!(obs.opponent && obs.opponent.board && obs.opponent.board.some(x => x && x.type === 'assassin'));
      const freeOk = i => late || !hasBounty(b[i]);
      const cur = asnDist(b);
      if (late || !oppAsn) {
        let bc = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker' || b[a.to].type !== 'sun' || !freeOk(a.from)) continue;
          const v = asnDist(applyCopy(b, a));
          if (v < cur && (!bc || v < bc.v || (v === bc.v && b[a.from].pips < b[bc.a.from].pips))) bc = { a, v };
        }
        if (bc) return opAct(bc.a, obs, `暗殺対面：ジョーカー${b[bc.a.from].pips}で太陽をコピー${late ? '（2つ目の角を越えた）' : ''}`);
        let bm = null;
        for (const a of obs.legal.acts) {
          if (a.result !== 'merge' || !freeOk(a.from) || !freeOk(a.to)) continue;
          const t = b[a.from].type;
          if (t === 'joker' || t === 'growth' || b[a.to].type === 'joker' || b[a.to].type === 'growth') continue;
          const r = distMerge(b, a, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          const sc = r.e - r.p0;
          if (!bm || sc < bm.sc - 1e-9 || (Math.abs(sc - bm.sc) < 1e-9 && b[a.to].pips < b[bm.a.to].pips)) bm = { a, sc };
        }
        if (bm) return opAct(bm.a, obs, `暗殺対面：${b[bm.a.to].type}${b[bm.a.to].pips}どうしを合成して太陽を狙う${late ? '（2つ目の角を越えた）' : ''}`);
      }
      if (late) {
        // ジョーカーでほかのダイスをコピーして合成の組を作る（次の判断で上の合成が拾う）
        let bf = null;
        for (const a of copyCands(obs)) {
          if (b[a.from].type !== 'joker') continue;
          const t = b[a.to].type; if (t === 'growth' || t === 'moon') continue;
          const r = distMerge(applyCopy(b, a), { from: a.from, to: a.to }, asnDist);
          if (!(r.e < cur - 1e-9 || (r.e <= cur + 1e-9 && r.p0 > 0))) continue;
          if (!bf || r.e - r.p0 < bf.sc) bf = { a, sc: r.e - r.p0 };
        }
        if (bf) return opAct(bf.a, obs, `暗殺対面：ジョーカーで${b[bf.a.to].type}${b[bf.a.to].pips}をコピーして合成の組を作る`);
        const jj = obs.legal.acts.find(a => a.result === 'merge' && jokerPair(b, a));
        if (jj) return opAct(jj, obs, '暗殺対面：ジョーカーどうしを合成して太陽を狙う');
      }
      return idle(late ? '暗殺対面：活性の手がない' : oppAsn ? '暗殺対面：召喚できない（相手の盤面に暗殺があるので動かない）' : '暗殺対面：召喚できない（打つ手なし）');
    }

    function decideInner(obs) {
      if (obs.over) return null;
      const b = obs.board;
      // 月の活性：太陽に隣接している月に出目 moonAdjMin 以上がなければ求めない（すべての場面）
      const moonNextToSun = b.some((d, i) => d && d.type === 'moon' && d.pips >= O.moonAdjMin && NB[i].some(j => b[j] && b[j].type === 'sun'));
      const needMoon = obs.wave >= 3 && (!O.moonNeedsUse || b.some(d => d && d.type === 'moon' && d.pips >= 4)) && (!O.moonAdjMin || moonNextToSun);
      const front = obs.enemies.find(e => e.kind !== 'boss');
      const frontPos = front ? front.pos : 0;
      const moonStar = b.some(d => d && d.type === 'moon' && d.pips === 7);
      // 完成した月の星：月の星の隣に出目4以上の太陽がいる
      const starDone = b.some((d, i) => d && d.type === 'moon' && d.pips === 7 && NB[i].some(j => b[j] && b[j].type === 'sun' && b[j].pips >= 4));
      const otherStar = b.some(d => d && d.type !== 'moon' && d.pips === 7);
      // 先頭（ボス戦中はボス）が2つ目の角を越えていれば、太陽7個の活性も目標に入れる
      const lead = obs.enemies.length ? obs.enemies[0].pos : 0;
      sunTargets = O.sevenTarget && lead >= 8.5 ? [4, 7] : [4];
      leadPos = lead;

      // ウェーブの切り替わり
      if (obs.wave !== S.wave) {
        S.wave = obs.wave; S.frozenWave = 0; S.weakWave = 0; S.judgedAt = -1;
        S.seen = new Set(); S.waveT0 = obs.t; S.cap = { dmg: 0, time: 0 }; S.prevHp = new Map(); S.prevT = null;
        S.spending = false;
        S.judgeOk = false; S.royal = { started: false, stopped: false, gaveUp: false }; S.fHist = [];
      }
      track(obs);
      trackOpp(obs);
      // ボスの記録
      if (obs.boss) {
        if (S.bossSeen !== obs.boss.id) { S.bossSeen = obs.boss.id; S.eatKnight = null; }
        S.bossElapsed = obs.boss.elapsed;
      } else if (S.bossSeen != null) { S.lastBossKill = S.bossElapsed; S.bossSeen = null; }

      // 0. W1〜W2：いかなるときも、先頭（ボス戦はボス）が2つ目の角を越えるまでは、ジョーカーで成長をコピーできれば全部コピーする
      if (O.w12GrowthAlways && obs.wave <= 2 && lead < O.earlyLine) {
        let bg = null;
        for (const a of copyCands(obs)) if (b[a.from].type === 'joker' && b[a.to].type === 'growth' && b[a.to].pips < 7 && (!bg || b[a.from].pips > b[bg.from].pips)) bg = a;
        if (bg) return opAct(bg, obs, `W${obs.wave}：2つ目の角を越えるまではジョーカー${b[bg.from].pips}で成長をコピー`);
      }

      // 1. ボス戦
      if (obs.phase === 'boss' && obs.boss) {
        const B = obs.boss;
        // 月の星（太陽隣接済み）がなければナイトを受ける候補。隣に太陽がいない月の星は「星がある」扱い
        if (B.type === 'knight' && !starDone) {
          if (S.eatKnight == null) {
            S.eatKnight = obs.wave <= 3 || otherStar || moonStar || S.lastBossKill <= O.knightEatKill;
            ctx.log(`ナイト：${S.eatKnight ? '受ける' : '受けない'}（W${obs.wave} 星${otherStar || moonStar} 直前のボス${S.lastBossKill.toFixed(1)}s）`);
          }
          if (S.eatKnight && B.cast === 0) return breakActive(obs) || idle('ナイトを受ける：スキルを待つ');
          if (S.eatKnight && B.cast >= 1) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        }
        if (B.type === 'knight' && B.cast >= 1 && !isActive(b, needMoon)) return repairKnight(obs, needMoon, 'ナイト後の立て直し', moonStar) || idle('ナイト後：打てる立て直しなし');
        if (!isActive(b, needMoon)) return repairDanger(obs, needMoon, 'ボス戦の立て直し') || idle('ボス戦：打てる立て直しなし'); // 活性していないときはPUしない
        return pu(obs) || idle('ボス戦：活性を保って待つ');
      }
      // ボス後の残り（スネークの召喚・小ボスなど）：活性していなければ立て直す
      if (obs.phase === 'cleanup') return repairDanger(obs, needMoon, 'ボス後の残りの立て直し') || pu(obs) || idle('ボス後の残りの敵を待つ');
      if (obs.phase !== 'wave') return pu(obs) || idle('ボス抽選・相手待ち');
      // ナイトを受けるとき：残り5秒でロイヤルのペアを打って太陽の活性を切る
      { const r = knightRoyal(obs, frontPos, starDone, moonStar, otherStar); if (r) return r; }
      // 月の星がなければ、出目4以上のジョーカーは成長をコピー（危ない場面＝先頭が2つ目の角を越えた、は除く）
      if (frontPos < 8.5) { const r = highJokerGrowthCopy(obs, moonStar); if (r) return r; }

      // 2. 活性準備（W3〜：レーンの真ん中を越えた／W1〜W2：2つ目の角を越えた）
      const line = obs.wave <= 2 ? O.earlyLine : O.prepLine;
      if (frontPos >= line) {
        const tag = obs.wave <= 2 ? '活性準備（2つ目の角）' : '活性準備';
        const r = frontPos >= 8.5 ? repairDanger(obs, needMoon, tag, true) : repair(obs, needMoon, tag, true, false, true); // 活性の手順
        if (r) return r;
        if (isActive(b, needMoon)) { S.frozenWave = obs.wave; return pu(obs) || idle(`${tag}：活性済み。このウェーブは止めてSPを貯める`); }
        // 活性していないときはPUしない（立て直しの召喚に使うSPを残す）
        return idle(`${tag}：打てる立て直しなし`);
      }
      // 押し返したら（先頭がラインより resumeGap 手前まで戻ったら）作り込みを再開する
      if (S.frozenWave === obs.wave && O.resumeGap > 0 && frontPos < O.prepLine - O.resumeGap && obs.wave >= 3) S.frozenWave = 0;
      // 2.5 W5以降：1つ目の角まで押し返したら火力を判定。次のウェーブに足りなければ作り込みを再開する
      if (S.frozenWave === obs.wave && O.weakWave > 0 && obs.wave >= O.weakWave && frontPos <= O.resumeLine && S.judgedAt < 0) {
        const j = judgePower(obs);
        if (j) {
          S.judgedAt = obs.t; S.judgeOk = !j.weak;
          const msg = `火力の判定：実測${fmt(j.have)}/秒 必要${fmt(j.need)}/秒（W${obs.wave + 1}終盤の1体×到着${j.rate.toFixed(2)}体/秒×${O.weakMargin}）`;
          if (j.weak) {
            S.frozenWave = 0; S.weakWave = obs.wave; S.buildWave = obs.wave;
            ctx.log(msg + '→ 足りないので作り込みを再開');
          } else ctx.log(msg + '→ 足りているので止めたまま');
        }
      }
      if (S.frozenWave === obs.wave) {
        // 止めている間も、崩れたら（成長などで）立て直す
        const r = sunWaitFix(obs) || repair(obs, needMoon, '停止中の立て直し'); if (r) return r;
        // 月の星の隣に太陽がいなければ、止めている間でも隣接づくりは行う（最優先）
        if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '停止中', false); if (a) return a; }
        // ロイヤル攻撃：W5以降で火力が足りていると判定して止めているとき／月の星の隣に出目4以上の太陽がいるとき
        const okA = obs.wave >= O.royalFromWave && S.judgedAt >= 0 && S.judgeOk;
        if ((okA || starDone) && !starIdle(obs, b)) {
          const ra = royalAttack(obs, needMoon, frontPos, okA ? '火力が足りて停止中' : '月の星'); if (ra) return ra;
        }
        const why = S.judgedAt >= 0 ? (S.judgeOk ? '火力は足りている' : '火力不足の再判定待ち') : obs.wave >= O.weakWave && O.weakWave > 0 ? '押し返し待ち' : 'レーンの真ん中を越えた';
        return pu(obs, okA || starDone ? royalReserve(obs) : 0) || idle(`停止中：活性を保ってSPを貯める（${why}）`);
      }
      // 火力不足で再開した後、先頭がまた真ん中を越えて止めたら、次の押し返しでもう一度判定する
      if (S.weakWave === obs.wave && S.judgedAt >= 0 && frontPos > O.resumeLine) S.judgedAt = -1;

      // 3. W1
      if (obs.wave === 1) {
        const sc = count(b, 'sun');
        const go = frontPos >= O.corner1 || (obs.timeLeft != null && obs.timeLeft <= O.w1GoLeft);
        if (sc === 0 && !go) return obs.legal.summon ? opSummon('W1：太陽が出るまで召喚') : (w12SpFix(obs, 'W1') || idle('W1：SP待ち'));
        if (!go) return w12SpFix(obs, 'W1') || idle('W1：1つ目の角（または35秒）まで貯める');
        return expand(obs, 'W1：盤面を広げる') || pu(obs) || idle('W1：2つ目の角まで広げて待つ');
      }
      // 3.5 W2
      if (obs.wave === 2) {
        // W2中盤で太陽が活性していたら止める
        if (obs.timeLeft != null && obs.timeLeft <= 40 && isActive(b, false)) { S.frozenWave = 2; return pu(obs) || idle('W2中盤：太陽が活性したので止める'); }
        if (obs.sp < costN(obs.summonCost, O.w2Spare)) return w12SpFix(obs, 'W2') || pu(obs) || idle(`W2：SPに余裕がない（召喚${O.w2Spare}回分未満）ので動かさない`);
        return expand(obs, 'W2：盤面を広げる') || pu(obs) || idle('W2：2つ目の角まで広げて待つ');
      }

      // 3.9 W3以降のウェーブ終盤：残り15秒以下では出目上げを（再）開しない。W4以降の残り10秒以下は両活性させる
      if (obs.wave >= 3 && obs.timeLeft != null && obs.timeLeft <= O.noBuildLeft) {
        const late = obs.wave >= 4 && obs.timeLeft <= O.activateLeft;
        if (late && !isActive(b, needMoon)) return repair(obs, needMoon, `残り${O.activateLeft}秒：両活性`, true, false, true) || idle(`残り${O.activateLeft}秒：打てる立て直しなし`); // 活性していないのでPUしない
        // 月の星（太陽隣接済み）：始めていたロイヤル攻撃は続ける（残り15秒を切ってからは始めない。W4以降の残り10秒でやめる）
        if (starDone && O.starStopsBuild) {
          const r = sunWaitFix(obs) || repair(obs, needMoon, '月の星（太陽隣接済み）：両活性'); if (r) return r;
          if (starIdle(obs, b)) return pu(obs, reserve5(obs)) || idle(`月の星（太陽隣接済み）・両活性：W${starIdleWave()}までは何もしない`);
          const ra = royalAttack(obs, needMoon, frontPos, '月の星'); if (ra) return ra;
        }
        return sunWaitFix(obs) || pu(obs, Math.max(reserve5(obs), starDone ? royalReserve(obs) : 0)) || idle(late ? `残り${O.activateLeft}秒：両活性を保ってボスを待つ` : `残り${O.noBuildLeft}秒以下なので出目上げを始めない`);
      }

      // 4. 作り込み（W3〜）
      const res = reserve5(obs);
      const weak = S.weakWave === obs.wave; // 火力不足：放置・SP待ちの止めを飛ばす（詰みは残す）
      // 動かさない判断（詰み・月の星の守り）でも、両活性していなければ立て直しを先にする
      //   動かさないのは月の星を残してボスを倒すため。活性していなければ倒せない
      const repair7 = tag => { over7Now = true; try { return repair(obs, needMoon, tag); } finally { over7Now = false; } };
      if (tsumi(obs, b)) return repair7('詰み：活性の立て直し') || pu(obs) || idle('詰み：作り込みをやめた');
      // 月の星の隣に出目4以上の太陽がいる間：出目上げ・盤面づくりはしない。両活性を保ち、ロイヤル攻撃をする
      if (starDone && O.starStopsBuild) {
        const r = sunWaitFix(obs) || repair7('月の星（太陽隣接済み）：両活性'); if (r) return r;
        if (starIdle(obs, b)) return pu(obs, res) || idle(`月の星（太陽隣接済み）・両活性：W${starIdleWave()}までは何もしない`);
        const ra = royalAttack(obs, needMoon, frontPos, '月の星'); if (ra) return ra;
        return pu(obs, Math.max(res, royalReserve(obs))) || idle('月の星（太陽隣接済み）：出目上げ・盤面づくりを止める（両活性済み）');
      }
      if (!weak && starDone && ['leon', 'knight'].includes(obs.bossType))
        return repair7('月の星（太陽隣接済み）：レオン・ナイト前の両活性') || pu(obs) || idle('月の星（太陽隣接済み）：レオン・ナイト前は動かさない（両活性済み）');
      if (!weak && obs.bossType === 'leon' && !(moonStar && !starDone) && isActive(b, needMoon) && S.lastBossKill <= O.leonIdleKill && obs.wave >= 3) return pu(obs) || idle('レオン前：火力に余裕があるので放置');
      // W5以降（startWave）：召喚10回分のSPがなければ出目上げを始めない（活性を保つ。月の星の隣接づくりはSPを使わない手だけ行う）
      if (!weak && obs.wave >= O.startWave && S.buildWave !== obs.wave && !(O.startOnce && S.started)) {
        if (obs.sp >= need10(obs)) { S.buildWave = obs.wave; S.started = true; S.spending = true; }
        else {
          const r = sunWaitFix(obs) || (O.idleRepair === true ? repairDanger(obs, needMoon, '活性の立て直し（出目上げ前）') : repair(obs, needMoon, '活性の立て直し（出目上げ前）')); if (r) return r;
          if (moonStar && !starDone) { const a = seekAdjacency(obs, guard(obs, b), '出目上げ前', false); if (a && a.ops[0].op !== 'summon') return a; }
          return pu(obs, need10(obs)) || idle(`出目上げ：召喚${O.startSummons}回分のSPが貯まるまで始めない`);
        }
      }
      const urgency = Math.max(0, Math.min(1, (frontPos - (O.prepLine - 1.5)) / 1.5));
      return build(obs, weak ? '出目上げ（火力不足）' : '出目上げ', urgency)
        || (O.idleRepair && !isActive(b, needMoon) ? (O.idleRepair === true ? repairDanger : repair)(obs, needMoon, '出目上げの手がないので両活性に戻す') : null)
        || (obs.legal.summon && !canSummonBuild(obs) ? sunWaitFix(obs) : null)
        || pu(obs, res)
        || idle(obs.legal.summon && !canSummonBuild(obs) ? (O.summonHyst ? `出目上げ：召喚${O.startSummons}回分のSPがたまるまで召喚しない` : `出目上げ：召喚${O.keepSummons}回分のSPを貯金中`) : '出目上げ：良い手なし');
    }

    return {
      decide(obs) {
        // いかなるときも、モンスター（ボスも含む）が2つ目の角を越えていなければ、成長どうしの合成を禁止する
        //   合法手から成長どうしの合成を外してから判断する（どの判断にも効く）
        if (O.growthPairLine != null && obs.legal && obs.legal.acts) {
          const lead = obs.enemies && obs.enemies.length ? Math.max(...obs.enemies.map(e => e.pos)) : 0;
          if (lead < O.growthPairLine) {
            const b0 = obs.board;
            obs = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'merge' && b0[a.from] && b0[a.to] && b0[a.from].type === 'growth' && b0[a.to].type === 'growth')) }) });
          }
        }
        // 出目7（星）のジョーカーでは、ロイヤルと成長をコピーしない（合法手から外す。どの判断にも効く）
        if (O.starJokerNoCopy && O.starJokerNoCopy.length && obs.legal && obs.legal.acts) {
          const b1 = obs.board;
          obs = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: obs.legal.acts.filter(a => !(a.result === 'copy' && b1[a.from] && b1[a.to] && b1[a.from].type === 'joker' && b1[a.from].pips === 7 && O.starJokerNoCopy.includes(b1[a.to].type))) }) });
        }
        const savedPair = S.pair, savedFix = S.fixPair;
        let r;
        if (ASN) r = asnDecide(obs);   // 暗殺対面：通常の動き（ロイヤル攻撃も）は使わない
        else {
          r = decideInner(obs);
          // 待機しているとき（W6まで・太陽7個・召喚5回分のSP・先頭がレーンの真ん中の手前）：守りでない同じ出目の太陽どうしを合成
          if (!(r && r.ops && r.ops.length)) { const m = sun7Merge(obs); if (m) r = m; }
          // 何も打つ手がないとき、太陽が活性していなければ太陽をそろえる（ナイトを受けるための待機は除く）
          if (!(r && r.ops && r.ops.length) && !(r && r.hold)) { const m = sunIdleFix(obs); if (m) r = m; }
        }
        if (r) delete r.hold;
        // 重ねる操作のドラッグ中・間隔待ちなら、重ねる操作は出さずに待つ（盤面が変わってから決め直す）
        //   作った組の記録は、この判断の前の状態に戻す（組の合成を待つだけなら記録は残す）
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.control && obs.control.actReadyIn > 1e-9) { S.pair = savedPair; S.fixPair = savedFix; return null; }
        if (r && r.ops && r.ops.length) S.idleReason = null;
        // ロイヤルのペアを合成した（＝ロイヤルを打った）ウェーブを覚える（R の判定は、まだ打っていないウェーブだけ）
        if (r && r.ops && r.ops.length && r.ops[0].op === 'act' && obs.phase === 'wave') {
          const o0 = r.ops[0], b = obs.board;
          if (o0.expect === 'merge' && b[o0.from] && b[o0.to] && b[o0.from].type === 'royal' && b[o0.to].type === 'royal') S.firedWave = obs.wave;
        }
        return r;
      },
    };
  },
});
