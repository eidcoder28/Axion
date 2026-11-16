import PostEditor from "@app/posts/post-editor.js";
import {
    copy,
    renderSafeHtml,
    generatePostLink,
    sendRequest,
    $,
    capitalize,
    lockEvent,
    toObject,
    Alert,
    Swal
} from "@app/utils.js";

export function bindProfilePostEvents($popup, state) {
    $popup.on("click", ".profile-post-share-btn", lockEvent(function () {
        const post = state.items.get(this.dataset.id);
        return copy(generatePostLink(post._id));
    }));

    $popup.on("click", ".profile-post-delete-btn", lockEvent(async function () {
        const post = state.items.get(this.dataset.id);
        const response = await sendRequest({
            url: `/api/v1/posts/${post._id}/delete`,
            method: "DELETE"
        });

        if (!response.success) return Alert.error({ text: response.error });
        Alert.success({ text: "Post deleted!" });
    }));

    $popup.on("click", ".profile-post-edit-btn", lockEvent(async function () {
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

export async function getProfilePosts(userId, skip) {
    return await sendRequest({
        url: `/api/v1/users/${userId}/posts/?skip=${skip}`
    });
}

export async function renderProfilePosts(state = {}, preFetchedResponse = null) {
    const response = preFetchedResponse || await getProfilePosts(state.user.id, state.skip);
    if (response && !response.success) return Alert.error({ text: response.error });

    state.items.clear();
    $(state.container).empty();

    const $popup = $(Swal.getPopup());
    const hasPosts = Array.isArray(response?.posts) && response.posts.length > 0;
    $popup.find("#profile-posts-prev-btn").prop("disabled", state.skip <= 0);
    $popup.find("#profile-posts-next-btn").prop("disabled", !hasPosts);

    if (!hasPosts) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No posts yet.</b>")
            .appendTo(state.container);
        return;
    }

    const fragment = new DocumentFragment();

    response.posts.forEach(post => {
        const safePost = toObject(post);
        state.items.set(safePost._id, safePost);
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);

        $("<h2>")
            .addClass("overflow")
            .text(capitalize(safePost.title) || "Untitled post")
            .appendTo(header);

        $("<i>")
            .addClass("fas fa-link post-icon profile-post-share-btn")
            .attr({ role: "button", tabindex: "0", "data-id": safePost._id })
            .appendTo(header);

        $("<div>")
            .addClass("post-content")
            .html(renderSafeHtml(safePost.content) || "No content found")
            .appendTo(card);

        if (state.user.me) {
            const buttons = $("<div>").addClass("center-overflow").appendTo(card);

            $("<button>")
                .addClass("btn-danger w-full profile-post-delete-btn")
                .attr("data-id", safePost._id)
                .html("<i class='fas fa-trash'></i>")
                .appendTo(buttons);

            $("<button>")
                .addClass("w-full profile-post-edit-btn")
                .attr("data-id", safePost._id)
                .html("<i class='fas fa-edit'></i>")
                .appendTo(buttons);

        }
    });

    $(state.container).append(fragment);
}