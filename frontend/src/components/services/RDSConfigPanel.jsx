import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateRDSCost, getRDSInstanceTypes } from '@/api/client';
import { Database, X } from 'lucide-react';

// Only regions that exist in the backend's RDS pricing data.
// To add a region later, load its prices on the backend, then add it here.
const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
};

const ENGINES = ['MySQL', 'PostgreSQL', 'MariaDB'];

const getErrorMessage = (error) => {
  const detail = error?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(', ');
  }
  return error?.message || 'Something went wrong';
};

export const RDSConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore((s) => s.rdsConfig) || {};
  const updateConfig = useServiceConfigStore((s) => s.updateRDSConfig);
  const setRDSCost = usePricingStore((s) => s.setRDSCost);

  const safeConfig = {
    ...config,
    region: Object.values(REGIONS).includes(config.region)
      ? config.region
      : 'us-east-1',
    db_engine: config.db_engine || 'MySQL',
    deployment: config.deployment || 'Single-AZ',
    instance_type: config.instance_type || 'db.t3.medium',
    instance_count: Number.isFinite(config.instance_count) ? config.instance_count : 1,
    hours_per_month: Number.isFinite(config.hours_per_month) ? config.hours_per_month : 730,
    storage_gb: Number.isFinite(config.storage_gb) ? config.storage_gb : 20,
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
    getRDSInstanceTypes(localConfig.region, localConfig.db_engine, localConfig.deployment)
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
  }, [localConfig.region, localConfig.db_engine, localConfig.deployment]);

  const handleChange = (field, value) => {
    setLocalConfig((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleCalculate = async () => {
    if (typesLoading) return;
    if (instanceTypes.length === 0) {
      setError('No instance classes are available for this selection.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiParams = {
        region: localConfig.region,
        db_engine: localConfig.db_engine,
        deployment: localConfig.deployment,
        instance_type: localConfig.instance_type,
        instance_count: Number(localConfig.instance_count) || 1,
        hours_per_month: Number(localConfig.hours_per_month) || 730,
        storage_gb: Number(localConfig.storage_gb) || 0,
        include_free_tier: true,
      };

      const result = await calculateRDSCost(apiParams);
      setCost(result);
      setRDSCost(result);
      updateConfig(localConfig);
    } catch (err) {
      console.error('Error calculating cost:', err.response?.status, err.response?.data || err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border w-full max-w-md shadow-sm">
      <div className="flex items-center justify-between bg-muted/70 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: '#3B48CC' }} />
          <h3 className="font-semibold text-foreground">RDS Configuration</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">📍 Region</label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          >
            {Object.entries(REGIONS).map(([name, value]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">💡 Pricing data is currently available for this region only</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">🗄️ Database Engine</label>
          <select
            value={localConfig.db_engine}
            onChange={(e) => handleChange('db_engine', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          >
            {ENGINES.map((engine) => (
              <option key={engine} value={engine}>{engine}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-3">⚙️ DEPLOYMENT</label>
          <div className="space-y-2">
            {[
              { label: 'Single-AZ', value: 'Single-AZ', hint: 'One instance' },
              { label: 'Multi-AZ', value: 'Multi-AZ', hint: 'Standby replica, higher availability' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-muted/50"
              >
                <input
                  type="radio"
                  name="rds_deployment"
                  value={option.value}
                  checked={localConfig.deployment === option.value}
                  onChange={(e) => handleChange('deployment', e.target.value)}
                  className="w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="font-medium text-foreground">{option.label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{option.hint}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">🖥️ Instance Class</label>
          <select
            value={localConfig.instance_type}
            onChange={(e) => handleChange('instance_type', e.target.value)}
            disabled={typesLoading || instanceTypes.length === 0}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
          >
            {instanceTypes.length === 0 && (
              <option value={localConfig.instance_type}>
                {typesLoading ? 'Loading...' : 'No instance classes for this selection'}
              </option>
            )}
            {instanceTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-1">💡 On-demand pricing, no license required engines</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Number of DB Instances</label>
          <input
            type="number"
            min="1"
            value={localConfig.instance_count || ''}
            onChange={(e) =>
              handleChange('instance_count', e.target.value === '' ? '' : parseInt(e.target.value))
            }
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Hours per Month (each instance)</label>
          <input
            type="number"
            min="1"
            max="744"
            value={localConfig.hours_per_month || ''}
            onChange={(e) =>
              handleChange('hours_per_month', e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          />
          <p className="text-xs text-muted-foreground mt-1">💡 730 hours = running 24/7 for a month</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">Allocated Storage (GB per instance)</label>
          <input
            type="number"
            min="0"
            value={localConfig.storage_gb === 0 ? 0 : localConfig.storage_gb || ''}
            onChange={(e) =>
              handleChange('storage_gb', e.target.value === '' ? '' : parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          />
          <p className="text-xs text-muted-foreground mt-1">💡 Priced at the General Purpose SSD rate</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md p-3">
            ⚠️ {error}
          </div>
        )}

        {cost && (
          <div className="bg-muted/50 p-4 rounded-md border border-border">
            <p className="text-sm font-semibold text-foreground mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-foreground/80">
                <span>Instances:</span>
                <span className="font-medium">${cost.breakdown.instance_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-foreground/80">
                <span>Storage:</span>
                <span className="font-medium">${cost.breakdown.storage_cost.toFixed(2)}</span>
              </div>
            </div>
            <div className="border-t border-input pt-2 mt-2 flex justify-between text-sm font-semibold">
              <span>Total:</span>
              <span className="text-primary">${cost.breakdown.total_cost.toFixed(2)}/month</span>
            </div>
            {cost.notes && cost.notes.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border">
                {cost.notes.map((note, i) => (
                  <p key={i} className="text-xs text-muted-foreground">⚠️ {note}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <button
            onClick={handleCalculate}
            disabled={loading || typesLoading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-secondary hover:bg-muted text-secondary-foreground font-semibold py-2 px-4 rounded-md transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};