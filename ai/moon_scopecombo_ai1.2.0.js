// 月スココンAI 1.2.0（AI API v1／AI_AGENT_GUIDE 1.9.0・AIRandomDicesim 3.12.2 で確認）
//   1.2.0：本家 6.6.5（祝福）に対応
//          ・HP表：HP増加の仕様が 6.0.5 以外なら 6.5.0 の式を使う（1.1.0 までは 6.5.0 と完全一致のときだけで、6.6.5 を 6.0.5 の式で見積もっていた）
//          ・基本クリティカル率：ctx.info.baseCrit（シーズンダイス〔コンボ〕1種につき +5%）を使う
//          ・祝福：一番左のダイスの基本攻撃力 +10%（コンボなら基礎 B に掛ける）、合成でできる種類は祝福の確率（field.blessing.weights）で平均する
//   1.1.0：盤面に出目 moonPuPips(5) 以上の月があれば、月を moonPuLv(5) まで PU する（puPlan より先。SPが足りなければ puPlan の PU もしない）
// 楽園スココンAI 1.6.0 をもとに、召喚のダイスを月のダイスに変えたもの
//
// 楽園スココンAI 1.6.0 からの変更点
//   1) 召喚のダイスを月に変えた（手の種類 summon → moon）
//      ・召喚の効果（合成でダイスが1つ出る）の計算をなくした
//      ・月どうしの合成・適応＋月は盤面を空ける手なので、盤面が埋まっていないときに打てる手（notFullKeys・notFullKeysEarly）から外した
//   2) ジョーカーで月をコピーする手の効率（moonCopy）：出目4以下はスコープのコピーの1つ下（0.275）、出目5以上はスコープのコピーの1つ上（0.325）
//   3) 盤面の火力に月のバフを入れた。月は個数に関係なく「いつも活性している」とみなす
//      （本当の活性で数えると、月の個数をそろえる手〔ジョーカーで月をコピー〕の火力が大きく上がり、ジョーカーを月に使いすぎるため）
//   4) 楽園マスにかかわる操作の項は、ウェーブ critOpsOffWave(10) 以降は使わない
//      （楽園マスの出目の減点・楽園マスへの合成の上限・楽園外しの加点・楽園マスの出目3以上のコンボを合成に使う減点・
//        出目1コンボ同士→コンボ＋適応の置き換えと2Wまでのレオン前で「合成先は楽園マス以外」を優先すること）
//      火力の計算に入る楽園マスの会心率はそのまま
//   5) 活性の停止（stopAfterCorner2）：ウェーブ freezeFromWave(4) 以降、出目 freezeMoonPips(4) 以上の月にコンボが隣接していて、
//      先頭のモンスターが2つ目の角（corner2＝8.5）を越えているときに月が活性したら、先頭が1つ目の角（corner1＝3.5）まで下がるか、
//      そのウェーブのボスを倒すまで（ボス戦が終わる・次のウェーブになる）操作を止める
//   6) ボス戦中は、月が活性している間は操作を止める
//      5)・6) で止めるのは召喚・合成・コピー。PU（puPlan）は盤面を変えないので freezeAllowPu が true なら続ける
//
// 登録ID：moon_scopecombo（楽園スココンAI〔scopecombo_paradise〕・スコープコンボ基礎AI〔scopecombo_basic〕と同時に読み込める）
// 想定デッキ：スコープ・コンボ・適応・月・ジョーカー、フィールド：神々の楽園
// 判断の間隔0.5秒、重ねる操作の間隔0.2秒・ドラッグ0.2秒（limits で指定）
//
// ボス前（残り秒はボス出現までの秒）… 楽園スココンAI 1.6.0 と同じ
//   マジシャン前：残り magLead(15) 秒で、雑魚火力に余裕（F_zako/need ≥ zakoOk）があれば、召喚を止め、低い出目（magLowPips 以下）の価値を下げる。
//                 低い出目同士の合成は盤面が埋まっていなくても打つ。合成相手のいる高い出目は価値を上げる
//   マジシャン戦：最初のメテオが落ちるまで召喚しない（magHoldFirstMeteor）
//   レオン前：残り leonLead(15) 秒。2Wまで（leonForceToWave）は、出目1コンボを使う合成を召喚より先に必ず打つ。5W以降（leonStopFromWave）は召喚を止め、
//             出目1コンボを使う合成に +kLeon1（盤面が埋まっていなくても打つ）。次のボスがレオンのウェーブは seed1Mul を使わない
//   楽園外し：レオン前・マジシャン前で、雑魚火力とボス火力の両方に余裕があれば、楽園マスのコンボを外へ合成する手に +kCritOut（10W以降はなし）
//   ナイト前：ボス火力の重みを knightBossMul 倍。ボス火力は「スキルで種類が変わった後、どのダイスも1/5でコンボになる」期待値で数える（月のバフは入れない）
//
// 1回の判断（1つ実行するごとに more:true で盤面を見直す）
//   0) 操作の停止（上の 5)・6)）：止めている間は PU だけ
//   1) PU：出目5以上の月があれば月をLv5まで（1.1.0）→ puPlan の順（SPが足りなければ後ろのPUは見ない）
//   2) 召喚：空きマスがあり、SPと召喚の間隔が許せば
//   3) 重ねる操作：合成・コピーの候補すべてに点数 S を付け、最も高い手を打つ
//      盤面が埋まっていないときは notFullKeys（W1は notFullKeysEarly）の手と予告マスにかかわる手だけで、S > minScoreNotFull のとき。
//      埋まっていれば必ず最も高い手（これが詰みの処理を兼ねる）
//
// 点数 S(a) = E(a) − lowFirst×出目 + 期待値[Φ(操作後の盤面)] − Φ(今の盤面)
//   E(a)：手の種類ごとのコンボ効率（options.eff。ジョーカーで月をコピーする手だけは options.moonCopy で出目により変える）
//   合成でできる種類は抽選なので、デッキの5種それぞれの盤面で Φ を計算して平均する
//
// 盤面の値 Φ … 楽園スココンAI 1.6.0 と同じ（楽園マスの項は10W以降なし）
//
// 火力（コンボだけが攻撃する。A＝基礎＋D×n(n+1)/2、n＝コンボ数、出目kのコンボは1.2秒にk発）
//   月のバフ（コンボの隣の、封印されていない月のうち出目 m が最大のもの1つ。月はいつも活性とみなす）
//     速さ V＝1／(1−min(0.95, (月クラス×m＋2×(月Lv−1))/100×1.03 − 時間の低下))、攻撃力 P＝1＋0.1×m
//     会心率 c＝基本クリ率＋max(5%×m, 楽園マスの値)（月と楽園は高いほう）。月がいなければ c＝5%＋楽園マスの値、P＝1、V＝1／(1＋時間の低下)
//   K(x)＝(1−x)＋x×CD/100、追加弾の会心率 c'＝max(50%, c)
//   e(x)＝(1−x)×min(A×P,H)＋x×min(A×P×CD/100,H)（H＝雑魚1体のHP。倒しきれる分を超えたダメージは数えない）
//   F_boss ＝ Σ k×A×P×K(c)×V / 1.2
//   F_zako ＝ Σ k×V×[e(c) ＋ p×min(s, E−1)×e(c')] / 1.2（s＝隣接スコープの最高出目、p＝スコープの確率、E＝敵の数）
//   ハッキングされたコンボはマイナス、封印中のコンボは0として数える
//   need_zako・need_boss は楽園スココンAI 1.6.0 と同じ
RD.defineAgent('moon_scopecombo', {
  name: '月スココンAI',
  desc: '月スココン用（スコープ・コンボ・適応・月・ジョーカー）。楽園スココンAI 1.6.0 の召喚を月に変えたもの。合成・コピーは候補すべてに点数を付けて最も高い手を打つ。盤面の火力は月をいつも活性とみなして数える。10W以降は楽園マスにかかわる項を使わない。4W以降、出目4以上の月にコンボが隣接していて先頭が2つ目の角を越えているときに月が活性したら、先頭が1つ目の角に下がるかボスを倒すまで操作を止める。ボス戦中は月が活性している間、操作を止める。',
  options: {
    puPlan: [[2, 'scope', 3], [4, 'scope', 5], [4, 'combo', 3], [5, 'combo', 5]],
    eff: { // 手のコンボ効率（合成は種類をアルファベット順に「+」でつなぐ。コピーは「joker>コピー先」。joker>moon は moonCopy で決める）
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'moon+moon': 0.60, 'scope+scope': 0.50,
      'adaptive+moon': 0.35, 'joker>scope': 0.30, 'adaptive+scope': 0.25,
      'adaptive+adaptive': 0.15, 'joker>adaptive': 0.10, 'joker+joker': 0.10, 'adaptive+joker': 0.05,
    },
    // ジョーカーで月をコピーする手の効率：出目 splitPips 以下は lo（スコープのコピーの1つ下）、それより上は hi（スコープのコピーの1つ上）
    moonCopy: { splitPips: 4, lo: 0.275, hi: 0.325 },
    lowFirst: 0.01,          // 出目1つあたりの減点（同点なら低い出目から）
    minScoreNotFull: 0,      // 盤面が埋まっていないとき、この点数を超える手だけ打つ
    Lref: 30, emptyW: 3,     // 詰み度の基準
    kL: 1.0, kSeed: 0.8, seedMaxPips: 4, kJoker: 0.3, kW: 0.5,
    kCrit: 1.0, critPen: [0, 0, 0, 0.05, 0.1, 0.2, 1.5, 3.0], // 楽園マスのダイスの出目ごとの減点（添字＝出目）。6以上をためらう
    kWMag: 4.0,              // マジシャン戦中の総数の重み（メテオで総数を消す手を高く）
    kTok: 1.0, tokJoker: 1.5, tokAdaptive: 0.7, // コンボ数の素（ジョーカー・適応）の価値
    critMaxPips: 7,          // 楽園マスへ合成してよい出目の上限（合成後の出目）。7＝制限なし（減点 critPen だけで調整）
    critOpsOffWave: 10,      // このウェーブ以降は、楽園マスにかかわる操作の項を使わない
    kFire: 4.0, kShort: 2.0, marginHi: 2.5, bossWeightMin: 0.3,
    bossHpMul: 8,            // シミュレータの cfg.bossHpMul（AIには見えないので同じ値を書く）
    bossKillFrac: 0.8,       // ボスはゴールまでの時間のこの割合で倒したい
    bossNeedMul: { leon: 0.5, magician: 0.5 }, // スキルを受けたいボスは必要な火力を下げる（ナイト・IIIIIIIIII は1＝貫通）
    sendFactor: 1.0, inflowMul: 1.2, eAssume: 6,
    lookAhead: 20,           // 雑魚のHPは何秒先の値で見積もるか
    magLead: 15,             // マジシャン前の扱いを始める、ボス出現までの残り秒
    magLowPips: 2, magLow: 0.6, magPair: 0.6,
    zakoOk: 1.5,             // 雑魚処理火力の余裕（F_zako/need）がこれ以上なら「余裕がある」
    bossOk: 1.5,             // 楽園マスのコンボを外すのは、ボス火力の余裕（F_boss/need）もこれ以上のときだけ
    leonLead: 15, leonStopFromWave: 5, kLeon1: 1.5, // レオン前：残り秒／召喚を止めるウェーブ／出目1コンボを使う合成の加点
    combo1UseAdaptive: true, // 出目1のコンボ同士を合成するとき、出目1の適応があれば必ずコンボ＋適応にする
    leonForceToWave: 2,      // このウェーブまでのレオン前は、出目1コンボを使う合成を召喚より先に必ず打つ
    magHoldFirstMeteor: true, // マジシャン戦では、最初のメテオが落ちるまで召喚しない
    kCritOut: 1.0,           // 余裕があるとき、レオン前・マジシャン前に楽園マスのコンボを外へ合成する手の加点
    knightBossMul: 2.0, knightActual: 0.1, // ナイト前：ボス火力の重みの倍率／今の種類のまま数える割合（残りは変換後の期待値）
    seed1Mul: 1.5,           // 出目1のコンボの種の価値の倍率（次のボスがレオンのウェーブは使わない）
    joker1Pen: 0.4,          // 出目1のジョーカーをコンボのコピー以外に使う手の減点
    jokerToAdaptivePen: 5.0, // ジョーカーで適応をコピーする手の減点（ほかに手がないときだけ打つ）
    critComboMinPips: 3, critComboPen: 0.8, critComboScope: 0.25, // 楽園マスの出目3以上のコンボを合成に使う減点＝critComboPen×(1＋critComboScope×隣接スコープの最高出目)
    critRelaxW: 64,          // 楽園マスの出目の減点に掛ける倍率＝critRelaxW/(critRelaxW＋盤面の総数)。総数が多いほど緩む
    magNoEscape: true,       // マジシャン戦では、予告マスのダイスを外へ逃がす合成はしない（逆向き＝予告マスへ合成する）
    // ---- 月（月スココンAIで追加） ----
    moonActiveMul: 1.03,     // 月の活性の速さの倍率（いつも活性とみなす）
    corner1: 3.5,            // 1つ目の角（入口からの距離）
    corner2: 8.5,            // 2つ目の角
    freezeFromWave: 4,       // 活性の停止を使い始めるウェーブ
    freezeMoonPips: 4,       // 活性の停止：この出目以上の月にコンボが隣接していること
    moonPuPips: 5, moonPuLv: 5, // 盤面にこの出目以上の月があれば、月をこのLvまで PU（puPlan より先）
    freezeAllowPu: true,     // 操作を止めている間も PU（puPlan）はする
    bossFreeze: true,        // ボス戦中、月が活性している間は操作を止める
    // 盤面が埋まっていないときに打ってよい手（ウェーブ fullOnlyFromWave より前は notFullKeysEarly）
    fullOnlyFromWave: 2,
    notFullKeysEarly: ['joker>combo', 'scope+scope', 'adaptive+combo'],
    notFullKeys: ['joker>combo'],
  },
  limits: { interval: 0.5, actInterval: 0.2, dragTime: 0.2 },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, info = ctx.info, nb = info.board.neighbors, CD = info.cfg.cd / 100;
    const TRACK = info.trackLength || 12;
    const moonInfo = info.deck.find(d => d.type === 'moon');
    const MOON_CLS = moonInfo ? moonInfo.cls : 12;
    const C0 = info.baseCrit != null ? info.baseCrit : 0.05; // 基本クリティカル率（シーズンダイス込み）

    // ---- HP表（シミュレータと同じ式） ----
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const dHP = info.hpSpec !== '6.0.5' ? (w => w === 1 ? 100 : 20 * (w - 1) * (w + 4) * (w + 6))
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

    // 試合中に持つ状態：活性の停止 {wave, t}
    const ST = { freeze: null };

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;

      // 0) 操作の停止
      const moonOn = obs.board.some(d => d && d.type === 'moon' && d.active);
      const frontPos = obs.front ? obs.front.pos : 0;
      if (ST.freeze && (obs.wave !== ST.freeze.wave || obs.phase === 'cleanup' || obs.phase === 'roll' || obs.phase === 'wait' || frontPos <= o.corner1)) {
        ctx.log(`活性の停止を解除（${obs.wave !== ST.freeze.wave || obs.phase !== 'wave' && obs.phase !== 'boss' ? 'ボスを倒した' : '先頭が1つ目の角まで下がった'}）`);
        ST.freeze = null;
      }
      if (!ST.freeze && obs.phase === 'wave' && obs.wave >= o.freezeFromWave && moonOn && frontPos > o.corner2) {
        const b = obs.board;
        const adj = b.some((d, i) => d && d.type === 'moon' && d.pips >= o.freezeMoonPips && nb[i].some(j => b[j] && b[j].type === 'combo'));
        if (adj) { ST.freeze = { wave: obs.wave, t: obs.t }; ctx.log(`活性の停止：先頭が2つ目の角を越えて月が活性（W${obs.wave}）。先頭が1つ目の角に下がるかボスを倒すまで操作を止める`); }
      }
      const bossFreeze = o.bossFreeze && obs.phase === 'boss' && moonOn;
      const frozen = !!ST.freeze || bossFreeze;

      // 1) PU
      if (!frozen || o.freezeAllowPu) {
        const md = obs.deck.find(x => x.type === 'moon');
        const moonPu = md && md.lv < o.moonPuLv && md.puCost != null && obs.board.some(d => d && d.type === 'moon' && d.pips >= o.moonPuPips);
        if (moonPu && obs.sp >= md.puCost) return { ops: [{ op: 'powerUp', type: 'moon' }], more: true, note: `PU 月 Lv${md.lv}→${md.lv + 1}（出目${o.moonPuPips}以上の月あり）` };
        if (!moonPu) for (const [w, type, lv] of o.puPlan || []) {
          if (obs.wave < w) continue;
          const d = obs.deck.find(x => x.type === type);
          if (!d || d.lv >= lv || d.puCost == null) continue;
          if (obs.sp >= d.puCost) return { ops: [{ op: 'powerUp', type }], more: true, note: `PU ${d.name} Lv${d.lv}→${d.lv + 1}` };
          break;
        }
      }
      if (frozen) return null; // 召喚・合成・コピーは止める
      const ctl = obs.control || {};

      // ---- 今の状況 ----
      const deckTypes = obs.deck.map(d => d.type);
      const st = t => obs.deck.find(d => d.type === t);
      const cb = st('combo'), sc = st('scope'), mn = st('moon');
      const bless = obs.field && obs.field.blessing;
      const B = cb ? (10 + 10 * (cb.cls - 7) + 10 * (cb.lv - 1)) * (bless && bless.up === 'combo' ? 1 + (bless.atkUp || 0.1) : 1) : 0;
      // 合成・召喚でできる種類の確率（祝福なら重み付き。並びは obs.deck と同じ）
      const deckW = bless && Array.isArray(bless.weights) && bless.weights.length === obs.deck.length ? bless.weights : obs.deck.map(() => 1 / obs.deck.length);
      const D = cb ? 8 + 2 * (cb.cls - 7) + (cb.lv - 1) : 0;
      const p = sc ? 0.20 + 0.03 * (sc.cls - 7) + 0.03 * (sc.lv - 1) : 0;
      const moonLv = mn ? mn.lv : 1;
      const critOps = obs.wave < o.critOpsOffWave; // 楽園マスにかかわる操作の項を使う
      const critCell = {};
      for (const q of (obs.field && obs.field.paradise) || []) critCell[q.cell] = q.crit;
      const isCrit = i => critOps && critCell[i] != null; // 操作の項で使う楽園マスの判定（10W以降はいつも false）
      const nEnemy = Math.max(obs.enemies.length, o.eAssume);
      const drag = ctl.dragTime || 0;
      // 相手の時間による攻撃間隔の増加（練習では0）
      const tSlow = obs.board.reduce((m, d) => Math.max(m, d && d.timeSlow ? d.timeSlow : 0), 0);

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
      let magPre = false, mag = magNow;
      const leonPre = nextType === 'leon' && tl <= o.leonLead;
      const leonStop = leonPre && obs.wave >= o.leonStopFromWave;
      const knight = (nextType === 'knight' && obs.phase !== 'boss') || !!(obs.phase === 'boss' && obs.boss && obs.boss.type === 'knight' && obs.boss.cast === 0);
      if (knight) wb *= o.knightBossMul;
      const pc = deckTypes.includes('combo') ? deckW[deckTypes.indexOf('combo')] : 0; // ナイトの変換で各ダイスがコンボになる確率

      // ---- 盤面の表現と予告スキル ----
      const cur = obs.board.map(d => d ? { type: d.type, pips: d.pips, sealed: !!d.sealed, hacked: !!d.hacked } : null);
      const pend = (obs.pending || []).filter(q => q.kind === 'meteor');
      const early = new Set(); // 操作が届く前に着弾するマス
      for (const q of pend) if (q.in <= drag + 0.05) q.cells.forEach(i => early.add(i));
      const future = b => { // 予告スキルが着弾した後の盤面
        if (!pend.length) return b;
        const f = b.slice();
        for (const q of pend) for (const i of q.cells) if (f[i]) f[i] = null;
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

      // 月のバフ（いつも活性とみなす）：マス i の隣の、封印されていない月の最大の出目
      const moonAt = (b, i) => { let m = 0; for (const j of nb[i]) if (b[j] && b[j].type === 'moon' && !b[j].sealed) m = Math.max(m, b[j].pips); return m; };
      const moonV = m => { // 速さの倍率（攻撃間隔＝元×(1−min(0.95, 月−時間の低下))）
        const S = m ? (MOON_CLS * m + 2 * (moonLv - 1)) / 100 * o.moonActiveMul : 0;
        return 1 / Math.max(0.05, 1 - Math.min(0.95, S - tSlow));
      };

      // 火力
      const fire = (b, n) => {
        const A = B + D * n * (n + 1) / 2;
        let fb = 0, fz = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i];
          if (!d || d.type !== 'combo' || d.sealed) continue;
          const m = moonAt(b, i), P = 1 + 0.1 * m, V = moonV(m), Ap = A * P;
          const e = x => (1 - x) * Math.min(Ap, H) + x * Math.min(Ap * CD, H);
          const sg = d.hacked ? -1 : 1, c = Math.min(1, C0 + Math.max(0.05 * m, critCell[i] || 0)), K = (1 - c) + c * CD;
          let s = 0;
          for (const j of nb[i]) if (b[j] && b[j].type === 'scope' && !b[j].sealed) s = Math.max(s, b[j].pips);
          fb += sg * d.pips * Ap * K * V;
          fz += sg * d.pips * V * (e(c) + (s ? p * Math.min(s, nEnemy - 1) * e(Math.max(0.5, c)) : 0));
        }
        if (knight) { // ナイト：スキルで全ダイスの種類が変わるので、ボス火力は「どのダイスも1/5でコンボになる」として数える（月のバフは入れない）
          let fr = 0;
          for (let i = 0; i < 15; i++) {
            const d = b[i]; if (!d || d.sealed) continue;
            const c = C0 + (critCell[i] || 0);
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
          if (isCrit(i)) critP += o.critPen[d.pips] || 0;
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
        if (!mag) {
          let seed = 0;
          for (const k in combos) if (+k <= o.seedMaxPips) { let h = 0; for (let j = 1; j <= combos[k]; j++) h += 1 / j; seed += Math.pow(2, -(k - 1)) * (+k === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h; }
          v += o.kSeed * (1 - tau) * seed;
        }
        let wait = 0; for (const k in jokers) if (!combos[k]) wait += jokers[k];
        v -= o.kJoker * tau * wait;
        if (critOps) v -= o.kCrit * critP * o.critRelaxW / (o.critRelaxW + W);
        v -= (magNow ? o.kWMag : o.kW) * (0.5 + tau) * W / 64;
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
      const zakoOk = fz0 / needZ >= o.zakoOk;
      magPre = nextType === 'magician' && tl <= o.magLead && zakoOk;
      mag = magNow || magPre;
      const bossOk = fb0 / needB >= o.bossOk;
      const critOut = critOps && zakoOk && bossOk && (leonPre || magPre);
      const phiNow = phi(base0, n0);

      // 出目1のコンボ同士の合成は、出目1の適応があれば必ずコンボ＋適応に変える
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to)
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        const rank = q => (q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (isCrit(q.to) ? 1 : 0);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      // 2) 召喚（マジシャン前・マジシャン戦の最初のメテオが落ちるまで・5W以降のレオン前は止める）
      const magHold = magNow && o.magHoldFirstMeteor && (obs.boss.cast < 1 || (obs.boss.cast === 1 && pend.length > 0));
      const stopSummon = magPre || magHold || leonStop;
      const leonForce = leonPre && obs.wave <= o.leonForceToWave;
      if (leonForce && !ctl.dragging && !(ctl.actReadyIn > 0)) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) {
          const rank = a => (obs.board[a.from].type === 'combo' && obs.board[a.to].type === 'combo' ? 0 : (obs.board[a.from].type === 'adaptive' || obs.board[a.to].type === 'adaptive') ? 1 : 2) * 2 + (isCrit(a.to) ? 1 : 0);
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
      for (const a of acts) {
        if (early.has(a.from) || early.has(a.to)) continue;
        const x = cur[a.from], y = cur[a.to];
        if (!x || !y) continue;
        if (critOps && a.result === 'merge' && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // 楽園マスを高い出目にしない（逆向きで合成する）
        if (magNow && o.magNoEscape && a.result === 'merge' && pendCells.has(a.from) && !pendCells.has(a.to)
          && acts.some(q => q.from === a.to && q.to === a.from)) continue; // マジシャン戦：メテオから逃がさず、予告マスへ合成する
        const isMerge = a.result === 'merge';
        const lowPair = magPre && isMerge && x.pips <= o.magLowPips;
        const combo1 = leonStop && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo');
        const outCrit = critOut && isMerge && critCell[a.from] != null && critCell[a.to] == null && x.type === 'combo';
        if (limited && !pendCells.has(a.from) && !pendCells.has(a.to) && !x.hacked && !y.hacked && !lowPair && !combo1 && !outCrit
          && !(okKeys || []).includes(a.result === 'copy' ? 'joker>' + y.type : pairKey(x.type, y.type))) continue;
        let bonus = 0;
        if (combo1) bonus += o.kLeon1;
        if (outCrit) bonus += o.kCritOut;
        const j1 = d => d.type === 'joker' && d.pips === 1;
        if ((j1(x) && !(a.result === 'copy' && y.type === 'combo')) || (isMerge && j1(y))) bonus -= o.joker1Pen;
        if (a.result === 'copy' && y.type === 'adaptive') bonus -= o.jokerToAdaptivePen;
        // 楽園マスの出目3以上のコンボを合成に使うのをためらう（10W以降はなし）
        if (isMerge && critOps) for (const i of [a.from, a.to]) {
          const d = cur[i];
          if (critCell[i] == null || d.type !== 'combo' || d.pips < o.critComboMinPips) continue;
          let sp = 0; for (const j of nb[i]) if (cur[j] && cur[j].type === 'scope' && !cur[j].sealed) sp = Math.max(sp, cur[j].pips);
          bonus -= o.critComboPen * (1 + o.critComboScope * sp);
        }
        let key, ev = 0, E;
        if (a.result === 'copy') {
          key = 'joker>' + y.type;
          const b = cur.slice(); b[a.from] = { type: y.type, pips: x.pips, sealed: false, hacked: false };
          ev = phi(future(b), n0);
          E = key === 'joker>moon' ? (x.pips <= o.moonCopy.splitPips ? o.moonCopy.lo : o.moonCopy.hi) : ((o.eff && o.eff[key]) || 0);
        } else {
          key = pairKey(x.type, y.type);
          const dn = (x.type === 'combo' || y.type === 'combo') ? 1 : 0;
          deckTypes.forEach((t, ti) => {
            const b = cur.slice();
            b[a.from] = null; b[a.to] = { type: t, pips: x.pips + 1, sealed: false, hacked: false };
            ev += deckW[ti] * phi(future(b), n0 + dn);
          });
          E = (o.eff && o.eff[key]) || 0;
        }
        const S = E - o.lowFirst * x.pips + ev - phiNow + bonus;
        if (!best || S > best.S) best = { a, S, key };
      }
      if (!best) return null;
      if (!full && !(best.S > o.minScoreNotFull)) return null;
      const a = toAdaptive(best.a);
      if (a !== best.a) best.key = 'adaptive+combo（出目1コンボ同士から変更）';
      return {
        ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }],
        more: true,
        note: `${best.key} 出目${obs.board[a.from].pips} ${a.from}→${a.to} S=${best.S.toFixed(2)} τ=${tau.toFixed(2)} 雑魚${(fz0 / needZ).toFixed(2)} ボス${(fb0 / needB).toFixed(2)}${mag ? ' マジシャン' : ''}${leonPre ? ' レオン前' : ''}${knight ? ' ナイト' : ''}${critOut ? ' 楽園外し' : ''}${critOps ? '' : ' 楽園項なし'}`,
      };
    } };
  },
});
