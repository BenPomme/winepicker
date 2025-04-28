import React from 'react';
import { UserPreferences } from '../utils/types';

interface PreferenceSelectorProps {
  preferences: UserPreferences;
  onChange: (preferences: UserPreferences) => void;
  showTitle?: boolean;
}

const PreferenceSelector: React.FC<PreferenceSelectorProps> = ({ 
  preferences, 
  onChange,
  showTitle = true
}) => {
  const handlePairingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...preferences, pairingType: e.target.value as any });
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...preferences, preferredStyle: e.target.value as any });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
    onChange({ ...preferences, maxPrice: value });
  };

  const resetPreferences = () => {
    onChange({
      pairingType: '',
      preferredStyle: '',
      maxPrice: undefined
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      {showTitle && (
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Wine Preferences</h3>
          <p className="text-sm text-gray-500">Customize to get personalized recommendations</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Food Pairing Selection */}
        <div>
          <label htmlFor="pairing-type" className="block text-sm font-medium text-gray-700 mb-1">
            What are you eating?
          </label>
          <select
            id="pairing-type"
            value={preferences.pairingType || ''}
            onChange={handlePairingChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
          >
            <option value="">Any food pairing</option>
            <option value="meat">Meat dishes</option>
            <option value="fish">Fish & seafood</option>
            <option value="cheese">Cheese</option>
            <option value="vegetarian">Vegetarian dishes</option>
            <option value="dessert">Desserts</option>
          </select>
        </div>

        {/* Wine Style Selection */}
        <div>
          <label htmlFor="wine-style" className="block text-sm font-medium text-gray-700 mb-1">
            Wine style
          </label>
          <select
            id="wine-style"
            value={preferences.preferredStyle || ''}
            onChange={handleStyleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
          >
            <option value="">Any style</option>
            <option value="red">Red wine</option>
            <option value="white">White wine</option>
            <option value="rose">Rosé</option>
            <option value="sparkling">Sparkling</option>
          </select>
        </div>

        {/* Price Range Selection */}
        <div>
          <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 mb-1">
            Max price (USD)
          </label>
          <input
            type="number"
            id="max-price"
            value={preferences.maxPrice || ''}
            onChange={handlePriceChange}
            min="1"
            max="1000"
            placeholder="No limit"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm"
          />
        </div>
      </div>
      
      {/* Reset Button */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={resetPreferences}
          className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Reset filters
        </button>
      </div>
    </div>
  );
};

export default PreferenceSelector;