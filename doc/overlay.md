# 配信用の現在試合表示

OBSなどのブラウザソースで、コートごとの現在試合を文字列として表示できます。
背景は透明で、表示内容は3秒ごとに自動更新されます。

## 表示用URL

URL末尾にはコートを表す英字を小文字で指定します。

```text
https://大会サイト/overlay/a
https://大会サイト/overlay/b
```

表示形式は次のとおりです。

```text
競技名｜第12試合｜選手名 vs 選手名
```

団体法形・展開では、選手名部分に現在演技中の団体名を表示します。
一時的に通信できなくなった場合は、最後に取得できた表示を維持します。

## API

表示ページは次の読み取り専用APIを利用します。

```text
GET /api/overlay/current-match?court=a
```

主なレスポンス項目は以下です。

```json
{
  "active": true,
  "court": "a",
  "court_name": "Aコート",
  "match_number": 12,
  "competition_name": "男子個人実戦",
  "participant_names": ["山田 太郎", "佐藤 次郎"],
  "display_text": "男子個人実戦｜第12試合｜山田 太郎 vs 佐藤 次郎"
}
```
