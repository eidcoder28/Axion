import "dotenv/config";
import sharedConfig from "#shared/config";
import { envSchema } from "#core/validation-schemas";

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    throw new Error("Invalid env config:", { cause: parsed.error });
}

const config = {
    ...sharedConfig,
    MAX_SESSION_AGE: 3600000,
    JSON_BODY_LIMIT: "4kb",
    HOST: "0.0.0.0",
    RATE_LIMIT_WINDOW_MS: 900000,
    MAIN_RATE_LIMIT_MAX_REQ: 1000,
    AUTH_RATE_LIMIT_MAX_REQ: 10,
    BCRYPT_SALT_ROUNDS: 10,
    MONGO_URI: parsed.data.MONGO_URI,
    SESSION_SECRET: parsed.data.SESSION_SECRET,
    PORT: parsed.data.PORT,
    LOG_LEVEL: parsed.data.LOG_LEVEL,
    PRODUCTION: parsed.data.NODE_ENV === "production",
}

export default config;