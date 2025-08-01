import React from "react";
import { FilterSettings } from "@/types/orderbook";
import { Badge } from "@/components/ui/badge";
import { Filter, Check, X } from "lucide-react";

interface FilterStatusProps {
  filterSettings: FilterSettings;
  totalBids: number;
  filteredBids: number;
  totalAsks: number;
  filteredAsks: number;
}

const FilterStatus: React.FC<FilterStatusProps> = ({
  filterSettings,
  totalBids,
  filteredBids,
  totalAsks,
  filteredAsks,
}) => {
  const hasActiveFilters = 
    filterSettings.quantityThreshold > 0 ||
    filterSettings.priceRange[0] > 0 ||
    filterSettings.priceRange[1] < 100000 ||
    filterSettings.timeRange < 1800;

  const bidsFiltered = totalBids - filteredBids;
  const asksFiltered = totalAsks - filteredAsks;
  const totalFiltered = bidsFiltered + asksFiltered;

  if (!hasActiveFilters) {
    return (
      <div className="fixed bottom-4 left-4 bg-card/90 backdrop-blur border rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">No filters active</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 bg-card/90 backdrop-blur border rounded-lg p-4 shadow-lg max-w-xs">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <span className="font-medium">Active Filters</span>
          <Badge variant="secondary" className="ml-auto">
            {totalFiltered} orders filtered
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          {filterSettings.quantityThreshold > 0 && (
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              <span>Min Quantity: {filterSettings.quantityThreshold} BTC</span>
            </div>
          )}

          {(filterSettings.priceRange[0] > 0 || filterSettings.priceRange[1] < 100000) && (
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              <span>
                Price: ${filterSettings.priceRange[0]} - ${filterSettings.priceRange[1]}
              </span>
            </div>
          )}

          {filterSettings.timeRange < 1800 && (
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              <span>Time Window: {filterSettings.timeRange / 60} minutes</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Bids shown:</span>
            <span>{filteredBids} / {totalBids}</span>
          </div>
          <div className="flex justify-between">
            <span>Asks shown:</span>
            <span>{filteredAsks} / {totalAsks}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterStatus;