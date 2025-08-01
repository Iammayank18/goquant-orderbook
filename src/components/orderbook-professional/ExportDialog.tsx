import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  Download,
  Info,
} from "lucide-react";
import { OrderbookSnapshot, PressureZone } from "@/types/orderbook";
import { ExportUtils } from "@/utils/exportUtils";
import { cn } from "@/lib/utils";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshots: OrderbookSnapshot[];
  pressureZones?: PressureZone[];
  symbol: string;
  venue: string;
}

type ExportFormat = "csv" | "json" | "pdf";

interface ExportOptions {
  includeAnalysis: boolean;
  includeSnapshots: boolean;
  includePressureZones: boolean;
  snapshotLimit: number;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  snapshots,
  pressureZones = [],
  symbol,
  venue,
}) => {
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [options, setOptions] = useState<ExportOptions>({
    includeAnalysis: true,
    includeSnapshots: true,
    includePressureZones: true,
    snapshotLimit: 50,
  });
  const [isExporting, setIsExporting] = useState(false);

  // Calculate analysis data
  const calculateAnalysis = () => {
    if (!snapshots.length) return null;

    const latest = snapshots[snapshots.length - 1];
    if (!latest.bids?.length || !latest.asks?.length) return null;

    const midPrice = (latest.bids[0].price + latest.asks[0].price) / 2;
    const spread = latest.asks[0].price - latest.bids[0].price;

    const bidVolume = latest.bids
      .slice(0, 10)
      .reduce((sum, bid) => sum + bid.quantity, 0);
    const askVolume = latest.asks
      .slice(0, 10)
      .reduce((sum, ask) => sum + ask.quantity, 0);
    const totalVolume = bidVolume + askVolume;
    const imbalance =
      totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;

    return {
      midPrice,
      spread,
      bidVolume,
      askVolume,
      imbalance,
      topBids: latest.bids.slice(0, 10),
      topAsks: latest.asks.slice(0, 10),
      pressureZones: options.includePressureZones ? pressureZones : [],
    };
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const analysis = calculateAnalysis();
      if (!analysis) {
        throw new Error("No data to export");
      }

      const exportData = {
        timestamp: new Date(),
        symbol,
        venue,
        snapshots: options.includeSnapshots
          ? snapshots.slice(-options.snapshotLimit)
          : [],
        analysis,
      };

      switch (format) {
        case "csv":
          ExportUtils.exportToCSV(exportData);
          break;
        case "json":
          ExportUtils.exportToJSON(exportData);
          break;
        case "pdf":
          ExportUtils.exportToPDF(exportData);
          break;
      }

      // Close dialog after successful export
      setTimeout(() => {
        onOpenChange(false);
        setIsExporting(false);
      }, 500);
    } catch (error) {
      setIsExporting(false);
      // Handle error (could show a toast notification)
    }
  };

  const formatInfo = {
    csv: {
      icon: FileSpreadsheet,
      title: "CSV Export",
      description: "Spreadsheet format, ideal for Excel analysis",
      color: "text-green-600 dark:text-green-400",
    },
    json: {
      icon: FileJson,
      title: "JSON Export",
      description: "Raw data format for programmatic analysis",
      color: "text-blue-600 dark:text-blue-400",
    },
    pdf: {
      icon: FileText,
      title: "HTML Report",
      description: "Formatted report that can be printed to PDF",
      color: "text-purple-600 dark:text-purple-400",
    },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Export Orderbook Data</DialogTitle>
          <DialogDescription>
            Export orderbook snapshots and analysis for {symbol}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(v) => setFormat(v as ExportFormat)}
            >
              {(Object.keys(formatInfo) as ExportFormat[]).map((fmt) => {
                const info = formatInfo[fmt];
                const Icon = info.icon;
                return (
                  <Card
                    key={fmt}
                    className={cn(
                      "cursor-pointer transition-colors",
                      format === fmt && "border-primary"
                    )}
                    onClick={() => setFormat(fmt)}
                  >
                    <CardContent className="flex items-center gap-3 p-3">
                      <RadioGroupItem value={fmt} id={fmt} />
                      <Icon className={cn("h-5 w-5", info.color)} />
                      <div className="flex-1">
                        <Label
                          htmlFor={fmt}
                          className="cursor-pointer font-medium"
                        >
                          {info.title}
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          {info.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </RadioGroup>
          </div>

          <Separator />

          {/* Export Options */}
          <div className="space-y-3">
            <Label>Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="analysis"
                  checked={options.includeAnalysis}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeAnalysis: !!checked })
                  }
                />
                <Label htmlFor="analysis" className="cursor-pointer">
                  Market Analysis Summary
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="snapshots"
                  checked={options.includeSnapshots}
                  onCheckedChange={(checked) =>
                    setOptions({ ...options, includeSnapshots: !!checked })
                  }
                />
                <Label htmlFor="snapshots" className="cursor-pointer">
                  Orderbook Snapshots
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Last {options.snapshotLimit} snapshots)
                  </span>
                </Label>
              </div>

              {pressureZones.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pressure"
                    checked={options.includePressureZones}
                    onCheckedChange={(checked) =>
                      setOptions({
                        ...options,
                        includePressureZones: !!checked,
                      })
                    }
                  />
                  <Label htmlFor="pressure" className="cursor-pointer">
                    Pressure Zone Analysis
                  </Label>
                </div>
              )}
            </div>
          </div>

          {/* Export Info */}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Export Information
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  {snapshots.length} total snapshots available
                  {pressureZones.length > 0 &&
                    `, ${pressureZones.length} pressure zones detected`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || !snapshots.length}
            className="gap-2"
          >
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
