
import React, { useState, useEffect } from 'react';
import { SystemSettings } from '../types';
import { Save, Shield, Key, Bell, Server, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const DEFAULT_SETTINGS: SystemSettings = {
  exchange: {
    apiKey: '',
    secretKey: '',
    isTestnet: false
  },
  risk: {
    maxDrawdown: 10,
    maxLeverage: 20,
    globalStopLoss: 500
  },
  notifications: {
    telegramBotToken: '',
    telegramChatId: '',
    enableEmail: false
  }
};

const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [showSecret, setShowSecret] = useState(false);
  const [activeTab, setActiveTab] = useState<'EXCHANGE' | 'RISK' | 'NOTIFY' | 'SYSTEM'>('EXCHANGE');
  const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');

  useEffect(() => {
    // Load settings from local storage on mount
    const saved = localStorage.getItem('quantflow_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  const handleSave = () => {
    setSaveStatus('SAVING');
    // Simulate API call / Local persistence
    setTimeout(() => {
      localStorage.setItem('quantflow_settings', JSON.stringify(settings));
      setSaveStatus('SAVED');
      setTimeout(() => setSaveStatus('IDLE'), 2000);
    }, 800);
  };

  const updateSetting = (category: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const renderExchangeTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <img src="https://cryptologos.cc/logos/binance-coin-bnb-logo.png" className="w-6 h-6 mr-2" alt="Binance" />
          Binance (币安) 配置
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">API Key</label>
            <input
              type="text"
              value={settings.exchange.apiKey}
              onChange={(e) => updateSetting('exchange', 'apiKey', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
              placeholder="Enter your Binance API Key"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Secret Key</label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={settings.exchange.secretKey}
                onChange={(e) => updateSetting('exchange', 'secretKey', e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono pr-10"
                placeholder="Enter your Binance Secret Key"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="testnet"
              checked={settings.exchange.isTestnet}
              onChange={(e) => updateSetting('exchange', 'isTestnet', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="testnet" className="text-sm text-slate-300">使用测试网 (Testnet)</label>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex items-start space-x-3 mt-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <p className="text-xs text-yellow-200/80">
              请确保您的 API Key 已开启“合约交易”权限，并绑定了部署服务器的 IP 地址以确保安全。不要将 API Key 透露给任何人。
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRiskTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2 text-green-400" />
          全局风控参数
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">最大回撤阈值 (%)</label>
            <div className="relative">
              <input
                type="number"
                value={settings.risk.maxDrawdown}
                onChange={(e) => updateSetting('risk', 'maxDrawdown', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <span className="absolute right-4 top-2 text-slate-500 text-sm">%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">当日亏损超过此比例将停止所有策略。</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">最大杠杆倍数限制</label>
            <input
              type="number"
              value={settings.risk.maxLeverage}
              onChange={(e) => updateSetting('risk', 'maxLeverage', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
             <p className="text-xs text-slate-500 mt-1">系统允许开仓的最大杠杆倍数。</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-1">全局单日止损额 (USD)</label>
            <input
              type="number"
              value={settings.risk.globalStopLoss}
              onChange={(e) => updateSetting('risk', 'globalStopLoss', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotifyTab = () => (
    <div className="space-y-6">
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <Bell className="w-5 h-5 mr-2 text-purple-400" />
          消息通知渠道
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Telegram Bot Token</label>
            <input
              type="text"
              value={settings.notifications.telegramBotToken}
              onChange={(e) => updateSetting('notifications', 'telegramBotToken', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Telegram Chat ID</label>
            <input
              type="text"
              value={settings.notifications.telegramChatId}
              onChange={(e) => updateSetting('notifications', 'telegramChatId', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="emailNotify"
              checked={settings.notifications.enableEmail}
              onChange={(e) => updateSetting('notifications', 'enableEmail', e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="emailNotify" className="text-sm text-slate-300">开启重要警报邮件通知</label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemTab = () => (
      <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center">
                  <Server className="w-5 h-5 mr-2 text-blue-400" />
                  Linux 部署信息
              </h3>
              <div className="space-y-4 text-sm text-slate-300">
                  <p>要在 Linux 服务器上完整运行此系统，请确保配置以下环境变量：</p>
                  <div className="bg-black/50 p-4 rounded-lg font-mono text-xs space-y-2 border border-slate-700">
                      <div className="flex text-slate-400">
                          <span className="w-40 text-blue-400">API_KEY</span>
                          <span>Google Gemini API Key (用于AI策略生成)</span>
                      </div>
                      <div className="flex text-slate-400">
                          <span className="w-40 text-blue-400">BINANCE_API_KEY</span>
                          <span>币安交易账户 API Key</span>
                      </div>
                      <div className="flex text-slate-400">
                          <span className="w-40 text-blue-400">BINANCE_SECRET</span>
                          <span>币安交易账户 Secret</span>
                      </div>
                      <div className="flex text-slate-400">
                          <span className="w-40 text-blue-400">REDIS_URL</span>
                          <span>redis://localhost:6379 (用于任务队列)</span>
                      </div>
                      <div className="flex text-slate-400">
                          <span className="w-40 text-blue-400">DB_URL</span>
                          <span>postgresql://user:pass@localhost:5432/quant (策略存储)</span>
                      </div>
                  </div>
                  
                  <div className="mt-4">
                      <p className="mb-2">Docker 启动命令示例：</p>
                      <pre className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 overflow-x-auto border border-slate-700">
docker run -d \
  -e API_KEY=your_gemini_key \
  -e BINANCE_API_KEY=your_binance_key \
  -p 3000:3000 \
  --name quantflow \
  quantflow/pro:latest
                      </pre>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-slate-400">当前版本：v1.2.4-stable</p>
                      <p className="text-slate-400">构建时间：2023-10-27 14:30:00 UTC</p>
                  </div>
              </div>
          </div>
      </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">系统设置</h2>
        <button
          onClick={handleSave}
          disabled={saveStatus === 'SAVING'}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saveStatus === 'SAVING' ? '保存中...' : saveStatus === 'SAVED' ? '已保存' : '保存配置'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => setActiveTab('EXCHANGE')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
              activeTab === 'EXCHANGE' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>交易所 API</span>
          </button>
          <button
            onClick={() => setActiveTab('RISK')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
              activeTab === 'RISK' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>风控参数</span>
          </button>
          <button
            onClick={() => setActiveTab('NOTIFY')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
              activeTab === 'NOTIFY' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>消息通知</span>
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center space-x-3 transition-colors ${
              activeTab === 'SYSTEM' ? 'bg-slate-800 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>系统与部署</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          {activeTab === 'EXCHANGE' && renderExchangeTab()}
          {activeTab === 'RISK' && renderRiskTab()}
          {activeTab === 'NOTIFY' && renderNotifyTab()}
          {activeTab === 'SYSTEM' && renderSystemTab()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
