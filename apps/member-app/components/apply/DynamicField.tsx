import React from 'react'
import { View, Text, TextInput, Switch, TouchableOpacity } from 'react-native'
import type { AdditionalField } from '@saccosphere/schemas'
import * as ImagePicker from 'expo-image-picker'

interface Props {
  field: AdditionalField
  value: any
  onChange: (value: any) => void
}

export function DynamicField({ field, value, onChange }: Props) {
  const label = (
    <Text className="text-ink-soft text-xs font-medium mb-1.5">
      {field.label} {field.required && <Text className="text-red-500">*</Text>}
    </Text>
  )

  const renderInput = () => {
    switch (field.type) {
      case 'boolean':
        return (
          <View className="flex-row items-center justify-between bg-surface2 rounded-xl p-3 border border-border">
            <Text className="text-xs text-ink-muted">{field.hint || 'Select option'}</Text>
            <Switch
              value={!!value}
              onValueChange={onChange}
              trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
              thumbColor="#FFFFFF"
            />
          </View>
        )

      case 'number':
        return (
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
            value={value ? String(value) : ''}
            onChangeText={(v) => onChange(v.replace(/[^0-9.]/g, ''))}
            keyboardType="numeric"
            placeholder={field.placeholder || '0'}
            placeholderTextColor="#9CA3AF"
          />
        )

      case 'select':
        return (
          <View className="gap-2">
            {field.options?.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => onChange(opt)}
                className={`p-3 rounded-xl border ${
                  value === opt ? 'bg-violet-50 border-violet-500' : 'bg-surface2 border-border'
                }`}
              >
                <Text className={`text-xs ${value === opt ? 'text-violet-700 font-bold' : 'text-ink'}`}>
                  {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )

      case 'file':
        return (
          <TouchableOpacity
            onPress={async () => {
              const res = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: false,
                quality: 0.8,
              })
              if (!res.canceled) {
                onChange(res.assets[0])
              }
            }}
            className="border-2 border-dashed border-border bg-surface2 rounded-xl p-4 items-center"
          >
            <Text className="text-base mb-1">📁</Text>
            <Text className="text-xs font-semibold text-ink">
              {value ? (value.fileName || 'Document selected') : `Upload ${field.label}`}
            </Text>
            {value && <Text className="text-[10px] text-mint-600 font-bold mt-1">✓ Ready</Text>}
          </TouchableOpacity>
        )

      case 'date':
        return (
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
            value={value || ''}
            onChangeText={onChange}
            placeholder={field.placeholder || 'YYYY-MM-DD'}
            placeholderTextColor="#9CA3AF"
          />
        )

      case 'textarea':
        return (
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border min-h-[80px]"
            value={value || ''}
            onChangeText={onChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            placeholder={field.placeholder || 'Enter details...'}
            placeholderTextColor="#9CA3AF"
          />
        )

      default:
        return (
          <TextInput
            className="bg-surface2 rounded-xl p-3 text-xs text-ink border border-border"
            value={value || ''}
            onChangeText={onChange}
            placeholder={field.placeholder || ''}
            placeholderTextColor="#9CA3AF"
          />
        )
    }
  }

  return (
    <View className="mb-4">
      {label}
      {renderInput()}
      {field.hint && field.type !== 'boolean' && (
        <Text className="text-[10px] text-ink-faint mt-1">{field.hint}</Text>
      )}
    </View>
  )
}
