
import { AccountInfo, Strategy, StrategyStatus, LogEntry, SystemSettings } from '../types';
import { MOCK_ACCOUNT, MOCK_STRATEGIES } from './mockData';

// 在生产环境中，通过 Nginx 代理，API 地址应为相对路径 '/api'
const API_BASE_URL = '/api';

// 自动检测是否需要使用 Mock 数据
// 如果是本地开发环境且没有启动后端，或者在构建预览中，默认使用 Mock
const IS_DEV = process.env.NODE_ENV === 'development';
const USE_MOCK_FALLBACK = true;

export const api = {
  // --- 策略管理 ---
  getStrategies: async (): Promise<Strategy[]> => {
    try {
      const res = await fetch(`${API_BASE_URL}/strategies`);
      if (!res.ok) {
        // 如果 API 返回 404 (通常是因为 Nginx 未配置或后端没启动)，抛出异常触发 fallback
        throw new Error(`API Error: ${res.status}`);
      }
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
        throw new Error("Invalid Content-Type (Expected JSON)");
      }
      return await res.json();
    } catch (e) {
      console.warn("Fetch strategies failed, falling back to mock/empty:", e);
      return USE_MOCK_FALLBACK ? [...MOCK_STRATEGIES] : [];
    }
  },

  createStrategy: async (data: Partial<Strategy>): Promise<Strategy> => {
    try {
      const res = await fetch(`${API_BASE_URL}/strategies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to create strategy');
      return await res.json();
    } catch (e) {
      console.error(e);
      // Mock creation for UI responsiveness if backend fails
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
      return newStrategy;
    }
  },

  updateStrategyStatus: async (id: string, status: StrategyStatus): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/strategies/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch (e) {
      console.error("Status update failed", e);
    }
  },

  deleteStrategy: async (id: string): Promise<void> => {
    try {
       await fetch(`${API_BASE_URL}/strategies/${id}`, { method: 'DELETE' });
    } catch (e) {
       console.error("Delete failed", e);
    }
  },

  // --- 账户信息 ---
  getAccountInfo: async (): Promise<AccountInfo> => {
    try {
      const res = await fetch(`${API_BASE_URL}/account`);
      if (!res.ok) throw new Error('Failed to fetch account');
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") === -1) {
         throw new Error("Invalid Content-Type");
      }
      return await res.json();
    } catch (error) {
       console.warn("API unavailable, using Mock Account data");
       // Return Mock data so the dashboard doesn't look empty/broken during setup
       return MOCK_ACCOUNT;
    }
  },

  // --- 系统设置 ---
  saveSettings: async (settings: SystemSettings): Promise<void> => {
      try {
        await fetch(`${API_BASE_URL}/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settings)
        });
      } catch (e) {
        console.error("Save settings failed", e);
        localStorage.setItem('quantflow_settings', JSON.stringify(settings));
      }
  },
  
  // --- 检查后端连接 ---
  checkHealth: async (): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE_URL}/health`);
          return res.ok;
      } catch {
          return false;
      }
  }
};
