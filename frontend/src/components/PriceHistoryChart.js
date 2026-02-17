import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PriceHistoryChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">No price history available</div>;
  }

  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.recorded_at).toLocaleDateString(),
    price: item.price,
    platform: item.platform
  })).reverse(); // Show oldest to newest

  return (
    <div className="price-history-chart" style={{ width: '100%', height: 300 }}>
      <h3>Price History</h3>
      <ResponsiveContainer>
        <LineChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PriceHistoryChart;
