import config from "@shared/config.js";
import * as validators from "@shared/validation-schemas.js";
import Swal from "sweetalert2";
import { errorMsgs } from "@shared/messages.js";

export default class CommentEditor {
    #instance;

    constructor(title = "Comment editor", initial = "") {
        // No need to validate these arguments since they are either hardcoded internally 
        // (like title) or passed in from pre-validated API data
        this.title = title;
        this.initial = initial;
        this.#instance = null;
    }

    async open() {
        if (this.#instance) return;

        this.#instance = Swal.fire({
            title: this.title,
            input: "text",
            inputValue: this.initial,
            inputPlaceholder: "Enter value...",
            showCancelButton: true,
            confirmButtonText: "Submit",
            inputAttributes: {
                maxLength: config.COMMENTS_MAX_LENGTH
            },

            preConfirm: result => {
                const parsed = validators.commentInputSchema.safeParse({ content: result });

                if (!parsed.success) {
                    return Swal.showValidationMessage(parsed.error.issues[0].message);
                }

                if (parsed.data.content === this.initial) {
                    return Swal.showValidationMessage(errorMsgs.noChanges());
                }

                return parsed.data.content;
            }
        });

        try {
            return await this.#instance;
        } finally {
            this.#instance = null;
        }
    }

    close() {
        // Starting with SweetAlert2 v8, close() is supported as an instance method
        this.#instance?.close();
        this.#instance = null;
    }
}