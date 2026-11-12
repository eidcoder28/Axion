import express from "express";
import config from "../core/config.js";
import { requireAuth, limit } from "../core/utils.js";
import {
    loginValidator,
    signupValidator,
    getUserProfileValidator,
    getUserPostsValidator
} from "../core/validators.js";
import {
    login,
    signup,
    getUserProfile,
    getUserPosts,
    signout,
    getQuickInfo,
    getStatus
} from "../controllers/auth.js";

const router = express.Router();
const authRateLimit = limit({ limit: config.AUTH_RATE_LIMIT_MAX_REQ });

router.post("/auth/login", authRateLimit, loginValidator, login);
router.post("/auth/signup", authRateLimit, signupValidator, signup);
router.get("/users/:id/profile", requireAuth, getUserProfileValidator, getUserProfile);
router.get("/users/:id/posts", requireAuth, getUserPostsValidator, getUserPosts);
router.get("/me/quick-info", requireAuth, getQuickInfo);
router.get("/me/status", getStatus);
router.delete("/auth/signout", requireAuth, signout);

export default router;