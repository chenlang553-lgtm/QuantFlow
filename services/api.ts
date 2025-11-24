
import { AccountInfo, Strategy, StrategyStatus, LogEntry, SystemSettings } from '../types';
import { MOCK_ACCOUNT, MOCK_STRATEGIES } from './mockData';

// 生产环境配置
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
// 如果未检测到后端，默认回退到 Mock 模式以便演示
const USE_MOCK = true; 

// 模拟延迟，让体验更真实
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // --- 策略管理 ---
  getStrategies: async (): Promise<Strategy[]> => {
    if (USE_MOCK) {
      await delay(500);
      return [...MOCK_STRATEGIES];
    }
    const res = await fetch(`${API_BASE_URL}/strategies`);
    return res.json();
  },

  createStrategy: async (data: Partial<Strategy>): Promise<Strategy> => {
    if (USE_MOCK) {
      await delay(800);
      const newStrategy: Strategy = {
        id: Date.now().toString(),
        name: data.name || 'New Strategy',
        description: data.description || '',
        code: data.code || '',
        status: StrategyStatus.STOPPED,
        scheduleStart: data.scheduleStart || '00:00',
        scheduleEnd: data.scheduleEnd || '23:59',
        logs: [],
        pnlDay: 0
      };
      MOCK_STRATEGIES.push(newStrategy); // Update mock store
      return newStrategy;
    }
    const res = await fetch(`${API_BASE_URL}/strategies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  updateStrategyStatus: async (id: string, status: StrategyStatus): Promise<void> => {
    if (USE_MOCK) {
      await delay(300);
      const idx = MOCK_STRATEGIES.findIndex(s => s.id === id);
      if (idx !== -1) {
        MOCK_STRATEGIES[idx].status = status;
        MOCK_STRATEGIES[idx].logs.push({
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'INFO',
            message: `Command sent: ${status}`
        });
      }
      return;
    }
    await fetch(`${API_BASE_URL}/strategies/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  },

  deleteStrategy: async (id: string): Promise<void> => {
    if (USE_MOCK) {
        await delay(300);
        const idx = MOCK_STRATEGIES.findIndex(s => s.id === id);
        if (idx !== -1) MOCK_STRATEGIES.splice(idx, 1);
        return;
    }
    await fetch(`${API_BASE_URL}/strategies/${id}`, { method: 'DELETE' });
  },

  // --- 账户信息 ---
  getAccountInfo: async (): Promise<AccountInfo> => {
    if (USE_MOCK) {
      // 模拟一点数据波动
      const volatility = (Math.random() - 0.5) * 20;
      MOCK_ACCOUNT.unrealizedPnL += volatility;
      MOCK_ACCOUNT.totalBalance += (volatility * 0.1);
      return { ...MOCK_ACCOUNT };
    }
    const res = await fetch(`${API_BASE_URL}/account`);
    return res.json();
  },

  // --- 系统设置 ---
  saveSettings: async (settings: SystemSettings): Promise<void> => {
      if (USE_MOCK) {
          await delay(1000);
          localStorage.setItem('quantflow_settings', JSON.stringify(settings));
          return;
      }
      await fetch(`${API_BASE_URL}/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
      });
  },
  
  // --- 检查后端连接 ---
  checkHealth: async (): Promise<boolean> => {
      if (USE_MOCK) return true;
      try {
          const res = await fetch(`${API_BASE_URL}/health`);
          return res.ok;
      } catch {
          return false;
      }
  }
};
