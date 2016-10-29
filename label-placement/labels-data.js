var hash = computeHash();

function getLabel(countryId) {
  return hash[countryId];
}

function computeHash() {
  var getter = getLabelsJSONWhy;// getWhatIf; //getLabelsJSONWhy
  var records = getter().records;
  var result = {};
  records.forEach(function(record) {
    result[record.state] = toText(record.suggestions[0] || '');
  });

  return result;
}

function toText(html) {
  return html.replace(/<\/?b>/g, '');
}

function extractText(suggestion) {
  var content = ''
  suggestion.replace(/<b>(.+?)<\/b>/g, function(_, what) {
    content += what;
  });

  return content.replace(/^\s|\s$/g, '');
}

function getWhatIf() {
 return {
    "display": "What if [country name] ... ?",
    "records": [
      {
        "suggestions": [],
        "state": "Angola"
      },
      {
        "suggestions": [
          "what<b> happens </b>if<b> we leave </b>afghanistan",
          "what if<b> the soviets won in </b>afghanistan",
          "if<b> you are from </b>afghanistan what<b> are you called</b>",
          "what if<b> russia won in </b>afghanistan",
          "what if<b> the soviets never invaded </b>afghanistan",
          "what<b> are you called </b>if<b> you&#39;re from </b>afghanistan",
          "what<b> happens </b>if<b> the us leaves </b>afghanistan",
          "what if<b> we leave </b>afghanistan"
        ],
        "state": "Afghanistan"
      },
      {
        "suggestions": [
          "what if albania<b> joined yugoslavia</b>"
        ],
        "state": "Albania"
      },
      {
        "suggestions": [],
        "state": "Armenia"
      },
      {
        "suggestions": [],
        "state": "United Arab Emirates"
      },
      {
        "suggestions": [
          "what if argentina<b> invaded the falklands again</b>",
          "what if argentina<b> won the falklands war</b>",
          "what if argentina<b> joined the axis</b>",
          "what if argentina<b> wins the world cup</b>",
          "what if argentina<b> defaults</b>",
          "what if argentina<b> won the world cup</b>",
          "what if argentina<b> invaded the falklands</b>",
          "what if argentina<b> wins</b>",
          "what if argentina<b> and germany tie</b>",
          "what<b> happens </b>if argentina<b> defaults</b>"
        ],
        "state": "Argentina"
      },
      {
        "suggestions": [
          "what if antarctica<b> didn&#39;t exist</b>",
          "what if antarctica<b> melted</b>",
          "what if antarctica<b> was not frozen</b>",
          "what if antarctica<b> was habitable</b>",
          "what if antarctica<b> was a country</b>",
          "what if antarctica<b> disappeared</b>",
          "what if antarctica<b> drifted to another country</b>",
          "what<b> will happen </b>if antarctica<b> melts</b>",
          "what<b> would happen </b>if antarctica<b> was nuked</b>",
          "what if<b> polar bears lived in </b>antarctica"
        ],
        "state": "Antarctica"
      },
      {
        "suggestions": [],
        "state": "French Southern and Antarctic Lands"
      },
      {
        "suggestions": [
          "what if austria<b> hungary survived</b>",
          "what if austria<b> unified germany</b>",
          "what if austria<b> won the austro-prussian war</b>",
          "what if austria<b> hungary still exist</b>",
          "what if austria<b> joins germany</b>",
          "what if austria",
          "what if austria<b> hungary</b>"
        ],
        "state": "Austria"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> your from </b>azerbaijan",
          "what<b> are you called </b>if<b> you are from </b>azerbaijan",
          "what<b> are you called </b>if<b> you&#39;re from </b>azerbaijan"
        ],
        "state": "Azerbaijan"
      },
      {
        "suggestions": [],
        "state": "Burundi"
      },
      {
        "suggestions": [
          "what if australia<b> was never colonized</b>",
          "what if australia<b> was communist</b>",
          "what if australia<b> joined the axis</b>",
          "what if australia<b> was invaded</b>",
          "what if australia<b> became a republic</b>",
          "what if australia<b> was not colonised by the english</b>",
          "what if australia<b> wins eurovision</b>",
          "what if australia",
          "what if australia<b> release date</b>",
          "what if australia<b> was a republic</b>"
        ],
        "state": "Australia"
      },
      {
        "suggestions": [
          "what if belgium<b> splits</b>",
          "what if belgium<b> and usa tie</b>",
          "what if belgium<b> tv show</b>",
          "if<b> you&#39;re from </b>belgium what<b> are you called</b>",
          "what<b> happens </b>if<b> usa ties </b>belgium",
          "what<b> happens </b>if<b> usa loses to </b>belgium",
          "what<b> happens </b>if<b> us and </b>belgium<b> tie</b>",
          "what<b> happens </b>if<b> usa beats </b>belgium",
          "what if<b> germany didn&#39;t invade </b>belgium",
          "what<b> happens </b>if<b> usa and </b>belgium<b> draw</b>"
        ],
        "state": "Belgium"
      },
      {
        "suggestions": [],
        "state": "Benin"
      },
      {
        "suggestions": [],
        "state": "Burkina Faso"
      },
      {
        "suggestions": [
          "what if bangladesh<b> wins today</b>",
          "if<b> you are from </b>bangladesh what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>bangladesh",
          "if<b> you are from </b>bangladesh what<b> is your nationality</b>",
          "if<b> your from </b>bangladesh what<b> are you</b>",
          "what if<b> india loses to </b>bangladesh",
          "what<b> is your race </b>if<b> you are from </b>bangladesh",
          "what if<b> india wins against </b>bangladesh",
          "what if<b> pakistan loses to </b>bangladesh"
        ],
        "state": "Bangladesh"
      },
      {
        "suggestions": [
          "what if bulgaria<b> join yugoslavia</b>",
          "what if bulgaria"
        ],
        "state": "Bulgaria"
      },
      {
        "suggestions": [
          "if<b> your from </b>the bahamas what<b> are you called</b>",
          "if<b> you are from </b>the bahamas what<b> are you called</b>",
          "what<b> to do in </b>the bahamas if<b> it rains</b>",
          "what<b> are you </b>if<b> you&#39;re from </b>the bahamas",
          "what<b> are you </b>if<b> you are from </b>the bahamas"
        ],
        "state": "The Bahamas"
      },
      {
        "suggestions": [],
        "state": "Bosnia and Herzegovina"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>belarus"
        ],
        "state": "Belarus"
      },
      {
        "suggestions": [
          "if<b> you are from </b>belize what<b> are you called</b>",
          "what<b> to do in </b>belize if<b> it rains</b>",
          "if<b> your from </b>belize what<b> are you</b>",
          "what<b> race are you </b>if<b> you are from </b>belize"
        ],
        "state": "Belize"
      },
      {
        "suggestions": [
          "if<b> you are from </b>bolivia what<b> are you called</b>"
        ],
        "state": "Bolivia"
      },
      {
        "suggestions": [
          "what if brazil<b> joined the axis</b>",
          "what if brazil<b> was still an empire</b>",
          "what if brazil<b> loses world cup</b>",
          "what if brazil<b> is not ready</b>",
          "what if brazil<b> and chile tie</b>",
          "what if brazil<b> loses</b>",
          "what if brazil<b> loses today</b>",
          "what if brazil<b> loses to chile</b>",
          "what if brazil<b> loses against cameroon</b>",
          "what if brazil<b> loses against chile</b>"
        ],
        "state": "Brazil"
      },
      {
        "suggestions": [
          "what if brunei<b> join malaysia</b>",
          "what<b> are you called </b>if<b> you are from </b>brunei"
        ],
        "state": "Brunei"
      },
      {
        "suggestions": [
          "what if<b> i came to </b>bhutan<b> with you</b>"
        ],
        "state": "Bhutan"
      },
      {
        "suggestions": [
          "if<b> you are from </b>botswana what<b> are you called</b>"
        ],
        "state": "Botswana"
      },
      {
        "suggestions": [],
        "state": "Central African Republic"
      },
      {
        "suggestions": [
          "what if switzerland<b> was invaded</b>",
          "what if switzerland<b> joined the axis</b>",
          "what if switzerland<b> joined ww2</b>",
          "if<b> you&#39;re from </b>switzerland what<b> are you called</b>",
          "what if<b> germany invaded </b>switzerland",
          "what<b> would happen </b>if switzerland<b> was invaded</b>",
          "what<b> happens </b>if switzerland<b> is attacked</b>",
          "what if<b> germany attacked </b>switzerland",
          "what<b> to do in </b>switzerland if<b> it rains</b>",
          "what<b> does it mean </b>if<b> your </b>switzerland"
        ],
        "state": "Switzerland"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from the </b>ivory coast",
          "what<b> happens </b>if ivory coast<b> draw</b>",
          "what<b> are you called </b>if<b> your from </b>ivory coast",
          "what<b> are you </b>if<b> you&#39;re from </b>ivory coast",
          "what<b> happens </b>if<b> greece goes with </b>ivory coast"
        ],
        "state": "Ivory Coast"
      },
      {
        "suggestions": [
          "what if canada<b> invaded the us</b>",
          "what if canada<b> and the us merged</b>",
          "what if canada<b> was invaded</b>",
          "what if canada<b> was part of the usa</b>",
          "what if canada<b> joined the american revolution</b>",
          "what if canada<b> and mexico went to war</b>",
          "what if canada<b> was invaded by russia</b>",
          "what if canada<b> and the us become one country</b>",
          "what if canada<b> and the us went to war</b>",
          "what if canada<b> owned alaska</b>"
        ],
        "state": "Canada"
      },
      {
        "suggestions": [
          "what if cameroon<b> beats brazil</b>",
          "what<b> are you called </b>if<b> you are from </b>cameroon",
          "what<b> happens </b>if<b> brazil loses to </b>cameroon",
          "what<b> nationality are you </b>if<b> you are from </b>cameroon",
          "what<b> are you called </b>if<b> you&#39;re from </b>cameroon",
          "what<b> happens </b>if cameroon<b> beat brazil</b>",
          "what<b> happens </b>if<b> brazil wins against </b>cameroon",
          "what<b> happens </b>if<b> brazil and </b>cameroon<b> tie</b>"
        ],
        "state": "Cameroon"
      },
      {
        "suggestions": [
          "what if chile<b> and brazil tie</b>",
          "what if chile<b> beats brazil</b>",
          "what if chile<b> wins</b>",
          "if<b> it is noon in california </b>what<b> time is it in </b>chile",
          "if<b> your from </b>chile what<b> are you called</b>",
          "what<b> happens </b>if<b> brazil loses to </b>chile",
          "what<b> happens </b>if<b> brazil loses against </b>chile",
          "what<b> happens </b>if<b> brazil and </b>chile<b> draw</b>",
          "what if<b> spain loses against </b>chile",
          "what<b> happens </b>if chile<b> wins</b>"
        ],
        "state": "Chile"
      },
      {
        "suggestions": [
          "what if colombia<b> wins</b>",
          "what<b> happens </b>if colombia<b> wins today</b>",
          "what<b> happens </b>if colombia<b> loses against uruguay</b>",
          "what if<b> gran </b>colombia",
          "what<b> happens </b>if colombia<b> wins</b>",
          "what if<b> gran </b>colombia<b> survived</b>",
          "what if<b> gran </b>colombia<b> still existed</b>",
          "what<b> happens </b>if colombia<b> loses to brazil</b>",
          "what<b> happens </b>if colombia<b> and peru tie</b>",
          "what<b> to do </b>if<b> kidnapped in </b>colombia"
        ],
        "state": "Colombia"
      },
      {
        "suggestions": [],
        "state": "Democratic Republic of the Congo"
      },
      {
        "suggestions": [
          "what if china<b> discovered america</b>",
          "what if china<b> collapses</b>",
          "what if china<b> and japan went to war</b>",
          "what if china<b> invaded north korea</b>",
          "what if china<b> was a democracy</b>",
          "what if china<b> and america went to war</b>",
          "what if china<b> invaded america</b>",
          "what if china<b> attacks taiwan</b>",
          "what if china<b> invaded taiwan</b>",
          "what if china<b> called in our debt</b>"
        ],
        "state": "China"
      },
      {
        "suggestions": [],
        "state": "Northern Cyprus"
      },
      {
        "suggestions": [],
        "state": "Costa Rica"
      },
      {
        "suggestions": [
          "what if cuba<b> became a state</b>",
          "what if cuba<b> was not communist</b>",
          "what if cuba<b> was a state</b>",
          "what<b> happens </b>if<b> an american goes to </b>cuba",
          "what if<b> the us invaded </b>cuba",
          "what<b> happens </b>if<b> you go to </b>cuba<b> illegally</b>",
          "what if<b> the us annexed </b>cuba",
          "what<b> happens </b>if<b> you travel to </b>cuba",
          "what<b> happens </b>if<b> you leave </b>cuba"
        ],
        "state": "Cuba"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> you are from </b>czech republic",
          "what<b> are you called </b>if<b> you are from </b>czech republic"
        ],
        "state": "Czech Republic"
      },
      {
        "suggestions": [
          "what if germany<b> won ww1</b>",
          "what if germany<b> won ww2</b>",
          "what if germany<b> won ww2 movie</b>",
          "what if germany<b> never invaded russia</b>",
          "what if germany<b> won ww2 show</b>",
          "what if germany<b> won the war</b>",
          "what if germany<b> won the battle of britain</b>",
          "what if germany<b> took moscow</b>",
          "what if germany<b> won ww2 book</b>",
          "what if germany<b> won wwii</b>"
        ],
        "state": "Germany"
      },
      {
        "suggestions": [],
        "state": "Djibouti"
      },
      {
        "suggestions": [
          "what if denmark",
          "if<b> you are from </b>denmark what<b> are you called</b>",
          "what<b> are you </b>if<b> you are from </b>denmark",
          "what<b> are you called </b>if<b> you&#39;re from </b>denmark",
          "what<b> nationality are you </b>if<b> you are from </b>denmark",
          "what if<b> germany loses to </b>denmark",
          "what if<b> sweden conquered </b>denmark"
        ],
        "state": "Denmark"
      },
      {
        "suggestions": [
          "what<b> is democratic </b>republic of the congo",
          "what<b> is </b>the republic of the congo",
          "what<b> is democratic </b>republic of the congo<b> economy</b>"
        ],
        "state": "Republic of the Congo"
      },
      {
        "suggestions": [
          "what if egypt<b> never fell</b>"
        ],
        "state": "Egypt"
      },
      {
        "suggestions": [
          "what if algeria<b> was still french</b>",
          "what<b> happens </b>if<b> germany and </b>algeria<b> tie</b>",
          "what<b> happens </b>if<b> korea loses to </b>algeria",
          "what<b> happens </b>if<b> germany loses against </b>algeria",
          "what if<b> france kept </b>algeria",
          "what<b> happens </b>if algeria<b> and russia tie</b>",
          "what if<b> germany loses to </b>algeria",
          "what<b> happens </b>if algeria<b> wins</b>",
          "what if<b> germany and </b>algeria<b> tie</b>",
          "what<b> happens </b>if<b> germany ties </b>algeria"
        ],
        "state": "Algeria"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> your from the </b>dominican republic",
          "what<b> nationality are you </b>if<b> you are from the </b>dominican republic",
          "what<b> are you called </b>if<b> you are from the </b>dominican republic",
          "what<b> nationality are you </b>if<b> you&#39;re from the </b>dominican republic",
          "if<b> you are from the </b>dominican republic what<b> are you</b>",
          "what<b> are you called </b>if<b> you&#39;re from the </b>dominican republic"
        ],
        "state": "Dominican Republic"
      },
      {
        "suggestions": [
          "what if cyprus",
          "what<b> happens to </b>cyprus if<b> greece defaults</b>",
          "if<b> your from </b>cyprus what<b> are you called</b>",
          "what<b> happens </b>if cyprus<b> defaults</b>",
          "what<b> happens </b>if cyprus<b> leaves the euro</b>",
          "what<b> happens </b>if<b> you die in </b>cyprus"
        ],
        "state": "Cyprus"
      },
      {
        "suggestions": [
          "what if spain<b> joined ww2</b>",
          "what if spain<b> was in greece bill wurtz</b>",
          "what if spain<b> and portugal united</b>",
          "what if spain<b> never conquered mexico</b>",
          "what if spain<b> joined the central powers</b>",
          "what if spain<b> joined ww1</b>",
          "what if spain<b> and turkey joined the axis</b>",
          "what if spain<b> won the armada</b>",
          "what if spain<b> had invaded england</b>",
          "what if spain<b> conquered england</b>"
        ],
        "state": "Spain"
      },
      {
        "suggestions": [],
        "state": "Eritrea"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>ecuador",
          "if<b> your from </b>ecuador what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>ecuador",
          "if<b> i am from </b>ecuador what<b> is my race</b>",
          "what<b> are you </b>if<b> your from </b>ecuador",
          "what<b> nationality are you </b>if<b> you are from </b>ecuador",
          "what<b> happens </b>if ecuador<b> wins</b>",
          "what<b> happens </b>if ecuador<b> loses to france</b>",
          "what<b> happens </b>if ecuador<b> beats france</b>",
          "if<b> you are from </b>ecuador what<b> is your nationality</b>"
        ],
        "state": "Ecuador"
      },
      {
        "suggestions": [
          "what if<b> russia invaded </b>estonia",
          "if<b> russia attacks </b>estonia",
          "what if<b> putin invades </b>estonia",
          "what<b> happens </b>if<b> russia invaded </b>estonia"
        ],
        "state": "Estonia"
      },
      {
        "suggestions": [],
        "state": "Ethiopia"
      },
      {
        "suggestions": [
          "what if finland<b> won the winter war</b>",
          "what if finland<b> attacked leningrad</b>",
          "what if finland<b> was prepared for the winter war</b>",
          "what if finland<b> joined the axis</b>",
          "what if finland",
          "what if finland<b> was prepared</b>",
          "if<b> you are from </b>finland what<b> are you called</b>",
          "what<b> happens </b>if<b> canada loses to </b>finland"
        ],
        "state": "Finland"
      },
      {
        "suggestions": [
          "what<b> to do in </b>fiji if<b> it rains</b>",
          "if<b> you are from </b>fiji what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>fiji",
          "what if<b> accommodation </b>fiji",
          "what<b> nationality are you </b>if<b> you are from </b>fiji",
          "if<b> it is wednesday in </b>fiji what<b> day is it in hawaii</b>"
        ],
        "state": "Fiji"
      },
      {
        "suggestions": [
          "what if france<b> conquered mexico</b>",
          "what if france<b> did not surrender</b>",
          "what if france<b> was still a monarchy</b>",
          "what if france<b> became protestant</b>",
          "what if france<b> left the eu</b>",
          "what if france<b> had attacked germany</b>",
          "what if france<b> joined the axis</b>",
          "what if france<b> kept louisiana</b>",
          "what if france<b> and spain united</b>",
          "what if france<b> became communist</b>"
        ],
        "state": "France"
      },
      {
        "suggestions": [],
        "state": "Falkland Islands"
      },
      {
        "suggestions": [],
        "state": "Gabon"
      },
      {
        "suggestions": [
          "what if united kingdom",
          "if<b> the </b>united kingdom<b> is a country </b>what<b> is england</b>",
          "what if<b> disney bought the </b>united kingdom",
          "what<b> happens </b>if<b> scotland leaves the </b>united kingdom",
          "what<b> are you called </b>if<b> you are from the </b>united kingdom",
          "what<b> time in the philippines </b>if<b> 2pm in </b>united kingdom"
        ],
        "state": "United Kingdom"
      },
      {
        "suggestions": [
          "what if georgia<b> wins the sec</b>",
          "what if georgia<b> wins sec championship game</b>",
          "what if georgia<b> beats alabama</b>"
        ],
        "state": "Georgia"
      },
      {
        "suggestions": [
          "what if ghana<b> beats germany</b>",
          "what if ghana<b> wins</b>",
          "what if ghana<b> beats portugal</b>",
          "what if ghana<b> and portugal tie</b>",
          "what if ghana<b> wins vs portugal</b>",
          "what<b> happens </b>if<b> portugal beats </b>ghana",
          "if<b> you are from </b>ghana what<b> are you called</b>",
          "what<b> happens </b>if<b> germany and </b>ghana<b> time</b>",
          "what if<b> us beat </b>ghana"
        ],
        "state": "Ghana"
      },
      {
        "suggestions": [],
        "state": "Gambia"
      },
      {
        "suggestions": [
          "what if guinea<b> pig bites</b>",
          "what if guinea<b> pigs fight</b>",
          "what<b> to do </b>if guinea<b> pig is sick</b>"
        ],
        "state": "Guinea"
      },
      {
        "suggestions": [],
        "state": "Guinea Bissau"
      },
      {
        "suggestions": [],
        "state": "Equatorial Guinea"
      },
      {
        "suggestions": [
          "what if greece<b> was a pokemon region</b>",
          "what if greece<b> defaults</b>",
          "what if greece<b> left the eurozone</b>",
          "what if greece<b> lost to persia</b>",
          "what if greece<b> joined the axis</b>",
          "what if greece<b> never existed</b>",
          "what if greece<b> joined the central powers</b>",
          "what if greece<b> won in 1922</b>",
          "what if greece<b> leaves the euro</b>",
          "what if greece<b> votes no</b>"
        ],
        "state": "Greece"
      },
      {
        "suggestions": [
          "if<b> your from </b>guatemala what<b> are you called</b>",
          "what<b> race are you </b>if<b> you are from </b>guatemala",
          "if<b> you are from </b>guatemala what<b> is your nationality</b>",
          "what<b> are you </b>if<b> your from </b>guatemala",
          "if<b> it is 3pm in chile </b>what<b> time is it in </b>guatemala"
        ],
        "state": "Guatemala"
      },
      {
        "suggestions": [
          "if<b> you are from </b>honduras what<b> are you called</b>",
          "what<b> race are you </b>if<b> you are from </b>honduras",
          "what<b> happens </b>if<b> mexico loses to </b>honduras",
          "what if<b> mexico loses to </b>honduras",
          "what<b> nationality are you </b>if<b> you are from </b>honduras",
          "what<b> happens </b>if honduras<b> loses</b>",
          "what<b> is your race </b>if<b> you are from </b>honduras"
        ],
        "state": "Honduras"
      },
      {
        "suggestions": [
          "what if haiti",
          "what if<b> foundation </b>haiti"
        ],
        "state": "Haiti"
      },
      {
        "suggestions": [
          "what if croatia<b> wins</b>",
          "what<b> happens </b>if<b> mexico loses to </b>croatia",
          "what<b> happens </b>if<b> mexico and </b>croatia<b> tie</b>",
          "what<b> happens </b>if croatia<b> wins</b>",
          "what if<b> spain loses against </b>croatia",
          "what<b> happens </b>if<b> mexico ties with </b>croatia",
          "what<b> happens </b>if<b> brazil loses to </b>croatia",
          "what<b> happens </b>if<b> mexico loses vs </b>croatia",
          "what<b> to do </b>if<b> arrested in </b>croatia",
          "what if<b> mexico and </b>croatia<b> tie</b>"
        ],
        "state": "Croatia"
      },
      {
        "suggestions": [
          "if<b> you are from </b>guyana what<b> is your race</b>",
          "what<b> race are you </b>if<b> you are from </b>guyana",
          "what<b> nationality are you </b>if<b> you are from </b>guyana"
        ],
        "state": "Guyana"
      },
      {
        "suggestions": [
          "what if greenland<b> melted</b>",
          "what if greenland<b> ice melts</b>",
          "what<b> would happen </b>if greenland<b> melted</b>",
          "what<b> happens </b>if greenland<b> melts</b>",
          "what if<b> the united states were on </b>greenland",
          "what<b> are you called </b>if<b> you are from </b>greenland",
          "what<b> are you </b>if<b> you are from </b>greenland",
          "what<b> are you </b>if<b> you&#39;re from </b>greenland",
          "what<b> are you called </b>if<b> you&#39;re from </b>greenland",
          "what<b> are you </b>if<b> your from </b>greenland"
        ],
        "state": "Greenland"
      },
      {
        "suggestions": [
          "what if indonesia<b> invaded singapore</b>",
          "what if indonesia<b> invade australia</b>",
          "what if indonesia<b> attack malaysia</b>",
          "what if indonesia<b> invade malaysia</b>",
          "what if indonesia<b> subtitle</b>",
          "what if indonesia<b> sub</b>",
          "if<b> you know </b>what<b> i mean </b>indonesia"
        ],
        "state": "Indonesia"
      },
      {
        "suggestions": [
          "what if iran<b> attacks israel</b>",
          "what if iran<b> nukes israel</b>",
          "what if iran<b> never had a revolution</b>",
          "what if iran<b> breaks the deal</b>",
          "what if iran<b> gets the bomb</b>",
          "what if iran<b> won the iran-iraq war</b>",
          "what if iran<b> attacks saudi arabia</b>",
          "what if iran<b> attacked the us</b>",
          "what if iran<b> joined the axis</b>",
          "what if iran<b> gets nuclear weapons</b>"
        ],
        "state": "Iran"
      },
      {
        "suggestions": [
          "what if india<b> loses kashmir</b>",
          "what if india<b> joins the axis</b>",
          "what if india<b> attacks pakistan</b>",
          "what if india<b> was never colonized</b>",
          "what if india<b> and pakistan go to war</b>",
          "what if india<b> and china go to war</b>",
          "what if india<b> was not partitioned</b>",
          "what if india<b> was still a british colony</b>",
          "what if india<b> never gained independence</b>",
          "what if india<b> and china unite</b>"
        ],
        "state": "India"
      },
      {
        "suggestions": [
          "what if hungary",
          "what if<b> austria-hungary survived</b>",
          "what if<b> i&#39;m hungry at night</b>",
          "what if<b> austria </b>hungary<b> still exist</b>",
          "what if<b> your hungry before bed</b>",
          "what if<b> austria-hungary won world war i</b>",
          "what if<b> your hungry all the time</b>",
          "what if<b> austria-hungary won the war</b>",
          "what<b> do </b>if<b> your hungry</b>",
          "what if<b> austria </b>hungary"
        ],
        "state": "Hungary"
      },
      {
        "suggestions": [
          "what if ireland<b> joined the axis</b>",
          "what if ireland<b> stayed in the uk</b>",
          "what if ireland<b> was united</b>",
          "what if ireland<b> was still british</b>",
          "what if ireland<b> got home rule</b>",
          "what if ireland<b> joined the uk</b>",
          "what if ireland<b> joined the allies</b>",
          "what if ireland<b> invaded northern ireland</b>",
          "what if ireland<b> was never invaded</b>",
          "what if ireland<b> joined ww2</b>"
        ],
        "state": "Ireland"
      },
      {
        "suggestions": [
          "what if italy<b> never unified</b>",
          "what if italy<b> colonized america</b>",
          "what if italy<b> won ww2</b>",
          "what if italy<b> united earlier</b>",
          "what if italy<b> stayed neutral in ww2</b>",
          "what if italy<b> joined the central powers</b>",
          "what if italy<b> was stronger in ww2</b>",
          "what if italy<b> joined the allies</b>",
          "what if italy<b> never joined the axis</b>",
          "what if italy<b> leaves the euro</b>"
        ],
        "state": "Italy"
      },
      {
        "suggestions": [
          "what if israel<b> didn&#39;t exist</b>",
          "what if israel<b> kept sinai</b>",
          "what if israel<b> lost the 1948 war</b>",
          "what if israel<b> was never created</b>",
          "what if israel<b> and iran go to war</b>",
          "what if israel<b> qualifies for 2022</b>",
          "what if israel<b> was in uganda</b>",
          "what if israel<b> attacks iran</b>",
          "what if israel<b> didn exist</b>",
          "what if israel<b> nukes iran</b>"
        ],
        "state": "Israel"
      },
      {
        "suggestions": [
          "what if iraq<b> invaded saudi arabia</b>",
          "what if iraq<b> was never invaded</b>",
          "what if iraq<b> won the iran-iraq war</b>",
          "what if iraq<b> won the gulf war</b>",
          "what if iraq<b> falls</b>",
          "what if iraq<b> won the first gulf war</b>",
          "what if iraq<b> falls to isis</b>",
          "what if iraq<b> had nuclear weapons</b>",
          "what if iraq<b> collapses</b>",
          "what if iraq<b> beat iran</b>"
        ],
        "state": "Iraq"
      },
      {
        "suggestions": [
          "what<b> happens </b>if<b> the </b>iceland<b> volcano blows</b>",
          "if<b> your from </b>iceland what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>iceland",
          "what<b> are you called </b>if<b> you are from </b>iceland",
          "what<b> happens </b>if iceland<b> melts</b>",
          "what<b> happens </b>if iceland<b> volcano erupts</b>",
          "what<b> are you </b>if<b> your from </b>iceland",
          "what<b> are you </b>if<b> you are from </b>iceland"
        ],
        "state": "Iceland"
      },
      {
        "suggestions": [
          "what if jamaica<b> lyrics</b>",
          "what if jamaica<b> testo</b>",
          "what if jamaica<b> alborosie testo</b>",
          "what if jamaica<b> alborosie</b>",
          "what<b> to do in </b>jamaica if<b> it rains</b>",
          "what<b> happens </b>if<b> your gay in </b>jamaica",
          "what if<b> i get sick in </b>jamaica",
          "what<b> to pack </b>if<b> you&#39;re going to </b>jamaica",
          "what<b> happens </b>if<b> i get sick in </b>jamaica",
          "what if<b> it rains in </b>jamaica"
        ],
        "state": "Jamaica"
      },
      {
        "suggestions": [
          "what if japan<b> invaded russia</b>",
          "what if japan<b> won ww2</b>",
          "what if japan<b> won the battle of midway</b>",
          "what if japan<b> had won ww2</b>",
          "what if japan<b> defeated china</b>",
          "what if japan<b> and china go to war</b>",
          "what if japan<b> took over china</b>",
          "what if japan<b> won the battle of leyte gulf</b>",
          "what if japan<b> became a state</b>",
          "what if japan<b> invaded america</b>"
        ],
        "state": "Japan"
      },
      {
        "suggestions": [
          "what if jordan<b> never retired</b>",
          "what if jordan<b> chose adidas</b>",
          "what if jordan<b> didn&#39;t retire in 1998</b>",
          "what if jordan",
          "what if<b> michael </b>jordan<b> was drafted by the blazers</b>",
          "what if<b> michael </b>jordan<b> had quit</b>",
          "what if<b> michael </b>jordan<b> never played</b>",
          "what if<b> michael </b>jordan<b> played for the lakers</b>",
          "what if<b> the rockets drafted </b>jordan"
        ],
        "state": "Jordan"
      },
      {
        "suggestions": [],
        "state": "Kyrgyzstan"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> you are from </b>kazakhstan",
          "what<b> are you called </b>if<b> you are from </b>kazakhstan",
          "what<b> are you </b>if<b> your from </b>kazakhstan",
          "what<b> are you </b>if<b> you&#39;re from </b>kazakhstan"
        ],
        "state": "Kazakhstan"
      },
      {
        "suggestions": [],
        "state": "Cambodia"
      },
      {
        "suggestions": [
          "what if kenya",
          "what<b> happens </b>if<b> obama was born in </b>kenya",
          "what<b> happens </b>if<b> a cheque bounces in </b>kenya"
        ],
        "state": "Kenya"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> you are from </b>kosovo"
        ],
        "state": "Kosovo"
      },
      {
        "suggestions": [
          "what if south korea<b> invaded north</b>",
          "what if south korea<b> won the war</b>",
          "what if south korea<b> attacks north korea</b>",
          "what if south korea<b> won</b>",
          "what if south korea<b> won the korean war yahoo</b>",
          "what if<b> north and </b>south korea<b> united</b>",
          "what if<b> north and </b>south korea<b> went to war</b>"
        ],
        "state": "South Korea"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>kuwait"
        ],
        "state": "Kuwait"
      },
      {
        "suggestions": [
          "if<b> you are from </b>laos what<b> are you called</b>"
        ],
        "state": "Laos"
      },
      {
        "suggestions": [
          "what<b> race are you </b>if<b> you are from </b>lebanon",
          "what if<b> movie release date in </b>lebanon",
          "what<b> are you called </b>if<b> you are from </b>lebanon"
        ],
        "state": "Lebanon"
      },
      {
        "suggestions": [],
        "state": "Libya"
      },
      {
        "suggestions": [
          "what if<b> russia invaded </b>lithuania",
          "what if<b> poland </b>lithuania"
        ],
        "state": "Lithuania"
      },
      {
        "suggestions": [],
        "state": "Lesotho"
      },
      {
        "suggestions": [
          "what if sri lanka",
          "what if<b> michael jackson was </b>sri lanka",
          "what<b> race are you </b>if<b> you are from </b>sri lanka",
          "what<b> are you called </b>if<b> you are from </b>sri lanka"
        ],
        "state": "Sri Lanka"
      },
      {
        "suggestions": [],
        "state": "Liberia"
      },
      {
        "suggestions": [],
        "state": "Moldova"
      },
      {
        "suggestions": [
          "if<b> you are from </b>luxembourg what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you are from </b>luxembourg",
          "what<b> are you </b>if<b> you come from </b>luxembourg"
        ],
        "state": "Luxembourg"
      },
      {
        "suggestions": [
          "what<b> race are you </b>if<b> you are from </b>morocco",
          "what<b> is your race </b>if<b> you are from </b>morocco"
        ],
        "state": "Morocco"
      },
      {
        "suggestions": [
          "what<b> happens </b>if<b> canada loses to </b>latvia",
          "what if<b> russia invaded </b>latvia",
          "what if<b> canada loses to </b>latvia"
        ],
        "state": "Latvia"
      },
      {
        "suggestions": [
          "what if madagascar<b> plan</b>",
          "what<b> are you called </b>if<b> you are from </b>madagascar",
          "what<b> are you called </b>if<b> you&#39;re from </b>madagascar",
          "if<b> you&#39;re from </b>madagascar what<b> are you called</b>"
        ],
        "state": "Madagascar"
      },
      {
        "suggestions": [
          "what if mexico<b> joined the axis</b>",
          "what if mexico<b> joined ww1</b>",
          "what if mexico<b> joined the us</b>",
          "what if mexico<b> refuses to pay for the wall</b>",
          "what if mexico<b> joined ww2</b>",
          "what if mexico<b> doesn&#39;t pay for the wall</b>",
          "what if mexico<b> won the war</b>",
          "what if mexico<b> was a superpower</b>",
          "what if mexico<b> joined the central powers</b>",
          "what if mexico<b> was communist</b>"
        ],
        "state": "Mexico"
      },
      {
        "suggestions": [],
        "state": "Montenegro"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>myanmar"
        ],
        "state": "Myanmar"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>mali"
        ],
        "state": "Mali"
      },
      {
        "suggestions": [],
        "state": "Macedonia"
      },
      {
        "suggestions": [
          "what if<b> china invaded </b>mongolia"
        ],
        "state": "Mongolia"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>mozambique"
        ],
        "state": "Mozambique"
      },
      {
        "suggestions": [],
        "state": "Malawi"
      },
      {
        "suggestions": [],
        "state": "Mauritania"
      },
      {
        "suggestions": [],
        "state": "New Caledonia"
      },
      {
        "suggestions": [],
        "state": "Namibia"
      },
      {
        "suggestions": [
          "what if malaysia<b> attack singapore</b>",
          "what if malaysia<b> series</b>",
          "what if<b> singapore stayed in </b>malaysia",
          "what<b> to do </b>if<b> lost passport </b>malaysia",
          "what if<b> movie release date in </b>malaysia",
          "what<b> happens </b>if<b> overstay in </b>malaysia",
          "what if<b> indonesia attack </b>malaysia",
          "what<b> happens </b>if<b> you overstay in </b>malaysia"
        ],
        "state": "Malaysia"
      },
      {
        "suggestions": [
          "if<b> you are from </b>niger what<b> are you called</b>"
        ],
        "state": "Niger"
      },
      {
        "suggestions": [
          "what if nigeria<b> were to break up</b>",
          "what if nigeria<b> breaks up</b>",
          "what<b> happens </b>if nigeria<b> break up</b>",
          "what<b> happens </b>if nigeria<b> loses to argentina</b>",
          "what<b> happens </b>if nigeria<b> loses</b>",
          "what if<b> anything was good for </b>nigeria<b> in the colonization</b>",
          "what<b> happens </b>if<b> you are gay in </b>nigeria",
          "what<b> happens </b>if<b> your gay in </b>nigeria",
          "what<b> time is </b>if<b> in </b>nigeria"
        ],
        "state": "Nigeria"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> your from </b>nicaragua",
          "if<b> you are from </b>nicaragua what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>nicaragua"
        ],
        "state": "Nicaragua"
      },
      {
        "suggestions": [
          "what if norway",
          "if<b> you are from </b>norway what<b> are you called</b>",
          "what if<b> the allies invaded </b>norway",
          "what if<b> germany didn invade </b>norway",
          "what if<b> russia invades </b>norway"
        ],
        "state": "Norway"
      },
      {
        "suggestions": [
          "what if netherlands",
          "what if netherlands<b> and argentina tie</b>",
          "what<b> are you called </b>if<b> you are from the </b>netherlands",
          "what<b> happens </b>if<b> mexico loses to </b>netherlands",
          "what<b> are you </b>if<b> you are from the </b>netherlands",
          "what<b> happens </b>if<b> mexico loses against </b>netherlands",
          "what<b> happens </b>if<b> mexico and </b>netherlands<b> tie</b>",
          "what<b> happens </b>if<b> argentina and </b>netherlands<b> tie</b>",
          "what<b> happens </b>if<b> mexico beats </b>netherlands"
        ],
        "state": "Netherlands"
      },
      {
        "suggestions": [
          "if<b> you are from </b>nepal what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>nepal",
          "what<b> nationality are you </b>if<b> you are from </b>nepal",
          "what<b> race are you </b>if<b> you are from </b>nepal",
          "what<b> ethnicity are you </b>if<b> you are from </b>nepal"
        ],
        "state": "Nepal"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>oman"
        ],
        "state": "Oman"
      },
      {
        "suggestions": [
          "what if pakistan<b> attacks india</b>",
          "what if pakistan<b> and india go to war</b>",
          "what if pakistan<b> was never created</b>",
          "what if pakistan<b> attacks israel</b>",
          "what if pakistan<b> is declared a terrorist state</b>",
          "what if pakistan<b> attacks india with nuclear weapon</b>",
          "what if pakistan<b> nukes india quora</b>",
          "what if pakistan<b> use nuclear weapon</b>",
          "what if pakistan<b> uses nuclear bomb</b>",
          "what if pakistan<b> retaliates</b>"
        ],
        "state": "Pakistan"
      },
      {
        "suggestions": [
          "what if panama<b> canal broke</b>",
          "what if panama<b> wins</b>",
          "if<b> you are from </b>panama what<b> are you called</b>",
          "what if<b> the </b>panama<b> canal was never built</b>",
          "if<b> your from </b>panama what<b> are you called</b>",
          "what<b> are you called </b>if<b> you&#39;re from </b>panama",
          "what<b> nationality are you </b>if<b> you are from </b>panama",
          "what<b> happens </b>if panama<b> wins</b>",
          "what<b> nationality are you </b>if<b> your from </b>panama",
          "what<b> are you </b>if<b> your from </b>panama"
        ],
        "state": "Panama"
      },
      {
        "suggestions": [
          "what if peru",
          "if<b> your from </b>peru what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you&#39;re from </b>peru",
          "what<b> is your race </b>if<b> you are from </b>peru",
          "what<b> happens </b>if<b> colombia and </b>peru<b> tie</b>",
          "if<b> you are from </b>peru what<b> are you</b>",
          "what<b> to pack </b>if<b> going to </b>peru"
        ],
        "state": "Peru"
      },
      {
        "suggestions": [
          "what if philippines<b> became a us state</b>",
          "what if philippines<b> leaves un</b>",
          "what if philippines<b> was not colonized</b>",
          "what if philippines<b> showing</b>",
          "what if philippines<b> release date</b>",
          "what if philippines<b> cinema</b>",
          "what if philippines",
          "what if philippines<b> movie</b>",
          "what if<b> showing date </b>philippines",
          "what if<b> the </b>philippines<b> was never colonized by spain</b>"
        ],
        "state": "Philippines"
      },
      {
        "suggestions": [
          "what if poland<b> conquered russia</b>",
          "what if poland<b> won ww2</b>",
          "what if poland<b> gave up danzig</b>",
          "what if poland<b> joined the axis</b>",
          "what if poland<b> was never partitioned</b>",
          "what if poland<b> defeated germany</b>",
          "what if poland<b> gave danzig</b>",
          "what if poland<b> stopped the blitz</b>",
          "what if poland<b> cannot into bees</b>",
          "what if poland<b> won the war</b>"
        ],
        "state": "Poland"
      },
      {
        "suggestions": [],
        "state": "Papua New Guinea"
      },
      {
        "suggestions": [
          "what if puerto rico<b> became a state</b>",
          "what if puerto rico<b> becomes independent</b>",
          "what if puerto rico<b> defaults</b>",
          "what<b> happens </b>if puerto rico<b> defaults</b>",
          "what<b> will happen </b>if puerto rico<b> defaults</b>",
          "what<b> happens </b>if puerto rico<b> becomes a state</b>",
          "what<b> to do in </b>puerto rico if<b> it rains</b>",
          "if puerto rico<b> is not a state </b>what<b> is it</b>",
          "if<b> you are from </b>puerto rico what<b> race are you</b>",
          "what<b> happens </b>if puerto rico<b> becomes independent</b>"
        ],
        "state": "Puerto Rico"
      },
      {
        "suggestions": [
          "what if north korea<b> declares war</b>",
          "what if north korea<b> attacks</b>",
          "what if north korea<b> collapse</b>",
          "what if north korea<b> attacks japan</b>",
          "what if north korea<b> won</b>",
          "what if north korea<b> attacks the us</b>",
          "what if north korea<b> attacks china</b>",
          "what if north korea<b> attacks 2016</b>",
          "what if north korea<b> attacks america</b>",
          "what if north korea<b> invaded america</b>"
        ],
        "state": "North Korea"
      },
      {
        "suggestions": [],
        "state": "Paraguay"
      },
      {
        "suggestions": [
          "what if portugal<b> joined the axis</b>",
          "what if portugal<b> wins</b>",
          "what if portugal<b> beats ghana</b>",
          "what if portugal<b> and ghana tie</b>",
          "what if portugal<b> wins against ghana</b>",
          "what if portugal<b> wins and usa loses</b>",
          "what if portugal<b> loses to usa</b>",
          "what if portugal<b> loses</b>",
          "what if portugal<b> wins today</b>",
          "what if portugal<b> was part of spain</b>"
        ],
        "state": "Portugal"
      },
      {
        "suggestions": [
          "what if qatar<b> loses world cup</b>",
          "what<b> are you called </b>if<b> you are from </b>qatar",
          "what<b> happens </b>if<b> cheque bounces in </b>qatar"
        ],
        "state": "Qatar"
      },
      {
        "suggestions": [
          "what if romania<b> joined the central powers</b>",
          "what if romania<b> won ww2</b>",
          "what if romania<b> didn&#39;t exist</b>",
          "what if romania"
        ],
        "state": "Romania"
      },
      {
        "suggestions": [],
        "state": "Rwanda"
      },
      {
        "suggestions": [],
        "state": "Western Sahara"
      },
      {
        "suggestions": [
          "what if russia<b> never sold alaska</b>",
          "what if russia<b> invades ukraine</b>",
          "what if russia<b> won the cold war</b>",
          "what if russia<b> and china went to war</b>",
          "what if russia<b> invades the baltics</b>",
          "what if russia<b> lost ww2</b>",
          "what if russia<b> invaded europe</b>",
          "what if russia<b> joined nato</b>",
          "what if russia<b> won ww1</b>",
          "what if russia<b> never existed</b>"
        ],
        "state": "Russia"
      },
      {
        "suggestions": [],
        "state": "South Sudan"
      },
      {
        "suggestions": [
          "if<b> you are from </b>sudan what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you are from </b>sudan"
        ],
        "state": "Sudan"
      },
      {
        "suggestions": [
          "what if saudi arabia<b> falls</b>",
          "what if saudi arabia<b> collapses</b>",
          "what if saudi arabia<b> and iran went to war</b>",
          "what if saudi arabia<b> sells us assets</b>",
          "what if saudi arabia<b> sells us debt</b>",
          "what if saudi arabia<b> runs out of oil</b>",
          "what<b> happens </b>if<b> you steal in </b>saudi arabia",
          "what if<b> iran attacks </b>saudi arabia",
          "what<b> will happen </b>if saudi arabia<b> falls</b>",
          "what<b> happens </b>if<b> your gay in </b>saudi arabia"
        ],
        "state": "Saudi Arabia"
      },
      {
        "suggestions": [
          "if<b> you are from </b>senegal what<b> are you called</b>"
        ],
        "state": "Senegal"
      },
      {
        "suggestions": [],
        "state": "Solomon Islands"
      },
      {
        "suggestions": [],
        "state": "Somaliland"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> you are from </b>sierra leone",
          "what<b> are you called </b>if<b> you are from </b>sierra leone",
          "what<b> are you called </b>if<b> you&#39;re from </b>sierra leone"
        ],
        "state": "Sierra Leone"
      },
      {
        "suggestions": [
          "if<b> you are from </b>el salvador what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you are from </b>el salvador",
          "if<b> you&#39;re from </b>el salvador what<b> are you</b>",
          "what<b> race are you </b>if<b> you are from </b>el salvador",
          "what<b> is your nationality </b>if<b> you are from </b>el salvador",
          "what<b> nationality are you </b>if<b> you&#39;re from </b>el salvador"
        ],
        "state": "El Salvador"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>somalia"
        ],
        "state": "Somalia"
      },
      {
        "suggestions": [],
        "state": "Slovakia"
      },
      {
        "suggestions": [],
        "state": "Suriname"
      },
      {
        "suggestions": [],
        "state": "Slovenia"
      },
      {
        "suggestions": [],
        "state": "Republic of Serbia"
      },
      {
        "suggestions": [
          "what if sweden<b> won the great northern war</b>",
          "what if sweden<b> joined ww1</b>",
          "what if sweden<b> won at poltava</b>",
          "what if sweden<b> joined ww2</b>",
          "what if sweden<b> joined the central powers</b>",
          "what if sweden<b> joins axis</b>",
          "what if sweden<b> joined winter war</b>",
          "what if sweden",
          "what if sweden<b> joined the allies</b>",
          "what if sweden<b> had won at poltava</b>"
        ],
        "state": "Sweden"
      },
      {
        "suggestions": [
          "if<b> you are from </b>chad what<b> are you called</b>"
        ],
        "state": "Chad"
      },
      {
        "suggestions": [
          "what if syria<b> attacked israel</b>",
          "what if syria<b> falls</b>",
          "what if syria<b> uses chemical weapons</b>",
          "what if syria<b> retaliates</b>",
          "what if syria<b> is attacked</b>",
          "what if syria<b> strikes back</b>",
          "what<b> happens </b>if<b> us attacks </b>syria",
          "what if<b> london was </b>syria",
          "what if<b> we were </b>syria"
        ],
        "state": "Syria"
      },
      {
        "suggestions": [],
        "state": "Swaziland"
      },
      {
        "suggestions": [],
        "state": "Tajikistan"
      },
      {
        "suggestions": [
          "what if thailand<b> was colonized</b>",
          "what if thailand",
          "what<b> happens </b>if<b> you overstay in </b>thailand",
          "if<b> you are from </b>thailand what<b> are you called</b>",
          "if<b> your from </b>thailand what<b> are you called</b>",
          "what<b> happens </b>if<b> the king of </b>thailand<b> died</b>",
          "what<b> happens </b>if<b> you die in </b>thailand",
          "what<b> to do </b>if<b> arrested in </b>thailand"
        ],
        "state": "Thailand"
      },
      {
        "suggestions": [
          "what<b> are you called </b>if<b> you are from </b>togo"
        ],
        "state": "Togo"
      },
      {
        "suggestions": [],
        "state": "Turkmenistan"
      },
      {
        "suggestions": [],
        "state": "East Timor"
      },
      {
        "suggestions": [
          "what if<b> i have booked a holiday to </b>tunisia",
          "what<b> to do </b>if<b> holiday booked to </b>tunisia"
        ],
        "state": "Tunisia"
      },
      {
        "suggestions": [
          "what if turkey<b> leaves nato</b>",
          "what if turkey<b> joined the axis</b>",
          "what if turkey<b> falls</b>",
          "what if turkey<b> coup succeeded</b>",
          "what if turkey<b> invades greece</b>",
          "what if turkey<b> was christian</b>",
          "what if turkey<b> has joined the axis</b>",
          "what if turkey<b> joined ww2</b>",
          "what if turkey<b> joined the axis in ww2</b>",
          "what if turkey<b> coup</b>"
        ],
        "state": "Turkey"
      },
      {
        "suggestions": [
          "what if new zealand<b> was never colonized</b>",
          "what if new zealand<b> was part of australia</b>",
          "what if new zealand<b> was invaded</b>",
          "what if new zealand",
          "what if new zealand<b> accommodation</b>",
          "if<b> you&#39;re from </b>new zealand what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you are from </b>new zealand",
          "what<b> would happen </b>if new zealand<b> was invaded</b>",
          "what<b> happens </b>if<b> i marry a </b>new zealand<b> citizen</b>",
          "what if<b> wellington </b>new zealand"
        ],
        "state": "New Zealand"
      },
      {
        "suggestions": [
          "what<b> nationality are you </b>if<b> you are from </b>trinidad and tobago",
          "what<b> are you called </b>if<b> you are from </b>trinidad and tobago",
          "what<b> are you called </b>if<b> you&#39;re from </b>trinidad and tobago"
        ],
        "state": "Trinidad and Tobago"
      },
      {
        "suggestions": [
          "what if taiwan<b> declares independence</b>",
          "what if taiwan",
          "what if<b> china invades </b>taiwan",
          "what if<b> china attacks </b>taiwan",
          "what<b> happens </b>if taiwan<b> declares independence</b>",
          "if<b> you are from </b>taiwan what<b> are you called</b>",
          "what<b> happens </b>if<b> china invades </b>taiwan",
          "what<b> nationality are you </b>if<b> you are from </b>taiwan",
          "what if<b> movie </b>taiwan",
          "what<b> are you </b>if<b> you are from </b>taiwan"
        ],
        "state": "Taiwan"
      },
      {
        "suggestions": [],
        "state": "United Republic of Tanzania"
      },
      {
        "suggestions": [
          "what<b> happens </b>if<b> your gay in </b>uganda",
          "what if<b> israel was in </b>uganda"
        ],
        "state": "Uganda"
      },
      {
        "suggestions": [
          "what if ukraine<b> joins nato</b>",
          "what if ukraine<b> and russia go to war</b>",
          "what if ukraine<b> joins eu</b>",
          "what if ukraine<b> splits</b>",
          "what if ukraine<b> has nuclear weapons</b>",
          "what if ukraine<b> defaults</b>",
          "what if ukraine<b> joins russia</b>",
          "what if ukraine<b> goes to war with russia</b>",
          "what if ukraine<b> shot down mh17</b>",
          "what if ukraine<b> falls</b>"
        ],
        "state": "Ukraine"
      },
      {
        "suggestions": [],
        "state": "Uzbekistan"
      },
      {
        "suggestions": [
          "what if uruguay<b> and italy tie</b>",
          "what<b> happens </b>if<b> england draw against </b>uruguay",
          "what if<b> england draw with </b>uruguay",
          "if<b> your from </b>uruguay what<b> are you called</b>",
          "what<b> nationality are you </b>if<b> you are from </b>uruguay",
          "what<b> happens </b>if<b> italy loses to </b>uruguay"
        ],
        "state": "Uruguay"
      },
      {
        "suggestions": [
          "if<b> it is tuesday in sydney </b>what<b> day is it in the </b>united states of america",
          "if<b> i was born in the </b>united states of america what<b> is my nationality</b>"
        ],
        "state": "United States of America"
      },
      {
        "suggestions": [
          "what if vietnam<b> war was won</b>",
          "what if vietnam<b> war never happened</b>",
          "what if vietnam<b> was democratic</b>",
          "what if vietnam<b> and china go to war</b>"
        ],
        "state": "Vietnam"
      },
      {
        "suggestions": [
          "what if venezuela<b> defaults</b>",
          "what if venezuela<b> collapse</b>",
          "if<b> your from </b>venezuela what<b> are you called</b>",
          "what<b> happens </b>if venezuela<b> defaults</b>",
          "what<b> race are you </b>if<b> you are from </b>venezuela",
          "what<b> nationality are you </b>if<b> you are from </b>venezuela",
          "what<b> will happen </b>if venezuela<b> defaults</b>",
          "what if venezuela",
          "what if<b> estreno en </b>venezuela"
        ],
        "state": "Venezuela"
      },
      {
        "suggestions": [],
        "state": "Yemen"
      },
      {
        "suggestions": [
          "what if vanuatu",
          "what<b> are you called </b>if<b> you are from </b>vanuatu",
          "what<b> are you called </b>if<b> you&#39;re from </b>vanuatu"
        ],
        "state": "Vanuatu"
      },
      {
        "suggestions": [
          "if<b> israel annexes </b>west bank"
        ],
        "state": "West Bank"
      },
      {
        "suggestions": [],
        "state": "Zambia"
      },
      {
        "suggestions": [
          "what if south africa<b> never had apartheid</b>",
          "what if south africa<b> joined the axis</b>",
          "what if south africa",
          "what<b> happens </b>if<b> i don&#39;t vote in </b>south africa",
          "what<b> happens </b>if<b> you overstay in </b>south africa",
          "what<b> is my nationality </b>if<b> i was born in </b>south africa",
          "what if<b> rhodesia joined </b>south africa"
        ],
        "state": "South Africa"
      },
      {
        "suggestions": [
          "if<b> it is winter in poland </b>what<b> season is it in </b>zimbabwe",
          "what<b> are you called </b>if<b> your from </b>zimbabwe",
          "what if<b> india loses to </b>zimbabwe",
          "if<b> it is summer in poland </b>what<b> season is it in </b>zimbabwe",
          "what<b> are you </b>if<b> your from </b>zimbabwe",
          "what<b> are you called </b>if<b> you&#39;re from </b>zimbabwe",
          "what<b> are you </b>if<b> you&#39;re from </b>zimbabwe"
        ],
        "state": "Zimbabwe"
      }
    ],
    "query": "what if Zimbabwe "
  }

}

function getLabelsJSONWhy() {
  return {
    "display": "Why is [country name] ... ?",
    "records": [
      {
        "suggestions": [
          "why is angola<b> so expensive</b>",
          "why is angola<b> poor</b>",
          "why is angola<b> expensive</b>",
          "why is angola<b> so poor</b>",
          "why is angola<b> underdeveloped</b>",
          "why is angola<b> prison called angola</b>",
          "why is angola<b> a less developed country</b>",
          "why is angola<b> an ledc</b>",
          "why is angola<b> a developing country</b>"
        ],
        "state": "Angola"
      },
      {
        "suggestions": [
          "why is albania<b> poor</b>",
          "why is albania<b> called albania</b>",
          "why is albania<b> so poor</b>",
          "why is albania<b> muslim</b>",
          "why is albania<b> not in the eu</b>",
          "why is albania<b> so corrupt</b>",
          "why is albania<b> hated</b>",
          "why is albania<b> so hated</b>",
          "why is albania<b> a muslim country</b>",
          "why is albania<b> called the land of the eagles</b>"
        ],
        "state": "Albania"
      },
      {
        "suggestions": [
          "why is argentina<b> so white</b>",
          "why is argentina<b> so poor</b>",
          "why is argentina<b> a good place to visit</b>",
          "why is argentina<b> important</b>",
          "why is argentina<b> famous</b>",
          "why is argentina<b> named after silver</b>",
          "why is argentina<b> so good at soccer</b>",
          "why is argentina<b> cold in july</b>",
          "why is argentina<b> famous for beef</b>",
          "why is argentina<b> poor</b>"
        ],
        "state": "Argentina"
      },
      {
        "suggestions": [
          "why is united arab emirates<b> so hot</b>",
          "why is united arab emirates<b> so rich</b>",
          "why is united arab emirates<b> richest country</b>",
          "why is united arab emirates<b> rich</b>",
          "why<b> facetime </b>is<b> not available in the </b>united arab emirates",
          "why is<b> the location of the </b>united arab emirates<b> important</b>",
          "why is<b> google in </b>united arab emirates"
        ],
        "state": "United Arab Emirates"
      },
      {
        "suggestions": [
          "why is armenia<b> important</b>",
          "why is armenia<b> in uefa</b>",
          "why is armenia<b> christian</b>",
          "why is armenia<b> called hayastan</b>",
          "why is armenia<b> so poor</b>",
          "why is armenia<b> so small</b>",
          "why is armenia<b> in europe</b>",
          "why is armenia<b> called armenia</b>",
          "why is armenia<b> not recognised by pakistan</b>",
          "why is armenia<b> in eurovision</b>"
        ],
        "state": "Armenia"
      },
      {
        "suggestions": [
          "why is austria<b> not in nato</b>",
          "why is austria<b> so small</b>",
          "why is austria<b> a country</b>",
          "why is austria<b> aut</b>",
          "why is austria<b> so racist</b>",
          "why is austria<b> the best place to live</b>",
          "why is austria<b> so rich</b>",
          "why is austria<b> not part of germany</b>",
          "why is austria<b> hungary to blame for ww1</b>",
          "why is austria<b> abbreviation aut</b>"
        ],
        "state": "Austria"
      },
      {
        "suggestions": [],
        "state": "French Southern and Antarctic Lands"
      },
      {
        "suggestions": [
          "why is burundi<b> so poor</b>",
          "why is burundi<b> starving</b>",
          "why is burundi<b> unhappy</b>",
          "why is burundi<b> dangerous</b>",
          "why is burundi<b> in poverty</b>"
        ],
        "state": "Burundi"
      },
      {
        "suggestions": [
          "why is antarctica<b> a desert</b>",
          "why is antarctica<b> a continent</b>",
          "why is antarctica<b> so cold</b>",
          "why is antarctica<b> colder than the arctic</b>",
          "why is antarctica<b> melting</b>",
          "why is antarctica<b> important</b>",
          "why is antarctica<b> restricted</b>",
          "why is antarctica<b> growing</b>",
          "why is antarctica<b> closed off</b>",
          "why is antarctica<b> gaining ice</b>"
        ],
        "state": "Antarctica"
      },
      {
        "suggestions": [
          "why is burkina faso<b> so poor</b>",
          "why is burkina faso<b> underdeveloped</b>",
          "why is burkina faso<b> poor</b>"
        ],
        "state": "Burkina Faso"
      },
      {
        "suggestions": [
          "why is benin<b> important</b>",
          "why is benin<b> so poor</b>",
          "why is benin<b> city in nigeria</b>"
        ],
        "state": "Benin"
      },
      {
        "suggestions": [
          "why is azerbaijan<b> in uefa</b>",
          "why is azerbaijan<b> in europe</b>",
          "why is azerbaijan<b> split in two</b>",
          "why is azerbaijan<b> called the land of fire</b>",
          "why is azerbaijan<b> in eurovision</b>",
          "why is azerbaijan<b> divided</b>",
          "why is azerbaijan<b> split</b>",
          "why is azerbaijan<b> the land of fire</b>",
          "why is azerbaijan<b> part of europe</b>",
          "why is azerbaijan<b> muslim</b>"
        ],
        "state": "Azerbaijan"
      },
      {
        "suggestions": [
          "why is the bahamas<b> not apart of the caribbean</b>",
          "why is the bahamas<b> water so clear</b>",
          "why is the bahamas<b> a good vacation spot</b>",
          "why is the bahamas<b> a great place to visit</b>",
          "why is the bahamas<b> unique</b>",
          "why is the bahamas<b> so poor</b>",
          "why is the bahamas<b> so expensive</b>",
          "why is the bahamas<b> so popular</b>",
          "why is the bahamas<b> a tax haven</b>",
          "why is the bahamas<b> flag the bahamas flag</b>"
        ],
        "state": "The Bahamas"
      },
      {
        "suggestions": [
          "why is belgium<b> a country</b>",
          "why is belgium<b> tax so high</b>",
          "why is belgium<b> a francophone country</b>",
          "why is belgium<b> a non country</b>",
          "why is belgium<b> famous for chocolate</b>",
          "why is belgium<b> flag similar to germany</b>",
          "why is belgium<b> ranked so high</b>",
          "why is belgium<b> ranked 2</b>",
          "why is belgium<b> a french speaking country</b>",
          "why is belgium<b> known for chocolate</b>"
        ],
        "state": "Belgium"
      },
      {
        "suggestions": [
          "why is bulgaria<b> population decreasing</b>",
          "why is bulgaria<b> so poor</b>",
          "why is bulgaria<b> so cheap</b>",
          "why is bulgaria<b> in the eu</b>",
          "why is bulgaria<b> a developing country</b>",
          "why is bulgaria<b> cheap</b>",
          "why is bulgaria<b> important</b>",
          "why is bulgaria<b> so cold</b>",
          "why is bulgaria<b> a developing tourist destination</b>",
          "why is bulgaria<b> so bad</b>"
        ],
        "state": "Bulgaria"
      },
      {
        "suggestions": [
          "why is bangladesh<b> so poor</b>",
          "why is bangladesh<b> so populated</b>",
          "why is bangladesh<b> overpopulated</b>",
          "why is bangladesh<b> poor</b>",
          "why is bangladesh<b> a developing country</b>",
          "why is bangladesh<b> islamic</b>",
          "why is bangladesh<b> not part of india</b>",
          "why is bangladesh<b> vulnerable to natural disasters</b>",
          "why is bangladesh<b> underdeveloped</b>",
          "why is bangladesh<b> at risk</b>"
        ],
        "state": "Bangladesh"
      },
      {
        "suggestions": [
          "why is afghanistan<b> poor</b>",
          "why is afghanistan<b> known as the graveyard of empires</b>",
          "why is afghanistan<b> so poor</b>",
          "why is afghanistan<b> strategically important</b>",
          "why is afghanistan<b> so hard to conquer</b>",
          "why is afghanistan<b> a developing country</b>",
          "why is afghanistan<b> in stage 2</b>",
          "why is afghanistan<b> a failed state</b>",
          "why is afghanistan<b> dangerous</b>",
          "why is afghanistan<b> 30 minutes off</b>"
        ],
        "state": "Afghanistan"
      },
      {
        "suggestions": [
          "why is bosnia and herzegovina<b> called that</b>",
          "why is bosnia and herzegovina<b> one country</b>",
          "why is bosnia and herzegovina<b> bih</b>"
        ],
        "state": "Bosnia and Herzegovina"
      },
      {
        "suggestions": [
          "why is belize<b> so poor</b>",
          "why is belize<b> so dangerous</b>",
          "why is belize<b> english speaking</b>",
          "why is belize<b> so expensive</b>",
          "why is belize<b> so cheap</b>",
          "why is belize<b> a third world country</b>",
          "why is belize<b> dangerous</b>",
          "why is belize<b> considered caribbean</b>",
          "why is belize<b> in debt</b>",
          "why is belize<b> barrier reef in danger</b>"
        ],
        "state": "Belize"
      },
      {
        "suggestions": [
          "why is belarus<b> so scary</b>",
          "why is belarus<b> white russia</b>",
          "why is belarus<b> a dictatorship</b>",
          "why is belarus<b> called belarus</b>",
          "why is belarus<b> not in the eu</b>",
          "why is belarus<b> not in the council of europe</b>",
          "why is belarus<b> not part of russia</b>",
          "why is belarus<b> so poor</b>",
          "why is belarus<b> a country</b>",
          "why is belarus<b> sanctions</b>"
        ],
        "state": "Belarus"
      },
      {
        "suggestions": [
          "why is bolivia<b> so poor</b>",
          "why is bolivia<b> poor</b>",
          "why is bolivia<b> named bolivia</b>",
          "why is bolivia<b> landlocked</b>",
          "why is bolivia<b> so bad at soccer</b>",
          "why is bolivia<b> in poverty</b>",
          "why is bolivia<b> plurinational</b>",
          "why is bolivia<b> the poorest country</b>",
          "why is bolivia<b> so unfriendly</b>",
          "why is bolivia<b> called plurinational</b>"
        ],
        "state": "Bolivia"
      },
      {
        "suggestions": [
          "why is botswana<b> so successful</b>",
          "why is botswana<b> so hot</b>",
          "why is botswana<b> so rich</b>",
          "why is botswana<b> so expensive</b>",
          "why is botswana<b> unique for this</b>",
          "why is botswana<b> poor</b>",
          "why is botswana<b> sparsely populated</b>",
          "why is botswana<b> not corrupt</b>",
          "why is botswana<b> in poverty</b>"
        ],
        "state": "Botswana"
      },
      {
        "suggestions": [
          "why is bhutan<b> so happy</b>",
          "why is bhutan<b> known as a buffer state</b>",
          "why is bhutan<b> the happiest country</b>",
          "why is bhutan<b> the happiest country in the world</b>",
          "why is bhutan<b> called the land of the thunder dragon</b>",
          "why is bhutan<b> so expensive</b>",
          "why is bhutan<b> not part of india</b>",
          "why is bhutan<b> unique</b>",
          "why is bhutan<b> called the land of thunderbolt</b>",
          "why is bhutan<b> called the last shangri la</b>"
        ],
        "state": "Bhutan"
      },
      {
        "suggestions": [
          "why is brunei<b> rich</b>",
          "why is brunei<b> wealthy</b>",
          "why is brunei<b> not part of malaysia</b>",
          "why is brunei<b> split in two</b>",
          "why is brunei<b> separated</b>",
          "why is brunei<b> muslim</b>",
          "why is brunei<b> trending on twitter</b>",
          "why is brunei<b> currency same as singapore</b>",
          "why is brunei<b> called the abode of peace</b>",
          "why is brunei<b> darussalam so rich</b>"
        ],
        "state": "Brunei"
      },
      {
        "suggestions": [
          "why is central african republic<b> so dangerous</b>",
          "why is central african republic<b> so poor</b>",
          "why is central african republic<b> in poverty</b>",
          "why is central african republic<b> poor</b>",
          "why is central african republic<b> a failed state</b>",
          "why is central african republic<b> fighting</b>",
          "why is<b> france in </b>central african republic"
        ],
        "state": "Central African Republic"
      },
      {
        "suggestions": [
          "why is australia<b> called oz</b>",
          "why is australia<b> a continent</b>",
          "why is australia<b> so dry</b>",
          "why is australia<b> green and yellow</b>",
          "why is australia<b> so hot</b>",
          "why is australia<b> so racist</b>",
          "why is australia<b> so dangerous</b>",
          "why is australia<b> a desert</b>",
          "why is australia<b> in eurovision</b>"
        ],
        "state": "Australia"
      },
      {
        "suggestions": [
          "why is chile<b> so narrow</b>",
          "why is chile<b> named chile</b>",
          "why is chile<b> important</b>",
          "why is chile<b> hot</b>",
          "why is chile<b> doing so well</b>",
          "why is chile<b> famous</b>",
          "why is chile<b> so dry</b>",
          "why is chile<b> economy growing</b>",
          "why is chile<b> so good at soccer</b>",
          "why is chile<b> so long and thin</b>"
        ],
        "state": "Chile"
      },
      {
        "suggestions": [
          "why is cameroon<b> poor</b>",
          "why is cameroon<b> called africa in miniature</b>"
        ],
        "state": "Cameroon"
      },
      {
        "suggestions": [
          "why is ivory coast<b> called ivory coast</b>",
          "why is ivory coast<b> called cote d&#39;ivoire</b>",
          "why is ivory coast<b> poor</b>",
          "why is ivory coast<b> french</b>",
          "why is ivory coast<b> v japan on at 2am</b>",
          "why is ivory coast<b> famous</b>",
          "why is ivory coast<b> the elephants</b>",
          "why is<b> the </b>ivory coast<b> in poverty</b>",
          "why is<b> the </b>ivory coast<b> flag</b>"
        ],
        "state": "Ivory Coast"
      },
      {
        "suggestions": [
          "why is switzerland<b> ch</b>",
          "why is switzerland<b> sui</b>",
          "why is switzerland<b> neutral</b>",
          "why is switzerland<b> so rich</b>",
          "why is switzerland<b> always neutral</b>",
          "why is switzerland<b> so safe</b>",
          "why is switzerland<b> che</b>",
          "why is switzerland<b> expensive</b>",
          "why is switzerland<b> so happy</b>",
          "why is switzerland<b> the happiest country</b>"
        ],
        "state": "Switzerland"
      },
      {
        "suggestions": [
          "why is brazil<b> so poor</b>",
          "why is brazil<b> spelled brasil</b>",
          "why is brazil<b> so big</b>",
          "why is brazil<b> so dirty</b>",
          "why is brazil<b> so dangerous</b>",
          "why is brazil<b> so populated</b>",
          "why is brazil<b> called brazil</b>",
          "why is brazil<b> in a recession</b>",
          "why is brazil<b> spelled with an s in the olympics</b>",
          "why is brazil<b> broke</b>"
        ],
        "state": "Brazil"
      },
      {
        "suggestions": [
          "why is the<b> democratic </b>republic of congo<b> so poor</b>",
          "why is the<b> democratic </b>republic of congo<b> poor</b>",
          "why is the<b> democratic </b>republic of congo the<b> poorest country</b>",
          "why is the<b> democratic </b>republic of congo<b> in war</b>",
          "why the<b> democratic </b>republic of congo is<b> a failed state</b>",
          "why is<b> zaire </b>the<b> democratic </b>republic of congo",
          "why is the<b> democratic </b>republic of congo<b> in debt</b>"
        ],
        "state": "Republic of the Congo"
      },
      {
        "suggestions": [
          "why is democratic republic of the congo<b> poor</b>",
          "why is democratic republic of the congo<b> the poorest country</b>",
          "why is the democratic republic of congo<b> so poor</b>",
          "why is the democratic republic of congo<b> in war</b>",
          "why is the democratic republic of congo<b> so dangerous</b>",
          "why the democratic republic of congo is<b> a failed state</b>",
          "why is<b> zaire </b>the democratic republic of congo"
        ],
        "state": "Democratic Republic of the Congo"
      },
      {
        "suggestions": [
          "why is colombia<b> important</b>",
          "why is colombia<b> famous</b>",
          "why is colombia<b> important to the world</b>",
          "why is colombia<b> poor</b>",
          "why is colombia<b> called colombia</b>",
          "why is colombia<b> famous for coffee</b>",
          "why is colombia<b> so corrupt</b>",
          "why is colombia<b> so violent</b>",
          "why is colombia<b> a good place to visit</b>",
          "why is colombia<b> so dangerous</b>"
        ],
        "state": "Colombia"
      },
      {
        "suggestions": [
          "why is czech republic<b> called bohemia</b>",
          "why is czech republic<b> atheist</b>",
          "why is czech republic<b> so atheist</b>",
          "why is czech republic<b> so cheap</b>",
          "why is czech republic<b> famous</b>",
          "why is czech republic<b> so poor</b>",
          "why is czech republic<b> not on euro</b>"
        ],
        "state": "Czech Republic"
      },
      {
        "suggestions": [
          "why is northern cyprus<b> not recognised</b>"
        ],
        "state": "Northern Cyprus"
      },
      {
        "suggestions": [
          "why is costa rica<b> so expensive</b>",
          "why is costa rica<b> so popular</b>",
          "why is costa rica<b> dangerous</b>",
          "why is costa rica<b> famous</b>",
          "why is costa rica<b> so cheap</b>",
          "why is costa rica<b> on mountain time</b>",
          "why is costa rica<b> a developing country</b>",
          "why is costa rica<b> so poor</b>",
          "why is costa rica<b> so stable</b>",
          "why is costa rica<b> the happiest country</b>"
        ],
        "state": "Costa Rica"
      },
      {
        "suggestions": [
          "why is algeria<b> dz</b>",
          "why is algeria<b> dza</b>",
          "why is algeria<b> so hot</b>",
          "why is algeria<b> so big</b>",
          "why is algeria<b> a francophone country</b>",
          "why is algeria<b> hot</b>",
          "why is algeria<b> so dangerous</b>",
          "why is algeria<b> important</b>",
          "why is algeria<b> a developing country</b>",
          "why is algeria<b> so poor</b>"
        ],
        "state": "Algeria"
      },
      {
        "suggestions": [
          "why is dominican republic<b> a good vacation place</b>",
          "why is dominican republic<b> important</b>",
          "why is dominican republic<b> so poor</b>",
          "why is dominican republic<b> so cheap</b>",
          "why is dominican republic<b> better than haiti</b>",
          "why is dominican republic<b> and haiti separate</b>",
          "why is dominican republic<b> so dangerous</b>",
          "why is dominican republic<b> dangerous</b>",
          "why is dominican republic<b> poor</b>",
          "why is dominican republic<b> richer than haiti</b>"
        ],
        "state": "Dominican Republic"
      },
      {
        "suggestions": [
          "why is cyprus<b> divided</b>",
          "why is cyprus<b> in europe</b>",
          "why is cyprus<b> in the eu</b>",
          "why is cyprus<b> important</b>",
          "why is cyprus<b> not part of greece</b>",
          "why is cyprus<b> so windy</b>",
          "why is cyprus<b> called the island of love</b>",
          "why is cyprus<b> so humid</b>",
          "why is cyprus<b> in the commonwealth</b>",
          "why is cyprus<b> greek</b>"
        ],
        "state": "Cyprus"
      },
      {
        "suggestions": [
          "why is denmark<b> the happiest country in the world</b>",
          "why is denmark<b> so rich</b>",
          "why is denmark<b> called denmark</b>",
          "why is denmark<b> a stage 4 country</b>",
          "why is denmark<b> the happiest country in the world snopes</b>",
          "why is denmark<b> a market economy</b>",
          "why is denmark<b> spelled danmark</b>",
          "why is denmark<b> so safe</b>",
          "why is denmark<b> called the netherlands</b>",
          "why is denmark<b> rich</b>"
        ],
        "state": "Denmark"
      },
      {
        "suggestions": [
          "why is ecuador<b> protecting assange</b>",
          "why is ecuador<b> named what it is</b>",
          "why is ecuador<b> cold</b>",
          "why is ecuador<b> poor</b>",
          "why is ecuador<b> harboring julian assange</b>",
          "why is ecuador<b> protecting julian</b>",
          "why is ecuador<b> famous</b>",
          "why is ecuador<b> shielding assange</b>",
          "why is ecuador<b> important</b>",
          "why is ecuador<b> assange</b>"
        ],
        "state": "Ecuador"
      },
      {
        "suggestions": [
          "why is djibouti<b> important</b>",
          "why is djibouti<b> poor</b>",
          "why is djibouti<b> so hot</b>",
          "why is djibouti<b> called djibouti</b>",
          "why is djibouti<b> a developing country</b>",
          "why is<b> the us military in </b>djibouti"
        ],
        "state": "Djibouti"
      },
      {
        "suggestions": [
          "why is eritrea<b> so bad</b>",
          "why is eritrea<b> so censored</b>",
          "why is eritrea<b> so poor</b>",
          "why is eritrea<b> poor</b>",
          "why is eritrea<b> being sanctioned</b>",
          "why is eritrea<b> and ethiopia at war</b>",
          "why eritrea is<b> beautiful</b>"
        ],
        "state": "Eritrea"
      },
      {
        "suggestions": [
          "why is estonia<b> so rich</b>",
          "why is estonia<b> so cold</b>",
          "why is estonia<b> cold</b>",
          "why is estonia<b> so atheist</b>",
          "why is estonia<b> so poor</b>",
          "why is estonia<b> such a wonder of a country</b>",
          "why is estonia<b> important</b>",
          "why is estonia<b> famous</b>",
          "why is<b> the president in </b>estonia"
        ],
        "state": "Estonia"
      },
      {
        "suggestions": [
          "why is germany<b> so rich</b>",
          "why is germany<b> so powerful</b>",
          "why is germany<b> called alemania in spanish</b>",
          "why is germany<b> called germany</b>",
          "why is germany<b> de</b>",
          "why is germany<b> stockpiling food</b>",
          "why is germany<b> the fatherland</b>",
          "why is germany<b> the best country</b>",
          "why is germany<b> important</b>",
          "why is germany<b> so clean</b>"
        ],
        "state": "Germany"
      },
      {
        "suggestions": [
          "why is fiji<b> water so good</b>",
          "why is fiji<b> so good at rugby</b>",
          "why is fiji<b> water different</b>",
          "why is fiji<b> in the olympics</b>",
          "why is fiji<b> water</b>",
          "why is fiji<b> so good at sevens</b>",
          "why is fiji<b> water so expensive</b>",
          "why is fiji<b> poor</b>",
          "why is fiji<b> water vaporwave</b>",
          "why is fiji<b> good at rugby</b>"
        ],
        "state": "Fiji"
      },
      {
        "suggestions": [
          "why is ethiopia<b> poor</b>",
          "why is ethiopia<b> unique</b>",
          "why is ethiopia<b> important</b>",
          "why is ethiopia<b> christian</b>",
          "why is ethiopia<b> a developing country</b>",
          "why is ethiopia<b> mentioned in the bible</b>",
          "why is ethiopia<b> so impoverished</b>",
          "why is ethiopia<b> protesting</b>",
          "why is ethiopia<b> a less developed country</b>",
          "why is ethiopia<b> landlocked</b>"
        ],
        "state": "Ethiopia"
      },
      {
        "suggestions": [
          "why is cuba<b> important</b>",
          "why is cuba<b> a command economy</b>",
          "why is cuba<b> called cuba</b>",
          "why is cuba<b> a communist country</b>",
          "why is cuba<b> so bad</b>",
          "why is cuba<b> poor</b>",
          "why is cuba<b> named cuba</b>",
          "why is cuba<b> communist</b>",
          "why is cuba<b> stuck in the 1950s</b>",
          "why is cuba<b> so behind</b>"
        ],
        "state": "Cuba"
      },
      {
        "suggestions": [
          "why is finland<b> not in nato</b>",
          "why is finland<b> called finland</b>",
          "why is finland<b> not scandinavian</b>",
          "why is finland<b> so happy</b>",
          "why is finland<b> the best country in the world</b>",
          "why is finland<b> so rich</b>",
          "why is finland<b> education system the best</b>",
          "why is finland<b> a developed country</b>",
          "why is finland<b> so cold</b>",
          "why is finland<b> top in education</b>"
        ],
        "state": "Finland"
      },
      {
        "suggestions": [
          "why is canada<b> so big</b>",
          "why is canada<b> so nice</b>",
          "why is canada<b> called canada</b>",
          "why is canada<b> a formal region</b>",
          "why is canada<b> so gay</b>",
          "why is canada<b> better than the usa</b>",
          "why is canada<b> a good place to live</b>",
          "why is canada<b> so great</b>",
          "why is canada<b> so liberal</b>",
          "why is canada<b> great</b>"
        ],
        "state": "Canada"
      },
      {
        "suggestions": [
          "why is falkland islands<b> sparsely populated</b>",
          "why is falkland islands<b> important</b>",
          "why is falkland islands<b> british</b>",
          "why is falkland islands<b> famous</b>"
        ],
        "state": "Falkland Islands"
      },
      {
        "suggestions": [],
        "state": "Gabon"
      },
      {
        "suggestions": [
          "why is ghana<b> important</b>",
          "why is ghana<b> not in fifa</b>",
          "why is ghana<b> poor</b>",
          "why is ghana<b> so poor</b>",
          "why is ghana<b> called the gold coast</b>",
          "why is ghana<b> called ghana</b>",
          "why is ghana<b> not on paypal</b>",
          "why is ghana<b> an ledc country</b>",
          "why is ghana<b> a less developed country</b>",
          "why is ghana<b> the gateway to africa</b>"
        ],
        "state": "Ghana"
      },
      {
        "suggestions": [
          "why is united kingdom<b> called united kingdom</b>",
          "why is united kingdom<b> called great britain in olympics</b>",
          "why is united kingdom<b> called great britain</b>",
          "why is united kingdom<b> a market economy</b>",
          "why is united kingdom<b> a developed country</b>",
          "why is united kingdom<b> so rich</b>",
          "why is united kingdom",
          "why is<b> northern ireland part of the </b>united kingdom",
          "why is<b> scotland part of the </b>united kingdom",
          "why is<b> the </b>united kingdom<b> a monarchy</b>"
        ],
        "state": "United Kingdom"
      },
      {
        "suggestions": [
          "why is georgia<b> called the peach state</b>",
          "why is georgia<b> named georgia</b>",
          "why is georgia<b> clay red</b>",
          "why is georgia<b> called georgia</b>",
          "why is georgia<b> rule rated r</b>",
          "why is georgia<b> so hot</b>",
          "why is georgia<b> a swing state</b>",
          "why is georgia<b> turning blue</b>",
          "why is georgia<b> republican</b>",
          "why is georgia<b> o&#39;keeffe important</b>"
        ],
        "state": "Georgia"
      },
      {
        "suggestions": [
          "why is egypt<b> called the gift of the nile</b>",
          "why is egypt<b> important</b>",
          "why is egypt<b> calling me</b>",
          "why is egypt<b> called the seedbed of african cultures</b>",
          "why is egypt<b> famous in the history of storytelling</b>",
          "why is egypt<b> considered a theocracy</b>",
          "why is egypt<b> important to the us</b>",
          "why is egypt<b> not part of africa</b>",
          "why is egypt<b> called egypt</b>",
          "why is egypt<b> a desert</b>"
        ],
        "state": "Egypt"
      },
      {
        "suggestions": [
          "why is guinea bissau<b> poor</b>"
        ],
        "state": "Guinea Bissau"
      },
      {
        "suggestions": [
          "why is guinea<b> a racial slur</b>",
          "why is guinea<b> pig pee white</b>",
          "why is guinea<b> pig losing hair</b>",
          "why is guinea<b> poor</b>",
          "why is guinea<b> pig called that</b>",
          "why is guinea<b> pig squeaking</b>",
          "why is guinea<b> bissau poor</b>",
          "why is guinea<b> pig ileum used in experiments</b>",
          "why is guinea<b> pig jumping</b>",
          "why is guinea<b> called guinea</b>"
        ],
        "state": "Guinea"
      },
      {
        "suggestions": [
          "why is gambia<b> called the gambia</b>",
          "why is gambia<b> so poor</b>",
          "why is gambia<b> surrounded by senegal</b>",
          "why is gambia<b> so oddly shaped</b>",
          "why is gambia<b> called the smiling coast of africa</b>",
          "why is gambia<b> a good tourist destination</b>",
          "why is gambia<b> not part of senegal</b>",
          "why is gambia<b> inside senegal</b>"
        ],
        "state": "Gambia"
      },
      {
        "suggestions": [
          "why is guatemala<b> called guatemala</b>",
          "why is guatemala<b> dangerous</b>",
          "why is guatemala<b> poor</b>",
          "why is guatemala<b> city important</b>",
          "why is guatemala<b> so poor</b>",
          "why is guatemala<b> famous</b>",
          "why is guatemala<b> important</b>",
          "why is guatemala<b> city the capital</b>",
          "why is guatemala<b> a developing country</b>",
          "why is guatemala<b> adoption closed</b>"
        ],
        "state": "Guatemala"
      },
      {
        "suggestions": [
          "why is equatorial guinea<b> a spanish speaking country</b>",
          "why is equatorial guinea<b> so rich</b>",
          "why is equatorial guinea<b> so poor</b>",
          "why is equatorial guinea<b> the richest country in africa</b>",
          "why is equatorial guinea<b> rich</b>"
        ],
        "state": "Equatorial Guinea"
      },
      {
        "suggestions": [
          "why is france<b> banning burkinis</b>",
          "why is france<b> under attack</b>",
          "why is france<b> a target for isis</b>",
          "why is france<b> being targeted</b>",
          "why is france<b> a rooster</b>",
          "why is france<b> getting attacked</b>",
          "why is france<b> called france</b>",
          "why is france<b> so racist</b>",
          "why is france<b> a mixed economy</b>",
          "why is france<b> so secular</b>"
        ],
        "state": "France"
      },
      {
        "suggestions": [
          "why is spain<b> so poor</b>",
          "why is spain<b> esp</b>",
          "why is spain<b> important</b>",
          "why is spain<b> so hot</b>",
          "why is spain<b> good at basketball</b>",
          "why is spain<b> espana</b>",
          "why is spain<b> famous</b>",
          "why is spain<b> in debt</b>",
          "why is spain<b> not called espana</b>",
          "why is spain<b> called spain</b>"
        ],
        "state": "Spain"
      },
      {
        "suggestions": [
          "why is china<b> called china</b>",
          "why is china<b> so good at diving</b>",
          "why is china<b> so populated</b>",
          "why is china<b> communist</b>",
          "why is china<b> so polluted</b>",
          "why is china<b> overpopulated</b>",
          "why is china<b> famous</b>",
          "why is china<b> so rich</b>",
          "why is china<b> good at table tennis</b>",
          "why is china<b> so big</b>"
        ],
        "state": "China"
      },
      {
        "suggestions": [
          "why is guyana<b> considered west indies</b>",
          "why is guyana<b> so poor</b>",
          "why is guyana<b> poor</b>",
          "why is guyana<b> part of the caribbean</b>",
          "why is guyana<b> below sea level</b>",
          "why is guyana<b> water brown</b>",
          "why is guyana<b> called gt</b>",
          "why is guyana<b> hindu</b>",
          "why is guyana<b> in concacaf</b>",
          "why is guyana<b> not in conmebol</b>"
        ],
        "state": "Guyana"
      },
      {
        "suggestions": [
          "why is honduras<b> so poor</b>",
          "why is honduras<b> poor</b>",
          "why is honduras<b> famous</b>",
          "why is honduras<b> important</b>",
          "why is honduras<b> not in fifa</b>",
          "why is honduras<b> a developing country</b>",
          "why is honduras<b> so violent</b>",
          "why is honduras<b> so dangerous</b>",
          "why is honduras<b> called honduras</b>",
          "why is honduras<b> dangerous</b>"
        ],
        "state": "Honduras"
      },
      {
        "suggestions": [
          "why is greenland<b> icy</b>",
          "why is greenland<b> not a continent</b>",
          "why is greenland<b> called greenland</b>",
          "why is greenland<b> so big</b>",
          "why is greenland<b> so cold</b>",
          "why is greenland<b> covered in ice</b>",
          "why is greenland<b> not a country</b>",
          "why is greenland<b> shark meat poisonous</b>",
          "why is greenland<b> so large on the map</b>",
          "why is greenland<b> melting</b>"
        ],
        "state": "Greenland"
      },
      {
        "suggestions": [
          "why is greece<b> in debt</b>",
          "why is greece<b> broke</b>",
          "why is greece<b> so poor</b>",
          "why is greece<b> important</b>",
          "why is greece<b> called greece</b>",
          "why is greece<b> in so much debt</b>",
          "why is greece<b> failing</b>",
          "why is greece<b> blue and white</b>",
          "why is greece<b> a good place to visit</b>",
          "why is greece<b> a capitalist economy</b>"
        ],
        "state": "Greece"
      },
      {
        "suggestions": [
          "why is croatia<b> hr</b>",
          "why is croatia<b> good at water polo</b>",
          "why is croatia<b> sponsored by jordan</b>",
          "why is croatia<b> so popular</b>",
          "why is croatia<b> not in fifa 17</b>",
          "why is croatia<b> so good at sports</b>",
          "why is croatia<b> not in fifa</b>",
          "why is croatia<b> split in two</b>",
          "why is croatia<b> so expensive</b>",
          "why is croatia<b> a popular tourist destination</b>"
        ],
        "state": "Croatia"
      },
      {
        "suggestions": [
          "why is hungary<b> so racist</b>",
          "why is hungary<b> called hungary</b>",
          "why is hungary<b> so good at the olympics</b>",
          "why is hungary<b> important</b>",
          "why is hungary<b> not on the euro</b>",
          "why is hungary<b> so good at swimming</b>",
          "why is hungary<b> so cheap</b>",
          "why is hungary<b> good at swimming</b>",
          "why is hungary<b> so good at water polo</b>",
          "why is hungary<b> good at water polo</b>"
        ],
        "state": "Hungary"
      },
      {
        "suggestions": [
          "why is haiti<b> so poor</b>",
          "why is haiti<b> poor</b>",
          "why is haiti<b> a failed state</b>",
          "why is haiti<b> named haiti</b>",
          "why is haiti<b> in poverty</b>",
          "why is haiti<b> cursed</b>",
          "why is haiti<b> so poor reddit</b>",
          "why is haiti<b> deforested</b>",
          "why is haiti<b> separate from dominican republic</b>",
          "why is haiti<b> such a mess</b>"
        ],
        "state": "Haiti"
      },
      {
        "suggestions": [
          "why is indonesia<b> poor</b>",
          "why is indonesia<b> islamic</b>",
          "why is indonesia<b> not in tpp</b>",
          "why is indonesia<b> overpopulated</b>",
          "why is indonesia<b> important</b>",
          "why is indonesia<b> a developing country</b>",
          "why is indonesia<b> called indonesia</b>",
          "why is indonesia<b> underdeveloped</b>",
          "why is indonesia<b> burning forests</b>",
          "why is indonesia<b> so populated</b>"
        ],
        "state": "Indonesia"
      },
      {
        "suggestions": [
          "why is ireland<b> so green</b>",
          "why is ireland<b> not in the olympics</b>",
          "why is ireland<b> split</b>",
          "why is ireland<b> not part of the uk</b>",
          "why is ireland<b> so poor</b>",
          "why is ireland<b> a tax haven</b>",
          "why is ireland<b> poor</b>",
          "why is ireland<b> so rich</b>",
          "why is ireland<b> important</b>",
          "why is ireland<b> so rainy</b>"
        ],
        "state": "Ireland"
      },
      {
        "suggestions": [
          "why is iceland<b> called iceland</b>",
          "why is iceland<b> green and greenland ice</b>",
          "why is iceland<b> so safe</b>",
          "why is iceland<b> isl</b>",
          "why is iceland<b> expensive</b>",
          "why is iceland<b> a mixed economy</b>",
          "why is iceland<b> named</b>",
          "why is iceland<b> so cheap</b>",
          "why is iceland<b> so good at crossfit</b>",
          "why is iceland<b> so expensive</b>"
        ],
        "state": "Iceland"
      },
      {
        "suggestions": [
          "why is kenya<b> so poor</b>",
          "why is kenya<b> a developing country</b>",
          "why is kenya<b> important</b>",
          "why is kenya<b> so good at distance running</b>",
          "why is kenya<b> so good at running</b>",
          "why is kenya<b> in stage 2</b>",
          "why is kenya<b> poor</b>",
          "why is kenya<b> a ledc</b>",
          "why is kenya<b> famous</b>",
          "why is kenya<b> so popular</b>"
        ],
        "state": "Kenya"
      },
      {
        "suggestions": [
          "why is jamaica<b> so fast</b>",
          "why is jamaica<b> poor</b>",
          "why is jamaica<b> black</b>",
          "why is jamaica<b> in debt</b>",
          "why is jamaica<b> so popular</b>",
          "why is jamaica<b> one hour behind</b>",
          "why is jamaica<b> so good at track and field</b>",
          "why is jamaica<b> dangerous</b>",
          "why is jamaica<b> so cheap</b>",
          "why is jamaica<b> all black</b>"
        ],
        "state": "Jamaica"
      },
      {
        "suggestions": [
          "why is jordan<b> so gay</b>",
          "why is jordan<b> crying</b>",
          "why is jordan<b> gay</b>",
          "why is jordan<b> estranged from his brother</b>",
          "why is jordan<b> not on misfit garage</b>",
          "why is jordan<b> and aaron estranged</b>",
          "why is jordan<b> better than kobe</b>",
          "why is jordan<b> sponsoring michigan</b>",
          "why is jordan<b> so stable</b>"
        ],
        "state": "Jordan"
      },
      {
        "suggestions": [
          "why is iran<b> bad</b>",
          "why is iran<b> a threat to the us</b>",
          "why is iran<b> iri</b>",
          "why is iran<b> shia</b>",
          "why is iran<b> a theocracy</b>",
          "why is iran<b> important to the united states</b>",
          "why is iran<b> important</b>",
          "why is iran<b> so hostile</b>",
          "why is iran<b> deal bad</b>",
          "why is iran<b> a command economy</b>"
        ],
        "state": "Iran"
      },
      {
        "suggestions": [
          "why is laos<b> so poor</b>",
          "why is laos<b> communist today</b>",
          "why is laos<b> communist</b>",
          "why is laos<b> the most bombed country</b>",
          "why is laos<b> so expensive</b>",
          "why is laos<b> landlocked</b>",
          "why is laos<b> poor</b>",
          "why is laos<b> a poor country</b>",
          "why is laos<b> considered undeveloped</b>",
          "why is laos<b> important</b>"
        ],
        "state": "Laos"
      },
      {
        "suggestions": [
          "why is kuwait<b> banned from the olympics</b>",
          "why is kuwait<b> so rich</b>",
          "why is kuwait<b> so hot</b>",
          "why is kuwait<b> banned</b>",
          "why is kuwait<b> suspended from the olympics</b>",
          "why is kuwait<b> important</b>",
          "why is kuwait<b> not allowed in olympics</b>",
          "why is kuwait<b> city so hot</b>",
          "why is kuwait<b> so fat</b>"
        ],
        "state": "Kuwait"
      },
      {
        "suggestions": [
          "why is kazakhstan<b> so big</b>",
          "why is kazakhstan<b> a brick</b>",
          "why is kazakhstan<b> muslim</b>",
          "why is kazakhstan<b> so cold</b>",
          "why is kazakhstan<b> in uefa</b>",
          "why is kazakhstan<b> used for space launches</b>",
          "why is kazakhstan<b> so poor</b>",
          "why is kazakhstan<b> so rich</b>",
          "why is kazakhstan<b> so good at boxing</b>",
          "why is kazakhstan<b> in europe</b>"
        ],
        "state": "Kazakhstan"
      },
      {
        "suggestions": [
          "why is cambodia<b> so poor</b>",
          "why is cambodia<b> so corrupt</b>",
          "why is cambodia<b> so expensive</b>",
          "why is cambodia<b> called the kingdom of wonder</b>",
          "why is cambodia<b> a low income country</b>",
          "why is cambodia<b> corrupt</b>",
          "why is cambodia<b> a developing country</b>",
          "why is cambodia<b> in poverty</b>",
          "why is cambodia<b> kh</b>",
          "why is cambodia<b> called cambodia</b>"
        ],
        "state": "Cambodia"
      },
      {
        "suggestions": [
          "why is lebanon<b> important</b>",
          "why is lebanon<b> library</b>",
          "why is lebanon<b> so liberal</b>",
          "why is lebanon<b> ohio historic</b>",
          "why is lebanon<b> christian</b>",
          "why is lebanon<b> dangerous</b>",
          "why is lebanon<b> called the lebanon</b>",
          "why is lebanon<b> so small</b>",
          "why is lebanon<b> so important</b>",
          "why is lebanon<b> so expensive</b>"
        ],
        "state": "Lebanon"
      },
      {
        "suggestions": [
          "why is kyrgyzstan<b> poor</b>"
        ],
        "state": "Kyrgyzstan"
      },
      {
        "suggestions": [
          "why is liberia<b> poor</b>",
          "why is liberia<b> important</b>",
          "why is liberia<b> in poverty</b>",
          "why is liberia<b> underdeveloped</b>",
          "why is liberia<b> so messed up</b>",
          "why is liberia<b> one of the poorest countries</b>",
          "why is liberia<b> a failed state</b>",
          "why is liberia<b> called liberia</b>",
          "why is liberia<b> not colonized</b>",
          "why is liberia<b> referred to as a constitutional democracy</b>"
        ],
        "state": "Liberia"
      },
      {
        "suggestions": [
          "why is india<b> bad at sports</b>",
          "why is india<b> so poor</b>",
          "why is india<b> so dirty</b>",
          "why is india<b> so populated</b>",
          "why is india<b> considered a subcontinent</b>",
          "why is india<b> called india</b>",
          "why is india<b> overpopulated</b>",
          "why is india<b> so polluted</b>",
          "why is india<b> so hot</b>",
          "why is india<b> so filthy</b>"
        ],
        "state": "India"
      },
      {
        "suggestions": [
          "why is iraq<b> so hot</b>",
          "why is iraq<b> at war</b>",
          "why is iraq<b> important to the united states</b>",
          "why is iraq<b> a desert</b>",
          "why is iraq<b> important to the world</b>",
          "why is iraq<b> so poor</b>",
          "why is iraq<b> poor</b>",
          "why is iraq<b> important to the us</b>",
          "why is iraq<b> so corrupt</b>",
          "why is iraq<b> so dangerous</b>"
        ],
        "state": "Iraq"
      },
      {
        "suggestions": [
          "why is kosovo<b> not in the un</b>",
          "why is kosovo<b> important</b>",
          "why is kosovo<b> a country</b>",
          "why is kosovo<b> muslim</b>",
          "why is kosovo<b> disputed</b>",
          "why is kosovo<b> not part of albania</b>",
          "why is kosovo<b> not recognized</b>",
          "why is kosovo<b> not a country</b>",
          "why is kosovo<b> in the olympics</b>",
          "why is kosovo<b> so poor</b>"
        ],
        "state": "Kosovo"
      },
      {
        "suggestions": [
          "why is south korea<b> so good at archery</b>",
          "why is south korea<b> important</b>",
          "why is south korea<b> so rich</b>",
          "why is south korea<b> so bad</b>",
          "why is south korea<b> internet so fast</b>",
          "why is south korea<b> good at olympics</b>",
          "why is south korea<b> so racist</b>",
          "why is south korea<b> so populated</b>",
          "why is south korea<b> calling me</b>",
          "why is south korea<b> and north korea divided</b>"
        ],
        "state": "South Korea"
      },
      {
        "suggestions": [
          "why is sri lanka<b> not part of india</b>",
          "why is sri lanka<b> famous</b>",
          "why is sri lanka<b> so expensive</b>",
          "why is sri lanka<b> a developing country</b>",
          "why is sri lanka<b> hotter than nepal</b>",
          "why is sri lanka<b> called sri lanka</b>",
          "why is sri lanka<b> called the pearl of the indian ocean</b>",
          "why is sri lanka<b> so poor</b>",
          "why is sri lanka<b> called teardrop of india</b>",
          "why is sri lanka<b> important to india</b>"
        ],
        "state": "Sri Lanka"
      },
      {
        "suggestions": [
          "why is japan<b> so weird</b>",
          "why is japan<b> considered to be an archipelago</b>",
          "why is japan<b> called japan</b>",
          "why is japan<b> so safe</b>",
          "why is japan<b> so clean</b>",
          "why is japan<b> so perverted</b>",
          "why is japan<b> so expensive</b>",
          "why is japan<b> in debt</b>",
          "why is japan<b> not in the olympics</b>",
          "why is japan<b> so healthy</b>"
        ],
        "state": "Japan"
      },
      {
        "suggestions": [
          "why is israel<b> so important</b>",
          "why is israel<b> bad</b>",
          "why is israel<b> hated</b>",
          "why is israel<b> important to the usa</b>",
          "why is israel<b> a cube</b>",
          "why is israel<b> in uefa</b>",
          "why is israel<b> called israel</b>",
          "why is israel<b> called the holy land</b>",
          "why is israel<b> so important to god</b>",
          "why is israel<b> important to judaism</b>"
        ],
        "state": "Israel"
      },
      {
        "suggestions": [
          "why is libya<b> a failed state</b>",
          "why is libya<b> important</b>",
          "why is libya<b> at war</b>",
          "why is libya<b> so hot</b>",
          "why is libya<b> important to the united states</b>",
          "why is libya<b> bad</b>",
          "why is libya<b> so dangerous</b>",
          "why is libya<b> in a civil war</b>",
          "why is libya<b> dangerous</b>",
          "why is libya<b> so lawless</b>"
        ],
        "state": "Libya"
      },
      {
        "suggestions": [
          "why is lesotho<b> inside south africa</b>",
          "why is lesotho<b> in the middle of south africa</b>",
          "why is lesotho<b> landlocked</b>",
          "why is lesotho<b> an enclave of south africa</b>",
          "why is lesotho<b> known as the switzerland of africa</b>",
          "why is lesotho<b> poor</b>",
          "why is lesotho<b> so poor</b>",
          "why is lesotho<b> and swaziland in south africa</b>",
          "why is lesotho<b> known as the mountain kingdom</b>",
          "why is lesotho<b> part of south africa</b>"
        ],
        "state": "Lesotho"
      },
      {
        "suggestions": [
          "why is luxembourg<b> so rich</b>",
          "why is luxembourg<b> so small</b>",
          "why is luxembourg<b> famous</b>",
          "why is luxembourg<b> a country</b>",
          "why is luxembourg<b> independent</b>",
          "why is luxembourg<b> not part of germany</b>",
          "why is luxembourg<b> a tax haven</b>",
          "why is luxembourg<b> a french speaking country</b>",
          "why is luxembourg<b> a grand duchy</b>",
          "why is luxembourg<b> so productive</b>"
        ],
        "state": "Luxembourg"
      },
      {
        "suggestions": [
          "why is latvia<b> population declining</b>",
          "why is latvia<b> so poor</b>",
          "why is latvia<b> famous</b>"
        ],
        "state": "Latvia"
      },
      {
        "suggestions": [
          "why is morocco<b> dangerous</b>",
          "why is morocco<b> mar</b>",
          "why is morocco<b> a developing country</b>",
          "why is morocco<b> poor</b>",
          "why is morocco<b> not in the au</b>",
          "why is morocco<b> called the red city</b>",
          "why is morocco<b> safe</b>",
          "why is morocco<b> abbreviation mar</b>",
          "why is morocco<b> not part of the african union</b>",
          "why is morocco<b> important</b>"
        ],
        "state": "Morocco"
      },
      {
        "suggestions": [
          "why is lithuania<b> so small</b>",
          "why is lithuania<b> so poor</b>",
          "why is lithuania<b> so suicidal</b>",
          "why is lithuania<b> so good at basketball</b>",
          "why is lithuania<b> population decreasing</b>",
          "why is lithuania<b> spelled lietuva</b>",
          "why is lithuania<b> famous</b>",
          "why is lithuania<b> the best country in the world</b>",
          "why lithuania is<b> the best</b>",
          "why is<b> russia in between poland and </b>lithuania"
        ],
        "state": "Lithuania"
      },
      {
        "suggestions": [
          "why is moldova<b> poor</b>",
          "why is moldova<b> not part of romania</b>",
          "why is moldova<b> separate from romania</b>",
          "why is moldova<b> the poorest country in europe</b>",
          "why is moldova<b> a failed state</b>",
          "why is moldova<b> a country</b>",
          "why is moldova<b> not in the eu</b>"
        ],
        "state": "Moldova"
      },
      {
        "suggestions": [
          "why is mali<b> important</b>",
          "why is mali<b> so poor</b>",
          "why is mali<b> overpopulated</b>",
          "why is mali<b> poor</b>",
          "why is mali<b> a poor country</b>",
          "why is mali<b> a french speaking country</b>",
          "why is mali<b> a less developed country</b>",
          "why is mali<b> a developing country</b>",
          "why is mali<b> a francophone country</b>",
          "why is mali<b> in poverty</b>"
        ],
        "state": "Mali"
      },
      {
        "suggestions": [
          "why is macedonia<b> called fyrom</b>",
          "why is macedonia<b> important</b>",
          "why is macedonia<b> mkd</b>",
          "why is macedonia<b> not in the eu</b>",
          "why is macedonia<b> so poor</b>",
          "why is macedonia<b> greek</b>",
          "why macedonia is<b> not greek</b>",
          "why is<b> alexander of </b>macedonia<b> great</b>"
        ],
        "state": "Macedonia"
      },
      {
        "suggestions": [
          "why is madagascar<b> a biodiversity hotspot</b>",
          "why is madagascar<b> poor</b>",
          "why is madagascar<b> important</b>",
          "why is madagascar<b> vanilla the best</b>",
          "why is madagascar<b> unique</b>",
          "why is madagascar<b> a french speaking country</b>",
          "why is madagascar<b> so unique</b>",
          "why is madagascar<b> rated pg</b>",
          "why is madagascar<b> a francophone country</b>",
          "why is madagascar<b> a developing country</b>"
        ],
        "state": "Madagascar"
      },
      {
        "suggestions": [
          "why is myanmar<b> still called burma</b>",
          "why is myanmar<b> so poor</b>",
          "why is myanmar<b> also called burma</b>",
          "why is myanmar<b> sanctioned</b>",
          "why is myanmar<b> called burma</b>",
          "why is myanmar<b> called the golden land</b>",
          "why is myanmar<b> not a democratic country</b>",
          "why is myanmar<b> called the land of golden pagodas</b>",
          "why is myanmar<b> a non democratic country</b>",
          "why is myanmar<b> expensive</b>"
        ],
        "state": "Myanmar"
      },
      {
        "suggestions": [
          "why is mongolia<b> poor</b>",
          "why is mongolia<b> so cold</b>",
          "why is mongolia<b> so sparsely populated</b>",
          "why is mongolia<b> democratic</b>",
          "why is mongolia<b> cold</b>",
          "why is mongolia<b> population so low</b>",
          "why is mongolia<b> not part of china</b>",
          "why is mongolia<b> never in the news</b>",
          "why is mongolia<b> so polluted</b>",
          "why is mongolia<b> so big</b>"
        ],
        "state": "Mongolia"
      },
      {
        "suggestions": [],
        "state": "Montenegro"
      },
      {
        "suggestions": [
          "why is malawi<b> poor</b>",
          "why is malawi<b> the poorest country in the world</b>",
          "why is malawi<b> so poor</b>",
          "why is malawi<b> a developing country</b>",
          "why is malawi<b> in debt</b>",
          "why is malawi<b> still poor</b>",
          "why is malawi<b> underdeveloped</b>",
          "why is malawi<b> the warm heart of africa</b>",
          "why is malawi<b> not developing</b>"
        ],
        "state": "Malawi"
      },
      {
        "suggestions": [
          "why is mozambique<b> so poor</b>",
          "why is mozambique<b> underdeveloped</b>",
          "why is mozambique<b> in the commonwealth</b>",
          "why is mozambique<b> a developing country</b>",
          "why is mozambique<b> called mozambique</b>",
          "why is mozambique<b> part of the commonwealth</b>"
        ],
        "state": "Mozambique"
      },
      {
        "suggestions": [
          "why is mauritania<b> sparsely populated</b>",
          "why is mauritania<b> so sparsely populated</b>"
        ],
        "state": "Mauritania"
      },
      {
        "suggestions": [
          "why is namibia<b> sparsely populated</b>",
          "why is namibia<b> a developing country</b>",
          "why is namibia<b> not a happy country</b>",
          "why is namibia<b> a happy country</b>",
          "why is namibia<b> a desert</b>",
          "why is namibia<b> a democratic country</b>",
          "why is namibia<b> a beautiful country</b>",
          "why is namibia<b> domain so expensive</b>",
          "why is namibia<b> so dry</b>"
        ],
        "state": "Namibia"
      },
      {
        "suggestions": [
          "why is new caledonia<b> french</b>",
          "why is new caledonia<b> so expensive</b>",
          "why is<b> french spoken in </b>new caledonia"
        ],
        "state": "New Caledonia"
      },
      {
        "suggestions": [
          "why is mexico<b> so poor</b>",
          "why is mexico<b> water bad</b>",
          "why is mexico<b> city sinking</b>",
          "why is mexico<b> poor</b>",
          "why is mexico<b> so corrupt</b>",
          "why is mexico<b> called mexico</b>",
          "why is mexico<b> sinking</b>",
          "why is mexico<b> important</b>",
          "why is mexico<b> dangerous</b>",
          "why is mexico<b> not part of nato</b>"
        ],
        "state": "Mexico"
      },
      {
        "suggestions": [
          "why is niger<b> so poor</b>",
          "why is niger<b> called niger</b>",
          "why is niger<b> a bad word</b>",
          "why is niger<b> so underdeveloped</b>",
          "why is niger<b> population increasing</b>",
          "why is niger<b> a developing country</b>",
          "why is niger<b> delta swamp</b>",
          "why is niger<b> the poorest country</b>",
          "why is niger<b> underdeveloped</b>",
          "why is niger<b> in poverty</b>"
        ],
        "state": "Niger"
      },
      {
        "suggestions": [
          "why is malaysia<b> so rich</b>",
          "why is malaysia<b> so poor</b>",
          "why is malaysia<b> muslim</b>",
          "why is malaysia<b> flag similar to the us</b>",
          "why is malaysia<b> split in two</b>",
          "why is malaysia<b> divorcing her husband</b>",
          "why is malaysia<b> so corrupt</b>",
          "why is malaysia<b> in two parts</b>",
          "why is malaysia<b> getting a divorce</b>",
          "why is malaysia<b> so hot</b>"
        ],
        "state": "Malaysia"
      },
      {
        "suggestions": [
          "why is nicaragua<b> so poor</b>",
          "why is nicaragua<b> called nicaragua</b>",
          "why is nicaragua<b> so safe</b>",
          "why is nicaragua<b> in poverty</b>",
          "why is nicaragua<b> a good name for this country</b>",
          "why is nicaragua<b> safe</b>"
        ],
        "state": "Nicaragua"
      },
      {
        "suggestions": [
          "why is nigeria<b> so poor</b>",
          "why is nigeria<b> so rich</b>",
          "why is nigeria<b> important</b>",
          "why is nigeria<b> the richest country in africa</b>",
          "why is nigeria<b> so corrupt</b>",
          "why is nigeria<b> not in fifa</b>",
          "why is nigeria<b> wealthy</b>",
          "why is nigeria<b> rich</b>",
          "why is nigeria<b> known for scams</b>",
          "why is nigeria<b> in a recession</b>"
        ],
        "state": "Nigeria"
      },
      {
        "suggestions": [
          "why is oman<b> split in two</b>",
          "why is oman<b> safe</b>",
          "why is oman<b> peaceful</b>",
          "why is oman<b> so rich</b>",
          "why is oman<b> currency so strong</b>",
          "why is oman<b> so expensive</b>",
          "why is oman<b> air so cheap</b>",
          "why is oman<b> not in opec</b>",
          "why is oman<b> richer than yemen</b>"
        ],
        "state": "Oman"
      },
      {
        "suggestions": [
          "why is peru<b> important</b>",
          "why is peru<b> famous</b>",
          "why is peru<b> so dry</b>",
          "why is peru<b> dangerous</b>",
          "why is peru<b> called the heartland of the incas</b>",
          "why is peru<b> so cold</b>",
          "why is peru<b> poor</b>",
          "why is peru<b> economy growing</b>",
          "why is peru<b> named peru</b>",
          "why is peru<b> so poor</b>"
        ],
        "state": "Peru"
      },
      {
        "suggestions": [
          "why is norway<b> so rich</b>",
          "why is norway<b> not in the eu</b>",
          "why is norway<b> so happy</b>",
          "why is norway<b> so expensive</b>",
          "why is norway<b> so good at winter olympics</b>",
          "why is norway<b> not in the european union</b>",
          "why is norway<b> the happiest country in the world</b>",
          "why is norway<b> killing wolves</b>",
          "why is norway<b> the best democracy</b>",
          "why is norway<b> not part of the eu</b>"
        ],
        "state": "Norway"
      },
      {
        "suggestions": [
          "why is papua new guinea<b> so dangerous</b>",
          "why is papua new guinea<b> split in half</b>",
          "why is papua new guinea<b> so poor</b>",
          "why is papua new guinea<b> geographically unlucky</b>",
          "why is papua new guinea<b> in poverty</b>",
          "why is papua new guinea<b> not part of indonesia</b>",
          "why is papua new guinea<b> called that</b>",
          "why is papua new guinea<b> not part of asia</b>",
          "why is papua new guinea<b> named that</b>",
          "why is papua new guinea<b> a developing country</b>"
        ],
        "state": "Papua New Guinea"
      },
      {
        "suggestions": [
          "why is panama<b> a good place to retire</b>",
          "why is panama<b> famous</b>",
          "why is panama<b> city beach closed</b>",
          "why is panama<b> city named panama city</b>",
          "why is panama<b> important</b>",
          "why is panama<b> so rich</b>",
          "why is panama<b> city beach water brown</b>",
          "why is panama<b> so cheap</b>",
          "why is panama<b> canal needed</b>",
          "why is panama<b> canal important</b>"
        ],
        "state": "Panama"
      },
      {
        "suggestions": [
          "why is pakistan<b> such a mess</b>",
          "why is pakistan<b> obsessed with kashmir</b>",
          "why is pakistan<b> so poor</b>",
          "why is pakistan<b> muslim</b>",
          "why is pakistan<b> an acronym</b>",
          "why is pakistan<b> a terrorist state</b>",
          "why is pakistan<b> and india enemies</b>",
          "why is pakistan<b> important</b>",
          "why is pakistan<b> obsessed with india</b>",
          "why is pakistan<b> so dangerous</b>"
        ],
        "state": "Pakistan"
      },
      {
        "suggestions": [
          "why is nepal<b> so poor</b>",
          "why is nepal<b> flag not rectangular</b>",
          "why is nepal<b> dangerous</b>",
          "why is nepal<b> considered a failed state</b>",
          "why is nepal<b> called nepal</b>",
          "why is nepal<b> time 45 minutes</b>",
          "why is nepal<b> not part of india</b>",
          "why is nepal<b> vulnerable to earthquakes</b>",
          "why is nepal<b> not a democratic country</b>",
          "why is nepal<b> prone to earthquakes</b>"
        ],
        "state": "Nepal"
      },
      {
        "suggestions": [
          "why is new zealand<b> so good at rugby</b>",
          "why is new zealand<b> new</b>",
          "why is new zealand<b> black</b>",
          "why is new zealand<b> so beautiful</b>",
          "why is new zealand<b> called oz</b>",
          "why is new zealand<b> the freest country</b>",
          "why is new zealand<b> called middle earth</b>",
          "why is new zealand<b> dollar so strong</b>",
          "why is new zealand<b> a great place to live</b>",
          "why is new zealand<b> a good place to live</b>"
        ],
        "state": "New Zealand"
      },
      {
        "suggestions": [
          "why is philippines<b> so poor</b>",
          "why is philippines<b> important</b>",
          "why is philippines<b> important to the us</b>",
          "why is philippines<b> corrupt</b>",
          "why is philippines<b> a third world country</b>",
          "why is philippines<b> called philippines</b>",
          "why is philippines<b> internet so slow</b>",
          "why is philippines<b> not in the olympics</b>",
          "why is philippines<b> spelled with a ph and filipino with an f</b>",
          "why is philippines<b> so humid</b>"
        ],
        "state": "Philippines"
      },
      {
        "suggestions": [
          "why is netherlands<b> orange</b>",
          "why is netherlands<b> ned</b>",
          "why is netherlands<b> called dutch</b>",
          "why is netherlands<b> called holland</b>",
          "why is netherlands<b> not in euro cup</b>",
          "why is netherlands<b> called netherlands</b>",
          "why is netherlands<b> so tall</b>",
          "why is netherlands<b> rich</b>",
          "why is netherlands<b> so liberal</b>",
          "why is netherlands<b> wearing orange</b>"
        ],
        "state": "Netherlands"
      },
      {
        "suggestions": [
          "why is italy<b> blue</b>",
          "why is italy<b> shaped like a boot</b>",
          "why is italy<b> called italy</b>",
          "why is italy<b> so corrupt</b>",
          "why is italy<b> the birthplace of the renaissance</b>",
          "why is italy<b> so poor</b>",
          "why is italy<b> a peninsula</b>",
          "why is italy<b> prone to earthquakes</b>",
          "why is italy<b> important</b>",
          "why is italy<b> so racist</b>"
        ],
        "state": "Italy"
      },
      {
        "suggestions": [
          "why is paraguay<b> named paraguay</b>",
          "why is paraguay<b> landlocked</b>",
          "why is paraguay<b> called paraguay</b>",
          "why is paraguay<b> poor</b>",
          "why is paraguay<b> so poor</b>",
          "why is paraguay<b> the happiest country</b>",
          "why is paraguay<b> so happy</b>",
          "why is paraguay<b> suspended from mercosur</b>"
        ],
        "state": "Paraguay"
      },
      {
        "suggestions": [
          "why is qatar<b> so rich</b>",
          "why is qatar<b> rich</b>",
          "why is qatar<b> the richest country in the world</b>",
          "why is qatar<b> dangerous</b>",
          "why is qatar<b> airlines the best</b>",
          "why is qatar<b> from canada</b>",
          "why is qatar<b> so hot</b>",
          "why is qatar<b> called cutter</b>",
          "why is qatar<b> in the news</b>",
          "why is qatar<b> in the news and where is this country</b>"
        ],
        "state": "Qatar"
      },
      {
        "suggestions": [
          "why is portugal<b> so poor</b>",
          "why is portugal<b> so small</b>",
          "why is portugal<b> not part of spain</b>",
          "why is portugal<b> on fire</b>",
          "why is portugal<b> called portugal</b>",
          "why is portugal<b> a separate country from spain</b>",
          "why is portugal<b> important</b>",
          "why is portugal<b> not in the olympics</b>",
          "why is portugal<b> burning</b>",
          "why is portugal<b> independence</b>"
        ],
        "state": "Portugal"
      },
      {
        "suggestions": [
          "why is romania<b> rou</b>",
          "why is romania<b> not in the olympics</b>",
          "why is romania<b> not slavic</b>",
          "why is romania<b> called romania</b>",
          "why is romania<b> poor</b>",
          "why is romania<b> abbreviation rou</b>",
          "why is romania<b> not in rio gymnastics</b>",
          "why is romania<b> not in the 2016 olympics</b>",
          "why is romania<b> gymnastics not at the olympics</b>",
          "why is romania<b> so religious</b>"
        ],
        "state": "Romania"
      },
      {
        "suggestions": [
          "why is puerto rico<b> in the olympics</b>",
          "why is puerto rico<b> in debt</b>",
          "why is puerto rico<b> a us territory</b>",
          "why is puerto rico<b> broke</b>",
          "why is puerto rico<b> separate in olympics</b>",
          "why is puerto rico<b> a commonwealth</b>",
          "why is puerto rico<b> so poor</b>",
          "why is puerto rico<b> not a state</b>",
          "why is puerto rico<b> a separate country in olympics</b>",
          "why is puerto rico<b> not a country</b>"
        ],
        "state": "Puerto Rico"
      },
      {
        "suggestions": [
          "why is rwanda<b> poor</b>",
          "why is rwanda<b> important</b>",
          "why is rwanda<b> currently a repressive state</b>",
          "why is rwanda<b> in the commonwealth</b>",
          "why is rwanda<b> in poverty</b>",
          "why is rwanda<b> so clean</b>",
          "why is rwanda<b> underdeveloped</b>",
          "why is rwanda<b> a developing country</b>",
          "why is rwanda<b> a genocide</b>",
          "why is rwanda<b> at war</b>"
        ],
        "state": "Rwanda"
      },
      {
        "suggestions": [
          "why is western sahara<b> disputed</b>",
          "why is western sahara<b> not a country</b>",
          "why is western sahara<b> important</b>",
          "why is western sahara<b> so sparsely populated</b>",
          "why is western sahara<b> sparsely populated</b>",
          "why is western sahara<b> a part of morocco</b>",
          "why is western sahara<b> not considered a state</b>"
        ],
        "state": "Western Sahara"
      },
      {
        "suggestions": [
          "why is north korea<b> in the olympics</b>",
          "why is north korea<b> bad</b>",
          "why is north korea<b> so poor</b>",
          "why is north korea<b> dangerous</b>",
          "why is north korea<b> a command economy</b>",
          "why is north korea<b> called democratic</b>",
          "why is north korea<b> allowed to compete in the olympics</b>",
          "why is north korea<b> crazy</b>",
          "why is north korea<b> a dictatorship</b>",
          "why is north korea<b> in the un</b>"
        ],
        "state": "North Korea"
      },
      {
        "suggestions": [
          "why is saudi arabia<b> our ally</b>",
          "why is saudi arabia<b> so rich</b>",
          "why is saudi arabia<b> so strict</b>",
          "why is saudi arabia<b> fighting yemen</b>",
          "why is saudi arabia<b> important</b>",
          "why is saudi arabia<b> attacking yemen</b>",
          "why is saudi arabia<b> in yemen</b>",
          "why is saudi arabia<b> a monarchy</b>",
          "why is saudi arabia<b> blamed for 9/11</b>",
          "why is saudi arabia<b> free of mental illness</b>"
        ],
        "state": "Saudi Arabia"
      },
      {
        "suggestions": [
          "why is sudan<b> at war</b>",
          "why is sudan<b> so poor</b>",
          "why is sudan<b> a failed state</b>",
          "why is sudan<b> called the sudan</b>",
          "why is sudan<b> iv hydrophobic</b>",
          "why is sudan<b> dangerous</b>",
          "why is sudan<b> important</b>",
          "why is sudan<b> sanctioned</b>",
          "why is sudan<b> so dangerous</b>",
          "why is sudan<b> on the terror list</b>"
        ],
        "state": "Sudan"
      },
      {
        "suggestions": [
          "why is poland<b> so catholic</b>",
          "why is poland<b> so good civ 5</b>",
          "why is poland<b> so poor</b>",
          "why is poland<b> so cheap</b>",
          "why is poland<b> called poland</b>",
          "why is poland<b> so bad</b>",
          "why is poland<b> so depressing</b>",
          "why is poland<b> so weak</b>",
          "why is poland<b> so conservative</b>",
          "why is poland<b> poor</b>"
        ],
        "state": "Poland"
      },
      {
        "suggestions": [
          "why is senegal<b> poor</b>",
          "why is senegal<b> a french speaking country</b>",
          "why is senegal<b> lake pink</b>",
          "why is<b> gambia in </b>senegal"
        ],
        "state": "Senegal"
      },
      {
        "suggestions": [
          "why is el salvador<b> called el salvador</b>",
          "why is el salvador<b> so small</b>",
          "why is el salvador<b> important</b>",
          "why is el salvador<b> famous</b>",
          "why is el salvador<b> so poor</b>",
          "why is el salvador<b> so dangerous</b>",
          "why is el salvador<b> so violent</b>",
          "why is el salvador<b> dangerous</b>",
          "why is el salvador<b> so densely populated</b>",
          "why is el salvador<b> not in fifa games</b>"
        ],
        "state": "El Salvador"
      },
      {
        "suggestions": [],
        "state": "Solomon Islands"
      },
      {
        "suggestions": [
          "why is somaliland<b> not a state</b>",
          "why is somaliland<b> not recognized as a state</b>",
          "why is somaliland<b> not recognized</b>",
          "why is somaliland<b> not recognised</b>"
        ],
        "state": "Somaliland"
      },
      {
        "suggestions": [
          "why is sierra leone<b> poor</b>",
          "why is sierra leone<b> called freetown</b>",
          "why is sierra leone<b> important</b>",
          "why is sierra leone<b> a developing country</b>",
          "why is sierra leone<b> called sierra leone</b>",
          "why is sierra leone<b> in a civil war</b>",
          "why is sierra leone<b> famous</b>",
          "why is<b> ebola in </b>sierra leone",
          "why is sierra leone<b> so poor</b>"
        ],
        "state": "Sierra Leone"
      },
      {
        "suggestions": [],
        "state": "Republic of Serbia"
      },
      {
        "suggestions": [
          "why is slovakia<b> so poor</b>",
          "why is slovakia<b> so rich</b>",
          "why is slovakia<b> famous</b>"
        ],
        "state": "Slovakia"
      },
      {
        "suggestions": [
          "why is slovenia<b> so rich</b>",
          "why is slovenia<b> so small</b>",
          "why is slovenia<b> famous</b>"
        ],
        "state": "Slovenia"
      },
      {
        "suggestions": [
          "why is suriname<b> in concacaf</b>",
          "why is suriname<b> hindu</b>",
          "why is suriname<b> not in latin america</b>",
          "why is suriname<b> sparsely populated</b>",
          "why is suriname<b> so sparsely populated</b>",
          "why is suriname<b> considered a caribbean country</b>"
        ],
        "state": "Suriname"
      },
      {
        "suggestions": [
          "why is russia<b> in syria</b>",
          "why is russia<b> so big</b>",
          "why is russia<b> bombing aleppo</b>",
          "why is russia<b> banned from the olympics</b>",
          "why is russia<b> bad</b>",
          "why is russia<b> so poor</b>",
          "why is russia<b> attacking syria</b>",
          "why is russia<b> involved in syria</b>",
          "why is russia<b> helping syria</b>",
          "why is russia<b> so crazy</b>"
        ],
        "state": "Russia"
      },
      {
        "suggestions": [
          "why is somalia<b> a failed state</b>",
          "why is somalia<b> so poor</b>",
          "why is somalia<b> so dangerous</b>",
          "why is somalia<b> so unstable</b>",
          "why is somalia<b> important to the world</b>",
          "why is somalia<b> corrupt</b>",
          "why is somalia<b> considered a failed state</b>",
          "why is somalia<b> so bad</b>",
          "why is somalia<b> so dry</b>",
          "why is somalia<b> in poverty</b>"
        ],
        "state": "Somalia"
      },
      {
        "suggestions": [
          "why is south sudan<b> fighting</b>",
          "why is south sudan<b> in a civil war</b>",
          "why is south sudan<b> a failed state</b>",
          "why is south sudan<b> so dangerous</b>",
          "why is south sudan<b> so poor</b>",
          "why is south sudan<b> fighting for independence</b>",
          "why is south sudan<b> poor</b>",
          "why is south sudan<b> a country</b>",
          "why is south sudan<b> in poverty</b>",
          "why is<b> north and </b>south sudan<b> in conflict</b>"
        ],
        "state": "South Sudan"
      },
      {
        "suggestions": [
          "why is sweden<b> so rich</b>",
          "why is sweden<b> so liberal</b>",
          "why is sweden<b> sui</b>",
          "why is sweden<b> so great</b>",
          "why is sweden<b> not in nato</b>",
          "why is sweden<b> abbreviated sui</b>",
          "why is sweden<b> neutral</b>",
          "why is sweden<b> so happy</b>",
          "why is sweden<b> so gay</b>",
          "why is sweden<b> called sweden</b>"
        ],
        "state": "Sweden"
      },
      {
        "suggestions": [
          "why is chad<b> called chad</b>",
          "why is chad<b> always eating</b>",
          "why is chad<b> on bachelor in paradise</b>",
          "why is chad<b> still on bachelor in paradise</b>",
          "why is chad<b> a douche name</b>",
          "why is chad<b> such a jerk</b>",
          "why is chad<b> a failed state</b>",
          "why is chad<b> on paradise</b>",
          "why is chad<b> a developing country</b>",
          "why is chad<b> le clos famous</b>"
        ],
        "state": "Chad"
      },
      {
        "suggestions": [
          "why is swaziland<b> so poor</b>",
          "why is swaziland<b> separate from south africa</b>",
          "why is swaziland<b> in south africa</b>",
          "why is swaziland<b> called the kingdom of swaziland</b>",
          "why is swaziland<b> inside south africa</b>",
          "why is swaziland<b> a monarchy</b>"
        ],
        "state": "Swaziland"
      },
      {
        "suggestions": [
          "why is togo<b> so unhappy</b>",
          "why is togo<b> so poor</b>",
          "why is togo<b> poor</b>"
        ],
        "state": "Togo"
      },
      {
        "suggestions": [
          "why is tajikistan<b> so poor</b>"
        ],
        "state": "Tajikistan"
      },
      {
        "suggestions": [
          "why is thailand<b> so cheap</b>",
          "why is thailand<b> so poor</b>",
          "why is thailand<b> water green</b>",
          "why is thailand<b> the land of smiles</b>",
          "why is thailand<b> so hot</b>",
          "why is thailand<b> important</b>",
          "why is thailand<b> a developing country</b>",
          "why is thailand<b> dangerous</b>",
          "why is thailand<b> under military rule</b>",
          "why is thailand<b> getting bombed</b>"
        ],
        "state": "Thailand"
      },
      {
        "suggestions": [
          "why is turkmenistan<b> so poor</b>"
        ],
        "state": "Turkmenistan"
      },
      {
        "suggestions": [
          "why is tunisia<b> important</b>",
          "why is tunisia<b> so poor</b>",
          "why is tunisia<b> cheap</b>"
        ],
        "state": "Tunisia"
      },
      {
        "suggestions": [
          "why is syria<b> at war</b>",
          "why is syria<b> getting bombed</b>",
          "why is syria<b> important</b>",
          "why is syria<b> being bombed</b>",
          "why is syria<b> being bombed 2016</b>",
          "why is syria<b> bombing aleppo</b>",
          "why is syria<b> fighting</b>",
          "why is syria<b> fighting a civil war</b>",
          "why is syria<b> important to the us</b>",
          "why is syria<b> being attacked 2016</b>"
        ],
        "state": "Syria"
      },
      {
        "suggestions": [
          "why is trinidad and tobago<b> one country</b>",
          "why is trinidad and tobago<b> called that</b>",
          "why is<b> it </b>trinidad and tobago"
        ],
        "state": "Trinidad and Tobago"
      },
      {
        "suggestions": [
          "why is east timor<b> poor</b>",
          "why is east timor<b> called timor leste</b>",
          "why is east timor<b> not in asean</b>",
          "why is east timor<b> called land of fear</b>",
          "why is<b> australia in </b>east timor"
        ],
        "state": "East Timor"
      },
      {
        "suggestions": [
          "why is taiwan<b> called chinese taipei</b>",
          "why is taiwan<b> not considered an official country</b>",
          "why is taiwan<b> called chinese taipei in olympics</b>",
          "why is taiwan<b> important to the us</b>",
          "why is taiwan<b> tpe</b>",
          "why is taiwan<b> important to china</b>",
          "why is taiwan<b> the republic of china</b>",
          "why is taiwan<b> so rich</b>",
          "why is taiwan<b> called republic of china</b>",
          "why is taiwan<b> part of china</b>"
        ],
        "state": "Taiwan"
      },
      {
        "suggestions": [
          "why is uruguay<b> called uruguay</b>",
          "why is uruguay<b> so white</b>",
          "why is uruguay<b> called the oriental republic of uruguay</b>",
          "why is uruguay<b> so good at soccer</b>",
          "why is uruguay<b> called the switzerland of south america</b>",
          "why is uruguay<b> so liberal</b>",
          "why is uruguay<b> so expensive</b>",
          "why is uruguay<b> so successful</b>",
          "why is uruguay<b> oriental republic</b>",
          "why is uruguay<b> not part of argentina</b>"
        ],
        "state": "Uruguay"
      },
      {
        "suggestions": [
          "why is tanzania<b> so poor</b>",
          "why is tanzania<b> not a member of comesa</b>",
          "why is tanzania<b> poor</b>",
          "why is tanzania<b> overpopulated</b>",
          "why is tanzania<b> underdeveloped</b>",
          "why is tanzania<b> so expensive</b>",
          "why is tanzania<b> a developing country</b>",
          "why is tanzania<b> in poverty</b>",
          "why is<b> kilimanjaro in </b>tanzania",
          "why tanzania is<b> united republic</b>"
        ],
        "state": "Tanzania"
      },
      {
        "suggestions": [
          "why is uganda<b> called the pearl of africa</b>",
          "why is uganda<b> so poor</b>",
          "why is uganda<b> so homophobic</b>",
          "why is uganda<b> poor</b>",
          "why is uganda<b> in poverty</b>",
          "why is uganda<b> a poor country</b>",
          "why is uganda<b> population increasing</b>",
          "why is uganda<b> underdeveloped</b>",
          "why is uganda<b> such a poor country</b>",
          "why is uganda<b> a developing country</b>"
        ],
        "state": "Uganda"
      },
      {
        "suggestions": [
          "why is united states<b> eeuu in spanish</b>",
          "why is united states<b> in debt</b>",
          "why is united states<b> so powerful</b>",
          "why is united states<b> in afghanistan</b>",
          "why is united states<b> the greatest country in the world</b>",
          "why is united states<b> so good at olympics</b>",
          "why is united states<b> so rich</b>",
          "why is united states<b> history important</b>",
          "why is united states<b> called america</b>",
          "why is united states<b> a developed country</b>"
        ],
        "state": "United States"
      },
      {
        "suggestions": [
          "why is uzbekistan<b> poor</b>",
          "why is uzbekistan<b> corrupt</b>",
          "why is uzbekistan<b> important</b>"
        ],
        "state": "Uzbekistan"
      },
      {
        "suggestions": [
          "why is vanuatu<b> so expensive</b>",
          "why is vanuatu<b> the riskiest place to live</b>",
          "why is vanuatu<b> a less developed country</b>",
          "why is vanuatu<b> so dangerous</b>",
          "why is vanuatu<b> the riskiest place on earth</b>",
          "why is vanuatu<b> so poor</b>",
          "why is vanuatu<b> the happiest place on earth</b>",
          "why is vanuatu<b> in the news</b>",
          "why is vanuatu<b> a tax haven</b>"
        ],
        "state": "Vanuatu"
      },
      {
        "suggestions": [
          "why is venezuela<b> having a food shortage</b>",
          "why is venezuela<b> collapsing</b>",
          "why is venezuela<b> in a crisis</b>",
          "why is venezuela<b> falling apart</b>",
          "why is venezuela<b> so bad</b>",
          "why is venezuela<b> gas so cheap</b>",
          "why is venezuela<b> protesting</b>",
          "why is venezuela<b> so violent</b>",
          "why is venezuela<b> in an economic crisis</b>",
          "why is venezuela<b> inflation so high</b>"
        ],
        "state": "Venezuela"
      },
      {
        "suggestions": [
          "why is turkey<b> called turkey</b>",
          "why is turkey<b> in nato</b>",
          "why is turkey<b> bad for dogs</b>",
          "why is turkey<b> good for you</b>",
          "why is turkey<b> important to the us</b>",
          "why is turkey<b> fighting the kurds</b>",
          "why is turkey<b> bad for you</b>",
          "why is turkey<b> bacon good for you</b>",
          "why is turkey<b> invading syria</b>",
          "why is turkey<b> fighting syria</b>"
        ],
        "state": "Turkey"
      },
      {
        "suggestions": [
          "why is west bank<b> called west bank</b>",
          "why is west bank<b> important to israel</b>",
          "why is west bank<b> occupied</b>",
          "why is<b> the </b>west bank<b> on the east</b>"
        ],
        "state": "West Bank"
      },
      {
        "suggestions": [
          "why is vietnam<b> poor</b>",
          "why is vietnam<b> communist</b>",
          "why is vietnam<b> divided</b>",
          "why is vietnam<b> so poor</b>",
          "why is vietnam<b> important</b>",
          "why is vietnam<b> so hot</b>",
          "why is vietnam<b> so dirty</b>",
          "why is vietnam<b> a good place to visit</b>",
          "why is vietnam<b> war important</b>",
          "why is vietnam<b> dangerous</b>"
        ],
        "state": "Vietnam"
      },
      {
        "suggestions": [
          "why is ukraine<b> so poor</b>",
          "why is ukraine<b> called the ukraine</b>",
          "why is ukraine<b> important</b>",
          "why is ukraine<b> gymnast not competing</b>",
          "why is ukraine<b> taking 0</b>",
          "why is ukraine<b> taking 0 in olympics</b>",
          "why is ukraine<b> not part of nato</b>",
          "why is ukraine<b> eliminated</b>",
          "why is ukraine<b> gymnast</b>",
          "why is ukraine<b> taking zeros at olympics</b>"
        ],
        "state": "Ukraine"
      },
      {
        "suggestions": [
          "why is zimbabwe<b> money worthless</b>",
          "why is zimbabwe<b> poor</b>",
          "why is zimbabwe<b> a dictatorship</b>",
          "why is zimbabwe<b> under sanctions</b>",
          "why is zimbabwe<b> a failed state</b>",
          "why is zimbabwe<b> in poverty</b>",
          "why is zimbabwe<b> so poor</b>",
          "why is zimbabwe<b> inflation so high</b>",
          "why is zimbabwe<b> population growing</b>",
          "why is zimbabwe<b> not considered as a democratic country</b>"
        ],
        "state": "Zimbabwe"
      },
      {
        "suggestions": [
          "why is yemen<b> so poor</b>",
          "why is yemen<b> being bombed</b>",
          "why is yemen<b> at war</b>",
          "why is yemen<b> a failed state</b>",
          "why is yemen<b> dangerous</b>",
          "why is yemen<b> in stage 2</b>",
          "why is yemen<b> not part of the gcc</b>",
          "why is yemen<b> being attacked</b>",
          "why is yemen<b> starving</b>",
          "why is yemen<b> important to the united states</b>"
        ],
        "state": "Yemen"
      },
      {
        "suggestions": [
          "why is zambia<b> so poor</b>",
          "why is zambia<b> called country of copper</b>",
          "why is zambia<b> in poverty</b>",
          "why is zambia<b> food insecure</b>",
          "why is zambia<b> called a christian nation</b>",
          "why is zambia<b> underdeveloped</b>",
          "why is zambia<b> a christian nation</b>",
          "why is zambia<b> a developing country</b>",
          "why is zambia<b> called a landlocked country</b>"
        ],
        "state": "Zambia"
      },
      {
        "suggestions": [
          "why is south africa<b> rsa</b>",
          "why is south africa<b> za</b>",
          "why is south africa<b> white</b>",
          "why is south africa<b> zaf</b>",
          "why is south africa<b> so rich</b>",
          "why is south africa<b> so dangerous</b>",
          "why is south africa<b> so poor</b>",
          "why is south africa<b> so white</b>",
          "why is south africa<b> not in the olympics</b>",
          "why is south africa<b> important</b>"
        ],
        "state": "South Africa"
      }
    ],
    "query": "why is South Africa "
  }
}
