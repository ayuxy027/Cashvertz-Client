import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'

interface AdminSubmission {
    id: string
    user_name: string
    mobile_number: string
    upi_id: string
    order_amount: number | null
    screenshot_url: string | null
    status: string
    has_redirected: boolean
    progress_stage: 'details_entered' | 'redirected' | 'screenshot_uploaded' | 'pending_approval' | 'approved' | 'rejected'
    created_at: string
    updated_at: string
}

const AdminDashboard = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [password, setPassword] = useState('')
    const [authError, setAuthError] = useState('')
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
        // Check if already authenticated
        const savedAuth = localStorage.getItem('admin_authenticated')
        if (savedAuth === 'true') {
            setIsAuthenticated(true)
            loadSubmissions()

            // Auto-refresh every 10 seconds to show real-time updates
            const interval = setInterval(() => {
                loadSubmissions()
            }, 10000)

            return () => clearInterval(interval)
        } else {
            setLoading(false)
        }
    }, [])

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()
        setAuthError('')

        if (password === '2345') {
            setIsAuthenticated(true)
            localStorage.setItem('admin_authenticated', 'true')
            loadSubmissions()

            // Auto-refresh every 10 seconds to show real-time updates
            const interval = setInterval(() => {
                loadSubmissions()
            }, 10000)

            return () => clearInterval(interval)
        } else {
            setAuthError('Invalid password')
        }
    }

    const handleLogout = () => {
        setIsAuthenticated(false)
        localStorage.removeItem('admin_authenticated')
        setPassword('')
    }

    const loadSubmissions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('swiggy_orders')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) {
                throw error
            }

            // Process data to match admin view format
            const processedData = (data || []).map(submission => {
                let progressStage = 'details_entered'

                if (submission.screenshot_url && submission.status === 'submitted') {
                    progressStage = 'pending_approval'
                } else if (submission.screenshot_url && submission.status === 'approved') {
                    progressStage = 'approved'
                } else if (submission.screenshot_url && submission.status === 'rejected') {
                    progressStage = 'rejected'
                } else if (submission.has_redirected && !submission.screenshot_url) {
                    progressStage = 'redirected'
                }

                return {
                    ...submission,
                    progress_stage: progressStage
                }
            })

            setSubmissions(processedData)

            // Calculate statistics
            const total = processedData.length
            const pending = processedData.filter(s => s.progress_stage === 'pending_approval').length
            const approved = processedData.filter(s => s.progress_stage === 'approved').length
            const rejected = processedData.filter(s => s.progress_stage === 'rejected').length

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
                .from('swiggy_orders')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) {
                throw error
            }
            // Refresh immediately after action
            await loadSubmissions()
        } catch {
            setError('Failed to approve submission')
        }
    }

    const rejectSubmission = async (id: string) => {
        try {
            const { error } = await supabase
                .from('swiggy_orders')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('id', id)

            if (error) {
                throw error
            }
            // Refresh immediately after action
            await loadSubmissions()
        } catch {
            setError('Failed to reject submission')
        }
    }

    const approveAll = async () => {
        try {
            const { error } = await supabase
                .from('swiggy_orders')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('status', 'submitted')

            if (error) {
                throw error
            }
            // Refresh immediately after action
            await loadSubmissions()
        } catch {
            setError('Failed to approve all submissions')
        }
    }

    const rejectAll = async () => {
        try {
            const { error } = await supabase
                .from('swiggy_orders')
                .update({ status: 'rejected', updated_at: new Date().toISOString() })
                .eq('status', 'submitted')

            if (error) {
                throw error
            }
            // Refresh immediately after action
            await loadSubmissions()
        } catch {
            setError('Failed to reject all submissions')
        }
    }

    // Login form
    if (!isAuthenticated) {
        return (
            <div className="relative min-h-screen w-full overflow-hidden text-white bg-black">
                <div className="absolute inset-0 -z-10">
                    <img src={bgSvg} alt="" className="h-full w-full object-cover" loading="eager" decoding="async" />
                </div>

                <div className="flex items-center justify-center min-h-screen p-4">
                    <div className="w-full max-w-md">
                        <div className="text-center mb-8">
                            <img
                                src={logo}
                                alt="CashVertz"
                                className="h-16 w-auto mx-auto mb-4"
                                loading="eager"
                            />
                            <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
                            <p className="text-white/60">Enter password to access</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter admin password"
                                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder:text-white/50 focus:outline-none focus:border-green-400 transition-colors"
                                    required
                                />
                            </div>

                            {authError && (
                                <div className="text-red-400 text-sm text-center">
                                    {authError}
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                            >
                                Login
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        )
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
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-3xl font-bold" style={{ color: '#34D399' }}>
                                Swiggy Orders
                            </h2>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 text-sm transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <p className="text-white/80">Manage and review user submissions</p>
                            <button
                                onClick={loadSubmissions}
                                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 text-sm transition-colors"
                            >
                                🔄 Refresh
                            </button>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={approveAll}
                                    className="text-green-300 hover:text-green-200 bg-green-500/20 hover:bg-green-500/30 px-3 py-1 rounded-md text-xs border border-green-400/30 transition-colors"
                                >
                                    Approve All (Submitted)
                                </button>
                                <button
                                    onClick={rejectAll}
                                    className="text-red-300 hover:text-red-200 bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-md text-xs border border-red-400/30 transition-colors"
                                >
                                    Reject All (Submitted)
                                </button>
                            </div>
                        </div>
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
                                            User Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Order Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Progress
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-white/80 uppercase tracking-wider">
                                            Screenshot
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
                                                <div className="text-sm text-white/60">{submission.mobile_number}</div>
                                                <div className="text-sm text-white/70">
                                                    <strong>UPI:</strong> {submission.upi_id}
                                                </div>
                                                <div className="text-xs text-white/50">
                                                    Submitted: {new Date(submission.created_at).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-green-300">
                                                    {submission.order_amount ? `₹${submission.order_amount.toFixed(2)}` : 'N/A'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${submission.has_redirected ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                        <span className="text-sm text-white/80">
                                                            {submission.has_redirected ? 'Redirected to App' : 'Not Redirected'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${submission.screenshot_url ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                                        <span className="text-sm text-white/80">
                                                            {submission.screenshot_url ? 'Screenshot Uploaded' : 'No Screenshot'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-white/60">
                                                        Stage: {submission.progress_stage.replace('_', ' ').toUpperCase()}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {submission.screenshot_url ? (
                                                    <a
                                                        href={submission.screenshot_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-400 hover:text-blue-300 underline text-sm"
                                                    >
                                                        View Screenshot
                                                    </a>
                                                ) : (
                                                    <span className="text-sm text-white/40">No Screenshot</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${submission.status === 'approved'
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