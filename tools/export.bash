#!/bin/bash

source .env
URL=$1

mkdir -p data/$COMPETITION_NAME/result

for csv_file in data/$COMPETITION_NAME/original/*.csv
do
    database_name=$(basename "$csv_file" .csv)
    curl $URL/api/export?database_name=$database_name > data/$COMPETITION_NAME/result/$database_name.csv
done
