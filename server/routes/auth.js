import express from "express";
import config from "../core/config.js";
import { requireAuth, limit } from "../core/utils.js";
import { userAuthValidator, getUserProfileValidator, getUserPostsValidator } from "../core/validators.js";
import {
    login,
    signup,
    getUserProfile,
    getUserPosts,
    signout,
    quickInfo,
    status
} from "../controllers/auth.js";

const router = express.Router();
const authRateLimit = limit({
    limit: config.AUTH_RATE_LIMIT_MAX_REQ,
    windowMs: config.RATE_LIMIT_WINDOW_MS
});

router.post("/users/login", authRateLimit, userAuthValidator, login);
router.post("/users/signup", authRateLimit, userAuthValidator, signup);
router.get("/users/:id/profile", requireAuth, getUserProfileValidator, getUserProfile);
router.get("/users/:id/posts", requireAuth, getUserPostsValidator, getUserPosts);
router.delete("/me/signout", requireAuth, signout);
router.get("/me/quick-info", requireAuth, quickInfo);
router.get("/me/status", status);

export default router;
