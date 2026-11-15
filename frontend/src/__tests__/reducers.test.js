import { describe, it, expect } from 'vitest';
import { authReducer, initialAuthState, AUTH_ACTIONS } from '../context/authReducer.js';
import { inventoryReducer, initialInventoryState, INVENTORY_ACTIONS, DEFAULT_FILTERS } from '../context/inventoryReducer.js';
import { makeTool, makeListResponse, member } from '../test/fixtures.js';

describe('authReducer', () => {
  it('starts in loading state', () => expect(initialAuthState).toEqual({ user: null, status: 'loading' }));
  it('authenticates when a user is loaded', () => {
    expect(authReducer(initialAuthState, { type: AUTH_ACTIONS.SESSION_LOADED, user: member })).toEqual({ user: member, status: 'authenticated' });
  });
  it('becomes anonymous when the session has no user', () => {
    expect(authReducer(initialAuthState, { type: AUTH_ACTIONS.SESSION_LOADED, user: null }).status).toBe('anonymous');
  });
  it('clears the user on logout', () => {
    expect(authReducer({ user: member, status: 'authenticated' }, { type: AUTH_ACTIONS.LOGGED_OUT })).toEqual({ user: null, status: 'anonymous' });
  });
  it('ignores unknown actions', () => {
    const s = { user: member, status: 'authenticated' };
    expect(authReducer(s, { type: 'NOPE' })).toBe(s);
  });
});

describe('inventoryReducer', () => {
  it('merges filter changes and resets to page 1', () => {
    const paged = { ...initialInventoryState, filters: { ...DEFAULT_FILTERS, page: 3 } };
    const next = inventoryReducer(paged, { type: INVENTORY_ACTIONS.SET_FILTERS, changes: { category: 'Ladders' } });
    expect(next.filters).toMatchObject({ category: 'Ladders', page: 1 });
  });
  it('keeps the requested page when only paging', () => {
    const next = inventoryReducer(initialInventoryState, { type: INVENTORY_ACTIONS.SET_FILTERS, changes: { page: 2 } });
    expect(next.filters.page).toBe(2);
  });
  it('does not mutate previous state', () => {
    const before = structuredClone(initialInventoryState);
    inventoryReducer(initialInventoryState, { type: INVENTORY_ACTIONS.SET_FILTERS, changes: { search: 'x' } });
    expect(initialInventoryState).toEqual(before);
  });
  it('resets filters to defaults', () => {
    const dirty = { ...initialInventoryState, filters: { ...DEFAULT_FILTERS, search: 'x', category: 'Ladders' } };
    expect(inventoryReducer(dirty, { type: INVENTORY_ACTIONS.RESET_FILTERS }).filters).toEqual(DEFAULT_FILTERS);
  });
  it('tracks the request lifecycle', () => {
    const loading = inventoryReducer(initialInventoryState, { type: INVENTORY_ACTIONS.FETCH_START });
    expect(loading.status).toBe('loading');
    const res = makeListResponse();
    const ok = inventoryReducer(loading, { type: INVENTORY_ACTIONS.FETCH_SUCCESS, tools: res.data, meta: res.meta, options: res.filters });
    expect(ok).toMatchObject({ status: 'success', error: null });
    expect(ok.tools).toHaveLength(1);
    const failed = inventoryReducer(ok, { type: INVENTORY_ACTIONS.FETCH_ERROR, error: 'boom' });
    expect(failed).toMatchObject({ status: 'error', error: 'boom' });
  });
  it('replaces just the updated tool', () => {
    const state = { ...initialInventoryState, tools: [makeTool({ id: 1 }), makeTool({ id: 2, name: 'Other' })] };
    const next = inventoryReducer(state, { type: INVENTORY_ACTIONS.TOOL_UPDATED, tool: makeTool({ id: 2, name: 'Other', status: 'maintenance' }) });
    expect(next.tools[1].status).toBe('maintenance');
    expect(next.tools[0]).toBe(state.tools[0]);
  });
});
