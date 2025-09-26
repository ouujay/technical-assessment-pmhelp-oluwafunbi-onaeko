// src/pages/auth/LoginPage.jsx
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Heart, Eye, EyeOff, Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './AuthPage.module.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Default fallback route if no specific redirect
  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error
    if (error) setError('');
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        // Navigate to role-specific dashboard or the 'from' location
        const redirectTo = location.state?.from?.pathname || result.dashboardRoute || '/dashboard';
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.error || 'Invalid username or password');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className={styles.authContainer}>
      {/* Left Side - Form */}
      <div className={styles.authFormSide}>
        <div className={styles.authCard}>
          {/* Back Button */}
          <button 
            onClick={handleBackToHome}
            className={styles.backButton}
            type="button"
          >
            <ArrowLeft size={20} />
            Back to Home
          </button>

          {/* Header */}
          <div className={styles.authHeader}>
            <div className={styles.logo}>
              <Heart className={styles.logoIcon} />
              <span>MedPortal</span>
            </div>
            <h1>Welcome back!</h1>
            <p>Sign in to your account to access your personalized dashboard.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.authForm}>
            {error && (
              <div className={styles.errorAlert}>
                <p>{error}</p>
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Username"
                  className={validationErrors.username ? styles.inputError : ''}
                />
              </div>
              {validationErrors.username && (
                <span className={styles.fieldError}>{validationErrors.username}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className={validationErrors.password ? styles.inputError : ''}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.password && (
                <span className={styles.fieldError}>{validationErrors.password}</span>
              )}
            </div>

            <div className={styles.formOptions}>
              <label className={styles.checkbox}>
                <input type="checkbox" />
                <span className={styles.checkmark}></span>
                Remember me
              </label>
              <Link to="/forgot-password" className={styles.forgotLink}>
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.authFooter}>
            <p>
              Don't have an account?{' '}
              <Link to="/register" className={styles.switchLink}>
                Sign up
              </Link>
            </p>
          </div>

          {/* Demo Credentials */}
          <div className={styles.demoCredentials}>
            <h4>Demo Credentials:</h4>
            <div className={styles.demoGrid}>
              <div className={styles.demoCard}>
                <strong>Patient:</strong>
                <p>patient1 / password123</p>
              </div>
              <div className={styles.demoCard}>
                <strong>Doctor:</strong>
                <p>doctor1 / password123</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Illustration */}
      <div className={styles.authImageSide}>
        <img
          src="/src/assets/20250924_0547_Medical Login Design_simple_compose_01k5x0ppaeer59ew9jc6gjsndm.png"
          alt="Medical professionals illustration"
          className={styles.authIllustration}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        {/* Fallback background */}
        <div className={styles.fallbackBg} style={{ display: 'none' }}>
          <Heart size={80} />
          <h3>Welcome to MedPortal</h3>
          <p>Your healthcare journey starts here</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;