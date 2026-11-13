// 台風テレポフローAI 1.0.0（AI API v1／AIRandomDicesim 3.12.2 で確認）
// 登録ID：typhoon_teleport_flow（ほかのAIと同時に読み込めるよう、IDを分けている）
// 想定デッキ：台風・テレポート・フロー・成長・ジョーカー（対戦用。フローとテレポートの送りは対戦でしか効かない）
// 操作速度：0.3秒（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ）。暗殺対面（相手のデッキに暗殺）は0.1秒
//
// 用語
//   台風の総出目：盤面の台風の出目の合計
//   ペア：同じ種類・同じ出目の2個（合成できる組）
//   送り：格納のあるテレポートを合成して、格納した敵を相手に出すこと
//   仕上げ：テレポートを送りきった後の「フロー以外は全部合成・ジョーカーはフローをコピー・フローを最後までPU」
//
// ■ 暗殺対面（ほかのどの手より先）
//   暗殺の予告が来たダイス（着弾の近いものから。着弾までにドラッグが終わるときだけ）
//     ジョーカー：同じ出目の別の種類をコピーして避ける（いまの段階でコピーしたい種類を優先：仕上げ＝フロー、送り準備＝テレポート、それ以外＝成長）
//     ほかのダイス：懸賞金の印のない同じ種類・同じ出目の相方に向かって合成して避ける
//   1Wの台風のPU：「台風が出たら」の代わりに、残り45秒以降で、盤面の総出目が6以上・台風が2個以上なら台風Lv2
//   それ以外はノーマル対面と同じ
//
// ■ 1W
//   PU：台風が出たら台風Lv2 → 召喚
//   重ねる操作（上から最初にできるもの）
//     1. ジョーカーで成長をコピー（全部）
//     2. 成長の出目2が出た後（一度出たら以降ずっと）：出目1のペアをすべて合成（台風→フロー→テレポート→成長→ジョーカーの順）
//     3. 盤面が埋まったら：出目1の台風 → 出目1のフロー → 出目1のテレポートのペアを合成
//     4. （指定外の追加）盤面が埋まっていて上の手がないとき：低い出目のペアから合成（fullFallback）
//
// ■ 2W開始：台風Lv3 → テレポートLv3 の順（台風がLv3になるまでテレポートはPUしない。以降のウェーブもこの目標を満たすまでPU）
//   PUはSPが足りればすぐ（召喚より先）。足りない間は召喚を続ける（puWait:true で、足りるまで召喚を止める。試験では止めない方が少し良かった）
//
// ■ 2W（ボスで分ける。発動するまでは1Wと同じ動き）
//   ナイト：台風の総出目が5以上になったら（以降このウェーブはずっと）
//     ・台風のペア（typhoonMerge）・フローのペアを合成、ジョーカーはテレポートをコピー
//     ・SPが余れば（盤面が埋まっていて召喚できないとき）フローをPU
//   レオン：ナイトと同じ。ただしフローのペアは合成しない
//   送り（ナイト・レオン）：ボス出現の残り3秒から、格納のあるテレポートをすべて合成
//     a) 格納のあるテレポートのペアを合成（格納の合計が多い組から）
//     b) 相方がいなければ、同じ出目のジョーカーでコピーして相方を作る（次に a で合成）
//     c) それもなければ、そのテレポートの出目−1のペアを合成して、相方（テレポートかジョーカー）が出るのを試みる
//   仕上げ：送りきった（格納のあるテレポートがない）か、ナイトのスキルを受けたら（次のウェーブまで）
//     ジョーカーはフローをコピー → フロー以外のペアを全部合成（低い出目から。ジョーカー同士は最後）→ 手がなくなったらフローをLv5までPU
//     → フローがLv5なら召喚（指定外の追加）
//   それ以外のボス：台風・フロー・テレポートの出目2以下のペアを合成。台風Lv5（召喚より先）
//
// ■ 3W以降（指定は3W。4W以降も同じ動き）
//   台風の総出目が8以上になったら：台風のペア（typhoonMerge）・フローの出目2以下のペアを合成、ジョーカーはテレポートをコピー、SPが余ればフローをPU
//   送り：ボス出現の残り3秒から（2Wと同じ）
//   仕上げ：送りきったら（2Wと同じ）
//
// typhoonMerge：「残りの台風のペア」の読み方
//   'excess'（既定）＝合成しても、残りの台風の総出目が発動の値（5か8）以上残るペアだけ合成する
//   'all'＝台風のペアをすべて合成する
'use strict';

RD.defineAgent('typhoon_teleport_flow', {
  name: '台風テレポフローAI',
  desc: '台風・テレポート・フロー・成長・ジョーカー用（対戦）。1Wは召喚・台風Lv2・ジョーカーで成長・成長の出目2が出たら出目1のペアを合成。2W開始で台風Lv3・テレポートLv3。ナイト・レオンのウェーブと3W以降は、台風の総出目が5（3Wは8）になったら台風・フローのペアを合成してジョーカーでテレポートをコピー、ボスの3秒前にテレポートを送り、送りきったらフロー以外を全部合成してフローをLv5に。2Wのそれ以外のボスは出目2以下のペアを合成して台風Lv5。暗殺対面は操作0.1秒で暗殺を避ける。',
  options: {
    speed: 0.3,            // 操作速度（判断の間隔・重ねる操作の間隔・召喚の間隔・ドラッグ）
    assassinSpeed: 0.1,    // 暗殺対面の操作速度
    sendLeft: 3,           // ボス出現の残りこの秒数から、テレポートを送る
    knightTyphoon: 5,      // 2Wのナイト・レオン：台風の総出目がこれ以上で発動
    w3Typhoon: 8,          // 3W以降：台風の総出目がこれ以上で発動
    w3FlowMaxPips: 2,      // 3W以降：フローのペアはこの出目以下だけ合成
    otherMaxPips: 2,       // 2Wのそれ以外のボス：この出目以下のペアを合成
    typhoonMerge: 'excess',// 'excess'＝台風の総出目が発動の値を下回らないペアだけ／'all'＝全部
    asnLeft: 45,           // 暗殺対面：1Wの残りこの秒数から台風Lv2の判定
    asnPips: 6,            // 暗殺対面：盤面の総出目がこれ以上
    asnTyphoons: 2,        // 暗殺対面：台風がこの数以上
    fullFallback: true,    // （指定外）盤面が埋まって手がないとき、低い出目のペアから合成
    finalSummon: true,     // （指定外）仕上げでフローがLv5になったら召喚する
    puWait: false,         // 台風Lv2（1W）・台風Lv3／テレポートLv3（2W開始）のSPが貯まるまで召喚しない
  },
  limits: (o, info) => {
    const asn = !!(info && info.opponentDeck && info.opponentDeck.some(d => d.type === 'assassin'));
    const s = asn ? o.assassinSpeed : o.speed;
    return { interval: s, actInterval: s, summonInterval: s, dragTime: s, maxOps: null };
  },

  create(ctx) {
    if (ctx.info.v !== 1) ctx.log(`想定していない版 v${ctx.info.v}`);
    const O = ctx.options;
    const ASN = !!(ctx.info.opponentDeck && ctx.info.opponentDeck.some(d => d.type === 'assassin'));
    const NAME = { typhoon: '台風', teleport: 'テレポート', flow: 'フロー', growth: '成長', joker: 'ジョーカー' };
    const nm = t => NAME[t] || t;
    ctx.log(ASN ? '暗殺対面（操作0.1秒・暗殺避け）' : 'ノーマル対面');

    // 試合中に持つ状態
    const S = {
      wave: 0,
      growth2: false,   // 成長の出目2が一度出た
      trig: false,      // このウェーブの「台風の総出目」の発動
      sendOn: false,    // このウェーブの送りを始めた
      final: false,     // このウェーブの仕上げに入った
      dodged: new Set(),// 避けに動いた予告（対象のダイスID）
    };

    return {
      decide(obs) {
        if (obs.over) return null;
        if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return null;
        const b = obs.board, ctl = obs.control || {}, W = obs.wave;
        if (W !== S.wave) { S.wave = W; S.trig = false; S.sendOn = false; S.final = false; }

        // ---------- 道具 ----------
        const cells = t => [...Array(15).keys()].filter(i => b[i] && b[i].type === t && !b[i].sealed);
        const full = b.every(Boolean);
        const lv = t => { const d = obs.deck.find(x => x.type === t); return d ? d.lv : 99; };
        const puMax = t => { const d = obs.deck.find(x => x.type === t); return d ? d.puMax : 5; };
        const canPU = t => (obs.legal.powerUp || []).includes(t);
        const stored = d => (d && d.state && d.state.stored) || 0;
        const tySum = () => cells('typhoon').reduce((s, i) => s + b[i].pips, 0);
        const legal = new Map(obs.legal.acts.map(a => [a.from * 15 + a.to, a]));
        const find = (f, t, res) => { const a = legal.get(f * 15 + t); return a && a.result === res ? a : null; };
        const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
        const canSummon = obs.legal.summon && !(ctl.summonReadyIn > 0);
        const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note });
        const pu = (t, note) => ({ ops: [{ op: 'powerUp', type: t }], more: true, note: `PU ${nm(t)} Lv${lv(t) + 1}${note ? '（' + note + '）' : ''}` });
        const summon = note => ({ ops: [{ op: 'summon' }], more: true, note: note || '召喚' });

        // 同じ種類のペア（ok(出目) を満たすもの。低い出目から）
        const pairs = (t, ok = () => true) => {
          const L = cells(t), res = [];
          for (let x = 0; x < L.length; x++) for (let y = x + 1; y < L.length; y++) {
            const p = b[L[x]].pips;
            if (p !== b[L[y]].pips || p >= 7 || !ok(p, L[x], L[y])) continue;
            const a = find(L[x], L[y], 'merge') || find(L[y], L[x], 'merge');
            if (a) res.push(a);
          }
          return res.sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from);
        };
        const firstPair = (types, ok) => { for (const t of types) { const a = pairs(t, ok)[0]; if (a) return a; } return null; };
        // ジョーカーで t をコピー（出目の低いジョーカーから）
        const jokerCopy = (t, ok = () => true) => {
          const res = [];
          for (const j of cells('joker')) for (const x of cells(t)) { if (!ok(x)) continue; const a = find(j, x, 'copy'); if (a) res.push(a); }
          return res.sort((p, q) => b[p.from].pips - b[q.from].pips || p.from - q.from)[0] || null;
        };
        const mNote = (a, label) => `${label}（${nm(b[a.from].type)}${b[a.from].pips}：${a.from}→${a.to}）`;
        const cNote = (a, label) => `${label}（ジョーカー${b[a.from].pips}→${nm(b[a.to].type)}）`;

        // ---------- 段階 ----------
        const boss = obs.bossType;
        const inBoss = obs.phase === 'boss' || obs.phase === 'cleanup';
        const sendBoss = W >= 3 || (W === 2 && (boss === 'knight' || boss === 'leon'));
        const otherW2 = W === 2 && !sendBoss;
        const trigVal = W >= 3 ? O.w3Typhoon : O.knightTyphoon;
        if (sendBoss && !S.trig && tySum() >= trigVal) { S.trig = true; ctx.log(`${W}W：台風の総出目${tySum()}（${trigVal}以上）→ 発動`); }
        if (sendBoss && !S.sendOn && ((obs.phase === 'wave' && obs.timeLeft != null && obs.timeLeft <= O.sendLeft) || inBoss)) { S.sendOn = true; ctx.log(`${W}W：テレポートを送る`); }
        const storedTele = cells('teleport').filter(i => stored(b[i]) > 0);
        if (sendBoss && S.sendOn && !S.final) {
          const knightHit = W === 2 && boss === 'knight' && obs.boss && obs.boss.type === 'knight' && obs.boss.cast >= 1;
          if (!storedTele.length || knightHit) { S.final = true; ctx.log(`${W}W：仕上げ（${knightHit ? 'ナイトのスキルを受けた' : '送りきった'}）`); }
        }
        if (cells('growth').some(i => b[i].pips === 2) && !S.growth2) { S.growth2 = true; ctx.log('成長の出目2が出た → 出目1のペアを合成'); }
        const jokerWant = S.final ? 'flow' : (S.trig || S.sendOn) ? 'teleport' : 'growth';

        // ---------- 0) 暗殺避け ----------
        if (ASN && actReady) {
          const drag = ctl.dragTime || 0;
          const pend = (obs.pending || []).filter(p => p.kind === 'assassin' && p.in > drag + 1e-6)
            .sort((p, q) => p.in - q.in);
          for (const p of pend) {
            const i = p.cells[0], d = b[i];
            if (!d) continue;
            if (d.type === 'joker') {
              const order = [jokerWant, 'flow', 'teleport', 'typhoon', 'growth'];
              for (const t of order) for (const x of cells(t)) { const a = find(i, x, 'copy'); if (a) return act(a, `暗殺避け：ジョーカー${d.pips}で${nm(t)}をコピー`); }
            } else {
              let best = null;
              for (const x of cells(d.type)) {
                if (x === i || b[x].pips !== d.pips || (b[x].bounty || 0) > 0) continue;
                const a = find(i, x, 'merge');
                if (a && (!best || x < best.to)) best = a;
              }
              if (best) return act(best, `暗殺避け：${nm(d.type)}${d.pips}を相方に合成`);
            }
          }
        }

        // ---------- 1) PU ----------
        //   台風Lv2（1W）・台風Lv3→テレポートLv3（2W開始）は、SPが足りるまで召喚せずに待つ（puWait）。台風Lv5は足りるときだけ
        let goal = null;
        if (W === 1) {
          if (ASN) {
            const total = b.reduce((s, d) => s + (d ? d.pips : 0), 0);
            if (obs.timeLeft != null && obs.timeLeft <= O.asnLeft && total >= O.asnPips && cells('typhoon').length >= O.asnTyphoons && lv('typhoon') < 2)
              goal = ['typhoon', `残り${O.asnLeft}秒・総出目${total}・台風${cells('typhoon').length}個`];
          } else if (cells('typhoon').length && lv('typhoon') < 2) goal = ['typhoon', '台風が出た'];
        } else if (lv('typhoon') < 3) goal = ['typhoon', '2W開始'];
        else if (lv('teleport') < 3) goal = ['teleport', '2W開始'];
        if (goal && canPU(goal[0])) return pu(goal[0], goal[1]);
        const puWait = !!(goal && O.puWait);
        if (!goal && otherW2 && lv('typhoon') < 5 && canPU('typhoon')) return pu('typhoon', '2W・ナイト／レオン以外');

        // ---------- 仕上げ ----------
        if (S.final) {
          // フロー以外のペア（低い出目から）。ジョーカー同士は、ほかのペアがないときだけ
          const nonFlow = () => {
            const L = [...pairs('typhoon'), ...pairs('teleport'), ...pairs('growth')].sort((p, q) => b[p.from].pips - b[q.from].pips);
            return L[0] || pairs('joker')[0] || null;
          };
          if (actReady) {
            const c = jokerCopy('flow');
            if (c) return act(c, cNote(c, '仕上げ：フローをコピー'));
            const m = nonFlow();
            if (m) return act(m, mNote(m, '仕上げ：フロー以外を合成'));
          }
          const moves = jokerCopy('flow') || nonFlow();
          if (!moves) {
            if (lv('flow') < puMax('flow')) { if (canPU('flow')) return pu('flow', '仕上げ'); return { ops: [], note: '仕上げ：フローのPUのSP待ち' }; }
            if (O.finalSummon && canSummon) return summon('仕上げ：フローLv5済みなので召喚');
          }
          return null;
        }

        // ---------- 2) 召喚 ----------
        if (canSummon && !puWait) return summon();

        if (!actReady) {
          if (full && (S.trig || S.sendOn) && lv('flow') < puMax('flow') && canPU('flow')) return pu('flow', 'SPが余った');
          return null;
        }

        // ---------- 3) 送り ----------
        if (S.sendOn && storedTele.length) {
          // a) 格納のあるテレポートのペア（格納の合計が多い組から）
          let bm = null, bs = -1;
          for (const a of pairs('teleport')) { const s = stored(b[a.from]) + stored(b[a.to]); if (s > 0 && s > bs) { bm = a; bs = s; } }
          if (bm) return act(bm, `送り：テレポート${b[bm.from].pips}を合成して${bs}体を送る`);
          // b) ジョーカーで相方を作る（格納の多いテレポートから）
          const st = storedTele.slice().sort((x, y) => stored(b[y]) - stored(b[x]));
          for (const x of st) for (const j of cells('joker')) { const a = find(j, x, 'copy'); if (a) return act(a, `送り：ジョーカー${b[j].pips}でテレポート（${stored(b[x])}体）をコピーして相方を作る`); }
          // c) 出目−1のペアを合成して相方を狙う（フローと格納のあるテレポートは使わない）
          for (const x of st) {
            const p = b[x].pips - 1; if (p < 1) continue;
            const a = firstPair(['teleport', 'joker', 'growth', 'typhoon'], (q, u, v) => q === p && !stored(b[u]) && !stored(b[v]));
            if (a) return act(a, `送り：相方を狙って出目${p}の${nm(b[a.from].type)}を合成（テレポート${b[x].pips}・${stored(b[x])}体）`);
          }
        }

        // ---------- 4) ウェーブごとの手 ----------
        let a;
        if (S.trig) {
          // 台風のペア
          a = pairs('typhoon', p => O.typhoonMerge === 'all' || tySum() - 2 * p >= trigVal)[0];
          if (a) return act(a, mNote(a, `台風の総出目${tySum()}：台風のペア`));
          // フローのペア（2Wナイト＝全部／2Wレオン＝しない／3W以降＝出目2以下）
          const flowOk = W >= 3 ? (p => p <= O.w3FlowMaxPips) : boss === 'knight' ? (() => true) : null;
          if (flowOk && (a = pairs('flow', flowOk)[0])) return act(a, mNote(a, 'フローのペア'));
          if ((a = jokerCopy('teleport'))) return act(a, cNote(a, 'テレポートをコピー'));
        } else if (otherW2) {
          if ((a = firstPair(['typhoon', 'flow', 'teleport'], p => p <= O.otherMaxPips))) return act(a, mNote(a, `2W：出目${O.otherMaxPips}以下のペア`));
        }
        // 1Wからの動き（発動前・2Wのそれ以外のボスも）
        if (!S.trig) {
          if ((a = jokerCopy('growth'))) return act(a, cNote(a, '成長をコピー'));
        }
        if (S.growth2 && (a = firstPair(['typhoon', 'flow', 'teleport', 'growth', 'joker'], p => p === 1))) return act(a, mNote(a, '成長の出目2が出た：出目1のペア'));
        if (full) {
          if ((a = firstPair(['typhoon', 'flow', 'teleport'], p => p === 1))) return act(a, mNote(a, '盤面が埋まった：出目1のペア'));
          if (O.fullFallback) {
            // （指定外）低い出目のペアから。格納のあるテレポートは使わない。ジョーカーは最後
            const L = [];
            for (const t of ['typhoon', 'growth', 'teleport', 'flow']) for (const x of pairs(t, (p, u, v) => !stored(b[u]) && !stored(b[v]))) L.push(x);
            L.sort((p, q) => b[p.from].pips - b[q.from].pips);
            const pick = L[0] || pairs('joker')[0];
            if (pick) return act(pick, mNote(pick, '（追加）盤面が埋まって手がない：低い出目のペア'));
          }
          // SPが余れば（盤面が埋まっていて召喚できない）フローをPU
          if ((S.trig || S.sendOn) && lv('flow') < puMax('flow') && canPU('flow')) return pu('flow', 'SPが余った');
        }
        return null;
      },
    };
  },
});
