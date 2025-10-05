import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'
import { supabase } from '../lib/supabase'

const EventsPage = () => {
    const navigate = useNavigate()

    // Form fields (Swiggy campaign)
    const [userName, setUserName] = useState('')
    const [phone, setPhone] = useState('')
    const [upiId, setUpiId] = useState('')
    const [screenshot, setScreenshot] = useState<File | null>(null)
    const [screenshotPreview, setScreenshotPreview] = useState<string>('')

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [submissionSuccess, setSubmissionSuccess] = useState(false)
    const [agreed, setAgreed] = useState(false)

    // Validation states
    const [validationErrors, setValidationErrors] = useState<{
        userName?: string
        phone?: string
        upiId?: string
        screenshot?: string
    }>({})

    // Additional states for unbreakable flow
    const [isValidatingUPI, setIsValidatingUPI] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [networkError, setNetworkError] = useState(false)
    const [hasClickedRedirect, setHasClickedRedirect] = useState(false)

    // Restore form state from localStorage
    useEffect(() => {
        const map: Array<[string, (v: string) => void]> = [
            ['swiggy_userName', setUserName],
            ['swiggy_phone', setPhone],
            ['swiggy_upiId', setUpiId],
        ]
        for (const [key, setter] of map) {
            const v = localStorage.getItem(key)
            if (v) {
                setter(v)
            }
        }

        // Restore redirect state
        const hasClicked = localStorage.getItem('swiggy_hasClickedRedirect')
        if (hasClicked === 'true') {
            setHasClickedRedirect(true)
        }

        // Restore agreement state
        const agreedState = localStorage.getItem('swiggy_agreed')
        if (agreedState === 'true') {
            setAgreed(true)
        }
    }, [])

    // Auto-save to localStorage on field changes
    useEffect(() => {
        if (userName) {
            localStorage.setItem('swiggy_userName', userName)
        }
    }, [userName])

    useEffect(() => {
        if (phone) {
            localStorage.setItem('swiggy_phone', phone)
        }
    }, [phone])

    useEffect(() => {
        if (upiId) {
            localStorage.setItem('swiggy_upiId', upiId)
        }
    }, [upiId])

    useEffect(() => {
        if (agreed) {
            localStorage.setItem('swiggy_agreed', 'true')
        }
    }, [agreed])

    useEffect(() => {
        if (hasClickedRedirect) {
            localStorage.setItem('swiggy_hasClickedRedirect', 'true')
        }
    }, [hasClickedRedirect])

    // Reset form function
    const resetForm = useCallback(() => {
        setUserName('')
        setPhone('')
        setUpiId('')
        setScreenshot(null)
        setScreenshotPreview('')
        setAgreed(false)
        setError('')
        setValidationErrors({})
        setIsValidatingUPI(false)
        setIsSubmitting(false)
        setNetworkError(false)
        setSubmissionSuccess(false)
        setHasClickedRedirect(false)

        // Clear localStorage
        localStorage.removeItem('swiggy_userName')
        localStorage.removeItem('swiggy_phone')
        localStorage.removeItem('swiggy_upiId')
        localStorage.removeItem('swiggy_agreed')
        localStorage.removeItem('swiggy_hasClickedRedirect')
    }, [])

    const validatePhone = useCallback((number: string): boolean => {
        const cleaned = number.replace(/\D/g, '')
        return /^\d{10}$/.test(cleaned) && /^[6-9]/.test(cleaned)
    }, [])

    const validateUPI = useCallback((upi: string): boolean => {
        return /^[\w.-]{2,}@[A-Za-z]{2,}$/.test(upi.trim())
    }, [])

    const validateName = useCallback((name: string): boolean => {
        const trimmed = name.trim()
        return trimmed.length >= 2 && trimmed.length <= 50 && /^[A-Za-z\s]+$/.test(trimmed)
    }, [])

    const validateScreenshot = useCallback((file: File | null): boolean => {
        if (!file) {
            return false
        }
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        return validTypes.includes(file.type)
    }, [])

    // Comprehensive validation function
    const validateAllFields = useCallback(() => {
        const errors: typeof validationErrors = {}

        // Name validation
        if (!userName.trim()) {
            errors.userName = 'Name is required'
        } else if (!validateName(userName)) {
            errors.userName = 'Name must be 2-50 characters, letters and spaces only'
        }

        // Phone validation
        if (!phone.trim()) {
            errors.phone = 'Mobile number is required'
        } else if (!validatePhone(phone)) {
            errors.phone = 'Enter a valid 10-digit mobile number'
        }

        // UPI validation
        if (!upiId.trim()) {
            errors.upiId = 'UPI ID is required'
        } else if (!validateUPI(upiId)) {
            errors.upiId = 'Enter a valid UPI ID (e.g., name@bank)'
        }

        // Screenshot validation
        if (!screenshot) {
            errors.screenshot = 'Screenshot is required'
        } else if (!validateScreenshot(screenshot)) {
            errors.screenshot = 'Please upload a valid image file (max 5MB)'
        }

        setValidationErrors(errors)
        return Object.keys(errors).length === 0
    }, [userName, phone, upiId, screenshot, validateName, validatePhone, validateUPI, validateScreenshot])


    const handleScreenshotUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            if (!validateScreenshot(file)) {
                setValidationErrors(prev => ({
                    ...prev,
                    screenshot: 'Please upload a valid image file (max 5MB)'
                }))
                return
            }
            setScreenshot(file)
            setValidationErrors(prev => ({ ...prev, screenshot: undefined }))
            setError('')

            // Create preview
            const reader = new FileReader()
            reader.onload = (e) => {
                setScreenshotPreview(e.target?.result as string)
            }
            reader.readAsDataURL(file)
        }
    }, [validateScreenshot])

    const canRedirectToApp = useCallback(() => {
        return userName.trim() && validateName(userName) &&
            phone.trim() && validatePhone(phone) &&
            upiId.trim() && validateUPI(upiId) &&
            !validationErrors.upiId
    }, [userName, phone, upiId, validateName, validatePhone, validateUPI, validationErrors.upiId])

    const canSubmit = useCallback(() => {
        return canRedirectToApp() && hasClickedRedirect && screenshot && validateScreenshot(screenshot) && agreed
    }, [canRedirectToApp, hasClickedRedirect, screenshot, validateScreenshot, agreed])

    // Real-time validation on field changes
    const handleNameChange = useCallback((value: string) => {
        setUserName(value)
        if (value.trim()) {
            setValidationErrors(prev => ({
                ...prev,
                userName: validateName(value) ? undefined : 'Name must be 2-50 characters, letters and spaces only'
            }))
        } else {
            setValidationErrors(prev => ({ ...prev, userName: undefined }))
        }
    }, [validateName])

    const handlePhoneChange = useCallback((value: string) => {
        const cleaned = value.replace(/\D/g, '')
        setPhone(cleaned)
        if (cleaned) {
            setValidationErrors(prev => ({
                ...prev,
                phone: validatePhone(cleaned) ? undefined : 'Enter a valid 10-digit mobile number'
            }))
        } else {
            setValidationErrors(prev => ({ ...prev, phone: undefined }))
        }
    }, [validatePhone])

    // UPI validation with database check
    const validateUPIUnique = useCallback(async (upi: string): Promise<boolean> => {
        if (!validateUPI(upi)) {
            return false
        }

        try {
            setIsValidatingUPI(true)
            // Check if UPI ID exists in any existing records
            const { data, error } = await supabase
                .from('swiggy_orders')
                .select('id')
                .eq('upi_id', upi.trim())
                .limit(1)

            if (error) {
                // If table doesn't exist or other error, allow the UPI for now
                return true
            }

            return !data || data.length === 0
        } catch {
            // On any error, allow the UPI to avoid blocking users
            return true
        } finally {
            setIsValidatingUPI(false)
        }
    }, [validateUPI])

    const handleUpiChange = useCallback((value: string) => {
        setUpiId(value)
        if (value.trim()) {
            const isValidFormat = validateUPI(value)
            setValidationErrors(prev => ({
                ...prev,
                upiId: isValidFormat ? undefined : 'Enter a valid UPI ID (e.g., name@bank)'
            }))

            // Debounced UPI uniqueness check
            if (isValidFormat) {
                const timeoutId = setTimeout(async () => {
                    const isUnique = await validateUPIUnique(value)
                    if (!isUnique) {
                        setValidationErrors(prev => ({
                            ...prev,
                            upiId: 'This UPI ID has already been used for an order'
                        }))
                    } else {
                        setValidationErrors(prev => ({
                            ...prev,
                            upiId: undefined
                        }))
                    }
                }, 1000)

                return () => clearTimeout(timeoutId)
            }
        } else {
            setValidationErrors(prev => ({ ...prev, upiId: undefined }))
        }
    }, [validateUPI, validateUPIUnique])

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setNetworkError(false)
        setIsLoading(true)
        setIsSubmitting(true)

        try {
            // Comprehensive validation
            if (!validateAllFields()) {
                setError('Please fix all validation errors before submitting')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            // Check UPI uniqueness one more time before submission
            const isUPIUnique = await validateUPIUnique(upiId)
            if (!isUPIUnique) {
                setError('This UPI ID has already been used for an order. Please use a different UPI ID.')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            // Final validation checks
            if (!userName.trim() || !phone.trim() || !upiId.trim()) {
                setError('Please fill in all required fields')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            if (!hasClickedRedirect) {
                setError('Please click "Redirect to App" before submitting')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            if (!screenshot) {
                setError('Please upload a screenshot before submitting')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            if (!agreed) {
                setError('Please agree to the Terms & Conditions before submitting')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            // Upload screenshot to Supabase storage with enhanced error handling
            let screenshotUrl = ''
            if (screenshot) {
                const fileExt = screenshot.name.split('.').pop()
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

                try {
                    // Upload with upsert to handle filename conflicts
                    const { error: uploadError } = await supabase.storage
                        .from('swiggy-screenshots')
                        .upload(fileName, screenshot, {
                            cacheControl: '3600',
                            upsert: true
                        })

                    if (uploadError) {
                        setError(`Upload failed: ${uploadError.message}`)
                        setIsLoading(false)
                        setIsSubmitting(false)
                        return
                    }

                    // Get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('swiggy-screenshots')
                        .getPublicUrl(fileName)

                    screenshotUrl = publicUrl
                } catch {
                    setError('Network error during upload. Please check your connection and try again.')
                    setNetworkError(true)
                    setIsLoading(false)
                    setIsSubmitting(false)
                    return
                }
            }

            // Check if mobile number already exists
            const existingOrderCheck = await supabase
                .from('swiggy_orders')
                .select('id')
                .eq('mobile_number', phone.trim())
                .limit(1)

            if (existingOrderCheck.error) {
                setError('Network error during validation. Please try again.')
                setNetworkError(true)
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            if (existingOrderCheck.data && existingOrderCheck.data.length > 0) {
                setError('This mobile number has already been used for an order. Please use a different mobile number.')
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            // Insert new order record
            const { error: insertErr } = await supabase.from('swiggy_orders').insert([
                {
                    user_name: userName.trim(),
                    mobile_number: phone.trim(),
                    upi_id: upiId.trim(),
                    screenshot_url: screenshotUrl,
                    has_redirected: hasClickedRedirect,
                    status: 'submitted',
                },
            ])

            if (insertErr) {
                // Handle specific database errors
                if (insertErr.code === '23505') { // Unique constraint violation
                    if (insertErr.message.includes('unique_mobile_number')) {
                        setError('This mobile number has already been used for an order. Please use a different mobile number.')
                    } else if (insertErr.message.includes('unique_upi_id')) {
                        setError('This UPI ID has already been used for an order. Please use a different UPI ID.')
                    } else {
                        setError('This information has already been used for an order. Please use different details.')
                    }
                } else if (insertErr.code === 'PGRST301') {
                    setError('Database connection error. Please try again in a few moments.')
                    setNetworkError(true)
                } else {
                    setError('Failed to submit. Please try again.')
                }
                setIsLoading(false)
                setIsSubmitting(false)
                return
            }

            // Clear form and localStorage on success
            resetForm()
            setSubmissionSuccess(true)

        } catch {
            setNetworkError(true)
            setError('An unexpected error occurred. Please check your connection and try again. If the problem persists, contact support.')
        } finally {
            setIsLoading(false)
            setIsSubmitting(false)
        }
    }, [validateAllFields, validateUPIUnique, screenshot, userName, phone, upiId, hasClickedRedirect, agreed, resetForm])

    // Keep compatibility with any earlier prefill
    useEffect(() => {
        const stored = localStorage.getItem('userMobileNumber')
        if (stored) {
            setPhone(stored)
            localStorage.removeItem('userMobileNumber')
        }
    }, [])

    const renderForm = () => (
        <div className="w-full max-w-4xl mx-auto mb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Details Section */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">Personal Details</h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <input
                                type="text"
                                required
                                value={userName}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Full Name"
                                className={`w-full bg-white/10 border rounded-xl px-4 py-4 text-white placeholder:text-white/60 focus:outline-none text-base transition-all duration-200 ${validationErrors.userName
                                    ? 'border-red-400 focus:border-red-300 bg-red-500/10'
                                    : 'border-white/30 focus:border-green-400 focus:bg-white/15'
                                    }`}
                            />
                            {validationErrors.userName && (
                                <p className="text-red-400 text-sm px-2">{validationErrors.userName}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <input
                                type="tel"
                                required
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                placeholder="Mobile Number"
                                maxLength={10}
                                inputMode="numeric"
                                className={`w-full bg-white/10 border rounded-xl px-4 py-4 text-white placeholder:text-white/60 focus:outline-none text-base transition-all duration-200 ${validationErrors.phone
                                    ? 'border-red-400 focus:border-red-300 bg-red-500/10'
                                    : 'border-white/30 focus:border-green-400 focus:bg-white/15'
                                    }`}
                            />
                            {validationErrors.phone && (
                                <p className="text-red-400 text-sm px-2">{validationErrors.phone}</p>
                            )}
                        </div>

                        <div className="space-y-2 lg:col-span-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={upiId}
                                    onChange={(e) => handleUpiChange(e.target.value)}
                                    placeholder="UPI ID (e.g., name@bank)"
                                    className={`w-full bg-white/10 border rounded-xl px-4 py-4 pr-12 text-white placeholder:text-white/60 focus:outline-none text-base transition-all duration-200 ${validationErrors.upiId
                                        ? 'border-red-400 focus:border-red-300 bg-red-500/10'
                                        : 'border-white/30 focus:border-green-400 focus:bg-white/15'
                                        }`}
                                />
                                {isValidatingUPI && (
                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                        <div className="w-5 h-5 animate-spin rounded-full border-2 border-white/30 border-t-green-400"></div>
                                    </div>
                                )}
                            </div>
                            {validationErrors.upiId && (
                                <p className="text-red-400 text-sm px-2">{validationErrors.upiId}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Redirect to App Button */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        disabled={!canRedirectToApp()}
                        className={`flex items-center justify-center gap-3 rounded-xl px-8 py-4 text-base font-semibold transition-all duration-200 min-w-[200px] ${canRedirectToApp()
                            ? 'bg-gradient-to-r from-green-400 to-green-500 text-black hover:from-green-300 hover:to-green-400 shadow-lg hover:shadow-green-500/25 transform hover:scale-105'
                            : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            }`}
                        onClick={() => {
                            setHasClickedRedirect(true)
                            window.open('https://pdg.gotrackier.com/click?campaign_id=797&pub_id=1338&source=community', '_blank')
                        }}
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M12 2l2.1 4.7L19 8.9l-4.2 2L13 16l-1-5.1L7 8.9l4.9-2.2L12 2z" />
                        </svg>
                        <span>{hasClickedRedirect ? 'Redirected ✓' : 'Redirect to App'}</span>
                    </button>
                </div>

                {/* Screenshot Upload Section */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
                    <h3 className="text-xl font-semibold text-white mb-6 text-center">Upload Screenshot</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Upload a clear screenshot of your Swiggy order</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Make sure order details are clearly visible</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>File size limit removed for better quality</span>
                            </div>
                            <div className="flex items-center gap-2 text-white/80 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span>Supported formats: JPG, PNG, GIF, WebP</span>
                            </div>
                        </div>
                    </div>

                    {!hasClickedRedirect && (
                        <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-xl p-4 mb-6">
                            <div className="flex items-center gap-3">
                                <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-yellow-400 font-medium">Please click "Redirect to App" first to unlock screenshot upload</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${!hasClickedRedirect
                            ? 'border-gray-500 bg-gray-900/20 cursor-not-allowed opacity-50'
                            : validationErrors.screenshot
                                ? 'border-red-400 bg-red-500/10'
                                : 'border-white/30 hover:border-green-400 hover:bg-white/5'
                            }`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotUpload}
                                className="hidden"
                                id="screenshot-upload"
                                disabled={!hasClickedRedirect}
                            />
                            <label
                                htmlFor="screenshot-upload"
                                className={`block ${!hasClickedRedirect ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {!hasClickedRedirect ? (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-gray-600 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-base font-medium">Screenshot upload locked</p>
                                            <p className="text-gray-500 text-sm">Click "Redirect to App" first</p>
                                        </div>
                                    </div>
                                ) : screenshotPreview ? (
                                    <div className="space-y-4">
                                        <img
                                            src={screenshotPreview}
                                            alt="Screenshot preview"
                                            className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                                        />
                                        <p className="text-white/80 text-sm">Click to change screenshot</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-white/90 text-base font-medium">Click to upload screenshot</p>
                                            <p className="text-white/60 text-sm">Drag and drop or click to browse</p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>
                        {validationErrors.screenshot && (
                            <p className="text-red-400 text-sm px-2">{validationErrors.screenshot}</p>
                        )}
                    </div>
                </div>

                {/* Terms and Conditions */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-white/10">
                    <div className="flex items-start gap-4 text-left">
                        <input
                            id="agree"
                            type="checkbox"
                            checked={agreed}
                            onChange={(e) => setAgreed(e.target.checked)}
                            className="mt-1 h-5 w-5 rounded border-white/30 bg-white/10 text-green-400 focus:ring-green-400 focus:ring-2"
                        />
                        <label htmlFor="agree" className="text-sm text-white/80 leading-relaxed">
                            I agree to the Terms & Conditions and understand that cashback will be processed after verification.
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col items-center gap-4 mt-8">
                        <button
                            type="submit"
                            disabled={!canSubmit() || isLoading || isSubmitting}
                            className={`flex items-center justify-center gap-3 rounded-xl px-12 py-4 text-base font-semibold transition-all duration-200 min-w-[250px] ${canSubmit() && !isSubmitting
                                ? 'bg-gradient-to-r from-green-400 to-green-500 text-black hover:from-green-300 hover:to-green-400 shadow-lg hover:shadow-green-500/25 transform hover:scale-105'
                                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            {isLoading || isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                    <span>{isSubmitting ? 'Submitting...' : 'Processing...'}</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M12 2l2.1 4.7L19 8.9l-4.2 2L13 16l-1-5.1L7 8.9l4.9-2.2L12 2z" />
                                    </svg>
                                    <span>Submit Order Details</span>
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => window.open('/terms', '_blank')}
                            className="text-white/70 hover:text-white text-sm underline transition-colors"
                        >
                            View Terms & Conditions
                        </button>
                    </div>
                </div>
            </form>
        </div>
    )

    const renderMainForm = () => (
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 sm:mb-12">
                {/* Header with reset button */}
                <div className="relative mb-8">
                    <button
                        type="button"
                        onClick={resetForm}
                        className="absolute top-0 right-0 text-red-400 hover:text-red-300 text-sm underline px-3 py-2 rounded-lg hover:bg-red-900/20 transition-colors z-10"
                        disabled={isLoading || isSubmitting}
                    >
                        Reset Form
                    </button>

                    {/* Centered titles */}
                    <div className="text-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-3" style={{ color: '#34D399' }}>
                            Toing By Swiggy
                        </h1>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-6" style={{ color: '#34D399' }}>
                            Submit your order details
                        </h2>
                    </div>
                </div>

                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto text-center leading-relaxed">
                    Fill in your details and upload a screenshot of your Swiggy order to get started.
                </p>
            </div>

            {renderForm()}

            {error && (
                <div className={`max-w-4xl mx-auto mb-8 ${networkError
                    ? 'bg-red-500/10 border border-red-400/30 text-red-300'
                    : 'bg-red-500/10 border border-red-400/30 text-red-400'
                    }`}>
                    <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30">
                        <div className="flex items-start gap-3">
                            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="font-medium">{error}</p>
                                {networkError && (
                                    <p className="text-sm mt-2 opacity-80">
                                        Please check your internet connection and try again. If the problem persists, contact support.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {submissionSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg mx-auto">
                        <div className="bg-gray-900/95 backdrop-blur-md rounded-2xl border border-green-400/30 p-8 shadow-2xl">
                            <div className="flex flex-col items-center gap-6 text-center">
                                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                    </svg>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-3xl font-bold text-green-400">Congratulations!</h3>
                                    <p className="text-lg text-green-300">Your submission has been recorded successfully</p>
                                </div>

                                <div className="bg-white/5 rounded-xl p-4 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-white/80">
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">🎉</span>
                                            <span>Thank you for participating!</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">📋</span>
                                            <span>Details submitted for verification</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">⏰</span>
                                            <span>Cashback in 15-20 working days</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-green-400">📱</span>
                                            <span>SMS updates on your mobile</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => window.open('/terms', '_blank')}
                                        className="px-6 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-xl text-green-300 text-sm transition-colors font-medium"
                                    >
                                        View Terms & Conditions
                                    </button>
                                    <button
                                        onClick={() => window.open('https://chat.whatsapp.com/LOcskbkvq5PCaZNHoJAoex', '_blank')}
                                        className="px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-xl text-blue-300 text-sm transition-colors font-medium"
                                    >
                                        Contact Support
                                    </button>
                                    <button
                                        onClick={() => setSubmissionSuccess(false)}
                                        className="px-6 py-3 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-xl text-gray-300 text-sm transition-colors font-medium"
                                    >
                                        Close
                                    </button>
                                </div>

                                <div className="text-xs text-white/60">
                                    <p>Keep your mobile number handy for cashback updates</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white bg-black">
            {/* Optimized background */}
            <div className="absolute inset-0 -z-10">
                <img
                    src={bgSvg}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                />
            </div>

            {/* Mobile-first header */}
            <header className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <img
                        src={logo}
                        alt="CashVertz"
                        className="h-12 w-auto sm:h-16 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        loading="eager"
                        onClick={() => navigate('/')}
                    />
                    <nav className="hidden sm:flex items-center gap-6 text-sm font-medium text-white/80">
                        <a className="hover:text-white transition-colors" href="#about">About Us</a>
                        <div className="flex items-center gap-4">
                            <a aria-label="Instagram" className="hover:text-white transition-colors" href="https://www.instagram.com/cashvertz">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm6.25-.75a1 1 0 1 1-1-1 1 1 0 0 1 1 1Z" />
                                </svg>
                            </a>
                            <a aria-label="WhatsApp" className="hover:text-white transition-colors" href="https://chat.whatsapp.com/LOcskbkvq5PCaZNHoJAoex" target="_blank" rel="noopener noreferrer">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                                </svg>
                            </a>
                            <a aria-label="LinkedIn" className="hover:text-white transition-colors" href="https://www.linkedin.com/company/cashvertz/">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20.45 20.45h-3.55v-5.55c0-1.33-.02-3.05-1.86-3.05-1.87 0-2.16 1.45-2.16 2.95v5.65H9.32V9h3.41v1.56h.05c.48-.9 1.66-1.86 3.42-1.86 3.66 0 4.34 2.41 4.34 5.55v6.2ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM3.56 20.45h3.55V9H3.56v11.45Z" />
                                </svg>
                            </a>
                        </div>
                    </nav>
                </div>
            </header>

            {/* Main content */}
            <main className="px-4 py-8 sm:px-6 sm:py-16">
                {renderMainForm()}
            </main>

            <style>{`
        /* Mobile-first glassmorphism */
        
        /* Hide number input spinners */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
        
        /* Feature cards */
        .feature-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        }
        
        /* Zone cards */
        .zone-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            transition: all 0.3s ease;
        }
        
        .zone-card:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
        }
        
        /* Address card styling */
        .address-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        /* Outlet card styling */
        .outlet-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        /* Item button styling */
        .item-button {
            transition: all 0.3s ease;
        }
        
        .item-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        /* Proceed button styling */
        .proceed-button {
            transition: all 0.3s ease;
        }
        
        .proceed-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(102, 255, 178, 0.3);
        }
        
        /* Upload area styling */
        .upload-area {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            transition: all 0.3s ease;
        }
        
        .upload-area:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateY(-2px);
        }
        
        /* Upload button styling */
        .upload-button {
            transition: all 0.3s ease;
        }
        
        .upload-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 32px rgba(102, 255, 178, 0.3);
        }
        
        /* Info card styling */
        .info-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        /* Completion card styling */
        .completion-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        /* Performance optimizations */
        @media (prefers-reduced-motion: reduce) {
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* High contrast mode support */
        @media (prefers-contrast: high) {
            .mobile-form,
            .feature-card,
            .address-card,
            .outlet-card,
            .upload-area,
            .completion-card {
                border-color: rgba(255, 255, 255, 0.3);
            }
        }
      `}</style>
        </div>
    )
}

export default EventsPage