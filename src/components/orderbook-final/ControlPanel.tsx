import React from "react";
import { cn } from "@/lib/utils";
import { FilterSettings, VenueType } from "@/types/orderbook";
import { VENUE_CONFIGS } from "@/utils/venueConfig";
import {
  RotateCw,
  Grid3x3,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Activity,
  BarChart3,
  TrendingUp,
  Clock,
  Filter,
  Moon,
  Sun,
  Download,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
}

interface ControlPanelProps {
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  theme: "dark" | "light";
  stats: {
    totalSnapshots: number;
    snapshotsPerSecond: number;
    dataRate: string;
  };
  onViewSettingsChange: (settings: ViewSettings) => void;
  onFilterSettingsChange: (settings: FilterSettings) => void;
  onThemeChange: (theme: "dark" | "light") => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  viewSettings,
  filterSettings,
  theme,
  stats,
  onViewSettingsChange,
  onFilterSettingsChange,
  onThemeChange,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const timeRangeOptions = [
    { value: 60, label: "1 min" },
    { value: 300, label: "5 min" },
    { value: 900, label: "15 min" },
    { value: 3600, label: "1 hour" },
  ];

  const handleViewToggle = (key: keyof ViewSettings) => {
    if (typeof viewSettings[key] === "boolean") {
      onViewSettingsChange({ ...viewSettings, [key]: !viewSettings[key] });
    }
  };

  const handleVenueToggle = (venue: VenueType) => {
    const newVenues = filterSettings.venues.includes(venue)
      ? filterSettings.venues.filter((v) => v !== venue)
      : [...filterSettings.venues, venue];
    onFilterSettingsChange({ ...filterSettings, venues: newVenues });
  };

  const handleExport = () => {
    const exportData = {
      timestamp: Date.now(),
      viewSettings,
      filterSettings,
      stats,
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orderbook-settings-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Collapse Toggle - Outside the panel */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 p-2 rounded-lg shadow-lg transition-all hover:scale-110",
          theme === "dark"
            ? "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700"
            : "bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
        )}
        style={{
          right: isCollapsed ? "16px" : "320px",
          transform: "translateY(-50%)",
        }}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-5 h-5" />
        ) : (
          <ChevronRight className="w-5 h-5" />
        )}
      </button>

      {/* Panel */}
      <div
        className={cn(
          "relative h-full transition-all duration-300 border-l flex-shrink-0",
          isCollapsed ? "w-16" : "w-80",
          theme === "dark"
            ? "bg-gray-900 text-white border-gray-800"
            : "bg-white text-gray-900 border-gray-200"
        )}
      >
        <div
          className={cn("h-full overflow-y-auto", isCollapsed ? "p-2" : "p-4")}
        >
          {!isCollapsed ? (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Controls
                </h2>
                <button
                  onClick={() =>
                    onThemeChange(theme === "dark" ? "light" : "dark")
                  }
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  )}
                >
                  {theme === "dark" ? (
                    <Sun className="w-4 h-4" />
                  ) : (
                    <Moon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* View Controls */}
              <section className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-500">
                  View Controls
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleViewToggle("autoRotate")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      viewSettings.autoRotate
                        ? "bg-blue-600 text-white"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <RotateCw className="w-4 h-4" />
                    Auto Rotate
                  </button>

                  <button
                    onClick={() => handleViewToggle("showGrid")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      viewSettings.showGrid
                        ? "bg-blue-600 text-white"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    Grid
                  </button>

                  <button
                    onClick={() => handleViewToggle("showAxes")}
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      viewSettings.showAxes
                        ? "bg-blue-600 text-white"
                        : theme === "dark"
                        ? "bg-gray-800 text-gray-400"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    <Activity className="w-4 h-4" />
                    Axes
                  </button>

                  <button
                    onClick={() =>
                      onViewSettingsChange({
                        ...viewSettings,
                        cameraDistance: Math.max(
                          20,
                          viewSettings.cameraDistance - 10
                        ),
                      })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      theme === "dark"
                        ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <ZoomIn className="w-4 h-4" />
                    Zoom In
                  </button>

                  <button
                    onClick={() =>
                      onViewSettingsChange({
                        ...viewSettings,
                        cameraDistance: Math.min(
                          100,
                          viewSettings.cameraDistance + 10
                        ),
                      })
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      theme === "dark"
                        ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    )}
                  >
                    <ZoomOut className="w-4 h-4" />
                    Zoom Out
                  </button>
                </div>
              </section>

              {/* Venue Filter */}
              <section className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-500">
                  Trading Venues
                </h3>
                <div className="space-y-2">
                  {Object.entries(VENUE_CONFIGS).map(([venueId, config]) => (
                    <label
                      key={venueId}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                        theme === "dark"
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-100"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={filterSettings.venues.includes(
                          venueId as VenueType
                        )}
                        onChange={() => handleVenueToggle(venueId as VenueType)}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm">{config.name}</span>
                    </label>
                  ))}
                </div>
              </section>

              {/* Time Range */}
              <section className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Time Range
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        onFilterSettingsChange({
                          ...filterSettings,
                          timeRange: option.value,
                        })
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-colors",
                        filterSettings.timeRange === option.value
                          ? "bg-blue-600 text-white"
                          : theme === "dark"
                          ? "bg-gray-800 text-gray-400"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Visualization Options */}
              <section className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-500">
                  Visualization Options
                </h3>
                <div className="space-y-2">
                  <label
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      theme === "dark"
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={filterSettings.showPressureZones}
                      onChange={(e) =>
                        onFilterSettingsChange({
                          ...filterSettings,
                          showPressureZones: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Pressure Zones</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      theme === "dark"
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={filterSettings.showVolumeProfile}
                      onChange={(e) =>
                        onFilterSettingsChange({
                          ...filterSettings,
                          showVolumeProfile: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-sm">Volume Profile</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      theme === "dark"
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={viewSettings.showOrderFlow}
                      onChange={() => handleViewToggle("showOrderFlow")}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm">Order Flow</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                      theme === "dark"
                        ? "hover:bg-gray-800"
                        : "hover:bg-gray-100"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={viewSettings.showImbalance}
                      onChange={() => handleViewToggle("showImbalance")}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    {viewSettings.showImbalance ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                    <span className="text-sm">Order Imbalance</span>
                  </label>
                </div>
              </section>

              {/* Performance Stats */}
              <section className="mb-6">
                <h3 className="text-sm font-medium mb-3 text-gray-500">
                  Performance
                </h3>
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
              </section>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleExport}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    "bg-green-600 text-white hover:bg-green-700"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Export Settings
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors",
                    "bg-red-600 text-white hover:bg-red-700"
                  )}
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset All
                </button>
              </div>
            </>
          ) : (
            /* Collapsed View */
            <div className="flex flex-col items-center space-y-4 pt-20">
              <div className="w-1 h-20 bg-gradient-to-b from-transparent via-gray-500 to-transparent opacity-50 mb-4" />
              <button
                onClick={() => handleViewToggle("autoRotate")}
                className={cn(
                  "p-2 rounded-lg transition-all hover:scale-110",
                  viewSettings.autoRotate
                    ? "bg-blue-600 text-white"
                    : theme === "dark"
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                )}
                title="Auto Rotate"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleViewToggle("showGrid")}
                className={cn(
                  "p-2 rounded-lg transition-all hover:scale-110",
                  viewSettings.showGrid
                    ? "bg-blue-600 text-white"
                    : theme === "dark"
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                )}
                title="Toggle Grid"
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  onThemeChange(theme === "dark" ? "light" : "dark")
                }
                className={cn(
                  "p-2 rounded-lg transition-all hover:scale-110",
                  theme === "dark"
                    ? "bg-gray-800 text-gray-400"
                    : "bg-gray-100 text-gray-600"
                )}
                title="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
              <div className="w-1 h-20 bg-gradient-to-b from-transparent via-gray-500 to-transparent opacity-50 mt-4" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ControlPanel;
