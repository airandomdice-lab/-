// 月コンロイヤル基本AI 1.1.0（AI API v1／AIRandomDicesim 4.3.4 で確認）
//   1.1.0：月の個数の扱いを月の裏（活性2・4・6個）と表（3・5・7個）の両方に対応させた。
//          活性の判定・活性の保険（次の1手で戻せるか）・活性を切る手は、もとから活性の個数の表（AC）で計算していた。
//          表を前提にしていたのは「1Wの出目2以下の月のペアはすぐ合成」だけだったので、活性していれば合成後も活性が保てるときだけにした（w1PairActGuard）
//          対戦120試合（相手：成長月コン）：月の裏あり 40勝（1.0.0 は60試合で13〜20勝）、月の裏なし 44勝
// 登録ID：moon_combo_royal（楽園月コンToAAI〔moon_combo_paradise_toa〕などと同時に読み込める。ファイル全体を関数で包み、名前がほかのAIとぶつからないようにしている）
// 想定デッキ：祝福で上から コンボ・月・成長・ジョーカー・ロイヤル（コンボが出やすく、ロイヤルが出にくい）。本家 6.6.5、対戦用
// 月の裏：あり・なしのどちらでも動く（1.1.0〜）
// 出典：迷走てんしさんの月コンロイヤルの解説、ドキュメント「月コンロイヤル 完全解説（机上の空論版）」
//
// しくみ：楽園月コンToAAI 1.4.3（祝福の出やすさとコンボの攻撃力+10%を見積もりに入れた版）を CORE として中に持ち、
//         その外側でロイヤルの判断をする。CORE からの変更は次の3つ
//   ・放置（idle）をしない（idleMinSp を無限大に）
//   ・強い盤面では、活性の最小個数を超える月1個ごとに kExtraMoon を減点できる（既定0。最高出目の月以外をたたむ方向へ）
//   ・ロイヤルは CORE に渡さない（種と弾として残す）。星の月が活性している間は、ロイヤルをコピーできるジョーカーも渡さない
//
// 1回の判断の順番
//   1) 星の月があれば、月 → コンボ の順に Lv MAX まで PU
//   2) ロイヤルのペアを打つ：星の月が活性しているとき（ロイヤルモード）か、星の月の前で royalFromWave 以降。
//      相手の判定は陰陽ロイヤルAIと同じ（D≥0・相手の先頭が2つ目の角の手前・まだ打っていないウェーブで R>0 なら打たない・ウェーブ開始5秒は判断しない）。
//      練習（相手なし）では判定しない。同じ出目が royalKeep+2 個以上のときだけ打つ（1個は種に残す。D≥dAggressive か、同じ出目のジョーカーがなければペアでも）
//   3) ジョーカーでロイヤルをコピー：ロイヤルモードではいつでも。星の月の前は、この試合で出たロイヤルの割合が少ないときだけ
//   4) それ以外は CORE（楽園月コンToAAI）の手
//   4.5) ロイヤルモードで CORE に手がなく盤面が埋まっていれば、火力ゾーン・ロイヤル・残すジョーカー・月以外の同じ種類どうしを合成して空ける
//   5) ロイヤルモードで CORE に手がなければ、召喚 starSummonKeep 回分のSPを残して召喚（ロイヤルの補充）
//   6) 盤面が埋まって打つ手がなければ、ロイヤルのペアをたたむ（低い出目から）
//
// 検証（AIRandomDicesim 4.3.4、本家 6.6.5、祝福Lv20、月12・ほかの伝説11・適応15、CD3000%）
//   対戦120試合（相手：楽園月コンToAAI・適応入りの成長月コン、同じ祝福）：49勝（ロイヤルを狙って打たない ToAAI のままだと41勝）
//   （1.0.0）月の裏をつけると 13〜20勝/60（つけないと 25〜28勝/60）。kExtraMoon 0.3 も 13勝/60 に下がった
//   （1.1.0）対戦120試合：月の裏あり 40勝・なし 44勝・裏あり＋kExtraMoon 0.3 は 35勝。
//            活性していた時間の割合：裏あり 0.66・なし 0.58。星の月ができた試合の勝ち：裏あり 18/31・なし 23/34
//            練習60試合（月の裏あり）：平均13.2W・最高40W、星の月ができた試合で星の後に平均8回ロイヤルを打った
//   練習60試合：到達は ToAAI のままとほぼ同じ（平均12〜13W）。星の月ができた試合では、星の後だけで平均8.6回ロイヤルを打った
(() => {
const CORE = {
  name: '楽園月コンToAAI',
  desc: '',
  options: {
    limitsNormal: { interval: 0.1, summonInterval: 0.3, actInterval: 0.5, dragTime: 0.2 },
    limitsFast: { interval: 0.1, summonInterval: 0.2, actInterval: 0.2, dragTime: 0.2 },
    strongFromWave: 3, holdMoonPips: 4,
    holdFrac: 0.5,
    pushProg: 0.45, pushBackTo: 0.25, pressedRatio: 1.0,
    idleMinSp: Infinity, idleAhead: 3, idleZ: 1.5, idleB: 1.5,
    earnFree: false,
    earnMaxLoss: 2.0,
    acceptMaxLoss: 6.0,
    midLo: 3, midHi: 5, midHoldPen: 0.6,
    zonePen: 1.0,
    sixRule: true,
    kGrowHaz: 0.6, growHazPips: 2,
    moonCopyFreeToWave: 0,
    careMoonPips: 3, careComboPips: 2,
    w1JokerCombo: true, jokerGrowthMinPips: 2, noGrowthPairUntilStrong: true,
    maxInflowPerDt: 5.6, zakoSpeed: 0.6,
    rotGrowPips: 4, rotMaxLoss: 2.0, rotMatchBonus: 1.0,
    magJoker: true, mjMoonMin: 6, mjJokerMin: 4, mjKillT: 1.5,
    w1MoonPairMax: 2,
    w1PairActGuard: true,                  // 1W の月のペアの合成は、活性していれば合成後も活性が保てるときだけ（月の裏では月2個で活性するため）
    kExtraMoon: 0,                         // 月コンロイヤル：強い盤面で、活性の最小個数を超える月1個ごとの減点（最高出目以外の月をたたむ）。0.3 は対戦で弱くなったので既定は0
    reserveSummons: 8, reserveFromWave: 5,
    puMode: 'toa',
    moonPuPips: 4, moonPuLv: 5, comboPuLv: 3, comboPuFromWave: 3, corner1: 3.5, puSpareSummons: 3,
    moonMergeLock: true, moonLockPips: 4, moonLockAll: false, moonLockTies: false,
    knightEarnLeft: 25, knightMixLeft: 10, knightStar: true,
    leonAccept: true, leonStarMoons: 3, leonOtherStars: 3, leonTau: 0.5,
    magTake: true, magSync: true, magSyncComboMax: 8, magLead: 15, magLowPips: 2, magLowBonus: 0.6, kZoneOut: 1.0, kWMag: 4.0,
    deactLead: 8, flowProg: 0.5, magKillProg: 0.62, deactMinRecover: 0.6,
    dirEps: 0.03,
    notFullKeysToa: ['joker>combo', 'adaptive+combo', 'adaptive+growth', 'growth+growth', 'joker>growth'],
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
    const ST = { mjW: null, mjState: '', mjLatch: null, hadStar: false, fast: false, wantFast: false, push: false, mix: null, noopSig: '', noopUntil: 0, mode: '' };
    const setMode = m => { if (ST.mode !== m) { ST.mode = m; ctx.log(`モード：${m}`); } };

    function core(obs) {
      ST.wantFast = false;
      const ctl = obs.control || {};
      const deckTypes = obs.deck.map(d => d.type);
      const bless = obs.field && obs.field.blessing;
      const deckW = bless && Array.isArray(bless.weights) && bless.weights.length === deckTypes.length ? bless.weights : deckTypes.map(() => 1 / deckTypes.length);
      const st = t => obs.deck.find(d => d.type === t);
      const cb = st('combo'), mn = st('moon');
      const cfire = (cbLv, moonLv) => ({
        B: cb ? (10 + 10 * (cb.cls - 7) + 10 * (cbLv - 1)) * (bless && bless.up === 'combo' ? 1.1 : 1) : 0,
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
      const cares = b => { for (let i = 0; i < 15; i++) { const d = b[i]; if (!d || d.type !== 'moon' || d.pips < o.careMoonPips) continue;
        for (const j of nb[i]) if (b[j] && b[j].type === 'combo' && b[j].pips >= o.careComboPips) return true; } return false; };
      const careNow = cares(base0);
      const hasCombo = p => cur.some(d => d && d.type === 'combo' && d.pips === p);

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
      const pc = deckTypes.includes('combo') ? deckW[deckTypes.indexOf('combo')] : 0;
      const magNow = !!(bossNow && obs.boss.type === 'magician');
      const magPre = magTake && obs.phase === 'wave' && tl <= o.magLead;

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
        if (!cares(b)) return fireRaw(b, n, false, K);
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
      let knightAccept = false;
      if (knight) {
        knight = false; const fbr = fire(base0, n0, K0)[0]; knight = true;
        const hp = bossNow ? obs.boss.hp : bossPred(obs.wave, sumHp(obs.enemies));
        const pierceT = bossNow ? Math.max(0.3, obs.boss.skillIn || 0) : o.bossFirst;
        const mixed = ST.mix && ST.mix.wave === obs.wave;
        if (!mixed && fbr * pierceT >= hp * o.knightPierce) knight = false; else knightAccept = strong || mixed;
      }
      if (knight) wb *= o.knightBossMul;
      if (knightAccept && obs.phase === 'wave' && tl <= o.knightMixLeft && !(ST.mix && ST.mix.wave === obs.wave)) { ST.mix = { wave: obs.wave }; ctx.log(`ナイトを受ける：残り${o.knightMixLeft}秒、火力ゾーンも混ぜる`); }
      const mixAll = !!(ST.mix && ST.mix.wave === obs.wave && (obs.phase === 'wave' || obs.phase === 'intro'));
      const acceptEarn = ((knightAccept || leonAccept) && ((obs.phase === 'wave' && tl <= o.knightEarnLeft) || obs.phase === 'intro'));

      const strongAct = strong && act0;
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
        if (strong && o.kExtraMoon) v -= o.kExtraMoon * Math.max(0, moonCnt(b) - AC[0]);
        const [fb, fz] = fire(b, n, K);
        const u = r => o.marginHi * (1 - Math.exp(-Math.max(r, 0) / o.marginHi));
        v += o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
        return v;
      };
      const [fb0, fz0] = fire(base0, n0, K0);
      const rz = fz0 / needZ, rb = fb0 / needB;

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
      const pressed = act0 && rz < o.pressedRatio && leadProg >= o.pushProg && !bossNow;

      const protCells = new Set();
      let mj = null, mjReady = false, mjWhy = '';
      if (o.magJoker && magCase && hasStar) {
        mjWhy = !magTake ? '強い盤面でない' : '条件に合わない（月・星のコンボ・隣のマス）';
        const blocked = j => !!(cur[j] && (cur[j].type === 'moon' || (cur[j].pips === 7 && cur[j].type !== 'combo')));
        const big = [];
        for (let i = 0; i < 15; i++) if (cur[i] && cur[i].type === 'moon' && cur[i].pips >= o.mjMoonMin && !cur[i].sealed && nb[i].some(j => !blocked(j))) big.push(i);
        if (big.length === 1 && cur[big[0]].pips === 7) {
          const S = big[0], zoneS = new Set(nb[S]);
          const starCombo = nb[S].some(j => cur[j] && cur[j].type === 'combo' && cur[j].pips === 7);
          const free = nb[S].filter(j => !(cur[j] && (cur[j].pips === 7 || cur[j].type === 'moon')));
          if (!starCombo && free.length >= 2) {
            const hp = bossNow ? obs.boss.hp : bossPred(obs.wave, sumHp(obs.enemies));
            const A = K0.B + K0.D * n0 * (n0 + 1) / 2, Sv = (MOON_CLS * 7 + 2 * (K0.L - 1)) / 100 * 1.03;
            const V = 1 / Math.max(0.05, 1 - Math.min(0.95, Sv - tSlow)), c = Math.min(1, C0 + 0.35);
            const fOf = q => q * A * 1.7 * ((1 - c) + c * CD) * V / 1.2;
            let pMin = 0; for (let q = o.mjJokerMin; q <= 7; q++) if (fOf(q) * o.mjKillT >= hp) { pMin = q; break; }
            mjWhy = pMin ? '' : '火力が足りない';
            if (pMin && magTake) {
              const out = i => !zoneS.has(i) && i !== S;
              let J = -1; for (const i of zoneS) if (cur[i] && cur[i].type === 'joker' && cur[i].pips >= pMin && !cur[i].sealed && (J < 0 || cur[i].pips > cur[J].pips)) J = i;
              let Cp = -1; if (J >= 0) for (let i = 0; i < 15; i++) if (out(i) && cur[i] && cur[i].type === 'combo' && cur[i].pips === cur[J].pips && !cur[i].sealed) { Cp = i; break; }
              mj = { S, zoneS, pMin, out, J, Cp };
              mjReady = J >= 0 && Cp >= 0;
              if (J >= 0) protCells.add(J);
              if (Cp >= 0) protCells.add(Cp);
            }
          }
        }
      }

      const lt = ST.mjLatch;
      if (!mjReady && lt && lt.wave === obs.wave && (obs.phase === 'intro' || magNow) && cur[lt.J] && cur[lt.J].type === 'joker' && !cur[lt.J].sealed
        && cur[lt.Cp] && cur[lt.Cp].type === 'combo' && cur[lt.Cp].pips === cur[lt.J].pips && cur[lt.S] && cur[lt.S].type === 'moon' && cur[lt.S].pips === 7) {
        const zoneS = new Set(nb[lt.S]);
        mj = { S: lt.S, zoneS, pMin: cur[lt.J].pips, out: i => !zoneS.has(i) && i !== lt.S, J: lt.J, Cp: lt.Cp };
        mjReady = true; protCells.add(lt.J); protCells.add(lt.Cp);
      }
      if (mjReady && (obs.phase === 'intro' || magNow)) ST.mjLatch = { wave: obs.wave, S: mj.S, J: mj.J, Cp: mj.Cp };
      if (magCase && hasStar) { const stt = mj ? (mjReady ? '準備完了' : mj.J >= 0 ? 'B（外のコンボ待ち）' : `A（出目${mj.pMin}以上のジョーカー狙い）`) : 'なし：' + mjWhy;
        if (ST.mjState !== stt) { ST.mjState = stt; ctx.log(`中出目ジョーカーの状態：${stt}`); } } else ST.mjState = '';
      const moonThreat = magNow && pend.some(q => q.cells.some(i => cur[i] && cur[i].type === 'moon' && (cur[i].pips === 7 || i === main)));
      let wantInactive = false;
      if (magTake && !moonThreat && !mjReady) {
        if (obs.phase === 'wave' && tl <= o.deactLead && leadProg < o.flowProg) wantInactive = true;
        if (obs.phase === 'intro') wantInactive = true;
        if (magNow && leadProg < o.magKillProg && obs.boss.cast < 2 + (pend.length ? 1 : 0)) wantInactive = true;
      }
      if (leonAccept) {
        if (obs.phase === 'wave' && tl <= o.deactLead && leadProg < o.flowProg) wantInactive = true;
        if (obs.phase === 'intro' || bossNow) wantInactive = true;
      }

      if (!act0 || obs.phase !== 'wave' || leadProg <= o.pushBackTo) ST.push = false;
      else if (strong && leadProg >= o.pushProg) ST.push = true;
      const zs = (zk.find(e => e.kind === 'normal') || {}).baseSpeed || o.zakoSpeed;
      const enough = fz0 >= o.maxInflowPerDt / waveDt(w) * H && H / Math.max(fz0, 1) <= o.corner1 / zs;
      const wA = obs.wave + o.idleAhead;
      const idleNeedZ = inflow(wA, tableHP(wA, spawnSteps(wA))), idleNeedB = bossPred(wA, 0) / (bossTravel(wA) * o.bossKillFrac);
      const idle = hasStar && act0 && enough && obs.sp >= o.idleMinSp && fz0 >= o.idleZ * idleNeedZ && fb0 >= o.idleB * idleNeedB && rz >= 1 && !knight && !acceptEarn && !wantInactive && !magNow && !magPre;
      const hold = strongAct && !acceptEarn && !wantInactive && !magPre && !(magNow && pend.length)
        && ((obs.phase === 'wave' && enough && (elFrac >= o.holdFrac || ST.push)) || bossNow || obs.phase === 'intro');
      const earnWin = strong && !hold && !idle && (obs.phase === 'wave' || obs.phase === 'wait' || obs.phase === 'roll' || obs.phase === 'cleanup');
      if (earnWin && !wantInactive) ST.wantFast = true;
      const earnFree = o.earnFree && earnWin && !wantInactive && (obs.phase !== 'wave' || leadProg < o.pushProg);
      if (!act0 && (bossNow || obs.phase === 'intro') && !wantInactive) ST.wantFast = true;
      setMode(idle ? '放置' : hold ? (ST.push ? '押し返し' : '保持') : wantInactive ? '活性を切る' : acceptEarn ? '受ける（稼ぎ）' : earnWin ? (enough || obs.phase !== 'wave' ? '稼ぎ' : '稼ぎ（火力不足）') : '通常');

      const canAct = !ctl.dragging && !(ctl.actReadyIn > 0);
      let moonTop = 0; for (const d of cur) if (d && d.type === 'moon') moonTop = Math.max(moonTop, d.pips);
      let lockCell = -1;
      for (let i = 0; i < 15; i++) { const d = cur[i]; if (!d || d.type !== 'moon' || d.pips !== moonTop) continue;
        if (lockCell < 0 || adjCombo(i) > adjCombo(lockCell) || (adjCombo(i) === adjCombo(lockCell) && i === main)) lockCell = i; }
      const isTopMoon = i => cur[i] && cur[i].type === 'moon' && (o.moonLockAll || (o.moonLockTies ? cur[i].pips === moonTop : i === lockCell));
      const moonLock = o.moonMergeLock && moonTop >= o.moonLockPips && !(knightAccept && obs.phase === 'intro');
      const acts = obs.legal.acts.filter(a => (a.result === 'merge' || a.result === 'copy')
        && !(moonLock && a.result === 'merge' && (isTopMoon(a.from) || isTopMoon(a.to))));
      const opAct = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
      const phiNow = phi(base0, n0);

      const evalActs = opt => {
        const list = [];
        for (const a of acts) {
          if (early.has(a.from) || early.has(a.to)) continue;
          const x = cur[a.from], y = cur[a.to];
          if (!x || !y) continue;
          if (!opt.mj && (protCells.has(a.from) || protCells.has(a.to))) continue;
          const isMerge = a.result === 'merge';
          if (!isMerge && y.type === 'moon' && !opt.moonCopy && !(leonAccept && x.pips === 7)) continue;
          if (o.noGrowthPairUntilStrong && !strong && !opt.gg && isMerge && x.type === 'growth' && y.type === 'growth') continue;
          if (o.w1JokerCombo && obs.wave === 1 && (x.type === 'joker' || y.type === 'joker')
            && !(!isMerge && (y.type === 'combo' || (y.type === 'growth' && x.pips >= o.jokerGrowthMinPips && !hasCombo(x.pips))))) continue;
          if (!opt.all && isMerge && sixZone && x.pips === 5 && sixZone.has(a.to) && !has6Free && !mixAll) continue;
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
          if (strong && !acceptEarn && !mixAll && tau < 0.8 && x.pips >= o.midLo && x.pips <= o.midHi
            && ((tok(x) && y.type === 'combo') || (isMerge && tok(y) && x.type === 'combo'))) bonus -= o.midHoldPen;
          const zoneOut = magPre && isMerge && inZoneCombo(a.from) && x.pips >= 5 && !zone.has(a.to) && tok(y);
          if (zoneOut) bonus += o.kZoneOut;
          else if (strong && !mixAll && isMerge && (inZoneCombo(a.from) || inZoneCombo(a.to))) bonus -= o.zonePen;
          const lowPair = magPre && isMerge && x.pips <= o.magLowPips;
          let key, ev = 0, E, actAfter = 0;
          if (!isMerge && y.type === 'growth' && strongAct && x.pips >= o.growHazPips) {
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
          const repair = careNow && !act0 && actAfter >= 0.79;
          const S = E - o.lowFirst * x.pips + ev - phiNow + bonus;
          list.push({ a, S, key, repair, x, y, actAfter, combo1, lowPair, zoneOut });
        }
        return list;
      };
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

      if (mj) {
        const { S, zoneS, pMin, out, J, Cp } = mj;
        const usable = i => out(i) && cur[i] && cur[i].type !== 'moon' && !protCells.has(i) && !cur[i].sealed;
        const rot = (P, tag) => {
          if (canAct) {
            const list = evalActs({ all: true }).filter(c => c.a.result === 'merge' && usable(c.a.from) && usable(c.a.to));
            for (const c of list) c.R = c.S + (P.has(c.x.pips + 1) ? o.rotMatchBonus : 0);
            const b = list.reduce((q, c) => !q || c.R > q.R ? c : q, null);
            if (b && b.R > -o.rotMaxLoss) return opAct(b.a, `中出目ジョーカー：${tag} ${b.key} 出目${b.x.pips} ${b.a.from}→${b.a.to}`);
          }
          if (obs.legal.summon && !(ctl.summonReadyIn > 0) && obs.sp - obs.summonCost >= o.reserveSummons * obs.summonCost) return { ops: [{ op: 'summon' }], more: true, note: `中出目ジョーカー：${tag} 召喚` };
          return null;
        };
        const zoneCombos = [...zoneS].filter(i => cur[i] && cur[i].type === 'combo' && cur[i].pips < 7 && !cur[i].sealed);
        const partnerOf = i => { for (let t = 0; t < 15; t++) if (usable(t) && cur[t].pips === cur[i].pips && ['combo', 'adaptive', 'joker'].includes(cur[t].type)) return t; return -1; };
        if (magNow) {
          if (mjReady && (moonThreat || leadProg >= o.magKillProg || (obs.boss.cast >= 2 && !pend.length))) {
            ST.wantFast = true;
            const a = canAct ? acts.find(q => q.result === 'copy' && q.from === J && q.to === Cp) : null;
            if (a) return opAct(a, `中出目ジョーカー：出目${cur[J].pips}のコンボをコピーして倒す ${J}→${Cp}`);
            if (!canAct) return null;
          }
        } else if (obs.phase === 'intro') {
          if (mjReady) {
            ST.wantFast = true;
            if (!canAct) return null;
            for (const i of zoneCombos) {
              const t = partnerOf(i); if (t < 0) continue;
              const a = cur[t].type === 'joker' ? acts.find(q => q.result === 'copy' && q.from === t && q.to === i)
                                                : acts.find(q => q.result === 'merge' && q.from === i && q.to === t);
              if (a) return opAct(a, `中出目ジョーカー：逃がす ${a.from}→${a.to}`);
            }
          }
        } else if (obs.phase === 'wave' && act0) {
          if (J < 0) {
            if (enough) {
              const cand = [...zoneS].filter(i => cur[i] && cur[i].type !== 'moon' && cur[i].pips < 7 && !cur[i].sealed);
              let W = ST.mjW != null && cand.includes(ST.mjW) ? ST.mjW : -1;
              if (W < 0 && cand.length) W = cand.reduce((q, i) => { const r = x => (cur[x].type === 'combo' ? 10 : 0) + cur[x].pips; return r(i) < r(q) ? i : q; });
              ST.mjW = W >= 0 ? W : null;
              if (W >= 0) {
                const d = cur[W];
                if (canAct) {
                  const pool = acts.filter(q => q.result === 'merge' && ((q.to === W && usable(q.from)) || (q.from === W && usable(q.to))));
                  const a = d.pips >= 5 ? pool.find(q => q.from === W) : pool.find(q => q.to === W);
                  if (a) return opAct(a, `中出目ジョーカー ${a.from}→${a.to}`);
                }
                const r = rot(new Set([d.pips]), `隣のマスの相方（出目${d.pips}）を作る`); if (r) return r;
              }
            }
          } else if (Cp < 0) {
            const r = rot(new Set([cur[J].pips]), `出目${cur[J].pips}のコンボを外に作る`); if (r) return r;
          } else {
            const need = new Set();
            for (const i of zoneCombos) { const t = partnerOf(i); if (t >= 0) protCells.add(t); else need.add(cur[i].pips); }
            if (need.size) { const r = rot(need, `逃がし先を作る`); if (r) return r; }
          }
        }
      }

      const hazG = cur.filter(d => d && d.type === 'growth' && d.pips >= o.growHazPips && d.pips < 7 && !d.sealed);
      let allActs = null;
      if (hazG.length && strongAct && enough && canAct && !wantInactive && !acceptEarn && !magNow && !magPre) {
        allActs = evalActs({});
        const list = allActs.filter(c => growKeys.includes(c.key) && c.x.pips >= o.growHazPips && !pendCells.has(c.a.to) && !inZoneCombo(c.a.from) && !inZoneCombo(c.a.to));
        const top = list.reduce((p, c) => !p || c.x.pips > p.x.pips || (c.x.pips === p.x.pips && c.S > p.S) ? c : p, null);
        const best = top ? leftward(top, list.filter(c => c.x.pips === top.x.pips)) : null;
        if (best) return opAct(best.a, `成長を潰す ${best.key}`);
      }

      if (idle || hold) {
        if ((danger || pressed) && o.puMode !== 'never') { const r = tryPu(danger ? '危ない' : '押されている'); if (r) return r; }
        const bigP = new Set(hazG.filter(d => d.pips >= o.rotGrowPips).map(d => d.pips));
        if (!bigP.size || obs.phase !== 'wave' || !enough) return null;
        if (canAct) {
          const moonKey = i => cur[i].type === 'moon' && (cur[i].pips === 7 || i === main);
          const list = (allActs || evalActs({})).filter(c => !inZoneCombo(c.a.from) && !inZoneCombo(c.a.to) && !moonKey(c.a.from) && !moonKey(c.a.to));
          for (const c of list) c.R = c.S + (c.a.result === 'merge' && bigP.has(c.x.pips + 1) ? o.rotMatchBonus : 0);
          const best = list.reduce((p, c) => !p || c.R > p.R ? c : p, null);
          if (best && best.R > -o.rotMaxLoss) return opAct(best.a, `盤面を回す ${best.key}`);
        }
        if (obs.legal.summon && !(ctl.summonReadyIn > 0) && obs.sp - obs.summonCost >= o.reserveSummons * obs.summonCost) {
          const empt = []; for (let i = 0; i < 15; i++) if (!cur[i]) empt.push(i);
          let ev = 0;
          for (const i of empt) deckTypes.forEach((t, ti) => { const b = cur.slice(); b[i] = mk(t, 1); ev += deckW[ti] * phi(future(b), n0) / empt.length; });
          if (ev - phiNow > -o.rotMaxLoss) return { ops: [{ op: 'summon' }], more: true, note: `召喚（成長の相方狙い）` };
        }
        return null;
      }

      if (magNow && o.magSync && magTake && pend.length && !moonThreat) {
        ST.wantFast = true;
        const sm = obs.legal.summon && !(ctl.summonReadyIn > 0) ? { ops: [{ op: 'summon' }], more: true, note: 'マジシャン合わせ：召喚' } : null;
        if (!canAct) return sm;
        const prot = i => (cur[i].type === 'moon' && (cur[i].pips === 7 || i === main)) || inZoneCombo(i) || (cur[i].type === 'combo' && cur[i].pips >= o.magSyncComboMax);
        const list = evalActs({ all: true }).filter(c => !prot(c.a.from));
        const c1 = list.filter(c => pendCells.has(c.a.to) && !pendCells.has(c.a.from));
        let best = pick(c1);
        if (best) return opAct(best.a, `マジシャン合わせ：予告マスへ`);
        const typeRank = { growth: 0, adaptive: 1, joker: 1, combo: 2 };
        const cj = acts.filter(q => q.result === 'copy' && pendCells.has(q.from) && !early.has(q.from) && !pendCells.has(q.to) && cur[q.from] && cur[q.to]
          && cur[q.from].pips < 7 && cur[q.to].type !== 'moon' && !prot(q.to) && !protCells.has(q.to) && !protCells.has(q.from) && typeRank[cur[q.to].type] != null);
        if (cj.length) {
          const a = cj.reduce((p, q) => typeRank[cur[q.to].type] < typeRank[cur[p.to].type] ? q : p);
          return opAct(a, `マジシャン合わせ：予告マスのジョーカーでコピー`);
        }
        const want = new Set(); for (const i of pendCells) if (cur[i] && cur[i].pips < 7) want.add(cur[i].pips);
        const c2 = list.filter(c => c.a.result === 'merge' && !pendCells.has(c.a.to) && !pendCells.has(c.a.from) && want.has(c.x.pips + 1) && !prot(c.a.to));
        best = pick(c2);
        if (best) return opAct(best.a, `マジシャン合わせ：相手を作る`);
        if (sm) return sm;
        const c3 = list.filter(c => !pendCells.has(c.a.to) && !pendCells.has(c.a.from) && !prot(c.a.to) && cur[c.a.to].type !== 'moon' && cur[c.a.from].type !== 'moon');
        best = pick(c3);
        if (best) return opAct(best.a, `マジシャン合わせ：盤面を回す`);
        return null;
      }
      if (moonThreat) ST.wantFast = true;

      if (wantInactive) {
        if (!act0) return null;
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
          const sc = rec - 0.05 * x.pips + (leonAccept && a.result === 'copy' ? 1 : 0);
          if (!best || sc > best.sc) best = { a, sc, rec };
        }
        if (best) return opAct(best.a, `活性を切る`);
      }

      // 1W の月のペア：活性していれば、合成しても（月が2個減っても）活性が保てるときだけ（月の裏・表の両方に対応）
      const w1PairOk = !o.w1PairActGuard || !AC.includes(moonCnt(cur)) || AC.includes(moonCnt(cur) - 2);
      if (obs.wave === 1 && canAct && w1PairOk) {
        const f = acts.filter(a => a.result === 'merge' && cur[a.from] && cur[a.to] && cur[a.from].type === 'moon' && cur[a.to].type === 'moon'
          && cur[a.from].pips <= o.w1MoonPairMax && !early.has(a.from) && !early.has(a.to));
        if (f.length) {
          const rank = a => cur[a.from].pips * 100 + (critCell[a.to] != null ? 50 : 0) + (a.to % 5) * 3 - Math.floor(a.to / 5);
          const a = f.reduce((p, q) => rank(q) < rank(p) ? q : p);
          return opAct(a, `1W：月のペアを合成`);
        }
      }

      if (canAct && (obs.wave === 1 || !strong)) {
        const cp = acts.filter(a => a.result === 'copy' && cur[a.from] && cur[a.to] && !early.has(a.from) && !early.has(a.to));
        const c1 = o.w1JokerCombo && obs.wave === 1 ? cp.find(a => cur[a.to].type === 'combo') : null;
        if (c1) return opAct(c1, `1W：ジョーカーでコンボをコピー`);
        const c2 = cp.find(a => cur[a.to].type === 'growth' && cur[a.from].pips >= o.jokerGrowthMinPips && !hasCombo(cur[a.from].pips));
        if (c2) return opAct(c2, `ジョーカーで成長をコピー`);
      }

      if (leonPre && obs.wave <= o.leonForceToWave && canAct) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) { const a = toAdaptive(f[0]); return opAct(a, 'レオン前（2Wまで）：出目1コンボを合成'); }
      }

      if (o.knightStar && knightAccept && obs.phase === 'intro' && !hasStar && canAct) {
        const a = acts.find(q => q.result === 'merge' && cur[q.to] && cur[q.to].type === 'moon' && cur[q.to].pips === 6 && cur[q.from] && cur[q.from].type === 'adaptive' && !early.has(q.to));
        if (a) return opAct(a, `ナイトの演出中：星の月狙い`);
      }

      const lastResort = careNow && !act0 && (bossNow || danger || (obs.phase === 'wave' && tl <= 3) || (obs.phase === 'intro' && (obs.introLeft == null || obs.introLeft <= 1.2 || !obs.legal.summon)));
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
        if (!best && full && o.noGrowthPairUntilStrong && !strong) { const l2 = evalActs({ moonCopy: moonCopyOk, gg: true }); best = leftward(pick(l2), l2); }
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
        return opAct(a, `${best.key}`);
      }

      const stopSummon = (leonStop && !leonAccept) || magPre;
      if (obs.legal.summon && !(ctl.summonReadyIn > 0) && !stopSummon && (canAct || !act0 || !strong)) {
        const reserveOk = !strong || obs.wave < o.reserveFromWave || !act0 || danger || obs.sp - obs.summonCost >= o.reserveSummons * obs.summonCost;
        if (reserveOk) {
          if ((careNow && !act0) || rz < 1 || earnFree) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
          const empt = []; for (let i = 0; i < 15; i++) if (!cur[i]) empt.push(i);
          let ev = 0;
          for (const i of empt) deckTypes.forEach((t, ti) => { const b = cur.slice(); b[i] = mk(t, 1); ev += deckW[ti] * phi(future(b), n0) / empt.length; });
          if (ev - phiNow > -o.summonTol) return { ops: [{ op: 'summon' }], more: true, note: `召喚` };
        }
      }

      if (o.puMode !== 'never') {
        if ((danger && (stuck || starLost || act0)) || pressed) { const r = tryPu('緊急'); if (r) return r; }
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
        if (r) { r.limits = lim; return r; }
        return { ops: [], limits: lim };
      }
      return r;
    } };
  },
};

// ---------- 月コンロイヤル：ロイヤルの判断（CORE の外側） ----------
RD.defineAgent('moon_combo_royal', {
  name: '月コンロイヤル基本AI',
  desc: '月コンロイヤル用（祝福：コンボ・月・成長・ジョーカー・ロイヤル、月の裏）。土台は楽園月コンToAAI。星の月の前は生き残り優先で、ロイヤルは相手のペース（D・R）で打つ（種を1個残す）。ロイヤルが少ない試合はジョーカーでコピー。星の月ができたら月とコンボをLv MAXにして、ロイヤルとジョーカーを残してペアを連打する。',
  options: Object.assign({}, CORE.options, {
    royalFromWave: 4,     // 星の月の前：このウェーブからロイヤルを打つ
    royalKeep: 1,         // 同じ出目のロイヤルを、コピー元としてこの数だけ残す
    seedNeedsJoker: true, // 種を残すのは、同じ出目のジョーカーがあるとき（すぐコピーできる）だけ
    starClear: true,
    holdPreStar: true,
    starRoyal: true,      // 星の月の後のロイヤルモード（false＝星の後もほかの手は CORE のまま。PU だけする）    // 星の月の前もロイヤルを CORE に渡さない（false＝星の月の前は CORE が合成に使ってよい）      // 星の後：CORE に手がなく盤面が埋まっていれば、火力ゾーン・ロイヤル・残すジョーカー以外を合成して空ける
    dAggressive: 6,       // D がこの値以上なら、種を残さずペアでも打つ
    dSkip: 5, dWindow: 5, stopPastPos: 8.5, reachCheck: true, normalSpeed: 0.6, // 相手の判定（陰陽ロイヤルAIと同じ）
    lowRoyalRatio: 0.6,   // 星の月の前：出たロイヤルの割合が出やすさ×この値未満なら、ジョーカーでロイヤルをコピーしてよい
    starPuTypes: ['moon', 'combo'], // 星の月ができたら、この順でLv MAXまでPU
    starSummonKeep: 3,    // 星の月の後：召喚この回数分のSPを残して、空きがあれば召喚
  }),
  limits: o => o.limitsNormal,
  create(ctx) {
    const o = ctx.options, NB = ctx.info.board.neighbors, TL = ctx.info.trackLength || 12;
    const core = CORE.create(ctx);
    const moonInfo = ctx.info.deck.find(d => d.type === 'moon');
    const AC = (moonInfo && moonInfo.activeCounts) || [3, 5, 7];
    const S = { seen: new Set(), seenRoyal: 0, fHist: [], waveSeen: null, waveT0: 0, firedWave: null, stats: { fire: 0, fireStar: 0, copy: 0, fold: 0 } };
    
    const opAct = (obs, a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }], more: true, note });
    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const b = obs.board, ctl = obs.control || {};
      const is = (i, t) => !!(b[i] && b[i].type === t);
      // ロイヤルの出た割合（試合ごとのばらつき）
      for (const d of b) if (d && !S.seen.has(d.id)) { S.seen.add(d.id); if (d.type === 'royal') S.seenRoyal++; }
      // 相手の処理の余裕 D・R
      if (obs.wave !== S.waveSeen) { S.waveSeen = obs.wave; S.waveT0 = obs.t; S.fHist = []; }
      const opp = obs.opponent;
      let D = null, Rr = null;
      if (opp && obs.phase === 'wave' && opp.phase === 'wave' && obs.timeLeft != null) {
        const pos = opp.front ? opp.front.progress * TL : 0;
        S.fHist.push({ t: obs.t, pos });
        while (S.fHist.length && S.fHist[0].t < obs.t - o.dWindow) S.fHist.shift();
        if (S.fHist.length >= 2) {
          const h0 = S.fHist[0], h1 = S.fHist[S.fHist.length - 1], v = (h1.pos - h0.pos) / Math.max(1e-6, h1.t - h0.t);
          D = (TL - pos) - obs.timeLeft * v; Rr = (TL - pos) - obs.timeLeft * o.normalSpeed;
        }
      } else if (obs.phase !== 'wave') S.fHist = [];
      let fireOk;
      if (!opp) fireOk = true; // 練習（相手なし）：判定しない
      else {
        const past = !!opp.front && opp.front.progress * TL > o.stopPastPos;
        fireOk = obs.phase === 'wave' && obs.t - S.waveT0 >= o.dSkip && D != null && D >= 0 && !past
          && !(o.reachCheck && Rr > 0 && S.firedWave !== obs.wave);
      }
      const keep = D != null && D >= o.dAggressive ? 0 : o.royalKeep;
      // 星の月と活性
      const stars = []; for (let i = 0; i < 15; i++) if (is(i, 'moon') && b[i].pips === 7 && !b[i].sealed) stars.push(i);
      const star = stars.length > 0, act = AC.includes(b.filter(d => d && d.type === 'moon').length);
      // 1) 星の月：月とコンボを Lv MAX
      if (star) for (const t of o.starPuTypes) {
        const d = obs.deck.find(x => x.type === t);
        if (d && d.puCost != null && d.lv < d.puMax && obs.sp >= d.puCost && (obs.legal.powerUp || []).includes(t))
          return { ops: [{ op: 'powerUp', type: t }], more: true, note: `星の月：PU ${d.name} Lv${d.lv}→${d.lv + 1}` };
      }
      const canAct = !ctl.dragging && !(ctl.actReadyIn > 0);
      const zone = new Set(stars); for (const s of stars) for (const j of NB[s]) zone.add(j);
      const royalCells = p => [...Array(15).keys()].filter(i => is(i, 'royal') && !b[i].sealed && (p == null || b[i].pips === p));
      const A = obs.legal.acts;
      const royalMode = o.starRoyal && star && act;   // 星の月が活性：ロイヤルを連打
      const preStar = !star && obs.wave >= o.royalFromWave;
      if (canAct && (royalMode || preStar)) {
        // 2) ロイヤルのペアを打つ（同じ出目が keep+2 個以上。高い出目から）
        if (fireOk) {
          const jokerOf = p => [...Array(15).keys()].some(i => is(i, 'joker') && b[i].pips === p && !b[i].sealed);
          const keepOf = p => o.seedNeedsJoker && !jokerOf(p) ? 0 : keep;
          const rp = A.filter(a => a.result === 'merge' && is(a.from, 'royal') && is(a.to, 'royal') && royalCells(b[a.from].pips).length >= 2 + keepOf(b[a.from].pips))
            .sort((p, q) => b[q.from].pips - b[p.from].pips || zone.has(p.to) - zone.has(q.to) || p.from - q.from)[0];
          if (rp) { S.firedWave = obs.wave; S.stats.fire++; if (star) S.stats.fireStar++; return opAct(obs, rp, `ロイヤルを打つ（出目${b[rp.from].pips}${star ? '・星の後' : ''}）${D != null ? `D=${D.toFixed(1)} R=${Rr.toFixed(1)}` : ''}`); }
        }
        // 3) ジョーカーでロイヤルをコピー（星の後はいつでも。星の前は、この試合でロイヤルが少ないときだけ）
        const wRoyal = (obs.field && obs.field.blessing && obs.field.blessing.weights) ? obs.field.blessing.weights[obs.deck.findIndex(d => d.type === 'royal')] : 1 / obs.deck.length;
        const lowRoyal = S.seenRoyal < S.seen.size * wRoyal * o.lowRoyalRatio;
        if (royalMode || lowRoyal) {
          const rc = A.filter(a => a.result === 'copy' && is(a.from, 'joker') && is(a.to, 'royal') && !zone.has(a.from))
            .sort((p, q) => b[q.to].pips - b[p.to].pips)[0];
          if (rc) { S.stats.copy++; return opAct(obs, rc, `ジョーカー${b[rc.from].pips}でロイヤルをコピー（${royalMode ? '星の後' : 'ロイヤルが少ない'}）`); }
        }
      }
      // 4) ほかの手（CORE）：ロイヤルは種と弾として残す。星の後は、ロイヤルをコピーできるジョーカーも残す
      const royalPips = new Set(royalCells().map(i => b[i].pips));
      const held = i => (is(i, 'royal') && (star || o.holdPreStar)) || (royalMode && is(i, 'joker') && royalPips.has(b[i].pips));
      const obs2 = Object.assign({}, obs, { legal: Object.assign({}, obs.legal, { acts: A.filter(a => !held(a.from) && !held(a.to)) }) });
      let r = core.decide(obs2);
      const none = !r || !r.ops || !r.ops.length;
      // 4.5) 星の後：盤面が埋まっていれば、火力ゾーン・ロイヤル・残すジョーカー以外の同じ種類どうしを合成して空ける（低い出目から）
      if (none && royalMode && o.starClear && canAct && b.every(Boolean)) {
        const mg = A.filter(a => a.result === 'merge' && !zone.has(a.from) && !zone.has(a.to) && !held(a.from) && !held(a.to)
          && !is(a.from, 'moon') && !is(a.to, 'moon') && b[a.from].type === b[a.to].type).sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from)[0];
        if (mg) { const f = opAct(obs, mg, `星の後：${b[mg.from].type}${b[mg.from].pips}どうしを合成して空ける`); if (r && r.limits) f.limits = r.limits; return f; }
      }
      // 5) 星の後：余ったSPで召喚（ロイヤルの補充）
      if (none && royalMode && obs.legal.summon && !(ctl.summonReadyIn > 0) && b.some(d => !d) && obs.sp - obs.summonCost >= o.starSummonKeep * obs.summonCost) {
        const s = { ops: [{ op: 'summon' }], more: true, note: '星の後：召喚（ロイヤルの補充）' };
        if (r && r.limits) s.limits = r.limits;
        return s;
      }
      // 6) 盤面が埋まって打つ手がないとき：ロイヤルのペアをたたむ（打つ）
      if (none && canAct && b.every(Boolean)) {
        const rp = A.filter(a => a.result === 'merge' && is(a.from, 'royal') && is(a.to, 'royal')).sort((p, q) => b[p.from].pips - b[q.from].pips)[0];
        if (rp) { S.stats.fold++; S.firedWave = obs.wave; const f = opAct(obs, rp, `詰まったのでロイヤル${b[rp.from].pips}のペアをたたむ`); if (r && r.limits) f.limits = r.limits; return f; }
      }
      return r;
    } };
  },
});
})();
