#!/bin/bash

OUT_TABLE_NAME=github_watch.reddit_comments_2018

extract_filtered_posters_sql=`cat extract_filtered_posters.sql`
echo "executing" $extract_filtered_posters_sql


bq query --replace=true --use_legacy_sql=false --allow_large_results --destination_table=$OUT_TABLE_NAME "$extract_filtered_posters_sql"
