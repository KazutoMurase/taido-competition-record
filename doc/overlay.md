# 配信用の現在試合表示

OBSなどのブラウザソースで、コートごとの現在試合を文字列として表示できます。
背景は透明で、表示内容は10秒ごとに自動更新されます。

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

## ライブ配信ページ

Cloud Build用の `.env` にYouTubeの動画IDを設定すると、公開ページにライブ配信への導線が表示されます。

```text
YOUTUBE_VIDEO_ID_A=xxxxxxxxxxx
YOUTUBE_VIDEO_ID_B=yyyyyyyyyyy
YOUTUBE_VIDEO_ID_C=zzzzzzzzzzz
YOUTUBE_VIDEO_ID_D=aaaaaaaaaaa
YOUTUBE_VIDEO_ID_E=bbbbbbbbbbb
YOUTUBE_VIDEO_ID_F=ccccccccccc
```

未設定のコートは配信一覧に表示されません。すべて未設定の場合は、トップページ、時程表、競技結果にライブ配信へのリンクを表示しません。競技結果のリンクは印刷時にも表示されません。
