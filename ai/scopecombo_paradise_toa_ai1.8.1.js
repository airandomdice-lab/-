// 楽園スココンToAAI 1.8.1（AI API v1／AI_AGENT_GUIDE 1.10.0・AIRandomDicesim 3.13.1 で確認）
//   楽園スココンAI 1.7.1 をもとに、ToAさんの操作の速さ・マジシャン合わせ・合成の向きの癖を入れた版
//   1.1.0：マジシャン合わせに ToA合成・階段合成／8W以降のマジシャン前・レオン前は楽園マスのコンボを外へ／
//          ボスがレーン中央を超えたらリミット解除してコンボを作る／火力に余裕があれば、ウェーブ数と同じ回数分の召喚SPを残す
//   1.2.0：楽園マスのコンボ外しは、ボス出現の演出（intro）中だけ、ボスを貫通できそうなときだけ（スキルを受けるため）。
//          演出中の必要火力を、このウェーブのボスで数えるようにした
//   1.3.0：マジシャン合わせ（ToA合成を含む）は8W以降（magSyncFromWave）だけ。7Wまでのマジシャン戦は楽園スココンAI 1.7.1 と同じ動き
//   1.4.0：8W以降も、予告が出たときの盤面の総数（Σ2^(出目−1)）で行うかを決める。128以上なら必ず、未満は 総数/128 の確率
//          ＋出目6以上の召喚・適応1個ごとに +25%。見送った予告は楽園スココンAI 1.7.1 と同じ動き
//   1.5.0：予告が出てマジシャン合わせをしない判断（7Wまで・見送り）のときは、最初のメテオまで召喚しない制限を外して召喚する
//   1.6.0：マジシャン合わせをしない判断のときは、マジシャンの特殊操作をすべて外す（低い出目の価値下げ・低い出目同士の合成・召喚止め・
//          合成相手のいる高い出目の加点・楽園外し・総数を消す手の重み・予告マスから逃がさない・最初のメテオまで召喚しない）。
//          7Wまではマジシャン前・マジシャン戦とも外す。8W以降のマジシャン前はそのまま（判断は予告が出たときなので）。
//          マジシャン戦で予告を見送ったら、次の予告まで外す。行う判断のときはこれまでどおり
//   1.7.0：マジシャン合わせの間は、盤面で出目がいちばん高いスコープを合成に使わない（guardTopScope。予告マスにあるものは除く）
//   1.8.0：マジシャン合わせを必ず行う総数の線を 128＋ウェーブ数×magSyncWaveAdd(16) にした（後半ほど高い総数でないと行わない）。
//          線より下は 総数/線 の確率（＋出目6以上の召喚・適応1個ごとに+25%）
//          検証（スコープ15・コンボ15・適応15・召喚11・ジョーカー11・CD4000%・上限9000秒、シード1〜24の平均到達W）
//            足す値   0：マジシャン32.3 ランダム61.1 ／0.5：31.8・61.8 ／1：33.3・61.8 ／2：30.8・60.9 ／4：31.8・61.6
//                     8：35.3・60.1 ／16：45.0・61.5 ／32：45.6・— ／マジシャン合わせなし：66.3・—
//            クラス11・CD3000% のマジシャン：足す値0 16.5 → 16 22.8
//   1.8.1：足す値の既定を2に（必ず行う総数の線＝128＋ウェーブ数×2）
//
// ToA合成（マジシャン合わせのときだけ。予告マスへの合成が先）
//   出目1から、その出目で作れる組を最大まで作る（ジョーカーの使い道も含めて組の数が最大になるように決め、
//   合成に使うジョーカーを先に全部コピー → その出目を全部合成）。終わったら次の出目へ。この間は召喚しない
//   次の出目へ進むか（toaProceed）：出目2は組が2つ以上あれば進む。出目3は組があれば1/3、出目4は2/3、出目5以上は必ず進む
//     進まない（キャンセル）・組がない：出目1を召喚して出目1から最初から
//     出目2の組が2つない：出目3から上へ、組のある出目を順に合成（キャンセルなし）。どこにもなければ出目2を合成
//   階段合成：ある出目kに合成できる組があり、出目k+1から上に適応かジョーカーが続けて（段になって）あり、全部で stairMin(3) 段以上なら、
//     出目kの組を合成 → できたダイスに出目k+1の適応（ジョーカーは直前にコピー）→ k+2 … と、召喚を挟まずに合成していく
//     （出目kを合成しきって、次の出目へ進む前に調べる）
//   予告マスのダイスへの合成（下）は、ToA合成・階段合成の途中でも先に打つ
//
// そのほか（1.1.0）
//   ・8W以降（critOutFromWave）、マジシャン・レオンの出現の演出（約2秒）の間、ボス火力×1回目のスキルまでの秒（bossFirstSkill）が
//     ボスのHP予測以上（貫通できそう）なら、スキルを受けるために楽園マスの上のコンボを外へ合成する（召喚より先。相手はコンボ→適応→そのほか、左・下）。
//     貫通できそうにないなら外さない
//   ・ボス戦でボスがレーンの中央（rushPos）を超えたら、リミット解除して、召喚より先に合成でコンボを作る（盤面が埋まっていなくても打つ）
//   ・雑魚火力に余裕（F_zako/need ≥ zakoOk）があるときは、ウェーブ数と同じ回数分の召喚SP（次の召喚から数える）を残す。
//     召喚とPUに使わない。リミット解除中は残さない（spReserve）
//
// 検証（AIRandomDicesim 3.13.1・本家6.0.5・楽園Lv20・スコープ11/コンボ11/適応15/召喚11/ジョーカー11・CD3000%、練習、ボスランダム、シード1〜20の平均到達W）
//   1.7.0（既定）31.3（シード1〜40）／1.6.0 31.5／1.5.0 30.3／1.4.0 31.6／1.3.0 31.9／1.2.0 23.7／1.1.0 18.2／1.1.0の楽園マス外しなし 26.6／1.1.0の楽園マス外しなし＋マジシャン合わせなし 37.3／1.0.0 29.0
//   ・ボス固定16試合：レオン 1.2.0 28.3（1.1.0 12.3）、マジシャン 1.2.0 8.3（楽園マス外しなしだと 9.8）
//   ・マジシャン固定16試合：1.3.0 18.6（1.2.0 8.3）。マジシャン合わせなし（magSync:false）は 36.7。レオン 28.3・ナイト 28.0 は 1.2.0 と同じ
//   ・マジシャン固定48試合（シード1〜48）：1.7.0 15.7（守るスコープが合成の候補に入っていた判断は、合わせ中の判断の約26%）／1.6.0 15.3（最低9W。7Wまでに負ける試合がなくなった）／1.5.0 16.8／1.4.0 15.6／1.3.0 15.2／マジシャン合わせなし 32.9
//     8W以降の予告では盤面の総数がほとんど120〜230あり、ほぼ毎回「行う」になる
//   ・40W前後で止まっている試合は、1試合の上限（ゲーム内3000秒）に届いたもの
//   ・演出中の「貫通できそう」（ボス火力×2秒 ≥ ボスHP）は、8W以降はほとんど成り立たない（比は多くが0.2〜0.6）ので、外すことはまれ
//   ・1.2.0 まで：ToA合成は、1Wのマジシャンで盤面を出目5近くまで合成しきって3個ほどしか残らず、SP不足で2〜5Wに負ける試合があった（1.3.0 で8W以降だけに）
//
// 操作の速さ（limits。AIが自分で切り替える）
//   通常　　　　：判断 0.5秒・召喚 0.5秒・重ねる操作の間隔 0.5秒・ドラッグ 0.3秒（limitsNormal）
//   リミット解除：判断 0.1秒・召喚 0.1秒・重ねる操作の間隔 0.2秒・ドラッグ 0.2秒（limitsFast）
//   リミット解除に入るとき
//     ・危ないとき　　　：ナイト後（ナイトがスキルを1回以上使ってから、次の knightDangerWaves ウェーブが終わるまで）に、
//                         雑魚処理火力の余裕 F_zako/need が dangerRatio(1.0) を下回ったら入り、上回ったら戻す
//     ・マジシャン合わせ：マジシャン戦でメテオの予告が出たら入り、メテオが落ちたら（予告が消えたら）戻す
//     ・ボス接近　　　　：ボス戦でボスがレーンの中央を超えたら入る（ボスを倒すまで）
//
// マジシャン合わせ（ToAさん式。magSync）：8W以降（magSyncFromWave）のマジシャン戦で、メテオの予告が出ている間
//   （予告が出たときに、盤面の総数128以上なら必ず、未満は確率で行う。1.4.0）
//   1) 召喚する（最初のメテオ前に召喚を止める magHoldFirstMeteor も、予告が出たら召喚する）。1回だけで、あとはキャンセルのときだけ召喚
//   2) 予告マスのダイスに、外から合成できるペアがあれば合成する（同じ出目のジョーカーはコピーしてから合成）。
//      合成したら、そのマスのダイスにさらに合成できるものを続けて合成する（直前に合成したマスを優先）
//   3) 合成できるものがなければ、ToA合成（上）。1.0.0 の「予告マスのダイスと同じ出目を作る合成」は ToA合成に置き換えた
//   2)・3) は盤面が埋まっていなくても、点数がマイナスでも打つ。候補が複数あるときは点数 S の高い手
//
// 合成の向きの癖：同じ2つのダイスの合成で、向きによる点数の差が dirEps 以下（向きに意味がない）なら、
//   左側のマスへ合成する。左右が同じ列なら下側のマスへ合成する（左と下がぶつかったら左を優先）
//
// ----（ここから下は楽園スココンAI 1.7.1 と同じ）----
//   1.1.0：ハッキングは予告で逃げず、食らった後に合成で消す／楽園マスを高い出目にしない／
//          ジョーカー・適応を「コンボ数の素」として価値を持たせる（スコープを潰すのは適応から）／マジシャン戦は総数を消す手を高く
//   1.2.0：楽園マスの出目の上限（2）をやめ、出目6以上だけを重く減点する形に
//   1.7.1：種の既定を 'lastGainAll'（コンボが増える手は加点、0個になる合成だけ減点）に
//   1.7.0：種の価値を、その出目のコンボが0個になる合成だけの減点に変えた（同じ出目のコンボが残る手・増える手は0）
//   1.6.0：ジョーカーで適応をコピーする手を最大限ためらう（jokerToAdaptivePen）／楽園マスの出目3以上のコンボを合成に使うのを
//          ためらう（隣接スコープの出目に比例して重く）／楽園マスの出目の減点を、盤面の総数が多いほど緩める
//   1.5.0：出目1のコンボ同士を合成するとき、出目1の適応があれば必ずコンボ＋適応に変える（combo1UseAdaptive）
//   1.4.0：マジシャン戦は最初のメテオが落ちるまで召喚しない／2Wまでのレオン前は出目1コンボの合成を強制
//   1.3.0：ボス前の動き（下の「ボス前」）。出目1コンボの種の価値を上げ、出目1ジョーカーのコンボのコピー以外の手を下げた
//
// ボス前（残り秒はボス出現までの秒）
//   マジシャン前：残り magLead(15) 秒で、雑魚火力に余裕（F_zako/need ≥ zakoOk）があれば、召喚を止め、低い出目（magLowPips 以下）の価値を下げる。
//                 低い出目同士の合成は盤面が埋まっていなくても打つ。合成相手のいる高い出目は価値を上げる
//   マジシャン戦：最初のメテオの予告が出るまで召喚しない（magHoldFirstMeteor。予告が出たら召喚する＝マジシャン合わせ）
//   レオン前：残り leonLead(15) 秒。2Wまで（leonForceToWave）は、出目1コンボを使う合成を召喚より先に必ず打つ（コンボ同士→コンボ＋適応→そのほか）。5W以降（leonStopFromWave）は召喚を止め、出目1コンボを使う合成に +kLeon1（盤面が埋まっていなくても打つ）。
//             次のボスがレオンのウェーブは、出目1コンボの種の倍率 seed1Mul を使わない（咆哮で出目1は消えやすい）
//   楽園外し：レオン前・マジシャン前で、雑魚火力とボス火力の両方に余裕（≥ zakoOk・bossOk）があれば、楽園マスのコンボを外へ合成する手に +kCritOut
//   ナイト前：ボス火力の重みを knightBossMul 倍。ボス火力は「スキルで種類が変わった後、どのダイスも1/5でコンボになる」期待値で数える
//             （今の種類での値は knightActual の割合だけ）。楽園マスの出目1コンボを合成で消しても、ボス火力はほとんど下がらない
// 登録ID：scopecombo_paradise_toa（楽園スココンAI〔scopecombo_paradise〕と同時に読み込める）
// 想定デッキ：スコープ11・コンボ11・適応15・召喚11・ジョーカー11、フィールド：神々の楽園
//
// 1回の判断（1つ実行するごとに more:true で盤面を見直す）
//   1) PU：puPlan の順（SPが足りなければ後ろのPUは見ない）
//   2) 召喚：空きマスがあり、SPと召喚の間隔が許せば
//   3) 重ねる操作：合成・コピーの候補すべてに点数 S を付け、最も高い手を打つ（マジシャン合わせの間は上の 2)・3) が先）
//      盤面が埋まっていないときは notFullKeys（W1は notFullKeysEarly）の手と予告マスにかかわる手だけで、S > minScoreNotFull のとき。
//      埋まっていれば必ず最も高い手（これが詰みの処理を兼ねる）
//
// 点数 S(a) = E(a) − lowFirst×出目 + 期待値[Φ(操作後の盤面)] − Φ(今の盤面) + 手ごとの加点・減点
//   種（seedMode 'lastGainAll'）：出目k（seedMaxPips 以下）のコンボの数が c→c' になる手に、重み wk＝kSeed×(1−τ)×2^−(k−1)
//                  （出目1は seed1Mul。次のボスがレオンのウェーブは1）を掛けて
//                  増える（c'>c）：＋wk×(1/(c+1)＋…＋1/c')　　0個になる（c'＝0）：−wk　　減っても残る：0
//   E(a)：手の種類ごとのコンボ効率（options.eff）
//   合成でできる種類は抽選なので、デッキの5種それぞれの盤面で Φ を計算して平均する
//   メテオの予告は「着弾したあとの盤面」で Φ を計算する。マジシャン戦では予告マスから外へ逃がす合成はしない
//   ハッキングの予告では動かない。食らった後、ハッキングされたコンボは火力がマイナスなので合成で消す
//
// 盤面の値 Φ・火力の式は楽園スココンAI 1.7.1 と同じ（詰み度 τ・操作の余地・待ちジョーカー・楽園マス・コンボ数の素・総数・火力・マジシャン前）
RD.defineAgent('scopecombo_paradise_toa', {
  name: '楽園スココンToAAI',
  desc: '楽園スココンAI 1.7.1 をもとにしたToAさん版（1.8.1）。通常は判断0.5・召喚0.5・操作0.5・ドラッグ0.3秒。ナイト後に雑魚処理が足りないときとマジシャン合わせのときはリミット解除（判断0.1・召喚0.1・操作0.2・ドラッグ0.2秒）、ボスがレーン中央を超えたときもリミット解除してコンボを作る。8W以降のマジシャン戦は、盤面の総数が 128＋ウェーブ数×2 以上なら必ず（未満は確率で）メテオ予告が出たら召喚し、予告マスのダイスへ合成を重ね、そのあとToA合成・階段合成（出目がいちばん高いスコープは使わない）。マジシャン合わせをしない判断のとき（7Wまでと、見送った予告）はマジシャンの特殊操作をすべて外す。8W以降のマジシャン・レオン出現の演出中は、貫通できそうなら楽園マスのコンボを外へ。余裕があれば召喚SPをウェーブ数分残す。向きに意味がない合成は左・下へ。',
  options: {
    // ---- ToA版で足したもの ----
    limitsNormal: { interval: 0.5, summonInterval: 0.5, actInterval: 0.5, dragTime: 0.3 },
    limitsFast: { interval: 0.1, summonInterval: 0.1, actInterval: 0.2, dragTime: 0.2 },
    dangerRatio: 1.0,        // ナイト後、雑魚処理火力の余裕（F_zako/need）がこれを下回ったら「危ない」
    knightDangerWaves: 1,    // ナイトのスキルの後、何ウェーブ先まで「ナイト後」とみなすか（1＝次のウェーブの終わりまで）
    magSync: true,           // マジシャン合わせ（ToAさん式）
    magSyncFromWave: 8,      // マジシャン合わせ（リミット解除・予告マスへの合成・ToA合成）をするのは、このウェーブ以降。それより前は楽園スココンAI 1.7.1 と同じ
    magSyncTotalFull: 128,   // 予告が出たときの盤面の総数（Σ2^(出目−1)）がこれ以上なら必ずマジシャン合わせをする
    magSyncWaveAdd: 2,       // 必ず行う総数の線に、ウェーブ数×この値を足す（後半ほど高い総数が必要。1.8.1 で2に）
    magSyncGamma: 1,         // それ未満は 確率＝(総数/magSyncTotalFull)^magSyncGamma（1＝総数に比例）
    magSyncHighPips: 6, magSyncHighBonus: 0.25, // 出目6以上の召喚・適応が1個あるごとに、確率に +0.25
    dirEps: 0.03,            // 向きによる点数の差がこれ以下なら「向きに意味がない」→ 左・下へ合成
    toaProceed: { 3: 1 / 3, 4: 2 / 3 }, // ToA合成で次の出目へ進む確率（書いていない出目は必ず進む。出目2は組が2つ以上で進む）
    stairMin: 3,             // 階段合成をする最小の段数（出目kの組＋上に続く適応・ジョーカーの段）
    guardTopScope: true,     // マジシャン合わせの間、盤面で出目がいちばん高いスコープを合成に使わない
    critOutFromWave: 8,      // このウェーブ以降、マジシャン・レオンの出現の演出中に、貫通できそうなら楽園マスのコンボを外へ合成する
    bossFirstSkill: 2,       // ボスの1回目のスキルまでの秒（シミュレータの bossFirst。デスウェーブは cfg.deathBossFirst）
    pierceMargin: 1.0,       // ボス火力×1回目のスキルまでの秒 ≥ ボスのHP予測×この値 なら「貫通できそう」
    critOutForce: true,      // true：外へ合成する手を召喚より先に必ず打つ／false：外へ合成する手に +kCritOut（余裕の条件なし）
    rushPos: 0.5,            // ボスがレーンのこの割合を超えたら、リミット解除してコンボを作る
    spReserve: true,         // 火力に余裕があるとき、ウェーブ数と同じ回数分の召喚SPを残す
    // ---- ここから下は楽園スココンAI 1.7.1 と同じ ----
    puPlan: [[2, 'scope', 3], [4, 'scope', 5], [4, 'combo', 3], [5, 'combo', 5]],
    eff: { // 手のコンボ効率（合成は種類をアルファベット順に「+」でつなぐ。コピーは「joker>コピー先」）
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'summon+summon': 0.60, 'scope+scope': 0.50,
      'joker>summon': 0.40, 'adaptive+summon': 0.35, 'joker>scope': 0.30, 'adaptive+scope': 0.25,
      'adaptive+adaptive': 0.15, 'joker>adaptive': 0.10, 'joker+joker': 0.10, 'adaptive+joker': 0.05,
    },
    lowFirst: 0.01,
    minScoreNotFull: 0,
    Lref: 30, emptyW: 3,
    kL: 1.0, kSeed: 0.8, seedMaxPips: 4, kJoker: 0.3, kW: 0.5,
    kCrit: 1.0, critPen: [0, 0, 0, 0.05, 0.1, 0.2, 1.5, 3.0],
    kWMag: 4.0,
    kTok: 1.0, tokJoker: 1.5, tokAdaptive: 0.7,
    critMaxPips: 7,
    kFire: 4.0, kShort: 2.0, marginHi: 2.5, bossWeightMin: 0.3,
    bossHpMul: 8,
    bossKillFrac: 0.8,
    bossNeedMul: { leon: 0.5, magician: 0.5 },
    sendFactor: 1.0, inflowMul: 1.2, eAssume: 6,
    lookAhead: 20,
    magLead: 15,
    magLowPips: 2, magLow: 0.6, magPair: 0.6,
    zakoOk: 1.5,
    bossOk: 1.5,
    leonLead: 15, leonStopFromWave: 5, kLeon1: 1.5,
    combo1UseAdaptive: true,
    leonForceToWave: 2,
    magHoldFirstMeteor: true,
    kCritOut: 1.0,
    knightBossMul: 2.0, knightActual: 0.1,
    seedMode: 'lastGainAll',
    seed1Mul: 1.5,
    joker1Pen: 0.4,          // 出目1のジョーカーをコンボのコピー以外に使う手の減点
    jokerToAdaptivePen: 5.0,
    critComboMinPips: 3, critComboPen: 0.8, critComboScope: 0.25,
    critRelaxW: 64,
    magNoEscape: true,
    fullOnlyFromWave: 2,
    notFullKeysEarly: ['joker>combo', 'summon+summon', 'scope+scope', 'adaptive+combo', 'adaptive+summon'],
    notFullKeys: ['joker>combo', 'summon+summon'],
  },
  limits: o => o.limitsNormal,
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, info = ctx.info, nb = info.board.neighbors, CD = info.cfg.cd / 100;
    const TRACK = info.trackLength || 12;

    // ---- HP表（シミュレータと同じ式） ----
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = info.hpSpec === '6.5.0' ? (w => w === 1 ? 100 : 20 * (w - 1) * (w + 4) * (w + 6))
                                        : (w => w === 1 ? 100 : 100 * (w - 1) * (w + 6));
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1;
    const spawnSteps = w => Math.ceil(waveT(w) / waveDt(w));
    const bc = [0, 0];
    const baseHP = w => { while (bc.length <= w) { const pw = bc.length - 1; bc.push(bc[pw] + waveK(pw) * dHP(pw)); } return bc[w]; };
    const tableHP = (w, k) => baseHP(w) + k * dHP(w);
    const deathOn = w => info.cfg.deathWave != null && info.version !== '6.0.5' && w >= info.cfg.deathWave;
    const bossTravel = w => TRACK / (0.6 * (deathOn(w) ? 1 + (info.cfg.deathSpeedUp || 0) : 1));

    const pairKey = (x, y) => [x, y].sort().join('+');
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
    // 合成の向き：左（列が小さい）ほど、同じ列なら下（行が大きい）ほど小さい
    const dirRank = c => (c % 5) * 3 + (2 - Math.floor(c / 5));

    // ---- ToA版の状態（試合ごと） ----
    let fastWant = false, fastApplied = false; // リミット解除にしたい／いまリミット解除になっている
    let modeWhy = '';
    let knightUntil = -1;                     // このウェーブまでは「ナイト後」
    let lastSyncCell = null;                  // マジシャン合わせで直前に合成したマス
    let toa = null;                           // ToA合成の状態 {L（いまの出目）, noCancel, needSummon, stair（階段合成）}
    let syncRoll = null, syncWhy = '';        // この予告でマジシャン合わせをするか（予告が出たときに決める）
    let bossDecision = null;                  // このマジシャン戦で直前に決めたこと（null＝まだ予告なし）

    const inner = obs => {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const ctl = obs.control || {};

      // ---- 今の状況 ----
      const deckTypes = obs.deck.map(d => d.type);
      const st = t => obs.deck.find(d => d.type === t);
      const cb = st('combo'), sc = st('scope');
      const B = cb ? 10 + 10 * (cb.cls - 7) + 10 * (cb.lv - 1) : 0;
      const D = cb ? 8 + 2 * (cb.cls - 7) + (cb.lv - 1) : 0;
      const p = sc ? 0.20 + 0.03 * (sc.cls - 7) + 0.03 * (sc.lv - 1) : 0;
      const critCell = {};
      for (const q of (obs.field && obs.field.paradise) || []) critCell[q.cell] = q.crit;
      const nEnemy = Math.max(obs.enemies.length, o.eAssume);
      const drag = ctl.dragTime || 0;

      // 必要な火力と重み
      const sumHp = es => es.reduce((s, e) => s + Math.max(0, e.hp), 0);
      const etaOf = e => Math.max(0, TRACK - e.pos) / Math.max(e.speed, 0.01);
      const bossMul = t => (o.bossNeedMul && t && o.bossNeedMul[t] != null) ? o.bossNeedMul[t] : 1;
      const bossPred = (w, absorbed) => tableHP(w, spawnSteps(w)) * o.bossHpMul + absorbed;
      const inflow = (w, H) => o.inflowMul * (1 + o.sendFactor) / waveDt(w) * H;
      const Hahead = (w, el) => {
        const t = el + o.lookAhead;
        if (t < waveT(w)) return tableHP(w, clamp(Math.floor(t / waveDt(w)) + 1, 1, spawnSteps(w)));
        return tableHP(w + 1, 1);
      };
      let w = obs.wave, H, needZ, needB, wz, wb;
      const nextType = obs.nextBoss ? obs.nextBoss.type : null;
      if (obs.phase === 'wave') {
        const T = waveT(w), el = T - (obs.timeLeft || 0);
        H = Hahead(w, el);
        const backlog = sumHp(obs.enemies) / Math.max(obs.front && obs.front.eta != null ? obs.front.eta : 10, 2);
        needZ = inflow(w, H) + backlog;
        needB = bossPred(w, sumHp(obs.enemies)) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = o.bossWeightMin + (1 - o.bossWeightMin) * clamp(el / T, 0, 1);
      } else if (obs.phase === 'boss' && obs.boss) {
        const be = obs.enemies.find(e => e.id === obs.boss.id) || obs.enemies.find(e => e.bossLike);
        const others = obs.enemies.filter(e => !e.bossLike);
        H = tableHP(w + 1, 1);
        needB = Math.max(0, obs.boss.hp) / Math.max(be ? etaOf(be) : 10, 1) * bossMul(obs.boss.type);
        needZ = inflow(w + 1, H) + (others.length ? sumHp(others) / Math.max(Math.min(...others.map(etaOf)), 2) : 0);
        wb = 1; wz = 0.5;
      } else if (obs.phase === 'cleanup') {
        H = tableHP(w + 1, 1);
        needZ = inflow(w + 1, H) + sumHp(obs.enemies) / Math.max(obs.front && obs.front.eta != null ? obs.front.eta : 10, 2);
        needB = 1; wz = 1; wb = 0;
      } else if (obs.phase === 'intro') { // ボス出現の演出：このウェーブのボスに備える（1.2.0）
        H = tableHP(w + 1, 1);
        needZ = inflow(w + 1, H);
        needB = bossPred(w, sumHp(obs.enemies)) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 0.5; wb = 1;
      } else { // roll・wait：次のウェーブに備える
        w = obs.wave + 1; H = tableHP(w, 1);
        needZ = inflow(w, H);
        needB = bossPred(w, 0) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = o.bossWeightMin;
      }
      needZ = Math.max(needZ, 1); needB = Math.max(needB, 1);

      // ボスごとの場面
      const tl = obs.phase === 'wave' ? (obs.timeLeft || 0) : Infinity;
      const magNow = !!(obs.phase === 'boss' && obs.boss && obs.boss.type === 'magician');
      // マジシャンの特殊操作（マジシャン前・マジシャン戦）は、マジシャン合わせをする判断のときだけ（1.6.0）
      //   7Wまで（magSyncFromWave 前）：マジシャン前・マジシャン戦とも特殊操作なし（ふつうのウェーブと同じ）
      //   8W以降：マジシャン前は特殊操作あり。マジシャン戦は、直前の予告でマジシャン合わせを見送ったら、次の予告まで特殊操作なし
      if (!magNow) bossDecision = null;
      const magEarly = o.magSync && obs.wave < o.magSyncFromWave;
      let magSp = magNow && !magEarly && bossDecision !== false;
      let magPre = false, mag = magSp;
      const leonPre = nextType === 'leon' && tl <= o.leonLead;
      const leonStop = leonPre && obs.wave >= o.leonStopFromWave;
      const knight = (nextType === 'knight' && obs.phase !== 'boss') || !!(obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight' && obs.boss.cast === 0);
      if (knight) wb *= o.knightBossMul;
      const pc = deckTypes.includes('combo') ? 1 / deckTypes.length : 0;
      // ナイト後：ナイトがスキルを使ったら、knightDangerWaves ウェーブ先の終わりまで
      if (obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight' && obs.boss.cast >= 1)
        knightUntil = Math.max(knightUntil, obs.wave + o.knightDangerWaves);

      // ---- 盤面の表現と予告スキル ----
      const cur = obs.board.map(d => d ? { type: d.type, pips: d.pips, sealed: !!d.sealed, hacked: !!d.hacked } : null);
      const pend = (obs.pending || []).filter(q => q.kind === 'meteor');
      const early = new Set();
      for (const q of pend) if (q.in <= drag + 0.05) q.cells.forEach(i => early.add(i));
      const future = b => {
        if (!pend.length) return b;
        const f = b.slice();
        for (const q of pend) for (const i of q.cells) {
          if (!f[i]) continue;
          f[i] = null;
        }
        return f;
      };

      const canPair = (x, y) => {
        if (x.pips !== y.pips || x.sealed || y.sealed) return false;
        if (x.type === 'joker' && y.type !== 'joker') return true;
        if (y.type === 'joker' && x.type !== 'joker') return true;
        if (x.pips >= 7) return false;
        if (x.type === y.type) return x.type !== '?';
        return x.type === 'adaptive' || y.type === 'adaptive';
      };
      const room = b => {
        let pairs = 0, empty = 0;
        for (let i = 0; i < 15; i++) {
          if (!b[i]) { empty++; continue; }
          for (let j = i + 1; j < 15; j++) if (b[j] && canPair(b[i], b[j])) pairs++;
        }
        return pairs + o.emptyW * empty;
      };
      const base0 = future(cur);
      const tau = clamp(1 - room(base0) / o.Lref, 0, 1);

      // 火力
      const fire = (b, n) => {
        const A = B + D * n * (n + 1) / 2, Acr = A * CD;
        const e = x => (1 - x) * Math.min(A, H) + x * Math.min(Acr, H);
        let fb = 0, fz = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i];
          if (!d || d.type !== 'combo' || d.sealed) continue;
          const sg = d.hacked ? -1 : 1, c = 0.05 + (critCell[i] || 0), K = (1 - c) + c * CD;
          let s = 0;
          for (const j of nb[i]) if (b[j] && b[j].type === 'scope' && !b[j].sealed) s = Math.max(s, b[j].pips);
          fb += sg * d.pips * A * K;
          fz += sg * d.pips * (e(c) + (s ? p * Math.min(s, nEnemy - 1) * e(Math.max(0.5, c)) : 0));
        }
        if (knight) {
          let fr = 0;
          for (let i = 0; i < 15; i++) {
            const d = b[i]; if (!d || d.sealed) continue;
            const c = 0.05 + (critCell[i] || 0);
            fr += pc * d.pips * A * ((1 - c) + c * CD);
          }
          fb = o.knightActual * fb + (1 - o.knightActual) * fr;
        }
        return [fb / 1.2, fz / 1.2];
      };

      // 盤面の値 Φ
      const phi = (b, n) => {
        let v = o.kL * tau * room(b) / o.Lref;
        const combos = {}, jokers = {};
        let W = 0, critP = 0, magV = 0, tok = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i]; if (!d) continue;
          W += Math.pow(2, d.pips - 1);
          if (critCell[i] != null) critP += o.critPen[d.pips] || 0;
          if (d.type === 'combo' && !d.sealed && !d.hacked) combos[d.pips] = (combos[d.pips] || 0) + 1;
          if (d.type === 'joker') jokers[d.pips] = (jokers[d.pips] || 0) + 1;
          if (!d.sealed && (d.type === 'joker' || d.type === 'adaptive'))
            tok += (d.type === 'joker' ? o.tokJoker : o.tokAdaptive) * (0.5 + 0.5 * Math.pow(2, -(d.pips - 1)));
          if (mag) {
            if (d.pips <= o.magLowPips) magV -= o.magLow;
            let partner = d.type === 'joker' || d.type === 'adaptive';
            if (!partner && d.pips < 7) for (let j = 0; j < 15; j++) if (j !== i && b[j] && b[j].type === d.type && b[j].pips === d.pips) { partner = true; break; }
            if (partner) magV += o.magPair * (d.pips - 1) / 6;
          }
        }
        if (!mag && (o.seedMode === 'phi' || o.seedMode === 'lastGain')) {
          let seed = 0;
          for (const k in combos) if (+k <= o.seedMaxPips) {
            let h = 0; if (o.seedMode === 'phi') { for (let j = 1; j <= combos[k]; j++) h += 1 / j; } else h = combos[k] > 0 ? 1 : 0;
            seed += Math.pow(2, -(k - 1)) * (+k === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h;
          }
          v += o.kSeed * (1 - tau) * seed;
        }
        let wait = 0; for (const k in jokers) if (!combos[k]) wait += jokers[k];
        v -= o.kJoker * tau * wait;
        v -= o.kCrit * critP * o.critRelaxW / (o.critRelaxW + W);
        v -= (magSp ? o.kWMag : o.kW) * (0.5 + tau) * W / 64;
        v += o.kTok * (1 - 0.5 * tau) * tok;
        v += magV;
        const [fb, fz] = fire(b, n);
        const u = r => o.marginHi * (1 - Math.exp(-Math.max(r, 0) / o.marginHi));
        v += o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
        return v;
      };

      const n0 = obs.combo;
      const [fb0, fz0] = fire(base0, n0);
      const zr = fz0 / needZ;
      const zakoOk = zr >= o.zakoOk;
      magPre = !magEarly && nextType === 'magician' && tl <= o.magLead && zakoOk;
      mag = magSp || magPre;
      const bossOk = fb0 / needB >= o.bossOk;
      const critOut = zakoOk && bossOk && (leonPre || magPre);

      // ---- リミット解除の判定（ToA版） ----
      // マジシャン合わせは magSyncFromWave 以降だけ。予告が出たときに、盤面の総数で行うかを決める（1.4.0）
      const syncCand = !!(o.magSync && magNow && pend.length > 0 && obs.wave >= o.magSyncFromWave);
      if (!syncCand) syncRoll = null;
      else if (syncRoll === null) {
        let tot = 0, high = 0;
        for (const d of cur) if (d) { tot += Math.pow(2, d.pips - 1); if (d.pips >= o.magSyncHighPips && (d.type === 'summon' || d.type === 'adaptive')) high++; }
        const full = o.magSyncTotalFull + o.magSyncWaveAdd * obs.wave; // 後半ほど高い総数でないと行わない（1.8.0）
        const pr = tot >= full ? 1 : Math.min(1, Math.pow(tot / full, o.magSyncGamma) + o.magSyncHighBonus * high);
        syncRoll = pr >= 1 || ctx.rng() < pr;
        bossDecision = syncRoll;
        syncWhy = `総数${tot}/${full}${high ? `・出目${o.magSyncHighPips}以上の召喚/適応${high}個` : ''} → ${Math.round(pr * 100)}%で${syncRoll ? '行う' : '見送り'}`;
      }
      const magSync = syncCand && syncRoll;
      magSp = magNow && !magEarly && bossDecision !== false; mag = magSp || magPre;
      if (!magSync) { lastSyncCell = null; toa = null; }
      else if (!toa) toa = { L: 1, noCancel: false, needSummon: true, stair: null }; // 予告が出たら：召喚 → ToA合成を出目1から
      const danger = obs.wave <= knightUntil && zr < o.dangerRatio;
      // ボスがレーンの中央（rushPos）を超えた：リミット解除してコンボを作りに行く
      let bossPos = -1;
      if (obs.phase === 'boss') for (const e of obs.enemies) if (e.bossLike && e.kind !== 'tboss' && e.kind !== 'tslime') bossPos = Math.max(bossPos, e.pos);
      const rush = bossPos >= TRACK * o.rushPos;
      fastWant = magSync || danger || rush;
      modeWhy = magSync ? `マジシャン合わせ（${syncWhy}）` : rush ? 'ボスがレーン中央を通過' : danger ? `ナイト後で雑魚火力不足(${zr.toFixed(2)})` : '';
      const tag = modeWhy ? ` ［リミット解除：${modeWhy}］` : '';

      // ---- 召喚SPの保持：火力に余裕ができ始めたら、ウェーブ数と同じ回数分の召喚SPを残す（リミット解除中は残さない） ----
      const keepN = o.spReserve && !fastWant && zakoOk ? obs.wave : 0;
      const reserveSp = n => { let s = 0; for (let i = 0; i < n; i++) s += obs.summonCost + 10 * i; return s; };
      const keepSp = reserveSp(keepN);

      // 1) PU（保持するSPは使わない）
      for (const [pw, type, lv] of o.puPlan || []) {
        if (obs.wave < pw) continue;
        const d = obs.deck.find(x => x.type === type);
        if (!d || d.lv >= lv || d.puCost == null) continue;
        if (obs.sp - d.puCost >= keepSp) return { ops: [{ op: 'powerUp', type }], more: true, note: `PU ${d.name} Lv${d.lv}→${d.lv + 1}${tag}` };
        break;
      }

      const phiNow = phi(base0, n0);
      const seedCnt = b => { const c = {}; for (const d of b) if (d && d.type === 'combo' && !d.sealed && !d.hacked && d.pips <= o.seedMaxPips) c[d.pips] = (c[d.pips] || 0) + 1; return c; };
      const harm = n => { let h = 0; for (let j = 1; j <= n; j++) h += 1 / j; return h; };
      const cnt0 = seedCnt(base0);
      const seedDelta = b => {
        if (mag || o.seedMode !== 'lastGainAll') return 0;
        const c1 = seedCnt(b); let d = 0;
        for (let k = 1; k <= o.seedMaxPips; k++) {
          const a0 = cnt0[k] || 0, a1 = c1[k] || 0, wk = Math.pow(2, -(k - 1)) * (k === 1 && nextType !== 'leon' ? o.seed1Mul : 1);
          if (a1 >= a0) d += wk * (harm(a1) - harm(a0)); else if (a1 === 0) d -= wk;
        }
        return o.kSeed * (1 - tau) * d;
      };
      const actOp = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note: note + tag });
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      const pendCells = new Set(pend.flatMap(q => q.cells));

      // 出目1のコンボ同士の合成は、出目1の適応があれば必ずコンボ＋適応に変える
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to)
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        const rank = q => ((q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (critCell[q.to] != null ? 1 : 0)) * 100 + dirRank(q.to);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      // 最初のメテオまで召喚しない（マジシャン合わせをしない判断のときは、ほかの特殊操作と一緒に外れる）
      const magHold = magSp && o.magHoldFirstMeteor && (obs.boss.cast < 1 || (obs.boss.cast === 1 && pend.length > 0));
      const leonForce = leonPre && obs.wave <= o.leonForceToWave;
      if (leonForce && actReady) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) {
          const rank = a => ((obs.board[a.from].type === 'combo' && obs.board[a.to].type === 'combo' ? 0 : (obs.board[a.from].type === 'adaptive' || obs.board[a.to].type === 'adaptive') ? 1 : 2) * 2 + (critCell[a.to] != null ? 1 : 0)) * 100 + dirRank(a.to);
          const a = toAdaptive(f.reduce((p, q) => rank(q) < rank(p) ? q : p));
          return actOp(a, `レオン前（2Wまで）：出目1コンボを合成 ${obs.board[a.from].type}+${obs.board[a.to].type} ${a.from}→${a.to}`);
        }
      }
      // 8W以降、マジシャン・レオンのボス出現の演出中：ボスを貫通できそう（1回目のスキルまでに倒せる火力）なら、
      // スキルを受けるために楽園マスの上のコンボを外（楽園マス以外）へ合成する。召喚より先。貫通できそうにないなら外さない
      const firstSkill = deathOn(obs.wave) && info.cfg.deathBossFirst != null ? info.cfg.deathBossFirst : o.bossFirstSkill;
      const bossHpNow = bossPred(obs.wave, sumHp(obs.enemies));
      const pierce = fb0 * firstSkill >= bossHpNow * o.pierceMargin;
      const critPre = obs.wave >= o.critOutFromWave && obs.phase === 'intro' && (nextType === 'magician' || nextType === 'leon') && pierce;
      if (critPre && o.critOutForce && actReady) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && critCell[a.from] != null && critCell[a.to] == null
          && obs.board[a.from].type === 'combo' && !obs.board[a.from].sealed && !early.has(a.from) && !early.has(a.to) && !pendCells.has(a.to));
        if (f.length) {
          const pr = t => t === 'combo' ? 0 : t === 'adaptive' ? 1 : 2;
          const rank = a => pr(obs.board[a.to].type) * 100 + dirRank(a.to);
          const a = f.reduce((p, q) => rank(q) < rank(p) ? q : p);
          return actOp(a, `${obs.wave}W ${nextType === 'leon' ? 'レオン' : 'マジシャン'}出現の演出：貫通しそうなので楽園マスのコンボを外へ（火力${(fb0 * firstSkill / bossHpNow).toFixed(2)}倍） ${obs.board[a.to].type} 出目${obs.board[a.from].pips} ${a.from}→${a.to}`);
        }
      }

      // ---- 重ねる操作の候補（点数 S 付き） ----
      const scoreActs = () => {
        const acts = obs.legal.acts.filter(a => a.result === 'merge' || a.result === 'copy');
        const full = obs.board.every(Boolean);
        const okKeys = obs.wave >= o.fullOnlyFromWave ? o.notFullKeys : o.notFullKeysEarly;
        const limited = !full && !magSync && !rush; // マジシャン合わせ・ボス接近の間は、盤面が埋まっていなくても打つ
        const cands = [];
        for (const a of acts) {
          if (early.has(a.from) || early.has(a.to)) continue;
          const x = cur[a.from], y = cur[a.to];
          if (!x || !y) continue;
          if (a.result === 'merge' && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
            && acts.some(q => q.from === a.to && q.to === a.from)) continue;
          if (magSp && o.magNoEscape && a.result === 'merge' && pendCells.has(a.from) && !pendCells.has(a.to)
            && acts.some(q => q.from === a.to && q.to === a.from)) continue;
          const isMerge = a.result === 'merge';
          const sync = magSync && pendCells.has(a.to) && !pendCells.has(a.from) && y.pips < 7 ? 2 : 0; // 予告マスのダイスへ外から
          const lowPair = magPre && isMerge && x.pips <= o.magLowPips;
          const combo1 = leonStop && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo');
          const outCrit = (critOut || (critPre && !o.critOutForce)) && isMerge && critCell[a.from] != null && critCell[a.to] == null && x.type === 'combo';
          if (limited && !pendCells.has(a.from) && !pendCells.has(a.to) && !x.hacked && !y.hacked && !lowPair && !combo1 && !outCrit
            && !(okKeys || []).includes(a.result === 'copy' ? 'joker>' + y.type : pairKey(x.type, y.type))) continue;
          let bonus = 0;
          if (combo1) bonus += o.kLeon1;
          if (outCrit) bonus += o.kCritOut;
          const j1 = d => d.type === 'joker' && d.pips === 1;
          if ((j1(x) && !(a.result === 'copy' && y.type === 'combo')) || (isMerge && j1(y))) bonus -= o.joker1Pen;
          if (a.result === 'copy' && y.type === 'adaptive') bonus -= o.jokerToAdaptivePen;
          if (isMerge && !mag && x.pips <= o.seedMaxPips && (o.seedMode === 'last' || o.seedMode === 'lossOnly')) {
            const used = [x, y].filter(d => d.type === 'combo' && !d.sealed && !d.hacked).length;
            if (used) {
              const have = cur.filter(d => d && d.type === 'combo' && d.pips === x.pips && !d.sealed && !d.hacked).length;
              let h = 0;
              if (o.seedMode === 'last') h = have - used <= 0 ? 1 : 0;
              else for (let j = have - used + 1; j <= have; j++) h += 1 / j;
              bonus -= o.kSeed * (1 - tau) * Math.pow(2, -(x.pips - 1)) * (x.pips === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h;
            }
          }
          if (isMerge) for (const i of [a.from, a.to]) {
            const d = cur[i];
            if (critCell[i] == null || d.type !== 'combo' || d.pips < o.critComboMinPips) continue;
            let sp = 0; for (const j of nb[i]) if (cur[j] && cur[j].type === 'scope' && !cur[j].sealed) sp = Math.max(sp, cur[j].pips);
            bonus -= o.critComboPen * (1 + o.critComboScope * sp);
          }
          let key, ev = 0;
          if (a.result === 'copy') {
            key = 'joker>' + y.type;
            const b = cur.slice(); b[a.from] = { type: y.type, pips: x.pips, sealed: false, hacked: false };
            ev = phi(future(b), n0) + seedDelta(future(b));
          } else {
            key = pairKey(x.type, y.type);
            const dn = (x.type === 'combo' || y.type === 'combo') ? 1 : 0;
            for (const t of deckTypes) {
              const b = cur.slice();
              b[a.from] = null; b[a.to] = { type: t, pips: x.pips + 1, sealed: false, hacked: false };
              if (x.type === 'summon' || y.type === 'summon') b[a.from] = { type: '?', pips: 1, sealed: false, hacked: false };
              ev += phi(future(b), n0 + dn) + seedDelta(future(b));
            }
            ev /= deckTypes.length;
          }
          const S = ((o.eff && o.eff[key]) || 0) - o.lowFirst * x.pips + ev - phiNow + bonus;
          cands.push({ a, S, key, sync });
        }
        // 合成の向きの癖：同じ2つのダイスで、向きによる点数の差が dirEps 以下なら、左（同じ列なら下）へ合成する方だけ残す
        const byFT = new Map(cands.map(c => [c.a.from * 15 + c.a.to, c]));
        const pool = cands.filter(c => {
          if (c.a.result !== 'merge') return true;
          const r = byFT.get(c.a.to * 15 + c.a.from);
          if (!r || r.a.result !== 'merge' || r.sync !== c.sync || Math.abs(r.S - c.S) > o.dirEps) return true;
          if (dirRank(c.a.to) < dirRank(r.a.to)) { c.dirTie = true; c.S = Math.max(c.S, r.S); return true; }
          return false;
        });
        return { pool, full };
      };
      const better = (p, q) => q.S > p.S ? q : p;
      const info2 = () => ` τ=${tau.toFixed(2)} 雑魚${zr.toFixed(2)} ボス${(fb0 / needB).toFixed(2)}${mag ? ' マジシャン' : ''}${leonPre ? ' レオン前' : ''}${knight ? ' ナイト' : ''}${critOut ? ' 楽園外し' : ''}${keepN ? ` SP保持${keepSp}` : ''}`;
      const noteOf = (c, extra) => `${c.key} 出目${obs.board[c.a.from].pips} ${c.a.from}→${c.a.to} S=${c.S.toFixed(2)}${c.dirTie ? '（左下）' : ''}${extra || ''}${info2()}`;

      // 普通の重ねる操作（楽園スココンAI 1.7.1 と同じ選び方）
      const normalAct = () => {
        const { pool, full } = scoreActs();
        if (!pool.length) return null;
        const best = pool.reduce(better);
        if (!full && !rush && !(best.S > o.minScoreNotFull)) return null;
        const a = toAdaptive(best.a);
        if (a !== best.a) best.key = 'adaptive+combo（出目1コンボ同士から変更）';
        return actOp(a, noteOf(Object.assign({}, best, { a }), rush ? ' ボス接近：コンボ作り' : ''));
      };

      // ---- マジシャン合わせ：予告マスへの合成 → ToA合成（階段合成を含む） ----
      // ToA合成の材料：予告マスと、着弾に間に合わないマス以外の、封印されていないダイス
      // マジシャン合わせの間は、盤面で出目がいちばん高いスコープ（同じ出目なら隣のコンボの出目の合計が大きいもの）を合成に使わない（1.7.0）
      let guardCell = -1;
      if (magSync && o.guardTopScope) {
        let bestK = -1;
        for (let i = 0; i < 15; i++) {
          const d = cur[i]; if (!d || d.type !== 'scope' || d.sealed || pendCells.has(i)) continue;
          let adj = 0; for (const j of nb[i]) if (cur[j] && cur[j].type === 'combo') adj += cur[j].pips;
          const k = d.pips * 100 + adj;
          if (k > bestK) { bestK = k; guardCell = i; }
        }
      }
      const okCell = i => cur[i] && !cur[i].sealed && !early.has(i) && !pendCells.has(i) && i !== guardCell;
      const cellsAt = L => { const r = []; for (let i = 0; i < 15; i++) if (okCell(i) && cur[i].pips === L) r.push(i); return r; };
      // 出目Lのダイスで作れる合成の最大の組の数（ジョーカーはコピーしてから合成。余りの種類にジョーカー→適応の順で使う）
      const plan = cells => {
        const c = {}; let a = 0, j = 0;
        for (const i of cells) { const t = cur[i].type; if (t === 'adaptive') a++; else if (t === 'joker') j++; else c[t] = (c[t] || 0) + 1; }
        let pairs = 0; const odd = [];
        for (const t in c) { pairs += Math.floor(c[t] / 2); if (c[t] % 2) odd.push(t); }
        const useJ = Math.min(odd.length, j), useA = Math.min(odd.length - useJ, a);
        pairs += useJ + useA + Math.floor((j - useJ + a - useA) / 2);
        return { pairs, useJ, odd };
      };
      const pairsAt = L => L >= 7 ? 0 : plan(cellsAt(L)).pairs;
      const rem = (cells, ...xs) => cells.filter(i => !xs.includes(i));

      const toaAct = pool => {
        const find = (from, to, result) => pool.find(c => c.a.from === from && c.a.to === to && c.a.result === result)
          || ((obs.legal.acts.find(q => q.from === from && q.to === to && q.result === result)) ? { a: obs.legal.acts.find(q => q.from === from && q.to === to && q.result === result), S: 0, key: result } : null);
        // 階段合成の続き：T のダイス（出目 p）に、出目 p の適応、またはジョーカー（直前にコピー）を合成していく
        const st = toa.stair;
        if (st) {
          const T = st.T, d = cur[T];
          if (!d || d.pips !== st.p || d.pips >= 7 || early.has(T)) toa.stair = null;
          else {
            if (st.j != null && cur[st.j] && cur[st.j].pips === st.p && cur[st.j].type === d.type && okCell(st.j)) {
              const c = find(st.j, T, 'merge');
              if (c) { st.j = null; st.p++; return actOp(c.a, `階段合成：コピーしたジョーカーを合成 出目${d.pips} ${c.a.from}→${T}${info2()}`); }
            }
            st.j = null;
            for (const i of cellsAt(st.p)) if (i !== T && cur[i].type === 'adaptive') {
              const c = find(i, T, 'merge');
              if (c) { st.p++; return actOp(c.a, `階段合成：適応を合成 出目${d.pips} ${i}→${T}${info2()}`); }
            }
            for (const i of cellsAt(st.p)) if (i !== T && cur[i].type === 'joker') {
              const c = find(i, T, 'copy');
              if (c) { st.j = i; return actOp(c.a, `階段合成：ジョーカーをコピー 出目${d.pips} ${i}→${T}${info2()}`); }
            }
            toa.stair = null; // 段が続かない：階段合成おわり
          }
        }
        // 階段合成を始められるか：出目kのペア（合成できる組）＋ 出目k+1から続く適応・ジョーカーの段。全部で stairMin 段以上
        const tryStair = () => {
          let bestK = null, bestLen = 0;
          for (let k = 1; k <= 5; k++) {
            if (!pairsAt(k)) continue;
            let len = 1;
            for (let m = k + 1; m <= 6; m++) { if (cellsAt(m).some(i => cur[i].type === 'adaptive' || cur[i].type === 'joker')) len++; else break; }
            if (len >= o.stairMin && len > bestLen) { bestLen = len; bestK = k; }
          }
          if (bestK == null) return null;
          const cells = cellsAt(bestK), m0 = plan(cells).pairs;
          const ms = pool.filter(c => c.a.result === 'merge' && cells.includes(c.a.from) && cells.includes(c.a.to) && plan(rem(cells, c.a.from, c.a.to)).pairs === m0 - 1);
          if (!ms.length) return null;
          const c = ms.reduce(better);
          toa.stair = { T: c.a.to, p: bestK + 1, j: null };
          return actOp(c.a, noteOf(c, ` 階段合成（${bestLen}段）の1段目`));
        };
        // ToA合成：出目Lで作れる組を、ジョーカーのコピー → 合成 の順で全部作る
        const levelAct = L => {
          const cells = cellsAt(L), pl = plan(cells);
          if (!pl.pairs) return null;
          if (pl.useJ > 0) { // 合成に使うジョーカーを先にコピー（余りの種類へ）
            const cs = pool.filter(c => c.a.result === 'copy' && cells.includes(c.a.from) && cells.includes(c.a.to) && cur[c.a.from].type === 'joker' && pl.odd.includes(cur[c.a.to].type));
            if (cs.length) { const c = cs.reduce(better); return actOp(c.a, noteOf(c, ` ToA合成 出目${L}：ジョーカーを先にコピー`)); }
          }
          const ms = pool.filter(c => c.a.result === 'merge' && cells.includes(c.a.from) && cells.includes(c.a.to) && plan(rem(cells, c.a.from, c.a.to)).pairs === pl.pairs - 1);
          if (ms.length) { const c = ms.reduce(better); return actOp(c.a, noteOf(c, ` ToA合成 出目${L}`)); }
          return null;
        };
        const restart = why => { // キャンセル：出目1を召喚して最初から
          toa.L = 1; toa.noCancel = false; toa.stair = null; toa.needSummon = true;
          if (obs.legal.summon && !(ctl.summonReadyIn > 0)) { toa.needSummon = false; return { ops: [{ op: 'summon' }], more: true, note: `ToA合成：${why} → 出目1を召喚して最初から${tag}` }; }
          return undefined;
        };
        for (let guard = 0; guard < 8; guard++) {
          const r = levelAct(toa.L);
          if (r) return r;
          // 出目Lを合成しきった：階段合成 → 次の出目へ進むか
          const s = tryStair(); if (s) return s;
          const N = toa.L + 1;
          if (N > 6) { const z = restart('出目6まで終わった'); if (z !== undefined) return z; if (toa.L === 1 && !pairsAt(1)) return null; continue; }
          if (!toa.noCancel && N === 2) {
            if (pairsAt(2) >= 2) { toa.L = 2; continue; }
            // 出目2の組が2つない：1つ上から、できるものを順に（キャンセルなし）。どこにもなければ出目2
            let M = 0; for (let m = 3; m <= 6; m++) if (pairsAt(m)) { M = m; break; }
            toa.noCancel = true;
            if (M) { toa.L = M; continue; }
            if (pairsAt(2)) { toa.L = 2; continue; }
            const z = restart('出目2より上に組がない'); if (z !== undefined) return z; return null;
          }
          let M = N;
          if (toa.noCancel) { while (M <= 6 && !pairsAt(M)) M++; }
          if (M > 6 || !pairsAt(M)) { const z = restart(`出目${N}に組がない`); if (z !== undefined) return z; return null; }
          const pr = toa.noCancel ? 1 : (o.toaProceed[M] != null ? o.toaProceed[M] : 1);
          if (pr >= 1 || ctx.rng() < pr) { toa.L = M; continue; }
          const z = restart(`出目${M}へ進まずキャンセル`); if (z !== undefined) return z; return null;
        }
        return null;
      };

      const syncAct = () => {
        const pool = scoreActs().pool.filter(c => c.a.from !== guardCell && c.a.to !== guardCell);
        // 1) 予告マスのダイスへの合成（直前に合成したマスを優先）
        const s2 = pool.filter(c => c.sync === 2);
        if (s2.length) {
          const chain = s2.filter(c => c.a.to === lastSyncCell);
          const c = (chain.length ? chain : s2).reduce(better);
          lastSyncCell = c.a.to;
          return actOp(c.a, noteOf(c, ` 合わせ：予告マスへ${c.a.result === 'copy' ? 'コピー' : '合成'}`));
        }
        // 2) ToA合成
        return toaAct(pool);
      };

      // ---- ここから実行 ----
      // ボス接近（マジシャン合わせ以外）：召喚より先に、合成でコンボを作る
      if (rush && !magSync && actReady) { const r = normalAct(); if (r) return r; }
      // 召喚：マジシャン合わせの間は、始め（予告が出たとき）とキャンセルのときだけ
      const stopSummon = magSync ? !toa.needSummon : (magPre || magHold || leonStop);
      const spOk = obs.sp - obs.summonCost >= keepSp;
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !stopSummon && spOk) {
        if (magSync) toa.needSummon = false;
        return { ops: [{ op: 'summon' }], more: true, note: (magSync ? 'マジシャン合わせ：召喚' : '召喚') + tag };
      }
      if (magSync && toa.needSummon && !obs.legal.summon) toa.needSummon = false; // 盤面が埋まっている・SP不足なら召喚なしで始める
      if (!actReady) return null;
      return magSync ? syncAct() : normalAct();
    };

    return { decide(obs) {
      let r = inner(obs);
      if (fastWant !== fastApplied) { // 速さの切り替え（判断の間隔は次の判断から）
        fastApplied = fastWant;
        const lim = Object.assign({}, fastWant ? o.limitsFast : o.limitsNormal);
        const msg = fastWant ? `リミット解除（${modeWhy}）` : 'リミットを戻す';
        if (!r) r = { ops: [], note: msg };
        else r = Object.assign({}, r, { note: (r.note ? r.note + ' / ' : '') + msg });
        r.limits = lim;
      }
      return r;
    } };
  },
});
