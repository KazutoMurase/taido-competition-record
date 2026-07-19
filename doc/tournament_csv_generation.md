# トーナメントCSV生成ロジック整理

このメモは、現在の `scripts/generate_tournament_csv.py` の挙動を整理したものです。
`data/*/original/*.csv` との比較結果を前提にしています。

## 使い方

現在の `scripts/generate_tournament_csv.py` は、複数の入力CSVから大会用CSV一式を生成するスクリプトです。
既存の `players.csv` を前提に単体トーナメントだけを作るモードは持っていません。

例:

```bash
python scripts/generate_tournament_csv.py 2026_kid \
  --source-csv players_children.csv players_high_school.csv \
  --seed 1
```

この場合、以下を生成します。

```text
data/2026_kid/static/players.csv
data/2026_kid/static/generate_tables.sql
data/2026_kid/original/<event>.csv
data/2026_kid/original/<dantai_event>_groups.csv
data/2026_kid/original/generate_tables.sql
```

`competition` には `2026_kid` のような大会名だけを渡します。
`data/2026_kid` のように `data/` 付きで渡すと、`data/data/2026_kid` に出力されるため注意してください。

## 入力CSVの前提

入力CSVは UTF-8 のCSVを想定しています。
CP932 のCSVを受け取った場合は、事前にUTF-8へ変換します。

```bash
iconv -f CP932 -t UTF-8 input.csv -o input.utf8.csv
```

入力CSVには以下のような列を想定しています。

```text
id
group_id
name
name_kana
mvp
<event>_player_id
<event>_rank_group
<event>_rank_lastyear
<event>_rank_total
```

`member_id` は出力しません。

団体競技は、以下の名前で始まる `*_player_id` 列を団体用入力として扱います。

```text
dantai_zissen*
dantai_hokei*
tenkai*
```

たとえば現在の `players_children.utf8.csv` では、`dantai_zissen_man`, `dantai_zissen_woman`, `dantai_hokei`, `tenkai` が生成対象です。
将来 `dantai_hokei_man`, `dantai_hokei_woman`, `tenkai_man`, `tenkai_woman`, `dantai_hokei_newcommer` などの列が追加された場合も、2チーム以上復元できれば生成対象になります。

団体競技の `*_player_id` は、個人競技の選手IDではなく団体メンバー行の印として使います。
チーム分けは `group_id` と `*_rank_group` から復元します。
`rank_group` に `A` または `B` が含まれる場合は A/B チームに分け、分かれない場合は地区名だけのチームにします。
`監`, `監督`, `補` を含む行は監督・補欠として参加メンバーから除外します。

`high_school_` で始まるイベント名は、出力時に `high_school_` を外します。

```text
high_school_zissen_man -> zissen_man
high_school_hokei_man  -> hokei_man
```

`*_player_id` と rank 列は整数だけを有効値として扱います。
`推`、`○`、`〇` などの印は空欄として出力します。

2人未満のイベントは、`players.csv` の列にもトーナメントCSVにも出力しません。

## 生成されるDB定義

`static/generate_tables.sql` は、生成した `players.csv` の列から `players` テーブル定義を作ります。

- `id`, `group_id`, `mvp` は `integer`
- `name`, `name_kana` は `text`
- `*_player_id` は `integer unique`
- `*_rank_group`, `*_rank_lastyear`, `*_rank_total` は `integer`

`groups`, `event_type`, `court_type`, `notification_request` も既存形式に合わせて作ります。
ただし `groups.csv`, `event_type.csv`, `court_type.csv` 自体は別途用意が必要です。

`original/generate_tables.sql` は、実際に生成された競技CSVを対象に作ります。
個人競技のほか、団体実戦、団体法形、展開のテーブル定義も生成します。

## 団体競技の生成

団体実戦は、参加チームを `<event>_groups.csv` に出力し、
既存の個人トーナメント生成ロジックを使って `<event>.csv` を生成します。
ランク情報がないため、配置はランダムです。
CSVの列は個人戦と異なり、`left_group_id`, `right_group_id`, `left_group_flag` を使います。

団体法形は `<event>_groups.csv` と `<event>.csv` を生成します。
`<event>.csv` は採点順リストで、全チームを `round=1` に出力し、決勝用に `round=2` の空行を4枠追加します。

展開は `<event>_groups.csv` と `<event>.csv` を生成します。
`<event>.csv` も採点順リストで、全チームを `round=1` に出力し、決勝用に `round=2` の空行を4枠追加します。

## 現在の一致状況

現在のスクリプトで確認した結果は以下です。

```text
確認対象: 78件
構造一致: 58件
構造 + game_id 一致: 45件
game_id のみ不一致: 13件
構造不一致: 20件
```

## 構造の決め方

生成スクリプトは、まず2冪サイズの枠を作り、その後で空き枠/BYEを圧縮してCSV化します。

流れは以下です。

1. 選手数を数える。
2. 選手数以上の最小の2冪枠を決める。
3. シード順のスロット配列を作る。
4. 第1シード側から順にBYEを割り当てる。
5. 残った枠に選手IDを入れる。
6. 2冪枠の完全な二分木を作る。
7. 空き枝を圧縮する。
8. 圧縮後の木をCSVの試合行に変換する。

基本方針として、1回戦はシードの相手側に置きます。
つまり、シード選手は「すでに1回戦を戦って勝ち上がってきた相手」と2回戦で当たる形になります。
同じ2回戦でも、シード側が有利になる配置です。

BYEは第1シードから順に割り当てます。
実装上は、各シード位置を探し、そのシードの1回戦相手になる枠を空にしています。

## シード位置の解釈

現在のスクリプトでは、表示上のシード位置を以下のように解釈しています。

```text
左上 = 第1シード
右下 = 第2シード
右上 = 第3シード
左下 = 第4シード
```

注意点として、これは「右上が第2シード」ではありません。
もし「右上が第2シード、右下が第3シード」と解釈するなら、シード順の生成ロジックから見直す必要があります。

4枠の表示順は以下です。

```text
1, 4, 3, 2
```

8枠の表示順は以下です。

```text
1, 8, 5, 4, 3, 6, 7, 2
```

16枠の表示順は以下です。

```text
1, 16, 9, 8, 5, 12, 13, 4,
3, 14, 11, 6, 7, 10, 15, 2
```

左半分は表示上の左側です。
右半分は表示上の右側ですが、GUI上では右側が木のスロット順と上下逆に表示されるため、実際に木へ入れるときは右半分を反転しています。

## シード順の考え方

シード順は再帰的に作っています。

前段のシードに対して、補完シードを置きます。

```text
補完シード = 枠数 + 1 - シード番号
```

その補完シードを左右交互に置くことで、上記の表示順を作っています。

8枠で見ると、対応は以下のイメージです。

```text
1 -> 8
2 -> 7
3 -> 6
4 -> 5
```

より大きい枠でも同じ考え方を再帰的に続けます。

- 1〜8シードで大きな位置が決まる。
- 9〜16シードはその内側に補完的に入る。
- 17〜32、33〜64 も同様に再帰的に入る。

このため、大きいトーナメントでは、上位シード側にBYEを割り当てた後、残りの1回戦が中央寄りに見える場合があります。
たとえば `(2024_adult, zissen_man)` のように1回戦が多いケースでは、既存CSV側がより強い中央寄せルールを持っている可能性があり、別途確認が必要です。

## game_id の振り方

構造を作った後、CSV出力前に `game_id` を振ります。

基本は以下です。

```text
決勝の id = 選手数
3位決定戦の id = 選手数 - 1
その他の試合 = 1 から順に採番
```

その他の試合の採番順は以下です。

1. 早いラウンドを先にする。
2. 同じラウンドでは表示上の並びを使う。
3. 左側は上から下へ。
4. 右側はGUI表示に合わせるため、左右を反転した path order を使う。

path の扱いは以下のイメージです。

```text
L... はそのまま左側の上から下
R... は L/R を反転して右側の表示順に合わせる
```

## game_id 補正

game_id については、トーナメントの大きさに応じて補正単位を変えています。

64枠以上では、4ブロックを以下のように見ます。

```text
LL = 第1シード側
LR = 第4シード側
RL = 第2シード側
RR = 第3シード側
```

32枠では、4ブロックでは細かすぎるため、左右2ブロックで見ます。

```text
L = 左側
R = 右側
```

16枠では、全体の実1回戦数が1つだけの場合に限り、連番回避の補正を行います。
8枠以下では、この game_id 補正は行いません。

各ブロックの「実際の1回戦数」は、圧縮後の `P/P` ノード数ではありません。
BYE圧縮前のフルスロット上で、隣同士の枠が両方埋まっている数です。

この違いは重要です。
圧縮後に `P/P` に見える試合でも、フルスロット上の本当の1回戦とは限らないためです。

現在の補正ルールは以下です。

- 64枠以上では、第1シード側 `LL` または第3シード側 `RR` を見る。
- 32枠では、左側 `L` または右側 `R` を見る。
- そのブロックの実1回戦数がちょうど1つである。
- 同じ小山の兄弟に `P/P` と `P/G` または `G/P` が混在している。
- その場合、`P/P` の試合を先に採番する。
- 16枠で全体の実1回戦数が1つだけの場合は、その1回戦の次戦を同ラウンド内で後ろへ回し、`id=1 -> id=2` のような連番を避ける。

この補正により、以下のようなケースが一致します。

```text
2024_student zissen_woman
2025_student zissen_man
2025_student zissen_woman
2025_alljp zissen_man
```

32枠でも左右2ブロックの補正は行います。
16枠では単発1回戦の連番回避だけを行います。
8枠以下は小さすぎるため、現時点では補正対象外です。

## game_id のみ不一致のもの

以下は、構造は一致していますが `game_id` の順序が original と異なるものです。

形式:

```text
(大会, 種目, 選手数, 枠数, LL/LR/RL/RR の実1回戦数, 差分path数)
```

```text
(2024_adult, hokei_kyuui, 29, 32, 3/4/3/3, 3)
(2024_adult, hokei_sei, 18, 32, 1/0/1/0, 3)
(2024_alljp, zissen_man, 34, 64, 1/0/1/0, 7)
(2024_sogenhai, zissen_kyuui_woman, 17, 32, 1/0/0/0, 7)
(2025_adult, hokei_kyuui, 37, 64, 1/2/1/1, 4)
(2025_adult, hokei_sei, 22, 32, 1/2/1/2, 8)
(2025_adult, hokei_woman, 33, 64, 1/0/0/0, 11)
(2025_adult, zissen_man, 71, 128, 1/2/2/2, 2)
(2025_alljp, hokei_man, 33, 64, 1/0/0/0, 3)
(2025_kid, higher_grades_zissen_woman, 20, 32, 1/1/1/1, 7)
(2025_sogenhai, hokei_man, 33, 64, 1/0/0/0, 2)
(2025_sogenhai, hokei_newcommer, 65, 128, 1/0/0/0, 2)
(2025_sogenhai, hokei_woman, 33, 64, 1/0/0/0, 2)
```

この13件のうち、以下の5件は seed1/seed3 補正を入れる前は一致していたものです。
今後補正条件を見直す場合は、まずここを崩さない条件を探す必要があります。

```text
(2025_adult, hokei_kyuui)
(2025_adult, zissen_man)
(2025_sogenhai, hokei_man)
(2025_sogenhai, hokei_newcommer)
(2025_sogenhai, hokei_woman)
```

## 構造不一致のもの

以下は、現在のロジックでは original と構造が一致していないものです。

形式:

```text
(大会, 種目, 選手数, 枠数, LL/LR/RL/RR の実1回戦数)
```

```text
(2024_adult, hokei_man, 35, 64, 1/0/1/1)
(2024_adult, hokei_woman, 19, 32, 1/0/1/1)
(2024_alljp, hokei_man, 26, 32, 3/2/3/2)
(2024_alljp, hokei_woman, 27, 32, 3/2/3/3)
(2024_sogenhai, hokei_kyuui_woman, 19, 32, 1/0/1/1)
(2024_sogenhai, hokei_newcommer, 71, 128, 1/2/2/2)
(2025_adult, hokei_man, 55, 64, 5/6/6/6)
(2025_adult, zissen_sonen_man, 11, 16, 1/0/1/1)
(2025_adult, zissen_woman, 25, 32, 3/2/2/2)
(2025_kid, higher_grades_hokei_woman, 27, 32, 3/2/3/3)
(2025_kid, higher_grades_zissen_man, 27, 32, 3/2/3/3)
(2025_kid, hokei_kyuui, 10, 16, 1/0/1/0)
(2025_kid, hokei_man, 23, 32, 1/2/2/2)
(2025_kid, hokei_woman, 9, 16, 1/0/0/0)
(2025_kid, junior_high_hokei_man, 22, 32, 1/2/1/2)
(2025_kid, junior_high_hokei_woman, 25, 32, 3/2/2/2)
(2025_kid, junior_high_zissen_man, 22, 32, 1/2/1/2)
(2025_kid, junior_high_zissen_woman, 23, 32, 1/2/2/2)
(2025_kid, lower_grades_hokei_man, 26, 32, 3/2/3/2)
(2025_kid, zissen_man, 19, 32, 1/0/1/1)
```

## 今後の確認ポイント

現在のロジックは、シード位置とBYE圧縮を中心にした比較的シンプルなものです。
既存CSVに見られるすべての慣習をまだ表現できているわけではありません。

残っている論点は以下です。

- 32枠では左右2ブロック補正を入れている。
- 16枠では単発1回戦の連番回避のみを入れている。
- `1/0/0/0` のような疎な大きいトーナメントでは、game_id 補正が逆効果になる場合がある。
- 1回戦が多い大きなトーナメントでは、より強い中央寄せルールがある可能性がある。
- シード位置を「右上が第2シード」と解釈し直す場合は、シード順生成から再検討が必要。
