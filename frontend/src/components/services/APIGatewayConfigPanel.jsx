import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateAPIGatewayCost } from '@/api/client';
import { Cloud, X } from 'lucide-react';

const CACHE_SIZES = ['0.5', '1.6', '6.1', '13.5', '28.4', '58.2', '118', '237'];
const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

export const APIGatewayConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.apiGatewayConfig);
  const updateConfig = useServiceConfigStore(s => s.updateAPIGatewayConfig);
  const setAPIGatewayCost = usePricingStore(s => s.setAPIGatewayCost);
  
  // Ensure all numeric values are valid (not NaN or undefined)
  const safeConfig = {
    ...config,
    requests_per_month: Number.isFinite(config.requests_per_month) ? config.requests_per_month : 1000000,
  };
  
  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateAPIGatewayCost(localConfig);
      setCost(result);
      setAPIGatewayCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const showDataTransferFields = localConfig.api_type === 'HTTP';
  const showCacheFields = localConfig.api_type === 'REST';
  const showMessageFields = localConfig.api_type === 'WEBSOCKET';

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">API Gateway Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 Region
          </label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
          >
            {Object.entries(REGIONS).map(([name, value]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
        </div>

        {/* API Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ⚙️ API TYPE
          </label>
          <div className="space-y-2">
            {[
              { label: 'HTTP API', value: 'HTTP', hint: '$1.00/million' },
              { label: 'REST API', value: 'REST', hint: '$3.50/million' },
              { label: 'WebSocket API', value: 'WEBSOCKET', hint: '$1.00/million' }
            ].map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="api_type"
                  value={option.value}
                  checked={localConfig.api_type === option.value}
                  onChange={(e) => handleChange('api_type', e.target.value)}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-medium text-gray-900">{option.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{option.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Requests per Month */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Requests per Month
          </label>
          <input
            type="number"
            value={localConfig.requests_per_month}
            onChange={(e) => handleChange('requests_per_month', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Each request billable regardless of success</p>
        </div>

        {/* HTTP-specific fields */}
        {showDataTransferFields && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Request Size (KB)
              </label>
              <input
                type="number"
                value={localConfig.request_size_kb || 10}
                onChange={(e) => handleChange('request_size_kb', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Average Response Size (KB)
              </label>
              <input
                type="number"
                value={localConfig.response_size_kb || 5}
                onChange={(e) => handleChange('response_size_kb', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </>
        )}

        {/* REST-specific fields */}
        {showCacheFields && (
          <>
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enable_caching || false}
                  onChange={(e) => handleChange('enable_caching', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">Enable Caching</span>
              </label>
              <p className="text-xs text-gray-500 mt-1">⚠️ Costs $14-$5,472/month 24/7</p>
            </div>
            {localConfig.enable_caching && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cache Size (GB)
                </label>
                <select
                  value={localConfig.cache_size_gb || '0.5'}
                  onChange={(e) => handleChange('cache_size_gb', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                >
                  {CACHE_SIZES.map(size => (
                    <option key={size} value={size}>{size} GB</option>
                  ))}
                </select>
              </div>
            )}
          </>
        )}

        {/* WebSocket-specific fields */}
        {showMessageFields && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Messages per Month
              </label>
              <input
                type="number"
                value={localConfig.requests_per_month}
                onChange={(e) => handleChange('requests_per_month', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Minutes per Month
              </label>
              <input
                type="number"
                value={localConfig.connection_minutes || 100000}
                onChange={(e) => handleChange('connection_minutes', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          </>
        )}

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            {Object.entries(cost.breakdown || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm text-gray-700 mb-1">
                <span className="capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium">${value.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between text-sm font-semibold">
              <span>Total:</span>
              <span className="text-yellow-600">${cost.breakdown.total_cost.toFixed(2)}/month</span>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold py-2 px-4 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
