import React, { useState, useEffect } from 'react';
import { MapPin, Users, AlertCircle, Clock, Zap } from 'lucide-react';
import { DisasterCard } from './DisasterCard';
import { CreateDisasterForm } from './CreateDisasterForm';
import { SocialMediaFeed } from './SocialMediaFeed';
import { OfficialUpdates } from './OfficialUpdates';
import { ResourceMap } from './ResourceMap';
import { io, Socket } from 'socket.io-client';

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

interface Stats {
  totalDisasters: number;
  urgentReports: number;
  activeResources: number;
  recentUpdates: number;
}

export const Dashboard: React.FC = () => {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selectedDisaster, setSelectedDisaster] = useState<Disaster | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalDisasters: 0,
    urgentReports: 0,
    activeResources: 0,
    recentUpdates: 0
  });

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('disaster_updated', (data) => {
      console.log('Disaster updated:', data);
      fetchDisasters();
    });

    newSocket.on('social_media_updated', (data) => {
      console.log('Social media updated:', data);
      // Update stats with urgent reports
      if (data.urgent_count) {
        setStats(prev => ({ ...prev, urgentReports: data.urgent_count }));
      }
    });

    // Fetch initial data
    fetchDisasters();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDisasters = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/disasters', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDisasters(data.disasters || []);
        setStats(prev => ({
          ...prev,
          totalDisasters: data.disasters?.length || 0
        }));
      }
    } catch (error) {
      console.error('Failed to fetch disasters:', error);
    }
  };

  const handleCreateDisaster = async (disasterData: any) => {
    try {
      const response = await fetch('http://localhost:3001/api/disasters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        },
        body: JSON.stringify(disasterData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchDisasters();
      }
    } catch (error) {
      console.error('Failed to create disaster:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Stats Overview */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">Active Disasters</p>
                  <p className="text-2xl font-bold text-red-900">{stats.totalDisasters}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">Urgent Reports</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.urgentReports}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <MapPin className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Active Resources</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeResources}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Recent Updates</p>
                  <p className="text-2xl font-bold text-green-900">{stats.recentUpdates}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Disasters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">Active Disasters</h2>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Report New Disaster
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {disasters.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active disasters reported</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {disasters.map((disaster) => (
                      <DisasterCard
                        key={disaster.id}
                        disaster={disaster}
                        onClick={() => setSelectedDisaster(disaster)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Resource Map */}
            {selectedDisaster && (
              <ResourceMap disaster={selectedDisaster} />
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Social Media Feed */}
            <SocialMediaFeed 
              disasterId={selectedDisaster?.id} 
              socket={socket}
              onUrgentCount={(count) => setStats(prev => ({ ...prev, urgentReports: count }))}
            />
            
            {/* Official Updates */}
            <OfficialUpdates 
              disasterId={selectedDisaster?.id}
              onUpdateCount={(count) => setStats(prev => ({ ...prev, recentUpdates: count }))}
            />
          </div>
        </div>
      </div>

      {/* Create Disaster Modal */}
      {showCreateForm && (
        <CreateDisasterForm
          onSubmit={handleCreateDisaster}
          onClose={() => setShowCreateForm(false)}
        />
      )}
    </div>
  );
};