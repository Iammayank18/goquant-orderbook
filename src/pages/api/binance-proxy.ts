import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { symbol = 'BTCUSDT', limit = 100 } = req.query;
    
    const response = await axios.get('https://api.binance.com/api/v3/depth', {
      params: {
        symbol: symbol as string,
        limit: limit as string
      }
    });
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('Binance API error:', error);
    res.status(500).json({ error: 'Failed to fetch orderbook data' });
  }
}