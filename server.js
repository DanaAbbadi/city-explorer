'use strict';
require('dotenv').config();

const express = require('express');

// for secuirty
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);

// .env will contain port and all APIs keys

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

    let SQL = `SELECT * FROM locations where location_name =$1;`;
    let values = [city];
    return client.query(SQL, values)
        .then(results => {
            if (results.rowCount) {
                return results.rows;
            }
            else {
                let key = process.env.GEOCODE_API_KEY;
                let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;



                return superagent.get(url)
                    .then(geoData => {
                        const newLocation = new Cities(city, geoData.body);
                        let SQL = `INSERT INTO locations (location_name,formated_query,location_lon,location_lat) VALUES($1,$2,$3,$4)`;
                        let safeValues = [city, newLocation.formatted_query, newLocation.latitude, newLocation.longitude];
                        return client.query(SQL, safeValues)
                            .then(results => {
                                return newLocation
                            })
                    })
            }

        })


}


var latArray;
var lonArray;



function weatherHandler(req, res) {
    const city = req.query.city;
    weatherData(city)
        .then(allNewWeather => {
            res.send(allNewWeather);
        })
}


function weatherData(city) {
                 let weatherKey = process.env.WEATHER_API_KEY;
                let get_Lat = latArray;
                let get_Lon = lonArray;
                let weatherUrl = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${get_Lat}&lon=${get_Lon}&key=${weatherKey}`;

                let allNewWeather;
                return superagent.get(weatherUrl)
                    .then(weaData => {
                        let arr = weaData.body.data;
                        allNewWeather = arr.map(item => {
                            let newWeather = new CityWeather(item);
                            return newWeather;

                        })
                        allNewWeather.splice(8);
                        return allNewWeather;

                    })
            }
      






function trailsHandler(req, res) {
    const city = req.query.city;

    // trailsData(city)
    //     .then(allNewTrails => {
    //         res.send(allNewTrails);
    //     })

    trailsData(city)
        .then(allNewTrails => {
            res.send(allNewTrails);
        })

}

function trailsData(city) {
    let trailsKey = process.env.TRAIL_API_KEY;
    let get_Lat = latArray;
    let get_Lon = lonArray;
    let trailsUrl = `https://www.hikingproject.com/data/get-trails?lat=${get_Lat}&lon=${get_Lon}&key=${trailsKey}`;
    // console.log(trailsUrl);

    return superagent.get(trailsUrl)
        .then(getTrailss => {
            let arr = getTrailss.body.trails;
            let allNewTrails = arr.map(item => {
                let newtrail = new CityTrils(item);
                return newtrail;
            })
            return allNewTrails;
        })

    // return superagent.get(weatherUrl)
    // .then(weaData => {
    //     let arr = weaData.body.data;
    //     let allNewWeather = arr.map(item => {
    //         let newWeather = new CityWeather(item);
    //         return newWeather;
    //     })
    //     allNewWeather.splice(8);
    //     return allNewWeather;

    // })
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
    // latArray.push(this.latitude);
    lonArray = this.longitude;
    latArray = this.latitude;
}


function CityWeather(weatherData) {
    this.forecast = weatherData.weather.description;
    var dateFormat = new Date(weatherData.valid_date);
    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var day = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
    this.time = day[dateFormat.getDay()] + " " + months[dateFormat.getMonth()] + " " + dateFormat.getDate() + " " + dateFormat.getFullYear();
}

function CityTrils(trailsData) {
    this.name = trailsData.name;
    this.location = trailsData.location;
    this.length = trailsData.length;
    this.starts = trailsData.starts;
    this.star_votes = trailsData.starVotes;
    this.summary = trailsData.summary;
    this.trail_url = trailsData.url;
    this.conditions = trailsData.conditionStatus;
    // let date = trailsData.conditionDate.splite(' ');
    this.condition_date = trailsData.conditionDate;
    // this.condition_time = date[1];
}



app.get('*', notFound);

app.use(errors);

function notFound(req, res) {
    res.status(404).send('Not Found');
}
function errors(error, req, res) {
    res.status(500).send(error);
}



client.connect()
    .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    })

