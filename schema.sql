DROP TABLE IF EXISTS locations;


CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR (255),
    formated_query VARCHAR (255),
    location_lon VARCHAR (255),
    location_lat VARCHAR (255)
);

