import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  GitBranch,
  BarChart3,
  Clock,
} from "lucide-react";

interface ProfessionalLegendProps {
  metrics?: {
    midPrice: number;
    spread: number;
    bidVolume: number;
    askVolume: number;
    imbalance: number;
  };
}

const ProfessionalLegend: React.FC<ProfessionalLegendProps> = ({ metrics }) => {
  return (
    <Card className="w-72 max-w-[calc(100vw-2rem)] shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Order Book Visualization
        </CardTitle>
        <CardDescription>Real-time 3D market depth analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Color Legend */}
        <div>
          <h4 className="text-sm font-medium mb-2">Order Types</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500" />
                <span className="text-sm">Bid Orders</span>
              </div>
              <span className="text-xs text-muted-foreground">Buy side</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500" />
                <span className="text-sm">Ask Orders</span>
              </div>
              <span className="text-xs text-muted-foreground">Sell side</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Axis Explanation */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <GitBranch className="h-3 w-3" />
            Dimensions
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">X-Axis:</span>
              <span className="col-span-2">Price Level</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Y-Axis:</span>
              <span className="col-span-2">Quantity (Log)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-muted-foreground">Z-Axis:</span>
              <span className="col-span-2">Time</span>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        {metrics && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Activity className="h-3 w-3" />
                Live Metrics
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Market Balance
                  </span>
                  <Badge
                    variant={metrics.imbalance > 0 ? "default" : "destructive"}
                    className="gap-1"
                  >
                    {metrics.imbalance > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {(Math.abs(metrics.imbalance) * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Spread</span>
                  <span className="text-sm font-mono">
                    ${metrics.spread.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Volume
                  </span>
                  <span className="text-sm font-mono">
                    {(metrics.bidVolume + metrics.askVolume).toFixed(2)} BTC
                  </span>
                </div>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Visual Indicators */}
        <div>
          <h4 className="text-sm font-medium mb-2">Visual Indicators</h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">Pressure zones</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Volume profile</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <span className="text-muted-foreground">Spread indicator</span>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="pt-2">
          <p className="text-xs text-muted-foreground">
            <kbd className="px-1 py-0.5 text-xs bg-muted rounded">H</kbd> Toggle
            help •
            <kbd className="px-1 py-0.5 text-xs bg-muted rounded ml-1">R</kbd>{" "}
            Auto-rotate
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfessionalLegend;
