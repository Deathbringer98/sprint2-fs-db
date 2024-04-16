require('dotenv').config({ path: 'C:/Users/jacka/OneDrive/Desktop/School/Semester 3/Sprint 2/FS DB JS/process.env' });
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();
const path = require('path');

// Body parsing middleware setup
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/img', express.static(path.join(__dirname, 'views/img')));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection setup
const mongoDbUri = process.env.MONGODB_URI;
mongoose.connect(mongoDbUri, { useNewUrlParser: true, useUnifiedTopology: true });
const dbMongo = mongoose.connection;
dbMongo.on('error', console.error.bind(console, 'MongoDB connection error:'));

// User schema and model for MongoDB
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model('User', userSchema);

// PostgreSQL connection setup
const pool = new Pool({
    connectionString: process.env.POSTGRESQL_CONNECTION_STRING
});

// Session middleware setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Routes definition
app.get('/', (req, res) => {
    res.render('home', { user: req.session.user });
});

app.get('/login', (req, res) => {
    res.render('login', { errors: [] });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Attempt to find the user in PostgreSQL database
    try {
        const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                req.session.user = { username: user.username, email: user.email }; // Only save necessary data
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
        await newUser.save(); // Save to MongoDB
        await pool.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hashedPassword]); // Save to PostgreSQL
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
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    const { query } = req.query;
    if (!query) {
        return res.render('search', { user: req.session.user, searchResults: [], query: '', error: 'Please enter a search term.' });
    }
    try {
        const mongoResults = await dbMongo.collection('movies').find({ $text: { $search: query } }).toArray();
        const pgResults = await pool.query('SELECT * FROM movies WHERE title ILIKE $1', [`%${query}%`]);
        const results = [...mongoResults, ...pgResults.rows];
        res.render('search', { user: req.session.user, searchResults: results, query });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('search', { user: req.session.user, searchResults: [], query, error: 'An error occurred during the search.' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
