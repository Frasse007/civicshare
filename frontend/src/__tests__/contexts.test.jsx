import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/render.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { useInventory } from '../hooks/useInventory.js';
import { ApiError } from '../api/client.js';
import { makeTool, makeListResponse, member, admin } from '../test/fixtures.js';
import * as authApi from '../api/authApi.js';
import * as toolsApi from '../api/toolsApi.js';

vi.mock('../api/authApi.js');
vi.mock('../api/toolsApi.js', async (orig) => ({ ...(await orig()), fetchTools: vi.fn(), fetchTool: vi.fn(), updateToolStatus: vi.fn() }));

function AuthProbe() {
  const { user, status, isAdmin, login, logout } = useAuth();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="user">{user?.name ?? 'nobody'}</p>
      <p data-testid="admin">{String(isAdmin)}</p>
      <button onClick={() => login({ email: 'a@b.co', password: 'x' }).catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

function InventoryProbe() {
  const { tools, status, error, filters, setFilters, resetFilters, replaceTool, retry } = useInventory();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="error">{error}</p>
      <p data-testid="names">{tools.map((t) => `${t.name}:${t.status}`).join(',')}</p>
      <p data-testid="filters">{JSON.stringify(filters)}</p>
      <button onClick={() => setFilters({ category: 'Ladders' })}>filter</button>
      <button onClick={() => setFilters({ page: 2 })}>page2</button>
      <button onClick={resetFilters}>reset</button>
      <button onClick={() => replaceTool(makeTool({ status: 'maintenance' }))}>replace</button>
      <button onClick={retry}>retry</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    toolsApi.fetchTools.mockResolvedValue(makeListResponse()); // InventoryProvider also mounts
  });

  it('restores an existing session on mount', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(member);
    renderApp(<AuthProbe />);
    expect(screen.getByTestId('status')).toHaveTextContent('loading');
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    expect(screen.getByTestId('user')).toHaveTextContent('Maya Member');
    expect(screen.getByTestId('admin')).toHaveTextContent('false');
  });

  it('becomes anonymous when there is no session (401)', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new ApiError('Authentication required', { status: 401 }));
    renderApp(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });

  it('login updates global state and exposes isAdmin for admins', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new ApiError('no', { status: 401 }));
    authApi.loginRequest.mockResolvedValue(admin);
    renderApp(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    await userEvent.click(screen.getByText('login'));
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));
    expect(screen.getByTestId('user')).toHaveTextContent('Ada Admin');
  });

  it('a failed login leaves the user anonymous', async () => {
    authApi.fetchCurrentUser.mockRejectedValue(new ApiError('no', { status: 401 }));
    authApi.loginRequest.mockRejectedValue(new ApiError('Invalid email or password', { status: 401 }));
    renderApp(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
    await userEvent.click(screen.getByText('login'));
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous');
  });

  it('logout clears the user even if the request fails', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(member);
    authApi.logoutRequest.mockRejectedValue(new Error('network'));
    renderApp(<AuthProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('authenticated'));
    await act(async () => { await userEvent.click(screen.getByText('logout')).catch(() => {}); });
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('anonymous'));
  });

  it('useAuth throws outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderBare(<AuthProbe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});

import { render } from '@testing-library/react';
const renderBare = (ui) => render(ui);

describe('InventoryContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authApi.fetchCurrentUser.mockRejectedValue(new ApiError('no', { status: 401 }));
  });

  it('fetches on mount and exposes results', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse([makeTool({ name: 'Ladder' })]));
    renderApp(<InventoryProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'));
    expect(screen.getByTestId('names')).toHaveTextContent('Ladder:available');
  });

  it('refetches with new filters and resets to page 1', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse());
    renderApp(<InventoryProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'));
    await userEvent.click(screen.getByText('page2'));
    await userEvent.click(screen.getByText('filter'));
    await waitFor(() => expect(toolsApi.fetchTools).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Ladders', page: 1 }), expect.any(AbortSignal)));
  });

  it('reset restores default filters', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse());
    renderApp(<InventoryProbe />);
    await userEvent.click(screen.getByText('filter'));
    await userEvent.click(screen.getByText('reset'));
    await waitFor(() => expect(JSON.parse(screen.getByTestId('filters').textContent).category).toBe(''));
  });

  it('surfaces errors and recovers on retry', async () => {
    toolsApi.fetchTools.mockRejectedValueOnce(new ApiError('Server exploded')).mockResolvedValue(makeListResponse([makeTool({ name: 'Back' })]));
    renderApp(<InventoryProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('error'));
    expect(screen.getByTestId('error')).toHaveTextContent('Server exploded');
    await userEvent.click(screen.getByText('retry'));
    await waitFor(() => expect(screen.getByTestId('names')).toHaveTextContent('Back'));
  });

  it('replaceTool updates a single tool without refetching', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse());
    renderApp(<InventoryProbe />);
    await waitFor(() => expect(screen.getByTestId('status')).toHaveTextContent('success'));
    const calls = toolsApi.fetchTools.mock.calls.length;
    await userEvent.click(screen.getByText('replace'));
    expect(screen.getByTestId('names')).toHaveTextContent('Test Ladder:maintenance');
    expect(toolsApi.fetchTools.mock.calls.length).toBe(calls);
  });
});
