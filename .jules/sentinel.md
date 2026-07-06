## 2024-07-06 - Weak random number generation for file paths
**Vulnerability:** Weak pseudo-random number generator (`Math.random()`) was being used to generate random IDs used in constructing file paths for audio track uploads.
**Learning:** Standard library `Math.random()` does not provide cryptographically secure numbers, making generated IDs predictable. This predictability can lead to file path collisions or allow unauthorized users to guess the file paths of uploaded files in the storage system.
**Prevention:** Always use a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG), such as `window.crypto.getRandomValues()`, for generating IDs or tokens that require unpredictability, particularly those associated with user data.
