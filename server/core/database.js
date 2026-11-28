import config from "#core/config";
import logger from "#core/logger";
import mongoose from "mongoose";

export async function connectMongo() {
  await mongoose.connect(config.MONGO_URI);
  logger.info("Mongo connected");
}

mongoose.connection.on("error", (err) => {
  logger.error({ err }, "Mongo runtime error");
});

mongoose.connection.on("disconnected", () => {
  logger.warn("Mongo disconnected; attempting to reconnect");
});

mongoose.connection.on("reconnected", () => {
  logger.info("Mongo reconnected");
});