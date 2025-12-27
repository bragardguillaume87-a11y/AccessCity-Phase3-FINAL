import { motion } from 'framer-motion';

export function AnimatedProgressBar({ value, max, label, color = 'blue' }) {
  const percentage = (value / max) * 100;

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
  };

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
