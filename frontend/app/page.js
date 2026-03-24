'use client';
import Link from 'next/link';
import { useAuth } from '../lib/auth';
import ThemeToggle from '../components/ThemeToggle';

const features = [
    { icon: '🧪', title: 'Standardized Tests', desc: 'Adaptive multi-level assessments that validate conceptual knowledge across 100+ skills.' },
    { icon: '🛠️', title: 'Real-World Projects', desc: 'Submit GitHub repos, demos, and files. Evaluated on quality, complexity, and originality.' },
    { icon: '👥', title: 'Human Expert Review', desc: 'Vetted industry experts review your work using structured rubrics for authentic validation.' },
    { icon: '📊', title: 'Credibility Score', desc: 'A weighted score combining test results, project quality, and reviewer feedback.' },
    { icon: '🌐', title: 'Public Passport', desc: 'Share a verified, living skill passport link instead of a static resume.' },
    { icon: '🔒', title: 'Trusted by Recruiters', desc: 'Verified skills — not self-declared claims. Recruiters search only verified talent.' },
];

const steps = [
    { num: '01', title: 'Claim a Skill', desc: 'Choose from 100+ skills across programming, design, data science, and more.' },
    { num: '02', title: 'Pass the Test', desc: 'Complete an adaptive standardized assessment tailored to your skill claim.' },
    { num: '03', title: 'Submit Your Project', desc: 'Showcase real-world work: GitHub, demos, or uploaded files.' },
    { num: '04', title: 'Expert Review', desc: 'A vetted industry expert evaluates your project using a structured rubric.' },
    { num: '05', title: 'Get Verified', desc: 'Your Skill Credibility Score is calculated. If it meets the threshold — you are verified.' },
];

export default function Home() {
    const { user } = useAuth();

    const getDashboardLink = () => {
        if (!user) return '/login';
        const map = { STUDENT: '/dashboard', REVIEWER: '/reviewer', RECRUITER: '/recruiter', COLLEGE_ADMIN: '/admin/college', SUPER_ADMIN: '/admin/super' };
        return map[user.role] || '/dashboard';
    };

    return (
        <div className="page-wrapper">
            {/* Navbar */}
            <nav className="navbar">
                <div className="container navbar-inner">
                    <Link href="/" className="navbar-logo">⚡ Skill Passport</Link>
                    <div className="navbar-nav">
                        <Link href="/skills" className="nav-link">Browse Skills</Link>
                        {user ? (
                            <Link href={getDashboardLink()} className="btn btn-primary btn-sm">Dashboard</Link>
                        ) : (
                            <>
                                <Link href="/login" className="nav-link">Sign In</Link>
                                <Link href="/register" className="btn btn-primary btn-sm">Get Started</Link>
                            </>
                        )}
                        <div style={{ marginLeft: 8 }}><ThemeToggle /></div>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section style={{ padding: '100px 0 80px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '20%', left: '10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '30%', right: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="container" style={{ textAlign: 'center', position: 'relative' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 'var(--radius-full)', padding: '6px 16px', marginBottom: 24 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--brand-purple-light)', fontWeight: 600 }}>🚀 The Credit Score for Skills</span>
                    </div>
                    <h1 style={{ marginBottom: 24, lineHeight: 1.1 }}>
                        Your Skills,{' '}
                        <span style={{ background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            Verified for Life
                        </span>
                    </h1>
                    <p style={{ maxWidth: 640, margin: '0 auto 40px', fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        Skill Passport is the trusted infrastructure for skill credibility. Validate your abilities through standardized tests, real-world projects, and expert human review — then own a living, verified proof of who you are.
                    </p>
                    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Link href={user ? getDashboardLink() : '/register'} className="btn btn-primary btn-lg">
                            {user ? 'Go to Dashboard →' : 'Build Your Passport →'}
                        </Link>
                        <Link href="/skills" className="btn btn-secondary btn-lg">Explore Skills</Link>
                    </div>

                    {/* Hero Stats */}
                    <div style={{ display: 'flex', gap: 48, justifyContent: 'center', marginTop: 64, flexWrap: 'wrap' }}>
                        {[['10,000+', 'Verified Devs'], ['100+', 'Skills Available'], ['3-Layer', 'Validation System'], ['98%', 'Employer Trust Rate']].map(([val, label]) => (
                            <div key={label} style={{ textAlign: 'center' }}>
                                <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 900, background: 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{val}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2>Why Skill Passport?</h2>
                        <p style={{ marginTop: 12, maxWidth: 520, margin: '12px auto 0' }}>Not a portfolio. Not a certificate. A verified proof of competence.</p>
                    </div>
                    <div className="grid-3">
                        {features.map(f => (
                            <div key={f.title} className="card card-hover animate-fadeIn">
                                <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                                <h3 style={{ fontSize: '1.05rem', marginBottom: 8 }}>{f.title}</h3>
                                <p style={{ fontSize: '0.875rem', lineHeight: 1.7 }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section style={{ padding: '80px 0', background: 'var(--bg-secondary)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: 56 }}>
                        <h2>The 3-Layer Verification Engine</h2>
                        <p style={{ marginTop: 12 }}>Every verified skill passes through a rigorous, multi-source validation process.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 0, position: 'relative', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {steps.map((step, i) => (
                            <div key={step.num} style={{ flex: '0 0 180px', textAlign: 'center', padding: '0 12px', position: 'relative' }}>
                                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', border: '2px solid rgba(124,58,237,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontFamily: 'Outfit', fontWeight: 900, fontSize: '1rem', color: 'var(--brand-purple-light)' }}>
                                    {step.num}
                                </div>
                                {i < steps.length - 1 && <div style={{ position: 'absolute', top: 28, left: 'calc(60% + 15px)', width: 'calc(40% + 9px)', height: 2, background: 'linear-gradient(to right, rgba(124,58,237,0.4), rgba(37,99,235,0.4))', display: 'block' }} />}
                                <h3 style={{ fontSize: '0.95rem', marginBottom: 8 }}>{step.title}</h3>
                                <p style={{ fontSize: '0.8rem', lineHeight: 1.6 }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section style={{ padding: '80px 0', textAlign: 'center' }}>
                <div className="container">
                    <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(37,99,235,0.1))', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 'var(--radius-xl)', padding: '60px 40px' }}>
                        <h2 style={{ marginBottom: 16 }}>Ready to prove what you know?</h2>
                        <p style={{ marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>Join thousands of developers building a verified professional identity that lasts a lifetime.</p>
                        <Link href={user ? getDashboardLink() : '/register'} className="btn btn-primary btn-lg">
                            Start Building Your Passport →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="navbar-logo" style={{ marginBottom: 8 }}>⚡ Skill Passport</div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>© 2026 Skill Passport. All rights reserved. Lifelong verified skill identity.</p>
                </div>
            </footer>
        </div>
    );
}
