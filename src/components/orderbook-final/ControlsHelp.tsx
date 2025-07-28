import React from 'react';
import { cn } from '@/lib/utils';
import { X, Mouse, Smartphone, Info, Keyboard } from 'lucide-react';

interface ControlsHelpProps {
  theme: 'dark' | 'light';
  onClose: () => void;
}

const ControlsHelp: React.FC<ControlsHelpProps> = ({ theme, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className={cn(
        "relative max-w-lg w-full rounded-lg shadow-2xl p-6",
        theme === 'dark' ? "bg-gray-900 text-white" : "bg-white text-gray-900"
      )}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Info className="w-5 h-5" />
            Navigation Controls
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              theme === 'dark' ? "hover:bg-gray-800" : "hover:bg-gray-100"
            )}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Mouse Controls */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Mouse className="w-5 h-5" />
              Mouse Controls
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                <span className="font-medium">Left Click + Drag</span>
                <span className="text-gray-500">Rotate camera</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
                <span className="font-medium">Right Click + Drag</span>
                <span className="text-gray-500">Pan camera</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }}>
                <span className="font-medium">Scroll Wheel</span>
                <span className="text-gray-500">Zoom in/out</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(251, 146, 60, 0.1)' : 'rgba(251, 146, 60, 0.05)' }}>
                <span className="font-medium">Middle Click + Drag</span>
                <span className="text-gray-500">Zoom (alternative)</span>
              </div>
            </div>
          </div>
          
          {/* Touch Controls */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Touch Controls
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                <span className="font-medium">One Finger Drag</span>
                <span className="text-gray-500">Rotate camera</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.05)' }}>
                <span className="font-medium">Two Finger Drag</span>
                <span className="text-gray-500">Pan camera</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }}>
                <span className="font-medium">Pinch</span>
                <span className="text-gray-500">Zoom in/out</span>
              </div>
            </div>
          </div>
          
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Keyboard className="w-5 h-5" />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)' }}>
                <span className="font-mono font-medium">H</span>
                <span className="text-gray-500">Toggle Help</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.05)' }}>
                <span className="font-mono font-medium">R</span>
                <span className="text-gray-500">Auto-Rotate</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)' }}>
                <span className="font-mono font-medium">G</span>
                <span className="text-gray-500">Toggle Grid</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)' }}>
                <span className="font-mono font-medium">A</span>
                <span className="text-gray-500">Toggle Axes</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(168, 85, 247, 0.05)' }}>
                <span className="font-mono font-medium">S</span>
                <span className="text-gray-500">Show Stats</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(236, 72, 153, 0.05)' }}>
                <span className="font-mono font-medium">T</span>
                <span className="text-gray-500">Toggle Theme</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-opacity-50 col-span-2"
                style={{ backgroundColor: theme === 'dark' ? 'rgba(107, 114, 128, 0.1)' : 'rgba(107, 114, 128, 0.05)' }}>
                <span className="font-mono font-medium">ESC</span>
                <span className="text-gray-500">Close overlays</span>
              </div>
            </div>
          </div>
          
          {/* Tips */}
          <div className={cn(
            "p-4 rounded-lg text-sm",
            theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
          )}>
            <p className="font-medium mb-1">💡 Tips:</p>
            <ul className="space-y-1 text-gray-500">
              <li>• Double-click to reset camera position</li>
              <li>• Use smooth scroll for precise zoom control</li>
              <li>• Hold Shift while scrolling for slower zoom</li>
              <li>• The visualization auto-adapts to your screen size</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControlsHelp;