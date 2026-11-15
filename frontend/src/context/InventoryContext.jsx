/**
 * InventoryContext - Provider + reducer + "container" pattern.
 * Mounted above the router so catalog filters and results persist across navigation.
 * Components never call fetch directly for the list: they change filters and the
 * provider refetches (cancelling any in-flight request to avoid out-of-order results).
 */
import { createContext, useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { inventoryReducer, initialInventoryState, INVENTORY_ACTIONS } from './inventoryReducer.js';
import { fetchTools } from '../api/toolsApi.js';

export const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [state, dispatch] = useReducer(inventoryReducer, initialInventoryState);
  const [reloadToken, setReloadToken] = useState(0);
  const { filters } = state;

  useEffect(() => {
    const controller = new AbortController();
    dispatch({ type: INVENTORY_ACTIONS.FETCH_START });
    fetchTools(filters, controller.signal)
      .then((res) => dispatch({ type: INVENTORY_ACTIONS.FETCH_SUCCESS, tools: res.data, meta: res.meta, options: res.filters }))
      .catch((err) => {
        if (err.name !== 'AbortError') dispatch({ type: INVENTORY_ACTIONS.FETCH_ERROR, error: err.message });
      });
    return () => controller.abort();
  }, [filters, reloadToken]);

  const setFilters = useCallback((changes) => dispatch({ type: INVENTORY_ACTIONS.SET_FILTERS, changes }), []);
  const resetFilters = useCallback(() => dispatch({ type: INVENTORY_ACTIONS.RESET_FILTERS }), []);
  const replaceTool = useCallback((tool) => dispatch({ type: INVENTORY_ACTIONS.TOOL_UPDATED, tool }), []);
  const retry = useCallback(() => setReloadToken((n) => n + 1), []);

  const value = useMemo(
    () => ({ ...state, setFilters, resetFilters, replaceTool, retry }),
    [state, setFilters, resetFilters, replaceTool, retry],
  );
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}
