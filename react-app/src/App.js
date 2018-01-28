import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartJs from 'chart.js';
import dateformat from 'dateformat';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';



class App extends Component {
  constructor(props) {
    super(props);

    // Class members
    this.timeout = null;
    this.handleKeyword = this.handleKeyword.bind(this);
    this.handleStartDateChange = this.handleStartDateChange.bind(this);
    
    // React component state
    this.state = {
      searchKeyword: "bitcoin top",
      startTime: moment("2013-01-01","YYYY-MM-DD"),
      endTime: moment()
    };
  }
  render() {
    // See here for chart.js with react sample: https://tuespetre.github.io/react/responsive/2015/04/17/using-responsive-chart-js-charts-within-react.html
    return (
      <div className="App">
        
        <div className="container">
          <div className="row">
            <div className="col-sm-5">
              <p className="intro"> Compare the price of Bitcoin (left axis, log scale) 
                                    to the world-wide frequency of a google search
                                    (right axis, peak set to 100)</p>
            </div>
          </div>
          <div className="row form-group">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-addon">Search Keyword(s)</span>
                <input className="form-control" defaultValue={this.state.searchKeyword} onChange={event => this.handleKeyword(event.target.value)} />
              </div>
              <small>No need to press enter; just wait 850ms!</small>
            </div>
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-addon">Start Date</span>
                <DatePicker
                  selected={this.state.startTime}
                  onChange={this.handleStartDateChange}
                  mindate={this.state.startTime}
                  maxdate={new Date()}
                  dateformat="YYYY-MM-DD"
                />
              </div>
            </div>
          </div>
        </div>
        
        <Chart ref="chart" startTime={this.state.startTime} endTime={this.state.endTime} searchKeyword={this.state.searchKeyword} />
          
      </div>
    );
  }
  
  // Input handlers
  handleKeyword(keyword) {
    // Cancel any pending timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    
    // Set new timeout
    this.timeout = setTimeout(() => {
      this.setState({searchKeyword: keyword},() => {
        let chartComponent = this.refs["chart"];
        chartComponent.getSearchData();
      });
    },850);
  }
  handleStartDateChange(moment) {
    this.setState({startTime: moment},() => {
      let chartComponent = this.refs["chart"];
      chartComponent.getBitcoinData();
      chartComponent.getSearchData();
    });
  }
}






class Chart extends Component {
  constructor(props) {
    super(props);
    
    // Chart.js defaults
    ChartJs.defaults.global.elements.point.radius = 1;
    ChartJs.scaleService.updateScaleDefaults('logarithmic', {
      ticks: {
        callback: function(tick, index, ticks) {
          return tick.toLocaleString();
        }
      }
    });
    
    // State
    this.state = {
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
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
    
    // Class Members
    this.bitcoinLabels = [];
    this.bitcoinData = [];
    this.searchLabels = [];
    this.searchData = [];
  }
  shouldComponentUpdate() {
    return false;
  }
  render() {
    let viewportRatio = this.state.windowHeight / this.state.windowWidth;
    let width = 100;
    let height = Math.floor(50 * viewportRatio);
    if (height > 70) {
      // Mobile max
      height = 70;
    }
    return(
      <div id="canvasContainer">
        <canvas ref="chart" id="chart" width={width} height={height} responsive="true"></canvas>
      </div>
    );
  }
  componentDidMount() {
    // Run initially
    this.getBitcoinData();
    this.getSearchData();
  }
  componentDidUpdate() {
    // Re-draw the chart on updated data
    if (this.chart) { this.chart.destroy(); }
    this.chart = new ChartJs(this.refs["chart"], {
      type: 'line',
      data: this.state.chartData,
      options: {
        scales: { 
          yAxes: [
            { id: 'bitcoin', 
              type: 'logarithmic', 
              position: 'left',
              afterBuildTicks: function(chart) {
                chart.ticks = [];
                chart.ticks.push(10);
                chart.ticks.push(50);
                chart.ticks.push(100);
                chart.ticks.push(500);
                chart.ticks.push(1000);
                chart.ticks.push(5000);
                chart.ticks.push(10000);
                chart.ticks.push(50000);
                chart.ticks.push(100000);
                chart.ticks.push(500000);
              }
            },
            { id: 'search', 
              type: 'linear', 
              position: 'right',
              ticks: { 
                min: 0,
                max: 100,
                stepSize: 50 
              }
            }
          ] 
        },
      }
    });
  }
  
  // Chart Data and Update
  getBitcoinData() {
    // Data from Coindesk (see /routes/coindesk.js)
    
    // Development:
    //var endpoint = "/coindesk/" + this.props.startTime.valueOf() + "-" + this.props.endTime.valueOf();
    // Production:
    var endpoint = "/api/coindesk/" + this.props.startTime.valueOf() + "-" + this.props.endTime.valueOf();
    
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
    })
    .catch(err => console.log("Fetch error: " + err))
  }
  getSearchData() {
    // Data from Google Trends (see /routes/googletrendsapi.js)
    
    //** Sometimes each data point is a day, sometimes a week, sometimes a month. Have to look at formattedTime property of returned data:
    //    month resolution (default) => formattedTime: "Mar 2010"
    //    week resolution (look for hyphen) => formattedTime: "Feb 3 - Feb 9 2013"
    //    day resolution (look for comma) => formattedTime: "Jan 21, 2018"
    
    // Development:
    //var endpoint = "/googletrendsapi/" + encodeURIComponent(this.props.searchKeyword) + "/" + this.props.startTime.valueOf() + "-" + this.props.endTime.valueOf();
    // Production:
    var endpoint = "/api/googletrendsapi/" + encodeURIComponent(this.props.searchKeyword) + "/" + this.props.startTime.valueOf() + "-" + this.props.endTime.valueOf();
    
    fetch(endpoint)
    .then(response => response.json())
    .then(data => {
      //console.log(data);
      this.searchLabels = [];
      this.searchData = [];
      data.default.timelineData.map(item => {
        let n = 0;
        if (item.formattedTime.includes(",")) {
          // Each item is a day
          n = 1;
        } else if (item.formattedTime.includes("-")) {
          // Each item is a week
          n = 7;
        } else {
          // Each item is a month
          n = 28; // for now, just use 28 days for a month
        }
        let start = new Date(item.formattedAxisTime);
        for (let d = 0; d < n; d++) {
          let day = new Date(start);
          day.setDate(day.getDate() + d);
          this.searchLabels.push(dateformat(day,"isoDate"));
          this.searchData.push(item.value[0]);
        }
      });
      //console.log(this.searchLabels);
      this.updateChartData();
    })
    .catch(err => console.log("Fetch error: " + err))
  }
  updateChartData() {
    let chartData = this.state.chartData;
    chartData.labels = this.bitcoinLabels; // Use the dates from coindesk data as a base
    chartData.datasets[0].data = this.bitcoinData;
    chartData.datasets[1].label = '"' + this.props.searchKeyword + '"';
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
    this.setState({ chartData: chartData },() => this.forceUpdate());
  }
}

export default App;
