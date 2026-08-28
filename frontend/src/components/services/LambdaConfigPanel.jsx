import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateLambdaCost } from '@/api/client';
import { Zap, X } from 'lucide-react';

const MEMORY_OPTIONS = [128, 256, 512, 1024, 1536, 2048, 3008, 4096, 5120, 6144, 7168, 8192, 9216, 10240];
const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

export const LambdaConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.lambdaConfig);
  const updateConfig = useServiceConfigStore(s => s.updateLambdaConfig);
  const setLambdaCost = usePricingStore(s => s.setLambdaCost);
  
  // Ensure all numeric values are valid (not NaN or undefined)
  const safeConfig = {
    ...config,
    requests_per_month: Number.isFinite(config.requests_per_month) ? config.requests_per_month : 1000000,
    average_duration_ms: Number.isFinite(config.average_duration_ms) ? config.average_duration_ms : 200,
    allocated_memory_mb: Number.isFinite(config.allocated_memory_mb) ? config.allocated_memory_mb : 512,
    provisioned_concurrency: {
      enabled: config.provisioned_concurrency?.enabled ?? false,
      count: Number.isFinite(config.provisioned_concurrency?.count) ? config.provisioned_concurrency.count : 0,
    },
  };
  
  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
    setLocalConfig(newConfig);
  };

  const handleProvisionedChange = (field, value) => {
    const newConfig = {
      ...localConfig,
      provisioned_concurrency: {
        ...localConfig.provisioned_concurrency,
        [field]: value,
      },
    };
    setLocalConfig(newConfig);
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      // Map frontend field names to backend API field names
      const apiParams = {
        region: localConfig.region,
        architecture: localConfig.architecture,
        requests_per_month: localConfig.requests_per_month || 0,
        duration_ms: localConfig.average_duration_ms || 128,
        memory_mb: localConfig.allocated_memory_mb || 128,
        ephemeral_storage_mb: localConfig.ephemeral_storage_mb || 512,
        provisioned_concurrency: localConfig.provisioned_concurrency?.enabled
          ? localConfig.provisioned_concurrency.count || 0
          : 0,
        include_free_tier: localConfig.include_free_tier ?? true,
      };

      const result = await calculateLambdaCost(apiParams);
      setCost(result);
      setLambdaCost(result);
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
          <Zap className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">Lambda Configuration</h3>
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

        {/* Architecture */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            ⚙️ ARCHITECTURE
          </label>
          <div className="space-y-2">
            {[
              { label: 'x86_64 (Intel/AMD)', value: 'x86_64', hint: 'Standard pricing' },
              { label: 'ARM64 (Graviton2)', value: 'arm64', hint: '~20% cheaper' },
            ].map(option => (
              <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input
                  type="radio"
                  name="architecture"
                  value={option.value}
                  checked={localConfig.architecture === option.value}
                  onChange={(e) => handleChange('architecture', e.target.value)}
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

        {/* Number of Requests */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Requests per Month
          </label>
          <input
            type="number"
            value={localConfig.requests_per_month}
            onChange={(e) => handleChange('requests_per_month', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 1M requests FREE every month</p>
        </div>

        {/* Average Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Duration per Request (milliseconds)
          </label>
          <input
            type="number"
            value={localConfig.average_duration_ms || 0}
            onChange={(e) => handleChange('average_duration_ms', parseInt(e.target.value) || 0)}
            min="1"
            max="900000"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Max: 15 minutes (900,000 ms)</p>
        </div>

        {/* Allocated Memory */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Allocated Memory (MB)
          </label>
          <select
            value={localConfig.allocated_memory_mb}
            onChange={(e) => handleChange('allocated_memory_mb', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {MEMORY_OPTIONS.map(mb => (
              <option key={mb} value={mb}>{mb} MB</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 Memory determines CPU allocation</p>
        </div>

        {/* Free Tier */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={localConfig.include_free_tier}
              onChange={(e) => handleChange('include_free_tier', e.target.checked)}
              className="w-4 h-4 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">Include Free Tier</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">📋 1M requests + 400K GB-seconds free/month</p>
        </div>

        {/* Provisioned Concurrency */}
        <div className="border-t pt-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={localConfig.provisioned_concurrency.enabled}
                onChange={(e) => handleProvisionedChange('enabled', e.target.checked)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">Enable Provisioned Concurrency</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">⚠️ Charges 24/7 regardless of usage</p>
          </div>
          {localConfig.provisioned_concurrency.enabled && (
            <div className="mt-3 ml-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Instances
              </label>
              <input
                type="number"
                value={localConfig.provisioned_concurrency.count}
                onChange={(e) => handleProvisionedChange('count', parseInt(e.target.value))}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
              />
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Requests:</span>
                <span className="font-medium">${cost.breakdown.requests_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Duration:</span>
                <span className="font-medium">${cost.breakdown.compute_cost.toFixed(4)}</span>
              </div>
              {cost.breakdown.provisioned_concurrency_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Provisioned:</span>
                  <span className="font-medium">${cost.breakdown.provisioned_concurrency_cost.toFixed(2)}</span>
                </div>
              )}
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
