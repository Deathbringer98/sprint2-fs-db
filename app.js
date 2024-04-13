require('dotenv').config({ path: 'C:/Users/jacka/OneDrive/Desktop/School/Semester 3/Sprint 2/FS DB JS/process.env' });
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');  // For MongoDB
const { Pool } = require('pg');  // For PostgreSQL
const bcrypt = require('bcrypt');
const saltRounds = 10;  // Salt rounds for bcrypt
const app = express();
console.log("MongoDB URI: ", process.env.MONGODB_URI);
console.log("PostgreSQL Connection String: ", process.env.POSTGRESQL_CONNECTION_STRING);
console.log("Session Secret: ", process.env.SESSION_SECRET);
// MongoDB setup
const mongoDbUri = process.env.MONGODB_URI;
mongoose.connect(mongoDbUri); // Removed the deprecated options
const dbMongo = mongoose.connection;
dbMongo.on('error', console.error.bind(console, 'MongoDB connection error:'));

// MongoDB User Schema Setup
const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String
});
const User = mongoose.model('User', userSchema);

// PostgreSQL setup
const pool = new Pool({
    connectionString: process.env.POSTGRESQL_CONNECTION_STRING
});

// Session handling setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }  // This ensures cookies are only used over HTTPS
}));
// Set EJS as the view engine
app.set('view engine', 'ejs');

// Home route
app.get('/', (req, res) => {
    res.render('home', { user: req.session.user });
});

// Login routes
app.get('/login', (req, res) => {
    res.render('login', { errors: [] });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                req.session.userId = user.id;
                res.redirect('/search');  // Redirect to search page if login is successful
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

// Register routes
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
        await newUser.save();  // Save to MongoDB

        const insertQuery = 'INSERT INTO users (username, email, password) VALUES ($1, $2, $3)';
        await pool.query(insertQuery, [username, email, hashedPassword]);  // Save to PostgreSQL

        res.redirect('/login');  // Redirect to login page after successful registration
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).render('register', { errors: ['Registration failed due to an internal error.'] });
    }
});

// Search route
app.get('/search', async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');  // Redirect to login if the user is not logged in
    }

    let { query } = req.query;
    try {
        const mongoResults = await dbMongo.collection('movies').find({ $text: { $search: query } }).toArray();
        const pgResults = await pool.query('SELECT * FROM movies WHERE title LIKE $1', [`%${query}%`]);

        const results = [...mongoResults, ...pgResults.rows];
        res.render('search', { user: req.session.user, searchResults: results, query });
    } catch (error) {
        console.error('Search error:', error);
        res.render('search', { user: req.session.user, searchResults: [], query, error: 'An error occurred during the search.' });
    }
});

app.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`);
});
