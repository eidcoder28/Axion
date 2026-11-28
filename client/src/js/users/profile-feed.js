import PostEditor from "@app/posts/post-editor.js";
import $ from "cash-dom";
import Swal from "sweetalert2";
import * as validators from "@shared/validation-schemas.js";
import {
    copy,
    renderSafeHtml,
    generatePostLink,
    sendRequest,
    capitalize,
    lockEvent,
    Alert
} from "@app/common.js";

export function bindProfilePostEvents(state = {}) {
    state.container.on("click", ".profile-post-share-btn", function () {
        const post = state.items.get(this.dataset.id);
        copy(generatePostLink(post._id));
    });

    state.container.on("click", ".profile-post-delete-btn", lockEvent(async function () {
        const post = state.items.get(this.dataset.id);
        const response = await sendRequest({
            url: `/api/v1/posts/${post._id}/delete`,
            method: "DELETE"
        });

        if (!response.success) return Alert.error({ text: response.error });
        Alert.success({ text: "Post deleted!" });
    }));

    state.container.on("click", ".profile-post-edit-btn", lockEvent(async function () {
        const post = state.items.get(this.dataset.id);
        const instance = new PostEditor("Update post", post);
        const result = await instance.open();
        if (!result.isConfirmed) return;

        const response = await sendRequest({
            url: `/api/v1/posts/${post._id}/update`,
            method: "PUT",
            body: result.value
        });

        if (!response.success) return Alert.error({ text: response.error });
        if (!response.changed) return Alert.info({ text: "No changes were made!" });

        Alert.success({ text: "Post updated!" });
    }));
}

export async function getProfilePosts(userId, skip = 0) {
    // The skip value is only passed by internal code, so validating
    // that it's a number will just be over-engineering
    return await sendRequest({
        url: `/api/v1/users/${userId}/posts/?skip=${skip}`
    });
}

export async function renderProfilePosts(state = {}, preFetchedResponse = null) {
    const response = preFetchedResponse || await getProfilePosts(state.user.id, state.skip);
    if (!response.success) return Alert.error({ text: response.error });

    state.items.clear();
    state.container.empty();

    const popup = $(Swal.getPopup());
    const posts = response.posts;
    const validPosts = Array.isArray(posts) ? posts.filter(p => validators.postSchema.safeParse(p).success) : [];
    const hasPosts = validPosts.length > 0;

    // state.skip can't be negative, so !state.skip checks for 0 (as 0 is falsy)
    popup.find("#profile-posts-prev-btn").prop("disabled", !state.skip);
    popup.find("#profile-posts-next-btn").prop("disabled", !hasPosts);

    if (!hasPosts) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No posts yet.</b>")
            .appendTo(state.container);
        return;
    }

    const fragment = new DocumentFragment();
    validPosts.forEach(post => {
        const id = post._id;
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);
        state.items.set(id, post);

        $("<h2>")
            .addClass("overflow")
            .text(capitalize(post.title))
            .appendTo(header);

        $("<i>")
            .addClass("fas fa-link post-icon profile-post-share-btn")
            .attr({ role: "button", tabindex: "0", "data-id": id })
            .appendTo(header);

        $("<div>")
            .addClass("post-content")
            .html(renderSafeHtml(post.content) || "No content found.")
            .appendTo(card);

        if (state.user.me) {
            const buttons = $("<div>").addClass("center-overflow").appendTo(card);

            $("<button>")
                .addClass("btn-danger w-full profile-post-delete-btn")
                .attr("data-id", id)
                .html("<i class='fas fa-trash'></i>")
                .appendTo(buttons);

            $("<button>")
                .addClass("w-full profile-post-edit-btn")
                .attr("data-id", id)
                .html("<i class='fas fa-edit'></i>")
                .appendTo(buttons);
        }
    });

    state.container.append(fragment);
}