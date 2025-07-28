import React from "react";
import { cn } from "@/lib/utils";
import { FilterSettings, VenueType } from "@/types/orderbook";
import { VENUE_CONFIGS } from "@/utils/venueConfig";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
  Layers,
  Sparkles,
  Move,
  Zap,
  GitBranch,
  Box,
} from "lucide-react";

interface ViewSettings {
  autoRotate: boolean;
  showGrid: boolean;
  showAxes: boolean;
  cameraDistance: number;
  showOrderFlow: boolean;
  showImbalance: boolean;
  showSpread: boolean;
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
          "relative h-full transition-all duration-300 flex-shrink-0 shadow-2xl",
          isCollapsed ? "w-16" : "w-80",
          theme === "dark"
            ? "bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white border-l border-gray-800"
            : "bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 border-l border-gray-200"
        )}
      >
        <div
          className={cn(
            "h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent",
            isCollapsed ? "p-2" : "p-6"
          )}
        >
          {!isCollapsed ? (
            <>
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
                    Control Center
                  </h2>
                  <button
                    onClick={() =>
                      onThemeChange(theme === "dark" ? "light" : "dark")
                    }
                    className={cn(
                      "p-2.5 rounded-xl transition-all transform hover:scale-110",
                      theme === "dark"
                        ? "bg-gray-800 hover:bg-gray-700 shadow-lg"
                        : "bg-white hover:bg-gray-50 shadow-md"
                    )}
                  >
                    {theme === "dark" ? (
                      <Sun className="w-5 h-5 text-yellow-400" />
                    ) : (
                      <Moon className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Customize your 3D orderbook visualization
                </p>
              </div>

              {/* View Controls */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    View Controls
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleViewToggle("autoRotate")}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105",
                      viewSettings.autoRotate
                        ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
                        : theme === "dark"
                        ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    )}
                  >
                    <RotateCw className={cn(
                      "w-4 h-4",
                      viewSettings.autoRotate && "animate-spin"
                    )} />
                    <span>Rotate</span>
                  </button>

                  <button
                    onClick={() => handleViewToggle("showGrid")}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105",
                      viewSettings.showGrid
                        ? "bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/25"
                        : theme === "dark"
                        ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    )}
                  >
                    <Grid3x3 className="w-4 h-4" />
                    <span>Grid</span>
                  </button>

                  <button
                    onClick={() => handleViewToggle("showAxes")}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105",
                      viewSettings.showAxes
                        ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/25"
                        : theme === "dark"
                        ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    )}
                  >
                    <Move className="w-4 h-4" />
                    <span>Axes</span>
                  </button>

                  <button
                    onClick={() => handleViewToggle("showSpread")}
                    className={cn(
                      "relative flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105",
                      viewSettings.showSpread
                        ? "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white shadow-lg shadow-yellow-500/25"
                        : theme === "dark"
                        ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                        : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                    )}
                  >
                    <GitBranch className="w-4 h-4" />
                    <span>Spread</span>
                  </button>
                </div>
                
                {/* Zoom Slider */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Camera Distance</span>
                    <span className="text-xs font-medium px-2 py-1 rounded bg-gray-100 dark:bg-gray-800">
                      {viewSettings.cameraDistance}
                    </span>
                  </div>
                  <div className="px-2">
                    <Slider
                      min={20}
                      max={100}
                      step={5}
                      value={[viewSettings.cameraDistance]}
                      onValueChange={(value) =>
                        onViewSettingsChange({
                          ...viewSettings,
                          cameraDistance: value[0],
                        })
                      }
                      className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
                    />
                  </div>
                  <div className="flex justify-between mt-2 px-2">
                    <ZoomIn className="w-3 h-3 text-gray-400" />
                    <ZoomOut className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              </section>

              {/* Venue Filter */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Layers className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Data Sources
                  </h3>
                </div>
                <div className="space-y-3">
                  {Object.entries(VENUE_CONFIGS).map(([venueId, config]) => (
                    <label
                      key={venueId}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all transform hover:scale-105",
                        filterSettings.venues.includes(venueId as VenueType)
                          ? theme === "dark"
                            ? "bg-gray-800/80 backdrop-blur-sm shadow-lg"
                            : "bg-white shadow-md"
                          : theme === "dark"
                          ? "hover:bg-gray-800/50"
                          : "hover:bg-gray-50"
                      )}
                    >
                      <Checkbox
                        checked={filterSettings.venues.includes(
                          venueId as VenueType
                        )}
                        onCheckedChange={() => handleVenueToggle(venueId as VenueType)}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                      <div
                        className="w-3 h-3 rounded-full shadow-sm"
                        style={{ backgroundColor: config.color }}
                      />
                      <span className="text-sm font-medium flex-1">{config.name}</span>
                      {filterSettings.venues.includes(venueId as VenueType) && (
                        <Sparkles className="w-3 h-3 text-blue-500" />
                      )}
                    </label>
                  ))}
                </div>
              </section>

              {/* Time Range */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-4 h-4 text-green-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Time Window
                  </h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
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
                        "px-4 py-3 rounded-xl text-sm font-medium transition-all transform hover:scale-105",
                        filterSettings.timeRange === option.value
                          ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/25"
                          : theme === "dark"
                          ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                          : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Visualization Options */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Enhanced Features
                  </h3>
                </div>
                <div className="space-y-3">
                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                      filterSettings.showPressureZones
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-800/50"
                          : "bg-gradient-to-r from-red-50 to-orange-50 border border-red-200"
                        : theme === "dark"
                        ? "hover:bg-gray-800/50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={filterSettings.showPressureZones}
                      onCheckedChange={(checked) =>
                        onFilterSettingsChange({
                          ...filterSettings,
                          showPressureZones: checked as boolean,
                        })
                      }
                      className="data-[state=checked]:bg-red-600 data-[state=checked]:border-red-600"
                    />
                    <Activity className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Pressure Zones</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                      filterSettings.showVolumeProfile
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-800/50"
                          : "bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200"
                        : theme === "dark"
                        ? "hover:bg-gray-800/50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={filterSettings.showVolumeProfile}
                      onCheckedChange={(checked) =>
                        onFilterSettingsChange({
                          ...filterSettings,
                          showVolumeProfile: checked as boolean,
                        })
                      }
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Volume Profile</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                      viewSettings.showOrderFlow
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-green-900/20 to-teal-900/20 border border-green-800/50"
                          : "bg-gradient-to-r from-green-50 to-teal-50 border border-green-200"
                        : theme === "dark"
                        ? "hover:bg-gray-800/50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={viewSettings.showOrderFlow}
                      onCheckedChange={() => handleViewToggle("showOrderFlow")}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Order Flow</span>
                  </label>

                  <label
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all",
                      viewSettings.showImbalance
                        ? theme === "dark"
                          ? "bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800/50"
                          : "bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
                        : theme === "dark"
                        ? "hover:bg-gray-800/50"
                        : "hover:bg-gray-50"
                    )}
                  >
                    <Checkbox
                      checked={viewSettings.showImbalance}
                      onCheckedChange={() => handleViewToggle("showImbalance")}
                      className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                    />
                    {viewSettings.showImbalance ? (
                      <Eye className="w-4 h-4 text-purple-500" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-purple-500" />
                    )}
                    <span className="text-sm font-medium">Order Imbalance</span>
                  </label>
                </div>
              </section>

              {/* Performance Stats */}
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Performance
                  </h3>
                </div>
                <div className={cn(
                  "p-4 rounded-xl space-y-3",
                  theme === "dark"
                    ? "bg-gray-800/50 backdrop-blur-sm"
                    : "bg-gray-50"
                )}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Snapshots</span>
                    <span className="text-sm font-mono font-medium">{stats.totalSnapshots}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Updates/sec</span>
                    <span className="text-sm font-mono font-medium text-green-500">{stats.snapshotsPerSecond}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Data rate</span>
                    <span className="text-sm font-mono font-medium text-blue-500">{stats.dataRate}</span>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleExport}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105",
                    "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-green-500/25 hover:shadow-green-500/40"
                  )}
                >
                  <Download className="w-4 h-4" />
                  Export Settings
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all transform hover:scale-105",
                    theme === "dark"
                      ? "bg-gray-800/80 text-gray-400 hover:bg-gray-700/80 backdrop-blur-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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