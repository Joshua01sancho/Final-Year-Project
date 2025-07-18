import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Vote, Clock, CheckCircle, AlertCircle, User, Settings, Bell, Calendar, RefreshCw } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../contexts/AuthProvider';
import BallotCard from '../../components/user/BallotCard';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';

const UserDashboard = () => {
  const router = useRouter();
  const { user, jwtDebug, authError } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchElections = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.getElections();
      console.log('API Response:', res);
      // Handle both response formats: {elections: [...]} and {results: [...]}
      const electionsData = res.elections || res.results || [];
      console.log('Elections data:', electionsData);
      setElections(electionsData);
    } catch (err) {
      console.error('Error fetching elections:', err);
      setError('Failed to load elections.');
    } finally {
      setLoading(false);
    }
  };

  const refreshElections = async () => {
    setRefreshing(true);
    try {
      const res = await apiClient.getElections();
      // Handle both response formats: {elections: [...]} and {results: [...]}
      const electionsData = res.elections || res.results || [];
      setElections(electionsData);
    } catch (err) {
      setError('Failed to refresh elections.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchElections();
  }, []);

  // Refresh data when returning to dashboard (e.g., after voting)
  useEffect(() => {
    const handleRouteChange = () => {
      if (router.asPath === '/user/dashboard') {
        fetchElections();
      }
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

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
    if (activeTab === 'votes') return election.has_voted;
    return true;
  });

  const tabs = [
    { id: 'active', label: 'Active Elections', count: elections.filter(e => e.status === 'active').length },
    { id: 'upcoming', label: 'Upcoming', count: elections.filter(e => e.status === 'upcoming').length },
    { id: 'ended', label: 'Completed', count: elections.filter(e => e.status === 'ended').length },
  ];

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Invalid Date';
    const d = new Date(dateStr);
    if (isNaN(d)) return 'Invalid Date';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Fix welcome message to use correct user field
  const displayName = user?.username || 'Voter';

  // DEBUG: Print raw election data
  console.log('Elections data:', elections);

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
      {authError && (
        <div style={{ background: '#fee', color: '#900', padding: '1em', marginBottom: '1em', textAlign: 'center', fontWeight: 'bold' }}>
          {authError}
        </div>
      )}
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
                    Welcome back, {displayName}!
                  </h1>
                  <p className="text-gray-600">
                    Here are your available elections and voting history
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={refreshElections}
                    disabled={refreshing}
                    className="btn-secondary flex items-center"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
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
              <button
                className={`card text-left transition-shadow ${activeTab === 'active' ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
                onClick={() => setActiveTab('active')}
                style={{ cursor: 'pointer' }}
                aria-label="Show Active Elections"
              >
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
              </button>

              <button
                className={`card text-left transition-shadow ${activeTab === 'votes' ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
                onClick={() => setActiveTab('votes')}
                style={{ cursor: 'pointer' }}
                aria-label="Show Votes Cast"
              >
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
              </button>

              <button
                className={`card text-left transition-shadow ${activeTab === 'upcoming' ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
                onClick={() => setActiveTab('upcoming')}
                style={{ cursor: 'pointer' }}
                aria-label="Show Upcoming Elections"
              >
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
              </button>

              <button
                className={`card text-left transition-shadow ${activeTab === 'ended' ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}
                onClick={() => setActiveTab('ended')}
                style={{ cursor: 'pointer' }}
                aria-label="Show Completed Elections"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {elections.filter(e => e.status === 'ended').length}
                    </p>
                  </div>
                </div>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{error}</p>
              </div>
            )}

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredElections.map((election) => (
                  <BallotCard
                    key={election.id}
                    election={election}
                    onVote={handleVote}
                    onVerifyVote={handleVerifyVote}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Vote className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {activeTab} elections
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'active' && 'There are currently no active elections.'}
                  {activeTab === 'upcoming' && 'No upcoming elections scheduled.'}
                  {activeTab === 'ended' && 'No completed elections yet.'}
                </p>
              </div>
            )}
          </div>
        </main>
        
        <Footer />
      </div>
    </>
  );
};

export default UserDashboard; 