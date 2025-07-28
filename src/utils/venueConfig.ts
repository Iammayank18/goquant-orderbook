import { VenueConfig, VenueType } from '@/types/orderbook';

export const VENUE_CONFIGS: Record<VenueType, VenueConfig> = {
  binance: {
    id: 'binance',
    name: 'Binance',
    color: '#F0B90B',
    wsUrl: 'wss://stream.binance.com:9443/ws',
    restUrl: 'https://api.binance.com/api/v3',
    enabled: true
  },
  okx: {
    id: 'okx',
    name: 'OKX',
    color: '#1E90FF',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    restUrl: 'https://www.okx.com/api/v5',
    enabled: false
  },
  bybit: {
    id: 'bybit',
    name: 'Bybit',
    color: '#FFD700',
    wsUrl: 'wss://stream.bybit.com/v5/public/linear',
    restUrl: 'https://api.bybit.com/v5',
    enabled: false
  },
  deribit: {
    id: 'deribit',
    name: 'Deribit',
    color: '#00D4E7',
    wsUrl: 'wss://www.deribit.com/ws/api/v2',
    restUrl: 'https://www.deribit.com/api/v2',
    enabled: false
  }
};

export const getActiveVenues = (): VenueConfig[] => {
  return Object.values(VENUE_CONFIGS).filter(venue => venue.enabled);
};

export const getVenueColor = (venue: VenueType): string => {
  return VENUE_CONFIGS[venue]?.color || '#888888';
};

export const getVenueName = (venue: VenueType): string => {
  return VENUE_CONFIGS[venue]?.name || venue;
};