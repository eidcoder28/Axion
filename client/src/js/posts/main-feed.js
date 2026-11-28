import showProfile from "@app/users/profile.js";
import showComments from "@app/posts/comments.js";
import CommentEditor from "@app/posts/comment-editor.js";
import config from "@shared/config.js";
import * as validators from "@shared/validation-schemas.js";
import $ from "cash-dom";
import {
    sendRequest,
    capitalize,
    renderSafeHtml,
    generatePostLink,
    lockEvent,
    copy,
    Alert
} from "@app/common.js";

const query = new URLSearchParams(window.location.search);
const postsContainer = $("#posts-container");
const postsNavContainer = $("#posts-nav-container");

export const postsState = {
    skip: 0,
    items: new Map(),
    customId: query.get("id")
}

postsContainer.on("click", ".post-share-btn", function () {
    // No need for lockEvent() here. This is just a copy function,
    // so it's completely idempotent and only takes a few milliseconds to finish
    const post = postsState.items.get(this.dataset.id);
    copy(generatePostLink(post._id));
});

postsContainer.on("click", ".post-author", lockEvent(async function () {
    const post = postsState.items.get(this.dataset.id);
    await showProfile(post.user._id);
}));

postsContainer.on("click", ".post-like-btn", lockEvent(async function () {
    const post = postsState.items.get(this.dataset.id);
    const response = await sendRequest({
        url: `/api/v1/posts/${post._id}/like`,
        method: "POST"
    });

    if (!response.success) return Alert.error({ text: response.error });

    const likesCount = $(this).find(".likes-count");
    likesCount.text((Number(likesCount.text()) || 0) + 1);
    Alert.success({ text: "Post liked!" });
}));

postsContainer.on("click", ".post-comments-btn", lockEvent(async function () {
    const post = postsState.items.get(this.dataset.id);
    await showComments(post._id);
}));

postsContainer.on("click", ".post-add-comment-btn", lockEvent(async function () {
    const post = postsState.items.get(this.dataset.id);
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
    postsState.items.clear();
    postsContainer.empty();

    const validPosts = Array.isArray(posts) ? posts.filter(p => validators.postSchema.safeParse(p).success) : [];
    const hasPosts = validPosts.length > 0;
    $("#posts-prev-btn").prop("disabled", !postsState.skip);
    $("#posts-next-btn").prop("disabled", !hasPosts);

    if (!hasPosts) {
        $("<div>")
            .addClass("state-nothing-found")
            .html("<b>No posts found!</b>")
            .appendTo(postsContainer);
        return;
    }

    const fragment = new DocumentFragment();
    validPosts.forEach(post => {
        const user = post.user;
        const id = post._id;
        const card = $("<div>").addClass("card").appendTo(fragment);
        const header = $("<div>").addClass("space-between").appendTo(card);
        postsState.items.set(id, post);

        $("<h2>")
            .addClass("overflow")
            .text(capitalize(post.title))
            .appendTo(header);

        $("<i>")
            .addClass("fas fa-link post-icon post-share-btn")
            .attr({ role: "button", tabindex: "0", "data-id": id })
            .appendTo(header);

        $("<div>")
            .addClass("post-content")
            .html(renderSafeHtml(post.content) || "No content found.")
            .appendTo(card);

        $("<p>")
            .addClass("post-author")
            .css({ color: "red", cursor: "pointer" })
            .attr({ role: "button", tabindex: "0", "data-id": id })
            .text(`Created by: ${capitalize(user.username)}`)
            .appendTo(card);

        const reactions = $("<div>").addClass("reactions-container").appendTo(card);
        const likes = Number(post.likes) || 0;

        $("<button>")
            .addClass("post-like-btn")
            .attr("data-id", id)
            .html(`<i class="fas fa-thumbs-up"></i> <span class="likes-count">${likes}</span>`)
            .appendTo(reactions);

        $("<button>")
            .addClass("post-comments-btn")
            .attr("data-id", id)
            .html(`<i class="fas fa-comments"></i>`)
            .appendTo(reactions);

        $("<button>")
            .addClass("post-add-comment-btn")
            .attr("data-id", id)
            .html(`<i class="fas fa-comment-medical"></i>`)
            .appendTo(reactions);
    });

    postsContainer.append(fragment);
}

export async function getPosts(customId = null) {
    const data = await sendRequest({
        url: customId ? `/api/v1/posts/${customId}` : `/api/v1/posts/?skip=${postsState.skip}`
    });

    if (!data.success) return Alert.error({ text: data.error });
    renderPosts(data.posts);
}

if (!postsState.customId) {
    $("<button>")
        .attr("id", "posts-prev-btn")
        .prop("disabled", true)
        .html("<i class='fas fa-chevron-left'></i> Prev")
        .on("click", lockEvent(async () => {
            postsState.skip -= config.POSTS_LIMIT;
            await getPosts();
        }))
        .appendTo(postsNavContainer);

    $("<button>")
        .attr("id", "posts-next-btn")
        .html("Next <i class='fas fa-chevron-right'></i>")
        .on("click", lockEvent(async () => {
            if (postsState.skip + config.POSTS_LIMIT > config.PAGINATION_MAX_SKIP) return;

            postsState.skip += config.POSTS_LIMIT;
            await getPosts();
        }))
        .appendTo(postsNavContainer);
}