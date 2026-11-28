import showProfile from "@app/users/profile.js";
import config from "@shared/config.js";
import * as validators from "@shared/validation-schemas.js";
import $ from "cash-dom";
import Swal from "sweetalert2";
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
        schema: validators.loginSchema
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
        schema: validators.signupSchema
    }
}

async function openAuthModal(type = "signup") {
    const cfg = authConfig[type];
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
                cfg.fields.map(field => [field.key, popup.find(field.selector).val()])
            );

            const parsed = cfg.schema.safeParse(values);
            return parsed.success
                ? parsed.data
                : Swal.showValidationMessage(parsed.error.issues[0].message);
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

async function toggleAuthButtons() {
    const status = await sendRequest({ url: "/api/v1/me/status" }, false);
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

$("#signup-btn").on("click", lockEvent(async () => {
    await openAuthModal();
}));

$("#signout-btn").on("click", lockEvent(async () => {
    const response = await sendRequest({ url: "/api/v1/auth/signout", method: "DELETE" });
    if (!response.success) return Alert.error({ text: response.error });

    await handleAuthSuccess("You have been logged out!");
}));

$("#profile-btn").on("click", lockEvent(async () => {
    await showProfile(quickInfo._id);
}));

toggleAuthButtons();