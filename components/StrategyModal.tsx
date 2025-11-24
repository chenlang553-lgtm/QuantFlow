import React, { useState } from 'react';
import { X, Upload, Sparkles, Loader2 } from 'lucide-react';
import { generateStrategyCode } from '../services/geminiService';

interface StrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; scheduleStart: string; scheduleEnd: string; code: string; description: string }) => void;
}

const StrategyModal: React.FC<StrategyModalProps> = ({ isOpen, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduleStart, setScheduleStart] = useState('00:00');
  const [scheduleEnd, setScheduleEnd] = useState('23:59');
  const [code, setCode] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCode(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const generated = await generateStrategyCode(aiPrompt);
    setCode(prev => prev ? prev + '\n\n' + generated : generated);
    setIsGenerating(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, description, scheduleStart, scheduleEnd, code });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-4xl rounded-xl border border-slate-700 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">新建量化策略</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">策略名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="例如: BTC 双均线趋势"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">策略描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none h-20 resize-none"
                  placeholder="简要描述策略逻辑..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">每日开始时间</label>
                    <input type="time" value={scheduleStart} onChange={e => setScheduleStart(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">每日停止时间</label>
                    <input type="time" value={scheduleEnd} onChange={e => setScheduleEnd(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white" />
                 </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                 <label className="block text-sm font-medium text-purple-400 mb-2 flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 辅助生成 (Gemini 2.5)
                 </label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={aiPrompt}
                      onChange={e => setAiPrompt(e.target.value)}
                      placeholder="描述你想写的策略，例如：MACD金叉买入..."
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                    />
                    <button 
                      onClick={handleAiGenerate}
                      disabled={isGenerating || !aiPrompt}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center"
                    >
                      {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : '生成'}
                    </button>
                 </div>
              </div>
            </div>

            <div className="flex flex-col h-full">
               <div className="flex justify-between items-center mb-2">
                   <label className="block text-sm font-medium text-slate-400">Python 脚本代码</label>
                   <div className="relative">
                      <input type="file" id="script-upload" className="hidden" accept=".py" onChange={handleFileUpload} />
                      <label htmlFor="script-upload" className="cursor-pointer text-xs flex items-center text-blue-400 hover:text-blue-300">
                          <Upload className="w-3 h-3 mr-1" />
                          上传 .py 文件
                      </label>
                   </div>
               </div>
               <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-700 rounded-lg p-4 font-mono text-xs text-green-400 focus:border-blue-500 focus:outline-none resize-none leading-relaxed"
                  placeholder="# 在此粘贴 Python 代码或使用 AI 生成..."
                  spellCheck={false}
               />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end space-x-3">
          <button onClick={onClose} className="px-5 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition-colors">取消</button>
          <button onClick={handleSubmit} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-900/50 transition-colors">
            确认添加
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategyModal;