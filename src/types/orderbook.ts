export interface OrderLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderbookSnapshot {
  bids: OrderLevel[];
  asks: OrderLevel[];
  timestamp: number;
  venue: VenueType;
}

export interface OrderbookData {
  symbol: string;
  snapshots: OrderbookSnapshot[];
  lastUpdate: number;
}

export interface PressureZone {
  price: number;
  volume: number;
  type: 'bid' | 'ask';
  intensity: number;
  priceRange: [number, number];
}

export interface VenueConfig {
  id: VenueType;
  name: string;
  color: string;
  wsUrl: string;
  restUrl: string;
  enabled: boolean;
}

export type VenueType = 'binance' | 'okx' | 'bybit' | 'deribit';

export interface OrderbookUpdate {
  bids: [string, string][];
  asks: [string, string][];
  lastUpdateId?: number;
  u?: number;
  U?: number;
}

export interface FilterSettings {
  venues: VenueType[];
  priceRange: [number, number];
  quantityThreshold: number;
  timeRange: number;
  showPressureZones: boolean;
  showVolumeProfile: boolean;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  color: string;
  venue: VenueType;
  type: 'bid' | 'ask';
}