# 現在競技の自動進行

Playwrightを使用して、指定コートの現在競技を点呼から記録まで自動で進める。
現在競技に残っている全試合を記録し終わり、次の競技へ移動したことを確認すると終了する。

このツールは画面を確認するだけのテストではなく、ローカル環境の大会データを実際に更新する。
実行前に、`.env`の`COMPETITION_NAME`と対象コートが正しいことを必ず確認する。

## 構成

通常のアプリは従来どおり`docker-compose.yaml`で起動する。
Playwrightは`docker-compose.playwright.yaml`で定義した一時コンテナから、Dockerホストに公開されたアプリのポートへアクセスする。

Playwrightコンテナはコマンドを実行したときだけ起動し、終了後に削除される。
通常の`docker compose up`ではPlaywrightコンテナは起動しない。
ホストからは`http://localhost:3000`、Playwrightコンテナからは同じ公開ポートを`http://host.docker.internal:3000`で参照する。

## 前提条件

- DockerとDocker Composeが利用できること
- リポジトリルートに有効な`.env`があること
- `docker compose up`で`app`サービスが起動していること
- 管理画面で対象コートの現在競技が表示されていること

PlaywrightやChromiumをホストへインストールする必要はない。
初回実行時に、Playwright公式イメージの取得と専用イメージのビルドが行われる。

## 基本的な使い方

ターミナル1でアプリを起動する。

```bash
docker compose up
```

別のターミナルで、リポジトリルートから対象コートを指定して実行する。
以下はAコートを進める例である。

```bash
tools/advance-schedule.bash A
```

コマンドを実行するとすぐに自動進行を開始する。実行中は、対象競技、試合番号、登録した結果がログへ表示される。

```text
[advance-schedule] court=A
[advance-schedule] current schedule=1, game=1, competition=男子法形
[advance-schedule] attendance completed
[advance-schedule] recorded game=1, result=赤旗2本
[advance-schedule] recorded game=2, result=赤旗1本
[advance-schedule] completed 男子法形; next schedule=2
```

## 複数コートを順番に進める

コートを複数指定すると、引数に書いた順番で現在競技を1つずつ進める。

```bash
tools/advance-schedule.bash A B A C B
```

上の例では、Aコート、Bコート、もう一度Aコート、Cコート、もう一度Bコートの順に実行する。
各ステップは直列に処理され、途中で失敗した場合はその場で停止する。

Playwright専用イメージのビルドはコマンドの開始時に1回だけ行う。

## 計画ファイルを使う

長い実行順はテキストファイルへ記述できる。

```bash
tools/advance-schedule.bash --file e2e/advance-plan.txt
```

計画ファイルには、1行につきコートと期待する現在競技IDを記述する。

```text
# court schedule_id
A 1
B 1
A 2
C 1
B 2
```

空行と`#`以降は無視される。サンプルは`e2e/advance-plan.example.txt`にある。

競技IDは省略できる。

```text
A
B
A
```

ただし、全自動実行では競技IDを指定することを推奨する。途中で失敗して同じファイルを再実行した場合に、完了済みのステップを安全にスキップできるためである。

期待する競技IDを指定した場合の動作は次のとおり。

| 現在競技ID | 動作 |
| --- | --- |
| 期待値と同じ | 現在競技を実行する |
| 期待値より大きい | 完了済みとしてスキップする |
| 期待値より小さい | 計画より遅れているためエラーで停止する |

例えば`A 1`と`B 1`が完了した後、`A 2`の途中で失敗しても、同じ計画ファイルを再実行すると最初の2行はスキップされ、Aコートの競技ID 2から再開する。

## 自動処理の内容

1. `/admin`へBasic認証付きでアクセスする。
2. 指定されたコートを選択する。
3. 開始時点の現在競技IDと試合番号を保存する。
4. 点呼が未完了なら、全選手または全団体を「点呼完了」にして決定する。
5. 現在の試合にランダムな結果を入力して決定する。
6. 結果表示用APIから保存値を読み戻し、送信した値と一致することを確認する。
7. 同じ競技に試合が残っている間、記録を繰り返す。
8. 団体法形・展開の予選の場合は「結果確定」を押し、決勝進出団体を反映する。
9. 現在競技IDが次のIDへ変わったことを確認して終了する。

記録APIが成功して進行位置が移動しただけでは成功扱いにしない。トーナメント競技は旗判定、採点競技は各得点・時間・減点を読み戻して照合する。保存値を確認できない場合は、そのステップを失敗として停止する。

計画ファイルの再開時に団体法形・展開の予選が既に完了済みだった場合も、「結果確定」を押してからそのステップをスキップする。「結果確定」は同じ予選に対して再実行しても同じ決勝進出団体を反映する。

競技種別ごとの入力内容は次のとおり。

| 競技種別 | 自動入力 |
| --- | --- |
| 個人・団体法形のトーナメント | 赤旗0〜3本 |
| 個人・団体実戦 | 赤勝利または白勝利 |
| 団体法形 | 主審・副審得点と減点 |
| 展開 | 時間、主審・副審得点、減点 |

点呼済み、または競技の途中まで記録済みの場合は、その状態から残りの試合だけを処理する。

## 実行結果と障害調査

失敗時のスクリーンショット、trace、video、HTMLレポートは`e2e/artifacts/`以下へ出力される。
このディレクトリはGit管理対象外である。

実行ごと、ステップごとに別のディレクトリへ保存される。主な確認先は次のとおり。

```text
e2e/artifacts/YYYYMMDD-HHMMSS-PID/
├── 001-A/
│   ├── report/
│   └── test-results/
└── 002-B/
    ├── report/
    └── test-results/
```

HTMLレポートは各ステップの`report/index.html`をブラウザで開いて確認できる。

## 手動でComposeコマンドを実行する

通常は`tools/advance-schedule.bash`を使用する。ツールを介さず実行する場合は、対象コートと確認値の両方を指定する。

```bash
mkdir -p e2e/artifacts/manual-A

COURT=A \
CONFIRM_ADVANCE=A \
PLAYWRIGHT_UID="$(id -u)" \
PLAYWRIGHT_GID="$(id -g)" \
ARTIFACT_SUBDIR=manual-A \
docker compose \
  -f docker-compose.yaml \
  -f docker-compose.playwright.yaml \
  run \
  --rm \
  --no-deps \
  playwright
```

手動実行の前にイメージをビルドしていない場合は、同じComposeファイル指定で`build playwright`を実行する。
`--no-deps`を指定するため、起動済みの`app`サービスは再作成されない。

## 安全上の制限

- 接続先は`host.docker.internal`に公開されたローカルアプリだけに制限している。
- PlaywrightコンテナからホストのDockerソケットへはアクセスできない。
- テストソースと設定ファイルは読み取り専用でマウントする。
- テストは1ワーカーで実行し、同じコートを並列更新しない。
- 対象コートは英字1文字で明示的に指定する。
- 開始時点の次の競技へ進むと終了し、さらに次の競技までは処理しない。

複数のターミナルから同じコートへ同時実行しないこと。また、本番環境やCloud Runを対象にする用途には使用しないこと。
