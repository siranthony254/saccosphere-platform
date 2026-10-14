import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { useMembershipBySacco } from '../../../../hooks/useMembership'
import { useNominees, useSetNominees } from '../../../../hooks/useNominees'
import { useTheme } from '../../../../theme/ThemeProvider'

const RELATIONSHIPS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'] as const

type NomineeRow = {
  full_name: string
  id_number: string
  relationship: string
  phone_number: string
  percentage: string
  is_minor: boolean
  guardian_name: string
  guardian_id_number: string
  guardian_phone: string
}

const EMPTY_ROW: NomineeRow = {
  full_name: '', id_number: '', relationship: 'SPOUSE', phone_number: '', percentage: '',
  is_minor: false, guardian_name: '', guardian_id_number: '', guardian_phone: '',
}

export default function NomineesScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const { data: membership } = useMembershipBySacco(slug ?? '')
  const { data: nominees, isLoading } = useNominees(membership?.id ?? null)
  const setNominees = useSetNominees(membership?.id ?? null)

  const [rows, setRows] = useState<NomineeRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!nominees) return
    setRows(
      nominees.length > 0
        ? nominees.map((n) => ({
            full_name: n.full_name, id_number: n.id_number, relationship: n.relationship,
            phone_number: n.phone_number, percentage: String(n.percentage),
            is_minor: n.is_minor, guardian_name: n.guardian_name, guardian_id_number: n.guardian_id_number,
            guardian_phone: n.guardian_phone,
          }))
        : [{ ...EMPTY_ROW }]
    )
  }, [nominees])

  const totalPct = rows.reduce((sum, r) => sum + (Number(r.percentage) || 0), 0)

  const updateRow = (index: number, patch: Partial<NomineeRow>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const addRow = () => setRows((prev) => [...prev, { ...EMPTY_ROW }])
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index))

  const handleSave = () => {
    setError(null)
    if (rows.some((r) => !r.full_name.trim() || !r.id_number.trim() || !r.phone_number.trim() || !r.percentage.trim())) {
      setError('Every nominee needs a name, ID number, phone number and percentage.')
      return
    }
    if (Math.round(totalPct * 100) !== 10000) {
      setError(`Percentages must sum to exactly 100 — currently ${totalPct.toFixed(2)}.`)
      return
    }
    for (const r of rows) {
      if (r.is_minor && (!r.guardian_name.trim() || !r.guardian_id_number.trim() || !r.guardian_phone.trim())) {
        setError(`${r.full_name || 'A minor nominee'} needs all three guardian fields filled in.`)
        return
      }
    }

    setNominees.mutate(
      rows.map((r) => ({
        full_name: r.full_name.trim(),
        id_number: r.id_number.trim(),
        relationship: r.relationship,
        phone_number: r.phone_number.trim(),
        percentage: Number(r.percentage),
        is_minor: r.is_minor,
        ...(r.is_minor
          ? { guardian_name: r.guardian_name.trim(), guardian_id_number: r.guardian_id_number.trim(), guardian_phone: r.guardian_phone.trim() }
          : {}),
      })),
      {
        onSuccess: () => Alert.alert('Saved', 'Your nominees have been updated.'),
        onError: (err: any) => setError(err?.message || 'Failed to save nominees.'),
      }
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back" style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Nominees</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>
          Who your savings and share capital go to if something happens to you. Saving here replaces your
          whole nominee list — percentages must add up to exactly 100%.
        </Text>
      </View>

      {isLoading ? (
        <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={c.accent} /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}>
          {rows.map((r, i) => (
            <View key={i} style={{ backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }}>Nominee {i + 1}</Text>
                {rows.length > 1 ? (
                  <TouchableOpacity onPress={() => removeRow(i)}>
                    <Text style={{ color: c.danger, fontSize: 12, fontWeight: '600' }}>Remove</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              <Field label="Full name" value={r.full_name} onChangeText={(v) => updateRow(i, { full_name: v })} c={c} />
              <Field label="ID number" value={r.id_number} onChangeText={(v) => updateRow(i, { id_number: v })} c={c} />
              <Field label="Phone number" value={r.phone_number} onChangeText={(v) => updateRow(i, { phone_number: v })} keyboardType="phone-pad" c={c} />
              <Field label="Percentage" value={r.percentage} onChangeText={(v) => updateRow(i, { percentage: v })} keyboardType="decimal-pad" c={c} />

              <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 6, marginTop: 4 }}>Relationship</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {RELATIONSHIPS.map((rel) => {
                  const on = r.relationship === rel
                  return (
                    <TouchableOpacity
                      key={rel}
                      onPress={() => updateRow(i, { relationship: rel })}
                      style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: on ? c.success : c.border, backgroundColor: on ? 'rgba(16,185,129,0.12)' : 'transparent' }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '600', color: on ? c.success : c.textMuted }}>{rel}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>This nominee is a minor</Text>
                <Switch value={r.is_minor} onValueChange={(v) => updateRow(i, { is_minor: v })} />
              </View>

              {r.is_minor ? (
                <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }}>
                  <Field label="Guardian name" value={r.guardian_name} onChangeText={(v) => updateRow(i, { guardian_name: v })} c={c} />
                  <Field label="Guardian ID number" value={r.guardian_id_number} onChangeText={(v) => updateRow(i, { guardian_id_number: v })} c={c} />
                  <Field label="Guardian phone" value={r.guardian_phone} onChangeText={(v) => updateRow(i, { guardian_phone: v })} keyboardType="phone-pad" c={c} />
                </View>
              ) : null}
            </View>
          ))}

          <TouchableOpacity onPress={addRow} style={{ borderWidth: 1, borderColor: c.border, borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>+ Add another nominee</Text>
          </TouchableOpacity>

          <Text style={{ color: Math.round(totalPct * 100) === 10000 ? c.success : c.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
            Total: {totalPct.toFixed(2)}%
          </Text>

          {error ? <Text style={{ color: c.danger, fontSize: 12, textAlign: 'center', marginBottom: 12 }}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSave}
            disabled={setNominees.isPending}
            style={{ backgroundColor: c.accent, borderRadius: 14, padding: 16, alignItems: 'center', opacity: setNominees.isPending ? 0.6 : 1 }}
          >
            {setNominees.isPending ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>Save nominees</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function Field({ label, value, onChangeText, keyboardType, c }: { label: string; value: string; onChangeText: (v: string) => void; keyboardType?: 'phone-pad' | 'decimal-pad'; c: any }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor={c.textFaint}
        style={{ color: c.text, fontSize: 13, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: 10, backgroundColor: c.bg }}
      />
    </View>
  )
}
