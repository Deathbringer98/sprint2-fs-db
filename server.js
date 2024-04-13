const app = require('./app'); // Import the express application
const PORT = process.env.PORT || 3000; // Define the port

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
