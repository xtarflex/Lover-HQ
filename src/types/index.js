/**
 * @typedef {Object} User
 * @property {string} id - The user's unique identifier.
 * @property {string} email - The user's email address.
 * @property {string} [name] - The user's display name.
 */

/**
 * @typedef {Object} Partner
 * @property {string} id - The partner's unique identifier.
 * @property {string} email - The partner's email address.
 * @property {string} [name] - The partner's display name.
 */

/**
 * @typedef {'online' | 'offline'} PresenceStatus
 */

/**
 * @typedef {Object} Presence
 * @property {PresenceStatus} user - The current user's presence status.
 * @property {PresenceStatus} partner - The partner's presence status.
 */

/**
 * @typedef {'fridge' | 'music' | 'games' | 'reveal' | 'board' | 'profile'} RoomType
 */

/**
 * @typedef {'unpaired' | 'pending' | 'paired'} PairingStatus
 */

/**
 * @typedef {Object} AppState
 * @property {User | null} user - The currently authenticated user.
 * @property {Partner | null} partner - The user's partner.
 * @property {Presence} presence - The presence status of both users.
 * @property {RoomType | null} currentRoom - The currently active feature/room.
 * @property {PairingStatus} pairingStatus - The pairing status between the user and partner.
 */

/**
 * @typedef {Object} AppAction
 * @property {string} type - The action type.
 * @property {any} [payload] - The action payload.
 */

export {};
