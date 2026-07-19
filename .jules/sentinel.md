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

## 2025-02-27 - Path Traversal via Unsanitized File Extension Extraction
**Vulnerability:** Extracted file extensions from user uploads using `file.name.substring(file.name.lastIndexOf('.'))` were used directly to construct storage file paths without sanitization, allowing path traversal characters within the extension itself.
**Learning:** Even if the base filename is sanitized, extracting the extension dynamically using string manipulation leaves a gap. Malicious files named `payload./../../` would result in an extension of `./../../`, which bypasses base sanitization and breaks directory structure constraints.
**Prevention:** Always sanitize every part of a user-provided filename, including the dynamically extracted extension. Use regex like `.replace(/[^a-zA-Z0-9]/g, '')` on the extracted extension to ensure it only contains safe alphanumeric characters before using it in a file path.
