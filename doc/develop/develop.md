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
docker run --net host --volume `pwd`:/ws -it taido-competition-record:latest bash
```

コンテナ内部で以下を実行し、データベースとキャッシュサーバを構築する。

```bash
useradd test_user
echo 'test_user:test_pass' | chpasswd
/etc/init.d/postgresql start
sudo -u postgres psql -t -c "create user test_user with password 'test_pass' login superuser createdb"
sudo -u test_user createdb taido_record
cd /ws/data/2023 && sudo -u test_user psql -d taido_record < generate_tables.sql

systemctl start redis-server.service
```

続けてコンテナ内部で以下を実行することで、開発用Webサーバが立ち上がる。

```bash
npm run dev
```

ポート被りが無ければ、http://localhost:3000 でアクセスできる。
