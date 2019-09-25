<template>
  <div>
    <h3>{{time}}</h3>
    <ul>
      <li v-for="post in posts">
        <span>{{post.score}}</span>
        <a :href='post.permalink'>
          {{post.title}}
        </a>  
        <span>{{post.createdStr}}</span>
        <pre>{{post.predictions}}</pre>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  props: ['predictor'],
  data() {
    return {
      time: new Date(),
      posts: []
    }
  },
  mounted() {
    fetch('https://www.reddit.com/r/dataisbeautiful.json')
      .then(x => x.json())
      .then(x => {
        let now = new Date();
        let posts = x.data.children.map(p => {
          p = p.data;
          let created = new Date(p.created_utc * 1000);
          let elapsed = (now - created);
          let band = Math.round(elapsed/1000/60/5);
          return {
            score: p.score,
            created,
            permalink: 'https://www.reddit.com' + p.permalink,
            title: p.title,
            band,
            createdStr: `${Math.round(100*band * 5 / 60)/100} hours ago`
          }
        }).filter(x => {
          return (now - x.created) < 24 * 60 * 60 * 1000
        });

        posts.forEach(post => {
          let x = post.score;
          let time = new Date(post.created);
          time.setMinutes(post.created.getMinutes() + 285 * 5, 0);
          const predictions = []
          let idx = 287;

          const stats = window.predictor.predictScore(x, post.band, idx);
          const value = time.toLocaleTimeString() + ': ' + `(${stats.q1}, ${stats.mean}, ${stats.q3})`
          post.predictions = [
            value
          ].join('\n');
          // model.map((coeff, idx) => {
          //   let time = new Date(offset);
          //   time.setMinutes(time.getMinutes() + (idx + 1) * 5);
          //   return time.toLocaleTimeString() + ' - ' + this.predictor.predictScore(x, post.band, idx)
          // }).join('\n');
        })
        this.posts = posts;
      })
  }
}
</script>