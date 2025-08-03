import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Vote, Shield, Clock, User, Check, X } from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import { ConfirmModal } from '../common/Modal';
import { ProgressBar } from '../common/Loading';

const VotingStep = ({ step, currentStep, title, description, icon: Icon, children }) => {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  return (
    <div className={`flex items-start space-x-4 p-4 rounded-lg border-2 transition-all duration-300 ${
      isActive 
        ? 'border-primary-500 bg-primary-50' 
        : isCompleted 
          ? 'border-success-500 bg-success-50' 
          : 'border-gray-200 bg-gray-50'
    }`}>
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
        isActive 
          ? 'bg-primary-600 text-white' 
          : isCompleted 
            ? 'bg-success-600 text-white' 
            : 'bg-gray-300 text-gray-600'
      }`}>
        {isCompleted ? (
          <Check className="h-5 w-5" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-semibold ${
          isActive ? 'text-primary-900' : isCompleted ? 'text-success-900' : 'text-gray-700'
        }`}>
          {title}
        </h3>
        <p className={`text-sm mt-1 ${
          isActive ? 'text-primary-700' : isCompleted ? 'text-success-700' : 'text-gray-600'
        }`}>
          {description}
        </p>
        {isActive && children}
      </div>
    </div>
  );
};

const CandidateCard = ({ candidate, selected, onSelect, disabled = false }) => {
  const getCandidateImage = (candidate) => {
    // Prioritize uploaded image over URL
    if (candidate.display_image) {
      return candidate.display_image;
    } else if (candidate.image_url) {
      return candidate.image_url;
    }
    return null;
  };

  return (
    <Card
      variant={selected ? 'success' : 'default'}
      className={`cursor-pointer transition-all duration-300 ${
        selected ? 'ring-2 ring-success-500 scale-105' : 'hover:scale-102'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={() => !disabled && onSelect(candidate.id)}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
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
            <div className="w-full h-full flex items-center justify-center" style={{ display: getCandidateImage(candidate) ? 'none' : 'flex' }}>
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-gray-900">
            {candidate.name}
          </h3>
          <p className="text-gray-600 text-sm">
            {candidate.party || 'Independent'}
          </p>
          {candidate.description && (
            <p className="text-gray-500 text-sm mt-1">
              {candidate.description}
            </p>
          )}
        </div>
        {selected && (
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-success-600 flex items-center justify-center">
              <Check className="h-4 w-4 text-white" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

const VotingInterface = ({ 
  election, 
  onVote, 
  onCancel, 
  loading = false,
  error = null 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [voteConfirmed, setVoteConfirmed] = useState(false);

  const steps = [
    {
      step: 1,
      title: 'Election Information',
      description: 'Review the election details and your eligibility',
      icon: Vote
    },
    {
      step: 2,
      title: 'Select Candidate',
      description: 'Choose your preferred candidate',
      icon: User
    },
    {
      step: 3,
      title: 'Confirm Vote',
      description: 'Review and confirm your selection',
      icon: Shield
    },
    {
      step: 4,
      title: 'Vote Submitted',
      description: 'Your vote has been recorded successfully',
      icon: CheckCircle
    }
  ];

  const handleCandidateSelect = (candidateId) => {
    setSelectedCandidate(election.candidates.find(c => c.id === candidateId));
  };

  const handleNext = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2 && selectedCandidate) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setShowConfirmation(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleConfirmVote = () => {
    setShowConfirmation(false);
    setVoteConfirmed(true);
    setCurrentStep(4);
    onVote(selectedCandidate.id);
  };

  const handleCancel = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onCancel();
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / steps.length) * 100;
  };

  if (voteConfirmed) {
    return (
      <div className="max-w-2xl mx-auto">
        <VotingStep
          step={4}
          currentStep={4}
          title="Vote Submitted Successfully"
          description="Your vote has been recorded and encrypted"
          icon={CheckCircle}
        >
          <div className="mt-4 p-4 bg-success-50 rounded-lg border border-success-200">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-6 w-6 text-success-600" />
              <div>
                <h4 className="font-semibold text-success-900">
                  Vote Confirmed
                </h4>
                <p className="text-success-700 text-sm">
                  Your vote for {selectedCandidate?.name} has been successfully recorded.
                </p>
              </div>
            </div>
          </div>
        </VotingStep>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(getProgressPercentage())}% Complete
          </span>
        </div>
        <ProgressBar 
          value={currentStep} 
          max={steps.length} 
          color="primary"
          showValue={false}
        />
      </div>

      {/* Error Display */}
      {error && (
        <Card variant="error" className="mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-error-600" />
            <p className="text-error-700">{error}</p>
          </div>
        </Card>
      )}

      {/* Step 1: Election Information */}
      <VotingStep
        step={1}
        currentStep={currentStep}
        title="Election Information"
        description="Review the election details and your eligibility"
        icon={Vote}
      >
        <div className="mt-4 space-y-4">
          <Card>
            <Card.Header>
              <Card.Title>{election.title}</Card.Title>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Election Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>Start: {new Date(election.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>End: {new Date(election.end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{election.candidates?.length || 0} Candidates</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Your Eligibility</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-success-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Eligible to vote</span>
                    </div>
                    <div className="flex items-center space-x-2 text-success-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Identity verified</span>
                    </div>
                    <div className="flex items-center space-x-2 text-success-600">
                      <CheckCircle className="h-4 w-4" />
                      <span>Not voted yet</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </div>
      </VotingStep>

      {/* Step 2: Select Candidate */}
      {currentStep >= 2 && (
        <VotingStep
          step={2}
          currentStep={currentStep}
          title="Select Candidate"
          description="Choose your preferred candidate"
          icon={User}
        >
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {election.candidates?.map((candidate) => (
                <CandidateCard
                  key={candidate.id}
                  candidate={candidate}
                  selected={selectedCandidate?.id === candidate.id}
                  onSelect={handleCandidateSelect}
                />
              ))}
            </div>
            {!selectedCandidate && currentStep === 2 && (
              <p className="text-warning-600 text-sm mt-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Please select a candidate to continue
              </p>
            )}
          </div>
        </VotingStep>
      )}

      {/* Step 3: Confirm Vote */}
      {currentStep >= 3 && (
        <VotingStep
          step={3}
          currentStep={currentStep}
          title="Confirm Vote"
          description="Review and confirm your selection"
          icon={Shield}
        >
          <div className="mt-4">
            <Card variant="success">
              <Card.Header>
                <Card.Title>Vote Confirmation</Card.Title>
              </Card.Header>
              <Card.Body>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-success-400 to-success-600 flex items-center justify-center">
                      <User className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900">
                        {selectedCandidate?.name}
                      </h4>
                      <p className="text-gray-600">
                        {selectedCandidate?.party || 'Independent'}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Important Reminders:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Your vote is encrypted and secure</li>
                      <li>• You can only vote once per election</li>
                      <li>• Your vote cannot be changed after submission</li>
                      <li>• Your identity remains anonymous</li>
                    </ul>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </div>
        </VotingStep>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8">
        <Button
          variant="secondary"
          onClick={handleCancel}
          disabled={loading}
        >
          {currentStep === 1 ? 'Cancel' : 'Back'}
        </Button>
        
        <div className="flex space-x-3">
          {currentStep < 3 && (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={loading || (currentStep === 2 && !selectedCandidate)}
            >
              {currentStep === 3 ? 'Confirm Vote' : 'Next'}
            </Button>
          )}
          
          {currentStep === 3 && (
            <Button
              variant="success"
              onClick={handleNext}
              disabled={loading}
              icon={Shield}
            >
              Submit Vote
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Confirm Your Vote"
        message={`Are you sure you want to vote for ${selectedCandidate?.name}? This action cannot be undone.`}
        confirmText="Yes, Submit Vote"
        cancelText="Review Again"
        onConfirm={handleConfirmVote}
        type="warning"
      />
    </div>
  );
};

export default VotingInterface; 