// src/pages/dashboard/PatientDashboard.jsx - FULLY UPDATED WITH NAVIGATION
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, 
  Calendar, 
  FileText, 
  User, 
  Settings, 
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Clock,
  Crown,
  ArrowRight,
  Plus,
  Lock,
  Video,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, recordsService, subscriptionService } from '../../services/api';
import BookAppointmentModal from '../../components/modals/BookAppointmentModal';
import SubscriptionsModal from '../../components/modals/SubscriptionsModal';
import Notification from '../../components/common/Notification';
import styles from './PatientDashboard.module.css';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({
    appointments: [],
    records: [],
    subscription: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSubscriptionsModal, setShowSubscriptionsModal] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [appointmentsRes, recordsRes, subscriptionRes] = await Promise.all([
          appointmentService.getMyAppointments(),
          recordsService.getMyRecords(),
          subscriptionService.getCurrent()
        ]);

        setData({
          appointments: appointmentsRes.data || [],
          records: recordsRes.data || [],
          subscription: subscriptionRes.data
        });
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleUpgrade = async (planType) => {
    try {
      await subscriptionService.upgrade({ plan: planType });
      const subscriptionRes = await subscriptionService.getCurrent();
      setData(prev => ({ ...prev, subscription: subscriptionRes.data }));
      
      setNotification({
        type: 'success',
        message: `Successfully upgraded to ${planType.charAt(0).toUpperCase() + planType.slice(1)} plan!`
      });
    } catch (err) {
      console.error('Upgrade error:', err);
      setNotification({
        type: 'error',
        message: 'Failed to upgrade plan. Please try again.'
      });
    }
  };

  const handleBookingAttempt = () => {
    const canBook = canBookAppointment();
    if (!canBook.allowed) {
      setNotification({
        type: 'error',
        message: canBook.reason
      });
      return;
    }
    setShowBookingModal(true);
  };

  const handleBookingSuccess = async () => {
    setNotification({
      type: 'success',
      message: 'Appointment booked successfully! You will receive a confirmation email shortly.'
    });

    try {
      const appointmentsRes = await appointmentService.getMyAppointments();
      const subscriptionRes = await subscriptionService.getCurrent();
      setData(prev => ({ 
        ...prev, 
        appointments: appointmentsRes.data || [],
        subscription: subscriptionRes.data
      }));
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  const canBookAppointment = () => {
    if (!data.subscription) return { allowed: false, reason: 'Loading subscription...' };
    
    const remaining = data.subscription.remaining_this_month;
    if (remaining === null) return { allowed: true };
    if (remaining > 0) return { allowed: true };
    
    return { 
      allowed: false, 
      reason: `You've reached your monthly limit of ${data.subscription.appointment_limit} appointments. Upgrade to book more.` 
    };
  };

  const getSubscriptionFeatures = () => {
    const tier = data.subscription?.tier || 'free';
    
    const features = {
      free: {
        appointments: 2,
        telehealth: false,
        priority: false,
        analytics: false,
        support: 'Standard',
        family: false
      },
      basic: {
        appointments: 5,
        telehealth: true,
        priority: true,
        analytics: false,
        support: 'Email',
        family: false
      },
      premium: {
        appointments: 'unlimited',
        telehealth: true,
        priority: true,
        analytics: true,
        support: '24/7',
        family: true
      }
    };
    
    return features[tier] || features.free;
  };

  const getRecordIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'checkup': return '🩺';
      case 'lab': return '🧪';
      case 'prescription': return '💊';
      case 'consultation': return '💬';
      default: return '📄';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric'
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getSubscriptionDisplayName = (tier) => {
    switch(tier) {
      case 'free': return 'Free';
      case 'basic': return 'Basic';
      case 'premium': return 'Premium';
      default: return 'Free';
    }
  };

  const features = getSubscriptionFeatures();

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <Heart className={styles.logoIcon} />
            <span className={styles.logoText}>MedPortal</span>
          </div>
          
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search doctors, records..."
              className={styles.searchInput}
            />
          </div>

          <div className={styles.headerRight}>
            <button className={styles.notificationButton}>
              <Bell className={styles.bellIcon} />
              <span className={styles.notificationBadge}></span>
            </button>
            
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>
                <span>{user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || 'U'}</span>
              </div>
              <span className={styles.userName}>
                {user?.first_name} {user?.last_name}
              </span>
            </div>
            
            <button onClick={handleLogout} className={styles.logoutButton}>
              <LogOut className={styles.logoutIcon} />
            </button>
          </div>
        </div>
      </header>

      <div className={styles.dashboardContent}>
        <div className={styles.dashboardGrid}>
          
          {/* Sidebar */}
          <div className={styles.sidebar}>
            <nav className={styles.sidebarNav}>
              <button
                onClick={() => setActiveTab('overview')}
                className={`${styles.navButton} ${activeTab === 'overview' ? styles.navButtonActive : ''}`}
              >
                <Heart className={styles.navIcon} />
                Overview
              </button>
              
              <button
                onClick={() => navigate('/patient/appointments')}
                className={styles.navButton}
              >
                <Calendar className={styles.navIcon} />
                Appointments
              </button>
              
              <button
                onClick={() => navigate('/patient/records')}
                className={styles.navButton}
              >
                <FileText className={styles.navIcon} />
                Medical Records
              </button>
              
              <button
                onClick={() => setShowSubscriptionsModal(true)}
                className={styles.navButton}
              >
                <Crown className={styles.navIcon} />
                Subscription
              </button>
              
              <button
                onClick={() => setActiveTab('profile')}
                className={`${styles.navButton} ${activeTab === 'profile' ? styles.navButtonActive : ''}`}
              >
                <User className={styles.navIcon} />
                Profile
              </button>
              
              <button
                onClick={() => setActiveTab('settings')}
                className={`${styles.navButton} ${activeTab === 'settings' ? styles.navButtonActive : ''}`}
              >
                <Settings className={styles.navIcon} />
                Settings
              </button>
            </nav>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  Good morning, {user?.first_name || 'Patient'}!
                </h1>
                <p className={styles.heroSubtitle}>
                  Here's an overview of your health today
                </p>
                
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.subscription?.used_this_month || 0}
                      {data.subscription?.appointment_limit ? `/${data.subscription.appointment_limit}` : ''}
                    </div>
                    <div className={styles.heroStatLabel}>Appointments</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>{data.records.length}</div>
                    <div className={styles.heroStatLabel}>Medical Records</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {getSubscriptionDisplayName(data.subscription?.tier)}
                    </div>
                    <div className={styles.heroStatLabel}>Current Plan</div>
                  </div>
                </div>
              </div>
              
              <div className={styles.heroIllustration}>
                <img 
                  src="https://i.pinimg.com/736x/3b/9d/9a/3b9d9ab556375cebcdbe86b0c1f494b5.jpg"
                  alt="Medical Anatomy"
                  className={styles.anatomyImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.anatomyFallback} style={{display: 'none'}}>
                  <Heart size={64} color="var(--primary-green)" />
                </div>
              </div>
            </div>

            {/* Subscription Alert */}
            {data.subscription?.tier === 'free' && (
              <div className={styles.subscriptionAlert}>
                <div className={styles.alertContent}>
                  <Crown className={styles.alertIcon} />
                  <div className={styles.alertText}>
                    <h3>Unlock More Features</h3>
                    <p>Upgrade to Basic or Premium for telehealth appointments, priority booking, and more!</p>
                  </div>
                  <button 
                    className={styles.alertButton}
                    onClick={() => setShowSubscriptionsModal(true)}
                  >
                    View Plans
                  </button>
                </div>
              </div>
            )}

            {/* Medical Records Section */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  <strong>{data.records.length}</strong> Medical Records
                </h2>
                <button 
                  className={styles.viewAllButton}
                  onClick={() => navigate('/patient/records')}
                >
                  View All <ChevronRight className={styles.chevronIcon} />
                </button>
              </div>
              <div className={styles.sectionContent}>
                {data.records.length > 0 ? (
                  <div className={styles.recordsList}>
                    {data.records.slice(0, 3).map((record) => (
                      <div 
                        key={record.id} 
                        className={styles.recordItem}
                        onClick={() => navigate('/patient/records')}
                      >
                        <div className={styles.recordIcon}>{getRecordIcon(record.title)}</div>
                        <div className={styles.recordContent}>
                          <h3 className={styles.recordTitle}>{record.title}</h3>
                          <p className={styles.recordMeta}>
                            {record.doctor_name || 'Doctor'} • {formatDate(record.created_at)}
                          </p>
                        </div>
                        <ChevronRight className={styles.recordChevron} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <FileText className={styles.emptyIcon} />
                    <p>No medical records yet</p>
                    <small>Your medical records will appear here</small>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={styles.rightSidebar}>
            
            {/* My Schedule */}
            <div className={styles.scheduleCard}>
              <div className={styles.scheduleHeader}>
                <h2 className={styles.scheduleTitle}>My Schedule</h2>
                <p className={styles.scheduleSubtitle}>Upcoming appointments</p>
              </div>
              <div className={styles.scheduleContent}>
                {data.appointments.length > 0 ? (
                  <div className={styles.appointmentsList}>
                    {data.appointments
                      .filter(apt => new Date(apt.start) > new Date())
                      .slice(0, 3)
                      .map((appointment) => (
                        <div key={appointment.id} className={styles.appointmentItem}>
                          <div className={styles.doctorAvatar}>
                            <span>{appointment.doctor_name?.[0] || 'D'}</span>
                          </div>
                          <div className={styles.appointmentDetails}>
                            <p className={styles.doctorName}>
                              {appointment.doctor_name || `Doctor #${appointment.doctor}`}
                            </p>
                            <p className={styles.appointmentSpecialty}>{appointment.specialty || 'General Practice'}</p>
                            <div className={styles.appointmentTime}>
                              <Clock className={styles.clockIcon} />
                              {formatDate(appointment.start)} • {formatTime(appointment.start)}
                            </div>
                            {appointment.visit_type === 'telehealth' && (
                              <span className={styles.telehealthBadge}>
                                <Video size={12} />
                                Telehealth
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className={styles.emptySchedule}>
                    <Calendar className={styles.emptyIcon} />
                    <p>No upcoming appointments</p>
                  </div>
                )}
                
                <button 
                  className={styles.viewAllAppointmentsButton}
                  onClick={() => navigate('/patient/appointments')}
                >
                  View All Appointments
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Book Appointment Card */}
            <div className={styles.availableDoctorsCard}>
              <div className={styles.scheduleHeader}>
                <h2 className={styles.scheduleTitle}>Book Appointment</h2>
                <p className={styles.scheduleSubtitle}>Available doctors</p>
              </div>
              <div className={styles.scheduleContent}>
                <div className={styles.bookingStatus}>
                  <div className={styles.remainingAppointments}>
                    <span>Remaining this month:</span>
                    <span className={styles.remaining}>
                      {data.subscription?.remaining_this_month === null 
                        ? 'Unlimited' 
                        : `${data.subscription?.remaining_this_month || 0} of ${data.subscription?.appointment_limit || 2}`}
                    </span>
                  </div>
                  {!canBookAppointment().allowed && (
                    <div className={styles.limitReached}>
                      <AlertCircle size={16} />
                      <span>Monthly limit reached</span>
                    </div>
                  )}
                </div>

                <button 
                  className={`${styles.bookButton} ${!canBookAppointment().allowed ? styles.disabled : ''}`}
                  onClick={handleBookingAttempt}
                  disabled={!canBookAppointment().allowed}
                >
                  <Plus className={styles.plusIcon} />
                  {canBookAppointment().allowed ? 'Book New Appointment' : 'Upgrade to Book More'}
                </button>
              </div>
            </div>

            {/* Enhanced Subscription Widget */}
            <div className={styles.subscriptionCard}>
              <div className={styles.subscriptionHeader}>
                <Crown className={styles.crownIcon} />
                <h3 className={styles.subscriptionTitle}>
                  {getSubscriptionDisplayName(data.subscription?.tier)} Plan
                </h3>
              </div>
              
              <div className={styles.subscriptionUsage}>
                <div className={styles.usageText}>
                  <span>Appointments Used</span>
                  <span>
                    {data.subscription?.used_this_month || 0}
                    {data.subscription?.appointment_limit ? `/${data.subscription.appointment_limit}` : ' (Unlimited)'}
                  </span>
                </div>
                <div className={styles.usageBar}>
                  <div 
                    className={styles.usageFill}
                    style={{ 
                      width: data.subscription?.appointment_limit 
                        ? `${((data.subscription?.used_this_month || 0) / data.subscription.appointment_limit) * 100}%`
                        : '0%'
                    }}
                  ></div>
                </div>
              </div>

              <div className={styles.featuresList}>
                <div className={`${styles.feature} ${features.telehealth ? styles.available : styles.restricted}`}>
                  {features.telehealth ? <Video size={16} /> : <Lock size={16} />}
                  <span>Telehealth Appointments</span>
                  {!features.telehealth && <Crown size={12} />}
                </div>
                <div className={`${styles.feature} ${features.priority ? styles.available : styles.restricted}`}>
                  {features.priority ? <Clock size={16} /> : <Lock size={16} />}
                  <span>Priority Booking</span>
                  {!features.priority && <Crown size={12} />}
                </div>
                <div className={`${styles.feature} ${features.analytics ? styles.available : styles.restricted}`}>
                  {features.analytics ? <FileText size={16} /> : <Lock size={16} />}
                  <span>Advanced Analytics</span>
                  {!features.analytics && <Crown size={12} />}
                </div>
              </div>

              {data.subscription?.tier !== 'premium' && (
                <div className={styles.upgradePromo}>
                  <h4 className={styles.upgradeTitle}>
                    Upgrade to {data.subscription?.tier === 'free' ? 'Basic ($9.99/mo)' : 'Premium ($19.99/mo)'}
                  </h4>
                  <ul className={styles.upgradeFeatures}>
                    {data.subscription?.tier === 'free' ? (
                      <>
                        <li>• 5 appointments per month</li>
                        <li>• Telehealth appointments</li>
                        <li>• Priority booking</li>
                        <li>• Email reminders</li>
                      </>
                    ) : (
                      <>
                        <li>• Unlimited appointments</li>
                        <li>• Advanced medical analytics</li>
                        <li>• 24/7 premium support</li>
                        <li>• Family account sharing</li>
                      </>
                    )}
                  </ul>
                </div>
              )}

              <button 
                className={styles.upgradeButton}
                onClick={() => setShowSubscriptionsModal(true)}
              >
                {data.subscription?.tier === 'premium' ? 'Manage Plan' : 'Upgrade Now'}
                <ArrowRight className={styles.upgradeArrow} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <BookAppointmentModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        onSuccess={handleBookingSuccess}
      />

      <SubscriptionsModal
        isOpen={showSubscriptionsModal}
        onClose={() => setShowSubscriptionsModal(false)}
        currentTier={data.subscription?.tier || 'free'}
        onUpgrade={handleUpgrade}
      />

      {/* Notification */}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default PatientDashboard;