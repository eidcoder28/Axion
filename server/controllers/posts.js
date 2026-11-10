import schemas from "../core/schemas.js";
import config from "../core/config.js";
import { ClientError } from "../core/utils.js";
import errors from "../../shared/errors.js";
import mongoose from "mongoose";

export async function createPost(req, res) {
    const { title, content } = req.data;

    await schemas.Posts.create({
        title,
        content,
        by: req.session.userId
    });

    return res.status(201).json({ success: true });
}

export async function getPost(req, res) {
    const id = req.data.id;
    const post = await schemas.Posts.findById(id)
        .populate("by", "-password")
        .lean();

    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });
    return res.status(200).json({ success: true, posts: [post] });
}

export async function listPosts(req, res) {
    const skip = req.data.skip;
    const posts = await schemas.Posts.find({})
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.POSTS_LIMIT)
        .populate("by", "-password")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export async function getComments(req, res) {
    const { skip, id } = req.data;
    const comments = await schemas.Comments.find({ for: id })
        .skip(skip)
        .limit(config.COMMENTS_LIMIT)
        .sort({ createdAt: -1, _id: -1 })
        .populate("by", "-password")
        .lean();

    return res.status(200).json({ success: true, comments });
}

export async function likePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.data.id;

    try {
        async function createLike() {
            const result = await schemas.Posts.updateOne({
                _id: id
            }, {
                $inc: {
                    likes: 1
                }
            }, {
                session
            });

            if (result.matchedCount === 0) throw new ClientError(errors.ACCESS_DENIED("post"), 404);

            await schemas.Likes.create([{ by: req.session.userId, for: id }], { session });
        }

        await session.withTransaction(createLike);
    } finally {
        await session.endSession();
    }

    return res.status(201).json({ success: true });
}

export async function updatePost(req, res) {
    const { content, title, id } = req.data;

    const result = await schemas.Posts.updateOne({
        _id: id,
        by: req.session.userId
    }, [
        {
            $set: {
                title: {
                    $cond: [{ $eq: ["$title", { $literal: title }] }, "$title", { $literal: title }]
                },
                content: {
                    $cond: [{ $eq: ["$content", { $literal: content }] }, "$content", { $literal: content }]
                },
                updatedAt: {
                    $cond: [
                        { $and: [{ $eq: ["$title", { $literal: title }] }, { $eq: ["$content", { $literal: content }] }] },
                        "$updatedAt",
                        "$$NOW"
                    ]
                }
            }
        }
    ], {
        timestamps: false
    });

    if (result.matchedCount === 0) return res.status(404).json({ error: errors.NOT_FOUND("Post") });

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deletePost(req, res) {
    const session = await mongoose.startSession();
    const id = req.data.id;

    try {
        async function deletePostAndRelatedData() {
            const result = await schemas.Posts.deleteOne({
                _id: id,
                by: req.session.userId
            }, { session });
            if (result.deletedCount === 0) throw new ClientError(errors.ACCESS_DENIED("post"), 404);

            await schemas.Likes.deleteMany({ for: id }, { session });
            await schemas.Comments.deleteMany({ for: id }, { session });
        }

        await session.withTransaction(deletePostAndRelatedData);
    } finally {
        await session.endSession();
    }

    return res.status(200).json({ success: true });
}

export async function createComment(req, res) {
    const { id, content } = req.data;
    const post = await schemas.Posts.exists({ _id: id });
    if (!post) return res.status(404).json({ error: errors.NOT_FOUND("Post") });

    await schemas.Comments.create({ content, for: id, by: req.session.userId });
    return res.status(201).json({ success: true });
}

export async function updateComment(req, res) {
    const { id, content } = req.data;

    const result = await schemas.Comments.updateOne({
        _id: id,
        by: req.session.userId
    },
        [
            {
                $set: {
                    content: {
                        $cond: [{ $eq: ["$content", { $literal: content }] }, "$content", { $literal: content }]
                    },

                    editedAt: {
                        $cond: [{ $eq: ["$content", { $literal: content }] }, "$editedAt", "$$NOW"]
                    },

                    updatedAt: {
                        $cond: [{ $eq: ["$content", { $literal: content }] }, "$updatedAt", "$$NOW"]
                    }
                }
            }
        ], {
        timestamps: false
    });

    if (result.matchedCount === 0) return res.status(404).json({ error: errors.NOT_FOUND("Comment") });

    return res.status(200).json({
        changed: result.modifiedCount !== 0,
        success: true
    });
}

export async function deleteComment(req, res) {
    const id = req.data.id;
    const result = await schemas.Comments.deleteOne({ _id: id, by: req.session.userId });
    if (result.deletedCount === 0) return res.status(404).json({ error: errors.ACCESS_DENIED("comment") });

    return res.status(200).json({ success: true });
}