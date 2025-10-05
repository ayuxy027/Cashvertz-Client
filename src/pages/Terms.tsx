import { useNavigate } from 'react-router-dom'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'

const Terms = () => {
    const navigate = useNavigate()
    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white bg-black">
            <div className="absolute inset-0 -z-10">
                <img src={bgSvg} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
            </div>

            <header className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <img
                        src={logo}
                        alt="CashVertz"
                        className="h-12 w-auto sm:h-16 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        loading="eager"
                        onClick={() => navigate('/')}
                    />
                    <button
                        onClick={() => navigate('/toing')}
                        className="rounded-full px-5 h-10 text-sm font-semibold text-black"
                        style={{ backgroundColor: '#34D399' }}
                    >
                        Back to Campaign
                    </button>
                </div>
            </header>

            <main className="px-4 py-8 sm:px-6 sm:py-16">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-6" style={{ color: '#34D399' }}>
                        Toing x CashVertz — ₹50 Cashback Campaign Terms & Conditions
                    </h1>
                    <div className="space-y-6 text-white/90 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold mb-2">1. Offer Eligibility</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>This offer is valid only for new users and new devices.</li>
                                <li>Each user can avail the cashback only once per UPI ID.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">2. Offer Details</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Get Flat ₹50 Cashback on successful orders worth ₹99 or more placed through the Toing app.</li>
                                <li>Offer valid for 12 hours from the campaign launch time (10:00 AM onwards).</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">3. Installation & Access</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>The app must be installed through the official campaign link only.</li>
                                <li>Cashback will not be applicable if the app is downloaded or installed from any other source.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">4. Cashback Credit</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Cashback will be processed by CashVertz within 12 hours after successful order verification.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">5. Geographical Availability</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>The campaign is currently valid in Wagholi and selected operational zones only.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">6. General Conditions</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Any fraudulent, duplicate, or suspicious activity will lead to disqualification.</li>
                                <li>CashVertz and Toing reserve the right to modify or withdraw the offer at any time without prior notice.</li>
                            </ul>
                        </section>

                        <div className="text-white/70 text-sm mt-8 p-4 bg-green-900/20 border border-green-400/30 rounded-lg">
                            <strong>Important:</strong> By submitting the form, you agree to the above Terms & Conditions and confirm that you have placed a valid Toing order yourself. Please ensure all information provided is accurate to avoid delays in cashback processing.
                        </div>
                    </div>

                    <div className="text-center text-white/60 text-xs mt-10">© 2025 CashVertz™. All rights reserved.</div>
                </div>
            </main>
        </div>
    )
}

export default Terms


