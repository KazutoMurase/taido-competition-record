# 開発環境構築

## 必要な環境

* Docker

## 手順

以下のコマンドを本レポジトリのルートで実行しビルドする。

```bash
docker build -t taido-competition-record .
```

出来たイメージを使ってコンテナを立ち上げる。

```bash
docker-compose up
```

ポート被りが無ければ、http://localhost:3000 でアクセスできる。
ポート番号は .env の PORT で指定できる。

.env の COMPETITION_NAME を変更することで、コンテナを立ち上げた際にDBにinsertするデータを変更できる。
COMPETITION_NAME には data/ 直下のディレクトリ名を指定する。
