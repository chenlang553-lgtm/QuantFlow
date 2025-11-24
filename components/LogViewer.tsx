import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal, Clock, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface LogViewerProps {
  logs: LogEntry[];
  title?: string;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, title = "系统日志监控" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'TRADE': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'WARN': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-400';
      case 'TRADE': return 'text-green-400 font-semibold';
      case 'WARN': return 'text-yellow-400';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden flex flex-col h-full shadow-inner">
      <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-300">{title}</span>
        </div>
        <div className="flex space-x-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
      </div>
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1.5 custom-scrollbar bg-black/50"
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-4 text-center">暂无日志记录...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-3 hover:bg-slate-800/30 p-1 rounded">
              <span className="text-slate-500 whitespace-nowrap flex items-center min-w-[80px]">
                {log.timestamp}
              </span>
              <div className="mt-0.5">{getLevelIcon(log.level)}</div>
              <span className={`${getLevelColor(log.level)} break-all`}>
                 <span className="opacity-50 mr-2">[{log.level}]</span>
                 {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;