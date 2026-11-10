const FALLBACK_MESSAGE = "Please re-check your request and try again.";
const isString = (str) => typeof str === "string" && str.trim();
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const getIntegersError = (fallback, ...nums) => nums?.every(num => Number.isInteger(num) && num >= 0) ? null : fallback;
const formatLabel = (template, label) => {
    if (!isString(template) || !isString(label)) {
        return FALLBACK_MESSAGE;
    }

    const formattedLabel = template.replace("{label}", label.trim());
    return capitalize(formattedLabel);
}
        
export const errors = {
    INVALID_CREDENTIALS: () => "Invalid username or password.",
    NOT_AUTHENTICATED: () => "You are not logged in.",
    SESSION_INITIALIZATION_FAILED: () => "Session initialization failed.",
    SESSION_DESTROY_FAILED: () => "Failed to destroy session.",
    ACCOUNT_NOT_FOUND: () => "We can't find your account right now.",
    ACCOUNT_NOT_FOUND_FOR_USERNAME: () => "No account was found with that username.",
    PASSWORD_UPDATE_FAILED: () => "Failed to update password.",
    COPY_FAILED: () => "Failed to copy.",
    RATE_LIMITED: () => "Too many requests. Please try again later.",
    UNEXPECTED_ERROR: () => "An unexpected error occurred.",

    DUPLICATE_RESOURCE: (label) => formatLabel("{label} already exists in the system.", label),
    ACCESS_DENIED: (resource) => `You do not have access to this ${isString(resource) ? resource.trim() : "resource"}.`,
    NOT_FOUND: (resource) => `${isString(resource) ? resource.trim() : "Requested item"} not found.`,

    VALIDATION: {
        STRING: (label) => formatLabel("{label} must be a string.", label),
        EMPTY: (label) => formatLabel("{label} cannot be empty.", label),
        NON_NEGATIVE_INTEGER: (label) => formatLabel("{label} value must be a non-negative integer.", label),
        BOOLEAN: (label) => formatLabel("{label} value must be true or false.", label),
        INVALID_FORMAT: (label) => formatLabel("Invalid {label} format.", label),
        REQUIRED: (label) => formatLabel("{label} is required.", label),

        MIN_LENGTH: (label, min) =>
            getIntegersError(FALLBACK_MESSAGE, min) ??
            formatLabel(`{label} must be at least ${min} characters.`, label),

        MAX_LENGTH: (label, max) =>
            getIntegersError(FALLBACK_MESSAGE, max) ??
            formatLabel(`{label} must not exceed ${max} characters.`, label),

        LENGTH_RANGE: (label, min, max) =>
            getIntegersError(FALLBACK_MESSAGE, min, max) ??
            formatLabel(`{label} must be between ${min} and ${max} characters.`, label),

        EXACT_LENGTH: (label, length) =>
            getIntegersError(FALLBACK_MESSAGE, length) ??
            formatLabel(`{label} must be exactly ${length} characters.`, label)
    }
}

export default errors;