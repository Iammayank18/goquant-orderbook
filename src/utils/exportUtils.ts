import { OrderbookSnapshot, OrderLevel, PressureZone } from '@/types/orderbook';

interface ExportData {
  timestamp: Date;
  symbol: string;
  venue: string;
  snapshots: OrderbookSnapshot[];
  analysis: {
    midPrice: number;
    spread: number;
    bidVolume: number;
    askVolume: number;
    imbalance: number;
    topBids: OrderLevel[];
    topAsks: OrderLevel[];
    pressureZones?: PressureZone[];
  };
}

export class ExportUtils {
  // Export orderbook snapshot as CSV
  static exportToCSV(data: ExportData): void {
    const csvRows: string[] = [];
    
    // Headers
    csvRows.push('Orderbook Snapshot Report');
    csvRows.push(`Symbol: ${data.symbol}`);
    csvRows.push(`Venue: ${data.venue}`);
    csvRows.push(`Timestamp: ${data.timestamp.toISOString()}`);
    csvRows.push('');
    
    // Analysis summary
    csvRows.push('Market Analysis');
    csvRows.push(`Mid Price,${data.analysis.midPrice.toFixed(2)}`);
    csvRows.push(`Spread,${data.analysis.spread.toFixed(2)}`);
    csvRows.push(`Bid Volume,${data.analysis.bidVolume.toFixed(4)}`);
    csvRows.push(`Ask Volume,${data.analysis.askVolume.toFixed(4)}`);
    csvRows.push(`Imbalance,${(data.analysis.imbalance * 100).toFixed(2)}%`);
    csvRows.push('');
    
    // Top bids
    csvRows.push('Top Bids');
    csvRows.push('Price,Quantity,Total');
    data.analysis.topBids.forEach(bid => {
      csvRows.push(`${bid.price},${bid.quantity},${bid.total}`);
    });
    csvRows.push('');
    
    // Top asks
    csvRows.push('Top Asks');
    csvRows.push('Price,Quantity,Total');
    data.analysis.topAsks.forEach(ask => {
      csvRows.push(`${ask.price},${ask.quantity},${ask.total}`);
    });
    
    // Create blob and download
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orderbook_${data.symbol}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Export raw data as JSON
  static exportToJSON(data: ExportData): void {
    const jsonData = {
      metadata: {
        symbol: data.symbol,
        venue: data.venue,
        timestamp: data.timestamp.toISOString(),
        exportedAt: new Date().toISOString(),
      },
      analysis: data.analysis,
      snapshots: data.snapshots.map(snapshot => ({
        timestamp: snapshot.timestamp,
        venue: snapshot.venue,
        bidCount: snapshot.bids.length,
        askCount: snapshot.asks.length,
        topBid: snapshot.bids[0],
        topAsk: snapshot.asks[0],
        bids: snapshot.bids.slice(0, 20), // Top 20 levels
        asks: snapshot.asks.slice(0, 20), // Top 20 levels
      })),
    };
    
    const jsonContent = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orderbook_data_${data.symbol}_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Generate analysis report as HTML (can be printed to PDF)
  static generateAnalysisReport(data: ExportData): string {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Orderbook Analysis Report - ${data.symbol}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
          }
          h1, h2, h3 { color: #2c3e50; }
          .header {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
          }
          .metric-value {
            font-weight: bold;
            color: #2c3e50;
          }
          .section {
            margin: 30px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background: #f8f9fa;
            font-weight: bold;
          }
          .bid { color: #00d68f; }
          .ask { color: #ff4757; }
          .imbalance-positive { color: #00d68f; }
          .imbalance-negative { color: #ff4757; }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Orderbook Analysis Report</h1>
          <p><strong>Symbol:</strong> ${data.symbol}</p>
          <p><strong>Venue:</strong> ${data.venue}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
        </div>

        <div class="section">
          <h2>Market Summary</h2>
          <div class="metric">
            <span>Mid Price:</span>
            <span class="metric-value">$${data.analysis.midPrice.toFixed(2)}</span>
          </div>
          <div class="metric">
            <span>Spread:</span>
            <span class="metric-value">$${data.analysis.spread.toFixed(2)}</span>
          </div>
          <div class="metric">
            <span>Total Bid Volume:</span>
            <span class="metric-value bid">${data.analysis.bidVolume.toFixed(4)} BTC</span>
          </div>
          <div class="metric">
            <span>Total Ask Volume:</span>
            <span class="metric-value ask">${data.analysis.askVolume.toFixed(4)} BTC</span>
          </div>
          <div class="metric">
            <span>Order Imbalance:</span>
            <span class="metric-value ${data.analysis.imbalance > 0 ? 'imbalance-positive' : 'imbalance-negative'}">
              ${(data.analysis.imbalance * 100).toFixed(2)}%
            </span>
          </div>
        </div>

        <div class="section">
          <h2>Top Order Levels</h2>
          <div style="display: flex; gap: 20px;">
            <div style="flex: 1;">
              <h3 class="bid">Top Bids</h3>
              <table>
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.analysis.topBids.map(bid => `
                    <tr>
                      <td>$${bid.price.toFixed(2)}</td>
                      <td>${bid.quantity.toFixed(4)}</td>
                      <td>${bid.total.toFixed(4)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="flex: 1;">
              <h3 class="ask">Top Asks</h3>
              <table>
                <thead>
                  <tr>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.analysis.topAsks.map(ask => `
                    <tr>
                      <td>$${ask.price.toFixed(2)}</td>
                      <td>${ask.quantity.toFixed(4)}</td>
                      <td>${ask.total.toFixed(4)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        ${data.analysis.pressureZones && data.analysis.pressureZones.length > 0 ? `
          <div class="section">
            <h2>Pressure Zones</h2>
            <table>
              <thead>
                <tr>
                  <th>Price Range</th>
                  <th>Type</th>
                  <th>Volume</th>
                  <th>Intensity</th>
                </tr>
              </thead>
              <tbody>
                ${data.analysis.pressureZones.map(zone => `
                  <tr>
                    <td>$${(zone.minPrice || zone.priceRange?.[0] || zone.price - 50).toFixed(2)} - $${(zone.maxPrice || zone.priceRange?.[1] || zone.price + 50).toFixed(2)}</td>
                    <td class="${zone.type}">${zone.type.toUpperCase()}</td>
                    <td>${(zone.totalVolume || zone.volume || 0).toFixed(4)}</td>
                    <td>${(zone.intensity * 100).toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="footer">
          <p>Generated by GoQuant Orderbook Analyzer</p>
          <p>Report generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;
    
    return html;
  }

  // Export report as HTML file (can be printed to PDF)
  static exportToPDF(data: ExportData): void {
    const html = this.generateAnalysisReport(data);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `orderbook_report_${data.symbol}_${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Generate filename with timestamp
  static generateFilename(prefix: string, symbol: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${prefix}_${symbol}_${timestamp}.${extension}`;
  }
}