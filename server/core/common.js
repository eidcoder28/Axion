import models from "#core/models";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import config from "#core/config";
import { errorMsgs } from "#shared/messages";

export async function requireAuth(req, res, next) {
    if (!req.session.loggedIn || !req.session.userId) {
        return res.status(401).json({ error: errorMsgs.notAuthenticated() });
    }

    const user = await models.Users.findById(req.session.userId).select("username").lean();
    if (!user) {
        return res.status(404).json({ error: errorMsgs.notFound("account") });
    }

    req.user = user;
    next();
}

export function limit(options = {}) {
    const { error = errorMsgs.rateLimited(), ...rateLimitOptions } = options;

    return rateLimit({
        windowMs: config.RATE_LIMIT_WINDOW_MS,
        limit: config.MAIN_RATE_LIMIT_MAX_REQ,
        message: {
            status: 429, error
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            if (req.session?.loggedIn) {
                return req.session.userId;
            }

            return ipKeyGenerator(req.ip);
        },
        ...rateLimitOptions
    });
}

export class AppError extends Error {
    constructor(msg, statusCode = 400) {
        super(msg);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.isOperational = true;
    }
}

export function initSession(req, userId) {
    return new Promise((resolve, reject) => {
        req.session.regenerate(regenErr => {
            const fail = () => reject(new AppError(errorMsgs.sessionInitFailed(), 500));
            if (regenErr) return fail();

            req.session.loggedIn = true;
            req.session.userId = userId;

            req.session.save(saveErr => {
                if (saveErr) return fail();
                resolve();
            });
        });
    });
}
