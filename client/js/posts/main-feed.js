import showProfile from "@app/users/profile.js";
import showComments from "@app/posts/comments.js";
import CommentEditor from "@app/posts/comment-editor.js";
import {
    sendRequest,
    capitalize,
    renderSafeHtml,
    generatePostLink,
    lockEvent,
    toObject,
    copy,
    $,
    Alert
} from "@app/utils.js";

const query = new URLSearchParams(window.location.search);
const postsMap = new Map();
const postsContainer = $("#posts-container");

export const postsState = {
    skip: 0,
    customPostId: query.get("id")
}

postsContainer.on("click", ".post-share-btn", lockEvent(function () {
    const post = postsMap.get(this.dataset.id);
    return copy(generatePostLink(post._id));
}));

postsContainer.on("click", ".post-author", lockEvent(function () {
    const post = postsMap.get(this.dataset.id);
    return showProfile(toObject(post.user)._id);
}));

postsContainer.on("click", ".post-like-btn", lockEvent(async function () {
    const post = postsMap.get(this.dataset.id);
    const response = await sendRequest({
        url: `/api/v1/posts/${post._id}/like`,
        method: "POST"
    });

    if (response.error) return Alert.error({ text: response.error });

    const $likesCount = $(this).find(".likes-count");
    $likesCount.text((Number($likesCount.text()) || 0) + 1);
    Alert.success({ text: "Post liked!" });
}));

postsContainer.on("click", ".post-comments-btn", lockEvent(function () {
    const post = postsMap.get(this.dataset.id);
    return showComments(post._id);
}));

postsContainer.on("click", ".post-add-comment-btn", lockEvent(async function () {
    const post = postsMap.get(this.dataset.id);
    const instance = new CommentEditor("Add comment");
    const result = await instance.open();
    if (!result.isConfirmed) return;

    const response = await sendRequest({
        url: `/api/v1/posts/${post._id}/comments`,
        method: "POST",
        body: { content: result.value }
    });

    if (!response.success) return Alert.error({ text: response.error });
    Alert.success({ text: "Comment added!" });
}));

export async function renderPosts(posts = []) {
    postsMap.clear();
    postsContainer.empty();

    const hasPosts = Array.isArray(posts) && posts.length > 0;
    $("#posts-prev-btn").prop("disabled", postsState.skip <= 0);
    $("#posts-next-btn").prop("disabled", !hasPosts);

    if (!hasPosts) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No posts found!</b>")
            .appendTo(postsContainer);
        return;
    }

    const fragment = new DocumentFragment();

    posts.forEach(post => {
        const safePost = toObject(post);
        postsMap.set(safePost._id, safePost);
        const safeUser = toObject(safePost.user);
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);

        $("<h2>")
            .addClass("overflow")
            .text(capitalize(safePost.title) || "No title found")
            .appendTo(header);

        $("<i>")
            .addClass("fas fa-link post-icon post-share-btn")
            .attr({ role: "button", tabindex: "0", "data-id": safePost._id })
            .appendTo(header);

        $("<div>")
            .addClass("post-content")
            .html(renderSafeHtml(safePost.content) || "No content found")
            .appendTo(card);

        $("<p>")
            .addClass("post-author")
            .css({ color: "red", cursor: "pointer" })
            .attr({ role: "button", tabindex: "0", "data-id": safePost._id })
            .text(`Created by: ${capitalize(safeUser.username) || "Someone"}`)
            .appendTo(card);

        const reactions = $("<div>").addClass("reactions-container").appendTo(card);
        const likes = Number(safePost.likes) || 0;

        $("<button>")
            .addClass("post-like-btn")
            .attr("data-id", safePost._id)
            .html(`<i class="fas fa-thumbs-up"></i> <span class="likes-count">${likes}</span>`)
            .appendTo(reactions);

        $("<button>")
            .addClass("post-comments-btn")
            .attr("data-id", safePost._id)
            .html(`<i class="fas fa-comments"></i>`)
            .appendTo(reactions);

        $("<button>")
            .addClass("post-add-comment-btn")
            .attr("data-id", safePost._id)
            .html(`<i class="fas fa-comment-medical"></i>`)
            .appendTo(reactions);
    });

    postsContainer.append(fragment);
}

export async function getPosts(postId = null) {
    const data = await sendRequest({
        url: postId ? `/api/v1/posts/${postId}` : `/api/v1/posts/?skip=${postsState.skip}`
    });

    if (!data.success) return Alert.error({ text: data.error });
    renderPosts(data.posts);
}