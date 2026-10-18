import React, { useState } from 'react';
import { useServiceConfigStore, usePricingStore } from '@/store';
import { calculateCognitoCost } from '@/api/client';
import { Lock, X } from 'lucide-react';

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

export const CognitoConfigPanel = ({ onClose }) => {
  const config = useServiceConfigStore(s => s.cognitoConfig);
  const updateConfig = useServiceConfigStore(s => s.updateCognitoConfig);
  const setCognitoCost = usePricingStore(s => s.setCognitoCost);
  
  // Ensure all numeric values are valid
  const safeConfig = {
    ...config,
    mau: Number.isFinite(config.mau) ? config.mau : 1000000,
    signups_per_month: Number.isFinite(config.signups_per_month) ? config.signups_per_month : 10000,
    signins_per_month: Number.isFinite(config.signins_per_month) ? config.signins_per_month : 100000,
    token_refreshes_per_month: Number.isFinite(config.token_refreshes_per_month) ? config.token_refreshes_per_month : 50000,
    mfa_percentage: Number.isFinite(config.mfa_percentage) ? config.mfa_percentage : 30,
    advanced_security_mau: Number.isFinite(config.advanced_security_mau) ? config.advanced_security_mau : 100000,
    monthly_emails: Number.isFinite(config.monthly_emails) ? config.monthly_emails : 50000,
  };
  
  const [localConfig, setLocalConfig] = useState(safeConfig);
  const [cost, setCost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculationError, setCalculationError] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    mfa: false,
    advancedSecurity: false,
    additionalFeatures: false,
  });

  const handleChange = (field, value) => {
    const newConfig = { ...localConfig, [field]: value };
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
    setCalculationError('');
    setCost(null);
    try {
      const apiParams = {
        region: localConfig.region,
        mau: localConfig.mau || 0,
        signups_per_month: localConfig.signups_per_month || 0,
        signins_per_month: localConfig.signins_per_month || 0,
        token_refreshes_per_month: localConfig.token_refreshes_per_month || 0,
        mfa_enabled: localConfig.mfa_enabled || false,
        mfa_type: localConfig.mfa_type || 'sms',
        mfa_percentage: localConfig.mfa_percentage || 0,
        advanced_security_enabled: localConfig.advanced_security_enabled || false,
        advanced_security_mau: localConfig.advanced_security_mau || 0,
        custom_domain_enabled: localConfig.custom_domain_enabled || false,
        email_customization_enabled: localConfig.email_customization_enabled || false,
        monthly_emails: localConfig.monthly_emails || 0,
      };

      const result = await calculateCognitoCost(apiParams);
      setCost(result);
      setCalculationError('');
      setCognitoCost(result);
      updateConfig(localConfig);
    } catch (error) {
      console.error('Error calculating cost:', error);
      const detail = error.response?.data?.detail;
      const message = Array.isArray(detail)
        ? detail.map(item => item.msg).join('; ')
        : detail;
      setCalculationError(
        message || error.message || 'Unable to calculate Cognito pricing.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    const defaultConfig = {
      region: 'ap-south-1',
      mau: 1000000,
      signups_per_month: 10000,
      signins_per_month: 100000,
      token_refreshes_per_month: 50000,
      mfa_enabled: false,
      mfa_type: 'sms',
      mfa_percentage: 30,
      advanced_security_enabled: false,
      advanced_security_mau: 100000,
      custom_domain_enabled: false,
      email_customization_enabled: false,
      monthly_emails: 50000,
    };
    setLocalConfig(defaultConfig);
    setCost(null);
    setCalculationError('');
    setExpandedSections({
      mfa: false,
      advancedSecurity: false,
      additionalFeatures: false,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border w-full max-w-md shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between bg-muted/70 px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" style={{ color: '#FF9900' }} />
          <h3 className="font-semibold text-foreground">Cognito Configuration</h3>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
        {/* Region */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            📍 Region
          </label>
          <select
            value={localConfig.region}
            onChange={(e) => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          >
            {Object.entries(REGIONS).map(([name, value]) => (
              <option key={value} value={value}>{name}</option>
            ))}
          </select>
        </div>

        {/* Monthly Active Users */}
        <div>
          <label className="block text-sm font-medium text-foreground/80 mb-2">
            👥 Monthly Active Users (MAU)
          </label>
          <input
            type="number"
            value={localConfig.mau}
            onChange={(e) => handleChange('mau', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
          />
          <p className="text-xs text-muted-foreground mt-1">💡 First 50,000 MAUs are free. Paid tiers use the selected region&apos;s AWS pricing catalog rates.</p>
        </div>

        {/* Authentication Requests */}
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">🔑 Authentication Requests</h4>
          
          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Sign-Ups per Month
            </label>
            <input
              type="number"
              value={localConfig.signups_per_month}
              onChange={(e) => handleChange('signups_per_month', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Sign-Ins per Month
            </label>
            <input
              type="number"
              value={localConfig.signins_per_month}
              onChange={(e) => handleChange('signins_per_month', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/80 mb-2">
              Token Refreshes per Month
            </label>
            <input
              type="number"
              value={localConfig.token_refreshes_per_month}
              onChange={(e) => handleChange('token_refreshes_per_month', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
            />
          </div>
        </div>

        {/* MFA Section */}
        <div className="border rounded-lg p-4">
          <button
            onClick={() => handleToggleSection('mfa')}
            className="flex items-center gap-2 w-full text-left font-medium text-foreground hover:bg-muted/50 p-2 rounded"
          >
            <span>{expandedSections.mfa ? '▼' : '▶'}</span>
            <span>🛡️ Multi-Factor Authentication (MFA)</span>
          </button>

          {expandedSections.mfa && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.mfa_enabled}
                  onChange={(e) => handleChange('mfa_enabled', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground/80">Enable MFA</span>
              </label>

              {localConfig.mfa_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      MFA Type
                    </label>
                    <div className="space-y-2">
                      {[
                        { label: 'SMS MFA', value: 'sms', cost: 'AWS catalog rate' },
                        { label: 'Email MFA', value: 'email', cost: 'not in Cognito catalog' },
                        { label: 'Auth App (TOTP)', value: 'totp', cost: 'AWS catalog rate' },
                      ].map(option => (
                        <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="mfa_type"
                            value={option.value}
                            checked={localConfig.mfa_type === option.value}
                            onChange={(e) => handleChange('mfa_type', e.target.value)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <span className="text-sm text-foreground/80">{option.label}</span>
                          <span className="text-xs text-muted-foreground">({option.cost})</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-2">
                      Percentage of Users with MFA
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={localConfig.mfa_percentage}
                        onChange={(e) => handleChange('mfa_percentage', parseInt(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-medium text-foreground/80 w-12">{localConfig.mfa_percentage}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Advanced Security Section */}
        <div className="border rounded-lg p-4">
          <button
            onClick={() => handleToggleSection('advancedSecurity')}
            className="flex items-center gap-2 w-full text-left font-medium text-foreground hover:bg-muted/50 p-2 rounded"
          >
            <span>{expandedSections.advancedSecurity ? '▼' : '▶'}</span>
            <span>⚠️ Advanced Security</span>
          </button>

          {expandedSections.advancedSecurity && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.advanced_security_enabled}
                  onChange={(e) => handleChange('advanced_security_enabled', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground/80">Enable Advanced Security</span>
              </label>

              {localConfig.advanced_security_enabled && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Monthly Active Users with Advanced Security
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={localConfig.mau}
                    value={localConfig.advanced_security_mau}
                    onChange={(e) => handleChange('advanced_security_mau', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
                  />
                  <p className="text-xs text-muted-foreground mt-1">💡 Billed per enabled MAU at the selected region&apos;s AWS catalog rate.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Additional Features Section */}
        <div className="border rounded-lg p-4">
          <button
            onClick={() => handleToggleSection('additionalFeatures')}
            className="flex items-center gap-2 w-full text-left font-medium text-foreground hover:bg-muted/50 p-2 rounded"
          >
            <span>{expandedSections.additionalFeatures ? '▼' : '▶'}</span>
            <span>🎨 Additional Features</span>
          </button>

          {expandedSections.additionalFeatures && (
            <div className="mt-4 space-y-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.custom_domain_enabled}
                  onChange={(e) => handleChange('custom_domain_enabled', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground/80">Custom Domain</span>
                <span className="text-xs text-muted-foreground">(not priced in the Cognito catalog)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.email_customization_enabled}
                  onChange={(e) => handleChange('email_customization_enabled', e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-sm font-medium text-foreground/80">Email Customization</span>
                <span className="text-xs text-muted-foreground">(not priced in the Cognito catalog)</span>
              </label>

              {localConfig.email_customization_enabled && (
                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-2">
                    Monthly Emails
                  </label>
                  <input
                    type="number"
                    value={localConfig.monthly_emails}
                    onChange={(e) => handleChange('monthly_emails', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        {cost && (
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <h4 className="font-semibold text-foreground mb-3">💰 Cost Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/80">MAU Charges:</span>
                <span className="font-medium">${cost.breakdown.mau_charge.toFixed(2)}</span>
              </div>
              {cost.breakdown.sms_mfa_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/80">SMS MFA:</span>
                  <span className="font-medium">${cost.breakdown.sms_mfa_charge.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.totp_mfa_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/80">TOTP MFA:</span>
                  <span className="font-medium">${cost.breakdown.totp_mfa_charge.toFixed(2)}</span>
                </div>
              )}
              {calculationError && (
                <p role="alert" className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                  {calculationError}
                </p>
              )}
              {cost.breakdown.advanced_security_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/80">Advanced Security:</span>
                  <span className="font-medium">${cost.breakdown.advanced_security_charge.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.custom_domain_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/80">Custom Domain:</span>
                  <span className="font-medium">${cost.breakdown.custom_domain_charge.toFixed(2)}</span>
                </div>
              )}
              {cost.breakdown.email_customization_charge > 0 && (
                <div className="flex justify-between">
                  <span className="text-foreground/80">Email Customization:</span>
                  <span className="font-medium">${cost.breakdown.email_customization_charge.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold text-foreground">
                <span>Total Monthly Cost:</span>
                <span className="text-primary">${cost.breakdown.total_cost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Buttons */}
      <div className="border-t bg-muted/50 px-6 py-4 flex gap-3">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium transition disabled:opacity-50"
        >
          {loading ? 'Calculating...' : 'Calculate'}
        </button>
        <button
          onClick={handleReset}
          className="flex-1 px-4 py-2 bg-muted hover:bg-muted text-foreground rounded-md font-medium transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
};
