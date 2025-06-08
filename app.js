//jshint esversion:6

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const { connectMongoDB } = require('./DB/connect');

// Import routes and middlewares
const authRoutes = require('./routes/authRoutes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const responseHandler = require('./utils/responseHandler');
const bodyParser = require('body-parser');
const UserRouter = require('./routes/UserRouter');

// Initialize express app
const app = express();

// Connect to MongoDB
connectMongoDB(process.env.MONGO_URI);

// Logging in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Add response handler middleware
app.use(responseHandler);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(',');
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true, // Allow credentials (cookies, authorization headers)
    exposedHeaders: ['set-cookie'], // Expose cookies to the client
  })
);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/entries', UserRouter)

// Test route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3001;
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.listen(PORT, function () {
  console.log(`Server has started on port ${PORT}`);
});