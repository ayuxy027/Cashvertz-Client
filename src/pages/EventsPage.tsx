import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'
import { supabase } from '../lib/supabase'

const EventsPage = () => {
    const navigate = useNavigate()

    // Form fields (Amazon campaign)
    const [userName, setUserName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [pinCode, setPinCode] = useState('')
    const [addressLine1, setAddressLine1] = useState('')
    const [addressLine2, setAddressLine2] = useState('')
    const [landmark, setLandmark] = useState('')
    const [city, setCity] = useState('')
    const [productLink, setProductLink] = useState('')
    const [productName, setProductName] = useState('')
    const [productAmount, setProductAmount] = useState('')
    const [upiId, setUpiId] = useState('')

    // UI state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [submissionSuccess, setSubmissionSuccess] = useState(false)
    const [agreed, setAgreed] = useState(false)

    // Restore form state from localStorage
    useEffect(() => {
        const map: Array<[string, (v: string) => void]> = [
            ['amazon_userName', setUserName],
            ['amazon_phone', setPhone],
            ['amazon_email', setEmail],
            ['amazon_pinCode', setPinCode],
            ['amazon_addressLine1', setAddressLine1],
            ['amazon_addressLine2', setAddressLine2],
            ['amazon_landmark', setLandmark],
            ['amazon_city', setCity],
            ['amazon_productLink', setProductLink],
            ['amazon_productName', setProductName],
            ['amazon_productAmount', setProductAmount],
            ['amazon_upiId', setUpiId],
        ]
        for (const [key, setter] of map) {
            const v = localStorage.getItem(key)
            if (v) {
                setter(v)
            }
        }
    }, [])

    const validatePhone = useCallback((number: string): boolean => {
        return /^\d{10}$/.test(number.replace(/\D/g, ''))
    }, [])

    const validateAmount = useCallback((amountStr: string): boolean => {
        if (!amountStr) {
            return false
        }
        const num = Number(amountStr)
        return Number.isFinite(num) && num >= 200
    }, [])

    const persistToLocalStorage = useCallback(() => {
        const entries: Array<[string, string]> = [
            ['amazon_userName', userName],
            ['amazon_phone', phone],
            ['amazon_email', email],
            ['amazon_pinCode', pinCode],
            ['amazon_addressLine1', addressLine1],
            ['amazon_addressLine2', addressLine2],
            ['amazon_landmark', landmark],
            ['amazon_city', city],
            ['amazon_productLink', productLink],
            ['amazon_productName', productName],
            ['amazon_productAmount', productAmount],
            ['amazon_upiId', upiId],
        ]
        for (const [k, v] of entries) {
            if (v) {
                localStorage.setItem(k, v)
            }
        }
    }, [
        userName,
        phone,
        email,
        pinCode,
        addressLine1,
        addressLine2,
        landmark,
        city,
        productLink,
        productName,
        productAmount,
        upiId,
    ])

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)
        try {
            if (!userName.trim()) {
                setError('Please enter your name')
                return
            }
            if (!validatePhone(phone)) {
                setError('Please enter a valid 10-digit phone number')
                return
            }
            if (!pinCode.trim()) {
                setError('Please enter your pin code')
                return
            }
            if (!addressLine1.trim()) {
                setError('Please enter Address Line 1')
                return
            }
            if (!city.trim()) {
                setError('Please enter your city')
                return
            }
            if (!productName.trim()) {
                setError('Please enter the product name')
                return
            }
            if (!validateAmount(productAmount)) {
                setError('Product amount must be at least ₹200')
                return
            }
            if (!upiId.trim()) {
                setError('Please enter your UPI ID')
                return
            }
            if (!agreed) {
                setError('Please agree to the campaign Terms & Conditions')
                return
            }

            persistToLocalStorage()

            // Enforce monthly participation limit: up to 3 per month (phone+email pair if email provided)
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
            let countRes
            if (email.trim()) {
                countRes = await supabase
                    .from('amazon_orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('phone', phone.trim())
                    .eq('email', email.trim())
                    .gte('created_at', monthStart.toISOString())
                    .lt('created_at', nextMonth.toISOString())
            } else {
                countRes = await supabase
                    .from('amazon_orders')
                    .select('id', { count: 'exact', head: true })
                    .eq('phone', phone.trim())
                    .gte('created_at', monthStart.toISOString())
                    .lt('created_at', nextMonth.toISOString())
            }
            if (countRes.error) {
                setError('Failed to validate monthly limit. Please try again.')
                return
            }
            if ((countRes.count ?? 0) >= 3) {
                setError('Monthly participation limit reached (max 3 per month).')
                return
            }

            // Insert order
            const { error: insertErr } = await supabase.from('amazon_orders').insert([
                {
                    user_name: userName.trim(),
                    phone: phone.trim(),
                    email: email.trim() || null,
                    pin_code: pinCode.trim(),
                    address_line_1: addressLine1.trim(),
                    address_line_2: addressLine2.trim() || null,
                    landmark: landmark.trim() || null,
                    city: city.trim(),
                    product_link: productLink.trim() || null,
                    product_name: productName.trim(),
                    product_amount: Number(productAmount),
                    upi_id: upiId.trim(),
                    status: 'submitted',
                },
            ])
            if (insertErr) {
                setError('Failed to submit. Please try again.')
                return
            }

            setSubmissionSuccess(true)
        } catch {
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }, [
        userName,
        phone,
        email,
        pinCode,
        addressLine1,
        addressLine2,
        landmark,
        city,
        productLink,
        productName,
        productAmount,
        upiId,
        validatePhone,
        validateAmount,
        persistToLocalStorage,
        agreed,
    ])

    // Keep compatibility with any earlier prefill
    useEffect(() => {
        const stored = localStorage.getItem('userMobileNumber')
        if (stored) {
            setPhone(stored)
            localStorage.removeItem('userMobileNumber')
        }
    }, [])


    // The following functions and variables are not used in this simplified version,
    // so we do not define them to avoid linter errors.

    // Renderers for legacy steps are omitted.

    const renderForm = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-3" style={{ color: '#34D399' }}>
                    Amazon 200 pe 200
                </h1>
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl mb-6" style={{ color: '#34D399' }}>
                    Submit your order details
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Fill in the details below.
                </p>
            </div>

            <div className="max-w-2xl mx-auto mb-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="text" required value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Name" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone No" maxLength={10} inputMode="numeric" pattern="^\d{10}$" title="Enter 10-digit mobile number" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="Pin Code" inputMode="numeric" pattern="^\d{6}$" title="Enter 6-digit pin code" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="Address Line 1" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} placeholder="Address Line 2" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={landmark} onChange={(e) => setLandmark(e.target.value)} placeholder="Landmark" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" pattern="^[A-Za-z ]{2,}$" title="Enter a valid city" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="url" required value={productLink} onChange={(e) => setProductLink(e.target.value)} placeholder="Product Link" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors break-all" />
                        <input type="text" required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Product Name" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="number" step="0.01" min="200" required value={productAmount} onChange={(e) => setProductAmount(e.target.value)} placeholder="Product Amount (min ₹200)" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                        <input type="text" required value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="UPI ID" pattern="^[\w.-]{2,}@[A-Za-z]{2,}$" title="Enter valid UPI ID (e.g., name@bank)" className="w-full bg-transparent border border-white/20 rounded-full px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 text-sm transition-colors" />
                    </div>

                    <div className="text-left text-white/80 text-xs sm:text-sm">
                        <p className="mb-1">- COD only. Minimum product value ₹200 (shipping excluded).</p>
                        <p className="mb-1">- Up to 3 participations per month per phone+email pair.</p>
                        <p className="mb-1">- Cashback ₹200 within 20–30 working days after delivery verification.</p>
                    </div>

                    <div className="flex items-start gap-3 text-left">
                        <input id="agree" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4" />
                        <label htmlFor="agree" className="text-xs sm:text-sm text-white/80">
                            I agree to accept the COD delivery and understand I’ll receive ₹200 cashback after successful delivery.
                        </label>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center gap-2 rounded-full px-8 h-12 text-sm font-semibold text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ backgroundColor: '#34D399' }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                                    <span>Submitting...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <path d="M12 2l2.1 4.7L19 8.9l-4.2 2L13 16l-1-5.1L7 8.9l4.9-2.2L12 2z" />
                                    </svg>
                                    <span>Submit</span>
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => window.open('/terms', '_blank')}
                            className="text-white/70 hover:text-white text-xs underline"
                        >
                            View Terms & Conditions
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="text-sm text-red-400 mb-6">{error}</div>
            )}

            {submissionSuccess && (
                <div className="text-sm text-green-300 mb-6">
                    Submitted! We’ll review and get back to you shortly.
                </div>
            )}

            {/* Removed old event cards */}
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
                {renderForm()}
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
