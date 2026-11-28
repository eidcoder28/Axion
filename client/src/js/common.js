// These functions don't validate the types of arguments they receive because they
// either take valid API data (validated early with Zod in places like renderers)
// or hardcoded internal values

import $ from "cash-dom";
import Swal from "sweetalert2";
import { marked } from "marked";
import DOMPurify from "dompurify";
import axios from "axios";
import config from "@shared/config.js";
import { errorMsgs } from "@shared/messages.js";
import Notiflix from "notiflix";

function toObject(obj) {
    return Object.prototype.toString.call(obj) === "[object Object]" ? obj : {};
}

export async function copy(text) {
    try {
        await navigator.clipboard.writeText(text);
        Alert.success({ text: "Copied!" });
    } catch {
        Alert.error({ text: errorMsgs.copyFailed() });
    }
}

export function renderSafeHtml(raw, parse = true) {
    const parsed = parse ? marked.parse(raw) : raw;
    return DOMPurify.sanitize(parsed, {
        ALLOWED_TAGS: config.ALLOWED_TAGS,
        ALLOWED_ATTR: config.ALLOWED_ATTR,
        KEEP_CONTENT: false
    }).trim();
}

export function generatePostLink(postId) {
    return `${window.location.origin}${window.location.pathname}?id=${postId}`;
}

export function lockEvent(fn) {
    return async function (e) {
        const el = $(e.currentTarget);
        if (el.data("locked")) return;
        el.data("locked", true).addClass("disabled");

        try {
            await fn.call(this, e);
        } catch (err) {
            console.error(err);
            Alert.error({ text: errorMsgs.unexpectedError() });
        } finally {
            el.data("locked", false).removeClass("disabled");
        }
    };
}

export async function sendRequest(options = {}, showLoading = true) {
    const { body, ...requestConfig } = options;
    if (showLoading) Notiflix.Loading.standard("Working on it...");

    try {
        const response = await axios({
            ...requestConfig,
            data: body
        });

        return toObject(response.data);
    } catch (err) {
        console.error(err);
        return {
            error: toObject(err.response?.data).error || errorMsgs.unexpectedError()
        }
    } finally {
        if (showLoading) Notiflix.Loading.remove();
    }
}

export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export let quickInfo = {};

export async function initQuickInfo() {
    const data = await sendRequest({ url: "/api/v1/me/quick-info" }, false);
    if (data.success) {
        Object.keys(quickInfo).forEach(key => delete quickInfo[key]);
        Object.assign(quickInfo, data);
    }
}

const BaseToast = Swal.mixin({
    toast: true,
    position: "bottom-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    didOpen: toast => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export const Alert = {
    success: (options = {}) => BaseToast.fire({ icon: "success", title: "Success", ...options }),
    error: (options = {}) => BaseToast.fire({ icon: "error", title: "Error", ...options }),
    info: (options = {}) => BaseToast.fire({ icon: "info", title: "Info", ...options })
}