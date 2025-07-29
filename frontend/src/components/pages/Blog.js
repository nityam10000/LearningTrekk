import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/Blog.css';
import SearchBar from '../SearchBar';
import { blogsAPI } from '../../services/api';

function Blog() {
    const [filteredPosts, setFilteredPosts] = useState([]);
    const [blogPosts, setBlogPosts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilters, setActiveFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const navigate = useNavigate();

    // Load blogs from API with better error handling
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('🔄 Fetching blogs from API...');
                console.log('API Base URL:', process.env.REACT_APP_API_URL || 'http://localhost:5000/api');
                
                const response = await blogsAPI.getAllBlogs();
                console.log('📥 Raw API Response:', response);
                console.log('Response type:', typeof response);
                console.log('Response keys:', response ? Object.keys(response) : 'null');
                
                // Handle different response formats with improved logic
                let blogsData = [];
                
                if (Array.isArray(response)) {
                    blogsData = response;
                    console.log('✅ Response is direct array with length:', blogsData.length);
                } else if (response && Array.isArray(response.blogs)) {
                    blogsData = response.blogs;
                    console.log('✅ Found blogs in response.blogs with length:', blogsData.length);
                } else if (response && Array.isArray(response.data)) {
                    blogsData = response.data;
                    console.log('✅ Found blogs in response.data with length:', blogsData.length);
                } else if (response && typeof response === 'object') {
                    // More thorough search for blog data
                    console.log('🔍 Searching for blogs in response object...');
                    const keys = Object.keys(response);
                    console.log('Available keys:', keys);
                    
                    for (const key of keys) {
                        if (Array.isArray(response[key])) {
                            blogsData = response[key];
                            console.log(`✅ Found array in response.${key} with length:`, blogsData.length);
                            break;
                        }
                    }
                    
                    // If still no blogs found, try to extract from nested objects
                    if (blogsData.length === 0) {
                        console.log('🔍 No direct arrays found, searching deeper...');
                        for (const key of keys) {
                            if (response[key] && typeof response[key] === 'object' && Array.isArray(response[key].blogs)) {
                                blogsData = response[key].blogs;
                                console.log(`✅ Found nested blogs in response.${key}.blogs with length:`, blogsData.length);
                                break;
                            }
                        }
                    }
                } else {
                    console.warn('⚠️ Unexpected response format:', response);
                }
                
                // Log individual blog details for debugging
                if (blogsData.length > 0) {
                    console.log('📝 Blog details:');
                    blogsData.forEach((blog, index) => {
                        console.log(`Blog ${index + 1}:`, {
                            id: blog._id,
                            title: blog.title?.substring(0, 50) + '...',
                            isPublished: blog.isPublished,
                            author: blog.author?.name,
                            category: blog.category,
                            createdAt: blog.createdAt
                        });
                    });
                }
                
                console.log('📊 Final processed blogs data length:', blogsData.length);
                setBlogPosts(blogsData);
                
                // Success/info messages
                if (blogsData.length > 0) {
                    console.log(`✅ Successfully loaded ${blogsData.length} blog posts`);
                } else {
                    console.log('ℹ️ No blogs found - this could be normal if no blogs are published yet');
                }
                
            } catch (err) {
                console.error('❌ Error fetching blogs:', err);
                console.error('Error details:', {
                    message: err.message,
                    status: err.status,
                    response: err.response,
                    stack: err.stack
                });
                setError(`Failed to load blogs: ${err.message}`);
                setBlogPosts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchBlogs();
    }, [refreshTrigger]); // Add refreshTrigger as dependency

    // Apply search and filters whenever posts, search or filters change
    useEffect(() => {
        applySearchAndFilters();
    }, [blogPosts, searchQuery, activeFilters]);

    const applySearchAndFilters = () => {
        let filtered = [...blogPosts];

        // Apply search query
        if (searchQuery.trim()) {
            filtered = filtered.filter(post =>
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.author?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply filters
        Object.entries(activeFilters).forEach(([filterType, filterValue]) => {
            if (filterValue) {
                if (filterType === 'category') {
                    filtered = filtered.filter(post => post.category === filterValue);
                } else if (filterType === 'readTime') {
                    filtered = filtered.filter(post => {
                        const minutes = post.readTime || 5;
                        if (filterValue === 'short') return minutes <= 5;
                        if (filterValue === 'medium') return minutes > 5 && minutes <= 10;
                        if (filterValue === 'long') return minutes > 10;
                        return true;
                    });
                }
            }
        });

        // Sort by published date (newest first)
        filtered.sort((a, b) => new Date(b.publishedDate || b.createdAt) - new Date(a.publishedDate || a.createdAt));

        setFilteredPosts(filtered);
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleFilterChange = (filters) => {
        setActiveFilters(filters);
    };

    // Function to manually refresh blogs
    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    // Listen for blog creation events (optional - for real-time updates)
    useEffect(() => {
        const handleBlogCreated = () => {
            console.log('Blog created event received, refreshing...');
            handleRefresh();
        };

        // Listen for custom events
        window.addEventListener('blogCreated', handleBlogCreated);
        
        return () => {
            window.removeEventListener('blogCreated', handleBlogCreated);
        };
    }, []);

    // Define filter options for blog posts
    const blogFilterOptions = [
        {
            key: 'category',
            title: 'Category',
            options: [
                { value: 'Programming', label: 'Programming', count: blogPosts.filter(p => p.category === 'Programming').length },
                { value: 'Web Development', label: 'Web Development', count: blogPosts.filter(p => p.category === 'Web Development').length },
                { value: 'Frontend', label: 'Frontend', count: blogPosts.filter(p => p.category === 'Frontend').length },
                { value: 'Backend', label: 'Backend', count: blogPosts.filter(p => p.category === 'Backend').length },
                { value: 'AI/ML', label: 'AI/ML', count: blogPosts.filter(p => p.category === 'AI/ML').length },
                { value: 'Cloud Computing', label: 'Cloud Computing', count: blogPosts.filter(p => p.category === 'Cloud Computing').length },
                { value: 'Security', label: 'Security', count: blogPosts.filter(p => p.category === 'Security').length },
                { value: 'DevOps', label: 'DevOps', count: blogPosts.filter(p => p.category === 'DevOps').length }
            ]
        },
        {
            key: 'readTime',
            title: 'Reading Time',
            options: [
                { value: 'short', label: 'Quick Read (≤5 min)', count: blogPosts.filter(p => parseInt(p.readTime) <= 5).length },
                { value: 'medium', label: 'Medium Read (6-10 min)', count: blogPosts.filter(p => parseInt(p.readTime) > 5 && parseInt(p.readTime) <= 10).length },
                { value: 'long', label: 'Long Read (10+ min)', count: blogPosts.filter(p => parseInt(p.readTime) > 10).length }
            ]
        }
    ];

    if (loading) {
        return <div className="loading">Loading blog posts...</div>;
    }

    if (error) {
        return <div className="error">{error}</div>;
    }

    return (
        <div className="blog-container">
            {/* Blog Hero Section */}
            <div className="blog-hero-section">
                <h1 className="blog-title">Our Blog</h1>
                <p className="blog-subtitle">
                    Stay updated with the latest trends, tips, and insights in technology and programming.
                </p>
            </div>

            {/* Search and Filter Section */}
            <div className="blog-filters">
                <SearchBar
                    placeholder="Search blog posts by title, content, category, or author..."
                    onSearch={handleSearch}
                    onFilterChange={handleFilterChange}
                    showFilters={true}
                    filterOptions={blogFilterOptions}
                    searchType="blog posts"
                />

                {/* Results Summary */}
                <div className="results-summary">
                    <p>
                        Showing {filteredPosts.length} of {blogPosts.length} blog posts
                        {searchQuery && (
                            <span> for "<strong>{searchQuery}</strong>"</span>
                        )}
                    </p>
                </div>
            </div>

            {/* Simple Blog Cards Grid */}
            <div className="blog-posts-container">
                <div className="blog-posts-grid">
                    {filteredPosts.length > 0 ? (
                        filteredPosts.map(post => (
                            <article 
                                key={post._id || post.id} 
                                className="blog-post-card"
                                onClick={() => navigate(`/blog/${post._id || post.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                {post.image && post.image.trim() && (
                                    <div className="blog-post-image">
                                        <img 
                                            src={post.image} 
                                            alt={post.title}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                        <div className="blog-post-category">{post.category}</div>
                                    </div>
                                )}
                                
                                <div className="blog-post-content">
                                    <div className="blog-post-meta">
                                        <span className="author">By {post.author?.name || 'Unknown Author'}</span>
                                        <span className="date">{new Date(post.publishedDate || post.createdAt).toLocaleDateString()}</span>
                                        <span className="read-time">{post.readTime || 5} min read</span>
                                    </div>
                                    
                                    <h2 className="blog-post-title">
                                        {post.title}
                                    </h2>
                                    
                                    <p className="blog-post-excerpt">{post.excerpt}</p>
                                    
                                    {/* Tags */}
                                    {post.tags && post.tags.length > 0 && (
                                        <div className="blog-post-tags">
                                            {post.tags.slice(0, 3).map((tag, index) => (
                                                <span key={index} className="blog-tag">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    
                                    {/* Engagement metrics */}
                                    <div className="blog-post-engagement">
                                        <div className="engagement-item">
                                            <i className="fas fa-heart"></i>
                                            <span>{post.likes || 0}</span>
                                        </div>
                                        <div className="engagement-item">
                                            <i className="fas fa-bookmark"></i>
                                            <span>{post.bookmarks || 0}</span>
                                        </div>
                                        <div className="engagement-item">
                                            <i className="fas fa-share"></i>
                                            <span>{post.shares || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="no-results">
                            <div className="no-results-content">
                                {blogPosts.length === 0 ? (
                                    // No blogs exist at all
                                    <>
                                        <i className="fas fa-blog no-results-icon"></i>
                                        <h3>No blog posts yet</h3>
                                        <p>
                                            Be the first to share your knowledge! Create engaging blog posts to help others learn.
                                        </p>
                                        <div className="empty-state-actions">
                                            {/* Show create blog button for instructors */}
                                            {window.location.pathname.includes('instructor') || 
                                             (localStorage.getItem('user-info') && 
                                              JSON.parse(localStorage.getItem('user-info'))?.role === 'instructor') ? (
                                                <button 
                                                    className="create-blog-btn"
                                                    onClick={() => navigate('/instructor/create-blog')}
                                                >
                                                    <i className="fas fa-plus"></i>
                                                    Create First Blog
                                                </button>
                                            ) : null}
                                        </div>
                                    </>
                                ) : (
                                    // Blogs exist but none match filters
                                    <>
                                        <i className="fas fa-search no-results-icon"></i>
                                        <h3>No blog posts found</h3>
                                        <p>
                                            {searchQuery 
                                                ? `No blog posts match "${searchQuery}". Try adjusting your search or filters.`
                                                : "No blog posts match the selected filters. Try adjusting your filters."
                                            }
                                        </p>
                                        <div className="empty-state-actions">
                                            <button 
                                                className="clear-filters-btn"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setActiveFilters({});
                                                }}
                                            >
                                                <i className="fas fa-times"></i>
                                                Clear Filters
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

           
        </div>
    );
}

export default Blog;