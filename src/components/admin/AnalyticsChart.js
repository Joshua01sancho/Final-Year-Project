import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Users, Vote, Clock, CheckCircle } from 'lucide-react';

const AnalyticsChart = ({ data, type = 'bar', title, height = 300 }) => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    if (data) {
      setChartData(data);
    }
  }, [data]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        );

      case 'line':
        return (
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} />
          </LineChart>
        );

      default:
        return (
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3B82F6" />
          </BarChart>
        );
    }
  };

  return (
    <div className="card">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

// Analytics Dashboard Component
const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(false);

  // Mock data - replace with actual API calls
  const [analyticsData, setAnalyticsData] = useState({
    voterTurnout: [
      { name: 'Day 1', value: 1200 },
      { name: 'Day 2', value: 1800 },
      { name: 'Day 3', value: 2100 },
      { name: 'Day 4', value: 1950 },
      { name: 'Day 5', value: 2300 },
      { name: 'Day 6', value: 2800 },
      { name: 'Day 7', value: 3200 },
    ],
    candidateResults: [
      { name: 'John Smith', value: 45, color: '#3B82F6' },
      { name: 'Jane Doe', value: 35, color: '#10B981' },
      { name: 'Mike Johnson', value: 20, color: '#F59E0B' },
    ],
    votingMethods: [
      { name: 'Face Recognition', value: 65, color: '#3B82F6' },
      { name: 'Fingerprint', value: 20, color: '#10B981' },
      { name: '2FA', value: 15, color: '#F59E0B' },
    ],
    hourlyActivity: [
      { name: '9 AM', value: 150 },
      { name: '10 AM', value: 280 },
      { name: '11 AM', value: 320 },
      { name: '12 PM', value: 450 },
      { name: '1 PM', value: 380 },
      { name: '2 PM', value: 290 },
      { name: '3 PM', value: 220 },
      { name: '4 PM', value: 180 },
    ],
  });

  const stats = [
    {
      title: 'Total Votes',
      value: '12,450',
      change: '+15%',
      changeType: 'increase',
      icon: Vote,
      color: 'primary',
    },
    {
      title: 'Active Voters',
      value: '8,920',
      change: '+8%',
      changeType: 'increase',
      icon: Users,
      color: 'success',
    },
    {
      title: 'Avg. Voting Time',
      value: '2.3 min',
      change: '-12%',
      changeType: 'decrease',
      icon: Clock,
      color: 'warning',
    },
    {
      title: 'Success Rate',
      value: '98.5%',
      change: '+2%',
      changeType: 'increase',
      icon: CheckCircle,
      color: 'info',
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-100 text-primary-600';
      case 'success':
        return 'bg-success-100 text-success-600';
      case 'warning':
        return 'bg-warning-100 text-warning-600';
      case 'info':
        return 'bg-info-100 text-info-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getChangeIcon = (changeType) => {
    return changeType === 'increase' ? (
      <TrendingUp className="h-4 w-4 text-success-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const getChangeColor = (changeType) => {
    return changeType === 'increase' ? 'text-success-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {getChangeIcon(stat.changeType)}
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(stat.changeType)}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">from last period</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg ${getColorClasses(stat.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voter Turnout Over Time */}
        <AnalyticsChart
          data={analyticsData.voterTurnout}
          type="line"
          title="Voter Turnout Over Time"
          height={300}
        />

        {/* Candidate Results */}
        <AnalyticsChart
          data={analyticsData.candidateResults}
          type="pie"
          title="Candidate Results"
          height={300}
        />

        {/* Voting Methods */}
        <AnalyticsChart
          data={analyticsData.votingMethods}
          type="pie"
          title="Voting Methods Used"
          height={300}
        />

        {/* Hourly Activity */}
        <AnalyticsChart
          data={analyticsData.hourlyActivity}
          type="bar"
          title="Hourly Voting Activity"
          height={300}
        />
      </div>

      {/* Additional Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Demographics */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Voter Demographics</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Age 18-30</span>
              <span className="font-medium">32%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Age 31-50</span>
              <span className="font-medium">45%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Age 51+</span>
              <span className="font-medium">23%</span>
            </div>
          </div>
        </div>

        {/* Device Usage */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Usage</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Desktop</span>
              <span className="font-medium">58%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mobile</span>
              <span className="font-medium">35%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Tablet</span>
              <span className="font-medium">7%</span>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Regions</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">North Region</span>
              <span className="font-medium">28%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">South Region</span>
              <span className="font-medium">25%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">East Region</span>
              <span className="font-medium">24%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">West Region</span>
              <span className="font-medium">23%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { AnalyticsChart, AnalyticsDashboard };
export default AnalyticsChart; 