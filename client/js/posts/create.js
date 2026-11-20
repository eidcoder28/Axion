import { getPosts, postsState } from "@app/posts/main-feed.js";
import PostEditor from "@app/posts/post-editor.js";
import config from "@shared/config.js";
import $ from "cash-dom";
import {
    lockEvent,
    sendRequest,
    Alert
} from "@app/common.js";

const createPostBtn = $("#create-post-btn");
const postsNavigationContainer = $("#posts-navigation-container");

createPostBtn.on("click", lockEvent(async function () {
    const instance = new PostEditor("Create post");
    const result = await instance.open();
    if (!result.isConfirmed) return;

    const response = await sendRequest({
        url: "/api/v1/posts",
        method: "POST",
        body: result.value
    });

    if (!response.success) return Alert.error({ text: response.error });
    Alert.success({ text: "Post created!" });
}));

if (!postsState.customId) {
    $("<button>")
        .attr("id", "posts-prev-btn")
        .prop("disabled", true)
        .html("<i class='fas fa-chevron-left'></i> Prev")
        .on("click", lockEvent(async () => {
            if (postsState.skip <= 0) return;

            postsState.skip -= config.POSTS_LIMIT;
            await getPosts();
        }))
        .appendTo(postsNavigationContainer);

    $("<button>")
        .attr("id", "posts-next-btn")
        .html("Next <i class='fas fa-chevron-right'></i>")
        .on("click", lockEvent(async () => {
            if (postsState.skip + config.POSTS_LIMIT > config.PAGINATION_MAX_SKIP) return;

            postsState.skip += config.POSTS_LIMIT;
            await getPosts();
        }))
        .appendTo(postsNavigationContainer);
}