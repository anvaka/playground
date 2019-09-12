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
          let model = bands[post.band];
          if (!model) return;
          let x = post.score;
          let x_2 = x * x;
          let offset = new Date(post.created).setMinutes(post.created.getMinutes() + post.band * 5, 0);
          post.predictions = model.map((coeff, idx) => {
            let time = new Date(offset);
            time.setMinutes(time.getMinutes() + (idx + 1) * 5);
            return time.toLocaleTimeString() + ' - ' + Math.round(coeff[0] + coeff[1] * x + coeff[2] * x_2);
          }).join('\n');
        })
        this.posts = posts;
      })
  }
}
</script>