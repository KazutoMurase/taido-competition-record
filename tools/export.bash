#!/bin/bash

mkdir -p data/$COMPETITION_NAME/result

source .env
URL=$1

for csv_file in data/$COMPETITION_NAME/original/*.csv
do
    database_name=$(basename "$csv_file" .csv)
    curl $URL/api/export?database_name=$database_name > data/$COMPETITION_NAME/result/$database_name.csv
done
