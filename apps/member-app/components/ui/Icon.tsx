import React from 'react'
import {
  Ionicons,
  MaterialCommunityIcons
} from '@expo/vector-icons'

export type IconName =
  | 'home' | 'services' | 'discover' | 'menu'
  | 'card' | 'bank' | 'file' | 'plus'
  | 'savings' | 'withdraw' | 'transfer' | 'loan' | 'dividend'
  | 'security' | 'phone' | 'bell' | 'settings' | 'logout'
  | 'success' | 'error' | 'warning' | 'info'
  | 'guarantor' | 'arrow-right' | 'check'

interface Props {
  name: IconName
  size?: number
  color?: string
  className?: string
}

export function Icon({ name, size = 20, color = '#111827', className = '' }: Props) {
  switch (name) {
    case 'home': return <Ionicons name="home-outline" size={size} color={color} />
    case 'services': return <Ionicons name="flash-outline" size={size} color={color} />
    case 'discover': return <Ionicons name="search-outline" size={size} color={color} />
    case 'menu': return <Ionicons name="menu-outline" size={size} color={color} />

    case 'card': return <Ionicons name="card-outline" size={size} color={color} />
    case 'bank': return <MaterialCommunityIcons name="bank-outline" size={size} color={color} />
    case 'file': return <Ionicons name="document-text-outline" size={size} color={color} />
    case 'plus': return <Ionicons name="add-outline" size={size} color={color} />

    case 'savings': return <MaterialCommunityIcons name="piggy-bank-outline" size={size} color={color} />
    case 'withdraw': return <MaterialCommunityIcons name="cash-minus" size={size} color={color} />
    case 'transfer': return <MaterialCommunityIcons name="swap-horizontal" size={size} color={color} />
    case 'loan': return <MaterialCommunityIcons name="hand-coin-outline" size={size} color={color} />
    case 'dividend': return <Ionicons name="trending-up-outline" size={size} color={color} />

    case 'security': return <Ionicons name="shield-checkmark-outline" size={size} color={color} />
    case 'phone': return <Ionicons name="call-outline" size={size} color={color} />
    case 'bell': return <Ionicons name="notifications-outline" size={size} color={color} />
    case 'settings': return <Ionicons name="settings-outline" size={size} color={color} />
    case 'logout': return <Ionicons name="log-out-outline" size={size} color={color} />

    case 'success': return <Ionicons name="checkmark-circle" size={size} color={color} />
    case 'error': return <Ionicons name="close-circle" size={size} color={color} />
    case 'warning': return <Ionicons name="warning-outline" size={size} color={color} />
    case 'info': return <Ionicons name="information-circle-outline" size={size} color={color} />

    case 'guarantor': return <MaterialCommunityIcons name="handshake-outline" size={size} color={color} />
    case 'arrow-right': return <Ionicons name="chevron-forward" size={size} color={color} />
    case 'check': return <Ionicons name="checkmark" size={size} color={color} />

    default: return <Ionicons name="help-circle-outline" size={size} color={color} />
  }
}
