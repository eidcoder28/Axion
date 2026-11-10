import { body, param, query } from "express-validator";
import { validate } from "./utils.js";
import config from "./config.js";
import errors from "../../shared/errors.js";

// Helpers
const baseTextBody = (field, label) => [
    body(field).exists().withMessage(errors.VALIDATION.REQUIRED(label)),
    body(field).isString().withMessage(errors.VALIDATION.STRING(label)),
    body(field).trim(),
    body(field).notEmpty().withMessage(errors.VALIDATION.EMPTY(label))
]

const queryInt = (field, label) => query(field)
    .exists().withMessage(errors.VALIDATION.REQUIRED(`${label} value`))
    .isInt({ min: 0 }).withMessage(errors.VALIDATION.NON_NEGATIVE_INTEGER(label));

const mongoIdParam = (field, label) => param(field)
    .exists().withMessage(errors.VALIDATION.REQUIRED(label))
    .isMongoId().withMessage(errors.VALIDATION.INVALID_FORMAT(label));

// Domain-specific validators
const userValidator = () => [
    ...baseTextBody("username", "username"),
    body("username")
        .isLength({ min: config.USERNAME_MIN_LENGTH, max: config.USERNAME_MAX_LENGTH })
        .withMessage(errors.VALIDATION.LENGTH_RANGE("username", config.USERNAME_MIN_LENGTH, config.USERNAME_MAX_LENGTH)),
    body("username").toLowerCase(),

    ...baseTextBody("password", "password"),
    body("password")
        .isLength({ min: config.PASSWORD_MIN_LENGTH, max: config.PASSWORD_MAX_LENGTH })
        .withMessage(errors.VALIDATION.LENGTH_RANGE("password", config.PASSWORD_MIN_LENGTH, config.PASSWORD_MAX_LENGTH))
]

const postValidator = () => [
    ...baseTextBody("title", "post title"),
    body("title")
        .isLength({ max: config.POST_TITLE_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("post title", config.POST_TITLE_MAX_LENGTH)),

    ...baseTextBody("content", "post content"),
    body("content")
        .isLength({ max: config.POST_CONTENT_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("post content", config.POST_CONTENT_MAX_LENGTH))
]

const commentValidator = () => [
    ...baseTextBody("content", "content"),
    body("content")
        .isLength({ max: config.COMMENTS_MAX_LENGTH })
        .withMessage(errors.VALIDATION.MAX_LENGTH("content", config.COMMENTS_MAX_LENGTH))
]

// Posts
export const createPostsValidator = [...postValidator(), validate]
export const editPostsValidator = [mongoIdParam("id", "post ID"), ...postValidator(), validate]
export const getPostsValidator = [queryInt("skip", "skip"), validate]
export const getPostValidator = [mongoIdParam("id", "post ID"), validate]

// Comments
export const commentsValidator = [mongoIdParam("id", "post ID"), ...commentValidator(), validate]
export const editCommentValidator = [mongoIdParam("id", "comment ID"), ...commentValidator(), validate]
export const getCommentsValidator = [queryInt("skip", "skip"), mongoIdParam("id", "post ID"), validate]
export const getCommentValidator = [mongoIdParam("id", "comment ID"), validate]

// Auth
export const userAuthValidator = [...userValidator(), validate]
export const getUserProfileValidator = [mongoIdParam("id", "user ID"), validate]
export const getUserPostsValidator = [queryInt("skip", "skip"), mongoIdParam("id", "user ID"), validate]