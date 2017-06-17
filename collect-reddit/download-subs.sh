#!/bin/bash

# You can find list of all sitemaps here
# https://www.reddit.com/sitemaps/subreddit-sitemaps.xml
> subreddits.txt

for i in {0..15}
do
  curl https://www.reddit.com/sitemaps/subreddit_sitemap/$i.xml | gunzip | grep -Eo "https://www.reddit.com/r/([^<]+)" >> subreddits.txt
done
