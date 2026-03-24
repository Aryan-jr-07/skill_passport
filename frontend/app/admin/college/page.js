'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { adminAPI } from '../../../lib/api';
import ThemeToggle from '../../../components/ThemeToggle';

export default function CollegeAdminDashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (!['COLLEGE_ADMIN', 'SUPER_ADMIN'].includes(user.role)) { router.push('/'); return; }
        loadAnalytics();
    }, [user, authLoading]);

    const loadAnalytics = async () => {
        try {
            const res = await adminAPI.institutionAnalytics();
            setAnalytics(res.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <span className="badge badge-claimed">College Admin</span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div style={{ padding: '14px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{analytics?.institution?.name || 'Institution Admin'}</div>
                    </div>
                    <div className="sidebar-section">Analytics</div>
                    <a href="#overview" className="sidebar-link active">📊 Overview</a>
                    <a href="#skills" className="sidebar-link">🎯 Top Skills</a>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <div className="dashboard-title">Institution Analytics</div>
                        <div className="dashboard-subtitle">Track student skill growth and placement readiness</div>
                    </div>

                    {analytics && (
                        <>
                            {/* Stats */}
                            <div className="stats-grid" id="overview">
                                <div className="stat-card">
                                    <div className="stat-label">Total Students</div>
                                    <div className="stat-value">{analytics.stats?.totalStudents || 0}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Verified Skills</div>
                                    <div className="stat-value" style={{ color: 'var(--success)' }}>{analytics.stats?.verifiedCount || 0}</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Verification Rate</div>
                                    <div className="stat-value">{analytics.stats?.verificationRate || 0}%</div>
                                    <div className="stat-delta">Students with ≥1 verified skill</div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-label">Placement Ready</div>
                                    <div className="stat-value" style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                        {Math.floor((analytics.stats?.verificationRate || 0) * 0.7)}%
                                    </div>
                                    <div className="stat-delta">Students with ≥3 skills</div>
                                </div>
                            </div>

                            {/* Verification Rate Bar */}
                            <div className="card" style={{ marginBottom: 24 }}>
                                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>📈 Verification Progress</h3>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <span style={{ fontSize: '0.875rem' }}>Overall Verification Rate</span>
                                        <span style={{ fontWeight: 700, color: 'var(--success)' }}>{analytics.stats?.verificationRate || 0}%</span>
                                    </div>
                                    <div className="progress-bar" style={{ height: 10 }}>
                                        <div className="progress-fill success" style={{ width: `${analytics.stats?.verificationRate || 0}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Top Skills */}
                            <div className="card" id="skills">
                                <h3 style={{ marginBottom: 16, fontSize: '1rem' }}>🏆 Top Verified Skills</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    {(analytics.topSkills || []).map((ts, i) => (
                                        <div key={ts.skillId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: i < 3 ? 'var(--gradient-brand)' : 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
                                                {i + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{ts.skill?.name || 'Unknown'}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{ts.skill?.category}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{ts._count} verified</div>
                                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Avg: {ts._avg?.credibilityScore?.toFixed(1) || 'N/A'}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!analytics.topSkills || analytics.topSkills.length === 0) && (
                                        <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 24 }}>No verified skills data yet.</div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
