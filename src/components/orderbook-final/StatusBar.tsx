import React from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, AlertCircle, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { VenueType } from '@/types/orderbook';

interface StatusBarProps {
  symbol: string;
  isConnected: boolean;
  activeVenues: VenueType[];
  error: string | null;
  metrics: {
    midPrice: number;
    spread: number;
    bidVolume: number;
    askVolume: number;
    imbalance: number;
  };
  pressureBalance: {
    bidPressure: number;
    askPressure: number;
    imbalance: number;
    dominantSide: 'bid' | 'ask' | 'neutral';
  };
  theme: 'dark' | 'light';
  onReconnect: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({
  symbol,
  isConnected,
  activeVenues,
  error,
  metrics,
  pressureBalance,
  theme,
  onReconnect
}) => {
  // Check if mobile based on screen width
  const [isMobile, setIsMobile] = React.useState(false);
  
  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    // Mobile layout
    return (
      <div className={cn(
        "px-3 py-2 border-b",
        theme === 'dark' 
          ? "bg-gray-900 border-gray-800" 
          : "bg-white border-gray-200"
      )}>
        {/* Top row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center space-x-2">
            <h1 className={cn(
              "text-base font-bold",
              theme === 'dark' ? "text-white" : "text-gray-900"
            )}>
              {symbol}
            </h1>
            {isConnected ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
          </div>
          <div className={cn(
            "text-base font-mono font-semibold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            ${metrics.midPrice.toFixed(2)}
          </div>
        </div>
        
        {/* Bottom row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className={cn(
              metrics.imbalance > 0 ? "text-green-500" : "text-red-500"
            )}>
              {metrics.imbalance > 0 ? '↑' : '↓'} {(Math.abs(metrics.imbalance) * 100).toFixed(1)}%
            </span>
            <span className={cn(
              theme === 'dark' ? "text-gray-500" : "text-gray-500"
            )}>
              Spread: ${metrics.spread.toFixed(2)}
            </span>
          </div>
          <span className={cn(
            "flex items-center space-x-1",
            pressureBalance.dominantSide === 'bid' ? "text-green-500" :
            pressureBalance.dominantSide === 'ask' ? "text-red-500" :
            theme === 'dark' ? "text-gray-500" : "text-gray-500"
          )}>
            <Activity className="w-3 h-3" />
            <span>{pressureBalance.dominantSide.toUpperCase()}</span>
          </span>
        </div>
        
        {/* Error display */}
        {error && (
          <div className="flex items-center justify-between mt-1 text-xs text-red-500">
            <span className="flex items-center space-x-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </span>
            <button
              onClick={onReconnect}
              className="underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop layout
  return (
    <div className={cn(
      "flex items-center justify-between px-4 py-2 border-b",
      theme === 'dark' 
        ? "bg-gray-900 border-gray-800" 
        : "bg-white border-gray-200"
    )}>
      {/* Left section */}
      <div className="flex items-center space-x-4">
        {/* Symbol and connection status */}
        <div className="flex items-center space-x-2">
          <h1 className={cn(
            "text-lg font-bold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            {symbol}
          </h1>
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
          <span className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {activeVenues.join(', ') || 'No venues'}
          </span>
        </div>

        {/* Error display */}
        {error && (
          <div className="flex items-center space-x-2 text-red-500">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
            <button
              onClick={onReconnect}
              className="text-xs underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Center section - Metrics */}
      <div className="flex items-center space-x-6">
        {/* Mid Price */}
        <div className="text-center">
          <div className={cn(
            "text-xs",
            theme === 'dark' ? "text-gray-500" : "text-gray-500"
          )}>
            Mid Price
          </div>
          <div className={cn(
            "text-lg font-mono font-semibold",
            theme === 'dark' ? "text-white" : "text-gray-900"
          )}>
            ${metrics.midPrice.toFixed(2)}
          </div>
        </div>

        {/* Spread */}
        <div className="text-center">
          <div className={cn(
            "text-xs",
            theme === 'dark' ? "text-gray-500" : "text-gray-500"
          )}>
            Spread
          </div>
          <div className={cn(
            "text-lg font-mono",
            theme === 'dark' ? "text-gray-300" : "text-gray-700"
          )}>
            ${metrics.spread.toFixed(2)}
          </div>
        </div>

        {/* Imbalance */}
        <div className="text-center">
          <div className={cn(
            "text-xs",
            theme === 'dark' ? "text-gray-500" : "text-gray-500"
          )}>
            Imbalance
          </div>
          <div className={cn(
            "text-lg font-mono flex items-center justify-center space-x-1",
            metrics.imbalance > 0 ? "text-green-500" : "text-red-500"
          )}>
            <span>{(metrics.imbalance * 100).toFixed(1)}%</span>
            {metrics.imbalance > 0.1 ? (
              <TrendingUp className="w-4 h-4" />
            ) : metrics.imbalance < -0.1 ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
          </div>
        </div>
      </div>

      {/* Right section - Pressure Balance */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span className={cn(
            "text-sm",
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            Pressure:
          </span>
          <span className={cn(
            "text-sm font-semibold",
            pressureBalance.dominantSide === 'bid' ? "text-green-500" :
            pressureBalance.dominantSide === 'ask' ? "text-red-500" :
            theme === 'dark' ? "text-gray-400" : "text-gray-600"
          )}>
            {pressureBalance.dominantSide.toUpperCase()} {(pressureBalance.imbalance * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;