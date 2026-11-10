import config from "./core/config.js";
import express from "express";
import path from "path";
import session from "express-session";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import errors from "../shared/errors.js";
import postsRouter from "./routes/posts.js";
import authRouter from "./routes/auth.js";
import { limit } from "./core/utils.js";

const __dirname = import.meta.dirname;
const app = express();

mongoose.connect(config.MONGO_URI)
    .then(() => console.log("MongoDB connected!"))
    .catch(err => console.error(err.message));

app.use("/shared", express.static(path.join(__dirname, "..", "shared")));
app.use(express.static(path.join(__dirname, "..", "client"), { index: false }));
app.use(express.json({ limit: config.JSON_BODY_LIMIT }));
app.use(
    session({
        secret: config.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({
            mongoUrl: config.MONGO_URI,
            collectionName: "sessions"
        }),
        cookie: {
            httpOnly: true,
            secure: config.PRODUCTION,
            maxAge: config.MAX_SESSION_AGE,
            sameSite: "lax"
        }
    })
);

const mainLimiter = limit();
app.use(mainLimiter);

app.use("/api/v1", postsRouter);
app.use("/api/v1", authRouter);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.use((req, res) => {
    // Return a simple JSON response for simplicity :)
    res.status(404).json({ error: errors.NOT_FOUND("route") });
});

app.use((err, req, res, next) => {
    if (err.code === 11000) return res.status(409).json({ error: errors.DUPLICATE_RESOURCE() });
    if (err.isCustom) return res.status(err.statusCode).json({ error: err.message });

    // For debugging only :)
    console.error(err);
    return res.status(500).json({ error: errors.UNEXPECTED_ERROR() });
});

app.listen(config.PORT, config.HOST, () => {
    console.log(`Clean Engine live on port ${config.PORT}`);
});