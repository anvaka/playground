select author, subreddit, comment_count from (
	SELECT
		author,
		subreddit,
		COUNT(subreddit) AS comment_count,
		COUNT(*) OVER (PARTITION BY author) AS rows_count
	FROM `fh-bigquery.reddit_comments.2018_08`
	WHERE 
		(NOT REGEXP_CONTAINS(author, r'(?i)(deleted)|(bot)|(AutoModerator)')) AND 
		(NOT REGEXP_CONTAINS(subreddit, r'(?i)^u_'))
	GROUP BY
    author,
    subreddit
    ORDER BY
    author ASC
) where rows_count > 1
