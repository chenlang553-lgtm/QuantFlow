
export enum StrategyStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  PAUSED = 'PAUSED',
  SCHEDULED = 'SCHEDULED',
  ERROR = 'ERROR'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'TRADE';
  message: string;
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  code: string;
  status: StrategyStatus;
  scheduleStart: string; // "HH:mm"
  scheduleEnd: string;   // "HH:mm"
  logs: LogEntry[];
  lastRun?: string;
  pnlDay: number;
}

export interface Position {
  symbol: string;
  size: number;
  entryPrice: number;
  markPrice: number;
  margin: number;
  unrealizedPnL: number;
  leverage: number;
  side: 'LONG' | 'SHORT';
}

export interface AccountInfo {
  totalBalance: number;     // Wallet Balance
  unrealizedPnL: number;    // Floating PnL
  marginBalance: number;    // Margin Balance
  availableBalance: number; // Available for trade
  maintenanceMargin: number;
  positions: Position[];
}

export interface SystemSettings {
  exchange: {
    apiKey: string;
    secretKey: string;
    isTestnet: boolean;
  };
  risk: {
    maxDrawdown: number; // Percentage
    maxLeverage: number;
    globalStopLoss: number; // USD
  };
  notifications: {
    telegramBotToken: string;
    telegramChatId: string;
    enableEmail: boolean;
  };
}

export type ViewState = 'DASHBOARD' | 'STRATEGIES' | 'ACCOUNT' | 'SETTINGS';
