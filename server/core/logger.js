import pino from "pino";
import config from "#core/config";

// Since I don't log sensitive data, redact isn't necessary
const logger = pino({
    level: config.LOG_LEVEL || "info"
});

export default logger;