import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateCloudFrontCost } from '@/api/client';
import { Globe2, X } from 'lucide-react';

// CloudFront pricing is keyed by geographic price group, not AWS region
const PRICE_GROUPS = {
  'United States': 'US',
  'Europe': 'EU',
  'India': 'IN',
  'Japan': 'JP',
  'Australia': 'AU',
  'South America': 'SA',
  'South Africa': 'ZA',
  'Canada': 'CA',
  'Middle East': 'ME',
  'Asia Pacific': 'AP',
};

export const CloudFrontConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.cloudFrontConfig);
  const updateConfig = useServiceConfigStore(s => s.updateCloudFrontConfig);
  const setCloudFrontCost = usePricingStore(s => s.setCloudFrontCost);

  const safeConfig = {
    ...config,
    data_transfer_out_gb: Number.isFinite(config.data_transfer_out_gb) ? config.data_transfer_out_gb : 1000,
    https_requests: Number.isFinite(config.https_requests) ? config.https_requests : 5000000,
    http_requests: Number.isFinite(config.http_requests) ? config.http_requests : 100000,
    invalidation_paths: Number.isFinite(config.invalidation_paths) ? config.invalidation_paths : 100,
  };

  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    setLocalConfig({ ...localConfig, [field]: value });
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const apiParams = {
        region: localConfig.region, // holds the price group code, e.g. "IN"
        data_transfer_out_gb: Number(localConfig.data_transfer_out_gb) || 0,
        https_requests: Number(localConfig.https_requests) || 0,
        http_requests: Number(localConfig.http_requests) || 0,
        invalidation_paths: Number(localConfig.invalidation_paths) || 0,
        include_free_tier: true,
      };

      const result = await calculateCloudFrontCost(apiParams);
      setCost(result);
      setCloudFrontCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg">
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Globe2 className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">CloudFront Configuration</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🌍 Price Group (destination)</label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(PRICE_GROUPS).map(([name, value]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 CloudFront prices by viewer geography, not AWS region</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Transfer Out (GB/month)</label>
          <input
            type="number"
            value={localConfig.data_transfer_out_gb || ''}
            onChange={(e) => handleChange('data_transfer_out_gb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 1 TB/month FREE (first 12 months)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HTTPS Requests per Month</label>
          <input
            type="number"
            value={localConfig.https_requests || ''}
            onChange={(e) => handleChange('https_requests', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 10M requests/month FREE</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">HTTP Requests per Month</label>
          <input
            type="number"
            value={localConfig.http_requests || ''}
            onChange={(e) => handleChange('http_requests', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Invalidation Paths per Month</label>
          <input
            type="number"
            value={localConfig.invalidation_paths || ''}
            onChange={(e) => handleChange('invalidation_paths', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 1,000 paths/month FREE</p>
        </div>

        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Data Transfer:</span>
                <span className="font-medium">${cost.breakdown.data_transfer_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Requests:</span>
                <span className="font-medium">${cost.breakdown.requests_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Invalidations:</span>
                <span className="font-medium">${cost.breakdown.invalidation_cost.toFixed(4)}</span>
              </div>
            </div>
            <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between text-sm font-semibold">
              <span>Total:</span>
              <span className="text-yellow-600">${cost.breakdown.total_cost.toFixed(2)}/month</span>
            </div>
            {cost.notes && cost.notes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                {cost.notes.map((note, i) => (
                  <p key={i} className="text-xs text-gray-500">⚠️ {note}</p>
                ))}
              </div>
            )}
          </div>
        )}

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