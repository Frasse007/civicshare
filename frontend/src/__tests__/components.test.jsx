import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ToolCard from '../components/ToolCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import SafetyRating from '../components/SafetyRating.jsx';
import FormField from '../components/FormField.jsx';
import Pagination from '../components/Pagination.jsx';
import NavBar from '../components/NavBar.jsx';
import Reveal from '../components/Reveal.jsx';
import { ErrorState, EmptyState, LoadingGrid } from '../components/StateMessage.jsx';
import { makeTool } from '../test/fixtures.js';

describe('ToolCard', () => {
  it('renders name, category, status, condition and pickup station as a link to the detail route', () => {
    render(<MemoryRouter><ToolCard tool={makeTool({ id: 7 })} /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Test Ladder' })).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText(/Maple Street Garage/)).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tools/7');
  });
  it('visually mutes tools under maintenance', () => {
    const { container } = render(<MemoryRouter><ToolCard tool={makeTool({ status: 'maintenance' })} /></MemoryRouter>);
    expect(container.querySelector('.tool-card--muted')).not.toBeNull();
    expect(screen.getByText('Under maintenance')).toBeInTheDocument();
  });
});

describe('StatusBadge / SafetyRating', () => {
  it.each([['available', 'Available'], ['borrowed', 'On loan'], ['maintenance', 'Under maintenance']])('shows %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
  it('exposes the rating to assistive tech and fills the right number of pips', () => {
    const { container } = render(<SafetyRating rating={3} />);
    expect(screen.getByRole('img', { name: 'Safety rating 3 out of 5' })).toBeInTheDocument();
    expect(container.querySelectorAll('.rating__pip--on')).toHaveLength(3);
  });
});

describe('FormField', () => {
  it('associates label and input and announces errors', () => {
    render(<FormField label="Email" error="Enter a valid email address" defaultValue="" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address');
    expect(input).toHaveAccessibleDescription('Enter a valid email address');
  });
  it('shows the hint when there is no error', () => {
    render(<FormField label="Password" hint="8+ characters" />);
    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('8+ characters');
  });
});

describe('Pagination', () => {
  it('renders nothing for a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
  it('disables Previous on the first page and calls onChange for Next', async () => {
    const onChange = vi.fn();
    render(<Pagination page={1} totalPages={3} onChange={onChange} />);
    expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Next/ }));
    expect(onChange).toHaveBeenCalledWith(2);
  });
  it('disables Next on the last page', () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled();
  });
});

describe('NavBar', () => {
  it('toggles the mobile menu with correct aria-expanded', async () => {
    render(<MemoryRouter><NavBar><span>slot</span></NavBar></MemoryRouter>);
    const toggle = screen.getByRole('button', { name: 'Open menu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('nav-menu')).toHaveClass('nav__menu--open');
  });
  it('renders links and the injected auth slot', () => {
    render(<MemoryRouter><NavBar><span>slot</span></NavBar></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Browse tools' })).toHaveAttribute('href', '/catalog');
    expect(screen.getByText('slot')).toBeInTheDocument();
  });
  it('marks the current route active', () => {
    render(<MemoryRouter initialEntries={['/catalog']}><NavBar /></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Browse tools' })).toHaveClass('nav__link--active');
  });
});

describe('Reveal', () => {
  it('reveals children once visible', () => {
    render(<Reveal><p>hello</p></Reveal>);
    expect(screen.getByText('hello').parentElement).toHaveClass('reveal--in');
  });
});

describe('state messages', () => {
  it('ErrorState shows the message and a working retry button', async () => {
    const retry = vi.fn();
    render(<ErrorState message="Server down" onRetry={retry} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Server down');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(retry).toHaveBeenCalled();
  });
  it('EmptyState and LoadingGrid render', () => {
    render(<><EmptyState title="Nothing here">Try again</EmptyState><LoadingGrid count={3} /></>);
    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeInTheDocument();
    expect(screen.getByLabelText('Loading tools').children).toHaveLength(3);
  });
});
