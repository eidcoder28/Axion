import templates from "@app/templates.js";
import CommentEditor from "@app/posts/comment-editor.js";
import {
    sendRequest,
    capitalize,
    lockEvent,
    config,
    quickInfo,
    $,
    Alert,
    Swal,
    toObject,
    toString
} from "@app/utils.js";

async function getComments(state = {}) {
    return await sendRequest({
        url: `/api/v1/posts/${state.id}/comments/?skip=${state.skip}`
    });
}

async function renderComments(state = {}, preFetchedResponse = null) {
    const response = preFetchedResponse || await getComments(state);
    if (response && !response.success) return Alert.error({ text: response.error });

    state.items.clear();
    $(state.container).empty();

    const $popup = $(Swal.getPopup());
    const hasComments = Array.isArray(response?.comments) && response.comments.length > 0;
    $popup.find("#comments-prev-btn").prop("disabled", state.skip <= 0);
    $popup.find("#comments-next-btn").prop("disabled", !hasComments);

    // No data :/
    if (!hasComments) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No comments yet.</b>")
            .appendTo(state.container);
        return;
    }

    const fragment = new DocumentFragment();

    response.comments.forEach(comment => {
        const safeComment = toObject(comment);
        const safeBy = toObject(safeComment.by);
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);
        
        state.items.set(safeComment._id, safeComment);

        $("<h3>")
            .addClass("overflow")
            .text(capitalize(safeBy.username) || "User")
            .appendTo(header);

        if (safeBy?._id && safeBy._id === quickInfo?._id) {
            const buttons = $("<div>").addClass("center").appendTo(header);

            $("<i>")
                .addClass("fas fa-pen-to-square icon-helper comment-edit-btn")
                .attr({
                    role: "button",
                    tabindex: "0",
                    "data-id": safeComment._id
                })
                .appendTo(buttons);

            $("<i>")
                .addClass("fas fa-trash icon-helper comment-delete-btn")
                .attr({ role: "button", tabindex: "0", "data-id": safeComment._id })
                .appendTo(buttons);
        }

        $("<p>")
            .text(toString(safeComment.content) || "No content found")
            .appendTo(card);

        if (safeComment.editedAt) {
            $("<small>")
                .text("(Edited)")
                .css("color", "gray")
                .appendTo(card);
        }
    });

    $(state.container).append(fragment);
}

export default async function showComments(id) {
    const state = { id, skip: 0, container: null, items: new Map() };
    const response = await getComments(state);
    if (!response.success) return Alert.error({ text: response.error });

    Swal.fire({
        title: "Comments",
        html: templates.POST_COMMENTS(),
        stopKeydownPropagation: false,
        confirmButtonText: "Close",
        didOpen: () => {
            const $popup = $(Swal.getPopup());
            state.container = $popup.find("#comments-container");

            $popup.on("click", ".comment-edit-btn", lockEvent(async function () {
                const comment = state.items.get(this.dataset.id);
                const instance = new CommentEditor("Edit comment", comment.content);
                const result = await instance.open();
                if (!result.isConfirmed) return;

                const response = await sendRequest({
                    url: `/api/v1/comments/${comment._id}/update`,
                    method: "PUT",
                    body: { content: result.value }
                });

                if (!response.success) return Alert.error({ text: response.error });
                if (!response.changed) return Alert.info({ text: "No changes were made!" });

                Alert.success({ text: "Comment updated!" });
            }));

            $popup.on("click", ".comment-delete-btn", lockEvent(async function () {
                const comment = state.items.get(this.dataset.id);
                const response = await sendRequest({
                    url: `/api/v1/comments/${comment._id}/delete`,
                    method: "DELETE"
                });

                if (!response.success) return Alert.error({ text: response.error });
                Alert.success({ text: "Comment deleted!" });
            }));

            $popup.find("#comments-prev-btn").on("click", lockEvent(async function () {
                if (state.skip <= 0) return;
                state.skip -= config.COMMENTS_LIMIT;
                await renderComments(state);
            }));

            $popup.find("#comments-next-btn").on("click", lockEvent(async function () {
                if ($(state.container).find(".state-nothing-found").length) return;
                if (state.skip + config.COMMENTS_LIMIT > config.PAGINATION_MAX_SKIP) return;

                state.skip += config.COMMENTS_LIMIT;
                await renderComments(state);
            }));

            renderComments(state, response);
        }
    });
}