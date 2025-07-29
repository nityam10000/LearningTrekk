import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useClickOutside, useOnlineStatus } from '../hooks/useCommon';
import '../css/Navbar.css'
import logo from './images/wmremove-transformed.png'

function Navbar() {
    const [click, setClick] = useState(false);
    const [button, setButton] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [notifications] = useState([
        { id: 1, title: 'Welcome!', message: 'Complete your profile to get started', type: 'info', unread: true },
        { id: 2, title: 'New Course', message: 'React Advanced Patterns is now available', type: 'success', unread: true },
        { id: 3, title: 'Assignment Due', message: 'JavaScript Fundamentals assignment due tomorrow', type: 'warning', unread: false }
    ]);
    
    const navigate = useNavigate();
    const { user, isAuthenticated, logout } = useAuth();
    const { showSuccess, showWarning } = useNotifications();
    const isOnline = useOnlineStatus();
    
    // Refs for click outside detection
    const searchRef = useRef(null);
    const userDropdownRef = useRef(null);
    
    // Click outside handlers
    useClickOutside(searchRef, () => setShowGlobalSearch(false));
    useClickOutside(userDropdownRef, () => setShowUserDropdown(false));

    const handleClick = () => setClick(!click);
    const closeMobileMenu = () => setClick(false);

    const showButton = () => {
        if (window.innerWidth <= 960) {
            setButton(false);
        } else {
            setButton(true);
        }
    }

    // Handle scroll effect
    const handleScroll = () => {
        const isScrolled = window.scrollY > 10;
        setScrolled(isScrolled);
    }

    useEffect(() => {
        showButton();
        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', showButton);
        
        return () => {
            window.removeEventListener('resize', showButton);
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Handle global search
    const handleGlobalSearch = (e) => {
        e.preventDefault();
        if (globalSearchQuery.trim()) {
            // Store search query in sessionStorage for the destination page to use
            sessionStorage.setItem('globalSearchQuery', globalSearchQuery.trim());
            
            // Navigate to courses page by default, but the search will work on both pages
            navigate('/courses');
            setShowGlobalSearch(false);
            setGlobalSearchQuery('');
            closeMobileMenu();
        }
    };

    const toggleGlobalSearch = () => {
        setShowGlobalSearch(!showGlobalSearch);
        if (!showGlobalSearch) {
            // Focus the search input when opening
            setTimeout(() => {
                const searchInput = document.getElementById('global-search-input');
                if (searchInput) searchInput.focus();
            }, 100);
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        setShowUserDropdown(false);
        showSuccess('You have been logged out successfully');
        navigate('/');
    };

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl/Cmd + K to open search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                toggleGlobalSearch();
            }
            // Escape to close search
            if (e.key === 'Escape') {
                setShowGlobalSearch(false);
                setShowUserDropdown(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Show offline warning
    useEffect(() => {
        if (!isOnline) {
            showWarning('You are currently offline. Some features may not be available.');
        }
    }, [isOnline, showWarning]);

    // Handle user dropdown toggle
    const toggleUserDropdown = () => {
        console.log('Dropdown toggle clicked, current state:', showUserDropdown);
        setShowUserDropdown(prev => !prev);
    };

    // Handle click outside dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
                setShowUserDropdown(false);
            }
        };

        if (showUserDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showUserDropdown]);

    const unreadNotificationCount = notifications.filter(n => n.unread).length;

    return (
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${!isOnline ? 'navbar-offline' : ''}`}>
            <div className="navbar-container">
                {/* Mobile menu toggle */}
                <div className="menu-icon" onClick={handleClick} aria-label="Toggle menu">
                    <span className={click ? 'hamburger active' : 'hamburger'}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </span>
                </div>

                {/* Logo section */}
                <div className='logo-section'>
                
                    <Link to="/" className="brand-name" onClick={closeMobileMenu}>
                        LearningTrek
                        {!isOnline && <span className="offline-indicator">Offline</span>}
                    </Link>
                </div>

                {/* Main navigation menu */}
                <ul className={click ? 'nav-menu active' : 'nav-menu'}>
                    <li className='nav-item'>
                        <Link to='/' className='nav-links' onClick={closeMobileMenu}>
                            <i className="fas fa-home nav-icon"></i>
                            <span>Home</span>
                        </Link>
                    </li>
                    <li className='nav-item'>
                        <Link to='/courses' className='nav-links' onClick={closeMobileMenu}>
                            <i className="fas fa-book nav-icon"></i>
                            <span>Courses</span>
                        </Link>
                    </li>
                    <li className='nav-item'>
                        <Link to='/blog' className='nav-links' onClick={closeMobileMenu}>
                            <i className="fas fa-blog nav-icon"></i>
                            <span>Blog</span>
                        </Link>
                    </li>
                    
                    {/* Mobile-only auth links */}
                    {!button && !isAuthenticated && (
                        <>
                            <li className='nav-item'>
                                <Link to='/login' className='nav-links' onClick={closeMobileMenu}>
                                    <i className="fas fa-sign-in-alt nav-icon"></i>
                                    <span>Login</span>
                                </Link>
                            </li>
                            <li className='nav-item'>
                                <Link to='/signup' className='nav-links' onClick={closeMobileMenu}>
                                    <i className="fas fa-user-plus nav-icon"></i>
                                    <span>Sign Up</span>
                                </Link>
                            </li>
                        </>
                    )}
                    
                    {/* Mobile-only user menu */}
                    {!button && isAuthenticated && (
                        <>
                            <li className='nav-item'>
                                <Link to='/myaccount' className='nav-links' onClick={closeMobileMenu}>
                                    <i className="fas fa-user nav-icon"></i>
                                    <span>My Account</span>
                                </Link>
                            </li>
                            <li className='nav-item'>
                                <button className='nav-links logout-mobile' onClick={() => { handleLogout(); closeMobileMenu(); }}>
                                    <i className="fas fa-sign-out-alt nav-icon"></i>
                                    <span>Logout</span>
                                </button>
                            </li>
                        </>
                    )}
                </ul>

                {/* Global Search */}
                {showGlobalSearch && (
                    <div className="global-search-overlay" ref={searchRef}>
                        <div className="global-search-container">
                            <form onSubmit={handleGlobalSearch} className="global-search-form">
                                <div className="global-search-input-wrapper">
                                    <i className="fas fa-search global-search-icon"></i>
                                    <input
                                        id="global-search-input"
                                        type="text"
                                        className="global-search-input"
                                        placeholder="Search courses and blog posts... (Ctrl+K)"
                                        value={globalSearchQuery}
                                        onChange={(e) => setGlobalSearchQuery(e.target.value)}
                                        autoComplete="off"
                                    />
                                    <button
                                        type="button"
                                        className="global-search-close"
                                        onClick={() => setShowGlobalSearch(false)}
                                        aria-label="Close search"
                                    >
                                        <i className="fas fa-times"></i>
                                    </button>
                                </div>
                                <div className="global-search-suggestions">
                                    <div className="search-suggestion-item">
                                        <i className="fas fa-book"></i>
                                        <span>Search in Courses</span>
                                    </div>
                                    <div className="search-suggestion-item">
                                        <i className="fas fa-blog"></i>
                                        <span>Search in Blog Posts</span>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Right side menu */}
                <div className='nav-actions'>
                    <div className="nav-icons">
                        <button 
                            className="icon-btn search-btn" 
                            onClick={toggleGlobalSearch}
                            aria-label="Search (Ctrl+K)"
                            title="Search (Ctrl+K)"
                        >
                            <i className="fas fa-search"></i>
                        </button>
                        
                        {isAuthenticated && (
                            <button 
                                className="icon-btn notification-btn" 
                                aria-label="Notifications"
                                title="Notifications"
                            >
                                <i className="far fa-bell"></i>
                                {unreadNotificationCount > 0 && (
                                    <span className="notification-badge">{unreadNotificationCount}</span>
                                )}
                            </button>
                        )}
                    </div>

                    {/* Authentication buttons for desktop */}
                    <div className="auth-buttons">
                        {button && !isAuthenticated && (
                            <>
                                <Link to='/login' className='auth-link'>
                                    <Button buttonStyle="btn--secondary" buttonSize="btn--small">
                                        Login
                                    </Button>
                                </Link>
                                <Link to='/signup' className='auth-link'>
                                    <Button buttonStyle="btn--primary" buttonSize="btn--small">
                                        Sign Up
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* User dropdown */}
                    {isAuthenticated && (
                        <div className="user-dropdown" ref={userDropdownRef}>
                            <button 
                                className="user-avatar" 
                                onClick={toggleUserDropdown}
                                aria-label="User menu"
                            >
                                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                                <div className="online-indicator"></div>
                            </button>
                            
                            {showUserDropdown && (
                                <div className={`dropdown-menu ${showUserDropdown ? 'show' : ''}`}>
                                    <div className="dropdown-header">
                                        <div className="user-info">
                                            <div className="user-name">{user?.name || 'User'}</div>
                                            <div className="user-email">{user?.email || ''}</div>
                                            <div className="user-role">{user?.role || 'Student'}</div>
                                        </div>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-body">
                                        <Link to='/myaccount' className='dropdown-item' onClick={() => setShowUserDropdown(false)}>
                                            <i className="fas fa-user"></i>
                                            <span>My Account</span>
                                        </Link>
                                        
                                        {/* Dashboard options only for instructors/admins */}
                                        {(user?.role === 'instructor' || user?.role === 'admin') && (
                                            <Link 
                                                to='/instructor/mycourses'
                                                className='dropdown-item' 
                                                onClick={() => setShowUserDropdown(false)}
                                            >
                                                <i className="fas fa-chalkboard-teacher"></i>
                                                <span>Instructor Dashboard</span>
                                            </Link>
                                        )}
                                        
                                        <div className="dropdown-divider"></div>
                                        
                                        <button className='dropdown-item logout' onClick={handleLogout}>
                                            <i className="fas fa-sign-out-alt"></i>
                                            <span>Logout</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile menu overlay */}
            {click && <div className="mobile-overlay" onClick={closeMobileMenu}></div>}
        </nav>
    )
}

export default Navbar
