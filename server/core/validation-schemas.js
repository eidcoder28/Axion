import { z } from "zod";
import { errorMsgs } from "#shared/messages";
import config from "#shared/config";

const skipRangeError = errorMsgs.validation.lengthRange("skip", 0, config.PAGINATION_MAX_SKIP, false);

export const envSchema = z.object({
    MONGO_URI: z.string().min(1, errorMsgs.validation.required("MONGO_URI")),
    SESSION_SECRET: z.string().min(1, errorMsgs.validation.required("SESSION_SECRET")),
    PORT: z.coerce
        .number()
        .int()
        .min(1)
        .max(65535)
        .default(config.DEFAULT_PORT),
    LOG_LEVEL: z
        .string()
        .toLowerCase()
        .pipe(z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]))
        .default("info"),
    NODE_ENV: z.string().optional(),
});

export const skipSchema = z.object({
    skip: z.coerce
        .number({ error: skipRangeError })
        .int(skipRangeError)
        .min(0, skipRangeError)
        .max(config.PAGINATION_MAX_SKIP, skipRangeError)
        .default(0)
});