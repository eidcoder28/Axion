import config from "@shared/config.js";
import errors from "@shared/errors.js";
import {
    initQuickInfo,
    Alert,
    sendRequest,
    $,
    validator
} from "@app/utils.js";

const loggedInGroup = $("#auth-buttons");
const signUpBtn = $("#signup-btn");

function validateMinLength(value, fieldName, minLength) {
    if (validator.isEmpty(value)) return errors.VALIDATION.REQUIRED(fieldName);
    if (!validator.isLength(value, { min: minLength })) {
        return errors.VALIDATION.MIN_LENGTH(fieldName, minLength);
    }

    return null;
}

function validateUsername(username) {
    return validateMinLength(username, "username", config.USERNAME_MIN_LENGTH);
}

function validatePassword(password) {
    return validateMinLength(password, "password", config.PASSWORD_MIN_LENGTH);
}

function validateEmail(email) {
    if (validator.isEmpty(email)) return errors.VALIDATION.REQUIRED("email");
    if (!validator.isEmail(email)) return errors.VALIDATION.INVALID_FORMAT("email");

    return null;
}

export function getLoginError(username, password) {
    return validateUsername(username) || validatePassword(password);
}

export function getSignupError(username, password, email) {
    return validateUsername(username) || validatePassword(password) || validateEmail(email);
}

export async function toggleAuthButtons() {
    const status = await sendRequest({
        url: "/api/v1/me/status"
    });

    const loggedIn = !!status.loggedIn;
    signUpBtn.toggle(!loggedIn);
    loggedInGroup.toggle(loggedIn);
}

export async function handleAuthSuccess(msg) {
    Alert.success({ text: msg });
    await Promise.all([toggleAuthButtons(), initQuickInfo()]);
}