import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, AlertTriangle, User, Zap } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface SocialMediaReport {
  id: string;
  user: string;
  content: string;
  timestamp: string;
  urgency: string;
  location: string;
  verified: boolean;
}

interface SocialMediaFeedProps {
  disasterId?: string;
  socket?: Socket | null;
  onUrgentCount: (count: number) => void;
}

export const SocialMediaFeed: React.FC<SocialMediaFeedProps> = ({ 
  disasterId, 
  socket,
  onUrgentCount 
}) => {
  const [reports, setReports] = useState<SocialMediaReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [urgentOnly, setUrgentOnly] = useState(false);

  useEffect(() => {
    if (disasterId) {
      fetchSocialMediaReports();
    } else {
      // Fetch mock data for demonstration
      fetchMockReports();
    }
  }, [disasterId, urgentOnly]);

  useEffect(() => {
    if (socket) {
      socket.on('social_media_updated', (data) => {
        if (data.disaster_id === disasterId || !disasterId) {
          setReports(data.reports || []);
          onUrgentCount(data.urgent_count || 0);
        }
      });
    }
  }, [socket, disasterId, onUrgentCount]);

  const fetchSocialMediaReports = async () => {
    if (!disasterId) return;
    
    setLoading(true);
    try {
      const endpoint = urgentOnly 
        ? `http://localhost:3001/api/social-media/urgent/${disasterId}`
        : `http://localhost:3001/api/social-media/${disasterId}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(urgentOnly ? data.urgent_reports : data.reports);
        if (!urgentOnly) {
          onUrgentCount(data.urgent_count || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch social media reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMockReports = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/social-media/mock-feed', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
      }
    } catch (error) {
      console.error('Failed to fetch mock reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h`;
    } else {
      return `${Math.floor(diffMins / 1440)}d`;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'urgent':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Social Media Reports</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setUrgentOnly(!urgentOnly)}
              className={`flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                urgentOnly
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Zap className="h-3 w-3 mr-1" />
              {urgentOnly ? 'Urgent Only' : 'All Reports'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No social media reports available</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {reports.map((report) => (
              <div key={report.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      @{report.user}
                    </span>
                    {report.verified && (
                      <div className="ml-2 w-2 h-2 bg-blue-500 rounded-full" title="Verified"></div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUrgencyColor(report.urgency)}`}>
                      {report.urgency}
                    </span>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatTime(report.timestamp)}
                    </div>
                  </div>
                </div>
                
                <p className="text-gray-700 text-sm mb-2">
                  {report.content}
                </p>
                
                <div className="flex items-center text-xs text-gray-500">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {report.location}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};