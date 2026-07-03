import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, Modal, TextInput, Image } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import * as Device from 'expo-device'
import * as ImagePicker from 'expo-image-picker'
import { api } from '@saccosphere/api-client'
import { useCurrentUser } from '../../store/useAuthStore'

const BACKGROUND = '#06091A'
const FROSTED_DARK = 'rgba(255, 255, 255, 0.06)'
const BORDER_WHITE = 'rgba(255, 255, 255, 0.1)'
const TEXT = '#F8FAFC'
const TEXT_MUTED = 'rgba(248, 250, 252, 0.68)'
const VIOLET = '#6D28D9'
const MINT = '#10B981'

export default function SettingsScreen() {
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

  useEffect(() => {
    checkBiometricStatus()
  }, [])

  const checkBiometricStatus = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync()
    const enrolled = await LocalAuthentication.isEnrolledAsync()
    setBiometricSupported(compatible && enrolled)

    if (compatible && enrolled) {
      const stored = await SecureStore.getItemAsync('saccosphere_biometric_refresh_token')
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
        await SecureStore.deleteItemAsync('saccosphere_biometric_refresh_token')
        const deviceId = Device.osBuildId || Device.modelName || 'unknown-device'
        await api.auth.registerDevice({
          device_id: deviceId,
          platform: Device.osName || 'unknown',
          biometric_enabled: false,
        })
        setBiometricEnabled(false)
      } catch (err) {
        console.error(err)
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
          const currentRefreshToken = window.localStorage.getItem('saccosphere-refresh-token') || ''
          await SecureStore.setItemAsync('saccosphere_biometric_refresh_token', currentRefreshToken)
          
          const deviceId = Device.osBuildId || Device.modelName || 'unknown-device'
          await api.auth.registerDevice({
            device_id: deviceId,
            platform: Device.osName || 'unknown',
            biometric_enabled: true,
          })
          setBiometricEnabled(true)
          Alert.alert('Success', 'Biometric login is now enabled.')
        } catch (err) {
          console.error(err)
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
      await api.auth.changePassword({ old_password: oldPassword, new_password: newPassword, new_password2: confirmPassword } as any)
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
      // In a real app, we would upload the file to a server
      // For now, we simulate success
      await new Promise(resolve => setTimeout(resolve, 2000))
      Alert.alert('Success', 'KYC document uploaded successfully. Our team will review it shortly.')
      setKycModalVisible(false)
      setKycImage(null)
    } catch (err) {
      Alert.alert('Error', 'Failed to upload KYC document')
    } finally {
      setUploadingKyc(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BACKGROUND }} edges={['bottom', 'left', 'right']}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: BORDER_WHITE }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Text style={{ color: VIOLET, fontSize: 12, fontWeight: '600' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ color: TEXT, fontSize: 20, fontWeight: '700' }}>Security & Settings</Text>
      </View>

      <View style={{ padding: 16 }}>
        {/* Biometrics */}
        <View style={{ backgroundColor: FROSTED_DARK, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: BORDER_WHITE }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Biometric Login</Text>
              <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Use FaceID or Fingerprint to log in securely without entering your password.</Text>
            </View>
            <TouchableOpacity 
              style={{ width: 48, height: 28, borderRadius: 14, backgroundColor: biometricEnabled ? MINT : FROSTED_DARK, borderWidth: 1, borderColor: biometricEnabled ? MINT : BORDER_WHITE, padding: 2, justifyContent: 'center' }}
              onPress={toggleBiometric}
              disabled={loadingBiometrics}
            >
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', alignSelf: biometricEnabled ? 'flex-end' : 'flex-start' }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Change Password */}
        <TouchableOpacity 
          style={{ backgroundColor: FROSTED_DARK, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}
          onPress={() => setPasswordModalVisible(true)}
        >
          <View>
            <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Change Password</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Update your account password securely.</Text>
          </View>
          <Text style={{ color: TEXT_MUTED, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>

        {/* Upload KYC */}
        <TouchableOpacity
          style={{ backgroundColor: FROSTED_DARK, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: BORDER_WHITE, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          onPress={() => setKycModalVisible(true)}
        >
          <View>
            <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600', marginBottom: 4 }}>Upload KYC</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 12 }}>Upload ID or documents for account verification.</Text>
          </View>
          <Text style={{ color: TEXT_MUTED, fontSize: 18 }}>{'>'}</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: BORDER_WHITE }}>
            <View style={{ width: 36, height: 4, backgroundColor: BORDER_WHITE, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 16 }}>Change Password</Text>

            <TextInput
              style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12, color: TEXT, backgroundColor: FROSTED_DARK }}
              placeholder="Current Password"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 12, color: TEXT, backgroundColor: FROSTED_DARK }}
              placeholder="New Password"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 12, fontSize: 14, marginBottom: 24, color: TEXT, backgroundColor: FROSTED_DARK }}
              placeholder="Confirm New Password"
              placeholderTextColor={TEXT_MUTED}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={{ backgroundColor: VIOLET, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={handleChangePassword}
              disabled={changingPassword || !oldPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Save Changes</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => {
                setPasswordModalVisible(false)
                setOldPassword('')
                setNewPassword('')
                setConfirmPassword('')
              }}
            >
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Upload KYC Modal */}
      <Modal visible={kycModalVisible} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1, borderColor: BORDER_WHITE }}>
            <View style={{ width: 36, height: 4, backgroundColor: BORDER_WHITE, borderRadius: 2, alignSelf: 'center', marginBottom: 20 }} />
            <Text style={{ color: TEXT, fontSize: 18, fontWeight: '700', marginBottom: 8 }}>Upload KYC Document</Text>
            <Text style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 24 }}>Select a document type to upload for verification.</Text>

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
                  style={{ flex: 1, backgroundColor: FROSTED_DARK, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: BORDER_WHITE }}
                  onPress={() => pickImage(true)}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>📸</Text>
                  <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ flex: 1, backgroundColor: FROSTED_DARK, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: BORDER_WHITE }}
                  onPress={() => pickImage(false)}
                >
                  <Text style={{ fontSize: 24, marginBottom: 8 }}>📁</Text>
                  <Text style={{ color: TEXT, fontSize: 12, fontWeight: '600' }}>Choose File</Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={{ backgroundColor: kycImage ? VIOLET : 'rgba(109, 40, 217, 0.3)', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 }}
              onPress={handleUploadKyc}
              disabled={uploadingKyc || !kycImage}
            >
              {uploadingKyc ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Upload Document</Text>}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ borderWidth: 1, borderColor: BORDER_WHITE, borderRadius: 12, padding: 16, alignItems: 'center' }}
              onPress={() => {
                setKycModalVisible(false)
                setKycImage(null)
              }}
            >
              <Text style={{ color: TEXT, fontSize: 14, fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

