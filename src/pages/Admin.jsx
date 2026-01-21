import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Check, X, ExternalLink, RefreshCw, CheckCircle, Plus, Settings, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';

const Admin = () => {
    const { user, signOut, signInWithGoogle } = useAuth();
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [regionFilter, setRegionFilter] = useState('all');
    const [updatingId, setUpdatingId] = useState(null);
    const [successId, setSuccessId] = useState(null);

    // Add Story Modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStory, setNewStory] = useState({
        title: '',
        url: '',
        source: '',
        tag: 'global'
    });
    const [submitting, setSubmitting] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchStories();
        } else {
            setLoading(false);
        }
    }, [filter, regionFilter]);

    const fetchStories = async () => {
        setLoading(true);
        try {
            let query = supabase.from('stories').select('*');

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            if (regionFilter !== 'all') {
                query = query.eq('tag', regionFilter);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;
            setStories(data || []);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, status) => {
        setUpdatingId(id);

        setStories(prevStories =>
            prevStories.map(story =>
                story.id === id ? { ...story, status } : story
            )
        );

        try {
            const updates = { status };
            // Track who approved/rejected
            if (user?.email) {
                updates.approved_by = user.email;
            }

            const { error } = await supabase
                .from('stories')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            setSuccessId(id);
            setTimeout(() => setSuccessId(null), 1500);

            if (filter !== 'all') {
                setTimeout(() => {
                    setStories(prevStories => prevStories.filter(story => story.id !== id));
                }, 800);
            }
        } catch (err) {
            console.error('Error updating story:', err);
            fetchStories();
        } finally {
            setUpdatingId(null);
        }
    };

    const handleAddStory = async (e) => {
        e.preventDefault();
        if (!newStory.title || !newStory.url) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('stories').insert({
                title: newStory.title.trim(),
                url: newStory.url.trim(),
                source: newStory.source.trim() || 'Manual',
                tag: newStory.tag,
                source_type: 'manual',
                status: 'approved',
                published_at: new Date().toISOString(),
                approved_by: user?.email // Track creator
            });

            if (error) throw error;

            setNewStory({ title: '', url: '', source: '', tag: 'global' });
            setShowAddModal(false);
            fetchStories();
        } catch (err) {
            console.error('Error adding story:', err);
            alert('Error adding story: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();

        if (isToday) {
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }
        return date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    };

    if (!isSupabaseConfigured()) {
        return (
            <div className="admin-container">
                <div className="admin-header">
                    <h1>Admin Panel</h1>
                </div>
                <div className="admin-notice">
                    <p>Supabase is not configured.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div>
                    <h1>Story Verification</h1>

                </div>
                <div className="admin-controls">
                    <button onClick={() => setShowAddModal(true)} className="admin-btn primary">
                        <Plus size={18} />
                        Add Story
                    </button>

                    <Link to="/sources" className="admin-btn secondary">
                        <Settings size={18} />
                        Sources
                    </Link>



                    <select
                        value={regionFilter}
                        onChange={(e) => setRegionFilter(e.target.value)}
                        className="admin-select"
                    >
                        <option value="all">All Regions</option>
                        <option value="africa">Africa</option>
                        <option value="global">Global</option>
                    </select>

                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="admin-select"
                    >
                        <option value="pending">Pending ({stories.length})</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="all">All Status</option>
                    </select>

                    <button onClick={fetchStories} className="admin-refresh" disabled={loading} title="Refresh">
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                    </button>

                    {user ? (
                        <>
                            <div style={{ position: 'relative' }}>
                                <div
                                    className="admin-avatar"
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    style={{
                                        backgroundImage: `url(${user.user_metadata?.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuB-yUa0OSqyYo2Vm7NW0IuXK_cmAHdBWRgzDxKBemtqTO4qZqkrxKuBhVh8uCD3bEFLqUzA9Am9pLaDz8qUnETTbRyIMIueawPDeamm3OmjLf_XSFxIcV-GoU1IdNC25vpr05HDRZoMuBPB2_lVADCUmwEGgyzVk2QIBtdH6cQDFGSW4Laj5r6tRLkZuzWd9oSN6hQ66ZoelR7W4cus7u9XdkfS6VSx1s2ih0KCA0f4zTyuBjY0IDrNwUTiHP2kXX21IP3AyGFaBh9U'})`,
                                        cursor: 'pointer'
                                    }}
                                    title={user.email}
                                />
                                {showProfileMenu && (
                                    <div className="profile-dropdown">
                                        <div className="profile-header">
                                            <span className="profile-email">{user.email}</span>
                                        </div>
                                        <button onClick={signOut} className="profile-logout-btn">
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <button onClick={signInWithGoogle} className="admin-btn secondary" title="Sign In using Google">
                            <User size={18} />
                            <span>Sign In</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Add Story Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add Story</h2>
                        <form onSubmit={handleAddStory}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={newStory.title}
                                    onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                                    placeholder="Story headline..."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>URL *</label>
                                <input
                                    type="url"
                                    value={newStory.url}
                                    onChange={(e) => setNewStory({ ...newStory, url: e.target.value })}
                                    placeholder="https://..."
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Source</label>
                                    <input
                                        type="text"
                                        value={newStory.source}
                                        onChange={(e) => setNewStory({ ...newStory, source: e.target.value })}
                                        placeholder="TechCrunch, etc."
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Region</label>
                                    <select
                                        value={newStory.tag}
                                        onChange={(e) => setNewStory({ ...newStory, tag: e.target.value })}
                                    >
                                        <option value="global">Global</option>
                                        <option value="africa">Africa</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Story'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="admin-loading">Loading...</div>
            ) : stories.length === 0 ? (
                <div className="admin-empty">No {filter} stories found</div>
            ) : (
                <div className="admin-cards">
                    {stories.map((story) => (
                        <div
                            key={story.id}
                            className={`admin-card ${successId === story.id ? 'card-success' : ''} ${updatingId === story.id ? 'card-updating' : ''}`}
                        >
                            <div className="admin-card-header">
                                {story.source_type === 'manual' && (
                                    <span className="admin-tag manual">Manual</span>
                                )}
                                <span className="admin-card-source">{story.source}</span>
                                <span className="admin-card-date">{formatDate(story.created_at)}</span>
                                {story.approved_by && (
                                    <span className="admin-card-user" style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9CA3AF' }}>
                                        by {story.approved_by.split('@')[0]}
                                    </span>
                                )}
                            </div>

                            <a href={story.url} target="_blank" rel="noopener noreferrer" className="admin-card-title">
                                {story.title}
                                <ExternalLink size={14} />
                            </a>

                            <div className="admin-card-footer">
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span className={`status-badge ${story.status}`}>
                                        {successId === story.id ? (
                                            <span className="status-updated">
                                                <CheckCircle size={12} /> Done!
                                            </span>
                                        ) : story.status}
                                    </span>
                                    <span className={`admin-tag ${story.tag}`}>{story.tag}</span>
                                </div>

                                <div className="admin-card-actions">
                                    {story.status !== 'approved' && (
                                        <button
                                            onClick={() => updateStatus(story.id, 'approved')}
                                            className="action-btn approve"
                                            disabled={updatingId === story.id}
                                        >
                                            <Check size={18} />
                                            <span>Approve</span>
                                        </button>
                                    )}
                                    {story.status !== 'rejected' && (
                                        <button
                                            onClick={() => updateStatus(story.id, 'rejected')}
                                            className="action-btn reject"
                                            disabled={updatingId === story.id}
                                        >
                                            <X size={18} />
                                            <span>Reject</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Admin;
