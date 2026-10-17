import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateEC2Cost, getEC2InstanceTypes } from '@/api/client';
import { Server, X } from 'lucide-react';

// Only regions that exist in the backend's EC2 pricing data.
// To add a region later, load its prices on the backend, then add it here.
const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
};

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ');
  }
  return error?.message || 'Something went wrong';
};

export const EC2ConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore((s) => s.ec2Config) || {};
  const updateConfig = useServiceConfigStore((s) => s.updateEC2Config);
  const setEC2Cost = usePricingStore((s) => s.setEC2Cost);

  const safeConfig = {
    ...config,
    region: Object.values(REGIONS).includes(config.region)
      ? config.region
      : 'us-east-1',
    instance_type: config.instance_type || 't3.medium',
    instance_count: Number.isFinite(config.instance_count) ? config.instance_count : 1,
    hours_per_month: Number.isFinite(config.hours_per_month) ? config.hours_per_month : 730,
  };

  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [instanceTypes, setInstanceTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTypesLoading(true);
    getEC2InstanceTypes(localConfig.region)
      .then((res) => {
        if (cancelled) return;
        const types = res.instance_types || [];
        setInstanceTypes(types);
        setLocalConfig((prev) =>
          !types.length || types.includes(prev.instance_type)
            ? prev
            : { ...prev, instance_type: types[0] }
        );
      })
      .catch(() => {
        if (!cancelled) setInstanceTypes([]);
      })
      .finally(() => {
        if (!cancelled) setTypesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [localConfig.region]);

  const handleChange = (field, value) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCalculate = async () => {
    if (typesLoading) return;
    if (instanceTypes.length === 0) {
      setError('No instance types are available for this region.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        region: localConfig.region,
        instance_type: localConfig.instance_type,
        instance_count: Number(localConfig.instance_count) || 1,
        hours_per_month: Number(localConfig.hours_per_month) || 730,
        include_free_tier: true,
      };

      const result = await calculateEC2Cost(apiParams);
      setCost(result);
      setEC2Cost(result);
      updateConfig(localConfig);
    } catch (err) {
      console.error('Error calculating cost:', err.response?.status, err.response?.data || err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg">
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">EC2 Configuration</h3>
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
          <p className="text-xs text-gray-500 mt-1">💡 Pricing data is currently available for this region only</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🖥️ Instance Type</label>
          <select
            value={localConfig.instance_type}
            onChange={(e) => handleChange('instance_type', e.target.value)}
            disabled={typesLoading || instanceTypes.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
          >
            {instanceTypes.length === 0 && (
              <option value={localConfig.instance_type}>
                {typesLoading ? 'Loading...' : 'No instance types for this region'}
              </option>
            )}
            {instanceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 Linux, shared tenancy, on-demand pricing</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Instances</label>
          <input
            type="number"
            min="1"
            value={localConfig.instance_count || ''}
            onChange={(e) =>
              handleChange('instance_count', e.target.value === '' ? '' : parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hours per Month (each instance)</label>
          <input
            type="number"
            min="1"
            max="744"
            value={localConfig.hours_per_month || ''}
            onChange={(e) =>
              handleChange('hours_per_month', e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 730 hours = running 24/7 for a month</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md p-3">
            ⚠️ {error}
          </div>
        )}

        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Compute:</span>
                <span className="font-medium">${cost.breakdown.compute_cost.toFixed(2)}</span>
              </div>
              {cost.details?.hourly_rate !== undefined && (
                <div className="flex justify-between text-gray-700">
                  <span>Rate per instance-hour:</span>
                  <span className="font-medium">${Number(cost.details.hourly_rate).toFixed(4)}</span>
                </div>
              )}
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
            disabled={loading || typesLoading}
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