require("dotenv").config();
require("module-alias/register");

const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const helmet = require("helmet");
const session = require("express-session");
const RedisStore = require("connect-redis").default;

const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");

const app = express();
app.set("trust proxy", 1);
app.use(cookieParser());

const Redis = require("ioredis");
const redisClient = new Redis(process.env.REDIS_URL);

app.use(session({
   store: new RedisStore({
      client:redisClient
   }),
   secret:process.env.SESSION_SECRET,
   resave:false,
   saveUninitialized:true,
   cookie: { secure: process.env.NODE_ENV === "production", httpOnly: true, maxAge: 1000 * 60 * 60 }
}));

app.use(cors());
app.use(
   helmet.contentSecurityPolicy({
      directives: {
         defaultSrc: ["'self'"],
         imgSrc: ["'self'", "https://images.mktw.net", "data:"],
         scriptSrc: ["'self'", "https://cdn.jsdelivr.net"]
      }
   })
);
app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use("/resources", express.static(path.join(__dirname, "resources")));

app.set("views", path.join(__dirname, "components"));
app.set("view engine", "ejs");

// Validation to bring unregistered users to landing page
app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function(request, result, next) {
   next(createError(404));
});

// error handler
app.use(function(error, request, result) {
   // set locals, only providing error in development
   result.locals.message = error.message;
   result.locals.error = request.app.get("env") === "development" ? error : {};

   // render the error page
   console.error(error);
   result.status(error.status || 500);
   return result.redirect("/");
});

module.exports = app;