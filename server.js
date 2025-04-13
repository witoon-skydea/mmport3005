const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const cookieParser = require('cookie-parser');

// Initialize the app
const app = express();
const PORT = 3005;
const baseUrl = process.env.BASE_URL || '/';

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Session middleware
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.sqlite',
    dir: path.join(__dirname, 'db')
  }),
  secret: 'mixtrip-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 1 day
    secure: process.env.NODE_ENV === 'production'
  }
}));

// Set base URL for views
app.use((req, res, next) => {
  req.baseUrl = baseUrl;
  next();
});

// Routes
const routes = require('./routes');
app.use('/', routes);

// Start the server
app.listen(PORT, () => {
  console.log(`MixTrip Trip Planning Service running on port ${PORT}`);
  console.log(`Base URL: ${baseUrl}`);
});