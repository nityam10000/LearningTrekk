import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { coursesAPI, categoriesAPI, blogsAPI } from '../../services/api';
import '../../css/InstructorDashboard.css';

function InstructorDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated, loading } = useAuth();
    const { showSuccess, showError, showInfo } = useNotifications();
    
    const [activeTab, setActiveTab] = useState('overview');
    const [myCourses, setMyCourses] = useState([]);
    const [filteredCourses, setFilteredCourses] = useState([]);
    const [myBlogs, setMyBlogs] = useState([]);
    const [filteredBlogs, setFilteredBlogs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [stats, setStats] = useState({});
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    
    // Course filtering and search states
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, published, draft
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // newest, oldest, popular, rating
    const [selectedCourses, setSelectedCourses] = useState([]);
    const [viewMode, setViewMode] = useState('grid'); // grid, list

    useEffect(() => {
        if (!loading) {
            if (!isAuthenticated) {
                navigate('/login');
            } else {
                // Allow all authenticated users to access the dashboard
                loadDashboardData();
                loadCategories();
                loadBlogData();
            }
        }
    }, [isAuthenticated, loading, user, navigate]);

    // Filter courses whenever search, filter, or sort criteria change
    useEffect(() => {
        filterAndSortCourses();
    }, [myCourses, searchQuery, statusFilter, categoryFilter, sortBy]);

    const loadDashboardData = async () => {
        try {
            setLoadingData(true);
            setError(null);
            
            // Load courses based on user role
            let courses = [];
            if (user?.role === 'instructor' || user?.role === 'admin') {
                courses = await coursesAPI.getInstructorCourses();
            } else {
                // For students, load all published courses for viewing
                const response = await coursesAPI.getAllCourses();
                courses = response.courses || response || [];
            }
            
            setMyCourses(courses);
            
            // Calculate stats
            const totalStudents = courses.reduce((sum, course) => sum + (course.enrolledStudents?.length || 0), 0);
            const totalRevenue = courses.reduce((sum, course) => sum + (course.price * (course.enrolledStudents?.length || 0)), 0);
            const avgRating = courses.length > 0 ? 
                courses.reduce((sum, course) => sum + (course.rating || 0), 0) / courses.length : 0;
            
            setStats({
                totalCourses: courses.length,
                publishedCourses: courses.filter(c => c.isPublished).length,
                draftCourses: courses.filter(c => !c.isPublished).length,
                totalStudents,
                totalRevenue,
                averageRating: avgRating.toFixed(1),
                totalViews: courses.reduce((sum, course) => sum + (course.views || 0), 0),
                totalReviews: courses.reduce((sum, course) => sum + (course.numReviews || 0), 0)
            });
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setError(error.message || 'Failed to load dashboard data');
            showError('Failed to load dashboard data');
            setMyCourses([]);
            setStats({
                totalCourses: 0,
                publishedCourses: 0,
                draftCourses: 0,
                totalStudents: 0,
                totalRevenue: 0,
                averageRating: 0,
                totalViews: 0,
                totalReviews: 0
            });
        } finally {
            setLoadingData(false);
        }
    };

    const loadCategories = async () => {
        try {
            const categoriesData = await categoriesAPI.getAllCategories();
            setCategories(categoriesData);
        } catch (error) {
            console.error('Error loading categories:', error);
            // Use fallback categories if API fails
            setCategories([
                { _id: '1', name: 'Programming', courseCount: 12, description: 'Programming courses' },
                { _id: '2', name: 'Web Development', courseCount: 8, description: 'Web development courses' },
                { _id: '3', name: 'Data Science', courseCount: 6, description: 'Data science courses' },
                { _id: '4', name: 'Design', courseCount: 4, description: 'Design courses' },
                { _id: '5', name: 'Business', courseCount: 3, description: 'Business courses' }
            ]);
        }
    };

    // Load blogs for instructors
    const loadBlogData = async () => {
        if (user?.role === 'instructor' || user?.role === 'admin') {
            try {
                const blogs = await blogsAPI.getInstructorBlogs();
                setMyBlogs(blogs);
                setFilteredBlogs(blogs);
            } catch (error) {
                console.error('Error loading blogs:', error);
                setMyBlogs([]);
                setFilteredBlogs([]);
            }
        }
    };

    const filterAndSortCourses = () => {
        let filtered = [...myCourses];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(course =>
                course.title.toLowerCase().includes(query) ||
                course.description?.toLowerCase().includes(query) ||
                course.category?.name?.toLowerCase().includes(query)
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(course => {
                if (statusFilter === 'published') return course.isPublished;
                if (statusFilter === 'draft') return !course.isPublished;
                return true;
            });
        }

        // Apply category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(course => 
                course.category?._id === categoryFilter || course.category?.name === categoryFilter
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'oldest':
                    return new Date(a.createdAt) - new Date(b.createdAt);
                case 'popular':
                    return (b.enrolledStudents?.length || 0) - (a.enrolledStudents?.length || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'alphabetical':
                    return a.title.localeCompare(b.title);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                default:
                    return 0;
            }
        });

        setFilteredCourses(filtered);
    };

    const handleCreateCourse = () => {
        navigate('/instructor/create-course');
    };

    const handleEditCourse = (courseId) => {
        navigate(`/instructor/edit-course/${courseId}`);
    };

    const handleViewCourse = (courseId) => {
        navigate(`/course/${courseId}`);
    };

    const handleDuplicateCourse = async (course) => {
        try {
            // Create a copy of the course with modified title
            const duplicatedCourse = {
                ...course,
                title: `${course.title} (Copy)`,
                isPublished: false // Always start as draft
            };
            
            // Remove fields that shouldn't be duplicated
            delete duplicatedCourse._id;
            delete duplicatedCourse.createdAt;
            delete duplicatedCourse.updatedAt;
            delete duplicatedCourse.enrolledStudents;
            delete duplicatedCourse.reviews;
            delete duplicatedCourse.rating;
            delete duplicatedCourse.numReviews;

            await coursesAPI.createCourse(duplicatedCourse);
            showSuccess('Course duplicated successfully!');
            loadDashboardData(); // Refresh the data
        } catch (error) {
            console.error('Error duplicating course:', error);
            showError('Failed to duplicate course');
        }
    };

    const handleDeleteCourse = async (courseId, courseTitle) => {
        if (window.confirm(`Are you sure you want to delete "${courseTitle}"? This action cannot be undone.`)) {
            try {
                // Note: You'll need to implement this API endpoint
                // await coursesAPI.deleteCourse(courseId);
                showInfo('Delete functionality will be implemented soon');
                // loadDashboardData(); // Refresh the data
            } catch (error) {
                console.error('Error deleting course:', error);
                showError('Failed to delete course');
            }
        }
    };

    const handlePublishToggle = async (courseId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await coursesAPI.updateCourse(courseId, { isPublished: newStatus });
            
            // Update the course in the local state
            setMyCourses(prevCourses => 
                prevCourses.map(course => 
                    course._id === courseId 
                        ? { ...course, isPublished: newStatus }
                        : course
                )
            );
            
            showSuccess(`Course ${newStatus ? 'published' : 'unpublished'} successfully!`);
        } catch (error) {
            console.error('Error toggling publish status:', error);
            showError('Failed to update course publish status');
        }
    };

    const handleBulkPublish = async (publish = true) => {
        if (selectedCourses.length === 0) {
            showInfo('Please select courses first');
            return;
        }

        try {
            // Update all selected courses
            const updatePromises = selectedCourses.map(courseId => 
                coursesAPI.updateCourse(courseId, { isPublished: publish })
            );
            
            await Promise.all(updatePromises);
            
            // Update local state
            setMyCourses(prevCourses => 
                prevCourses.map(course => 
                    selectedCourses.includes(course._id)
                        ? { ...course, isPublished: publish }
                        : course
                )
            );
            
            setSelectedCourses([]);
            showSuccess(`${selectedCourses.length} courses ${publish ? 'published' : 'unpublished'} successfully!`);
        } catch (error) {
            console.error('Error bulk updating publish status:', error);
            showError('Failed to update course publish status');
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedCourses.length === 0) {
            showInfo('Please select courses first');
            return;
        }

        try {
            switch (action) {
                case 'publish':
                    await handleBulkPublish(true);
                    break;
                case 'unpublish':
                    await handleBulkPublish(false);
                    break;
                case 'delete':
                    if (window.confirm(`Are you sure you want to delete ${selectedCourses.length} courses? This action cannot be undone.`)) {
                        showInfo('Bulk delete functionality will be implemented soon');
                    }
                    break;
                default:
                    showInfo(`${action} functionality will be implemented soon`);
                    break;
            }
        } catch (error) {
            console.error('Error performing bulk action:', error);
            showError('Failed to perform bulk action');
        }
    };

    const handleCourseSelect = (courseId, isSelected) => {
        if (isSelected) {
            setSelectedCourses([...selectedCourses, courseId]);
        } else {
            setSelectedCourses(selectedCourses.filter(id => id !== courseId));
        }
    };

    const handleSelectAll = () => {
        if (selectedCourses.length === filteredCourses.length) {
            setSelectedCourses([]);
        } else {
            setSelectedCourses(filteredCourses.map(course => course._id));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const getStatusColor = (isPublished) => {
        return isPublished ? '#10b981' : '#f59e0b';
    };

    const getCourseProgress = (course) => {
        // Calculate course completion percentage based on lessons, content, etc.
        let progress = 0;
        if (course.title) progress += 10;
        if (course.description) progress += 10;
        if (course.thumbnail) progress += 10;
        if (course.category) progress += 10;
        if (course.price >= 0) progress += 10;
        if (course.lessons?.length > 0) progress += 30;
        if (course.requirements?.length > 0) progress += 10;
        if (course.whatYouWillLearn?.length > 0) progress += 10;
        return Math.min(progress, 100);
    };

    // Blog management functions
    const handleCreateBlog = () => {
        navigate('/instructor/create-blog');
    };

    const handleEditBlog = (blogId) => {
        navigate(`/instructor/edit-blog/${blogId}`);
    };

    const handleViewBlog = (blogId) => {
        navigate(`/blog/${blogId}`);
    };

    const handleDeleteBlog = async (blogId, blogTitle) => {
        if (window.confirm(`Are you sure you want to delete "${blogTitle}"? This action cannot be undone.`)) {
            try {
                await blogsAPI.deleteBlog(blogId);
                showSuccess('Blog deleted successfully!');
                loadBlogData(); // Refresh the data
            } catch (error) {
                console.error('Error deleting blog:', error);
                showError('Failed to delete blog');
            }
        }
    };

    const handleBlogPublishToggle = async (blogId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await blogsAPI.updateBlog(blogId, { isPublished: newStatus });
            
            // Update the blog in the local state
            setMyBlogs(prevBlogs => 
                prevBlogs.map(blog => 
                    blog._id === blogId 
                        ? { ...blog, isPublished: newStatus }
                        : blog
                )
            );
            
            setFilteredBlogs(prevBlogs => 
                prevBlogs.map(blog => 
                    blog._id === blogId 
                        ? { ...blog, isPublished: newStatus }
                        : blog
                )
            );
            
            showSuccess(`Blog ${newStatus ? 'published' : 'unpublished'} successfully!`);
        } catch (error) {
            console.error('Error toggling blog publish status:', error);
            showError('Failed to update blog publish status');
        }
    };

    if (loading || loadingData) {
        return (
            <div className="instructor-dashboard">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <h2>Loading dashboard...</h2>
                    <p>Please wait while we fetch your data</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="instructor-dashboard">
                <div className="error-container">
                    <div className="error-icon">
                        <i className="fas fa-exclamation-triangle"></i>
                    </div>
                    <h2>Error loading dashboard</h2>
                    <p>{error}</p>
                    <button 
                        onClick={loadDashboardData} 
                        className="retry-btn"
                    >
                        <i className="fas fa-redo"></i>
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="instructor-dashboard">
            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div className="instructor-profile">
                    <div className="instructor-avatar">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="instructor-info">
                        <h1>Welcome back, {user.name}!</h1>
                        <p>
                            {user?.role === 'instructor' || user?.role === 'admin' 
                                ? 'Manage your courses and track your teaching progress'
                                : 'Explore courses and track your learning journey'
                            }
                        </p>
                        <small>
                            {user?.role === 'instructor' ? 'Instructor Dashboard' : 
                             user?.role === 'admin' ? 'Admin Dashboard' : 'Course Dashboard'}
                        </small>
                    </div>
                </div>
                
                <div className="quick-actions">
                    {(user?.role === 'instructor' || user?.role === 'admin') && (
                        <button className="create-course-btn" onClick={handleCreateCourse}>
                            <i className="fas fa-plus"></i>
                            Create New Course
                        </button>
                    )}
                </div>
            </div>

            {/* Enhanced Stats Overview */}
            <div className="stats-overview">
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-book"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.totalCourses}</h3>
                            <p>Total Courses</p>
                            <small>{stats.publishedCourses} published, {stats.draftCourses} drafts</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-users"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.totalStudents}</h3>
                            <p>Total Students</p>
                            <small>Across all courses</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-rupee-sign"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{formatCurrency(stats.totalRevenue)}</h3>
                            <p>Total Revenue</p>
                            <small>Estimated earnings</small>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">
                            <i className="fas fa-star"></i>
                        </div>
                        <div className="stat-content">
                            <h3>{stats.averageRating}</h3>
                            <p>Average Rating</p>
                            <small>{stats.totalReviews} total reviews</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <div className="dashboard-content">
                <div className="dashboard-tabs">
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
                        My Courses ({myCourses.length})
                    </button>
                    <button 
                        className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <i className="fas fa-chart-bar"></i>
                        Analytics
                    </button>
                    <button 
                        className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <i className="fas fa-tags"></i>
                        Categories
                    </button>
                    {(user?.role === 'instructor' || user?.role === 'admin') && (
                        <button 
                            className={`tab ${activeTab === 'blogs' ? 'active' : ''}`}
                            onClick={() => setActiveTab('blogs')}
                        >
                            <i className="fas fa-blog"></i>
                            My Blogs ({myBlogs.length})
                        </button>
                    )}
                </div>

                <div className="tab-content">
                    {activeTab === 'overview' && (
                        <div className="overview-tab">
                            <div className="recent-activity">
                                <h3>Recent Courses</h3>
                                {myCourses.length > 0 ? (
                                    <div className="recent-courses-list">
                                        {myCourses.slice(0, 3).map(course => (
                                            <div key={course._id} className="recent-course-item">
                                                <img 
                                                    src={course.thumbnail || '/images/1.png'} 
                                                    alt={course.title} 
                                                />
                                                <div className="course-info">
                                                    <h4>{course.title}</h4>
                                                    <p>Created: {formatDate(course.createdAt)}</p>
                                                    <div className="course-stats">
                                                        <span>
                                                            <i className="fas fa-users"></i>
                                                            {course.enrolledStudents?.length || 0} students
                                                        </span>
                                                        <span>
                                                            <i className="fas fa-star"></i>
                                                            {course.rating || 0}
                                                        </span>
                                                        <span className={`status ${course.isPublished ? 'published' : 'draft'}`}>
                                                            {course.isPublished ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="course-actions">
                                                    <button onClick={() => handleViewCourse(course._id)}>
                                                        <i className="fas fa-eye"></i>
                                                        View
                                                    </button>
                                                    <button onClick={() => handleEditCourse(course._id)}>
                                                        <i className="fas fa-edit"></i>
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="empty-state">
                                        <i className="fas fa-book"></i>
                                        <h3>No courses yet</h3>
                                        <p>Create your first course to start teaching!</p>
                                        <button 
                                            className="create-course-btn"
                                            onClick={handleCreateCourse}
                                        >
                                            Create Course
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'courses' && (
                        <div className="courses-tab">
                            <div className="courses-header">
                                <div className="header-left">
                                    <h3>My Courses ({filteredCourses.length} of {myCourses.length})</h3>
                                    {selectedCourses.length > 0 && (
                                        <div className="bulk-actions">
                                            <span className="selected-count">{selectedCourses.length} selected</span>
                                            <button onClick={() => handleBulkAction('publish')} className="bulk-btn">
                                                <i className="fas fa-eye"></i>
                                                Publish
                                            </button>
                                            <button onClick={() => handleBulkAction('unpublish')} className="bulk-btn">
                                                <i className="fas fa-eye-slash"></i>
                                                Unpublish
                                            </button>
                                            <button onClick={() => handleBulkAction('delete')} className="bulk-btn danger">
                                                <i className="fas fa-trash"></i>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="header-actions">
                                    <div className="view-toggle">
                                        <button 
                                            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <i className="fas fa-th"></i>
                                        </button>
                                        <button 
                                            className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                            onClick={() => setViewMode('list')}
                                        >
                                            <i className="fas fa-list"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Enhanced Filters */}
                            <div className="courses-filters">
                                <div className="filter-row">
                                    <div className="search-input">
                                        <i className="fas fa-search"></i>
                                        <input
                                            type="text"
                                            placeholder="Search courses..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>

                                    <select 
                                        value={categoryFilter} 
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="alphabetical">A-Z</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="price-low">Price: Low to High</option>
                                    </select>
                                </div>
                            </div>
                            
                            {filteredCourses.length > 0 ? (
                                <>
                                    <div className="select-all-container">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={selectedCourses.length === filteredCourses.length}
                                                onChange={handleSelectAll}
                                            />

                                            Select All ({filteredCourses.length})
                                        </label>
                                    </div>

                                    <div className={`courses-container ${viewMode}`}>
                                        {filteredCourses.map(course => (
                                            <div key={course._id} className={`instructor-course-card ${viewMode}`}>
                                                <label className="course-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourses.includes(course._id)}
                                                        onChange={(e) => handleCourseSelect(course._id, e.target.checked)}
                                                    />
                                                </label>

                                                <div className="course-image">
                                                    <img 
                                                        src={course.thumbnail || '/images/1.png'} 
                                                        alt={course.title} 
                                                    />
                                                    <div className={`status-badge ${course.isPublished ? 'published' : 'draft'}`}>
                                                        {course.isPublished ? 'Published' : 'Draft'}
                                                    </div>
                                                    <div className="course-progress-overlay">
                                                        <div className="progress-circle">
                                                            <span>{getCourseProgress(course)}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="course-content">
                                                    <h4>{course.title}</h4>
                                                    <p className="course-category">
                                                        <i className="fas fa-tag"></i>
                                                        {course.category?.name || 'Uncategorized'}
                                                    </p>
                                                    
                                                    <div className="course-metrics">
                                                        <div className="metric">
                                                            <i className="fas fa-users"></i>
                                                            <span>{course.enrolledStudents?.length || 0} students</span>
                                                        </div>
                                                        <div className="metric">
                                                            <i className="fas fa-star"></i>
                                                            <span>{(course.rating || 0).toFixed(1)} ({course.numReviews || 0})</span>
                                                        </div>
                                                        <div className="metric">
                                                            <i className="fas fa-dollar-sign"></i>
                                                            <span>{formatCurrency(course.price)}</span>
                                                        </div>
                                                        <div className="metric">
                                                            <i className="fas fa-clock"></i>
                                                            <span>{course.duration || 0}h</span>
                                                        </div>
                                                    </div>

                                                    <div className="course-description">
                                                        <p>{course.description?.substring(0, 100)}...</p>
                                                    </div>

                                                    <p className="created-date">
                                                        <i className="fas fa-calendar"></i>
                                                        Created: {formatDate(course.createdAt)}
                                                    </p>

                                                    <div className="course-actions">
                                                        <button 
                                                            className="action-btn view-btn"
                                                            onClick={() => handleViewCourse(course._id)}
                                                            title="View Course"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                            View
                                                        </button>
                                                        <button 
                                                            className="action-btn edit-btn"
                                                            onClick={() => handleEditCourse(course._id)}
                                                            title="Edit Course"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className={`action-btn publish-btn ${course.isPublished ? 'published' : 'draft'}`}
                                                            onClick={() => handlePublishToggle(course._id, course.isPublished)}
                                                            title={course.isPublished ? 'Unpublish Course' : 'Publish Course'}
                                                        >
                                                            <i className={`fas ${course.isPublished ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            {course.isPublished ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                        <button 
                                                            className="action-btn duplicate-btn"
                                                            onClick={() => handleDuplicateCourse(course)}
                                                            title="Duplicate Course"
                                                        >
                                                            <i className="fas fa-copy"></i>
                                                            Copy
                                                        </button>
                                                        <button 
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteCourse(course._id, course.title)}
                                                            title="Delete Course"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    {myCourses.length === 0 ? (
                                        <>
                                            <i className="fas fa-book"></i>
                                            <h3>No courses created yet</h3>
                                            <p>Start creating your first course to share your knowledge!</p>
                                            <button 
                                                className="create-course-btn"
                                                onClick={handleCreateCourse}
                                            >
                                                Create Your First Course
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-search"></i>
                                            <h3>No courses match your filters</h3>
                                            <p>Try adjusting your search or filter criteria</p>
                                            <button 
                                                className="clear-filters-btn"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setStatusFilter('all');
                                                    setCategoryFilter('all');
                                                    setSortBy('newest');
                                                }}
                                            >
                                                Clear Filters
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'analytics' && (
                        <div className="analytics-tab">
                            <h3>Course Analytics</h3>
                            <div className="analytics-grid">
                                <div className="analytics-card">
                                    <h4>Total Revenue</h4>
                                    <div className="analytics-value">{formatCurrency(stats.totalRevenue)}</div>
                                    <p>From all courses</p>
                                </div>
                                <div className="analytics-card">
                                    <h4>Student Enrollment</h4>
                                    <div className="analytics-value">{stats.totalStudents}</div>
                                    <p>Total students enrolled</p>
                                </div>
                                <div className="analytics-card">
                                    <h4>Course Performance</h4>
                                    <div className="analytics-value">{stats.averageRating}/5</div>
                                    <p>Average course rating</p>
                                </div>
                                <div className="analytics-card">
                                    <h4>Total Views</h4>
                                    <div className="analytics-value">{stats.totalViews}</div>
                                    <p>Across all courses</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'categories' && (
                        <div className="categories-tab">
                            <div className="categories-header">
                                <h3>Course Categories ({categories.length})</h3>
                                <p>Manage and view all course categories in the platform</p>
                            </div>
                            
                            {categories.length > 0 ? (
                                <div className="categories-grid">
                                    {categories.map(category => (
                                        <div key={category._id} className="category-card">
                                            <div className="category-icon">
                                                <i className={category.icon || "fas fa-folder"}></i>
                                            </div>
                                            <div className="category-content">
                                                <h4>{category.name}</h4>
                                                <p className="category-description">
                                                    {category.description || 'No description available'}
                                                </p>
                                                <div className="category-stats">
                                                    <div className="stat">
                                                        <i className="fas fa-book"></i>
                                                        <span>{category.courseCount || 0} courses</span>
                                                    </div>
                                                    <div className="stat">
                                                        <i className="fas fa-calendar"></i>
                                                        <span>Created: {category.createdAt ? formatDate(category.createdAt) : 'N/A'}</span>
                                                    </div>
                                                </div>
                                                <div className="category-actions">
                                                    <button 
                                                        className="view-courses-btn"
                                                        onClick={() => navigate(`/courses?category=${category._id}`)}
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                        View Courses
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="empty-state">
                                    <i className="fas fa-tags"></i>
                                    <h3>No categories available</h3>
                                    <p>Categories will appear here once they are created by administrators.</p>
                                </div>
                            )}

                            {/* Category Summary */}
                            <div className="category-summary">
                                <h4>Category Overview</h4>
                                <div className="summary-stats">
                                    <div className="summary-card">
                                        <h5>Total Categories</h5>
                                        <div className="summary-value">{categories.length}</div>
                                    </div>
                                    <div className="summary-card">
                                        <h5>Total Courses</h5>
                                        <div className="summary-value">
                                            {categories.reduce((sum, cat) => sum + (cat.courseCount || 0), 0)}
                                        </div>
                                    </div>
                                    <div className="summary-card">
                                        <h5>Most Popular</h5>
                                        <div className="summary-value">
                                            {categories.length > 0 
                                                ? categories.reduce((max, cat) => 
                                                    (cat.courseCount || 0) > (max.courseCount || 0) ? cat : max, categories[0]
                                                  ).name 
                                                : 'N/A'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'blogs' && (
                        <div className="blogs-tab">
                            <div className="blogs-header">
                                <div className="header-left">
                                    <h3>My Blogs ({filteredBlogs.length} of {myBlogs.length})</h3>
                                    {selectedCourses.length > 0 && (
                                        <div className="bulk-actions">
                                            <span className="selected-count">{selectedCourses.length} selected</span>
                                            <button onClick={() => handleBulkAction('publish')} className="bulk-btn">
                                                <i className="fas fa-eye"></i>
                                                Publish
                                            </button>
                                            <button onClick={() => handleBulkAction('unpublish')} className="bulk-btn">
                                                <i className="fas fa-eye-slash"></i>
                                                Unpublish
                                            </button>
                                            <button onClick={() => handleBulkAction('delete')} className="bulk-btn danger">
                                                <i className="fas fa-trash"></i>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="header-actions">
                                    <button className="create-course-btn" onClick={handleCreateBlog}>
                                        <i className="fas fa-plus"></i>
                                        Create New Blog
                                    </button>
                                </div>
                            </div>

                            {/* Enhanced Filters for Blogs */}
                            <div className="blogs-filters">
                                <div className="filter-row">
                                    <div className="search-input">
                                        <i className="fas fa-search"></i>
                                        <input
                                            type="text"
                                            placeholder="Search blogs..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    
                                    <select 
                                        value={statusFilter} 
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>

                                    <select 
                                        value={categoryFilter} 
                                        onChange={(e) => setCategoryFilter(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="all">All Categories</option>
                                        {categories.map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select 
                                        value={sortBy} 
                                        onChange={(e) => setSortBy(e.target.value)}
                                        className="filter-select"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="popular">Most Popular</option>
                                        <option value="rating">Highest Rated</option>
                                        <option value="alphabetical">A-Z</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="price-low">Price: Low to High</option>
                                    </select>
                                </div>
                            </div>

                            {filteredBlogs.length > 0 ? (
                                <>
                                    <div className="select-all-container">
                                        <label className="checkbox-container">
                                            <input
                                                type="checkbox"
                                                checked={selectedCourses.length === filteredBlogs.length}
                                                onChange={handleSelectAll}
                                            />

                                            Select All ({filteredBlogs.length})
                                        </label>
                                    </div>

                                    <div className={`blogs-container ${viewMode}`}>
                                        {filteredBlogs.map(blog => (
                                            <div key={blog._id} className={`instructor-blog-card ${viewMode}`}>
                                                <label className="blog-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCourses.includes(blog._id)}
                                                        onChange={(e) => handleCourseSelect(blog._id, e.target.checked)}
                                                    />
                                                </label>

                                                <div className="blog-image">
                                                    {blog.image && blog.image.trim() ? (
                                                        <img 
                                                            src={blog.image} 
                                                            alt={blog.title}
                                                            onError={(e) => {
                                                                e.target.parentElement.style.display = 'none';
                                                            }}
                                                        />
                                                    ) : (
                                                        <div className="no-image-placeholder">
                                                            <i className="fas fa-file-alt"></i>
                                                            <span>No Image</span>
                                                        </div>
                                                    )}
                                                    <div className={`status-badge ${blog.isPublished ? 'published' : 'draft'}`}>
                                                        {blog.isPublished ? 'Published' : 'Draft'}
                                                    </div>
                                                </div>

                                                <div className="blog-content">
                                                    <h4>{blog.title}</h4>
                                                    <p className="blog-category">
                                                        <i className="fas fa-tag"></i>
                                                        {blog.category?.name || 'Uncategorized'}
                                                    </p>
                                                    
                                                    <div className="blog-metrics">
                                                        <div className="metric">
                                                            <i className="fas fa-eye"></i>
                                                            <span>{blog.views || 0} views</span>
                                                        </div>
                                                        <div className="metric">
                                                            <i className="fas fa-star"></i>
                                                            <span>{(blog.rating || 0).toFixed(1)} ({blog.numReviews || 0})</span>
                                                        </div>
                                                        <div className="metric">
                                                            <i className="fas fa-calendar"></i>
                                                            <span>Published: {formatDate(blog.createdAt)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="blog-description">
                                                        <p>{blog.description?.substring(0, 100)}...</p>
                                                    </div>

                                                    <div className="blog-actions">
                                                        <button 
                                                            className="action-btn view-btn"
                                                            onClick={() => handleViewBlog(blog._id)}
                                                            title="View Blog"
                                                        >
                                                            <i className="fas fa-eye"></i>
                                                            View
                                                        </button>
                                                        <button 
                                                            className="action-btn edit-btn"
                                                            onClick={() => handleEditBlog(blog._id)}
                                                            title="Edit Blog"
                                                        >
                                                            <i className="fas fa-edit"></i>
                                                            Edit
                                                        </button>
                                                        <button 
                                                            className={`action-btn publish-btn ${blog.isPublished ? 'published' : 'draft'}`}
                                                            onClick={() => handleBlogPublishToggle(blog._id, blog.isPublished)}
                                                            title={blog.isPublished ? 'Unpublish Blog' : 'Publish Blog'}
                                                        >
                                                            <i className={`fas ${blog.isPublished ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                                            {blog.isPublished ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                        <button 
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteBlog(blog._id, blog.title)}
                                                            title="Delete Blog"
                                                        >
                                                            <i className="fas fa-trash"></i>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="empty-state">
                                    {myBlogs.length === 0 ? (
                                        <>
                                            <i className="fas fa-blog"></i>
                                            <h3>No blogs created yet</h3>
                                            <p>Start creating your first blog to share your knowledge!</p>
                                            <button 
                                                className="create-course-btn"
                                                onClick={() => navigate('/instructor/create-blog')}
                                            >
                                                Create Your First Blog
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-search"></i>
                                            <h3>No blogs match your filters</h3>
                                            <p>Try adjusting your search or filter criteria</p>
                                            <button 
                                                className="clear-filters-btn"
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setStatusFilter('all');
                                                    setCategoryFilter('all');
                                                    setSortBy('newest');
                                                }}
                                            >
                                                Clear Filters
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default InstructorDashboard;