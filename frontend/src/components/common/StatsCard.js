import React from 'react';
import Card from '../ui/Card';

const StatsCard = ({ children, className = '' }) => {
  return <Card className={className}>{children}</Card>;
};

export default StatsCard;
