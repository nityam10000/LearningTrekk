import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { coursesAPI, enrollmentsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLocalStorage } from '../../hooks/useCommon';
import '../../css/CourseDetail.css';

function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const { showSuccess, showError, showInfo } = useNotifications();
    
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBookmarked, setIsBookmarked] = useLocalStorage(`bookmark_${id}`, false);
    const [activeTab, setActiveTab] = useState('overview');
    const [enrolling, setEnrolling] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [expandedSection, setExpandedSection] = useState(null);

    useEffect(() => {
        if (id) {
            loadCourseData();
            checkEnrollmentStatus();
        }
    }, [id, isAuthenticated]);

    const loadCourseData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const courseData = await coursesAPI.getCourseById(id);
            setCourse(courseData);
            
        } catch (error) {
            console.error('Error loading course:', error);
            setError(error.message || 'Failed to load course details');
            showError('Failed to load course details');
        } finally {
            setLoading(false);
        }
    }, [id, showError]);

    const checkEnrollmentStatus = useCallback(async () => {
        if (!isAuthenticated) return;
        
        try {
            const enrollments = await enrollmentsAPI.getUserEnrollments();
            const enrolled = enrollments.some(enrollment => 
                enrollment.course._id === id || enrollment.course === id
            );
            setIsEnrolled(enrolled);
        } catch (error) {
            console.error('Error checking enrollment:', error);
        }
    }, [id, isAuthenticated]);

    const handleEnroll = async () => {
        if (!isAuthenticated) {
            showInfo('Please log in to enroll in this course');
            navigate('/login');
            return;
        }

        try {
            setEnrolling(true);
            await enrollmentsAPI.enrollInCourse(id);
            setIsEnrolled(true);
            showSuccess('Successfully enrolled in the course!', {
                title: 'Enrollment Successful',
                action: {
                    label: 'Go to My Courses',
                    onClick: () => navigate('/myaccount')
                }
            });
        } catch (error) {
            console.error('Enrollment error:', error);
            showError(error.message || 'Failed to enroll in course');
        } finally {
            setEnrolling(false);
        }
    };

    const handleBookmark = () => {
        if (!isAuthenticated) {
            showInfo('Please log in to bookmark courses');
            navigate('/login');
            return;
        }
        
        const newBookmarkStatus = !isBookmarked;
        setIsBookmarked(newBookmarkStatus);
        
        if (newBookmarkStatus) {
            showSuccess('Course bookmarked successfully');
        } else {
            showInfo('Course removed from bookmarks');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        
        if (!isAuthenticated) {
            showInfo('Please log in to submit a review');
            navigate('/login');
            return;
        }

        if (!isEnrolled) {
            showError('You must be enrolled in this course to submit a review');
            return;
        }

        try {
            setSubmittingReview(true);
            await coursesAPI.addReview(id, reviewForm.rating, reviewForm.comment);
            
            showSuccess('Review submitted successfully!');
            setShowReviewForm(false);
            setReviewForm({ rating: 5, comment: '' });
            
            // Reload course data to show updated reviews
            loadCourseData();
        } catch (error) {
            console.error('Error submitting review:', error);
            showError(error.message || 'Failed to submit review');
        } finally {
            setSubmittingReview(false);
        }
    };

    const renderStars = (rating, interactive = false, size = 'medium') => {
        const stars = [];
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        
        const sizeClass = size === 'large' ? 'star-large' : size === 'small' ? 'star-small' : '';
        
        for (let i = 1; i <= 5; i++) {
            const filled = i <= fullStars;
            const half = i === fullStars + 1 && hasHalfStar;
            
            stars.push(
                <i 
                    key={i} 
                    className={`${filled ? 'fas' : half ? 'fas fa-star-half-alt' : 'far'} fa-star ${sizeClass} ${
                        filled || half ? 'star-filled' : 'star-empty'
                    } ${interactive ? 'star-interactive' : ''}`}
                    onClick={interactive ? () => setReviewForm(prev => ({ ...prev, rating: i })) : undefined}
                    style={{ cursor: interactive ? 'pointer' : 'default' }}
                />
            );
        }
        
        return stars;
    };

    const formatDuration = (duration) => {
        if (!duration) return 'Not specified';
        if (typeof duration === 'string') return duration;
        return `${duration} hours`;
    };

    const formatPrice = (price, originalPrice) => {
        if (!price || price === 0) return 'Free';
        
        return (
            <div className="price-display">
                <span className="current-price">${price}</span>
                {originalPrice && originalPrice > price && (
                    <span className="original-price">${originalPrice}</span>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="course-detail-container">
                <div className="loading-state">
                    <div className="loading-spinner"></div>
                    <h2>Loading course details...</h2>
                    <p>Please wait while we fetch the course information.</p>
                </div>
            </div>
        );
    }

    if (error || !course) {
        return (
            <div className="course-detail-container">
                <div className="error-state">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Course not found</h2>
                    <p>{error || 'The course you are looking for does not exist or has been removed.'}</p>
                    <div className="error-actions">
                        <button onClick={() => navigate('/courses')} className="btn btn--primary">
                            Browse All Courses
                        </button>
                        <button onClick={loadCourseData} className="btn btn--secondary">
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="course-detail-container">
            {/* Course Header */}
            <div className="course-header">
                <div className="course-hero">
                    <div className="course-info">
                        <div className="course-breadcrumb">
                            <span onClick={() => navigate('/courses')} className="breadcrumb-link">
                                Courses
                            </span>
                            <i className="fas fa-chevron-right"></i>
                            <span>{course.category?.name || 'Category'}</span>
                            <i className="fas fa-chevron-right"></i>
                            <span>{course.title}</span>
                        </div>
                        
                        <h1 className="course-title">{course.title}</h1>
                        <p className="course-description">{course.description}</p>
                        
                        <div className="course-meta">
                            <div className="meta-item">
                                <div className="rating-display">
                                    {renderStars(course.rating || 0)}
                                    <span className="rating-text">
                                        {(course.rating || 0).toFixed(1)} ({course.numReviews || course.reviewCount || 0} reviews)
                                    </span>
                                </div>
                            </div>
                            <div className="meta-item">
                                <i className="fas fa-users"></i>
                                <span>{course.enrolledStudents?.length || 0} students enrolled</span>
                            </div>
                            <div className="meta-item">
                                <i className="fas fa-clock"></i>
                                <span>{formatDuration(course.duration)}</span>
                            </div>
                            <div className="meta-item">
                                <i className="fas fa-signal"></i>
                                <span>{course.level || 'Beginner'} level</span>
                            </div>
                        </div>

                        <div className="instructor-info">
                            <img 
                                src={course.instructor?.avatar || '/images/instructor1.png'} 
                                alt={course.instructor?.name || 'Instructor'} 
                                className="instructor-avatar"
                            />
                            <div>
                                <p className="instructor-label">Instructor</p>
                                <p className="instructor-name">{course.instructor?.name || 'Unknown Instructor'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="course-sidebar">
                        <div className="course-card">
                            <img 
                                src={course.thumbnail || '/images/1.png'} 
                                alt={course.title} 
                                className="course-image"
                            />
                            
                            <div className="card-content">
                                <div className="price-section">
                                    {formatPrice(course.price, course.originalPrice)}
                                </div>

                                <div className="action-buttons">
                                    {isEnrolled ? (
                                        <button 
                                            className="btn btn--success btn--large"
                                            onClick={() => navigate('/myaccount')}
                                        >
                                            <i className="fas fa-play"></i>
                                            Continue Learning
                                        </button>
                                    ) : (
                                        <button 
                                            className="btn btn--primary btn--large"
                                            onClick={handleEnroll}
                                            disabled={enrolling}
                                        >
                                            {enrolling ? (
                                                <>
                                                    <div className="btn-spinner"></div>
                                                    <span>Enrolling...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-graduation-cap"></i>
                                                    <span>Enroll Now</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                    
                                    <button 
                                        className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
                                        onClick={handleBookmark}
                                    >
                                        <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
                                        {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                                    </button>
                                </div>

                                <div className="course-features">
                                    <div className="feature-item">
                                        <i className="fas fa-infinity"></i>
                                        <span>Lifetime Access</span>
                                    </div>
                                    <div className="feature-item">
                                        <i className="fas fa-mobile-alt"></i>
                                        <span>Mobile Friendly</span>
                                    </div>
                                    <div className="feature-item">
                                        <i className="fas fa-certificate"></i>
                                        <span>Certificate of Completion</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Course Content Tabs */}
            <div className="course-content">
                <div className="course-tabs">
                    <button 
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-info-circle"></i>
                        Overview
                    </button>
                    <button 
                        className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
                        onClick={() => setActiveTab('curriculum')}
                    >
                        <i className="fas fa-list"></i>
                        Curriculum
                    </button>
                    <button 
                        className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
                        onClick={() => setActiveTab('reviews')}
                    >
                        <i className="fas fa-star"></i>
                        Reviews ({course.numReviews || course.reviewCount || 0})
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            {course.whatYouWillLearn && course.whatYouWillLearn.length > 0 && (
                                <div className="what-youll-learn">
                                    <h3>What you'll learn</h3>
                                    <ul>
                                        {course.whatYouWillLearn.map((outcome, index) => (
                                            <li key={index}>
                                                <i className="fas fa-check"></i>
                                                {outcome}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {course.requirements && course.requirements.length > 0 && (
                                <div className="requirements">
                                    <h3>Requirements</h3>
                                    <ul>
                                        {course.requirements.map((requirement, index) => (
                                            <li key={index}>
                                                <i className="fas fa-exclamation-circle"></i>
                                                {requirement}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <div className="course-description-full">
                                <h3>Course Description</h3>
                                <div 
                                    className="description-content"
                                    dangerouslySetInnerHTML={{ __html: course.fullDescription || course.description }}
                                />
                            </div>

                            {course.tags && course.tags.length > 0 && (
                                <div className="course-tags">
                                    <h3>Tags</h3>
                                    <div className="tags-list">
                                        {course.tags.map((tag, index) => (
                                            <span key={index} className="tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'curriculum' && (
                        <div className="curriculum-tab">
                            <h3>Course Curriculum</h3>
                            {course.lessons && course.lessons.length > 0 ? (
                                <div className="curriculum-list">
                                    {course.lessons.map((lesson, index) => (
                                        <div key={index} className="curriculum-item">
                                            <div 
                                                className="lesson-header"
                                                onClick={() => setExpandedSection(
                                                    expandedSection === index ? null : index
                                                )}
                                            >
                                                <div className="lesson-info">
                                                    <i className="fas fa-play-circle"></i>
                                                    <span className="lesson-title">{lesson.title}</span>
                                                </div>
                                                <div className="lesson-meta">
                                                    <span className="lesson-duration">{lesson.duration || '5 min'}</span>
                                                    <i className={`fas fa-chevron-${expandedSection === index ? 'up' : 'down'}`}></i>
                                                </div>
                                            </div>
                                            {expandedSection === index && (
                                                <div className="lesson-content">
                                                    <p>{lesson.description || 'Lesson content preview will be available after enrollment.'}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="curriculum-placeholder">
                                    <i className="fas fa-list-alt"></i>
                                    <h4>Curriculum Coming Soon</h4>
                                    <p>The detailed curriculum for this course will be available soon.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="reviews-tab">
                            <div className="reviews-header">
                                <h3>Student Reviews</h3>
                                {isEnrolled && !showReviewForm && (
                                    <button 
                                        className="btn btn--outline"
                                        onClick={() => setShowReviewForm(true)}
                                    >
                                        <i className="fas fa-plus"></i>
                                        Write a Review
                                    </button>
                                )}
                            </div>

                            {showReviewForm && (
                                <div className="review-form-container">
                                    <form onSubmit={handleSubmitReview} className="review-form">
                                        <h4>Write Your Review</h4>
                                        <div className="rating-input">
                                            <label>Rating:</label>
                                            <div className="stars-input">
                                                {renderStars(reviewForm.rating, true, 'large')}
                                            </div>
                                        </div>
                                        <div className="comment-input">
                                            <label htmlFor="review-comment">Comment:</label>
                                            <textarea
                                                id="review-comment"
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))
                                                }
                                                placeholder="Share your experience with this course..."
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <div className="form-actions">
                                            <button 
                                                type="submit" 
                                                className="btn btn--primary"
                                                disabled={submittingReview}
                                            >
                                                {submittingReview ? 'Submitting...' : 'Submit Review'}
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn btn--secondary"
                                                onClick={() => setShowReviewForm(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="reviews-list">
                                {course.reviews && course.reviews.length > 0 ? (
                                    course.reviews.map((review, index) => (
                                        <div key={index} className="review-item">
                                            <div className="review-header">
                                                <div className="reviewer-info">
                                                    <div className="reviewer-avatar">
                                                        {review.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div>
                                                        <h5>{review.user?.name || 'Anonymous'}</h5>
                                                        <div className="review-rating">
                                                            {renderStars(review.rating, false, 'small')}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="review-date">
                                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Recent'}
                                                </div>
                                            </div>
                                            <div className="review-content">
                                                <p>{review.comment}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="no-reviews">
                                        <i className="fas fa-star"></i>
                                        <h4>No reviews yet</h4>
                                        <p>Be the first to review this course!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseDetail;