import { BrowserRouter } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { AuthProvider } from './context/AuthContext';
import { PlatformAuthProvider } from './context/PlatformAuthContext';
import { BrandingProvider } from './context/BrandingContext';
import { AppRoutes } from './routes/AppRoutes';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ThemeProvider>
          <BrowserRouter>
            <AuthProvider>
              <PlatformAuthProvider>
                <BrandingProvider>
                  <AppRoutes />
                  <Analytics />
                </BrandingProvider>
              </PlatformAuthProvider>
            </AuthProvider>
          </BrowserRouter>
        </ThemeProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}
