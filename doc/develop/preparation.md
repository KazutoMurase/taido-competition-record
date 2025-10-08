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

#### edit_block_csv.pyで出力するもの
- original以下の`block_*`や`current_block_*`

#### エクセルファイルからのコピペ等で手動作成するもの
- static/players.csv
- static/groups.csv

#### エクセルファイルを元に手動で作成するもの
- original以下の団法・展開競技のcsv
- title.txt

#### 過去の同一大会からコピーするもの
- original/awarded_players.csv (優秀選手などの褒章が存在しない大会の場合は不要)
- original/generate_tables.sql
- static/court_type.csv
- stattic/event_type.csv
- static/generate_tables.sql

ただし、コート数や競技等の変更がある場合は適宜編集を加えること。

## csvデータ作成用ツールの使い方

#### generate_tournament_db_from_xl.py

大会Excelファイルと出力先ディレクトリを入力すると自動で出力してくれる。

```bash
scripts/generate_tournament_db_from_xl.py --file-path (FILE_PATH_TO_EXCEL_FILE) --output-path (OUTPUT_DIRECTORY)
```

#### edit_block_csv.py

時程表を作成するためのGUI。
大会名(e.g. 2024_alljp)とブロック(e.g. A)を入力し、新規作成や編集を行うことができる。

```bash
scripts/edit_block_csv.py
```

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
