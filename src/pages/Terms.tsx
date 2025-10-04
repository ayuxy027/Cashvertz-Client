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
                        Toing By Swiggy Cashback Campaign – Terms & Conditions
                    </h1>
                    <div className="space-y-6 text-white/90 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold mb-2">1. Eligibility</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>This offer is valid only for Swiggy orders placed by users themselves.</li>
                                <li>Each user can participate up to 3 times per calendar month using the same mobile number.</li>
                                <li>Each UPI ID can be used only once for the entire campaign duration.</li>
                                <li>Users must provide accurate personal details and a valid UPI ID for cashback.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">2. How It Works</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Fill the official campaign form with: your name, mobile number, and UPI ID.</li>
                                <li>Click "Redirect to App" to open Swiggy and place your order.</li>
                                <li>Upload a clear screenshot of your Swiggy order showing order details.</li>
                                <li>Submit the form for verification and cashback processing.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">3. Order Requirements</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Orders must be placed directly through Swiggy by the user.</li>
                                <li>Screenshot must clearly show order details, amount, and order ID.</li>
                                <li>Orders that are cancelled, refunded, or disputed will not qualify for cashback.</li>
                                <li>CashVertz is not responsible for the quality, delivery, or any issues with Swiggy orders.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">4. Cashback Details</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Cashback amount will be determined based on the order value and campaign terms.</li>
                                <li>Cashback will be credited to your UPI ID within 15–20 working days of order verification.</li>
                                <li>Cashback is subject to successful verification of the uploaded screenshot.</li>
                                <li>Minimum order value requirements may apply as per campaign terms.</li>
                                <li>Cashback processing time may vary based on verification requirements.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">5. UPI & Payment Terms</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Each UPI ID can be used only once throughout the entire campaign.</li>
                                <li>Please ensure your UPI ID is accurate and active.</li>
                                <li>CashVertz will not be responsible for failed payments due to incorrect or inactive UPI details.</li>
                                <li>UPI ID will be validated against existing orders to prevent duplicate usage.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">6. Monthly Participation Limit</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Each user (based on mobile number) can avail this offer up to 3 times per calendar month.</li>
                                <li>Each UPI ID can be used only once for the entire campaign duration.</li>
                                <li>Attempts beyond these limits will not be considered.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">7. Disqualification Criteria</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Fake or manipulated screenshots will result in immediate disqualification.</li>
                                <li>Using the same UPI ID multiple times will result in rejection of all subsequent orders.</li>
                                <li>Incorrect personal details or inactive UPI IDs will lead to disqualification.</li>
                                <li>Users found violating terms or misusing the offer will be blacklisted.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">8. General Terms</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>This campaign is run by CashVertz and is not affiliated with Swiggy.</li>
                                <li>CashVertz reserves the right to modify, pause, or terminate the campaign at any time.</li>
                                <li>In all matters, the decision of CashVertz will be final.</li>
                                <li>Users are responsible for placing their own Swiggy orders.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">9. Privacy Policy</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Your data will be used strictly for campaign verification and cashback processing.</li>
                                <li>Screenshots will be stored securely and used only for verification purposes.</li>
                                <li>Personal information will not be shared with third parties or used for marketing.</li>
                                <li>We may contact you via the provided mobile number for verification purposes only.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">10. Contact & Support</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>For queries regarding cashback status, contact us via WhatsApp or email.</li>
                                <li>Support is available during business hours (9 AM - 6 PM, Monday to Friday).</li>
                                <li>Response time for queries is typically within 24-48 hours.</li>
                                <li>Please keep your order reference number handy when contacting support.</li>
                            </ul>
                        </section>

                        <div className="text-white/70 text-sm mt-8 p-4 bg-green-900/20 border border-green-400/30 rounded-lg">
                            <strong>Important:</strong> By submitting the form, you agree to the above Terms & Conditions and confirm that you have placed a valid Swiggy order yourself. Please ensure all information provided is accurate to avoid delays in cashback processing.
                        </div>
                    </div>

                    <div className="text-center text-white/60 text-xs mt-10">© 2025 CashVertz™. All rights reserved.</div>
                </div>
            </main>
        </div>
    )
}

export default Terms


