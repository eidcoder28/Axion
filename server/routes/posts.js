import express from "express";
import { checkAuth } from "../core/utils.js";
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
    listPosts,
    getComments,
    likePost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment
} from "../controllers/posts.js";

const router = express.Router();

router.post("/posts", checkAuth, createPostsValidator, createPost);
router.get("/posts/:id", checkAuth, getPostValidator, getPost);
router.get("/posts", getPostsValidator, listPosts);
router.get("/posts/:id/comments", checkAuth, getCommentsValidator, getComments);
router.post("/posts/:id/like", checkAuth, getPostValidator, likePost);
router.put("/posts/:id/update", checkAuth, editPostsValidator, updatePost);
router.delete("/posts/:id/delete", checkAuth, getPostValidator, deletePost);
router.post("/posts/:id/comments", checkAuth, commentsValidator, createComment);
router.put("/comments/:id/update", checkAuth, editCommentValidator, updateComment);
router.delete("/comments/:id/delete", checkAuth, getCommentValidator, deleteComment);

export default router;
