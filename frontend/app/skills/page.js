'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import { skillsAPI } from '../../lib/api';
import ThemeToggle from '../../components/ThemeToggle';

export default function SkillsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [skills, setSkills] = useState([]);
    const [categories, setCategories] = useState([]);
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState({});
    const [claimedSkills, setClaimedSkills] = useState(new Set());

    useEffect(() => {
        loadData();
        if (user?.role === 'STUDENT') loadUserSkills();
    }, [user, search, selectedCategory]);

    const loadData = async () => {
        try {
            const [skillsRes, catRes] = await Promise.all([
                skillsAPI.list({ search, category: selectedCategory }),
                skillsAPI.getCategories(),
            ]);
            setSkills(skillsRes.data.data.skills);
            setCategories(catRes.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadUserSkills = async () => {
        try {
            const res = await skillsAPI.mySkills();
            setClaimedSkills(new Set(res.data.data.map(s => s.skillId)));
        } catch { }
    };

    const claimSkill = async (skillId) => {
        if (!user) { router.push('/login'); return; }
        setClaiming(p => ({ ...p, [skillId]: true }));
        try {
            await skillsAPI.claim(skillId);
            setClaimedSkills(p => new Set([...p, skillId]));
            router.push('/dashboard');
        } catch (e) {
            alert(e.response?.data?.message || 'Failed to claim skill');
        } finally {
            setClaiming(p => ({ ...p, [skillId]: false }));
        }
    };

    return (
        <div className="page-wrapper">
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 8px' }} />
                        {user ? (
                            <Link href="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
                        ) : (
                            <Link href="/login" className="btn btn-primary btn-sm">Sign In / Register</Link>
                        )}
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ padding: '40px 24px' }}>
                <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>Browse Skills</h1>
                    <p>Claim a skill to start the 3-layer verification process and get it added to your Skill Passport.</p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
                    <input className="form-input" style={{ maxWidth: 320 }} placeholder="🔍 Search skills..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className="form-input" style={{ maxWidth: 200 }} value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                        <option value="">All Categories</option>
                        {categories.map(c => <option key={c.category} value={c.category}>{c.category} ({c._count})</option>)}
                    </select>
                </div>

                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : (
                    <div className="grid-4">
                        {skills.map(skill => {
                            const isClaimed = claimedSkills.has(skill.id);
                            return (
                                <div key={skill.id} className="card card-hover animate-fadeIn">
                                    <div className="skill-icon">{skill.icon || '⚡'}</div>
                                    <div className="skill-name">{skill.name}</div>
                                    <div className="skill-category">{skill.category}</div>
                                    <p style={{ fontSize: '0.8rem', marginTop: 8, marginBottom: 14, lineHeight: 1.6 }}>{skill.description}</p>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                                        {(skill.tags || []).slice(0, 3).map(tag => (
                                            <span key={tag} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>{tag}</span>
                                        ))}
                                    </div>
                                    {isClaimed ? (
                                        <span className="badge badge-claimed" style={{ width: '100%', justifyContent: 'center' }}>✓ Claimed</span>
                                    ) : (
                                        <button className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} disabled={claiming[skill.id]} onClick={() => claimSkill(skill.id)}>
                                            {claiming[skill.id] ? 'Claiming...' : 'Claim Skill →'}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && skills.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
                        <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
                        <p>No skills found for your search.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
