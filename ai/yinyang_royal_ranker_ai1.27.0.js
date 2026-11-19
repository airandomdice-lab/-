// ランカー陰ロイAI 1.27.0（対面ごとに戦術モジュールを組み合わせる）
//
// ■ 対面とモジュール
//   試合の最初に、相手のデッキとスキンから対面を決め、その対面のモジュールを上から順に試す（手が出たらそれを使う。どれも出なければ召喚）
//   対面の条件（MATCHUPS の cond）
//     暗殺対面：暗殺 ／ 核対面：核 ／ 祝福スココン対面：スコープ・コンボ・相手のスキンが祝福 ／ 楽園スココン対面：スコープ・コンボ ／
//     月太陽対面：月・太陽 ／ 月火力対面：月 ／ ロイヤル対面：ロイヤル ／ ノーマル対面：ほかのどれにも当てはまらないとき（練習もここ）
//   条件に当てはまる対面はすべて取る。ただし条件が被るとき（一方の条件が他方の条件をすべて含むとき）は、より細かく指定している方だけを取る
//     例：月・太陽 → 月太陽対面（月火力対面は取らない）／ 月・スコープ・コンボ（祝福）→ 月火力対面＋祝福スココン対面 ／ 月・太陽・ロイヤル → 月太陽対面＋ロイヤル対面
//   複数の対面を取ったときは、MATCHUPS の表の順に、それぞれのモジュールを重ならないように並べる（暗殺対面のモジュールは自分の中で召喚まで決めるので、入っていればほかは使わない）
//   モジュール
//     極の調和目指し通常（harmony）：極の調和になっていないときの動き（下の「盤面が埋まるまで」「盤面が一度埋まった後」）
//     通常ロイヤルそろえ（royalArrange）：極の調和になっているときの動き（下の「極の調和になっているとき」）
//     暗殺対面（assassin）：暗殺避け ＋ 暗殺対面の盤面（縦活性＋楽園マスの出目2スイッチ）
//   いまの組み合わせ：暗殺対面は 暗殺対面、ほかの対面はすべて 極の調和目指し通常 → 通常ロイヤルそろえ（MATCHUPS の表で変える）（AI API v1／AIRandomDicesim 3.6.0 で確認）
// 登録ID：yinyang_royal_ranker（陰陽ロイヤルAI yinyang_royal・陰陽基礎AI yinyang_basic とは別。同時に読み込める）
// 想定デッキ：陰陽・スイッチ・養分・ジョーカー・ロイヤル。想定フィールド：神々の楽園
// 推奨のAIの速さ：判断の間隔0.5秒・操作の間隔0.3秒・召喚の間隔0.3秒・ドラッグ0.3秒（この速さで検証）
//
// 用語
//   クリマス：極の調和を作る方のクリティカルマス（楽園の2マスのうち、入口に近い方）
//   ライン：クリマスの縦横のマス（合計6マス。クリマスは含まない）。ライン外：クリマスとライン以外の8マス
//
// 変更：1.1.0　暗殺対面（相手のデッキに暗殺がある）で、スイッチによる暗殺避けを追加
// 変更：1.27.0　月太陽対面：試合の最初に1/2で「新しい選択」（msNewPlan）。極の調和目指し・出目上げなどは同じで、ロイヤル攻撃の条件だけ変える：
//   W5・W8・W10（msNewWaves）の残り45秒から、相手の太陽が活性していればロイヤル攻撃。
//   残り10秒で相手の先頭が中央（6）を越えていなければ、そのウェーブのロイヤル攻撃は終了。ほかのウェーブ・時間はロイヤル攻撃をしない
//   W5・W8・W10 でロイヤル攻撃をしないときは、いつもロイヤルそろえ（打たない）を動かす
// 変更：1.26.0　ライン建て直しの2番目に追加：陰陽をコピーできるライン外のジョーカーを、ラインのスイッチで引き込む（次の手で陰陽をコピー）
// 変更：1.25.3　上の普通のロイヤルそろえでも打つ手がないときだけ、残すスイッチの守りを外してもう一度ロイヤルそろえ
// 変更：1.25.2　出目上げ待ちで、打つ手もロイヤルもない（打てない）ときは、残すスイッチは守ったまま普通のロイヤルそろえ（養分を与える手もあり）に戻す
// 変更：1.25.1　スイッチ絞り：W3まで（クリマスで切る）に、クリマスの陰陽と同じ出目のスイッチがラインの外になければ、ラインの陰陽と同じ出目のスイッチでラインの陰陽をずらして切る
// 変更：1.25.0　ロイヤル対面：ロイヤル攻撃をしないときは、召喚・PU・建て直しなど指示したものだけ行う（ロイヤルそろえはしない）。
//   月太陽ロイヤル・ノーマルロイヤル対面では、余っているジョーカー（クリマス・ラインの外）で、盤面のスイッチが1個ならスイッチを、そうでなければ陰陽をコピーする
// 変更：1.24.1　月火力対面（相手に月があり、太陽・ロイヤル・コンボなどほかの対面に当てはまらないとき）を一旦ノーマル対面に入れた（対面の表から外した）
// 変更：1.24.0　ロイヤル対面を3つに分けた（ノーマルロイヤル対面・陰陽ロイヤル対面・月太陽ロイヤル対面）。共通（ロイヤル対面ノーマル立ち回り）：
//   極の調和目指し（ロイヤル対面版）→ 調和ができた後は、崩れたらいかなる場合も最優先でクリマス建て直し → ライン建て直し → W3以降、陰陽をLv最大までPU・調和の出目2。
//   ロイヤルを打つのは条件がそろったときだけ（ロイヤル対面版ロイヤル攻撃）。そろっていなければロイヤル対面版のロイヤルそろえ（打たない）
//   ノーマルロイヤル：W4以降 D・R の判断で攻撃／W5以降は相手の先頭が2つ目の角（8.5）を越えていなければずっと攻撃。W6で出目3
//   陰陽ロイヤル：W4以降、相手の陰陽が活性していれば攻撃。W6で出目3・W7で4
//   月太陽ロイヤル：W2以降、ボスがレオンのとき相手の月と太陽が活性していれば1回攻撃。W4以降、開始10秒は攻撃しない。
//     相手の先頭が2つ目の角の先1マス（9.5）を越えておらず、相手の太陽が活性している間は攻撃。W6で出目3・W7で4
// 変更：1.23.0　ロイヤル対面（royalMatch）を作った
//   極の調和目指し（ロイヤル対面版）：クリマスは上に近い楽園マス（同じ高さなら右）。陰陽の出目を2に上げる手はしない（出目2陰陽の手・W1レオン・W2レオン）。
//     盤面が埋まった後の「盤面を空ける合成」は：出目1養分を1個残してロイヤルに養分 → 養分同士 → 出目1ロイヤル同士 → 出目2ロイヤル同士
//     → 出目1スイッチを1個残せるならスイッチ同士 → クリマスの陰陽に出目1養分。陰陽のPUはしない
//   ロイヤル攻撃（ロイヤル対面版）：クリマスの陰陽の出目を上げる手を除いたロイヤルそろえ → 止まったら打つ
//   クリマス建て直し（ロイヤル対面版）：部品 critRebuild（ジョーカー→陰陽をコピー／スイッチ→ライン外の陰陽と入れ替え／プラン1・2の見積もり）。
//     打つ手がなければ（スイッチ待ちなど）ロイヤル対面版のロイヤル攻撃。W4以降、クリマスの陰陽が出目1なら出目2まで上げる
//   調和のあと：ウェーブごとの出目（W4〜5:2・W6:3・W7:4・W8〜:5）まで上げる。W5以降、自分の先頭の敵が2つ目の角（8.5）を越えたら、作れるならクリマスと同じ出目の養分を作って1つ上げる
// 変更：1.22.1　暗殺対面以外はすべて、制限を 判断0.5秒・操作（重ねる・召喚・ドラッグ）0.3秒 にする（これまではノーマル対面だけ）
// 変更：1.22.0　極の調和の出目上げが必要なのに、その手（養分を当てる・作る）が打てないとき：ロイヤルそろえを「養分をほかのダイスに与えない」形で行い、
//   それが止まったらロイヤルを打って（打つ条件・D・R に関係なく）また動かす（deficitArrange）。すべての対面（極の調和を使う対面）
//   出目上げが必要＝貫通の目標・W4〜の出目4（月太陽・ノーマル）・W7〜の出目5・月太陽の出目6 のどれかに届いていない
// 変更：1.21.0　月太陽対面・ノーマル対面：W4以降は、極の調和の出目4までの出目上げを最優先（調和ができた後のいちばん先。raise4From）
// 変更：1.20.1　「出目が目標に足りない間はジョーカーをすべて養分のコピー」の部分を消した（どの形でも月太陽AI戦で弱くなったため）
// 変更：1.20.0　極の調和の出目が目標（貫通の目標・W7以降の出目5）に足りないときは、養分を作れなくても止まらず、
//   目標に届くまでロイヤルそろえのジョーカーをすべて養分のコピーにする（ジョーカーは同じ出目の養分をコピーし、ロイヤルなどはコピーしない）。
//   月太陽対面：ロイヤル攻撃の下（ロイヤルそろえの前）で、極の調和の出目を6まで上げる。このウェーブのボスがナイトなら、調和ができた後の最優先で行う。
//   出目7（星）は目指さない（貫通の目標・ロイヤルそろえの出目上げも6まで。critMax）
// 変更：1.19.0　すべての対面（極の調和を使う対面）：W7以降は極の調和の出目を5まで上げる（同じ出目の養分を当てる／作る。raise5From）。
//   ロイヤルそろえで打つ手がなくなったら、ジョーカーで ロイヤル → 養分 → 陰陽 → スイッチ の順にコピー（クリマス・ラインの外）。
//   一度ロイヤルをコピーしたら、そのウェーブの間はジョーカーはロイヤルだけコピーする。
//   ノーマル対面（練習も）では、制限を 判断0.5秒・操作（重ねる・召喚・ドラッグ）0.3秒 にする（normalLimit）
// 変更：1.18.2　月太陽対面：極の調和ができたら陰陽を puLv（5）までPU（召喚より先）
// 変更：1.18.1　楽園マスにスイッチを置く手は、楽園スココン対面ではしない（paraSwitchOff）
// 変更：1.18.0　極の調和目指し通常：これまでの手がどれもないとき（いちばん後ろ）、どちらかの楽園マス（クリマス）のダイスが、
//   スイッチでも、縦か横が活性している陰陽でもなければ、同じ出目のスイッチを置く（スイッチはクリマス・ライン・楽園マスの外から）（paraSwitch）
// 変更：1.17.0　ロイヤル攻撃（ロイヤルそろえ → 止まったら打つ、をくり返す）を追加。
//   月太陽対面（相手にロイヤルがないとき）のモジュール（moonsun）：極の調和目指し → 建て直し → 貫通 → 詰み回避1 → ロイヤルそろえ。
//   打つ条件がそろっている間はロイヤル攻撃。W4〜5：相手の先頭が2つ目の角（8.5）を越えて太陽が活性／先頭が中央（6）を越えて残り30秒以上で太陽が活性／レオンの演出中。
//   W6以降：月太陽の隣接火力（月太陽_隣接火力倍率の式）の合計が出目6の月と出目6の太陽の組以上／出目7の月（月の星）がある／先頭が8.5を越えて太陽が活性。
//   ノーマル対面のナイトの後：クリマスが出目7の陰陽（星の陰陽）でなければ、もう一方の楽園マスに移す（これまでは陰陽でなければ）
// 変更：1.16.0　核対面・スココン対面（祝福・楽園）では、クリマスに2つの楽園マスのうちゴール（通路の出口。右下）に近いほうを選ぶ（critNearGoal）
// 変更：1.15.1　コンボ対面の「相手が楽園でW8以降、相手のクリマスに出目5以上のコンボ」を、相手の楽園マス（obs.opponent.fieldInfo.paradise。シミュレータ4.3.4〜）で見る。
//   相手の楽園マスは2つとも会心率が同じなので、どちらかのマスに出目5以上のコンボがあれば打つ。4.3.4より前（fieldInfo なし）は盤面全体で見る
// 変更：1.15.0　核対面：W4以降は陰陽をLv5までPU。ナイトの後、クリマスが出目6以上の陰陽でなければ、もう一方の楽園マス（元のラインの外）をクリマスにする。
//   コンボ対面（combo）を追加：核対面と同じ流れ（スイッチ絞りはW7まで）で、ロイヤルを打つ条件だけ違う。
//   祝福以外：相手の盤面のコンボが8個以上で、出目2以上のコンボと隣り合う出目2以上のスコープがある／楽園でW8以降、相手の盤面に出目5以上のコンボがある
//   （相手の楽園マスはAIから見えないので「クリマスに」を「盤面に」で代用）。祝福：コンボ13個以上で出目2以上のスコープがある／W6以降、出目2以上のスコープがある。
//   祝福スココン対面・楽園スココン対面もこのモジュールを使う
// 変更：1.14.0　核対面のモジュール（nuke）を追加：極の調和目指し → 貫通 → スイッチ絞り（W2〜6。W5以降のナイト前はしない）→ 詰み回避1（いつでも）
//   → ロイヤルそろえ（W4以降はラインの陰陽と同じ出目のスイッチを1個残す）。ロイヤルは相手の盤面の核が8個以上（祝福なら10個以上か出目2以上の地獄）で打つ。
//   崩れたら（レオン・ナイトなど）、空きマスがあれば召喚してからクリマス・ライン建て直し。陰陽のPUはしない
// 変更：1.13.0　戦術モジュール「スイッチ絞り」（switchThrottle）を追加。まだどの対面にも入れていない（matchupModules で試せる）
//   極の調和ができていたら、モンスターを倒さないようにして相手へ送る数を減らし、相手にSPを取らせない
//   W2・W3：ボス抽選中に、クリマスへ同じ出目の養分を置く（2手：スイッチ↔クリマスの陰陽、そのスイッチ↔養分）。置けなければクリマスにスイッチを入れて縦・横を切る
//   W4〜：ラインの陰陽をスイッチでずらして活性を切る
//   モンスターがゴールしそうなら（活性の陰陽のDPSとモンスターのHPから、余裕をもって倒せるうちに）一瞬活性させて倒し、すぐ切る。ウェーブ残り15秒からは活性を保つ
//   ボス・ボスの後は活性。切っている間は、ほかのモジュールは動かさない（陰陽のPU・ロイヤルを打つ・召喚だけ）
// 変更：1.12.0　ノーマル対面：極の調和ができたら陰陽をLv5までPU（召喚より先）。ロイヤルを打つのは、W6までは「ロイヤルそろえが止まったら」、
//   W7以降は、ウェーブ開始から12秒は打ち始めず、その後は陰陽ロイヤルAIの D・R と同じ判断（D≥0、相手の先頭が2つ目の角〔8.5〕を越えていない、
//   このウェーブでまだ打っていなければ R＞0 なら打たない）。練習（相手なし）では12秒の後はそのまま打つ
// 変更：1.11.0　ノーマル対面の立ち回り（ノーマル対面モジュール）を追加。部品モジュール（ranker_parts.js）を中に入れた
//   ノーマル対面：極の調和目指し通常 → 調和ができたら（上から順に）
//     a. 調和が崩れていれば建て直し：詰み回避で自分で崩したならライン建て直し。それ以外（ナイト・レオンなど）はクリマス建て直し → ライン建て直し
//        ナイトの後でクリマスのダイスが陰陽でなく、もう一方の楽園マスがいまのラインの外なら、そちらをクリマスにして建て直す
//     b. 貫通：調和の出目が5以下なら、ウェーブごとにそのウェーブの後のボスを貫通判断（PU5で見る）。足りなければ、調和と同じ出目の養分を作って当て、目標の出目まで上げる
//     c. 詰み回避レベル1（W6〜）：できればいつでもする
//     d. 通常ロイヤルそろえ
//     e. ロイヤルそろえが止まったら、ロイヤルを打つ（ライン外の同じ出目のロイヤル同士。高い出目から）。打った後はまたロイヤルそろえ
// 変更：1.10.0　対面を複数取れるようにした（条件が被るときは、より細かく指定している方を優先）
// 変更：1.9.0　動きを戦術モジュール（極の調和目指し通常・通常ロイヤルそろえ・暗殺対面）に分け、試合の最初に決めた対面で組み合わせるようにした（動きは1.8.0と同じ）
// 変更：1.8.0　極の調和になっているときの盤面の動かし方（調和の出目上げ・養分の貯め・高い出目の整理・ロイヤルのそろえ方）を追加。ロイヤルのペアはまだ打たない
// 変更：1.7.0　暗殺対面は極の調和を作らない立ち回り（暗殺対面モード）に切り替える
// 変更：1.6.0　暗殺対面で、スイッチが2個以上あれば片方をクリマス（か、もう一方の楽園マス）に置いて養分で出目2にし、暗殺避け用に残す手を追加（sw2Crit。既定は無効）。1.5.0の合成で避ける手は外した
// 変更：1.4.0　暗殺避けを全種類に：陰陽（ライン外も）・ロイヤルはスイッチがなければ養分を重ねる、スイッチは入れ替えて避ける
// 変更：1.3.0　暗殺避けに、養分・ジョーカーへの暗殺を追加（スイッチがないとき、養分は逃がす・ジョーカーはコピー）
// 変更：1.2.0　暗殺対面のときだけ、操作の制限（判断の間隔・操作の間隔・召喚の間隔・ドラッグ時間）をすべて0.1秒にする（AIの limits で上書き）
//
// ■ 暗殺避け（暗殺対面のとき、ほかのどの手より先）
//   1. 予告が来たダイス（着弾の近いものから。着弾までがドラッグ時間未満なら間に合わないのでしない）
//      陰陽・ロイヤル・養分・ジョーカー：同じ出目のスイッチがあれば、そのマスに重ねて入れ替える（ライン外のスイッチを優先）。スイッチがないとき：
//      陰陽・ロイヤル：懸賞金の印のない同じ出目の養分を重ねる（出目+1の新しいダイスになるので外れる）
//      スイッチ：同じ出目の別のダイスと入れ替える（クリマス・ラインの陰陽は動かさない）
//      養分：同じ出目のダイスに重ねて逃がす（クリマスのダイス → ロイヤル → 陰陽 → 養分 → ジョーカーの順。懸賞金の印がついたダイスには重ねない）
//      ジョーカー：同じ出目のダイスをコピーする（陰陽 → ロイヤル → 養分の順。コピーでジョーカーが別のダイスになるので暗殺は外れる）
//   1c. 出目2スイッチ（盤面が埋まる前から）：スイッチが2個以上あり、出目1の養分があれば、出目1のスイッチをクリマスに置き、養分で出目2にする。
//      クリマスの出目2スイッチは、暗殺避けで使うまでほかの手では動かさない（クリマスが陰陽のときはしない）
//   2. 予告のマスに関わる手（重ねる・重ねられる）は、着弾するまでしない（逃がした陰陽を戻してしまわないため）
//   3. 着弾した（予告が消えた）後、そのマスに入れたスイッチで、逃がした陰陽を引き込んで元に戻す
//
// ■ 暗殺対面モジュールの盤面（暗殺避けの次に。極の調和は作らない）
//   1. ジョーカー：盤面のスイッチが3個以下ならスイッチをコピー（出目1を優先）、それ以外は陰陽をコピー
//   2. どちらの楽園マス（クリマスともう一方）にもスイッチを置く
//   3. 楽園マスの出目1スイッチに養分を当てて出目2にする（ほかに出目1スイッチを1個以上残せるとき）
//   4. 縦活性：楽園マスを含まない縦一列（なければどの列でも）を陰陽でそろえる（陰陽3個以上。陰陽の多い列から）
//   5. 盤面が埋まっていなければ召喚
//   6. 盤面を空ける合成（楽園マスと縦活性の列の外）：出目1のスイッチが3個以上なら出目1のスイッチ同士 → 養分同士 → ロイヤル同士 → 縦活性の陰陽に養分
//   暗殺避けでは、楽園マスのスイッチを入れ替えに使わない。楽園マスのスイッチに予告が来たら、同じ出目の養分を重ねる（なければそのまま受ける）
//
// ■ 極の調和になっているとき（クリマスとラインの陰陽は、1 の養分を当てるほかは動かさない。ほかの手はすべてライン外どうし）
//   「出目nの養分が作れる」：出目nの養分がある／養分を同じ出目どうし合成すればできる／同じ出目のジョーカーで養分をコピーしてから合成すればできる
//   1. 調和の出目上げ：クリマスの陰陽と同じ出目の養分があれば当てる。出目−1の養分があれば、同じ出目のジョーカーでコピーするか相方と合成する
//   2. 養分の貯め：出目4以上のロイヤルがなく、「出目4以上のスイッチ・陰陽・ロイヤル」と「その出目−1の同じ種類」の組もないとき、
//      出目3以上の養分を同じ出目のジョーカーでコピーして合成しておく（高い出目のダイスをそろえるために養分を取っておく）
//   3. 出目4以上の養分があるとき：ジョーカーはすべて養分をコピー → ロイヤル同士 → 陰陽同士の合成 → 養分をコピーできないジョーカーはロイヤル → 陰陽をコピー → 養分同士の合成（出目上げ）
//   4. 出目4以上のロイヤル・陰陽・スイッチがあるとき：出目−2以上の同じ種類があれば、養分で出目をそろえて合成
//   5. どれでもないとき：
//      a. 同じ出目の陰陽同士・スイッチ同士を合成
//      b. ロイヤルのそろえ方（ペアはまだ打たない）
//         出目3のロイヤル：出目3のジョーカーでコピー／出目2のジョーカーがあり出目2の養分が作れるなら、養分でジョーカーを出目3にする
//         出目2のロイヤル：出目3のジョーカーがあり出目2の養分が作れるなら、ロイヤルを出目3に上げる／出目2のジョーカーでコピー
//         出目1のロイヤルと出目1の養分：ロイヤル2個以上→片方を出目2に（ジョーカーが2個以上残っていて養分が1個なら先に養分をコピー）／
//           ロイヤル1個・出目1のジョーカーなし→出目2に／ロイヤル1個・出目1のジョーカーあり→ロイヤルをコピー
//         （要点：ロイヤルより1つ高い出目（3以下）のジョーカーがあれば、その出目までロイヤルを上げる。その前に出目1のロイヤルの種を取る）
//      c. 養分（出目2以下）は、b で使わなければロイヤルに当てる → 宛先がなければ養分同士 → それもなければジョーカーに当てる
//   6. 盤面が埋まっていなければ召喚
//
// このAIは、極の調和のときのロイヤル攻撃（ロイヤルのペアを打つ判断）はまだしない
//
// ■ 盤面が埋まるまで（上から順に、できる手を1つ）
//   1. 出目1のジョーカーで陰陽をコピー（極の調和が完成するまで、すべて）
//   2. 陰陽7個以上：クリマスとラインに陰陽をそろえる（極の調和）
//   3. 陰陽5〜6個で、クリマスを含む横一列がダイスで埋まっている：横一列を陰陽でそろえる（横活性）
//   4. 陰陽3〜6個で、縦一列が埋まっている所がある：縦一列を陰陽でそろえる（縦活性。クリマスの列を優先、1列できたら終わり）
//   5. スイッチをクリマスの上に置く
//   6. 召喚
// ■ 盤面が一度埋まった後（上から順に）
//   1. 出目1のジョーカーで陰陽をコピー
//   2. 出目2陰陽の手（ライン外に出目2陰陽があり、ラインが出目1陰陽でそろい、クリマスが陰陽でないとき）：
//        クリマスの出目1スイッチに養分を当てて出目2へ（出目2スイッチがあれば、ペアのあるスイッチ・養分・ロイヤルをクリマスへ向けて合成）→ 出目2スイッチで出目2陰陽をクリマスへ
//      クリマスが出目1陰陽で、出目1陰陽が6個以上なら：ラインに陰陽をそろえ、ラインに残した出目1スイッチをクリマスへ（クリマスの陰陽がラインに入る）
//   3. クリマスに陰陽を置く
//   4. W1のボスがレオン：クリマスの縦一列を陰陽でそろえ、クリマスの陰陽に養分を当てて出目2に
//      それ以外：陰陽7個以上→極の調和、5〜6個→横活性、3〜4個→縦活性
//   5. W1のボスがナイト：ここで止める（合成しない）
//   6. 盤面を空ける合成（ライン外どうし）
//        a. 出目1のスイッチが3個以上なら、出目1のスイッチ同士
//        b. クリマスの陰陽と同じ出目の養分を、クリマスの陰陽へ
//        c. W2のボスがレオン：ラインの陰陽にも養分（クリマスが優先＝b が先）
//        d. クリマスの陰陽より低い出目の養分同士
//        e. ロイヤル同士
//   7. 召喚
// ■ 陰陽をそろえる手（2〜4 の中で使う）
//   a. そろえたいマスにあるスイッチで、外の同じ出目の陰陽を引き込む
//   b. そろえたいマスの別種（出目q）に、外のスイッチ（出目q）を置く（外に出目qの陰陽があるとき）
//   c. （盤面が埋まった後）スイッチの出目を養分で上げて、高い出目の陰陽を引き込む
//        そろえたいマスのスイッチ（出目q）に外の出目qの養分を当てる／そろえたいマスの別種（出目q）に外のスイッチ（出目q）を置く（出目qの養分があるとき）
//        使えるのは「そろっていない陰陽の数 − ライン外の出目2陰陽の数 ≤ 0」のとき。そうでなければ出目1スイッチを1つ残せるときだけ
// ランカー陰ロイAIの部品モジュール（ほかのモジュールから呼ぶ）
//   V（盤面の見え方）：{ b: obs.board, acts: obs.legal.acts（予告のマスなどを除いたもの）, protect: Map(マス → 守る度合い) }
//   守る度合い：0 または なし＝自由に使う ／ 1＝最後の手段（makeDie の 5）でだけ使う ／ 2 以上＝使わない
//   どの部品も「次の1手」（acts の要素）か、'done'（目標に届いている）か、null（打てる手がない）を返す。1手ごとに呼び直す
const PARTS = (() => {
  const ORDER5 = ['royal', 'nutrient', 'yinyang', 'switch', 'joker'];
  function helpers(V, lv) {
    const b = V.b, P = V.protect || new Map();
    const ok = i => (P.get(i) || 0) <= lv;                 // 度合い lv までのマスは使ってよい
    const is = (i, t) => b[i] && b[i].type === t;
    const cells = (t, p) => [...Array(15).keys()].filter(i => ok(i) && is(i, t) && (p == null || b[i].pips === p));
    const act = (f, t, res) => V.acts.find(x => x.from === f && x.to === t && (!res || x.result === res));
    const mergeOf = (t, p, skip) => { const cs = cells(t, p).filter(i => !(skip && skip(i))); for (let x = 0; x < cs.length; x++) for (let y = x + 1; y < cs.length; y++) { const a = act(cs[x], cs[y], 'merge') || act(cs[y], cs[x], 'merge'); if (a) return a; } return null; };
    return { b, ok, is, cells, act, mergeOf };
  }
  // 出目nの養分を作る：ある／同じ出目どうし合成すればできる／同じ出目のジョーカーでコピーしてから合成すればできる
  function makeNut(V, n, lv = 0) {
    const H = helpers(V, lv), N = p => H.cells('nutrient', p), J = p => H.cells('joker', p);
    if (N(n).length) return 'done';
    let missing = 1, low = null; const useJ = {};
    for (let p = n - 1; p >= 1; p--) {
      const c = N(p).length, j = c ? J(p).length : 0, want = missing * 2;
      if (c + j >= want) { useJ[p] = Math.max(0, want - c); low = p; break; }
      useJ[p] = j; missing = want - c - j;
    }
    if (low == null) return null;
    for (let p = low; p < n; p++) {
      if (useJ[p] > 0) { const n0 = N(p)[0]; for (const j of J(p)) { const x = H.act(j, n0, 'copy'); if (x) return x; } }
      if (N(p).length >= 2) { const x = H.mergeOf('nutrient', p); if (x) return x; }
    }
    return null;
  }
  // 種類Aの出目nのダイスを作る（want 個そろうまで）
  //   0. 出目nのAが want 個あれば完了
  //   1. 出目nのジョーカーがあり、出目nのAがあれば、ジョーカーでコピー
  //   2. X＝出目n未満で最大の出目のA（出目nのAがあるときは、出目n未満のジョーカーも候補。同じ出目ならAを優先）、その出目をp
  //   3. 出目pの養分が作れるなら、作ってXに当てる
  //   4. 作れないなら、ジョーカーで出目p以下の養分をコピー（高い出目から）→ X・ジョーカー・出目nのA以外の同じ種類どうしを、低い出目から合成
  //   5. それでもなければ、ジョーカーと同じ出目のダイス（A以外。ロイヤル→養分→陰陽→スイッチ→ジョーカーの順）をコピー（次の手で 4 が合成する）
  //   Aのダイスが1個もないときも 4・5 を打つ（p は n−1 とみなす）
  function makeDie(V, A, n, want = 1) {
    const H = helpers(V, 0), b = H.b;
    const allA = p => [...Array(15).keys()].filter(i => H.is(i, A) && b[i].pips === p);
    if (allA(n).length >= want) return 'done';
    const hasAn = allA(n).length > 0;
    let x;
    // 1
    if (hasAn) for (const j of H.cells('joker', n)) for (const t of allA(n)) if ((x = H.act(j, t, 'copy'))) return x;
    // 2
    const cand = [...H.cells(A).filter(i => b[i].pips < n), ...(hasAn ? H.cells('joker').filter(i => b[i].pips < n) : [])]
      .sort((p, q) => b[q].pips - b[p].pips || H.is(q, A) - H.is(p, A) || p - q);
    const X = cand.length ? cand[0] : null, p = X != null ? b[X].pips : n - 1;
    // 3
    if (X != null) {
      for (const n0 of H.cells('nutrient', p)) if (n0 !== X && (x = H.act(n0, X, 'feed'))) return x;
      const m = makeNut(V, p); if (m && m !== 'done') return m;
    }
    // 4
    for (const n0 of H.cells('nutrient').filter(i => b[i].pips <= p).sort((u, v) => b[v].pips - b[u].pips))
      for (const j of H.cells('joker', b[n0].pips)) if ((x = H.act(j, n0, 'copy'))) return x;
    const skip = i => i === X || (H.is(i, A) && b[i].pips >= n);
    for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) if ((x = H.mergeOf(t, q, skip))) return x;
    // 5（守る度合い1のマスも使う）
    const H1 = helpers(V, 1);
    for (const j of H1.cells('joker').filter(i => i !== X))
      for (const t of ORDER5) if (t !== A) for (const s of H1.cells(t, b[j].pips)) if (s !== j && (x = H1.act(j, s, 'copy'))) return x;
    return null;
  }
  // 行き先を作る（スイッチ・養分）：マスSのダイス（出目n）を、マスTのダイスに重ねられるようにして、重ねる
  //   スイッチ：Tと入れ替える ／ 養分：Tに当てる（Tが養分なら合成）／ ジョーカー：Tをコピーする
  //   Tのダイスの出目＝n：重ねる
  //   Tのダイスの出目＞n：Tのダイスと同じ種類・同じ出目のダイスを作り（makeDie）、Tのダイスをそこへ合成して逃がす（Tが空く）
  //   Tのダイスの出目＜n：Tのダイスと同じ種類・同じ出目のダイスを作り、Tに向かって合成する（Tの出目が1つ上がる。種類は変わる）
  //   Tが空：召喚で埋まるのを待つ（null）。SとTは makeDie の材料にしない
  function makeDest(V, S, T, kind) {
    const b = V.b;
    if (!b[S] || b[S].type !== kind) return null;
    if (S === T) return 'done';
    if (!b[T]) return null;
    const n = b[S].pips, m = b[T].pips, A = b[T].type;
    const P = new Map(V.protect || []); P.set(S, 9); P.set(T, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    if (m === n) return V.acts.find(x => x.from === S && x.to === T && (kind === 'switch' ? x.result === 'swap' : kind === 'joker' ? x.result === 'copy' : (x.result === 'feed' || x.result === 'merge'))) || null;
    const others = H.cells(A, m);                          // S・T以外の、同じ種類・同じ出目
    if (m > n) { for (const o of others) { const x = V.acts.find(z => z.from === T && z.to === o && z.result === 'merge'); if (x) return x; } }
    else { for (const o of others) { const x = V.acts.find(z => z.from === o && z.to === T && z.result === 'merge'); if (x) return x; } }
    const cnt = [...Array(15).keys()].filter(i => i !== S && b[i] && b[i].type === A && b[i].pips === m).length; // Tを含む
    const x = makeDie(V2, A, m, cnt + 1);
    return x && x !== 'done' ? x : null;
  }
  // スイッチの行き先を作る：出目nのスイッチ（マスS）を、マスTに動かせるようにして、動かす
  const switchDest = (V, S, T) => makeDest(V, S, T, 'switch');
  // 養分の行き先を作る：出目nの養分（マスS）を、マスTのダイスに当てられるようにして、当てる
  const nutDest = (V, S, T) => makeDest(V, S, T, 'nutrient');
  // ライン建て直し：ライン（クリマスの縦横6マス。クリマスは含めない）を陰陽でそろえる
  //   ラインの陰陽とクリマスには触らない。上から順に、最初に打てる手を返す
  //   1. スイッチで陰陽をラインに置けるなら置く
  //   1.5（1.26.0）陰陽をコピーできる（同じ出目の陰陽が盤面にある）ライン外のジョーカーを、ラインのスイッチで引き込む（次の手で2・3が陰陽をコピー）
  //       出目3以上のジョーカーは、ライン外に同じ出目の養分がないときだけ（あると3で養分をコピーしてしまうため）
  //   2. ラインの出目2以下のジョーカーは陰陽をコピー
  //   3. ラインの出目3以上のジョーカー：ライン外に同じ出目の養分があればコピー（次の手で8がその養分へ逃がす）、なければ陰陽をコピー
  //   4. ラインの出目n（2以上）のジョーカーで陰陽をコピーできないとき：ライン外に出目n−1の陰陽があれば、出目nの陰陽を作る（makeDie）
  //   5. なければ、ジョーカーと同じ出目のライン外のダイスをコピー（養分→ロイヤル→スイッチ。次の手で8が逃がす）
  //   6. なければ、ライン外で出目n未満のいちばん高い出目のダイスを、行き先を作る手順でコピー先にしてコピー
  //   7. ラインの出目1スイッチはライン外へ動かす（ライン外の出目1のダイスと入れ替え。ジョーカー→養分→ロイヤルの順）
  //   8. ラインのダイスを、ライン外の同じ種類・同じ出目のダイスへ合成して逃がす
  //   9. ライン外になければ、作ってから逃がす（makeDie）
  //   10. ライン外で同じ種類どうしを合成（低い出目から）
  function lineRebuild(V, lineCells, crit) {
    const b = V.b, L = new Set(lineCells);
    if (lineCells.every(i => b[i] && b[i].type === 'yinyang')) return 'done';
    const P = new Map(V.protect || []);
    for (const i of lineCells) if (b[i] && b[i].type === 'yinyang') P.set(i, 9);
    if (crit != null) P.set(crit, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    const offc = i => !L.has(i) && H.ok(i);              // ライン外で使ってよいマス
    const lineNot = lineCells.filter(i => b[i] && b[i].type !== 'yinyang');
    const find = (f, t, r) => V.acts.find(x => x.from === f && x.to === t && x.result === r);
    let x;
    // 1
    const offY = [...Array(15).keys()].filter(i => offc(i) && H.is(i, 'yinyang'));
    for (const t of lineNot) if (H.is(t, 'switch')) for (const q of offY) if ((x = find(t, q, 'swap'))) return x;
    for (const t of lineNot) if (!H.is(t, 'switch') && offY.some(q => b[q].pips === b[t].pips))
      for (let s2 = 0; s2 < 15; s2++) if (offc(s2) && H.is(s2, 'switch') && (x = find(s2, t, 'swap'))) return x;
    const allY = p => [...Array(15).keys()].filter(i => H.is(i, 'yinyang') && b[i].pips === p);
    const lj = lineNot.filter(i => H.is(i, 'joker'));
    // 1.5
    for (const t of lineNot) if (H.is(t, 'switch')) {
      const p = b[t].pips;
      if (!allY(p).length) continue;
      if (p >= 3 && [...Array(15).keys()].some(i => offc(i) && H.is(i, 'nutrient') && b[i].pips === p)) continue;
      for (const q of [...Array(15).keys()].filter(i => offc(i) && H.is(i, 'joker') && b[i].pips === p)) if ((x = find(t, q, 'swap'))) return x;
    }
    // 2
    for (const j of lj.filter(i => b[i].pips <= 2)) for (const y of allY(b[j].pips)) if ((x = find(j, y, 'copy'))) return x;
    // 3
    for (const j of lj.filter(i => b[i].pips >= 3)) {
      for (const n0 of [...Array(15).keys()].filter(i => offc(i) && H.is(i, 'nutrient') && b[i].pips === b[j].pips)) if ((x = find(j, n0, 'copy'))) return x;
      for (const y of allY(b[j].pips)) if ((x = find(j, y, 'copy'))) return x;
    }
    // 4〜6（陰陽をコピーできない出目2以上のジョーカー）
    for (const j of lj.filter(i => b[i].pips >= 2)) {
      const n = b[j].pips;
      if (allY(n).length) continue;
      if ([...Array(15).keys()].some(i => offc(i) && H.is(i, 'yinyang') && b[i].pips === n - 1)) {
        const Pj = new Map(P); Pj.set(j, 9);
        const m = makeDie(Object.assign({}, V, { protect: Pj }), 'yinyang', n, 1); if (m && m !== 'done') return m;
      }
      for (const t of ['nutrient', 'royal', 'switch']) for (const q of [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === n)) if ((x = find(j, q, 'copy'))) return x;
      const tq = [...Array(15).keys()].filter(i => offc(i) && b[i] && !H.is(i, 'joker') && b[i].pips < n).sort((u, v) => b[v].pips - b[u].pips || u - v)[0];
      if (tq != null) { const Pj = new Map(P); for (const i of lineCells) Pj.set(i, 9); const m = makeDest(Object.assign({}, V, { protect: Pj }), j, tq, 'joker'); if (m && m !== 'done') return m; }
    }
    // 7
    for (const s2 of lineNot.filter(i => H.is(i, 'switch') && b[i].pips === 1))
      for (const t of ['joker', 'nutrient', 'royal']) for (const q of [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === 1)) if ((x = find(s2, q, 'swap'))) return x;
    // 8
    for (const i of lineNot) for (const q of [...Array(15).keys()].filter(k => offc(k) && H.is(k, b[i].type) && b[k].pips === b[i].pips)) if ((x = find(i, q, 'merge'))) return x;
    // 9
    for (const i of lineNot) {
      if (H.is(i, 'joker')) continue;
      const Pi = new Map(P); for (const k of lineCells) Pi.set(k, 9);
      const cnt = [...Array(15).keys()].filter(k => b[k] && b[k].type === b[i].type && b[k].pips === b[i].pips).length;
      const m = makeDie(Object.assign({}, V, { protect: Pi }), b[i].type, b[i].pips, cnt + 1); if (m && m !== 'done') return m;
    }
    // 10
    for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) {
      const cs = [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === q);
      for (let u = 0; u < cs.length; u++) for (let v = u + 1; v < cs.length; v++) if ((x = find(cs[u], cs[v], 'merge'))) return x;
    }
    return null;
  }
  // 手数の見積もり（仮）：種類Aの出目nのダイスを1個作るのに要る手数
  //   すでにある：0 ／ 出目n未満のAがあれば、出目1つにつき「養分を当てる1手＋その養分を作る手数（ある0・作れる＝下の段の数×2・作れない4）」
  //   出目n未満のAがない：8（合成や召喚の運しだい）
  function estMake(V, A, n, exclude) {
    const H = helpers(V, 0), b = V.b;
    const has = (t, q) => H.cells(t, q).filter(i => !(exclude && exclude.includes(i))).length;
    if (has(A, n)) return 0;
    const ps = H.cells(A).filter(i => b[i].pips < n && !(exclude && exclude.includes(i))).map(i => b[i].pips);
    if (!ps.length) return 8;
    let c = 0;
    for (let l = Math.max(...ps); l < n; l++) {
      if (l === Math.max(...ps) ? has('nutrient', l) : false) { c += 1; continue; }
      const m = makeNut(V, l); c += 1 + (m === 'done' ? 0 : m ? 2 * l : 4);
    }
    return c;
  }
  // クリマス建て直し：クリマスを陰陽にする（ラインも直す）
  //   a. クリマスのジョーカー：陰陽をコピー
  //   b. クリマスのスイッチ：ライン外の同じ出目の陰陽と入れ替え（ライン外になければ、ラインの陰陽と入れ替えて、ラインは e で直す）
  //   c. それ以外（出目n）：手数の見積もりが少ない方
  //      プラン1：出目nのスイッチを作り（makeDie）クリマスと入れ替える → b（陰陽は makeDie で作る）
  //      プラン2：クリマスのダイスを外に逃がす（同じ種類・同じ出目のダイスを作って合成。養分なら行き先を作って当てる）→
  //              空いたクリマスは召喚で埋まる（出目1）→ 出目1スイッチが出るまでライン外で合成 → 出目1スイッチをクリマスへ → b
  //   d. クリマスが空：出目1スイッチが出るまでライン外で合成（盤面を空けて召喚を待つ）
  //   e. クリマスが陰陽になったら、ライン建て直し
  function critRebuild(V, crit, lineCells, opt) {
    const b = V.b, L = new Set(lineCells);
    const P = new Map(V.protect || []);
    for (const i of lineCells) if (b[i] && b[i].type === 'yinyang') P.set(i, 9);
    const V2 = Object.assign({}, V, { protect: P }), H = helpers(V2, 0);
    const offc = i => i !== crit && !L.has(i) && H.ok(i);
    const find = (f, t, r) => V.acts.find(x => x.from === f && x.to === t && x.result === r);
    const cells = f => [...Array(15).keys()].filter(f);
    let x;
    const c = b[crit];
    if (c && c.type === 'yinyang') { const r = lineRebuild(V, lineCells, crit); return r; }
    const offMerge0 = () => {                              // ライン外で同じ種類どうしの合成（低い出目から）
      for (let q = 1; q <= 6; q++) for (const t of ['royal', 'nutrient', 'yinyang', 'switch']) {
        const cs = cells(i => offc(i) && H.is(i, t) && b[i].pips === q);
        for (let u = 0; u < cs.length; u++) for (let v = u + 1; v < cs.length; v++) if ((x = find(cs[u], cs[v], 'merge'))) return x;
      }
      return null;
    };
    const offMerge = () => (opt && opt.noOffMerge) ? null : offMerge0();   // noOffMerge：ライン外の合成は呼ぶ側に任せる（null を返す）
    if (!c) return offMerge();                             // d
    const n = c.pips;
    const Pc = new Map(P); Pc.set(crit, 9); for (const i of lineCells) Pc.set(i, 9);
    const Vc = Object.assign({}, V, { protect: Pc });
    // a
    if (c.type === 'joker') { for (const y of cells(i => H.is(i, 'yinyang') && b[i].pips === n)) if ((x = find(crit, y, 'copy'))) return x; }
    // b
    if (c.type === 'switch') {
      for (const y of cells(i => offc(i) && H.is(i, 'yinyang') && b[i].pips === n)) if ((x = find(crit, y, 'swap'))) return x;
      for (const y of lineCells.filter(i => b[i] && b[i].type === 'yinyang' && b[i].pips === n)) if ((x = find(crit, y, 'swap'))) return x;
      const m = makeDie(Vc, 'yinyang', n, 1); return m && m !== 'done' ? m : offMerge();
    }
    // c：見積もり
    const p1 = estMake(Vc, 'switch', n) + estMake(Vc, 'yinyang', n) + 2;
    const escape = c.type === 'nutrient' ? 2 : estMake(Vc, c.type, n) + 1;
    const p2 = escape + 1 + (cells(i => offc(i) && H.is(i, 'switch') && b[i].pips === 1).length ? 0 : 3) + 2 + 1;
    if (c.type === 'joker' || p1 <= p2) {
      for (const s2 of cells(i => offc(i) && H.is(i, 'switch') && b[i].pips === n)) if ((x = find(s2, crit, 'swap'))) return x;
      const m = makeDie(Vc, 'switch', n, 1); if (m && m !== 'done') return m;
      return offMerge();
    }
    // プラン2：逃がす
    if (c.type === 'nutrient') {
      for (const t of cells(i => offc(i) && b[i] && b[i].pips === n && !H.is(i, 'yinyang'))) if ((x = V.acts.find(z => z.from === crit && z.to === t && (z.result === 'feed' || z.result === 'merge')))) return x;
      const t = cells(i => offc(i) && b[i] && !H.is(i, 'joker') && b[i].pips <= n).sort((u, v) => b[v].pips - b[u].pips || u - v)[0];
      if (t != null) { const m = makeDest(Vc, crit, t, 'nutrient'); if (m && m !== 'done') return m; }
      return offMerge();
    }
    for (const o of cells(i => offc(i) && H.is(i, c.type) && b[i].pips === n)) if ((x = find(crit, o, 'merge'))) return x;
    const m = makeDie(Vc, c.type, n, cells(i => i !== crit && H.is(i, c.type) && b[i].pips === n).length + 1); if (m && m !== 'done') return m;
    return offMerge();
  }
  // 詰み回避レベル1：ラインの陰陽（出目p）と同じ出目のライン外の陰陽、出目p+1のライン外のスイッチと陰陽があるとき、
  //   ライン外の陰陽をラインの陰陽へ合成する（ラインに出目p+1のダイスができる）。
  //   続きは ライン建て直し の1（出目p+1のスイッチをそのマスに置き、外の出目p+1の陰陽を引き込む）で直す
  //   返り値：{ act（合成の手）, cell（崩したラインのマス） } か null。候補が複数なら低い出目から
  function jamLv1(V, crit, lineCells) {
    const b = V.b, L = new Set(lineCells);
    const H = helpers(V, 0);
    const offc = i => i !== crit && !L.has(i) && H.ok(i);
    const off = (t, p) => [...Array(15).keys()].filter(i => offc(i) && H.is(i, t) && b[i].pips === p);
    const ls = lineCells.filter(i => H.is(i, 'yinyang')).sort((u, v) => b[u].pips - b[v].pips || u - v);
    for (const l of ls) {
      const p = b[l].pips;
      if (p >= 7 || !off('switch', p + 1).length || !off('yinyang', p + 1).length) continue;
      for (const y of off('yinyang', p)) { const x = V.acts.find(z => z.from === y && z.to === l && z.result === 'merge'); if (x) return { act: x, cell: l }; }
    }
    return null;
  }
  // 貫通判断：次のボス（ボスウェーブ中ならいまのボス）を、極の調和で貫通できるか
  //   貫通＝ボスの1回目のスキル（出現から2秒。HP表 6.5.0 系のデスウェーブ〔cfg.deathWave〜〕は cfg.deathBossFirst＝1.5秒）までに倒す
  //   必要DPS＝mult（既定1.5）×ボスHP÷その秒数。ボスHP＝8×（前のウェーブまでの基礎＋最後の湧きの段×1段の増加）。吸収する敵の分は入れない
  //   極の調和のDPS（クリマスの陰陽1個・出目p）＝a(1+V)·K·(1+H)·E·p²
  //     a＝50+10(c−7)+20(L−1)、V＝2.0+0.25(c−7)+0.30(L−1)、H＝1.2+0.2(c−7)+0.2(L−1)（c＝陰陽のクラス、L＝PU。既定は L＝5で見る）
  //     K＝10（陰陽6.0.5）／そろっている列の陰陽の数（陰陽6.5.0。十字なら7）、E＝(1−r)+r×会心ダメージ%/100（r＝基本会心率＋楽園マスの会心率）
  //   引数：obs・info（ctx.info）・crit（クリマス）・o（mult・lv〔見るPUのLv。null ならいまのLv〕・lineN）
  //   返り値：{ wave, need（必要な出目。届かなければ 8）, have（いまの調和の出目。調和でなければ 0）, ok, hp, time, dps1（出目1のDPS） }
  const PIERCE = (() => {
    const waveT = w => Math.max(100 - 10 * w, 60), waveDt = w => Math.max(12 - 2 * w, 2);
    const waveK = w => Math.floor(waveT(w) / waveDt(w)) + 1, steps = w => Math.ceil(waveT(w) / waveDt(w));
    const dHP = { '6.0.5': w => w === 1 ? 100 : 100 * (w - 1) * (w + 6), '6.5.0': w => w === 1 ? 100 : 20 * (w - 1) * (w + 4) * (w + 6) };
    const baseHP = (w, hp) => { let B = 0; for (let v = 1; v < w; v++) B += waveK(v) * dHP[hp](v); return B; };
    const bossHP = (w, hp) => 8 * (baseHP(w, hp) + steps(w) * dHP[hp](w));
    const dps1 = (yy, c, L, cd, r, K) => {
      const a = 50 + 10 * (c - 7) + 20 * (L - 1), V = 2.0 + 0.25 * (c - 7) + 0.30 * (L - 1), H = 1.2 + 0.2 * (c - 7) + 0.2 * (L - 1);
      return a * (1 + V) * K * (1 + H) * ((1 - r) + r * cd / 100);
    };
    return { bossHP, dps1 };
  })();
  function pierceJudge(obs, info, crit, o = {}) {
    const wave = obs.phase === 'boss' ? obs.wave : obs.wave + (obs.phase === 'wave' ? 0 : 1);
    const hp = (info.hpSpec || info.version) === '6.0.5' ? '6.0.5' : '6.5.0';
    const yd = (info.deck || []).find(d => d.type === 'yinyang') || {};
    const yy = yd.id === 'yinyang' ? '6.0.5' : '6.5.0';
    const lvNow = ((obs.deck || []).find(d => d.type === 'yinyang') || {}).lv || 1;
    const L = o.lv != null ? o.lv : lvNow, c = yd.cls || 10, cfg = info.cfg || {};
    const pc = ((obs.field && obs.field.paradise) || []).find(x => x.cell === crit);
    const r = Math.min(1, (info.baseCrit != null ? info.baseCrit : 0.05) + (pc ? pc.crit : 0));
    const st = obs.board[crit] && obs.board[crit].type === 'yinyang' ? (obs.board[crit].state || {}) : {};
    const K = yy === '6.0.5' ? 10 : (o.lineN || st.lineDice || 7);
    const time = (hp === '6.5.0' && wave >= (cfg.deathWave || 10)) ? (cfg.deathBossFirst != null ? cfg.deathBossFirst : 1.5) : 2;
    const bhp = PIERCE.bossHP(wave, hp), d1 = PIERCE.dps1(yy, c, L, cfg.cd || 2000, r, K);
    let need = Math.ceil(Math.sqrt((o.mult != null ? o.mult : 1.5) * bhp / time / d1) - 1e-9);
    need = Math.max(1, need > 7 ? 8 : need);
    const have = st.col && st.row ? obs.board[crit].pips : 0;
    return { wave, need, have, ok: have >= need, hp: bhp, time, dps1: d1 };
  }
  return { makeNut, makeDie, makeDest, switchDest, nutDest, lineRebuild, estMake, critRebuild, jamLv1, pierceJudge };
})();

// 月太陽の隣接火力倍率（claude/月太陽_隣接火力倍率の式.md）。出目1の太陽・月なし＝1。月は活性・Lv5、太陽は活性。T＝null は撃ち続ける時間→∞
const MOONSUN = (() => {
  const ramp = k => 1 + Math.floor(0.55 * (k - 1));
  const sumRamp = N => { let s = 0; for (let k = 1; k <= N; k++) s += ramp(k); return s; };
  function mult(c, m, cd, p, T = null, L = 5, base = 0.05) {
    const r = m > 0 ? Math.min(0.95, 1.03 * ((0.07 + 0.01 * (c - 7)) * m + 0.02 * (L - 1))) : 0;
    const cr = Math.min(1, base + 0.05 * m);
    const E = ((1 - cr) + cr * cd / 100) / ((1 - base) + base * cd / 100);
    const v = p / (1 - r);
    const keep = T == null ? v * v : sumRamp(Math.floor(2.5 * v * T + 1e-9) + 1) / sumRamp(Math.floor(2.5 * T + 1e-9) + 1);
    return keep * (1 + 0.10 * m) * E;
  }
  // 盤面（公開の盤面。マス番号順、空きは null）の太陽ごとに、隣の月で最も出目の高いものを使って合計
  function boardSum(board, NB, c, cd, T, base) {
    let sum = 0;
    board.forEach((d, i) => {
      if (!d || d.type !== 'sun') return;
      let m = 0; for (const j of NB[i]) if (board[j] && board[j].type === 'moon' && !board[j].sealed) m = Math.max(m, board[j].pips);
      sum += mult(c, m, cd, d.pips, T, 5, base);
    });
    return sum;
  }
  return { mult, boardSum };
})();

// 対面（想定する敵）と、そこで使うモジュール（上から順に試す）
const MODULE_NAMES = { harmony: '極の調和目指し通常', royalArrange: '通常ロイヤルそろえ', assassin: '暗殺対面', normal: 'ノーマル対面（調和→貫通→詰み回避1→ロイヤルそろえ→打つ・建て直し）', switchThrottle: 'スイッチ絞り', nuke: '核対面（調和→貫通→スイッチ絞り→詰み回避1→ロイヤルそろえ・核の数で打つ）', combo: 'コンボ対面（核対面と同じ流れ・コンボとスコープで打つ）', royalMatch: 'ロイヤル対面（調和→建て直し→出目上げ→ロイヤル攻撃）', moonsun: '月太陽対面（調和→貫通→詰み回避1→ロイヤルそろえ・条件でロイヤル攻撃）' };
const MATCHUPS = { // cond：相手のデッキに要るダイス（dice）と相手のスキン（field）
  assassin:           { name: '暗殺対面',         cond: { dice: ['assassin'] },                     modules: ['assassin'] },
  nuke:               { name: '核対面',           cond: { dice: ['nuke'] },                         modules: ['nuke'] },
  blessScopeCombo:    { name: '祝福スココン対面', cond: { dice: ['scope', 'combo'], field: 'blessing' }, modules: ['combo'] },
  paradiseScopeCombo: { name: '楽園スココン対面', cond: { dice: ['scope', 'combo'] },               modules: ['combo'] },
  combo:              { name: 'コンボ対面',       cond: { dice: ['combo'] },                        modules: ['combo'] },
  moonsun:            { name: '月太陽対面',       cond: { dice: ['moon', 'sun'] },                  modules: ['moonsun'] }, // 相手にロイヤルがあるときは moonsun は何もしない（ロイヤル対面のモジュールへ）
  // moonPower（月火力対面：月）は 1.24.1 で一旦外した → ノーマル対面になる
  royalMoonsun:       { name: '月太陽ロイヤル対面', cond: { dice: ['moon', 'sun', 'royal'] },        modules: ['royalMatch'] },
  royalYinyang:       { name: '陰陽ロイヤル対面', cond: { dice: ['yinyang', 'royal'] },             modules: ['royalMatch'] },
  royal:              { name: 'ノーマルロイヤル対面', cond: { dice: ['royal'] },                    modules: ['royalMatch'] },
  normal:             { name: 'ノーマル対面',     cond: null,                                       modules: ['normal'] },
};
// 条件をばらした項目（'dice:moon'・'field:blessing'）
const condItems = c => c ? [...c.dice.map(t => 'dice:' + t), ...(c.field ? ['field:' + c.field] : [])] : [];
RD.defineAgent('yinyang_royal_ranker', {
  name: 'ランカー陰ロイAI',
  desc: '陰陽ロイヤルの極の調和までの立ち回り（ランカーの手順）。盤面が埋まるまでに縦・横活性、埋まった後はライン外の合成で盤面を空けながら極の調和を作る。極の調和の後は召喚だけ。',
  options: {
    jokerAll: true,      // 完成するまで出目1ジョーカーはすべて陰陽をコピー（false なら 7−(出目1の陰陽＋空き×0.4)>0 のときだけ）
    jokerAfterFill: true,// 盤面が埋まった後もジョーカーで陰陽をコピー
    y2plan: true,        // 出目2陰陽の手
    raiseSwitch: true,   // スイッチの出目を養分で上げて陰陽を引き込む
    leonW2: true,        // W2のボスがレオンなら、ラインの陰陽にも養分
    assassinDodge: true, // 暗殺対面で、スイッチによる暗殺避けをする
    harmonyBoard: true,  // 極の調和のときの盤面の動かし方（false なら 1.7.0 までと同じく召喚だけ）
    pierce: true,        // ノーマル対面：貫通判断で調和の出目を上げる
    pierceMult: 1.5,     // 貫通判断の倍率
    jamFromWave: 6,      // ノーマル対面：詰み回避レベル1を使うウェーブ
    puLv: 5,             // ノーマル対面：極の調和ができたら陰陽をこのLvまでPU（0でしない）
    fireFromWave: 7,     // ノーマル対面：このウェーブから、ロイヤルを打つのに D・R の判断を使う
    fireSkipSec: 12,     // そのウェーブの開始からこの秒数は打ち始めない
    dWindow: 5,          // D：相手の先頭の位置の移動平均をとる秒数
    stopPastPos: 8.5,    // D：相手の先頭がこの位置を越えていたら打たない
    normalSpeed: 0.6,    // R：通常モンスターの速さ
    thrFromWave: 2,      // スイッチ絞り：このウェーブから
    thrCritUntil: 3,     // スイッチ絞り：このウェーブまではクリマスで切る（養分→スイッチ）。その後はラインの陰陽をずらす
    thrLastSec: 15,      // スイッチ絞り：ウェーブ残りこの秒数からは活性を保つ
    thrMult: 3,          // スイッチ絞り：倒すのにかかる秒（モンスターのHP÷活性のDPS）にかける余裕
    thrBuf: 5,           // スイッチ絞り：さらに足す余裕（秒）
    thrHyst: 1.5,        // スイッチ絞り：活性させた後、切り直すのはこの秒数だけ余裕が戻ってから
    thrMoveSec: 0.6,
    nukeFire: 8,         // 核対面：相手の盤面の核がこの数以上ならロイヤルを打つ（祝福以外）
    nukeFireBless: 10,   // 核対面：祝福のとき、相手の盤面の核がこの数以上なら打つ
    nukeHellPips: 2,     // 核対面：祝福のとき、相手の盤面にこの出目以上の地獄があれば打つ
    nukeThrUntil: 7,     // 核対面：このウェーブからはスイッチ絞りをしない
    nukeKnightFrom: 5,   // 核対面：このウェーブ以降、ボスがナイトのウェーブはスイッチ絞りをしない
    nukeKeepFrom: 4,
    nukePuFrom: 4,       // 核対面・コンボ対面：このウェーブから陰陽を puLv までPU
    nukeKnightKeep: 6,   // 核対面・コンボ対面：ナイトの後、クリマスがこの出目以上の陰陽でなければ、もう一方の楽園マスをクリマスにする（null でしない）
    comboFire: 8,        // コンボ対面（祝福以外）：相手の盤面のコンボがこの数以上（かつ出目2以上のコンボと隣り合う出目2以上のスコープがある）で打つ
    comboParadiseWave: 8,// コンボ対面（相手が楽園）：このウェーブ以降、相手の盤面に出目 comboParadisePips 以上のコンボがあれば打つ
    comboParadisePips: 5,
    comboFireBless: 13,  // コンボ対面（祝福）：コンボがこの数以上で、出目2以上のスコープがあれば打つ
    comboBlessScopeWave: 6, // コンボ対面（祝福）：このウェーブ以降、出目2以上のスコープがあれば打つ
    comboThrUntil: 8,
    msCorner: 8.5,       // 月太陽対面：「4角」（相手の先頭がこの位置を越えたら）
    msCenter: 6,         // 月太陽対面：中央
    msCenterLeft: 30,    // 月太陽対面：中央を越えたとき、ウェーブの残りがこの秒数以上なら打つ（W4〜5）
    msEarlyFrom: 4, msLateFrom: 6, // 月太陽対面：W4〜5 の条件／W6以降の条件
    msRefMoon: 6, msRefSun: 6,     // 月太陽対面（W6〜）：相手の月太陽の火力がこの出目の月と太陽の組以上なら打つ
    rmsSkipSec: 10,      // 月太陽ロイヤル対面：W4以降、ウェーブ開始からこの秒数は攻撃しない
    rmsLimitPos: 9.5,    // 月太陽ロイヤル対面：相手の先頭がこの位置（2つ目の角の先1マス）を越えていない間は攻撃
    msNewPlan: 0.5,      // 月太陽対面：新しい選択をする確率（試合の最初に1回決める。1＝いつも・0＝しない）
    msNewWaves: [5, 8, 10], // 新しい選択：ロイヤル攻撃をするウェーブ
    msNewStart: 45,      // 新しい選択：ウェーブの残りこの秒数から
    msNewEnd: 10,        // 新しい選択：残りこの秒数で、相手の先頭が中央を越えていなければ終了
    msT: null,           // 月太陽の火力の撃ち続ける秒（null＝長く撃つときの式）
    paraSwitch: true,    // 極の調和目指し通常：楽園マスにスイッチを置く手（いちばん後ろ）
    paraSwitchOff: ['paradiseScopeCombo'], // 楽園マスにスイッチを置く手をしない対面
    paraSwitchYY: false,
    raise5From: 7,       // すべての対面：このウェーブから極の調和の出目を raise5To まで上げる（null でしない）
    raise5To: 5,
    raise4From: 4,       // 月太陽対面・ノーマル対面：このウェーブから、極の調和の出目4までの出目上げを最優先（null でしない）
    deficitArrange: true, // 出目上げが必要で打てないとき、養分を与えないロイヤルそろえ → 止まったら打つ
    critMax: 6,          // 極の調和の出目は、出目上げでここまで（7＝星は目指さない）
    msRaise6: true,      // 月太陽対面：ロイヤル攻撃の下で出目6まで上げる（ボスがナイトなら最優先）
    stuckJoker: true,    // ロイヤルそろえで打つ手がないとき、ジョーカーで ロイヤル → 養分 → 陰陽 → スイッチ をコピー
    normalLimit: { interval: 0.5, actInterval: 0.3, summonInterval: 0.3, dragTime: 0.3 }, // 暗殺対面以外の制限（null でシミュレータの設定のまま）
    critNearGoal: ['nuke', 'blessScopeCombo', 'paradiseScopeCombo'], // この対面では、クリマスにゴールに近い楽園マスを選ぶ（ほかは入口に近いほう）
    thrPU: true,         // スイッチ絞り：切っている間も陰陽のPU（ノーマル対面と同じ puLv まで）
    thrFire: true,       // スイッチ絞り：切っている間もロイヤルを打つ（ノーマル対面と同じ判断）     // スイッチ絞り：1手にかかる秒（操作の間隔＋ドラッグ）
    knightOtherCrit: true, // ノーマル対面：ナイトの後、もう一方の楽園マスがラインの外ならそちらをクリマスにする
    matchup: null,       // 対面を決め打ちする（'normal'・'royal'・'moonsun'・'royalYinyang'・'royalMoonsun'・'blessScopeCombo'・'paradiseScopeCombo'・'nuke'・'assassin'、または配列）。null なら相手のデッキとスキンで決める
    matchupModules: null,// 対面ごとのモジュールの並びを上書きする（例 { assassin: ['assassin'] }）
    sw2Crit: false,      // 暗殺対面で、出目2スイッチを作って暗殺避け用に残す。true＝クリマスに、'other'＝もう一方の楽園マスに（ラインに入っていないとき）、false＝しない（検証でよくならなかったので既定はしない）
    dodgeOther: true,    // 養分・ジョーカーへの暗殺も避ける
    dodgeMinIn: null,    // 予告の着弾までがこの秒数未満なら暗殺避けをしない。null ならドラッグ時間（obs.control.dragTime）
    assassinLimit: 0.1,  // 暗殺対面のときの制限（判断の間隔・操作の間隔・召喚の間隔・ドラッグ時間、秒）。null ならしない
  },
  // 暗殺対面（相手のデッキに暗殺がある）のときだけ、制限をすべて assassinLimit 秒に
  // 暗殺対面は assassinLimit（0.1秒）。それ以外はすべて normalLimit（判断0.5秒・操作0.3秒）
  limits(options, info) {
    const od = (info.opponentDeck || []).map(d => d.type);
    const v = options.assassinLimit;
    const forced = options.matchup ? [].concat(options.matchup) : null;
    if (v != null && (forced ? forced.includes('assassin') : od.includes('assassin'))) return { interval: v, actInterval: v, summonInterval: v, dragTime: v };
    if (options.normalLimit) return Object.assign({}, options.normalLimit); // 暗殺対面以外はすべて
    return null;
  },
  create(ctx) {
    const o = ctx.options;
    // マスの位置（エンジンの COL_X・ROW_Y と同じ値）。敵の入口は左下
    const COL_X = [0.9, 1.7, 2.5, 3.3, 4.1], ROW_Y = [2.42, 1.62, 0.82];
    const dist = i => Math.hypot(COL_X[i % 5], ROW_Y[Math.floor(i / 5)]);
    const byDist = cs => [...cs].sort((a, b) => dist(a) - dist(b) || a - b);
    const distGoal = i => Math.hypot(5 - COL_X[i % 5], ROW_Y[Math.floor(i / 5)]); // ゴール（通路の出口 x=5, y=0）からの距離
    const byGoal = cs => [...cs].sort((a, b) => distGoal(a) - distGoal(b) || b - a);
    const rowOf = c => { const r = Math.floor(c / 5); return [0, 1, 2, 3, 4].map(k => r * 5 + k); };
    const colOf = c => [0, 1, 2].map(r => r * 5 + (c % 5));
    let crit = null, crit2 = null, filled = false;
    let everH = false, jamCell = null, pt = { wave: -1, need: 0 }, knightCast = null; // ノーマル対面
    let fHist = [], waveSeen = null, waveStartT = 0, firedWave = null;                // ロイヤルを打つ判断（D・R）
    let jkRoyalW = null;             // ロイヤルそろえの打つ手なし：ジョーカーでロイヤルをコピーしたウェーブ（そのウェーブはロイヤルだけコピー）
    let msNew = null, msNewEndW = null;   // 月太陽対面：新しい選択か（試合の最初に決める）・ロイヤル攻撃を終了したウェーブ
    let leonFiredW = null;           // 月太陽ロイヤル：レオンのボスでロイヤル攻撃を打ったウェーブ
    let thr = null, thrHot = false;  // スイッチ絞り：{ mode:'nut'|'sw'|'line', home（陰陽の元のマス）, yyId, swId, nutId }・活性させている途中
    const vsAssassin = (ctx.info.opponentDeck || []).some(d => d.type === 'assassin');
    let dodges = [];    // 暗殺避けで逃がした陰陽：{ cell（予告のマス）, yyId, swId }
    // ---------- 対面（試合の最初に、相手のデッキとスキンで決める） ----------
    let matchup = null, mods = [];
    function classify(obs) {
      const od = (ctx.info.opponentDeck || []).map(d => d.type);
      const field = obs.opponent && obs.opponent.field;
      const ok = c => c && c.dice.every(t => od.includes(t)) && (!c.field || c.field === field);
      let hit = Object.keys(MATCHUPS).filter(k => ok(MATCHUPS[k].cond));
      // 条件が被るとき（ほかの対面の条件をすべて含み、さらに細かい）は、細かい方だけ残す
      const items = k => condItems(MATCHUPS[k].cond);
      hit = hit.filter(k => !hit.some(k2 => k2 !== k && items(k).every(x => items(k2).includes(x)) && items(k2).length > items(k).length));
      return hit.length ? hit : ['normal'];
    }
    let seedJ2 = false; // 出目1ロイヤルの種取り：ジョーカーが2個以上・養分1個だったので、次に養分もコピーする
    return { decide(obs) {
      if (obs.call > 0 && obs.results.some(r => r.reason === 'limit')) return { ops: [] };
      const b = obs.board, ctl = obs.control || {};
      let needRaise = false, noFeed = false, noCritRaise = false; // 出目上げが必要（目標に届いていない）／ロイヤルそろえで養分をほかのダイスに与えない
      // 相手の先頭の位置の履歴（D・R）
      const oppV = obs.opponent, TLen = ctx.info.trackLength || 12;
      if (obs.wave !== waveSeen) { waveSeen = obs.wave; waveStartT = obs.t; fHist = []; }
      let Dv = null, Rv = null;
      if (oppV && obs.phase === 'wave' && oppV.phase === 'wave' && obs.timeLeft != null) {
        const pos = oppV.front ? oppV.front.progress * TLen : 0;
        fHist.push({ t: obs.t, pos });
        while (fHist.length && fHist[0].t < obs.t - o.dWindow) fHist.shift();
        if (fHist.length >= 2) {
          const h0 = fHist[0], h1 = fHist[fHist.length - 1], v = (h1.pos - h0.pos) / Math.max(1e-6, h1.t - h0.t);
          Dv = (TLen - pos) - obs.timeLeft * v; Rv = (TLen - pos) - obs.timeLeft * o.normalSpeed;
        }
      } else if (obs.phase !== 'wave') fHist = [];
      if (matchup == null) {
        matchup = o.matchup ? [].concat(o.matchup) : classify(obs);
        matchup.sort((x, y) => Object.keys(MATCHUPS).indexOf(x) - Object.keys(MATCHUPS).indexOf(y)); // 表の順
        mods = [];
        for (const k of matchup) for (const m of ((o.matchupModules && o.matchupModules[k]) || MATCHUPS[k].modules)) if (!mods.includes(m)) mods.push(m);
        ctx.log(`対面：${matchup.map(k => MATCHUPS[k].name).join('＋')}（モジュール：${mods.map(m => MODULE_NAMES[m] || m).join('・')}）`);
      }
      if (crit == null) {
        const pc = ((obs.field && obs.field.paradise) || []).map(p => p.cell);
        const nearGoal = pc.length > 1 && (o.critNearGoal || []).some(k => matchup.includes(k));
        const topRight = pc.length > 1 && ['royal', 'royalYinyang', 'royalMoonsun'].some(k => matchup.includes(k));           // ロイヤル対面：上に近い楽園マス（同じ高さなら右）
        const byTop = cs => [...cs].sort((a, b) => Math.floor(a / 5) - Math.floor(b / 5) || (b % 5) - (a % 5));
        const cs0 = (topRight ? byTop : nearGoal ? byGoal : byDist)(pc.length ? pc : [...Array(15).keys()]); crit = cs0[0]; crit2 = pc.length > 1 ? cs0[1] : null;
        ctx.log(`クリマス：${crit}${pc.length ? (nearGoal ? '（ゴールに近い楽園マス）' : '') : '（楽園でないので入口に最も近いマス）'}`);
      }
      const row = rowOf(crit), col = colOf(crit);
      const line = new Set([...row, ...col]);              // クリマス＋ライン
      const lineCells = [...line].filter(x => x !== crit); // ライン（6マス）
      const off = i => !line.has(i);                       // ライン外
      const is = (i, t) => b[i] && b[i].type === t;
      const cnt = t => b.filter(d => d && d.type === t).length;
      if (b.every(Boolean)) filled = true;
      const actReady = !ctl.dragging && !(ctl.actReadyIn > 0);
      // 相手の暗殺の予告が来ているマス。ここに関わる手は、暗殺避けのほかはしない
      const pendA = (obs.pending || []).filter(p => p.kind === 'assassin' && p.from === 'opponent');
      const pendCells = new Set(pendA.flatMap(p => p.cells));
      // 出目2スイッチを置くマス：'crit'＝クリマス、'other'＝もう一方の楽園マス（ラインに入っていなければ）
      const sw2At = o.sw2Crit === 'other' ? (crit2 != null && !line.has(crit2) ? crit2 : null) : crit;
      const lockCrit = o.sw2Crit && vsAssassin && sw2At != null && b[sw2At] && b[sw2At].type === 'switch' && b[sw2At].pips >= 2; // 出目2スイッチ（残す）
      const A = obs.legal.acts.filter(a => !pendCells.has(a.from) && !pendCells.has(a.to));
      const find = (f, t) => A.find(a => a.from === f && a.to === t);
      const act = (a, note) => ({ ops: [{ op: 'act', from: a.from, to: a.to, fromId: b[a.from].id, toId: b[a.to].id, expect: a.result }], more: true, note });
      const summon = () => (obs.legal.summon && !(ctl.summonReadyIn > 0)) ? { ops: [{ op: 'summon' }], more: true, note: '召喚' } : null;
      const yy = cnt('yinyang');
      const allYY = cs => cs.every(i => is(i, 'yinyang'));
      const sw1n = () => b.filter(d => d && d.type === 'switch' && d.pips === 1).length;

      // ---------- 暗殺対面モードの準備 ----------
      const amode = mods.includes('assassin');
      const paraCells = crit2 != null ? [crit, crit2] : [crit];
      let amCol = null;
      if (amode) {
        const cols = [0, 1, 2, 3, 4].map(colOf), np = cols.filter(cc => !cc.some(i => paraCells.includes(i)));
        const yN = cc => cc.filter(i => is(i, 'yinyang')).length;
        amCol = (np.length ? np : cols).slice().sort((p2, q2) => yN(q2) - yN(p2) || p2[0] - q2[0])[0];
      }
      // ---------- 暗殺避け（暗殺対面モジュールの前半） ----------
      function modAssassinDodge() {
      if (o.assassinDodge && actReady) {
        const minIn = o.dodgeMinIn != null ? o.dodgeMinIn : (ctl.dragTime || 0);
        const L = obs.legal.acts;
        const nm = t => ({ yinyang: '陰陽', royal: 'ロイヤル', switch: 'スイッチ', nutrient: '養分', joker: 'ジョーカー' })[t] || t;
        const free = t => !pendCells.has(t);
        // 同じ出目のスイッチ（ライン外を優先）
        const switches = (i, pp) => [...Array(15).keys()].filter(s => s !== i && is(s, 'switch') && b[s].pips === pp && free(s) && !(amode && paraCells.includes(s)))
          .sort((x, y) => line.has(x) - line.has(y) || x - y);
        // 着弾の近い予告から
        for (const p of [...pendA].sort((x, y) => x.in - y.in)) {
          if (p.in < minIn) continue;
          for (const i of p.cells) {
            const d = b[i]; if (!d) continue;
            const pp = d.pips, t0 = d.type;
            if (t0 === 'yinyang' || t0 === 'royal' || t0 === 'nutrient' || t0 === 'joker') {
              // a) 同じ出目のスイッチと入れ替える
              for (const s of switches(i, pp)) {
                const a = L.find(x => x.from === s && x.to === i && x.result === 'swap');
                if (!a) continue;
                if (t0 === 'yinyang' && (amode ? amCol.includes(i) : line.has(i))) dodges.push({ cell: i, yyId: d.id, swId: b[s].id }); // ラインの陰陽は着弾後に戻す
                return act(a, `暗殺避け：${i}の${nm(t0)}（出目${pp}）を${s}のスイッチと入れ替え`);
              }
            }
            if (t0 === 'yinyang' || t0 === 'royal') {
              // b) スイッチがないとき：懸賞金の印のない同じ出目の養分を重ねる（出目+1の新しいダイスになるので外れる）
              const a = L.filter(x => x.to === i && x.result === 'feed' && is(x.from, 'nutrient') && !(b[x.from].bounty > 0) && free(x.from))
                .sort((x, y) => line.has(x.from) - line.has(y.from) || x.from - y.from)[0];
              if (a) return act(a, `暗殺避け：${i}の${nm(t0)}（出目${pp}）に${a.from}の養分を重ねる`);
            } else if (t0 === 'switch' && amode && paraCells.includes(i)) {
              // 楽園マスのスイッチ：同じ出目の養分を重ねる（なければそのまま受ける）
              const a = L.filter(x => x.to === i && x.result === 'feed' && is(x.from, 'nutrient') && free(x.from))[0];
              if (a) return act(a, `暗殺避け：楽園マス${i}のスイッチ（出目${pp}）に${a.from}の養分を重ねる`);
            } else if (t0 === 'switch') {
              // スイッチ：同じ出目の別のダイスと入れ替えて避ける（クリマス・ラインの陰陽は動かさない。ライン外の陰陽以外を優先）
              const rank = t => line.has(t) ? 2 : is(t, 'yinyang') ? 1 : 0;
              const a = L.filter(x => x.from === i && x.result === 'swap' && free(x.to) && !(line.has(x.to) && is(x.to, 'yinyang')))
                .sort((x, y) => rank(x.to) - rank(y.to) || x.to - y.to)[0];
              if (a) return act(a, `暗殺避け：${i}のスイッチ（出目${pp}）を${a.to}の${nm(b[a.to].type)}と入れ替え`);
            } else if (o.dodgeOther && t0 === 'nutrient') {
              // 養分：同じ出目のダイスに重ねて逃がす（懸賞金の印つきは除く）
              const rank = t => t === crit ? 0 : ({ royal: 1, yinyang: 2, nutrient: 3, joker: 4 })[b[t].type] ?? 9;
              const ts = [...Array(15).keys()].filter(t => t !== i && b[t] && b[t].pips === pp && free(t) && !(b[t].bounty > 0) && rank(t) < 9)
                .sort((x, y) => rank(x) - rank(y) || line.has(y) - line.has(x) || x - y);
              for (const t of ts) { const a = L.find(x => x.from === i && x.to === t && (x.result === 'feed' || x.result === 'merge')); if (a) return act(a, `暗殺避け：${i}の養分を${t}へ逃がす`); }
            } else if (o.dodgeOther && t0 === 'joker') {
              // ジョーカー：同じ出目のダイスをコピー（コピーで別のダイスになるので外れる）
              const rank = t => ({ yinyang: 0, royal: 1, nutrient: 2 })[b[t].type] ?? 9;
              const ts = [...Array(15).keys()].filter(t => t !== i && b[t] && b[t].pips === pp && free(t) && rank(t) < 9).sort((x, y) => rank(x) - rank(y) || x - y);
              for (const t of ts) { const a = L.find(x => x.from === i && x.to === t && x.result === 'copy'); if (a) return act(a, `暗殺避け：${i}のジョーカーで${t}をコピー`); }
            }
          }
        }
        // 1c. クリマスに出目2スイッチを作る（スイッチ2個以上・出目1の養分があるとき）
        if (o.sw2Crit && sw2At != null && !lockCrit && !(allYY(row) && allYY(col))) {
          const nut1 = [...Array(15).keys()].filter(n => is(n, 'nutrient') && b[n].pips === 1 && free(n));
          if (cnt('switch') >= 2 && nut1.length) {
            if (is(sw2At, 'switch') && b[sw2At].pips === 1) {
              const a = L.find(x => nut1.includes(x.from) && x.to === sw2At && x.result === 'feed');
              if (a) return act(a, `暗殺対策：${sw2At}のスイッチに養分（出目2へ）`);
            } else if (b[sw2At] && !is(sw2At, 'switch') && !is(sw2At, 'yinyang') && b[sw2At].pips === 1 && free(sw2At)) {
              const a = switches(sw2At, 1).map(s2 => L.find(x => x.from === s2 && x.to === sw2At && x.result === 'swap')).find(Boolean);
              if (a) return act(a, `暗殺対策：${a.from}のスイッチを${sw2At}へ（出目2にする）`);
            }
          }
        }
        // 3. 着弾した後、逃がした陰陽を元のマスに戻す
        dodges = dodges.filter(d => b[d.cell] && b[d.cell].id === d.swId && b.some(x => x && x.id === d.yyId));
        for (const d of dodges) {
          if (pendCells.has(d.cell)) continue;
          const q = b.findIndex(x => x && x.id === d.yyId);
          const a = find(d.cell, q);
          if (a && a.result === 'swap') { dodges = dodges.filter(x => x !== d); return act(a, `暗殺避け：${q}の陰陽を${d.cell}に戻す`); }
        }
      }
      return null;
      }

      // targets を陰陽でそろえる（protect のマスからは持ち出さない）
      function fill(targets, protect, tag) {
        if (lockCrit) { targets = targets.filter(t => t !== sw2At); protect = [...(protect || []), sw2At]; }
        const T = new Set(targets), P = new Set(protect || []);
        const out = q => !T.has(q) && !P.has(q);
        const srcY = [...Array(15).keys()].filter(q => is(q, 'yinyang') && out(q));
        // a) target のスイッチで、外の同じ出目の陰陽を引き込む
        for (const t of targets) if (is(t, 'switch')) for (const q of srcY) { const a = find(t, q); if (a && a.result === 'swap') return act(a, `${tag}：引き込み ${q}→${t}`); }
        // b) target の別種に、外のスイッチを置く（同じ出目の陰陽が外にあるとき）
        const yp = new Set(srcY.map(q => b[q].pips));
        for (const t of targets) if (b[t] && !is(t, 'yinyang') && !is(t, 'switch') && yp.has(b[t].pips))
          for (let s = 0; s < 15; s++) if (out(s) && is(s, 'switch')) { const a = find(s, t); if (a && a.result === 'swap') return act(a, `${tag}：スイッチを置く ${s}→${t}`); }
        // c)（盤面が埋まった後）スイッチの出目を養分で上げて、高い出目の陰陽を引き込む
        if (filled && o.raiseSwitch && srcY.length) {
          const hi = q => srcY.some(y => b[y].pips > q);
          const nut = q => [...Array(15).keys()].find(n => out(n) && is(n, 'nutrient') && b[n].pips === q);
          const missN = [crit, ...lineCells].filter(i => !is(i, 'yinyang')).length;
          const y2n = [...Array(15).keys()].filter(i => off(i) && is(i, 'yinyang') && b[i].pips === 2).length;
          const okUse = uses1 => missN - y2n <= 0 || sw1n() - uses1 >= 1;
          for (const t of targets) if (is(t, 'switch') && b[t].pips < 7 && hi(b[t].pips) && okUse(b[t].pips === 1 ? 1 : 0)) {
            const n = nut(b[t].pips); if (n == null) continue;
            const a = find(n, t); if (a && a.result === 'feed') return act(a, `${tag}：スイッチ${t}に養分（出目${b[t].pips}→${b[t].pips + 1}）`);
          }
          for (const t of targets) if (b[t] && !is(t, 'yinyang') && !is(t, 'switch') && hi(b[t].pips) && nut(b[t].pips) != null)
            for (let s = 0; s < 15; s++) if (out(s) && is(s, 'switch') && okUse(b[s].pips === 1 ? 1 : 0)) {
              const a = find(s, t); if (a && a.result === 'swap') return act(a, `${tag}：スイッチを置く ${s}→${t}（養分で出目を上げる）`);
            }
        }
        return null;
      }
      const jokerCopy = () => {
        const y1 = b.filter(d => d && d.type === 'yinyang' && d.pips === 1).length, em = b.filter(d => !d).length;
        if (!o.jokerAll && 7 - (y1 + em * 0.4) <= 0) return null;
        const a = A.find(x => x.result === 'copy' && is(x.from, 'joker') && b[x.from].pips === 1 && is(x.to, 'yinyang'));
        return a ? act(a, 'ジョーカーで陰陽をコピー') : null;
      };

      // ---------- 暗殺対面モジュール ----------
      function modAssassin() { return modAssassinDodge() || assassinPlay(); }
      function assassinPlay() {
        const L = A, free = t => !pendCells.has(t);
        if (actReady) {
          let a, r;
          // 1. ジョーカー
          const jk = L.filter(x => x.result === 'copy' && is(x.from, 'joker'));
          if (cnt('switch') <= 3 && (a = jk.filter(x => is(x.to, 'switch')).sort((x, y) => b[x.from].pips - b[y.from].pips)[0])) return act(a, `暗殺対面：ジョーカー${a.from}でスイッチをコピー`);
          if ((a = jk.filter(x => is(x.to, 'yinyang'))[0])) return act(a, `暗殺対面：ジョーカー${a.from}で陰陽をコピー`);
          // 2. 楽園マスにスイッチ
          for (const c of paraCells) if (b[c] && !is(c, 'switch') && free(c)) {
            const ss = [...Array(15).keys()].filter(s2 => !paraCells.includes(s2) && is(s2, 'switch') && b[s2].pips === b[c].pips && free(s2)).sort((x, y) => amCol.includes(x) - amCol.includes(y) || x - y);
            for (const s2 of ss) { const x = find(s2, c); if (x && x.result === 'swap') return act(x, `暗殺対面：楽園マス${c}にスイッチを置く（${s2}から）`); }
          }
          // 3. 楽園マスの出目1スイッチを出目2に（ほかに出目1スイッチを1個以上残せるとき）
          for (const c of paraCells) if (is(c, 'switch') && b[c].pips === 1 && b.filter((d, k) => k !== c && d && d.type === 'switch' && d.pips === 1).length >= 1) {
            const x = L.find(z => z.to === c && z.result === 'feed' && is(z.from, 'nutrient'));
            if (x) return act(x, `暗殺対面：楽園マス${c}のスイッチに養分（出目2へ）`);
          }
          // 4. 縦活性
          if (yy >= 3 && !allYY(amCol) && (r = fill(amCol, paraCells, '暗殺対面：縦活性'))) return r;
          // 6. 盤面を空ける合成（楽園マスと縦活性の列の外）
          if (b.every(Boolean)) {
            const out = i => !paraCells.includes(i) && !amCol.includes(i);
            const mg = (t, c) => L.filter(x => x.result === 'merge' && is(x.from, t) && is(x.to, t) && out(x.from) && out(x.to) && (!c || c(x))).sort((p2, q2) => b[p2.from].pips - b[q2.from].pips)[0];
            if (sw1n() >= 3 && (a = mg('switch', x => b[x.from].pips === 1))) return act(a, '暗殺対面：出目1のスイッチ同士');
            if ((a = mg('nutrient'))) return act(a, '暗殺対面：養分同士');
            if ((a = mg('royal'))) return act(a, '暗殺対面：ロイヤル同士');
            if ((a = L.find(x => x.result === 'feed' && is(x.from, 'nutrient') && out(x.from) && amCol.includes(x.to) && is(x.to, 'yinyang')))) return act(a, '暗殺対面：縦活性の陰陽に養分');
          }
        }
        return summon() || { ops: [] };
      }
      let keepCell = null; // ロイヤルそろえで残すスイッチ（核対面）
      // 極の調和ができたら召喚だけ
      const harmonyNow = allYY(row) && allYY(col);
      // ---------- 通常ロイヤルそろえモジュール（極の調和になっているとき） ----------
      function modRoyalArrange() { return harmonyNow ? (raise5() || deficitArrange() || harmonyPlay()) : null; }
      // W7以降：極の調和の出目を raise5To まで上げる（同じ出目の養分を当てる。なければ作る）
      function raise5() {
        if (o.raise5From == null || obs.wave < o.raise5From) return null;
        return raiseTo(o.raise5To, `W${o.raise5From}〜の出目上げ`, true);
      }
      // 極の調和の出目を target まで上げる：同じ出目の養分を当てる → なければ作る。
      //   作れなければ、この手は打たずに次の手へ
      function raiseTo(target, why, deficit) {
        if (!harmonyNow) return null;
        const cp = b[crit].pips, tg = Math.min(o.critMax || 7, target); if (cp >= tg) return null;
        needRaise = true;
        if (!actReady) return null;
        for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
          const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `${why}：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${tg}）`);
        }
        const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
        const x = PARTS.makeNut(Vl, cp);
        return x && x !== 'done' ? act(x, `${why}：出目${cp}の養分を作る（目標${tg}）`) : null;
      }
      // ---------- 極の調和になっているとき ----------
      function harmonyPlay(stopNull) {
        if (!actReady) return summon() || { ops: [] };
        const H = i => line.has(i) || i === keepCell;     // クリマス＋ライン（動かさない）・残すスイッチ
        const cellsOf = (t, p) => [...Array(15).keys()].filter(i => !H(i) && is(i, t) && (p == null || b[i].pips === p));
        const N = p => cellsOf('nutrient', p), J = p => cellsOf('joker', p);
        const mergeOf = (t, p) => { const cs = cellsOf(t, p); for (let x = 0; x < cs.length; x++) for (let y = x + 1; y < cs.length; y++) { const a = find(cs[x], cs[y]); if (a && a.result === 'merge') return a; } return null; };
        const copyOf = (j, t) => A.find(x => x.from === j && x.result === 'copy' && !H(x.to) && is(x.to, t));
        const feedTo = (n, to) => (noFeed && to !== crit) || (noCritRaise && to === crit) ? null : A.find(x => x.from === n && x.to === to && x.result === 'feed'); // noFeed：クリマスの陰陽にだけ与える
        const tag = s2 => `調和：${s2}`;
        let a;
        // 出目nの養分を作る次の一手（作れなければ null、すでにあれば 'have'）
        function makeNut(n) {
          if (N(n).length) return 'have';
          let missing = 1, low = null; const useJ = {};
          for (let p = n - 1; p >= 1; p--) {          // 上の段から：足りない数×2 を下の段で用意する
            const c = N(p).length, j = c ? J(p).length : 0, want = missing * 2;
            if (c + j >= want) { useJ[p] = Math.max(0, want - c); low = p; break; }
            useJ[p] = j; missing = want - c - j;
          }
          if (low == null) return null;
          for (let p = low; p < n; p++) {              // 下の段から：ジョーカーでコピー → 合成
            if (useJ[p] > 0) { const n0 = N(p)[0]; for (const j of J(p)) { const x = A.find(z => z.from === j && z.to === n0 && z.result === 'copy'); if (x) return x; } }
            if (N(p).length >= 2) { const x = mergeOf('nutrient', p); if (x) return x; }
          }
          return null;
        }
        // 1. 調和の出目上げ（critMax まで）
        const cp = b[crit] ? b[crit].pips : 0; // 建て直し中はクリマスが空のこともある
        if (!noCritRaise && cp < (o.critMax || 7)) {
          for (const n0 of N(cp)) { const x = feedTo(n0, crit); if (x) return act(x, tag(`クリマスの陰陽に養分（出目${cp}→${cp + 1}）`)); }
          if (cp >= 2 && N(cp - 1).length) {
            for (const j of J(cp - 1)) { const x = A.find(z => z.from === j && z.to === N(cp - 1)[0] && z.result === 'copy'); if (x) return act(x, tag(`ジョーカーで出目${cp - 1}の養分をコピー（調和の出目上げ）`)); }
            if ((a = mergeOf('nutrient', cp - 1))) return act(a, tag(`出目${cp - 1}の養分同士（調和の出目上げ）`));
          }
        }
        const T3 = ['switch', 'yinyang', 'royal'];
        const hiPair = T3.some(t => cellsOf(t).some(i => b[i].pips >= 4 && cellsOf(t, b[i].pips - 1).length));
        // 2. 養分の貯め
        if (!cellsOf('royal').some(i => b[i].pips >= 4) && !hiPair) {
          for (const n0 of N().filter(i => b[i].pips >= 3).sort((x, y) => b[y].pips - b[x].pips)) {
            const p = b[n0].pips;
            if (N(p).length >= 2 && (a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士（貯め）`));
            for (const j of J(p)) { const x = A.find(z => z.from === j && z.to === n0 && z.result === 'copy'); if (x) return act(x, tag(`ジョーカーで出目${p}の養分をコピー（貯め）`)); }
          }
        }
        // 3. 出目4以上の養分があるとき
        if (N().some(i => b[i].pips >= 4)) {
          for (const j of J()) { const x = copyOf(j, 'nutrient'); if (x) return act(x, tag('ジョーカーで養分をコピー')); }
          for (const t of ['royal', 'yinyang']) for (let p = 1; p <= 6; p++) if ((a = mergeOf(t, p))) return act(a, tag(`${t === 'royal' ? 'ロイヤル' : '陰陽'}同士（出目${p}）`));
          for (const t of ['royal', 'yinyang']) for (const j of J()) { const x = copyOf(j, t); if (x) return act(x, tag(`ジョーカーで${t === 'royal' ? 'ロイヤル' : '陰陽'}をコピー`)); }
          for (let p = 1; p <= 6; p++) if ((a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士（出目上げ）`));
        }
        // 4. 出目4以上のロイヤル・陰陽・スイッチを、養分でそろえて合成
        for (const t of T3) for (const X of cellsOf(t).filter(i => b[i].pips >= 4).sort((x, y) => b[y].pips - b[x].pips)) {
          const px = b[X].pips;
          if ((a = mergeOf(t, px))) return act(a, tag(`出目${px}の${t}同士`));
          for (const Y of cellsOf(t).filter(i => i !== X && b[i].pips < px && b[i].pips >= px - 2)) {
            const py = b[Y].pips;
            for (const n0 of N(py)) { const x = feedTo(n0, Y); if (x) return act(x, tag(`出目${py}の${t}に養分（出目${px}にそろえる）`)); }
            const m = noFeed ? null : makeNut(py); if (m && m !== 'have') return act(m, tag(`出目${py}の養分を作る（${t}をそろえる）`));
          }
        }
        // 5a. 同じ出目の陰陽同士・スイッチ同士
        for (const t of ['yinyang', 'switch']) for (let p = 1; p <= 6; p++) if ((a = mergeOf(t, p))) return act(a, tag(`出目${p}の${t === 'yinyang' ? '陰陽' : 'スイッチ'}同士`));
        // 5b. ロイヤルのそろえ方（ペアは打たない）
        const R = p => cellsOf('royal', p);
        if (R(3).length) {
          for (const j of J(3)) { const x = copyOf(j, 'royal'); if (x && b[x.to].pips === 3) return act(x, tag('出目3のジョーカーで出目3のロイヤルをコピー')); }
          if (J(2).length) {
            for (const n0 of N(2)) { const x = feedTo(n0, J(2)[0]); if (x) return act(x, tag('出目2のジョーカーに養分（出目3にしてロイヤルをコピー）')); }
            const m = noFeed ? null : makeNut(2); if (m && m !== 'have') return act(m, tag('出目2の養分を作る（ジョーカーを出目3に）'));
          }
        }
        if (R(2).length) {
          if (J(3).length) {
            for (const n0 of N(2)) { const x = feedTo(n0, R(2)[0]); if (x) return act(x, tag('出目2のロイヤルに養分（出目3にしてジョーカーでコピー）')); }
            const m = noFeed ? null : makeNut(2); if (m && m !== 'have') return act(m, tag('出目2の養分を作る（ロイヤルを出目3に）'));
          }
          for (const j of J(2)) { const x = copyOf(j, 'royal'); if (x && b[x.to].pips === 2) return act(x, tag('出目2のジョーカーで出目2のロイヤルをコピー')); }
        }
        if (R(1).length && N(1).length) {
          const r1 = R(1).length, j1 = J(1).length, n1 = N(1).length;
          if (r1 >= 2) {
            if (j1 >= 1 && n1 === 1 && seedJ2) { const x = copyOf(J(1)[0], 'nutrient'); if (x && b[x.to].pips === 1) { seedJ2 = false; return act(x, tag('出目1のジョーカーで養分をコピー')); } }
            const x = feedTo(N(1)[0], R(1)[0]); if (x) return act(x, tag('出目1のロイヤルの片方に養分（出目2へ）'));
          } else if (j1 === 0) {
            const x = feedTo(N(1)[0], R(1)[0]); if (x) return act(x, tag('出目1のロイヤルに養分（出目2へ）'));
          } else {
            seedJ2 = j1 >= 2 && n1 === 1;
            const x = copyOf(J(1)[0], 'royal'); if (x && b[x.to].pips === 1) return act(x, tag('出目1のジョーカーで出目1のロイヤルをコピー（種）'));
          }
        }
        // 5c. 養分（出目2以下）：ロイヤル → 養分同士 → ジョーカー
        for (const n0 of N().filter(i => b[i].pips <= 2)) {
          const p = b[n0].pips;
          for (const r0 of R(p)) { const x = feedTo(n0, r0); if (x) return act(x, tag(`出目${p}の養分をロイヤルに`)); }
        }
        for (let p = 1; p <= 6; p++) if ((a = mergeOf('nutrient', p))) return act(a, tag(`出目${p}の養分同士`));
        for (const n0 of N().filter(i => b[i].pips <= 2)) for (const j of J(b[n0].pips)) { const x = feedTo(n0, j); if (x) return act(x, tag(`出目${b[n0].pips}の養分をジョーカーに`)); }
        // 6. 打つ手がないとき：ジョーカーで ロイヤル → 養分 → 陰陽 → スイッチ をコピー（一度ロイヤルをコピーしたら、そのウェーブはロイヤルだけ）
        if (o.stuckJoker) {
          const NM = { royal: 'ロイヤル', nutrient: '養分', yinyang: '陰陽', switch: 'スイッチ' };
          for (const t of (jkRoyalW === obs.wave ? ['royal'] : ['royal', 'nutrient', 'yinyang', 'switch']))
            for (const j of J()) { const x = copyOf(j, t); if (x) { if (t === 'royal') jkRoyalW = obs.wave; return act(x, tag(`打つ手なし：ジョーカー${j}で出目${b[j].pips}の${NM[t]}をコピー`)); } }
        }
        return stopNull ? null : (summon() || { ops: [] });
      }

      // ---------- 極の調和目指し通常モジュール（極の調和になっていないとき） ----------
      // 楽園マス（どちらのクリマスも）のダイスが、スイッチでも縦・横が活性している陰陽でもなければ、同じ出目のスイッチを置く
      function paraSwitch() {
        if (!o.paraSwitch || !actReady || (o.paraSwitchOff || []).some(k => matchup.includes(k))) return null;
        for (const c of paraCells) {
          const d = b[c];
          if (!d || d.type === 'switch' || pendCells.has(c)) continue;
          if (d.type === 'yinyang' && (!o.paraSwitchYY || (d.state && (d.state.col || d.state.row)))) continue; // 陰陽は動かさない（paraSwitchYY で、活性していない陰陽も置き換える）
          for (let s = 0; s < 15; s++) {
            if (s === c || !is(s, 'switch') || line.has(s) || paraCells.includes(s) || pendCells.has(s) || b[s].pips !== d.pips) continue;
            const a = find(s, c); if (a && a.result === 'swap') return act(a, `楽園マス${c}にスイッチを置く（${s}から）`);
          }
        }
        return null;
      }
      function modHarmony() {
      if (harmonyNow) return null;
      // ---------- 盤面が埋まるまで ----------
      if (!filled) {
        if (actReady) {
          let r;
          if ((r = jokerCopy())) return r;
          if (yy >= 7 && (r = fill([crit, ...lineCells], [], '極の調和'))) return r;
          if (yy >= 5 && yy < 7 && row.every(i => b[i]) && !allYY(row) && (r = fill(row, [], '横活性'))) return r;
          if (yy >= 3 && yy < 7 && ![0, 1, 2, 3, 4].some(c => allYY(colOf(c)))) {
            const cs = [0, 1, 2, 3, 4].map(colOf).filter(cc => cc.every(i => b[i]))
              .sort((p, q) => (q.includes(crit) - p.includes(crit)) || q.filter(i => is(i, 'yinyang')).length - p.filter(i => is(i, 'yinyang')).length);
            if (cs.length && (r = fill(cs[0], allYY(row) ? row : [], '縦活性'))) return r;
          }
          if (b[crit] && !is(crit, 'switch') && !is(crit, 'yinyang'))
            for (let s = 0; s < 15; s++) if (s !== crit && is(s, 'switch')) { const a = find(s, crit); if (a && a.result === 'swap') return act(a, 'スイッチをクリマスへ'); }
          if ((r = paraSwitch())) return r;
        }
        return summon() || { ops: [] };
      }

      // ---------- 盤面が一度埋まった後 ----------
      if (!actReady) return summon() || { ops: [] };
      let r, a;
      const knightStop = obs.wave === 1 && obs.bossType === 'knight';
      if (o.jokerAfterFill && (r = jokerCopy())) return r;

      // 出目2陰陽の手
      const RM = mods.includes('royalMatch'); // ロイヤル対面版：陰陽を出目2に上げる手はしない
      if (o.y2plan && !knightStop && !RM) {
        const y2off = [...Array(15).keys()].filter(i => off(i) && is(i, 'yinyang') && b[i].pips === 2);
        const lineY1 = lineCells.every(i => is(i, 'yinyang') && b[i].pips === 1);
        const sw2 = b.some(d => d && d.type === 'switch' && d.pips === 2);
        if (y2off.length && lineY1 && !is(crit, 'yinyang')) {
          const c = b[crit];
          if (c && c.pips === 1 && c.type === 'switch') {
            if (!sw2) {
              if ((a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient')))) return act(a, '出目2陰陽：クリマスのスイッチに養分');
            } else {
              if ((a = A.find(x => x.result === 'merge' && x.to === crit && is(x.from, 'switch') && off(x.from)))) return act(a, '出目2陰陽：スイッチをクリマスへ合成');
              for (const t of ['nutrient', 'royal']) {
                const ps = [...Array(15).keys()].filter(i => off(i) && is(i, t) && b[i].pips === 1);
                if (ps.length >= 2 && (a = find(crit, ps[0])) && a.result === 'swap') return act(a, `出目2陰陽：クリマスのスイッチと${t === 'royal' ? 'ロイヤル' : '養分'}を入れ替え`);
              }
            }
          }
          if (c && c.pips === 1 && (is(crit, 'nutrient') || is(crit, 'royal'))
              && (a = A.find(x => x.result === 'merge' && x.to === crit && off(x.from)))) return act(a, '出目2陰陽：クリマスへ向けて合成');
          if (c && c.pips === 2 && (r = fill([crit], [], '出目2陰陽：クリマスに出目2陰陽'))) return r;
        }
        if (y2off.length && is(crit, 'yinyang') && b[crit].pips === 1 && b.filter(d => d && d.type === 'yinyang' && d.pips === 1).length >= 6) {
          const pairOk = sw2 ? (sw1n() >= 2 || ['nutrient', 'royal'].some(t => [...Array(15).keys()].filter(i => off(i) && is(i, t) && b[i].pips === 1).length >= 2))
            : b.some(d => d && d.type === 'nutrient' && d.pips === 1);
          if (sw1n() >= 1 && pairOk) {
            const miss = lineCells.filter(i => !(is(i, 'yinyang') && b[i].pips === 1));
            if (miss.length === 1 && is(miss[0], 'switch') && b[miss[0]].pips === 1 && (a = find(miss[0], crit)) && a.result === 'swap')
              return act(a, '出目2陰陽：ラインのスイッチをクリマスへ（陰陽をラインへ）');
            const keepS = miss.find(i => is(i, 'switch') && b[i].pips === 1);
            if (keepS != null) {
              const rest = miss.filter(i => i !== keepS);
              if ((r = fill(rest, [crit, keepS, ...lineCells.filter(i => !rest.includes(i))], '出目2陰陽：ラインに陰陽'))) return r;
            } else {
              for (const t of miss) if (b[t] && !is(t, 'switch') && b[t].pips === 1)
                for (let q = 0; q < 15; q++) if (off(q) && is(q, 'switch') && b[q].pips === 1) { const x = find(q, t); if (x && x.result === 'swap') return act(x, '出目2陰陽：ラインにスイッチを置く'); }
              if ((r = fill(miss, [crit], '出目2陰陽：ラインに陰陽'))) return r;
            }
          }
        }
      }

      // クリマスに陰陽
      if (!is(crit, 'yinyang') && (r = fill([crit], [], 'クリマスに陰陽'))) return r;
      if (obs.wave === 1 && obs.bossType === 'leon') {
        // W1のボスがレオン：縦活性にしてクリマスの陰陽を出目2へ
        if (!allYY(col) && (r = fill(col, [crit], 'レオン：縦活性'))) return r;
        if (!RM && is(crit, 'yinyang') && b[crit].pips < 2 && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient')))) return act(a, 'レオン：クリマスの陰陽を出目2へ');
      } else {
        if (yy >= 7 && (r = fill([crit, ...lineCells], [], '極の調和'))) return r;
        if (yy >= 5 && yy < 7 && !allYY(row) && (r = fill(row, allYY(col) ? col : [crit], '横活性'))) return r;
        if (yy >= 3 && yy < 5 && !allYY(row) && !allYY(col) && (r = fill(col, [crit], '縦活性'))) return r;
      }
      if (knightStop) return summon() || { ops: [] }; // W1のボスがナイト：合成しない

      // 盤面を空ける合成（ライン外どうし）
      const cp = is(crit, 'yinyang') ? b[crit].pips : 0;
      const mg = (t, c) => A.filter(x => x.result === 'merge' && is(x.from, t) && is(x.to, t) && off(x.from) && off(x.to) && (!c || c(x)))
        .sort((p, q) => b[p.from].pips - b[q.from].pips)[0];
      if (RM) {
        // ロイヤル対面版の「盤面を空ける合成」
        const n1 = [...Array(15).keys()].filter(i => off(i) && is(i, 'nutrient') && b[i].pips === 1).length;
        if ((a = A.filter(x => x.result === 'feed' && is(x.from, 'nutrient') && off(x.from) && is(x.to, 'royal') && off(x.to) && (b[x.from].pips > 1 || n1 >= 2))
          .sort((p, q) => b[p.from].pips - b[q.from].pips)[0])) return act(a, '出目1養分を1個残してロイヤルに養分');
        if ((a = mg('nutrient'))) return act(a, '養分同士');
        if ((a = mg('royal', x => b[x.from].pips === 1))) return act(a, '出目1ロイヤル同士');
        if ((a = mg('royal', x => b[x.from].pips === 2))) return act(a, '出目2ロイヤル同士');
        if ((a = mg('switch', x => b[x.from].pips !== 1 ? sw1n() >= 1 : sw1n() >= 3))) return act(a, 'スイッチ同士（出目1スイッチを1個残す）');
        if (is(crit, 'yinyang') && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient') && off(x.from) && b[x.from].pips === 1))) return act(a, 'クリマスの陰陽に出目1養分');
        return summon() || { ops: [] };
      }
      if (sw1n() >= 3 && (a = mg('switch', x => b[x.from].pips === 1))) return act(a, '出目1のスイッチ同士');
      if (cp && (a = A.find(x => x.result === 'feed' && x.to === crit && is(x.from, 'nutrient') && off(x.from)))) return act(a, `養分をクリマスの陰陽へ（出目${cp}→${cp + 1}）`);
      if (o.leonW2 && !RM && obs.wave === 2 && obs.bossType === 'leon'
          && (a = A.find(x => x.result === 'feed' && is(x.from, 'nutrient') && off(x.from) && lineCells.includes(x.to) && is(x.to, 'yinyang')))) return act(a, 'W2レオン：ラインの陰陽に養分');
      if ((a = mg('nutrient', x => b[x.from].pips < cp))) return act(a, '養分同士');
      if ((a = mg('royal'))) return act(a, 'ロイヤル同士');
      if ((r = paraSwitch())) return r;
      return summon() || { ops: [] };
      }
      // ---------- ノーマル対面モジュール ----------
      function modNormal() {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        { let x4; if (o.raise4From != null && obs.wave >= o.raise4From && (x4 = raiseTo(4, `W${o.raise4From}〜：調和の出目4を最優先`, false))) return x4; }
        let x = puStep(); if (x) return x;
        if (!actReady) return summon() || { ops: [] };
        const V = { b, acts: A, protect: new Map() };
        if (!harmonyNow) {
          // a. 建て直し
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          if (o.knightOtherCrit && obs.boss && obs.boss.type === 'knight' && b[crit] && !(is(crit, 'yinyang') && b[crit].pips >= 7) && crit2 != null && !line.has(crit2) && knightCast !== obs.boss.cast) {
            knightCast = obs.boss.cast; const c0 = crit; crit = crit2; crit2 = c0;
            return { ops: [], more: true, note: `ナイトの後：クリマスを${c0}から${crit}に移して建て直す` };
          }
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        // b. 貫通
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        // c. 詰み回避レベル1（W6〜）
        if (obs.wave >= o.jamFromWave) { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        if ((x = deficitArrange())) return x;
        // d. ロイヤルそろえ
        x = harmonyPlay(true); if (x) return x;
        // e. 止まったらロイヤルを打つ
        return fireRoyal() || summon() || { ops: [] };
      }
      // PU：極の調和ができたら陰陽を puLv まで（召喚より先）
      function puStep() {
        const yd = (obs.deck || []).find(d => d.type === 'yinyang');
        if (o.puLv && yd && yd.lv < o.puLv && (obs.legal.powerUp || []).includes('yinyang'))
          return { ops: [{ op: 'powerUp', type: 'yinyang' }], more: true, note: `PU 陰陽 Lv${yd.lv}→${yd.lv + 1}` };
        return null;
      }
      // ロイヤルを打つ（W7以降は D・R の判断）
      function fireRoyal(force) {
        if (!actReady) return null;
        const rp = A.filter(a => a.result === 'merge' && is(a.from, 'royal') && is(a.to, 'royal') && !line.has(a.from) && !line.has(a.to))
          .sort((p, q) => b[q.from].pips - b[p.from].pips || p.from - q.from)[0];
        if (rp) {
          let ok = true, why = '';
          if (!force && obs.wave >= o.fireFromWave) {
            const el = obs.t - waveStartT;
            if (obs.phase !== 'wave' || el < o.fireSkipSec) ok = false;
            else if (oppV) {
              const past = !!(oppV.front) && oppV.front.progress * TLen > o.stopPastPos;
              ok = Dv != null && Dv >= 0 && !past && !(Rv > 0 && firedWave !== obs.wave);
              why = Dv == null ? '' : `（D=${Dv.toFixed(1)} R=${Rv.toFixed(1)}）`;
            }
          }
          if (ok) { firedWave = obs.wave; return act(rp, `ロイヤルを打つ（出目${b[rp.from].pips}）${why}`); }
        }
        return null;
      }
      // ---------- スイッチ絞りモジュール ----------
      //   null を返したら、ほかのモジュールへ（活性のとき）。切っている間は、切り替えの手か召喚だけ
      function modSwitchThrottle(enabledFn, idleFn) {
        const idAt = id => id == null ? -1 : b.findIndex(d => d && d.id === id);
        const ph = obs.phase, tw = ph === 'roll' ? obs.wave + 1 : obs.wave;
        const en = enabledFn ? enabledFn(tw) : tw >= o.thrFromWave;
        // 調和ができているか（切っている途中なら、その陰陽が戻れば調和）
        if (thr) {
          const yq = idAt(thr.yyId);
          if (yq < 0 || (thr.mode !== 'line' && thr.home !== crit)) { thr = null; thrHot = false; }
        }
        if (!thr && (!harmonyNow || !en)) { thrHot = false; return null; }
        // 活性にしたいか（しないウェーブなら、切っていれば戻す）
        let wantOn;
        if (!en) wantOn = true;
        else if (ph === 'roll') wantOn = false;
        else if (ph !== 'wave') wantOn = true;
        else if (obs.timeLeft != null && obs.timeLeft <= o.thrLastSec) wantOn = true;
        else {
          // ゴールしそうなモンスター：先頭から順に、倒すのにかかる秒の合計（×余裕）＋活性にする手の秒＋余裕 より早くゴールに着くなら活性
          const yq = thr ? idAt(thr.yyId) : crit, yd = b[yq];
          const cpip = thr && thr.mode === 'line' ? b[crit].pips : (yd ? yd.pips : 1);
          const dps = PARTS.pierceJudge(obs, ctx.info, crit, {}).dps1 * cpip * cpip;
          const movesOn = !thr ? 0 : thr.mode === 'nut' ? 2 : 1;
          const movesFull = (thr ? thr.mode : (tw <= o.thrCritUntil ? 'nut' : 'line')) === 'nut' ? 2 : 1;
          let cum = 0, slack = Infinity;
          const TLn = ctx.info.trackLength || 12;
          for (const e of (obs.enemies || [])) {
            cum += e.hp;
            const eta = e.speed > 0 ? (TLn - e.pos) / e.speed : Infinity;
            slack = Math.min(slack, eta - o.thrMult * cum / dps);
          }
          const hotNow = slack - movesOn * o.thrMoveSec < o.thrBuf;               // いま活性しないと間に合わない
          const coolOk = slack - movesFull * o.thrMoveSec >= o.thrBuf + o.thrHyst; // 切り直しても大丈夫
          if (hotNow) thrHot = true; else if (coolOk) thrHot = false;
          wantOn = thrHot;
        }
        const idle = () => idleFn ? idleFn() : (o.thrPU ? puStep() : null) || (o.thrFire ? fireRoyal() : null) || summon() || { ops: [] }; // 切っている間：PU・ロイヤルを打つ・召喚
        if (!actReady) return wantOn && !thr ? null : idle();
        const swOff = (p, ex) => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'switch') && b[i].pips === p && !ex.includes(i));
        const nutOff = p => [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === p);
        const sid = i => b[i] ? b[i].id : null;
        if (wantOn) {
          if (!thr) return null;
          const yq = idAt(thr.yyId), h = thr.home;
          if (b[h] && b[h].id === thr.yyId) { thr = null; return null; }          // 戻った
          let a = null;
          if (is(h, 'switch')) a = find(h, yq);
          else if (thr.mode === 'nut' && is(h, 'nutrient')) {
            for (const s2 of swOff(b[h].pips, [])) { a = find(s2, h); if (a && a.result === 'swap') break; a = null; }
          }
          if (a && a.result === 'swap') return act(a, `スイッチ絞り：活性へ（${a.from}→${a.to}）`);
          thr = null; return null; // 戻せない：建て直しはほかのモジュールに任せる
        }
        // 活性を切る
        if (!thr) {
          if (!harmonyNow) return null;
          const critMode = tw <= o.thrCritUntil;
          const lineHomes = lineCells.slice().sort((x, y) => (col.includes(y) - col.includes(x)) || x - y);
          // W3まではクリマスで切る。クリマスと同じ出目のスイッチがなければ、ラインの陰陽をずらして切る（1.25.1）
          const homes = critMode ? [crit, ...lineHomes] : lineHomes;
          for (const h of homes) {
            const p = b[h].pips;
            for (const s2 of swOff(p, [])) {
              const a = find(s2, h); if (!a || a.result !== 'swap') continue;
              const mode = critMode && h === crit ? (nutOff(p).length ? 'nut' : 'sw') : 'line';
              thr = { mode, home: h, yyId: b[h].id, swId: b[s2].id, nutId: null };
              return act(a, `スイッチ絞り：${mode === 'line' ? `ラインの陰陽${h}をずらして` : 'クリマスにスイッチを入れて'}活性を切る（${s2}→${h}）`);
            }
          }
          return null; // 切れない
        }
        const h = thr.home;
        if (b[h] && b[h].id === thr.yyId) { // 活性に戻っている：また切る
          for (const s2 of swOff(b[h].pips, [])) { const a = find(s2, h); if (a && a.result === 'swap') { thr.swId = b[s2].id; return act(a, `スイッチ絞り：活性を切る（${s2}→${h}）`); } }
          thr = null; return null;
        }
        if (thr.mode === 'nut' && is(h, 'switch')) {
          for (const n0 of nutOff(b[h].pips)) { const a = find(h, n0); if (a && a.result === 'swap') { thr.nutId = sid(n0); return act(a, `スイッチ絞り：クリマスに養分を置く（${h}↔${n0}）`); } }
        }
        return idle();
      }
      // ---------- 核対面モジュール ----------
      function modNuke(kind) {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        // ロイヤルを打つ条件
        const ob = (obs.opponent && obs.opponent.board) || [], ofield = obs.opponent && obs.opponent.field, bless = ofield === 'blessing';
        const ot = (i, t, p) => !!(ob[i] && ob[i].type === t && ob[i].pips >= (p || 1));
        const ocnt = t => ob.filter(d => d && d.type === t).length;
        let fireNow;
        if (kind === 'combo') {
          const NB = ctx.info.board.neighbors, sc2 = ob.some((d, i) => ot(i, 'scope', 2));
          // 相手のクリマス（楽園マス）。見えなければ（4.3.4より前）盤面全体
          const fi = obs.opponent && obs.opponent.fieldInfo;
          const oCrit = fi && fi.paradise ? fi.paradise.map(p => p.cell) : [...Array(15).keys()];
          const adj = ob.some((d, i) => ot(i, 'scope', 2) && NB[i].some(j => ot(j, 'combo', 2)));
          fireNow = bless ? ((ocnt('combo') >= o.comboFireBless && sc2) || (obs.wave >= o.comboBlessScopeWave && sc2))
            : ((ocnt('combo') >= o.comboFire && adj) || (ofield === 'paradise' && obs.wave >= o.comboParadiseWave && oCrit.some(i => ot(i, 'combo', o.comboParadisePips))));
        } else {
          fireNow = bless ? (ocnt('nuke') >= o.nukeFireBless || ob.some((d, i) => ot(i, 'hell', o.nukeHellPips))) : ocnt('nuke') >= o.nukeFire;
        }
        const fire = () => fireNow ? fireRoyal(true) : null;
        // PU（W4以降）
        let x0 = obs.wave >= o.nukePuFrom ? puStep() : null; if (x0) return x0;
        // ナイトの後：クリマスが出目6以上の陰陽でなければ、もう一方の楽園マス（元のラインの外）をクリマスにする
        if (o.nukeKnightKeep != null && !harmonyNow && obs.boss && obs.boss.type === 'knight' && knightCast !== obs.boss.cast && obs.boss.cast > 0
            && b[crit] && !(is(crit, 'yinyang') && b[crit].pips >= o.nukeKnightKeep) && crit2 != null && !line.has(crit2)) {
          knightCast = obs.boss.cast; const c0 = crit; crit = crit2; crit2 = c0; thr = null; jamCell = null;
          return { ops: [], more: true, note: `ナイトの後：クリマスを${c0}から${crit}に移して建て直す` };
        }
        // スイッチ絞り：W2〜（核W6・コンボW7）。W5以降のナイト前はしない
        const until = kind === 'combo' ? o.comboThrUntil : o.nukeThrUntil;
        const nb = obs.phase === 'roll' ? (obs.nextBoss && obs.nextBoss.type) : obs.bossType;
        const thrEn = tw => tw >= o.thrFromWave && tw < until && !(tw >= o.nukeKnightFrom && nb === 'knight');
        let x = modSwitchThrottle(thrEn, () => (obs.wave >= o.nukePuFrom ? puStep() : null) || fire() || summon() || { ops: [] });
        if (x) return x;
        if (!actReady) return summon() || { ops: [] };
        if ((x = fire())) return x;
        const V = { b, acts: A, protect: new Map() };
        if (!harmonyNow) {
          // 建て直し：詰み回避で崩したならライン建て直し。それ以外は、空きマスがあれば召喚してから、クリマス → ライン建て直し
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          if (b.some(d => !d) && (x = summon())) return Object.assign(x, { note: '建て直し：ダイスを出す' });
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        // 貫通
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        // 詰み回避レベル1（いつでも）
        { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        // ロイヤルそろえ（W4以降は、ラインの陰陽と同じ出目のスイッチを1個残す）
        keepCell = null;
        if (obs.wave >= o.nukeKeepFrom) {
          const lp = new Set(lineCells.filter(i => is(i, 'yinyang')).map(i => b[i].pips));
          keepCell = [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'switch') && lp.has(b[i].pips)).sort((p, q) => b[p].pips - b[q].pips || p - q)[0] ?? null;
        }
        x = deficitArrange() || harmonyPlay(true); keepCell = null;
        if (x) return x;
        return summon() || { ops: [] };
      }
      // ---------- 出目上げが必要で打てないとき：養分を与えないロイヤルそろえ → 止まったらロイヤルを打つ ----------
      function deficitArrange() {
        if (!o.deficitArrange || !needRaise || !harmonyNow) return null;
        if (!actReady) return summon() || { ops: [] };
        noFeed = true;
        let x; try { x = harmonyPlay(true); } finally { noFeed = false; }
        if (x) { x.note = '（出目上げ待ち）' + (x.note || ''); return x; }
        const f = fireRoyal(true); if (f) { f.note += '（出目上げ待ちで止まったので打つ）'; return f; }
        // 打つロイヤルもないとき：残すスイッチ（keepCell）は守ったまま、普通のロイヤルそろえに戻す（1.25.2）
        x = harmonyPlay(true); if (x) { x.note = '（出目上げ待ちで止まりロイヤルもないので普通のロイヤルそろえ）' + (x.note || ''); return x; }
        // それでも打つ手がないときだけ、残すスイッチの守りを外す（1.25.3）
        if (keepCell != null) {
          const kc = keepCell; keepCell = null;
          try { x = harmonyPlay(true); } finally { keepCell = kc; }
          if (x) { x.note = '（出目上げ待ちで止まりロイヤルもないので、スイッチの守りを外してロイヤルそろえ）' + (x.note || ''); return x; }
        }
        return summon() || { ops: [] };
      }
      // ---------- ロイヤル攻撃：ロイヤルそろえをして、止まったら打つ（打つたびにまたそろえる） ----------
      function royalAttack() {
        if (!actReady) return summon() || { ops: [] };
        const x = harmonyPlay(true); if (x) return x;
        return fireRoyal(true) || summon() || { ops: [] };
      }
      // ---------- 月太陽対面モジュール（相手にロイヤルがないとき） ----------
      function modMoonsun() {
        const od = ctx.info.opponentDeck || [];
        if (od.some(d => d.type === 'royal')) return null;
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        let x6;
        if (o.raise4From != null && obs.wave >= o.raise4From && (x6 = raiseTo(4, `W${o.raise4From}〜：調和の出目4を最優先`, false))) return x6;
        // ボスがナイトのウェーブ：極の調和の出目6までの出目上げを最優先
        if (o.msRaise6 && obs.bossType === 'knight' && (x6 = raiseTo(6, 'ナイト前の出目上げ', false))) return x6;
        { const pu = puStep(); if (pu) return pu; } // PU：極の調和ができたら陰陽を puLv まで
        if (!actReady) return summon() || { ops: [] };
        const V = { b, acts: A, protect: new Map() };
        let x;
        if (!harmonyNow) {
          // 建て直し（ナイト・レオンなど）：詰み回避で崩したならライン建て直し。それ以外はクリマス → ライン建て直し
          if (jamCell != null && is(crit, 'yinyang')) {
            x = PARTS.lineRebuild(V, lineCells, crit);
            if (x && x !== 'done') return act(x, `詰み回避の続き：ライン建て直し（${x.result}）`);
            if (x !== 'done') return summon() || { ops: [] };
          }
          jamCell = null;
          x = PARTS.critRebuild(V, crit, lineCells);
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return summon() || { ops: [] };
        }
        jamCell = null;
        // 貫通
        const cp = b[crit].pips;
        if (o.pierce && cp <= 5) {
          if (pt.wave !== obs.wave) pt = { wave: obs.wave, need: PARTS.pierceJudge(obs, ctx.info, crit, { lv: 5, mult: o.pierceMult }).need };
          if (cp < Math.min(o.critMax || 7, pt.need)) {
            needRaise = true;
            for (const n0 of [...Array(15).keys()].filter(i => !line.has(i) && is(i, 'nutrient') && b[i].pips === cp)) {
              const f = find(n0, crit); if (f && f.result === 'feed') return act(f, `貫通：クリマスの陰陽に養分（出目${cp}→${cp + 1}。目標${pt.need}）`);
            }
            const Vl = { b, acts: A, protect: new Map([[crit, 9], ...lineCells.map(i => [i, 9])]) };
            x = PARTS.makeNut(Vl, cp);
            if (x && x !== 'done') return act(x, `貫通：出目${cp}の養分を作る（目標${pt.need}）`);
          }
        }
        if ((x = raise5())) return x;
        // 詰み回避レベル1（いつでも）
        { const j = PARTS.jamLv1(V, crit, lineCells); if (j) { jamCell = j.cell; return act(j.act, `詰み回避1：${j.act.from}の陰陽をライン${j.cell}の陰陽へ合成`); } }
        // 打つ条件
        const opp = obs.opponent, ob = (opp && opp.board) || [];
        const front = opp && opp.front ? opp.front.progress * TLen : 0;
        const sunInfo = od.find(d => d.type === 'sun') || {}, moonInfo = od.find(d => d.type === 'moon') || {};
        const sunAC = Array.isArray(sunInfo.activeCounts) && sunInfo.activeCounts.length ? sunInfo.activeCounts : [1, 4, 7];
        const sunAct = sunAC.includes(ob.filter(d => d && d.type === 'sun').length);
        const W = obs.wave;
        let why = null;
        if (msNew == null) { msNew = ctx.rng() < o.msNewPlan; ctx.log(`月太陽対面：${msNew ? '新しい選択（W' + o.msNewWaves.join('・W') + 'の残り' + o.msNewStart + '秒から、太陽が活性ならロイヤル攻撃）' : 'いままでの打つ条件'}`); }
        if (msNew) {
          const tl = obs.timeLeft;
          if (obs.phase === 'wave' && o.msNewWaves.includes(W) && tl != null && tl <= o.msNewStart && msNewEndW !== W) {
            if (tl <= o.msNewEnd && front <= o.msCenter) { msNewEndW = W; ctx.log(`W${W} 残り${tl.toFixed(0)}秒：相手の先頭が中央を越えていないのでロイヤル攻撃を終了`); }
            else if (sunAct) why = `新しい選択：W${W}の残り${Math.floor(tl)}秒、相手の太陽が活性`;
          }
        } else if (W >= o.msEarlyFrom && W < o.msLateFrom) {
          if (front > o.msCorner && sunAct) why = `相手の先頭が${o.msCorner}を越え、太陽が活性`;
          else if (front > o.msCenter && obs.timeLeft != null && obs.timeLeft >= o.msCenterLeft && sunAct) why = `相手の先頭が中央を越え、残り${Math.floor(obs.timeLeft)}秒で太陽が活性`;
          else if (obs.phase === 'intro' && obs.bossType === 'leon') why = 'レオンの演出中';
        } else if (W >= o.msLateFrom) {
          const c = moonInfo.cls || 10, cd = ctx.info.opponentCd || 2000, base = ctx.info.opponentBaseCrit != null ? ctx.info.opponentBaseCrit : 0.05;
          const have = MOONSUN.boardSum(ob, ctx.info.board.neighbors, c, cd, o.msT, base), ref = MOONSUN.mult(c, o.msRefMoon, cd, o.msRefSun, o.msT, 5, base);
          if (have >= ref) why = `相手の月太陽の火力 ${have.toFixed(0)} ≥ 月${o.msRefMoon}・太陽${o.msRefSun}の ${ref.toFixed(0)}`;
          else if (ob.some(d => d && d.type === 'moon' && d.pips >= 7)) why = '相手に月の星';
          else if (front > o.msCorner && sunAct) why = `相手の先頭が${o.msCorner}を越え、太陽が活性`;
        }
        if (o.msRaise6 && b[crit].pips < Math.min(6, o.critMax || 7)) needRaise = true; // 出目6まで上げたい
        if (why) {
          if (!actReady) return summon() || { ops: [] };
          if ((x = deficitArrange())) return x;
          x = harmonyPlay(true); if (x) return x;
          const f = fireRoyal(true); if (f) { f.note += `（ロイヤル攻撃：${why}）`; return f; }
          return summon() || { ops: [] };
        }
        // 新しい選択：W5・W8・W10 でロイヤル攻撃をしないときは、いつもロイヤルそろえ
        if (msNew && o.msNewWaves.includes(W)) {
          if (!actReady) return summon() || { ops: [] };
          return harmonyPlay(true) || summon() || { ops: [] };
        }
        // ロイヤル攻撃の下：極の調和の出目を6まで上げる
        if (o.msRaise6 && (x6 = raiseTo(6, '出目6までの出目上げ', false))) return x6;
        return deficitArrange() || harmonyPlay(true) || summon() || { ops: [] };
      }
      // ---------- ロイヤル対面モジュール ----------
      //   ロイヤル攻撃（ロイヤル対面版）：クリマスの陰陽の出目を上げる手を除いたロイヤルそろえ → 止まったら打つ
      function royalAttackR() {
        if (!actReady) return summon() || { ops: [] };
        noCritRaise = true;
        let x; try { x = harmonyPlay(true); } finally { noCritRaise = false; }
        if (x) return x;
        return fireRoyal(true) || summon() || { ops: [] };
      }
      function modRoyalMatch() {
        if (!everH) { if (!harmonyNow) return modHarmony(); everH = true; }
        const W = obs.wave, V = { b, acts: A, protect: new Map() };
        let x;
        // 崩れたら、いかなる場合も最優先でクリマス建て直し → ライン建て直し（打つ手がなければロイヤル攻撃）
        if (!harmonyNow) {
          if (!actReady) return summon() || { ops: [] };
          if (is(crit, 'yinyang') && W >= 4 && b[crit].pips < 2 && (x = raiseTo(2, 'W4〜：建て直し中のクリマスの陰陽を出目2へ', false))) return x;
          x = PARTS.critRebuild(V, crit, lineCells, { noOffMerge: true });
          if (x && x !== 'done') return act(x, `建て直し（${is(crit, 'yinyang') ? 'ライン' : 'クリマス'}）：${x.result} ${x.from}→${x.to}`);
          return royalAttackR();
        }
        // W3以降：陰陽のPU（Lv最大まで）・調和の出目2
        if (W >= 3) {
          const yd = (obs.deck || []).find(d => d.type === 'yinyang');
          if (yd && (obs.legal.powerUp || []).includes('yinyang')) return { ops: [{ op: 'powerUp', type: 'yinyang' }], more: true, note: `PU 陰陽 Lv${yd.lv}→${yd.lv + 1}（ロイヤル対面：最大まで）` };
        }
        if (!actReady) return summon() || { ops: [] };
        const kind = matchup.includes('royalMoonsun') ? 'ms' : matchup.includes('royalYinyang') ? 'yy' : 'n';
        const tg = Math.max(W >= 3 ? 2 : 0, W >= 6 ? 3 : 0, kind !== 'n' && W >= 7 ? 4 : 0);
        if (tg && (x = raiseTo(tg, `W${W}の調和の出目（${tg}まで）`, false))) return x;
        // 攻撃するか
        const opp = obs.opponent, ob = (opp && opp.board) || [];
        const front = opp && opp.front ? opp.front.progress * TLen : 0;
        const cnt = t => ob.filter(d => d && d.type === t).length;
        let why = null;
        if (kind === 'n') {
          if (W >= 5 && front <= o.stopPastPos) why = `W5〜：相手の先頭が${o.stopPastPos}を越えていない`;
          else if (W >= 4 && Dv != null && Dv >= 0 && front <= o.stopPastPos && !(Rv > 0 && firedWave !== W)) why = `D・R（D=${Dv.toFixed(1)} R=${Rv.toFixed(1)}）`;
        } else if (kind === 'yy') {
          const rowsYY = [0, 1, 2].some(r => [0, 1, 2, 3, 4].every(c => ob[r * 5 + c] && ob[r * 5 + c].type === 'yinyang'));
          const colsYY = [0, 1, 2, 3, 4].some(c => [0, 1, 2].every(r => ob[r * 5 + c] && ob[r * 5 + c].type === 'yinyang'));
          if (W >= 4 && (rowsYY || colsYY)) why = '相手の陰陽が活性';
        } else {
          const sunAct = [1, 4, 7].includes(cnt('sun')), moonAct = [3, 5, 7].includes(cnt('moon'));
          if (W >= 2 && obs.bossType === 'leon' && (obs.phase === 'boss' || obs.phase === 'intro') && sunAct && moonAct && leonFiredW !== W) why = 'レオン：相手の月と太陽が活性（1回）';
          else if (W >= 4 && obs.phase === 'wave' && obs.t - waveStartT >= o.rmsSkipSec && front <= o.rmsLimitPos && sunAct) why = `相手の先頭が${o.rmsLimitPos}を越えておらず、太陽が活性`;
        }
        if (why) {
          const r = royalAttackR();
          if (r && r.ops && r.ops[0] && r.ops[0].op === 'act' && /ロイヤルを打つ/.test(r.note || '')) { firedWave = W; if (/レオン/.test(why)) leonFiredW = W; r.note += `（${why}）`; }
          return r;
        }
        // 攻撃しないとき：ロイヤルそろえはしない。月太陽ロイヤル・ノーマルロイヤルでは、余ったジョーカーで
        //   盤面のスイッチが1個ならスイッチをコピー、そうでなければ陰陽をコピー。あとは召喚
        if (kind !== 'yy') {
          const keep = new Set([crit, ...lineCells]);
          const nSw = b.filter(d => d && d.type === 'switch').length;
          const cp = t => A.filter(a => a.result === 'copy' && !keep.has(a.from) && b[a.from] && b[a.from].type === 'joker' && b[a.to] && b[a.to].type === t)
            .sort((p, q) => b[q.from].pips - b[p.from].pips)[0];
          const a = (nSw === 1 && cp('switch')) || cp('yinyang');
          if (a) return act(a, `余ったジョーカー${b[a.from].pips}で${b[a.to].type === 'switch' ? 'スイッチ' : '陰陽'}をコピー（スイッチ${nSw}個）`);
        }
        return summon() || { ops: [] };
      }
      // ---------- モジュールを順に試す ----------
      const MOD = { harmony: modHarmony, royalArrange: modRoyalArrange, assassin: modAssassin, normal: modNormal, switchThrottle: () => modSwitchThrottle(), nuke: () => modNuke('nuke'), combo: () => modNuke('combo'), moonsun: modMoonsun, royalAttack, royalMatch: modRoyalMatch };
      for (const m of mods) { const r = MOD[m] && MOD[m](); if (r) return r; }
      return summon() || { ops: [] };
    } };
  },
});
