import config from "#core/config";
import express from "express";
import path from "path";
import session from "express-session";
import MongoStore from "connect-mongo";
import helmet from "helmet";
import { errorMsgs } from "#shared/messages";
import postsRouter from "#routes/posts";
import authRouter from "#routes/auth";
import { limit } from "#core/common";
import { connectMongo } from "#core/database";
import logger from "#core/logger";
import pinoHttp from "pino-http";
import mongoose from "mongoose";

let isShuttingDown = false;
let server;

async function shutdown(signal, exitCode = 0) {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, "Starting graceful shutdown");

    const forceExit = setTimeout(() => {
        logger.fatal("Graceful shutdown timed out, forcing exit");
        logger.flush();
        process.exit(1);
    }, 10000).unref();

    try {
        if (server?.listening) {
            await new Promise((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()));
                server.closeIdleConnections?.();
            });

            logger.info("Server closed");
        }

        if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            logger.info("Mongo connection closed");
        }

        clearTimeout(forceExit);
        logger.info("Graceful shutdown complete");
        logger.flush();
        process.exit(exitCode);
    } catch (err) {
        logger.fatal({ err }, "Error during graceful shutdown");
        logger.flush();
        process.exit(1);
    }
}

process.once("SIGTERM", () => shutdown("SIGTERM", 0));
process.once("SIGINT", () => shutdown("SIGINT", 0));

process.once("uncaughtException", (err) => {
    logger.fatal({ err }, "Uncaught exception");
    shutdown("uncaughtException", 1);
});

process.once("unhandledRejection", (reason) => {
    logger.fatal({ err: reason }, "Unhandled rejection");
    shutdown("unhandledRejection", 1);
});

await connectMongo();

const __dirname = import.meta.dirname;
const app = express();
const clientDistPath = path.join(__dirname, "..", "client", "dist");

app.use(pinoHttp({
    logger,
    autoLogging: {
        ignore: (req) => req.url === "/health",
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url.split("?")[0]
        }),
        res: (res) => ({
            statusCode: res.statusCode
        })
    }
}));

app.use(helmet());
app.use(express.static(clientDistPath, { index: false }));

app.get("/health", limit(), (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    const healthy = dbReady && !isShuttingDown;

    return res.status(healthy ? 200 : 503).json({
        status: healthy ? "ok" : "degraded",
    });
});

app.use(session({
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: "sessions"
    }),
    cookie: {
        httpOnly: true,
        secure: config.PRODUCTION,
        maxAge: config.MAX_SESSION_AGE,
        sameSite: "lax",
    }
}));

app.use(limit({ skip: (req) => req.path.startsWith("/api/v1/auth/") }));
app.use(express.json({ limit: config.JSON_BODY_LIMIT }));
app.use("/api/v1", postsRouter);
app.use("/api/v1", authRouter);

app.get("/", (req, res) => {
    return res.sendFile(path.join(clientDistPath, "index.html"));
});

app.use((req, res) => {
    return res.status(404).json({ error: errorMsgs.notFound("route") });
});

app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
        return res.status(400).json({ error: errorMsgs.invalidRequest() });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({ error: err.message });
    }

    if (err.code === 11000) {
        return res.status(409).json({ error: errorMsgs.duplicateResource("resource") });
    }

    (req.log || logger).error({ err }, "Unhandled request error");
    return res.status(500).json({ error: errorMsgs.unexpectedError() });
});

server = app.listen(config.PORT, config.HOST, () => {
    logger.info(`Live on port ${config.PORT}`);
});