import React from 'react';
import { Position } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PositionsTableProps {
  positions: Position[];
}

const PositionsTable: React.FC<PositionsTableProps> = ({ positions }) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-6 py-3">合约 / 方向</th>
            <th className="px-6 py-3 text-right">数量(U)</th>
            <th className="px-6 py-3 text-right">开仓均价</th>
            <th className="px-6 py-3 text-right">标记价格</th>
            <th className="px-6 py-3 text-right">保证金</th>
            <th className="px-6 py-3 text-right">未实现盈亏</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {positions.map((pos) => {
            const isProfit = pos.unrealizedPnL >= 0;
            const sizeInUsd = Math.abs(pos.size * pos.markPrice);
            return (
              <tr key={pos.symbol} className="bg-slate-800/20 hover:bg-slate-700/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">
                  <div className="flex items-center space-x-2">
                    <span>{pos.symbol}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                      pos.side === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {pos.leverage}x {pos.side}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                  {Math.abs(pos.size).toFixed(3)} 
                  <span className="block text-xs text-slate-500">≈ ${sizeInUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                  ${pos.entryPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                  ${pos.markPrice.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-mono text-slate-300">
                  ${pos.margin.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </td>
                <td className={`px-6 py-4 text-right font-mono font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
                   {isProfit ? '+' : ''}{pos.unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            );
          })}
          {positions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                当前无持仓
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PositionsTable;