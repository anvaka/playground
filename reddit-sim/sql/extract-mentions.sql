-- An easier way to get all mentions of other subreddits from bigquery
-- https://bigquery.cloud.google.com/table/fh-bigquery:reddit_comments.2017_11
SELECT
  COUNT(mention) c, 
  mention,
  subreddit
FROM (
  SELECT
    REGEXP_EXTRACT(body, r'/r/(\w+)') AS mention,
    subreddit
  FROM
    `fh-bigquery.reddit_comments.2017_*`
    where author not in (
SELECT author FROM `fh-bigquery.reddit_comments.2017_11`
where lower(author) not like '%bot%'
group by author
having count(author) > 1634
    ))
WHERE
  mention IS NOT NULL
  AND LOWER(mention) <> LOWER(subreddit)
  and lower(mention) not like '%bot%'
GROUP BY
  mention,
  subreddit
ORDER BY
  c DESC