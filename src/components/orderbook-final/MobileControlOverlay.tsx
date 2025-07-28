import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { FilterSettings, VenueType } from '@/types/orderbook';
import { VENUE_CONFIGS } from '@/utils/venueConfig';
import {
  X,
  RotateCw,
  Grid3x3,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Moon,
  Sun,
  Filter,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
  showSpread: boolean;
}

interface MobileControlOverlayProps {
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  theme: 'dark' | 'light';
  stats: {
    totalSnapshots: number;
    snapshotsPerSecond: number;
    dataRate: string;
  };
  onViewSettingsChange: (settings: ViewSettings) => void;
  onFilterSettingsChange: (settings: FilterSettings) => void;
  onThemeChange: (theme: 'dark' | 'light') => void;
  onClose: () => void;
}

const MobileControlOverlay: React.FC<MobileControlOverlayProps> = ({
  viewSettings,
  filterSettings,
  theme,
  stats,
  onViewSettingsChange,
  onFilterSettingsChange,
  onThemeChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'view' | 'filter' | 'venue'>('view');
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const timeRangeOptions = [
    { value: 60, label: '1m' },
    { value: 300, label: '5m' },
    { value: 900, label: '15m' },
    { value: 3600, label: '1h' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className={cn(
        "absolute bottom-0 left-0 right-0 max-h-[80vh] rounded-t-2xl shadow-2xl overflow-hidden",
        theme === 'dark' ? "bg-gray-900" : "bg-white"
      )}>
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between p-4 border-b",
          theme === 'dark' ? "border-gray-800" : "border-gray-200"
        )}>
          <h2 className="text-lg font-semibold">Controls</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "p-2 rounded-lg",
                theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
              )}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={onClose}
              className={cn(
                "p-2 rounded-lg",
                theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
              )}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className={cn(
          "flex border-b",
          theme === 'dark' ? "border-gray-800" : "border-gray-200"
        )}>
          {[
            { id: 'view', label: 'View', icon: Eye },
            { id: 'filter', label: 'Filter', icon: Filter },
            { id: 'venue', label: 'Venues', icon: Activity }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 transition-colors",
                activeTab === tab.id
                  ? theme === 'dark' 
                    ? "bg-gray-800 text-white" 
                    : "bg-gray-100 text-gray-900"
                  : "text-gray-500"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {/* View Tab */}
          {activeTab === 'view' && (
            <div className="space-y-4">
              {/* Quick Toggles */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onViewSettingsChange({ ...viewSettings, autoRotate: !viewSettings.autoRotate })}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg",
                    viewSettings.autoRotate
                      ? "bg-blue-600 text-white"
                      : theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}
                >
                  <RotateCw className="w-5 h-5" />
                  <span className="text-sm">Auto Rotate</span>
                </button>

                <button
                  onClick={() => onViewSettingsChange({ ...viewSettings, showGrid: !viewSettings.showGrid })}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg",
                    viewSettings.showGrid
                      ? "bg-blue-600 text-white"
                      : theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}
                >
                  <Grid3x3 className="w-5 h-5" />
                  <span className="text-sm">Grid</span>
                </button>

                <button
                  onClick={() => onViewSettingsChange({ ...viewSettings, showAxes: !viewSettings.showAxes })}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg",
                    viewSettings.showAxes
                      ? "bg-blue-600 text-white"
                      : theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}
                >
                  <Activity className="w-5 h-5" />
                  <span className="text-sm">Axes</span>
                </button>

                <button
                  onClick={() => onViewSettingsChange({ ...viewSettings, showOrderFlow: !viewSettings.showOrderFlow })}
                  className={cn(
                    "flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-lg",
                    viewSettings.showOrderFlow
                      ? "bg-blue-600 text-white"
                      : theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                  )}
                >
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Order Flow</span>
                </button>
              </div>

              {/* Camera Distance Slider */}
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium block">Camera Distance</label>
                <input
                  type="range"
                  min="15"
                  max="80"
                  value={viewSettings.cameraDistance}
                  onChange={(e) => onViewSettingsChange({ ...viewSettings, cameraDistance: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Close</span>
                  <span className="font-mono">{viewSettings.cameraDistance}</span>
                  <span>Far</span>
                </div>
              </div>

              {/* Performance Stats */}
              <div className={cn(
                "p-3 rounded-lg",
                theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
              )}>
                <h3 className="text-sm font-medium mb-2">Performance</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Snapshots:</span>
                    <span>{stats.totalSnapshots}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Updates/sec:</span>
                    <span>{stats.snapshotsPerSecond}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Data rate:</span>
                    <span>{stats.dataRate}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tab */}
          {activeTab === 'filter' && (
            <div className="space-y-4">
              {/* Visualization Options */}
              <div className="space-y-2">
                <button
                  onClick={() => onFilterSettingsChange({ ...filterSettings, showPressureZones: !filterSettings.showPressureZones })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">Pressure Zones</span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors relative flex-shrink-0",
                    filterSettings.showPressureZones ? "bg-blue-600" : "bg-gray-400"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform",
                      filterSettings.showPressureZones ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                    )} />
                  </div>
                </button>

                <button
                  onClick={() => onFilterSettingsChange({ ...filterSettings, showVolumeProfile: !filterSettings.showVolumeProfile })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-xs sm:text-sm">Volume Profile</span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors relative flex-shrink-0",
                    filterSettings.showVolumeProfile ? "bg-blue-600" : "bg-gray-400"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform",
                      filterSettings.showVolumeProfile ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                    )} />
                  </div>
                </button>

                <button
                  onClick={() => onViewSettingsChange({ ...viewSettings, showImbalance: !viewSettings.showImbalance })}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg",
                    theme === 'dark' ? "bg-gray-800" : "bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {viewSettings.showImbalance ? <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> : <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />}
                    <span className="text-xs sm:text-sm">Order Imbalance</span>
                  </div>
                  <div className={cn(
                    "w-10 h-5 sm:w-12 sm:h-6 rounded-full transition-colors relative flex-shrink-0",
                    viewSettings.showImbalance ? "bg-blue-600" : "bg-gray-400"
                  )}>
                    <div className={cn(
                      "absolute top-0.5 left-0.5 w-4 h-4 sm:w-5 sm:h-5 bg-white rounded-full transition-transform",
                      viewSettings.showImbalance ? "translate-x-5 sm:translate-x-6" : "translate-x-0"
                    )} />
                  </div>
                </button>
              </div>

              {/* Time Range */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Time Range
                </h3>
                <div className="grid grid-cols-4 gap-2">
                  {timeRangeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => onFilterSettingsChange({ ...filterSettings, timeRange: option.value })}
                      className={cn(
                        "py-2 rounded-lg text-sm",
                        filterSettings.timeRange === option.value
                          ? "bg-blue-600 text-white"
                          : theme === 'dark' ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Venue Tab */}
          {activeTab === 'venue' && (
            <div className="space-y-2">
              {Object.entries(VENUE_CONFIGS).map(([venueId, config]) => (
                <label
                  key={venueId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                    theme === 'dark' ? "bg-gray-800 hover:bg-gray-750" : "bg-gray-100 hover:bg-gray-150"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={filterSettings.venues.includes(venueId as VenueType)}
                    onChange={() => {
                      const newVenues = filterSettings.venues.includes(venueId as VenueType)
                        ? filterSettings.venues.filter(v => v !== venueId)
                        : [...filterSettings.venues, venueId as VenueType];
                      onFilterSettingsChange({ ...filterSettings, venues: newVenues });
                    }}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded"
                  />
                  <div
                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs sm:text-sm font-medium">{config.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileControlOverlay;