// No need to validate the given args in this module. They are just internally hardcoded. 

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLabel(template, label) {
    return capitalize(template.replace("{label}", label.trim())).trim();
}

function formatCharCount(count) {
    return `${count} ${count === 1 ? "character" : "characters"}`;
}

export const errorMsgs = {
    invalidCredentials: () => "Invalid username or password.",
    notAuthenticated: () => "You are not logged in.",
    sessionInitFailed: () => "Session initialization failed.",
    sessionDestroyFailed: () => "Failed to destroy session.",
    noChanges: () => "No changes were made.",
    accountNotFound: () => "We can't find your account right now.",
    copyFailed: () => "Failed to copy.",
    rateLimited: () => "Too many requests. Please try again later.",
    invalidRequest: () => "Please re-check your request and try again.",
    unexpectedError: () => "An unexpected error occurred.",
    duplicateResource: (label) => formatLabel("{label} already exists in the system.", label),
    notFound: (label) => formatLabel("{label} not found.", label),

    validation: {
        string: (label) => formatLabel("{label} must be a string.", label),
        empty: (label) => formatLabel("{label} can't be empty.", label),
        invalidFormat: (label) => formatLabel("Invalid {label} format.", label),
        required: (label) => formatLabel("{label} is required.", label),
        minLength: (label, min) => formatLabel(`{label} must be at least ${formatCharCount(min)}.`, label),
        maxLength: (label, max) => formatLabel(`{label} must not exceed ${formatCharCount(max)}.`, label),
        exactLength: (label, length) => formatLabel(`{label} must be exactly ${formatCharCount(length)}.`, label),
        lengthRange: (label, min, max, str = true) =>
            formatLabel(`{label} must be between ${min} and ${max} ${str ? "characters" : ""}.`, label),
    }
}