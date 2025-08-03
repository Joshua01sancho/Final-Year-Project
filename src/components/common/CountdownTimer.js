import React, { useEffect, useState } from 'react';

const pad = (n) => n.toString().padStart(2, '0');

const getTimeLeft = (target) => {
  const now = new Date();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, isOver: diff <= 0 };
};

const CountdownTimer = ({ targetTime, onEnd, className = '', label = 'Time left', showDays = true }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(new Date(targetTime)));

  useEffect(() => {
    const interval = setInterval(() => {
      const t = getTimeLeft(new Date(targetTime));
      setTimeLeft(t);
      if (t.isOver && onEnd) onEnd();
    }, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onEnd]);

  if (timeLeft.isOver) {
    return <span className={`text-success-600 font-semibold ${className}`}>Ended</span>;
  }

  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded ${className}`} aria-label={label}>
      {showDays && (
        <span><span className="font-bold">{pad(timeLeft.days)}</span>d</span>
      )}
      <span><span className="font-bold">{pad(timeLeft.hours)}</span>h</span>
      <span><span className="font-bold">{pad(timeLeft.minutes)}</span>m</span>
      <span><span className="font-bold">{pad(timeLeft.seconds)}</span>s</span>
    </span>
  );
};

export default CountdownTimer; 