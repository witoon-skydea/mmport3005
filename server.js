const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

// Initialize the app
const app = express();
const PORT = 3005;
const baseUrl = process.env.BASE_URL || '/';

// Create and initialize database
const dbPath = path.join(__dirname, 'db', 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // Create visits table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS visits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT,
        ip TEXT
      )
    `);
  }
});

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Track visits middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const ip = req.ip || req.connection.remoteAddress;
  
  db.run('INSERT INTO visits (timestamp, ip) VALUES (?, ?)', [timestamp, ip], (err) => {
    if (err) {
      console.error('Error recording visit:', err.message);
    }
  });
  
  next();
});

// Routes
app.get('/', (req, res) => {
  res.render('index', { 
    port: PORT,
    baseUrl: baseUrl
  });
});

// API route to get visit count
app.get('/api/visits', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM visits', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ visits: row.count });
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});