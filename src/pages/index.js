import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Shield, Lock, Users, BarChart3, ArrowRight, Vote, Settings } from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../contexts/AuthProvider';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
      <Head>
        <title>E-Vote - Secure Electronic Voting System</title>
        <meta name="description" content="Secure, transparent, and accessible electronic voting system with blockchain technology and biometric authentication." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-primary-50 to-primary-100 py-20">
            <div className="container-responsive text-center">
              <div className="max-w-4xl mx-auto">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
                    <Shield className="h-10 w-10 text-white" />
                  </div>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
                  Secure E-Voting
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                  Experience the future of democracy with our secure, transparent, and accessible 
                  electronic voting system powered by blockchain technology and biometric authentication.
                </p>
                
                {isAuthenticated ? (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {user?.role === 'voter' ? (
                      <>
                        <Link href="/user/dashboard" className="btn-primary text-lg px-8 py-3">
                          <Vote className="h-5 w-5 mr-2" />
                          View Elections
                        </Link>
                        <Link href="/user/profile" className="btn-secondary text-lg px-8 py-3">
                          My Profile
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link href="/admin/dashboard" className="btn-primary text-lg px-8 py-3">
                          <Settings className="h-5 w-5 mr-2" />
                          Admin Dashboard
                        </Link>
                        <Link href="/admin/elections" className="btn-secondary text-lg px-8 py-3">
                          Manage Elections
                        </Link>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3">
                      Create Account
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Link>
                    <Link href="/auth/login" className="btn-secondary text-lg px-8 py-3">
                      Sign In
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="py-20">
            <div className="container-responsive">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Why Choose E-Vote?
                </h2>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                  Our platform combines cutting-edge technology with user-friendly design 
                  to ensure secure and accessible voting for everyone.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="card text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Secure & Transparent
                  </h3>
                  <p className="text-gray-600">
                    Blockchain technology ensures vote integrity and transparency. 
                    Every vote is encrypted and verifiable without compromising privacy.
                  </p>
                </div>

                <div className="card text-center">
                  <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-success-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Biometric Authentication
                  </h3>
                  <p className="text-gray-600">
                    Advanced facial recognition and fingerprint scanning ensure 
                    secure voter identity verification and prevent fraud.
                  </p>
                </div>

                <div className="card text-center">
                  <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-warning-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    Real-time Analytics
                  </h3>
                  <p className="text-gray-600">
                    Live election results and comprehensive analytics provide 
                    instant insights into voting patterns and turnout.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gray-900 text-white py-20">
            <div className="container-responsive text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Vote?
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Join thousands of voters who trust our secure platform for their democratic rights.
              </p>
              {isAuthenticated ? (
                <Link href={user?.role === 'voter' ? '/user/dashboard' : '/admin/dashboard'} className="btn-primary text-lg px-8 py-3 bg-white text-gray-900 hover:bg-gray-100">
                  {user?.role === 'voter' ? 'View Elections' : 'Admin Dashboard'}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              ) : (
                <Link href="/auth/signup" className="btn-primary text-lg px-8 py-3 bg-white text-gray-900 hover:bg-gray-100">
                  Create Your Account
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              )}
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default HomePage; 