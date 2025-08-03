import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Camera, Fingerprint, Smartphone, CheckCircle } from 'lucide-react';
import FaceLogin from '../../components/auth/FaceLogin';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuth } from '../../contexts/AuthProvider';
import PageLayout from '../../components/layout/PageLayout';

const LoginPage = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await api.loginWithCredentials(formData.username, formData.password);
      console.log('Login API response:', data);
      // Use Auth context to update state - fix the response structure
      login(data.user, data.access);
      // localStorage.setItem('auth_token', data.access); // Redundant, handled by AuthProvider
      console.log('Token stored in localStorage:', localStorage.getItem('auth_token'));
      window.location.href = '/user/dashboard';
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <Head>
        <title>Login - E-Vote System</title>
        <meta name="description" content="Secure login to the E-Vote system using biometric authentication" />
      </Head>

      <main className="flex-grow flex items-center justify-center py-12">
        <div className="container-responsive">
          <div className="max-w-md mx-auto card">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            {error && <div className="mb-4 text-error-600">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="input" required />
              </div>
              <button type="submit" className="w-full btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Logging in...' : 'Login'}</button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/auth/signup" className="text-primary-600 hover:text-primary-700 font-medium">Don't have an account? Sign up</Link>
            </div>
          </div>
        </div>
      </main>
    </PageLayout>
  );
};

export default LoginPage; 