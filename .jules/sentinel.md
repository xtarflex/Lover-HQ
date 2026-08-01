## 2023-10-27 - Unsanitized User URLs in React Href Attributes
**Vulnerability:** User-provided media URLs were directly rendered in `href` attributes (`<a href={msg.media_url}>`) without protocol sanitization, enabling XSS via `javascript:` URIs.
**Learning:** React escapes HTML content and text, but it does *not* validate or sanitize protocols in `href` attributes, making it a common XSS vector if URLs are user-generated.
**Prevention:** Always validate user-provided URLs before rendering them in `href` tags. Use `new URL(url, base)` to parse the URL safely, and verify that the `protocol` strictly matches an allowlist (e.g., `['http:', 'https:']`).
