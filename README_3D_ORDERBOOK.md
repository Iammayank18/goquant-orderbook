# GoQuant 3D Orderbook Visualizer

A real-time 3D cryptocurrency orderbook visualization tool with multi-exchange support, pressure zone analysis, and advanced visualization features.

## Features

### Core Functionality
- **3D Orderbook Visualization**: Interactive 3D graph with price (X-axis), quantity (Y-axis), and time (Z-axis)
- **Multi-Exchange Support**: Real-time data from Binance, OKX, Bybit, and Deribit
- **Pressure Zone Analysis**: Automatic detection and visualization of high-pressure order zones
- **Volume Profile**: Cumulative volume visualization with value area analysis
- **Order Flow Animation**: Real-time particle-based order flow visualization
- **Order Imbalance Indicator**: Visual representation of bid/ask imbalance

### Interactive Controls
- **Camera Controls**: Orbit, zoom, and pan with mouse/touch support
- **Auto-rotation**: Smooth rotation animation around the Z-axis
- **Venue Filtering**: Toggle individual exchanges on/off
- **Time Range Selection**: View data from 1 minute to 1 hour
- **Price/Quantity Filtering**: Filter orders by price range and minimum quantity
- **Theme Toggle**: Dark/light mode support

### Performance Features
- **Dynamic LOD (Level of Detail)**: Automatic quality adjustment based on camera distance
- **Performance Mode**: Adaptive rendering based on device capabilities
- **Instanced Rendering**: Efficient rendering of thousands of order blocks
- **Throttled Updates**: Optimized WebSocket data handling

### Mobile Optimization
- **Touch Controls**: Pinch to zoom, drag to rotate
- **Responsive UI**: Adaptive layout for mobile devices
- **Performance Scaling**: Automatic quality reduction on low-end devices

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm/yarn
- Next.js project setup
- TypeScript configured

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Start the development server:
```bash
npm run dev
# or
yarn dev
```

3. Open the enhanced 3D orderbook page:
```
http://localhost:3000/orderbook-3d-enhanced
```

## Usage Guide

### Basic Controls
- **Mouse**: Click and drag to rotate, scroll to zoom
- **Touch**: Drag to rotate, pinch to zoom
- **Keyboard**: Use control panel for all functions

### Visualization Modes
1. **Standard View**: Basic orderbook depth visualization
2. **Pressure Zones**: Highlights areas of high order concentration
3. **Volume Profile**: Shows cumulative volume at each price level
4. **Order Flow**: Animated particles showing order placement
5. **Order Imbalance**: Visual balance indicator

### Performance Tips
- Disable unused venues to reduce data load
- Lower time range for better performance
- Turn off animations on slower devices
- Use quantity threshold to filter small orders

## API Configuration

### Supported Exchanges

#### Binance
- WebSocket: `wss://stream.binance.com:9443/ws`
- Symbol format: `BTCUSDT`

#### OKX
- WebSocket: `wss://ws.okx.com:8443/ws/v5/public`
- Symbol format: `BTC-USDT`

#### Bybit
- WebSocket: `wss://stream.bybit.com/v5/public/linear`
- Symbol format: `BTCUSDT`

#### Deribit
- WebSocket: `wss://www.deribit.com/ws/api/v2`
- Symbol format: `BTC-PERPETUAL`

### Adding New Exchanges

1. Update venue configuration in `/src/utils/venueConfig.ts`
2. Add WebSocket parsing logic in `/src/services/multiVenueWebsocket.ts`
3. Update types in `/src/types/orderbook.ts`

## Architecture

### Component Structure
```
src/
├── components/orderbook/
│   ├── Orderbook3DEnhanced.tsx      # Main 3D visualization
│   ├── PressureZoneEnhanced.tsx     # Pressure zone rendering
│   ├── VolumeProfileEnhanced.tsx    # Volume profile display
│   ├── OrderFlowAnimation.tsx       # Particle animation
│   ├── OrderImbalanceIndicator.tsx  # Balance indicator
│   ├── ControlPanelEnhanced.tsx     # UI controls
│   └── TouchControls.tsx            # Mobile touch handling
├── services/
│   └── multiVenueWebsocket.ts      # WebSocket management
├── hooks/
│   └── useMultiVenueOrderbook.ts   # Data management hook
├── utils/
│   ├── performanceOptimizer.ts     # Performance optimization
│   ├── pressureZoneDetector.ts     # Zone analysis
│   └── venueConfig.ts              # Exchange configuration
└── pages/
    └── orderbook-3d-enhanced.tsx   # Main page component
```

### Data Flow
1. WebSocket connections established per venue
2. Raw orderbook data parsed and normalized
3. Snapshots filtered and optimized
4. 3D visualization updated with instanced rendering
5. Pressure zones calculated and rendered
6. Performance monitored and adjusted

## Performance Optimization

### Automatic Optimizations
- **Frame Rate Monitoring**: Adjusts quality based on FPS
- **LOD System**: Reduces detail at distance
- **Data Throttling**: Limits update frequency
- **Snapshot Limiting**: Caps maximum data points

### Manual Optimizations
- Reduce max levels in control panel
- Lower particle count for order flow
- Disable pressure zones if not needed
- Use fewer venues simultaneously

## Troubleshooting

### Common Issues

1. **No data showing**
   - Check console for WebSocket errors
   - Verify exchange APIs are accessible
   - Ensure correct symbol format

2. **Poor performance**
   - Reduce number of active venues
   - Lower time range setting
   - Disable animations
   - Check browser hardware acceleration

3. **WebSocket disconnections**
   - Automatic reconnection implemented
   - Check network stability
   - Verify API rate limits

## Development

### Adding Features
1. Create component in `/src/components/orderbook/`
2. Add to main visualization in `Orderbook3DEnhanced.tsx`
3. Update control panel if needed
4. Test performance impact

### Testing
```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint

# Build for production
npm run build
```

## Browser Support
- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers with WebGL support

## License
[Your License Here]

## Contributing
[Your Contributing Guidelines Here]