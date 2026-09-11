import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image, Platform } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@saccosphere/api-client'
import { useCurrentUser } from '../../store/useAuthStore'
import { loadRefreshToken } from '../../hooks/useAuth'
import { Icon } from '../../components/ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

const BIOMETRIC_TOKEN_KEY = 'saccosphere_biometric_refresh_token'
const INSTALL_ID_KEY = 'saccosphere_install_id'

function generateRandomId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

// A stable per-install identifier for trusted-device registration.
// Device.osBuildId/modelName are shared by every unit of the same phone
// model/firmware — using them as a "device ID" lets two different physical
// phones collide and corrupt each other's trusted-device/revocation state.
async function getOrCreateInstallId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(INSTALL_ID_KEY)
  if (existing) return existing
  const id = generateRandomId()
  await SecureStore.setItemAsync(INSTALL_ID_KEY, id)
  return id
}


export default function SettingsScreen() {
  const { colors: c } = useTheme()
  const insets = useSafeAreaInsets()
  const user = useCurrentUser()
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [loadingBiometrics, setLoadingBiometrics] = useState(false)

  const [passwordModalVisible, setPasswordModalVisible] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [kycModalVisible, setKycModalVisible] = useState(false)
  const [kycImage, setKycImage] = useState<string | null>(null)
  const [uploadingKyc, setUploadingKyc] = useState(false)

  const [devices, setDevices] = useState<any[]>([])
  const [loadingDevices, setLoadingDevices] = useState(false)
  const [devicesLoadError, setDevicesLoadError] = useState(false)

  useEffect(() => {
    checkBiometricStatus()
    loadDevices()
  }, [])

  const loadDevices = async () => {
    setLoadingDevices(true)
    setDevicesLoadError(false)
    try {
      const res = await api.auth.getDevices()
      setDevices(Array.isArray(res) ? res : [])
    } catch (err) {
      console.warn('Failed to load trusted devices:', err)
      setDevicesLoadError(true)
    } finally {
      setLoadingDevices(false)
    }
  }

  const handleRevokeDevice = (deviceId: string, deviceName: string) => {
    Alert.alert(
      'Revoke Device',
      `Are you sure you want to revoke trusted access for "${deviceName || deviceId}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.auth.revokeDevice(deviceId)
              Alert.alert('Success', 'Device revoked successfully.')
              loadDevices()
            } catch (err) {
              Alert.alert('Error', 'Failed to revoke device access.')
            }
          },
        },
      ]
    )
  }

  const checkBiometricStatus = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    setBiometricSupported(compatible && enrolled)

    if (compatible && enrolled) {
      const stored = await SecureStore.getItemAsync(BIOMETRIC_TOKEN_KEY)
      setBiometricEnabled(!!stored)
    }
  }

  const toggleBiometric = async () => {
    if (!biometricSupported) {
      Alert.alert('Unsupported', 'Biometric authentication is not set up on this device.')
      return
    }

    if (biometricEnabled) {
      setLoadingBiometrics(true)
      try {
        // Tell the server first — only clear the local token once it's
        // confirmed, so a failed request can't desync local/server state
        // (local token gone but server still thinks biometric is enabled).
        const deviceId = await getOrCreateInstallId()
        await api.auth.registerDevice({
          device_id: deviceId,
          platform: Platform.OS === 'ios' ? 'ios' : 'android',
          biometric_enabled: false,
        })
        await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY)
        setBiometricEnabled(false)
      } catch (err) {
        console.error(err)
        Alert.alert('Error', 'Failed to disable biometric login on the server. Please try again.')
      } finally {
        setLoadingBiometrics(false)
      }
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable Biometric Login',
      })
      if (result.success) {
        setLoadingBiometrics(true)
        try {
          // Persist the real refresh token (SecureStore on native, localStorage
          // on web — both handled by loadRefreshToken) so biometric login can
          // exchange it later.
          const currentRefreshToken = (await loadRefreshToken()) || ''
          if (!currentRefreshToken) {
            Alert.alert('Sign in again', 'Please sign out and back in before enabling biometric login.')
            return
          }
          await SecureStore.setItemAsync(BIOMETRIC_TOKEN_KEY, currentRefreshToken, {
            keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
          })

          const deviceId = await getOrCreateInstallId()
          await api.auth.registerDevice({
            device_id: deviceId,
            platform: Platform.OS === 'ios' ? 'ios' : 'android',
            biometric_enabled: true,
          })
          setBiometricEnabled(true)
          Alert.alert('Success', 'Biometric login is now enabled.')
        } catch (err) {
          console.error(err)
          await SecureStore.deleteItemAsync(BIOMETRIC_TOKEN_KEY).catch(() => {})
          Alert.alert('Error', 'Failed to enable biometric login on the server.')
        } finally {
          setLoadingBiometrics(false)
        }
      }
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match')
      return
    }
    setChangingPassword(true)
    try {
      await api.auth.changePassword({ old_password: oldPassword, new_password: newPassword, new_password2: confirmPassword })
      Alert.alert('Success', 'Password changed successfully')
      setPasswordModalVisible(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const pickImage = async (useCamera: boolean) => {
    const permissionResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (permissionResult.granted === false) {
      Alert.alert('Permission denied', `We need ${useCamera ? 'camera' : 'gallery'} permissions to upload KYC documents.`)
      return
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.7 })

    if (!result.canceled) {
      setKycImage(result.assets[0].uri)
    }
  }

  const handleUploadKyc = async () => {
    if (!kycImage) return
    setUploadingKyc(true)
    try {
      await api.kyc.uploadDocument({
        document_type: 'id_front',
        file: { uri: kycImage, name: 'kyc_id.jpg', type: 'image/jpeg' },
      })
      Alert.alert('Success', 'KYC document uploaded successfully. Our team will review it shortly.')
      setKycModalVisible(false)
      setKycImage(null)
    } catch (err: any) {
      Alert.alert('Error', err?.message || err?.response?.data?.message || 'Failed to upload KYC document')
    } finally {
      setUploadingKyc(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: c.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: c.text, fontSize: 20, fontWeight: '700' }}>Security & Settings</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Biometrics */}
        <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Biometric Login</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Use FaceID or Fingerprint to log in securely without entering your password.</Text>
            </View>
            <TouchableOpacity 
              style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: biometricEnabled ? c.success : c.surface, borderWidth: 1, borderColor: biometricEnabled ? c.success : c.border, padding: 2, justifyContent: 'center' }}
              onPress={toggleBiometric}
              disabled={loadingBiometrics}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: biometricEnabled ? 'flex-end' : 'flex-start' }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password */}
        <TouchableOpacity 
          style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          onPress={() => setPasswordModalVisible(true)}
        >
          <View>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Change Password</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Update your account password securely.</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Upload KYC */}
        <TouchableOpacity
          style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          onPress={() => setKycModalVisible(true)}
        >
          <View>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Upload KYC</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Upload ID or documents for account verification.</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Privacy & Data */}
        <TouchableOpacity
          style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          onPress={() => router.push('/(member)/privacy')}
        >
          <View>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Privacy & Data</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Manage consents, connect Google, export or delete your data.</Text>
          </View>
          <Text style={{ color: c.textMuted, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Trusted Registered Devices */}
        <View style={{ backgroundColor: c.surface, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View>
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Trusted Devices</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>Manage devices with biometric/trusted access.</Text>
            </View>
            {loadingDevices && <ActivityIndicator color={c.success} size="small" />}
          </View>

          {devicesLoadError && !loadingDevices ? (
            <View>
              <Text style={{ color: c.danger, fontSize: 12, fontStyle: 'italic', marginBottom: 6 }}>Couldn't load trusted devices.</Text>
              <TouchableOpacity onPress={loadDevices}>
                <Text style={{ color: c.accent, fontSize: 12, fontWeight: '600' }}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : devices.length === 0 && !loadingDevices ? (
            <Text style={{ color: c.textMuted, fontSize: 12, fontStyle: 'italic' }}>No registered trusted devices found.</Text>
          ) : (
            devices.map((d: any) => (
              <View key={d.device_id || d.id} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 0.5, borderTopColor: c.border }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>{d.device_name || d.device_id || 'Device'}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 10 }}>Platform: {d.platform || 'Mobile'} · Biometric: {d.biometric_enabled ? 'Yes' : 'No'}</Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.4)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}
                  onPress={() => handleRevokeDevice(d.device_id || d.id, d.device_name || d.device_id)}
                >
                  <Text style={{ color: '#FCA5A5', fontSize: 10, fontWeight: '600' }}>Revoke</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
          behavior="padding"
        >
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: c.border }}>
            <View style={{ width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Change Password</Text>

            <TextInput
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12, color: c.text, backgroundColor: c.surface }}
              placeholder="Current Password"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12, color: c.text, backgroundColor: c.surface }}
              placeholder="New Password"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 24, color: c.text, backgroundColor: c.surface }}
              placeholder="Confirm New Password"
              placeholderTextColor={c.textMuted}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={{ backgroundColor: c.accent, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={handleChangePassword}
              disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => {
                setPasswordModalVisible(false)
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Upload KYC Modal */}
      <Modal visible={kycModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: c.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: c.border }}>
            <View style={{ width: 36, height: 4, backgroundColor: c.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Upload KYC Document</Text>
            <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 24 }}>Select a document type to upload for verification.</Text>

            {kycImage ? (
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <Image source={{ uri: kycImage }} style={{ width: '100%', height: 200, borderRadius: 12, marginBottom: 12 }} resizeMode="cover" />
                <TouchableOpacity onPress={() => setKycImage(null)}>
                  <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>Remove Image</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: c.border }}
                  onPress={() => pickImage(true)}
                >
                  <Icon name="camera" size={24} color="#6D28D9" style={{ marginBottom: 8 }} />
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: c.surface, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: c.border }}
                  onPress={() => pickImage(false)}
                >
                  <Icon name="folder" size={24} color="#6D28D9" style={{ marginBottom: 8 }} />
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '600' }}>Choose File</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={{ backgroundColor: kycImage ? c.accent : 'rgba(109, 40, 217, 0.3)', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={handleUploadKyc}
              disabled={uploadingKyc || !kycImage}
            >
              {uploadingKyc ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Upload Document</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => {
                setKycModalVisible(false)
                setKycImage(null)
              }}
            >
              <Text style={{ color: c.text, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

