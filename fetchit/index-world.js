var states = getStates()//.slice(0, 1);

new Vue({
  el: '#app-6',
  data: {
    results: {}
  },
  ready: function() {
    var self = this;
    var questions = {
      'why-is': {
      display: "Why is [country name] ... ?",
      query: function(x) {return "why is " + x + " ";}
    }, 'why-does': {
      display: "Why does [country name] ... ?",
      query: function(x) {return "why does " + x + " ";}
    }, 'can': {
      display: "Can [country name] ... ?",
      query: function(x) {return "can " + x + " ";}
    }, 'what-if': {
      display: "What if [country name] ... ?",
      query: function(x) {return "what if " + x + " ";}
    }, 'does': {
      display: "Does [country name] ... ?",
      query: function(x) {return "does " + x + " ";}
    }, 'how': {
      display: "How [country name] ... ?",
      query: function(x) {return "how " + x + " ";}
    }, 'is-not': {
      display: "[country name] is not ...",
      query: function(x) {return x + " is not ";}
    }, 'when-will': {
      display: "When will [country name] ...",
      query: function(x) {return "when will " + x;}
    }
    };

    window.out = self.results;
    console.log(window.out);
    Object.keys(questions).forEach(function(questionId) {
      var q = questions[questionId];
      var out = {
        display: q.display,
        records: []
      };

      self.results[questionId] = out;

      states.forEach(function(state) {
        var query = q.query(state);
        find(query, function(response) {
          out.query = query;
          out.records.push({
            suggestions: response.suggestions,
            state: state
          });
        });
      })
    })
  }
})

function find(query, callback) {
  $.ajax({
    url: "https://www.google.com/complete/search?client=hp&hl=en&sugexp=msedr&gs_rn=62&gs_ri=hp&cp=1&gs_id=9c&xhr=t&q=" + encodeURIComponent(query),
    jsonp: "callback",
    dataType: "jsonp",
    success: function( response ) {
      var suggestions = (response[1] || []).map(function(x) {
        return x[0];
      }).filter(byFullPhrase);
      callback({
        suggestions: suggestions,
        query: query
      });
    }
  });
}
function byFullPhrase(x) {
  // we dont want half-complete answers
  return x.match(/<b>[^\s]/) === null;
}

function getStates() {
  return ["Afghanistan","Angola","Albania","United Arab Emirates","Argentina","Armenia","Antarctica","French Southern and Antarctic Lands","Australia","Austria","Azerbaijan","Burundi","Belgium","Benin","Burkina Faso","Bangladesh","Bulgaria","The Bahamas","Bosnia and Herzegovina","Belarus","Belize","Bolivia","Brazil","Brunei","Bhutan","Botswana","Central African Republic","Canada","Switzerland","Chile","China","Ivory Coast","Cameroon","Democratic Republic of the Congo","Republic of the Congo","Colombia","Costa Rica","Cuba","Northern Cyprus","Cyprus","Czech Republic","Germany","Djibouti","Denmark","Dominican Republic","Algeria","Ecuador","Egypt","Eritrea","Spain","Estonia","Ethiopia","Finland","Fiji","Falkland Islands","France","Gabon","United Kingdom","Georgia","Ghana","Guinea","Gambia","Guinea Bissau","Equatorial Guinea","Greece","Greenland","Guatemala","Guyana","Honduras","Croatia","Haiti","Hungary","Indonesia","India","Ireland","Iran","Iraq","Iceland","Israel","Italy","Jamaica","Jordan","Japan","Kazakhstan","Kenya","Kyrgyzstan","Cambodia","South Korea","Kosovo","Kuwait","Laos","Lebanon","Liberia","Libya","Sri Lanka","Lesotho","Lithuania","Luxembourg","Latvia","Morocco","Moldova","Madagascar","Mexico","Macedonia","Mali","Myanmar","Montenegro","Mongolia","Mozambique","Mauritania","Malawi","Malaysia","Namibia","New Caledonia","Niger","Nigeria","Nicaragua","Netherlands","Norway","Nepal","New Zealand","Oman","Pakistan","Panama","Peru","Philippines","Papua New Guinea","Poland","Puerto Rico","North Korea","Portugal","Paraguay","Qatar","Romania","Russia","Rwanda","Western Sahara","Saudi Arabia","Sudan","South Sudan","Senegal","Solomon Islands","Sierra Leone","El Salvador","Somaliland","Somalia","Republic of Serbia","Suriname","Slovakia","Slovenia","Sweden","Swaziland","Syria","Chad","Togo","Thailand","Tajikistan","Turkmenistan","East Timor","Trinidad and Tobago","Tunisia","Turkey","Taiwan","United Republic of Tanzania","Uganda","Ukraine","Uruguay","United States of America","Uzbekistan","Venezuela","Vietnam","Vanuatu","West Bank","Yemen","South Africa","Zambia","Zimbabwe"];
}
