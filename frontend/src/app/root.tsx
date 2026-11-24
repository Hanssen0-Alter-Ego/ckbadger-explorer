import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { Providers } from '@/src/app/providers';
import { createAppRouter } from '@/src/routes/router';
import { appBasePath } from '@/lib/app-base';

const router = createBrowserRouter(createAppRouter(), { basename: appBasePath() || '/' });

export function AppRoot() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}
