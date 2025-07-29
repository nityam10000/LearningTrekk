import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { blogsAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github.css'; // Add syntax highlighting CSS
import '../../css/CreateCourse.css'; // Reusing similar styling

function CreateBlog() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    const { showSuccess, showError } = useNotifications();
    
    const [formData, setFormData] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: '',
        tags: '',
        image: '',
        metaDescription: '',
        isPublished: false
    });
    
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPreview, setShowPreview] = useState(false);

    // Blog categories
    const blogCategories = [
        'Programming',
        'Web Development', 
        'Frontend',
        'Backend',
        'AI/ML',
        'Cloud Computing',
        'Security',
        'DevOps',
        'Mobile Development',
        'Data Science',
        'UI/UX Design',
        'Career',
        'Technology',
        'Tutorials'
    ];

    React.useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else if (user?.role !== 'instructor' && user?.role !== 'admin') {
                navigate('/');
            }
        }
    }, [isAuthenticated, loading, user, navigate]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Blog title is required';
        }

        if (!formData.excerpt.trim()) {
            newErrors.excerpt = 'Blog excerpt is required';
        }

        if (!formData.content.trim()) {
            newErrors.content = 'Blog content is required';
        }

        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }

        if (formData.excerpt.length > 300) {
            newErrors.excerpt = 'Excerpt must be less than 300 characters';
        }

        if (formData.metaDescription && formData.metaDescription.length > 160) {
            newErrors.metaDescription = 'Meta description must be less than 160 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSubmitting(true);

            // Process tags
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);

            const blogData = {
                title: formData.title.trim(),
                excerpt: formData.excerpt.trim(),
                content: formData.content.trim(),
                category: formData.category,
                tags,
                image: formData.image.trim() || '', // Empty string instead of default
                metaDescription: formData.metaDescription.trim(),
                isPublished: formData.isPublished
            };

            console.log('Submitting blog data:', blogData);

            const createdBlog = await blogsAPI.createBlog(blogData);
            
            showSuccess('Blog created successfully!');
            
            // Trigger blog list refresh event
            window.dispatchEvent(new CustomEvent('blogCreated', { 
                detail: { blog: createdBlog } 
            }));
            
            navigate('/instructor/dashboard');
            
        } catch (error) {
            console.error('Error creating blog:', error);
            
            let errorMessage = 'Failed to create blog';
            
            if (error.message.includes('Session expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
                navigate('/login');
            } else if (error.message.includes('permission')) {
                errorMessage = 'You do not have permission to create blogs. Please ensure you are logged in as an instructor.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Please check your form data and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showError(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/instructor/dashboard');
    };

    const togglePreview = () => {
        setShowPreview(prev => !prev);
    };

    if (loading) {
        return (
            <div className="create-course">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="create-course">
            <div className="create-course-header">
                <div className="header-content">
                    <h1>Create New Blog Post</h1>
                    <p>Share your knowledge and insights with the community</p>
                </div>
                <div className="header-actions">
                    <button type="button" className="cancel-btn" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="blog-form"
                        className="submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Blog Post'}
                    </button>
                </div>
            </div>

            <form id="blog-form" className="course-form" onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="title">Blog Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter blog title"
                                className={errors.title ? 'error' : ''}
                                disabled={submitting}
                                maxLength="200"
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="excerpt">Excerpt *</label>
                            <textarea
                                id="excerpt"
                                name="excerpt"
                                value={formData.excerpt}
                                onChange={handleInputChange}
                                placeholder="Brief description of your blog post (max 300 characters)"
                                rows="3"
                                className={errors.excerpt ? 'error' : ''}
                                disabled={submitting}
                                maxLength="300"
                            />
                            {errors.excerpt && <span className="error-message">{errors.excerpt}</span>}
                            <small>{formData.excerpt.length}/300 characters</small>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="category">Category *</label>
                                <select
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                    className={errors.category ? 'error' : ''}
                                    disabled={submitting}
                                >
                                    <option value="">Select a category</option>
                                    {blogCategories.map(category => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <span className="error-message">{errors.category}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="tags">Tags</label>
                                <input
                                    type="text"
                                    id="tags"
                                    name="tags"
                                    value={formData.tags}
                                    onChange={handleInputChange}
                                    placeholder="javascript, react, web development"
                                    disabled={submitting}
                                />
                                <small>Separate tags with commas</small>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="image">Featured Image URL</label>
                            <input
                                type="url"
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleInputChange}
                                placeholder="https://example.com/image.jpg"
                                disabled={submitting}
                            />
                            <small>URL to the blog featured image (optional)</small>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="form-section">
                        <h3>Content</h3>
                        
                        <div className="form-group">
                            <label htmlFor="content">Blog Content *</label>
                            <textarea
                                id="content"
                                name="content"
                                value={formData.content}
                                onChange={handleInputChange}
                                placeholder="Write your blog content here..."
                                rows="15"
                                className={errors.content ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.content && <span className="error-message">{errors.content}</span>}
                            <small>Support for Markdown coming soon</small>
                        </div>

                        <div className="form-group preview-toggle">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={showPreview}
                                    onChange={togglePreview}
                                    disabled={submitting}
                                />
                                Show Markdown Preview
                            </label>
                        </div>

                        {showPreview && (
                            <div className="markdown-preview">
                                <h4>Preview</h4>
                                <ReactMarkdown
                                    children={formData.content}
                                    remarkPlugins={[remarkGfm]}
                                    rehypePlugins={[rehypeHighlight, rehypeRaw]}
                                />
                            </div>
                        )}
                    </div>

                    {/* SEO & Publishing */}
                    <div className="form-section">
                        <h3>SEO & Publishing</h3>
                        
                        <div className="form-group">
                            <label htmlFor="metaDescription">Meta Description</label>
                            <textarea
                                id="metaDescription"
                                name="metaDescription"
                                value={formData.metaDescription}
                                onChange={handleInputChange}
                                placeholder="Brief description for search engines (max 160 characters)"
                                rows="2"
                                className={errors.metaDescription ? 'error' : ''}
                                disabled={submitting}
                                maxLength="160"
                            />
                            {errors.metaDescription && <span className="error-message">{errors.metaDescription}</span>}
                            <small>{formData.metaDescription.length}/160 characters</small>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    name="isPublished"
                                    checked={formData.isPublished}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                />
                                Publish immediately
                            </label>
                            <small>If unchecked, blog will be saved as draft</small>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default CreateBlog;