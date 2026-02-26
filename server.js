const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const mongoSanitize = require('@exortek/express-mongo-sanitize');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
//const swaggerJsDoc = require('swagger-jsdoc');
//const swaggerUI = require('swagger-ui-express');

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 นาที
  max: 100                 // request สูงสุด
});

// const swaggerOptions = {
//   swaggerDefinition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'Library API',
//       version: '1.0.0',
//       description: 'A simple Express VacQ API'
//     },
//     servers: [
//       {
//         url: 'http://localhost:5000/api/v1'
//       }
//     ]
//   },
//   apis: ['./routes/*.js']
// };

// const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Load env vars
dotenv.config({ path: './config/config.env' });

// Connect to database
connectDB();

// Route files
const dentists = require('./routes/dentists');
const appointments = require('./routes/appointments');
const auth = require('./routes/auth');

const app = express();
// Enable advanced query parsing
app.set('query parser', 'extended');
// Body parser
app.use(express.json());
app.use(mongoSanitize());
app.use(helmet());
app.use(xss());
app.use(limiter);
// Cookie parser
app.use(cookieParser());
app.use(hpp());
app.use(cors());


// Mount routers
app.use('/api/v1/dentists', dentists);
app.use('/api/v1/appointments', appointments);
app.use('/api/v1/auth', auth);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    'Server running in',
    process.env.NODE_ENV,
    'mode on port',
    PORT
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
