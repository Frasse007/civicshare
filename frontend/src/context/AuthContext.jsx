/**
 * AuthContext - Provider pattern.
 * Holds the signed-in user for the whole tree. The session itself lives in an HTTP-only cookie. 
 * This context only mirrors "who am I" for the UI and exposes login/register/logout.
 */
import { createContext, useCallback, useEffect, useMemo, useReducer } from 'react';
import { authReducer, initialAuthState, AUTH_ACTIONS } from './authReducer.js';
import { fetchCurrentUser, loginRequest, registerRequest, logoutRequest } from '../api/authApi.js';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  // Restore the session on first load (survives page refresh thanks to the cookie).
  useEffect(() => {
    const controller = new AbortController();
    fetchCurrentUser(controller.signal)
      .then((user) => dispatch({ type: AUTH_ACTIONS.SESSION_LOADED, user }))
      .catch((err) => {
        if (err.name !== 'AbortError') dispatch({ type: AUTH_ACTIONS.SESSION_LOADED, user: null });
      });
    return () => controller.abort();
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await loginRequest(credentials);
    dispatch({ type: AUTH_ACTIONS.SESSION_LOADED, user });
    return user;
  }, []);

  const register = useCallback(async (details) => {
    const user = await registerRequest(details);
    dispatch({ type: AUTH_ACTIONS.SESSION_LOADED, user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      dispatch({ type: AUTH_ACTIONS.LOGGED_OUT });
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, isAdmin: state.user?.role === 'admin', login, register, logout }),
    [state, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
