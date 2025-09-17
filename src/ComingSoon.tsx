import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from './assets/logo-light.png'
import percentImg from './assets/percentage.png'
import coinImg from './assets/coin.png'
import bgSvg from './assets/bg.svg'
import { ValidationService } from './service/validationService'
import { EmailService } from './service/emailService'

type TimeLeft = {
    days: number
    hours: number
    minutes: number
    seconds: number
}

const formatNumber = (value: number) => value.toString().padStart(2, '0')

// Animated Counter Component with Cricket Score Style
const AnimatedCounter = ({ value, label }: { value: number; label: string }) => {
    const [currentValue, setCurrentValue] = useState(value)
    const [nextValue, setNextValue] = useState(value)
    const [isAnimating, setIsAnimating] = useState(false)
    const prevValueRef = useRef(value)

    useEffect(() => {
        if (prevValueRef.current !== value) {
            setNextValue(value)
            setIsAnimating(true)

            // Start the animation after a brief delay
            setTimeout(() => {
                setCurrentValue(value)
                setIsAnimating(false)
            }, 50)

            prevValueRef.current = value
        }
    }, [value])

    return (
        <div className="countdown-card rounded-lg px-3 py-3 sm:rounded-xl sm:px-6 sm:py-4 relative">
            <div className="relative h-14 flex items-center justify-center overflow-hidden sm:h-20">
                {/* Current number sliding out */}
                <div
                    className={`absolute text-3xl font-black sm:text-4xl md:text-5xl lg:text-6xl transition-all duration-1000 ease-in-out ${isAnimating ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'
                        }`}
                    style={{ color: '#66FFB2' }}
                >
                    {formatNumber(currentValue)}
                </div>

                {/* Next number sliding in */}
                <div
                    className={`absolute text-3xl font-black sm:text-4xl md:text-5xl lg:text-6xl transition-all duration-1000 ease-in-out ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
                        }`}
                    style={{ color: '#66FFB2' }}
                >
                    {formatNumber(nextValue)}
                </div>
            </div>
            <div className="mt-2 text-sm font-medium text-white/70 tracking-wider uppercase sm:text-base">
                {label}
            </div>
        </div>
    )
}

const ComingSoon = () => {
    const navigate = useNavigate()
    const launchAt = useMemo(() => {
        // Launch date: October 21, 2025 12:00:00 AM UTC
        return new Date('2025-10-21T00:00:00Z')
    }, [])

    const calculate = useCallback((): TimeLeft => {
        const now = new Date().getTime()
        const distance = Math.max(0, launchAt.getTime() - now)
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        return { days, hours, minutes, seconds }
    }, [launchAt])

    const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculate())
    const [email, setEmail] = useState('')
    const [submitted, setSubmitted] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const id = setInterval(() => setTimeLeft(calculate()), 1000)
        return () => clearInterval(id)
    }, [calculate])

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            // Validate email
            const validation = ValidationService.validateEmail(email)
            if (!validation.isValid) {
                setError(validation.error || 'Invalid email address')
                setIsLoading(false)
                return
            }

            // Send notification email
            const emailResult = await EmailService.sendNotification(email)
            if (!emailResult.success) {
                setError(emailResult.error || 'Failed to send email')
                setIsLoading(false)
                return
            }

            setSubmitted(true)
            setEmail('')
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Signup error:', error)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="relative min-h-svh w-full overflow-hidden text-white">
            {/* SVG background */}
            <div className="absolute inset-0 -z-10 bg-black">
                <img
                    src={bgSvg}
                    alt="Background"
                    className="h-full w-full object-cover"
                />
            </div>

            <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
                <div className="flex items-center">
                    <img
                        src={logo}
                        alt="CashVertz"
                        className="h-16 w-auto object-cover cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        onClick={() => navigate('/')}
                    />
                </div>
                <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium text-white/80">
                    <a className="hover:text-white transition-colors duration-200 whitespace-nowrap" href="#about">About Us</a>
                    <div className="flex items-center gap-4">
                        {/* social icons */}
                        <a aria-label="Instagram" className="social-icon hover:text-white" href="https://www.instagram.com/cashvertz">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.5A5.5 5.5 0 1 1 6.5 13 5.5 5.5 0 0 1 12 7.5Zm0 2A3.5 3.5 0 1 0 15.5 13 3.5 3.5 0 0 0 12 9.5Zm6.25-.75a1 1 0 1 1-1-1 1 1 0 0 1 1 1Z" /></svg>
                        </a>
                        <a aria-label="WhatsApp" className="social-icon hover:text-white" href="https://chat.whatsapp.com/LOcskbkvq5PCaZNHoJAoex" target="_blank" rel="noopener noreferrer">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" /></svg>
                        </a>
                        <a aria-label="LinkedIn" className="social-icon hover:text-white" href="https://www.linkedin.com/company/cashvertz/">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.55c0-1.33-.02-3.05-1.86-3.05-1.87 0-2.16 1.45-2.16 2.95v5.65H9.32V9h3.41v1.56h.05c.48-.9 1.66-1.86 3.42-1.86 3.66 0 4.34 2.41 4.34 5.55v6.2ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM3.56 20.45h3.55V9H3.56v11.45Z" /></svg>
                        </a>
                    </div>
                </nav>
            </header>

            <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 pb-16 sm:px-6 sm:pb-24 text-center">
                <h1 className="mt-4 text-4xl font-bold tracking-tight sm:mt-6 sm:text-5xl md:mt-10 md:text-6xl lg:text-6xl xl:text-7xl" style={{ color: '#66FFB2' }}>
                    We're Still Cooking
                </h1>
                <h2 className="mb-6 text-4xl font-bold tracking-tight sm:mb-8 sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl" style={{ color: '#66FFB2' }}>
                    Our Website...
                </h2>
                <p className="mx-auto max-w-2xl px-4 text-base font-light text-white/90 sm:px-0 sm:text-lg md:text-xl leading-relaxed">
                    We are going to launch our website very soon. Stay tuned for the
                    revolution in <span className="underline font-medium" style={{ color: '#66FFB2' }}>cashback shopping</span>.
                </p>

                <div className="mt-12 grid grid-cols-2 gap-5 sm:mt-16 sm:grid-cols-4 sm:gap-7 md:gap-9">
                    {([
                        { label: 'Days', value: timeLeft.days },
                        { label: 'Hours', value: timeLeft.hours },
                        { label: 'Minutes', value: timeLeft.minutes },
                        { label: 'Seconds', value: timeLeft.seconds },
                    ] as const).map((item) => (
                        <AnimatedCounter key={item.label} value={item.value} label={item.label} />
                    ))}
                </div>

                <div className="mt-12 w-full max-w-2xl px-4 sm:mt-16 sm:px-0">
                    <form onSubmit={onSubmit} className="email-form flex items-stretch overflow-hidden rounded-full">
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email here"
                            className="flex-1 bg-transparent px-4 py-3 text-white placeholder:text-white/50 focus:outline-none text-sm sm:px-6 sm:py-4 sm:text-base"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold text-black hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed sm:gap-3 sm:px-8 sm:py-4 sm:text-base"
                            style={{ backgroundColor: '#66FFB2' }}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent sm:h-5 sm:w-5"></div>
                                    <span className="hidden sm:inline">Sending...</span>
                                    <span className="sm:hidden">...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                                    </svg>
                                    <span className="hidden sm:inline">Notify Me</span>
                                    <span className="sm:hidden">Notify</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
                {error && (
                    <div className="mt-3 text-sm text-red-400">{error}</div>
                )}
                {submitted && (
                    <div className="mt-3 text-sm" style={{ color: '#66FFB2' }}>Thanks! Check your email for confirmation.</div>
                )}

                {/* Join Event Button */}
                <div className="mt-8">
                    <a
                        href="/events"
                        className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-black hover:opacity-90 transition-all duration-200 sm:px-8 sm:py-4 sm:text-base"
                        style={{ backgroundColor: '#66FFB2' }}
                    >
                        <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                        </svg>
                        <span>Join Our Event</span>
                    </a>
                </div>

                <footer className="mt-16 text-sm text-white/60">© 2025 Cashvertz. All rights reserved.</footer>
            </main>

            {/* Floating decor */}
            {/* Coin positioning: hidden on mobile, visible on md+ */}
            <div className="pointer-events-none absolute left-8 top-1/2 hidden -translate-y-1/2 md:block lg:left-16">
                <img src={coinImg} alt="coin" className="h-20 w-20 floating-coin lg:h-28 lg:w-28" />
            </div>
            {/* Percentage positioning: hidden on mobile, visible on md+ */}
            <img src={percentImg} alt="percent" className="pointer-events-none absolute right-12 bottom-32 hidden h-24 w-32 rotate-6 md:block md:right-20 md:bottom-43 md:h-32 md:w-40 floating-slow object-cover" />

            <style>{`
        .floating-coin { 
            filter: drop-shadow(0 25px 50px rgba(0,0,0,0.7)) drop-shadow(0 0 25px rgba(255,215,0,0.4));
            animation: float 4s ease-in-out infinite;
        }
        .floating-slow { 
            filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6)) drop-shadow(0 0 20px rgba(102,255,178,0.3));
            animation: float 6s ease-in-out infinite; 
        }
        @keyframes float { 
            0%, 100% { transform: translateY(0) rotate(0deg); } 
            50% { transform: translateY(-12px) rotate(2deg); } 
        }
        
        /* Clean glassmorphism for countdown cards */
        .countdown-card {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 
                0 4px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
        }
        
        @media (min-width: 640px) {
            .countdown-card {
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.08);
            }
        }
        
        .countdown-card:hover {
            transform: translateY(-1px);
            box-shadow: 
                0 6px 20px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        
        @media (min-width: 640px) {
            .countdown-card:hover {
                transform: translateY(-2px);
                box-shadow: 
                    0 12px 40px rgba(0, 0, 0, 0.35),
                    inset 0 1px 0 rgba(255, 255, 255, 0.12);
            }
        }
        
        /* Clean form styling */
        .email-form {
            background: rgba(255, 255, 255, 0.02);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 
                0 4px 16px rgba(0, 0, 0, 0.15),
                inset 0 1px 0 rgba(255, 255, 255, 0.08);
            transition: all 0.3s ease;
        }
        
        @media (min-width: 640px) {
            .email-form {
                box-shadow: 
                    0 8px 32px rgba(0, 0, 0, 0.25),
                    inset 0 1px 0 rgba(255, 255, 255, 0.08);
            }
        }
        
        .email-form:focus-within {
            transform: translateY(-1px);
            box-shadow: 
                0 6px 20px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }
        
        @media (min-width: 640px) {
            .email-form:focus-within {
                transform: translateY(-1px);
                box-shadow: 
                    0 12px 40px rgba(0, 0, 0, 0.35),
                    inset 0 1px 0 rgba(255, 255, 255, 0.12);
            }
        }
        
        /* Enhanced input styling */
        .email-form input {
            transition: all 0.2s ease;
        }
        
        .email-form input:focus {
            background: rgba(255, 255, 255, 0.05);
        }
        
        /* Button hover effects */
        .email-form button:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 24px rgba(102, 255, 178, 0.3);
        }
        
        /* Social icons hover effects */
        .social-icon {
            transition: all 0.2s ease;
        }
        
        .social-icon:hover {
            transform: translateY(-1px);
            filter: drop-shadow(0 2px 4px rgba(102, 255, 178, 0.2));
        }
      `}</style>
        </div>
    )
}

export default ComingSoon