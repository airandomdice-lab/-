// スイコンAI 1.0.0（AI API v1／AI_AGENT_GUIDE 1.9.0・AIRandomDicesim 3.6.0 で確認）
// 楽園スココンAI 1.6.0 をもとに、召喚のダイスをスイッチに変えたもの。登録ID：switchcombo（楽園スココンAIと同時に読み込める）
// 想定デッキ：スコープ・コンボ・適応・スイッチ・ジョーカー、フィールド：神々の楽園
//
// 楽園スココンAI 1.6.0 からの変更
//   ・手のコンボ効率：適応＋スイッチ 0.20（適応＋スコープ 0.25 以下）、ジョーカー＞スイッチ 0.20（ジョーカー＞スコープ 0.30 より下）。
//     スイッチ同士は召喚同士の値 0.60 のまま。召喚の効果（合成で1つ出る）の見積もりは外した。
//     盤面が埋まっていないときに打つ手（notFullKeys）からスイッチ同士を外した（召喚と違って、合成で盤面は広がらないため）
//   ・1ウェーブはスイッチ同士の合成をしない。打つ手がなく、スイッチを楽園マス（クリティカルマス）に置けるなら置く
//     （火力が下がる入れ替えはしない＝楽園マスのコンボはどかさない）
//   ・入れ替え（スイッチを同じ出目の別種に重ねる）は、上から順に、当てはまったものを1つ行う（重ねる操作ができるときだけ）
//     A0. 暗殺（対戦）：暗殺が飛んできたダイスとスイッチを入れ替える。スイッチに飛んできたら、ほかのダイスと入れ替える。
//         ドラッグが着弾までに終わるときだけ。候補が複数あれば、入れ替えた後の火力が最も高いもの。一度かわした暗殺には、もう入れ替えない
//     A1. メテオ：スイッチ以外のダイスに予告されたら、予告マスの外の同じ出目のスイッチと入れ替える（ハッキングされたダイスは逃がさない）
//     A2. ハッキング：コンボに予告されたら、予告マスの外の同じ出目のスイッチと入れ替える
//     A3. 火力：入れ替えで盤面の火力が swapGain（割合）より上がるなら入れ替える（召喚の後、合成・コピーの前）
//         火力＝雑魚の重み×F_zako/need_zako＋ボスの重み×F_boss/need_boss（予告マス・メテオの後の盤面で数える）
//   ・相手のデッキに暗殺があれば、判断・重ねる操作の間隔・ドラッグを 0.1 秒にする（antiAssassin）
//
// ===== 以下は楽園スココンAI 1.6.0 の説明（「召喚を止める」は召喚の操作のこと） =====
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
// 判断の間隔0.5秒、重ねる操作の間隔0.2秒・ドラッグ0.2秒（limits で指定。暗殺対面は0.1秒）
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
RD.defineAgent('switchcombo', {
  name: 'スイコンAI',
  desc: '楽園スイコン用（スコープ・コンボ・適応・スイッチ・ジョーカー）。楽園スココンAIの召喚をスイッチに変えたもの。暗殺・メテオ・ハッキングをスイッチの入れ替えでかわし、入れ替えで火力が上がるなら入れ替える。召喚を優先し、合成・コピーは候補すべてに点数を付けて最も高い手を打つ。点数＝手のコンボ効率＋盤面の値の変化（詰み度に応じた操作の余地・種のコンボ・待ちジョーカー・楽園マスの出目・雑魚とボスの火力の余裕）。マジシャン前は低い出目の価値を下げ、合成相手のいる高い出目を残す。メテオ合わせ・ハッキング回避は着弾後の盤面で評価。',
  options: {
    puPlan: [[2, 'scope', 3], [4, 'scope', 5], [4, 'combo', 3], [5, 'combo', 5]],
    eff: { // 手のコンボ効率（合成は種類をアルファベット順に「+」でつなぐ。コピーは「joker>コピー先」）
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'switch+switch': 0.60, 'scope+scope': 0.50,
      'joker>scope': 0.30, 'adaptive+scope': 0.25, 'adaptive+switch': 0.20, 'joker>switch': 0.20,
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
    notFullKeysEarly: ['joker>combo', 'scope+scope', 'adaptive+combo'],
    notFullKeys: ['joker>combo'],
    // --- スイッチ（スイコンAIの追加分） ---
    w1NoSwitchMerge: true,   // 1ウェーブはスイッチ同士を合成しない
    w1CritSwitch: true,      // 1ウェーブで打つ手がなければ、スイッチを楽園マスへ（火力を下げない入れ替えだけ）
    assassinDodge: true,     // A0 暗殺をスイッチの入れ替えでかわす（対戦）
    meteorSwap: true,        // A1 メテオが予告されたスイッチ以外のダイスを、スイッチと入れ替える
    hackSwap: true,          // A2 ハッキングが予告されたコンボを、スイッチと入れ替える
    fireSwap: true,          // A3 入れ替えで火力が上がるなら入れ替える
    swapGain: 0.02,          // A3：今の火力に対して、この割合より上がるときだけ
    antiAssassin: { interval: 0.1, actInterval: 0.1, dragTime: 0.1 }, // 相手のデッキに暗殺があるときの制限（null で変えない）
  },
  // 判断の間隔0.5秒、重ねる操作の間隔0.2秒・ドラッグ0.2秒。相手のデッキに暗殺があれば antiAssassin（0.1秒）
  limits: (o, info) => {
    const base = { interval: 0.5, actInterval: 0.2, dragTime: 0.2 };
    const od = info && info.opponentDeck;
    if (o.antiAssassin && od && od.some(d => d.type === 'assassin')) return Object.assign(base, o.antiAssassin);
    return base;
  },
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
    const assassinIds = new Map(); // 暗殺の予告ごと（マス@着弾時刻）に、最初に狙われていたダイスのID
    const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;

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
        v += o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
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
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to)
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        // 同じコンボを使い、合成先が元の合成先（なければ楽園マス以外）になるものを優先
        const rank = q => (q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (critCell[q.to] != null ? 1 : 0);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      // ---- スイッチの入れ替え（スイコンAI） ----
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 1e-9);
      const allPend = obs.pending || [];
      const hackCells = new Set(allPend.filter(q => q.kind === 'hack').flatMap(q => q.cells));
      const anyPend = new Set(allPend.flatMap(q => q.cells));
      const swaps = obs.legal.acts.filter(a => a.result === 'swap' && obs.board[a.from] && obs.board[a.to]
        && !obs.board[a.from].sealed && !obs.board[a.to].sealed);
      const applySwap = (b, s, t) => { const nb = b.slice(); const x = nb[s]; nb[s] = nb[t]; nb[t] = x; return nb; };
      // 盤面の火力（メテオの後の盤面で）：雑魚の重み×F_zako/need ＋ ボスの重み×F_boss/need
      const fv = b => { const [fb, fz] = fire(future(b), n0); return wz * fz / needZ + wb * fb / needB; };
      const fv0 = fv(cur);
      const cn = i => `${Math.floor(i / 5) + 1}-${i % 5 + 1}`;
      const tn = t => ({ combo: 'コンボ', scope: 'スコープ', adaptive: '適応', joker: 'ジョーカー', switch: 'スイッチ' })[t] || t;
      const swapOp = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: 'swap' }], more: true, note });
      const pickBest = list => { let best = null; for (const a of list) { const v = fv(applySwap(cur, a.from, a.to)); if (!best || v > best.v) best = { a, v }; } return best; };
      if (actReady && swaps.length) {
        // A0 暗殺：狙われたダイスをスイッチと入れ替える（狙われたのがスイッチなら、ほかのダイスと入れ替える）
        const asn = allPend.filter(q => q.kind === 'assassin');
        if (!asn.length) { if (assassinIds.size) assassinIds.clear(); }
        else if (o.assassinDodge) for (const q of asn) for (const c of q.cells) {
          const key = `${c}@${(obs.t + q.in).toFixed(2)}`;
          if (!assassinIds.has(key)) assassinIds.set(key, obs.board[c] ? obs.board[c].id : null);
          const d = obs.board[c];
          if (!d || d.id !== assassinIds.get(key)) continue;     // もうかわした（マスのダイスが変わった）
          if (q.in <= drag + 0.02) continue;                      // ドラッグが着弾までに終わらない
          const avoid = new Set([...anyPend].filter(i => i !== c));
          const best = pickBest(swaps.filter(a => d.type === 'switch' ? (a.from === c && !avoid.has(a.to)) : (a.to === c && !avoid.has(a.from))));
          if (best) {
            const a = best.a;
            return swapOp(a, d.type === 'switch'
              ? `暗殺回避：狙われたスイッチ${d.pips}（${cn(c)}）を${tn(obs.board[a.to].type)}（${cn(a.to)}）と入れ替える`
              : `暗殺回避：狙われた${tn(d.type)}${d.pips}（${cn(c)}）をスイッチ（${cn(a.from)}）と入れ替える`);
          }
        }
        // A1 メテオ：スイッチ以外のダイスに予告されたら、予告マスの外のスイッチと入れ替える
        if (o.meteorSwap) {
          const doomed = new Set(); for (const q of pend) if (q.in > drag + 0.02) q.cells.forEach(i => doomed.add(i));
          const best = pickBest(swaps.filter(a => doomed.has(a.to) && !anyPend.has(a.from) && obs.board[a.to].type !== 'switch' && !obs.board[a.to].hacked));
          if (best) return swapOp(best.a, `メテオ回避：${tn(obs.board[best.a.to].type)}${obs.board[best.a.to].pips}（${cn(best.a.to)}）をスイッチと入れ替えて${cn(best.a.from)}へ`);
        }
        // A2 ハッキング：コンボに予告されたら、予告マスの外のスイッチと入れ替える
        if (o.hackSwap) {
          const hk = new Set(); for (const q of allPend) if (q.kind === 'hack' && q.in > drag + 0.02) q.cells.forEach(i => hk.add(i));
          const best = pickBest(swaps.filter(a => hk.has(a.to) && !anyPend.has(a.from) && obs.board[a.to].type === 'combo' && !obs.board[a.to].hacked));
          if (best) return swapOp(best.a, `ハッキング回避：コンボ${obs.board[best.a.to].pips}（${cn(best.a.to)}）をスイッチと入れ替えて${cn(best.a.from)}へ`);
        }
      }
      // A3 火力：入れ替えで火力が上がるなら入れ替える（予告マスにかかわる入れ替えはしない）
      const fireSwap = () => {
        if (!o.fireSwap || !actReady) return null;
        const best = pickBest(swaps.filter(a => !anyPend.has(a.from) && !anyPend.has(a.to) && !early.has(a.from) && !early.has(a.to)));
        if (!best || !(best.v > fv0 + Math.max(1e-9, Math.abs(fv0) * o.swapGain))) return null;
        const a = best.a;
        return swapOp(a, `入れ替えで火力を上げる：${tn(obs.board[a.to].type)}${obs.board[a.to].pips}（${cn(a.to)}）を${cn(a.from)}へ（火力${fv0.toFixed(2)}→${best.v.toFixed(2)}）`);
      };
      // 1ウェーブ：打つ手がなければ、スイッチを楽園マスへ（火力を下げない入れ替えだけ）
      const w1Crit = () => {
        if (!o.w1CritSwitch || obs.wave !== 1 || obs.phase !== 'wave' || !actReady) return null;
        const best = pickBest(swaps.filter(a => critCell[a.to] != null && critCell[a.from] == null && !anyPend.has(a.from) && !anyPend.has(a.to)));
        if (!best || best.v < fv0 - 1e-9) return null;
        return swapOp(best.a, `1W：スイッチ${obs.board[best.a.from].pips}を楽園マス（${cn(best.a.to)}）へ`);
      };

      // 2) 召喚（マジシャン前・マジシャン戦の最初のメテオが落ちるまで・5W以降のレオン前は止める）
      const magHold = magNow && o.magHoldFirstMeteor && (obs.boss.cast < 1 || (obs.boss.cast === 1 && pend.length > 0));
      const stopSummon = magPre || magHold || leonStop;
      // 2W までのレオン前：出目1コンボを使う合成を、召喚より先に必ず打つ
      const leonForce = leonPre && obs.wave <= o.leonForceToWave;
      if (leonForce && !ctl.dragging && !(ctl.actReadyIn > 0)) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
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
      { const r = fireSwap(); if (r) return r; }
      const acts = obs.legal.acts.filter(a => a.result === 'merge' || a.result === 'copy');
      if (!acts.length) return w1Crit();
      let best = null;
      const full = obs.board.every(Boolean);
      const okKeys = obs.wave >= o.fullOnlyFromWave ? o.notFullKeys : o.notFullKeysEarly;
      const limited = !full;
      const pendCells = new Set(pend.flatMap(q => q.cells));
      for (const a of acts) {
        if (early.has(a.from) || early.has(a.to)) continue;
        const x = cur[a.from], y = cur[a.to];
        if (!x || !y) continue;
        if (o.w1NoSwitchMerge && obs.wave === 1 && a.result === 'merge' && x.type === 'switch' && y.type === 'switch') continue; // 1Wはスイッチ同士を合成しない
        // ハッキングの予告マスへ合成・コピーでダイスを作らない（スイッチと入れ替えたマスにコンボができないように）
        if ((a.result === 'merge' && hackCells.has(a.to)) || (a.result === 'copy' && hackCells.has(a.from))) continue;
        if (a.result === 'merge' && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // 楽園マスを高い出目にしない（逆向きで合成する）
        if (magNow && o.magNoEscape && a.result === 'merge' && pendCells.has(a.from) && !pendCells.has(a.to)
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // マジシャン戦：メテオから逃がさず、予告マスへ合成する
        const isMerge = a.result === 'merge';
        const lowPair = magPre && isMerge && x.pips <= o.magLowPips;                       // マジシャン前：低い出目同士
        const combo1 = leonStop && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo'); // レオン前：出目1コンボ
        const outCrit = critOut && isMerge && critCell[a.from] != null && critCell[a.to] == null && x.type === 'combo'; // 楽園マスのコンボを外へ
        if (limited && !pendCells.has(a.from) && !pendCells.has(a.to) && !x.hacked && !y.hacked && !lowPair && !combo1 && !outCrit
          && !(okKeys || []).includes(a.result === 'copy' ? 'joker>' + y.type : pairKey(x.type, y.type))) continue;
        let bonus = 0;
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
            ev += phi(future(b), n0 + dn);
          }
          ev /= deckTypes.length;
        }
        const S = ((o.eff && o.eff[key]) || 0) - o.lowFirst * x.pips + ev - phiNow + bonus;
        if (!best || S > best.S) best = { a, S, key };
      }
      if (!best) return w1Crit();
      if (!full && !(best.S > o.minScoreNotFull)) return w1Crit();
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
