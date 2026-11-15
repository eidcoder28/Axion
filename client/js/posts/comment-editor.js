import { config, Swal, validator, toString } from "@app/utils.js";
import errors from "@shared/errors.js";

export default class CommentEditor {
    #instance;

    constructor(title, initial) {
        this.title = toString(title) || "Comment editor";
        this.initial = toString(initial);
        this.#instance = null;
    }

    async open() {
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
            
            didDestroy: () => {
                this.#instance = null;
            },

            preConfirm: result => {
                const trimmed = toString(result);

                if (validator.isEmpty(trimmed)) {
                    return Swal.showValidationMessage(errors.VALIDATION.REQUIRED("comment"));
                }

                if (trimmed === toString(this.initial)) {
                    return Swal.showValidationMessage("The content is the same as before.");
                }

                return trimmed;
            }
        });

        try {
            return await this.#instance;
        } finally {
            this.#instance = null;
        }
    }

    close() {
        this.#instance?.close();
        this.#instance = null;
    }
}