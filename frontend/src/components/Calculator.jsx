import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calculator as CalcIcon, Trash2, Delete } from 'lucide-react';

const Calculator = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');

  const handleClick = (val) => {
    if (val === '=') {
      try {
        setResult(eval(input).toString());
      } catch {
        setResult('Error');
      }
    } else if (val === 'C') {
      setInput('');
      setResult('');
    } else if (val === 'DEL') {
      setInput(prev => prev.slice(0, -1));
    } else {
      setInput(prev => prev + val);
    }
  };

  const buttons = [
    '7', '8', '9', '/',
    '4', '5', '6', '*',
    '1', '2', '3', '-',
    '0', '.', '=', '+',
    'C', 'DEL'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed bottom-24 right-8 w-72 bg-slate-800/90 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl z-[1000] overflow-hidden"
    >
      <div className="bg-slate-700/50 p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2 text-orange-500">
           <CalcIcon size={16} />
           <span className="text-xs font-black uppercase tracking-widest text-white">Business Math</span>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 bg-slate-900/50">
        <div className="text-right h-8 text-slate-400 font-mono text-sm overflow-hidden mb-1">{input || '0'}</div>
        <div className="text-right h-10 text-white font-mono text-2xl font-bold overflow-hidden">{result || '0'}</div>
      </div>

      <div className="p-4 grid grid-cols-4 gap-2">
        {buttons.map(btn => (
          <button
            key={btn}
            onClick={() => handleClick(btn)}
            className={`h-12 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center justify-center ${
              btn === '=' ? 'bg-orange-500 text-white col-span-1 shadow-lg shadow-orange-500/30' :
              btn === 'C' ? 'bg-red-500/20 text-red-500' :
              ['/', '*', '-', '+'].includes(btn) ? 'bg-slate-700 text-orange-400' :
              'bg-slate-700/50 text-white hover:bg-slate-700'
            } ${btn === 'DEL' ? 'col-span-1' : ''}`}
          >
            {btn === 'DEL' ? <Delete size={16} /> : btn}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
         <div className="bg-orange-500/5 rounded-xl p-3 border border-orange-500/10">
            <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Logistics Estimate</p>
            <p className="text-[9px] text-slate-300 italic">2% Commission: {(eval(input || '0') * 0.02 || 0).toFixed(2)} ৳</p>
         </div>
      </div>
    </motion.div>
  );
};

export default Calculator;
