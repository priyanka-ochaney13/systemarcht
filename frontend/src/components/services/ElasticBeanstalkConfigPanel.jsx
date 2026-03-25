'use client';

import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateElasticBeanstalkCost, getInstanceTypes } from '@/api/client';
import { Cloud, X, ChevronDown, ChevronUp } from 'lucide-react';

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
  'gp3': { label: 'General Purpose (gp3)', price: '$0.10/GB-month' },
  'io2': { label: 'Provisioned IOPS (io2)', price: '$0.125/GB-month' },
  'standard': { label: 'Magnetic (standard)', price: '$0.05/GB-month' },
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
  const [expandedSections, setExpandedSections] = useState({
    loadBalancer: false,
    storage: false,
    freeTier: false,
  });

  // Fetch instance types on mount and when region changes
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

    // Constraints based on environment type
    if (field === 'environment_type') {
      if (value === 'single') {
        newConfig.instance_count = 1;
        newConfig.enable_load_balancer = false;
        newConfig.enable_auto_scaling = false;
      } else {
        newConfig.instance_count = Math.max(2, newConfig.instance_count);
      }
    }

    // Constraints for load balancer
    if (field === 'enable_load_balancer' && !value) {
      newConfig.cross_zone_enabled = false;
    }

    // Instance count constraints
    if (field === 'instance_count') {
      if (newConfig.environment_type === 'single') {
        newConfig.instance_count = 1;
      } else {
        newConfig.instance_count = Math.max(2, Math.min(100, value));
      }
    }

    // Max instances must be >= min instances
    if (field === 'max_instances' && value < newConfig.min_instances) {
      newConfig.max_instances = newConfig.min_instances;
    }
    if (field === 'min_instances' && value > newConfig.max_instances) {
      newConfig.min_instances = newConfig.max_instances;
    }

    setLocalConfig(newConfig);
  };

  const handleToggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateElasticBeanstalkCost({
        ...localConfig,
        region: localConfig.region,
        environment_type: localConfig.environment_type,
        instance_type: localConfig.instance_type,
        instance_count: parseInt(localConfig.instance_count) || 1,
        enable_load_balancer: localConfig.enable_load_balancer || false,
        cross_zone_enabled: localConfig.cross_zone_enabled || false,
        enable_auto_scaling: localConfig.enable_auto_scaling || false,
        min_instances: parseInt(localConfig.min_instances) || 1,
        max_instances: parseInt(localConfig.max_instances) || 10,
        target_cpu_utilization: parseInt(localConfig.target_cpu_utilization) || 70,
        storage_gb: parseInt(localConfig.storage_gb) || 30,
        volume_type: localConfig.volume_type || 'gp3',
        enable_enhanced_monitoring: localConfig.enable_enhanced_monitoring || false,
        data_transfer_gb: parseInt(localConfig.data_transfer_gb) || 10,
        include_free_tier: localConfig.include_free_tier || false,
      });

      setCost(result);
      setElasticBeanstalkCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
      alert('Error calculating cost: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig = {
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
    };
    setLocalConfig(defaultConfig);
    setCost(null);
  };

  const instanceTypeOptions = instanceTypes.map(it => ({
    value: it.type,
    label: `${it.type} - ${it.vcpu} vCPU, ${it.memory_gb}GB RAM, $${it.hourly_rate.toFixed(4)}/h`,
    family: it.family,
    specs: `${it.vcpu} vCPU, ${it.memory_gb}GB`,
  }));

  // Group by family
  const groupedInstanceTypes = {};
  instanceTypeOptions.forEach(it => {
    if (!groupedInstanceTypes[it.family]) {
      groupedInstanceTypes[it.family] = [];
    }
    groupedInstanceTypes[it.family].push(it);
  });

  return (
    <div className="fixed right-0 top-0 h-screen w-96 bg-white shadow-lg overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-red-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Cloud size={20} />
          <span className="font-semibold">Elastic Beanstalk</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium mb-2">📍 Region</label>
          <select
            value={Object.entries(REGIONS).find(([_, code]) => code === localConfig.region)?.[0] || 'US East (N. Virginia)'}
            onChange={(e) => handleChange('region', REGIONS[e.target.value])}
            className="w-full p-2 border rounded bg-white"
          >
            {Object.entries(REGIONS).map(([name, code]) => (
              <option key={code} value={name}>{name}</option>
            ))}
          </select>
        </div>

        {/* Environment Type */}
        <div>
          <label className="block text-sm font-medium mb-2">🖥️ Environment Type</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="env_type"
                checked={localConfig.environment_type === 'single'}
                onChange={() => handleChange('environment_type', 'single')}
              />
              <span className="text-sm">Single Instance (Development/Testing)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="env_type"
                checked={localConfig.environment_type === 'load_balanced'}
                onChange={() => handleChange('environment_type', 'load_balanced')}
              />
              <span className="text-sm">Load Balanced (Production HA)</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            💡 Single instance is good for development/testing. Load balanced for production.
          </p>
        </div>

        {/* Instance Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Instance Type</label>
          <select
            value={localConfig.instance_type}
            onChange={(e) => handleChange('instance_type', e.target.value)}
            className="w-full p-2 border rounded bg-white text-sm"
          >
            {Object.entries(groupedInstanceTypes).map(([family, types]) => (
              <optgroup key={family} label={family}>
                {types.map(it => (
                  <option key={it.value} value={it.value}>{it.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            💡 Choose based on workload: General Purpose (t2/t3) for web, Compute (c5) for processing
          </p>
        </div>

        {/* Instance Count */}
        <div>
          <label className="block text-sm font-medium mb-2">Number of Instances</label>
          <input
            type="number"
            value={localConfig.instance_count}
            onChange={(e) => handleChange('instance_count', parseInt(e.target.value) || 1)}
            min={localConfig.environment_type === 'single' ? 1 : 2}
            max={100}
            disabled={localConfig.environment_type === 'single'}
            className="w-full p-2 border rounded disabled:bg-gray-100"
          />
          {localConfig.instance_count > 1 && !localConfig.enable_load_balancer && (
            <p className="text-xs text-yellow-600 mt-1">⚠️ Load balancer recommended for 2+ instances</p>
          )}
        </div>

        {/* Load Balancer Section */}
        <div className="border rounded p-3 bg-gray-50">
          <button
            onClick={() => handleToggleSection('loadBalancer')}
            className="w-full flex justify-between items-center text-sm font-medium"
          >
            <span>⚖️ Load Balancer & Scaling</span>
            {expandedSections.loadBalancer ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expandedSections.loadBalancer && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enable_load_balancer}
                  onChange={(e) => handleChange('enable_load_balancer', e.target.checked)}
                  disabled={localConfig.environment_type === 'single'}
                />
                <span className="text-sm">Enable Application Load Balancer (+$16/month)</span>
              </label>

              {localConfig.enable_load_balancer && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localConfig.cross_zone_enabled}
                    onChange={(e) => handleChange('cross_zone_enabled', e.target.checked)}
                  />
                  <span className="text-sm">Cross-Zone Load Balancing (+$3.65/month)</span>
                </label>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enable_auto_scaling}
                  onChange={(e) => handleChange('enable_auto_scaling', e.target.checked)}
                  disabled={localConfig.environment_type === 'single'}
                />
                <span className="text-sm">Enable Auto-Scaling</span>
              </label>

              {localConfig.enable_auto_scaling && (
                <div className="space-y-2 ml-6">
                  <div>
                    <label className="text-xs font-medium">Min Instances:</label>
                    <input
                      type="number"
                      value={localConfig.min_instances}
                      onChange={(e) => handleChange('min_instances', parseInt(e.target.value) || 1)}
                      min={1}
                      max={100}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Max Instances:</label>
                    <input
                      type="number"
                      value={localConfig.max_instances}
                      onChange={(e) => handleChange('max_instances', parseInt(e.target.value) || 10)}
                      min={localConfig.min_instances}
                      max={100}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium">Target CPU Utilization (%):</label>
                    <input
                      type="number"
                      value={localConfig.target_cpu_utilization}
                      onChange={(e) => handleChange('target_cpu_utilization', parseInt(e.target.value) || 70)}
                      min={10}
                      max={100}
                      className="w-full p-1 border rounded text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Storage Section */}
        <div className="border rounded p-3 bg-gray-50">
          <button
            onClick={() => handleToggleSection('storage')}
            className="w-full flex justify-between items-center text-sm font-medium"
          >
            <span>💾 Storage & Monitoring</span>
            {expandedSections.storage ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expandedSections.storage && (
            <div className="mt-3 space-y-3 pt-3 border-t">
              <div>
                <label className="block text-xs font-medium mb-1">Root Volume (EBS):</label>
                <input
                  type="number"
                  value={localConfig.storage_gb}
                  onChange={(e) => handleChange('storage_gb', parseInt(e.target.value) || 30)}
                  min={1}
                  max={16000}
                  className="w-full p-1 border rounded text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">GB (Default: 30 GB)</p>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Volume Type:</label>
                <select
                  value={localConfig.volume_type}
                  onChange={(e) => handleChange('volume_type', e.target.value)}
                  className="w-full p-1 border rounded text-sm bg-white"
                >
                  {Object.entries(VOLUME_TYPES).map(([value, { label }]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enable_enhanced_monitoring}
                  onChange={(e) => handleChange('enable_enhanced_monitoring', e.target.checked)}
                />
                <span className="text-sm">Enhanced Monitoring ($0.35/instance)</span>
              </label>

              <div>
                <label className="block text-xs font-medium mb-1">Data Transfer (GB/month):</label>
                <input
                  type="number"
                  value={localConfig.data_transfer_gb}
                  onChange={(e) => handleChange('data_transfer_gb', parseInt(e.target.value) || 10)}
                  min={0}
                  max={1000000}
                  className="w-full p-1 border rounded text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">🎁 First 1 GB/month free</p>
              </div>
            </div>
          )}
        </div>

        {/* Free Tier Section */}
        <div className="border rounded p-3 bg-gray-50">
          <button
            onClick={() => handleToggleSection('freeTier')}
            className="w-full flex justify-between items-center text-sm font-medium"
          >
            <span>🎁 Free Tier</span>
            {expandedSections.freeTier ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expandedSections.freeTier && (
            <div className="mt-3 space-y-2 pt-3 border-t">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.include_free_tier}
                  onChange={(e) => handleChange('include_free_tier', e.target.checked)}
                />
                <span className="text-sm">Include 12-month AWS Free Tier</span>
              </label>
              <p className="text-xs text-gray-600">
                ℹ️ 950 hours/month t2.micro + 30 GB EBS storage FREE (first-time users only)
              </p>
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="border rounded p-3 bg-blue-50">
            <h3 className="font-semibold text-sm mb-2">💰 Monthly Cost Breakdown</h3>
            <div className="space-y-1 text-xs">
              {cost.breakdown.ec2_instances_cost > 0 && (
                <div className="flex justify-between">
                  <span>EC2 Instances:</span>
                  <span>${cost.breakdown.ec2_instances_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.load_balancer_cost > 0 && (
                <div className="flex justify-between">
                  <span>Load Balancer:</span>
                  <span>${cost.breakdown.load_balancer_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.ebs_storage_cost > 0 && (
                <div className="flex justify-between">
                  <span>EBS Storage:</span>
                  <span>${cost.breakdown.ebs_storage_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.enhanced_monitoring_cost > 0 && (
                <div className="flex justify-between">
                  <span>Enhanced Monitoring:</span>
                  <span>${cost.breakdown.enhanced_monitoring_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.auto_scaling_cost > 0 && (
                <div className="flex justify-between">
                  <span>Auto-Scaling:</span>
                  <span>${cost.breakdown.auto_scaling_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.data_transfer_cost > 0 && (
                <div className="flex justify-between">
                  <span>Data Transfer:</span>
                  <span>${cost.breakdown.data_transfer_cost.toFixed(2)}</span>
                </div>
              )}
              {cost.free_tier_savings > 0 && (
                <div className="flex justify-between text-green-600 pt-1 border-t">
                  <span>Free Tier Savings:</span>
                  <span>-${cost.free_tier_savings.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold border-t pt-1 mt-2">
                <span>TOTAL:</span>
                <span>${cost.breakdown.total_cost.toFixed(2)}</span>
              </div>
            </div>
            {cost.notes && cost.notes.length > 0 && (
              <div className="mt-2 text-xs text-gray-600 border-t pt-2">
                {cost.notes.map((note, i) => (
                  <p key={i}>{note}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded font-medium text-sm"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
