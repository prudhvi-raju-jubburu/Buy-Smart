import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getAnalyticsOverview } from '../services/api';
import './AnalyticsDashboard.css';

const COLORS = ['#667eea', '#764ba2', '#f59e0b', '#2563eb', '#db2777', '#10b981'];

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadAnalytics();
  }, [days]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const result = await getAnalyticsOverview(days);
      setData(result);
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (value) => {
    const n = Number(value || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(n);
  };

  if (loading) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-loading">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="analytics-dashboard">
        <div className="analytics-error">No analytics data available</div>
      </div>
    );
  }

  // Prepare chart data
  const platformClicksData = Object.entries(data.clicks_by_platform || {}).map(([name, value]) => ({
    name,
    clicks: value
  }));

  const sourceClicksData = Object.entries(data.clicks_by_source || {}).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    clicks: value
  }));

  const platformCountsData = Object.entries(data.platform_counts || {}).map(([name, value]) => ({
    name,
    products: value
  }));

  const priceStatsData = Object.entries(data.price_stats || {}).map(([name, stats]) => ({
    name,
    'Mean Price': stats.mean,
    'Median Price': stats.median
  }));

  return (
    <div className="analytics-dashboard" id="analytics">
      <div className="analytics-header">
        <h2>📊 Analytics Dashboard</h2>
        <div className="analytics-controls">
          <label>Time Period:</label>
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
          <button onClick={loadAnalytics} className="refresh-btn">Refresh</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Total Products</div>
          <div className="kpi-value">{data.totals?.products || 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Users</div>
          <div className="kpi-value">{data.totals?.users || 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Clicks</div>
          <div className="kpi-value">{data.totals?.clicks || 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Purchases</div>
          <div className="kpi-value">{data.totals?.purchases || 0}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Conversion Rate</div>
          <div className="kpi-value">{((data.totals?.conversion_rate || 0) * 100).toFixed(2)}%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Recommendation CTR</div>
          <div className="kpi-value">{((data.recommendation_effectiveness?.recommendation_ctr || 0) * 100).toFixed(2)}%</div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Platform Popularity (Clicks)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformClicksData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="clicks" fill="#667eea" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Click Source Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceClicksData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="clicks"
              >
                {sourceClicksData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Products by Platform</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={platformCountsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="products" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Price Comparison (Mean vs Median)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={priceStatsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatINR(value)} />
              <Legend />
              <Bar dataKey="Mean Price" fill="#f59e0b" />
              <Bar dataKey="Median Price" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendation Effectiveness */}
      <div className="analytics-section">
        <h3>🎯 Recommendation System Effectiveness</h3>
        <div className="effectiveness-grid">
          <div className="effectiveness-card">
            <div className="effectiveness-label">Recommendation Clicks</div>
            <div className="effectiveness-value">{data.recommendation_effectiveness?.recommendation_clicks || 0}</div>
          </div>
          <div className="effectiveness-card">
            <div className="effectiveness-label">Search Clicks</div>
            <div className="effectiveness-value">{data.recommendation_effectiveness?.search_clicks || 0}</div>
          </div>
          <div className="effectiveness-card">
            <div className="effectiveness-label">Recommendation CTR</div>
            <div className="effectiveness-value">{((data.recommendation_effectiveness?.recommendation_ctr || 0) * 100).toFixed(2)}%</div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="analytics-section">
        <h3>📈 Additional Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Recent Price Drop Alerts:</span>
            <span className="stat-value">{data.recent_alerts_triggered || 0}</span>
          </div>
          {data.category_counts && Object.keys(data.category_counts).length > 0 && (
            <div className="stat-item">
              <span className="stat-label">Top Categories:</span>
              <span className="stat-value">
                {Object.entries(data.category_counts).slice(0, 3).map(([cat, cnt]) => `${cat} (${cnt})`).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

