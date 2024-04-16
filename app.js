require('dotenv').config({ path: 'C:/Users/jacka/OneDrive/Desktop/School/Semester 3/Sprint 2/FS DB JS/process.env' });
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();
const path = require('path');
const fs = require('fs').promises;

// User Schema for MongoDB
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
}, { collection: 'users' });
const User = mongoose.model('User', userSchema);

// Movie Schema for MongoDB
const movieSchema = new mongoose.Schema({
    movieID: Number,
    title: String,
    releaseYear: Number,
    genre: String,
    director: String,
    mainActor: String,
    rating: mongoose.Decimal128,
    runtime: Number
});
movieSchema.index({ title: 'text' });
const Movie = mongoose.model('Movie', movieSchema);

// Middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/img', express.static(path.join(__dirname, 'views/img')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
const mongoDbUri = process.env.MONGODB_URI;
mongoose.connect(mongoDbUri);
const dbMongo = mongoose.connection;
dbMongo.on('error', console.error.bind(console, 'MongoDB connection error:'));
dbMongo.once('open', async () => {
    console.log("Connected to MongoDB");
    try {
        await Movie.createIndexes();
        console.log("Text index created");
    } catch (err) {
        console.error("Text index creation failed", err);
    }
});

// PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.POSTGRESQL_CONNECTION_STRING
});

// Session handling
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes
app.get('/', (req, res) => {
    res.render('home', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login', { errors: [] });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.user = { username: user.username, email: user.email };
                res.redirect('/search');
            } else {
                res.render('login', { errors: ['Invalid username or password.'] });
            }
        } else {
            res.render('login', { errors: ['User not found.'] });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { errors: ['An error occurred during the login process.'] });
    }
});

app.get('/register', (req, res) => {
    res.render('register', { errors: [] });
});

app.post('/register', async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if (password !== confirmPassword) {
        res.render('register', { errors: ['Passwords do not match.'] });
        return;
    }
    try {
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]);
        res.redirect('/login');
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).render('register', { errors: ['Registration failed due to an internal error.'] });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Failed to destroy session during logout:', err);
            res.status(500).send('Failed to log out, please try again.');
        } else {
            res.redirect('/');
        }
    });
});

app.get('/search', async (req, res) => {
    if (!req.session.userId || !req.session.user) {
        return res.redirect('/login');
    }

    const { query } = req.query;
    if (!query) {
        return res.render('search', { user: req.session.user, searchResults: [], query: '', error: 'Please enter a search term.' });
    }

    try {
        console.log(`Searching MongoDB for: ${query}`);
        const mongoProjection = {
            _id: 0,
            movieID: 1,
            title: 1,
            releaseYear: 1,
            genre: 1,
            director: 1,
            mainActor: 1,
            rating: 1,
            runtime: 1
        };
        const mongoResults = await dbMongo.collection('movies')
                                         .find({ $text: { $search: query } })
                                         .project(mongoProjection)
                                         .toArray();
        console.log(`MongoDB results: ${JSON.stringify(mongoResults)}`);
        
        console.log(`Searching PostgreSQL for: ${query}`);
        const pgQuery = 'SELECT movie_id, title, release_year, genre, director, main_actor, rating, runtime FROM movie_db WHERE title ILIKE $1';
        const pgResults = await pool.query(pgQuery, [`%${query}%`]);
        console.log(`PostgreSQL results: ${JSON.stringify(pgResults.rows)}`);
        
        const results = mongoResults.concat(pgResults.rows);
        console.log(`Combined results: ${JSON.stringify(results)}`);
        res.render('search', { user: req.session.user, searchResults: results, query });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('search', { user: req.session.user, searchResults: [], query, error: 'An error occurred during the search.' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
