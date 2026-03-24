'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../../../lib/auth';
import { testsAPI } from '../../../../lib/api';

export default function TestPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const skillId = params.skillId;

    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) { router.push('/login'); return; }
        loadTest();
    }, [user, authLoading]);

    useEffect(() => {
        if (!test || submitted) return;
        setTimeLeft(test.timeLimit * 60);
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
                return t - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [test]);

    const loadTest = async () => {
        try {
            const res = await testsAPI.getForSkill(skillId);
            setTest(res.data.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (submitted) return;
        clearInterval(timerRef.current);
        setSubmitted(true);
        try {
            const answersArr = Object.entries(answers).map(([questionId, answer]) => ({ questionId: parseInt(questionId), answer }));
            const res = await testsAPI.submit(test.id, { answers: answersArr, timeTaken: (test.timeLimit * 60) - timeLeft, skillId });
            setResult(res.data.data);
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    if (authLoading || (!user && !authLoading) || loading) return <div className="loading-center"><div className="spinner" /></div>;

    if (!test) return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: '3rem' }}>📝</div>
            <h2>No test available yet</h2>
            <p style={{ color: 'var(--text-secondary)' }}>This skill doesn't have a test configured yet.</p>
            <Link href="/dashboard" className="btn btn-primary">Back to Dashboard</Link>
        </div>
    );

    if (result) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
                <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 16 }}>{result.passed ? '🎉' : '😓'}</div>
                    <h2 style={{ marginBottom: 8 }}>{result.passed ? 'Test Passed!' : 'Not Quite'}</h2>
                    <p style={{ marginBottom: 24 }}>{result.message}</p>
                    <div className="card" style={{ marginBottom: 24 }}>
                        <div style={{ fontFamily: 'Outfit', fontSize: '3rem', fontWeight: 900, background: result.passed ? 'var(--gradient-verified)' : 'var(--gradient-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                            {result.score}%
                        </div>
                        <div className="progress-bar" style={{ margin: '12px 0 8px' }}>
                            <div className="progress-fill" style={{ width: `${result.score}%`, background: result.passed ? 'var(--gradient-verified)' : 'var(--gradient-brand)' }} />
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Passing score: {result.passingScore}%</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <Link href="/dashboard" className="btn btn-secondary">Dashboard</Link>
                        {result.passed && <Link href={`/dashboard/project/${skillId}`} className="btn btn-primary">Submit Project →</Link>}
                    </div>
                </div>
            </div>
        );
    }

    const questions = Array.isArray(test.questions) ? test.questions : [];
    const answeredCount = Object.keys(answers).length;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
            {/* Test Header */}
            <div style={{ position: 'sticky', top: 0, background: 'rgba(10,10,15,0.95)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', zIndex: 100 }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{test.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{answeredCount} / {questions.length} answered</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', color: timeLeft < 120 ? 'var(--error)' : 'var(--text-primary)' }}>
                            ⏱ {formatTime(timeLeft)}
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={answeredCount === 0}>
                            Submit Test
                        </button>
                    </div>
                </div>
                <div className="progress-bar" style={{ borderRadius: 0, height: 3 }}>
                    <div className="progress-fill brand" style={{ width: `${(answeredCount / questions.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
            </div>

            <div className="container" style={{ maxWidth: 720, padding: '32px 24px' }}>
                {questions.map((q, idx) => (
                    <div key={q.id || idx} className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                            <div style={{ width: 28, height: 28, borderRadius: '50%', background: answers[q.id || idx] ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)', border: `2px solid ${answers[q.id || idx] ? 'var(--success)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                                {idx + 1}
                            </div>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.6 }}>{q.text}</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 40 }}>
                            {(q.options || []).map((opt, oi) => (
                                <div key={oi} onClick={() => setAnswers(p => ({ ...p, [q.id || idx]: opt }))}
                                    style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', border: `2px solid ${answers[q.id || idx] === opt ? 'var(--brand-purple)' : 'var(--border)'}`, background: answers[q.id || idx] === opt ? 'rgba(124,58,237,0.1)' : 'var(--bg-elevated)', cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.15s', color: answers[q.id || idx] === opt ? 'var(--brand-purple-light)' : 'var(--text-primary)' }}>
                                    {opt}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={answeredCount === 0}>
                        Submit Test ({answeredCount}/{questions.length} answered)
                    </button>
                </div>
            </div>
        </div>
    );
}
