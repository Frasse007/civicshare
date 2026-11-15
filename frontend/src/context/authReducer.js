/**
 * Pure reducer for the auth slice (easy to unit test, no React needed).
 * status: 'loading' (checking session) | 'authenticated' | 'anonymous'
 */
export const initialAuthState = { user: null, status: 'loading' };

export const AUTH_ACTIONS = Object.freeze({ SESSION_LOADED: 'SESSION_LOADED', LOGGED_OUT: 'LOGGED_OUT' });

export function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SESSION_LOADED:
      return action.user ? { user: action.user, status: 'authenticated' } : { user: null, status: 'anonymous' };
    case AUTH_ACTIONS.LOGGED_OUT:
      return { user: null, status: 'anonymous' };
    default:
      return state;
  }
}
