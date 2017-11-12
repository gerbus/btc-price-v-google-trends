import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import Chart from 'chart.js';
import dateformat from 'dateformat';

class App extends Component {
  constructor(props) {
    super(props);
    
    // Chart.js defaults
    Chart.defaults.global.elements.point.radius = 1;
    Chart.scaleService.updateScaleDefaults('logarithmic', {
      ticks: {
        callback: function(tick, index, ticks) {
          return tick.toLocaleString();
        }
      }
    });
    
    // Class members
    this.timeout = null;
    this.bitcoinLabels = [];
    this.bitcoinData = [];
    this.searchLabels = [];
    this.searchData = [];
    this.startTime = new Date("2013-01-01"),
    this.endTime = new Date(),
    
    this.handleKeyword = this.handleKeyword.bind(this);
    
    // React component state
    this.state = {
      chartData: {
        labels: [],
        datasets: [{ 
          label: "Bitcoin Price", 
          data: [],
          backgroundColor: "rgba(220,200,0,0.4)",
          yAxisID: 'bitcoin'
        },
        { 
          label: "", 
          data: [],
          backgroundColor: "rgba(0,127,255,0.4)",
          yAxisID: 'search'
        }]
      }
    };
    this.getBitcoinData(false);
    this.getSearchData("bitcoin bubble");
  }
  getBitcoinData(update) {
    // Data from Coindesk (see /routes/coindesk.js)
    var endpointDev = "/coindesk/" + this.startTime.getTime() + "-" + this.endTime.getTime();
    var endpoint = "/api/coindesk/" + this.startTime.getTime() + "-" + this.endTime.getTime();
    
    fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      //console.log(data);
      this.bitcoinLabels = [];
      this.bitcoinData = [];
      for (var key in data.bpi) {
        this.bitcoinLabels.push(key);
        this.bitcoinData.push(data.bpi[key]);
      }
      if (update) {
        this.updateChartData("");
      }
    })
    .catch(err => console.log("Fetch error: " + err))
  }
  getSearchData(keyword) {
    // Data from Google Trends (see /routes/googletrendsapi.js)
    var endpointDev = "/googletrendsapi/" + encodeURIComponent(keyword) + "/" + this.startTime.getTime() + "-" + this.endTime.getTime();
    var endpoint = "/api/googletrendsapi/" + encodeURIComponent(keyword) + "/" + this.startTime.getTime() + "-" + this.endTime.getTime();
    
    fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      //console.log(data);
      this.searchLabels = [];
      this.searchData = [];
      data.default.timelineData.map(item => {
        let sunday = new Date(item.formattedAxisTime);
        for (let d = 0; d < 7; d++) {
          let day = new Date(sunday);
          day.setDate(day.getDate() + d);
          this.searchLabels.push(dateformat(day,"isoDate"));
          this.searchData.push(item.value[0]);
        }
      });
      //console.log(this.searchLabels);
      this.updateChartData(keyword);
    })
    .catch(err => console.log("Fetch error: " + err))
  }
  updateChartData(keyword) {
    let chartData = this.state.chartData;
    chartData.labels = this.bitcoinLabels; // Use the dates from coindesk data as a base
    chartData.datasets[0].data = this.bitcoinData;
    chartData.datasets[1].label = '"' + keyword + '"';
    chartData.datasets[1].data = [];
    
    // Find values for each of the dates from coindesk data
    this.bitcoinLabels.map(date => {
      let match = false;
      for (let i = 0; i < this.searchLabels.length; i++) {
        if (this.searchLabels[i] == date) {
          chartData.datasets[1].data.push(this.searchData[i]);
          match = true;
          break;
        }
      }
      if (!match) { chartData.datasets[1].data.push(null); }
    });
    this.setState({ chartData: chartData });
  }
  render() {
    // See here for chart.js with react sample: https://tuespetre.github.io/react/responsive/2015/04/17/using-responsive-chart-js-charts-within-react.html
    return (
      <div className="App">
        <header className="App-header">
          <img
            src="http://gerbus.ca/common/img/Gerb-4-transparent.png"
            className="App-logo dance-right" 
            alt="logo" />
          <img 
            src="http://78.media.tumblr.com/5620cf0579e7a55306ee3d08f97963f4/tumblr_ngonptcMpM1rrgn57o1_400.gif" 
            className="App-logo rainbow-spiral" />
          <div className="dance-left App-logo">
          <img 
            src="http://gerbus.ca:3000/static/media/logo.5d5d9eef.svg"
            alt="logo" />
          </div>
          <h1 className="App-title">Bitcoin Price vs Google Search occurrence</h1>
        </header>
        
        <div className="container">
          <div className="row">
          <div className="col-md-3">
            <p>Compare the price of Bitcoin (log scale, left axis) to the occurrence of a google search (right axis, peak set to 100)</p> 
            <div className="input-group">
              <span className="input-group-addon">Search Keyword</span>
              <input className="form-control" defaultValue="bitcoin bubble" onChange={event => this.handleKeyword(event.target.value)} />
            </div>
          </div>
          </div>
        </div>
        
        <div id="canvasContainer">
          <canvas ref="chart" id="chart" width="400" height="140"></canvas>
        </div>
      </div>
    );
  }
  handleKeyword(keyword) {
    // Cancel any pending timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    // Set new timeout
    this.timeout = setTimeout(() => {
      //console.log(keyword);
      this.getSearchData(keyword);
    },850);
  }
  componentDidUpdate() {
    if (this.chart) { this.chart.destroy(); }
    this.chart = new Chart(this.refs["chart"], {
      type: 'line',
      data: this.state.chartData,
      options: {
        scales: { 
          yAxes: [
            { id: 'bitcoin', 
              type: 'logarithmic', 
              position: 'left'
            },
            { id: 'search', 
              type: 'linear', 
              position: 'right',
              ticks: { 
                min: 0,
                max: 100,
                stepSize:50 }
            }
          ] 
        },
      }
    });
  }
}

export default App;