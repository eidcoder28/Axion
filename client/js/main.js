import { initQuickInfo } from "@app/common.js";
import $ from "cash-dom";
import { getPosts, postsState } from "@app/posts/main-feed.js";
import "@app/users/signup.js";
import "@app/users/profile.js";
import "@app/posts/create.js";

$(document).on("keydown", "[role='button']", function (e) {
    if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        this.click();
    }
});

getPosts(postsState.customId);
initQuickInfo();