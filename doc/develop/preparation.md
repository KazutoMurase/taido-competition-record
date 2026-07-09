# 大会準備

各大会毎にデータベースを構築する必要がある。

## 環境構築

以下実行しスクリプトを利用する為の環境を準備する。

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## トーナメント用DB作成

まず、taido-competition-record/data以下に大会用フォルダを用意する（例：`2025_student`）。その下にoriginalフォルダとstaticフォルダを作る。

それぞれのフォルダ内のファイルの作り方はいくつかあるので、以下に列挙する。

#### generate_tournament_db_from_xl.pyで生成するもの
- original以下の個実・個法・団法などトーナメント形式の競技のcsv

トーナメントのエクセルファイルからDB用CSVを自動生成できる。エクセルのタブ名とcsvのファイル名は`name_db_map`変数が対応している。

#### generate_tournament_csv.pyで生成するもの
- static/players.csv
- static/generate_tables.sql
- original以下の個実・個法など個人競技トーナメントのcsv
- original以下の団体実戦トーナメント、団体法形、展開競技のcsv
- original/generate_tables.sql

選手一覧CSVからplayers.csv、個人競技トーナメントCSV、団体実戦トーナメントCSV、団体法形・展開の採点順CSVを生成できる。

#### edit_block_csv.pyで出力するもの
- original以下の`block_*`や`current_block_*`

現在は、基本的には管理画面のブロック編集ページで時程CSVを編集・保存する。
`edit_block_csv.py` は従来のローカルGUIとして残っている。

#### エクセルファイルからのコピペ等で手動作成するもの
- static/players.csv
- static/groups.csv

#### エクセルファイルを元に手動で作成するもの
- title.txt

#### 昨年度の同一大会を参考に用意するもの
- original/awarded_players.csv (優秀選手などの褒章が存在しない大会の場合は不要)
- original/generate_tables.sql
- static/court_type.csv
- static/event_type.csv
- static/generate_tables.sql

変化がなければ昨年度の同一大会のファイルをコピーする。
コート数、競技、賞の有無などが変わる場合は、昨年度の同一大会のファイルを参考に適宜編集する。

## csvデータ作成用ツールの使い方

#### generate_tournament_db_from_xl.py

大会Excelファイルと出力先ディレクトリを入力すると自動で出力してくれる。

```bash
scripts/generate_tournament_db_from_xl.py --file-path (FILE_PATH_TO_EXCEL_FILE) --output-path (OUTPUT_DIRECTORY)
```

#### generate_tournament_csv.py

選手一覧CSVを入力して、大会フォルダ配下の`static`と`original`にDB用CSVを生成する。

```bash
python scripts/generate_tournament_csv.py 2026_kid --source-csv players_children.csv players_high_school.csv --seed 1
```

入力CSVはUTF-8にしておく。高校生用CSVの`high_school_`プレフィックスは出力時に外され、`推`や`○`など数値でない順位情報は空欄として扱われる。

#### edit_block_csv.py

時程表を作成するためのGUI。
大会名(e.g. 2024_alljp)とブロック(e.g. A)を入力し、新規作成や編集を行うことができる。

```bash
scripts/edit_block_csv.py
```

#### ブロック編集ページ

管理画面の競技編集ページから、各コートのブロック編集ページを開ける。

```text
/admin/edit_tournaments
```

ブロック編集ページでは、`block_a.csv` と `block_a_games.csv` のような時程CSVを編集できる。
`CSV出力` ボタンを押すと、DBには保存せずに現在の画面内容から以下の2ファイルをダウンロードする。

```text
block_<block>.csv
block_<block>_games.csv
```

`保存` ボタンを押すと、DBを更新し、`data/<competition>/original/` 以下のCSVも更新する。
既存CSVがある場合は、同じディレクトリに `.bak` ファイルを作ってから上書きする。

#### update_block_tables_sql.py

`static/court_type.csv` を見て、`original/generate_tables.sql` にブロック用テーブル定義を追加する。
新しい大会で `block_a`, `block_a_games`, `current_block_a` などのテーブル定義がまだない場合に使う。

```bash
python3 scripts/update_block_tables_sql.py 2026_kid
```

`competition` には `2026_kid` のような大会名だけを渡す。
`data/2026_kid` のように `data/` 付きで渡さない。

このスクリプトは、`data/<competition>/static/court_type.csv` のコート名からブロック名を決める。
たとえば `Aコート`, `Bコート` があれば、`block_a`, `block_b` 関連のテーブルを生成する。

生成箇所は以下のコメントで囲まれる。

```sql
-- BEGIN generated block tables
...
-- END generated block tables
```

このコメントがすでにある場合は、その範囲を置き換える。
コメントなしで既存の `block_*` テーブル定義がある場合は、意図しない重複生成を避けるためエラーにする。

#### pyqt5でxcb関連のエラーが起きた時(edit_block_csv.py)
`edit_block_csv.py`で以下のようなエラーが出るときは、[このページ](https://qiita.com/momomo_rimoto/items/83917d3f9f5dd35457e1)に従って`libqxcb.so`に足りない.soファイルに対応するaptパッケージをインストールすると動く
```
qt.qpa.plugin: Could not load the Qt platform plugin "xcb" in "" even though it was found.
```

#### pyqt5で日本語が□で表示される場合(edit_block_csv.py)
日本語フォントをaptで入れればよい。例えば、
```
sudo apt install fonts-noto-cjk
```
