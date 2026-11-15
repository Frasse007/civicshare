/**
 * Pure reducer for catalog state: filters + fetched page + request status.
 * Keeping filters in context (not component state) means they survive navigating to a
 * tool and pressing Back and the catalog is exactly as the user left it.
 */
export const DEFAULT_FILTERS = Object.freeze({
  search: '', category: '', condition: '', status: '', minSafety: '', sort: 'name', page: 1,
});

export const initialInventoryState = {
  filters: { ...DEFAULT_FILTERS },
  tools: [],
  meta: null,
  options: { categories: [], conditions: [], statuses: [] },
  status: 'idle', // idle | loading | success | error
  error: null,
};

export const INVENTORY_ACTIONS = Object.freeze({
  SET_FILTERS: 'SET_FILTERS',
  RESET_FILTERS: 'RESET_FILTERS',
  FETCH_START: 'FETCH_START',
  FETCH_SUCCESS: 'FETCH_SUCCESS',
  FETCH_ERROR: 'FETCH_ERROR',
  TOOL_UPDATED: 'TOOL_UPDATED',
});

export function inventoryReducer(state, action) {
  switch (action.type) {
    case INVENTORY_ACTIONS.SET_FILTERS: {
      // Any filter change other than paging returns to page 1 (never mutate: build new objects).
      const changesPage = Object.prototype.hasOwnProperty.call(action.changes, 'page');
      return { ...state, filters: { ...state.filters, ...action.changes, ...(changesPage ? {} : { page: 1 }) } };
    }
    case INVENTORY_ACTIONS.RESET_FILTERS:
      return { ...state, filters: { ...DEFAULT_FILTERS } };
    case INVENTORY_ACTIONS.FETCH_START:
      return { ...state, status: 'loading', error: null };
    case INVENTORY_ACTIONS.FETCH_SUCCESS:
      return { ...state, status: 'success', tools: action.tools, meta: action.meta, options: action.options, error: null };
    case INVENTORY_ACTIONS.FETCH_ERROR:
      return { ...state, status: 'error', error: action.error };
    case INVENTORY_ACTIONS.TOOL_UPDATED:
      return { ...state, tools: state.tools.map((t) => (t.id === action.tool.id ? action.tool : t)) };
    default:
      return state;
  }
}
