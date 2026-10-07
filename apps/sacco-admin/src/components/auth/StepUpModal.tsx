import { useState } from 'react'
import { api } from '@saccosphere/api-client'

interface StepUpModalProps {
  isOpen: boolean
  title?: string
  description?: string
  onClose: () => void
  onSuccess: () => void
}

export function StepUpModal({
  isOpen,
  title = 'Step-Up Verification Required',
  description = 'This is a sensitive financial action requiring second-factor staff authorization. Request an OTP or enter your MFA token.',
  onClose,
  onSuccess,
}: StepUpModalProps) {
  const [code, setCode] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRequestOtp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await api.auth.requestStepUpOtp()
      setOtpSent(true)
    } catch (err: any) {
      setError(err?.message || 'Failed to send step-up OTP.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError('Please enter the 6-digit verification code.')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      // Confirming step-up code
      await api.auth.mfaConfirm(code.trim())
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err?.message || 'Invalid verification code. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-[#e5ede9] space-y-4">
        <div className="flex justify-between items-center border-b border-[#e5ede9] pb-3">
          <div className="font-bold text-base text-ink">{title}</div>
          <button onClick={onClose} className="text-ink-muted text-lg font-bold hover:text-ink cursor-pointer">
            &times;
          </button>
        </div>

        <p className="text-xs text-ink-muted leading-relaxed">{description}</p>

        {error && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
            {error}
          </div>
        )}

        {otpSent && (
          <div className="p-2.5 bg-mint-50 border border-mint-200 text-mint-800 text-xs rounded-lg font-semibold">
            A step-up verification code has been sent to your registered phone / email.
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-3">
          <div>
            <label className="text-xs text-ink-muted mb-1 block font-medium">Verification Code (MFA or Step-Up OTP)</label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. 123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full py-2 px-3 border border-ink-faint rounded-lg text-sm text-center font-mono tracking-widest bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
              required
            />
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleRequestOtp}
              disabled={isLoading}
              className="text-xs text-violet-700 font-semibold hover:underline bg-transparent border-none cursor-pointer"
            >
              {isLoading ? 'Sending OTP...' : 'Request Step-Up SMS OTP'}
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-ink-faint text-ink-muted text-xs font-semibold hover:bg-surface-2 cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold cursor-pointer transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Verifying...' : 'Authorize Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
