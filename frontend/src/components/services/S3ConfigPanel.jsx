import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateS3Cost } from '@/api/client';
import { Database, X } from 'lucide-react';

const STORAGE_CLASSES = [
  'S3 Standard',
  'S3 Intelligent-Tiering',
  'S3 Standard-IA',
  'S3 One Zone-IA',
  'S3 Glacier Instant',
  'S3 Glacier Flexible',
  'S3 Deep Archive',
];

const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

export const S3ConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.s3Config);
  const updateConfig = useServiceConfigStore(s => s.updateS3Config);
  const setS3Cost = usePricingStore(s => s.setS3Cost);
  
  // Ensure all numeric values are valid (not NaN or undefined)
  const safeConfig = {
    ...config,
    storage_gb: Number.isFinite(config.storage_gb) ? config.storage_gb : 100,
    put_requests: Number.isFinite(config.put_requests) ? config.put_requests : 10000,
    get_requests: Number.isFinite(config.get_requests) ? config.get_requests : 100000,
    delete_requests: Number.isFinite(config.delete_requests) ? config.delete_requests : 1000,
    outbound_transfer_gb: Number.isFinite(config.outbound_transfer_gb) ? config.outbound_transfer_gb : 50,
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
      const result = await calculateS3Cost(localConfig);
      setCost(result);
      setS3Cost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">S3 Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📍 Region
          </label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(REGIONS).map(([name, value]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
        </div>

        {/* Storage Class */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            📦 STORAGE CLASS
          </label>
          <select
            value={localConfig.storage_class}
            onChange={(e) => handleChange('storage_class', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {STORAGE_CLASSES.map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 Choose based on access patterns</p>
        </div>

        {/* Storage Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Storage Size (GB)
          </label>
          <input
            type="number"
            value={localConfig.storage_gb}
            onChange={(e) => handleChange('storage_gb', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Billed on average daily storage</p>
        </div>

        {/* PUT Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PUT Requests per Month
          </label>
          <input
            type="number"
            value={localConfig.put_requests}
            onChange={(e) => handleChange('put_requests', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Upload/Write operations</p>
        </div>

        {/* GET Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GET Requests per Month
          </label>
          <input
            type="number"
            value={localConfig.get_requests}
            onChange={(e) => handleChange('get_requests', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Download/Read operations</p>
        </div>

        {/* DELETE Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            DELETE Requests per Month
          </label>
          <input
            type="number"
            value={localConfig.delete_requests}
            onChange={(e) => handleChange('delete_requests', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {/* Data Transfer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Outbound Data Transfer (GB)
          </label>
          <input
            type="number"
            value={localConfig.outbound_transfer_gb}
            onChange={(e) => handleChange('outbound_transfer_gb', parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">⚠️ First 1 GB/month FREE</p>
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Storage:</span>
                <span className="font-medium">${cost.breakdown.storage_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Requests:</span>
                <span className="font-medium">${cost.breakdown.request_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Data Transfer:</span>
                <span className="font-medium">${cost.breakdown.transfer_cost.toFixed(4)}</span>
              </div>
            </div>
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
