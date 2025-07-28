import { OrderbookSnapshot, PressureZone, OrderLevel } from '@/types/orderbook';

export class PressureZoneDetector {
  private volumeThresholdMultiplier: number;
  private priceRangePercent: number;
  private minLevelsForZone: number;

  constructor(
    volumeThresholdMultiplier = 2.5,
    priceRangePercent = 0.1,
    minLevelsForZone = 3
  ) {
    this.volumeThresholdMultiplier = volumeThresholdMultiplier;
    this.priceRangePercent = priceRangePercent;
    this.minLevelsForZone = minLevelsForZone;
  }

  detectPressureZones(snapshot: OrderbookSnapshot): PressureZone[] {
    const bidZones = this.detectZonesInOrders(snapshot.bids, 'bid');
    const askZones = this.detectZonesInOrders(snapshot.asks, 'ask');
    
    return [...bidZones, ...askZones].sort((a, b) => b.intensity - a.intensity);
  }

  private detectZonesInOrders(orders: OrderLevel[], type: 'bid' | 'ask'): PressureZone[] {
    if (orders.length < this.minLevelsForZone) return [];

    const zones: PressureZone[] = [];
    const avgVolume = this.calculateAverageVolume(orders);
    const volumeThreshold = avgVolume * this.volumeThresholdMultiplier;

    let currentZone: OrderLevel[] = [];
    let zoneStartPrice = 0;
    let zoneVolume = 0;

    orders.forEach((order, index) => {
      if (order.quantity >= volumeThreshold) {
        if (currentZone.length === 0) {
          zoneStartPrice = order.price;
        }
        currentZone.push(order);
        zoneVolume += order.quantity;
      } else if (currentZone.length >= this.minLevelsForZone) {
        const zone = this.createPressureZone(
          currentZone,
          zoneStartPrice,
          zoneVolume,
          type,
          avgVolume
        );
        zones.push(zone);
        currentZone = [];
        zoneVolume = 0;
      } else {
        currentZone = [];
        zoneVolume = 0;
      }
    });

    if (currentZone.length >= this.minLevelsForZone) {
      const zone = this.createPressureZone(
        currentZone,
        zoneStartPrice,
        zoneVolume,
        type,
        avgVolume
      );
      zones.push(zone);
    }

    return zones;
  }

  private createPressureZone(
    levels: OrderLevel[],
    startPrice: number,
    totalVolume: number,
    type: 'bid' | 'ask',
    avgVolume: number
  ): PressureZone {
    const endPrice = levels[levels.length - 1].price;
    const midPrice = (startPrice + endPrice) / 2;
    const intensity = this.calculateIntensity(totalVolume, avgVolume, levels.length);

    return {
      price: midPrice,
      volume: totalVolume,
      type,
      intensity,
      priceRange: type === 'bid' ? [endPrice, startPrice] : [startPrice, endPrice]
    };
  }

  private calculateAverageVolume(orders: OrderLevel[]): number {
    const totalVolume = orders.reduce((sum, order) => sum + order.quantity, 0);
    return totalVolume / orders.length;
  }

  private calculateIntensity(
    zoneVolume: number,
    avgVolume: number,
    levelCount: number
  ): number {
    const volumeRatio = zoneVolume / (avgVolume * levelCount);
    const densityFactor = Math.min(levelCount / this.minLevelsForZone, 2);
    return Math.min(volumeRatio * densityFactor, 10);
  }

  analyzePressureBalance(zones: PressureZone[]): {
    bidPressure: number;
    askPressure: number;
    imbalance: number;
    dominantSide: 'bid' | 'ask' | 'neutral';
  } {
    const bidPressure = zones
      .filter(z => z.type === 'bid')
      .reduce((sum, z) => sum + z.intensity * z.volume, 0);
    
    const askPressure = zones
      .filter(z => z.type === 'ask')
      .reduce((sum, z) => sum + z.intensity * z.volume, 0);
    
    const totalPressure = bidPressure + askPressure;
    const imbalance = totalPressure > 0 
      ? Math.abs(bidPressure - askPressure) / totalPressure 
      : 0;
    
    let dominantSide: 'bid' | 'ask' | 'neutral' = 'neutral';
    if (imbalance > 0.2) {
      dominantSide = bidPressure > askPressure ? 'bid' : 'ask';
    }
    
    return {
      bidPressure,
      askPressure,
      imbalance,
      dominantSide
    };
  }
}