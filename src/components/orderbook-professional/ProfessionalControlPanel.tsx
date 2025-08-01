import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FilterSettings, VenueType } from "@/types/orderbook";
import { VENUE_CONFIGS } from "@/utils/venueConfig";
import { cn } from "@/lib/utils";
import {
  Eye,
  Grid3x3,
  RotateCw,
  Activity,
  Layers,
  Zap,
  GitBranch,
  BarChart3,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Save,
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

interface ProfessionalControlPanelProps {
  viewSettings: ViewSettings;
  filterSettings: FilterSettings;
  stats: {
    totalSnapshots: number;
    snapshotsPerSecond: number;
    bytesProcessed: number;
    messagesProcessed: number;
  };
  onViewSettingsChange: (settings: ViewSettings) => void;
  onFilterSettingsChange: (settings: FilterSettings) => void;
}

const ProfessionalControlPanel: React.FC<ProfessionalControlPanelProps> = ({
  viewSettings,
  filterSettings,
  stats,
  onViewSettingsChange,
  onFilterSettingsChange,
}) => {
  const handleViewToggle = (key: keyof ViewSettings) => {
    if (typeof viewSettings[key] === "boolean") {
      onViewSettingsChange({ ...viewSettings, [key]: !viewSettings[key] });
    }
  };

  const handleVenueToggle = (venue: VenueType) => {
    const newVenues = filterSettings.venues.includes(venue)
      ? filterSettings.venues.filter((v) => v !== venue)
      : [...filterSettings.venues, venue];

    if (newVenues.length > 0) {
      onFilterSettingsChange({ ...filterSettings, venues: newVenues });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4 bg-muted/50">
        <TabsTrigger value="view">View</TabsTrigger>
        <TabsTrigger value="filter">Filter</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
      </TabsList>

      <TabsContent value="view" className="space-y-4 mt-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Display Options</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Control what elements are visible in the 3D view
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Auto Rotate */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCw className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="auto-rotate">Auto Rotate</Label>
              </div>
              <Switch
                id="auto-rotate"
                checked={viewSettings.autoRotate}
                onCheckedChange={() => handleViewToggle("autoRotate")}
              />
            </div>

            {/* Show Grid */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-grid">Show Grid</Label>
              </div>
              <Switch
                id="show-grid"
                checked={viewSettings.showGrid}
                onCheckedChange={() => handleViewToggle("showGrid")}
              />
            </div>

            {/* Show Axes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="show-axes">Show Axes</Label>
              </div>
              <Switch
                id="show-axes"
                checked={viewSettings.showAxes}
                onCheckedChange={() => handleViewToggle("showAxes")}
              />
            </div>

            <Separator />

            {/* Advanced Visualizations */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Advanced Visualizations</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="order-flow">Order Flow</Label>
                </div>
                <Switch
                  id="order-flow"
                  checked={viewSettings.showOrderFlow}
                  onCheckedChange={() => handleViewToggle("showOrderFlow")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="imbalance">Imbalance Indicator</Label>
                </div>
                <Switch
                  id="imbalance"
                  checked={viewSettings.showImbalance}
                  onCheckedChange={() => handleViewToggle("showImbalance")}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="spread">Spread Visualization</Label>
                </div>
                <Switch
                  id="spread"
                  checked={viewSettings.showSpread}
                  onCheckedChange={() => handleViewToggle("showSpread")}
                />
              </div>
            </div>

            <Separator />

            {/* Camera Distance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="camera-distance">Camera Distance</Label>
                <span className="text-sm text-muted-foreground">
                  {viewSettings.cameraDistance}
                </span>
              </div>
              <Slider
                id="camera-distance"
                min={30}
                max={150}
                step={5}
                value={[viewSettings.cameraDistance]}
                onValueChange={([value]) =>
                  onViewSettingsChange({
                    ...viewSettings,
                    cameraDistance: value,
                  })
                }
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="filter" className="space-y-4 mt-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Data Sources</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Select which venues to display data from
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="mb-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <p className="font-medium text-blue-700 dark:text-blue-300 text-sm">Real-Time Data</p>
              <p className="text-xs mt-1 text-blue-600 dark:text-blue-400">
                Currently only Binance is supported for live orderbook data
              </p>
            </div>

            {Object.entries(VENUE_CONFIGS).map(([venue, config]) => (
              <div key={venue} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={venue}
                    checked={filterSettings.venues.includes(venue as VenueType)}
                    onCheckedChange={() =>
                      handleVenueToggle(venue as VenueType)
                    }
                    disabled={venue !== "binance"}
                  />
                  <Label
                    htmlFor={venue}
                    className={cn(
                      "cursor-pointer",
                      venue !== "binance" && "opacity-50"
                    )}
                  >
                    {config.name}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    {venue === "binance" ? "Live" : "Coming Soon"}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Data Filters</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Fine-tune what data is displayed</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range</Label>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono">
                  ${filterSettings.priceRange[0]}
                </span>
                <span className="text-muted-foreground">to</span>
                <span className="font-mono">
                  ${filterSettings.priceRange[1]}
                </span>
              </div>
            </div>

            {/* Quantity Threshold */}
            <div className="space-y-2">
              <Label htmlFor="quantity-threshold">Minimum Quantity</Label>
              <Slider
                id="quantity-threshold"
                min={0}
                max={10}
                step={0.1}
                value={[filterSettings.quantityThreshold]}
                onValueChange={([value]) =>
                  onFilterSettingsChange({
                    ...filterSettings,
                    quantityThreshold: value,
                  })
                }
              />
              <span className="text-xs text-muted-foreground">
                {filterSettings.quantityThreshold.toFixed(1)} BTC
              </span>
            </div>

            {/* Time Range */}
            <div className="space-y-2">
              <Label htmlFor="time-range">Time Window</Label>
              <Select
                value={filterSettings.timeRange.toString()}
                onValueChange={(value) =>
                  onFilterSettingsChange({
                    ...filterSettings,
                    timeRange: parseInt(value),
                  })
                }
              >
                <SelectTrigger id="time-range">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">1 minute</SelectItem>
                  <SelectItem value="300">5 minutes</SelectItem>
                  <SelectItem value="900">15 minutes</SelectItem>
                  <SelectItem value="1800">30 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Analysis Features */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Analysis Features</h4>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="pressure-zones">Pressure Zones</Label>
                </div>
                <Switch
                  id="pressure-zones"
                  checked={filterSettings.showPressureZones}
                  onCheckedChange={(checked) =>
                    onFilterSettingsChange({
                      ...filterSettings,
                      showPressureZones: checked,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="volume-profile">Volume Profile</Label>
                </div>
                <Switch
                  id="volume-profile"
                  checked={filterSettings.showVolumeProfile}
                  onCheckedChange={(checked) =>
                    onFilterSettingsChange({
                      ...filterSettings,
                      showVolumeProfile: checked,
                    })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="performance" className="space-y-4 mt-4">
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Performance Metrics</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">Real-time performance statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Data Processing */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Snapshots Processed</span>
                <Badge variant="secondary">{stats.totalSnapshots}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Processing Rate</span>
                <Badge variant="secondary">
                  {stats.snapshotsPerSecond.toFixed(1)}/s
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Messages Processed</span>
                <Badge variant="secondary">
                  {stats?.messagesProcessed?.toLocaleString()}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm">Data Transferred</span>
                <Badge variant="secondary">
                  {formatBytes(stats?.bytesProcessed)}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Memory Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Memory Usage</span>
                <span className="text-sm text-muted-foreground">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>

            {/* CPU Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">CPU Usage</span>
                <span className="text-sm text-muted-foreground">42%</span>
              </div>
              <Progress value={42} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-card-foreground">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset View
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Download className="h-4 w-4" />
              Export Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Settings
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ProfessionalControlPanel;
