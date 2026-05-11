# ユーティリティ

以下大会準備や大会中に使える便利URLやAPIについて記載する。

## データベース初期化

(URL)/admin/danger_zone にアクセスし"データベース初期化"ボタンを押下することで、
その名の通りデータベースを全て初期化できる。


## キャッシュリセット

データベースを更新したものの、古いキャシュが参照されてしまってる場合は以下を実行、
またはブラウザでアクセスする。

```bash
curl "(URL)/api/reset_cache"
```

## イベント順変更

イベント順を入れ替えたい時(例: Aコートの競技順10と11を入替)は以下を実行、
またはブラウザでアクセスする。

```bash
curl "(URL)/api/change_event_order?block=a&target_schedule_id=10"
```

## 現在スケジュール位置変更

現在のスケジュールの位置を変更したい時(例: Aコートの現在競技を5番のものにしたい)は以下を実行、
またはブラウザでアクセスする。

```bash
curl "(URL)/api/update_current_schedule?block=a&schedule_id=5"
```

## 褒章更新

褒章に関して、選手名、または選手IDを以下のように指定し、更新を行うことができる。

```bash
# 選手名で更新 (ただし他大会と人物が重複していることもあるので、対象の大会データディレクトリ以下で実行するとよい)
curl "http://localhost:3000/api/record_awards?id=1&player_id=$(git grep "選手名" | cut -d":" -f2 | cut -d"," -f1)"
# 選手IDで更新
curl "(URL)/api/record_awards?id=1&player_id=1"
```

## データベース更新

一般にデータベースを更新する方法が用意されている。

例: block_aテーブルにおけるid=1のplayers_checked要素を1に更新
```bash
curl "(URL)/api/update_db?id=1&table_name=block_a&key=players_checked&value=1"
```
