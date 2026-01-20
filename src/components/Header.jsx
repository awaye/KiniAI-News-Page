import React from 'react';
import { Search, Bell, FolderOpen } from 'lucide-react';

const Header = ({ activeTab, onTabChange }) => {
    return (
        <header className="sticky-header cabinet-texture">
            <div className="header-content">
                {/* Logo Section */}
                <div className="flex items-center gap-4">
                    <a href="/" className="flex items-center gap-1 group">
                        <div className="relative h-10 w-auto flex items-center text-white">
                            <svg className="h-10 w-auto" viewBox="0 0 140 40" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 5 L10 35 M22 5 L10 20 M10 20 L22 35" stroke="currentColor" strokeLinecap="square" strokeWidth="3"></path>
                                <path d="M18 2 L20 8" stroke="currentColor" strokeWidth="2"></path>
                                <path d="M30 5 L30 35" stroke="currentColor" strokeWidth="3"></path>
                                <path d="M40 35 L40 5 L55 35 L55 5" stroke="currentColor" strokeLinejoin="round" strokeWidth="3"></path>
                                <path d="M65 5 L65 35" stroke="currentColor" strokeWidth="3"></path>
                                <path d="M80 20 L83 17 L86 20 L83 23 Z M83 12 L83 28 M75 20 L91 20" stroke="currentColor" strokeWidth="2"></path>
                                <path d="M98 35 L108 5 L118 35 M101 25 L115 25" stroke="currentColor" strokeLinejoin="round" strokeWidth="3"></path>
                                <path d="M125 5 L125 35" stroke="currentColor" strokeWidth="3"></path>
                            </svg>
                        </div>
                    </a>
                </div>

                {/* Central Tabs (Desktop) */}
                <div className="hidden md:flex items-end flex-1 justify-center h-full pt-6">
                    <div className="tabs-container">
                        <div className="tabs-bottom-line"></div>

                        {/* Tab: All */}
                        <div
                            className={`folder-tab ${activeTab === 'all' ? 'active tab-all-active' : ''}`}
                            onClick={() => onTabChange('all')}
                        >
                            <FolderOpen size={18} />
                            <span>All</span>
                        </div>

                        {/* Tab: Africa */}
                        <div
                            className={`folder-tab ${activeTab === 'africa' ? 'active tab-africa-active' : ''}`}
                            onClick={() => onTabChange('africa')}
                        >
                            <span>Africa</span>
                        </div>

                        {/* Tab: Global */}
                        <div
                            className={`folder-tab ${activeTab === 'global' ? 'active tab-global-active' : ''}`}
                            onClick={() => onTabChange('global')}
                        >
                            <span>Global</span>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    <div className="relative group hidden lg:block w-56">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="search-input-header"
                            placeholder="Search archive..."
                        />
                    </div>

                    <button className="btn-icon relative">
                        <Bell size={20} />
                        <span className="absolute top-2 right-2 h-2 w-2 bg-[var(--kini-orange)] rounded-full"></span>
                    </button>

                    <div
                        className="avatar"
                        style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-yUa0OSqyYo2Vm7NW0IuXK_cmAHdBWRgzDxKBemtqTO4qZqkrxKuBhVh8uCD3bEFLqUzA9Am9pLaDz8qUnETTbRyIMIueawPDeamm3OmjLf_XSFxIcV-GoU1IdNC25vpr05HDRZoMuBPB2_lVADCUmwEGgyzVk2QIBtdH6cQDFGSW4Laj5r6tRLkZuzWd9oSN6hQ66ZoelR7W4cus7u9XdkfS6VSx1s2ih0KCA0f4zTyuBjY0IDrNwUTiHP2kXX21IP3AyGFaBh9U')` }}
                    ></div>
                </div>
            </div>
        </header>
    );
};

export default Header;
