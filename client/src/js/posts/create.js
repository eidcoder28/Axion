import PostEditor from "@app/posts/post-editor.js";
import $ from "cash-dom";
import {
    lockEvent,
    sendRequest,
    Alert
} from "@app/common.js";

$("#create-post-btn").on("click", lockEvent(async () => {
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