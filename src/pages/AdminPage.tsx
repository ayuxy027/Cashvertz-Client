import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SupabaseService } from '../service/supabaseService'
import logo from '../assets/logo-light.png'
import bgSvg from '../assets/bg.svg'

interface UserSelection {
    id: number;
    mobile_number: string;
    location_name: string;
    outlet_name: string;
    item_name: string;
    screenshot_url?: string;
    screenshot_uploaded_at?: string;
    selected_at: string;
    is_completed: boolean;
}

interface AdminStats {
    totalSelections: number;
    completedOrders: number;
    pendingOrders: number;
    totalLocations: number;
    totalOutlets: number;
    totalItems: number;
}

const AdminPage = () => {
    const navigate = useNavigate()
    const [selections, setSelections] = useState<UserSelection[]>([])
    const [stats, setStats] = useState<AdminStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            setError('')

            const [selectionsData, statsData] = await Promise.all([
                SupabaseService.getAllUserSelections(),
                SupabaseService.getAdminStats()
            ])

            setSelections(selectionsData)
            setStats(statsData)
        } catch (error) {
            console.error('Error loading admin data:', error)
            setError('Failed to load admin data. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const filteredSelections = selections.filter(selection => {
        if (filter === 'completed') {
            return selection.is_completed
        }
        if (filter === 'pending') {
            return !selection.is_completed
        }
        return true
    })

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatMobileNumber = (number: string) => {
        // Format as XXX-XXX-XXXX
        return number.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
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
                        <p className="text-white/80">Loading admin data...</p>
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
                        alt="CashVertz"
                        className="h-12 w-auto sm:h-16 cursor-pointer hover:opacity-80 transition-opacity duration-200"
                        loading="eager"
                        onClick={() => navigate('/')}
                    />
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="text-sm text-white/80 hover:text-white transition-colors"
                        >
                            ← Back to Home
                        </button>
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black text-sm font-semibold rounded-lg transition-colors"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-4 py-8 sm:px-6 sm:py-16 max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: '#66FFB2' }}>
                        Admin Dashboard
                    </h1>
                    <p className="text-white/80">View all user selections and uploaded screenshots</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-white">{stats.totalSelections}</div>
                            <div className="text-sm text-white/70">Total Selections</div>
                        </div>
                        <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-green-400">{stats.completedOrders}</div>
                            <div className="text-sm text-white/70">Completed</div>
                        </div>
                        <div className="bg-yellow-500/20 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</div>
                            <div className="text-sm text-white/70">Pending</div>
                        </div>
                        <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-400">{stats.totalLocations}</div>
                            <div className="text-sm text-white/70">Locations</div>
                        </div>
                        <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-purple-400">{stats.totalOutlets}</div>
                            <div className="text-sm text-white/70">Outlets</div>
                        </div>
                        <div className="bg-pink-500/20 backdrop-blur-sm rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-pink-400">{stats.totalItems}</div>
                            <div className="text-sm text-white/70">Items</div>
                        </div>
                    </div>
                )}

                {/* Filter Buttons */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                            ? 'bg-green-500 text-black'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                    >
                        All ({selections.length})
                    </button>
                    <button
                        onClick={() => setFilter('completed')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'completed'
                            ? 'bg-green-500 text-black'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                    >
                        Completed ({selections.filter(s => s.is_completed).length})
                    </button>
                    <button
                        onClick={() => setFilter('pending')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'pending'
                            ? 'bg-green-500 text-black'
                            : 'bg-white/10 text-white/80 hover:bg-white/20'
                            }`}
                    >
                        Pending ({selections.filter(s => !s.is_completed).length})
                    </button>
                </div>

                {/* Selections Table */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Mobile</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Location</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Outlet</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Item</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Status</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Screenshot</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/80">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredSelections.map((selection) => (
                                    <tr key={selection.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-sm text-white">
                                            {formatMobileNumber(selection.mobile_number)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/90">
                                            {selection.location_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/90">
                                            {selection.outlet_name}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/90">
                                            {selection.item_name}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selection.is_completed
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                                }`}>
                                                {selection.is_completed ? 'Completed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            {selection.screenshot_url ? (
                                                <div className="flex items-center gap-2">
                                                    <img
                                                        src={selection.screenshot_url}
                                                        alt="Screenshot"
                                                        className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform"
                                                        onClick={() => window.open(selection.screenshot_url, '_blank')}
                                                    />
                                                    <button
                                                        onClick={() => window.open(selection.screenshot_url, '_blank')}
                                                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-white/50 text-sm">No screenshot</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-white/70">
                                            {formatDate(selection.selected_at)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredSelections.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-white/60">No selections found for the selected filter.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminPage
