<template>
  <div class='map-details'>
    <h3>Hands-On Machine Learning...</h3>
    <h4 class='secondary'>and its related books</h4>
    <a class='accent toggle-button' href="#" v-clap.prevent='toggleDetails'>{{showDetails ? "Hide details" : "Show details"}}</a>
    <div v-if='showDetails'>
      <img src="https://images-na.ssl-images-amazon.com/images/I/51BKMchWqnL._SL160_.jpg" class="cover" width='160px'>
      <p>
        This visualization shows books related to the <a class='accent' href="https://www.amazon.com/Hands-Machine-Learning-Scikit-Learn-TensorFlow/dp/1491962291?SubscriptionId=AKIAIJKR6IY4BV5FKK7A&tag=wwwyasivcom-20&linkCode=xm2&camp=2025&creative=165953&creativeASIN=1491962291">Hands-On Machine Learning with Scikit-Learn and TensorFlow</a>
        book, written by Aurélien Géron.
      </p>
      <h5>How was this chart made?</h5>
      <p>
        Starting from the <a class='accent' href="https://www.amazon.com/Hands-Machine-Learning-Scikit-Learn-TensorFlow/dp/1491962291?SubscriptionId=AKIAIJKR6IY4BV5FKK7A&tag=wwwyasivcom-20&linkCode=xm2&camp=2025&creative=165953&creativeASIN=1491962291"> "Hands-On ML"</a> book, I collected from Amazon 10 books that are most often bought together.
        Then, for each found book, I collected 5 more books that are most often bought together withe them. Finally,
        I did this one more time for each found book.
      </p>
      <p>
        After that, I ran my own algorithm to make a city from these books:
      </p>
      <img src="https://i.imgur.com/a3Gjzgp.png" alt="Final grid result" width='300px'>
      <p>
        The algorithm tends to group similar books into districts. You can find advanced theoretical
        books like <a href="https://www.amazon.com/Deep-Learning-Adaptive-Computation-Machine/dp/0262035618?SubscriptionId=AKIAIJKR6IY4BV5FKK7A&tag=wwwyasivcom-20&linkCode=xm2&camp=2025&creative=165953&creativeASIN=0262035618" class='accent'>Deep Learning</a>
        and <a class='accent' href="https://www.amazon.com/Probabilistic-Graphical-Models-Principles-Computation/dp/0262013193?SubscriptionId=AKIAIJKR6IY4BV5FKK7A&tag=wwwyasivcom-20&linkCode=xm2&camp=2025&creative=165953&creativeASIN=0262013193">Probabilistic Graphical Models</a>
        clustered together in the North West. "For Dummies" series clustered on the East.
        North regions are taken by financial machine learning, and South is occupied by Python/Data Science books.
      </p>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      showDetails: false
    }
  },
  methods: {
    toggleDetails() {
      this.showDetails = !this.showDetails;
    }
  }
}
</script>


<style lang="stylus">
@import './variables.styl'

.map-details
  padding: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2), 0 -1px 0px rgba(0,0,0,0.02);
  background: #fff;
  position: fixed;
  top: 8px;
  left: 6px;
  width: 400px;

  .toggle-button 
    position: absolute 
    top: 8px
    right: 8px
    font-size: 12px;

  img {
    width: 100%;
    margin: 0 auto;
  }

  img.cover {
    margin: 0 18px 8px 0;
    width: 122px;
    height: 160px;
    float: left;

  }

  h3, h4 
    margin: 0
    font-size: 18px;
    font-weight: normal;
  
  h5
    font-weight: normal;
    font-size: 18px;
    margin: 0;
  
  h4
    font-size: 14px;
  
  p
    font-size: 14px;

@media (max-width: $screen-sm-min)
  .map-details
    top: 0
    left: 0
    width: 100%;

</style>

