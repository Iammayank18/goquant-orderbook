import React from 'react';
import { cn } from '@/lib/utils';

interface LegendProps {
  theme: 'dark' | 'light';
  metrics?: {
    midPrice: number;
    spread: number;
    bidVolume: number;
    askVolume: number;
    imbalance: number;
  };
}

const Legend: React.FC<LegendProps> = ({ theme, metrics }) => {
  return (
    <div className={cn(
      "absolute top-4 left-4 p-4 rounded-lg backdrop-blur-sm shadow-lg",
      theme === 'dark' ? "bg-gray-900/90 text-white" : "bg-white/90 text-gray-900"
    )}>
      <h3 className="text-sm font-semibold mb-3">Order Book Visualization</h3>
      
      {/* Color Legend */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Bid Orders (Buy)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Ask Orders (Sell)</span>
        </div>
      </div>
      
      {/* Axis Explanation */}
      <div className="mt-4 pt-3 border-t border-gray-600 space-y-1 text-xs">
        <div className="font-semibold mb-1">Dimensions:</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">X-Axis:</span>
          <span>Price Level</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Y-Axis:</span>
          <span>Quantity (Log Scale)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Z-Axis:</span>
          <span>Time Progression</span>
        </div>
      </div>
      
      {/* Current Metrics */}
      {metrics && (
        <div className="mt-4 pt-3 border-t border-gray-600 space-y-1 text-xs">
          <div className="font-semibold mb-1">Current Market:</div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Mid Price:</span>
            <span>${metrics.midPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Spread:</span>
            <span>${metrics.spread.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Imbalance:</span>
            <span className={cn(
              "font-medium",
              metrics.imbalance > 0.1 ? "text-green-400" : 
              metrics.imbalance < -0.1 ? "text-red-400" : "text-gray-400"
            )}>
              {(metrics.imbalance * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}
      
      {/* Instructions */}
      <div className="mt-4 pt-3 border-t border-gray-600 text-xs text-gray-500">
        <div>• Hover over bars for details</div>
        <div>• Press H for navigation help</div>
        <div>• Taller bars = More volume</div>
        <div>• Opacity indicates depth level</div>
      </div>
    </div>
  );
};

export default Legend;