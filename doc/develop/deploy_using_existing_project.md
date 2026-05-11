# GCP環境へのデプロイ方法(既存のプロジェクトを使いまわす場合)

"Cloud SQLを利用する場合"(本番直前)と"ローカルのDBを利用する場合"(本番より数日以上前にデプロイの確認をするとき及び大会終了後)とで若干必要な手順が異なることに注意。

## 必要な前準備

- Google Cloud CLIのインストール
- GCPアカウントへのブラウザ上でのログイン・本人確認
   - ※Googleアカウントの本人確認を複数回実施しなくて済むよう、まずブラウザでコンソールにログインし、CLIでの認証にはコンソールで発行した鍵を用いる形とする

## 1. Google Cloudプロジェクトの設定
- ブラウザからGCPコンソールにログインし、新しいプロジェクトを作成
   - ここでは仮にプロジェクトIDを`taido-event`とする
- 作成後、gcloud CLIからプロジェクトを指定する

```bash
gcloud config set project taido-event
```

## 2. サービスアカウントの認証情報の取得
### (1) サービスアカウントのJSON鍵をダウンロード
- GCPコンソール(Webサイト)の`IAMと管理`>`サービスアカウント`で使用しているアカウントの詳細から`鍵`タブ を選び、存在するキー(jsonファイル)をダウンロードする。

- ダウンロードされたjsonファイルのファイル名をkey.jsonに変えて、リポジトリルートに移しておく
```bash
mv /path-to-your-download-dir/your-file-name.json ./key.json
```

### (2) gcloud CLIで認証

```bash
gcloud auth activate-service-account --key-file=key.json
```

## 3. Cloud SQL インスタンスの作成(Cloud SQLを利用する場合のみ必要)
GCPコンソールからCloud SQLを開き、インスタンスを作成する
- エディション: Enterprise（サンドボックス）
- バージョン: PostgreSQL 17
- インスタンスID: postgres-instance
    - 任意に設定可能。ここで設定したインスタンスIDを以後`$CLOUDSQL_INSTANCE_ID`とする
- パスワード: postgres
- リージョン: asia-northeast1
- 可用性: シングルゾーン

## 4. CloudSQLの初期テーブル作成(Cloud SQLを利用する場合のみ必要)
この手順に入る前に[大会準備](./preparation.md)のDB用csvファイル作成は完了していることを前提とする。

- ローカルにpsqlをインストール

例: Ubuntu22.04
```bash
sudo apt install postgresql-client-common postgresql-client-14
```

- Cloud SQL Auth Proxy(Cloud SQLインスタンスへの接続のための公式バイナリ)をダウンロードする

    - 参考：[Cloud SQL Auth Proxy をダウンロードしてインストールする](https://cloud.google.com/sql/docs/postgres/sql-proxy?hl=ja#install)

```bash
chmod +x cloud-sql-proxy

# プロキシ起動
./cloud-sql-proxy --credentials-file=key.json $PROJECT_ID:$REGION:$INSTANCE_NAME &

export PGPASSWORD=postgres
cd ./data/$COMPETITION_NAME/static
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -f generate_tables.sql
cd ../original
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -f generate_tables.sql
cd ../../test/static
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -f generate_tables.sql
cd ../original
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -f generate_tables.sql
```

## 5. taido-competition-recordレポジトリ、taido-competition-deployレポジトリでsubmoduleの更新(ローカルのDBを利用する場合のみ必要だが、基本的にやっておくべき)
"taido-competition-data" < "taido-competition-record" < "taido-competition-deploy"というgit submoduleの入れ子構造になっているので、この後の手順でtaido-competition-deployが新たな大会データを参照するためにはそれぞれでsubmoduleを更新しておく必要がある。

つまり、以下の順で更新をする。
- taido-competition-record内のtaido-competition-data submoduleを最新にしてpushする。
- taido-competition-deploy内のtaido-competition-record submoduleを最新にしてpushする。(この後のcloudbuild.yamlと一緒にpushするのでもよい)

## 6. cloudbuild.yamlファイルの更新
GitHubの[taido-competition-deploy](https://github.com/KazutoMurase/taido-competition-deploy)レポジトリにプロジェクトに対応するyamlファイルがあるはずなので、その内容を修正してコミットする。

プロジェクトが`taido-event`であれば[このファイル](https://github.com/KazutoMurase/taido-competition-deploy/blob/main/cloudbuild_taido-event.yaml)になる。

変更内容は以下を参考にすること。
- ローカルのDBを利用する場合(本番より数日以上前にデプロイの確認をするとき): [リンク](https://github.com/KazutoMurase/taido-competition-deploy/pull/1/files)
- Cloud SQLを使う場合(本番直前): [リンク](https://github.com/KazutoMurase/taido-competition-deploy/pull/2/files)
- ローカルのDBを利用する場合(大会終了後): [リンク](https://github.com/KazutoMurase/taido-competition-deploy/pull/3/files)
  - この場合はresultも同時にpushする必要があるが、その作成方法については[結果出力](../admin/export.md)を参照

# その他参考情報
## cloudbuild.yamlの主要な変数の意味
- COMPETITION_NAME: data以下に作る大会用のフォルダ名と対応
- PGSQL_HOST: postgresqlのデータベースを設置するアドレス
- PRODUCTION: 0にするとデバッグ機能をつけてページをビルド、1にすると本番用にビルド
- PRODUCTION_TEST: 1にするとadminで入力した結果を公開ページには見せないなど、デプロイしたサイトでも結果入力のテストができる状況になる
- USE_LOCAL_DB: 1でローカル(手元でdocker compose upするときは手元のPC、デプロイした時はCloud Runのインスタンス)のデータベースを使う
- SHOW_HIGHLIGHT_IN_TOURNAMENT: 1にすると次の試合がトーナメント上で強調表示される
- SHOW_TOTAL_IN_ADMIN: 総合得点表をadminで表示
- SHOW_TOTAL_IN_PUBLIC: 総合得点表を公開ページで表示
- SHOW_AWARD_IN_PUBLIC: 優秀選手賞等の褒章受賞者を公開ページで表示
- USE_RESULT_DATA: data以下のoriginalでなくresultフォルダにあるデータを使用(USE_LOCAL_DB=1の時のみ有効)

## ローカルのDBを利用してデプロイした際の挙動について
ローカルのDBを利用したデプロイで事前に挙動を確認した際、しばらくサイトを触らないとDBの情報がリセットされて大会の進行が初期状態に戻る。

cloudbuild.yamlで`--no-cpu-throttling`を指定しているのでアクセスが無い時にCloud Runのインスタンスが一度シャットダウンするために起きる。

本番だと常にアクセスがあるのと、Cloud SQLでデータを保持するのでこのようなリセットは起きない。
