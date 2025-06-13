#!/bin/bash

set -e

# .envファイルを読み込む
if [ -f .env ]; then
  set -o allexport
  source .env
  set +o allexport
else
  echo ".env file not found"
  exit 1
fi

TEMPLATE="cloudbuild_template.yaml"
OUTPUT="cloudbuild_${PROJECT_ID}.yaml"

if [ ! -f "$TEMPLATE" ]; then
  echo "$TEMPLATE not found"
  exit 1
fi

# 出力用ファイルを初期化
cp "$TEMPLATE" "$OUTPUT"

# .env に定義されたすべての変数について置換
while read -r line; do
  if [[ $line =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
    key="${line%%=*}"
    val="${line#*=}"
    # remove possible surrounding quotes
    val="${val%\"}"
    val="${val#\"}"
    # 置換($KEY → 値)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|\$$key|$val|g" "$OUTPUT"
    else
      sed -i "s|\$$key|$val|g" "$OUTPUT"
    fi
  fi
done < <(grep -v '^#' .env)

echo "✅ Generated $OUTPUT from $TEMPLATE using .env variables."
