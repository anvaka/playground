#!/bin/bash

OUT_TABLE_NAME=github_watch.reddit_comments_2018
EXPORT_BUCKET=gh_watch

OUT_FILE_NAME=$OUT_TABLE_NAME.csv
ARCHIVE_NAME=$OUT_FILE_NAME.gz
BUCKET_NAME=gs://$EXPORT_BUCKET/$ARCHIVE_NAME

extract_filtered_posters_sql=`cat extract_filtered_posters.sql`
echo "executing" $extract_filtered_posters_sql
bq query --replace=true --use_legacy_sql=false --allow_large_results --destination_table=$OUT_TABLE_NAME "$extract_filtered_posters_sql"

echo "Exporting $OUT_TABLE_NAME into $BUCKET_NAME"
bq extract --noprint_header --compression GZIP "$OUT_TABLE_NAME" $BUCKET_NAME

echo "Downloading $BUCKET_NAME..."
gsutil cp $BUCKET_NAME .

echo "Extracting $ARCHIVE_NAME"
gunzip $ARCHIVE_NAME
