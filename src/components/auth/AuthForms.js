import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Phone, Calendar, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { Input, Select, Checkbox, Form, FormGroup, FormActions } from '../common/Form';
import Button from '../common/Button';
import Card from '../common/Card';
import { AlertModal } from '../common/Modal';

const LoginForm = ({ onSubmit, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setShowSuccess(true);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card variant="featured">
        <Card.Header className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <Card.Title className="text-2xl">Welcome Back</Card.Title>
          <Card.Subtitle>Sign in to your account to continue</Card.Subtitle>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <FormGroup>
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Enter your email"
                error={errors.email}
                icon={<Mail className="h-4 w-4" />}
                required
              />
              
              <Input
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                error={errors.password}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              
              <div className="flex items-center justify-between">
                <Checkbox
                  label="Remember me"
                  checked={formData.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                />
                <Button
                  variant="link"
                  href="/auth/forgot-password"
                  className="text-sm"
                >
                  Forgot password?
                </Button>
              </div>
            </FormGroup>
            
            <FormActions>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </FormActions>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Button variant="link" href="/auth/signup">
                Sign up here
              </Button>
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Login Successful"
        message="Welcome back! You have been successfully signed in."
        type="success"
      />
    </div>
  );
};

const SignupForm = ({ onSubmit, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    receiveUpdates: false
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setShowSuccess(true);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const passwordStrength = () => {
    const password = formData.password;
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['error', 'warning', 'warning', 'success', 'success'];
    
    return {
      score: Math.min(score, 4),
      label: labels[score - 1] || '',
      color: colors[score - 1] || ''
    };
  };

  const strength = passwordStrength();

  return (
    <div className="max-w-2xl mx-auto">
      <Card variant="featured">
        <Card.Header className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-400 to-success-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <Card.Title className="text-2xl">Create Your Account</Card.Title>
          <Card.Subtitle>Join the secure voting platform</Card.Subtitle>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  error={errors.firstName}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  error={errors.lastName}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  error={errors.email}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  error={errors.phone}
                  icon={<Phone className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  error={errors.dateOfBirth}
                  icon={<Calendar className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder="Create a strong password"
                  error={errors.password}
                  icon={<Lock className="h-4 w-4" />}
                  required
                />
                
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Password strength:</span>
                      <span className={`font-medium text-${strength.color}-600`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 bg-${strength.color}-500`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </FormGroup>
            </div>
            
            <FormGroup>
              <Input
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
                icon={<Lock className="h-4 w-4" />}
                required
              />
              
              <div className="space-y-3">
                <Checkbox
                  label="I agree to the Terms and Conditions and Privacy Policy"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleChange('agreeToTerms', e.target.checked)}
                  error={errors.agreeToTerms}
                  required
                />
                
                <Checkbox
                  label="I would like to receive updates about elections and voting"
                  checked={formData.receiveUpdates}
                  onChange={(e) => handleChange('receiveUpdates', e.target.checked)}
                />
              </div>
            </FormGroup>
            
            <FormActions>
              <Button
                type="submit"
                variant="success"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </FormActions>
          </Form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Button variant="link" href="/auth/login">
                Sign in here
              </Button>
            </p>
          </div>
        </Card.Body>
      </Card>

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Account Created Successfully"
        message="Welcome! Your account has been created. Please check your email to verify your account."
        type="success"
      />
    </div>
  );
};

const ProfileForm = ({ user, onSubmit, loading = false, error = null }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    dateOfBirth: user?.dateOfBirth || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    receiveNotifications: user?.receiveNotifications || true
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required to change password';
    }
    
    if (formData.newPassword && formData.newPassword.length < 8) {
      newErrors.newPassword = 'New password must be at least 8 characters';
    }
    
    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
      setShowSuccess(true);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card variant="featured">
        <Card.Header className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-white" />
          </div>
          <Card.Title className="text-2xl">Profile Settings</Card.Title>
          <Card.Subtitle>Update your personal information and preferences</Card.Subtitle>
        </Card.Header>
        
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormGroup>
                <Input
                  label="First Name"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  placeholder="Enter your first name"
                  error={errors.firstName}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Last Name"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  placeholder="Enter your last name"
                  error={errors.lastName}
                  icon={<User className="h-4 w-4" />}
                  required
                />
                
                <Input
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Enter your email"
                  error={errors.email}
                  icon={<Mail className="h-4 w-4" />}
                  required
                />
              </FormGroup>
              
              <FormGroup>
                <Input
                  label="Phone Number"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Enter your phone number"
                  error={errors.phone}
                  icon={<Phone className="h-4 w-4" />}
                />
                
                <Input
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                  error={errors.dateOfBirth}
                  icon={<Calendar className="h-4 w-4" />}
                />
                
                <Checkbox
                  label="Receive email notifications about elections"
                  checked={formData.receiveNotifications}
                  onChange={(e) => handleChange('receiveNotifications', e.target.checked)}
                />
              </FormGroup>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Current Password"
                  type="password"
                  value={formData.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  placeholder="Enter current password"
                  error={errors.currentPassword}
                  icon={<Lock className="h-4 w-4" />}
                />
                
                <Input
                  label="New Password"
                  type="password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  placeholder="Enter new password"
                  error={errors.newPassword}
                  icon={<Lock className="h-4 w-4" />}
                />
                
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                  error={errors.confirmPassword}
                  icon={<Lock className="h-4 w-4" />}
                />
              </div>
            </div>
            
            <FormActions>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </Button>
            </FormActions>
          </Form>
        </Card.Body>
      </Card>

      {/* Success Modal */}
      <AlertModal
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Profile Updated"
        message="Your profile has been successfully updated."
        type="success"
      />
    </div>
  );
};

export { LoginForm, SignupForm, ProfileForm }; 