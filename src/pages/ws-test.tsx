import React, { useEffect, useState } from 'react';

const WebSocketTest: React.FC = () => {
  const [status, setStatus] = useState('Disconnected');
  const [messages, setMessages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testWebSocket = () => {
      try {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@depth@100ms');
        
        ws.onopen = () => {
          setStatus('Connected');
          setMessages(prev => [...prev, 'WebSocket connected']);
        };
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          setMessages(prev => [...prev.slice(-19), `Received: ${data.e} at ${new Date().toLocaleTimeString()}`]);
        };
        
        ws.onerror = (error) => {
          setError('WebSocket error occurred');
          console.error('WebSocket error:', error);
        };
        
        ws.onclose = () => {
          setStatus('Disconnected');
          setMessages(prev => [...prev, 'WebSocket disconnected']);
        };
        
        return () => {
          ws.close();
        };
      } catch (err) {
        setError(`Failed to create WebSocket: ${err}`);
      }
    };
    
    return testWebSocket();
  }, []);

  return (
    <div className="p-8 bg-black min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test</h1>
      
      <div className="mb-4">
        <span className="font-semibold">Status: </span>
        <span className={status === 'Connected' ? 'text-green-500' : 'text-red-500'}>
          {status}
        </span>
      </div>
      
      {error && (
        <div className="mb-4 text-red-500">
          Error: {error}
        </div>
      )}
      
      <div className="bg-gray-900 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Messages:</h2>
        <div className="space-y-1">
          {messages.map((msg, i) => (
            <div key={i} className="text-sm text-gray-300">{msg}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WebSocketTest;