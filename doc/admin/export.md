# 結果出力

## 最終結果pdf

躰道公式サイトに載せている最終結果は、各競技結果ページにおいて
印刷出力(e.g. Ctrl+Pを押下 => "Save as pdf" を選択し保存)を行い、FTP経由でアップロードする。

## 各競技の入賞者

褒賞授与や、総合得点の計算などは現在はエクセルベースで行っており、その計算には
各種目毎の1~4位の選手/団体のIDをエクセルに入力する必要がある。

その情報は以下のようにAPIを叩くことで取得することができる。

```bash
# eg. EVENT_NAME=(hokei_man|hokei_woman|zissen_man|zissen_woman|hokei_sonen|dantai_zissen_man|dantai_zissen_woman)
curl http://(SERVER_NAME)/api/get_winners?event_name=(EVENT_NAME) | jq
```
