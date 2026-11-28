import config from "@shared/config.js";
import * as validators from "@shared/validation-schemas.js";
import $ from "cash-dom";
import Swal from "sweetalert2";
import templates from "@app/templates.js";
import { errorMsgs } from "@shared/messages.js";

export default class PostEditor {
    #instance;

    constructor(title = "Post editor", initial = {}) {
        this.title = title;
        this.initial = { title: initial.title ?? "", content: initial.content ?? ""};
        this.#instance = null;
    }

    async open() {
        if (this.#instance) return;

        this.#instance = Swal.fire({
            title: this.title,
            html: templates.POST_EDITOR(),
            showCancelButton: true,
            confirmButtonText: "Submit",
            didOpen: () => {
                const popup = $(Swal.getPopup());

                popup.find("#post-editor-title")
                    .val(this.initial.title)
                    .attr("maxLength", config.POST_TITLE_MAX_LENGTH);

                popup.find("#post-editor-content")
                    .val(this.initial.content)
                    .attr("maxLength", config.POST_CONTENT_MAX_LENGTH);
            },

            preConfirm: () => {
                const popup = $(Swal.getPopup());
                const title = popup.find("#post-editor-title").val();
                const content = popup.find("#post-editor-content").val();
                const parsed = validators.postInputSchema.safeParse({ title, content });

                if (!parsed.success) {
                    return Swal.showValidationMessage(parsed.error.issues[0].message);
                }

                if (
                    parsed.data.title === this.initial.title &&
                    parsed.data.content === this.initial.content
                ) {
                    return Swal.showValidationMessage(errorMsgs.noChanges());
                }

                return parsed.data;
            }
        });

        try {
            return await this.#instance;
        } finally {
            this.#instance = null;
        }
    }

    close() {
        // It's better to target the instance itself so the dev doesn't 
        // accidentally close any open SweetAlert2 instance when calling close()
        this.#instance?.close();
        this.#instance = null;
    }
}