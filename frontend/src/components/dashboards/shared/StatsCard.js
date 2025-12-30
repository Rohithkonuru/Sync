import React from 'react';
import { Card } from '../../ui';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatsCard = ({ title, value, trend, icon: Icon, trendDirection = 'up', color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
  };

  const trendColor = trendDirection === 'up' ? 'text-green-600' : 'text-red-600';
  const TrendIcon = trendDirection === 'up' ? FiTrendingUp : FiTrendingDown;

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trendColor}`}>
              <TrendIcon className="mr-1" /> {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
          {Icon && <Icon className="w-6 h-6" />}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;
