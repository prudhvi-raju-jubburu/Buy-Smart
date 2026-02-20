import React from 'react';
import './NotificationTicker.css';

const NotificationTicker = () => {
    const alerts = [
        "🔥 Flash Sale: Up to 40% off on top-rated Smartwatches! Check Trending now.",
        "🚀 New System Update: Real-time price comparison across 4+ major platforms is now active.",
        "✨ Smart Tip: Use our 'Analytics' insights to find the best price-to-rating ratio for any product.",
        "📦 Fast Track: Meesho & Myntra live deals are now loading 2x faster in Fast Mode.",
        "💡 Price Drop Alert: Popular headphones just dropped below ₹999 on Flipkart!"
    ];

    return (
        <div className="ticker-container">
            {/* <div className="ticker-label"></div> */}
            <div className="ticker-wrapper">
                <div className="ticker-content">
                    {alerts.map((alert, index) => (
                        <span key={index} className="ticker-item">{alert}</span>
                    ))}
                    {/* Duplicate for seamless loop */}
                    {alerts.map((alert, index) => (
                        <span key={`dup-${index}`} className="ticker-item">{alert}</span>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default NotificationTicker;
