import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UserPlus, Camera, CheckCircle, XCircle, Shield } from 'lucide-react';
import FaceRegistration from '../../components/auth/FaceRegistration';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import api from '../../lib/api';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username.trim()) newErrors.username = 'Username is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const data = await api.signupWithCredentials(formData);
      setSuccess(true);
    } catch (err) {
      // Try to extract detailed error message from backend
      let errorMsg = 'Registration failed.';
      if (err.response?.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.error) {
          errorMsg = err.response.data.error;
        } else if (Array.isArray(err.response.data)) {
          errorMsg = err.response.data.join(', ');
        } else {
          // Try to join all error values
          errorMsg = Object.values(err.response.data).flat().join(', ');
        }
      }
      setErrors({ general: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-12">
          <div className="container-responsive">
            <div className="max-w-md mx-auto card text-center">
              <h1 className="text-2xl font-bold mb-4">Registration Successful!</h1>
              <p className="mb-8">Your account has been created. You can now login with your username and password.</p>
              <Link href="/auth/login" className="w-full btn-primary">Login</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-12">
        <div className="container-responsive">
          <div className="max-w-md mx-auto card">
            <h1 className="text-2xl font-bold mb-4">Sign Up</h1>
            {errors.general && <div className="mb-4 text-error-600">{errors.general}</div>}
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-1">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-1">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-1">Username</label>
                <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} className="input" required />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm Password</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} className="input" required />
              </div>
              <button type="submit" className="w-full btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Signing up...' : 'Sign Up'}</button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">Already have an account? Login</Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SignupPage; 