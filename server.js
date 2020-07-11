'use strict';

// .env will contain port and all APIs keys
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const superagent = require('superagent');
const { response } = require('express');

///////////////////////////////
// install them in your terminal: npm i express cors dotenv superagent pg
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
app.get('/yelp', yelpHandler);
app.get('/movies', moviesHandler);




function locationHandler(request, response) {
    const city = request.query.city;
    locationData(city)
        .then(newLocation => {
            response.send(newLocation);
        })
}


function locationData(city) {
     var latArray=[];
     var lonArray=[];
    let SQL = `SELECT * FROM locations where location_name =$1;`;
    let values = [city];
    return client.query(SQL, values)
        .then(results => {
            if (results.rowCount) {
                lonArray.push(results.rowCount.longitude);
                latArray.push(results.rowCount.latitude);
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

var latArray=[];
var lonArray=[];

function weatherHandler(req, res) {
    const city = req.query.city;
    weatherData(city)
        .then(allNewWeather => {
            res.send(allNewWeather);
        })
}


function weatherData(city) {
                let weatherKey = process.env.WEATHER_API_KEY;
                let get_Lat = latArray[0];
                let get_Lon = lonArray[0];
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
    trailsData(city)
        .then(allNewTrails => {
            res.send(allNewTrails);
        })

}

function trailsData(city) {
    let trailsKey = process.env.TRAIL_API_KEY;
    let get_Lat = latArray[0];
    let get_Lon = lonArray[0];
    let trailsUrl = `https://www.hikingproject.com/data/get-trails?lat=${get_Lat}&lon=${get_Lon}&key=${trailsKey}`;

    return superagent.get(trailsUrl)
        .then(getTrailss => {
            let arr = getTrailss.body.trails;
            let allNewTrails = arr.map(item => {
                let newtrail = new CityTrils(item);
                return newtrail;
            })
            return allNewTrails;
        })
}


function yelpHandler(require,response){
    let city = require.query.city;
    let YELP_API_KEY = process.env.YELP_API_KEY;
    let latitude = latArray[0];
    let longitude = lonArray[0];
    let url =`https://api.yelp.com/v3/businesses/search?location=${city}&limit=5`;
    superagent.get(url)
    .set('Authorization', `Bearer ${YELP_API_KEY}`)
        .then(yelpResponse => {
        let yelpData = yelpResponse.body.businesses;
        response.send(yelpData.map(data => {
            console.log('here inside');
            return new Cityyelp(data);
        }));
    }).catch(error => errors(error, require, response));
}



function moviesHandler(request, response) {
    let city = request.query.city;
    // console.log(city)
    getMoviesData(city)
        .then((data) => {
            response.status(200).send(data);
        });
}
function getMoviesData(city) {
    const moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${city}`
    return superagent.get(moviesUrl)
        .then((moviesData) => {
            console.log(moviesData.body);
            const movies = moviesData.body.results.map((data) => new Movies(data));
            return movies;
        });
}



function Cities(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData[0].display_name;
    this.latitude = geoData[0].lat;
    this.longitude = geoData[0].lon;
    lonArray.push(this.longitude);
    latArray.push(this.latitude);
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

function Cityyelp(data) {
    this.title = data.title;
    this.image_url = data.image_url;
    this.price = data.price;
    this.rating = data.rating;
    this.url = data.url;
  }


  function Movies(data) {
    this.title = data.title;
    this.overview = data.overview;
    this.average_votes = data.vote_average;
    this.total_votes = data.vote_count;
    this.image_url = `https://image.tmdb.org/t/p/w500/${data.poster_path}`;
    this.popularity = data.popularity;
    this.released_on = data.release_date;
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












































 


















