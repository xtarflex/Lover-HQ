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

## 2024-07-15 - Sanitizing User-Provided File Extensions in Storage Paths
**Vulnerability:** Path traversal and injection via unsanitized file extensions in user-uploaded media files.
**Learning:** Even simple string splits (`file.name.split('.').pop()`) can leave harmful characters (e.g., path navigators, script tags) in the file extension if the initial input is malicious.
**Prevention:** Always use regex (`.replace(/[^a-zA-Z0-9]/g, '')`) to sanitize file extensions and restrict them to safe, alphanumeric formats before constructing storage paths.
