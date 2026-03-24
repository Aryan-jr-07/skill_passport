'use client';
import { useState } from 'react';
import { usersAPI } from '../lib/api';

export default function ProfileSettings({ profile, onUpdate }) {
    const [form, setForm] = useState({
        name: profile?.name || '',
        headline: profile?.headline || '',
        location: profile?.location || '',
        bio: profile?.bio || '',
        githubUrl: profile?.githubUrl || '',
        linkedinUrl: profile?.linkedinUrl || '',
        websiteUrl: profile?.websiteUrl || '',
        avatar: profile?.avatar || '',
    });
    const [preview, setPreview] = useState(profile?.avatar || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
            setForm((prev) => ({ ...prev, avatar: reader.result }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await usersAPI.updateProfile(form);
            setMessage('Profile updated successfully!');
            if (onUpdate) onUpdate();
        } catch (err) {
            setMessage('Failed to update profile.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fadeIn">
            <h3 style={{ fontSize: '1.25rem', marginBottom: 20 }}>⚙️ Profile Settings</h3>

            {message && (
                <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Avatar Upload */}
                <div>
                    <label className="form-label" style={{ display: 'block', marginBottom: 12 }}>Profile Photo</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--bg-elevated)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0, fontSize: '2.5rem', fontWeight: 900, color: 'var(--brand-purple)' }}>
                            {preview ? (
                                <img src={preview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                form.name?.[0] || '?'
                            )}
                        </div>
                        <div>
                            <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', marginBottom: 8 }}>
                                Upload Photo
                                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                            </label>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Recommended: Square image, max 2MB.</div>
                        </div>
                    </div>
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input className="form-input" type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Headline</label>
                        <input className="form-input" type="text" placeholder="e.g. Senior Frontend Engineer" value={form.headline} onChange={e => setForm({ ...form, headline: e.target.value })} />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Bio (About You)</label>
                    <textarea className="form-input" rows="4" placeholder="Write a brief professional summary about your experience, goals, and passions..." value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
                </div>

                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input className="form-input" type="text" placeholder="e.g. San Francisco, CA" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">GitHub URL</label>
                        <input className="form-input" type="url" placeholder="https://github.com/username" value={form.githubUrl} onChange={e => setForm({ ...form, githubUrl: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <input className="form-input" type="url" placeholder="https://linkedin.com/in/username" value={form.linkedinUrl} onChange={e => setForm({ ...form, linkedinUrl: e.target.value })} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Personal Website</label>
                        <input className="form-input" type="url" placeholder="https://yourwebsite.com" value={form.websiteUrl} onChange={e => setForm({ ...form, websiteUrl: e.target.value })} />
                    </div>
                </div>

                <div style={{ marginTop: 12 }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? <span className="spinner spinner-sm" /> : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
