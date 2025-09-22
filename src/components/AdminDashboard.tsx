import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'

interface AdminSubmission {
    id: string
    user_name: string
    phone: string
    email: string | null
    pin_code: string
    address_line_1: string
    address_line_2: string | null
    landmark: string | null
    city: string
    product_link: string | null
    product_name: string
    product_amount: number
    upi_id: string
    screenshot_url: string | null
    status: string
    created_at: string
    updated_at: string
}

const AdminDashboard = () => {
    const [submissions, setSubmissions] = useState<AdminSubmission[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
    })

    useEffect(() => {
        loadSubmissions()
    }, [])

    const loadSubmissions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('amazon_orders_view')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }
            setSubmissions(data || [])

            // Calculate statistics
            const total = data?.length || 0
            const pending = data?.filter(s => s.status === 'submitted').length || 0
            const approved = data?.filter(s => s.status === 'reviewed').length || 0
            const rejected = data?.filter(s => s.status === 'rejected').length || 0

            setStats({ total, pending, approved, rejected })
        } catch {
            setError('Failed to load submissions')
        } finally {
            setLoading(false)
        }
    }

    const approveSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('amazon_orders')
                .update({ status: 'reviewed' })
                .eq('id', id)

            if (error) {
                throw error
            }
            loadSubmissions()
        } catch {
            setError('Failed to approve submission')
        }
    }

    const rejectSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('amazon_orders')
                .update({ status: 'rejected' })
                .eq('id', id)

            if (error) {
                throw error
            }
            loadSubmissions()
        } catch {
            setError('Failed to reject submission')
        }
    }

    if (loading) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden text-white bg-black">
                <div className="absolute inset-0 -z-10">
                    <img
                        src={bgSvg}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="eager"
                        decoding="async"
                    />
                </div>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                        <p className="text-white/80">Loading submissions...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen w-full overflow-hidden text-white bg-black">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <img
                    src={bgSvg}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="eager"
                    decoding="async"
                />
            </div>

            {/* Header */}
            <header className="px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex items-center justify-between max-w-6xl mx-auto">
                    <img
                        src={logo}
                        alt="CashVertz Admin"
                        className="h-12 w-auto sm:h-16"
                        loading="eager"
                    />
                    <h1 className="text-2xl font-bold" style={{ color: '#34D399' }}>
                        Admin Dashboard
                    </h1>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 py-8 sm:px-6 sm:py-16">
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-3xl font-bold mb-2" style={{ color: '#34D399' }}>
                            Amazon Orders
                        </h2>
                        <p className="text-white/80">Manage and review user submissions</p>
                    </div>

                    {/* Statistics Panel */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                        <div className="stats-card p-4 rounded-lg">
                            <div className="text-2xl font-bold text-white">{stats.total}</div>
                            <div className="text-sm text-white/60">Total Orders</div>
                        </div>
                        <div className="stats-card p-4 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-300">{stats.pending}</div>
                            <div className="text-sm text-white/60">Pending Review</div>
                        </div>
                        <div className="stats-card p-4 rounded-lg">
                            <div className="text-2xl font-bold text-green-300">{stats.approved}</div>
                            <div className="text-sm text-white/60">Approved</div>
                        </div>
                        <div className="stats-card p-4 rounded-lg">
                            <div className="text-2xl font-bold text-red-300">{stats.rejected}</div>
                            <div className="text-sm text-white/60">Rejected</div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                            <p className="text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="admin-card rounded-lg p-6">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-white/20">
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Order Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            UPI ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {submissions.map((submission) => (
                                        <tr key={submission.id} className="hover:bg-white/5">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-white">
                                                    {submission.user_name}
                                                </div>
                                                <div className="text-sm text-white/60">{submission.phone}</div>
                                                {submission.email && (
                                                    <div className="text-xs text-white/40">{submission.email}</div>
                                                )}
                                                <div className="text-sm text-white/40">
                                                    {new Date(submission.created_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-white/80">{submission.address_line_1}</div>
                                                {submission.address_line_2 && (
                                                    <div className="text-sm text-white/60">{submission.address_line_2}</div>
                                                )}
                                                {submission.landmark && (
                                                    <div className="text-sm text-white/60">{submission.landmark}</div>
                                                )}
                                                <div className="text-sm text-white">{submission.city} - {submission.pin_code}</div>
                                                <div className="text-sm text-white/80 mt-2">
                                                    <strong>Product:</strong> {submission.product_name}
                                                </div>
                                                <div className="text-sm text-white/80">
                                                    <strong>Amount:</strong> ₹{submission.product_amount}
                                                </div>
                                                <div className="text-sm text-white/70">
                                                    <strong>UPI:</strong> {submission.upi_id}
                                                </div>
                                                {submission.product_link && (
                                                    <a href={submission.product_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline text-xs">
                                                        View Product Link
                                                    </a>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm text-white">{submission.upi_id}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.status === 'reviewed'
                                                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                                                    : submission.status === 'submitted'
                                                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                                                        : submission.status === 'rejected'
                                                            ? 'bg-red-500/20 text-red-300 border border-red-400/30'
                                                            : 'bg-white/10 text-white/60 border border-white/20'
                                                    }`}>
                                                    {submission.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {submission.status === 'submitted' && (
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => approveSubmission(submission.id)}
                                                            className="text-green-300 hover:text-green-200 bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded-md text-xs border border-green-400/30 transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => rejectSubmission(submission.id)}
                                                            className="text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-md text-xs border border-red-400/30 transition-colors"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
        .admin-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
        
        .stats-card {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .stats-card:hover {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          transform: translateY(-2px);
        }
      `}</style>
        </div>
    )
}

export default AdminDashboard