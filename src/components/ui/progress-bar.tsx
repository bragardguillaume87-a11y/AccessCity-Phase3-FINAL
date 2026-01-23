import * as React from "react"
import { motion } from 'framer-motion'

type ProgressBarColor = 'blue' | 'green' | 'red'

export interface AnimatedProgressBarProps {
  value: number
  max: number
  label: string
  color?: ProgressBarColor
}

const colorClasses: Record<ProgressBarColor, string> = {
  blue: 'from-blue-500 to-blue-600',
  green: 'from-green-500 to-green-600',
  red: 'from-red-500 to-red-600',
}

export function AnimatedProgressBar({
  value,
  max,
  label,
  color = 'blue',
}: AnimatedProgressBarProps) {
  const percentage = (value / max) * 100

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full bg-gradient-to-r ${colorClasses[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}
