# GCP環境へのデプロイ方法(既存のプロジェクト内で別のサイトを立てる場合)

例えば、"社会人大会のプログラム公開にhttps://taido-competition-record-<番号>.asia-northeast1.run.appのサイトを使っているが、学生大会トーナメント編集用に別のサイトを立てたい"という時にこの手順を使う。
[1からデプロイする手順](./develop/deploy.md)に従って別のGoogle Cloudのprojectを作ることも原理的には可能だが、GCPのサイトからGitHubのレポジトリにリンクする際にGitHubのレポジトリ所有者の認証が必要となってしまう。
1からデプロイする手順の一部だけを実行するイメージ。

## 必要な前準備

- Google Cloud CLIのインストール
- GCPアカウントへのブラウザ上でのログイン・本人確認
   - ※Googleアカウントの本人確認を複数回実施しなくて済むよう、まずブラウザでコンソールにログインし、CLIでの認証にはコンソールで発行した鍵を用いる形とする

## 1. Google Cloudプロジェクトの設定
- gcloud CLIから既存のプロジェクト(ここでは仮に`taido-event`とする)を指定する

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

## 3. Artifact RegistryにDockerリポジトリを作成
GCPコンソールからArtifact Registryを開き、新たなDockerリポジトリを作成する
- 名前: ar-docker-repo-2
    - 任意に設定可能。ここで設定したリポジトリ名を以後`$ARTIFACT_REGISTRY_REPO_NAME`とする
- 形式: Docker
- モード: 標準
- ロケーションタイプ: リージョン asia-northeast1
- 説明: 大会名が区別できるように適宜
- 不変のイメージタグ: 無効

## 4. Cloud SQL インスタンスの作成(Cloud SQLを利用する場合のみ必要)
GCPコンソールからCloud SQLを開き、新たなインスタンスを作成する
- エディション: Enterprise（サンドボックス）
- バージョン: PostgreSQL 17
- インスタンスID: postgres-instance
    - 任意に設定可能。ここで設定したインスタンスIDを以後`$CLOUDSQL_INSTANCE_ID`とする
- パスワード: postgres
    - パスワードポリシーを有効にする のチェックを外す必要がある
- リージョン: asia-northeast1
- 可用性: シングルゾーン
- マシンの構成:
    - 汎用-専用コア
    - 2vCPU、8GiB
- ストレージ:
    - 種類: SSD
    - ストレージ容量: 10GB


トーナメント編集用など、継続利用したいものの値段を抑えたい場合は以下
- エディション: Enterprise（サンドボックス）
- バージョン: PostgresSQL 15
- インスタンスID: postgres-instance
    - 任意に設定可能。ここで設定したインスタンスIDを以後`$CLOUDSQL_INSTANCE_ID`とする
- パスワード: postgres
    - パスワードポリシーを有効にする のチェックを外す必要がある
- リージョン: us-central1 (アイオワ)
- 可用性: シングルゾーン
- マシンの構成:
    - 汎用-共有コア
    - 1vCPU、0.614GB (db-f1-micro)
- ストレージ
    - 種類: HDD
    - ストレージ容量: 10GB
- フラグとパラメータ
    - shared_buffers: 13107
    - max_connections: 20

## 5. cloudbuild.yamlファイルの作成
CIにおいて実行する内容を定義するyamlファイルを作成する。Cloud Buildの実行時にこのファイルを参照させる。
各種リソースのIDなどを埋め込む必要があるため、.envに記載した内容を元にyamlファイルを生成するスクリプトを用意している。

- ./ci/.envに必要な変数を記入して、以下を実行する。
```
cd ci && ./generate-cloudbuild.py
```

## 6. Cloud Buildトリガーの作成
GCPコンソールを開き、Cloud Buildから接続済みのリポジトリを選んでトリガーを作成する
- 名前: 任意
- リージョン: global
- 説明: 任意
- イベント: ブランチにpushする
- リポジトリサービス: Cloud Buildリポジトリ
- 構成: Cloud Build構成ファイル（yamlまたはjson）
- CloudBuild構成ファイルの場所: `/<手順5で作成したyamlファイルの名前>`
- サービスアカウント: 手順2(1)で作成したアカウントを選択

