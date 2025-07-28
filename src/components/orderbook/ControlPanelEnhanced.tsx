import React from 'react';
import { FilterSettings, VenueType } from '@/types/orderbook';
import { VENUE_CONFIGS } from '@/utils/venueConfig';
import { 
  RotateCw, 
  Grid3x3, 
  ZoomIn, 
  ZoomOut, 
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Filter
} from 'lucide-react';

interface ControlPanelEnhancedProps {
  settings: FilterSettings;
  onSettingsChange: (updates: Partial<FilterSettings>) => void;
  autoRotate: boolean;
  onAutoRotateToggle: () => void;
  showGrid: boolean;
  onGridToggle: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  showOrderFlow: boolean;
  onOrderFlowToggle: () => void;
  showImbalance: boolean;
  onImbalanceToggle: () => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  onExport: () => void;
}

const ControlPanelEnhanced: React.FC<ControlPanelEnhancedProps> = ({
  settings,
  onSettingsChange,
  autoRotate,
  onAutoRotateToggle,
  showGrid,
  onGridToggle,
  onZoomIn,
  onZoomOut,
  onReset,
  showOrderFlow,
  onOrderFlowToggle,
  showImbalance,
  onImbalanceToggle,
  theme,
  onThemeToggle,
  onExport
}) => {
  const timeRangeOptions = [
    { value: 60, label: '1 min' },
    { value: 300, label: '5 min' },
    { value: 900, label: '15 min' },
    { value: 3600, label: '1 hour' }
  ];

  const handleVenueToggle = (venueId: VenueType) => {
    const newVenues = settings.venues.includes(venueId)
      ? settings.venues.filter(v => v !== venueId)
      : [...settings.venues, venueId];
    
    onSettingsChange({ venues: newVenues });
  };

  const handlePriceRangeChange = (index: number, value: string) => {
    const newRange: [number, number] = [...settings.priceRange];
    newRange[index] = parseFloat(value) || 0;
    onSettingsChange({ priceRange: newRange });
  };

  return (
    <div className={`w-80 h-full ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'} p-4 overflow-y-auto`}>
      <h2 className={`text-xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Control Panel
      </h2>

      {/* View Controls */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          View Controls
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onAutoRotateToggle}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              autoRotate 
                ? 'bg-blue-600 text-white' 
                : theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-sm">Auto Rotate</span>
          </button>
          
          <button
            onClick={onGridToggle}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              showGrid 
                ? 'bg-blue-600 text-white' 
                : theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
            <span className="text-sm">Grid</span>
          </button>
          
          <button
            onClick={onZoomIn}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } transition-colors`}
          >
            <ZoomIn className="w-4 h-4" />
            <span className="text-sm">Zoom In</span>
          </button>
          
          <button
            onClick={onZoomOut}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            } transition-colors`}
          >
            <ZoomOut className="w-4 h-4" />
            <span className="text-sm">Zoom Out</span>
          </button>
        </div>
      </div>

      {/* Venue Filter */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Venues
        </h3>
        <div className="space-y-2">
          {Object.entries(VENUE_CONFIGS).map(([venueId, config]) => (
            <label
              key={venueId}
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg ${
                theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
              } transition-colors`}
            >
              <input
                type="checkbox"
                checked={settings.venues.includes(venueId as VenueType)}
                onChange={() => handleVenueToggle(venueId as VenueType)}
                className="w-4 h-4"
              />
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {config.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Time Range */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Clock className="inline w-4 h-4 mr-1" />
          Time Range
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onSettingsChange({ timeRange: option.value })}
              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                settings.timeRange === option.value
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark' ? 'bg-gray-800 text-gray-400' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Filter className="inline w-4 h-4 mr-1" />
          Price Range
        </h3>
        <div className="space-y-2">
          <input
            type="number"
            value={settings.priceRange[0]}
            onChange={(e) => handlePriceRangeChange(0, e.target.value)}
            placeholder="Min price"
            className={`w-full px-3 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white border-gray-700' 
                : 'bg-white text-gray-900 border-gray-300'
            } border`}
          />
          <input
            type="number"
            value={settings.priceRange[1]}
            onChange={(e) => handlePriceRangeChange(1, e.target.value)}
            placeholder="Max price"
            className={`w-full px-3 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-gray-800 text-white border-gray-700' 
                : 'bg-white text-gray-900 border-gray-300'
            } border`}
          />
        </div>
      </div>

      {/* Quantity Threshold */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Quantity Threshold
        </h3>
        <input
          type="number"
          value={settings.quantityThreshold}
          onChange={(e) => onSettingsChange({ quantityThreshold: parseFloat(e.target.value) || 0 })}
          placeholder="Min quantity"
          className={`w-full px-3 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 text-white border-gray-700' 
              : 'bg-white text-gray-900 border-gray-300'
          } border`}
        />
      </div>

      {/* Visualization Options */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Visualization Options
        </h3>
        <div className="space-y-2">
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          } transition-colors`}>
            <input
              type="checkbox"
              checked={settings.showPressureZones}
              onChange={(e) => onSettingsChange({ showPressureZones: e.target.checked })}
              className="w-4 h-4"
            />
            <Activity className="w-4 h-4" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Pressure Zones
            </span>
          </label>
          
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          } transition-colors`}>
            <input
              type="checkbox"
              checked={settings.showVolumeProfile}
              onChange={(e) => onSettingsChange({ showVolumeProfile: e.target.checked })}
              className="w-4 h-4"
            />
            <BarChart3 className="w-4 h-4" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Volume Profile
            </span>
          </label>
          
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          } transition-colors`}>
            <input
              type="checkbox"
              checked={showOrderFlow}
              onChange={onOrderFlowToggle}
              className="w-4 h-4"
            />
            <TrendingUp className="w-4 h-4" />
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Order Flow
            </span>
          </label>
          
          <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg ${
            theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
          } transition-colors`}>
            <input
              type="checkbox"
              checked={showImbalance}
              onChange={onImbalanceToggle}
              className="w-4 h-4"
            />
            {showImbalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Order Imbalance
            </span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <button
          onClick={onThemeToggle}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          } transition-colors`}
        >
          {theme === 'dark' ? '🌞' : '🌙'}
          <span className="text-sm">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        
        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
        >
          <span className="text-sm">Export Snapshot</span>
        </button>
        
        <button
          onClick={onReset}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="text-sm">Reset All</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanelEnhanced;