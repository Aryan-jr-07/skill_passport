'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth';
import { projectsAPI } from '../../../../lib/api';
import ThemeToggle from '../../../../components/ThemeToggle';

export default function ProjectSubmitPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const skillId = params.skillId;

    const [form, setForm] = useState({ title: '', description: '', projectLink: '', repoLink: '', demoUrl: '', tags: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        if (user?.role !== 'STUDENT') { router.push('/'); return; }
    }, [user, authLoading]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
            await projectsAPI.submit({ skillId, title: form.title, description: form.description, projectLink: form.projectLink, repoLink: form.repoLink, demoUrl: form.demoUrl, tags });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || (!user && !authLoading)) return <div className="loading-center"><div className="spinner" /></div>;

    if (success) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ textAlign: 'center', maxWidth: 440 }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎯</div>
                    <h2 style={{ marginBottom: 8 }}>Project Submitted!</h2>
                    <p style={{ marginBottom: 24 }}>Your project has been assigned to a reviewer. You'll receive feedback once the expert evaluation is complete.</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <div style={{ display: 'flex', margin: '8px 0 16px', gap: 12, justifyContent: 'center' }}>
                            {['Test ✓', 'Project ✓', 'Review ⏳', 'Verify'].map((s, i) => (
                                <div key={s} style={{ textAlign: 'center' }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < 2 ? 'rgba(16,185,129,0.15)' : i === 2 ? 'rgba(245,158,11,0.15)' : 'var(--bg-elevated)', border: `2px solid ${i < 2 ? 'var(--success)' : i === 2 ? 'var(--warning)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, margin: '0 auto 4px', color: i < 2 ? 'var(--success)' : i === 2 ? 'var(--warning)' : 'var(--text-muted)' }}>
                                        {i < 2 ? '✓' : i === 2 ? '?' : i + 1}
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.split(' ')[0]}</div>
                                </div>
                            ))}
                        </div>
                        <Link href="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Link href="/dashboard" className="btn btn-ghost btn-sm">← Dashboard</Link>
                        <ThemeToggle />
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: 640, padding: '40px 24px' }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: '1.75rem', marginBottom: 8 }}>🛠️ Submit Your Project</h1>
                    <p>Showcase your real-world work. This will be reviewed by an expert using a structured rubric for complexity, quality, and originality.</p>
                </div>

                <div className="card">
                    {error && <div className="alert alert-error mb-4">{error}</div>}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        <div className="form-group">
                            <label className="form-label">Project Title *</label>
                            <input className="form-input" placeholder="e.g. Full-Stack E-Commerce App" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Description * (min. 50 chars)</label>
                            <textarea className="form-input" rows={5} placeholder="Describe what you built, the tech stack used, challenges solved, and key features implemented..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} required minLength={50} />
                            <div className="form-error" style={{ color: form.description.length < 50 ? 'var(--text-muted)' : 'var(--success)' }}>{form.description.length}/50 characters minimum</div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">GitHub Repository URL</label>
                            <input className="form-input" type="url" placeholder="https://github.com/yourusername/project" value={form.repoLink} onChange={e => setForm(p => ({ ...p, repoLink: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Live Demo URL</label>
                            <input className="form-input" type="url" placeholder="https://your-project.vercel.app" value={form.demoUrl} onChange={e => setForm(p => ({ ...p, demoUrl: e.target.value }))} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tags (comma-separated)</label>
                            <input className="form-input" placeholder="React, Node.js, PostgreSQL" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} />
                        </div>

                        <div className="card" style={{ background: 'var(--bg-elevated)', padding: '14px 16px' }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>📋 REVIEW RUBRIC</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                {[['Quality', '30%'], ['Complexity', '25%'], ['Originality', '20%'], ['Implementation', '25%']].map(([c, w]) => (
                                    <div key={c} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>• {c}: <span style={{ color: 'var(--brand-purple-light)', fontWeight: 600 }}>{w}</span></div>
                                ))}
                            </div>
                        </div>

                        <button className="btn btn-primary" type="submit" disabled={loading} style={{ justifyContent: 'center' }}>
                            {loading ? <><span className="spinner spinner-sm" /> Submitting...</> : '🚀 Submit for Expert Review'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
