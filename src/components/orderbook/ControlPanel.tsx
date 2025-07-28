import React from 'react';
import { FilterSettings, VenueType } from '@/types/orderbook';
import VenueFilter from './VenueFilter';
import { 
  RotateCw, 
  Grid3x3, 
  Activity, 
  Layers, 
  Clock,
  Settings,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface ControlPanelProps {
  settings: FilterSettings;
  onSettingsChange: (settings: Partial<FilterSettings>) => void;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onSettingsChange,
  autoRotate,
  onAutoRotateToggle,
  showGrid,
  onGridToggle,
  onZoomIn,
  onZoomOut,
  onReset
}) => {
  const timeRangeOptions = [
    { value: 60, label: '1 min' },
    { value: 300, label: '5 min' },
    { value: 900, label: '15 min' },
    { value: 3600, label: '1 hour' }
  ];

  return (
    <div className="w-80 bg-gray-900 border-l border-gray-800 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Controls
        </h2>
        <button
          onClick={onReset}
          className="text-gray-400 hover:text-white text-sm"
        >
          Reset
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={onAutoRotateToggle}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
              autoRotate
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            Auto Rotate
          </button>
          
          <button
            onClick={onGridToggle}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md transition-all ${
              showGrid
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            Grid
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onZoomIn}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={onZoomOut}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <VenueFilter
          selectedVenues={settings.venues}
          onVenueToggle={(venue: VenueType) => {
            const newVenues = settings.venues.includes(venue)
              ? settings.venues.filter(v => v !== venue)
              : [...settings.venues, venue];
            onSettingsChange({ venues: newVenues });
          }}
        />
      </div>

      <div className="border-t border-gray-800 pt-4 space-y-4">
        <div>
          <label className="text-gray-400 text-sm mb-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Range
          </label>
          <select
            value={settings.timeRange}
            onChange={(e) => onSettingsChange({ timeRange: Number(e.target.value) })}
            className="w-full bg-gray-800 text-white rounded-md px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-gray-400 text-sm mb-2 block">
            Quantity Threshold
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.quantityThreshold}
            onChange={(e) => onSettingsChange({ quantityThreshold: Number(e.target.value) })}
            className="w-full"
          />
          <div className="text-gray-500 text-xs mt-1">
            {settings.quantityThreshold}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showPressureZones}
              onChange={(e) => onSettingsChange({ showPressureZones: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Show Pressure Zones
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showVolumeProfile}
              onChange={(e) => onSettingsChange({ showVolumeProfile: e.target.checked })}
              className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
            />
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Show Volume Profile
            </span>
          </label>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4">
        <h3 className="text-white text-sm font-semibold mb-2">Price Range</h3>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            value={settings.priceRange[0]}
            onChange={(e) => onSettingsChange({ 
              priceRange: [Number(e.target.value), settings.priceRange[1]] 
            })}
            className="flex-1 bg-gray-800 text-white rounded-md px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          />
          <input
            type="number"
            placeholder="Max"
            value={settings.priceRange[1]}
            onChange={(e) => onSettingsChange({ 
              priceRange: [settings.priceRange[0], Number(e.target.value)] 
            })}
            className="flex-1 bg-gray-800 text-white rounded-md px-3 py-2 border border-gray-700 focus:border-blue-500 focus:outline-none text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default ControlPanel;