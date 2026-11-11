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

function validateUsername(username) {
    const USERNAME_MIN_LENGTH = config.USERNAME_MIN_LENGTH;

    if (validator.isEmpty(username)) return errors.VALIDATION.REQUIRED("username");
    if (!validator.isLength(username, { min: USERNAME_MIN_LENGTH })) {
        return errors.VALIDATION.MIN_LENGTH("username", USERNAME_MIN_LENGTH);
    }

    return null;
}

function validatePassword(password) {
    const PASSWORD_MIN_LENGTH = config.PASSWORD_MIN_LENGTH;

    if (validator.isEmpty(password)) return errors.VALIDATION.REQUIRED("password");
    if (!validator.isLength(password, { min: PASSWORD_MIN_LENGTH })) {
        return errors.VALIDATION.MIN_LENGTH("password", PASSWORD_MIN_LENGTH);
    }

    return null;
}

export function getAuthError(username, password) {
    return validateUsername(username) || validatePassword(password);
}

export async function toggleAuthButtons() {
    const status = await sendRequest({
        url: "/api/v1/me/status"
    });

    const isLoggedIn = !!status.isLoggedIn;
    signUpBtn.toggle(!isLoggedIn);
    loggedInGroup.toggle(isLoggedIn);
}

export async function handleAuthSuccess(message) {
    Alert.success({ text: message });
    await toggleAuthButtons();
    await initQuickInfo();
}