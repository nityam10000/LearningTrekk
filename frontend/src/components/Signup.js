import React, { useEffect, useState} from 'react'
import { Button } from './Button';
import '../css/Signup.css' 
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from '../contexts/AuthContext';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "student"
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const navigate = useNavigate();
    const { register, isAuthenticated, error, clearError } = useAuth();
    
    useEffect(() => {
        // If user is already authenticated, redirect to home
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate]);
    
    // Clear any previous errors when component mounts
    useEffect(() => {
        clearError();
    }, [clearError]);

    // Validate form fields
    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }
        
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }
        
        if (formData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
            newErrors.phone = 'Phone number is invalid';
        }
        
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
            newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
        }
        
        if (!formData.confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }
        
        if (!agreedToTerms) {
            newErrors.terms = 'You must agree to the terms and conditions';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSignup = async (e) => {
        e.preventDefault();
        
        // Clear any previous errors
        clearError();
        setErrors({});
        
        // Validate form
        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            const { confirmPassword, ...userData } = formData;
            await register(userData);
            // Redirect will happen automatically due to useEffect above
        } catch (error) {
            console.error('Signup error:', error);
            // Error is handled by the auth context
        } finally {
            setLoading(false);
        }
    };

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    // Password strength indicator
    const getPasswordStrength = (password) => {
        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 8) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        if (strength <= 2) return { level: 'weak', color: '#dc3545', text: 'Weak' };
        if (strength <= 4) return { level: 'medium', color: '#ffc107', text: 'Medium' };
        return { level: 'strong', color: '#28a745', text: 'Strong' };
    };

    const passwordStrength = getPasswordStrength(formData.password);

    return (
        <div className='signup-page'>
            <div className='signup-container'>
                <div className="signup-form-wrapper">
                    <div className="signup-header">
                        <h1>Create Your Account</h1>
                        <p>Join thousands of learners and start your journey today</p>
                    </div>
                    
                    {/* Error message display */}
                    {error && (
                        <div className="error-message">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Signup form */}
                    <form className="signup-form" onSubmit={handleSignup}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Full Name *</label>
                                <div className="input-wrapper">
                                    <input
                                        id="name"
                                        type="text"
                                        className={`form-control ${errors.name ? 'error' : ''}`}
                                        placeholder="Enter your full name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        disabled={loading}
                                        autoComplete="name"
                                    />
                                </div>
                                {errors.name && (
                                    <div className="field-error">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <span>{errors.name}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <div className="input-wrapper">
                                    <input
                                        id="email"
                                        type="email"
                                        className={`form-control ${errors.email ? 'error' : ''}`}
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
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
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number</label>
                                <div className="input-wrapper">
                                    <input
                                        id="phone"
                                        type="tel"
                                        className={`form-control ${errors.phone ? 'error' : ''}`}
                                        placeholder="Enter your phone number"
                                        value={formData.phone}
                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                        disabled={loading}
                                        autoComplete="tel"
                                    />
                                </div>
                                {errors.phone && (
                                    <div className="field-error">
                                        <i className="fas fa-exclamation-triangle"></i>
                                        <span>{errors.phone}</span>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Account Type</label>
                                <div className="input-wrapper">
                                    <select
                                        id="role"
                                        className="form-control"
                                        value={formData.role}
                                        onChange={(e) => handleInputChange('role', e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="student">Student</option>
                                        <option value="instructor">Instructor</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <div className="input-wrapper">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className={`form-control password-field ${errors.password ? 'error' : ''}`}
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
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
                            {formData.password && (
                                <div className="password-strength">
                                    <div className="strength-bar">
                                        <div 
                                            className={`strength-fill ${passwordStrength.level}`}
                                            style={{ backgroundColor: passwordStrength.color }}
                                        ></div>
                                    </div>
                                    <span style={{ color: passwordStrength.color }}>
                                        {passwordStrength.text}
                                    </span>
                                </div>
                            )}
                            {errors.password && (
                                <div className="field-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>{errors.password}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <div className="input-wrapper">
                                <input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    className={`form-control password-field ${errors.confirmPassword ? 'error' : ''}`}
                                    placeholder="Confirm your password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                    disabled={loading}
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <div className="field-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>{errors.confirmPassword}</span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className={`checkbox-label ${errors.terms ? 'error' : ''}`}>
                                <input
                                    type="checkbox"
                                    checked={agreedToTerms}
                                    onChange={(e) => {
                                        setAgreedToTerms(e.target.checked);
                                        if (errors.terms) {
                                            setErrors(prev => ({ ...prev, terms: '' }));
                                        }
                                    }}
                                    disabled={loading}
                                />
                                <span className="checkmark"></span>
                                I agree to the{' '}
                                <Link to="/terms" target="_blank" className="terms-link">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link to="/privacy" target="_blank" className="terms-link">
                                    Privacy Policy
                                </Link>
                            </label>
                            {errors.terms && (
                                <div className="field-error">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <span>{errors.terms}</span>
                                </div>
                            )}
                        </div>

                        {/* Submit button */}
                        <button
                            type="submit"
                            className={`signup-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="spinner"></div>
                                    <span>Creating Account...</span>
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-plus"></i>
                                    <span>Create Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Login link */}
                    <div className="login-prompt">
                        <p>Already have an account?</p>
                        <Link to="/login" className="login-link">
                            Sign In
                        </Link>
                    </div>

                    {/* Account type benefits */}
                    <div className="account-benefits">
                        <div className="benefit-item">
                            <i className="fas fa-graduation-cap"></i>
                            <div>
                                <strong>Students:</strong> Access courses, track progress, earn certificates
                            </div>
                        </div>
                        <div className="benefit-item">
                            <i className="fas fa-chalkboard-teacher"></i>
                            <div>
                                <strong>Instructors:</strong> Create courses, manage students, earn revenue
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Signup
