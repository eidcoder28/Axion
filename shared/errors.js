const FALLBACK_MSG = "Please re-check your request and try again.";
const pluralRules = new Intl.PluralRules("en-US");

const isValidString = (str) => typeof str === "string" && str.trim().length > 0;
const getPositiveIntegersError = (fallback, ...nums) =>
    nums.every((num) => Number.isInteger(num) && num >= 1) ? null : fallback;

const capitalize = (str) => {
    if (!isValidString(str)) return "";
    return (str.charAt(0).toUpperCase() + str.slice(1)).trim();
}

const formatLabel = (template, label) => {
    if (!isValidString(template) || !isValidString(label)) return FALLBACK_MSG;
    return capitalize(template.replace("{label}", label.trim()));
}

const formatCharCount = (count) =>
    `${count} ${pluralRules.select(count) === "one" ? "character" : "characters"}`;

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

        MIN_LENGTH: (label, min) =>
            getPositiveIntegersError(FALLBACK_MSG, min) ??
            formatLabel(`{label} must be at least ${formatCharCount(min)}.`, label),

        MAX_LENGTH: (label, max) =>
            getPositiveIntegersError(FALLBACK_MSG, max) ??
            formatLabel(`{label} must not exceed ${formatCharCount(max)}.`, label),

        LENGTH_RANGE: (label, min, max) =>
            getPositiveIntegersError(FALLBACK_MSG, min, max) ??
            (min >= max
                ? FALLBACK_MSG
                : formatLabel(`{label} must be between ${min} and ${max} characters.`, label)),

        EXACT_LENGTH: (label, length) =>
            getPositiveIntegersError(FALLBACK_MSG, length) ??
            formatLabel(`{label} must be exactly ${formatCharCount(length)}.`, label)
    }
}

export default errors;