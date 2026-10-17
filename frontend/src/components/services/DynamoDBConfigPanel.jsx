import React, { useState, useEffect } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateDynamoDBCost, getDynamoDBRegions } from '@/api/client';
import { Database, X, HelpCircle, AlertCircle } from 'lucide-react';

export const DynamoDBConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.dynamoDBConfig);
  const updateConfig = useServiceConfigStore(s => s.updateDynamoDBConfig);
  const setDynamoDBCost = usePricingStore(s => s.setDynamoDBCost);
  
  const [localConfig, setLocalConfig] = useState(config);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [regions, setRegions] = useState([]);

  useEffect(() => {
    const fetchRegions = async () => {
        try {
            const data = await getDynamoDBRegions();
            setRegions(data);
        } catch (e) {
            console.error("Failed to fetch regions", e);
            // Fallback
            setRegions(['us-east-1', 'us-west-2', 'eu-west-1']);
        }
    };
    fetchRegions();
  }, []);

  const handleChange = (field, value) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const result = await calculateDynamoDBCost(localConfig);
      setCost(result);
      setDynamoDBCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border w-full max-w-md shadow-sm flex flex-col h-full max-h-[80vh]">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/70 px-6 py-4 border-b flex-shrink-0">
        <div className="flex items-center gap-2">
          <Database className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-foreground">DynamoDB Configuration</h3>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 overflow-y-auto flex-grow">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">📍 Region</label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          >
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {/* Storage Configuration */}
        <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
                💾 Table Storage Configuration
            </h4>
            
            <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Average Table Storage Size (GB)</label>
                <div className="relative">
                    <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={localConfig.storage_gb}
                        onChange={(e) => handleChange('storage_gb', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
                    />
                </div>
                <p className="text-xs text-muted-foreground mt-1">💡 Billed based on average daily storage size</p>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground/80 mb-1">Average Item Size (KB)</label>
                <input
                    type="number"
                    min="0"
                    max="400"
                    step="0.1"
                    value={localConfig.avg_item_size_kb}
                    onChange={(e) => handleChange('avg_item_size_kb', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
                />
                <p className="text-xs text-muted-foreground mt-1">💡 Used to calculate read/write unit consumption</p>
            </div>
        </div>

        {/* Capacity Mode */}
        <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
                ⚡ Capacity Mode
            </h4>
            
            {/* On-Demand */}
            <div className="bg-muted/50 p-3 rounded-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        checked={localConfig.on_demand_enabled}
                        onChange={(e) => handleChange('on_demand_enabled', e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-input focus:ring-yellow-500"
                    />
                    <label className="text-sm font-medium text-foreground">On-Demand Capacity</label>
                </div>
                
                {localConfig.on_demand_enabled && (
                    <div className="pl-6 space-y-3 mt-2">
                         <p className="text-xs text-muted-foreground mb-2">Perfect for unpredictable workloads. Pay per request.</p>
                        <div>
                            <label className="block text-xs font-medium text-foreground/80">Read Requests per Month</label>
                            <input
                                type="number"
                                min="0"
                                value={localConfig.on_demand_reads_per_month}
                                onChange={(e) => handleChange('on_demand_reads_per_month', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground">💡 Each read unit = 4 KB</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground/80">Write Requests per Month</label>
                            <input
                                type="number"
                                min="0"
                                value={localConfig.on_demand_writes_per_month}
                                onChange={(e) => handleChange('on_demand_writes_per_month', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground">💡 Each write unit = 1 KB</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Provisioned */}
            <div className="bg-muted/50 p-3 rounded-md border border-border">
                <div className="flex items-center gap-2 mb-2">
                    <input
                        type="checkbox"
                        checked={localConfig.provisioned_enabled}
                        onChange={(e) => handleChange('provisioned_enabled', e.target.checked)}
                        className="h-4 w-4 text-primary rounded border-input focus:ring-yellow-500"
                    />
                    <label className="text-sm font-medium text-foreground">Provisioned Capacity</label>
                </div>
                
                {localConfig.provisioned_enabled && (
                    <div className="pl-6 space-y-3 mt-2">
                        <p className="text-xs text-muted-foreground mb-2">Perfect for predictable workloads. Hourly rate.</p>
                        <div>
                            <label className="block text-xs font-medium text-foreground/80">Read Capacity Units (RCU)</label>
                            <input
                                type="number"
                                min="0"
                                value={localConfig.provisioned_read_capacity_units}
                                onChange={(e) => handleChange('provisioned_read_capacity_units', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground">💡 RCU/sec</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-foreground/80">Write Capacity Units (WCU)</label>
                            <input
                                type="number"
                                min="0"
                                value={localConfig.provisioned_write_capacity_units}
                                onChange={(e) => handleChange('provisioned_write_capacity_units', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                            />
                            <p className="text-[10px] text-muted-foreground">💡 WCU/sec</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Backup */}
        <div className="space-y-4 border-t pt-4">
            <h4 className="font-medium text-foreground flex items-center gap-2">
                🛡️ Backup & Data Protection
            </h4>
             <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={localConfig.backup_enabled}
                    onChange={(e) => handleChange('backup_enabled', e.target.checked)}
                    className="h-4 w-4 text-primary rounded border-input focus:ring-yellow-500"
                />
                <label className="text-sm font-medium text-foreground/80">Enable Backup Features</label>
            </div>

            {localConfig.backup_enabled && (
                <div className="space-y-3 pl-6 border-l-2 border-border ml-2">
                    <div className="flex items-start gap-2">
                         <input
                            type="checkbox"
                            checked={localConfig.pitr_enabled}
                            onChange={(e) => handleChange('pitr_enabled', e.target.checked)}
                            className="h-4 w-4 mt-1 text-primary rounded border-input focus:ring-yellow-500"
                        />
                        <div>
                            <label className="text-sm font-medium text-foreground">Point-In-Time Recovery (PITR)</label>
                            <p className="text-xs text-muted-foreground">Continuous backups for last 35d</p>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-foreground/80">Backup Storage Size (GB)</label>
                        <input
                            type="number"
                            min="0"
                            value={localConfig.backup_storage_gb}
                            onChange={(e) => handleChange('backup_storage_gb', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-medium text-foreground/80">Restore Data Size (GB)</label>
                        <input
                            type="number"
                            min="0"
                            value={localConfig.restore_data_size_gb}
                            onChange={(e) => handleChange('restore_data_size_gb', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1 text-sm border border-input rounded-md mt-1"
                        />
                    </div>
                </div>
            )}
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-muted/50 p-4 rounded-md border border-border mt-4">
            <p className="text-sm font-semibold text-foreground mb-2">💰 Cost Breakdown</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-foreground/80">
                <span>Storage:</span>
                <span className="font-medium">${cost.breakdown.storage_cost.toFixed(2)}</span>
              </div>
              {localConfig.on_demand_enabled && (
                  <>
                  <div className="flex justify-between text-foreground/80">
                    <span>On-Demand Read:</span>
                    <span className="font-medium">${cost.breakdown.on_demand_read_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/80">
                    <span>On-Demand Write:</span>
                    <span className="font-medium">${cost.breakdown.on_demand_write_cost.toFixed(2)}</span>
                  </div>
                  </>
              )}
               {localConfig.provisioned_enabled && (
                  <>
                  <div className="flex justify-between text-foreground/80">
                    <span>Provisioned Read:</span>
                    <span className="font-medium">${cost.breakdown.provisioned_read_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-foreground/80">
                    <span>Provisioned Write:</span>
                    <span className="font-medium">${cost.breakdown.provisioned_write_cost.toFixed(2)}</span>
                  </div>
                  </>
              )}
               {localConfig.backup_enabled && (
                   <>
                    {localConfig.pitr_enabled && (
                        <div className="flex justify-between text-foreground/80">
                            <span>PITR:</span>
                            <span className="font-medium">${cost.breakdown.pitr_cost.toFixed(2)}</span>
                        </div>
                    )}
                    {localConfig.backup_storage_gb > 0 && (
                        <div className="flex justify-between text-foreground/80">
                            <span>Backup Storage:</span>
                            <span className="font-medium">${cost.breakdown.backup_storage_cost.toFixed(2)}</span>
                        </div>
                    )}
                     {localConfig.restore_data_size_gb > 0 && (
                        <div className="flex justify-between text-foreground/80">
                            <span>Restore:</span>
                            <span className="font-medium">${cost.breakdown.restore_cost.toFixed(2)}</span>
                        </div>
                    )}
                   </>
               )}
              
            </div>
            <div className="border-t border-input pt-2 mt-2 flex justify-between text-sm font-semibold text-foreground">
              <span>Total Monthly Cost:</span>
              <span className="text-xl text-primary">${cost.breakdown.total_cost.toFixed(2)}</span>
            </div>
          </div>
        )}

      </div>

        {/* Footer */}
        <div className="p-4 bg-muted/50 border-t flex gap-2 flex-shrink-0">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? 'Calculating...' : 'Calculate'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-card border border-input hover:bg-muted/50 text-foreground/80 font-semibold py-2 px-4 rounded-md transition"
          >
            Close
          </button>
        </div>

    </div>
  );
};
