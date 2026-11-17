import config from "./config.js";
import mongoose from "mongoose";

mongoose.connection.on("error", (err) => {
  console.error("Mongo runtime error:", err.message);
});

mongoose.connection.on("disconnected", () => {
  console.warn("Mongo disconnected!? Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("Mongo reconnected!");
});

mongoose.connect(config.MONGO_URI)
  .then(() => console.log("Mongo connected!"))
  .catch((err) => console.error("Initial Mongo connection failed:", err.message));