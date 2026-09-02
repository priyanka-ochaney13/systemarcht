import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateElastiCacheCost } from '@/api/client';
import { Zap as CacheIcon, X } from 'lucide-react';

const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'EU (Ireland)': 'eu-west-1',
};

const ENGINES = ['redis', 'memcached', 'valkey'];

const NODE_TYPES = [
  'cache.t3.micro',
  'cache.t3.small',
  'cache.t3.medium',
  'cache.m6g.large',
  'cache.m6g.xlarge',
  'cache.r6g.large',
  'cache.r6g.xlarge',
  'cache.r7g.large',
];

export const ElastiCacheConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.elastiCacheConfig);
  const updateConfig = useServiceConfigStore(s => s.updateElastiCacheConfig);
  const setElastiCacheCost = usePricingStore(s => s.setElastiCacheCost);

  const safeConfig = {
    ...config,
    number_of_nodes: Number.isFinite(config.number_of_nodes) ? config.number_of_nodes : 1,
    hours_per_month: Number.isFinite(config.hours_per_month) ? config.hours_per_month : 730,
    backup_storage_gb: Number.isFinite(config.backup_storage_gb) ? config.backup_storage_gb : 0,
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
        engine: localConfig.engine,
        node_type: localConfig.node_type,
        number_of_nodes: Number(localConfig.number_of_nodes) || 1,
        hours_per_month: Number(localConfig.hours_per_month) || 730,
        backup_storage_gb: Number(localConfig.backup_storage_gb) || 0,
        include_free_tier: true,
      };

      const result = await calculateElastiCacheCost(apiParams);
      setCost(result);
      setElastiCacheCost(result);
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
          <CacheIcon className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">ElastiCache Configuration</h3>
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
          <label className="block text-sm font-medium text-gray-700 mb-2">⚙️ Engine</label>
          <select
            value={localConfig.engine}
            onChange={(e) => handleChange('engine', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {ENGINES.map(eng => (
              <option key={eng} value={eng}>{eng.charAt(0).toUpperCase() + eng.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Node Type</label>
          <select
            value={localConfig.node_type}
            onChange={(e) => handleChange('node_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {NODE_TYPES.map(nt => (
              <option key={nt} value={nt}>{nt}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Nodes</label>
          <input
            type="number"
            value={localConfig.number_of_nodes || ''}
            onChange={(e) => handleChange('number_of_nodes', e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hours Running per Month</label>
          <input
            type="number"
            value={localConfig.hours_per_month || ''}
            onChange={(e) => handleChange('hours_per_month', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 730 = running 24/7</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Backup Storage (GB)</label>
          <input
            type="number"
            value={localConfig.backup_storage_gb || ''}
            onChange={(e) => handleChange('backup_storage_gb', e.target.value === '' ? '' : parseFloat(e.target.value))}
            disabled={localConfig.engine === 'memcached'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          {localConfig.engine === 'memcached' && (
            <p className="text-xs text-gray-500 mt-1">⚠️ Memcached does not support snapshots</p>
          )}
        </div>

        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-700">
                <span>Node Cost:</span>
                <span className="font-medium">${cost.breakdown.node_cost.toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Backup Storage:</span>
                <span className="font-medium">${cost.breakdown.backup_storage_cost.toFixed(4)}</span>
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