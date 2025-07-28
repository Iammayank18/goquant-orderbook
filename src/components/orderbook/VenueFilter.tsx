import React from 'react';
import { VenueType } from '@/types/orderbook';
import { VENUE_CONFIGS } from '@/utils/venueConfig';
import { Check } from 'lucide-react';

interface VenueFilterProps {
  selectedVenues: VenueType[];
  onVenueToggle: (venue: VenueType) => void;
}

const VenueFilter: React.FC<VenueFilterProps> = ({ selectedVenues, onVenueToggle }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
      <h3 className="text-white font-semibold mb-3">Trading Venues</h3>
      <div className="space-y-2">
        {Object.entries(VENUE_CONFIGS).map(([key, config]) => {
          const venue = key as VenueType;
          const isSelected = selectedVenues.includes(venue);
          
          return (
            <button
              key={venue}
              onClick={() => onVenueToggle(venue)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all ${
                isSelected
                  ? 'bg-gray-800 border border-gray-700'
                  : 'bg-gray-850 border border-gray-800 hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
                <span className={`text-sm ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                  {config.name}
                </span>
              </div>
              {isSelected && <Check className="w-4 h-4 text-green-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VenueFilter;