'use client';

import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateElasticBeanstalkCost, getInstanceTypes } from '@/api/client';
import { Server, X } from 'lucide-react';

const REGIONS = {
  'US East (N. Virginia)': 'us-east-1',
  'US East (Ohio)': 'us-east-2',
  'US West (N. California)': 'us-west-1',
  'US West (Oregon)': 'us-west-2',
  'Asia Pacific (Mumbai)': 'ap-south-1',
  'Asia Pacific (Singapore)': 'ap-southeast-1',
  'Asia Pacific (Sydney)': 'ap-southeast-2',
  'EU (Ireland)': 'eu-west-1',
  'EU (Frankfurt)': 'eu-central-1',
  'Canada (Central)': 'ca-central-1',
  'Asia Pacific (Tokyo)': 'ap-northeast-1',
};

const VOLUME_TYPES = {
  'gp3': 'General Purpose (gp3)',
  'io2': 'Provisioned IOPS (io2)',
  'standard': 'Magnetic (standard)',
};

export const ElasticBeanstalkConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.elasticBeanstalkConfig);
  const updateConfig = useServiceConfigStore(s => s.updateElasticBeanstalkConfig);
  const setElasticBeanstalkCost = usePricingStore(s => s.setElasticBeanstalkCost);

  const [localConfig, setLocalConfig] = useState(config || {
    region: 'ap-south-1',
    environment_type: 'single',
    instance_type: 't3.small',
    instance_count: 1,
    enable_load_balancer: false,
    cross_zone_enabled: false,
    enable_auto_scaling: false,
    min_instances: 1,
    max_instances: 10,
    target_cpu_utilization: 70,
    storage_gb: 30,
    volume_type: 'gp3',
    enable_enhanced_monitoring: false,
    data_transfer_gb: 10,
    include_free_tier: false,
  });

  const [instanceTypes, setInstanceTypes] = useState([]);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInstanceTypes = async () => {
      try {
        const result = await getInstanceTypes(localConfig.region);
        setInstanceTypes(result.instance_types || []);
      } catch (error) {
        console.error('Error fetching instance types:', error);
      }
    };
    fetchInstanceTypes();
  }, [localConfig.region]);

  const handleChange = (field, value) => {
    let newConfig = { ...localConfig, [field]: value };

    if (field === 'environment_type') {
      if (value === 'single') {
        newConfig.instance_count = 1;
        newConfig.enable_load_balancer = false;
        newConfig.enable_auto_scaling = false;
      } else {
        newConfig.instance_count = Math.max(2, newConfig.instance_count);
      }
    }

    if (field === 'enable_load_balancer' && !value) {
      newConfig.cross_zone_enabled = false;
      newConfig.enable_auto_scaling = false;
    }

    if (field === 'instance_count') {
      newConfig.instance_count = newConfig.environment_type === 'single'
        ? 1
        : Math.max(2, Math.min(100, value));
    }

    if (field === 'max_instances' && value < newConfig.min_instances) {
      newConfig.max_instances = newConfig.min_instances;
    }
    if (field === 'min_instances' && value > newConfig.max_instances) {
      newConfig.min_instances = newConfig.max_instances;
    }

    setLocalConfig(newConfig);
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateElasticBeanstalkCost({
        ...localConfig,
        instance_count: parseInt(localConfig.instance_count) || 1,
        min_instances: parseInt(localConfig.min_instances) || 1,
        max_instances: parseInt(localConfig.max_instances) || 10,
        target_cpu_utilization: parseInt(localConfig.target_cpu_utilization) || 70,
        storage_gb: parseInt(localConfig.storage_gb) || 30,
        data_transfer_gb: parseInt(localConfig.data_transfer_gb) || 10,
      });

      setCost(result);
      setElasticBeanstalkCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const instanceTypeOptions = instanceTypes.map(it => ({
    value: it.type,
    label: `${it.type} - ${it.vcpu} vCPU, ${it.memory_gb}GB RAM, $${it.hourly_rate.toFixed(4)}/h`,
    family: it.family,
  }));

  const groupedInstanceTypes = {};
  instanceTypeOptions.forEach(it => {
    if (!groupedInstanceTypes[it.family]) groupedInstanceTypes[it.family] = [];
    groupedInstanceTypes[it.family].push(it);
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-gray-900">Elastic Beanstalk Configuration</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">📍 Region</label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(REGIONS).map(([name, code]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        </div>

        {/* Environment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">🖥️ Environment Type</label>
          <select
            value={localConfig.environment_type}
            onChange={(e) => handleChange('environment_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            <option value="single">Single Instance (Development/Testing)</option>
            <option value="load_balanced">Load Balanced (Production HA)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 Single instance is good for dev/test. Load balanced for production.</p>
        </div>

        {/* Instance Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Instance Type</label>
          <select
            value={localConfig.instance_type}
            onChange={(e) => handleChange('instance_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(groupedInstanceTypes).map(([family, types]) => (
              <optgroup key={family} label={family}>
                {types.map(it => (
                  <option key={it.value} value={it.value}>{it.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">💡 General Purpose (t2/t3) for web, Compute (c5) for processing</p>
        </div>

        {/* Instance Count */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Number of Instances</label>
          <input
            type="number"
            value={localConfig.instance_count}
            onChange={(e) => handleChange('instance_count', parseInt(e.target.value) || 1)}
            min={localConfig.environment_type === 'single' ? 1 : 2}
            max={100}
            disabled={localConfig.environment_type === 'single'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-400"
          />
          {localConfig.instance_count > 1 && !localConfig.enable_load_balancer && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Load balancer recommended for 2+ instances</p>
          )}
        </div>

        {/* Load Balancer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">⚖️ Load Balancer & Scaling</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={localConfig.enable_load_balancer}
                onChange={(e) => handleChange('enable_load_balancer', e.target.checked)}
                disabled={localConfig.environment_type === 'single'}
                className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              />
              Enable Application Load Balancer (+$16/month)
            </label>

            {localConfig.enable_load_balancer && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 ml-1">
                <input
                  type="checkbox"
                  checked={localConfig.cross_zone_enabled}
                  onChange={(e) => handleChange('cross_zone_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500"
                />
                Cross-Zone Load Balancing (+$3.65/month)
              </label>
            )}

            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
              <input
                type="checkbox"
                checked={localConfig.enable_auto_scaling}
                onChange={(e) => handleChange('enable_auto_scaling', e.target.checked)}
                disabled={localConfig.environment_type === 'single' || !localConfig.enable_load_balancer}
                className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500 disabled:opacity-50"
              />
              Enable Auto-Scaling (requires Load Balancer)
            </label>
          </div>

          {localConfig.enable_auto_scaling && (
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Min Instances</label>
                <input
                  type="number"
                  value={localConfig.min_instances}
                  onChange={(e) => handleChange('min_instances', parseInt(e.target.value) || 1)}
                  min={1}
                  max={100}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Max Instances</label>
                <input
                  type="number"
                  value={localConfig.max_instances}
                  onChange={(e) => handleChange('max_instances', parseInt(e.target.value) || 10)}
                  min={localConfig.min_instances}
                  max={100}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Target CPU %</label>
                <input
                  type="number"
                  value={localConfig.target_cpu_utilization}
                  onChange={(e) => handleChange('target_cpu_utilization', parseInt(e.target.value) || 70)}
                  min={10}
                  max={100}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* Storage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Root Volume (EBS, GB)</label>
          <input
            type="number"
            value={localConfig.storage_gb}
            onChange={(e) => handleChange('storage_gb', parseInt(e.target.value) || 30)}
            min={1}
            max={16000}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 Default: 30 GB</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Volume Type</label>
          <select
            value={localConfig.volume_type}
            onChange={(e) => handleChange('volume_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(VOLUME_TYPES).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={localConfig.enable_enhanced_monitoring}
              onChange={(e) => handleChange('enable_enhanced_monitoring', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500"
            />
            Enhanced Monitoring ($0.35/instance)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Data Transfer (GB/month)</label>
          <input
            type="number"
            value={localConfig.data_transfer_gb}
            onChange={(e) => handleChange('data_transfer_gb', parseInt(e.target.value) || 10)}
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">💡 First 1 GB/month FREE</p>
        </div>

        {/* Free Tier */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
            <input
              type="checkbox"
              checked={localConfig.include_free_tier}
              onChange={(e) => handleChange('include_free_tier', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500"
            />
            Include 12-month AWS Free Tier
          </label>
          <p className="text-xs text-gray-500 mt-1">💡 950 hours/month t2.micro + 30 GB EBS storage FREE (first-time users only)</p>
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
            <p className="text-sm font-semibold text-gray-900 mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              {cost.breakdown.ec2_instances_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>EC2 Instances:</span>
                  <span className="font-medium">${cost.breakdown.ec2_instances_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.load_balancer_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Load Balancer:</span>
                  <span className="font-medium">${cost.breakdown.load_balancer_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.ebs_storage_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>EBS Storage:</span>
                  <span className="font-medium">${cost.breakdown.ebs_storage_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.enhanced_monitoring_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Enhanced Monitoring:</span>
                  <span className="font-medium">${cost.breakdown.enhanced_monitoring_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.auto_scaling_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Auto-Scaling:</span>
                  <span className="font-medium">${cost.breakdown.auto_scaling_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.data_transfer_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Data Transfer:</span>
                  <span className="font-medium">${cost.breakdown.data_transfer_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.free_tier_savings > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Free Tier Savings:</span>
                  <span className="font-medium">-${cost.free_tier_savings.toFixed(2)}</span>
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