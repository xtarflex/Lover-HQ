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
};

const AppContext = createContext(null);
const AppDispatchContext = createContext(null);

/**
 * @param {import('../types').AppState} state
 * @param {import('../types').AppAction} action
 * @returns {import('../types').AppState}
 */
function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
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
    case 'RESET_STATE':
      return initialState;
    default:
      console.warn(`Unhandled action type: ${action.type}`);
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>{children}</AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

/**
 * @returns {import('../types').AppState}
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === null) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

/**
 * @returns {React.Dispatch<import('../types').AppAction>}
 */
export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (context === null) {
    throw new Error('useAppDispatch must be used within an AppProvider');
  }
  return context;
};
