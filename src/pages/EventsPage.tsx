import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { SupabaseService, LocationWithItems } from '../service/supabaseService'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'

type Step = 'mobile' | 'outlets' | 'upload' | 'completion'

const EventsPage = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState<Step>('mobile')
    const [mobileNumber, setMobileNumber] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [selectedItem, setSelectedItem] = useState('')
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [locations, setLocations] = useState<LocationWithItems[]>([])
    const [loading, setLoading] = useState(true)
    const [userSelection, setUserSelection] = useState<{
        location_name?: string;
        outlet_name?: string;
        item_name?: string;
    } | null>(null)
    const [loadingSelection, setLoadingSelection] = useState(true)

    const { setMobileNumber: setContextMobileNumber, setIsReturningUser } = useAppContext()

    const [selectedAddress, setSelectedAddress] = useState('')
    const [currentLocationIndex, setCurrentLocationIndex] = useState(0)

    // Load locations data from Supabase
    useEffect(() => {
        const loadLocations = async () => {
            try {
                setLoading(true)
                const locationsData = await SupabaseService.getLocationsWithItems()
                setLocations(locationsData)
            } catch (error) {
                console.error('Error loading locations:', error)
                setError('Failed to load locations. Please try again.')
            } finally {
                setLoading(false)
            }
        }

        loadLocations()
    }, [])

    // Load user selection when mobile number changes and we're on upload step
    useEffect(() => {
        const loadUserSelection = async () => {
            if (mobileNumber && step === 'upload') {
                try {
                    setLoadingSelection(true)
                    const selection = await SupabaseService.getUserSelection(mobileNumber)
                    setUserSelection(selection)
                } catch (error) {
                    console.error('Error loading user selection:', error)
                } finally {
                    setLoadingSelection(false)
                }
            }
        }

        loadUserSelection()
    }, [mobileNumber, step])

    // Clear old placeholder data on component mount
    useEffect(() => {
        const storedAddress = localStorage.getItem('selectedAddress')
        const storedItem = localStorage.getItem('selectedItem')

        // Clear old placeholder data
        if (storedAddress && (storedAddress.includes('Park Avenue') || storedAddress.includes('Main Street') || storedAddress.includes('Beach Road') || storedAddress.includes('Garden Street'))) {
            localStorage.removeItem('selectedAddress')
        }

        if (storedItem && (storedItem.includes('Jeans') || storedItem.includes('Pizza') || storedItem.includes('Phone') || storedItem.includes('Novel'))) {
            localStorage.removeItem('selectedItem')
        }
    }, [])

    useEffect(() => {
        // Randomly assign an address when outlets step loads
        if (step === 'outlets' && !selectedAddress && locations.length > 0) {
            const randomIndex = Math.floor(Math.random() * locations.length)
            setCurrentLocationIndex(randomIndex)
            setSelectedAddress(locations[randomIndex].name)
        }
    }, [step, selectedAddress, locations])

    // Update selected address when location index changes
    useEffect(() => {
        if (step === 'outlets' && locations.length > 0) {
            setSelectedAddress(locations[currentLocationIndex].name)
            setSelectedItem('') // Clear selected item when switching locations
        }
    }, [currentLocationIndex, step, locations])

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

            // Check if user has already completed an order
            const hasCompleted = await SupabaseService.hasCompletedOrder(mobileNumber)
            if (hasCompleted) {
                setError('This mobile number has already completed an order. Each number can only participate once.')
                return
            }

            // Check if user is returning using Supabase
            const isReturning = await SupabaseService.isReturningUser(mobileNumber)

            if (isReturning) {
                setIsReturningUser(true)
                setContextMobileNumber(mobileNumber)
                // For returning users, check if they already completed the outlet selection
                const userSelection = await SupabaseService.getUserSelection(mobileNumber)
                if (userSelection) {
                    setStep('upload')
                } else {
                    setStep('outlets')
                }
            } else {
                setIsReturningUser(false)
                setContextMobileNumber(mobileNumber)
                setStep('outlets')
            }
        } catch (error) {
            console.error('Error:', error)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [mobileNumber, validateMobileNumber, setIsReturningUser, setContextMobileNumber])

    // Check if user came from landing page with mobile number
    useEffect(() => {
        const storedMobileNumber = localStorage.getItem('userMobileNumber')
        if (storedMobileNumber) {
            setMobileNumber(storedMobileNumber)
            setContextMobileNumber(storedMobileNumber)

            // Check if this is a returning user using Supabase
            const checkReturningUser = async () => {
                try {
                    // Check if user has already completed an order
                    const hasCompleted = await SupabaseService.hasCompletedOrder(storedMobileNumber)
                    if (hasCompleted) {
                        setError('This mobile number has already completed an order. Each number can only participate once.')
                        return
                    }

                    const isReturning = await SupabaseService.isReturningUser(storedMobileNumber)

                    if (isReturning) {
                        setIsReturningUser(true)
                        // For returning users, check if they already completed the outlet selection
                        const userSelection = await SupabaseService.getUserSelection(storedMobileNumber)
                        if (userSelection) {
                            setStep('upload')
                        } else {
                            setStep('outlets')
                        }
                    } else {
                        setIsReturningUser(false)
                        setStep('outlets')
                    }
                } catch (error) {
                    console.error('Error checking returning user:', error)
                    // Fallback to outlets step
                    setIsReturningUser(false)
                    setStep('outlets')
                }
            }

            checkReturningUser()

            // Clear the stored mobile number
            localStorage.removeItem('userMobileNumber')
        }
    }, [setContextMobileNumber, setIsReturningUser])

    const handleItemSelect = (item: { id: number; name: string; available_quantity: number; outlet: string }) => {
        if (item.available_quantity > 0) {
            setSelectedItem(`${item.name} (${item.outlet})`)
        }
    }

    const toggleLocation = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentLocationIndex(prev => prev === 0 ? locations.length - 1 : prev - 1)
        } else {
            setCurrentLocationIndex(prev => prev === locations.length - 1 ? 0 : prev + 1)
        }
    }

    const handleProceedToUpload = async () => {
        if (!selectedItem) {
            alert('Please select an item to proceed')
            return
        }

        try {
            // Find the selected item details
            const currentLocation = locations[currentLocationIndex]
            let selectedItemDetails = null
            let selectedOutlet = null

            for (const outlet of currentLocation.outlets) {
                const item = outlet.items.find(item => `${item.name} (${outlet.name})` === selectedItem)
                if (item) {
                    selectedItemDetails = item
                    selectedOutlet = outlet
                    break
                }
            }

            if (selectedItemDetails && selectedOutlet) {
                // Save user selection to Supabase
                const success = await SupabaseService.saveUserSelection(
                    mobileNumber,
                    currentLocation.id,
                    selectedOutlet.id,
                    selectedItemDetails.id
                )

                if (success) {
                    // Update item quantity in Supabase
                    await SupabaseService.updateItemQuantity(
                        selectedItemDetails.id,
                        selectedItemDetails.available_quantity - 1
                    )

                    // Store locally for display
                    localStorage.setItem('selectedItem', selectedItem)
                    localStorage.setItem('selectedAddress', selectedAddress)

                    // Go directly to upload step
                    setStep('upload')
                } else {
                    alert('Failed to save selection. Please try again.')
                }
            }
        } catch (error) {
            console.error('Error proceeding to upload:', error)
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
            // Upload screenshot to Supabase Storage
            const uploadSuccess = await SupabaseService.uploadScreenshot(selectedFile, mobileNumber)

            if (uploadSuccess) {
                // Mark user selection as completed in Supabase
                await SupabaseService.markSelectionCompleted(mobileNumber)
                setStep('completion')
            } else {
                setError('Upload failed. Please try again.')
            }
        } catch (error) {
            console.error('Upload error:', error)
            setError('Upload failed. Please try again.')
        } finally {
            setIsUploading(false)
        }
    }

    // Function to clear all data (for debugging)
    const clearAllData = () => {
        localStorage.removeItem('selectedAddress')
        localStorage.removeItem('selectedItem')
        localStorage.removeItem('registeredUsers')
        localStorage.removeItem('userMobileNumber')
        window.location.reload()
    }

    // Function to clear session data and allow user to change choice
    const clearSessionAndRestart = async () => {
        try {
            setIsLoading(true)
            setError('')

            // Clear incomplete session from database
            const success = await SupabaseService.clearIncompleteSession(mobileNumber)

            if (success) {
                // Clear local storage
                localStorage.removeItem('selectedAddress')
                localStorage.removeItem('selectedItem')

                // Reset state
                setSelectedItem('')
                setSelectedFile(null)
                setUserSelection(null)
                setCurrentLocationIndex(0)

                // Go back to outlets step
                setStep('outlets')
            } else {
                setError('Failed to clear session. Please try again.')
            }
        } catch (error) {
            console.error('Error clearing session:', error)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
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
                <form onSubmit={handleMobileSubmit} className="mobile-form">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-12">
                <div className="feature-card p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Event Rewards</h3>
                    <p className="text-sm sm:text-base text-white/80">Special gifts and rewards for event participants</p>
                </div>

                <div className="feature-card p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Exclusive Access</h3>
                    <p className="text-sm sm:text-base text-white/80">Get access to special offers and discounts</p>
                </div>

                <div className="feature-card p-4 sm:p-6 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">Event Participation</h3>
                    <p className="text-sm sm:text-base text-white/80">Join our exclusive event and win prizes</p>
                </div>
            </div>
        </div>
    )

    const renderOutletsStep = () => {
        if (loading) {
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p className="text-white/80">Loading locations...</p>
                </div>
            )
        }

        if (locations.length === 0) {
            return (
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-white/80">No locations available. Please try again later.</p>
                </div>
            )
        }

        const currentLocation = locations[currentLocationIndex]

        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl text-center mb-8" style={{ color: '#66FFB2' }}>
                    Your Assigned Location
                </h1>

                <div className="max-w-2xl mx-auto">
                    <div className="address-card rounded-lg p-6 mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-white">📍 Your Location</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => toggleLocation('prev')}
                                    className="toggle-btn px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    ←
                                </button>
                                <button
                                    onClick={() => toggleLocation('next')}
                                    className="toggle-btn px-3 py-1 rounded-full text-sm bg-white/10 hover:bg-white/20 transition-colors"
                                >
                                    →
                                </button>
                            </div>
                        </div>
                        <p className="text-white/90 text-lg">{selectedAddress}</p>
                        <p className="text-white/60 text-sm mt-2">
                            Switch locations if items are out of stock
                        </p>
                    </div>

                    <div className="outlets-section">
                        <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: '#66FFB2' }}>
                            Available Items at Your Location
                        </h2>
                        <p className="text-white/80 text-center mb-8">
                            Select one item from the available options below
                        </p>

                        {currentLocation && currentLocation.outlets.length > 0 ? (
                            <div className="space-y-6">
                                {currentLocation.outlets.map((outlet, outletIndex) => (
                                    <div key={outletIndex} className="outlet-card rounded-lg p-6">
                                        <h3 className="text-xl font-semibold mb-4 text-white">{outlet.name}</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {outlet.items.map((item, itemIndex) => {
                                                const isSelected = selectedItem === `${item.name} (${outlet.name})`
                                                const isAvailable = item.available_quantity > 0

                                                return (
                                                    <button
                                                        key={itemIndex}
                                                        onClick={() => handleItemSelect({ ...item, outlet: outlet.name })}
                                                        disabled={!isAvailable}
                                                        className={`item-button p-4 rounded-lg text-left transition-all duration-200 ${isSelected
                                                            ? 'bg-green-500 text-white border-2 border-green-400'
                                                            : isAvailable
                                                                ? 'bg-white/10 text-white/90 border border-white/20 hover:bg-white/20'
                                                                : 'bg-gray-600/20 text-gray-400 border border-gray-600/30 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="font-medium">{item.name}</div>
                                                                <div className="text-sm opacity-75">{outlet.name}</div>
                                                                <div className={`text-xs mt-1 ${isAvailable ? 'text-green-300' : 'text-red-300'}`}>
                                                                    {isAvailable ? `${item.available_quantity} available` : 'Out of stock'}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            )}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-white/60">
                                <p>No items available at this location.</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={handleProceedToUpload}
                            disabled={!selectedItem}
                            className="proceed-button px-8 py-4 rounded-full text-lg font-semibold text-black hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                <h2 className="text-xl font-semibold text-white">Your Previous Selection</h2>
                                <button
                                    onClick={clearSessionAndRestart}
                                    disabled={isLoading}
                                    className="text-sm text-blue-400 hover:text-blue-300 underline disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Changing...' : 'Change Choice'}
                                </button>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">📍 Location:</p>
                                <p className="text-white/90">{userSelection.location_name || 'Location not found'}</p>
                            </div>
                            <div className="mb-3">
                                <p className="text-white/80 text-sm">🏪 Outlet:</p>
                                <p className="text-white/90">{userSelection.outlet_name || 'Outlet not found'}</p>
                            </div>
                            <div>
                                <p className="text-white/80 text-sm">🛍️ Selected Item:</p>
                                <p className="text-white/90">{userSelection.item_name || 'Item not found'}</p>
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

            <div className="space-y-4">
                <p className="text-white/80 text-lg">
                    Thank you for participating in our program!
                </p>
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
                {step === 'outlets' && renderOutletsStep()}
                {step === 'upload' && renderUploadStep()}
                {step === 'completion' && renderCompletionStep()}
            </main>

            <style>{`
        /* Mobile-first glassmorphism */
        .mobile-form {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
            border-radius: 9999px;
            padding: 4px;
            transition: all 0.3s ease;
        }
        
        .mobile-form:focus-within {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
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
