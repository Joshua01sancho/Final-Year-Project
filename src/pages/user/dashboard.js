import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Vote, Clock, CheckCircle, AlertCircle, User, Settings, Bell, Calendar, RefreshCw, TrendingUp, Users, Award } from 'lucide-react';
import PageLayout from '../../components/layout/PageLayout';
import { useAuth } from '../../contexts/AuthProvider';
import BallotCard from '../../components/user/BallotCard';
import { useRouter } from 'next/router';
import { apiClient } from '../../lib/api';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import { LoadingState, SkeletonCard } from '../../components/common/Loading';
import DashboardStats from '../../components/user/DashboardStats';

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
    if (user) {
      fetchElections();
    }
  }, [user]);

  // Filter elections based on active tab
  const filteredElections = elections.filter((election) => {
    switch (activeTab) {
      case 'active':
        return election.status === 'active';
      case 'upcoming':
        return election.status === 'upcoming';
      case 'ended':
        return election.status === 'ended';
      default:
        return true;
    }
  });

  // Calculate statistics
  const stats = {
    total: elections.length,
    active: elections.filter(e => e.status === 'active').length,
    upcoming: elections.filter(e => e.status === 'upcoming').length,
    ended: elections.filter(e => e.status === 'ended').length,
    voted: elections.filter(e => e.has_voted).length
  };

  const tabs = [
    { id: 'active', label: 'Active', count: stats.active },
    { id: 'upcoming', label: 'Upcoming', count: stats.upcoming },
    { id: 'ended', label: 'Ended', count: stats.ended },
  ];

  const handleVote = (electionId) => {
    router.push(`/user/vote/${electionId}`);
  };

  const handleVerifyVote = (electionId) => {
    router.push(`/user/verify/${electionId}`);
  };

  const displayName = user?.firstName || user?.username || 'User';

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card variant="error" className="max-w-md">
          <Card.Header>
            <Card.Title>Authentication Error</Card.Title>
          </Card.Header>
          <Card.Body>
            <p className="text-error-700">{authError}</p>
          </Card.Body>
        </Card>
      </div>
    );
  }

  return (
    <PageLayout>
      <Head>
        <title>User Dashboard - E-Vote System</title>
        <meta name="description" content="Your personal voting dashboard" />
      </Head>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gradient mb-2">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xl text-gray-600">
              Here are your available elections and voting history
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={refreshElections}
              disabled={refreshing}
              variant="secondary"
              icon={RefreshCw}
              loading={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              href="/user/profile"
              variant="outline"
              icon={User}
            >
              Profile
            </Button>
            <Button
              href="/user/settings"
              variant="outline"
              icon={Settings}
            >
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <DashboardStats stats={stats} loading={loading} />

      {error && (
        <Card variant="error" className="mb-6">
          <Card.Body>
            <p className="text-error-700">{error}</p>
          </Card.Body>
        </Card>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                <span className={`ml-2 py-1 px-2.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Elections Grid */}
      <LoadingState 
        isLoading={loading}
        fallback={
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        }
      >
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
          <Card className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Vote className="h-12 w-12 text-gray-400" />
            </div>
            <Card.Title className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab} elections
            </Card.Title>
            <Card.Subtitle className="text-gray-500">
              {activeTab === 'active' && 'There are currently no active elections.'}
              {activeTab === 'upcoming' && 'No upcoming elections scheduled.'}
              {activeTab === 'ended' && 'No completed elections yet.'}
            </Card.Subtitle>
          </Card>
        )}
      </LoadingState>
    </PageLayout>
  );
};

export default UserDashboard; 