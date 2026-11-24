
import type { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number
  description: string
  icon: LucideIcon
  color: string
}

export default function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#102536] p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <Icon size={20} className={color} />
      </div>

      <p className="mt-4 text-3xl font-bold text-white">
        {value.toLocaleString()}
      </p>

      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </div>
  )
}
