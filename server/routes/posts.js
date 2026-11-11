import express from "express";
import { requireAuth } from "../core/utils.js";
import {
    createPostsValidator,
    getPostValidator,
    getPostsValidator,
    getCommentsValidator,
    editPostsValidator,
    commentsValidator,
    editCommentValidator,
    getCommentValidator
} from "../core/validators.js";
import {
    createPost,
    getPost,
    getPosts,
    getComments,
    likePost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment
} from "../controllers/posts.js";

const router = express.Router();

router.post("/posts", requireAuth, createPostsValidator, createPost);
router.get("/posts/:id", requireAuth, getPostValidator, getPost);
router.get("/posts", getPostsValidator, getPosts);
router.get("/posts/:id/comments", requireAuth, getCommentsValidator, getComments);
router.post("/posts/:id/like", requireAuth, getPostValidator, likePost);
router.put("/posts/:id/update", requireAuth, editPostsValidator, updatePost);
router.delete("/posts/:id/delete", requireAuth, getPostValidator, deletePost);
router.post("/posts/:id/comments", requireAuth, commentsValidator, createComment);
router.put("/comments/:id/update", requireAuth, editCommentValidator, updateComment);
router.delete("/comments/:id/delete", requireAuth, getCommentValidator, deleteComment);

export default router;
