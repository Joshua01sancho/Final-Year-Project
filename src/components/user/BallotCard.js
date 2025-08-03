import React from 'react';
import Link from 'next/link';
import { Vote, Clock, CheckCircle, AlertCircle, User, Award, TrendingUp } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import CountdownTimer from '../common/CountdownTimer';
import ProgressBar from '../common/ProgressBar';

const BallotCard = ({ election, onVote, onVerifyVote }) => {
  const getStatusConfig = (status) => {
    const configs = {
      active: {
        color: 'success',
        icon: TrendingUp,
        text: 'Active Now',
        badgeClass: 'badge-success animate-pulse'
      },
      upcoming: {
        color: 'warning',
        icon: Clock,
        text: 'Upcoming',
        badgeClass: 'badge-warning animate-bounce-slow'
      },
      ended: {
        color: 'error',
        icon: AlertCircle,
        text: 'Ended',
        badgeClass: 'badge-error'
      },
      paused: {
        color: 'warning',
        icon: Clock,
        text: 'Paused',
        badgeClass: 'badge-warning'
      }
    };
    return configs[status] || configs.upcoming;
  };

  const statusConfig = getStatusConfig(election.status);
  const Icon = statusConfig.icon;
  const participation = election.total_voters > 0 
    ? (election.total_votes / election.total_voters) * 100 
    : 0;

  const getCandidateImage = (candidate) => {
    // Prioritize uploaded image over URL
    if (candidate.display_image) {
      return candidate.display_image;
    } else if (candidate.image_url) {
      return candidate.image_url;
    }
    // Return a placeholder image or null
    return null;
  };

  return (
    <Card variant="interactive" className="hover:shadow-lg transition-all duration-300">
      <Card.Header>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Card.Title className="text-xl font-bold text-gray-900 mb-2">
              {election.title}
            </Card.Title>
            <Card.Subtitle className="text-gray-600 mb-3">
              {election.description}
            </Card.Subtitle>
            
            <div className="flex items-center space-x-2 mb-3">
              <span className={`badge ${statusConfig.badgeClass}`}>
                <Icon className="h-3 w-3 mr-1" />
                {statusConfig.text}
              </span>
              {election.has_voted && (
                <span className="badge badge-success">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Voted
                </span>
              )}
            </div>
          </div>
        </div>
      </Card.Header>

      <Card.Body>
        <div className="space-y-4">
          {/* Election Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Start Date</p>
              <p className="font-medium">{new Date(election.start_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-gray-500">End Date</p>
              <p className="font-medium">{new Date(election.end_date).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Countdown Timer */}
          {election.status === 'upcoming' && (
            <div className="bg-warning-50 p-3 rounded-lg">
              <p className="text-warning-700 text-sm font-medium mb-1">Starts in:</p>
              <CountdownTimer targetTime={election.start_date} />
            </div>
          )}

          {election.status === 'active' && (
            <div className="bg-success-50 p-3 rounded-lg">
              <p className="text-success-700 text-sm font-medium mb-1">Ends in:</p>
              <CountdownTimer targetTime={election.end_date} />
            </div>
          )}

          {/* Participation Progress */}
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Participation</span>
              <span className="font-medium">{Math.round(participation)}%</span>
            </div>
            <ProgressBar 
              value={election.total_votes} 
              max={election.total_voters} 
              color="primary"
              showValue={false}
            />
            <p className="text-xs text-gray-500 mt-1">
              {election.total_votes} of {election.total_voters} votes cast
            </p>
          </div>

          {/* Candidates Preview */}
          {election.candidates && election.candidates.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Candidates ({election.candidates.length})</h4>
              <div className="grid grid-cols-2 gap-3">
                {election.candidates.slice(0, 4).map((candidate) => (
                  <div key={candidate.id} className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
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
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {candidate.name}
                      </p>
                      {candidate.party && (
                        <p className="text-xs text-gray-500 truncate">
                          {candidate.party}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {election.candidates.length > 4 && (
                  <div className="flex items-center justify-center text-xs text-gray-500">
                    +{election.candidates.length - 4} more
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <h5 className="font-medium text-gray-900 mb-1">Instructions</h5>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• You can only vote once per election</li>
              <li>• Your vote is encrypted and secure</li>
              <li>• Results will be available after the election ends</li>
            </ul>
          </div>
        </div>
      </Card.Body>

      <Card.Footer>
        <div className="flex items-center justify-between">
          {election.has_voted ? (
            <div className="flex items-center space-x-2 text-success-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Vote Submitted</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              {election.status === 'active' ? 'Ready to vote' : 'Not yet available'}
            </div>
          )}
          
          <div className="flex space-x-2">
            {election.has_voted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onVerifyVote && onVerifyVote(election.id)}
              >
                Verify Vote
              </Button>
            )}
            
            {election.status === 'active' && !election.has_voted && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onVote && onVote(election.id)}
              >
                Vote Now
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              href={election.status === 'ended' ? `/user/results/${election.id}` : `/user/vote/${election.id}`}
            >
              {election.status === 'ended' ? 'View Results' : 'View Details'}
            </Button>
          </div>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default BallotCard; 