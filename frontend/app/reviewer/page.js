'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { reviewsAPI } from '../../lib/api';
import ThemeToggle from '../../components/ThemeToggle';

function ReviewCard({ review, onSubmit }) {
    const [form, setForm] = useState({ qualityScore: 70, complexityScore: 70, originalityScore: 70, implementationScore: 70, feedback: '', status: 'APPROVED' });
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(review.status !== 'PENDING');

    const overallPreview = Math.round(form.qualityScore * 0.30 + form.complexityScore * 0.25 + form.originalityScore * 0.20 + form.implementationScore * 0.25);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await reviewsAPI.submit(review.id, form);
            setDone(true);
            onSubmit?.();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fadeIn" style={{ marginBottom: 20 }}>
            {/* Project Info */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                    {review.project?.user?.name?.[0] || '?'}
                </div>
                <div>
                    <div style={{ fontWeight: 700 }}>{review.project?.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>by {review.project?.user?.name} · {review.project?.skill?.name} ({review.project?.skill?.category})</div>
                </div>
                <div style={{ marginLeft: 'auto' }}>
                    <span className={`badge badge-${done ? (review.status === 'APPROVED' ? 'verified' : 'rejected') : 'pending'}`}>
                        {done ? review.status : 'PENDING'}
                    </span>
                </div>
            </div>

            {/* Project Description */}
            <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 16 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>PROJECT DESCRIPTION</div>
                <p style={{ fontSize: '0.875rem' }}>{review.project?.description}</p>
                <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    {review.project?.repoLink && <a href={review.project.repoLink} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">📦 GitHub</a>}
                    {review.project?.demoUrl && <a href={review.project.demoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">🌐 Live Demo</a>}
                </div>
            </div>

            {done ? (
                <div className="alert alert-success">✅ Review submitted. Overall Score: <strong>{review.overallScore?.toFixed(1) || overallPreview}</strong>/100</div>
            ) : (
                <form onSubmit={handleSubmit}>
                    {/* Rubric Sliders */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Evaluation Rubric</div>
                        {[
                            { label: 'Code Quality', key: 'qualityScore', weight: '30%' },
                            { label: 'Complexity', key: 'complexityScore', weight: '25%' },
                            { label: 'Originality', key: 'originalityScore', weight: '20%' },
                            { label: 'Implementation', key: 'implementationScore', weight: '25%' },
                        ].map(r => (
                            <div key={r.key} style={{ marginBottom: 14 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{r.label} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({r.weight})</span></span>
                                    <span style={{ fontFamily: 'Outfit', fontWeight: 700, color: 'var(--brand-purple-light)' }}>{form[r.key]}</span>
                                </div>
                                <input type="range" min="0" max="100" value={form[r.key]} style={{ width: '100%', accentColor: 'var(--brand-purple)' }}
                                    onChange={e => setForm(p => ({ ...p, [r.key]: parseInt(e.target.value) }))} />
                            </div>
                        ))}
                        <div style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Overall Score</span>
                            <span style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: 900, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{overallPreview}/100</span>
                        </div>
                    </div>

                    {/* Feedback */}
                    <div className="form-group" style={{ marginBottom: 16 }}>
                        <label className="form-label">Written Feedback</label>
                        <textarea className="form-input" rows={4} placeholder="Provide constructive feedback on the project quality, areas for improvement, and notable strengths..." value={form.feedback} onChange={e => setForm(p => ({ ...p, feedback: e.target.value }))} />
                    </div>

                    {/* Decision */}
                    <div style={{ display: 'flex', gap: 10 }}>
                        {['APPROVED', 'REVISION_REQUESTED', 'REJECTED'].map(s => (
                            <button key={s} type="button" className={`btn btn-sm ${form.status === s ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ flex: 1, justifyContent: 'center', background: form.status === s ? (s === 'APPROVED' ? 'var(--gradient-verified)' : s === 'REJECTED' ? 'rgba(239,68,68,0.15)' : undefined) : undefined }}
                                onClick={() => setForm(p => ({ ...p, status: s }))}>
                                {s === 'APPROVED' ? '✅ Approve' : s === 'REVISION_REQUESTED' ? '🔄 Revise' : '❌ Reject'}
                            </button>
                        ))}
                    </div>

                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
                        {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : 'Submit Review'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ReviewerDashboard() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user.role !== 'REVIEWER') { router.push('/'); return; }
        loadData();
    }, [user, authLoading]);

    const loadData = async () => {
        try {
            const [revRes, statsRes] = await Promise.all([reviewsAPI.assigned(), reviewsAPI.reviewerStats()]);
            setReviews(revRes.data.data);
            setStats(statsRes.data.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    const pending = reviews.filter(r => r.status === 'PENDING');
    const completed = reviews.filter(r => r.status !== 'PENDING');

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <span className="badge badge-claimed">Reviewer Panel</span>
                        <button className="btn btn-ghost btn-sm" onClick={logout}>Sign Out</button>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="dashboard-layout">
                <aside className="sidebar">
                    <div style={{ padding: '14px', marginBottom: 8 }}>
                        <div style={{ fontWeight: 700 }}>{user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Expert Reviewer</div>
                        {stats && <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <div className="badge badge-verified">⭐ {stats.credibilityRating?.toFixed(1)}</div>
                            <div className="badge badge-claimed">{stats.totalReviews} reviews</div>
                        </div>}
                    </div>
                    <div className="sidebar-section">Dashboard</div>
                    <a href="#pending" className="sidebar-link active">📋 Pending Reviews</a>
                    <a href="#completed" className="sidebar-link">✅ Completed</a>
                </aside>

                <main className="dashboard-main">
                    <div className="dashboard-header">
                        <div className="dashboard-title">Reviewer Dashboard</div>
                        <div className="dashboard-subtitle">Evaluate projects and validate real-world skills</div>
                    </div>

                    {/* Stats */}
                    <div className="stats-grid" style={{ marginBottom: 28 }}>
                        <div className="stat-card"><div className="stat-label">Pending</div><div className="stat-value" style={{ color: 'var(--warning)' }}>{pending.length}</div></div>
                        <div className="stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color: 'var(--success)' }}>{completed.length}</div></div>
                        <div className="stat-card"><div className="stat-label">Credibility</div><div className="stat-value">{stats?.credibilityRating?.toFixed(1) || '5.0'} ⭐</div></div>
                        <div className="stat-card"><div className="stat-label">Total Reviews</div><div className="stat-value">{stats?.totalReviews || 0}</div></div>
                    </div>

                    {/* Pending Reviews */}
                    <div id="pending" style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>📋 Pending Reviews ({pending.length})</h3>
                        {pending.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 40, background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                                🎉 No pending reviews. Check back later!
                            </div>
                        ) : (
                            pending.map(r => <ReviewCard key={r.id} review={r} onSubmit={loadData} />)
                        )}
                    </div>

                    {/* Completed */}
                    {completed.length > 0 && (
                        <div id="completed">
                            <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>✅ Completed ({completed.length})</h3>
                            {completed.map(r => <ReviewCard key={r.id} review={r} />)}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
