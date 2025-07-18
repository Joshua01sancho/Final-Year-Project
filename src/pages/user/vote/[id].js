import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { apiClient } from '../../../lib/api';

export default function VotePage() {
  const router = useRouter();
  const { id } = router.query;
  const [election, setElection] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voteSuccess, setVoteSuccess] = useState(false);

  // Fetch election details
  useEffect(() => {
    if (id) {
      setLoading(true);
      apiClient.getElection(id)
        .then((data) => {
          setElection(data);
        })
        .catch((err) => {
          setMessage('Failed to load election details.');
          setElection(null);
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  // Handle vote submission using blockchain
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);
    
    try {
      // Use the blockchain voting API
      const result = await apiClient.castVote(id, selectedCandidate);
      setVoteSuccess(true);
      setMessage(`✅ Vote submitted successfully! Transaction: ${result.transaction_hash}`);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/user/dashboard');
      }, 3000);
      
    } catch (err) {
      console.error('Voting error:', err);
      if (err.response?.data?.error) {
        setMessage(`❌ ${err.response.data.error}`);
      } else {
        setMessage('❌ Error submitting vote. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div>Loading election details...</div>
    </div>
  );
  
  if (!election) return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <div>{message || 'Election not found.'}</div>
    </div>
  );

  // Show success message if vote was successful
  if (voteSuccess) {
    return (
      <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          padding: '2rem',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '1rem' }}>🎉 Vote Cast Successfully!</h1>
          <p style={{ margin: '1rem 0', opacity: 0.9 }}>{message}</p>
          <p style={{ margin: '1rem 0', opacity: 0.8 }}>Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '2rem',
        borderRadius: '10px',
        marginBottom: '2rem'
      }}>
        <h1 style={{ margin: 0, fontSize: '2rem' }}>{election.title}</h1>
        <p style={{ margin: '1rem 0 0 0', opacity: 0.9 }}>{election.description}</p>
      </div>

      <div style={{ 
        background: 'white',
        padding: '2rem',
        borderRadius: '10px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <form onSubmit={handleSubmit}>
          <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>Select Your Candidate</h2>
          
          {election.candidates && election.candidates.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {election.candidates.map(candidate => (
                <div key={candidate.id} style={{
                  border: selectedCandidate === String(candidate.id) ? '2px solid #667eea' : '2px solid #e1e5e9',
                  borderRadius: '8px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  background: selectedCandidate === String(candidate.id) ? '#f8f9ff' : 'white'
                }} onClick={() => setSelectedCandidate(String(candidate.id))}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
                    <input
                      type="radio"
                      name="candidate"
                      value={candidate.id}
                      checked={selectedCandidate === String(candidate.id)}
                      onChange={() => setSelectedCandidate(String(candidate.id))}
                      required
                      style={{ marginRight: '1rem' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {candidate.name}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        {candidate.party}
                      </div>
                      {candidate.description && (
                        <div style={{ color: '#555', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                          {candidate.description}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#666' }}>No candidates available.</div>
          )}
          
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button 
              type="submit" 
              disabled={!selectedCandidate || submitting}
              style={{
                background: selectedCandidate ? '#667eea' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1.1rem',
                cursor: selectedCandidate ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease'
              }}
            >
              {submitting ? 'Submitting Vote...' : 'Submit Vote'}
            </button>
          </div>
        </form>
        
        {message && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '8px',
            background: message.includes('✅') ? '#d4edda' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : '#721c24',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 