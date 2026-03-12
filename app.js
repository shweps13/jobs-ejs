require("dotenv").config();
const express = require("express");
require("express-async-errors");
const connectDB = require("./db/connect");
const passport = require("passport");
const passportInit = require("./passport/passportInit");
const helmet = require("helmet");
const xss = require("xss-clean");
const rateLimit = require("express-rate-limit");

const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const cookieParser = require("cookie-parser")
const csrf = require("host-csrf");
const csrfMiddleware = csrf.csrf();

const app = express();
app.set("view engine", "ejs");
app.use(helmet());
app.use(xss());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(require("body-parser").urlencoded({ extended: true }));
app.use(cookieParser(process.env.SESSION_SECRET))
app.use(csrfMiddleware);

app.use((req, res, next) => {
    csrf.getToken(req, res);
    next();
});

const url = process.env.MONGO_URI;
const store = new MongoDBStore({
    uri: url,
    collection: "mySessions",
});
store.on("error", function (error) {
    console.log(error);
});

const sessionParms = {
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: store,
    cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
    app.set("trust proxy", 1); // trust first proxy
    sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
app.use(require("connect-flash")());

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(require("./middleware/storeLocals"));
app.get("/", (req, res) => {
    res.render("index");
});
app.use("/sessions", require("./routes/sessionRoutes"));


app.use((req, res, next) => {
    if (req.path == "/multiply") {
        res.set("Content-Type", "application/json");
    } else {
        res.set("Content-Type", "text/html");
    }
    next();
});

app.get("/multiply", (req, res) => {
    const result = req.query.first * req.query.second;
    if (result.isNaN) {
        result = "NaN";
    } else if (result == null) {
        result = "null";
    }
    res.json({ result: result });
});


const secretWordRouter = require("./routes/secretWord");
const jobsRouter = require("./routes/jobs");
const auth = require("./middleware/auth");
app.use("/secretWord", auth, secretWordRouter);
app.use("/jobs", auth, jobsRouter);

app.use((req, res) => {
    res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
    res.status(500).send(err.message);
    console.log(err);
});

const port = process.env.PORT || 3000;

let mongoURL = process.env.MONGO_URI;
if (process.env.NODE_ENV == "test") {
    mongoURL = process.env.MONGO_URI_TEST;
}

const start = async () => {
    try {
        await connectDB(mongoURL || process.env.MONGO_URI);
        const server = app.listen(port, () =>
            console.log(`Server is listening on port ${port}...`)
        );
        return server;
    } catch (error) {
        console.log(error);
        return null;
    }
};

if (process.env.NODE_ENV !== "test") {
    start();
}

module.exports = { app, start };