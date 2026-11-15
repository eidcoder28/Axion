import bcrypt from "bcrypt";
import schemas from "../core/schemas.js";
import config from "../core/config.js";
import errors from "../../shared/errors.js";
import { initSession } from "../core/utils.js";

const DUMMY_HASH = "$2b$10$CwTycUXWue0Thq9StjUM0uJ8.6J6W9Q/1R5yB9qH2q/9wQ5v4X3eO";

export async function login(req, res) {
    const { username, password } = req.data;
    const user = await schemas.Users.findOne({ username }).select("password").lean();
    const hash = user ? user.password : DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hash);

    if (!user || !isMatch) {
        return res.status(401).json({ error: errors.INVALID_CREDENTIALS() });
    }

    await initSession(req, user._id);
    return res.status(200).json({ success: true });
}

export async function signup(req, res) {
    const { username, password, email } = req.data;
    const hashed = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);
    const user = await schemas.Users.create({ username, email, password: hashed });

    await initSession(req, user._id);
    return res.status(201).json({ success: true });
}

export async function getUserProfile(req, res) {
    const id = req.data.id;
    const user = await schemas.Users.findById(id)
        .select("username")
        .lean();

    if (!user) {
        return res.status(404).json({ error: errors.NOT_FOUND("User") });
    }

    return res.status(200).json({ success: true, user });
}

export async function getUserPosts(req, res) {
    const { id, skip } = req.data;
    const posts = await schemas.Posts.find({ by: id })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.USER_POSTS_LIMIT)
        .populate("by", "-password -email")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export function signout(req, res) {
    req.session.destroy(err => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: errors.SESSION_DESTROY_FAILED() });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true });
    });
}

export function getQuickInfo(req, res) {
    const { username, _id } = req.user;
    return res.status(200).json({ success: true, username, _id });
}

export function getStatus(req, res) {
    return res.status(200).json({ success: true, loggedIn: req.session.loggedIn });
}