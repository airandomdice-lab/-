// 楽園月コンToAAI 1.0.0（AI API v1／AI_AGENT_GUIDE 1.10.0・AIRandomDicesim 3.13.1 で確認）
//   楽園月コンAI 1.0.0 をもとに、ToAさんの大会動画（切り抜き。ユーザーの口頭説明）の動かし方を入れた版
// 想定デッキ：月・コンボ・適応・成長・ジョーカー、フィールド：神々の楽園（Lv20）、本家 6.0.5、対戦用
// 登録ID：moon_combo_paradise_toa（楽園月コンAI〔moon_combo_paradise〕と同時に読み込める）
//
// 操作の速さ（limits。AIが自分で切り替える）
//   通常　　　　：判断 0.1秒・召喚 0.3秒・重ねる操作 0.5秒・ドラッグ 0.2秒（limitsNormal）
//   リミット解除：判断 0.1秒・召喚 0.2秒・重ねる操作 0.2秒・ドラッグ 0.2秒（limitsFast）
//   リミット解除に入るとき：危ないとき／マジシャン合わせ／ウェーブ始めの稼ぎ（相手のボス待ち・ボス抽選中を含む）／ボス前後で活性していないとき
//
// 用語
//   主の月：星の月（なければ出目の最も高い月。同じなら B2、次に隣のコンボの出目の合計が多いほう）
//   火力ゾーン：星の月すべて（なければ主の月）の上下左右。それ以外は作業ゾーン
//   強い盤面（strong）：ウェーブ strongFromWave 以降で、主の月が出目 holdMoonPips 以上、隣にコンボがある
//
// 1回の判断の順番（合成が先、召喚は後）
//   1) PU：出目 moonPuPips 以上の月があれば月を Lv5 まで。星の月がなく、雑魚の平均位置が1つ目の角を越えたらコンボを Lv3 まで
//   2) 放置：星の月が活性していて、SPが idleMinSp 以上余っていて、idleAhead ウェーブ先の必要火力に対して
//      雑魚処理が idleZ 倍・ボス火力が idleB 倍以上あるなら何もしない
//   3) 保持：強い盤面で活性していて、通常ウェーブの後半（経過 ≥ holdFrac）・ボス戦中は動かさない
//      押し返し：活性していて先頭が pushProg を越えたら、pushBackTo に下がるまで動かさない
//      （保持・押し返しの間も、成長を潰す手だけは打つ。危ないとき・押されているときは緊急のPU）
//   4) マジシャン合わせ（ToAさん式）：メテオの予告が出たらリミット解除して召喚し、予告マスへ合成を重ねる。
//      合成できるものがなければ、予告マスのダイスと同じ出目になる合成で相手を作る。
//      予告マスが星の月・主の月なら、活性させてマジシャンを倒しにいく
//   5) 活性を切る（マジシャンを受ける・レオンを受けるとき）：ボス前 deactLead 秒から、先頭がレーンの flowProg に来るまで
//      月の個数をずらして活性を切り、雑魚を流してボスのHPを増やす。次の1手で戻せる切り方だけを使う
//   6) 重ねる操作：候補すべてに点数 S を付けて最も高い手（楽園月コンAI 1.0.0 と同じ仕組み）。向きに意味がなければ左（同じ列なら下）へ
//   7) 召喚：打つ合成がないとき。強い盤面で活性しているときは、SPを召喚 reserveSummons 回分残す
//      活性していないときは 合成 → 召喚 → （ボス前の演出・ボス戦・危ないときだけ）ジョーカーで月をコピー の順
//
// 楽園月コンAI 1.0.0 の点数に足した項（ToAさんの決まり）
//   ・中出目（midLo〜midHi）のジョーカー・適応をコンボに使う手は −midHoldPen（持っておく）
//   ・火力ゾーンの出目3以上のコンボを動かす手は −zonePen（あまり触らない）
//   ・主の月が出目6以上のとき、その隣で出目6を作る合成はしない（出目6の成長→星のゴミを避ける）。
//     盤面に出目6の適応かジョーカーがあればよい（出目6の成長ができても逃がせる）
//   ・強い盤面で活性しているとき、出目2以上の成長は減点（kGrowHaz）。適応との合成・成長同士の合成・
//     「ジョーカーでコピーしてから合成」で潰す手が高くなる
//   ・ジョーカーで月をコピーする手は最後の手段（上の 7)）。ウェーブ moonCopyFreeToWave までは自由
//
// ボス
//   ナイト：スキルまでに倒しきれるなら貫通（保持）。倒しきれないなら受ける：詰みを気にせずコンボ数を稼ぎ、
//           （残り knightEarnLeft 秒から）、残り knightMixLeft 秒からは火力ゾーンも混ぜる。演出中は、出目6の月へ同じ出目の適応を合成して星の月を狙う
//   レオン：星の月が leonStarMoons 個以上・ほかの星が leonOtherStars 個以上・詰み度 ≥ leonTau のときだけ受ける
//           （星のジョーカーで月をコピーして月を増やし、活性を切って雑魚を流す）。それ以外は貫通を狙う
//   マジシャン：magTake なら受ける（上の 4)・5)）。マジシャン前 magLead 秒は召喚を止め、低い出目同士を合成し、
//               火力ゾーンの出目5以上のコンボを外の適応・ジョーカーと合成して外へ出す
//
// 火力・盤面の値 Φ・活性の保険・成長の予測は楽園月コンAI 1.0.0 と同じ
//
// 動画にあるが入れていないもの
//   ・マジシャン前に「月の隣に中出目のジョーカーを置く」（合成の結果の種類は選べないので、置き場所を作れない）
//   ・高出目の成長の相方を作るために盤面を動かす（成長の減点で、相方ができたら潰す手が上がるところまで）
//
// 検証（シミュレータ 3.13.1、本家 6.0.5、楽園Lv20、月12・コンボ11・成長11・ジョーカー11・適応15、CD3000%）
//   対戦（相手：楽園スココンAI 1.7.3）60試合×2組：39勝・37勝（楽園月コンAI 1.0.0 は 40勝・46勝）
//   相手もリミット解除の速さ（判断0.1・召喚0.2・操作0.2・ドラッグ0.2）60試合：35勝（1.0.0 は 42勝）
//   練習30試合：平均45.6W 中央51W 上位10% 75W 最高83W（1.0.0 は平均48.9W）
//   動画の条件（月11・コンボ10・成長10・ジョーカー10・適応15・CD1700%）の練習30試合：平均9.8W（1.0.0 は16.6W）
//   放置は試験では勝ちを減らした（SPの条件なしで 29〜35勝／放置なしで 39〜42勝）ので、SPが idleMinSp 以上余っているときだけにしている
RD.defineAgent('moon_combo_paradise_toa', {
  name: '楽園月コンToAAI',
  desc: '楽園月コンAI 1.0.0 をもとにしたToAさん版。合成が先で召喚は後。月の隣（火力ゾーン）は触らず、それ以外でコンボ数を稼ぐ。ウェーブ始めに稼ぎ、後半は活性を保って動かさない。月のコピーは最後の手段。ナイトは貫通か受けるかを決め、マジシャンは活性を切って受けてメテオ合わせ。危ないとき・マジシャン合わせ・稼ぎのときはリミット解除。',
  options: {
    // ---- ToA版で足したもの ----
    limitsNormal: { interval: 0.1, summonInterval: 0.3, actInterval: 0.5, dragTime: 0.2 },
    limitsFast: { interval: 0.1, summonInterval: 0.2, actInterval: 0.2, dragTime: 0.2 },
    strongFromWave: 3, holdMoonPips: 4,
    holdFrac: 0.5,                         // 通常ウェーブの経過がこの割合を越えたら保持
    pushProg: 0.45, pushBackTo: 0.25, pressedRatio: 1.0,      // 押し返し：先頭の進み具合（0〜1）
    idleMinSp: 150000, idleAhead: 3, idleZ: 1.5, idleB: 1.5,  // 放置：idleAhead ウェーブ先の必要火力に対する、雑魚処理・ボス火力の余裕
 earnFree: false,                       // true＝稼ぎの間は活性が切れるのを気にせず合成・召喚する（試験ではコンボ数が減ったので既定は false）
    earnMaxLoss: 2.0,                      // 稼ぎ：盤面が埋まっているとき、点数がこの値より上の手は打つ
    acceptMaxLoss: 6.0,                    // ナイト・レオンを受けると決めたとき
    midLo: 3, midHi: 5, midHoldPen: 0.6,
    zonePen: 1.0,
    sixRule: true,
    kGrowHaz: 0.6, growHazPips: 2,
    moonCopyFreeToWave: 2,
    reserveSummons: 8, reserveFromWave: 5,
    puMode: 'toa',                         // 'toa'＝月Lv5＋条件つきでコンボLv3＋緊急／'free'＝楽園月コンAI 1.0.0 と同じ／'never'
    moonPuPips: 4, moonPuLv: 5, comboPuLv: 3, comboPuFromWave: 3, corner1: 3.5, puSpareSummons: 3,
    knightEarnLeft: 25, knightMixLeft: 10, knightStar: true,
    leonAccept: true, leonStarMoons: 3, leonOtherStars: 3, leonTau: 0.5,
    magTake: true, magSync: true, magSyncComboMax: 4, magLead: 15, magLowPips: 2, magLowBonus: 0.6, kZoneOut: 1.0, kWMag: 4.0,
    deactLead: 8, flowProg: 0.5, magKillProg: 0.62, deactMinRecover: 0.6,
    dirEps: 0.03,
    notFullKeysToa: ['joker>combo', 'adaptive+combo', 'adaptive+growth', 'growth+growth', 'joker>growth'],
    // ---- ここから下は楽園月コンAI 1.0.0 と同じ ----
    eff: {
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'moon+moon': 0.45, 'joker>growth': 0.40,
      'growth+growth': 0.30, 'adaptive+growth': 0.30, 'adaptive+moon': 0.30,
      'adaptive+adaptive': 0.15, 'joker>adaptive': 0.10, 'joker+joker': 0.10, 'adaptive+joker': 0.05,
    },
    moonCopy: { splitPips: 4, lo: 0.275, hi: 0.325 },
    lowFirst: 0.01, minScoreNotFull: 0,
    Lref: 30, emptyW: 3,
    kL: 1.0, kSeed: 0.8, seedMaxPips: 4, kJoker: 0.3, kW: 0.5,
    kCrit: 1.0, critPen: [0, 0, 0, 0.05, 0.1, 0.2, 1.5, 3.0], critRelaxW: 64, critOpsOffWave: 10, critMaxPips: 7,
    kTok: 1.0, tokJoker: 1.5, tokAdaptive: 0.7,
    kFire: 4.0, kShort: 2.0, marginHi: 2.5, bossWeightMin: 0.3,
    bossHpMul: 8, bossKillFrac: 0.8, bossFirst: 2,
    sendFactor: 1.0, inflowMul: 1.2, lookAhead: 20,
    leonLead: 15, leonStopFromWave: 5, kLeon1: 1.5, combo1UseAdaptive: true, leonForceToWave: 2, seed1Mul: 1.5,
    knightBossMul: 2.0, knightActual: 0.1, knightPierce: 1.0,
    joker1Pen: 0.4, jokerToAdaptivePen: 5.0,
    critComboMinPips: 3, critComboPen: 0.8,
    repairCopy: 0.95, repairMerge: 0.9, growH: 2.0, kGrow: 0.15,
    kStar: 1.5, b2Cell: 6, b2Mul: 1.3,
    summonTol: 0.3,
    dangerProg: 0.75, bossDangerProg: 0.5, stuckS: 0,
    notFullShort: 1.0,
    notFullKeysEarly: ['joker>combo', 'adaptive+combo'], fullOnlyFromWave: 2,
  },
  limits: o => o.limitsNormal,
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, info = ctx.info, nb = info.board.neighbors, CD = info.cfg.cd / 100;
    const TRACK = info.trackLength || 12;
    const moonInfo = info.deck.find(d => d.type === 'moon');
    const MOON_CLS = moonInfo ? moonInfo.cls : 12;
    const AC = (moonInfo && moonInfo.activeCounts) || [3, 5, 7];
    const C0 = info.baseCrit != null ? info.baseCrit : 0.05;

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
    // 試合中に持つ状態
    const ST = { hadStar: false, fast: false, wantFast: false, push: false, mix: null, noopSig: '', noopUntil: 0, mode: '' };
    const setMode = m => { if (ST.mode !== m) { ST.mode = m; ctx.log(`モード：${m}`); } };

    function core(obs) {
      ST.wantFast = false;
      const ctl = obs.control || {};
      const deckTypes = obs.deck.map(d => d.type);
      const deckW = deckTypes.map(() => 1 / deckTypes.length);
      const st = t => obs.deck.find(d => d.type === t);
      const cb = st('combo'), mn = st('moon');
      const cfire = (cbLv, moonLv) => ({
        B: cb ? 10 + 10 * (cb.cls - 7) + 10 * (cbLv - 1) : 0,
        D: cb ? 8 + 2 * (cb.cls - 7) + (cbLv - 1) : 0, L: moonLv });
      const OTH = {};
      for (const [t, a0, ac, ap, sp] of [['joker', 20, 5, 10, 1.0], ['adaptive', 20, 5, 10, 1.0], ['growth', 10, 5, 10, 2.0]]) {
        const d = st(t), di = info.deck.find(x => x.type === t); if (!d) continue;
        OTH[t] = { atk: a0 + ac * (d.cls - (di && di.rar === 'H' ? 5 : 7)) + ap * (d.lv - 1), spd: sp };
      }
      const K0 = cfire(cb ? cb.lv : 1, mn ? mn.lv : 1);
      const critOps = obs.wave < o.critOpsOffWave;
      const critCell = {};
      for (const q of (obs.field && obs.field.paradise) || []) critCell[q.cell] = q.crit;
      const isCrit = i => critOps && critCell[i] != null;
      const drag = ctl.dragTime || 0;
      const tSlow = obs.board.reduce((m, d) => Math.max(m, d && d.timeSlow ? d.timeSlow : 0), 0);

      // ---- 盤面 ----
      const rep = d => d ? { type: d.type, pips: d.pips, sealed: !!d.sealed, hacked: !!d.hacked,
        grow: d.type === 'growth' && d.state && d.state.growLeft != null ? d.state.growLeft : null } : null;
      const cur = obs.board.map(rep);
      const pend = (obs.pending || []).filter(q => q.kind === 'meteor');
      const early = new Set();
      for (const q of pend) if (q.in <= drag + 0.05) q.cells.forEach(i => early.add(i));
      const pendCells = new Set(pend.flatMap(q => q.cells));
      const future = b => { if (!pend.length) return b; const f = b.slice(); for (const q of pend) for (const i of q.cells) f[i] = null; return f; };
      const mk = (t, p) => ({ type: t, pips: p, sealed: false, hacked: false, grow: t === 'growth' && p < 7 ? 99 : null });
      const full = obs.board.every(Boolean);

      const canPair = (x, y) => {
        if (x.pips !== y.pips || x.sealed || y.sealed) return false;
        if (x.type === 'joker' && y.type !== 'joker') return true;
        if (y.type === 'joker' && x.type !== 'joker') return true;
        if (x.pips >= 7) return false;
        if (x.type === y.type) return true;
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
      const moonCnt = b => { let c = 0; for (const d of b) if (d && d.type === 'moon') c++; return c; };
      const isAct = b => AC.includes(moonCnt(b));
      const act0 = isAct(base0);

      // 主の月と火力ゾーン
      const adjCombo = i => nb[i].reduce((s, j) => s + (cur[j] && cur[j].type === 'combo' ? cur[j].pips : 0), 0);
      let main = -1, starMoons = 0, otherStars = 0;
      const zone = new Set();
      for (let i = 0; i < 15; i++) {
        const d = cur[i]; if (!d) continue;
        if (d.pips === 7) { if (d.type === 'moon') starMoons++; else otherStars++; }
        if (d.type !== 'moon' || d.sealed) continue;
        if (main < 0) { main = i; continue; }
        const m = cur[main];
        if (d.pips > m.pips || (d.pips === m.pips && main !== o.b2Cell && (i === o.b2Cell || adjCombo(i) > adjCombo(main)))) main = i;
      }
      const hasStar = starMoons > 0;
      if (hasStar) { ST.hadStar = true; for (let i = 0; i < 15; i++) if (cur[i] && cur[i].type === 'moon' && cur[i].pips === 7) nb[i].forEach(j => zone.add(j)); }
      else if (main >= 0) nb[main].forEach(j => zone.add(j));
      const mainPips = main >= 0 ? cur[main].pips : 0;
      const strong = obs.wave >= o.strongFromWave && mainPips >= o.holdMoonPips && adjCombo(main) > 0;
      const sixZone = o.sixRule && mainPips >= 6 ? zone : null;
      const has6Free = cur.some(d => d && d.pips === 6 && !d.sealed && (d.type === 'adaptive' || d.type === 'joker'));
      const inZoneCombo = i => zone.has(i) && cur[i] && cur[i].type === 'combo' && cur[i].pips >= 3;

      // ---- 敵と必要な火力 ----
      const sumHp = es => es.reduce((s, e) => s + Math.max(0, e.hp), 0);
      const etaOf = e => Math.max(0, TRACK - e.pos) / Math.max(e.speed, 0.01);
      const bossPred = (w, absorbed) => tableHP(w, spawnSteps(w)) * o.bossHpMul + absorbed;
      const inflow = (w, H) => o.inflowMul * (1 + o.sendFactor) / waveDt(w) * H;
      const Hahead = (w, el) => {
        const t = el + o.lookAhead;
        if (t < waveT(w)) return tableHP(w, clamp(Math.floor(t / waveDt(w)) + 1, 1, spawnSteps(w)));
        return tableHP(w + 1, 1);
      };
      const nextType = obs.nextBoss ? obs.nextBoss.type : null;
      const bossNow = obs.phase === 'boss' && obs.boss;
      const bossType = bossNow ? obs.boss.type : nextType;
      const bossE = bossNow ? (obs.enemies.find(e => e.id === obs.boss.id) || obs.enemies.find(e => e.bossLike)) : null;
      const leadProg = bossNow ? (bossE ? bossE.progress : 0) : (obs.front ? obs.front.progress : 0);
      const zk = obs.enemies.filter(e => !e.bossLike);
      const avgPos = zk.length ? zk.reduce((s, e) => s + e.pos, 0) / zk.length : 0;
      const tl = obs.phase === 'wave' ? (obs.timeLeft || 0) : Infinity;
      const Tw = waveT(obs.wave), elFrac = obs.phase === 'wave' ? clamp((Tw - tl) / Tw, 0, 1) : 0;
      const preBoss = obs.phase === 'wave' || obs.phase === 'intro';

      // レオンを受けるか（星の月・ほかの星・詰み度）
      const leonCase = bossType === 'leon' && (preBoss || (bossNow && obs.boss.cast < 1));
      const leonAccept = o.leonAccept && leonCase && strong && starMoons >= o.leonStarMoons && otherStars >= o.leonOtherStars && tau >= o.leonTau;
      const magCase = bossType === 'magician' && (preBoss || bossNow);
      const magTake = o.magTake && magCase && strong;
      const bossMul = t => (t === 'leon' && leonAccept) || (t === 'magician' && magTake) ? 0.5 : 1;

      let w = obs.wave, H, needZ, needB, wz, wb;
      if (obs.phase === 'wave') {
        const el = Tw - tl;
        H = Hahead(w, el);
        const backlog = sumHp(obs.enemies) / Math.max(obs.front && obs.front.eta != null ? obs.front.eta : 10, 2);
        needZ = inflow(w, H) + backlog;
        needB = bossPred(w, sumHp(obs.enemies)) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = o.bossWeightMin + (1 - o.bossWeightMin) * clamp(el / Tw, 0, 1);
      } else if (bossNow) {
        const others = obs.enemies.filter(e => !e.bossLike);
        H = tableHP(w + 1, 1);
        needB = Math.max(0, obs.boss.hp) / Math.max(bossE ? etaOf(bossE) : 10, 1) * bossMul(obs.boss.type);
        needZ = inflow(w + 1, H) + (others.length ? sumHp(others) / Math.max(Math.min(...others.map(etaOf)), 2) : 0);
        wb = 1; wz = 0.5;
      } else if (obs.phase === 'cleanup') {
        H = tableHP(w + 1, 1);
        needZ = inflow(w + 1, H) + sumHp(obs.enemies) / Math.max(obs.front && obs.front.eta != null ? obs.front.eta : 10, 2);
        needB = 1; wz = 1; wb = 0;
      } else {
        if (obs.phase !== 'intro') w = obs.wave + 1;
        H = tableHP(w, 1);
        needZ = inflow(w, H);
        needB = bossPred(w, 0) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = obs.phase === 'intro' ? 1 : o.bossWeightMin;
      }
      needZ = Math.max(needZ, 1); needB = Math.max(needB, 1);

      const leonPre = nextType === 'leon' && tl <= o.leonLead;
      const leonStop = leonPre && obs.wave >= o.leonStopFromWave;
      let knight = (nextType === 'knight' && !bossNow) || !!(bossNow && obs.boss.type === 'knight' && obs.boss.cast === 0);
      const pc = 1 / deckTypes.length;
      const magNow = !!(bossNow && obs.boss.type === 'magician');
      const magPre = magTake && obs.phase === 'wave' && tl <= o.magLead;

      // ---- 火力（楽園月コンAI 1.0.0 と同じ） ----
      const fireRaw = (b, n, act, K) => {
        const A = K.B + K.D * n * (n + 1) / 2;
        let fb = 0, fz = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i];
          if (!d || d.sealed || !(d.type === 'combo' || OTH[d.type])) continue;
          let m = 0; for (const j of nb[i]) if (b[j] && b[j].type === 'moon' && !b[j].sealed) m = Math.max(m, b[j].pips);
          const S = m ? (MOON_CLS * m + 2 * (K.L - 1)) / 100 * (act ? 1.03 : 1) : 0;
          const V = 1 / Math.max(0.05, 1 - Math.min(0.95, S - tSlow));
          const P = act && m ? 1 + 0.1 * m : 1;
          const c = Math.min(1, C0 + Math.max(act ? 0.05 * m : 0, critCell[i] || 0));
          const ot = d.type === 'combo' ? null : OTH[d.type];
          const Ap = (ot ? ot.atk : A) * P, Kc = (1 - c) + c * CD, r = ot ? 1.2 / ot.spd : 1;
          const e = (1 - c) * Math.min(Ap, H) + c * Math.min(Ap * CD, H);
          const sg = d.hacked ? -1 : 1;
          fb += sg * d.pips * Ap * Kc * V * r;
          fz += sg * d.pips * V * e * r;
        }
        return [fb / 1.2, fz / 1.2];
      };
      const fireEff = (b, n, K) => {
        if (isAct(b)) return fireRaw(b, n, true, K);
        let best = fireRaw(b, n, false, K);
        const mc = moonCnt(b);
        const take = (f, r) => { const v = [f[0] * r, f[1] * r]; if (v[0] + v[1] > best[0] + best[1]) best = v; };
        let copyDone = false, adDone = false, mmDone = false;
        for (let i = 0; i < 15 && !(copyDone && adDone && mmDone); i++) {
          const d = b[i]; if (!d || d.sealed) continue;
          if (!copyDone && d.type === 'joker' && AC.includes(mc + 1)) {
            for (let j = 0; j < 15; j++) if (b[j] && b[j].type === 'moon' && b[j].pips === d.pips) {
              const b2 = b.slice(); b2[i] = mk('moon', d.pips); take(fireRaw(b2, n, true, K), o.repairCopy); copyDone = true; break;
            }
          }
          if (d.type === 'adaptive' && d.pips < 7 && !adDone && AC.includes(mc - 1)) {
            for (let j = 0; j < 15; j++) if (b[j] && b[j].type === 'moon' && b[j].pips === d.pips && !b[j].sealed) {
              let f = [0, 0];
              deckTypes.forEach((t, ti) => { const b2 = b.slice(); b2[i] = null; b2[j] = mk(t, d.pips + 1);
                const r = t === 'moon' ? fireRaw(b2, n, false, K) : fireRaw(b2, n, true, K); f[0] += deckW[ti] * r[0]; f[1] += deckW[ti] * r[1]; });
              take(f, o.repairMerge); adDone = true; break;
            }
          }
          if (d.type === 'moon' && d.pips < 7 && !mmDone && (AC.includes(mc - 2) || AC.includes(mc - 1))) {
            for (let j = i + 1; j < 15; j++) if (b[j] && b[j].type === 'moon' && b[j].pips === d.pips && !b[j].sealed) {
              let f = [0, 0];
              deckTypes.forEach((t, ti) => { const b2 = b.slice(); b2[i] = null; b2[j] = mk(t, d.pips + 1);
                const r = fireRaw(b2, n, isAct(b2), K); f[0] += deckW[ti] * r[0]; f[1] += deckW[ti] * r[1]; });
              take(f, o.repairMerge); mmDone = true; break;
            }
          }
        }
        return best;
      };
      const fireG = (b, n, K) => {
        let gi = -1, gl = Infinity;
        for (let i = 0; i < 15; i++) { const d = b[i]; if (d && d.type === 'growth' && !d.sealed && d.grow != null && d.grow <= o.growH && d.grow < gl) { gl = d.grow; gi = i; } }
        if (gi < 0) return fireEff(b, n, K);
        const f = [0, 0];
        deckTypes.forEach((t, ti) => { const b2 = b.slice(); b2[gi] = mk(t, b[gi].pips + 1); const r = fireEff(b2, n, K); f[0] += deckW[ti] * r[0]; f[1] += deckW[ti] * r[1]; });
        return f;
      };
      const fire = (b, n, K) => {
        let [fb, fz] = fireG(b, n, K);
        if (knight) {
          const A = K.B + K.D * n * (n + 1) / 2;
          let fr = 0;
          for (let i = 0; i < 15; i++) { const d = b[i]; if (!d || d.sealed) continue; const c = C0 + (critCell[i] || 0); fr += pc * d.pips * A * ((1 - c) + c * CD); }
          fb = o.knightActual * fb + (1 - o.knightActual) * fr / 1.2;
        }
        return [fb, fz];
      };

      const n0 = obs.combo;
      // ナイト：スキルまでに倒しきれるか（貫通）
      let knightAccept = false;
      if (knight) {
        knight = false; const fbr = fire(base0, n0, K0)[0]; knight = true;
        const hp = bossNow ? obs.boss.hp : bossPred(obs.wave, sumHp(obs.enemies));
        const pierceT = bossNow ? Math.max(0.3, obs.boss.skillIn || 0) : o.bossFirst;
        const mixed = ST.mix && ST.mix.wave === obs.wave;
        if (!mixed && fbr * pierceT >= hp * o.knightPierce) knight = false; else knightAccept = strong || mixed;
      }
      if (knight) wb *= o.knightBossMul;
      // 受けると決めて混ぜ始めたら、そのウェーブは戻さない
      if (knightAccept && obs.phase === 'wave' && tl <= o.knightMixLeft && !(ST.mix && ST.mix.wave === obs.wave)) { ST.mix = { wave: obs.wave }; ctx.log(`ナイトを受ける：残り${o.knightMixLeft}秒、火力ゾーンも混ぜる`); }
      const mixAll = !!(ST.mix && ST.mix.wave === obs.wave && (obs.phase === 'wave' || obs.phase === 'intro'));
      const acceptEarn = ((knightAccept || leonAccept) && ((obs.phase === 'wave' && tl <= o.knightEarnLeft) || obs.phase === 'intro'));

      const strongAct = strong && act0;
      // ---- 盤面の値 Φ ----
      const phi = (b, n, K) => {
        K = K || K0;
        let v = o.kL * tau * room(b) / o.Lref;
        const combos = {}, jokers = {};
        let W = 0, critP = 0, tok = 0, star = 0, grow = 0, haz = 0, magV = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i]; if (!d) continue;
          W += Math.pow(2, d.pips - 1);
          if (isCrit(i)) critP += o.critPen[d.pips] || 0;
          if (d.type === 'combo' && !d.sealed && !d.hacked) combos[d.pips] = (combos[d.pips] || 0) + 1;
          if (d.type === 'joker') jokers[d.pips] = (jokers[d.pips] || 0) + 1;
          if (d.type === 'moon' && d.pips === 7) star = Math.max(star, i === o.b2Cell ? o.b2Mul : 1);
          if (d.type === 'growth' && d.pips < 7) { if (strongAct && d.pips >= o.growHazPips) haz += d.pips / 6; else grow += d.pips / 6; }
          if (!d.sealed && (d.type === 'joker' || d.type === 'adaptive'))
            tok += (d.type === 'joker' ? o.tokJoker : o.tokAdaptive) * (0.5 + 0.5 * Math.pow(2, -(d.pips - 1)));
          if (magPre && d.pips <= o.magLowPips) magV -= o.magLowBonus;
        }
        let seed = 0;
        if (!magPre) for (const k in combos) if (+k <= o.seedMaxPips) { let h = 0; for (let j = 1; j <= combos[k]; j++) h += 1 / j; seed += Math.pow(2, -(k - 1)) * (+k === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h; }
        v += o.kSeed * (1 - tau) * seed;
        let wait = 0; for (const k in jokers) if (!combos[k]) wait += jokers[k];
        v -= o.kJoker * tau * wait;
        if (critOps) v -= o.kCrit * critP * o.critRelaxW / (o.critRelaxW + W);
        v -= (magNow ? o.kWMag : o.kW) * (0.5 + tau) * W / 64;
        v += o.kTok * (1 - 0.5 * tau) * tok;
        v += o.kStar * star + o.kGrow * grow - o.kGrowHaz * haz + magV;
        const [fb, fz] = fire(b, n, K);
        const u = r => o.marginHi * (1 - Math.exp(-Math.max(r, 0) / o.marginHi));
        v += o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
        return v;
      };
      const [fb0, fz0] = fire(base0, n0, K0);
      const rz = fz0 / needZ, rb = fb0 / needB;

      // ---- PU ----
      const danger = bossNow ? leadProg >= o.bossDangerProg : leadProg >= o.dangerProg;
      const tryPu = why => {
        let bestT = null, bestF = fb0 * wb + fz0 * wz;
        for (const t of ['combo', 'moon']) {
          const d = st(t); if (!d || d.puCost == null || obs.sp < d.puCost) continue;
          const K = cfire(t === 'combo' ? d.lv + 1 : (cb ? cb.lv : 1), t === 'moon' ? d.lv + 1 : (mn ? mn.lv : 1));
          const [b1, z1] = fire(base0, n0, K);
          const f = b1 * wb + z1 * wz;
          if (f > bestF * 1.001) { bestF = f; bestT = t; }
        }
        if (bestT) { const d = st(bestT); return { ops: [{ op: 'powerUp', type: bestT }], more: true, note: `PU（${why}）${d.name} Lv${d.lv}→${d.lv + 1}` }; }
        return null;
      };
      if (o.puMode === 'toa') {
        if (mn && mn.lv < o.moonPuLv && mn.puCost != null && mainPips >= o.moonPuPips && obs.sp - (obs.summonCost || 0) * o.puSpareSummons >= mn.puCost)
          return { ops: [{ op: 'powerUp', type: 'moon' }], more: true, note: `PU 月 Lv${mn.lv}→${mn.lv + 1}（出目${o.moonPuPips}以上の月あり）` };
        if (cb && cb.lv < o.comboPuLv && cb.puCost != null && !hasStar && obs.wave >= o.comboPuFromWave && obs.phase === 'wave' && avgPos > o.corner1 && obs.sp >= cb.puCost)
          return { ops: [{ op: 'powerUp', type: 'combo' }], more: true, note: `PU コンボ Lv${cb.lv}→${cb.lv + 1}（雑魚の平均位置が1つ目の角を越えた）` };
      }
      const starLost = ST.hadStar && !hasStar;
      if (danger) ST.wantFast = true;
      // 押されている：活性しているのに雑魚処理が足りず、先頭が押し返しの線を越えている
      const pressed = act0 && rz < o.pressedRatio && leadProg >= o.pushProg && !bossNow;

      // ---- 活性を切りたい場面（マジシャン・レオンを受ける） ----
      const moonThreat = magNow && pend.some(q => q.cells.some(i => cur[i] && cur[i].type === 'moon' && (cur[i].pips === 7 || i === main)));
      let wantInactive = false;
      if (magTake && !moonThreat) {
        if (obs.phase === 'wave' && tl <= o.deactLead && leadProg < o.flowProg) wantInactive = true;
        if (obs.phase === 'intro') wantInactive = true;
        if (magNow && leadProg < o.magKillProg && obs.boss.cast < 2 + (pend.length ? 1 : 0)) wantInactive = true;
      }
      if (leonAccept) {
        if (obs.phase === 'wave' && tl <= o.deactLead && leadProg < o.flowProg) wantInactive = true;
        if (obs.phase === 'intro' || bossNow) wantInactive = true;
      }

      // ---- 放置・保持・押し返し ----
      if (!act0 || obs.phase !== 'wave' || leadProg <= o.pushBackTo) ST.push = false;
      else if (strong && leadProg >= o.pushProg) ST.push = true;
      const wA = obs.wave + o.idleAhead;
      const idleNeedZ = inflow(wA, tableHP(wA, spawnSteps(wA))), idleNeedB = bossPred(wA, 0) / (bossTravel(wA) * o.bossKillFrac);
      const idle = hasStar && act0 && obs.sp >= o.idleMinSp && fz0 >= o.idleZ * idleNeedZ && fb0 >= o.idleB * idleNeedB && rz >= 1 && !knight && !acceptEarn && !wantInactive && !magNow && !magPre;
      const hold = strongAct && !acceptEarn && !wantInactive && !magPre && !(magNow && pend.length)
        && ((obs.phase === 'wave' && (elFrac >= o.holdFrac || ST.push)) || bossNow || obs.phase === 'intro');
      const earnWin = strong && !hold && !idle && (obs.phase === 'wave' || obs.phase === 'wait' || obs.phase === 'roll' || obs.phase === 'cleanup');
      if (earnWin && !wantInactive) ST.wantFast = true;
      // 稼ぎの間（先頭が押し返しの線より手前）は、活性が一時的に切れるのを気にせず合成・召喚する
      const earnFree = o.earnFree && earnWin && !wantInactive && (obs.phase !== 'wave' || leadProg < o.pushProg);
      if (!act0 && (bossNow || obs.phase === 'intro') && !wantInactive) ST.wantFast = true;
      setMode(idle ? '放置' : hold ? (ST.push ? '押し返し' : '保持') : wantInactive ? '活性を切る' : acceptEarn ? '受ける（稼ぎ）' : earnWin ? '稼ぎ' : '通常');

      const canAct = !ctl.dragging && !(ctl.actReadyIn > 0);
      const acts = obs.legal.acts.filter(a => a.result === 'merge' || a.result === 'copy');
      const opAct = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
      const phiNow = phi(base0, n0);

      // ---- 重ねる操作の候補に点数を付ける ----
      const evalActs = opt => {
        const list = [];
        for (const a of acts) {
          if (early.has(a.from) || early.has(a.to)) continue;
          const x = cur[a.from], y = cur[a.to];
          if (!x || !y) continue;
          const isMerge = a.result === 'merge';
          if (!isMerge && y.type === 'moon' && !opt.moonCopy && !(leonAccept && x.pips === 7)) continue;
          if (!opt.all && isMerge && sixZone && x.pips === 5 && sixZone.has(a.to) && !has6Free && !mixAll) continue; // 主の月の隣で出目6を作らない
          if (critOps && isMerge && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
            && acts.some(q => q.from === a.to && q.to === a.from)) continue;
          const combo1 = leonStop && !leonAccept && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo');
          let bonus = 0;
          if (combo1) bonus += o.kLeon1;
          const j1 = d => d.type === 'joker' && d.pips === 1;
          if ((j1(x) && !(a.result === 'copy' && y.type === 'combo')) || (isMerge && j1(y))) bonus -= o.joker1Pen;
          if (a.result === 'copy' && y.type === 'adaptive') bonus -= o.jokerToAdaptivePen;
          if (isMerge && critOps) for (const i of [a.from, a.to]) {
            const d = cur[i];
            if (critCell[i] == null || d.type !== 'combo' || d.pips < o.critComboMinPips) continue;
            bonus -= o.critComboPen;
          }
          const tok = d => d.type === 'joker' || d.type === 'adaptive';
          // 中出目のジョーカー・適応はコンボにすぐ使わない
          if (strong && !acceptEarn && !mixAll && tau < 0.8 && x.pips >= o.midLo && x.pips <= o.midHi
            && ((tok(x) && y.type === 'combo') || (isMerge && tok(y) && x.type === 'combo'))) bonus -= o.midHoldPen;
          // 火力ゾーンのコンボは触らない（マジシャン前は、出目5以上を外の適応・ジョーカーと合成して外へ出す）
          const zoneOut = magPre && isMerge && inZoneCombo(a.from) && x.pips >= 5 && !zone.has(a.to) && tok(y);
          if (zoneOut) bonus += o.kZoneOut;
          else if (strong && !mixAll && isMerge && (inZoneCombo(a.from) || inZoneCombo(a.to))) bonus -= o.zonePen;
          const lowPair = magPre && isMerge && x.pips <= o.magLowPips;
          let key, ev = 0, E, actAfter = 0;
          if (!isMerge && y.type === 'growth' && strongAct && x.pips >= o.growHazPips) {
            // 成長を潰す：ジョーカーでコピーしてから成長同士を合成する（2手分をまとめて評価）
            key = 'joker>growth';
            deckTypes.forEach((t, ti) => { const b = cur.slice(); b[a.from] = null; b[a.to] = mk(t, x.pips + 1);
              ev += deckW[ti] * phi(future(b), n0); actAfter += deckW[ti] * (isAct(b) ? 1 : 0); });
            E = ((o.eff && o.eff['growth+growth']) || 0) - 0.05;
          } else if (!isMerge) {
            key = 'joker>' + y.type;
            const b = cur.slice(); b[a.from] = mk(y.type, x.pips);
            ev = phi(future(b), n0); actAfter = isAct(b) ? 1 : 0;
            E = key === 'joker>moon' ? (x.pips <= o.moonCopy.splitPips ? o.moonCopy.lo : o.moonCopy.hi) : ((o.eff && o.eff[key]) || 0);
          } else {
            key = pairKey(x.type, y.type);
            const dn = (x.type === 'combo' || y.type === 'combo') ? 1 : 0;
            deckTypes.forEach((t, ti) => {
              const b = cur.slice(); b[a.from] = null; b[a.to] = mk(t, x.pips + 1);
              ev += deckW[ti] * phi(future(b), n0 + dn); actAfter += deckW[ti] * (isAct(b) ? 1 : 0);
            });
            E = (o.eff && o.eff[key]) || 0;
          }
          const repair = !act0 && actAfter >= 0.79;
          const S = E - o.lowFirst * x.pips + ev - phiNow + bonus;
          list.push({ a, S, key, repair, x, y, actAfter, combo1, lowPair, zoneOut });
        }
        return list;
      };
      // 向きに意味がなければ左（同じ列なら下）へ合成する
      const leftward = (best, list) => {
        if (!best || best.a.result !== 'merge') return best;
        const rev = list.find(c => c.a.from === best.a.to && c.a.to === best.a.from && c.a.result === 'merge');
        if (!rev || Math.abs(rev.S - best.S) > o.dirEps) return best;
        const col = i => i % 5, row = i => Math.floor(i / 5);
        const better = (p, q) => col(p) !== col(q) ? col(p) < col(q) : row(p) > row(q);
        return better(rev.a.to, best.a.to) ? rev : best;
      };
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to)
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        const rank = q => (q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (isCrit(q.to) ? 1 : 0);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      const pick = list => list.reduce((p, c) => !p || c.S > p.S ? c : p, null);
      const growKeys = ['adaptive+growth', 'growth+growth', 'joker>growth'];

      // ---- 放置・保持（成長を潰す手だけ。危なければ緊急のPU） ----
      if (idle || hold) {
        if ((danger || pressed) && o.puMode !== 'never') { const r = tryPu(danger ? '危ない' : '押されている'); if (r) return r; }
        if (!canAct) return null;
        const hz = cur.some(d => d && d.type === 'growth' && d.pips >= o.growHazPips && d.pips < 7);
        if (!hz) return null;
        const list = evalActs({}).filter(c => growKeys.includes(c.key) && c.x.pips >= o.growHazPips && c.S > 0 && !pendCells.has(c.a.to));
        const best = leftward(pick(list), list);
        return best ? opAct(best.a, `成長を潰す ${best.key} 出目${best.x.pips} ${best.a.from}→${best.a.to} S=${best.S.toFixed(2)}`) : null;
      }

      // ---- マジシャン合わせ ----
      if (magNow && o.magSync && magTake && pend.length && !moonThreat) {
        ST.wantFast = true;
        if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: 'マジシャン合わせ：召喚' };
        if (!canAct) return null;
        const prot = i => (cur[i].type === 'moon' && (cur[i].pips === 7 || i === main)) || inZoneCombo(i) || (cur[i].type === 'combo' && cur[i].pips >= o.magSyncComboMax);
        const list = evalActs({ all: true }).filter(c => !prot(c.a.from));
        const c1 = list.filter(c => pendCells.has(c.a.to) && !pendCells.has(c.a.from));
        let best = pick(c1);
        if (best) return opAct(best.a, `マジシャン合わせ：予告マスへ ${best.key} 出目${best.x.pips} ${best.a.from}→${best.a.to}`);
        const want = new Set(); for (const i of pendCells) if (cur[i] && cur[i].pips < 7) want.add(cur[i].pips);
        const c2 = list.filter(c => c.a.result === 'merge' && !pendCells.has(c.a.to) && !pendCells.has(c.a.from) && want.has(c.x.pips + 1) && !prot(c.a.to));
        best = pick(c2);
        if (best) return opAct(best.a, `マジシャン合わせ：相手を作る ${best.key} 出目${best.x.pips} ${best.a.from}→${best.a.to}`);
        return null;
      }
      if (moonThreat) ST.wantFast = true;

      // ---- 活性を切る ----
      if (wantInactive) {
        if (!act0) return null; // 切れている間は動かさない（雑魚を流す）
        if (!canAct) return null;
        const actF = fireRaw(base0, n0, true, K0), base = actF[0] + actF[1];
        let best = null;
        for (const a of acts) {
          if (early.has(a.from) || early.has(a.to)) continue;
          const x = cur[a.from], y = cur[a.to]; if (!x || !y) continue;
          let pIn = 0, rec = 0;
          const isStarOrMain = i => cur[i].type === 'moon' && (cur[i].pips === 7 || i === main);
          if (a.result === 'copy' && y.type === 'moon') {
            const b = cur.slice(); b[a.from] = mk('moon', x.pips);
            if (isAct(b)) continue; pIn = 1; const f = fireEff(b, n0, K0); rec = (f[0] + f[1]) / Math.max(base, 1);
          } else if (a.result === 'merge' && (x.type === 'moon' || y.type === 'moon') && !isStarOrMain(a.from) && !isStarOrMain(a.to) && !(leonAccept && x.pips >= 6)) {
            deckTypes.forEach((t, ti) => { const b = cur.slice(); b[a.from] = null; b[a.to] = mk(t, x.pips + 1);
              if (!isAct(b)) { pIn += deckW[ti]; const f = fireEff(b, n0, K0); rec += deckW[ti] * (f[0] + f[1]) / Math.max(base, 1); } });
            if (pIn > 0) rec /= pIn;
          } else continue;
          if (pIn < 0.75 || rec < o.deactMinRecover) continue;
          // レオンを受けるときは月を増やす（コピー）ほうを高く。それ以外は低い出目の手から
          const sc = rec - 0.05 * x.pips + (leonAccept && a.result === 'copy' ? 1 : 0);
          if (!best || sc > best.sc) best = { a, sc, rec };
        }
        if (best) return opAct(best.a, `活性を切る ${best.a.result === 'copy' ? 'ジョーカー→月' : '月の合成'} 出目${cur[best.a.from].pips} ${best.a.from}→${best.a.to}（戻せる火力 ${(best.rec * 100).toFixed(0)}%）`);
        // 切る手がなければ、そのまま通常の動きへ
      }

      // ---- レオン前（2Wまで）：出目1コンボを合成 ----
      if (leonPre && obs.wave <= o.leonForceToWave && canAct) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) { const a = toAdaptive(f[0]); return opAct(a, 'レオン前（2Wまで）：出目1コンボを合成'); }
      }

      // ---- ナイトの演出中：出目6の月へ同じ出目の適応を合成して星の月を狙う ----
      if (o.knightStar && knightAccept && obs.phase === 'intro' && !hasStar && canAct) {
        const a = acts.find(q => q.result === 'merge' && cur[q.to] && cur[q.to].type === 'moon' && cur[q.to].pips === 6 && cur[q.from] && cur[q.from].type === 'adaptive' && !early.has(q.to));
        if (a) return opAct(a, `ナイトの演出中：出目6の月へ適応を合成（星の月狙い） ${a.from}→${a.to}`);
      }

      // ---- 重ねる操作（合成が先） ----
      // ジョーカーで月をコピーしてよいのは：序盤／活性していなくて、ボス前の演出・ボス戦・ウェーブ終わり・危ないとき（最後の手段）
      const lastResort = !act0 && (bossNow || danger || (obs.phase === 'wave' && tl <= 3) || (obs.phase === 'intro' && (obs.introLeft == null || obs.introLeft <= 1.2 || !obs.legal.summon)));
      const moonCopyOk = obs.wave <= o.moonCopyFreeToWave || lastResort;
      const shortNow = rz < o.notFullShort;
      const okKeys = !strong ? (obs.wave >= o.fullOnlyFromWave ? ['joker>combo'] : o.notFullKeysEarly) : o.notFullKeysToa;
      let best = null, stuck = false;
      const sig = obs.phase + (act0 ? 'A' : 'I') + ST.mode + (moonCopyOk ? 'c' : '') + (shortNow ? 's' : '') + (magPre ? 'm' : '') + cur.map(d => d ? d.type[0] + d.pips + (d.sealed ? 'x' : '') + (d.hacked ? 'h' : '') : '-').join('');
      const cached = ST.noopSig === sig && obs.t < ST.noopUntil;
      if (canAct && acts.length && !cached) {
        const list = evalActs({ moonCopy: moonCopyOk }).filter(c => {
          if (full || acceptEarn || mixAll) return true;
          if (c.repair || shortNow || earnFree || c.combo1 || c.lowPair || c.zoneOut) return true;
          if (pendCells.has(c.a.from) || pendCells.has(c.a.to) || c.x.hacked || c.y.hacked) return true;
          return okKeys.includes(c.key);
        });
        best = leftward(pick(list), list);
        stuck = full && (!best || best.S <= o.stuckS);
        if (best) {
          let ok;
          if (mixAll) ok = best.S > -o.acceptMaxLoss;
          else if (acceptEarn) ok = best.S > -o.earnMaxLoss;
          else if (!full) ok = best.S > o.minScoreNotFull || (best.repair && best.S > -o.earnMaxLoss);
          else ok = strongAct ? best.S > -o.earnMaxLoss : true;
          if (!ok) best = null;
        }
        if (!best) { ST.noopSig = sig; ST.noopUntil = obs.t + 0.4; }
      } else if (cached) stuck = full;
      if (best) {
        const a = toAdaptive(best.a);
        return opAct(a, `${best.key} 出目${obs.board[a.from].pips} ${a.from}→${a.to} S=${best.S.toFixed(2)} 雑魚${rz.toFixed(2)} ボス${rb.toFixed(2)}${act0 ? '' : ' 非活性'}${best.repair ? ' 活性に戻す' : ''}${hasStar ? ' 星' : ''}${knight ? ' ナイト' : ''}`);
      }

      // ---- 召喚（合成の後） ----
      const stopSummon = (leonStop && !leonAccept) || magPre;
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !stopSummon && (canAct || !act0 || !strong)) {
        const reserveOk = !strong || obs.wave < o.reserveFromWave || !act0 || danger || obs.sp - obs.summonCost >= o.reserveSummons * obs.summonCost;
        if (reserveOk) {
          if (!act0 || rz < 1 || earnFree) return { ops: [{ op: 'summon' }], more: true, note: act0 ? (earnFree && rz >= 1 ? '召喚（稼ぎ）' : '召喚（雑魚火力が足りない）') : '召喚（活性を戻す）' };
          const empt = []; for (let i = 0; i < 15; i++) if (!cur[i]) empt.push(i);
          let ev = 0;
          for (const i of empt) deckTypes.forEach((t, ti) => { const b = cur.slice(); b[i] = mk(t, 1); ev += deckW[ti] * phi(future(b), n0) / empt.length; });
          if (ev - phiNow > -o.summonTol) return { ops: [{ op: 'summon' }], more: true, note: `召喚 ΔΦ=${(ev - phiNow).toFixed(2)}` };
        }
      }

      // ---- 緊急のPU ----
      if (o.puMode !== 'never') {
        if ((danger && (stuck || starLost || act0)) || pressed) { const r = tryPu(pressed && !danger ? '押されている' : stuck ? '詰み' : starLost ? '星の月を失った' : '危ない'); if (r) return r; }
        if (o.puMode === 'free' && full && !obs.legal.summon) { const r = tryPu('空きなし'); if (r) return r; }
      }
      return null;
    }

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const r = core(obs);
      if (ST.wantFast !== ST.fast) {
        ST.fast = ST.wantFast;
        const lim = ST.fast ? o.limitsFast : o.limitsNormal;
        ctx.log(ST.fast ? 'リミット解除' : 'リミットを戻す');
        if (r) { r.limits = lim; return r; }
        return { ops: [], limits: lim };
      }
      return r;
    } };
  },
});
