import validate, { setGlobalOptions } from "express-zod-safe";
import * as sharedValidators from "#shared/validation-schemas";
import * as validators from "#core/validation-schemas";
import { errorMsgs } from "#shared/messages";

setGlobalOptions({
    handler: (data, req, res) => {
        const msg = data[0].errors.issues[0].message || errorMsgs.invalidCredentials();
        return res.status(400).json({ error: msg });
    },
});

export const createPostsValidator = validate({ body: sharedValidators.postInputSchema });
export const editPostsValidator = validate({ params: sharedValidators.idSchema("post ID"), body: sharedValidators.postInputSchema });
export const getPostsValidator = validate({ query: validators.skipSchema });
export const getPostValidator = validate({ params: sharedValidators.idSchema("post ID") });

export const commentsValidator = validate({ params: sharedValidators.idSchema("post ID"), body: sharedValidators.commentInputSchema });
export const editCommentValidator = validate({ params: sharedValidators.idSchema("comment ID"), body: sharedValidators.commentInputSchema });
export const getCommentsValidator = validate({ query: validators.skipSchema, params: sharedValidators.idSchema("post ID") });
export const getCommentValidator = validate({ params: sharedValidators.idSchema("comment ID") });

export const loginValidator = validate({ body: sharedValidators.loginSchema });
export const getUserProfileValidator = validate({ params: sharedValidators.idSchema("user ID") });
export const getUserPostsValidator = validate({ query: validators.skipSchema, params: sharedValidators.idSchema("user ID") });
export const signupValidator = validate({ body: sharedValidators.signupSchema });