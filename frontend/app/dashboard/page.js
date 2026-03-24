'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { skillsAPI, testsAPI, projectsAPI, usersAPI } from '../../lib/api';
import ThemeToggle from '../../components/ThemeToggle';
import ProfileSettings from '../../components/ProfileSettings';
import { Award, BarChart2, Activity, CheckCircle } from 'lucide-react';

const STATUS_STEPS = [
    { key: 'CLAIMED', label: 'Test', icon: '📝' },
    { key: 'TEST_PASSED', label: 'Project', icon: '🛠️' },
    { key: 'REVIEW_PENDING', label: 'Review', icon: '👥' },
    { key: 'VERIFIED', label: 'Verified', icon: '✅' },
];

function getStepIndex(status) {
    const map = { CLAIMED: 0, TEST_PASSED: 1, PROJECT_SUBMITTED: 1, REVIEW_PENDING: 2, VERIFIED: 3, REJECTED: 0 };
    return map[status] ?? 0;
}

function StatusBadge({ status }) {
    const map = { CLAIMED: 'badge-claimed', TEST_PASSED: 'badge-test-passed', PROJECT_SUBMITTED: 'badge-pending', REVIEW_PENDING: 'badge-pending', VERIFIED: 'badge-verified', REJECTED: 'badge-rejected' };
    const labels = { CLAIMED: 'Claimed', TEST_PASSED: 'Test Passed', PROJECT_SUBMITTED: 'Project Submitted', REVIEW_PENDING: 'In Review', VERIFIED: 'Verified ✓', REJECTED: 'Rejected' };
    return <span className={`badge ${map[status] || 'badge-claimed'}`}>{labels[status] || status}</span>;
}

function SkillCard({ us, onAction }) {
    const stepIdx = getStepIndex(us.status);
    const score = us.credibilityScore || 0;

    return (
        <div className="skill-card animate-fadeIn">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{us.skill.icon || '⚡'}</div>
                    <div className="skill-name">{us.skill.name}</div>
                    <div className="skill-category">{us.skill.category}</div>
                </div>
                <StatusBadge status={us.status} />
            </div>

            {/* Credibility Score */}
            {us.status === 'VERIFIED' && (
                <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>CREDIBILITY SCORE</span>
                        <span className="credibility-score" style={{ fontSize: '1.5rem' }}>{score.toFixed(1)}</span>
                    </div>
                    <div className="progress-bar">
                        <div className="progress-fill success" style={{ width: `${score}%` }} />
                    </div>
                </div>
            )}

            {/* Pipeline Steps */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {STATUS_STEPS.map((s, i) => (
                    <div key={s.key} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= stepIdx ? 'var(--gradient-brand)' : 'var(--border)', transition: 'all 0.3s' }} />
                ))}
            </div>

            {/* CTA */}
            {us.status === 'CLAIMED' && (
                <Link href={`/dashboard/test/${us.skill.id}`} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Take Test →</Link>
            )}
            {us.status === 'TEST_PASSED' && (
                <Link href={`/dashboard/project/${us.skill.id}`} className="btn btn-success btn-sm" style={{ width: '100%', justifyContent: 'center' }}>Submit Project →</Link>
            )}
            {us.status === 'REVIEW_PENDING' && (
                <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>⏳ Awaiting expert review...</div>
            )}
            {us.status === 'VERIFIED' && (
                <div style={{ display: 'flex', gap: 8 }}>
                    <Link href={`/p/${us.user?.username || 'me'}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>View Passport</Link>
                    <Link href={`/dashboard/test/${us.skill.id}`} className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }}>Re-verify</Link>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [userSkills, setUserSkills] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('passport');

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'STUDENT') { router.push('/'); return; }
        loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            const [skillsRes, profileRes] = await Promise.all([
                skillsAPI.mySkills(),
                usersAPI.getProfile(),
            ]);
            setUserSkills(skillsRes.data.data);
            setProfile(profileRes.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    const verifiedSkills = userSkills.filter(s => s.status === 'VERIFIED');
    const pendingSkills = userSkills.filter(s => s.status !== 'VERIFIED');
    const avgScore = verifiedSkills.length > 0 ? (verifiedSkills.reduce((a, s) => a + s.credibilityScore, 0) / verifiedSkills.length).toFixed(1) : 0;

    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <Link href="/skills" className="nav-link">Browse Skills</Link>
                        <Link href={`/p/${user.username}`} className="nav-link">My Profile</Link>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div style={{ padding: '12px 14px', marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', marginBottom: 8, overflow: 'hidden', color: 'var(--brand-purple)' }}>
                            {profile?.avatar ? <img src={profile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user.name[0]}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{user.username}</div>
                    </div>
                    <div className="sidebar-section">Navigation</div>
                    {[
                        { href: '/dashboard', label: 'My Passport', icon: '🎫', tab: 'passport' },
                        { href: '/skills', label: 'Browse Skills', icon: '🔍' },
                        { href: `/p/${user.username}`, label: 'Public Profile', icon: '🌐' },
                        { href: '#settings', label: 'Profile Settings', icon: '⚙️', tab: 'settings' },
                    ].map(item => (
                        <Link key={item.label} href={item.href} className={`sidebar-link ${activeTab === item.tab ? 'active' : ''}`} onClick={() => item.tab && setActiveTab(item.tab)}>
                            <span>{item.icon}</span> {item.label}
                        </Link>
                    ))}
                </aside>

                {/* Main */}
                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                            <div>
                                <div className="dashboard-title">Welcome back, {user.name.split(' ')[0]} 👋</div>
                                <div className="dashboard-subtitle">Your verified skill identity is growing.</div>
                            </div>
                            <Link href="/skills" className="btn btn-primary">+ Claim New Skill</Link>
                        </div>
                    </div>

                    {/* Settings Tab */}
                    {activeTab === 'settings' && profile && (
                        <div style={{ marginBottom: 40 }}>
                            <ProfileSettings profile={profile} onUpdate={loadData} />
                        </div>
                    )}

                    {activeTab === 'passport' && (
                        <>
                            {/* Stats */}
                            <div className="stats-grid">
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-label" style={{ marginBottom: 0 }}>Verified Skills</div>
                                        <Award size={20} color="var(--success)" style={{ opacity: 0.8 }} />
                                    </div>
                                    <div className="stat-value" style={{ background: 'var(--gradient-verified)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{verifiedSkills.length}</div>
                                    <div className="stat-delta" style={{ opacity: 0.8 }}>✓ Fully validated</div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-label" style={{ marginBottom: 0 }}>Avg Credibility</div>
                                        <BarChart2 size={20} color="var(--brand-purple)" style={{ opacity: 0.8 }} />
                                    </div>
                                    <div className="stat-value">{avgScore}</div>
                                    <div className="stat-delta" style={{ opacity: 0.8 }}>Out of 100</div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-label" style={{ marginBottom: 0 }}>In Progress</div>
                                        <Activity size={20} color="var(--warning)" style={{ opacity: 0.8 }} />
                                    </div>
                                    <div className="stat-value">{pendingSkills.length}</div>
                                    <div className="stat-delta" style={{ opacity: 0.8 }}>Verification pending</div>
                                </div>
                                <div className="stat-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <div className="stat-label" style={{ marginBottom: 0 }}>Total Skills</div>
                                        <CheckCircle size={20} color="var(--brand-blue)" style={{ opacity: 0.8 }} />
                                    </div>
                                    <div className="stat-value">{userSkills.length}</div>
                                    <div className="stat-delta" style={{ opacity: 0.8 }}>Claimed & verified</div>
                                </div>
                            </div>

                            {/* Verified Skills */}
                            {verifiedSkills.length > 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                        <h3 style={{ fontSize: '1.1rem' }}>✅ Verified Skills</h3>
                                        <Link href={`/p/${user.username}`} className="btn btn-secondary btn-sm">View Public Passport</Link>
                                    </div>
                                    <div className="grid-3">
                                        {verifiedSkills.map(us => <SkillCard key={us.id} us={{ ...us, user }} />)}
                                    </div>
                                </div>
                            )}

                            {/* In Progress */}
                            {pendingSkills.length > 0 && (
                                <div style={{ marginBottom: 28 }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>⏳ In Progress</h3>
                                    <div className="grid-3">
                                        {pendingSkills.map(us => <SkillCard key={us.id} us={{ ...us, user }} />)}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {userSkills.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🎫</div>
                                    <h3 style={{ marginBottom: 8 }}>Start your Skill Passport</h3>
                                    <p style={{ marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>Claim your first skill and begin the 3-layer verification journey. Your verified skills are permanent.</p>
                                    <Link href="/skills" className="btn btn-primary btn-lg">Browse Skills →</Link>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
