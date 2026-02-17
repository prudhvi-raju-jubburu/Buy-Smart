import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ComparisonChart = ({ products }) => {
    if (!products || products.length === 0) {
        return null;
    }

    // Format data: we need to normalize or structure it for comparison
    // Let's compare Price and Rating
    const data = products.map(p => ({
        name: p.name.substring(0, 15) + '...', // Truncate name
        Price: p.price,
        Rating: p.rating * 50 + 500, // Scale rating to be visible on same axis as price? Or separate charts.
        // Better to just show Price for now, or use dual axis?
        // Let's stick to Price for simplicity in one chart, or normalized values.
        // Actually, let's just do Price comparison.
        FullRating: p.rating
    }));

    return (
        <div className="comparison-chart-container">
            <h3>Price Comparison</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="Price" fill="#8884d8" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <h3>Rating Comparison</h3>
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 5]} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="FullRating" fill="#82ca9d" name="Rating" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ComparisonChart;
