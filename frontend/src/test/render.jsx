import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext.jsx';
import { InventoryProvider } from '../context/InventoryContext.jsx';

// Renders UI inside the same provider stack as main.jsx, with a memory router.
export function renderApp(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <InventoryProvider>{ui}</InventoryProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}
