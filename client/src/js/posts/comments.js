import CommentEditor from "@app/posts/comment-editor.js";
import config from "@shared/config.js";
import $ from "cash-dom";
import Swal from "sweetalert2";
import templates from "@app/templates.js";
import * as validators from "@shared/validation-schemas.js";
import {
    sendRequest,
    capitalize,
    lockEvent,
    quickInfo,
    Alert
} from "@app/common.js";

async function getComments(state = {}) {
    return await sendRequest({
        url: `/api/v1/posts/${state.id}/comments/?skip=${state.skip}`
    });
}

async function renderComments(state = {}, preFetchedResponse = null) {
    const response = preFetchedResponse || await getComments(state);
    if (!response.success) return Alert.error({ text: response.error });

    state.items.clear();
    state.container.empty();

    const popup = $(Swal.getPopup());
    const comments = response.comments;
    const validComments = Array.isArray(comments) ? comments.filter(c => validators.commentSchema.safeParse(c).success) : [];
    const hasComments = validComments.length > 0;
    popup.find("#comments-prev-btn").prop("disabled", !state.skip);
    popup.find("#comments-next-btn").prop("disabled", !hasComments);

    if (!hasComments) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No comments yet.</b>")
            .appendTo(state.container);
        return;
    }

    const fragment = new DocumentFragment();
    validComments.forEach(comment => {
        const user = comment.user;
        const id = comment._id;
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);
        state.items.set(id, comment);

        $("<h3>")
            .addClass("overflow")
            .text(capitalize(user.username))
            .appendTo(header);

        if (user._id === quickInfo._id) {
            const buttons = $("<div>").addClass("center").appendTo(header);

            // After updates or deletions in renderers, the UI isn't stale because I show
            // a SweetAlert2 toast, which will clear the modal (SweetAlert2 is single-instance per page)
            $("<i>")
                .addClass("fas fa-pen-to-square icon-helper comment-edit-btn")
                .attr({
                    role: "button",
                    tabindex: "0",
                    "data-id": id
                })
                .appendTo(buttons);

            $("<i>")
                .addClass("fas fa-trash icon-helper comment-delete-btn")
                .attr({ role: "button", tabindex: "0", "data-id": id })
                .appendTo(buttons);
        }

        $("<p>")
            .text(comment.content)
            .appendTo(card);

        if (comment.editedAt) {
            $("<small>")
                .text("(Edited)")
                .css("color", "gray")
                .appendTo(card);
        }
    });

    state.container.append(fragment);
}

export default async function showComments(postId) {
    const state = {
        id: postId,
        skip: 0,
        container: null,
        items: new Map()
    };

    const response = await getComments(state);
    if (!response.success) {
        return Alert.error({ text: response.error });
    }

    Swal.fire({
        title: "Comments",
        html: templates.POST_COMMENTS(),
        stopKeydownPropagation: false,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            const popup = $(Swal.getPopup());
            state.container = popup.find("#comments-container");

            popup.on("click", ".comment-edit-btn", lockEvent(async function () {
                const commentId = this.dataset.id;
                const comment = state.items.get(commentId);
                const instance = new CommentEditor("Edit comment", comment.content);
                const result = await instance.open();
                if (!result.isConfirmed) return;

                const response = await sendRequest({
                    url: `/api/v1/comments/${commentId}/update`,
                    method: "PUT",
                    body: { content: result.value }
                });

                if (!response.success) return Alert.error({ text: response.error });
                if (!response.changed) return Alert.info({ text: "No changes were made!" });

                Alert.success({ text: "Comment updated!" });
            }));

            popup.on("click", ".comment-delete-btn", lockEvent(async function () {
                const commentId = this.dataset.id;
                const response = await sendRequest({
                    url: `/api/v1/comments/${commentId}/delete`,
                    method: "DELETE"
                });

                if (!response.success) return Alert.error({ text: response.error });
                Alert.success({ text: "Comment deleted!" });
            }));

            popup.find("#comments-prev-btn").on("click", lockEvent(async () => {
                state.skip -= config.COMMENTS_LIMIT;
                await renderComments(state);
            }));

            popup.find("#comments-next-btn").on("click", lockEvent(async () => {
                if (state.skip + config.COMMENTS_LIMIT > config.PAGINATION_MAX_SKIP) return;

                state.skip += config.COMMENTS_LIMIT;
                await renderComments(state);
            }));

            renderComments(state, response);
        }
    });
}