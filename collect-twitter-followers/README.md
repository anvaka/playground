For future me:

```
node get-followers-ids.js anvaka

```

node print-ego-graph-ids.js data/anvaka/followers.json > data/anvaka/ids.txt
node convert-ids-to-users.js data/anvaka/ids.txt
node print-ego-graph.js  ./anvaka/followers.json ./anvaka/ids.txt.users > anvaka/graph.dot
