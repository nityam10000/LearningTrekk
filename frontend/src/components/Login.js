import React, { useEffect, useState } from 'react'
import { Button } from './Button';
import '../css/Login.css'
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [email, setEmail] = useState("");       
    const [password, setPassword] = useState(""); 
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [rememberMe, setRememberMe] = useState(false);
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [blockTimeLeft, setBlockTimeLeft] = useState(0);
    
    // Hook for programmatic navigation between routes
    let navigate = useNavigate();
    const { login, isAuthenticated, error, clearError } = useAuth();
    
    // Effect hook that runs when component mounts
    useEffect(() => {
        // If user is already authenticated, redirect to home
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);
    
    // Clear any previous errors when component mounts
    useEffect(() => {
        clearError();
        // Load remembered email if exists
        const rememberedEmail = localStorage.getItem('rememberedEmail');
        if (rememberedEmail) {
            setEmail(rememberedEmail);
            setRememberMe(true);
        }
    }, [clearError]);

    // Check for account lockout
    useEffect(() => {
        const lockoutData = localStorage.getItem('loginLockout');
        if (lockoutData) {
            const { attempts, timestamp } = JSON.parse(lockoutData);
            const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
            const timePassed = Date.now() - timestamp;
            
            if (timePassed < fiveMinutes && attempts >= 5) {
                setIsBlocked(true);
                setBlockTimeLeft(Math.ceil((fiveMinutes - timePassed) / 1000));
                
                // Start countdown timer
                const timer = setInterval(() => {
                    const newTimeLeft = Math.ceil((fiveMinutes - (Date.now() - timestamp)) / 1000);
                    if (newTimeLeft <= 0) {
                        setIsBlocked(false);
                        setBlockTimeLeft(0);
                        localStorage.removeItem('loginLockout');
                        clearInterval(timer);
                    } else {
                        setBlockTimeLeft(newTimeLeft);
                    }
                }, 1000);
                
                return () => clearInterval(timer);
            } else if (timePassed >= fiveMinutes) {
                // Reset lockout after 5 minutes
                localStorage.removeItem('loginLockout');
                setLoginAttempts(0);
            } else {
                setLoginAttempts(attempts);
            }
        }
    }, []);

    // Enhanced form validation
    const validateForm = () => {
        const newErrors = {};
        
        if (!email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
        }
        
        if (!password) {
            newErrors.password = 'Password is required';
        } else if (password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Enhanced error handling
    const getErrorMessage = (error) => {
        if (error.response?.status === 401) {
            return 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.response?.status === 429) {
            return 'Too many login attempts. Please try again later.';
        } else if (error.response?.status === 403) {
            return 'Your account has been temporarily locked. Please contact support.';
        } else if (error.response?.status === 404) {
            return 'Account not found. Please check your email or create a new account.';
        } else if (error.response?.status >= 500) {
            return 'Server error. Please try again later or contact support if the problem persists.';
        } else if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
            return 'Network error. Please check your internet connection and try again.';
        }
        return error.response?.data?.message || error.message || 'Login failed. Please try again.';
    };

    // Handle failed login attempts
    const handleFailedLogin = () => {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 5) {
            setIsBlocked(true);
            setBlockTimeLeft(300); // 5 minutes
            localStorage.setItem('loginLockout', JSON.stringify({
                attempts: newAttempts,
                timestamp: Date.now()
            }));
            
            // Start countdown
            const timer = setInterval(() => {
                setBlockTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsBlocked(false);
                        localStorage.removeItem('loginLockout');
                        setLoginAttempts(0);
                        clearInterval(timer);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            localStorage.setItem('loginLockout', JSON.stringify({
                attempts: newAttempts,
                timestamp: Date.now()
            }));
        }
    };

    /**
     * Function to handle login form submission
     * Calls the login function from AuthContext
     */
    const handleLogin = async (e) => {
        e.preventDefault();
        
        if (isBlocked) {
            setErrors({ general: `Account temporarily locked. Try again in ${Math.floor(blockTimeLeft / 60)}:${(blockTimeLeft % 60).toString().padStart(2, '0')}` });
            return;
        }
        
        // Clear any previous errors
        clearError();
        setErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            await login(email.trim(), password);
            
            // Reset login attempts on successful login
            localStorage.removeItem('loginLockout');
            setLoginAttempts(0);
            
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email.trim());
            } else {
                localStorage.removeItem('rememberedEmail');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle failed login
            handleFailedLogin();
            
            // Set appropriate error message
            const errorMessage = getErrorMessage(error);
            setErrors({ general: errorMessage });
            
            // Show remaining attempts warning
            if (loginAttempts + 1 < 5) {
                const attemptsLeft = 5 - (loginAttempts + 1);
                setErrors(prev => ({ 
                    ...prev, 
                    attempts: `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining before account lockout` 
                }));
            }
        } finally {
            setLoading(false);
        }
    }

    // Handle input changes and clear field-specific errors
    const handleEmailChange = (e) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors(prev => ({ ...prev, email: '' }));
        }
    };

    const handlePasswordChange = (e) => {
        setPassword(e.target.value);
        if (errors.password) {
            setErrors(prev => ({ ...prev, password: '' }));
        }
    };

    // Handle remember me checkbox change
    const handleRememberMeChange = (e) => {
        const checked = e.target.checked;
        setRememberMe(checked);
        
        // If unchecking remember me, clear the stored email
        if (!checked) {
            localStorage.removeItem('rememberedEmail');
        }
        // If checking remember me and there's a current email, store it
        else if (checked && email) {
            localStorage.setItem('rememberedEmail', email);
        }
    };

    // Render the login form
    return (
        <div className='login-page'>
            {/* Main container for login form */}
            <div className='login-container'>
                <div className="login-form-wrapper">
                    <div className="login-header">
                        <h1>Welcome Back</h1>
                        <p>Sign in to continue your learning journey</p>
                    </div>
                    
                    {/* Enhanced Error message display */}
                    {(error || errors.general) && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{errors.general || error}</span>
                        </div>
                    )}

                    {/* Account lockout warning */}
                    {isBlocked && (
                        <div className="error-message lockout-warning">
                            <i className="fas fa-lock"></i>
                            <span>
                                Account temporarily locked due to multiple failed attempts. 
                                Try again in {Math.floor(blockTimeLeft / 60)}:{(blockTimeLeft % 60).toString().padStart(2, '0')}
                            </span>
                        </div>
                    )}

                    {/* Login attempts warning */}
                    {errors.attempts && !isBlocked && (
                        <div className="warning-message">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{errors.attempts}</span>
                        </div>
                    )}
                    
                    {/* Login form */}
                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <div className="input-wrapper">
                                <input
                                    id="email"
                                    type="email"
                                    className={`form-control ${errors.email ? 'error' : ''}`}
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    disabled={loading}
                                    autoComplete="email"
                                />
                            </div>
                            {errors.email && (
                                <div className="field-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>{errors.email}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`form-control password-field ${errors.password ? 'error' : ''}`}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={handlePasswordChange}
                                    disabled={loading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            {errors.password && (
                                <div className="field-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>{errors.password}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-options">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={handleRememberMeChange}
                                    disabled={loading}
                                />
                                <span className="checkmark"></span>
                                Remember me
                            </label>
                            <Link to="/forgot-password" className="forgot-link">
                                Forgot password?
                            </Link>
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className={`login-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i>
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Sign up link */}
                    <div className="signup-prompt">
                        <p>Don't have an account?</p>
                        <Link to="/signup" className="signup-link">
                            Create Account
                        </Link>
                    </div>

                    {/* Social login options (placeholder) */}
                    <div className="social-login">
                        <div className="divider">
                            <span>Or continue with</span>
                        </div>
                        <div className="social-buttons">
                            <button type="button" className="social-btn google" disabled>
                                <i className="fab fa-google"></i>
                                Google
                            </button>
                            <button type="button" className="social-btn github" disabled>
                                <i className="fab fa-github"></i>
                                GitHub
                            </button>
                        </div>
                        <small className="social-note">Social login coming soon!</small>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login
