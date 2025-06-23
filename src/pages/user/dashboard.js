import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Vote, Clock, CheckCircle, AlertCircle, User, Settings, Bell, Calendar } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../contexts/AuthProvider';
import BallotCard from '../../components/user/BallotCard';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';

const UserDashboard = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in production this would come from your Django backend
    const mockElections = [
      {
        id: 'TEST_ELECTION_1',
        title: 'Test Election 2024',
        description: 'A test election to demonstrate blockchain voting functionality',
        status: 'active',
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        total_candidates: 3,
        has_voted: false
      }
    ];
    
    setElections(mockElections);
    setLoading(false);
  }, []);

  const handleVote = (electionId) => {
    router.push(`/user/vote/${electionId}`);
  };

  const handleVerifyVote = (voteHash) => {
    router.push(`/user/verify/${voteHash}`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'text-success-600 bg-success-50 border-success-200';
      case 'upcoming':
        return 'text-warning-600 bg-warning-50 border-warning-200';
      case 'ended':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <Vote className="h-4 w-4" />;
      case 'upcoming':
        return <Clock className="h-4 w-4" />;
      case 'ended':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredElections = elections.filter(election => {
    if (activeTab === 'active') return election.status === 'active';
    if (activeTab === 'upcoming') return election.status === 'upcoming';
    if (activeTab === 'ended') return election.status === 'ended';
    return true;
  });

  const tabs = [
    { id: 'active', label: 'Active Elections', count: elections.filter(e => e.status === 'active').length },
    { id: 'upcoming', label: 'Upcoming', count: elections.filter(e => e.status === 'upcoming').length },
    { id: 'ended', label: 'Completed', count: elections.filter(e => e.status === 'ended').length },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>User Dashboard - E-Vote System</title>
        <meta name="description" content="Your personal voting dashboard" />
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-8">
          <div className="container-responsive">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {user?.firstName}!
                  </h1>
                  <p className="text-gray-600">
                    Here are your available elections and voting history
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <Link href="/user/profile" className="btn-secondary">
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                  <Link href="/user/settings" className="btn-secondary">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Vote className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Elections</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Votes Cast</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.has_voted).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-warning-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Upcoming</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'upcoming').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-info-100 rounded-lg flex items-center justify-center">
                    <Bell className="h-6 w-6 text-info-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Notifications</p>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                      <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Elections Grid */}
            {filteredElections.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredElections.map((election) => (
                  <BallotCard key={election.id} election={election} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} elections
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'active' && 'There are currently no active elections.'}
                  {activeTab === 'upcoming' && 'No upcoming elections scheduled.'}
                  {activeTab === 'ended' && 'You haven\'t participated in any elections yet.'}
                </p>
              </div>
            )}

            {/* Quick Actions */}
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/user/profile" className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <User className="h-8 w-8 text-primary-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Update Profile</h3>
                      <p className="text-sm text-gray-600">Manage your personal information</p>
                    </div>
                  </div>
                </Link>

                <Link href="/user/voting-history" className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-success-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Voting History</h3>
                      <p className="text-sm text-gray-600">View your past votes</p>
                    </div>
                  </div>
                </Link>

                <Link href="/help" className="card hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    <Bell className="h-8 w-8 text-warning-600 mr-3" />
                    <div>
                      <h3 className="font-medium text-gray-900">Get Help</h3>
                      <p className="text-sm text-gray-600">Support and documentation</p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default UserDashboard; 