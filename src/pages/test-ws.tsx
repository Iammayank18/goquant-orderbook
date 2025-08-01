import React, { useState, useEffect } from "react";
import { useOrderbookData } from "@/hooks/useOrderbookData";
import { FilterSettings, VenueType } from "@/types/orderbook";

export default function TestWSPage() {
  const [filterSettings] = useState<FilterSettings>({
    venues: ["binance"] as VenueType[],
    priceRange: [0, 100000],
    quantityThreshold: 0,
    timeRange: 300,
    showPressureZones: false,
    showVolumeProfile: false,
  });

  const { snapshots, isConnected, error, stats } = useOrderbookData(
    "BTCUSDT",
    filterSettings
  );

  useEffect(() => {
    console.log("TestWS: Current state", {
      isConnected,
      error,
      snapshotsLength: snapshots.length,
      lastSnapshot: snapshots[snapshots.length - 1],
    });
  }, [snapshots, isConnected, error]);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace" }}>
      <h1>WebSocket Test Page</h1>
      <div>
        <h2>Connection Status</h2>
        <p>Connected: {isConnected ? "YES" : "NO"}</p>
        <p>Error: {error || "None"}</p>
      </div>
      <div>
        <h2>Stats</h2>
        <p>Total Snapshots: {stats.totalSnapshots}</p>
        <p>Snapshots/sec: {stats.snapshotsPerSecond}</p>
        <p>Messages: {stats.messagesProcessed}</p>
      </div>
      <div>
        <h2>Latest Snapshot</h2>
        {snapshots.length > 0 ? (
          <div>
            <p>Timestamp: {new Date(snapshots[snapshots.length - 1].timestamp).toISOString()}</p>
            <p>Bids: {snapshots[snapshots.length - 1].bids?.length || 0}</p>
            <p>Asks: {snapshots[snapshots.length - 1].asks?.length || 0}</p>
            {snapshots[snapshots.length - 1].bids?.length > 0 && (
              <p>
                Best Bid: ${snapshots[snapshots.length - 1].bids[0].price.toFixed(2)} x{" "}
                {snapshots[snapshots.length - 1].bids[0].quantity.toFixed(4)}
              </p>
            )}
            {snapshots[snapshots.length - 1].asks?.length > 0 && (
              <p>
                Best Ask: ${snapshots[snapshots.length - 1].asks[0].price.toFixed(2)} x{" "}
                {snapshots[snapshots.length - 1].asks[0].quantity.toFixed(4)}
              </p>
            )}
          </div>
        ) : (
          <p>No snapshots yet</p>
        )}
      </div>
      <div>
        <h2>Console Output</h2>
        <p>Check browser console for detailed logs</p>
      </div>
    </div>
  );
}