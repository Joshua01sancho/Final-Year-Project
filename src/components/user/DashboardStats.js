import React, { useState, useEffect } from 'react';
import { Vote, Clock, CheckCircle, AlertCircle, TrendingUp, Users, Award, Calendar, Activity } from 'lucide-react';
import Card from '../common/Card';

const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      setDisplayValue(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [value, duration]);

  return <span>{displayValue}</span>;
};

const DashboardStats = ({ stats, loading = false }) => {
  const [activeCard, setActiveCard] = useState(null);

  const statCards = [
    {
      id: 'total',
      title: 'Total Elections',
      value: stats?.total || 0,
      icon: Vote,
      color: 'primary',
      description: 'All available elections'
    },
    {
      id: 'active',
      title: 'Active Elections',
      value: stats?.active || 0,
      icon: TrendingUp,
      color: 'success',
      description: 'Currently running'
    },
    {
      id: 'upcoming',
      title: 'Upcoming',
      value: stats?.upcoming || 0,
      icon: Clock,
      color: 'warning',
      description: 'Scheduled to start'
    },
    {
      id: 'completed',
      title: 'Completed',
      value: stats?.ended || 0,
      icon: CheckCircle,
      color: 'primary',
      description: 'Finished elections'
    },
    {
      id: 'voted',
      title: 'Votes Cast',
      value: stats?.voted || 0,
      icon: Award,
      color: 'success',
      description: 'Your participation'
    }
  ];

  const handleCardHover = (cardId) => {
    setActiveCard(cardId);
  };

  const handleCardLeave = () => {
    setActiveCard(null);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} loading={true} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {statCards.map((card) => {
        const Icon = card.icon;
        const isActive = activeCard === card.id;

        return (
          <Card
            key={card.id}
            variant={card.color}
            className={`text-center transition-all duration-300 cursor-pointer ${
              isActive ? 'scale-105 shadow-lg' : 'hover:scale-102'
            }`}
            onClick={() => handleCardHover(card.id)}
            onMouseEnter={() => handleCardHover(card.id)}
            onMouseLeave={handleCardLeave}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isActive ? 'scale-110' : ''
              }`}>
                <Icon className={`h-6 w-6 text-${card.color}-600`} />
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={card.value} />
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {card.title}
                </div>
                <div className="text-xs text-gray-500">
                  {card.description}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default DashboardStats; 