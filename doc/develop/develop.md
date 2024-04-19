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
