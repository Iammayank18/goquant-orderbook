# 3D Orderbook Visualizer

A real-time 3D visualization of cryptocurrency orderbook data with advanced features including pressure zone detection, venue filtering, and interactive controls.

## Features

- **3D Orderbook Visualization**: Interactive 3D representation with price (X-axis), quantity (Y-axis), and time (Z-axis)
- **Real-time Data**: WebSocket integration with Binance API for live orderbook updates
- **Venue Filtering**: Support for multiple exchanges (Binance, OKX, Bybit, Deribit)
- **Pressure Zone Detection**: Algorithm to identify and highlight high-volume concentration areas
- **Interactive Controls**: Zoom, pan, rotate with automatic rotation option
- **Responsive Design**: Mobile-friendly with touch controls
- **Performance Optimized**: LOD rendering and throttled updates for smooth performance

## Setup Instructions

1. **Install Dependencies**
   ```bash
   yarn install
   # or
   npm install
   ```

2. **Run the Development Server**
   ```bash
   yarn dev
   # or
   npm run dev
   ```

3. **Access the Application**
   Open [http://localhost:3000/orderbook](http://localhost:3000/orderbook) in your browser

## Architecture

### Core Components

- **`OrderbookVisualization`**: Main 3D visualization component using Three.js
- **`OrderbookDepthView`**: Renders orderbook depth with bid/ask visualization
- **`PressureZoneView`**: Displays detected pressure zones with pulsing animations
- **`ControlPanel`**: UI controls for filtering and settings
- **`VenueFilter`**: Multi-venue selection interface

### Services

- **`OrderbookWebSocket`**: Manages WebSocket connections to exchange APIs
- **`PressureZoneDetector`**: Analyzes orderbook data to identify pressure zones

### Hooks

- **`useOrderbookData`**: Manages orderbook data and WebSocket connections
- **`useResponsive`**: Handles responsive design breakpoints
- **`useCameraControls`**: Camera zoom and reset functionality

## API Integration

Currently integrated with Binance WebSocket API for real-time orderbook data:
- Endpoint: `wss://stream.binance.com:9443/ws/{symbol}@depth`
- Symbol: BTCUSDT (configurable)

## Performance Considerations

- **LOD Rendering**: Reduces detail for distant objects
- **Throttled Updates**: Limits update frequency for smooth performance
- **Instance Rendering**: Uses Three.js instanced meshes for efficient rendering
- **Snapshot Limiting**: Maintains maximum of 100 snapshots in memory

## Technical Stack

- **Next.js**: React framework with TypeScript
- **Three.js & React Three Fiber**: 3D graphics and React integration
- **Tailwind CSS**: Styling and responsive design
- **Framer Motion**: Animations
- **Lucide React**: Icons

## Future Enhancements

- Machine learning-based pressure zone prediction
- Order flow visualization with animated streams
- Market depth heatmap overlay
- Export functionality for analysis reports
- Additional exchange integrations
- Historical data playback

## Troubleshooting

1. **WebSocket Connection Issues**: Check browser console for connection errors
2. **Performance Issues**: Reduce time range or disable pressure zones
3. **3D Rendering Issues**: Ensure WebGL is enabled in your browser

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (WebGL required)
- Mobile: Touch controls supported