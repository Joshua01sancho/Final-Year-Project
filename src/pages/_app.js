import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthProvider';
import { ElectionProvider } from '../contexts/ElectionProvider';
import { AccessibilityProvider } from '../contexts/AccessibilityProvider';
import { LanguageProvider } from '../contexts/LanguageProvider';
import '../styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <ElectionProvider>
              <div className="min-h-screen flex flex-col">
                <Component {...pageProps} />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#22c55e',
                        secondary: '#fff',
                      },
                      style: {
                        background: '#f0fdf4',
                        color: '#166534',
                        border: '1px solid #bbf7d0',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fff',
                      },
                      style: {
                        background: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fecaca',
                      },
                    },
                  }}
                />
              </div>
            </ElectionProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
} 