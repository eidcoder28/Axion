import showProfile from "@app/users/profile.js";
import config from "@shared/config.js";
import errors from "@shared/errors.js";
import $ from "cash-dom";
import Swal from "sweetalert2";
import validator from "validator";
import templates from "@app/templates.js";
import {
    sendRequest,
    lockEvent,
    quickInfo,
    Alert,
    initQuickInfo
} from "@app/common.js";

const loggedInGroup = $("#auth-buttons");
const signUpBtn = $("#signup-btn");
const authConfig = {
    login: {
        html: templates.USER_LOGIN,
        endpoint: "/api/v1/auth/login",
        successMsg: "Logged in successfully!",
        fields: [
            { key: "username", selector: "#login-username", max: config.USERNAME_MAX_LENGTH },
            { key: "password", selector: "#login-password", max: config.PASSWORD_MAX_LENGTH }
        ],
        title: "Login",
        validate: ({ username, password }) => getLoginError(username, password)
    },
    signup: {
        html: templates.USER_SIGNUP,
        endpoint: "/api/v1/auth/signup",
        successMsg: "Account created successfully!",
        fields: [
            { key: "username", selector: "#signup-username", max: config.USERNAME_MAX_LENGTH },
            { key: "password", selector: "#signup-password", max: config.PASSWORD_MAX_LENGTH },
            { key: "email", selector: "#signup-email", max: config.EMAIL_MAX_LENGTH }
        ],
        title: "Signup",
        validate: ({ username, password, email }) => getSignupError(username, password, email)
    }
}

async function openAuthModal(type = "signup") {
    const cfg = authConfig[type];
    if (!cfg) return;

    const result = await Swal.fire({
        html: cfg.html(),
        title: cfg.title,
        stopKeydownPropagation: false,
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
        didOpen: () => {
            const popup = $(Swal.getPopup());
            cfg.fields.forEach(field => popup.find(field.selector).attr("maxLength", field.max));
        },
        preConfirm: () => {
            const popup = $(Swal.getPopup());
            const values = Object.fromEntries(
                cfg.fields.map(field => [field.key, popup.find(field.selector).val().trim()])
            );
            const error = cfg.validate(values);
            return error ? Swal.showValidationMessage(error) : values;
        }
    });

    if (!result.isConfirmed) return;

    const response = await sendRequest({
        url: cfg.endpoint,
        method: "POST",
        body: result.value
    });

    if (!response.success) return Alert.error({ text: response.error });
    await handleAuthSuccess(cfg.successMsg);
}

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

function getLoginError(username, password) {
    return validateUsername(username) || validatePassword(password);
}

function getSignupError(username, password, email) {
    return validateUsername(username) || validatePassword(password) || validateEmail(email);
}

async function toggleAuthButtons() {
    const status = await sendRequest({
        url: "/api/v1/me/status"
    });

    const loggedIn = !!status.loggedIn;
    signUpBtn.toggle(!loggedIn);
    loggedInGroup.toggle(loggedIn);
}

async function handleAuthSuccess(msg) {
    Alert.success({ text: msg });
    await Promise.all([toggleAuthButtons(), initQuickInfo()]);
}

$(document).on("click", ".auth-link", function () {
    openAuthModal($(this).data("target"));
});

$("#signup-btn").on("click", lockEvent(() => {
    return openAuthModal();
}));

$("#signout-btn").on("click", lockEvent(async () => {
    const response = await sendRequest({ url: "/api/v1/auth/signout", method: "DELETE" });
    if (!response.success) return Alert.error({ text: response.error });

    await handleAuthSuccess("You have been logged out!");
}));

$("#profile-btn").on("click", lockEvent(() => {
    return showProfile(quickInfo._id);
}));

toggleAuthButtons();