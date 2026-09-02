import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateCloudWatchCost } from '@/api/client';
import { Activity, X } from 'lucide-react';

const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

export const CloudWatchConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.cloudWatchConfig);
  const updateConfig = useServiceConfigStore(s => s.updateCloudWatchConfig);
  const setCloudWatchCost = usePricingStore(s => s.setCloudWatchCost);

  const safeConfig = {
    ...config,
    custom_metrics: Number.isFinite(config.custom_metrics) ? config.custom_metrics : 50,
    standard_alarms: Number.isFinite(config.standard_alarms) ? config.standard_alarms : 10,
    high_res_alarms: Number.isFinite(config.high_res_alarms) ? config.high_res_alarms : 0,
    logs_ingested_gb: Number.isFinite(config.logs_ingested_gb) ? config.logs_ingested_gb : 10,
    logs_storage_gb: Number.isFinite(config.logs_storage_gb) ? config.logs_storage_gb : 50,
    dashboards: Number.isFinite(config.dashboards) ? config.dashboards : 2,
    api_requests_per_month: Number.isFinite(config.api_requests_per_month) ? config.api_requests_per_month : 1000000,
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
        custom_metrics: Number(localConfig.custom_metrics) || 0,
        standard_alarms: Number(localConfig.standard_alarms) || 0,
        high_res_alarms: Number(localConfig.high_res_alarms) || 0,
        logs_ingested_gb: Number(localConfig.logs_ingested_gb) || 0,
        logs_storage_gb: Number(localConfig.logs_storage_gb) || 0,
        dashboards: Number(localConfig.dashboards) || 0,
        api_requests_per_month: Number(localConfig.api_requests_per_month) || 0,
        include_free_tier: true,
      };

      const result = await calculateCloudWatchCost(apiParams);
      setCost(result);
      setCloudWatchCost(result);
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
          <Activity className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">CloudWatch Configuration</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">Custom Metrics</label>
          <input
            type="number"
            value={localConfig.custom_metrics || ''}
            onChange={(e) => handleChange('custom_metrics', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 10 metrics/month FREE</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Standard Alarms</label>
          <input
            type="number"
            value={localConfig.standard_alarms || ''}
            onChange={(e) => handleChange('standard_alarms', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">High-Resolution Alarms</label>
          <input
            type="number"
            value={localConfig.high_res_alarms || ''}
            onChange={(e) => handleChange('high_res_alarms', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 10 alarms/month FREE (shared with standard)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logs Ingested (GB/month)</label>
          <input
            type="number"
            value={localConfig.logs_ingested_gb || ''}
            onChange={(e) => handleChange('logs_ingested_gb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 5 GB/month FREE</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logs Storage (GB)</label>
          <input
            type="number"
            value={localConfig.logs_storage_gb || ''}
            onChange={(e) => handleChange('logs_storage_gb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Dashboards</label>
          <input
            type="number"
            value={localConfig.dashboards || ''}
            onChange={(e) => handleChange('dashboards', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 3 dashboards FREE</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">API Requests per Month</label>
          <input
            type="number"
            value={localConfig.api_requests_per_month || ''}
            onChange={(e) => handleChange('api_requests_per_month', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 GetMetricData, PutMetricData, etc.</p>
        </div>

        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Metrics:</span>
                <span className="font-medium">${cost.breakdown.metrics_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Alarms:</span>
                <span className="font-medium">${cost.breakdown.alarms_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Logs Ingestion:</span>
                <span className="font-medium">${cost.breakdown.logs_ingestion_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Logs Storage:</span>
                <span className="font-medium">${cost.breakdown.logs_storage_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Dashboards:</span>
                <span className="font-medium">${cost.breakdown.dashboards_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>API Requests:</span>
                <span className="font-medium">${cost.breakdown.api_requests_cost.toFixed(4)}</span>
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