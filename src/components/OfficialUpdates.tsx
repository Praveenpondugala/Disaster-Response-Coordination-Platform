import React, { useState, useEffect } from 'react';
import { Shield, Clock, ExternalLink, AlertCircle } from 'lucide-react';

interface OfficialUpdate {
  id: string;
  agency: string;
  title: string;
  content: string;
  timestamp: string;
  priority: string;
  source_url: string;
  verified: boolean;
}

interface OfficialUpdatesProps {
  disasterId?: string;
  onUpdateCount: (count: number) => void;
}

export const OfficialUpdates: React.FC<OfficialUpdatesProps> = ({ 
  disasterId, 
  onUpdateCount 
}) => {
  const [updates, setUpdates] = useState<OfficialUpdate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');

  const agencies = ['FEMA', 'Red Cross', 'National Weather Service', 'Emergency Management'];

  useEffect(() => {
    fetchOfficialUpdates();
  }, [disasterId, selectedAgency]);

  const fetchOfficialUpdates = async () => {
    setLoading(true);
    try {
      let endpoint = `http://localhost:3001/api/updates/${disasterId || 'general'}`;
      
      if (selectedAgency !== 'all') {
        endpoint = `http://localhost:3001/api/updates/agency/${selectedAgency}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates || []);
        onUpdateCount(data.updates?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch official updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAgencyIcon = (agency: string) => {
    switch (agency.toLowerCase()) {
      case 'fema':
        return <Shield className="h-4 w-4 text-blue-600" />;
      case 'red cross':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Official Updates</h3>
          </div>
        </div>
        
        {/* Agency Filter */}
        <select
          value={selectedAgency}
          onChange={(e) => setSelectedAgency(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="all">All Agencies</option>
          {agencies.map((agency) => (
            <option key={agency} value={agency}>
              {agency}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading updates...</p>
          </div>
        ) : updates.length === 0 ? (
          <div className="p-6 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No official updates available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {updates.map((update) => (
              <div key={update.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    {getAgencyIcon(update.agency)}
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {update.agency}
                    </span>
                    {update.verified && (
                      <div className="ml-2 w-2 h-2 bg-green-500 rounded-full" title="Verified"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(update.priority)}`}>
                      {update.priority}
                    </span>
                  </div>
                </div>
                
                <h4 className="font-medium text-gray-900 mb-2">
                  {update.title}
                </h4>
                
                <p className="text-sm text-gray-700 mb-3">
                  {update.content}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(update.timestamp)}
                  </div>
                  
                  <a
                    href={update.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};