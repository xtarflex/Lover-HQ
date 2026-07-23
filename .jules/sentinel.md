## 2024-07-06 - Weak random number generation for file paths
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was being used to generate random IDs used in constructing file paths for audio track uploads.
**Learning:** Standard library `Math.random()` does not provide cryptographically secure numbers, making generated IDs predictable. This predictability can lead to file path collisions or allow unauthorized users to guess the file paths of uploaded files in the storage system.
**Prevention:** Always use a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG), such as `window.crypto.getRandomValues()`, for generating IDs or tokens that require unpredictability, particularly those associated with user data.
## 2025-02-27 - Path Traversal in File Uploads
**Vulnerability:** Untrusted user input (`file.name`) was used directly in constructing file paths for image uploads to Supabase storage.
**Learning:** Using raw user input in file paths allows attackers to manipulate the upload destination by including path traversal characters (like `../`) or malicious extensions, potentially overwriting other users files, escaping the intended directory structure, or creating XSS vectors when the path is later used.
**Prevention:** Always sanitize filenames from user uploads (e.g., removing all characters except alphanumeric and a few safe characters) or preferably generate a random UUID/hash for the storage filename entirely decoupled from the user input.

## 2026-07-08 - Insecure file path generation with predictable randomness and potential path traversal
**Vulnerability:** File paths generated for user uploads relied on `Date.now()` and untrusted `file.name` strings.
**Learning:** Relying on standard dates without secure randomness allows malicious actors to guess file paths and potentially collide with other users' files. Using raw user inputs like `file.name` introduces the risk of path traversal attacks (`../../../`) if unvalidated.
**Prevention:** Use `window.crypto.getRandomValues` to generate secure random strings when constructing file paths to prevent predictability, and use regex to strip out potentially dangerous characters from user-provided file names.

## 2025-02-27 - Decoupling User Input from File Paths completely
**Vulnerability:** Even when stripping some characters using `replace`, untrusted user input strings like `file.name` used directly in dynamic file paths risk path traversal (e.g. `foo.js_.._.._bar` from `foo.js/../../bar`) leading to logic errors or vulnerabilities if the sanitization misses edge cases.
**Learning:** Relying on replacing specific characters is a blacklist approach, which is often flawed.
**Prevention:** It is more secure to completely discard the user-provided filename except for its parsed extension. Generate a completely randomized filename utilizing `window.crypto.getRandomValues()`, and extract and rigorously sanitize only the alphanumeric extension from the original input before appending.
## 2026-06-25 - Prevent Hardcoded Infrastructure URLs
**Vulnerability:** Found hardcoded URLs pointing to a specific development/testing Supabase instance (e.g., `https://oxqpmfdoytdfxmofmeno.supabase.co`) in fallback logic and simulated functions.
**Learning:** Hardcoded environment URLs can inadvertently leak testing infrastructure details or cause subtle cross-environment issues where staging code hits production resources (or vice versa).
**Prevention:** Always construct backend service URLs dynamically using environment variables (`import.meta.env.VITE_SUPABASE_URL`), and ensure fallback logic handles missing values securely (e.g., empty string or throwing an error) without exposing specific instances.
