'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../lib/auth';
import { usersAPI } from '../../../lib/api';
import ThemeToggle from '../../../components/ThemeToggle';
import ProfileSettings from '../../../components/ProfileSettings';

const STATUS_LABELS = {
    CLAIMED: 'Claimed', TEST_PASSED: 'Test Passed', PROJECT_SUBMITTED: 'Project Submitted',
    REVIEW_PENDING: 'In Review', VERIFIED: 'Verified', REJECTED: 'Rejected',
};

export default function PublicPassportPage() {
    const params = useParams();
    const username = params.username;
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const isOwnProfile = user?.username === username;

    useEffect(() => {
        loadProfile();
    }, [username]);

    const loadProfile = async () => {
        try {
            const res = await usersAPI.getPublicPassport(username);
            setProfile(res.data.data);
        } catch (e) {
            if (e.response?.status === 404) setNotFound(true);
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) return <div className="loading-center" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

    if (notFound) return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontSize: '3rem' }}>🔍</div>
            <h2>Profile not found</h2>
            <p style={{ color: 'var(--text-secondary)' }}>@{username} hasn't created their Skill Passport yet.</p>
            <Link href="/register" className="btn btn-primary">Create Yours →</Link>
        </div>
    );

    const verifiedSkills = profile?.userSkills || [];
    const avgScore = verifiedSkills.length > 0
        ? (verifiedSkills.reduce((a, s) => a + (s.credibilityScore || 0), 0) / verifiedSkills.length).toFixed(1)
        : 0;

    const categories = [...new Set(verifiedSkills.map(s => s.skill.category))];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <button className="btn btn-secondary btn-sm" onClick={copyLink}>{copied ? '✓ Copied!' : '🔗 Share Passport'}</button>
                        <Link href="/register" className="btn btn-primary btn-sm">Get Your Passport</Link>
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            <div className="container" style={{ maxWidth: 860, padding: '40px 24px 80px' }}>
                {isOwnProfile && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                        <button className={`btn ${isEditing ? 'btn-secondary' : 'btn-primary'}`} onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel Edit' : '✏️ Edit Profile'}
                        </button>
                    </div>
                )}

                {isEditing ? (
                    <div style={{ marginBottom: 40 }}>
                        <ProfileSettings profile={profile} onUpdate={() => { loadProfile(); setIsEditing(false); }} />
                    </div>
                ) : (
                    <>
                        {/* Profile Header Block */}
                        <div className="card" style={{ padding: 0, marginBottom: 32, overflow: 'hidden', border: '1px solid var(--border)' }}>
                            {/* Cover Banner */}
                            <div style={{ height: 140, background: 'var(--gradient-brand)', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")', opacity: 0.5 }} />
                            </div>

                            {/* Profile Content */}
                            <div style={{ padding: '0 32px 32px', position: 'relative' }}>
                                <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                                    {/* Avatar */}
                                    <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--bg-card)', border: '4px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem', fontWeight: 900, marginTop: -60, position: 'relative', zIndex: 10, boxShadow: 'var(--shadow-md)', color: 'var(--brand-purple)' }}>
                                        {profile?.name?.[0] || '?'}
                                    </div>

                                    {/* Header Info */}
                                    <div style={{ flex: 1, paddingTop: 16 }}>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                                                    <h1 style={{ fontSize: '2rem', marginBottom: 0, letterSpacing: '-0.02em' }}>{profile?.name}</h1>
                                                    {avgScore > 0 && <span className="badge badge-verified" style={{ padding: '4px 12px', fontSize: '0.8rem' }}>✓ Verified Passport</span>}
                                                </div>
                                                <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: 12 }}>{profile?.headline || 'Skill Passport Member'}</div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div style={{ display: 'flex', gap: 10 }}>
                                                {profile?.githubUrl && <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">GitHub</a>}
                                                {profile?.linkedinUrl && <a href={profile.linkedinUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">LinkedIn</a>}
                                            </div>
                                        </div>

                                        {/* Meta Details */}
                                        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: 8 }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                @{profile?.username}
                                            </span>
                                            {profile?.location && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                    {profile.location}
                                                </span>
                                            )}
                                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                                                Joined {new Date(profile?.createdAt).toLocaleDateString('en', { month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bio */}
                                {profile?.bio && (
                                    <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                                        <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>About</h3>
                                        <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 700 }}>{profile.bio}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Summary Stats Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>🎯</div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{verifiedSkills.length}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 6, letterSpacing: '0.02em' }}>Verified Skills</div>
                                </div>
                            </div>

                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', right: -20, bottom: -20, width: 100, height: 100, background: 'var(--gradient-brand)', filter: 'blur(40px)', opacity: 0.15, pointerEvents: 'none' }} />
                                <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(124, 58, 237, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>⭐</div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, lineHeight: 1, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{avgScore > 0 ? avgScore : 'N/A'}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 6, letterSpacing: '0.02em' }}>Avg Credibility</div>
                                </div>
                            </div>

                            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '16px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' }}>📚</div>
                                <div>
                                    <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{categories.length}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginTop: 6, letterSpacing: '0.02em' }}>Skill Domains</div>
                                </div>
                            </div>
                        </div>

                        {/* Verified Skills List */}
                        <h3 style={{ fontSize: '1.25rem', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Verified Skill Transcript
                        </h3>

                        {verifiedSkills.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {verifiedSkills.map(us => (
                                    <div key={us.id} className="card card-hover" style={{ display: 'flex', alignItems: 'stretch', gap: 0, padding: 0, overflow: 'hidden' }}>
                                        {/* Skill Icon Area */}
                                        <div style={{ width: 100, background: 'var(--bg-elevated)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid var(--border)', padding: 16 }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: 8, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}>{us.skill?.icon || '⚡'}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, textAlign: 'center' }}>{us.skill?.category}</div>
                                        </div>

                                        {/* Skill Details Area */}
                                        <div style={{ flex: 1, padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                                            <div>
                                                <h4 style={{ fontSize: '1.25rem', marginBottom: 6, color: 'var(--text-primary)' }}>{us.skill?.name}</h4>
                                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }} />
                                                    Officially verified via standardized testing & expert review
                                                </div>
                                            </div>

                                            {/* Score Area */}
                                            <div style={{ textAlign: 'right', minWidth: 140 }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Credibility Score</div>
                                                <div style={{ fontFamily: 'Outfit', fontSize: '2.2rem', fontWeight: 900, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', lineHeight: 1 }}>
                                                    {us.credibilityScore.toFixed(1)}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                    Validation Date: {new Date(us.verifiedAt || us.updatedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="card" style={{ textAlign: 'center', padding: '64px 24px', background: 'var(--bg-elevated)', borderStyle: 'dashed' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}>📝</div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: 8 }}>No Verified Skills Yet</h3>
                                <p style={{ color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 24px' }}>
                                    {profile?.name.split(' ')[0]} hasn't completed any skill verifications on the platform yet. Check back later!
                                </p>
                            </div>
                        )}
                    </>
                )}

                {/* Trust Footer */}
                <div style={{ marginTop: 32, textAlign: 'center', padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                        🔒 All skills verified through standardized tests, real-world projects, and human expert review
                    </div>
                    <Link href="/" className="navbar-logo" style={{ fontSize: '0.95rem' }}>⚡ Skill Passport</Link>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>— Trusted Skill Infrastructure</span>
                </div>
            </div>
        </div>
    );
}
