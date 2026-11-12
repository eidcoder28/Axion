import mongoose from "mongoose";
import config from "./config.js";

const usersSchema = new mongoose.Schema({
    username: { type: String, trim: true, required: true, lowercase: true, minLength: config.USERNAME_MIN_LENGTH, maxLength: config.USERNAME_MAX_LENGTH },
    password: { type: String, required: true }
}, { timestamps: true });

usersSchema.index({ username: 1 }, { unique: true });

const likesSchema = new mongoose.Schema({
    by: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Posts", required: true },
}, { timestamps: true });

likesSchema.index({ by: 1, post: 1 }, { unique: true });

const postsSchema = new mongoose.Schema({
    title: { type: String, trim: true, required: true, maxLength: config.POST_TITLE_MAX_LENGTH },
    content: { type: String, trim: true, required: true, maxLength: config.POST_CONTENT_MAX_LENGTH },
    likes: { type: Number, default: 0, min: 0 },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
}, { timestamps: true });

postsSchema.index({ by: 1 });
postsSchema.index({ likes: -1, createdAt: -1, _id: -1 });

const commentsSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: "Posts", required: true },
    by: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    content: { type: String, trim: true, required: true, maxLength: config.COMMENTS_MAX_LENGTH },
    editedAt: { type: Date, default: null }
}, { timestamps: true });

commentsSchema.index({ post: 1 });

export default {
    Users: mongoose.model("Users", usersSchema, "users"),
    Likes: mongoose.model("Likes", likesSchema, "likes"),
    Posts: mongoose.model("Posts", postsSchema, "posts"),
    Comments: mongoose.model("Comments", commentsSchema, "comments")
}