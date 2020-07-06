'use strict';

const express = require('express');

// for secuirty
const cors = require('cors');

// .env will contain port and all APIs keys
require('dotenv').config();

///////////////////////////////
// install them in your terminal: npm i express cors dotenv
//////////////////////////////

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors());

app.get('/', (require, response) => {
    response.status(200).send('testing');
})

app.get('/location', (request, response) => {
    const city = request.query.city;
    const geoData = require('./data/location.json');

    const newLocation = new Cities(city, geoData);
    response.send(newLocation);

})

app.get('/weather', (req, res) => {
    const city = req.query.city;
    const weatherData = require('./data/weather.json');
    let arr = weatherData.data;
    let allNewWeather = [];


    arr.forEach(item => {
        let newWeather = new CityWeather(item);
        allNewWeather.push(newWeather);
    })
    res.send(allNewWeather);
})


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

    // [
    //     {
    //       "forecast": "Partly cloudy until afternoon.",
    //       "time": "Mon Jan 01 2001"
    //     },
    //     {
    //       "forecast": "Mostly cloudy in the morning.",
    //       "time": "Tue Jan 02 2001"
    //     },
    //     ...
    //   ]

    this.forecast = weatherData.weather.description;
    var dateFormat = new Date(weatherData.valid_date);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    this.time = day[dateFormat.getDay()] + " " + months[dateFormat.getMonth()] + " " + dateFormat.getDate() + " " + dateFormat.getFullYear();
}





app.get('*', (req, res) => {
    res.status(404).send('Not Found');
});

app.use((error, req, res) => {
    res.status(500).send(error);
});

app.listen(PORT, () => {
    console.log('listening on port 5000');
})




