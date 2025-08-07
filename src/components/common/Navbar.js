import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X, Shield, User, Settings, LogOut, Bell, Globe, Accessibility, Search, ChevronDown, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { useLanguage } from '../../contexts/LanguageProvider';
import { useAccessibility } from '../../contexts/AccessibilityProvider';
import Button from './Button';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { user, logout } = useAuth();
  const { currentLanguage, setLanguage, languages } = useLanguage();
  const { settings, updateSettings } = useAccessibility();

  // Handle scroll effect for sticky navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Help', href: '/help' },
  ];

  const userNavigation = [
    { name: 'Profile', href: '/user/profile', icon: User },
    { name: 'Settings', href: '/user/settings', icon: Settings },
    { name: 'Notifications', href: '/user/notifications', icon: Bell },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin/dashboard' },
    { name: 'Elections', href: '/admin/elections' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Users', href: '/admin/users' },
  ];

  const isActive = (href) => router.pathname === href;

  // Safe access to currentLanguage with fallback
  const currentLangCode = currentLanguage?.code || 'EN';
  const availableLanguages = languages || [];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white shadow-sm border-b border-gray-200'
      }`}
    >
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gradient group-hover:scale-105 transition-transform duration-300">
                E-Vote
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`relative text-sm font-semibold transition-all duration-200 ${
                  isActive(item.href)
                    ? 'text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {item.name}
                {isActive(item.href) && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Right side items */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button
              variant="ghost"
              size="sm"
              icon={Search}
              className="hidden sm:flex"
              title="Search"
            />

            {/* Language Selector */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                icon={Globe}
                iconPosition="left"
                onClick={() => {
                  if (setLanguage && availableLanguages.length > 1) {
                    const currentIndex = availableLanguages.findIndex(lang => lang.code === currentLangCode);
                    const nextIndex = (currentIndex + 1) % availableLanguages.length;
                    setLanguage(availableLanguages[nextIndex].code);
                  }
                }}
                disabled={!setLanguage || availableLanguages.length <= 1}
                className="hidden sm:flex"
              >
                {currentLangCode.toUpperCase()}
              </Button>
            </div>

            {/* Accessibility Toggle */}
            <Button
              variant="ghost"
              size="sm"
              icon={Accessibility}
              onClick={() => {
                if (updateSettings && settings) {
                  updateSettings({ ...settings, highContrast: !settings.highContrast });
                }
              }}
              title="Accessibility Settings"
              disabled={!updateSettings || !settings}
              className="hidden sm:flex"
            />

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              icon={Bell}
              className="relative hidden sm:flex"
              title="Notifications"
            >
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-error-500 rounded-full text-xs text-white flex items-center justify-center animate-pulse">
                3
              </span>
            </Button>

            {/* User Menu */}
            {user ? (
              <>
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={User}
                    iconPosition="left"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="hidden sm:flex"
                  >
                    <span className="hidden sm:block">{user.firstName}</span>
                    <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                  </Button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl py-2 z-50 border border-gray-200 animate-in slide-in-from-top-2">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                        <p className="text-xs text-gray-500 capitalize mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-warning-100 text-warning-800' 
                              : 'bg-primary-100 text-primary-800'
                          }`}>
                            {user.role}
                          </span>
                        </p>
                      </div>
                      
                      <div className="py-1">
                        {userNavigation.map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4 mr-3 text-gray-400" />
                              {item.name}
                            </Link>
                          );
                        })}
                      </div>
                      
                      {user.role === 'admin' && (
                        <div className="border-t border-gray-100 py-1">
                          <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Admin
                          </p>
                          {adminNavigation.map((item) => (
                            <Link
                              key={item.name}
                              href={item.href}
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              {item.name}
                            </Link>
                          ))}
                        </div>
                      )}
                      
                      <div className="border-t border-gray-100 py-1">
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                        >
                          <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  href="/auth/login"
                  variant="ghost"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  href="/auth/signup"
                  variant="primary"
                  icon={UserPlus}
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              icon={isMenuOpen ? X : Menu}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden"
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 animate-in slide-in-from-top-2">
            <div className="space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-600 border-l-4 border-primary-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-2">
                    <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {userNavigation.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Icon className="h-4 w-4 mr-3 text-gray-400" />
                        {item.name}
                      </Link>
                    );
                  })}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-150"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 