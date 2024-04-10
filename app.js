const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose'); // For MongoDB
const { Pool } = require('pg'); // For PostgreSQL
const app = express();

// MongoDB setup
const mongoDbUri = 'your_mongodb_uri_here';
mongoose.connect(mongoDbUri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbMongo = mongoose.connection;
dbMongo.on('error', console.error.bind(console, 'MongoDB connection error:'));

// PostgreSQL setup
const pool = new Pool({
  connectionString: 'your_postgresql_connection_string_here'
  // Additional PostgreSQL config options if necessary
});

// Your database setup and middlewares (like body-parser) would go here

// Setting up session handling
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true } // secure: true only for https!
}));

// Set view engine if you are using one (e.g., EJS)
app.set('view engine', 'ejs');
// home
app.get('/', (req, res) => {
  res.render('home', { user: req.session.user });
});
// login
app.get('/login', (req, res) => {
  res.render('login', { errors: [] });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  // Implement your MongoDB or PostgreSQL logic here for user authentication
  // Since you're not using bcrypt, make sure to have some password comparison mechanism
  // Redirect or render based on the authentication result
});
// register
app.get('/register', (req, res) => {
  res.render('register', { errors: [] });
});

app.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  if (password !== confirmPassword) {
    res.render('register', { errors: ['Passwords do not match.'] });
    return;
  }
  // Implement your MongoDB or PostgreSQL logic here for user registration
  // Make sure to hash the password before storing it, even if you're not using bcrypt
  // Redirect or render based on the registration result
});
// Search
app.get('/search', async (req, res) => {
    if (!req.session.user) {
        // Redirect to login if the user is not logged in
        return res.redirect('/login');
    }

    let { query } = req.query; // Assuming you're passing the search term as a query string

    if (query) {
        try {
            // Example search logic for MongoDB and PostgreSQL

            // MongoDB search (adjust according to your schema and needs)
            const mongoResults = await dbMongo.collection('yourCollection').find({ $text: { $search: query } }).toArray();

            // PostgreSQL search (adjust according to your schema and needs)
            const pgResults = await pool.query('SELECT * FROM yourTable WHERE yourColumn LIKE $1', [`%${query}%`]);

            // Combine results (this is very simplistic, adjust as needed for your application's logic)
            const results = [...mongoResults, ...pgResults.rows];

            res.render('search', { user: req.session.user, searchResults: results, query });
        } catch (error) {
            console.error('Search error:', error);
            res.render('search', { user: req.session.user, searchResults: [], query, error: 'An error occurred during the search.' });
        }
    } else {
        // If there is no query, just render the page without results
        res.render('search', { user: req.session.user, searchResults: [], query: '' });
    }
});

// server.js for express server.
