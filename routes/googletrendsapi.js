var express = require('express');
var router = express.Router();
var googletrends = require('google-trends-api');


// Fetch google trends data and pass to front-end
router.get('/:keyword/:startTime-:endTime', function(req, res, next) {
  let startTime = new Date(parseInt(req.params.startTime));
  let endTime = new Date(parseInt(req.params.endTime));
  let keyword = decodeURIComponent(req.params.keyword);
  
  var params = {
    keyword: keyword,
    startTime: startTime,
    endTime: endTime
  };
  
  googletrends.interestOverTime(params)
  .then(data => res.send(data))
  .catch(err => console.log("Fetch error: " + err))
});

module.exports = router;
