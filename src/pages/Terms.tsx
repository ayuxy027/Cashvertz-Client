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
                        onClick={() => navigate('/amazon')}
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
                        Amazon ₹200 Cashback Campaign – Terms & Conditions
                    </h1>
                    <div className="space-y-6 text-white/90 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-semibold mb-2">1. Eligibility</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>This offer is valid only on Cash on Delivery (COD) orders placed via CashVertz.</li>
                                <li>Orders must have a minimum product value of ₹200 (excluding shipping charges).</li>
                                <li>Each user can participate up to 3 times per calendar month using the same email ID and mobile number.</li>
                                <li>Each entry must be for a different product/order, and delivery must be accepted.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">2. How It Works</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Fill the official campaign form with: Amazon product link, shipping details (name, phone, address, pincode) and a valid UPI ID for cashback.</li>
                                <li>CashVertz will place the Amazon COD order on your behalf.</li>
                                <li>You do not need to place any order yourself — just be ready to accept the delivery and pay cash.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">3. Order & Delivery</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Orders will be placed by the CashVertz backend and shipped via Amazon.</li>
                                <li>You must receive and pay for the order in full to be eligible.</li>
                                <li>Orders that are refused, returned, or cancelled will not qualify for cashback.</li>
                                <li>Once delivered, parcels cannot be returned or exchanged under this campaign.</li>
                                <li>CashVertz will not be responsible for any damage, defect, or mismatch in the product — including electronics, gadgets, or fragile items. Users ordering such items do so at their own risk.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">4. Cashback Details</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>You will receive a flat ₹200 cashback after successful delivery.</li>
                                <li>Cashback will be credited to your UPI ID within 20–30 working days of delivery verification.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">5. UPI & Payment Terms</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Please ensure your UPI ID is accurate.</li>
                                <li>CashVertz will not be responsible for failed payments due to incorrect details.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">6. Monthly Participation Limit</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Each user (based on mobile number and email ID) can avail this offer up to 3 times per calendar month.</li>
                                <li>Attempts beyond this limit will not be considered.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">7. Disqualification Criteria</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Fake product links, incorrect addresses, or false UPI details will result in disqualification.</li>
                                <li>Multiple entries for the same product/order will be rejected.</li>
                                <li>Users found violating terms or misusing the offer will be blacklisted.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">8. General Terms</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>This campaign is run by CashVertz and is not affiliated with Amazon.</li>
                                <li>CashVertz reserves the right to modify, pause, or terminate the campaign at any time.</li>
                                <li>In all matters, the decision of CashVertz will be final.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-semibold mb-2">9. Privacy Policy</h2>
                            <ul className="list-disc list-inside space-y-1 text-white/80">
                                <li>Your data will be used strictly for order placement and cashback processing.</li>
                                <li>It will not be shared with third parties or used for marketing.</li>
                            </ul>
                        </section>

                        <div className="text-white/70 text-sm mt-8">
                            By submitting the form, you agree to the above Terms & Conditions and authorize CashVertz to place an Amazon COD order on your behalf.
                        </div>
                    </div>

                    <div className="text-center text-white/60 text-xs mt-10">© 2025 CashVertz™. All rights reserved.</div>
                </div>
            </main>
        </div>
    )
}

export default Terms


