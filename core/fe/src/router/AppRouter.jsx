import { createBrowserRouter, RouterProvider } from 'react-router';
import { ROUTES } from '@/constants';
import { AuthLayout } from '@/layouts/AuthLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForbiddenPage } from '@/pages/errors/ForbiddenPage';
import { NotFoundPage } from '@/pages/errors/NotFoundPage';
import { PermissionRoute } from './PermissionRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { routeRegistry } from './routeRegistry';

const protectedChildren = routeRegistry.map(({ path, element, permission }) => ({
  path,
  element: <PermissionRoute permission={permission}>{element}</PermissionRoute>,
}));

const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.REGISTER, element: <RegisterPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [...protectedChildren, { path: ROUTES.FORBIDDEN, element: <ForbiddenPage /> }],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
