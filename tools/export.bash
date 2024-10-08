#!/bin/bash

mkdir -p export

source .env
URL=$1

for csv_file in data/$COMPETITION_NAME/*.csv
do
    database_name=$(basename "$csv_file" .csv)
    curl $URL/api/export?database_name=$database_name > export/$database_name.csv
done
