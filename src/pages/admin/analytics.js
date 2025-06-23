import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Download,
  RefreshCw,
  Filter
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthProvider';
import { apiClient } from '../../lib/api';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';
import AnalyticsChart from '../../components/admin/AnalyticsChart';
import toast from 'react-hot-toast';

const AdminAnalyticsPage = () => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState('');
  const [results, setResults] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      loadElections();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (selectedElection) {
      loadElectionResults();
    }
  }, [selectedElection]);

  const loadElections = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.getElections();
      if (response.success) {
        setElections(response.data || []);
        // Auto-select first active election
        const activeElection = response.data?.find((e) => e.status === 'active');
        if (activeElection) {
          setSelectedElection(activeElection.id);
        }
      } else {
        setError('Failed to load elections');
      }
    } catch (err) {
      setError('Failed to load elections');
    } finally {
      setIsLoading(false);
    }
  };

  const loadElectionResults = async () => {
    if (!selectedElection) return;

    try {
      setIsRefreshing(true);
      const response = await apiClient.getElectionResults(selectedElection);
      if (response.success) {
        setResults(response.data);
      } else {
        setError('Failed to load election results');
      }
    } catch (err) {
      setError('Failed to load election results');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadElectionResults();
    toast.success('Results refreshed');
  };

  const handleExportData = () => {
    if (!results) return;

    const data = {
      electionId: selectedElection,
      timestamp: new Date().toISOString(),
      results: results,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `election-results-${selectedElection}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Results exported successfully');
  };

  const getCurrentElection = () => {
    return elections.find(e => e.id === selectedElection);
  };

  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Analytics Dashboard - Admin</title>
      </Head>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-grow py-8">
          <div className="container-responsive">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600">
                  Real-time election results and comprehensive analytics
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="btn-secondary"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={handleExportData}
                  disabled={!results}
                  className="btn-secondary"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-error-50 border border-error-200 rounded-lg">
                <p className="text-error-700">{error}</p>
              </div>
            )}

            {/* Election Selector */}
            <div className="card mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Select Election</h2>
                <Filter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={selectedElection}
                onChange={(e) => setSelectedElection(e.target.value)}
                className="input max-w-md"
              >
                <option value="">Choose an election...</option>
                {elections.map((election) => (
                  <option key={election.id} value={election.id}>
                    {election.title} ({election.status})
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            ) : !selectedElection ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Election Selected</h3>
                <p className="text-gray-600">Please select an election to view analytics.</p>
              </div>
            ) : !results ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading election results...</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Election Info */}
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {getCurrentElection()?.title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary-600">
                        {results.totalVotes}
                      </p>
                      <p className="text-sm text-gray-600">Total Votes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success-600">
                        {results.voterTurnout}%
                      </p>
                      <p className="text-sm text-gray-600">Voter Turnout</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-warning-600">
                        {results.candidates.length}
                      </p>
                      <p className="text-sm text-gray-600">Candidates</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-info-600">
                        {results.leadingCandidate?.votes || 0}
                      </p>
                      <p className="text-sm text-gray-600">Leading Votes</p>
                    </div>
                  </div>
                </div>

                {/* Chart Type Selector */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Chart Type:</span>
                  <div className="flex space-x-2">
                    {['bar', 'pie', 'line'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setChartType(type)}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                          chartType === type
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Results Chart */}
                <AnalyticsChart
                  data={results.candidates.map(candidate => ({
                    name: candidate.name,
                    value: candidate.votes,
                  }))}
                  type={chartType}
                  title="Election Results"
                  height={400}
                />

                {/* Detailed Results Table */}
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Candidate</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Party</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Votes</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-700">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.candidates
                          .sort((a, b) => b.votes - a.votes)
                          .map((candidate, index) => (
                            <tr key={candidate.id} className="border-b border-gray-100">
                              <td className="py-3 px-4">
                                <div className="flex items-center">
                                  <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                                    {index + 1}
                                  </span>
                                  <span className="font-medium text-gray-900">{candidate.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{candidate.party || 'Independent'}</td>
                              <td className="py-3 px-4 text-right font-medium text-gray-900">
                                {candidate.votes.toLocaleString()}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-600">
                                {((candidate.votes / results.totalVotes) * 100).toFixed(1)}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Additional Analytics */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Voting Methods */}
                  <AnalyticsChart
                    data={results.votingMethods?.map(method => ({
                      name: method.name,
                      value: method.count,
                    })) || []}
                    type="pie"
                    title="Voting Methods Used"
                    height={300}
                  />

                  {/* Hourly Activity */}
                  <AnalyticsChart
                    data={results.hourlyActivity?.map(hour => ({
                      name: hour.hour,
                      value: hour.votes,
                    })) || []}
                    type="line"
                    title="Hourly Voting Activity"
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default AdminAnalyticsPage; 