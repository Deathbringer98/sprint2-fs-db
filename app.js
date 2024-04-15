require('dotenv').config({ path: 'C:/Users/jacka/OneDrive/Desktop/School/Semester 3/Sprint 2/FS DB JS/process.env' });
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');  // For MongoDB
const { Pool } = require('pg');  // For PostgreSQL
const bcrypt = require('bcrypt');
const saltRounds = 10;  // Salt rounds for bcrypt
const app = express();
const path = require('path');

// Set up body parsing middleware
app.use(express.urlencoded({ extended: true }));  // For parsing application/x-www-form-urlencoded
app.use(express.json());  // For parsing application/json
app.use('/img', express.static('public/img'));
// Connect to the database using Mongoose
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
app.set('views', path.join(__dirname, 'views'));

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
    console.log("Attempting to log in with:", username);  // Debug: Log username attempt
    try {
        const userQuery = 'SELECT * FROM users WHERE username = $1';
        const userResult = await pool.query(userQuery, [username]);

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            const match = await bcrypt.compare(password, user.password);
            if (match) {
                console.log("Password match, setting session and redirecting...");  // Debug: Log success
                req.session.userId = user.id;  // Ensure this session variable is correctly used in your app
                req.session.user = user;  // Optionally add the whole user object
                res.redirect('/search');
            } else {
                console.log("Password mismatch");  // Debug: Log failure
                res.render('login', { errors: ['Invalid username or password.'] });
            }
        } else {
            console.log("User not found");  // Debug: Log failure
            res.render('login', { errors: ['User not found.'] });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).render('login', { errors: ['An error occurred during the login process.'] });
    }
});


// Register routes
app.get('/register', (req, res) => {
    res.render('register', { errors: [] }, function(err, html) {
      if (err) {
        console.log(err);
        res.status(500).send('Error rendering page');
      } else {
        res.send(html);
      }
    });
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
        res.status(500).render('register', { errors: ['Registration failed due to an internal error.', error.message] });
    }
});



// Search route
app.get('/search', async (req, res) => {
    console.log(req.query);  // Should log the query parameters
    if (!req.session.userId) {
        return res.redirect('/login');
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
