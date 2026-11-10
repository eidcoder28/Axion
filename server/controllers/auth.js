import bcrypt from "bcrypt";
import schemas from "../core/schemas.js";
import config from "../core/config.js";
import errors from "../../shared/errors.js";

export async function login(req, res) {
    const { username, password } = req.data;

    const user = await schemas.Users.findOne({ username }).select("password").lean();
    if (!user) return res.status(401).json({ error: errors.INVALID_CREDENTIALS() });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: errors.INVALID_CREDENTIALS() });

    req.session.isLoggedIn = true;
    req.session.userId = user._id;
    function onSessionSaved(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: errors.SESSION_INITIALIZATION_FAILED() });
        }

        return res.status(200).json({ success: true });
    }

    req.session.save(onSessionSaved);
}

export async function signup(req, res) {
    const { username, password } = req.data;
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

    const user = await schemas.Users.create({
        username,
        password: hashedPassword
    });

    req.session.isLoggedIn = true;
    req.session.userId = user._id;
    function onSessionSaved(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: errors.SESSION_INITIALIZATION_FAILED() });
        }

        return res.status(201).json({ success: true });
    }

    req.session.save(onSessionSaved);
}

export async function getUserProfile(req, res) {
    const id = req.data.id;
    const user = await schemas.Users.findById(id)
        .select("username")
        .lean();

    if (!user) return res.status(404).json({ error: errors.NOT_FOUND("User") });

    return res.status(200).json({ success: true, user });
}

export async function getUserPosts(req, res) {
    const { id, skip } = req.data;
    const posts = await schemas.Posts.find({ by: id })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(config.USER_POSTS_LIMIT)
        .populate("by", "-password")
        .lean();

    return res.status(200).json({ success: true, posts });
}

export async function signout(req, res) {
    function onSessionDestroyed(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: errors.SESSION_DESTROY_FAILED() });
        }

        res.clearCookie("connect.sid");
        return res.status(200).json({ success: true });
    }

    req.session.destroy(onSessionDestroyed);
}

export async function quickInfo(req, res) {
    return res.status(200).json({
        success: true,
        username: req.currentUser.username,
        _id: req.currentUser._id
    });
}

export async function status(req, res) {
    return res.status(200).json({
        success: true,
        loggedIn: req.session.isLoggedIn
    });
}