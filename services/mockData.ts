import { AccountInfo, Position, Strategy, StrategyStatus } from '../types';

export const INITIAL_POSITIONS: Position[] = [
  {
    symbol: 'BTCUSDT',
    size: 0.5,
    entryPrice: 64200.50,
    markPrice: 64500.20,
    margin: 3225.01,
    unrealizedPnL: 149.85,
    leverage: 10,
    side: 'LONG'
  },
  {
    symbol: 'ETHUSDT',
    size: -5.0,
    entryPrice: 3450.00,
    markPrice: 3420.00,
    margin: 1725.00,
    unrealizedPnL: 150.00,
    leverage: 10,
    side: 'SHORT'
  },
  {
    symbol: 'SOLUSDT',
    size: 100,
    entryPrice: 145.00,
    markPrice: 142.50,
    margin: 1450.00,
    unrealizedPnL: -250.00,
    leverage: 10,
    side: 'LONG'
  }
];

export const MOCK_ACCOUNT: AccountInfo = {
  totalBalance: 25430.50,
  unrealizedPnL: 49.85,
  marginBalance: 25480.35,
  availableBalance: 19080.34,
  maintenanceMargin: 120.50,
  positions: INITIAL_POSITIONS
};

export const MOCK_STRATEGIES: Strategy[] = [
  {
    id: '1',
    name: 'BTC 双均线趋势策略',
    description: '基于MA7和MA25的金叉死叉进行趋势跟踪交易。',
    code: 'def on_tick(data):\n    ma7 = talib.SMA(data.close, 7)\n    ma25 = talib.SMA(data.close, 25)\n    if ma7[-1] > ma25[-1]:\n        buy()\n    elif ma7[-1] < ma25[-1]:\n        sell()',
    status: StrategyStatus.RUNNING,
    scheduleStart: "00:00",
    scheduleEnd: "23:59",
    logs: [
      { id: '1', timestamp: '10:00:01', level: 'INFO', message: 'Strategy initialized successfully.' },
      { id: '2', timestamp: '10:05:23', level: 'TRADE', message: 'OPEN LONG BTCUSDT @ 64300' },
      { id: '3', timestamp: '10:15:00', level: 'INFO', message: 'Checking indicators...' }
    ],
    pnlDay: 124.50
  },
  {
    id: '2',
    name: 'ETH 网格套利',
    description: '在3000-3500区间进行高抛低吸。',
    code: '# Grid Trading Logic\n grids = setup_grids(3000, 3500, 10)',
    status: StrategyStatus.PAUSED,
    scheduleStart: "09:00",
    scheduleEnd: "18:00",
    logs: [
       { id: '1', timestamp: '09:00:01', level: 'INFO', message: 'Starting grid bot...' }
    ],
    pnlDay: 0
  }
];