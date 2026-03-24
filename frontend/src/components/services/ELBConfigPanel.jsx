import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateELBCost, getELBRegions, getELBTypes } from '@/api/client';
import { Zap, X, HelpCircle } from 'lucide-react';

export const ELBConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.elbConfig);
  const updateConfig = useServiceConfigStore(s => s.updateELBConfig);
  const setELBCost = usePricingStore(s => s.setELBCost);
  
  const [localConfig, setLocalConfig] = useState(config);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);
  const [lbTypes, setLBTypes] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [regionsData, typesData] = await Promise.all([
          getELBRegions(),
          getELBTypes(),
        ]);
        setRegions(regionsData);
        setLBTypes(typesData);
      } catch (e) {
        console.error("Failed to fetch ELB data", e);
        setRegions(['us-east-1', 'us-west-2', 'eu-west-1']);
        setLBTypes({
          application: { name: 'Application Load Balancer (ALB)' },
          network: { name: 'Network Load Balancer (NLB)' },
          gateway: { name: 'Gateway Load Balancer (GWLB)' },
          classic: { name: 'Classic Load Balancer (CLB)' },
        });
      }
    };
    fetchData();
  }, []);

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateELBCost(localConfig);
      setCost(result);
      setELBCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLBType = localConfig.lb_type;
  const isALB = currentLBType === 'application';
  const isNLB = currentLBType === 'network';
  const isGWLB = currentLBType === 'gateway';
  const isCLB = currentLBType === 'classic';

  return (
    <div className="bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Zap className="w-5 h-5" style={{ color: '#FF9900' }} />
          </div>
          <h2 className="font-semibold text-gray-900">Load Balancer Pricing</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Region Select */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Region
          </label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Load Balancer Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Load Balancer Type
          </label>
          <select
            value={localConfig.lb_type}
            onChange={(e) => handleChange('lb_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            {Object.entries(lbTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.name}</option>
            ))}
          </select>
        </div>

        {/* Hours per Month */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Hours per Month
            </label>
            <HelpCircle className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="number"
            min="0"
            max="744"
            step="1"
            value={localConfig.hours_per_month}
            onChange={(e) => handleChange('hours_per_month', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <p className="text-xs text-gray-500 mt-1">Default: 730 (full month)</p>
        </div>

        {/* LCU Configuration - For ALB, NLB, GWLB */}
        {(isALB || isNLB || isGWLB) && (
          <>
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">LCU Configuration</h3>
              
              <div className="space-y-3">
                {/* Used LCU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Used LCU per Hour
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localConfig.lcu_count}
                    onChange={(e) => handleChange('lcu_count', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {isALB && "ALB: 1 LCU = max(25 new conn/s, 3000 active conn/min, 1 GB/hr, 1000 rule evals/s)"}
                    {isNLB && "NLB: 1 LCU = max(800 new conn/s, 100k active conn, 1 GB/hr)"}
                    {isGWLB && "GWLB: 1 LCU = max(600 new conn/s, 60k active conn, 1 GB/hr)"}
                  </p>
                </div>

                {/* Reserved LCU */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reserved LCU per Hour
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={localConfig.reserved_lcu_count}
                    onChange={(e) => handleChange('reserved_lcu_count', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Pre-provisioned capacity. Billed 24/7 even when idle.</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Trust Store - ALB Only */}
        {isALB && (
          <div className="border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trust Store Hours per Month
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={localConfig.trust_store_hours}
                onChange={(e) => handleChange('trust_store_hours', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">Charged per ALB associated with a Trust Store</p>
            </div>
          </div>
        )}

        {/* Data Processing - CLB Only */}
        {isCLB && (
          <div className="border-t border-gray-200 pt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Processed per Month (GB)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={localConfig.data_processed_gb}
                onChange={(e) => handleChange('data_processed_gb', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
              />
              <p className="text-xs text-gray-500 mt-1">AWS recommends using ALB or NLB instead of CLB</p>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {cost && (
          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span>Hourly Cost:</span>
                <span className="font-medium">${cost.breakdown.hourly_cost.toFixed(2)}</span>
              </div>

              {(isALB || isNLB || isGWLB) && (
                <>
                  <div className="flex justify-between text-gray-700">
                    <span>LCU (Used):</span>
                    <span className="font-medium">${cost.breakdown.lcu_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>LCU (Reserved):</span>
                    <span className="font-medium">${cost.breakdown.reserved_lcu_cost.toFixed(2)}</span>
                  </div>
                </>
              )}

              {isALB && cost.breakdown.trust_store_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Trust Store:</span>
                  <span className="font-medium">${cost.breakdown.trust_store_cost.toFixed(2)}</span>
                </div>
              )}

              {isCLB && cost.breakdown.data_processing_cost > 0 && (
                <div className="flex justify-between text-gray-700">
                  <span>Data Processing:</span>
                  <span className="font-medium">${cost.breakdown.data_processing_cost.toFixed(2)}</span>
                </div>
              )}

              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total Monthly:</span>
                <span className="text-lg font-bold text-yellow-600">${cost.breakdown.total_cost.toFixed(2)}</span>
              </div>
            </div>

            {cost.notes && cost.notes.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-blue-800 space-y-1">
                  {cost.notes.map((note, i) => (
                    <div key={i}>• {note}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Buttons */}
      <div className="border-t border-gray-200 p-4 flex gap-2">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
