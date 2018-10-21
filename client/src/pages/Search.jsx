import React, { Component } from 'react';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import Jumbotron from '../components/Jumbotron.jsx';
import Dropdown from '../components/Dropdown.jsx';
import {Typeahead} from 'react-bootstrap-typeahead';
import places from '../components/places.jsx';
import crimes from '../components/crimes.jsx';
import MonthPickerInput from 'react-month-picker-input';
import {Grid, Row, Col, Button } from 'react-bootstrap';

require('react-month-picker-input/dist/react-month-picker-input.css');

class Search extends Component {

  constructor(props) {
    super(props);
    this.state = {
      currentLocation: {
          Title: 'Sydney',
        },
      // currentLocation: 'Sydney',
      currentCrime: {
          title: 'Theft',
        },
      location: places,
      crime: crimes,
      data: {},
      data2: {},
      auth: this.props.auth
    }
    this.handleChange = this.handleChange.bind(this);
    this.getData = this.getData.bind(this);
    this.getData2 = this.getData2.bind(this);
  }

  // componentWillMount() {
  //   this.getData();
  // }


  handleChange(e) {
    this.setState({currentLocation:{Title: e.target.value}});
  };

  getData() {
    const {getAccessToken} = this.props.auth;
    let currLoc = this.state.currentLocation
    let currCrim = this.state.currentCrime.title
    // console.log(getAccessToken())
    // example call: fetch('http:127.0.0.1:5000/Randwick/Theft)
    let fetchReq = 'http://127.0.0.1:5000/' + currLoc.Title + '/' + currCrim 
    console.log(fetchReq)
    fetch(fetchReq, {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json",
        // 'Authorization': `Bearer ${getAccessToken()}`,
      }
    })
    // fetchReq + '/' + this.state.data.crime_rate
      .then(response => response.json())
      .then(response => this.setState({data: response}))
      .then(fetch('http:127.0.0.1:5000/Randwick/Theft/403', {
        method: "GET",
        dataType: "JSON",
        headers: {
          "Content-Type": "application/json"
        }
      }))
      .then(res => res.json())
      .then(response => this.setState({data2: response}))
      .catch(err => console.log)
  }

  getData2() {
    let currLoc = this.state.currentLocation
    let currCrim = this.state.currentCrime.title
    let fetchReq = 'http://127.0.0.1:5000/' + currLoc.Title + '/' + currCrim + '/' + this.state.data.crime_rate
    console.log(fetchReq)
    fetch(fetchReq, {
      method: "GET",
      dataType: "JSON",
      headers: {
        "Content-Type": "application/json"
      }
    })
    .then(res => res.json())
    .then(response => this.setState({data2: response}))
    .catch(err => console.log)
  }

  resetThenSet = (id, stateKey) => {
    let locations = [...this.state.location]
    locations.forEach(item => item.selected = false);
    locations[id].selected = true;
    
    let crimes = [...this.state.crime]
    crimes.forEach(item => item.selected = false);
    crimes[id].selected = true;
    if(stateKey === 'location'){
      this.setState({currentLocation: locations[id]})
    }
    if (stateKey === 'crime') {
      this.setState({currentCrime: crimes[id]})
      //console.log(crimes[id]);
    }
  }


  render() {
    this.getData();
    this.getData2();
    let currLoc = this.state.currentLocation
    let currCrim = this.state.currentCrime.title
    let map;
    
    const { isAuthenticated } = this.props.auth;
    console.log(this.state.data2) //@Neil you have the data here, do some fancy shit.

    if(currLoc){
      map = "https://www.google.com/maps/embed/v1/place?q="+currLoc.Title+"&key=AIzaSyDyWKb8MrWqGlMtGJt54mTMCXipHcs5UNs"
    } else {
      map = "https://www.google.com/maps/embed/v1/place?q=Sydney&key=AIzaSyDyWKb8MrWqGlMtGJt54mTMCXipHcs5UNs"
    }
        
    let stat;
    let stat2;
    if (currLoc && currCrim) {
      //stat = <h2>{currCrim} in {currLoc.Title} : {currLoc[currCrim]}</h2>
      stat = <h2>Rate of {currCrim} in {currLoc.Title} : {this.state.data.crime_rate}</h2>
      stat2 = <h2>{currLoc.Title} is a {this.state.data2.status} suburb with {this.state.data2.percentage_change}% crime probability</h2>
      this.getData()
      this.getData2()
    }
    
    // Check auth
    if (isAuthenticated()){
      console.log("Working")
      console.log(this.state.data)
    } else {
      console.log("Not autheticated")
    }

    return (
      <div >
        <Navbar />
        <Jumbotron title="Search" subtitle="Search anything, it'll pop up on the map."/>
        <Grid>
          <Row className="show-grid">
            <Col md={12}>
              <h2>Search</h2>
              <form>
                <Typeahead
                  type="text"
                  labelKey="Title"
                  options={places}
                  placeholder="Choose a suburb..."
                  onChange={(selected) => this.setState({currentLocation: selected[0]})}
                />
              </form>
              <br />
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Dropdown
                titleHelper="Crime"
                title="Theft"
                list={this.state.crime}
                resetThenSet={this.resetThenSet}
              />
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <div>
                <MonthPickerInput
                  onChange={function(maskedValue, selectedYear, selectedMonth) {
                    console.log(maskedValue, selectedYear, selectedMonth);
                  }}
                />
                <br />
              </div>
            </Col>
            <Col md={3}>
              <div>
                <MonthPickerInput
                  onChange={function(maskedValue, selectedYear, selectedMonth) {
                    console.log(maskedValue, selectedYear, selectedMonth);
                  }}
                />
              </div>
              <br />
            </Col>
            <Row>
            <Col md={3}>
              <div>
                <Button href='/results' bsStyle="primary">Submit</Button>
              </div>
              <br />
            </Col>
          </Row>
          <Col md={6}>
              {stat}
              <br />
            </Col>
            <Col md={6}>
              {stat2}
              <br />
            </Col>
            <Col md={6}>
              <iframe width="600" height="450" frameBorder="0" src={map} allowFullScreen></iframe>
            </Col>
          </Row>
        </Grid>
        <br />
        <Footer />
      </div>
    );
  }
}

export default Search


