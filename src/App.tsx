import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { io, Socket } from 'socket.io-client';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeDisasters, setActiveDisasters] = useState(0);

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

    // Fetch initial disaster count
    fetchDisasterCount();

    return () => {
      newSocket.close();
    };
  }, []);

  const fetchDisasterCount = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/disasters', {
        headers: {
          'Authorization': 'Bearer mock-token',
          'X-User-ID': 'netrunnerX'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveDisasters(data.disasters?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch disaster count:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        isConnected={isConnected} 
        activeDisasters={activeDisasters}
      />
      <Dashboard />
    </div>
  );
}

export default App;