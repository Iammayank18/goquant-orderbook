import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  BarChart3,
  Layers,
  Eye,
  EyeOff,
} from "lucide-react";
import { OrderbookSnapshot } from "@/types/orderbook";
import { cn } from "@/lib/utils";

interface ModernDashboardProps {
  snapshots: OrderbookSnapshot[];
  isConnected: boolean;
  stats: any;
  viewSettings: any;
  onViewSettingsChange: (settings: any) => void;
}

const ModernDashboard: React.FC<ModernDashboardProps> = ({
  snapshots,
  isConnected,
  stats,
  viewSettings,
  onViewSettingsChange,
}) => {
  // Calculate real-time metrics
  const metrics = React.useMemo(() => {
    if (!snapshots.length) return null;

    const latest = snapshots[snapshots.length - 1];
    if (!latest.bids?.length || !latest.asks?.length) return null;

    const midPrice = (latest.bids[0].price + latest.asks[0].price) / 2;
    const spread = latest.asks[0].price - latest.bids[0].price;
    const spreadPercent = (spread / midPrice) * 100;

    // Calculate order book imbalance
    const bidVolume = latest.bids.slice(0, 10).reduce((sum, bid) => sum + bid.quantity * bid.price, 0);
    const askVolume = latest.asks.slice(0, 10).reduce((sum, ask) => sum + ask.quantity * ask.price, 0);
    const totalVolume = bidVolume + askVolume;
    const imbalance = totalVolume > 0 ? ((bidVolume - askVolume) / totalVolume) * 100 : 0;

    // Price change (compare with 10 snapshots ago)
    const oldSnapshot = snapshots[Math.max(0, snapshots.length - 10)];
    const oldMidPrice = oldSnapshot?.bids?.[0] && oldSnapshot?.asks?.[0] 
      ? (oldSnapshot.bids[0].price + oldSnapshot.asks[0].price) / 2 
      : midPrice;
    const priceChange = ((midPrice - oldMidPrice) / oldMidPrice) * 100;

    return {
      midPrice,
      spread,
      spreadPercent,
      bidVolume,
      askVolume,
      imbalance,
      priceChange,
    };
  }, [snapshots]);

  if (!metrics) return null;

  return (
    <div className="space-y-4">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-lg border border-slate-700">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-3 h-3 rounded-full animate-pulse",
            isConnected ? "bg-green-500" : "bg-red-500"
          )} />
          <span className="text-sm font-medium text-slate-300">
            {isConnected ? "Live Data Stream" : "Disconnected"}
          </span>
          <Badge variant="outline" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            {stats.snapshotsPerSecond} msg/s
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            <Globe className="w-3 h-3 mr-1" />
            Binance
          </Badge>
          <Badge variant="secondary" className="text-xs">
            <BarChart3 className="w-3 h-3 mr-1" />
            {snapshots.length} snapshots
          </Badge>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Price Card */}
        <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">BTC/USDT</p>
            <p className="text-2xl font-bold text-white">
              ${metrics.midPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className={cn(
              "flex items-center gap-1 text-sm",
              metrics.priceChange >= 0 ? "text-green-500" : "text-red-500"
            )}>
              {metrics.priceChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{Math.abs(metrics.priceChange).toFixed(2)}%</span>
            </div>
          </div>
        </Card>

        {/* Spread Card */}
        <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Spread</p>
            <p className="text-2xl font-bold text-white">
              ${metrics.spread.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {metrics.spreadPercent.toFixed(3)}%
            </p>
          </div>
        </Card>

        {/* Order Book Imbalance */}
        <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Order Imbalance</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300",
                    metrics.imbalance > 0 ? "bg-green-500" : "bg-red-500"
                  )}
                  style={{ 
                    width: `${50 + Math.min(Math.max(metrics.imbalance, -50), 50)}%`,
                    marginLeft: metrics.imbalance < 0 ? 'auto' : '0'
                  }}
                />
              </div>
            </div>
            <p className={cn(
              "text-sm font-medium",
              metrics.imbalance > 0 ? "text-green-500" : "text-red-500"
            )}>
              {Math.abs(metrics.imbalance).toFixed(1)}% {metrics.imbalance > 0 ? "Buy" : "Sell"}
            </p>
          </div>
        </Card>

        {/* Volume Card */}
        <Card className="p-4 bg-slate-900/50 border-slate-800 backdrop-blur">
          <div className="space-y-2">
            <p className="text-xs text-slate-400 font-medium">Total Volume</p>
            <p className="text-2xl font-bold text-white">
              ${((metrics.bidVolume + metrics.askVolume) / 1000).toFixed(1)}K
            </p>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-green-500">B: ${(metrics.bidVolume / 1000).toFixed(1)}K</span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-red-500">A: ${(metrics.askVolume / 1000).toFixed(1)}K</span>
            </div>
          </div>
        </Card>
      </div>

      {/* View Controls */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={viewSettings.showGrid ? "secondary" : "outline"}
          onClick={() => onViewSettingsChange({ ...viewSettings, showGrid: !viewSettings.showGrid })}
          className="text-xs"
        >
          <Layers className="w-3 h-3 mr-1" />
          Grid
        </Button>
        <Button
          size="sm"
          variant={viewSettings.showAxes ? "secondary" : "outline"}
          onClick={() => onViewSettingsChange({ ...viewSettings, showAxes: !viewSettings.showAxes })}
          className="text-xs"
        >
          <BarChart3 className="w-3 h-3 mr-1" />
          Axes
        </Button>
        <Button
          size="sm"
          variant={viewSettings.autoRotate ? "secondary" : "outline"}
          onClick={() => onViewSettingsChange({ ...viewSettings, autoRotate: !viewSettings.autoRotate })}
          className="text-xs"
        >
          <Activity className="w-3 h-3 mr-1" />
          Auto Rotate
        </Button>
        <Button
          size="sm"
          variant={viewSettings.showOrderFlow ? "secondary" : "outline"}
          onClick={() => onViewSettingsChange({ ...viewSettings, showOrderFlow: !viewSettings.showOrderFlow })}
          className="text-xs"
        >
          {viewSettings.showOrderFlow ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
          Order Flow
        </Button>
      </div>
    </div>
  );
};

export default ModernDashboard;