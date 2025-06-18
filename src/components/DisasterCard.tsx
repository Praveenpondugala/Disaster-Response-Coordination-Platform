import React from 'react';
import { MapPin, Clock, Tag, User } from 'lucide-react';

interface Disaster {
  id: string;
  title: string;
  location_name: string;
  description: string;
  tags: string[];
  coordinates?: { latitude: number; longitude: number };
  created_at: string;
  owner_id: string;
}

interface DisasterCardProps {
  disaster: Disaster;
  onClick: () => void;
}

export const DisasterCard: React.FC<DisasterCardProps> = ({ disaster, onClick }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    }
  };

  const getTagColor = (tag: string) => {
    const colors: { [key: string]: string } = {
      urgent: 'bg-red-100 text-red-800',
      flood: 'bg-blue-100 text-blue-800',
      fire: 'bg-orange-100 text-orange-800',
      earthquake: 'bg-purple-100 text-purple-800',
      hurricane: 'bg-gray-100 text-gray-800',
      default: 'bg-gray-100 text-gray-800'
    };
    
    return colors[tag.toLowerCase()] || colors.default;
  };

  return (
    <div 
      onClick={onClick}
      className="border border-gray-200 rounded-lg p-4 hover:border-red-300 hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-700 transition-colors">
          {disaster.title}
        </h3>
        <div className="flex items-center text-sm text-gray-500">
          <Clock className="h-4 w-4 mr-1" />
          {formatTime(disaster.created_at)}
        </div>
      </div>
      
      <div className="flex items-center mb-2">
        <MapPin className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-600">{disaster.location_name}</span>
      </div>
      
      <p className="text-gray-700 mb-3 line-clamp-2">
        {disaster.description}
      </p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {disaster.tags.map((tag) => (
            <span
              key={tag}
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTagColor(tag)}`}
            >
              <Tag className="h-3 w-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center text-xs text-gray-500">
          <User className="h-3 w-3 mr-1" />
          {disaster.owner_id}
        </div>
      </div>
    </div>
  );
};