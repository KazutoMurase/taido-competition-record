# 結果出力

以下のように実行することで、途中結果や最終結果CSVをdata/(大会名)/result以下にエクスポート出来る。

```bash
tools/export.bash (URL)
```

## 最終結果pdf

躰道公式サイトに載せている最終結果は、各競技結果ページにおいて
印刷出力(e.g. Ctrl+Pを押下 => "Save as pdf" を選択し保存)を行い、FTP経由でアップロードする。


## 大会終了後

最終結果CSVをエクスポートし終えたら、data/(大会名)/resultをコミットする。

cloudbuild_$PROJECT_ID.yamlを編集しコミットする(Docker内DB接続に切り替わる)。

- add-cloudsql-instances項目を削除
- PGSQL\_HOST=localhostに変更
- USE\_LOCAL\_DB=1に変更
- SHOW\_HIGHLIGHT\_IN\_TOURNAMENT=0に変更
- USE\_RESULT\_DATA=1に変更
- SHOW\_AWARD\_IN\_PUBLIC=1に変更
- 総合得点のある競技会の場合は SHOW\_TOTAL\_IN\_PUBLIC=1に変更

大会終了後はアクセス頻度が低くなるため、Cloud Runのリソースと課金設定も変更する。

- `--cpu 4`を`--cpu 1`に変更
- `--memory 4Gi`を`--memory 1Gi`に変更
- `--no-cpu-throttling`を`--cpu-throttling`に変更

`--cpu-throttling`では、主にリクエストの処理中とインスタンスの起動・終了中がCPU・メモリの課金対象になる。アクセスがない場合は`--min-instances 0`によってスケールゼロになるため、大会終了後の低頻度アクセスに適している。

Cloud SQLを削除する。

1. 編集 -> インスタンスの削除を防止する　のチェックを外して保存
2. 削除
