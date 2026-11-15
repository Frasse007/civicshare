import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderApp } from '../test/render.jsx';
import App from '../App.jsx';
import { ApiError } from '../api/client.js';
import { makeTool, makeListResponse, member, admin } from '../test/fixtures.js';
import * as authApi from '../api/authApi.js';
import * as toolsApi from '../api/toolsApi.js';
import * as weatherApi from '../api/weatherApi.js';

vi.mock('../api/authApi.js');
vi.mock('../api/weatherApi.js');
vi.mock('../api/toolsApi.js', async (orig) => ({ ...(await orig()), fetchTools: vi.fn(), fetchTool: vi.fn(), updateToolStatus: vi.fn() }));

const anonymous = () => authApi.fetchCurrentUser.mockRejectedValue(new ApiError('no', { status: 401 }));

beforeEach(() => {
  vi.resetAllMocks();
  anonymous();
  toolsApi.fetchTools.mockResolvedValue(makeListResponse([makeTool({ id: 1, name: 'Ladder' }), makeTool({ id: 2, name: 'Washer', category: 'Cleaning' })]));
});

describe('routing', () => {
  it('renders the landing page at /', async () => {
    renderApp(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /Borrow the tool/ })).toBeInTheDocument();
  });
  it('shows the 404 page for unknown URLs', () => {
    renderApp(<App />, { route: '/nope/nothing' });
    expect(screen.getByRole('heading', { name: /404/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Browse the tool library/ })).toHaveAttribute('href', '/catalog');
  });
  it('navigates from the landing page to the catalog with the nav links', async () => {
    renderApp(<App />);
    await userEvent.click(screen.getAllByRole('link', { name: 'Browse tools' })[0]);
    expect(await screen.findByRole('heading', { name: 'Tool catalog' })).toBeInTheDocument();
  });
  it('exposes at least 4 distinct routes', () => {
    const paths = ['/', '/catalog', '/login', '/register'];
    paths.forEach((p) => {
      const { unmount } = renderApp(<App />, { route: p });
      expect(screen.queryByRole('heading', { name: /404/ })).toBeNull();
      unmount();
    });
  });
  it('shows login / join buttons when logged out and the user name + logout when logged in', async () => {
    renderApp(<App />);
    expect(await screen.findByRole('link', { name: 'Join free' })).toBeInTheDocument();
  });
  it('shows an Admin pill for admins', async () => {
    authApi.fetchCurrentUser.mockResolvedValue(admin);
    renderApp(<App />);
    expect(await screen.findByText('Admin')).toBeInTheDocument();
    expect(screen.getByText(/Hi, Ada/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
  });
});

describe('CatalogPage', () => {
  it('lists tools and the result count', async () => {
    renderApp(<App />, { route: '/catalog' });
    expect(await screen.findByText('Ladder')).toBeInTheDocument();
    expect(screen.getByText('Washer')).toBeInTheDocument();
    expect(screen.getByText('2 tools found')).toBeInTheDocument();
  });
  it('shows a skeleton while loading', () => {
    toolsApi.fetchTools.mockReturnValue(new Promise(() => {}));
    renderApp(<App />, { route: '/catalog' });
    expect(screen.getByLabelText('Loading tools')).toBeInTheDocument();
  });
  it('shows an error with retry', async () => {
    toolsApi.fetchTools.mockRejectedValueOnce(new ApiError('Cannot reach the CivicShare server.')).mockResolvedValue(makeListResponse());
    renderApp(<App />, { route: '/catalog' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Test Ladder')).toBeInTheDocument();
  });
  it('shows an empty state with a working "clear all filters"', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse([], { total: 0 }));
    renderApp(<App />, { route: '/catalog' });
    expect(await screen.findByText('No tools match those filters')).toBeInTheDocument();
    toolsApi.fetchTools.mockClear();
    await userEvent.click(screen.getByRole('button', { name: 'clear all filters' }));
    await waitFor(() => expect(toolsApi.fetchTools).toHaveBeenCalled());
  });
  it('changing a dropdown refetches with that filter', async () => {
    renderApp(<App />, { route: '/catalog' });
    await screen.findByText('Ladder');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'Ladders');
    await waitFor(() => expect(toolsApi.fetchTools).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'Ladders' }), expect.anything()));
  });
  it('debounces typing in the search box into a single request', async () => {
    renderApp(<App />, { route: '/catalog' });
    await screen.findByText('Ladder');
    toolsApi.fetchTools.mockClear();
    await userEvent.type(screen.getByRole('searchbox'), 'saw');
    await waitFor(() => expect(toolsApi.fetchTools).toHaveBeenLastCalledWith(expect.objectContaining({ search: 'saw' }), expect.anything()));
    expect(toolsApi.fetchTools.mock.calls.every(([f]) => f.search === 'saw')).toBe(true);
  });
  it('paginates', async () => {
    toolsApi.fetchTools.mockResolvedValue(makeListResponse([makeTool()], { total: 30, totalPages: 3 }));
    renderApp(<App />, { route: '/catalog' });
    await userEvent.click(await screen.findByRole('button', { name: /Next/ }));
    await waitFor(() => expect(toolsApi.fetchTools).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.anything()));
  });
});

describe('LoginPage', () => {
  it('validates before calling the API', async () => {
    renderApp(<App />, { route: '/login' });
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(authApi.loginRequest).not.toHaveBeenCalled();
  });
  it('logs in and redirects to the catalog', async () => {
    authApi.loginRequest.mockResolvedValue(member);
    renderApp(<App />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'maya@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'Secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByRole('heading', { name: 'Tool catalog' })).toBeInTheDocument();
    expect(authApi.loginRequest).toHaveBeenCalledWith({ email: 'maya@example.com', password: 'Secret123' });
    expect(await screen.findByText(/Hi, Maya/)).toBeInTheDocument();
  });
  it('shows the server error and re-enables the button', async () => {
    authApi.loginRequest.mockRejectedValue(new ApiError('Invalid email or password', { status: 401 }));
    renderApp(<App />, { route: '/login' });
    await userEvent.type(screen.getByLabelText('Email'), 'maya@example.com');
    await userEvent.type(screen.getByLabelText('Password'), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });
});

describe('RegisterPage', () => {
  const fill = async (over = {}) => {
    const v = { name: 'Maya Member', email: 'maya@example.com', password: 'Secret123', ...over };
    await userEvent.type(screen.getByLabelText('Full name'), v.name);
    await userEvent.type(screen.getByLabelText('Email'), v.email);
    await userEvent.type(screen.getByLabelText('Password'), v.password);
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));
  };
  it('rejects a weak password client-side', async () => {
    renderApp(<App />, { route: '/register' });
    await fill({ password: 'short' });
    expect(await screen.findByText(/at least 8 characters/, { selector: '[role=alert]' })).toBeInTheDocument();
    expect(authApi.registerRequest).not.toHaveBeenCalled();
  });
  it('registers, trims input and lands on the catalog', async () => {
    authApi.registerRequest.mockResolvedValue(member);
    renderApp(<App />, { route: '/register' });
    await fill({ name: '  Maya Member ' });
    expect(await screen.findByRole('heading', { name: 'Tool catalog' })).toBeInTheDocument();
    expect(authApi.registerRequest).toHaveBeenCalledWith({ name: 'Maya Member', email: 'maya@example.com', password: 'Secret123' });
  });
  it('puts a duplicate-email (409) error on the email field', async () => {
    authApi.registerRequest.mockRejectedValue(new ApiError('An account with that email already exists', { status: 409 }));
    renderApp(<App />, { route: '/register' });
    await fill();
    expect(await screen.findByText('An account with that email already exists')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });
  it('maps server field errors onto fields', async () => {
    authApi.registerRequest.mockRejectedValue(new ApiError('Validation failed', { status: 400, details: [{ field: 'name', message: 'Bad name' }] }));
    renderApp(<App />, { route: '/register' });
    await fill();
    expect(await screen.findByText('Bad name')).toBeInTheDocument();
  });
  it('shows generic network errors in the form', async () => {
    authApi.registerRequest.mockRejectedValue(new ApiError('Cannot reach the CivicShare server.'));
    renderApp(<App />, { route: '/register' });
    await fill();
    expect(await screen.findByText(/Cannot reach/)).toBeInTheDocument();
  });
});

describe('ToolDetailPage', () => {
  const detail = (tool) => toolsApi.fetchTool.mockResolvedValue(tool);

  it('shows safety gear, guidelines and description', async () => {
    detail(makeTool());
    renderApp(<App />, { route: '/tools/1' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Test Ladder' })).toBeInTheDocument();
    expect(screen.getByText('Gloves')).toBeInTheDocument();
    expect(screen.getByText('Keep three points of contact.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Download safety sheet/ })).toBeInTheDocument();
  });
  it('shows a 404 view for missing tools', async () => {
    toolsApi.fetchTool.mockRejectedValue(new ApiError('Tool not found', { status: 404 }));
    renderApp(<App />, { route: '/tools/999' });
    expect(await screen.findByRole('heading', { name: 'Tool not found' })).toBeInTheDocument();
  });
  it('shows a retryable error for server failures', async () => {
    toolsApi.fetchTool.mockRejectedValueOnce(new ApiError('Boom', { status: 500 })).mockResolvedValue(makeTool());
    renderApp(<App />, { route: '/tools/1' });
    expect(await screen.findByRole('alert')).toHaveTextContent('Boom');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Test Ladder' })).toBeInTheDocument();
  });
  it('warns that tools under maintenance cannot be reserved', async () => {
    detail(makeTool({ status: 'maintenance' }));
    renderApp(<App />, { route: '/tools/1' });
    expect(await screen.findByRole('status')).toHaveTextContent(/under maintenance/);
  });
  it('hides admin controls from anonymous users and members', async () => {
    detail(makeTool());
    authApi.fetchCurrentUser.mockResolvedValue(member);
    renderApp(<App />, { route: '/tools/1' });
    await screen.findByRole('heading', { level: 1, name: 'Test Ladder' });
    await screen.findByText(/Hi, Maya/);
    expect(screen.queryByText('Inventory manager')).toBeNull();
  });
  it('lets admins mark a tool under maintenance (and updates the UI)', async () => {
    detail(makeTool());
    authApi.fetchCurrentUser.mockResolvedValue(admin);
    toolsApi.updateToolStatus.mockResolvedValue(makeTool({ status: 'maintenance' }));
    renderApp(<App />, { route: '/tools/1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Mark under maintenance' }));
    expect(toolsApi.updateToolStatus).toHaveBeenCalledWith(1, 'maintenance');
    expect(await screen.findByRole('button', { name: 'Return to service' })).toBeInTheDocument();
  });
  it('shows admin errors (e.g. 403) without changing state', async () => {
    detail(makeTool());
    authApi.fetchCurrentUser.mockResolvedValue(admin);
    toolsApi.updateToolStatus.mockRejectedValue(new ApiError('You do not have permission to do that', { status: 403 }));
    renderApp(<App />, { route: '/tools/1' });
    await userEvent.click(await screen.findByRole('button', { name: 'Mark under maintenance' }));
    expect(await screen.findByText('You do not have permission to do that')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark under maintenance' })).toBeInTheDocument();
  });
  it('downloads the safety sheet as a text file', async () => {
    detail(makeTool());
    const createUrl = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: createUrl, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderApp(<App />, { route: '/tools/1' });
    await userEvent.click(await screen.findByRole('button', { name: /Download safety sheet/ }));
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
  });
});

describe('weather on outdoor tools', () => {
  const outdoor = makeTool({ weatherSensitive: true });
  const day = (i, over = {}) => ({ date: `2026-11-${15 + i}`, code: 0, max: 60, min: 45, precipChance: 0, wind: 5, label: 'Clear sky', icon: '☀️', ...over });

  it('renders the forecast with advice for each day', async () => {
    toolsApi.fetchTool.mockResolvedValue(outdoor);
    weatherApi.fetchForecast.mockResolvedValue([day(0), day(1, { precipChance: 80 })]);
    renderApp(<App />, { route: '/tools/1' });
    expect(await screen.findByText('Good conditions')).toBeInTheDocument();
    expect(screen.getByText('Likely rain (80%)')).toBeInTheDocument();
    expect(weatherApi.fetchForecast).toHaveBeenCalledWith(41.88, -87.62, expect.any(AbortSignal));
  });
  it('shows an error with retry if Open-Meteo fails', async () => {
    toolsApi.fetchTool.mockResolvedValue(outdoor);
    weatherApi.fetchForecast.mockRejectedValueOnce(new Error('Weather service returned 500')).mockResolvedValue([day(0)]);
    renderApp(<App />, { route: '/tools/1' });
    expect(await screen.findByText(/Could not load the forecast/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByText('Good conditions')).toBeInTheDocument();
  });
  it('does not call the weather API for indoor tools', async () => {
    toolsApi.fetchTool.mockResolvedValue(makeTool({ weatherSensitive: false }));
    renderApp(<App />, { route: '/tools/1' });
    await screen.findByRole('heading', { level: 1, name: 'Test Ladder' });
    expect(weatherApi.fetchForecast).not.toHaveBeenCalled();
  });
});

describe('route table sanity', () => {
  it('Routes can be mounted standalone', () => {
    renderApp(<Routes><Route path="/" element={<p>ok</p>} /></Routes>);
    expect(screen.getByText('ok')).toBeInTheDocument();
  });
});
