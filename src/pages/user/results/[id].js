import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { BarChart3, List, User } from 'lucide-react';
import PageLayout from '../../../components/layout/PageLayout';
import { useAuth } from '../../../contexts/AuthProvider';
import { apiClient } from '../../../lib/api';
import Button from '../../../components/common/Button';
import Card from '../../../components/common/Card';
import ProgressBar from '../../../components/common/ProgressBar';
import { LoadingState } from '../../../components/common/Loading';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const ElectionResults = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [election, setElection] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards');

  useEffect(() => {
    if (id && user) {
      fetchElectionResults();
    }
  }, [id, user]);

  const fetchElectionResults = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.getElectionResults(id);
      setElection(response.election);
      setResults(response.results);
    } catch (err) {
      console.error('Error fetching election results:', err);
      setError('Failed to load election results.');
    } finally {
      setLoading(false);
    }
  };

  const getCandidateImage = (candidate) => {
    // Prioritize uploaded image over URL
    if (candidate.display_image) {
      return candidate.display_image;
    } else if (candidate.image_url) {
      return candidate.image_url;
    }
    return null;
  };

  const getWinner = () => {
    if (!results || !results.candidate_results) return null;
    
    const maxVotes = Math.max(...Object.values(results.candidate_results));
    return Object.entries(results.candidate_results)
      .filter(([_, votes]) => votes === maxVotes)
      .map(([candidateId, _]) => {
        const candidate = election.candidates.find(c => c.id == candidateId);
        return candidate;
      });
  };

  const chartData = {
    labels: election?.candidates?.map(c => c.name) || [],
    datasets: [
      {
        label: 'Votes',
        data: election?.candidates?.map(c => 
          results?.candidate_results?.[c.id] || 0
        ) || [],
        backgroundColor: election?.candidates?.map((c, index) => {
          const votes = results?.candidate_results?.[c.id] || 0;
          const maxVotes = Math.max(...Object.values(results?.candidate_results || {}));
          return votes === maxVotes && votes > 0 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(59, 130, 246, 0.8)';
        }) || [],
        borderColor: election?.candidates?.map((c, index) => {
          const votes = results?.candidate_results?.[c.id] || 0;
          const maxVotes = Math.max(...Object.values(results?.candidate_results || {}));
          return votes === maxVotes && votes > 0 ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)';
        }) || [],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const votes = context.parsed.y;
            const total = results?.total_votes || 0;
            const percentage = total > 0 ? ((votes / total) * 100).toFixed(1) : 0;
            return `${votes} votes (${percentage}%)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <LoadingState isLoading={loading} />
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <Card variant="error">
          <Card.Body>
            <p className="text-error-700">{error}</p>
          </Card.Body>
        </Card>
      </PageLayout>
    );
  }

  if (!election || !results) {
    return (
      <PageLayout>
        <Card variant="error">
          <Card.Body>
            <p className="text-error-700">Election results not found.</p>
          </Card.Body>
        </Card>
      </PageLayout>
    );
  }

  const winners = getWinner();
  const totalVotes = results.total_votes || 0;

  return (
    <PageLayout>
      <Head>
        <title>Election Results - {election.title}</title>
        <meta name="description" content={`Results for ${election.title}`} />
      </Head>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {election.title} - Results
          </h1>
          <p className="text-gray-600">
            Final results for the election held from {new Date(election.start_date).toLocaleDateString()} to {new Date(election.end_date).toLocaleDateString()}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'secondary'}
              size="sm"
              icon={List}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === 'chart' ? 'primary' : 'secondary'}
              size="sm"
              icon={BarChart3}
              onClick={() => setViewMode('chart')}
            >
              Chart
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <Card className="mb-6">
          <Card.Body>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary-600">{totalVotes}</p>
                <p className="text-gray-600">Total Votes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-success-600">{election.candidates?.length || 0}</p>
                <p className="text-gray-600">Candidates</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-warning-600">{winners?.length || 0}</p>
                <p className="text-gray-600">Winner{winners?.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Results Display */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {election.candidates?.map((candidate) => {
              const votes = results.candidate_results?.[candidate.id] || 0;
              const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
              const isWinner = winners?.some(w => w.id === candidate.id);
              
              return (
                <Card
                  key={candidate.id}
                  variant={isWinner ? 'success' : 'default'}
                  className={isWinner ? 'ring-2 ring-success-500' : ''}
                >
                  <Card.Body>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {getCandidateImage(candidate) ? (
                          <img 
                            src={getCandidateImage(candidate)} 
                            alt={candidate.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-full h-full flex items-center justify-center bg-gray-300" style={{ display: getCandidateImage(candidate) ? 'none' : 'flex' }}>
                          <User className="h-8 w-8 text-gray-500" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {candidate.name}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {candidate.party || 'Independent'}
                        </p>
                        {isWinner && (
                          <span className="inline-block mt-1 px-2 py-1 bg-success-100 text-success-800 text-xs font-medium rounded-full">
                            🏆 Winner
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Votes</span>
                          <span className="font-medium">{votes}</span>
                        </div>
                        <ProgressBar 
                          value={votes} 
                          max={totalVotes} 
                          color={isWinner ? 'success' : 'primary'}
                          showValue={false}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          {percentage.toFixed(1)}% of total votes
                        </p>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <Card.Header>
                <Card.Title>Vote Distribution</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="h-80">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </Card.Body>
            </Card>

            {winners && winners.length > 0 && (
              <Card variant="success">
                <Card.Header>
                  <Card.Title>🏆 Winner{winners.length !== 1 ? 's' : ''}</Card.Title>
                </Card.Header>
                <Card.Body>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {winners.map((winner) => (
                      <div key={winner.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {getCandidateImage(winner) ? (
                            <img 
                              src={getCandidateImage(winner)} 
                              alt={winner.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full flex items-center justify-center bg-gray-300" style={{ display: getCandidateImage(winner) ? 'none' : 'flex' }}>
                            <User className="h-6 w-6 text-gray-500" />
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{winner.name}</h4>
                          <p className="text-gray-600 text-sm">{winner.party || 'Independent'}</p>
                          <p className="text-success-600 text-sm font-medium">
                            {results.candidate_results[winner.id]} votes
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card.Body>
              </Card>
            )}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ElectionResults; 