import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from '../test/render.jsx';
import App from '../App.jsx';
import { ApiError } from '../api/client.js';
import { makeTool, makeListResponse, member, admin } from '../test/fixtures.js';
import * as authApi from '../api/authApi.js';
import * as toolsApi from '../api/toolsApi.js';
import { request } from '../api/client.js';

vi.mock('../api/authApi.js');
vi.mock('../api/weatherApi.js');
vi.mock('../api/toolsApi.js', async (orig) => ({ ...(await orig()), fetchTools: vi.fn(), fetchTool: vi.fn(), updateToolStatus: vi.fn() }));

beforeEach(() => {
  vi.resetAllMocks();
  authApi.fetchCurrentUser.mockRejectedValue(new ApiError('no', { status: 401 }));
  toolsApi.fetchTools.mockResolvedValue(makeListResponse());
});

describe('admin status control', () => {
  it('offers "Mark returned" for borrowed tools and returns them to available', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(admin);
    toolsApi.fetchTool.mockResolvedValue(makeTool({ status: 'borrowed' }));
    toolsApi.updateToolStatus.mockResolvedValue(makeTool({ status: 'available' }));
    renderApp(<App />, { route: '/tools/1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Mark returned' }));
    expect(toolsApi.updateToolStatus).toHaveBeenCalledWith(1, 'available');
    expect(await screen.findByRole('button', { name: 'Mark on loan' })).toBeInTheDocument();
  });
  it('brings a tool back from maintenance', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(admin);
    toolsApi.fetchTool.mockResolvedValue(makeTool({ status: 'maintenance' }));
    toolsApi.updateToolStatus.mockResolvedValue(makeTool({ status: 'available' }));
    renderApp(<App />, { route: '/tools/1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Return to service' }));
    expect(await screen.findByRole('button', { name: 'Mark under maintenance' })).toBeInTheDocument();
  });
});

describe('filter bar', () => {
  it('"Clear filters" is disabled until a filter is set, then resets the search box too', async () => {
    renderApp(<App />, { route: '/catalog' });
    await screen.findByText('Test Ladder');
    const clear = screen.getByRole('button', { name: 'Clear filters' });
    expect(clear).toBeDisabled();
    await userEvent.type(screen.getByRole('searchbox'), 'saw');
    await waitFor(() => expect(clear).toBeEnabled());
    await userEvent.click(clear);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
  it('restores filters when returning to the catalog (state survives navigation)', async () => {
    toolsApi.fetchTool.mockResolvedValue(makeTool());
    renderApp(<App />, { route: '/catalog' });
    await screen.findByText('Test Ladder');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Ladders');
    await userEvent.click(await screen.findByRole('link', { name: /Test Ladder/ }));
    await userEvent.click(await screen.findByRole('link', { name: /Back to catalog/ }));
    expect(await screen.findByLabelText('Category')).toHaveValue('Ladders');
  });
});

describe('api modules', () => {
  it('auth API helpers hit the documented endpoints and unwrap the user', async () => {
    const actual = await vi.importActual('../api/authApi.js');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ user: member }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await actual.loginRequest({ email: 'a', password: 'b' })).toEqual(member);
    expect(await actual.registerRequest({ name: 'n', email: 'a', password: 'b' })).toEqual(member);
    expect(await actual.fetchCurrentUser()).toEqual(member);
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/auth/login', '/api/auth/register', '/api/auth/me']);
    fetchMock.mockResolvedValue({ ok: true, status: 204 });
    expect(await actual.logoutRequest()).toBeNull();
  });
  it('tools API helpers unwrap { data }', async () => {
    const actual = await vi.importActual('../api/toolsApi.js');
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ data: makeTool() }) });
    vi.stubGlobal('fetch', fetchMock);
    expect((await actual.fetchTool(1)).name).toBe('Test Ladder');
    expect((await actual.updateToolStatus(1, 'maintenance')).id).toBe(1);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'PATCH', body: '{"status":"maintenance"}' });
    await request('/tools');
  });
});
