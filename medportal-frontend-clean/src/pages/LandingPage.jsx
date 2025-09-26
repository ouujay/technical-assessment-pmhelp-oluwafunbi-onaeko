// src/pages/LandingPage.jsx
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users, Calendar, Shield, Heart } from 'lucide-react';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.landingPage}>
      {/* Navigation */}
      <nav className={styles.navbar}>
        <div className={styles.navContainer}>
          <div className={styles.logo}>
            <Heart className={styles.logoIcon} />
            <span className="gravitas-one-regular">MedPortal</span>
          </div>
          
          <div className={styles.navLinks}>
            <a href="#doctors">Doctors</a>
            <a href="#services">Services</a>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
          </div>
          
          <div className={styles.navActions}>
            <button 
              className={styles.helpButton}
              onClick={() => navigate('/contact')}
            >
              Need Help ?
            </button>
            <button 
              className={styles.loginButton}
              onClick={() => navigate('/login')}
            >
              Login
            </button>
          </div>
        </div>
      </nav>

      {/* Primary Hero Section */}
      <section className={styles.primaryHero}>
        <div className={styles.primaryHeroContainer}>
          <div className={styles.primaryHeroContent}>
            <h1 className={styles.primaryHeroTitle}>
              Empowering Lives Through{' '}
              <span className={styles.highlightGreen}>Health</span>
            </h1>
            
            <p className={styles.primaryHeroSubtitle}>
              Navigating Health Together: Your Trusted Medical Resource
            </p>
            
            <div className={styles.primaryHeroActions}>
              <button 
                className={styles.getStartedButton}
                onClick={() => navigate('/register')}
              >
                Get started now
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
          
          <div className={styles.primaryHeroRight}>
            <div className={styles.medicalIllustration}>
              <img 
                src="/src/assets/ChatGPT Image Sep 23, 2025, 08_27_56 PM.png" 
                alt="Medical consultation illustration"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className={styles.illustrationPlaceholder} style={{display: 'none'}}>
                <Heart size={64} />
                <span>Medical Consultation</span>
              </div>
            </div>
            
            {/* Dr. Sarah Chat Card - Bottom Left of primary hero image */}
           
          </div>
        </div>
      </section>

      {/* Secondary Hero Section - Image on Left */}
      <section className={styles.secondaryHero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroImageLeft}>
            <div className={styles.imageCard}>
              <div className={styles.profileImage}>
                <img 
                  src="/src/assets/alex-starnes-WYE2UhXsU1Y-unsplash.jpg" 
                  alt="Happy healthcare professional"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.avatarPlaceholder} style={{display: 'none'}}>
                  <Users size={48} />
                </div>
              </div>
            </div>
            
            {/* Dr. Sarah Chat Card - Below image in secondary hero */}
            <div className={styles.drSarahCardSecondary}>
              <div className={styles.doctorInfo}>
                <div className={styles.doctorAvatar}>
                  <div className={styles.statusDot}></div>
                </div>
                <span className={styles.doctorName}>Dr. Sarah</span>
                <div className={styles.onlineStatus}>●</div>
              </div>
              <p className={styles.chatMessage}>Hello! How can I help you today?</p>
              <button className={styles.chatNowBtn}>
                Chat now <ArrowRight size={16} />
              </button>
            </div>
          </div>
          
          <div className={styles.heroContent}>
            <div className={styles.specialtyTags}>
              <span className={`${styles.tag} ${styles.tagPink}`}>Patient</span>
              <span className={`${styles.tag} ${styles.tagBlue}`}>Doctor</span>
              <span className={`${styles.tag} ${styles.tagLavender}`}>Admin</span>
            </div>
            
            <h2 className={styles.secondaryHeroTitle}>
              Healthcare is not a
              <br />
              Destination, but a{' '}
              <span className={styles.highlightGreen}>Process.</span>
            </h2>
            
            <p className={styles.heroSubtitle}>
              Our platform has resulted in positive change. We have connected
              thousands of patients with healthcare providers and streamlined 
              medical processes for better outcomes.
            </p>
            
            <div className={styles.heroActions}>
              <button 
                className={styles.primaryButton}
                onClick={() => navigate('/register')}
              >
                Get Started
                <ArrowRight size={20} />
              </button>
              
              <div className={styles.successBadge}>
                <div className={styles.successCircle}>
                  <span>98%</span>
                </div>
                <div>
                  <div className={styles.successText}>Success</div>
                  <div className={styles.successSubtext}>rate so far</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Separate Section Below Secondary Hero */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statsCard}>
            <div className={styles.statsNumber}>10M+</div>
            <div className={styles.statsText}>Every Year helping people around the world.</div>
            <div className={styles.statsDetails}>
              <img 
                src="https://images.unsplash.com/photo-1752797493108-4acb8f250ef6?q=80&w=747&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="Campaign" 
                className={styles.campaignImage}
              />
              <div className={styles.statsLabel}>Healthcare Campaign</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <div className={styles.featureCard}>
            <div className={styles.featureImage}>
              <Shield size={48} />
            </div>
            <div className={styles.featureContent}>
              <h3>Let's make healthcare</h3>
              <h3><span className={styles.highlightGreen}>Easier</span> and <span className={styles.highlightGreen}>Accessible</span></h3>
              <p>
                Being able to access healthcare easily is one of the strongest
                components of maintaining good health and wellbeing.
              </p>
            </div>
          </div>
          
          <div className={styles.supportCard}>
            <h3>Find Support</h3>
            <p>
              If you or someone you know is struggling,
              you are not alone.
            </p>
            <button className={styles.supportButton}>
              Get Help Now
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className={styles.roleSelection}>
        <div className={styles.container}>
          <h2>Join as</h2>
          <div className={styles.roleCards}>
            <div className={`${styles.roleCard} ${styles.patientCard}`}>
              <h3>Patient</h3>
              <ul>
                <li>Book appointments easily</li>
                <li>Access medical records</li>
                <li>Manage prescriptions</li>
                <li>Telehealth consultations</li>
              </ul>
              <button 
                className={styles.roleButton}
                onClick={() => navigate('/register?role=patient')}
              >
                Join as Patient
              </button>
            </div>
            
            <div className={`${styles.roleCard} ${styles.doctorCard}`}>
              <h3>Doctor</h3>
              <ul>
                <li>Manage your schedule</li>
                <li>Access patient records</li>
                <li>Track practice analytics</li>
                <li>Telemedicine platform</li>
              </ul>
              <button 
                className={styles.roleButton}
                onClick={() => navigate('/register?role=doctor')}
              >
                Join as Doctor
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerLogo}>
              <Heart className={styles.logoIcon} />
              <span>MedPortal</span>
            </div>
            <p>Making healthcare accessible for everyone.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;