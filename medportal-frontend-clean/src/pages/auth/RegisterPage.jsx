// src/pages/auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Eye, EyeOff, Mail, Lock, User, ArrowRight, Stethoscope, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import styles from './RegisterPage.module.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: searchParams.get('role') || 'patient'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Update role if URL changes
  useEffect(() => {
    const roleFromUrl = searchParams.get('role');
    if (roleFromUrl && ['patient', 'doctor'].includes(roleFromUrl)) {
      setFormData(prev => ({ ...prev, role: roleFromUrl }));
    }
  }, [searchParams]);

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

  const handleRoleChange = (newRole) => {
    setFormData(prev => ({ ...prev, role: newRole }));
    // Update URL without navigation
    const newUrl = new URL(window.location);
    newUrl.searchParams.set('role', newRole);
    window.history.replaceState({}, '', newUrl);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email address is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const result = await register(formData);
      
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  const roleOptions = [
    {
      id: 'patient',
      title: 'Patient',
      description: 'Book appointments, manage your medical records',
      icon: User
    },
    {
      id: 'doctor',
      title: 'Doctor',
      description: 'Manage patients, track practice analytics',
      icon: Stethoscope
    }
  ];

  return (
    <div className={styles.registerContainer}>
      {/* Left Side - Form */}
      <div className={styles.registerFormSide}>
        <div className={styles.registerCard}>
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
          <div className={styles.registerHeader}>
            <div className={styles.logo}>
              <Heart className={styles.logoIcon} />
              <span>MedPortal</span>
            </div>
            <h1>Create account</h1>
            <p>Join our healthcare platform and start your journey to better health management.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.registerForm}>
            {error && (
              <div className={styles.errorAlert}>
                <p>{error}</p>
              </div>
            )}

            {/* Role Selection */}
            <div className={styles.roleSelection}>
              <h3>Select your role</h3>
              <div className={styles.roleOptions}>
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = formData.role === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => handleRoleChange(option.id)}
                      className={`${styles.roleOption} ${isSelected ? styles.selected : ''}`}
                    >
                      <Icon className={styles.roleIcon} />
                      <h4>{option.title}</h4>
                      <p>{option.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Name Fields */}
            <div className={styles.nameFields}>
              <div className={styles.inputGroup}>
                <label htmlFor="firstName">First Name</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="First name"
                    className={validationErrors.firstName ? styles.inputError : ''}
                  />
                </div>
                {validationErrors.firstName && (
                  <span className={styles.fieldError}>{validationErrors.firstName}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="lastName">Last Name</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} />
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Last name"
                    className={validationErrors.lastName ? styles.inputError : ''}
                  />
                </div>
                {validationErrors.lastName && (
                  <span className={styles.fieldError}>{validationErrors.lastName}</span>
                )}
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrapper}>
                <User className={styles.inputIcon} />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose username"
                  className={validationErrors.username ? styles.inputError : ''}
                />
              </div>
              {validationErrors.username && (
                <span className={styles.fieldError}>{validationErrors.username}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email">Email</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={validationErrors.email ? styles.inputError : ''}
                />
              </div>
              {validationErrors.email && (
                <span className={styles.fieldError}>{validationErrors.email}</span>
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
                  placeholder="Create password"
                  className={validationErrors.password ? styles.inputError : ''}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.password && (
                <span className={styles.fieldError}>{validationErrors.password}</span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm password"
                  className={validationErrors.confirmPassword ? styles.inputError : ''}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <span className={styles.fieldError}>{validationErrors.confirmPassword}</span>
              )}
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
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={styles.registerFooter}>
            <p>
              Already have an account?{' '}
              <Link to="/login" className={styles.switchLink}>
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className={styles.registerImageSide}>
        <img
          src="/src/assets/20250923_2027_Doctor's Care and Compassion_simple_compose_01k5w0me1wed1s39vxj4acwg7f.png"
          alt="Healthcare professionals illustration"
          className={styles.registerIllustration}
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'flex';
          }}
        />
        {/* Fallback background */}
        <div className={styles.fallbackBg} style={{ display: 'none' }}>
          <Heart size={80} />
          <h3>Join MedPortal</h3>
          <p>Start your healthcare journey with us and connect with trusted medical professionals</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;