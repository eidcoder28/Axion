function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatLabel(template, label) {
    return capitalize(template.replace("{label}", label.trim()));
}

function formatCharCount(count) {
    return `${count} ${count === 1 ? "character" : "characters"}`;
}

const errors = {
    INVALID_CREDENTIALS: () => "Invalid username or password.",
    NOT_AUTHENTICATED: () => "You are not logged in.",
    SESSION_INIT_FAILED: () => "Session initialization failed.",
    SESSION_DESTROY_FAILED: () => "Failed to destroy session.",
    ACCOUNT_NOT_FOUND: () => "We can't find your account right now.",
    COPY_FAILED: () => "Failed to copy.",
    RATE_LIMITED: () => "Too many requests. Please try again later.",
    UNEXPECTED_ERROR: () => "An unexpected error occurred.",
    DUPLICATE_RESOURCE: (label) => formatLabel("{label} already exists in the system.", label),
    ACCESS_DENIED: (label) => formatLabel("You do not have access to this {label}.", label),
    NOT_FOUND: (label) => formatLabel("{label} not found.", label),

    VALIDATION: {
        STRING: (label) => formatLabel("{label} must be a string.", label),
        EMPTY: (label) => formatLabel("{label} can't be empty.", label),
        INVALID_FORMAT: (label) => formatLabel("Invalid {label} format.", label),
        REQUIRED: (label) => formatLabel("{label} is required.", label),
        MIN_LENGTH: (label, min) => formatLabel(`{label} must be at least ${formatCharCount(min)}.`, label),
        MAX_LENGTH: (label, max) => formatLabel(`{label} must not exceed ${formatCharCount(max)}.`, label),
        LENGTH_RANGE: (label, min, max) => formatLabel(`{label} must be between ${min} and ${max} characters.`, label),
        EXACT_LENGTH: (label, length) => formatLabel(`{label} must be exactly ${formatCharCount(length)}.`, label)
    }
}

export default errors;