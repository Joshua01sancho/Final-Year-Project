import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthProvider';
import { ElectionProvider } from '../contexts/ElectionProvider';
import { AccessibilityProvider } from '../contexts/AccessibilityProvider';
import { LanguageProvider } from '../contexts/LanguageProvider';
import RoleSwitcher from '../components/common/RoleSwitcher';
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
              <Component {...pageProps} />
              <RoleSwitcher />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#22c55e',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </ElectionProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
} 