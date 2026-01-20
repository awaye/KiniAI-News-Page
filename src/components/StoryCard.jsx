import React from 'react';
import { ArrowRight, Globe, Rss, Newspaper, Zap, Code, DollarSign, ExternalLink } from 'lucide-react';

// Icon mapping helper
const getIcon = (iconName) => {
    const icons = {
        'public': Globe,
        'rss_feed': Rss,
        'newspaper': Newspaper,
        'bolt': Zap,
        'code': Code,
        'attach_money': DollarSign,
    };
    const Icon = icons[iconName] || ExternalLink;
    return <Icon size={14} style={{ color: 'inherit' }} />;
};

const StoryCard = ({ time, title, tag, tagName, source, icon, isLatest, url }) => {
    const handleClick = () => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    // Determine border class based on tag
    // If tag includes 'africa', use orange border. Else green/default.
    const borderClass = (tag && tag.includes('africa')) ? 'border-left-orange' : 'border-left-green';

    return (
        <article className={`story-card group ${borderClass}`} onClick={handleClick}>
            {/* Date Column */}
            <div className="card-time">
                <span>{time}</span>
            </div>

            {/* Content Block */}
            <div className="card-content">
                {/* Tag Row */}
                <div className="tag-row">
                    <span className={`tag ${tag}`}>
                        {tagName}
                    </span>
                </div>

                <h3 className="card-title">
                    {title}
                </h3>

                {/* Meta Row */}
                <div className="card-meta-row">
                    <span className="card-source">
                        {getIcon(icon)}
                        <span style={{ marginLeft: '4px' }}>{source}</span>
                    </span>
                    <span style={{ margin: '0 4px', fontSize: '10px' }}>•</span>
                    <span>5 min read</span>
                </div>
            </div>

            {/* Action Column */}
            <div className="action-arrow">
                <ArrowRight size={20} />
            </div>
        </article>
    );
};

export default StoryCard;
