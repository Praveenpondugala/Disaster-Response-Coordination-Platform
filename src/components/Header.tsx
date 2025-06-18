import React from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  activeDisasters: number;
}

export const Header: React.FC<HeaderProps> = ({ isConnected, activeDisasters }) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Disaster Response Platform
              </h1>
              <p className="text-sm text-gray-600">
                Real-time coordination and emergency management
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                {activeDisasters} Active Disasters
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <>
                  <Wifi className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-600 font-medium">Connected</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-5 w-5 text-red-600" />
                  <span className="text-sm text-red-600 font-medium">Disconnected</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};