import showProfile from "@app/users/profile.js";
import templates from "@app/templates.js";
import {
    getLoginError,
    getSignupError,
    toggleAuthButtons,
    handleAuthSuccess
} from "@app/users/signup-helpers.js";
import {
    sendRequest,
    lockEvent,
    config,
    quickInfo,
    toObject,
    $,
    Alert,
    Swal
} from "@app/utils.js";

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
};

async function openAuthModal(type = "signup") {
    const cfg = toObject(authConfig[type]);
    if (typeof cfg.html !== "function" || !cfg.title) return;

    const result = await Swal.fire({
        html: cfg.html(),
        title: cfg.title,
        stopKeydownPropagation: false,
        showCancelButton: true,
        confirmButtonText: "Submit",
        cancelButtonText: "Cancel",
        didOpen: () => {
            const $popup = $(Swal.getPopup());
            cfg.fields.forEach(field => $popup.find(field.selector).attr("maxLength", field.max));
        },
        preConfirm: () => {
            const $popup = $(Swal.getPopup());
            const values = Object.fromEntries(
                cfg.fields.map(field => [field.key, $popup.find(field.selector).val().trim()])
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

$(document).on("click", ".link-swal-auth", function () {
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
    return showProfile(quickInfo?._id);
}));

toggleAuthButtons();