import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { enrollmentsAPI, usersAPI } from '../../services/api';
import '../../css/MyAccount.css';

function MyAccount() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [bookmarkedCourses, setBookmarkedCourses] = useState([]);
    const [learningStats, setLearningStats] = useState({});
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else {
                loadUserData();
            }
        }
    }, [isAuthenticated, loading, navigate]);

    const loadUserData = async () => {
        try {
            setLoadingData(true);
            setError(null);
            
            // Load user enrollments
            const enrollments = await enrollmentsAPI.getUserEnrollments();
            setEnrolledCourses(enrollments);
            
            // Calculate learning stats
            const stats = calculateLearningStats(enrollments);
            setLearningStats(stats);
            
            // Mock bookmarked courses for now (implement this in backend later)
            setBookmarkedCourses([]);
            
        } catch (error) {
            console.error('Error loading user data:', error);
            setError(error.message || 'Failed to load user data');
            
            // Fallback to empty data
            setEnrolledCourses([]);
            setBookmarkedCourses([]);
            setLearningStats({
                totalCoursesEnrolled: 0,
                coursesCompleted: 0,
                totalHoursLearned: 0,
                currentStreak: 0,
                certificatesEarned: 0,
                averageProgress: 0,
                favoriteCategory: "None"
            });
        } finally {
            setLoadingData(false);
        }
    };

    const calculateLearningStats = (enrollments) => {
        const completed = enrollments.filter(e => e.isCompleted).length;
        const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
        const avgProgress = enrollments.length > 0 ? Math.round(totalProgress / enrollments.length) : 0;
        
        return {
            totalCoursesEnrolled: enrollments.length,
            coursesCompleted: completed,
            totalHoursLearned: enrollments.reduce((sum, e) => sum + (e.course?.duration || 0), 0),
            currentStreak: 7, // Mock data - implement streak tracking
            certificatesEarned: completed,
            averageProgress: avgProgress,
            favoriteCategory: "Programming" // Mock data - implement category analysis
        };
    };

    const getProgressColor = (progress) => {
        if (progress >= 80) return '#10b981';
        if (progress >= 50) return '#f59e0b';
        return '#ef4444';
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString();
    };

    if (loading || loadingData) {
        return (
            <div className="my-account-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>Loading your account...</h2>
                </div>
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return null; // Will redirect to login
    }

    if (error) {
        return (
            <div className="my-account-container">
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <h2>Error loading account data</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => loadUserData()} 
                        style={{ 
                            padding: '10px 20px', 
                            backgroundColor: '#667eea', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '5px', 
                            cursor: 'pointer' 
                        }}
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="my-account-container">
            <div className="account-header">
                <div className="user-profile">
                    <div className="user-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                        <h1>Welcome back, {user.name}!</h1>
                        <p>Continue your learning journey</p>
                        <small>Role: {user.role}</small>
                    </div>
                </div>
                
                {/* Learning Stats Overview */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-graduation-cap"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{learningStats.totalCoursesEnrolled}</h3>
                            <p>Courses Enrolled</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-trophy"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{learningStats.coursesCompleted}</h3>
                            <p>Courses Completed</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-clock"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{learningStats.totalHoursLearned}h</h3>
                            <p>Hours Learned</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-fire"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{learningStats.currentStreak}</h3>
                            <p>Day Streak</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Tabs */}
            <div className="account-content">
                <div className="account-tabs">
                    <button 
                        className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <i className="fas fa-chart-line"></i>
                        Overview
                    </button>
                    <button 
                        className={`tab ${activeTab === 'courses' ? 'active' : ''}`}
                        onClick={() => setActiveTab('courses')}
                    >
                        <i className="fas fa-book"></i>
                        My Courses
                    </button>
                    <button 
                        className={`tab ${activeTab === 'bookmarks' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookmarks')}
                    >
                        <i className="fas fa-bookmark"></i>
                        Bookmarks
                    </button>
                    <button 
                        className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <i className="fas fa-user"></i>
                        Profile
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="learning-progress">
                                <h3>Learning Progress</h3>
                                <div className="progress-overview">
                                    <div className="overall-progress">
                                        <div className="progress-circle">
                                            <div 
                                                className="progress-fill" 
                                                style={{ 
                                                    background: `conic-gradient(${getProgressColor(learningStats.averageProgress)} ${learningStats.averageProgress * 3.6}deg, #e5e7eb 0deg)` 
                                                }}
                                            >
                                                <span>{learningStats.averageProgress}%</span>
                                            </div>
                                        </div>
                                        <div className="progress-details">
                                            <h4>Overall Progress</h4>
                                            <p>Keep up the great work!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="recent-activity">
                                <h3>Recent Activity</h3>
                                <div className="activity-list">
                                    {enrolledCourses.length > 0 ? (
                                        enrolledCourses.slice(0, 3).map(enrollment => (
                                            <div key={enrollment._id} className="activity-item">
                                                <img 
                                                    src={enrollment.course?.thumbnail || '/images/1.png'} 
                                                    alt={enrollment.course?.title || 'Course'} 
                                                />
                                                <div className="activity-content">
                                                    <h4>{enrollment.course?.title || 'Course'}</h4>
                                                    <p>Last accessed: {formatDate(enrollment.lastAccessedAt)}</p>
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill-bar" 
                                                            style={{ 
                                                                width: `${enrollment.progress}%`,
                                                                backgroundColor: getProgressColor(enrollment.progress)
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span className="progress-text">{enrollment.progress}% complete</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>No enrolled courses yet. <a href="/courses">Browse courses</a> to get started!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="courses-tab">
                            <h3>My Courses ({enrolledCourses.length})</h3>
                            {enrolledCourses.length > 0 ? (
                                <div className="courses-grid">
                                    {enrolledCourses.map(enrollment => (
                                        <div key={enrollment._id} className="course-card">
                                            <div className="course-image">
                                                <img 
                                                    src={enrollment.course?.thumbnail || '/images/1.png'} 
                                                    alt={enrollment.course?.title || 'Course'} 
                                                />
                                                {enrollment.isCompleted && (
                                                    <div className="completion-badge">
                                                        <i className="fas fa-check"></i>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="course-content">
                                                <h4>{enrollment.course?.title || 'Course'}</h4>
                                                <p className="course-category">{enrollment.course?.category?.name || 'Category'}</p>
                                                <div className="course-progress">
                                                    <div className="progress-bar">
                                                        <div 
                                                            className="progress-fill-bar" 
                                                            style={{ 
                                                                width: `${enrollment.progress}%`,
                                                                backgroundColor: getProgressColor(enrollment.progress)
                                                            }}
                                                        ></div>
                                                    </div>
                                                    <span>{enrollment.progress}% • Enrolled: {formatDate(enrollment.enrolledAt)}</span>
                                                </div>
                                                {enrollment.isCompleted && (
                                                    <button className="certificate-btn">
                                                        <i className="fas fa-certificate"></i>
                                                        View Certificate
                                                    </button>
                                                )}
                                                <button 
                                                    className="continue-btn"
                                                    onClick={() => navigate(`/course/${enrollment.course._id}`)}
                                                >
                                                    {enrollment.isCompleted ? 'Review Course' : 'Continue Learning'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <i className="fas fa-book" style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}></i>
                                    <h3>No enrolled courses yet</h3>
                                    <p>Start your learning journey by enrolling in a course!</p>
                                    <button 
                                        className="continue-btn"
                                        onClick={() => navigate('/courses')}
                                        style={{ marginTop: '20px' }}
                                    >
                                        Browse Courses
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bookmarks' && (
                        <div className="bookmarks-tab">
                            <h3>Bookmarked Courses ({bookmarkedCourses.length})</h3>
                            {bookmarkedCourses.length > 0 ? (
                                <div className="bookmarks-grid">
                                    {bookmarkedCourses.map(course => (
                                        <div key={course.id} className="bookmark-card">
                                            <img src={course.image} alt={course.title} />
                                            <div className="bookmark-content">
                                                <h4>{course.title}</h4>
                                                <p>{course.category}</p>
                                                <div className="bookmark-meta">
                                                    <span className="price">${course.price}</span>
                                                    <span className="rating">
                                                        <i className="fas fa-star"></i>
                                                        {course.rating}
                                                    </span>
                                                </div>
                                                <div className="bookmark-actions">
                                                    <button className="enroll-btn">Enroll Now</button>
                                                    <button className="remove-bookmark-btn">
                                                        <i className="fas fa-bookmark"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '50px' }}>
                                    <i className="fas fa-bookmark" style={{ fontSize: '48px', color: '#ccc', marginBottom: '20px' }}></i>
                                    <h3>No bookmarked courses</h3>
                                    <p>Bookmark courses you're interested in for easy access later!</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profile' && (
                        <div className="profile-tab">
                            <h3>Profile Information</h3>
                            <div className="profile-form">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input type="text" value={user.name || ''} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={user.email || ''} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Role</label>
                                    <input type="text" value={user.role || 'student'} readOnly />
                                </div>
                                <div className="form-group">
                                    <label>Bio</label>
                                    <textarea 
                                        placeholder="Tell us about yourself..."
                                        rows="4"
                                        value={user.bio || ''}
                                        readOnly
                                    ></textarea>
                                </div>
                                <button className="update-profile-btn" disabled>
                                    Update Profile (Coming Soon)
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default MyAccount;