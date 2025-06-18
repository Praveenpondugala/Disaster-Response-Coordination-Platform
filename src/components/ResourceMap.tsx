import React, { useState, useEffect } from 'react';
import { MapPin, Home, Guitar as Hospital, Utensils, Shield, Loader2 } from 'lucide-react';

interface Resource {
  id: string;
  disaster_id: string;
  name: string;
  location_name: string;
  type: string;
  coordinates?: { latitude: number; longitude: number };
}

interface Disaster {
  id: string;
  title: string;
  coordinates?: { latitude: number; longitude: number };
}

interface ResourceMapProps {
  disaster: Disaster;
}

export const ResourceMap: React.FC<ResourceMapProps> = ({ disaster }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');

  const resourceTypes = ['shelter', 'medical', 'food', 'emergency'];

  useEffect(() => {
    if (disaster.coordinates) {
      fetchNearbyResources();
    } else {
      // Generate mock resources for demonstration
      generateMockResources();
    }
  }, [disaster, selectedType]);

  const fetchNearbyResources = async () => {
    if (!disaster.coordinates) return;
    
    setLoading(true);
    try {
      const { latitude, longitude } = disaster.coordinates;
      const response = await fetch(
        `http://localhost:3001/api/resources?disaster_id=${disaster.id}&lat=${latitude}&lng=${longitude}&type=${selectedType}`,
        {
          headers: {
            'Authorization': 'Bearer mock-token',
            'X-User-ID': 'netrunnerX'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
      generateMockResources();
    } finally {
      setLoading(false);
    }
  };

  const generateMockResources = () => {
    const mockResources: Resource[] = [
      {
        id: '1',
        disaster_id: disaster.id,
        name: 'Red Cross Emergency Shelter',
        location_name: 'Community Center',
        type: 'shelter',
        coordinates: { latitude: 40.7589, longitude: -73.9851 }
      },
      {
        id: '2',
        disaster_id: disaster.id,
        name: 'Mobile Medical Unit',
        location_name: 'Central Park',
        type: 'medical',
        coordinates: { latitude: 40.7829, longitude: -73.9654 }
      },
      {
        id: '3',
        disaster_id: disaster.id,
        name: 'Food Distribution Center',
        location_name: 'Local School',
        type: 'food',
        coordinates: { latitude: 40.7505, longitude: -73.9934 }
      },
      {
        id: '4',
        disaster_id: disaster.id,
        name: 'Emergency Command Post',
        location_name: 'City Hall',
        type: 'emergency',
        coordinates: { latitude: 40.7128, longitude: -74.0060 }
      }
    ];

    const filteredResources = selectedType === 'all' 
      ? mockResources 
      : mockResources.filter(r => r.type === selectedType);
    
    setResources(filteredResources);
  };

  const getResourceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shelter':
        return <Home className="h-5 w-5 text-blue-600" />;
      case 'medical':
        return <Hospital className="h-5 w-5 text-red-600" />;
      case 'food':
        return <Utensils className="h-5 w-5 text-green-600" />;
      case 'emergency':
        return <Shield className="h-5 w-5 text-purple-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  const getResourceColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'shelter':
        return 'border-blue-200 bg-blue-50';
      case 'medical':
        return 'border-red-200 bg-red-50';
      case 'food':
        return 'border-green-200 bg-green-50';
      case 'emergency':
        return 'border-purple-200 bg-purple-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <MapPin className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Nearby Resources for {disaster.title}
            </h3>
          </div>
        </div>
        
        {/* Resource Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">All Resources</option>
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-4" />
            <p className="text-gray-600">Finding nearby resources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No resources found in this area</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {resources.map((resource) => (
              <div
                key={resource.id}
                className={`p-4 rounded-lg border-2 ${getResourceColor(resource.type)} transition-all hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      {getResourceIcon(resource.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        {resource.name}
                      </h4>
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {resource.location_name}
                      </div>
                      {resource.coordinates && (
                        <p className="text-xs text-gray-500">
                          {resource.coordinates.latitude.toFixed(4)}, {resource.coordinates.longitude.toFixed(4)}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-full">
                    {resource.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};