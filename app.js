var createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const session = require("express-session");
const redis = require('redis');
const connectRedis = require('connect-redis');
require("dotenv").config();

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

//Configure redis client
const RedisStore = connectRedis.default;
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379
});

redisClient.connect().catch(console.error);

app.use(cookieParser());
//Change cookie to secure on HTTPS
app.use(session({
  store: new RedisStore({ client: redisClient  }),
  secret:process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:false,
  cookie: { secure: false, httpOnly: false, maxAge: 1000 * 60 * 10 }
}));

app.use(cors());
app.use(helmet());
app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/resources',express.static(path.join(__dirname,'resources')));


app.set('views', path.join(__dirname, 'components'));
app.set('view engine', 'ejs');

//Validation to bring unregistered users to landing page
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //
  res.sendFile(path.join(__dirname,'views','error.html'));
});

module.exports = app;
