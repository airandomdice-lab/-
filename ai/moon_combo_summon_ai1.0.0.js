// 月コン召喚AI 1.0.0（AI API v1／AI_AGENT_GUIDE 1.10.0・AIRandomDicesim 3.13.1 で確認）
// 想定デッキ：月・コンボ・召喚・適応・ジョーカー、フィールド：神々の楽園（Lv20）か五番目の航海日記、本家 6.0.5、対戦用
// 登録ID：moon_combo_summon（楽園月コンAI〔moon_combo_paradise〕・楽園スココンAI〔scopecombo_paradise〕などと同時に読み込める）
// 判断の間隔0.5秒、重ねる操作の間隔0.2秒・ドラッグ0.2秒（limits で指定）
//
// 土台：楽園月コンAI 1.0.0（手すべてに点数を付けて最も高い手を打つ。月の活性は本当の個数で数え、次の1手で戻せない活性切れを避ける）
// 成長を召喚に置き換え、次を変えた
//   1) 召喚の合成（召喚同士・召喚＋適応）は、合成の結果に加えて「空きマスに出るダイス」も盤面に入れて点数を出す
//        出るダイス：種類はデッキの5種で平均、出目は 合成前の出目 n が2以下なら1、3以上なら 1〜n−1（多いときは代表の出目 spawnPips 個）、
//        置かれるマスは合成後の空きマス（合成で空いたマスを含む。多いときは spawnCells 個）
//        → 出たダイスが月になって活性が切れる・戻る、コンボの隣に月が出る、なども点数に出る
//   2) 召喚の手のコンボ効率（eff）：召喚同士 0.60・ジョーカー>召喚 0.40・適応＋召喚 0.35（楽園スココンAIと同じ）
//   3) 盤面が埋まっていなくても打つ手（notFullKeys）：ジョーカー>コンボ・召喚同士・適応＋召喚・ジョーカー>召喚・適応＋コンボ
//        （召喚の合成はただで1個出るので早く打つほど得。対戦120試合で 71勝 → 82勝）
//   4) 召喚のダイスも「コンボ数の素」として少し価値を持たせる（tokSummon 0.5）
//   5) 出目3以上の月に出目2以上のコンボが隣接するまでは、月の活性を気にしない（楽園月コンToAの決まり。1Wに月を合成して火力が消えるのを防ぐ）
//   6) 火力：召喚も弱い攻撃ダイスとして入れる（攻撃力 10＋10×(クラス−7)＋10×(Lv−1)、1.5秒）
//   7) 成長の予測・成長の価値はなくした
//   8) 航海日記：楽園マスがないだけなので、同じ計算のまま動く（楽園マスの項が0になる）
//
// 試したが既定にしなかったもの（options で使える）
//   puOnSkip（召喚を見送ったときもPU）：楽園 82→72勝／120。puPlan（決めた順のPU）：楽園 73勝・航海日記 変化なし。
//   puMode 'emergency'：50勝。召喚の効率を上げる・下げる：誤差の範囲
//
// 検証（シミュレータ 3.13.1、本家 6.0.5、Lv20、月12・コンボ11・召喚11・ジョーカー11・適応15、CD3000%、ボスはランダム）
//   対戦（相手：楽園スココンAI 1.7.3・楽園、同じクラス・CD）
//     楽園　　：シード1000〜・2000〜 各60試合で 82勝／120、シード3000〜・4000〜 で 78勝／120（計 160／240＝67%）
//               参考：楽園月コンAI 1.0.0（成長）は同じシード1000〜・2000〜で 79勝／120
//     航海日記：34勝／120（多くが6W以内の負け）。参考：楽園月コンAI 1.0.0 を航海日記にすると 54勝／120
//   対戦（相手：楽園月コンAI 1.0.0・楽園）：58勝／120（ほぼ互角）
//   練習10試合（上限9000秒）：楽園 平均42.3W、航海日記 平均32.1W
//   同じシードで2回動かした結果は一致
//
// ボス（本家 6.0.5・PvPクラス15 ではナイト・レオン・IIIIIIIIII・バジリスク）は楽園月コンAI 1.0.0 と同じ
//
// 点数 S(a) = E(a) − lowFirst×出目 + 期待値[Φ(操作後の盤面)] − Φ(今の盤面) + 手ごとの加点・減点
// 盤面の値 Φ … 楽園月コンAI 1.0.0 と同じ項（詰み度・種のコンボ・待ちジョーカー・楽園マス・総数・コンボ数の素・火力・星の月）
RD.defineAgent('moon_combo_summon', {
  name: '月コン召喚AI',
  desc: '月コン召喚用（月・コンボ・召喚・適応・ジョーカー、楽園か航海日記、対戦）。楽園月コンAIをもとに、成長を召喚に置き換えた。召喚の合成で空きマスに出るダイス（種類・出目・置かれるマス）まで盤面に入れて点数を出し、月の活性の切れ・戻りも見込む。星の月（B2を高く）を守る。PUはSPの使い道がないときと緊急のとき。コンボ数が止まったら盤面を回す。',
  options: {
    eff: { // 手のコンボ効率（合成は種類をアルファベット順に「+」でつなぐ。コピーは「joker>コピー先」。joker>moon は moonCopy）
      'joker>combo': 1.00, 'adaptive+combo': 0.90, 'combo+combo': 0.70, 'summon+summon': 0.60, 'moon+moon': 0.45,
      'joker>summon': 0.40, 'adaptive+summon': 0.35, 'adaptive+moon': 0.30,
      'adaptive+adaptive': 0.15, 'joker>adaptive': 0.10, 'joker+joker': 0.10, 'adaptive+joker': 0.05,
    },
    moonCopy: { splitPips: 4, lo: 0.275, hi: 0.325 },
    lowFirst: 0.01, minScoreNotFull: 0,
    Lref: 30, emptyW: 3,
    kL: 1.0, kSeed: 0.8, seedMaxPips: 4, kJoker: 0.3, kW: 0.5,
    kCrit: 1.0, critPen: [0, 0, 0, 0.05, 0.1, 0.2, 1.5, 3.0], critRelaxW: 64, critOpsOffWave: 10, critMaxPips: 7,
    kTok: 1.0, tokJoker: 1.5, tokAdaptive: 0.7, tokSummon: 0.5, // コンボ数の素：召喚も合成で1個出せるので少し価値を持たせる
    kFire: 4.0, kShort: 2.0, marginHi: 2.5, bossWeightMin: 0.3,
    bossHpMul: 8, bossKillFrac: 0.8,
    bossNeedMul: { leon: 0.5 },
    sendFactor: 1.0, inflowMul: 1.2, lookAhead: 20,
    leonLead: 15, leonStopFromWave: 5, kLeon1: 1.5, combo1UseAdaptive: true, leonForceToWave: 2, seed1Mul: 1.5,
    knightBossMul: 2.0, knightActual: 0.1, knightPierce: 1.0,
    joker1Pen: 0.4, jokerToAdaptivePen: 5.0,
    critComboMinPips: 3, critComboPen: 0.8,
    repairCopy: 0.95, repairMerge: 0.9,   // 活性の保険：次の1手で戻すときの火力の割合
    kStar: 1.5, b2Cell: 6, b2Mul: 1.3,    // 星の月（出目7の月）1個の価値／B2のマス／B2なら倍率
    summonTol: 0.3,                       // 召喚で盤面の値の期待値がこれより下がるなら召喚しない（活性していて雑魚火力が足りているときだけ）
    kDead7: 0,                            // 合成できない出目7（適応・召喚・ジョーカー）1個の減点
    puOnSkip: false, puSkipKeep: 1,       // true＝召喚を見送ったときもPUする（召喚 puSkipKeep 回分のSPは残す。試験では弱くなったので false）
    puPlan: [], puPlanKeep: 1,            // 決めた順のPU（例 [[3,'combo',3],[5,'combo',5]]）。既定はなし
    puMode: 'free',                       // 'free'＝SPの使い道がないときと緊急のとき／'emergency'＝緊急のときだけ／'never'＝しない
    dangerProg: 0.75, bossDangerProg: 0.5, stuckS: 0,
    bossFreezeStar: false,
    stagT: 60, stagMaxLoss: 2.0,          // 盤面を回す：コンボ数がこの秒数増えていなければ、点数がこの値より上の手は打つ
    notFullShort: 1.0, notFullShortBoss: 0,
    notFullKeys: ['joker>combo', 'summon+summon', 'adaptive+summon', 'joker>summon', 'adaptive+combo'], // 盤面が埋まっていなくても打つ手
    notFullKeysEarly: ['joker>combo', 'adaptive+combo', 'summon+summon', 'adaptive+summon'], fullOnlyFromWave: 2,
    // ---- 召喚（月コン召喚AIで追加） ----
    spawnCells: 2,                        // 召喚の合成で出るダイスの置き場所として見る空きマスの数（合成で空いたマスを先に）
    spawnPips: 2,                         // 出るダイスの出目として見る代表の数（1〜n−1 から均等に）
    careMoonPips: 3, careComboPips: 2,    // この出目以上の月に、この出目以上のコンボが隣接するまでは活性を気にしない（0で常に気にする）
  },
  limits: { interval: 0.5, actInterval: 0.2, dragTime: 0.2 },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options, info = ctx.info, nb = info.board.neighbors, CD = info.cfg.cd / 100;
    const TRACK = info.trackLength || 12;
    const moonInfo = info.deck.find(d => d.type === 'moon');
    const MOON_CLS = moonInfo ? moonInfo.cls : 12;
    const AC = (moonInfo && moonInfo.activeCounts) || [3, 5, 7];
    const C0 = info.baseCrit != null ? info.baseCrit : 0.05;

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
    const ST = { hadStar: false, combo: -1, comboT: 0 };
    // 召喚の合成で出るダイスの出目（代表）：n≤2 は1、n≥3 は 1〜n−1 から spawnPips 個を均等に
    const spawnPipsOf = n => {
      if (n <= 2) return [1];
      const m = n - 1, k = Math.min(m, Math.max(1, o.spawnPips | 0));
      if (k >= m) return [...Array(m).keys()].map(i => i + 1);
      const out = []; for (let j = 0; j < k; j++) out.push(1 + Math.round(j * (m - 1) / (k - 1 || 1)));
      return k === 1 ? [Math.round((1 + m) / 2)] : out;
    };

    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
      const ctl = obs.control || {};
      const deckTypes = obs.deck.map(d => d.type);
      const deckW = deckTypes.map(() => 1 / deckTypes.length);
      const st = t => obs.deck.find(d => d.type === t);
      const cb = st('combo'), mn = st('moon');
      const cfire = (cbLv, moonLv) => ({
        B: cb ? 10 + 10 * (cb.cls - 7) + 10 * (cbLv - 1) : 0,
        D: cb ? 8 + 2 * (cb.cls - 7) + (cbLv - 1) : 0, L: moonLv });
      // コンボ以外の攻撃ダイス（ジョーカー・適応・召喚・成長）：序盤の火力
      const OTH = {};
      for (const [t, a0, ac, ap, sp] of [['joker', 20, 5, 10, 1.0], ['adaptive', 20, 5, 10, 1.0], ['summon', 10, 10, 10, 1.5], ['growth', 10, 5, 10, 2.0]]) {
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

      // ---- 必要な火力と重み（楽園スココンAIと同じ） ----
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
      const bossNow = obs.phase === 'boss' && obs.boss;
      if (obs.phase === 'wave') {
        const T = waveT(w), el = T - (obs.timeLeft || 0);
        H = Hahead(w, el);
        const backlog = sumHp(obs.enemies) / Math.max(obs.front && obs.front.eta != null ? obs.front.eta : 10, 2);
        needZ = inflow(w, H) + backlog;
        needB = bossPred(w, sumHp(obs.enemies)) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = o.bossWeightMin + (1 - o.bossWeightMin) * clamp(el / T, 0, 1);
      } else if (bossNow) {
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
      } else { // intro・roll・wait
        if (obs.phase !== 'intro') w = obs.wave + 1;
        H = tableHP(w, 1);
        needZ = inflow(w, H);
        needB = bossPred(w, 0) / (bossTravel(w) * o.bossKillFrac) * bossMul(nextType);
        wz = 1; wb = obs.phase === 'intro' ? 1 : o.bossWeightMin;
      }
      needZ = Math.max(needZ, 1); needB = Math.max(needB, 1);

      const tl = obs.phase === 'wave' ? (obs.timeLeft || 0) : Infinity;
      const leonPre = nextType === 'leon' && tl <= o.leonLead;
      const leonStop = leonPre && obs.wave >= o.leonStopFromWave;
      let knight = (nextType === 'knight' && !bossNow) || !!(bossNow && obs.boss.type === 'knight' && obs.boss.cast === 0);
      const pc = 1 / deckTypes.length;

      // ---- 盤面の表現と予告スキル ----
      const rep = d => d ? { type: d.type, pips: d.pips, sealed: !!d.sealed, hacked: !!d.hacked } : null;
      const cur = obs.board.map(rep);
      const pend = (obs.pending || []).filter(q => q.kind === 'meteor');
      const early = new Set();
      for (const q of pend) if (q.in <= drag + 0.05) q.cells.forEach(i => early.add(i));
      const future = b => { if (!pend.length) return b; const f = b.slice(); for (const q of pend) for (const i of q.cells) f[i] = null; return f; };
      const mk = (t, p) => ({ type: t, pips: p, sealed: false, hacked: false });

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

      // ---- 火力 ----
      const moonCnt = b => { let c = 0; for (const d of b) if (d && d.type === 'moon') c++; return c; };
      const isAct = b => AC.includes(moonCnt(b));
      // 活性を気にする盤面か：出目 careMoonPips 以上の月に、出目 careComboPips 以上のコンボが隣接している（楽園月コンToAの決まり）
      const cares = b => { if (!o.careMoonPips) return true; for (let i = 0; i < 15; i++) { const d = b[i]; if (!d || d.type !== 'moon' || d.pips < o.careMoonPips) continue;
        for (const j of nb[i]) if (b[j] && b[j].type === 'combo' && b[j].pips >= o.careComboPips) return true; } return false; };
      // 本当の活性 act で数えた火力 [ボス, 雑魚]
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
          const Ap = (ot ? ot.atk : A) * P, Kc = (1 - c) + c * CD, r = ot ? 1.2 / ot.spd : 1; // r：コンボ（1.2秒）に対する速さ
          const e = (1 - c) * Math.min(Ap, H) + c * Math.min(Ap * CD, H);
          const sg = d.hacked ? -1 : 1;
          fb += sg * d.pips * Ap * Kc * V * r;
          fz += sg * d.pips * V * e * r;
        }
        return [fb / 1.2, fz / 1.2];
      };
      // 活性の保険：活性していなければ、次の1手で戻した後の火力×戻しやすさ との大きいほう
      const fireEff = (b, n, K) => {
        if (!cares(b)) return fireRaw(b, n, false, K); // 活性を気にしない間は、活性なしで数える
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
      const fire = (b, n, K) => {
        let [fb, fz] = fireEff(b, n, K);
        if (knight) { // ナイト：スキルで種類が変わる。ボス火力は「どのダイスも1/5でコンボになる」として数える（月のバフは入れない）
          const A = K.B + K.D * n * (n + 1) / 2;
          let fr = 0;
          for (let i = 0; i < 15; i++) { const d = b[i]; if (!d || d.sealed) continue; const c = C0 + (critCell[i] || 0); fr += pc * d.pips * A * ((1 - c) + c * CD); }
          fb = o.knightActual * fb + (1 - o.knightActual) * fr / 1.2;
        }
        return [fb, fz];
      };

      // ---- 盤面の値 Φ ----
      const phi = (b, n, K) => {
        K = K || K0;
        let v = o.kL * tau * room(b) / o.Lref;
        const combos = {}, jokers = {};
        let W = 0, critP = 0, tok = 0, star = 0, dead7 = 0;
        for (let i = 0; i < 15; i++) {
          const d = b[i]; if (!d) continue;
          W += Math.pow(2, d.pips - 1);
          if (isCrit(i)) critP += o.critPen[d.pips] || 0;
          if (d.type === 'combo' && !d.sealed && !d.hacked) combos[d.pips] = (combos[d.pips] || 0) + 1;
          if (d.type === 'joker') jokers[d.pips] = (jokers[d.pips] || 0) + 1;
          if (d.type === 'moon' && d.pips === 7) star = Math.max(star, i === o.b2Cell ? o.b2Mul : 1);
          if (d.pips === 7 && (d.type === 'adaptive' || d.type === 'summon' || d.type === 'joker')) dead7++;
          if (!d.sealed && (d.type === 'joker' || d.type === 'adaptive' || d.type === 'summon')) {
            const k = d.type === 'joker' ? o.tokJoker : d.type === 'adaptive' ? o.tokAdaptive : o.tokSummon;
            if (k) tok += k * (0.5 + 0.5 * Math.pow(2, -(d.pips - 1)));
          }
        }
        let seed = 0;
        for (const k in combos) if (+k <= o.seedMaxPips) { let h = 0; for (let j = 1; j <= combos[k]; j++) h += 1 / j; seed += Math.pow(2, -(k - 1)) * (+k === 1 && nextType !== 'leon' ? o.seed1Mul : 1) * h; }
        v += o.kSeed * (1 - tau) * seed;
        let wait = 0; for (const k in jokers) if (!combos[k]) wait += jokers[k];
        v -= o.kJoker * tau * wait;
        if (critOps) v -= o.kCrit * critP * o.critRelaxW / (o.critRelaxW + W);
        v -= o.kW * (0.5 + tau) * W / 64;
        v += o.kTok * (1 - 0.5 * tau) * tok;
        v += o.kStar * star - o.kDead7 * dead7;
        const [fb, fz] = fire(b, n, K);
        const u = r => o.marginHi * (1 - Math.exp(-Math.max(r, 0) / o.marginHi));
        v += o.kFire * (wz * u(fz / needZ) + wb * u(fb / needB));
        v += o.kShort * (wz * Math.min(0, fz / needZ - 1) + wb * Math.min(0, fb / needB - 1));
        return v;
      };
      // 召喚の合成の後の盤面の値：空きマスに出るダイス（種類・出目・マス）で平均。first：合成で空いたマス
      const phiSpawn = (b, n, p, first) => {
        const em = []; if (b[first] == null) em.push(first);
        for (let i = 0; i < 15 && em.length < 15; i++) if (b[i] == null && i !== first) em.push(i);
        if (!em.length) return phi(future(b), n);
        let cells = em;
        if (em.length > o.spawnCells) { // 合成で空いたマス＋ほかの空きマスから等間隔に
          cells = [em[0]]; const rest = em.slice(1), k = o.spawnCells - 1;
          for (let j = 0; j < k; j++) cells.push(rest[Math.floor((j + 0.5) * rest.length / k)]);
        }
        const ps = spawnPipsOf(p);
        let v = 0, wsum = 0;
        for (const i of cells) for (const q of ps) deckTypes.forEach((t, ti) => {
          const b2 = b.slice(); b2[i] = mk(t, q); v += deckW[ti] * phi(future(b2), n); wsum += deckW[ti];
        });
        return v / wsum;
      };

      const n0 = obs.combo;
      let [fb0, fz0] = fire(base0, n0, K0);
      // ナイト：スキルまでに倒しきれそうなら（今の盤面のままのボス火力で）、変換後の期待値では数えない
      if (knight) {
        const kOff = knight; knight = false; const fbr = fire(base0, n0, K0)[0]; knight = kOff;
        const hp = bossNow ? obs.boss.hp : bossPred(obs.wave, sumHp(obs.enemies));
        const pierceT = bossNow ? Math.max(0.5, obs.boss.skillIn || 0) : 2 + (info.cfg.bossIntro || 0);
        if (fbr * pierceT >= hp * o.knightPierce) { knight = false; [fb0, fz0] = fire(base0, n0, K0); }
      }
      if (knight) wb *= o.knightBossMul;
      const phiNow = phi(base0, n0);
      const act0 = isAct(base0);
      const careNow = cares(base0);
      const hasStar = cur.some(d => d && d.type === 'moon' && d.pips === 7);
      if (hasStar) ST.hadStar = true;
      if (ST.combo !== obs.combo) { ST.combo = obs.combo; ST.comboT = obs.t; }

      // ---- 1) PU（重ねる操作の後で判断。ここでは準備だけ） ----
      const fe = obs.front;
      const danger = bossNow ? (obs.enemies.find(e => e.bossLike) || { progress: 0 }).progress >= o.bossDangerProg
                             : !!(fe && fe.progress >= o.dangerProg);
      const tryPu = (why, keep = 0) => { // keep：PUの後に残すSP
        let bestT = null, bestF = fb0 * wb + fz0 * wz;
        for (const t of ['combo', 'moon']) {
          const d = st(t); if (!d || d.puCost == null || obs.sp - keep < d.puCost) continue;
          const K = cfire(t === 'combo' ? d.lv + 1 : (cb ? cb.lv : 1), t === 'moon' ? d.lv + 1 : (mn ? mn.lv : 1));
          const [b1, z1] = fire(base0, n0, K);
          const f = b1 * wb + z1 * wz;
          if (f > bestF * 1.001) { bestF = f; bestT = t; }
        }
        if (bestT) { const d = st(bestT); return { ops: [{ op: 'powerUp', type: bestT }], more: true, note: `PU（${why}）${d.name} Lv${d.lv}→${d.lv + 1}` }; }
        return null;
      };
      const full = obs.board.every(Boolean);
      // 決めた順のPU（puPlan：[ウェーブ, 種類, Lv] の順。召喚 puPlanKeep 回分のSPは残す。足りなければ後ろは見ない）
      for (const [pw, type, lv] of o.puPlan || []) {
        if (obs.wave < pw) continue;
        const d = st(type);
        if (!d || d.lv >= lv || d.puCost == null) continue;
        if (obs.sp - (obs.summonCost || 0) * o.puPlanKeep >= d.puCost) return { ops: [{ op: 'powerUp', type }], more: true, note: `PU（予定）${d.name} Lv${d.lv}→${d.lv + 1}` };
        break;
      }

      // ---- ボス戦の停止（星の月が活性しているとき） ----
      const frozen = o.bossFreezeStar && bossNow && hasStar && act0;

      // ---- 2) 召喚 ----
      const leonForce = leonPre && obs.wave <= o.leonForceToWave;
      const toAdaptive = a => {
        const X = obs.board[a.from], Y = obs.board[a.to];
        if (a.result !== 'merge' || X.type !== 'combo' || Y.type !== 'combo' || X.pips !== 1 || !o.combo1UseAdaptive) return a;
        const alt = obs.legal.acts.filter(q => q.result === 'merge' && obs.board[q.from].pips === 1 && !early.has(q.from) && !early.has(q.to)
          && ((obs.board[q.from].type === 'adaptive' && obs.board[q.to].type === 'combo') || (obs.board[q.from].type === 'combo' && obs.board[q.to].type === 'adaptive')));
        if (!alt.length) return a;
        const rank = q => (q.to === a.to ? 0 : [q.from, q.to].includes(a.to) || [q.from, q.to].includes(a.from) ? 1 : 2) * 2 + (isCrit(q.to) ? 1 : 0);
        return alt.reduce((p, q) => rank(q) < rank(p) ? q : p);
      };
      if (!frozen && leonForce && !ctl.dragging && !(ctl.actReadyIn > 0)) {
        const f = obs.legal.acts.filter(a => a.result === 'merge' && obs.board[a.from].pips === 1
          && (obs.board[a.from].type === 'combo' || obs.board[a.to].type === 'combo') && !early.has(a.from) && !early.has(a.to));
        if (f.length) {
          const a = toAdaptive(f[0]);
          return { ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: 'merge' }], more: true, note: 'レオン前（2Wまで）：出目1コンボを合成' };
        }
      }
      let skipSummon = false; // 召喚できるのに見送った（SPの使い道がない）
      if (!frozen && obs.legal.summon && !(ctl.summonReadyIn > 0) && !leonStop) {
        // 召喚の期待値：空きマス×デッキの種類で平均
        const empt = []; for (let i = 0; i < 15; i++) if (!cur[i]) empt.push(i);
        let ev = 0;
        for (const i of empt) deckTypes.forEach((t, ti) => { const b = cur.slice(); b[i] = mk(t, 1); ev += deckW[ti] * phi(future(b), n0) / empt.length; });
        if (ev - phiNow > -o.summonTol || (careNow && !act0) || fz0 / needZ < 1) return { ops: [{ op: 'summon' }], more: true, note: `召喚 ΔΦ=${(ev - phiNow).toFixed(2)}` };
        skipSummon = true;
      }

      // ---- 3) 重ねる操作 ----
      if (frozen) { if (o.puMode !== 'never' && danger) return tryPu('ボス戦'); return null; }
      if (ctl.dragging || ctl.actReadyIn > 0) return null;
      const acts = obs.legal.acts.filter(a => a.result === 'merge' || a.result === 'copy');
      let best = null;
      const okKeys = obs.wave >= o.fullOnlyFromWave ? o.notFullKeys : o.notFullKeysEarly;
      const pendCells = new Set(pend.flatMap(q => q.cells));
      const shortNow = fz0 / needZ < o.notFullShort || fb0 / needB < o.notFullShortBoss * (bossNow ? 1 : 0);
      const dbg = [];
      for (const a of acts) {
        if (early.has(a.from) || early.has(a.to)) continue;
        const x = cur[a.from], y = cur[a.to];
        if (!x || !y) continue;
        if (critOps && a.result === 'merge' && critCell[a.to] != null && critCell[a.from] == null && !pendCells.has(a.to) && x.pips + 1 > o.critMaxPips
          && acts.some(q => q.from === a.to && q.to === a.from)) continue;
        const isMerge = a.result === 'merge';
        const key0 = a.result === 'copy' ? 'joker>' + y.type : pairKey(x.type, y.type);
        // 盤面が埋まっていないときは、決めた手・予告マスにかかわる手・ハッキングを消す手・レオン前の手・活性に戻せそうな手だけ（重い計算の前に絞る）
        const combo1 = leonStop && isMerge && x.pips === 1 && (x.type === 'combo' || y.type === 'combo');
        const moonInvolved = x.type === 'moon' || y.type === 'moon';
        const preOk = full || shortNow || pendCells.has(a.from) || pendCells.has(a.to) || x.hacked || y.hacked || combo1
          || (okKeys || []).includes(key0) || (careNow && !act0 && moonInvolved);
        if (!preOk) continue;
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
        let key = key0, ev = 0, E, actAfter = 0;
        if (a.result === 'copy') {
          const b = cur.slice(); b[a.from] = mk(y.type, x.pips);
          ev = phi(future(b), n0); actAfter = isAct(b) ? 1 : 0;
          E = key === 'joker>moon' ? (x.pips <= o.moonCopy.splitPips ? o.moonCopy.lo : o.moonCopy.hi) : ((o.eff && o.eff[key]) || 0);
        } else {
          const dn = (x.type === 'combo' || y.type === 'combo') ? 1 : 0;
          const sumIn = x.type === 'summon' || y.type === 'summon';
          deckTypes.forEach((t, ti) => {
            const b = cur.slice(); b[a.from] = null; b[a.to] = mk(t, x.pips + 1);
            ev += deckW[ti] * (sumIn ? phiSpawn(b, n0 + dn, x.pips, a.from) : phi(future(b), n0 + dn));
            actAfter += deckW[ti] * (isAct(b) ? 1 : 0); // 活性に戻す手かどうか（出るダイスは数えない）
          });
          E = (o.eff && o.eff[key]) || 0;
        }
        const repair = careNow && !act0 && actAfter >= 0.79; // 活性に戻す手
        if (!full && !repair && !shortNow && !pendCells.has(a.from) && !pendCells.has(a.to) && !x.hacked && !y.hacked && !combo1
          && !(okKeys || []).includes(key)) continue;
        const S = E - o.lowFirst * x.pips + ev - phiNow + bonus;
        if (o.debugActs) dbg.push(`${key}${x.pips} ${a.from}→${a.to} E${E.toFixed(2)} Δ${(ev - phiNow).toFixed(2)} b${bonus.toFixed(2)} S${S.toFixed(2)}`);
        if (!best || S > best.S) best = { a, S, key, repair };
      }
      // 緊急のPU：危ないときに、詰んでいる（埋まっていて良い手がない）か星の月を失った
      if (o.puMode !== 'never') {
        const stuck = full && (!best || best.S <= o.stuckS) && !obs.legal.summon;
        const starLost = ST.hadStar && !hasStar;
        if (danger && (stuck || starLost)) { const r = tryPu(stuck ? '詰み' : '星の月を失った'); if (r) return r; }
        if (o.puMode === 'free' && full && !obs.legal.summon) { const r = tryPu('空きなし'); if (r) return r; }
        if (o.puMode === 'free' && o.puOnSkip && skipSummon) { const r = tryPu('召喚を見送り', obs.summonCost * o.puSkipKeep); if (r) return r; }
      }
      if (o.debugActs && dbg.length) ctx.log(`候補 ${dbg.join(' | ')}`);
      if (!best) return null;
      if (!full && !(best.S > o.minScoreNotFull)) return null;
      // 星の月が活性していて、良い手がなければ動かさない。ただしコンボ数が stagT 秒増えていなければ、損が stagMaxLoss までの手は打つ（盤面を回す）
      const stag = obs.t - ST.comboT >= o.stagT && !bossNow && !danger && obs.phase === 'wave';
      if (full && best.S <= o.stuckS && !best.repair && act0 && hasStar && !(stag && best.S > -o.stagMaxLoss)) return null;
      const a = toAdaptive(best.a);
      return {
        ops: [{ op: 'act', from: a.from, to: a.to, fromId: obs.board[a.from].id, toId: obs.board[a.to].id, expect: a.result }],
        more: true,
        note: `${best.key} 出目${obs.board[a.from].pips} ${a.from}→${a.to} S=${best.S.toFixed(2)} 雑魚${(fz0 / needZ).toFixed(2)} ボス${(fb0 / needB).toFixed(2)}${act0 ? '' : ' 非活性'}${best.repair ? ' 活性に戻す' : ''}${hasStar ? ' 星' : ''}${knight ? ' ナイト' : ''}`,
      };
    } };
  },
});
