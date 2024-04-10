CREATE TABLE movie_db (
    Movie_ID VARCHAR(255) PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Release_Year INT,
    Genre VARCHAR(100),
    Director VARCHAR(255),
    Main_Actor VARCHAR(255), 
    Rating VARCHAR(50),
    Runtime VARCHAR(100)
);
