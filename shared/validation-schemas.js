import { z } from "zod";
import config from "#shared/config";
import { errorMsgs } from "#shared/messages";

function baseStr(label) {
    return z.string({
        error: (issue) => issue.input === undefined
            ? errorMsgs.validation.required(label)
            : errorMsgs.validation.string(label),
    });
}

function trimmedStr(label) {
    return baseStr(label).trim();
}

function nonEmptyTrimmedStr(label) {
    return trimmedStr(label).min(1, errorMsgs.validation.empty(label));
}

function mongoId(label) {
    return trimmedStr(label).regex(/^[0-9a-fA-F]{24}$/, errorMsgs.validation.invalidFormat(label));
}

export function idSchema(label) {
    return z.object({ id: mongoId(label) });
}

export const usernameSchema = trimmedStr("username")
    .min(config.USERNAME_MIN_LENGTH, errorMsgs.validation.lengthRange("username", config.USERNAME_MIN_LENGTH, config.USERNAME_MAX_LENGTH))
    .max(config.USERNAME_MAX_LENGTH, errorMsgs.validation.lengthRange("username", config.USERNAME_MIN_LENGTH, config.USERNAME_MAX_LENGTH))
    .toLowerCase();

export const userSchema = z.object({
    _id: mongoId("user ID"),
    username: usernameSchema
});

export const postInputSchema = z.object({
    title: nonEmptyTrimmedStr("post title").max(
        config.POST_TITLE_MAX_LENGTH,
        errorMsgs.validation.maxLength("post title", config.POST_TITLE_MAX_LENGTH)
    ),
    content: nonEmptyTrimmedStr("post content").max(
        config.POST_CONTENT_MAX_LENGTH,
        errorMsgs.validation.maxLength("post content", config.POST_CONTENT_MAX_LENGTH)
    )
});

export const commentInputSchema = z.object({
    content: nonEmptyTrimmedStr("content").max(
        config.COMMENTS_MAX_LENGTH,
        errorMsgs.validation.maxLength("content", config.COMMENTS_MAX_LENGTH)
    )
});

export const loginSchema = z.object({
    username: usernameSchema,
    password: baseStr("password")
        .refine((val) => val.trim().length > 0, errorMsgs.validation.empty("password"))
        .min(config.PASSWORD_MIN_LENGTH, errorMsgs.validation.lengthRange("password", config.PASSWORD_MIN_LENGTH, config.PASSWORD_MAX_LENGTH))
        .max(config.PASSWORD_MAX_LENGTH, errorMsgs.validation.lengthRange("password", config.PASSWORD_MIN_LENGTH, config.PASSWORD_MAX_LENGTH))
});

export const signupSchema = loginSchema.extend({
    email: nonEmptyTrimmedStr("email")
        .max(config.EMAIL_MAX_LENGTH, errorMsgs.validation.maxLength("email", config.EMAIL_MAX_LENGTH))
        .email(errorMsgs.validation.invalidFormat("email"))
        .toLowerCase()
});

export const postSchema = postInputSchema.extend({
    _id: mongoId("post ID"),
    user: userSchema,
    likes: z.number().int().min(0).default(0)
});

export const commentSchema = commentInputSchema.extend({
    _id: mongoId("comment ID"),
    user: userSchema,
    editedAt: z.coerce.date().nullable()
});