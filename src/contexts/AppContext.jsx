import React, { createContext, useReducer, useContext } from 'react';

/** @type {import('../types').AppState} */
const initialState = {
  user: null,
  partner: null,
  presence: {
    user: 'offline',
    partner: 'offline',
    partnerRoom: null,
  },
  currentRoom: null,
  pairingStatus: 'unpaired',
  preferences: null,
  activeInvitation: null,
  autoJoinGameId: null,
  globalNotification: null,
  activeGameId: null,
  isAuthLoading: true,
};

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

/**
 * @description Pure reducer function for the global application state.
 * Handles all dispatched actions that mutate user, partner, presence,
 * room, pairing, preferences, invitation, game, and notification state.
 *
 * State shape:
 * ```
 * {
 *   user:               object|null,   // authenticated Supabase user + profile
 *   partner:            object|null,   // linked partner profile
 *   presence:           { user: string, partner: string, partnerRoom: string|null },
 *   currentRoom:        string|null,   // active presence room label
 *   pairingStatus:      'unpaired'|'paired'|string,
 *   preferences:        object|null,   // user_preferences row from Supabase
 *   activeInvitation:   object|null,   // pending game invitation payload
 *   autoJoinGameId:     string|null,   // game ID for auto-join redirect
 *   globalNotification: { message: string, type: string }|null,
 *   activeGameId:       string|null,   // currently running mini-game ID
 * }
 * ```
 *
 * Action union:
 * - `{ type: 'SET_USER',               payload: object|null }`
 * - `{ type: 'SET_PARTNER',            payload: object|null }`
 * - `{ type: 'SET_PRESENCE',           payload: Partial<presence> }`
 * - `{ type: 'SET_CURRENT_ROOM',       payload: string|null }`
 * - `{ type: 'SET_PAIRING_STATUS',     payload: string }`
 * - `{ type: 'SET_PREFERENCES',        payload: object|null }`
 * - `{ type: 'UPDATE_PREFERENCE',      payload: Partial<preferences> }`
 * - `{ type: 'SET_INVITATION',         payload: object|null }`
 * - `{ type: 'SET_AUTO_JOIN',          payload: string|null }`
 * - `{ type: 'SET_GLOBAL_NOTIFICATION',payload: { message: string, type: string }|null }`
 * - `{ type: 'SET_ACTIVE_GAME',        payload: string|null }`
 * - `{ type: 'RESET_STATE' }`
 *
 * @param {import('../types').AppState}  state  - Current application state.
 * @param {import('../types').AppAction} action - Dispatched action object.
 * @returns {import('../types').AppState} The next application state.
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_AUTH_LOADING':
      return { ...state, isAuthLoading: action.payload };
    case 'SET_PARTNER':
      return { ...state, partner: action.payload };
    case 'SET_PRESENCE':
      return {
        ...state,
        presence: { ...state.presence, ...action.payload },
      };
    case 'SET_CURRENT_ROOM':
      return { ...state, currentRoom: action.payload };
    case 'SET_PAIRING_STATUS':
      return { ...state, pairingStatus: action.payload };
    case 'SET_PREFERENCES':
      return { ...state, preferences: action.payload };
    case 'UPDATE_PREFERENCE':
      return {
        ...state,
        preferences: state.preferences
          ? { ...state.preferences, ...action.payload }
          : action.payload,
      };
    case 'SET_INVITATION':
      return { ...state, activeInvitation: action.payload };
    case 'SET_AUTO_JOIN':
      return { ...state, autoJoinGameId: action.payload };
    case 'SET_GLOBAL_NOTIFICATION':
      return { ...state, globalNotification: action.payload };
    case 'SET_ACTIVE_GAME':
      return { ...state, activeGameId: action.payload };
    case 'RESET_STATE':
      return { ...initialState, isAuthLoading: false };
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
}

/**
 * @description Provides the global AppContext and AppDispatchContext to the
 * component tree via a useReducer. Wrap the root of your application with this
 * provider before using any of the consumer hooks.
 *
 * @param {object}          props          - Component props.
 * @param {React.ReactNode} props.children - Child components that will have
 *   access to the app state and dispatch.
 * @returns {React.ReactElement} Provider wrapping children.
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

/**
 * @description Consumes the AppContext state. Must be called inside an
 * {@link AppProvider}. Throws a descriptive error if called outside the provider.
 *
 * @returns {import('../types').AppState} The current global application state.
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

/**
 * @description Consumes the AppDispatchContext. Must be called inside an
 * {@link AppProvider}. Throws a descriptive error if called outside the provider.
 *
 * @returns {React.Dispatch<import('../types').AppAction>} The dispatch function
 *   for the global application reducer.
 */
export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
