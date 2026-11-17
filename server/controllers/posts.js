import config from "../core/config.js";
import models from "../core/models.js";
import { AppError } from "../core/utils.js";
import errors from "../../shared/errors.js";
import mongoose from "mongoose";

export async function likePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.data.id;

    try {
        await session.withTransaction(async () => {
            const result = await models.Posts.updateOne({
                _id: id
            }, {
                $inc: {
                    likes: 1
                }
            }, { session });

            if (result.matchedCount === 0) {
                throw new AppError(errors.ACCESS_DENIED("post"), 404);
            }

            await models.Likes.create([{ user: req.session.userId, post: id }], { session });
        });
    } finally {
        await session.endSession();
    }

    return res.status(201).json({ success: true });
}

export async function updatePost(req, res) {
    const { content, title, id } = req.data;
    const titleCond = { $eq: ["$title", { $literal: title }] };
    const contentCond = { $eq: ["$content", { $literal: content }] };

    const result = await models.Posts.updateOne(
        { _id: id, user: req.session.userId },
        [{
            $set: {
                title: { $cond: [titleCond, "$title", { $literal: title }] },
                content: { $cond: [contentCond, "$content", { $literal: content }] },
                updatedAt: { $cond: [{ $and: [titleCond, contentCond] }, "$updatedAt", "$$NOW"] }
            }
        }],
        { timestamps: false, updatePipeline: true }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ error: errors.NOT_FOUND("Post") });
    }

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deletePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.data.id;

    try {
        await session.withTransaction(async () => {
            const result = await models.Posts.deleteOne({
                _id: id,
                user: req.session.userId
            }, { session });

            if (result.deletedCount === 0) {
                throw new AppError(errors.ACCESS_DENIED("post"), 404);
            }

            await models.Likes.deleteMany({ post: id }, { session });
            await models.Comments.deleteMany({ post: id }, { session });
        });
    } finally {
        await session.endSession();
    }

    return res.status(200).json({ success: true });
}

export async function createComment(req, res) {
    const { id, content } = req.data;
    const post = await models.Posts.exists({ _id: id });
    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });

    await models.Comments.create({ content, post: id, user: req.session.userId });
    return res.status(201).json({ success: true });
}

export async function updateComment(req, res) {
    const { id, content } = req.data;
    const contentCond = { $eq: ["$content", { $literal: content }] };

    const result = await models.Comments.updateOne(
        { _id: id, user: req.session.userId },
        [{
            $set: {
                content: { $cond: [contentCond, "$content", { $literal: content }] },
                editedAt: { $cond: [contentCond, "$editedAt", "$$NOW"] },
                updatedAt: { $cond: [contentCond, "$updatedAt", "$$NOW"] }
            }
        }],
        { timestamps: false, updatePipeline: true }
    );

    if (result.matchedCount === 0) {
        return res.status(404).json({ error: errors.NOT_FOUND("Comment") });
    }

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deleteComment(req, res) {
    const id = req.data.id;
    const result = await models.Comments.deleteOne({
        _id: id,
        user: req.session.userId
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: errors.ACCESS_DENIED("comment") });
    }

    return res.status(200).json({ success: true });
}

export async function createPost(req, res) {
    const { title, content } = req.data;

    await models.Posts.create({
        title,
        content,
        user: req.session.userId
    });

    return res.status(201).json({ success: true });
}

export async function getPost(req, res) {
    const id = req.data.id;
    const post = await models.Posts.findById(id)
        .populate("user", "-password -email")
        .lean();

    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });
    return res.status(200).json({ success: true, posts: [post] });
}

export async function getPosts(req, res) {
    const { skip } = req.data;
    const posts = await models.Posts.find({})
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.POSTS_LIMIT)
        .populate("user", "-password -email")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export async function getComments(req, res) {
    const { skip, id } = req.data;
    const comments = await models.Comments.find({ post: id })
        .skip(skip)
        .limit(config.COMMENTS_LIMIT)
        .sort({ createdAt: -1, _id: -1 })
        .populate("user", "-password -email")
        .lean();

    return res.status(200).json({ success: true, comments });
}