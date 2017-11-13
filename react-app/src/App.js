import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import ChartJs from 'chart.js';
import dateformat from 'dateformat';
import DatePicker from 'react-datepicker';
import moment from 'moment';
 
import 'react-datepicker/dist/react-datepicker.css';

class App extends Component {
  constructor(props) {
    super(props);

    // Class members
    this.timeout = null;
    this.bitcoinLabels = [];
    this.bitcoinData = [];
    this.searchLabels = [];
    this.searchData = [];
    //this.startTime = moment("2013-01-01","YYYY-MM-DD");
    this.endTime = moment();
    this.searchKeyword = "bitcoin bubble";
    
    this.handleKeyword = this.handleKeyword.bind(this);
    this.handleStartDateChange = this.handleStartDateChange.bind(this);
    
    // React component state
    this.state = {
      startTime: moment("2013-01-01","YYYY-MM-DD"),
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
            <div className="col-md-4">
              <p>Compare the price of Bitcoin (log scale, left axis) to the occurrence of a google search (right axis, peak set to 100)</p> 
              <div className="input-group">
                <span className="input-group-addon">Search Keyword</span>
                <input className="form-control" defaultValue="bitcoin bubble" onChange={event => this.handleKeyword(event.target.value)} />
              </div>
            </div>
            <div className="col-md-4 col-md-offset-2">
              <div className="input-group">
                <span className="input-group-addon">Start Date</span>
                <DatePicker
                  selected={this.state.startTime}
                  onChange={this.handleStartDateChange}
                  mindate={new Date("2012-01-01")}
                  maxdate={new Date()}
                  dateformat="YYYY-MM-DD"
                />
              </div>
            </div>
          </div>
        </div>
        
        <Chart data={this.state.chartData} />
      </div>
    );
  }
  componentDidMount() {
    this.getBitcoinData();
    this.getSearchData();
  }
  
  // Input handlers
  handleKeyword(keyword) {
    // Cancel any pending timeouts
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    // Set new timeout
    this.timeout = setTimeout(() => {
      //console.log(keyword);
      this.searchKeyword = keyword;
      this.getSearchData();
    },850);
  }
  handleStartDateChange(moment) {
    this.setState({startTime: moment},() => {
      this.getBitcoinData();
      this.getSearchData();
    });
  }
  
  // Chart Data and Update
  // **** These should probably be pushed into the Chart component, it should handle fetching it's own data
  //      Then we can pass in startDate to the component, but only update it on data change
  getBitcoinData() {
    // Data from Coindesk (see /routes/coindesk.js)
    // Add /api/ to start of endpoint for production    
    var endpoint = "/coindesk/" + this.state.startTime.valueOf() + "-" + this.endTime.valueOf();
    
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
    // Add /api/ to start of endpoint for production
    var endpoint = "/googletrendsapi/" + encodeURIComponent(this.searchKeyword) + "/" + this.state.startTime.valueOf() + "-" + this.endTime.valueOf();
    
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
      this.updateChartData();
    })
    .catch(err => console.log("Fetch error: " + err))
  }
  updateChartData() {
    let chartData = this.state.chartData;
    chartData.labels = this.bitcoinLabels; // Use the dates from coindesk data as a base
    chartData.datasets[0].data = this.bitcoinData;
    chartData.datasets[1].label = '"' + this.searchKeyword + '"';
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
  }
  shouldComponentUpdate(nextProps) {
    // How do I get this thing to update initially, but not later on parent's state.startDate change?
    // This component should only update when the data changes
    console.log(this.props.data.datasets[1].data);
    console.log(nextProps.data.datasets[1].data);
    
    return true;
  }
  render() {
    return(
      <div id="canvasContainer">
        <canvas ref="chart" id="chart" width="400" height="140"></canvas>
      </div>
    );
  }
  componentDidUpdate() {
    if (this.chart) { this.chart.destroy(); }
    this.chart = new ChartJs(this.refs["chart"], {
      type: 'line',
      data: this.props.data,
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