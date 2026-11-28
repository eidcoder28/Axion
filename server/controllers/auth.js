import bcrypt from "bcrypt";
import models from "#core/models";
import config from "#core/config";
import { errorMsgs } from "#shared/messages";
import { initSession } from "#core/common";
import logger from "#core/logger";

const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6J6W9Q/1R5yB9qH2q/9wQ5v4X3eO";

export async function login(req, res) {
    const { username, password } = req.body;
    const user = await models.Users.findOne({ username }).select("password").lean();
    const hash = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) {
        return res.status(401).json({ error: errorMsgs.invalidCredentials() });
    }

    await initSession(req, user._id);
    return res.status(200).json({ success: true });
}

export async function signup(req, res) {
    const { username, password, email } = req.body;
    const hashed = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
    const user = await models.Users.create({ username, email, password: hashed });

    await initSession(req, user._id);
    return res.status(201).json({ success: true });
}

export function signout(req, res) {
    req.session.destroy(err => {
        if (err) {
            logger.error({ err }, "Failed to destroy session");
            return res.status(500).json({ error: errorMsgs.sessionDestroyFailed() });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true });
    });
}

export async function getUserProfile(req, res) {
    const id = req.params.id;
    const user = await models.Users.findById(id)
        .select("username")
        .lean();

    if (!user) {
        return res.status(404).json({ error: errorMsgs.notFound("User") });
    }

    return res.status(200).json({ success: true, user });
}

export async function getUserPosts(req, res) {
    const id = req.params.id;
    const skip = req.query.skip;
    const posts = await models.Posts.find({ user: id })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.USER_POSTS_LIMIT)
        .populate("user", "-password -email")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export function getQuickInfo(req, res) {
    const { username, _id } = req.user;
    return res.status(200).json({ success: true, username, _id });
}

export function getStatus(req, res) {
    return res.status(200).json({ success: true, loggedIn: req.session.loggedIn });
}