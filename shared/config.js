const config = {
    POST_TITLE_MAX_LENGTH: 30,
    POST_CONTENT_MAX_LENGTH: 2500,
    COMMENTS_MAX_LENGTH: 300,
    ALLOWED_TAGS: [
        "pre", "code", "b", "i", "br", "span", "em", "strong", "u", "s", "sub", "sup", "small",
        "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "ul", "ol", "li",
        "blockquote", "cite", "q", "#text"
    ],
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 10,
    PASSWORD_MIN_LENGTH: 12,
    PASSWORD_MAX_LENGTH: 64,
    EMAIL_MAX_LENGTH: 100,
    POSTS_LIMIT: 15,
    USER_POSTS_LIMIT: 10,
    COMMENTS_LIMIT: 20,
    PAGINATION_MAX_SKIP: 5000
}

export default config;