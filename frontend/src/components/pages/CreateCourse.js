import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { coursesAPI, categoriesAPI } from '../../services/api';
import '../../css/CreateCourse.css';

function CreateCourse() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        shortDescription: '',
        category: '',
        price: '',
        originalPrice: '',
        thumbnail: '',
        level: 'Beginner',
        duration: '',
        tags: '',
        requirements: '',
        whatYouWillLearn: '',
        videoUrl: ''
    });
    
    const [categories, setCategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else if (user?.role !== 'instructor' && user?.role !== 'admin') {
                navigate('/');
            } else {
                loadCategories();
            }
        }
    }, [isAuthenticated, loading, user, navigate]);

    const loadCategories = async () => {
        try {
            setLoadingCategories(true);
            const categoriesData = await categoriesAPI.getAllCategories();
            if (categoriesData && categoriesData.length > 0) {
                setCategories(categoriesData);
            } else {
                // If API returns empty or invalid data, use fallback
                throw new Error('No categories received from API');
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            // Use simplified fallback categories that work with the backend
            setCategories([
                { _id: 'programming', name: 'Programming & Software Development' },
                { _id: 'web-development', name: 'Web Development' },
                { _id: 'mobile-development', name: 'Mobile App Development' },
                { _id: 'data-science', name: 'Data Science & Analytics' },
                { _id: 'machine-learning', name: 'Machine Learning & AI' },
                { _id: 'cybersecurity', name: 'Cybersecurity' },
                { _id: 'ui-ux-design', name: 'UI/UX Design' },
                { _id: 'graphic-design', name: 'Graphic Design' },
                { _id: 'digital-marketing', name: 'Digital Marketing' },
                { _id: 'business', name: 'Business & Management' },
                { _id: 'finance', name: 'Finance & Accounting' },
                { _id: 'personal-development', name: 'Personal Development' },
                { _id: 'other', name: 'Other' }
            ]);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
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
            newErrors.title = 'Course title is required';
        }

        if (!formData.description.trim()) {
            newErrors.description = 'Course description is required';
        }

        if (!formData.category) {
            newErrors.category = 'Please select a category';
        }

        if (!formData.price || formData.price <= 0) {
            newErrors.price = 'Please enter a valid price';
        }

        if (!formData.thumbnail.trim()) {
            newErrors.thumbnail = 'Course thumbnail URL is required';
        }

        if (!formData.duration || formData.duration <= 0) {
            newErrors.duration = 'Please enter course duration in hours';
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

            // Process tags, requirements, and learning outcomes
            const tags = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
            const requirements = formData.requirements.split('\n').map(req => req.trim()).filter(req => req);
            const whatYouWillLearn = formData.whatYouWillLearn.split('\n').map(item => item.trim()).filter(item => item);

            const courseData = {
                title: formData.title.trim(),
                description: formData.description.trim(),
                shortDescription: formData.shortDescription.trim(),
                category: formData.category,
                price: parseFloat(formData.price),
                originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
                thumbnail: formData.thumbnail.trim(),
                level: formData.level,
                duration: parseFloat(formData.duration),
                tags,
                requirements,
                whatYouWillLearn,
                isPublished: true, // Automatically publish new courses so they appear in Courses section
                // Add video URL if provided
                ...(formData.videoUrl && { videoUrl: formData.videoUrl.trim() })
            };

            console.log('Submitting course data:', courseData);
            console.log('User info:', user);
            console.log('Auth token from localStorage:', localStorage.getItem('user-info'));

            const createdCourse = await coursesAPI.createCourse(courseData);
            
            alert('Course created successfully!');
            navigate('/instructor/mycourses');
            
        } catch (error) {
            console.error('Error creating course:', error);
            
            // Provide more specific error messages
            let errorMessage = 'Failed to create course';
            
            if (error.message.includes('Session expired')) {
                errorMessage = 'Your session has expired. Please log in again.';
                navigate('/login');
            } else if (error.message.includes('permission')) {
                errorMessage = 'You do not have permission to create courses. Please ensure you are logged in as an instructor.';
            } else if (error.message.includes('validation')) {
                errorMessage = 'Please check your form data and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            alert(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate('/instructor/mycourses');
    };

    if (loading || loadingCategories) {
        return (
            <div className="create-course">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    // Debug log to check categories
    console.log('Categories loaded:', categories);

    return (
        <div className="create-course">
            <div className="create-course-header">
                <div className="header-content">
                    <h1>Create New Course</h1>
                    <p>Share your knowledge and create an engaging learning experience</p>
                </div>
                <div className="header-actions">
                    <button type="button" className="cancel-btn" onClick={handleCancel}>
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        form="course-form"
                        className="submit-btn"
                        disabled={submitting}
                    >
                        {submitting ? 'Creating...' : 'Create Course'}
                    </button>
                </div>
            </div>

            <form id="course-form" className="course-form" onSubmit={handleSubmit}>
                <div className="form-sections">
                    {/* Basic Information */}
                    <div className="form-section">
                        <h3>Basic Information</h3>
                        
                        <div className="form-group">
                            <label htmlFor="title">Course Title *</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                placeholder="Enter course title"
                                className={errors.title ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.title && <span className="error-message">{errors.title}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="shortDescription">Short Description</label>
                            <input
                                type="text"
                                id="shortDescription"
                                name="shortDescription"
                                value={formData.shortDescription}
                                onChange={handleInputChange}
                                placeholder="Brief description for course cards"
                                maxLength="200"
                                disabled={submitting}
                            />
                            <small>Maximum 200 characters</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Course Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Detailed description of your course"
                                rows="6"
                                className={errors.description ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.description && <span className="error-message">{errors.description}</span>}
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
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <span className="error-message">{errors.category}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="level">Difficulty Level *</label>
                                <select
                                    id="level"
                                    name="level"
                                    value={formData.level}
                                    onChange={handleInputChange}
                                    disabled={submitting}
                                >
                                    <option value="Beginner">Beginner</option>
                                    <option value="Intermediate">Intermediate</option>
                                    <option value="Advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Pricing and Duration */}
                    <div className="form-section">
                        <h3>Pricing & Duration</h3>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="price">Price (₹) *</label>
                                <input
                                    type="number"
                                    id="price"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className={errors.price ? 'error' : ''}
                                    disabled={submitting}
                                />
                                {errors.price && <span className="error-message">{errors.price}</span>}
                            </div>

                            <div className="form-group">
                                <label htmlFor="originalPrice">Original Price (Optional)</label>
                                <input
                                    type="number"
                                    id="originalPrice"
                                    name="originalPrice"
                                    value={formData.originalPrice}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    disabled={submitting}
                                />
                                <small>For showing discounts</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="duration">Duration (Hours) *</label>
                                <input
                                    type="number"
                                    id="duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="0"
                                    min="0"
                                    step="0.5"
                                    className={errors.duration ? 'error' : ''}
                                    disabled={submitting}
                                />
                                {errors.duration && <span className="error-message">{errors.duration}</span>}
                            </div>
                        </div>
                    </div>

                    {/* Media */}
                    <div className="form-section">
                        <h3>Course Media</h3>
                        
                        <div className="form-group">
                            <label htmlFor="thumbnail">Course Thumbnail URL *</label>
                            <input
                                type="url"
                                id="thumbnail"
                                name="thumbnail"
                                value={formData.thumbnail}
                                onChange={handleInputChange}
                                placeholder="https://example.com/image.jpg"
                                className={errors.thumbnail ? 'error' : ''}
                                disabled={submitting}
                            />
                            {errors.thumbnail && <span className="error-message">{errors.thumbnail}</span>}
                            <small>URL to the course thumbnail image</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="videoUrl">Course Preview Video URL (Optional)</label>
                            <input
                                type="url"
                                id="videoUrl"
                                name="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleInputChange}
                                placeholder="https://youtube.com/watch?v=..."
                                disabled={submitting}
                            />
                            <small>YouTube, Vimeo, or direct video URL for course preview</small>
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="form-section">
                        <h3>Course Details</h3>
                        
                        <div className="form-group">
                            <label htmlFor="whatYouWillLearn">What Students Will Learn</label>
                            <textarea
                                id="whatYouWillLearn"
                                name="whatYouWillLearn"
                                value={formData.whatYouWillLearn}
                                onChange={handleInputChange}
                                placeholder="Enter each learning outcome on a new line&#10;Example:&#10;Build responsive websites&#10;Master JavaScript fundamentals&#10;Create interactive web applications"
                                rows="6"
                                disabled={submitting}
                            />
                            <small>Enter each learning outcome on a new line</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="requirements">Course Requirements</label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                placeholder="Enter each requirement on a new line&#10;Example:&#10;Basic computer knowledge&#10;Internet connection&#10;No prior experience needed"
                                rows="4"
                                disabled={submitting}
                            />
                            <small>Enter each requirement on a new line</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tags">Course Tags</label>
                            <input
                                type="text"
                                id="tags"
                                name="tags"
                                value={formData.tags}
                                onChange={handleInputChange}
                                placeholder="javascript, web development, frontend, react"
                                disabled={submitting}
                            />
                            <small>Separate tags with commas</small>
                        </div>
                    </div>
                </div>

            </form>
        </div>
    );
}

export default CreateCourse;