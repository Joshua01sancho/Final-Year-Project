import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { UserPlus, Camera, CheckCircle, XCircle, Shield } from 'lucide-react';
import FaceRegistration from '../../components/auth/FaceRegistration';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import apiClient from '../../lib/api';
import PageLayout from '../../components/layout/PageLayout';

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
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess(false);
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.signupWithCredentials(formData);
      console.log('Signup response:', response);
      setSuccess(true);
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: ''
      });
    } catch (err) {
      console.log('Signup error:', err);
      setErrors(err.response?.data || { general: 'Signup failed' });
    }
    setLoading(false);
  };

  return (
    <PageLayout>
      <Head>
        <title>Sign Up | E-Vote</title>
      </Head>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <form onSubmit={handleSubmit} className="w-full max-w-md p-8 bg-white rounded shadow">
          <h2 className="mb-6 text-2xl font-bold text-center">Sign Up</h2>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">First Name</label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Last Name</label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Username</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Email</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Password</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-semibold">Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full px-3 py-2 border rounded" required />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>
          {errors.general && <p className="text-red-500 text-sm mb-2">{errors.general}</p>}
          {success && <p className="text-green-600 text-sm mb-2">Signup successful! You can now <Link href="/auth/login" className="underline">login</Link>.</p>}
          <button type="submit" className="w-full py-2 mt-2 font-semibold text-white bg-blue-600 rounded hover:bg-blue-700" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-center">
          Already have an account? <Link href="/auth/login" className="text-blue-600 underline">Login</Link>
        </div>
      </div>
      <Footer />
    </PageLayout>
  );
};

export default SignupPage; 