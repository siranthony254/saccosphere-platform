import React from 'react'
import { View, Text } from 'react-native'

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface Props {
  label: string
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
}

export function Badge({ label, variant = 'neutral', size = 'sm', className = '' }: Props) {
  const variants = {
    success: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
    warning: 'bg-amber-500/10 border-amber-500/20 text-amber-600',
    error: 'bg-rose-500/10 border-rose-500/20 text-rose-600',
    info: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600',
    neutral: 'bg-slate-500/10 border-slate-500/20 text-slate-600',
  }

  const sizes = {
    sm: 'px-2 py-0.5 rounded-md text-[10px]',
    md: 'px-3 py-1 rounded-lg text-[12px]',
  }

  return (
    <View className={`border items-center justify-center ${variants[variant]} ${sizes[size]} ${className}`}>
      <Text className={`font-bold uppercase tracking-tight ${variants[variant].split(' ').pop()}`}>
        {label}
      </Text>
    </View>
  )
}
