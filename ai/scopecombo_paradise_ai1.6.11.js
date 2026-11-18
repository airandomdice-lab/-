// 楽園スココンAI 1.6.11（AI API v1／AI_AGENT_GUIDE 1.8.0・AIRandomDicesim 4.1.0 で確認）
//   1.6.11：間隔0.1秒は暗殺対面だけに戻した（ほかの対面は判断0.5秒・重ねる操作とドラッグ0.2秒）
//   1.6.10：どの対面でも判断・重ねる操作・ドラッグ・召喚の間隔を0.1秒に。
//           暗殺対面の2つ目の角の後のコンボの合成は、盤面のコンボの総出目が3を下回るものをしない（1.6.9は出目3未満のコンボを使わない）
//           懸賞金暗殺AI相手30試合：21勝（1.6.9は23勝）。月太陽盾相手の到達ウェーブ（シミュレータ4.3.4、20試合×2組）：35.1
//   1.6.9：暗殺対面（相手：生贄・懸賞金・暗殺・適応・ジョーカー、光のプリズム）の動きを追加。この対面ではほかの動きはしない
//          判断・操作の間隔0.1秒。暗殺をよける → SPがあれば召喚 → 先頭が2つ目の角を曲がったら合成
//          よけ方（対象の種類ごと、上から順にできるもの。合成の相手は懸賞金のついていないダイス）
//            ジョーカー：召喚→コンボ→適応→スコープをコピー
//            召喚：適応と合成→召喚と合成→ジョーカーで召喚をコピーして、次にその召喚と合成
//            適応：召喚→コンボ→スコープ→適応と合成して逃がす
//            コンボ：適応と合成→コンボと合成→ジョーカーでコンボをコピーして、次にそのコンボと合成
//          2つ目の角を曲がった後：楽園マスのスコープへスコープ→適応を合成、召喚＋適応、召喚同士、
//            コンボ→適応、コンボ→コンボ（1.6.10からは、盤面のコンボの総出目が3を下回る合成はしない）。同じ段は出目の低い組から
//          対戦30試合（相手：懸賞金暗殺AI 1.3〔判断1秒〕・光のプリズム、こちら伝説11・適応15・CD3000%、シミュレータ4.3.4）：
//            1.6.8 7勝（暗殺の回避84・被弾362）→ 1.6.9 23勝（回避340・被弾214）。速さを0.5秒にすると18勝
//   1.6.8：最後の隣接をなくす手の禁止を、総数に応じたためらい（減点）に変えた。総数500超だけ禁止（詰みの扱いは1.6.7と同じ）。
//          スコープに隣接可能なマス（盤面の外と、コンボ以外の出目7のマスを除く）が少ないほど強くためらう
//          到達ウェーブ（1.6.1と同じ条件、20試合×3組）：1.6.1 37.3／1.6.7 32.8／1.6.8（kAdjKill 1.5）36.3／kAdjKill 3.0 34.8
//          （試合中の総数はおおむね300前後までで、500を超える場面はほとんどない）
//   1.6.7：1.6.5 の禁止に、詰んだときの扱いを追加。ナイト・レオン前の残り20秒以下は禁止を外す、それ以外はジョーカーのコピーで新しい隣接を作る
//          （1.6.6 の「隣接が少ないときの新しい隣接の加点」はやめた）
//          到達ウェーブ（20試合×3組）：1.6.7 32.8（1.6.5 32.7とほぼ同じ）。5試合の詰み315回はすべて、ナイト・レオン以外の前・ボス戦中で、
//          作れる新しい隣接もなく、何もしなかった
//   1.6.6：隣接が少ないとき、ジョーカーのコピーで新しい隣接を作る手に加点／詰んだら隣接の禁止を外す
//          （1.6.6の到達ウェーブ：1.6.1 37.3／1.6.5 32.7／1.6.6 35.1／禁止なしで新しい隣接の加点だけ 36.3）
//   1.6.5：1.6.1 に、最後のスコープとコンボの隣接をなくす合成の禁止を追加（keepLastAdj）
//          到達ウェーブ（1.6.1と同じ条件、20試合×3組）：1.6.1 37.3 → 1.6.5 32.7。5試合で、盤面が埋まっていて禁止の手しかなく何もしなかった判断が315回
//   1.6.1：1.6.0 に、盤面の総数が多いほど火力の重み（kFire・kShort）を上げる倍率を追加（fireWMul・fireWRef）
//          到達ウェーブ（相手：月太陽盾・クラス15・CD50000・航海日記・月太陽AI、こちらCD3000%、シミュレータ4.1.0、20試合×3組）：
//          1.6.0 31.8 → fireWMul 0.5 37.3（既定）。1と2は2組だけで 35.0・32.9
//   1.1.0：ハッキングは予告で逃げず、食らった後に合成で消す／楽園マスを高い出目にしない／
//          ジョーカー・適応を「コンボ数の素」として価値を持たせる（スコープを潰すのは適応から）／マジシャン戦は総数を消す手を高く
//   1.2.0：楽園マスの出目の上限（2）をやめ、出目6以上だけを重く減点する形に
//   1.6.0：ジョーカーで適応をコピーする手を最大限ためらう（jokerToAdaptivePen）／楽園マスの出目3以上のコンボを合成に使うのを
//          ためらう（隣接スコープの出目に比例して重く）／楽園マスの出目の減点を、盤面の総数が多いほど緩める
//   1.5.0：出目1のコンボ同士を合成するとき、出目1の適応があれば必ずコンボ＋適応に変える（combo1UseAdaptive）
//   1.4.0：マジシャン戦は最初のメテオが落ちるまで召喚しない／2Wまでのレオン前は出目1コンボの合成を強制
//   1.3.0：ボス前の動き（下の「ボス前」）。出目1コンボの種の価値を上げ、出目1ジョーカーのコンボのコピー以外の手を下げた
//
// ボス前（残り秒はボス出現までの秒）
//   マジシャン前：残り magLead(15) 秒で、雑魚火力に余裕（F_zako/need ≥ zakoOk）があれば、召喚を止め、低い出目（magLowPips 以下）の価値を下げる。
//                 低い出目同士の合成は盤面が埋まっていなくても打つ。合成相手のいる高い出目は価値を上げる
//   マジシャン戦：最初のメテオが落ちるまで召喚しない（magHoldFirstMeteor）
//   レオン前：残り leonLead(15) 秒。2Wまで（leonForceToWave）は、出目1コンボを使う合成を召喚より先に必ず打つ（コンボ同士→コンボ＋適応→そのほか）。5W以降（leonStopFromWave）は召喚を止め、出目1コンボを使う合成に +kLeon1（盤面が埋まっていなくても打つ）。
//             次のボスがレオンのウェーブは、出目1コンボの種の倍率 seed1Mul を使わない（咆哮で出目1は消えやすい）
//   楽園外し：レオン前・マジシャン前で、雑魚火力とボス火力の両方に余裕（≥ zakoOk・bossOk）があれば、楽園マスのコンボを外へ合成する手に +kCritOut
//   ナイト前：ボス火力の重みを knightBossMul 倍。ボス火力は「スキルで種類が変わった後、どのダイスも1/5でコンボになる」期待値で数える
//             （今の種類での値は knightActual の割合だけ）。楽園マスの出目1コンボを合成で消しても、ボス火力はほとんど下がらない
// 登録ID：scopecombo_paradise（スコープコンボ基礎AI〔scopecombo_basic〕と同時に読み込める）
// 想定デッキ：スコープ11・コンボ11・適応15・召喚11・ジョーカー11、フィールド：神々の楽園
// 判断の間隔0.5秒、重ねる操作の間隔0.2秒・ドラッグ0.2秒（limits で指定）。暗殺対面だけ、すべて0.1秒（assassinSpeed）
//
// 1回の判断（1つ実行するごとに more:true で盤面を見直す）
//   1) PU：puPlan の順（1.10.0 と同じ。SPが足りなければ後ろのPUは見ない）
//   2) 召喚：空きマスがあり、SPと召喚の間隔が許せば
//   3) 重ねる操作：合成・コピーの候補すべてに点数 S を付け、最も高い手を打つ
//      盤面が埋まっていないときは notFullKeys（W1は notFullKeysEarly）の手と予告マスにかかわる手だけで、S > minScoreNotFull のとき。
//      埋まっていれば必ず最も高い手（これが詰みの処理を兼ねる）
//
// 点数 S(a) = E(a) − lowFirst×出目 + 期待値[Φ(操作後の盤面)] − Φ(今の盤面)
//   E(a)：手の種類ごとのコンボ効率（盤面が無限のときの順位を数値にしたもの。options.eff）
//   合成でできる種類は抽選なので、デッキの5種それぞれの盤面で Φ を計算して平均する
//   メテオの予告は「着弾したあとの盤面」で Φ を計算する（メテオ合わせが点数に出る）。マジシャン戦では予告マスから外へ逃がす合成はしない
//   ハッキングの予告では動かない（予告の間も普通に攻撃する）。食らった後、ハッキングされたコンボは火力がマイナスなので合成で消す
//   楽園マスへの合成は、合成後の出目が critMaxPips を超えるなら行わない（既定7＝制限なし。減点 critPen で6以上をためらう）
//
// 盤面の値 Φ（どの項も今の状況で重みが変わる）
//   詰み度 τ = clamp(1 − (操作候補の組の数 + emptyW×空きマス) / Lref, 0, 1)
//   ・操作の余地   kL × τ × (組の数 + emptyW×空きマス) / Lref           … 詰んでいるほど、候補を増やす手を高く
//   ・種           kSeed × (1−τ) × Σ_出目k≤seedMaxPips 2^−(k−1) × (1 + 1/2 + … + 1/コンボの数)
//                  … 低い出目のコンボほど、最後の1個ほど価値が高い。詰んでいるほど下がる
//   ・待ちジョーカー −kJoker × τ × （同じ出目のコンボがないジョーカーの数）
//   ・楽園マス     −kCrit × Σ critPen[楽園マスのダイスの出目] × critRelaxW/(critRelaxW＋盤面の総数)
//                  … 出目5までは軽く、6以上は重い（6以上にするのをためらう）。盤面の総数が多いほど緩む
//   ・コンボ数の素 kTok × (1 − τ/2) × Σ（ジョーカー tokJoker・適応 tokAdaptive）× (0.5 + 0.5×2^−(出目−1))
//                  … コンボ＋ジョーカー（コピーしてから合成）もコンボ＋適応と同じくコンボ数+1に使える。ジョーカーのほうが高い
//   ・総数         −kW × (0.5+τ) × Σ2^(出目−1)/64（マジシャン戦中は kWMag）… 合成・コピーでは変わらない。メテオで消す手だけに効く
//   ・火力         kFire × Σ_x w_x × u(F_x/need_x) + kShort × Σ_x w_x × min(0, F_x/need_x − 1)
//                  u(r)＝marginHi×(1−e^(−r/marginHi))：余裕 r が大きいほど伸びが小さい＝余裕があるほど火力のダイスの価値は下がる
//                  x＝雑魚・ボス。重み w：通常ウェーブは雑魚1・ボスは bossWeightMin から残り時間に応じて1へ。ボス戦はボス1・次のウェーブの雑魚0.5
//   ・マジシャン前 kSeed を0にし、出目 magLowPips 以下のダイス1個ごとに −magLow、
//                  合成相手がいるダイス（同じ種類・出目のペア、ジョーカー、適応）は +magPair×(出目−1)/6
//
// 火力（コンボだけが攻撃する。A＝基礎＋D×n(n+1)/2、n＝コンボ数、出目kのコンボは1.2秒にk発）
//   会心率 c＝5%＋楽園マスの値、K(x)＝(1−x)＋x×CD/100、追加弾の会心率 c'＝max(50%, c)
//   e(x)＝(1−x)×min(A,H)＋x×min(A×CD/100,H)（H＝雑魚1体のHP。倒しきれる分を超えたダメージは数えない）
//   F_boss ＝ Σ k×A×K(c) / 1.2
//   F_zako ＝ Σ k×[e(c) ＋ p×min(s, E−1)×e(c')] / 1.2（s＝隣接スコープの最高出目、p＝スコープの確率、E＝敵の数）
//   ハッキングされたコンボはマイナス、封印中のコンボは0として数える
//   need_zako ＝ H×湧きの速さ×(1＋sendFactor)×inflowMul ＋ 通路の敵のHP合計／先頭がゴールに着くまでの秒
//             H は lookAhead 秒先のHP表の値（ウェーブをまたぐなら次のウェーブの最初の値）
//   need_boss ＝ ボスのHP（HP表の最後の湧き×bossHpMul＋通路の敵のHP）／(ゴールまでの秒×bossKillFrac) × bossNeedMul[ボス]
//             ボス戦中は 残りHP／ボスがゴールに着くまでの秒
// 対戦30試合（相手：スコープコンボ基礎AI 1.10.0・航海日記、同じデッキ、CD3000%、シミュレータ3.6.0）：26勝（1.5.0 は25勝）
// 練習・ボス固定の平均到達ウェーブ（1.3.0 は40試合、1.2.0 はマジシャン・ナイト20試合／レオン40試合）：マジシャン23.2（1.2.0 は13.0）、ナイト17.7（14.0）、レオン11.6（14.8）
RD.defineAgent('scopecombo_paradise', {
  name: '楽園スココンAI',
  desc: '楽園スココン用（スコープ・コンボ・適応・召喚・ジョーカー）。召喚を優先し、合成・コピーは候補すべてに点数を付けて最も高い手を打つ。点数＝手のコンボ効率＋盤面の値の変化（詰み度に応じた操作の余地・種のコンボ・待ちジョーカー・楽園マスの出目・雑魚とボスの火力の余裕）。マジシャン前は低い出目の価値を下げ、合成相手のいる高い出目を残す。メテオ合わせ・ハッキング回避は着弾後の盤面で評価。',
  options: {
    puPlan: [[2, 'scope', 3], [4, 'scope', 5], [4, 'combo', 3], [5, 'combo', 5]],
    eff: { // 手のコンボ効率（合成は種類をアルファベット順に「+」でつなぐ。コピーは「joker>コピー先」）
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'summon+summon': 0.60, 'scope+scope': 0.50,
      'joker>summon': 0.40, 'adaptive+summon': 0.35, 'joker>scope': 0.30, 'adaptive+scope': 0.25,
      'adaptive+adaptive': 0.15, 'joker>adaptive': 0.10, 'joker+joker': 0.10, 'adaptive+joker': 0.05,
    },
    lowFirst: 0.01,          // 出目1つあたりの減点（同点なら低い出目から）
    minScoreNotFull: 0,      // 盤面が埋まっていないとき、この点数を超える手だけ打つ
    Lref: 30, emptyW: 3,     // 詰み度の基準
    kL: 1.0, kSeed: 0.8, seedMaxPips: 4, kJoker: 0.3, kW: 0.5,
    kCrit: 1.0, critPen: [0, 0, 0, 0.05, 0.1, 0.2, 1.5, 3.0], // 楽園マスのダイスの出目ごとの減点（添字＝出目）。6以上をためらう
    kWMag: 4.0,              // マジシャン戦中の総数の重み（メテオで総数を消す手を高く）
    kTok: 1.0, tokJoker: 1.5, tokAdaptive: 0.7, // コンボ数の素（ジョーカー・適応）の価値
    critMaxPips: 7,          // 楽園マスへ合成してよい出目の上限（合成後の出目。逆向きに合成できるなら、楽園マスへは合成しない）。7＝制限なし（減点 critPen だけで調整）
    // 暗殺対面：相手のデッキが assassinDeck（とフィールド assassinField）のときだけ、ほかの動きをせず下の動きにする
    assassinMode: true, assassinDeck: ['sacrifice', 'bounty', 'assassin', 'adaptive', 'joker'], assassinField: 'prism',
    assassinSpeed: 0.1,      // 暗殺対面の判断・重ねる操作・ドラッグ・召喚の間隔（秒）
    cornerPos: 8.5,          // 2つ目の角（入口からの距離）
    cornerComboMin: 3,       // 2つ目の角を曲がった後のコンボの合成：盤面のコンボの総出目がこれを下回る合成はしない
    keepLastAdj: true,
    adjBanW: 500,            // 盤面の総数がこれを超えたら、最後の隣接をなくす手は禁止（以下ではためらう）
    kAdjKill: 1.5, adjCapW: 2.0, // ためらいの減点＝kAdjKill×(総数/adjBanW)×(1＋adjCapW/(1＋隣接可能マス数))
    unlockLeft: 20,          // 詰んだとき、ナイト・レオン前のこの残り秒以下なら最後の隣接をなくす手の禁止を外す（それ以外は新しい隣接を作る）       // 盤面に残っている最後のスコープとコンボの隣接をなくす合成をしない（false で1.6.1と同じ）
    fireWMul: 0.5, fireWRef: 64, // 火力の重みの倍率＝1＋fireWMul×盤面の総数/fireWRef（総数64で1.5倍、192で2.5倍。0で1.6.0と同じ）
    kFire: 4.0, kShort: 2.0, marginHi: 2.5, bossWeightMin: 0.3,
    bossHpMul: 8,            // シミュレータの cfg.bossHpMul（AIには見えないので同じ値を書く）
    bossKillFrac: 0.8,       // ボスはゴールまでの時間のこの割合で倒したい
    bossNeedMul: { leon: 0.5, magician: 0.5 }, // スキルを受けたいボスは必要な火力を下げる（ナイト・IIIIIIIIII は1＝貫通）
    sendFactor: 1.0, inflowMul: 1.2, eAssume: 6,
    lookAhead: 20,           // 雑魚のHPは何秒先の値で見積もるか
    magLead: 15,             // マジシャン前の扱いを始める、ボス出現までの残り秒（雑魚火力に余裕があるときだけ。召喚を止め、低い出目同士を合成）
    magLowPips: 2, magLow: 0.6, magPair: 0.6,
    zakoOk: 1.5,             // 雑魚処理火力の余裕（F_zako/need）がこれ以上なら「余裕がある」
    bossOk: 1.5,             // 楽園マスのコンボを外すのは、ボス火力の余裕（F_boss/need）もこれ以上のときだけ
    leonLead: 15, leonStopFromWave: 5, kLeon1: 1.5, // レオン前：残り秒／召喚を止めるウェーブ／出目1コンボを使う合成の加点
    combo1UseAdaptive: true, // 出目1のコンボ同士を合成するとき、出目1の適応があれば必ずコンボ＋適応にする
    leonForceToWave: 2,      // このウェーブまでのレオン前は、出目1コンボを使う合成を召喚より先に必ず打つ
    magHoldFirstMeteor: true, // マジシャン戦では、最初のメテオが落ちるまで召喚しない
    kCritOut: 1.0,           // 余裕があるとき、レオン前・マジシャン前に楽園マスのコンボを外へ合成する手の加点
    knightBossMul: 2.0, knightActual: 0.1, // ナイト前：ボス火力の重みの倍率／今の種類のまま数える割合（残りは変換後の期待値）
    seed1Mul: 1.5,           // 出目1のコンボの種の価値の倍率（次のボスがレオンのウェーブは使わない：咆哮で出目1は消えやすい）
    joker1Pen: 0.4,
    jokerToAdaptivePen: 5.0, // ジョーカーで適応をコピーする手の減点（ほかに手がないときだけ打つ）
    critComboMinPips: 3, critComboPen: 0.8, critComboScope: 0.25, // 楽園マスの出目3以上のコンボを合成に使う減点＝critComboPen×(1＋critComboScope×隣接スコープの最高出目)
    critRelaxW: 64,          // 楽園マスの出目の減点に掛ける倍率＝critRelaxW/(critRelaxW＋盤面の総数)。総数が多いほど緩む          // 出目1のジョーカーをコンボのコピー以外に使う手の減点
    magNoEscape: true,       // マジシャン戦では、予告マスのダイスを外へ逃がす合成はしない（逆向き＝予告マスへ合成する）
    // 盤面が埋まっていないときに打ってよい手（ウェーブ fullOnlyFromWave より前は notFullKeysEarly）
    fullOnlyFromWave: 2,
    notFullKeysEarly: ['joker>combo', 'summon+summon', 'scope+scope', 'adaptive+combo', 'adaptive+summon'],
    notFullKeys: ['joker>combo', 'summon+summon'],
  },
  limits: { interval: 0.5, actInterval: 0.2, dragTime: 0.2 },
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

    // ---- 暗殺対面（相手：生贄・懸賞金・暗殺・適応・ジョーカー／光のプリズム）----
    const oppTypes = (info.opponentDeck || []).map(d => d.type).sort().join(',');
    const assDeck = (o.assassinDeck || []).slice().sort().join(',');
    let assMode = null;            // null＝まだ決めていない
    const SPEED = o.assassinSpeed;
    const assassinDecide = obs => {
      const b = obs.board, ctl = obs.control || {};
      const free = d => d && !d.sealed && !(d.bounty > 0);       // 懸賞金のついていないダイス
      const has = (from, to, res) => obs.legal.acts.find(a => a.from === from && a.to === to && a.result === res);
      const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note: '暗殺対面：' + note });
      const cellsOf = (t, pips, ok = () => true) => [...Array(15).keys()].filter(i => b[i] && b[i].type === t && b[i].pips === pips && ok(b[i]));
      const busy = ctl.dragging || ctl.actReadyIn > 0;
      // 1) 飛んできた暗殺をよける（着弾の早いものから）
      const incoming = (obs.pending || []).filter(q => q.kind === 'assassin' && q.from === 'opponent' && q.in > (ctl.dragTime || 0))
        .sort((p, q) => p.in - q.in);
      if (!busy) for (const q of incoming) for (const i of q.cells) {
        const d = b[i]; if (!d || d.sealed) continue;
        // 対象を相手に合成する（対象を動かす向きを先に）
        const mergeWith = (t, ok) => { for (const j of cellsOf(t, d.pips, ok)) { if (j === i) continue; const a = has(i, j, 'merge') || has(j, i, 'merge'); if (a) return a; } return null; };
        const jokerCopyTarget = () => { for (const j of cellsOf('joker', d.pips, free)) { const a = has(j, i, 'copy'); if (a) return a; } return null; };
        let a = null, note = '';
        if (d.type === 'joker') {
          for (const t of ['summon', 'combo', 'adaptive', 'scope']) { for (const j of cellsOf(t, d.pips)) { a = has(i, j, 'copy'); if (a) break; } if (a) { note = `ジョーカー${i}に暗殺→${t}をコピー`; break; } }
        } else if (d.type === 'summon') {
          if ((a = mergeWith('adaptive', free))) note = `召喚${i}に暗殺→適応と合成`;
          else if ((a = mergeWith('summon', free))) note = `召喚${i}に暗殺→召喚と合成`;
          else if ((a = jokerCopyTarget())) note = `召喚${i}に暗殺→ジョーカーで召喚をコピー（次に合成）`;
        } else if (d.type === 'adaptive') {
          for (const t of ['summon', 'combo', 'scope', 'adaptive']) if ((a = mergeWith(t, free))) { note = `適応${i}に暗殺→${t}と合成して逃がす`; break; }
        } else if (d.type === 'combo') {
          if ((a = mergeWith('adaptive', free))) note = `コンボ${i}に暗殺→適応と合成`;
          else if ((a = mergeWith('combo', free))) note = `コンボ${i}に暗殺→コンボと合成`;
          else if ((a = jokerCopyTarget())) note = `コンボ${i}に暗殺→ジョーカーでコンボをコピー（次に合成）`;
        }
        if (a) return act(a, note);
      }
      // 2) SPがあれば召喚
      if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '暗殺対面：召喚' };
      if (busy) return null;
      // 3) 先頭の敵が2つ目の角（入口から cornerPos）を曲がったら
      const lead = obs.enemies.length ? obs.enemies[0].pos : 0;
      if (lead < o.cornerPos) return null;
      const merges = obs.legal.acts.filter(a => a.result === 'merge');
      const low = L => L.sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from)[0];
      const T = (a, x, y) => b[a.from].type === x && b[a.to].type === y;
      const crit = new Set(((obs.field && obs.field.paradise) || []).map(z => z.cell));
      let a;
      // 楽園マスの上のスコープへ、スコープか適応を合成
      if ((a = low(merges.filter(a => crit.has(a.to) && b[a.to].type === 'scope' && b[a.from].type === 'scope'))))
        return act(a, `2つ目の角：楽園マスのスコープ${a.to}へスコープを合成`);
      if ((a = low(merges.filter(a => crit.has(a.to) && b[a.to].type === 'scope' && b[a.from].type === 'adaptive'))))
        return act(a, `2つ目の角：楽園マスのスコープ${a.to}へ適応を合成`);
      // 召喚と適応 → 召喚同士
      if ((a = low(merges.filter(a => T(a, 'summon', 'adaptive') || T(a, 'adaptive', 'summon'))))) return act(a, '2つ目の角：召喚＋適応');
      if ((a = low(merges.filter(a => T(a, 'summon', 'summon'))))) return act(a, '2つ目の角：召喚同士');
      // コンボ→適応 → コンボ→コンボ（出目 cornerComboMin 未満のコンボは使わない）
      // コンボの総出目（盤面のコンボの出目の合計）が cornerComboMin を下回る合成はしない。合成でできる種類は抽選なので数えない
      const comboSum = b.reduce((x, d) => x + (d && d.type === 'combo' ? d.pips : 0), 0);
      const okC = a => comboSum - [a.from, a.to].reduce((x, i) => x + (b[i].type === 'combo' ? b[i].pips : 0), 0) >= o.cornerComboMin;
      if ((a = low(merges.filter(a => T(a, 'combo', 'adaptive') && okC(a))))) return act(a, '2つ目の角：コンボ→適応');
      if ((a = low(merges.filter(a => T(a, 'combo', 'combo') && okC(a))))) return act(a, '2つ目の角：コンボ→コンボ');
      return null;
    };

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      if (assMode === null) {
        const f = obs.opponent && obs.opponent.field;
        const fid = f && typeof f === 'object' ? f.id : f;
        assMode = !!(o.assassinMode && assDeck && oppTypes === assDeck && (!o.assassinField || fid === o.assassinField));
        if (assMode) {
          const r = assassinDecide(obs) || { ops: [], more: true };
          return Object.assign(r, { limits: { interval: SPEED, actInterval: SPEED, dragTime: SPEED, summonInterval: SPEED }, note: '暗殺対面の動きに切り替え' + (r.note ? '：' + r.note : '') });
        }
      }
      if (assMode) return assassinDecide(obs);

      // 1) PU
      for (const [w, type, lv] of o.puPlan || []) {
        if (obs.wave < w) continue;
        const d = obs.deck.find(x => x.type === type);
        if (!d || d.lv >= lv || d.puCost == null) continue;
        if (obs.sp >= d.puCost) return { ops: [{ op: 'powerUp', type }], more: true, note: `PU ${d.name} Lv${d.lv}→${d.lv + 1}` };
        break;
      }
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
      // 雑魚1体のHPは lookAhead 秒先の値を使う（ウェーブをまたぐときは次のウェーブの最初の値）
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
      let magPre = false, mag = magNow;          // マジシャン前（雑魚火力の余裕を見てから決める）
      const leonPre = nextType === 'leon' && tl <= o.leonLead;            // レオン前 leonLead 秒
      const leonStop = leonPre && obs.wave >= o.leonStopFromWave;          // 召喚を止めて出目1コンボを合成する
      const knight = (nextType === 'knight' && obs.phase !== 'boss') || !!(obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight' && obs.boss.cast === 0);
      if (knight) wb *= o.knightBossMul;
      const pc = deckTypes.includes('combo') ? 1 / deckTypes.length : 0; // ナイトの変換で各ダイスがコンボになる確率

      // ---- 盤面の表現と予告スキル ----
      const cur = obs.board.map(d => d ? { type: d.type, pips: d.pips, sealed: !!d.sealed, hacked: !!d.hacked } : null);
      // ハッキングは予告では動かない（予告の間もダイスは普通に攻撃する。食らった後に、ハッキングされたダイスを合成で消す）
      const pend = (obs.pending || []).filter(q => q.kind === 'meteor');
      const early = new Set(); // 操作が届く前に着弾するマス
      for (const q of pend) if (q.in <= drag + 0.05) q.cells.forEach(i => early.add(i));
      const future = b => { // 予告スキルが着弾した後の盤面
        if (!pend.length) return b;
        const f = b.slice();
        for (const q of pend) for (const i of q.cells) {
          if (!f[i]) continue;
          f[i] = null;
        }
        return f;
      };

      // 操作候補の組の数と空きマス
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
      // 盤面の総数（Σ2^(出目−1)）が多いほど、火力の重みを上げる（合成・コピーでは総数は変わらないので、今の盤面の値で決める）
      const W0 = base0.reduce((s, d) => s + (d ? Math.pow(2, d.pips - 1) : 0), 0);
      const fireMul = 1 + o.fireWMul * W0 / o.fireWRef;

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
        if (knight) { // ナイト：スキルで全ダイスの種類が変わるので、ボス火力は「どのダイスも1/5でコンボになる」として数える
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
          // コンボ数の素：ジョーカー（コンボをコピーして合成）と適応（コンボと合成）は、どちらもコンボ数+1に使える
          if (!d.sealed && (d.type === 'joker' || d.type === 'adaptive'))
            tok += (d.type === 'joker' ? o.tokJoker : o.tokAdaptive) * (0.5 + 0.5 * Math.pow(2, -(d.pips - 1)));
          if (mag) {
            if (d.pips <= o.magLowPips) magV -= o.magLow;
            let partner = d.type === 'joker' || d.type === 'adaptive';
            if (!partner && d.pips < 7) for (let j = 0; j < 15; j++) if (j !== i && b[j] && b[j].type === d.type && b[j].pips === d.pips) { partner = true; break; }
            if (partner) magV += o.magPair * (d.pips - 1) / 6;
          }
        }
        if (!mag) {
          let seed = 0;
          for (const k in combos) if (+k <= o.seedMaxPips) { let h = 0; for (let j = 1; j <= combos[k]; j++) h += 1 / j; seed += Math.pow(2, -(k - 1)) * (+k === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h; }
          v += o.kSeed * (1 - tau) * seed;
        }
        let wait = 0; for (const k in jokers) if (!combos[k]) wait += jokers[k];
        v -= o.kJoker * tau * wait;
        v -= o.kCrit * critP * o.critRelaxW / (o.critRelaxW + W); // 盤面の総数が多いほど、楽園マスの出目を上げるためらいを緩める
        v -= (magNow ? o.kWMag : o.kW) * (0.5 + tau) * W / 64;
        v += o.kTok * (1 - 0.5 * tau) * tok;
        v += magV;
        const [fb, fz] = fire(b, n);
        const u = r => o.marginHi * (1 - Math.exp(-Math.max(r, 0) / o.marginHi)); // 余裕が大きいほど伸びが小さくなる
        v += fireMul * o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += fireMul * o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
        return v;
      };

      const n0 = obs.combo;
      const [fb0, fz0] = fire(base0, n0);
      const zakoOk = fz0 / needZ >= o.zakoOk;   // 雑魚処理火力に余裕がある
      magPre = nextType === 'magician' && tl <= o.magLead && zakoOk;
      mag = magNow || magPre;
      const bossOk = fb0 / needB >= o.bossOk;    // ボス火力にも余裕がある（外してもボスを倒せる）
      const critOut = zakoOk && bossOk && (leonPre || magPre); // 楽園マスのコンボを外へ合成する手を高く
      const phiNow = phi(base0, n0);            // mag が決まった後に計算し直す

      // 出目1のコンボ同士の合成は、出目1の適応があれば必ずコンボ＋適応に変える
      // 盤面に残っている最後のスコープとコンボの隣接をなくす合成は禁止（合成でできる種類は抽選なので、合成先は「どちらでもない」とみる）
      const adjPairs = b => {
        let n = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i]; if (!d || d.type !== 'scope' || d.sealed) continue;
          for (const j of nb[i]) if (b[j] && b[j].type === 'combo' && !b[j].sealed) n++;
        }
        return n;
      };
      const adjNow = adjPairs(obs.board);
      const adj0 = o.keepLastAdj ? adjNow : 0;
      const killsLastAdj = a => {
        if (!adj0 || a.result !== 'merge') return false;
        const b = obs.board.slice(); b[a.from] = null; b[a.to] = { type: '?', pips: 0 };
        return adjPairs(b) === 0;
      };
      // 最後の隣接をなくす手：総数 W が adjBanW を超えていれば禁止、それ以下はためらう（減点）
      //   減点＝kAdjKill × (W/adjBanW) × (1 + adjCapW/(1 + 隣接可能マス数))
      //   隣接可能マス＝操作後の盤面で、スコープの上下左右のマス（盤面の外は数えない）のうち、コンボ以外の出目7がいないマス（重複は1つ）
      const adjBan = W0 > o.adjBanW;
      const capCells = b => {
        const set = new Set();
        for (let i = 0; i < 15; i++) {
          const d = b[i]; if (!d || d.type !== 'scope' || d.sealed) continue;
          for (const j of nb[i]) { const e = b[j]; if (!(e && e.pips === 7 && e.type !== 'combo')) set.add(j); }
        }
        return set.size;
      };
      const adjKillPen = a => {
        const b = obs.board.slice(); b[a.from] = null; b[a.to] = { type: '?', pips: obs.board[a.to].pips + 1 };
        return o.kAdjKill * Math.min(1, W0 / o.adjBanW) * (1 + o.adjCapW / (1 + capCells(b)));
      };
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to) && !(adjBan && killsLastAdj(q))
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        // 同じコンボを使い、合成先が元の合成先（なければ楽園マス以外）になるものを優先
        const rank = q => (q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (critCell[q.to] != null ? 1 : 0);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      // 2) 召喚（マジシャン前・マジシャン戦の最初のメテオが落ちるまで・5W以降のレオン前は止める）
      const magHold = magNow && o.magHoldFirstMeteor && (obs.boss.cast < 1 || (obs.boss.cast === 1 && pend.length > 0));
      const stopSummon = magPre || magHold || leonStop;
      // 2W までのレオン前：出目1コンボを使う合成を、召喚より先に必ず打つ
      const leonForce = leonPre && obs.wave <= o.leonForceToWave;
      if (leonForce && !ctl.dragging && !(ctl.actReadyIn > 0)) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1 && !(adjBan && killsLastAdj(a))
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) {
          // コンボ同士 → コンボ＋適応 → そのほか の順。合成先は楽園マス以外を優先
          const rank = a => (obs.board[a.from].type === 'combo' && obs.board[a.to].type === 'combo' ? 0 : (obs.board[a.from].type === 'adaptive' || obs.board[a.to].type === 'adaptive') ? 1 : 2) * 2 + (critCell[a.to] != null ? 1 : 0);
          const a = toAdaptive(f.reduce((p, q) => rank(q) < rank(p) ? q : p));
          return { ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: 'merge' }],
            more: true, note: `レオン前（2Wまで）：出目1コンボを合成 ${obs.board[a.from].type}+${obs.board[a.to].type} ${a.from}→${a.to}` };
        }
      }
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !stopSummon) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
      // 3) 重ねる操作
      if (ctl.dragging || ctl.actReadyIn > 0) return null;
      const acts = obs.legal.acts.filter(a => a.result === 'merge' || a.result === 'copy');
      if (!acts.length) return null;
      let best = null;
      const full = obs.board.every(Boolean);
      const okKeys = obs.wave >= o.fullOnlyFromWave ? o.notFullKeys : o.notFullKeysEarly;
      const limited = !full;
      const pendCells = new Set(pend.flatMap(q => q.cells));
      // 1回目：最後の隣接をなくす手は行わない。
      // 盤面が埋まっていて、最後の隣接をなくす手しか残っていない（詰み）とき、2回目：
      //   ナイト・レオン前（次のボスがナイト・レオンの通常ウェーブ）で残り unlockLeft 秒以下 → 禁止を外して最も良い手
      //   それ以外 → ジョーカーのコピーで、スコープとコンボの新しい隣接を作る手だけ（なければ何もしない）
      const unlockTime = obs.phase === 'wave' && (nextType === 'knight' || nextType === 'leon') && tl <= o.unlockLeft;
      for (let pass = 0; pass < 2 && !best; pass++) {
      const stuckPass = pass === 1;
      if (stuckPass && !(full && adj0 && adjBan && acts.some(killsLastAdj))) break;
      const unlock = stuckPass && unlockTime, buildOnly = stuckPass && !unlockTime;
      for (const a of acts) {
        const kills = killsLastAdj(a);
        if (kills && adjBan && !unlock) continue; // 総数が adjBanW を超えていれば、最後の隣接をなくす手は行わない
        if (early.has(a.from) || early.has(a.to)) continue;
        const x = cur[a.from], y = cur[a.to];
        if (!x || !y) continue;
        if (a.result === 'merge' && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // 楽園マスを高い出目にしない（逆向きで合成する）
        if (magNow && o.magNoEscape && a.result === 'merge' && pendCells.has(a.from) && !pendCells.has(a.to)
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // マジシャン戦：メテオから逃がさず、予告マスへ合成する
        const isMerge = a.result === 'merge';
        // 詰んだときの2回目（buildOnly）：ジョーカーでスコープ・コンボをコピーして、隣接の組が増える手だけ
        let adjGain = 0;
        if (buildOnly) {
          if (isMerge || !(y.type === 'scope' || y.type === 'combo')) continue;
          const b2 = obs.board.slice(); b2[a.from] = { type: y.type, pips: x.pips, sealed: false };
          adjGain = adjPairs(b2) - adjNow;
          if (adjGain <= 0) continue;
        }
        const lowPair = magPre && isMerge && x.pips <= o.magLowPips;                       // マジシャン前：低い出目同士
        const combo1 = leonStop && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo'); // レオン前：出目1コンボ
        const outCrit = critOut && isMerge && critCell[a.from] != null && critCell[a.to] == null && x.type === 'combo'; // 楽園マスのコンボを外へ
        if (limited && !pendCells.has(a.from) && !pendCells.has(a.to) && !x.hacked && !y.hacked && !lowPair && !combo1 && !outCrit && adjGain <= 0
          && !(okKeys || []).includes(a.result === 'copy' ? 'joker>' + y.type : pairKey(x.type, y.type))) continue;
        let bonus = 0;
        if (kills && !adjBan) bonus -= adjKillPen(a); // 総数 adjBanW 以下では、最後の隣接をなくす手をためらう
        if (combo1) bonus += o.kLeon1;
        if (outCrit) bonus += o.kCritOut;
        // 出目1のジョーカーは、コンボのコピー以外に使う手を下げる
        const j1 = d => d.type === 'joker' && d.pips === 1;
        if ((j1(x) && !(a.result === 'copy' && y.type === 'combo')) || (isMerge && j1(y))) bonus -= o.joker1Pen;
        if (a.result === 'copy' && y.type === 'adaptive') bonus -= o.jokerToAdaptivePen; // ジョーカーで適応をコピーするのは最大限ためらう
        // 楽園マスの出目3以上のコンボを合成に使うのをためらう（隣接スコープの出目に比例して重く）
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
          ev = phi(future(b), n0);
        } else {
          key = pairKey(x.type, y.type);
          const dn = (x.type === 'combo' || y.type === 'combo') ? 1 : 0;
          for (const t of deckTypes) {
            const b = cur.slice();
            b[a.from] = null; b[a.to] = { type: t, pips: x.pips + 1, sealed: false, hacked: false };
            if (x.type === 'summon' || y.type === 'summon') b[a.from] = { type: '?', pips: 1, sealed: false, hacked: false }; // 召喚の効果で1つ出る（位置は空いたマスで代用）
            ev += phi(future(b), n0 + dn);
          }
          ev /= deckTypes.length;
        }
        const S = ((o.eff && o.eff[key]) || 0) - o.lowFirst * x.pips + ev - phiNow + bonus;
        if (!best || S > best.S) best = { a, S, key: unlock ? key + '（隣接の禁止を外す）' : adjGain > 0 ? key + '（新しい隣接）' : key };
      }
      }
      if (!best) return null;
      if (!full && !(best.S > o.minScoreNotFull)) return null;
      const a = toAdaptive(best.a);
      if (a !== best.a) best.key = 'adaptive+combo（出目1コンボ同士から変更）';
      return {
        ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }],
        more: true,
        note: `${best.key} 出目${obs.board[a.from].pips} ${a.from}→${a.to} S=${best.S.toFixed(2)} τ=${tau.toFixed(2)} 雑魚${(fz0 / needZ).toFixed(2)} ボス${(fb0 / needB).toFixed(2)}${mag ? ' マジシャン' : ''}${leonPre ? ' レオン前' : ''}${knight ? ' ナイト' : ''}${critOut ? ' 楽園外し' : ''}`,
      };
    } };
  },
});
