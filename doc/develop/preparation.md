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
