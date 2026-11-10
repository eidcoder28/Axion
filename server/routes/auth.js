import express from "express";
import config from "../core/config.js";
import { checkAuth, createLimiter } from "../core/utils.js";
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
const authRateLimiter = createLimiter(config.RATE_LIMIT_WINDOW_MS, config.AUTH_RATE_LIMIT_MAX_REQ);

router.post("/users/login", authRateLimiter, userAuthValidator, login);
router.post("/users/signup", authRateLimiter, userAuthValidator, signup);
router.get("/users/:id/profile", checkAuth, getUserProfileValidator, getUserProfile);
router.get("/users/:id/posts", checkAuth, getUserPostsValidator, getUserPosts);
router.delete("/me/signout", checkAuth, signout);
router.get("/me/quick-info", checkAuth, quickInfo);
router.get("/me/status", status);

export default router;
