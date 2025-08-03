import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Vote, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Activity,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';

const MetricCard = ({ title, value, change, icon: Icon, color = 'primary', loading = false }) => {
  const colorClasses = {
    primary: 'text-primary-600 bg-primary-50',
    success: 'text-success-600 bg-success-50',
    warning: 'text-warning-600 bg-warning-50',
    error: 'text-error-600 bg-error-50'
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={`flex items-center text-sm ${
              change > 0 ? 'text-success-600' : 'text-error-600'
            }`}>
              <TrendingUp className={`h-4 w-4 mr-1 ${change < 0 ? 'transform rotate-180' : ''}`} />
              {Math.abs(change)}%
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

const ChartCard = ({ title, children, className = '' }) => (
  <Card className={`${className}`}>
    <Card.Header>
      <Card.Title>{title}</Card.Title>
    </Card.Header>
    <Card.Body>
      <div className="h-64">
        {children}
      </div>
    </Card.Body>
  </Card>
);

const AnalyticsDashboard = ({ 
  electionData, 
  timeRange = '7d',
  loading = false 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [selectedChart, setSelectedChart] = useState('votes');

  // Sample data - replace with real data from props
  const mockData = {
    totalVoters: 1250,
    activeVoters: 892,
    totalVotes: 756,
    participationRate: 60.5,
    timeSeriesData: [
      { date: '2024-01-01', votes: 45, voters: 120 },
      { date: '2024-01-02', votes: 67, voters: 145 },
      { date: '2024-01-03', votes: 89, voters: 178 },
      { date: '2024-01-04', votes: 123, voters: 234 },
      { date: '2024-01-05', votes: 156, voters: 289 },
      { date: '2024-01-06', votes: 189, voters: 345 },
      { date: '2024-01-07', votes: 234, voters: 412 }
    ],
    candidateData: [
      { name: 'John Doe', votes: 234, percentage: 31.2, color: '#3B82F6' },
      { name: 'Jane Smith', votes: 189, percentage: 25.1, color: '#10B981' },
      { name: 'Mike Johnson', votes: 156, percentage: 20.7, color: '#F59E0B' },
      { name: 'Sarah Wilson', votes: 123, percentage: 16.3, color: '#EF4444' },
      { name: 'David Brown', votes: 54, percentage: 6.7, color: '#8B5CF6' }
    ],
    demographics: [
      { age: '18-25', count: 156, percentage: 20.6 },
      { age: '26-35', count: 234, percentage: 30.9 },
      { age: '36-45', count: 189, percentage: 25.0 },
      { age: '46-55', count: 123, percentage: 16.3 },
      { age: '55+', count: 54, percentage: 7.2 }
    ]
  };

  const metrics = [
    {
      title: 'Total Voters',
      value: mockData.totalVoters.toLocaleString(),
      change: 12.5,
      icon: Users,
      color: 'primary'
    },
    {
      title: 'Active Voters',
      value: mockData.activeVoters.toLocaleString(),
      change: 8.3,
      icon: Activity,
      color: 'success'
    },
    {
      title: 'Votes Cast',
      value: mockData.totalVotes.toLocaleString(),
      change: 15.7,
      icon: Vote,
      color: 'primary'
    },
    {
      title: 'Participation Rate',
      value: `${mockData.participationRate}%`,
      change: 5.2,
      icon: Target,
      color: 'success'
    }
  ];

  const timeRanges = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const chartTypes = [
    { id: 'votes', label: 'Vote Trends', icon: TrendingUp },
    { id: 'demographics', label: 'Demographics', icon: Users },
    { id: 'candidates', label: 'Candidate Results', icon: Award }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Real-time election insights and statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range.value}
                onClick={() => setSelectedTimeRange(range.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedTimeRange === range.value
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Button variant="outline" icon={RefreshCw}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <MetricCard
            key={index}
            {...metric}
            loading={loading}
          />
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          return (
            <button
              key={chart.id}
              onClick={() => setSelectedChart(chart.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedChart === chart.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{chart.label}</span>
            </button>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vote Trends Chart */}
        {selectedChart === 'votes' && (
          <ChartCard title="Vote Trends Over Time">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData.timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [value, name === 'votes' ? 'Votes' : 'Voters']}
                />
                <Area 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.3}
                  name="votes"
                />
                <Area 
                  type="monotone" 
                  dataKey="voters" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                  name="voters"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Demographics Chart */}
        {selectedChart === 'demographics' && (
          <ChartCard title="Voter Demographics">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockData.demographics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'count' ? 'Voters' : 'Percentage']}
                  labelFormatter={(value) => `Age: ${value}`}
                />
                <Bar dataKey="count" fill="#3B82F6" name="count" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Candidate Results Chart */}
        {selectedChart === 'candidates' && (
          <ChartCard title="Candidate Results">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockData.candidateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="votes"
                >
                  {mockData.candidateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [value, 'Votes']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* Participation Rate */}
        <ChartCard title="Participation Rate" className="lg:col-span-2">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10B981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${(mockData.participationRate / 100) * 352} 352`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {mockData.participationRate}%
                  </span>
                </div>
              </div>
              <p className="text-gray-600">Overall Participation Rate</p>
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Recent Activity */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Activity</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="space-y-4">
            {[
              { time: '2 minutes ago', action: 'New vote cast', user: 'John Doe', icon: Vote },
              { time: '5 minutes ago', action: 'Voter registered', user: 'Jane Smith', icon: Users },
              { time: '10 minutes ago', action: 'Election started', user: 'System', icon: Clock },
              { time: '15 minutes ago', action: 'Vote verified', user: 'Mike Johnson', icon: CheckCircle }
            ].map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                  <span className="text-xs text-gray-400">{activity.time}</span>
                </div>
              );
            })}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AnalyticsDashboard; 