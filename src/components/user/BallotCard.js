import React from 'react';
import Link from 'next/link';
import { Vote, Clock, CheckCircle, AlertCircle, Users, Calendar, Circle, User } from 'lucide-react';

const BallotCard = ({ election }) => {
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

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'upcoming':
        return 'Upcoming';
      case 'ended':
        return 'Ended';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getVoteButton = () => {
    if (election.status === 'active' && !election.hasVoted) {
      return (
        <Link href={`/user/vote/${election.id}`} className="btn-primary w-full">
          <Vote className="h-4 w-4 mr-2" />
          Vote Now
        </Link>
      );
    } else if (election.status === 'active' && election.hasVoted) {
      return (
        <div className="flex items-center justify-center text-success-600 bg-success-50 px-4 py-2 rounded-lg">
          <CheckCircle className="h-4 w-4 mr-2" />
          Voted
        </div>
      );
    } else if (election.status === 'upcoming') {
      return (
        <button className="btn-secondary w-full" disabled>
          <Clock className="h-4 w-4 mr-2" />
          Coming Soon
        </button>
      );
    } else if (election.status === 'ended') {
      return (
        <Link href={`/user/results/${election.id}`} className="btn-secondary w-full">
          <CheckCircle className="h-4 w-4 mr-2" />
          View Results
        </Link>
      );
    }
  };

  return (
    <div className="card hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {election.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {election.description}
          </p>
        </div>
        <div className={`ml-4 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(election.status)}`}>
          <div className="flex items-center">
            {getStatusIcon(election.status)}
            <span className="ml-1">{getStatusText(election.status)}</span>
          </div>
        </div>
      </div>

      {/* Election Details */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span>
            {formatDate(election.startDate)} - {formatDate(election.endDate)}
          </span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Users className="h-4 w-4 mr-2" />
          <span>{election.totalCandidates} candidates</span>
        </div>

        <div className="flex items-center text-sm text-gray-600">
          <Vote className="h-4 w-4 mr-2" />
          <span className="capitalize">{election.type} choice</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
        <p className="text-sm text-gray-700">
          <strong>Instructions:</strong> {election.instructions}
        </p>
      </div>

      {/* Action Button */}
      <div className="mt-auto">
        {getVoteButton()}
      </div>

      {/* Additional Info */}
      {election.hasVoted && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Your vote status:</span>
            <span className="text-success-600 font-medium">✓ Submitted</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BallotCard; 