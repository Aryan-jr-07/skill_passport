'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { adminAPI } from '../../../lib/api';
import ThemeToggle from '../../../components/ThemeToggle';

export default function SuperAdminDashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [data, setData] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [userSearch, setUserSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'SUPER_ADMIN') { router.push('/'); return; }
        loadDashboard();
    }, [user, authLoading]);

    const loadDashboard = async () => {
        try {
            const res = await adminAPI.dashboard();
            setData(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const loadUsers = async () => {
        setUsersLoading(true);
        try {
            const res = await adminAPI.users({ search: userSearch, role: roleFilter });
            setUsers(res.data.data.users);
        } catch (e) { console.error(e); }
        finally { setUsersLoading(false); }
    };

    useEffect(() => { if (activeTab === 'users') loadUsers(); }, [activeTab, userSearch, roleFilter]);

    const changeRole = async (userId, role) => {
        try {
            await adminAPI.updateUserRole(userId, role);
            loadUsers();
        } catch (e) { alert('Failed to update role'); }
    };

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    const tabs = ['overview', 'users', 'pending'];

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <span className="badge badge-verified">Super Admin</span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div style={{ padding: '14px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Super Admin</div>
                    </div>
                    <div className="sidebar-section">Controls</div>
                    {tabs.map(t => (
                        <button key={t} className={`sidebar-link ${activeTab === t ? 'active' : ''}`} onClick={() => setActiveTab(t)} style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                            {t === 'overview' ? '📊 Overview' : t === 'users' ? '👥 Users' : '⏳ Pending Skills'}
                        </button>
                    ))}
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <div className="dashboard-title">Super Admin Panel</div>
                        <div className="dashboard-subtitle">Platform-wide controls and analytics</div>
                    </div>

                    {activeTab === 'overview' && data && (
                        <>
                            <div className="stats-grid">
                                <div className="stat-card"><div className="stat-label">Total Users</div><div className="stat-value">{data.stats.totalUsers}</div></div>
                                <div className="stat-card"><div className="stat-label">Verified Skills</div><div className="stat-value" style={{ color: 'var(--success)' }}>{data.stats.verifiedSkills}</div></div>
                                <div className="stat-card"><div className="stat-label">Pending Reviews</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{data.stats.pendingReviews}</div></div>
                                <div className="stat-card"><div className="stat-label">Institutions</div><div className="stat-value">{data.stats.institutions}</div></div>
                            </div>

                            {/* Role Breakdown */}
                            <div className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>👥 User Role Distribution</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    {(data.roleBreakdown || []).map(r => (
                                        <div key={r.role} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 100, fontSize: '0.8rem', fontWeight: 600 }}>{r.role}</div>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className="progress-fill brand" style={{ width: `${(r._count / Math.max(...data.roleBreakdown.map(x => x._count))) * 100}%` }} />
                                            </div>
                                            <div style={{ fontSize: '0.875rem', fontWeight: 700, width: 40, textAlign: 'right' }}>{r._count}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Scoring Weights */}
                            <div className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 12, fontSize: '1rem' }}>⚖️ Credibility Score Formula</h3>
                                <div style={{ fontFamily: 'monospace', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 16px', color: 'var(--brand-purple-light)', fontSize: '0.875rem' }}>
                                    credibility = (test × {data.scoringWeights?.weightTest}) + (project × {data.scoringWeights?.weightProject}) + (reviewer × {data.scoringWeights?.weightReviewer})
                                    <br /><br />
                                    <span style={{ color: 'var(--text-muted)' }}>// Verified if credibility ≥ {data.scoringWeights?.verificationThreshold}</span>
                                </div>
                            </div>

                            {/* Recent Verifications */}
                            <div className="card">
                                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>✅ Recent Verifications</h3>
                                {(data.recentVerifications || []).slice(0, 5).map(v => (
                                    <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gradient-verified)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{v.user?.name?.[0]}</div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v.user?.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified: {v.skill?.name}</div>
                                        </div>
                                        <div style={{ marginLeft: 'auto' }}>
                                            <span className="badge badge-verified">Score: {v.credibilityScore?.toFixed(1)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {activeTab === 'users' && (
                        <>
                            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                                <input className="form-input" style={{ maxWidth: 280 }} placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
                                <select className="form-input" style={{ maxWidth: 180 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                                    <option value="">All Roles</option>
                                    {['STUDENT', 'REVIEWER', 'RECRUITER', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <button className="btn btn-primary" onClick={loadUsers}>Filter</button>
                            </div>
                            {usersLoading ? <div className="loading-center"><div className="spinner" /></div> : (
                                <div className="table-wrap">
                                    <table>
                                        <thead><tr><th>User</th><th>Role</th><th>Skills</th><th>Joined</th><th>Action</th></tr></thead>
                                        <tbody>
                                            {users.map(u => (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                                    </td>
                                                    <td><span className="badge badge-claimed">{u.role}</span></td>
                                                    <td>{u._count?.userSkills || 0}</td>
                                                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                                    <td>
                                                        <select value={u.role} className="form-input" style={{ padding: '4px 8px', fontSize: '0.78rem', maxWidth: 140 }} onChange={e => changeRole(u.id, e.target.value)}>
                                                            {['STUDENT', 'REVIEWER', 'RECRUITER', 'COLLEGE_ADMIN', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r}</option>)}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'pending' && (
                        <div className="card">
                            <h3 style={{ marginBottom: 12 }}>⏳ Skills Awaiting Final Moderation</h3>
                            <p style={{ fontSize: '0.875rem', marginBottom: 16 }}>These skills have completed all 3 verification layers and are ready for final admin review.</p>
                            <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 32 }}>Loading pending skills from API...</div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
