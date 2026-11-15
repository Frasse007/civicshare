import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ToolDetailPage from './pages/ToolDetailPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Route table. Layout renders the shared header/footer around each page via <Outlet/>.
// * path handles any 404 errors
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="catalog" element={<CatalogPage />} />
        <Route path="tools/:id" element={<ToolDetailPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}