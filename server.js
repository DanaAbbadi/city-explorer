'use strict';

const express = require('express');

// for secuirty
const cors = require('cors');

// .env will contain port and all APIs keys
require('dotenv').config();

// superAgent
const superagent = require('superagent');
///////////////////////////////
// install them in your terminal: npm i express cors dotenv
//////////////////////////////

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.get('/', (require, response) => {
    response.status(200).send('Welcome to home page');
})

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);


function locationHandler(request, response) {
    const city = request.query.city;
    // const geoData = require('./data/location.json');
    locationData(city)
        .then(newLocation => {
            response.send(newLocation);
        })
}


function locationData(city) {

    let key = process.env.GEOCODE_API_KEY;
    let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    return superagent.get(url)
        .then(geoData => {
            const newLocation = new Cities(city, geoData.body);
            return newLocation
        })
}





function weatherHandler(req, res) {
    const city = req.query.city;
    // const weatherData = require('./data/weather.json');

    weatherData(city)
        .then( allNewWeather =>{
            res.send(allNewWeather);
        })
}


function weatherData(city) {
    let weatherKey = process.env.WEATHER_API_KEY;
    let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${weatherKey}`;

    return superagent.get(weatherUrl)
        .then(weaData => {
            let arr = weaData.body.data;
            let allNewWeather = arr.map(item => {
                let newWeather = new CityWeather(item);
                return newWeather;
            })
            allNewWeather.splice(8);
            return allNewWeather;

        })

}


function trailsHandler(req,res){
    const city = req.query.city;
    trailsData(city);

}

function trailsData(city){
    let trailsKey = process.env.TRAIL_API_KEY; 
    let get_Lat, get_Lon;
    locationData(city)
        .then((info) =>{
        get_Lat = info.latitude;
        get_Lon = info.longitude;
        let trailsUrl = `https://www.hikingproject.com/data/get-trails?lat=${get_Lat}&lon=${get_Lon}&key=${trailsKey}`;
        // console.log(trailsUrl);
    })
    
    

}

function Cities(city, geoData) {
    //     "search_query": "seattle",
    //   "formatted_query": "Seattle, WA, USA",
    //   "latitude": "47.606210",
    //   "longitude": "-122.332071"
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;

}


function CityWeather(weatherData) {
    this.forecast = weatherData.weather.description;
    var dateFormat = new Date(weatherData.valid_date);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    this.time = day[dateFormat.getDay()] + " " + months[dateFormat.getMonth()] + " " + dateFormat.getDate() + " " + dateFormat.getFullYear();
}

function CityTrils(trailsData){
    // this.name = trailsData.
}



app.get('*', notFound);

app.use(errors);

function notFound(req, res) {
    res.status(404).send('Not Found');
}
function errors(error, req, res) {
    res.status(500).send(error);
}
app.listen(PORT, () => {
    console.log('listening on port 5000');
})




