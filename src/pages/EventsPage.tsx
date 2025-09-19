import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'
import { supabase, Zone, Outlet, UserSelection } from '../lib/supabase'

type Step = 'mobile' | 'zones' | 'outlets' | 'upload' | 'completion'

const EventsPage = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('mobile')
    const [mobileNumber, setMobileNumber] = useState('')
    const [userName, setUserName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)

    // Zone-based state
    const [zones, setZones] = useState<Zone[]>([])
    const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
    const [assignedOutlet, setAssignedOutlet] = useState<Outlet | null>(null)
    const [loading, setLoading] = useState(true)
    const [userSelection, setUserSelection] = useState<UserSelection | null>(null)
    const [loadingSelection, setLoadingSelection] = useState(true)

    // Load zones from Supabase and restore session
    useEffect(() => {
        const initializeApp = async () => {
            try {
                setLoading(true)

                // Load zones from Supabase
                const { data, error } = await supabase
                    .from('zones')
                    .select('*')
                    .eq('is_active', true)
                    .order('id')

                if (error) {
                    throw error
                }
                setZones(data || [])

                // Restore session from localStorage
                const savedMobile = localStorage.getItem('mobileNumber')
                const savedUserName = localStorage.getItem('userName')
                const savedStep = localStorage.getItem('currentStep')
                const savedZone = localStorage.getItem('selectedZone')
                const savedOutlet = localStorage.getItem('assignedOutlet')

                if (savedMobile) {
                    setMobileNumber(savedMobile)
                    if (savedUserName) {
                        setUserName(savedUserName)
                    }

                    if (savedStep && savedStep !== 'mobile') {
                        setStep(savedStep as Step)

                        if (savedZone) {
                            const zoneData = JSON.parse(savedZone)
                            setSelectedZone(zoneData)
                        }

                        if (savedOutlet) {
                            const outletData = JSON.parse(savedOutlet)
                            setAssignedOutlet(outletData)
                        }
                    }
                }
            } catch (error) {
                console.error('Error initializing app:', error)
                setError('Failed to load data. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        initializeApp()
    }, [])

    // Load user selection from localStorage
    useEffect(() => {
        if (step === 'upload') {
            const savedSelection = localStorage.getItem('userSelection')
            if (savedSelection) {
                try {
                    const selectionData = JSON.parse(savedSelection)
                    setUserSelection(selectionData)
                } catch (error) {
                    console.error('Error parsing saved selection:', error)
                }
            }
            setLoadingSelection(false)
        }
    }, [step])


    const validateMobileNumber = useCallback((number: string): boolean => {
        return /^\d{10}$/.test(number.replace(/\D/g, ''))
    }, [])

    const handleMobileSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            if (!validateMobileNumber(mobileNumber)) {
                setError('Please enter a valid 10-digit mobile number')
                return
            }

            // Save to localStorage
            localStorage.setItem('mobileNumber', mobileNumber)
            localStorage.setItem('userName', userName)
            localStorage.setItem('currentStep', 'zones')

            // Proceed to zone selection
            setStep('zones')
        } catch (error) {
            console.error('Error:', error)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [mobileNumber, userName, validateMobileNumber])

    // Check if user came from landing page with mobile number
    useEffect(() => {
        const storedMobileNumber = localStorage.getItem('userMobileNumber')
        if (storedMobileNumber) {
            setMobileNumber(storedMobileNumber)
            setStep('zones')
            localStorage.removeItem('userMobileNumber')
        }
    }, [])

    // Handle zone selection and random outlet assignment
    const handleZoneSelect = async (zone: Zone) => {
        try {
            setIsLoading(true)
            setError('')

            // Get outlets for the selected zone from Supabase
            const { data: outlets, error: outletsError } = await supabase
                .from('outlets')
                .select('*')
                .eq('zone_id', zone.id)
                .eq('is_active', true)

            if (outletsError) {
                throw outletsError
            }

            if (!outlets || outlets.length === 0) {
                setError('No outlets available in this zone. Please try another zone.')
                return
            }

            // Randomly assign an outlet for load balancing
            const randomIndex = Math.floor(Math.random() * outlets.length)
            const assignedOutlet = outlets[randomIndex]

            // Save to localStorage
            localStorage.setItem('selectedZone', JSON.stringify(zone))
            localStorage.setItem('assignedOutlet', JSON.stringify(assignedOutlet))
            localStorage.setItem('currentStep', 'outlets')

            setSelectedZone(zone)
            setAssignedOutlet(assignedOutlet)
            setStep('outlets')
        } catch (error) {
            console.error('Error selecting zone:', error)
            setError('Failed to load outlets. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleProceedToUpload = async () => {
        if (!assignedOutlet || !selectedZone) {
            alert('Please select a zone first')
            return
        }

        try {
            // Save user selection to Supabase
            const { data, error } = await supabase
                .from('user_selections')
                .insert({
                    mobile_number: mobileNumber,
                    user_name: userName,
                    zone_id: selectedZone.id,
                    outlet_id: assignedOutlet.id,
                    status: 'pending_screenshot'
                })
                .select()
                .single()

            if (error) {
                throw error
            }

            // Save to localStorage
            localStorage.setItem('currentStep', 'upload')
            localStorage.setItem('userSelection', JSON.stringify(data))

            setUserSelection(data)
            setStep('upload')
        } catch (error) {
            console.error('Error saving selection:', error)
            alert('Something went wrong. Please try again.')
        }
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            // Accept various image formats
            const allowedTypes = [
                'image/jpeg',
                'image/jpg',
                'image/png',
                'image/gif',
                'image/webp',
                'image/heic',
                'image/heif',
                'image/bmp',
                'image/tiff',
                'image/svg+xml'
            ]

            if (!allowedTypes.includes(file.type.toLowerCase())) {
                setError('Please select a valid image file (JPG, PNG, GIF, WebP, HEIC, HEIF, BMP, TIFF, SVG)')
                return
            }

            if (file.size > 10 * 1024 * 1024) { // Increased to 10MB
                setError('File size must be less than 10MB')
                return
            }

            setSelectedFile(file)
            setError('')
        }
    }

    const handleUpload = async () => {
        if (!selectedFile) {
            setError('Please select a file to upload')
            return
        }

        setIsUploading(true)
        setError('')

        try {
            // Upload file to Supabase storage
            const fileExt = selectedFile.name.split('.').pop()
            const fileName = `${mobileNumber}_${Date.now()}.${fileExt}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('screenshots')
                .upload(fileName, selectedFile)

            if (uploadError) {
                throw uploadError
            }

            // Update user selection with screenshot URL and mark as completed
            const { error: updateError } = await supabase
                .from('user_selections')
                .update({
                    screenshot_url: uploadData.path,
                    status: 'screenshot_uploaded',
                    updated_at: new Date().toISOString()
                })
                .eq('mobile_number', mobileNumber)

            if (updateError) {
                throw updateError
            }

            // Save completion to localStorage
            localStorage.setItem('currentStep', 'completion')
            localStorage.setItem('uploadCompleted', 'true')

            setStep('completion')
        } catch (error) {
            console.error('Upload error:', error)
            setError('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    // Function to clear all data (for debugging)
    const clearAllData = () => {
        localStorage.clear()
        // Reset all state without page reload
        setMobileNumber('')
        setUserName('')
        setSelectedFile(null)
        setUserSelection(null)
        setSelectedZone(null)
        setAssignedOutlet(null)
        setError('')
        setStep('mobile')
    }

    // No timeout cleanup necessary; DB handles expiry via scheduled function

    // Function to clear session data and allow user to change choice
    const clearSessionAndRestart = async () => {
        try {
            // Clear Supabase data
            if (mobileNumber) {
                await supabase
                    .from('user_selections')
                    .delete()
                    .eq('mobile_number', mobileNumber)
            }

            // Clear localStorage
            localStorage.removeItem('selectedZone')
            localStorage.removeItem('assignedOutlet')
            localStorage.removeItem('userSelection')
            localStorage.setItem('currentStep', 'zones')

            // Reset state
            setSelectedFile(null)
            setUserSelection(null)
            setSelectedZone(null)
            setAssignedOutlet(null)
            setStep('zones')
        } catch (error) {
            console.error('Error clearing session:', error)
            setError('Something went wrong. Please try again.')
        }
    }

    const renderMobileStep = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-4" style={{ color: '#66FFB2' }}>
                    Special Event Offer
                </h1>
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl mb-6" style={{ color: '#66FFB2' }}>
                    Limited Time Only
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Enter your mobile number to participate in our exclusive event and unlock special rewards.
                </p>
            </div>

            <div className="max-w-md mx-auto mb-6">
                <form onSubmit={handleMobileSubmit} className="space-y-4">
                    <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm sm:text-base transition-colors"
                    />
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                        <input
                            type="tel"
                            required
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="Enter your mobile number"
                            className="flex-1 bg-transparent border border-white/20 rounded-full px-4 py-3 sm:py-0 sm:h-12 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm sm:text-base transition-colors"
                            maxLength={10}
                            inputMode="numeric"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 rounded-full px-6 py-3 sm:py-0 sm:h-12 text-sm font-semibold text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:px-8 min-w-[120px]"
                            style={{ backgroundColor: '#66FFB2' }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                    <span className="hidden sm:inline">Processing...</span>
                                    <span className="sm:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                                    </svg>
                                    <span className="hidden sm:inline">Participate</span>
                                    <span className="sm:hidden">Join</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="text-sm text-red-400 mb-6">{error}</div>
            )}

            <div className="grid grid-cols-3 gap-3 sm:grid-cols-3 sm:gap-6 mt-8 sm:mt-12">
                <div className="feature-card p-3 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-2 sm:mb-2">Event Rewards</h3>
                    <p className="text-xs sm:text-base text-white/80 hidden sm:block">Special gifts and rewards for event participants</p>
                </div>

                <div className="feature-card p-3 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-2 sm:mb-2">Exclusive Access</h3>
                    <p className="text-xs sm:text-base text-white/80 hidden sm:block">Get access to special offers and discounts</p>
                </div>

                <div className="feature-card p-3 sm:p-6 text-center">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                    </div>
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-2 sm:mb-2">Event Participation</h3>
                    <p className="text-xs sm:text-base text-white/80 hidden sm:block">Join our exclusive event and win prizes</p>
                </div>
            </div>
        </div>
    )

    const renderZonesStep = () => {
        if (loading) {
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">Loading zones...</p>
                </div>
            )
        }

        if (zones.length === 0) {
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-white/80">No zones available. Please try again later.</p>
                </div>
            )
        }

        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-center mb-8" style={{ color: '#66FFB2' }}>
                    Select Your Zone
                </h1>

                <p className="text-lg text-white/90 text-center mb-8 max-w-2xl mx-auto">
                    Choose your preferred metro station zone. We'll randomly assign you an outlet in front of that metro station for load balancing.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {zones.map((zone) => (
                        <button
                            key={zone.id}
                            onClick={() => handleZoneSelect(zone)}
                            disabled={isLoading}
                            className="zone-card p-6 rounded-lg text-left transition-all duration-200 bg-white/10 text-white/90 border border-white/20 hover:bg-white/20 hover:border-white/40 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-semibold text-white">{zone.name}</h3>
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-white/80 text-sm">{zone.description}</p>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="mt-6 text-center text-sm text-red-400">{error}</div>
                )}
            </div>
        )
    }

    const renderOutletsStep = () => {
        if (!assignedOutlet || !selectedZone) {
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-white/80">No outlet assigned. Please go back and select a zone.</p>
                </div>
            )
        }

        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-center mb-8" style={{ color: '#66FFB2' }}>
                    Your Assigned Outlet
                </h1>

                <div className="max-w-2xl mx-auto">
                    <div className="address-card rounded-lg p-6 mb-8">
                        <h2 className="text-xl font-semibold text-white mb-4">📍 Your Assigned Outlet</h2>
                        <p className="text-white/90 text-lg font-medium">{assignedOutlet.name}</p>
                        <p className="text-white/80 text-sm mt-2">{assignedOutlet.address_line_1}</p>
                        <p className="text-white/80 text-sm">{assignedOutlet.main_street}</p>
                        <p className="text-white/60 text-sm mt-2">
                            Zone: {selectedZone.name}
                        </p>
                        <div className="mt-4 p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                            <p className="text-green-300 text-sm font-medium">📞 Receiver Number:</p>
                            <p className="text-green-200 text-lg font-bold">
                                {selectedZone.name.includes('Swargate') ? '8007881670' : '9021882796'}
                            </p>
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-4" style={{ color: '#66FFB2' }}>
                            Next Steps
                        </h2>
                        <p className="text-white/80 text-lg mb-6">
                            Visit your assigned outlet in front of the metro station and place an order (max ₹100). Then upload a screenshot of your order to complete the process.
                        </p>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={handleProceedToUpload}
                            className="proceed-button px-8 py-4 rounded-full text-lg font-semibold text-black hover:opacity-90 transition-all duration-200"
                            style={{ backgroundColor: '#66FFB2' }}
                        >
                            Proceed to Upload Screenshot
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderUploadStep = () => {
        return (
            <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-6" style={{ color: '#66FFB2' }}>
                    Upload Your Screenshot
                </h1>

                <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
                    Welcome back! Please upload a screenshot to complete your task and claim your surprise gift.
                </p>

                {/* Debug button to clear data */}
                <div className="mb-4">
                    <button
                        onClick={clearAllData}
                        className="text-xs text-red-400 hover:text-red-300 underline"
                    >
                        Clear All Data & Restart
                    </button>
                </div>

                {loadingSelection ? (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="info-card rounded-lg p-6 mb-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-white/20 rounded w-1/2 mb-2"></div>
                                <div className="h-3 bg-white/10 rounded w-3/4"></div>
                            </div>
                        </div>
                    </div>
                ) : userSelection && (
                    <div className="max-w-2xl mx-auto mb-8">
                        <div className="info-card rounded-lg p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold text-white">Your Assignment</h2>
                                <button
                                    onClick={clearSessionAndRestart}
                                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                                >
                                    Change Choice
                                </button>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">📍 Zone:</p>
                                <p className="text-white/90">{selectedZone?.name || 'Zone not found'}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">🏪 Outlet:</p>
                                <p className="text-white/90">{assignedOutlet?.name || 'Outlet not found'}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">📍 Address:</p>
                                <p className="text-white/90">{assignedOutlet?.address_line_1 || '—'}</p>
                                <p className="text-white/90">{assignedOutlet?.main_street || '—'}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">💰 Max Order Amount:</p>
                                <p className="text-white/90">₹100 (Test Mode)</p>
                            </div>
                            <div className="p-3 bg-green-500/20 border border-green-400/30 rounded-lg">
                                <p className="text-green-300 text-sm font-medium">📞 Receiver Number:</p>
                                <p className="text-green-200 text-lg font-bold">
                                    {selectedZone?.name?.includes('Swargate') ? '8007881670' : '9021882796'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="max-w-md mx-auto">
                    <div
                        className="upload-area rounded-lg p-8 border-2 border-dashed border-white/30 hover:border-white/50 transition-all duration-300 cursor-pointer"
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input
                            id="file-input"
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,image/bmp,image/tiff,image/svg+xml"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <div className="text-center">
                            {selectedFile ? (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">{selectedFile.name}</p>
                                        <p className="text-white/60 text-sm">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                                        <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-white font-medium">Click to upload or drag and drop</p>
                                        <p className="text-white/60 text-sm">JPG, PNG, GIF, WebP, HEIC, HEIF, BMP, TIFF, SVG up to 10MB</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 text-sm text-red-400">{error}</div>
                    )}

                    <div className="mt-8">
                        <button
                            onClick={handleUpload}
                            disabled={!selectedFile || isUploading}
                            className="upload-button px-8 py-4 rounded-full text-lg font-semibold text-black hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#66FFB2' }}
                        >
                            {isUploading ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                    <span>Uploading...</span>
                                </div>
                            ) : (
                                'Upload Screenshot'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderCompletionStep = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-8 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6" style={{ color: '#66FFB2' }}>
                Congratulations!
            </h1>

            <div className="completion-card rounded-lg p-8 mb-8 max-w-2xl mx-auto">
                <p className="text-xl font-medium text-white/90 leading-relaxed">
                    Your task is completed! You can now claim your surprise gift from the team.
                </p>
            </div>

            <div className="space-y-4 mb-8">
                <p className="text-white/80 text-lg">
                    Thank you for participating in our program!
                </p>
            </div>

            {/* Had some trouble section */}
            <div className="max-w-2xl mx-auto">
                <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-yellow-300 mb-3">Had some trouble while completing the order?</h3>
                    <p className="text-yellow-200/80 text-sm mb-4">
                        Don't worry! If you faced any issues with your order, you can start over and try again.
                    </p>
                    <div className="flex justify-center">
                        <button
                            onClick={clearAllData}
                            className="px-6 py-2 bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 rounded-lg hover:bg-yellow-500/30 transition-colors text-sm font-medium"
                        >
                            Start Over
                        </button>
                    </div>
                </div>
            </div>
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
                {step === 'mobile' && renderMobileStep()}
                {step === 'zones' && renderZonesStep()}
                {step === 'outlets' && renderOutletsStep()}
                {step === 'upload' && renderUploadStep()}
                {step === 'completion' && renderCompletionStep()}
            </main>

            <style>{`
        /* Mobile-first glassmorphism */
        
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
