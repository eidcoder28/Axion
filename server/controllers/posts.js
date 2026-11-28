import config from "#core/config";
import models from "#core/models";
import { AppError } from "#core/common";
import { errorMsgs } from "#shared/messages";
import mongoose from "mongoose";

export async function likePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.params.id;

    try {
        await session.withTransaction(async () => {
            // I create the like doc before running the update operation to avoid locking 
            // the post doc when users who already liked it try again. It will just fail fast 
            // because of the unique compound index 
            await models.Likes.create([{ user: req.session.userId, post: id }], { session });

            const result = await models.Posts.updateOne({
                _id: id
            }, {
                $inc: {
                    likes: 1
                }
            }, { session });

            if (result.matchedCount === 0) {
                throw new AppError(errorMsgs.notFound("post"), 404);
            }
        });
    } finally {
        await session.endSession();
    }

    return res.status(201).json({ success: true });
}

export async function updatePost(req, res) {
    const { content, title } = req.body;
    const id = req.params.id;
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
        return res.status(404).json({ error: errorMsgs.notFound("Post") });
    }

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deletePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.params.id;

    try {
        await session.withTransaction(async () => {
            const result = await models.Posts.deleteOne({
                _id: id,
                user: req.session.userId
            }, { session });

            if (result.deletedCount === 0) {
                throw new AppError(errorMsgs.notFound("post"), 404);
            }

            await models.Likes.deleteMany({ post: id }, { session });
            await models.Comments.deleteMany({ post: id }, { session });
        });
    } finally {
        await session.endSession();
    }

    return res.status(200).json({ success: true });
}

export async function createPost(req, res) {
    const { title, content } = req.body;

    await models.Posts.create({
        title,
        content,
        user: req.session.userId
    });

    return res.status(201).json({ success: true });
}

export async function getPost(req, res) {
    const id = req.params.id;
    const post = await models.Posts.findById(id)
        .populate("user", "-password -email")
        .lean();

    if (!post) return res.status(404).json({ error: errorMsgs.notFound("Post") });
    return res.status(200).json({ success: true, posts: [post] });
}

export async function getPosts(req, res) {
    const skip = req.query.skip;
    const posts = await models.Posts.find({})
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.POSTS_LIMIT)
        .populate("user", "-password -email")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export async function createComment(req, res) {
    const content = req.body.content;
    const id = req.params.id;
    const post = await models.Posts.exists({ _id: id });
    if (!post) return res.status(404).json({ error: errorMsgs.notFound("Post") });

    await models.Comments.create({ content, post: id, user: req.session.userId });
    return res.status(201).json({ success: true });
}

export async function updateComment(req, res) {
    const content = req.body.content;
    const id = req.params.id;
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
        return res.status(404).json({ error: errorMsgs.notFound("Comment") });
    }

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deleteComment(req, res) {
    const id = req.params.id;
    const result = await models.Comments.deleteOne({
        _id: id,
        user: req.session.userId
    });

    if (result.deletedCount === 0) {
        return res.status(404).json({ error: errorMsgs.notFound("comment") });
    }

    return res.status(200).json({ success: true });
}

export async function getComments(req, res) {
    const id = req.params.id;
    const skip = req.query.skip;
    const comments = await models.Comments.find({ post: id })
        .skip(skip)
        .limit(config.COMMENTS_LIMIT)
        .sort({ createdAt: -1, _id: -1 })
        .populate("user", "-password -email")
        .lean();

    return res.status(200).json({ success: true, comments });
}