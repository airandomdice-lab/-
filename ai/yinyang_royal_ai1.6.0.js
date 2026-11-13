// 陰陽ロイヤルAI（AI API v1／AI_AGENT_GUIDE 1.6.0・AIRandomDicesim 1.17.0 用）
// 登録ID：yinyang_royal（陰陽基礎AI yinyang_basic とは別のAI。同時に読み込める）
// 想定デッキ：陰陽・スイッチ・養分・ジョーカー・ロイヤル（ロイヤルが自由枠）。想定フィールド：神々の楽園
// ルールの説明は claude/陰陽ロイヤルAI_ルール一覧.md にまとめた（各ルールの記号 R・P・A・E・K・F・L はコード中のコメントと同じ）
RD.defineAgent('yinyang_royal', {
  name: '陰陽ロイヤルAI',
  desc: '陰陽基礎AI（神々の楽園の会心マスで極の調和を組む）＋追加ルール。調和ができたら陰陽をLv5までPU、調和と同じ出目の養分はすぐ調和へ。ロイヤルはW5まで打たず、W6以降は相手の処理の余裕 D≥0 のときに打つ（同じ出目3個以上、1個はジョーカーのコピー元に残す。D≥6 ならペアでも）。W6以降はロイヤルを打つ前に陰陽同士・スイッチ同士を合成し、出目pのロイヤルがあれば出目p−1の養分を出目p−1のジョーカーに当ててロイヤルをコピーする。調和後の自由マスは F1〜F9 の順で回す。',
  options: {
    critOrder: null,        // クリティカルマスの優先順（マス番号の配列）。null なら楽園のマスを入口に近い順
    clearMaxPips: 1,        // 盤面を空ける合成（7）で使う出目の上限（1＝出目2に手を付けない）
    switchMergeMin: 3,      // スイッチ同士を合成する、盤面のスイッチの数の下限
    feedBeforeClear: true,  // 6) の養分を 7) の合成より先に行う（false なら 7) の後）
    feedAfterHarmony: true, // 極の調和ができた後も、クリティカルマスの陰陽に養分を当てる
    lastResort: true,       // 8) 最後の手段を使う
    breakMinTimeLeft: 10,   // R3：ボス出現までの残りがこの秒数未満なら、ラインを巻き込む合成をしない（検証3：組み直しは最大10秒ほど）
    royalTiming: 'D',         // ロイヤル攻撃のタイミング。'D'＝相手の処理の余裕 D で決める／'wave4'＝下の royalCondition（W4以降）と貫通の条件
    royalNoAttackUntilWave: 5, // このウェーブまではロイヤルを打たない（詰まり回避・最後の手段の合成も含む）
    earlyJamRoyal: 'preHarmony', // 'preHarmony'＝調和ができるまでは詰まり回避・最後の手段のロイヤル合成だけ許す（false にすると序盤の負けが増えた）／true＝W5まで詰まり回避は許す
    dFromWave: 6,             // 'D'：このウェーブから D で決める
    reachCheck: true,         // 'D'：このウェーブでまだロイヤルを打っていなくて、R =（先頭からゴールまでの距離）−（残り時間 × 通常モンスターの速さ）> 0 なら打たない
    normalSpeed: 0.6,         // 通常モンスター（雑魚）の速さ（エンジンの定義と同じ値）
    dSkip: 5,                 // 'D'：ウェーブ開始からこの秒数は判断しない（打たない）
    dWindow: 5,               // 'D'：先頭の位置の移動平均をとる秒数（2〜8秒で試して差はばらつきの範囲。5のまま）
    stopPastPos: 8.5,         // 'D'：相手の先頭の敵がこの位置（レーンの入口からの距離）を越えていたら打たない。8.5＝2つ目の角（null でしない）
    dAggressive: 6,           // 'D'：D がこの値以上なら、コピー元を残さずペアでも打つ
    royalCondition: 'fromWave', // ロイヤル攻撃を始める条件。'fromWave'＝ウェーブ royalFromWave 以降、'always'＝無条件、'never'＝条件では始めない（貫通できないときだけ）
    royalFromWave: 4,         // 'fromWave' のとき、このウェーブ以降でロイヤル攻撃をする
    puTargetLv: 5,            // PU：極の調和ができたら、陰陽をこのLvまで上げる（0でしない）
    lineSink: false,          // S) ライン上のクリティカル以外の陰陽を養分の捨て先にする（人の操作に合わせて既定はしない）
    royalKeep: 1,             // ロイヤルは同じ出目をこの数だけ残す（ジョーカーでコピーする元）。2個以上余っているときだけ合成する
    nutrientPair: true,       // N) 養分で、出目が1つずれた同じ種類のダイスをペアにする
    jokerRoyal: true,         // F3) ジョーカーでロイヤルをコピーして、ロイヤルを増やす
    critTarget: 5,            // 調和の出目の目標。これ未満（か貫通に必要な出目未満）なら、養分を調和用に育てる（F1）
    switchKeep: 1,            // F5：スイッチ同士の合成で、この数のスイッチは残す（R0・R3の復帰用）
    lineSinkLast: true,       // F11：ほかに手がないときだけ、クリティカル以外のラインの陰陽に養分を当てる
    preJokerEmptyW: 0.4,      // A：7−(出目1の陰陽の数＋空きマス×この値) > 0 のとき、ジョーカーで陰陽をコピー
    preSort: true,            // A：手がなければ、攻撃力÷攻撃間隔が大きいダイスを入口に近いマスへ、スイッチで並べ替える
    // A の並べ替えに使うダイスの値 [攻撃力の基礎, クラス増分, PU増分]・[攻撃間隔の基礎, クラス増分]（エンジンの定義と同じ値）
    diceStats: {
      yinyang: { atk: [50, 10, 20], spd: [1.0, 0] }, royal: { atk: [50, 20, 20], spd: [1.0, 0] },
      switch: { atk: [30, 10, 20], spd: [0.7, -0.02] }, nutrient: { atk: [10, 10, 10], spd: [1.5, 0] },
      joker: { atk: [20, 5, 10], spd: [1.0, 0] },
    },
    leonPrep: true,           // W1のボスがレオン（調和の前）：クリティカルマスに出目2のスイッチを作る／できなければ残り leonLateSec 秒で縦活性＋養分
    leonLateSec: 10,
    leonMaxSummons: 7,        // 出目2のスイッチを作る条件：それまでの召喚回数がこの回数以内
    earlyFeed: true,          // 序盤：調和ができるまで、クリティカルマスの陰陽が縦か横に活性していれば、同じ出目の養分を重ねる（W1のボスがナイトのときを除く）
    lateFromWave: 6,          // このウェーブ以降（調和ができているとき）：陰陽同士・スイッチ同士の合成をロイヤルを打つ判断より先に行い、スイッチは残さない。
                              //   さらに「出目pのロイヤル＋出目p−1の養分・ジョーカー」なら養分をジョーカーに当てる（→ジョーカーでロイヤルをコピー）
    jamBreak: false,          // F10（試験：詰まりは減るが調和が保たれる割合が下がったので既定は無効）：詰まったら、ラインの陰陽をライン外の同じ出目の陰陽へ合成してラインを空ける
    // 貫通に必要な調和の出目。[PU Lv] = ウェーブ1から順。範囲外のウェーブは 8（不可）
    pierce: {
      1: [1, 2, 3, 3, 4, 6, 6],
      2: [1, 1, 2, 3, 4, 5, 6, 7],
      3: [1, 1, 2, 3, 4, 4, 5, 6, 6],
      4: [1, 1, 2, 2, 3, 3, 5, 5, 6, 7],
      5: [1, 1, 2, 2, 3, 3, 4, 5, 6, 6, 7],
    },
  },
  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const o = ctx.options;
    const CORE = ['yinyang', 'switch', 'nutrient', 'joker'];
    const FREE = ctx.info.deck.map(d => d.type).filter(t => !CORE.includes(t));
    const yy = ctx.info.deck.find(d => d.type === 'yinyang');
    // 攻撃力÷攻撃間隔（A の並べ替え用）。初期クラスは N1・R3・H5・L7
    const RAR0 = { N: 1, R: 3, H: 5, L: 7 };
    const dpsOf = (type, lv) => {
      const st = o.diceStats[type], dk = ctx.info.deck.find(d => d.type === type);
      if (!st || !dk) return 0;
      const dc = (dk.cls || 0) - (RAR0[dk.rar] || 0);
      const atk = st.atk[0] + st.atk[1] * dc + st.atk[2] * ((lv || 1) - 1);
      const iv = Math.max(0.05, st.spd[0] + st.spd[1] * dc);
      return atk / iv;
    };
    if (yy && yy.cls !== 10) ctx.log(`貫通の表は陰陽クラス10で測った値（いまはクラス${yy.cls}）`);

    // マスの位置（エンジンの COL_X・ROW_Y と同じ値）。敵の入口は通路の始点 (0, 0)＝盤面の左下
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const dist = i => Math.hypot(COL_X[i % 5], ROW_Y[Math.floor(i / 5)]);
    const byDist = (cells) => [...cells].sort((a, b) => dist(a) - dist(b) || a - b);
    let critOrder = o.critOrder || null; // 楽園のマスは最初の観測で決める
    const rowOf = c => { const r = Math.floor(c / 5); return [0, 1, 2, 3, 4].map(k => r * 5 + k); };
    const colOf = c => [0, 1, 2].map(r => r * 5 + (c % 5));
    // ターゲットの並び：クリティカルマス → 残りは近い順
    const ordered = (cells, crit) => [crit, ...cells.filter(x => x !== crit)];

    let pendingMem = null, pendingNote = '';
    let fHist = [], waveSeen = null, waveStartT = 0; // 'D'：相手の先頭の位置の履歴
    let firedWave = null;                              // ロイヤルを最後に打ったウェーブ（R の判定に使う）
    return { decide(obs) {
      pendingMem = null; pendingNote = '';
      const r = decideInner(obs) || { ops: [] };
      if (pendingMem != null) r.memory = pendingMem;          // ロイヤル攻撃の状態を毎回書く
      if (pendingNote) r.note = pendingNote + (r.note ? '／' + r.note : '');
      return r;
    } };
    function decideInner(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null; // 操作数の上限
      const b = obs.board, ctl = obs.control || {};
      const full = b.every(Boolean);
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      if (!critOrder) {
        const pc = (obs.field && obs.field.paradise || []).map(p => p.cell);
        critOrder = pc.length ? byDist(pc) : byDist([...Array(15).keys()]);
        ctx.log(`クリティカルマス（優先順）：${critOrder.slice(0, pc.length || 1).join('、')}${pc.length ? '' : '（楽園でないので入口に最も近いマス）'}`);
      }
      const crit = critOrder[0];
      const row = rowOf(crit), col = colOf(crit);
      const line = new Set([...row, ...col]);
      const is = (i, t) => b[i] && b[i].type === t;
      const count = t => b.filter(d => d && d.type === t).length;
      // 有効な陰陽＝ライン上の陰陽＋ライン外の出目1の陰陽
      const E = b.filter((d, i) => d && d.type === 'yinyang' && (line.has(i) || d.pips === 1)).length;
      const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
      const findAct = (f, t) => legal.get(f * 15 + t);
      const act = (a, note) => {
        // ロイヤル同士の合成（＝ロイヤルを打つ）を出したら、このウェーブで打ったと記録する
        if (a.result === 'merge' && b[a.from].type === 'royal' && b[a.to].type === 'royal') {
          firedWave = obs.wave;
          if (typeof mem !== 'undefined' && mem) { mem.firedW = obs.wave; pendingMem = JSON.stringify(mem); }
        }
        return { ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note };
      };
      const lines = () => (b[crit] && b[crit].state) || { col: false, row: false };

      // ---------- ロイヤル攻撃の状態（ワーキングメモリ） ----------
      let mem; try { mem = JSON.parse(obs.memory || '{}') || {}; } catch (e) { mem = {}; }
      const st = mem.royal || { on: false, reason: null, startCrit: 0 };
      const h0 = is(crit, 'yinyang') && lines().col && lines().row;
      const effCrit = h0 ? b[crit].pips : 0;            // 調和が完成していなければ0
      const yLv = (obs.deck.find(d => d.type === 'yinyang') || { lv: 1 }).lv;
      const bossWave = obs.phase === 'wave' ? obs.wave : obs.wave + 1;
      const tbl = o.pierce[Math.min(5, Math.max(1, yLv))] || [];
      const need = tbl[bossWave - 1] ?? 8;
      const cond = o.royalCondition === 'always' || (o.royalCondition === 'fromWave' && obs.wave >= o.royalFromWave);
      let stNote = '';
      if (st.on && st.reason === 'pierce' && effCrit > st.startCrit) { st.on = false; st.reason = null; stNote = `ロイヤル攻撃を終了（調和の出目${st.startCrit}→${effCrit}）`; }
      if (cond) { if (!st.on || st.reason !== 'condition') { st.on = true; st.reason = 'condition'; } }
      else if (st.on && st.reason === 'condition') { st.on = false; st.reason = null; }
      if (!st.on && effCrit < need) { st.on = true; st.reason = 'pierce'; st.startCrit = effCrit; stNote = `ロイヤル攻撃を開始（W${bossWave}のボスに出目${need}が必要、調和は${effCrit}）`; }
      if (h0) mem.hEver = true; // この試合で一度でも調和ができた（R0 とラインの保護に使う）
      mem.royal = st;
      pendingMem = JSON.stringify(mem); pendingNote = stNote;
      // ---------- 相手の処理の余裕 D（royalTiming:'D'） ----------
      //   D = (相手の先頭の敵からゴールまでの距離) − (ウェーブの残り時間 × 先頭の位置の移動平均速度)
      //   D ≥ 0：相手は処理できている（実際に火力が出ている）→ 打つ。D < 0：処理の余裕がない → 打たずに負けるのを待つ
      let D = null, Rr = null;
      const opp = obs.opponent, TL = ctx.info.trackLength || 12;
      if (obs.wave !== waveSeen) { waveSeen = obs.wave; waveStartT = obs.t; fHist = []; }
      if (opp && obs.phase === 'wave' && opp.phase === 'wave' && obs.timeLeft != null) {
        const pos = opp.front ? opp.front.progress * TL : 0;
        fHist.push({ t: obs.t, pos });
        while (fHist.length && fHist[0].t < obs.t - o.dWindow) fHist.shift();
        if (obs.t - waveStartT >= o.dSkip && fHist.length >= 2) {
          const h0p = fHist[0], h1 = fHist[fHist.length - 1];
          const v = (h1.pos - h0p.pos) / Math.max(1e-6, h1.t - h0p.t);
          D = (TL - pos) - obs.timeLeft * v;
          Rr = (TL - pos) - obs.timeLeft * o.normalSpeed;   // R > 0：通常の速さでもこのウェーブ中に先頭はゴールに届かない
        }
      } else if (obs.phase !== 'wave') fHist = [];
      // 練習（相手なし）と、dFromWave より前のウェーブでは 'wave4' の決め方を使う（序盤は調和作りと詰まり回避を優先）
      const useD = o.royalTiming === 'D' && !!opp && obs.wave >= o.dFromWave;
      if (useD) { mem.D = D == null ? null : Math.round(D * 10) / 10; mem.R = Rr == null ? null : Math.round(Rr * 10) / 10; }
      const early = obs.wave <= o.royalNoAttackUntilWave;  // W5までは打たない
      const firedThisWave = firedWave === obs.wave;
      // R の判定は、このウェーブでまだロイヤルを打っていないときだけ（一度打ったら R は見ない）
      // 相手の先頭の敵が2つ目の角（stopPastPos）を越えていたら打たない（レーンは 入口→3.5で1つ目の角→8.5で2つ目の角→12でゴール）
      const pastCorner = o.stopPastPos != null && !!(opp && opp.front) && opp.front.progress * TL > o.stopPastPos;
      const royalOn = early ? false : useD ? (D != null && D >= 0 && !pastCorner && !(o.reachCheck && Rr > 0 && !firedThisWave)) : st.on;
      const keepN = useD && D != null && D >= o.dAggressive ? 0 : o.royalKeep;
      // 打たない間は、詰まり回避でもロイヤルを合成しない（'D' のとき・W5まで）
      //   earlyJamRoyal：'preHarmony' なら、調和ができるまでは詰まり回避・最後の手段のロイヤル合成だけ許す
      const earlyJamOk = o.earlyJamRoyal === true || (o.earlyJamRoyal === 'preHarmony' && !mem.hEver);
      const holdRoyal = (early && !earlyJamOk) || (useD && !royalOn);
      pendingMem = JSON.stringify(mem);

      // PU) 極の調和が一度でもできたら、陰陽を puTargetLv までPU（SPが足りるとき）
      if (mem.hEver && o.puTargetLv) {
        const yd = obs.deck.find(d => d.type === 'yinyang');
        if (yd && yd.lv < o.puTargetLv && yd.puCost != null && obs.sp >= yd.puCost && obs.legal.powerUp.includes('yinyang'))
          return { ops: [{ op: 'powerUp', type: 'yinyang' }], more: true, note: `PU 陰陽 Lv${yd.lv}→${yd.lv + 1}` };
      }

      const royalCnt = p => b.filter(d => d && d.type === 'royal' && d.pips === p).length;
      // ロイヤルのペアを打つ（同じ出目が royalKeep+2 個以上あるときだけ＝コピー元を残す。高い出目から。合成先はライン外、合成元はラインのマスを優先＝ラインを空ける）
      function fireRoyal(force) {
        if (!royalOn && !force) return null;
        if (holdRoyal) return null;
        const c = obs.legal.acts.filter(a => a.result === 'merge' && is(a.from, 'royal') && is(a.to, 'royal')
            && (force || royalCnt(b[a.from].pips) >= 2 + keepN))
          .sort((p, q) => b[q.from].pips - b[p.from].pips || line.has(p.to) - line.has(q.to)
            || line.has(q.from) - line.has(p.from) || p.from - q.from);
        if (!c.length) return null;
        const a = c[0];
        return act(a, `ロイヤル攻撃：出目${b[a.from].pips} ${a.from}→${a.to}${useD && D != null ? `（D=${D.toFixed(1)} R=${Rr.toFixed(1)}）` : ''}`);
      }

      // ---------- スイッチによる位置の移動 ----------
      // targets のマスに陰陽を入れる手を探す（targets は優先順）
      function placeInto(targets) {
        const T = new Set(targets);
        // 引き込み元の陰陽・スイッチは、いつもライン（7マス）の外だけ。
        // ラインの中から抜くと、横活性と縦活性が互いの陰陽を引き抜き合って往復してしまうため
        const srcY = [...Array(15).keys()].filter(q => is(q, 'yinyang') && !line.has(q));
        // a) target にあるスイッチを、同じ出目の陰陽に重ねる（陰陽が target に入る）
        for (const t of targets) {
          if (!is(t, 'switch')) continue;
          for (const q of srcY) {
            const a = findAct(t, q);
            if (a && a.result === 'swap') return act(a, `引き込み：${q}の陰陽(出目${b[q].pips})→${t}`);
          }
        }
        // b) target の外のスイッチを、target にある同じ出目の別種に重ねる（スイッチを置く）。
        //    同じ出目の陰陽がライン外にあるときだけ（次の判断で a) の引き込みができる）
        const yPips = new Set(srcY.map(q => b[q].pips));
        const tgt = targets.filter(t => b[t] && !['yinyang', 'switch'].includes(b[t].type) && yPips.has(b[t].pips))
          .sort((p, q) => (is(p, 'joker') - is(q, 'joker'))); // ジョーカーはなるべく動かさない（コピーに使えるため）
        for (const t of tgt) {
          for (let s = 0; s < 15; s++) {
            if (line.has(s) || !is(s, 'switch')) continue;
            const a = findAct(s, t);
            if (a && a.result === 'swap') return act(a, `スイッチを置く：${s}→${t}（出目${b[t].pips}）`);
          }
        }
        return null;
      }

      // ---------- 陰陽ロイヤルAIの追加ルール ----------
      const lnNow = is(crit, 'yinyang') ? lines() : { col: false, row: false };
      const harmonyNow = lnNow.col && lnNow.row;
      const cp0 = is(crit, 'yinyang') ? b[crit].pips : 0;
      function royalRules() {
        if (harmonyNow && cp0 < 7) {
          // R1) 調和と同じ出目の養分をすぐ当てる
          const f = obs.legal.acts.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient'));
          if (f) return act(f, `R1 調和に養分（出目${cp0}→${cp0 + 1}）`);
          // R2) 調和が出目4以上：出目(調和−1)の養分をそろえて出目(調和)にする
          if (cp0 >= 4) {
            const q = cp0 - 1;
            const m = obs.legal.acts.find(x => x.result === 'merge' && is(x.from, 'nutrient') && is(x.to, 'nutrient')
              && b[x.from].pips === q && !line.has(x.to));
            if (m) return act(m, `R2 養分${q}同士を合成→養分${cp0}`);
            const nuts = [...Array(15).keys()].filter(i => is(i, 'nutrient') && b[i].pips === q);
            if (nuts.length === 1) {
              const c = obs.legal.acts.find(x => x.result === 'copy' && is(x.from, 'joker') && x.to === nuts[0]);
              if (c) return act(c, `R2 ジョーカー${c.from}で養分${q}をコピー（ペアを作る）`);
            }
          }
        }
        // R0) 復帰：調和が崩れていて、陰陽の総数が7個以上なら、スイッチでラインへ引き込む
        if (!harmonyNow && mem.hEver && count('yinyang') >= 7) {
          const r = placeInto(ordered([...line], crit));
          if (r) { r.note = 'R0 復帰 ' + r.note; return r; }
        }
        return null;
      }
      // R3) ラインを巻き込む合成（復帰の手がそろっているときだけ）
      function safeBreak() {
        if (!harmonyNow || obs.phase !== 'wave' || !(obs.timeLeft >= o.breakMinTimeLeft)) return null;
        const offY = p => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'yinyang') && b[i].pips === p);
        const offS = p => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'switch') && b[i].pips === p);
        const lineCells = ordered([...line], crit);
        for (const L of lineCells) {
          if (!is(L, 'yinyang')) continue;
          const p = b[L].pips;
          if (p >= 6) continue; // 出目p+1が7まで
          if (!offY(p + 1).length || !offS(p + 1).length) continue;
          for (const F of offY(p)) {
            const a = findAct(F, L);
            if (a && a.result === 'merge') return act(a, `R3 ライン${L}の陰陽${p}に${F}の陰陽を合成（陰陽${p + 1}とスイッチ${p + 1}で復帰する）`);
          }
        }
        return null;
      }

      // ---------- 全面が埋まる前の活性（P1〜P3） ----------
      // 出目1の陰陽＋出目1のジョーカーの数（ジョーカーは陰陽をコピーできるので陰陽と同じに数える）
      const allCrit = critOrder.slice(0, Math.max(1, ((obs.field && obs.field.paradise) || []).length));
      const yj1 = b.filter(d => d && d.pips === 1 && (d.type === 'yinyang' || d.type === 'joker')).length;
      // 調和ができている（陰陽ロイヤルAIは、この試合で一度でもできた）ときは、ラインから陰陽を持ち出さない
      const lineGuard = (is(crit, 'yinyang') && lines().col && lines().row) || (typeof mem !== 'undefined' && !!(mem && mem.hEver));
      const guardCells = lineGuard ? [...line] : [];
      const rowFull = r => [0, 1, 2, 3, 4].every(k => b[r * 5 + k]);
      const colFull = c => [0, 1, 2].every(r => b[r * 5 + c]);
      // targets に陰陽をそろえる手（protect のマスからは陰陽・スイッチ・ジョーカーを持ち出さない）
      function placeIntoX(targets, protect) {
        const T = new Set(targets), P = new Set(protect), out = q => !T.has(q) && !P.has(q);
        const srcY = [...Array(15).keys()].filter(q => is(q, 'yinyang') && out(q));
        // a) target のスイッチで、外の同じ出目の陰陽を引き込む
        for (const t of targets) if (is(t, 'switch')) for (const q of srcY) {
          const a = findAct(t, q); if (a && a.result === 'swap') return act(a, `引き込み：${q}の陰陽→${t}`);
        }
        // b) target の出目1ジョーカーで陰陽をコピー
        for (const t of targets) if (is(t, 'joker') && b[t].pips === 1) for (let q = 0; q < 15; q++) {
          if (!is(q, 'yinyang')) continue;
          const a = findAct(t, q); if (a && a.result === 'copy') return act(a, `${t}のジョーカーで陰陽をコピー`);
        }
        // c) 外のスイッチを、target にある同じ出目の別種へ置く（同じ出目の陰陽が外にあるときだけ）
        const yPips = new Set(srcY.map(q => b[q].pips));
        const tg = targets.filter(t => b[t] && !['yinyang', 'switch', 'joker'].includes(b[t].type) && yPips.has(b[t].pips));
        for (const t of tg) for (let s = 0; s < 15; s++) {
          if (!out(s) || !is(s, 'switch')) continue;
          const a = findAct(s, t); if (a && a.result === 'swap') return act(a, `スイッチを置く：${s}→${t}`);
        }
        // d) 外の出目1ジョーカーで陰陽をコピー（引き込む陰陽が足りないとき）
        const inT = targets.filter(t => is(t, 'yinyang')).length;
        const jIn = targets.filter(t => is(t, 'joker') && b[t].pips === 1).length;
        if (inT + jIn + srcY.length < targets.length) {
          for (let j = 0; j < 15; j++) if (out(j) && is(j, 'joker') && b[j].pips === 1) for (let q = 0; q < 15; q++) {
            if (!is(q, 'yinyang')) continue;
            const a = findAct(j, q); if (a && a.result === 'copy') return act(a, `${j}のジョーカーで陰陽をコピー（引き込み用）`);
          }
        }
        return null;
      }
      let pfRow = null, pfCol = null;   // P1・P2 の対象（A の並べ替えで崩さないため）
      function preFill() {
        let rowT = null;
        // P1) 横活性：出目1の陰陽＋ジョーカーが5個以上、クリティカルマスを含む横一列が埋まっている（ラインの列を優先）
        if (yj1 >= 5) {
          const rows = [...new Set(allCrit.map(c => Math.floor(c / 5)))].filter(rowFull);
          if (rows.length) {
            const r = rows[0], cells = rowOf(r * 5);
            if (!cells.every(i => is(i, 'yinyang'))) {
              const prot = [...allCrit, ...guardCells].filter(c => !cells.includes(c));
              const m = placeIntoX(cells, prot);
              if (m) { m.note = `P1 横活性（${r + 1}行）へ ` + m.note; return { m }; }
            }
            rowT = cells;
          }
        }
        pfRow = rowT;
        // P2) 縦活性：出目1の陰陽＋ジョーカーが3個以上、クリティカルマスを含まない縦一列が埋まっている（陰陽が多い列から）
        // 縦活性が1列でもできていれば完了（完成した列から陰陽を抜くと往復するので、次の列は作らない）
        const colDone = [0, 1, 2, 3, 4].some(c => [0, 1, 2].every(r => is(r * 5 + c, 'yinyang')));
        if (yj1 >= 3 && !colDone) {
          const cols = [0, 1, 2, 3, 4].filter(c => !allCrit.some(x => x % 5 === c) && colFull(c))
            .map(c => ({ c, cells: [0, 1, 2].map(r => r * 5 + c) }))
            .filter(x => !x.cells.every(i => is(i, 'yinyang')))
            .sort((p, q) => q.cells.filter(i => is(i, 'yinyang')).length - p.cells.filter(i => is(i, 'yinyang')).length || p.c - q.c);
          // 対象は陰陽が最も多い1列だけ（ほかの列も試すと、列どうしで陰陽を引き抜き合って往復するため）
          if (cols.length) pfCol = cols[0].cells;
          for (const x of cols.slice(0, 1)) {
            const prot = [...(rowT || []), ...allCrit, ...guardCells].filter(i => !x.cells.includes(i));
            const m = placeIntoX(x.cells, prot);
            if (m) { m.note = `P2 縦活性（${x.c + 1}列）へ ` + m.note; return { m }; }
          }
        }
        // P3) 横活性に使っていないクリティカルマスにスイッチを置く
        // P4) 横活性をしていなければ（rowT なし）、どちらのクリティカルマスにも置く（このループがそのまま両方を見る）
        for (const c of allCrit) {
          if (rowT && rowT.includes(c)) continue;
          if (!b[c] || is(c, 'switch') || is(c, 'yinyang')) continue;
          for (let s = 0; s < 15; s++) {
            if (s === c || !is(s, 'switch') || allCrit.includes(s) || (rowT && rowT.includes(s))) continue;
            const a = findAct(s, c);
            if (a && a.result === 'swap') { const m = act(a, `P3 クリティカルマス${c}にスイッチを置く（${s}から）`); return { m }; }
          }
        }
        return null;
      }

      // W6以降の手（L）：ライン外の陰陽同士 → スイッチ同士（残さない）
      function lateMerges() {
        const off = i => !line.has(i);
        const mg = t => obs.legal.acts.filter(x => x.result === 'merge' && is(x.from, t) && is(x.to, t) && off(x.from) && off(x.to))
          .sort((p, q) => b[p.from].pips - b[q.from].pips)[0];
        let a;
        if ((a = mg('yinyang'))) return act(a, `L 陰陽同士 出目${b[a.from].pips}（ロイヤルを打つ前に）`);
        if ((a = mg('switch'))) return act(a, `L スイッチ同士 出目${b[a.from].pips}（ロイヤルを打つ前に）`);
        return null;
      }
      // 出目pのロイヤル＋出目p−1の養分＋出目p−1のジョーカー → 養分をジョーカーに当てる（ジョーカーを出目pにする）
      function jokerFeedForRoyal() {
        const off = i => !line.has(i);
        const rp = new Set(b.map((d, i) => d && d.type === 'royal' && off(i) ? d.pips : 0).filter(p => p >= 2));
        const c = obs.legal.acts.filter(x => x.result === 'feed' && is(x.from, 'nutrient') && is(x.to, 'joker') && off(x.from) && off(x.to)
          && rp.has(b[x.to].pips + 1) && !b.some((d, i) => d && off(i) && d.type === 'joker' && d.pips === b[x.to].pips + 1))
          .sort((p, q) => b[q.to].pips - b[p.to].pips);
        return c.length ? act(c[0], `L 養分${b[c[0].from].pips}をジョーカー${b[c[0].to].pips}に当てる（ロイヤル${b[c[0].to].pips + 1}をコピーするため）`) : null;
      }

      // K) W1のボスがレオン（極の調和ができる前）
      //   K1) どちらかのクリティカルマスにダイスがあり、スイッチが1個以上・養分が1個以上あり、召喚回数が leonMaxSummons 以内なら：
      //       出目1のスイッチをクリティカルマスに置き、養分を重ねて出目2のスイッチにする
      //   K2) K1 ができていなければ、残り leonLateSec 秒（とボス出現から最初のスキルまで）は縦活性に切り替える：
      //       クリティカルマスの縦一列に陰陽をそろえ → クリティカルマスの陰陽に養分 → 余った養分はクリティカル以外のラインの陰陽へ
      //   戻り値：{ m }＝実行する手、{ hold:true }＝K2 の最中（横活性などのほかの手順はしない）、null＝ふだんの手順
      function leonPrep() {
        if (!o.leonPrep || obs.wave !== 1 || obs.bossType !== 'leon' || harmonyNow || mem.hEver) return null;
        if (allCrit.some(c => is(c, 'switch') && b[c].pips >= 2)) { if (!mem.leonSw) { mem.leonSw = true; pendingMem = JSON.stringify(mem); } }
        if (mem.leonSw) return null;
        const okK1 = allCrit.some(c => b[c]) && count('switch') >= 1 && count('nutrient') >= 1 && obs.summonCount <= o.leonMaxSummons;
        if (okK1) {
          for (const c of allCrit) if (is(c, 'switch') && b[c].pips === 1) {
            const f = obs.legal.acts.find(x => x.result === 'feed' && x.to === c && is(x.from, 'nutrient'));
            if (f) return { m: act(f, `K1 レオン対策：クリティカルマス${c}のスイッチに養分（出目2のスイッチにする）`) };
          }
          if (!allCrit.some(c => is(c, 'switch') && b[c].pips === 1)) {
            for (const c of allCrit) {
              if (!b[c] || b[c].pips !== 1) continue;
              for (let s = 0; s < 15; s++) {
                if (allCrit.includes(s) || !is(s, 'switch') || b[s].pips !== 1) continue;
                const a = findAct(s, c);
                if (a && a.result === 'swap') return { m: act(a, `K1 レオン対策：出目1のスイッチをクリティカルマス${c}に置く（${s}から）`) };
              }
            }
          }
        }
        const lateW = (obs.phase === 'wave' && obs.timeLeft != null && obs.timeLeft <= o.leonLateSec)
          || (obs.phase === 'boss' && obs.boss && obs.boss.cast === 0);
        if (!lateW) return null;
        const colC = colOf(crit);
        if (!colC.every(i => is(i, 'yinyang'))) {
          const m = placeIntoX(ordered(colC, crit), []);
          if (m) { m.note = 'K2 レオン対策：縦活性へ ' + m.note; return { m }; }
        }
        if (is(crit, 'yinyang')) {
          const f = obs.legal.acts.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient'));
          if (f) return { m: act(f, `K2 レオン対策：クリティカルマスの陰陽に養分（出目${b[crit].pips}→${b[crit].pips + 1}）`) };
        }
        const f2 = obs.legal.acts.filter(x => x.result === 'feed' && is(x.from, 'nutrient') && line.has(x.to) && x.to !== crit && is(x.to, 'yinyang'))
          .sort((p, q) => colC.includes(q.to) - colC.includes(p.to) || p.to - q.to);
        if (f2.length) return { m: act(f2[0], `K2 レオン対策：ラインの陰陽${f2[0].to}に養分（出目${b[f2[0].to].pips}→${b[f2[0].to].pips + 1}）`) };
        return { hold: true };
      }

      // E) 序盤の養分：調和ができるまで、クリティカルマスの陰陽が縦か横に活性していれば、同じ出目の養分を重ねる。
      //    W1でボスがナイトのとき（全ダイスの種類が変わる）はしない。対象はラインのクリティカルマスだけ
      function earlyFeed() {
        if (!o.earlyFeed || harmonyNow) return null;
        if (obs.wave === 1 && obs.bossType === 'knight') return null;
        for (const c of [crit]) {
          if (!is(c, 'yinyang')) continue;
          const st0 = b[c].state || {};
          if (!st0.col && !st0.row) continue;
          const f = obs.legal.acts.find(x => x.result === 'feed' && x.to === c && is(x.from, 'nutrient'));
          if (f) return act(f, `E 序盤：${st0.col ? '縦' : '横'}活性のクリティカルマス${c}の陰陽に養分（出目${b[c].pips}→${b[c].pips + 1}）`);
        }
        return null;
      }

      // ---------- 盤面が埋まっていないとき ----------
      if (!full && !mem.hEver) {
        // A（極の調和ができるまで）：P1 → P2 → P3・P4 → ジョーカーで陰陽をコピー → 並べ替え → 召喚。ロイヤルは打たない
        const lk = actReady ? leonPrep() : null;
        if (lk && lk.m) return lk.m;
        if (actReady && !lk) {
          const ef = earlyFeed(); if (ef) return ef;
          const p = preFill(); if (p) return p.m;
          // ジョーカー：7 −（出目1の陰陽の数 ＋ 空きマス × preJokerEmptyW）> 0 なら、出目1のジョーカーで陰陽をコピー（ラインのジョーカーを先に）
          const y1 = b.filter(d => d && d.type === 'yinyang' && d.pips === 1).length, empty = b.filter(d => !d).length;
          if (7 - (y1 + empty * o.preJokerEmptyW) > 0) {
            const rank = i => i === crit ? 0 : row.includes(i) ? 1 : col.includes(i) ? 2 : 3;
            const cp = obs.legal.acts.filter(a => a.result === 'copy' && is(a.from, 'joker') && b[a.from].pips === 1 && is(a.to, 'yinyang'))
              .sort((p, q) => rank(p.from) - rank(q.from) || p.from - q.from);
            if (cp.length) return act(cp[0], `A ジョーカー${cp[0].from}で陰陽をコピー（7−(出目1の陰陽${y1}＋空き${empty}×${o.preJokerEmptyW})>0）`);
          }
          // 並べ替え：攻撃力÷攻撃間隔が大きいダイスを入口に近いマスへ（スイッチの入れ替えで）。
          //   動かさない：クリティカルマス、陰陽がそろった横・縦の列、P1・P2 の対象の列
          if (o.preSort) {
            const fixed = new Set(allCrit);
            for (let r0 = 0; r0 < 3; r0++) { const c5 = rowOf(r0 * 5); if (c5.every(i => is(i, 'yinyang'))) c5.forEach(i => fixed.add(i)); }
            for (let c0 = 0; c0 < 5; c0++) { const c3 = [0, 1, 2].map(r => r * 5 + c0); if (c3.every(i => is(i, 'yinyang'))) c3.forEach(i => fixed.add(i)); }
            (pfRow || []).forEach(i => fixed.add(i)); (pfCol || []).forEach(i => fixed.add(i));
            const rankC = new Map(byDist([...Array(15).keys()]).map((c, k) => [c, k])); // 入口に近いほど小さい
            const lvOf = t => (obs.deck.find(d => d.type === t) || {}).lv || 1;
            const val = i => dpsOf(b[i].type, lvOf(b[i].type)) * 100 + b[i].pips; // 同じなら出目の大きい方
            let best = null;
            for (const a of obs.legal.acts) {
              if (a.result !== 'swap' || fixed.has(a.from) || fixed.has(a.to)) continue;
              // スイッチ(from)と相手(to)が入れ替わる。値の大きい方が入口に近いマスへ行くときだけ
              const near = rankC.get(a.from) < rankC.get(a.to) ? a.from : a.to, far = near === a.from ? a.to : a.from;
              const gain = (val(far) - val(near)) * (rankC.get(far) - rankC.get(near)); // far のダイスが near へ来る
              if (gain > 0 && (!best || gain > best.gain)) best = { a, gain };
            }
            if (best) return act(best.a, `A 並べ替え：${best.a.from}⇔${best.a.to}（強いダイスを入口側へ）`);
          }
        }
        if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
        return null;
      }
      if (!full) {
        if (actReady) { const r = royalRules(); if (r) return r; }
        if (actReady) { const ef = earlyFeed(); if (ef) return ef; }
        // P1〜P3) 全面が埋まる前の活性とスイッチの配置
        if (actReady) { const p = preFill(); if (p) return p.m; }
        // W6以降で調和ができているとき：陰陽同士・スイッチ同士 → 養分をジョーカーへ → ロイヤルを打つ
        if (actReady && obs.wave >= o.lateFromWave && harmonyNow) {
          const r1 = lateMerges(); if (r1) return r1;
          const jf = jokerFeedForRoyal(); if (jf) return jf;
        }
        // ロイヤル攻撃（同じ出目が3個以上になったら打つ）
        if (actReady) { const r = fireRoyal(false); if (r) return r; }
        // 2) 召喚
        if (obs.legal.summon && !(ctl.summonReadyIn > 0)) return { ops: [{ op: 'summon' }], more: true, note: '召喚' };
        return null;
      }

      // ---------- 盤面が埋まっているとき ----------
      if (!actReady) return null;
      { const r = royalRules(); if (r) return r; }
      const ln = is(crit, 'yinyang') ? lines() : { col: false, row: false };
      const harmony = ln.col && ln.row;
      { const lk = leonPrep(); if (lk && lk.m) return lk.m; }
      { const ef = earlyFeed(); if (ef) return ef; }

      // 3) 有効な陰陽7個以上：極の調和
      if (E >= 7 && !harmony) {
        const r = placeInto(ordered([...line], crit));
        if (r) { r.note = '極の調和へ ' + r.note; return r; }
      }
      if (E < 7) {
        // 4) 出目1のジョーカーで陰陽をコピー（7−E 個まで。1回ごとに見直すので、E が7になったら止まる）
        //    ラインのジョーカー優先：クリティカルマス→横→縦→ライン外
        const rank = i => i === crit ? 0 : row.includes(i) ? 1 : col.includes(i) ? 2 : 3;
        const cp = obs.legal.acts.filter(a => a.result === 'copy' && is(a.from, 'joker') && b[a.from].pips === 1 && is(a.to, 'yinyang'))
          .sort((p, q) => rank(p.from) - rank(q.from) || p.from - q.from);
        if (cp.length) return act(cp[0], `ジョーカー${cp[0].from}で陰陽をコピー（有効な陰陽${E}→${E + 1}、あと${7 - E}個必要）`);
        // 5) 横活性 → 縦活性
        if (E >= 5 && !ln.row) {
          const r = placeInto(ordered(row, crit));
          if (r) { r.note = '横活性へ ' + r.note; return r; }
        }
        if (E >= 3 && !ln.col && !ln.row) {
          const r = placeInto(ordered(col, crit));
          if (r) { r.note = '縦活性へ ' + r.note; return r; }
        }
      }

      const late = obs.wave >= o.lateFromWave;
      // ロイヤル攻撃（同じ出目が3個以上になったら打つ）。W6以降で調和ができているときは、下の L) の後で判断する
      if (!(late && harmony)) { const r = fireRoyal(false); if (r) return r; }

      // ---------- 調和ができてから：自由マスの回し方（F1〜F9。必ずどれか1手を選び、詰まらせない） ----------
      if (harmony) {
        const off = i => !line.has(i);
        const A = obs.legal.acts;
        const T = (i) => b[i].type, P = (i) => b[i].pips;
        const JN = t => ({ yinyang: '陰陽', royal: 'ロイヤル', switch: 'スイッチ', nutrient: '養分', joker: 'ジョーカー' })[t] || t;
        const cntTP = (t, p) => b.filter((d, i) => d && off(i) && d.type === t && d.pips === p).length;
        const critTarget = Math.max(o.critTarget, need);          // 調和の出目の目標（既定5。貫通に必要ならそれ以上）
        const grow = cp0 < 7 && cp0 < critTarget;                  // 火力が足りない＝養分を作って調和の出目を上げる
        const pick = (list, cmp) => list.length ? list.sort(cmp)[0] : null;
        const merge = (t, cond) => A.filter(a => a.result === 'merge' && T(a.from) === t && T(a.to) === t && off(a.from) && off(a.to) && (!cond || cond(a)));
        let a;
        // F1) 火力が足りないとき：調和の出目より低い養分をそろえて上げる（高い出目から。ジョーカーのコピーでペアを作る）
        if (grow) {
          if ((a = pick(merge('nutrient', x => P(x.from) < cp0), (p, q) => P(q.from) - P(p.from)))) return act(a, `F1 調和用の養分 ${P(a.from)}同士を合成→${P(a.from) + 1}`);
          if ((a = pick(A.filter(x => x.result === 'copy' && T(x.from) === 'joker' && off(x.from) && T(x.to) === 'nutrient' && P(x.to) < cp0 && cntTP('nutrient', P(x.to)) === 1),
            (p, q) => P(q.to) - P(p.to)))) return act(a, `F1 ジョーカーで養分${P(a.to)}をコピー（調和用）`);
        }
        // L) W6以降：ロイヤルを打つ判断より先に、ライン外の陰陽同士・スイッチ同士を合成する（スイッチは残さない）。
        //    次に、出目pのロイヤルがあり、出目p−1の養分と出目p−1のジョーカーがあれば、養分をジョーカーに当てる
        //    （ジョーカーが出目pになり、F3 でロイヤルをコピーできる）
        if (late) {
          const r1 = lateMerges(); if (r1) return r1;
          const jf = jokerFeedForRoyal(); if (jf) return jf;
          if (o.jokerRoyal && (a = pick(A.filter(x => x.result === 'copy' && T(x.from) === 'joker' && off(x.from) && T(x.to) === 'royal'), (p, q) => P(q.to) - P(p.to))))
            return act(a, `L ジョーカーでロイヤル${P(a.to)}をコピー`);
        }
        // F2) ロイヤル攻撃：同じ出目が royalKeep+2 個以上なら打つ（1個はコピー元に残す。高い出目から）
        { const r = fireRoyal(false); if (r) return r; }
        // F3) ジョーカーでロイヤルをコピー（ロイヤルを増やす。高い出目から）
        if (o.jokerRoyal && (a = pick(A.filter(x => x.result === 'copy' && T(x.from) === 'joker' && off(x.from) && T(x.to) === 'royal'), (p, q) => P(q.to) - P(p.to))))
          return act(a, `F3 ジョーカーでロイヤル${P(a.to)}をコピー`);
        // F4) 養分で、出目が1つずれた同じ種類をペアにする（ロイヤル→スイッチ→陰陽→ジョーカー。火力が足りないときは調和用の養分は使わない）
        if (o.nutrientPair) {
          const rank = t => ({ royal: 0, switch: 1, yinyang: 2, joker: 3 })[t] ?? 4;
          a = pick(A.filter(x => x.result === 'feed' && T(x.from) === 'nutrient' && off(x.from) && off(x.to) && P(x.to) < 6
              && !(grow && P(x.from) < cp0) && cntTP(T(x.to), P(x.to) + 1) > 0),
            (p, q) => rank(T(p.to)) - rank(T(q.to)) || P(q.to) - P(p.to));
          if (a) return act(a, `F4 養分で${a.to}の${JN(T(a.to))}${P(a.to)}→${P(a.to) + 1}（ペアを作る）`);
        }
        // F5) 空きを作る合成（ライン外）：余った陰陽同士 → 養分同士 → スイッチ同士（switchKeep 個は残す） → ロイヤル（ロイヤル攻撃中、コピー元を残す）
        if ((a = pick(merge('yinyang'), (p, q) => P(p.from) - P(q.from)))) return act(a, `F5 余った陰陽同士 出目${P(a.from)}`);
        if ((a = pick(merge('nutrient', x => !(grow && P(x.from) >= cp0)), (p, q) => P(p.from) - P(q.from)))) return act(a, `F5 養分同士 出目${P(a.from)}`);
        if (count('switch') >= (late ? 0 : o.switchKeep) + 2 && (a = pick(merge('switch'), (p, q) => P(p.from) - P(q.from)))) return act(a, `F5 スイッチ同士 出目${P(a.from)}`);
        // F6) ジョーカーでコピーしてペアを作る（ロイヤル以外：養分→陰陽→スイッチ。同じ出目が1個だけのものに）
        {
          const rank = t => ({ nutrient: 0, yinyang: 1, switch: 2 })[t] ?? 3;
          if ((a = pick(A.filter(x => x.result === 'copy' && T(x.from) === 'joker' && off(x.from) && off(x.to) && T(x.to) !== 'royal' && cntTP(T(x.to), P(x.to)) === 1),
            (p, q) => rank(T(p.to)) - rank(T(q.to)) || P(p.to) - P(q.to)))) return act(a, `F6 ジョーカーで${JN(T(a.to))}${P(a.to)}をコピー（ペアを作る）`);
        }
        // F7) 養分をライン外のロイヤルに当てて育てる（ペアにならなくても。火力が足りないときは調和用の養分は使わない）
        if ((a = pick(A.filter(x => x.result === 'feed' && T(x.from) === 'nutrient' && off(x.from) && off(x.to) && T(x.to) === 'royal' && !(grow && P(x.from) < cp0)),
          (p, q) => P(p.from) - P(q.from)))) return act(a, `F7 養分でロイヤル${P(a.to)}を育てる`);
        // F8) まだ手がなければ：ジョーカー同士 → ロイヤルのペア（コピー元を残さない） → スイッチ同士（残さない）
        if ((a = pick(merge('joker'), (p, q) => P(p.from) - P(q.from)))) return act(a, `F8 ジョーカー同士 出目${P(a.from)}`);
        if (!holdRoyal && (a = pick(merge('royal'), (p, q) => P(q.from) - P(p.from)))) return act(a, `F8 ロイヤル攻撃（詰まり回避）：出目${P(a.from)}`);
        if ((a = pick(merge('switch'), (p, q) => P(p.from) - P(q.from)))) return act(a, `F8 スイッチ同士（詰まり回避） 出目${P(a.from)}`);
        // F9) 養分を何かに当てて出目をずらす（次のペアの種にする）
        if ((a = pick(A.filter(x => x.result === 'feed' && T(x.from) === 'nutrient' && off(x.from) && off(x.to) && !(grow && P(x.from) < cp0)), (p, q) => P(p.from) - P(q.from))))
          return act(a, `F9 養分で${JN(T(a.to))}${P(a.to)}の出目をずらす`);
      }

      // 6) 縦のみ・横のみ活性：クリティカルマスの陰陽に養分
      const feedOk = (ln.col !== ln.row) || (harmony && o.feedAfterHarmony);
      const feed = () => {
        if (!feedOk) return null;
        const a = obs.legal.acts.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient'));
        return a ? act(a, `クリティカルマスの陰陽に養分（出目${b[crit].pips}→${b[crit].pips + 1}）`) : null;
      };
      if (o.feedBeforeClear) { const r = feed(); if (r) return r; }

      // 7) 盤面を空ける合成（合成先はライン外。陰陽・ジョーカーは使わない）
      const clear = (maxPips) => {
        const merges = obs.legal.acts.filter(a => a.result === 'merge' && !line.has(a.to)
          && b[a.from].type === b[a.to].type && b[a.from].pips <= maxPips);
        const pick = (type, fromLineFirst) => {
          const c = merges.filter(a => b[a.from].type === type && a.from !== crit)
            .sort((p, q) => b[p.from].pips - b[q.from].pips
              || (fromLineFirst ? line.has(q.from) - line.has(p.from) : line.has(p.from) - line.has(q.from))
              || p.from - q.from);
          return c[0];
        };
        let a;
        // スイッチはラインの中にあると引き込みに使えるので、ライン外のものから合成する
        if (count('switch') >= o.switchMergeMin && (a = pick('switch', false))) return act(a, `盤面を空ける：スイッチ同士 ${a.from}→${a.to}`);
        // 養分・自由枠はラインの中のものから合成する（ラインのマスを空ける）
        if ((a = pick('nutrient', true))) return act(a, `盤面を空ける：養分同士 ${a.from}→${a.to}`);
        for (const t of FREE) {
          if (t === 'royal' && !royalOn) continue; // ロイヤル攻撃中でなければロイヤルは合成しない
          if ((a = pick(t, true)) && (t !== 'royal' || (!holdRoyal && (maxPips >= 7 || royalCnt(b[a.from].pips) >= 2 + keepN))))
            return act(a, `盤面を空ける：自由枠同士 ${a.from}→${a.to}`);
        }
        return null;
      };
      let r = clear(o.clearMaxPips);
      if (r) return r;
      if (!o.feedBeforeClear) { r = feed(); if (r) return r; }

      // S) 養分の捨て先：ライン上のクリティカル以外の陰陽（調和ができているとき。R1・R2で使う出目は残す）
      if (o.lineSink && harmony) {
        const c0 = b[crit].pips, keep = new Set(c0 < 7 ? [c0, c0 - 1] : []);
        const s1 = obs.legal.acts.filter(a => a.result === 'feed' && is(a.from, 'nutrient') && line.has(a.to) && a.to !== crit
          && is(a.to, 'yinyang') && !keep.has(b[a.from].pips))
          .sort((p, q) => b[p.from].pips - b[q.from].pips || p.to - q.to);
        if (s1.length) return act(s1[0], `S 養分${b[s1[0].from].pips}をラインの陰陽${s1[0].to}へ（捨て先）`);
      }

      // R3) ラインを巻き込む合成（復帰の手がそろっているときだけ）
      r = safeBreak();
      if (r) return r;

      // 8) 最後の手段
      if (o.lastResort) {
        r = clear(7);
        if (r) { r.note = '（最後の手段）' + r.note; return r; }
        const jj = obs.legal.acts.find(a => a.result === 'merge' && is(a.from, 'joker') && is(a.to, 'joker'));
        if (jj) return act(jj, `（最後の手段）ジョーカー同士 ${jj.from}→${jj.to}`);
        // ロイヤル攻撃中でなくても、最後はロイヤル同士を合成する
        const rr = fireRoyal(true);
        if (rr) { rr.note = '（最後の手段）' + rr.note; return rr; }
      }
      // F11) 詰み回避（lineSinkLast）：ほかに手がないときだけ、クリティカル以外のラインの陰陽に同じ出目の養分を当てる
      if (harmony && o.lineSinkLast) {
        const c0 = b[crit].pips, keep = new Set(c0 < 7 ? [c0, c0 - 1] : []);
        const s1 = obs.legal.acts.filter(a => a.result === 'feed' && is(a.from, 'nutrient') && line.has(a.to) && a.to !== crit
          && is(a.to, 'yinyang') && !keep.has(b[a.from].pips)).sort((p, q) => b[p.from].pips - b[q.from].pips);
        if (s1.length) return act(s1[0], `F11 詰み回避：養分${b[s1[0].from].pips}をラインの陰陽${s1[0].to}へ`);
      }
      // F10) 詰み回避：ラインの陰陽（クリティカル以外）を、ライン外の同じ出目の陰陽へ合成してラインのマスを空ける
      //      （人の操作と同じ向き。空いたマスに召喚が入り、R0 で組み直す。ボス出現の breakMinTimeLeft 秒前からはしない）
      if (harmony && o.jamBreak && obs.phase === 'wave' && obs.timeLeft >= o.breakMinTimeLeft) {
        const c = obs.legal.acts.filter(a => a.result === 'merge' && is(a.from, 'yinyang') && is(a.to, 'yinyang')
          && line.has(a.from) && a.from !== crit && !line.has(a.to))
          .sort((p, q) => b[q.to].pips - b[p.to].pips || (col.includes(q.from) - col.includes(p.from)) || p.from - q.from);
        if (c.length) return act(c[0], `F10 詰み回避：ライン${c[0].from}の陰陽${b[c[0].from].pips}を${c[0].to}へ合成（ラインを空けて組み直す）`);
      }
      return null;
    }
  },
});
