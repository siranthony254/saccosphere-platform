import React from 'react'
import type { StyleProp, TextStyle } from 'react-native'
import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons'

export type IconName =
  | 'home' | 'services' | 'discover' | 'menu'
  | 'card' | 'bank' | 'file' | 'folder' | 'plus'
  | 'savings' | 'withdraw' | 'transfer' | 'loan' | 'dividend'
  | 'security' | 'lock' | 'phone' | 'bell' | 'settings' | 'logout'
  | 'success' | 'error' | 'warning' | 'info'
  | 'guarantor' | 'arrow-right' | 'check' | 'close'
  | 'camera' | 'cash' | 'send' | 'receive' | 'swap'
  | 'calendar' | 'bulb' | 'scale' | 'mail' | 'link' | 'search' | 'chart'
  | 'eye' | 'eye-off'

interface Props {
  name: IconName
  size?: number
  color?: string
  className?: string
  style?: StyleProp<TextStyle>
}

export function Icon({ name, size = 20, color = '#111827', style }: Props) {
  const io = (n: React.ComponentProps<typeof Ionicons>['name']) => (
    <Ionicons name={n} size={size} color={color} style={style} />
  )
  const mci = (n: React.ComponentProps<typeof MaterialCommunityIcons>['name']) => (
    <MaterialCommunityIcons name={n} size={size} color={color} style={style} />
  )
  switch (name) {
    case 'home': return io('home-outline')
    case 'services': return io('flash-outline')
    case 'discover': return io('search-outline')
    case 'menu': return io('menu-outline')

    case 'card': return io('card-outline')
    case 'bank': return mci('bank-outline')
    case 'file': return io('document-text-outline')
    case 'folder': return io('folder-outline')
    case 'plus': return io('add-outline')

    case 'camera': return io('camera-outline')
    case 'cash': return io('cash-outline')
    case 'send': return io('arrow-up-circle-outline')
    case 'receive': return io('arrow-down-circle-outline')
    case 'swap': return io('swap-horizontal-outline')
    case 'calendar': return io('calendar-outline')
    case 'bulb': return io('bulb-outline')
    case 'scale': return mci('scale-balance')
    case 'mail': return io('mail-outline')
    case 'link': return io('link-outline')
    case 'search': return io('search-outline')
    case 'chart': return io('bar-chart-outline')
    case 'lock': return io('lock-closed-outline')
    case 'close': return io('close-outline')
    case 'eye': return io('eye-outline')
    case 'eye-off': return io('eye-off-outline')

    case 'savings': return mci('piggy-bank-outline')
    case 'withdraw': return mci('cash-minus')
    case 'transfer': return mci('swap-horizontal')
    case 'loan': return mci('hand-coin-outline')
    case 'dividend': return io('trending-up-outline')

    case 'security': return io('shield-checkmark-outline')
    case 'phone': return io('call-outline')
    case 'bell': return io('notifications-outline')
    case 'settings': return io('settings-outline')
    case 'logout': return io('log-out-outline')

    case 'success': return io('checkmark-circle')
    case 'error': return io('close-circle')
    case 'warning': return io('warning-outline')
    case 'info': return io('information-circle-outline')

    case 'guarantor': return mci('handshake-outline')
    case 'arrow-right': return io('chevron-forward')
    case 'check': return io('checkmark')

    default: return io('help-circle-outline')
  }
}
