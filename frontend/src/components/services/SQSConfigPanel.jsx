import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateSQSCost } from '@/api/client';
import { ListOrdered, X } from 'lucide-react';

const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

export const SQSConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.sqsConfig);
  const updateConfig = useServiceConfigStore(s => s.updateSQSConfig);
  const setSQSCost = usePricingStore(s => s.setSQSCost);

  const safeConfig = {
    ...config,
    requests_per_month: Number.isFinite(config.requests_per_month) ? config.requests_per_month : 1000000,
    avg_payload_size_kb: Number.isFinite(config.avg_payload_size_kb) ? config.avg_payload_size_kb : 1,
    data_transfer_out_gb: Number.isFinite(config.data_transfer_out_gb) ? config.data_transfer_out_gb : 0,
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
        region: localConfig.region,
        queue_type: localConfig.queue_type,
        requests_per_month: Number(localConfig.requests_per_month) || 0,
        avg_payload_size_kb: Number(localConfig.avg_payload_size_kb) || 1,
        data_transfer_out_gb: Number(localConfig.data_transfer_out_gb) || 0,
        include_free_tier: true,
      };

      const result = await calculateSQSCost(apiParams);
      setCost(result);
      setSQSCost(result);
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
          <ListOrdered className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">SQS Configuration</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📍 Region</label>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📬 Queue Type</label>
          <select
            value={localConfig.queue_type}
            onChange={(e) => handleChange('queue_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            <option value="standard">Standard</option>
            <option value="fifo">FIFO</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Requests per Month</label>
          <input
            type="number"
            value={localConfig.requests_per_month || ''}
            onChange={(e) => handleChange('requests_per_month', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 1M requests/month FREE</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Average Payload Size (KB)</label>
          <input
            type="number"
            value={localConfig.avg_payload_size_kb || ''}
            onChange={(e) => handleChange('avg_payload_size_kb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Billed per 64KB chunk</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Transfer Out (GB)</label>
          <input
            type="number"
            value={localConfig.data_transfer_out_gb || ''}
            onChange={(e) => handleChange('data_transfer_out_gb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Requests:</span>
                <span className="font-medium">${cost.breakdown.requests_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Data Transfer:</span>
                <span className="font-medium">${cost.breakdown.data_transfer_cost.toFixed(4)}</span>
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