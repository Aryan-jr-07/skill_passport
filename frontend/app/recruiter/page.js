'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { recruitersAPI } from '../../lib/api';
import ThemeToggle from '../../components/ThemeToggle';

function SearchResultCard({ candidate, onCompare, isSelected }) {
    const topSkill = candidate.verifiedSkills?.[0];
    return (
        <div className="card card-hover animate-fadeIn" style={{ border: isSelected ? '2px solid var(--brand-purple)' : undefined }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0 }}>
                    {candidate.name?.[0] || '?'}
                </div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{candidate.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{candidate.headline || 'Verified Developer'}</div>
                    {candidate.location && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📍 {candidate.location}</div>}
                </div>
            </div>

            {/* Verified Skills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {(candidate.verifiedSkills || []).map(vs => (
                    <div key={vs.skill.name} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-full)', padding: '3px 10px' }}>
                        <span className="badge-verified" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--success)', background: 'none', border: 'none', padding: 0 }}>✓</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{vs.skill.name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{vs.credibilityScore?.toFixed(0)}</span>
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
                <Link href={`/recruiter/candidate/${candidate.username}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>View Passport</Link>
                <button className={`btn btn-sm ${isSelected ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => onCompare(candidate.username)} style={{ whiteSpace: 'nowrap' }}>
                    {isSelected ? '✓ Selected' : '+ Compare'}
                </button>
            </div>
        </div>
    );
}

export default function RecruiterDashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ skill: '', minScore: '', maxScore: '', category: '' });
    const [compareList, setCompareList] = useState([]);
    const [total, setTotal] = useState(0);
    const [searched, setSearched] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'RECRUITER' && user.role !== 'SUPER_ADMIN') { router.push('/'); return; }
        search();
    }, [user, authLoading]);

    const search = async () => {
        setLoading(true); setSearched(true);
        try {
            const params = {};
            if (filters.skill) params.skill = filters.skill;
            if (filters.minScore) params.minScore = filters.minScore;
            if (filters.maxScore) params.maxScore = filters.maxScore;
            if (filters.category) params.category = filters.category;
            const res = await recruiterAPI.search(params);
            setCandidates(res.data.data.candidates);
            setTotal(res.data.data.total);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const toggleCompare = (username) => {
        setCompareList(prev => prev.includes(username) ? prev.filter(u => u !== username) : prev.length < 4 ? [...prev, username] : prev);
    };

    const handleCompare = () => {
        if (compareList.length < 2) { alert('Select at least 2 candidates to compare.'); return; }
        router.push(`/recruiter/compare?users=${compareList.join(',')}`);
    };

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <span className="badge badge-claimed">Recruiter Portal</span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div style={{ padding: '14px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recruiter</div>
                    </div>
                    <div className="sidebar-section">Navigation</div>
                    <a href="#" className="sidebar-link active">🔍 Search Talent</a>
                    {compareList.length > 0 && (
                        <div style={{ padding: '8px 14px' }}>
                            <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCompare}>
                                Compare ({compareList.length})
                            </button>
                        </div>
                    )}
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <div className="dashboard-title">Find Verified Talent</div>
                        <div className="dashboard-subtitle">Search only verified candidates — skills proven through tests, projects, and expert review</div>
                    </div>

                    {/* Filters */}
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <input className="form-input" style={{ maxWidth: 220 }} placeholder="Skill (e.g. React)" value={filters.skill} onChange={e => setFilters(p => ({ ...p, skill: e.target.value }))} />
                            <select className="form-input" style={{ maxWidth: 200 }} value={filters.category} onChange={e => setFilters(p => ({ ...p, category: e.target.value }))}>
                                <option value="">All Categories</option>
                                {['Programming', 'Frontend', 'Backend', 'Database', 'Data Science', 'DevOps', 'Computer Science', 'Architecture'].map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input className="form-input" style={{ maxWidth: 130 }} type="number" placeholder="Min Score" value={filters.minScore} onChange={e => setFilters(p => ({ ...p, minScore: e.target.value }))} min="0" max="100" />
                            <input className="form-input" style={{ maxWidth: 130 }} type="number" placeholder="Max Score" value={filters.maxScore} onChange={e => setFilters(p => ({ ...p, maxScore: e.target.value }))} min="0" max="100" />
                            <button className="btn btn-primary" onClick={search}>Search</button>
                        </div>
                    </div>

                    {compareList.length > 0 && (
                        <div className="alert alert-info" style={{ marginBottom: 16 }}>
                            <span>📊 {compareList.length} candidates selected for comparison</span>
                            <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={handleCompare}>Compare Now →</button>
                        </div>
                    )}

                    {loading ? <div className="loading-center"><div className="spinner" /></div> : (
                        <>
                            {searched && <div style={{ marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{total} verified candidates found</div>}
                            <div className="grid-3">
                                {candidates.map(c => <CandidateCard key={c.id} candidate={c} onCompare={toggleCompare} isSelected={compareList.includes(c.username)} />)}
                            </div>
                            {!loading && candidates.length === 0 && searched && (
                                <div style={{ textAlign: 'center', padding: 60, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                                    <p>No verified candidates found for your filters.</p>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}
