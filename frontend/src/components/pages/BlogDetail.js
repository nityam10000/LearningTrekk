import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { blogsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import 'highlight.js/styles/github.css';
import '../../css/BlogDetail.css';

function BlogDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError } = useNotifications();
    
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [relatedBlogs, setRelatedBlogs] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [submittingComment, setSubmittingComment] = useState(false);

    useEffect(() => {
        const fetchBlog = async () => {
            try {
                setLoading(true);
                const blogData = await blogsAPI.getBlogById(id);
                setBlog(blogData);
                setError(null);
                
                // Fetch related blogs
                const allBlogs = await blogsAPI.getAllBlogs();
                const related = allBlogs.blogs?.filter(b => 
                    b._id !== id && 
                    b.category === blogData.category
                ).slice(0, 3) || [];
                setRelatedBlogs(related);
                
            } catch (err) {
                console.error('Error fetching blog:', err);
                setError(err.message || 'Failed to load blog post');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchBlog();
        }
    }, [id]);

    const handleLike = async () => {
        if (!isAuthenticated) {
            showError('Please log in to like this post');
            return;
        }

        try {
            await blogsAPI.likeBlog(id);
            setBlog(prev => ({
                ...prev,
                likes: prev.likes + 1
            }));
            showSuccess('Post liked!');
        } catch (error) {
            console.error('Error liking post:', error);
            showError('Failed to like post');
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            showError('Please log in to comment');
            return;
        }

        if (!newComment.trim()) {
            showError('Please enter a comment');
            return;
        }

        try {
            setSubmittingComment(true);
            const comment = await blogsAPI.addComment(id, newComment.trim());
            
            setBlog(prev => ({
                ...prev,
                comments: [...prev.comments, comment]
            }));
            
            setNewComment('');
            showSuccess('Comment added successfully!');
        } catch (error) {
            console.error('Error adding comment:', error);
            showError('Failed to add comment');
        } finally {
            setSubmittingComment(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="blog-detail-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <p>Loading blog post...</p>
                </div>
            </div>
        );
    }

    if (error || !blog) {
        return (
            <div className="blog-detail-container">
                <div className="error-state">
                    <h2>Blog Post Not Found</h2>
                    <p>{error || 'The blog post you\'re looking for doesn\'t exist or has been removed.'}</p>
                    <button onClick={() => navigate('/blog')} className="back-btn">
                        Back to Blog
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="blog-detail-container">
            <article className="blog-detail">
                {/* Blog Header */}
                <header className="blog-header">
                    <div className="blog-breadcrumb">
                        <button onClick={() => navigate('/blog')} className="breadcrumb-link">
                            <i className="fas fa-arrow-left"></i>
                            Back to Blog
                        </button>
                    </div>
                    
                    <div className="blog-category-badge">{blog.category}</div>
                    
                    <h1 className="blog-title">{blog.title}</h1>
                    
                    <div className="blog-meta">
                        <div className="author-info">
                            <img 
                                src={blog.author?.avatar || '/images/default-avatar.png'} 
                                alt={blog.author?.name || 'Author'} 
                                className="author-avatar"
                            />
                            <div className="author-details">
                                <span className="author-name">By {blog.author?.name || 'Unknown Author'}</span>
                                <span className="publish-date">{formatDate(blog.publishedDate || blog.createdAt)}</span>
                            </div>
                        </div>
                        
                        <div className="blog-stats">
                            <span className="read-time">
                                <i className="fas fa-clock"></i>
                                {blog.readTime || 5} min read
                            </span>
                            <span className="view-count">
                                <i className="fas fa-eye"></i>
                                {blog.views || 0} views
                            </span>
                        </div>
                    </div>

                    {blog.image && blog.image.trim() && (
                        <div className="blog-featured-image">
                            <img 
                                src={blog.image} 
                                alt={blog.title}
                                onError={(e) => {
                                    e.target.parentElement.style.display = 'none';
                                }}
                            />
                        </div>
                    )}
                </header>

                {/* Blog Content */}
                <div className="blog-content">
                    <div className="blog-excerpt">
                        <p>{blog.excerpt}</p>
                    </div>
                    
                    <div className="blog-markdown-content">
                        <ReactMarkdown
                            children={blog.content}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight, rehypeRaw]}
                        />
                    </div>
                </div>

                {/* Blog Tags */}
                {blog.tags && blog.tags.length > 0 && (
                    <div className="blog-tags">
                        <h4>Tags:</h4>
                        <div className="tags-list">
                            {blog.tags.map((tag, index) => (
                                <span key={index} className="tag">{tag}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Blog Actions */}
                <div className="blog-actions">
                    <button onClick={handleLike} className="action-btn like-btn">
                        <i className="fas fa-heart"></i>
                        Like ({blog.likes || 0})
                    </button>
                    <button className="action-btn bookmark-btn">
                        <i className="fas fa-bookmark"></i>
                        Bookmark
                    </button>
                    <button className="action-btn share-btn">
                        <i className="fas fa-share"></i>
                        Share
                    </button>
                </div>

                {/* Comments Section */}
                <div className="comments-section">
                    <h3>Comments ({blog.comments?.length || 0})</h3>
                    
                    {isAuthenticated && (
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts..."
                                rows="4"
                                disabled={submittingComment}
                            />
                            <button 
                                type="submit" 
                                className="submit-comment-btn"
                                disabled={submittingComment || !newComment.trim()}
                            >
                                {submittingComment ? 'Posting...' : 'Post Comment'}
                            </button>
                        </form>
                    )}

                    {!isAuthenticated && (
                        <div className="login-prompt">
                            <p>
                                <button onClick={() => navigate('/login')} className="login-link">
                                    Log in
                                </button> to join the discussion.
                            </p>
                        </div>
                    )}

                    <div className="comments-list">
                        {blog.comments && blog.comments.length > 0 ? (
                            blog.comments.map((comment, index) => (
                                <div key={index} className="comment">
                                    <div className="comment-header">
                                        <img 
                                            src={comment.user?.avatar || '/images/default-avatar.png'} 
                                            alt={comment.user?.name || 'User'} 
                                            className="comment-avatar"
                                        />
                                        <div className="comment-meta">
                                            <span className="comment-author">{comment.user?.name || 'Anonymous'}</span>
                                            <span className="comment-date">{formatDate(comment.createdAt)}</span>
                                        </div>
                                    </div>
                                    <div className="comment-content">
                                        <p>{comment.comment}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
                        )}
                    </div>
                </div>
            </article>

            {/* Related Blogs */}
            {relatedBlogs.length > 0 && (
                <aside className="related-blogs">
                    <h3>Related Articles</h3>
                    <div className="related-blogs-grid">
                        {relatedBlogs.map(relatedBlog => (
                            <div 
                                key={relatedBlog._id} 
                                className="related-blog-card"
                                onClick={() => navigate(`/blog/${relatedBlog._id}`)}
                            >
                                <img 
                                    src={relatedBlog.image || '/images/default-blog.png'} 
                                    alt={relatedBlog.title} 
                                />
                                <div className="related-blog-content">
                                    <h4>{relatedBlog.title}</h4>
                                    <p>{relatedBlog.excerpt.substring(0, 100)}...</p>
                                    <span className="related-blog-meta">
                                        {relatedBlog.readTime || 5} min read
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>
            )}
        </div>
    );
}

export default BlogDetail;