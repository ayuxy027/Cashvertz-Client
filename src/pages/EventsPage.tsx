import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'


const EventsPage = () => {
    const navigate = useNavigate()

    // Form fields removed (campaign closed)
    const setUserName = (_: string) => { }
    const setPhone = (_: string) => { }
    const setEmail = (_: string) => { }
    const setPinCode = (_: string) => { }
    const setAddressLine1 = (_: string) => { }
    const setAddressLine2 = (_: string) => { }
    const setLandmark = (_: string) => { }
    const setCity = (_: string) => { }
    const setProductLink = (_: string) => { }
    const setProductName = (_: string) => { }
    const setProductAmount = (_: string) => { }
    const setUpiId = (_: string) => { }

    // UI state
    // Form closed

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



    // Keep compatibility with any earlier prefill
    useEffect(() => {
        const stored = localStorage.getItem('userMobileNumber')
        if (stored) {
            setPhone(stored)
            localStorage.removeItem('userMobileNumber')
        }
    }, [])

    const renderForm = () => (
        <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 sm:mb-12">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl mb-3" style={{ color: '#34D399' }}>
                    Amazon 200 pe 200
                </h1>
                <h2 className="text-xl font-bold sm:text-2xl md:text-3xl lg:text-4xl mb-6" style={{ color: '#34D399' }}>
                    Offers are over — see you in the next loot!
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
                    Thanks for the massive response. We’ll announce the next drop soon. Stay tuned on our socials.
                </p>
            </div>

            <div className="max-w-xl mx-auto mb-6">
                <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-white/90">
                    Follow us on Instagram and WhatsApp for the next announcement.
                    <div className="mt-4 flex items-center justify-center gap-4">
                        <a aria-label="Instagram" className="hover:text-white transition-colors" href="https://www.instagram.com/cashvertz" target="_blank" rel="noopener noreferrer">Instagram</a>
                        <span className="text-white/30">•</span>
                        <a aria-label="WhatsApp" className="hover:text-white transition-colors" href="https://chat.whatsapp.com/LOcskbkvq5PCaZNHoJAoex" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                    </div>
                </div>
            </div>

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
