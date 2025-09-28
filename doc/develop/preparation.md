# 大会準備

各大会毎にデータベースを構築する必要がある。

以下実行しスクリプトを利用する為の環境を準備する。

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## トーナメント用DB作成 ##

大会Excelファイルと出力先ディレクトリを入力すると自動で出力してくれる。

```bash
scripts/generate_tournament_db_from_xl.py --file-path (FILE_PATH_TO_EXCEL_FILE) --output-path (OUTPUT_DIRECTORY)
```

時程表を作成するためのGUIを用意している。
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
