import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StoryCard from './components/StoryCard';
import { ChevronDown, Loader, FileText } from 'lucide-react';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

const isToday = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
};

const isYesterday = (dateStr) => {
    const date = new Date(dateStr);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
};

const getDateLabel = (dateStr) => {
    if (isToday(dateStr)) return null;
    if (isYesterday(dateStr)) return 'YESTERDAY';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase();
};

const STORIES_PER_PAGE = 10;

function App() {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [page, setPage] = useState(0);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'africa', 'global'

    useEffect(() => {
        fetchStories(0, true);
    }, [activeTab]); // Re-fetch when tab changes

    const fetchStories = async (pageNum, isInitial = false) => {
        if (!isSupabaseConfigured()) {
            setLoading(false);
            return;
        }

        if (isInitial) {
            setLoading(true);
            setStories([]);
        } else {
            setLoadingMore(true);
        }

        try {
            const from = pageNum * STORIES_PER_PAGE;
            const to = from + STORIES_PER_PAGE - 1;

            let query = supabase
                .from('stories')
                .select('*')
                .eq('status', 'approved');

            // Filter by region if not "all"
            if (activeTab !== 'all') {
                query = query.eq('tag', activeTab);
            }

            const { data, error } = await query
                .order('published_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            if (isInitial) {
                setStories(data || []);
            } else {
                setStories(prev => [...prev, ...(data || [])]);
            }

            setHasMore((data || []).length === STORIES_PER_PAGE);
            setPage(pageNum);
        } catch (err) {
            console.error('Error fetching stories:', err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleLoadMore = () => {
        if (!loadingMore && hasMore) {
            fetchStories(page + 1, false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setPage(0);
    };

    const groupedStories = stories.reduce((acc, story) => {
        const label = getDateLabel(story.published_at) || 'Today';
        if (!acc[label]) acc[label] = [];
        acc[label].push(story);
        return acc;
    }, {});

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const getTabTitle = () => {
        if (activeTab === 'africa') return 'Africa News';
        if (activeTab === 'global') return 'Global News';
        return "Today's Briefing";
    };

    return (
        <div className="min-h-screen">
            <Header activeTab={activeTab} onTabChange={handleTabChange} />

            <main className="container" style={{ paddingBottom: '3rem', paddingTop: '2rem' }}>
                <div className="section-header">
                    <div className="section-title">
                        <FileText className="section-icon" style={{ color: '#F97316', marginRight: '0.75rem' }} size={24} />
                        {getTabTitle()}
                    </div>
                    <div className="date-badge">
                        {formatDate()}
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                        Loading stories...
                    </div>
                ) : stories.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                        No {activeTab === 'all' ? 'approved' : activeTab} stories yet.
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-4">
                            {Object.entries(groupedStories).map(([dateLabel, dateStories], groupIndex) => (
                                <React.Fragment key={dateLabel}>
                                    {groupIndex > 0 && (
                                        <div className="date-divider">
                                            <div className="date-label">{dateLabel}</div>
                                        </div>
                                    )}

                                    {dateStories.map((story, index) => (
                                        <React.Fragment key={story.id}>
                                            <StoryCard
                                                time={formatTime(story.published_at)}
                                                title={story.title}
                                                tag={story.tag}
                                                tagName={story.tag === 'global' ? 'Global' : 'Africa'}
                                                source={story.source}
                                                icon={story.source_icon}
                                                url={story.url}
                                                isLatest={groupIndex === 0 && index === 0}
                                            />
                                        </React.Fragment>
                                    ))}
                                </React.Fragment>
                            ))}
                        </div>

                        {hasMore && (
                            <div className="mt-12 flex justify-center" style={{ marginTop: '3rem' }}>
                                <button
                                    className="load-more-btn"
                                    onClick={handleLoadMore}
                                    disabled={loadingMore}
                                >
                                    {loadingMore ? (
                                        <>
                                            <Loader size={18} className="spinning" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            Load More Stories
                                            <ChevronDown size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

export default App;
