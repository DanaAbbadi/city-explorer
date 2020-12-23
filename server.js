'use strict';
// .env will contain port and all APIs keys
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
const superagent = require('superagent');
const { response } = require('express');

const PORT = process.env.PORT || 5000;
const app = express();
app.use(cors());
///////////////////////////////
// install them in your terminal: npm i express cors dotenv superagent pg
//////////////////////////////

//homepage '/'
app.get('/', (require, response) => {
    response.status(200).send('Welcome to home page');
})

app.get('/location', locationHandler);
app.get('/weather', weatherHandler);
app.get('/trails', trailsHandler);
app.get('/yelp', yelpHandler);
app.get('/movies', moviesHandler);

// Constructors:

function Location(city,data){
    this.search_query =  city;   
    this.formatted_query = data[0].display_name;
    this.latitude = data[0].lat;
    this.longitude = data[0].lon;
}

function Weather(weatherData){
    this.forecast = weatherData.weather.description;
    this.time = new Date(weatherData.valid_date).toDateString();
}

function Trails(trailsData) {
    this.name = trailsData.name;
    this.location = trailsData.location;
    this.length = trailsData.length;
    this.starts = trailsData.starts;
    this.star_votes = trailsData.starVotes;
    this.summary = trailsData.summary;
    this.trail_url = trailsData.url;
    this.conditions = trailsData.conditionStatus;
    this.condition_date = trailsData.conditionDate;
}

function Cityyelp(data) {
    this.name = data.title;
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
// Handler functions:

function locationHandler(req,res){
    let city = req.query.city;
    let location_API = process.env.GEOCODE_API_KEY;

    let location_url = `https://eu1.locationiq.com/v1/search.php?key=${location_API}&q=${city}&format=json`;

    superagent(location_url)
        .then(result =>{
            let newLocation = new Location(city,result.body);
            res.status(200).json(newLocation);
        })
}

function weatherHandler(req,res){
    let latitude = req.query.latitude;
    let longitude = req.query.longitude;
    let WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    let weatherArray=[];
    let weather_url=`https://api.weatherbit.io/v2.0/forecast/daily?lat=${latitude}&lon=${longitude}&key=${WEATHER_API_KEY}`;

        superagent(weather_url)
            .then(result =>{
                // console.log(result.body);
                weatherArray = result.body.data.map(item =>{
                    return new Weather(item);

                })
                res.status(200).json(weatherArray);
            })
}


function trailsHandler(req,res){

    let latitude = req.query.latitude;
    let longitude = req.query.longitude;
    let TRAIL_API_KEY = process.env.TRAIL_API_KEY;
    let allNewTrails=[];
    let trailsUrl = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&key=${TRAIL_API_KEY}`;
    
         superagent(trailsUrl)
            .then(getTrailss => {
                let arr = getTrailss.body.trails;
                allNewTrails = arr.map(item => {
                    return new Trails(item);
                })
                res.status(200).json(allNewTrails);
            })
    }

function yelpHandler(req,res){
    let search_query = req.query.search_query;
    let YELP_API_KEY = process.env.YELP_API_KEY;

    let url =`https://api.yelp.com/v3/businesses/search?location=${search_query}&limit=5`;
    superagent(url)
        .set('Authorization', `Bearer ${YELP_API_KEY}`)
        .then(yelpResponse=>{
            let yelpData = yelpResponse.body.businesses;
            let allyelp=yelpData.map(data => {
                return new Cityyelp(data);
            })
            res.status(200).json(allyelp);

        })
}


function moviesHandler(request, response) {
    let search_query = request.query.search_query;
    
    const moviesUrl = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIE_API_KEY}&query=${search_query}`
     superagent.get(moviesUrl)
        .then(moviesData => {
            let movies = moviesData.body.results.map(data => new Movies(data));
            response.status(200).json(movies);
        });
}

 

app.get('*', notFound);

app.use(errors);

function notFound(req, res) {
    res.status(404).send('Not Found');
}
function errors(error, req, res) {
    res.status(500).send(error);
}



// client.connect()
//     .then(() => {
        app.listen(PORT, () =>
            console.log(`listening on ${PORT}`)
        );
    // })

