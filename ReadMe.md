---

# My Application Movie Search Engine

This application is a full-stack Node.js project using MongoDB, PostgreSQL, and Express. It includes user authentication, session management, and dual-database configuration for handling different data entities. Below are the setup instructions and how to run the application.

## Prerequisites

Before running the application, make sure you have the following installed:
- Node.js - [Download & Install Node.js](https://nodejs.org/en/download/)
- MongoDB - [Install MongoDB](https://docs.mongodb.com/manual/installation/)
- PostgreSQL - [Install PostgreSQL](https://www.postgresql.org/download/)
- MongoDB Compass (optional for MongoDB management) - [Install Compass](https://www.mongodb.com/try/download/compass)
- Mongosh (MongoDB Shell) - [Install Mongosh](https://docs.mongodb.com/mongodb-shell/install/)
- pgAdmin (optional for PostgreSQL management) - [Install pgAdmin](https://www.pgadmin.org/download/)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://your-repository-url.git](https://github.com/Deathbringer98/sprint2-fs-db.git
   cd your-project-directory
   ```

2. **Install dependencies:**
   Navigate to the project directory and run:
   ```bash
   npm install
   ```
   This will install all the necessary packages listed in your `package.json` file, including `express`, `bcrypt`, `mongoose`, `pg`, etc.

3. **Set up environment variables:**
   Create a `.env` file in your project root directory and update the following keys according to your local setup:
   ```plaintext
   MONGODB_URI=mongodb://localhost:27017/yourdbname
   POSTGRESQL_CONNECTION_STRING=postgresql://username:password@localhost:5432/yourdbname
   SESSION_SECRET=your_secret_key
   PORT=3000
   ```

4. **Database Setup:**
   - **MongoDB:**
     Use MongoDB Compass or Mongosh to create a new database named according to your setup in the `.env` file.
   - **PostgreSQL:**
     Use pgAdmin to create a new database and use the provided schema SQL files to set up tables.

5. **Run Database Migrations and Seeds (if any):**
   If you have migration or seed files, run them to populate your databases with initial data.

## Running the Application

1. **Start the Server:**
   Run the following command to start your Node.js application:
   ```bash
   node app.js
   ```
   This command will initiate the server on the port defined in your `.env` file (default 3000).

2. **Access the Application:**
   Open your web browser and visit `http://localhost:3000` to view and interact with the application.

## Features

- **User Authentication:** Includes login and registration functionalities with encrypted passwords.
- **Session Management:** Manages user sessions with cookies to maintain login state.
- **Dual Database Configuration:** Uses MongoDB for user and movie data, and PostgreSQL for relational data queries.
- **Search Functionality:** Users can search for movies stored in MongoDB or PostgreSQL.
- **Logging:** Logs user search queries in text files for auditing or debugging purposes.

## Additional Information

- **Troubleshooting:** Ensure all environment variables are set correctly and databases are accessible via the URIs provided in the `.env` file.
- **Support:** For any issues or additional questions, please contact the repository owner or submit an issue on GitHub.

# License
MIT LICENSE
---
