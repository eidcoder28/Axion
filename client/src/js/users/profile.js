import { bindProfilePostEvents, renderProfilePosts } from "@app/users/profile-feed.js";
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

export default async function showProfile(id) {
    const response = await sendRequest({ url: `/api/v1/users/${id}/profile` });
    if (!response.success) return Alert.error({ text: response.error });

    // I validate the incoming user data here to avoid rendering broken content
    const user = response.user;
    if (!validators.userSchema.safeParse(user).success) return;

    const state = {
        skip: 0,
        container: null,
        items: new Map(),
        user: {
            username: capitalize(user.username),
            id: user._id,
            me: user._id === quickInfo._id
        }
    }

    Swal.fire({
        titleText: `Hello, ${state.user.username}!`,
        html: templates.USER_PROFILE(state),
        stopKeydownPropagation: false,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            const popup = $(Swal.getPopup());
            state.container = popup.find("#user-posts-container");

            popup.find("#profile-load-posts-btn").on("click", lockEvent(async () => {
                await renderProfilePosts(state);
            }));

            popup.find("#profile-posts-prev-btn").on("click", lockEvent(async () => {
                state.skip -= config.USER_POSTS_LIMIT;
                await renderProfilePosts(state);
            }));

            popup.find("#profile-posts-next-btn").on("click", lockEvent(async () => {
                if (state.skip + config.USER_POSTS_LIMIT > config.PAGINATION_MAX_SKIP) return;
                if (!state.container.find("#profile-load-posts-btn").length) {
                    state.skip += config.USER_POSTS_LIMIT;
                }

                await renderProfilePosts(state);
            }));

            bindProfilePostEvents(state);
        }
    });
}