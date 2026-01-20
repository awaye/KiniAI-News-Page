import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, RefreshCw, Rss, Play, Pause } from 'lucide-react';

const Sources = () => {
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newSource, setNewSource] = useState({
        name: '',
        url: '',
        tag: 'global'
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isSupabaseConfigured()) {
            fetchSources();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchSources = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('sources')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSources(data || []);
        } catch (err) {
            console.error('Error fetching sources:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSource = async (e) => {
        e.preventDefault();
        if (!newSource.name || !newSource.url) return;

        setSubmitting(true);
        try {
            const { error } = await supabase.from('sources').insert({
                name: newSource.name.trim(),
                url: newSource.url.trim(),
                tag: newSource.tag,
                is_active: true
            });

            if (error) throw error;

            setNewSource({ name: '', url: '', tag: 'global' });
            setShowAddModal(false);
            fetchSources();
        } catch (err) {
            console.error('Error adding source:', err);
            alert('Error: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const deleteSource = async (id) => {
        if (!confirm('Delete this source?')) return;

        try {
            const { error } = await supabase
                .from('sources')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setSources(sources.filter(s => s.id !== id));
        } catch (err) {
            console.error('Error deleting source:', err);
        }
    };

    const toggleActive = async (id, currentStatus) => {
        try {
            const { error } = await supabase
                .from('sources')
                .update({ is_active: !currentStatus })
                .eq('id', id);

            if (error) throw error;
            setSources(sources.map(s =>
                s.id === id ? { ...s, is_active: !currentStatus } : s
            ));
        } catch (err) {
            console.error('Error toggling source:', err);
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <div className="header-left">
                    <Link to="/admin" className="back-link">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1>RSS Sources ({sources.length})</h1>
                </div>
                <div className="admin-controls">
                    <button onClick={() => setShowAddModal(true)} className="admin-btn primary">
                        <Plus size={18} />
                        Add Source
                    </button>
                    <button onClick={fetchSources} className="admin-refresh" disabled={loading}>
                        <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                    </button>
                </div>
            </div>

            {/* Add Source Modal */}
            {showAddModal && (
                <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2>Add RSS Source</h2>
                        <form onSubmit={handleAddSource}>
                            <div className="form-group">
                                <label>Source Name *</label>
                                <input
                                    type="text"
                                    value={newSource.name}
                                    onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                                    placeholder="TechCrunch, etc."
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>RSS Feed URL *</label>
                                <input
                                    type="url"
                                    value={newSource.url}
                                    onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                                    placeholder="https://example.com/feed.xml"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Region</label>
                                <select
                                    value={newSource.tag}
                                    onChange={(e) => setNewSource({ ...newSource, tag: e.target.value })}
                                >
                                    <option value="global">Global</option>
                                    <option value="africa">Africa</option>
                                </select>
                            </div>
                            <div className="form-actions">
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit" disabled={submitting}>
                                    {submitting ? 'Adding...' : 'Add Source'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Sources List */}
            {loading ? (
                <div className="admin-loading">Loading...</div>
            ) : sources.length === 0 ? (
                <div className="admin-notice">
                    <Rss size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                    <h3>No RSS Sources Found</h3>
                    <p style={{ marginTop: '0.5rem' }}>Click "Add Source" to add your RSS feeds.</p>
                </div>
            ) : (
                <div className="admin-cards">
                    {sources.map((source) => (
                        <div key={source.id} className={`admin-card ${!source.is_active ? 'card-inactive' : ''}`}>
                            <div className="admin-card-header">
                                <span className={`admin-tag ${source.tag}`}>{source.tag}</span>
                                <span className="admin-card-source">{source.name}</span>
                                <span className={`status-badge ${source.is_active ? 'approved' : 'rejected'}`}>
                                    {source.is_active ? 'Active' : 'Paused'}
                                </span>
                            </div>

                            <a href={source.url} target="_blank" rel="noopener noreferrer" className="admin-card-title" style={{ fontSize: '0.875rem', wordBreak: 'break-all' }}>
                                {source.url}
                            </a>

                            <div className="admin-card-footer">
                                <button
                                    onClick={() => toggleActive(source.id, source.is_active)}
                                    className={`action-btn ${source.is_active ? 'reject' : 'approve'}`}
                                >
                                    {source.is_active ? <Pause size={16} /> : <Play size={16} />}
                                    {source.is_active ? 'Pause' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => deleteSource(source.id)}
                                    className="action-btn reject"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Sources;
