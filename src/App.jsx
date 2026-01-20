import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header';
import StoryCard from './components/StoryCard';
import { ChevronDown, Loader, FileText } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Login from './pages/Login';
import Admin from './pages/Admin';
import Sources from './pages/Sources';

// ... (helper functions same as before)
const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};
const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString();
const isYesterday = (dateStr) => {
    const date = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};
const isThisYear = (dateStr) => new Date(dateStr).getFullYear() === new Date().getFullYear();
const getDateLabel = (dateStr) => {
    if (isToday(dateStr)) return null;
    if (isYesterday(dateStr)) return 'YESTERDAY';
    const date = new Date(dateStr);
    if (isThisYear(dateStr)) return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
};
const formatDate = () => new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
const STORIES_PER_PAGE = 10;

const RequireAuth = ({ children }) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div className="p-10 text-center">Loading...</div>;
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    
    return children;
};

const Home = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => { fetchStories(0, true); }, [activeTab]);

    const fetchStories = async (pageNum, isInitial = false) => {
        if (!isSupabaseConfigured()) { setLoading(false); return; }
        if (isInitial) { setLoading(true); setStories([]); } else { setLoadingMore(true); }

        try {
            const from = pageNum * STORIES_PER_PAGE;
            const to = from + STORIES_PER_PAGE - 1;
            let query = supabase.from('stories').select('*').eq('status', 'approved');
            if (activeTab !== 'all') query = query.eq('tag', activeTab);
            const { data, error } = await query.order('published_at', { ascending: false }).range(from, to);
            if (error) throw error;
            if (isInitial) setStories(data || []); else setStories(prev => [...prev, ...(data || [])]);
            setHasMore((data || []).length === STORIES_PER_PAGE);
            setPage(pageNum);
        } catch (err) { console.error('Error fetching stories:', err); } 
        finally { setLoading(false); setLoadingMore(false); }
    };

    const handleLoadMore = () => { if (!loadingMore && hasMore) fetchStories(page + 1, false); };
    const getTabTitle = () => {
        if (activeTab === 'africa') return 'Africa News';
        if (activeTab === 'global') return 'Global News';
        return "Today's Briefing";
    };
    const groupedStories = stories.reduce((acc, story) => {
        const label = getDateLabel(story.published_at) || 'Today';
        if (!acc[label]) acc[label] = [];
        acc[label].push(story);
        return acc;
    }, {});

    return (
        <div className="min-h-screen">
            <Header activeTab={activeTab} onTabChange={setActiveTab} />
            <main className="container" style={{ paddingBottom: '3rem', paddingTop: '2rem' }}>
                <div className="section-header">
                    <div className="section-title">
                        <FileText className="section-icon" style={{ color: '#F97316', marginRight: '0.75rem' }} size={24} />
                        {getTabTitle()}
                    </div>
                    <div className="date-badge">{formatDate()}</div>
                </div>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>Loading stories...</div>
                ) : stories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>No stories yet.</div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {Object.entries(groupedStories).map(([dateLabel, dateStories], groupIndex) => (
                                <React.Fragment key={dateLabel}>
                                    {groupIndex > 0 && <div className="date-divider"><div className="date-label">{dateLabel}</div></div>}
                                    {dateStories.map((story, index) => (
                                        <StoryCard key={story.id} time={formatTime(story.published_at)} title={story.title} tag={story.tag} tagName={story.tag === 'global' ? 'Global' : 'Africa'} source={story.source} icon={story.source_icon} url={story.url} isLatest={groupIndex === 0 && index === 0} />
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>
                        {hasMore && (
                            <div className="mt-12 flex justify-center" style={{ marginTop: '3rem' }}>
                                <button className="load-more-btn" onClick={handleLoadMore} disabled={loadingMore}>
                                    {loadingMore ? <><Loader size={18} className="spinning" /> Loading...</> : <><ChevronDown size={18} /> Load More Stories</>}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/admin" element={
                    <RequireAuth>
                        <Admin />
                    </RequireAuth>
                } />
                <Route path="/sources" element={
                    <RequireAuth>
                        <Sources />
                    </RequireAuth>
                } />
            </Routes>
        </AuthProvider>
    );
}

export default App;
