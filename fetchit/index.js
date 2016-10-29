var states = getStates()//.slice(0, 1);

var app6 = new Vue({
  el: '#app-6',
  data: {
    results: {}
  },
  ready: function() {
    var self = this;
    var questions = {
      'why-is': {
      display: "Why is [state name] ... ?",
      query: function(x) {return "why is " + x + " ";}
    }, 'why-does': {
      display: "Why does [state name] ... ?",
      query: function(x) {return "why does " + x + " ";}
    }, 'can': {
      display: "Can [state name] ... ?",
      query: function(x) {return "can " + x + " ";}
    }, 'what-if': {
      display: "What if [state name] ... ?",
      query: function(x) {return "what if " + x + " ";}
    }, 'does': {
      display: "Does [state name] ... ?",
      query: function(x) {return "does " + x + " ";}
    }, 'how': {
      display: "How [state name] ... ?",
      query: function(x) {return "how " + x + " ";}
    }, 'is-not': {
      display: "[state name] is not ...",
      query: function(x) {return x + " is not ";}
    }, 'when-will': {
      display: "When will [state name] ...",
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
      
      states.forEach(function(state, idx) {
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
    },
    error: function(err) {
      document.writeln('Error!')
      document.writeln(JSON.stringify(err))
    }
  });
}

function byFullPhrase(x) {
  // we dont want half-complete answers
  return x.match(/<b>[^\s]/) === null;
}

function getStates() {
  var names = getNames();
  return Object.keys(names).map(function(id) {
    return names[id];
  })
}

function getNames() {
  return {
    "1": "Alabama",
    "2": "Alaska",
    "4": "Arizona",
    "5": "Arkansas",
    "6": "California",
    "8": "Colorado",
    "9": "Connecticut",
    "10": "Delaware",
    "11": "District of Columbia",
    "12": "Florida",
    "13": "Georgia",
    "15": "Hawaii",
    "16": "Idaho",
    "17": "Illinois",
    "18": "Indiana",
    "19": "Iowa",
    "20": "Kansas",
    "21": "Kentucky",
    "22": "Louisiana",
    "23": "Maine",
    "24": "Maryland",
    "25": "Massachusetts",
    "26": "Michigan",
    "27": "Minnesota",
    "28": "Mississippi",
    "29": "Missouri",
    "30": "Montana",
    "31": "Nebraska",
    "32": "Nevada",
    "33": "New Hampshire",
    "34": "New Jersey",
    "35": "New Mexico",
    "36": "New York",
    "37": "North Carolina",
    "38": "North Dakota",
    "39": "Ohio",
    "40": "Oklahoma",
    "41": "Oregon",
    "42": "Pennsylvania",
    "44": "Rhode Island",
    "45": "South Carolina",
    "46": "South Dakota",
    "47": "Tennessee",
    "48": "Texas",
    "49": "Utah",
    "50": "Vermont",
    "51": "Virginia",
    "53": "Washington",
    "54": "West Virginia",
    "55": "Wisconsin",
    "56": "Wyoming",
    "60": "America Samoa",
    "64": "Federated States of Micronesia",
    "66": "Guam",
    "68": "Marshall Islands",
    "69": "Northern Mariana Islands",
    "70": "Palau",
    "72": "Puerto Rico",
    "74": "U.S. Minor Outlying Islands",
    "78": "Virgin Islands of the United States"
  };
}
