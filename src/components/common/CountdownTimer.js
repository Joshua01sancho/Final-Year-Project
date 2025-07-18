import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const getTimeLeft = (targetTime) => {
  const now = new Date();
  const target = new Date(targetTime);
  const diff = target - now;
  return diff > 0 ? diff : 0;
};

function formatTime(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return [hours, minutes, seconds]
    .map((v) => v.toString().padStart(2, '0'))
    .join(':');
}

const getProgress = (start, end, now) => {
  const total = end - start;
  const elapsed = now - start;
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
};

const CountdownTimer = ({ startTime, endTime }) => {
  const [now, setNow] = useState(new Date());
  const start = new Date(startTime);
  const end = new Date(endTime);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  let state, label, target, color;
  if (now < start) {
    state = 'before';
    label = 'Election starts in';
    target = start;
    color = '#f59e42'; // orange
  } else if (now < end) {
    state = 'during';
    label = 'Election ends in';
    target = end;
    color = '#22c55e'; // green
  } else {
    state = 'after';
    label = 'Election has ended!';
    color = '#ef4444'; // red
  }

  // For progress bar
  const progress = state === 'during' ? getProgress(start, end, now) : state === 'before' ? 0 : 100;

  // For animation
  const [animate, setAnimate] = useState(false);
  useEffect(() => {
    setAnimate(true);
    const timeout = setTimeout(() => setAnimate(false), 500);
    return () => clearTimeout(timeout);
  }, [now]);

  return (
    <div style={{
      background: '#18181b',
      color: color,
      borderRadius: '1rem',
      padding: '1.5rem',
      boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
      maxWidth: 400,
      margin: '1rem auto',
      textAlign: 'center',
      position: 'relative',
      transition: 'color 0.5s',
    }}>
      <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 22 }}>{label}</h3>
      {state !== 'after' ? (
        <div
          style={{
            fontSize: 36,
            fontWeight: 800,
            letterSpacing: 2,
            transition: 'color 0.5s',
            color: animate ? '#fff' : color,
            textShadow: animate ? '0 0 8px #fff' : 'none',
          }}
        >
          {formatTime(getTimeLeft(target))}
        </div>
      ) : (
        <div style={{ fontSize: 32, fontWeight: 700 }}>{label}</div>
      )}
      {/* Progress Bar */}
      <div style={{
        marginTop: 18,
        height: 12,
        width: '100%',
        background: '#27272a',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}>
        <div
          style={{
            height: '100%',
            width: `${progress}%`,
            background: color,
            transition: 'width 0.7s cubic-bezier(.4,2,.3,1)',
          }}
        />
      </div>
      {/* State Message */}
      <div style={{ marginTop: 12, fontSize: 15, color: '#a1a1aa' }}>
        {state === 'before' && 'Voting will open soon. Get ready!'}
        {state === 'during' && 'Voting is live! Cast your vote now.'}
        {state === 'after' && 'Voting is closed. Thank you for participating!'}
      </div>
    </div>
  );
};

CountdownTimer.propTypes = {
  startTime: PropTypes.string.isRequired, // ISO string
  endTime: PropTypes.string.isRequired,   // ISO string
};

export default CountdownTimer; 