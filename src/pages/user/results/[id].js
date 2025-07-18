import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ElectionResults() {
  const router = useRouter();
  const { id } = router.query;
  const [results, setResults] = useState(null);
  const [election, setElection] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    // Fetch election details and results in parallel
    Promise.all([
      fetch(`http://localhost:8000/api/elections/${id}/`).then(res => {
        if (!res.ok) throw new Error('Election not found');
        return res.json();
      }),
      fetch(`http://localhost:8000/api/elections/${id}/results/`).then(res => {
        if (!res.ok) throw new Error('Results not available');
        return res.json();
      })
    ])
      .then(([electionData, resultsData]) => {
        setElection(electionData);
        setResults(resultsData);
        setError(null);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (loading || !results || !election) return <div>Loading...</div>;

  // Map candidate names and votes from new API structure
  const candidateNames = (results.results || []).map(r => r.candidate);
  const voteCounts = (results.results || []).map(r => r.votes);
  const totalVotes = results.total_votes || 0;

  // Find winner(s) from API
  const winners = results.winners || [];
  // Find winner indices for highlighting percentage
  const winnerIndices = candidateNames.map((name, idx) => winners.includes(name) ? idx : null).filter(idx => idx !== null);

  // Calculate percentages
  const percentages = voteCounts.map(count => totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : '0.00');

  return (
    <div style={{ maxWidth: 700, margin: '2rem auto', padding: '2rem', background: '#fff', borderRadius: 8 }}>
      <h1>Results for <span style={{ color: '#0070f3' }}>{election.title}</span></h1>
      <p><strong>Total Votes:</strong> {totalVotes}</p>
      {voteCounts.length > 0 ? (
        <>
          <div style={{ margin: '2rem 0' }}>
            <Bar
              data={{
                labels: candidateNames,
                datasets: [
                  {
                    label: 'Votes',
                    data: voteCounts,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: { display: false },
                  title: { display: true, text: 'Election Results' },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const idx = context.dataIndex;
                        return `${context.dataset.label}: ${context.parsed.y} (${percentages[idx]}%)`;
                      }
                    }
                  }
                },
                scales: {
                  y: { beginAtZero: true, precision: 0 }
                }
              }}
            />
          </div>
          <div style={{ marginTop: '2rem', fontSize: '1.2rem' }}>
            <strong>Winner{winners.length > 1 ? 's' : ''}:</strong> {winners.join(', ')}
            {winnerIndices.length > 0 && (
              <span> ({percentages[winnerIndices[0]]}% of votes)</span>
            )}
          </div>
        </>
      ) : (
        <p>No candidate breakdown available.</p>
      )}
    </div>
  );
} 