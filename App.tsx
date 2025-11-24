
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import StatCard from './components/StatCard';
import LogViewer from './components/LogViewer';
import PositionsTable from './components/PositionsTable';
import StrategyModal from './components/StrategyModal';
import SettingsView from './components/SettingsView';
import { ViewState, Strategy, StrategyStatus, LogEntry, AccountInfo } from './types';
import { MOCK_ACCOUNT, MOCK_STRATEGIES } from './services/mockData';
import { Play, Pause, Square, Plus, Wallet, Clock, Trash2, Terminal, ScrollText, Settings } from 'lucide-react';

// Use Account Info Mock
const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [strategies, setStrategies] = useState<Strategy[]>(MOCK_STRATEGIES);
  const [account, setAccount] = useState<AccountInfo>(MOCK_ACCOUNT);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);

  // Simulated live data updates
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Update Account PnL randomly
      setAccount(prev => {
        const pnlChange = (Math.random() - 0.5) * 10;
        const newUnrealized = prev.unrealizedPnL + pnlChange;
        return {
          ...prev,
          unrealizedPnL: newUnrealized,
          totalBalance: prev.totalBalance + (pnlChange * 0.1) // Assume some realized
        };
      });

      // 2. Add logs to running strategies
      setStrategies(prevStrategies => 
        prevStrategies.map(strat => {
          if (strat.status === StrategyStatus.RUNNING) {
            // Check schedule
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (currentTime < strat.scheduleStart || currentTime > strat.scheduleEnd) {
                 return {
                    ...strat,
                    status: StrategyStatus.SCHEDULED,
                    logs: [...strat.logs, {
                        id: Date.now().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'INFO',
                        message: `不在运行时间段 (${strat.scheduleStart}-${strat.scheduleEnd}). 进入定时等待模式。`
                    }]
                 }
            }

            // Random log generation for effect
            if (Math.random() > 0.7) {
              const newLog: LogEntry = {
                id: Date.now().toString(),
                timestamp: new Date().toLocaleTimeString(),
                level: Math.random() > 0.9 ? 'TRADE' : 'INFO',
                message: Math.random() > 0.9 
                  ? `Placed order for ${['BTC','ETH','SOL'][Math.floor(Math.random()*3)]}USDT` 
                  : `Processing tick data... Volatility: ${(Math.random()*2).toFixed(2)}%`
              };
              return { ...strat, logs: [...strat.logs, newLog] };
            }
          } else if (strat.status === StrategyStatus.SCHEDULED) {
             const now = new Date();
             const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
             if (currentTime >= strat.scheduleStart && currentTime <= strat.scheduleEnd) {
                 return {
                     ...strat,
                     status: StrategyStatus.RUNNING,
                     logs: [...strat.logs, {
                        id: Date.now().toString(),
                        timestamp: new Date().toLocaleTimeString(),
                        level: 'INFO',
                        message: `进入运行时间段 (${strat.scheduleStart}). 策略自动启动。`
                     }]
                 }
             }
          }
          return strat;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = (id: string, newStatus: StrategyStatus) => {
    setStrategies(prev => prev.map(s => {
      if (s.id === id) {
        return { 
          ...s, 
          status: newStatus,
          logs: [...s.logs, {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'INFO',
            message: `User changed status to ${newStatus}`
          }]
        };
      }
      return s;
    }));
  };

  const handleAddStrategy = (data: { name: string; scheduleStart: string; scheduleEnd: string; code: string; description: string }) => {
    const newStrategy: Strategy = {
      id: Date.now().toString(),
      name: data.name,
      description: data.description,
      code: data.code,
      status: StrategyStatus.STOPPED,
      scheduleStart: data.scheduleStart,
      scheduleEnd: data.scheduleEnd,
      logs: [],
      pnlDay: 0
    };
    setStrategies([...strategies, newStrategy]);
  };
  
  const handleDeleteStrategy = (id: string) => {
      if(window.confirm('确定要删除这个策略吗？')) {
          setStrategies(prev => prev.filter(s => s.id !== id));
          if(selectedStrategyId === id) setSelectedStrategyId(null);
      }
  }

  // --- Views ---

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="U本位账户权益 (USDT)" value={`$${account.totalBalance.toLocaleString()}`} subValue="+$234.50" trend="up" icon={<Wallet className="w-5 h-5 text-blue-400" />} />
        <StatCard title="未实现盈亏 (Unrealized PnL)" value={`$${account.unrealizedPnL.toLocaleString()}`} trend={account.unrealizedPnL >= 0 ? 'up' : 'down'} icon={<Wallet className="w-5 h-5 text-purple-400" />} />
        <StatCard title="活跃策略" value={strategies.filter(s => s.status === 'RUNNING').length.toString()} subLabel={`总策略数: ${strategies.length}`} icon={<Play className="w-5 h-5 text-green-400" />} />
        <StatCard title="今日已实现盈亏" value="+$124.20" trend="up" icon={<Wallet className="w-5 h-5 text-yellow-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
          <h3 className="text-white font-bold mb-4 flex items-center">
             <Wallet className="w-5 h-5 mr-2 text-binance-yellow" />
             当前持仓监控
          </h3>
          <PositionsTable positions={account.positions} />
        </div>
        <div className="h-full">
            <LogViewer logs={strategies.flatMap(s => s.logs).sort((a,b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 50)} title="全局系统日志" />
        </div>
      </div>
    </div>
  );

  const renderStrategies = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">策略库</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>新建策略</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-180px)]">
        {/* Strategy List */}
        <div className="lg:col-span-2 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {strategies.map(strategy => (
            <div 
              key={strategy.id} 
              onClick={() => setSelectedStrategyId(strategy.id)}
              className={`bg-slate-800 rounded-xl p-6 border transition-all cursor-pointer ${selectedStrategyId === strategy.id ? 'border-blue-500 shadow-lg shadow-blue-900/20' : 'border-slate-700 hover:border-slate-600'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center">
                    {strategy.name}
                    <span className={`ml-3 text-xs px-2 py-0.5 rounded-full border ${
                        strategy.status === 'RUNNING' ? 'border-green-500 text-green-400 bg-green-500/10' :
                        strategy.status === 'SCHEDULED' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                        strategy.status === 'PAUSED' ? 'border-yellow-500 text-yellow-400 bg-yellow-500/10' :
                        'border-red-500 text-red-400 bg-red-500/10'
                    }`}>
                        {strategy.status === 'RUNNING' && '运行中'}
                        {strategy.status === 'SCHEDULED' && '定时等待'}
                        {strategy.status === 'PAUSED' && '已暂停'}
                        {strategy.status === 'STOPPED' && '已停止'}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">{strategy.description}</p>
                </div>
                <div className="flex space-x-2">
                   {strategy.status === 'STOPPED' || strategy.status === 'PAUSED' ? (
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleStatusChange(strategy.id, StrategyStatus.RUNNING); }}
                         className="p-2 bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30"
                         title="启动"
                       >
                         <Play className="w-5 h-5" />
                       </button>
                   ) : (
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleStatusChange(strategy.id, StrategyStatus.PAUSED); }}
                         className="p-2 bg-yellow-600/20 text-yellow-400 rounded-lg hover:bg-yellow-600/30"
                         title="暂停"
                       >
                         <Pause className="w-5 h-5" />
                       </button>
                   )}
                   <button 
                      onClick={(e) => { e.stopPropagation(); handleStatusChange(strategy.id, StrategyStatus.STOPPED); }}
                      className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30"
                      title="停止"
                   >
                     <Square className="w-4 h-4" />
                   </button>
                   <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteStrategy(strategy.id); }}
                      className="p-2 hover:bg-slate-700 text-slate-500 hover:text-red-400 rounded-lg"
                      title="删除"
                   >
                      <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-500">
                <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1.5" />
                    <span>运行时间段: {strategy.scheduleStart} - {strategy.scheduleEnd}</span>
                </div>
                <div className="flex items-center">
                    <Wallet className="w-4 h-4 mr-1.5" />
                    <span>今日盈亏: </span>
                    <span className={strategy.pnlDay >= 0 ? 'text-green-400 ml-1' : 'text-red-400 ml-1'}>
                        {strategy.pnlDay >= 0 ? '+' : ''}{strategy.pnlDay} U
                    </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Strategy Details & Logs */}
        <div className="flex flex-col h-full bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {selectedStrategyId ? (
                (() => {
                    const strategy = strategies.find(s => s.id === selectedStrategyId);
                    if (!strategy) return null;
                    return (
                        <>
                           <div className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center">
                               <h3 className="font-bold text-white flex items-center">
                                   <Terminal className="w-4 h-4 mr-2 text-purple-400" />
                                   {strategy.name} - 控制台
                               </h3>
                           </div>
                           <div className="flex-1 min-h-0">
                               <LogViewer logs={strategy.logs} title="实时运行日志" />
                           </div>
                           <div className="p-4 bg-slate-900 border-t border-slate-700">
                               <h4 className="text-xs text-slate-500 mb-2 uppercase">Code Preview</h4>
                               <pre className="text-xs text-slate-300 font-mono bg-black p-3 rounded h-32 overflow-auto opacity-80">
                                   {strategy.code.substring(0, 300)}...
                               </pre>
                           </div>
                        </>
                    );
                })()
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <ScrollText className="w-12 h-12 mb-4 opacity-50" />
                    <p>选择左侧策略查看详情</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
  
  const renderAccount = () => (
      <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">账户详情 (USDT-M Futures)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700">
                 <p className="text-slate-400 text-sm mb-1">账户总权益 (Margin Balance)</p>
                 <h3 className="text-3xl font-bold text-white">${account.marginBalance.toLocaleString()}</h3>
                 <div className="mt-4 flex justify-between text-sm">
                     <span className="text-slate-500">可用下单资金</span>
                     <span className="text-white">${account.availableBalance.toLocaleString()}</span>
                 </div>
             </div>
             <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                 <p className="text-slate-400 text-sm mb-1">维持保证金 (Maintenance)</p>
                 <h3 className="text-3xl font-bold text-white">${account.maintenanceMargin.toLocaleString()}</h3>
                 <div className="mt-4 w-full bg-slate-700 rounded-full h-2">
                     <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(account.maintenanceMargin / account.marginBalance) * 100}%` }}></div>
                 </div>
                 <p className="text-xs text-slate-500 mt-2 text-right">风险率: {((account.maintenanceMargin / account.marginBalance) * 100).toFixed(2)}%</p>
             </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
               <h3 className="text-lg font-bold text-white mb-4">全部持仓</h3>
               <PositionsTable positions={account.positions} />
          </div>
      </div>
  );

  return (
    <div className="flex h-screen bg-slate-950 font-sans">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {currentView === 'DASHBOARD' && renderDashboard()}
        {currentView === 'STRATEGIES' && renderStrategies()}
        {currentView === 'ACCOUNT' && renderAccount()}
        {currentView === 'SETTINGS' && <SettingsView />}
      </main>

      <StrategyModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleAddStrategy} 
      />
    </div>
  );
};

export default App;
