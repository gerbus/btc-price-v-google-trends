var express = require('express');
var router = express.Router();
var dateformat = require('dateformat');
var fetch = require('node-fetch');


// Fetch Coindesk data and pass to front-end
router.get("/:startTime-:endTime", function(req, res, next) {
  let startTime = new Date(parseInt(req.params.startTime));
  let endTime = new Date(parseInt(req.params.endTime));
  
  const endpoint = "https://api.coindesk.com/v1/bpi/historical/close.json?start=" + dateformat(startTime,"isoDate") + "&end=" + dateformat(endTime,"isoDate");
  
  fetch(endpoint)
  .then(response => response.json())
  .then(data => res.send(data))
  .catch(err => console.log("Fetch error: " + err))
});

module.exports = router;