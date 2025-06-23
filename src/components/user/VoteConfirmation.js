import React from 'react';
import { Shield, CheckCircle, ExternalLink, Copy, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const VoteConfirmation = ({
  receipt,
  onDownloadReceipt,
  onVerifyVote,
}) => {
  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const formatTransactionHash = (hash) => {
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Vote Successfully Cast!
          </h1>
          <p className="text-gray-600">
            Your vote has been encrypted and recorded on the blockchain. 
            You can verify your vote using the transaction hash below.
          </p>
        </div>

        {/* Vote Details */}
        <div className="space-y-6">
          {/* Election Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Election Details
            </h3>
            <p className="text-gray-700">{receipt.electionTitle}</p>
            <p className="text-sm text-gray-500">
              Voted on {receipt.timestamp.toLocaleDateString()} at{' '}
              {receipt.timestamp.toLocaleTimeString()}
            </p>
          </div>

          {/* Transaction Hash */}
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Blockchain Transaction
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => copyToClipboard(receipt.transactionHash, 'Transaction hash')}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Copy transaction hash"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <a
                  href={receipt.verificationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-primary-600 hover:text-primary-700 transition-colors"
                  aria-label="View transaction on blockchain explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
            <div className="bg-white rounded border p-3 font-mono text-sm">
              {formatTransactionHash(receipt.transactionHash)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              This transaction hash serves as your voting receipt and can be used to verify your vote on the blockchain.
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-warning-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-warning-800 mb-1">
                  Important Security Notice
                </h4>
                <ul className="text-sm text-warning-700 space-y-1">
                  <li>• Your vote is encrypted and cannot be traced back to you</li>
                  <li>• Save this receipt for future verification</li>
                  <li>• Do not share your transaction hash publicly</li>
                  <li>• You can verify your vote anytime using the blockchain explorer</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onDownloadReceipt}
              className="flex-1 btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download Receipt</span>
            </button>
            <button
              onClick={onVerifyVote}
              className="flex-1 btn-primary flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Verify Vote</span>
            </button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Need help? Contact support at{' '}
              <a href="mailto:support@e-vote-system.com" className="text-primary-600 hover:underline">
                support@e-vote-system.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoteConfirmation; 