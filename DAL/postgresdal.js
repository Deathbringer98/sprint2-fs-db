const { Pool } = require('pg');

// PostgreSQL pool setup
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'movie_db',
    password: '1998',
    port: 5432,
});

// const getMoviesByTitle = async (title) => {
//     const query = 'SELECT * FROM movies WHERE title ILIKE $1'; // ILIKE for case-insensitive search
//     try {
//         const { rows } = await pool.query(query, [`%${title}%`]);
//         return rows;
//     } catch (error) {
//         console.error('Error getting movies by title:', error);
//         throw error;
//     }
// };

// const createMovie = async (movieDetails) => {
//     // Adjust the query to match the actual columns in your 'movies' table
//     const query = 'INSERT INTO movies(title, director, release_year) VALUES ($1, $2, $3) RETURNING *';
//     try {
//         const { rows } = await pool.query(query, [movieDetails.title, movieDetails.director, movieDetails.release_year]);
//         return rows[0];
//     } catch (error) {
//         console.error('Error creating new movie:', error);
//         throw error;
//     }
// };

// // Example function to update a movie's details
// const updateMovie = async (id, movieDetails) => {
//     const query = 'UPDATE movies SET title = $1, director = $2, release_year = $3 WHERE id = $4 RETURNING *';
//     try {
//         const { rows } = await pool.query(query, [movieDetails.title, movieDetails.director, movieDetails.release_year, id]);
//         return rows[0];
//     } catch (error) {
//         console.error('Error updating movie:', error);
//         throw error;
//     }
// };

// // Example function to delete a movie
// const deleteMovie = async (id) => {
//     const query = 'DELETE FROM movies WHERE id = $1 RETURNING *';
//     try {
//         const { rows } = await pool.query(query, [id]);
//         return rows[0];
//     } catch (error) {
//         console.error('Error deleting movie:', error);
//         throw error;
//     }
// };

module.exports = {
    getMoviesByTitle,
    createMovie,
    updateMovie,
    deleteMovie,
    // Add more functions as needed
};
