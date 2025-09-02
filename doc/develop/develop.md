# 開発環境構築

## 必要な環境

* Docker
* Git

## 手順

以下の手順は本レポジトリのルートで実行する想定で記載している。

dataを取得する。
```bash
git submodule update --init --recursive
```

コンテナを立ち上げる(最初、イメージがローカルに存在しない場合はDockerレジストリから取得される)。

```bash
docker compose up
```

(Optional) 自前でイメージをビルドし使ってもよい。

```bash
docker build -t ghcr.io/kazutomurase/taido-competition-record .
```

ポート被りが無ければ、http://localhost:3000 でアクセスできる。
ポート番号は .env の PORT で指定できる。

.env の COMPETITION_NAME を変更することで、コンテナを立ち上げた際にDBにinsertするデータを変更できる。
COMPETITION_NAME には data/ 直下のディレクトリ名を指定する。
