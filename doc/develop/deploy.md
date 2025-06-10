# GCP環境へのデプロイ方法

## 必要な前準備

- Google Cloud CLIのインストール
- GCPアカウントへのブラウザ上でのログイン・本人確認
   - ※Googleアカウントの本人確認を複数回実施しなくて済むよう、まずブラウザでコンソールにログインし、CLIでの認証にはコンソールで発行した鍵を用いる形とする

## 1. Google Cloudプロジェクトの作成
- ブラウザからGCPコンソールにログインし、新しいプロジェクトを作成
   - ここで設定したプロジェクトIDを以後`$PROJECT_ID`とする
- 作成後、gcloud CLIからプロジェクトを指定する

```bash
gcloud config set project PROJECT_ID
```

## 2. サービスアカウントの作成と認証情報の取得
### (1) ブラウザでサービスアカウントを作成 
- GCPコンソールから、`IAMと管理`>`サービスアカウント`>`サービスアカウントを作成`
    - 作成したアカウント名を以後`$SERVICE_ACCOUNT_NAME`とする
- ロール：以下のみ付与
    - Cloud Build 編集者: `roles/cloudbuild.builds.editor`
    - Cloud SQL クライアント: `roles/cloudsql.client`
    - Artifact Registry 書き込み: `roles/artifactregistry.writer`
    - Secret Manager シークレット参照: `roles/secretmanager.secretAccessor`
    - Cloud Run 管理者: `roles/run.admin`
    - Service Usage 管理者: `roles/serviceusage.serviceUsageAdmin`

### (2) サービスアカウントのJSON鍵を作成・ダウンロード
- 作成したアカウントの`キー`タブ → `キーを追加`→`新しい鍵を作成`→`JSON`

- ダウンロードされたjsonファイルのファイル名をkey.jsonに変えて、リポジトリルートに移しておく
```bash
mv /path-to-your-download-dir/your-file-name.json ./key.json
```


### (3) gcloud CLIで認証

```bash
gcloud auth activate-service-account --key-file=key.json
```

- 必要なAPIを有効化しておく
```bash
gcloud services enable \
  cloudresourcemanager.googleapis.com \
  run.googleapis.com \
  compute.googleapis.com \
  sqladmin.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  servicenetworking.googleapis.com \
  secretmanager.googleapis.com
```

## 3. Artifact RegistryにDockerリポジトリを作成
GCPコンソールからArtifact Registryを開き、Dockerリポジトリを作成する
- 名前: ar-docker-repo
    - 任意に設定可能。ここで設定したリポジトリ名を以後`$ARTIFACT_REGISTRY_REPO_NAME`とする
- 形式: Docker
- モード: 標準
- ロケーションタイプ: リージョン asia-northeast1
- 説明: 大会名が区別できるように適宜
- 不変のイメージタグ: 有効

## 4. Cloud SQL インスタンスの作成
GCPコンソールからCloud SQLを開き、インスタンスを作成する
- エディション: Enterprise（サンドボックス）
- バージョン: PostgreSQL 17
- インスタンスID: postgres-instance
    - 任意に設定可能。ここで設定したインスタンスIDを以後`$CLOUDSQL_INSTANCE_ID`とする
- パスワード: postgres
- リージョン: asia-northeast1
- 可用性: シングルゾーン

## 5. cloudbuild.yamlファイルの作成
CIにおいて実行する内容を定義するcloudbuild.yamlファイルを作成する。
実行内容は基本的には毎回共通だが、各種リソースのIDなどを埋め込む必要があるため、.envに記載した内容を元にyamlファイルを生成するスクリプトを用意している。

- ./ci/.envに必要な変数を記入して、以下を実行する。
```
./ci/generate-cloudbuild.sh
```

- `cloudbuild_$PROJECT_ID.yaml`というファイルが生成される。

## 6. GitHubとのCloud Build連携

GCPコンソールから`Cloud Build`→プロジェクトを選択 →`リポジトリを接続`→GitHub
- GitHubアカウントをOAuthで接続（リポジトリの管理者レベルの権限が必要、適宜依頼する）
- 対象のリポジトリを選択して登録

(参考) [ビルドトリガーの作成と管理 | Cloud Build Documentation | Google Cloud](https://cloud.google.com/build/docs/automating-builds/create-manage-triggers?hl=ja)

## 7. Cloud Buildトリガーの作成
GCPコンソールを開き、Cloud Buildから接続済みのリポジトリを選んでトリガーを作成する
- 名前: 任意
- リージョン: global
- 説明: 任意
- イベント: ブランチにpushする
- リポジトリサービス: Cloud Buildリポジトリ
- 構成: Cloud Build構成ファイル（yamlまたはjson）
- CloudBuild構成ファイルの場所: `/ci/cloudbuild_$PROJECT_ID.yaml`
- サービスアカウント: 手順2(1)で作成したアカウントを選択

## 8. CloudSQLの初期テーブル作成
```bash
# 手元のデータベース定義ファイルとテスト用ファイルをアップロード
gcloud cloud-shell scp --recurse localhost:data/$COMPETITION_NAME cloudshell:~/
gcloud cloud-shell scp --recurse localhost:data/test

gcloud cloud-shell ssh

gcloud sql connect $CLOUDSQL_INSTANCE_ID --user=postgres --quiet < localfile.sql
cd ./data/$COMPETITION_NAME
gcloud sql connect $CLOUDSQL_INSTANCE_ID –user=postgres --quiet < generate_tables.sql
cd ../test
gcloud sql connect $CLOUDSQL_INSTANCE_ID –user=postgres --quiet < generate_tables.sql
```

## 9. Cloud Run公開アクセスの許可
```bash
# Cloud Run サービスの初回デプロイ（この時点では失敗してもOK）
gcloud run deploy $IMAGE_NAME \
  --image=asia-northeast1-docker.pkg.dev/$PROJECT_ID/ar-docker-repo/$IMAGE_NAME \
  --region=asia-northeast1 \
  --platform=managed \
  --allow-unauthenticated

# 明示的に allUsers に roles/run.invoker を付与
gcloud beta run services add-iam-policy-binding $IMAGE_NAME \
  --region=asia-northeast1 \
  --member=allUsers \
  --role=roles/run.invoker
```

(参考) [公開（未認証）アクセスを許可する | Cloud Run Documentation | Google Cloud](https://cloud.google.com/run/docs/authenticating/public?hl=ja#gcloud)

## オプショナル. Memorystoreの利用（必要に応じて）
MemorystoreはredisをCloud側で立ててくれるサービス。Cloud Runのインスタンス数を2個以上にスケーリングする可能性がある場合は使う必要がある([参考](https://github.com/KazutoMurase/taido-competition-record/issues/125))が、これまでの運用実績では必要な場面は無し。

- Cloud Runスケーリングが必要な場合に構成
- Cloud Runの「接続」→ Memorystoreを追加
