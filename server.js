const { readdirSync } = require('fs');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cors = require('cors');
const colors = require('colors');
const { Server } = require('socket.io');

const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const SocketServer = require('./socket-server');
// Load env vars
dotenv.config({ path: './config/config.env' });

const app = express();

// Body Parser
app.use(express.json());

// Cookie parser
app.use(cookieParser());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Mongo Sanitize
app.use(mongoSanitize());

// Set security headers
app.use(helmet());

// Prevent XSS scripting attack
app.use(xss());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mins
  max: 100,
});
app.use(limiter);

// Prevent http param pollution
app.use(hpp());

// Enable cors
app.use(cors());

// Mount Routers
readdirSync('./routes').map((r) =>
  app.use(`/api/v1/`, require('./routes/' + r))
);

app.use(errorHandler);

const PORT = process.env.PORT || 8000;

const appServer = http.createServer(app);

connectDB();
const server = appServer.listen(PORT, () => {
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`.yellow.bold
  );
});

// socket.io
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: '*',
  },
});

io.on('connection', (socket) => {
  console.log('socket io connected successfully!');
  SocketServer(socket, io);
});

// Handle unhandled promise rejection
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // close sever and exit process
  server.close(() => {
    process.exit(1);
  });
});
