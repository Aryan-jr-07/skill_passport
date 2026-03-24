'use client';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../lib/auth';
import ThemeToggle from '../../components/ThemeToggle';

const roles = [
    { id: 'STUDENT', label: 'Student / Developer' },
    { id: 'REVIEWER', label: 'Expert Reviewer' },
    { id: 'RECRUITER', label: 'Recruiter' },
    { id: 'COLLEGE_ADMIN', label: 'Institution Admin' },
];

function AuthContent() {
    const { login, register } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check if we navigated here via /register
    const initialMode = searchParams.get('mode') === 'register';
    const [isSignUp, setIsSignUp] = useState(initialMode);

    // Forms
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', role: 'STUDENT', companyName: '' });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setIsSignUp(searchParams.get('mode') === 'register');
    }, [searchParams]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const user = await login(loginForm.email, loginForm.password);
            const redirect = { STUDENT: '/dashboard', REVIEWER: '/reviewer', RECRUITER: '/recruiter', COLLEGE_ADMIN: '/admin/college', SUPER_ADMIN: '/admin/super' };
            router.push(redirect[user.role] || '/dashboard');
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Network error. Please check your connection or CORS settings.');
            } else {
                setError(err.response?.data?.message || 'Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const user = await register(registerForm);
            const redirect = { STUDENT: '/dashboard', REVIEWER: '/reviewer', RECRUITER: '/recruiter', COLLEGE_ADMIN: '/admin/college' };
            router.push(redirect[user.role] || '/dashboard');
        } catch (err) {
            if (err.code === 'ERR_NETWORK') {
                setError('Network error. Please check your connection or CORS settings.');
            } else {
                setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const togglePanel = () => {
        setError('');
        setIsSignUp(!isSignUp);
        // Optional: Update URL without full reload (shallow)
        router.push(isSignUp ? '/login' : '/login?mode=register', { scroll: false });
    };

    return (
        <div className="auth-page-wrapper">
            <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 1000 }}>
                <ThemeToggle />
            </div>
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>

                {/* Sign Up Form */}
                <div className="form-container sign-up-container">
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h2 style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--text-primary)' }}>Create Account</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>Join the verifiable skill ecosystem</p>

                        {error && isSignUp && <div className="alert alert-error mb-4" style={{ width: '100%' }}>{error}</div>}

                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="form-label">Full Name</label>
                            <input className="form-input" placeholder="Alex Johnson" required value={registerForm.name} onChange={e => setRegisterForm({ ...registerForm, name: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="you@example.com" required value={registerForm.email} onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" placeholder="Min. 8 characters" required minLength={8} value={registerForm.password} onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="form-label">I am a...</label>
                            <select className="form-input" value={registerForm.role} onChange={e => setRegisterForm({ ...registerForm, role: e.target.value })}>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                            </select>
                        </div>
                        {registerForm.role === 'RECRUITER' && (
                            <div className="form-group" style={{ width: '100%' }}>
                                <label className="form-label">Company Name</label>
                                <input className="form-input" placeholder="Your company" required value={registerForm.companyName} onChange={e => setRegisterForm({ ...registerForm, companyName: e.target.value })} />
                            </div>
                        )}

                        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}>
                            {loading ? <span className="spinner spinner-sm" /> : 'Sign Up'}
                        </button>

                        <p className="mobile-toggle" style={{ marginTop: 24, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Already have an account? <span onClick={togglePanel} style={{ color: 'var(--brand-purple-light)', cursor: 'pointer', fontWeight: 600 }}>Sign In</span>
                        </p>
                    </form>
                </div>

                {/* Sign In Form */}
                <div className="form-container sign-in-container">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <Link href="/" className="navbar-logo" style={{ fontSize: '1.5rem', marginBottom: 24, alignSelf: 'flex-start' }}>⚡ Skill Passport</Link>

                        <div style={{ alignSelf: 'flex-start', marginBottom: 24 }}>
                            <h2 style={{ fontSize: '2rem', marginBottom: 8, color: 'var(--text-primary)' }}>Welcome Back</h2>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in to your verified skill identity</p>
                        </div>

                        {error && !isSignUp && <div className="alert alert-error mb-4" style={{ width: '100%' }}>{error}</div>}

                        <div className="form-group" style={{ width: '100%' }}>
                            <label className="form-label">Email</label>
                            <input className="form-input" type="email" placeholder="you@example.com" required value={loginForm.email} onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} />
                        </div>
                        <div className="form-group" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="form-label">Password</label>
                                <a href="#" style={{ fontSize: '0.75rem', color: 'var(--brand-purple-light)' }}>Forgot password?</a>
                            </div>
                            <input className="form-input" type="password" placeholder="••••••••" required value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} />
                        </div>

                        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', marginTop: 12, padding: '12px' }}>
                            {loading ? <span className="spinner spinner-sm" /> : 'Log In'}
                        </button>

                        {/* Demo Accounts */}
                        <div style={{ width: '100%', marginTop: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DEMO ACCOUNTS</span>
                                <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLoginForm({ email: 'student@skillpassport.dev', password: 'Test1234!' })}>Student</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLoginForm({ email: 'reviewer@skillpassport.dev', password: 'Test1234!' })}>Reviewer</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLoginForm({ email: 'recruiter@skillpassport.dev', password: 'Test1234!' })}>Recruiter</button>
                                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setLoginForm({ email: 'admin@skillpassport.dev', password: 'Test1234!' })}>Admin</button>
                            </div>
                        </div>

                        <p className="mobile-toggle" style={{ marginTop: 32, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                            Don't have an account? <span onClick={togglePanel} style={{ color: 'var(--brand-purple-light)', cursor: 'pointer', fontWeight: 600 }}>Sign Up</span>
                        </p>
                    </form>
                </div>

                {/* Overlay Panel (Sliding Side) */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h2 style={{ fontSize: '2.5rem', marginBottom: 16, fontWeight: 800 }}>Already have an account?</h2>
                            <p style={{ fontSize: '1.1rem', marginBottom: 32, opacity: 0.9 }}>
                                Access your Skill Passport to manage your verified credentials, projects, and career progress.
                            </p>
                            <button className="btn btn-ghost" style={{ border: '2px solid currentColor', color: 'inherit', padding: '12px 32px' }} onClick={togglePanel}>
                                Log In To Your Account
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h2 style={{ fontSize: '2.5rem', marginBottom: 16, fontWeight: 800 }}>New Here?</h2>
                            <p style={{ fontSize: '1.1rem', marginBottom: 32, opacity: 0.9 }}>
                                Sign up to build your verifiable Skill Passport. Say goodbye to standard resumes and prove what you can build.
                            </p>
                            <button className="btn btn-ghost" style={{ border: '2px solid currentColor', color: 'inherit', padding: '12px 32px' }} onClick={togglePanel}>
                                Create an Account
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AuthPage() {
    return (
        <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
            <AuthContent />
        </Suspense>
    );
}
