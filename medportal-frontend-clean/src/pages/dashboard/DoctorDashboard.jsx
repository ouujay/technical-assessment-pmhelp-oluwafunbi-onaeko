// src/pages/dashboard/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  FileText, 
  Users, 
  Settings, 
  LogOut,
  Search,
  Bell,
  ChevronRight,
  Clock,
  TrendingUp,
  UserCheck,
  Activity,
  Plus,
  Eye,
  Edit3,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, analyticsService } from '../../services/api';
import styles from './DoctorDashboard.module.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState({
    appointments: [],
    todayAppointments: [],
    analytics: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch appointments from real API
        const appointmentsRes = await appointmentService.getDoctorAppointments();
        const appointments = appointmentsRes.data || [];
        
        // Filter today's appointments
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointments.filter(apt => 
          apt.start && apt.start.startsWith(today)
        );

        // Try to fetch analytics, fallback to calculated values
        let analyticsData = null;
        try {
          const analyticsRes = await analyticsService.getDoctorAnalytics();
          analyticsData = analyticsRes.data;
        } catch (err) {
          // Calculate analytics from appointments if API not available
          analyticsData = {
            total_patients: new Set(appointments.map(apt => apt.patient)).size,
            monthly_appointments: appointments.length,
            completed_appointments: appointments.filter(apt => apt.status === 'completed').length,
            monthly_change: '+12%',
            new_patients: 3
          };
        }

        // Build recent activity from appointments
        const activity = appointments
          .filter(apt => apt.status === 'completed')
          .slice(0, 3)
          .map((apt) => ({
            id: apt.id,
            type: 'completed',
            description: `Completed appointment with Patient #${apt.patient}`,
            timestamp: formatRelativeTime(apt.end || apt.start)
          }));

        setData({
          appointments,
          todayAppointments,
          analytics: analyticsData
        });
        setRecentActivity(activity);
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

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      // Update appointment status via real API
      await appointmentService.updateAppointmentStatus(appointmentId, action);
      
      // Refresh appointments data
      const appointmentsRes = await appointmentService.getDoctorAppointments();
      const appointments = appointmentsRes.data || [];
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(apt => 
        apt.start && apt.start.startsWith(today)
      );
      
      setData(prev => ({ ...prev, appointments, todayAppointments }));
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment. Please try again.');
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

  const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'scheduled': return 'var(--primary-green)';
      case 'completed': return '#16A34A';
      case 'canceled': return '#EF4444';
      default: return 'var(--text-gray)';
    }
  };

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
              placeholder="Search patients, appointments..."
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
                <span>{user?.first_name?.[0] || 'D'}{user?.last_name?.[0] || 'R'}</span>
              </div>
              <span className={styles.userName}>
                Dr. {user?.first_name} {user?.last_name}
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
              {[
                { id: 'overview', icon: Heart, label: 'Overview' },
                { id: 'appointments', icon: Calendar, label: 'Appointments' },
                { id: 'patients', icon: Users, label: 'Patients' },
                { id: 'records', icon: FileText, label: 'Medical Records' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`${styles.navButton} ${activeTab === id ? styles.navButtonActive : ''}`}
                >
                  <Icon className={styles.navIcon} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className={styles.mainContent}>
            {/* Hero Section */}
            <div className={styles.heroSection}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  Good morning, Dr. {user?.first_name || 'Doctor'}!
                </h1>
                <p className={styles.heroSubtitle}>
                  You have {data.todayAppointments.length} appointments today
                </p>
                
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.todayAppointments.length}
                    </div>
                    <div className={styles.heroStatLabel}>Today's Appointments</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.analytics?.total_patients || 0}
                    </div>
                    <div className={styles.heroStatLabel}>Total Patients</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.analytics?.monthly_appointments || data.appointments.length}
                    </div>
                    <div className={styles.heroStatLabel}>This Month</div>
                  </div>
                </div>
              </div>
              
              {/* Medical Illustration */}
              <div className={styles.heroIllustration}>
                <img 
                  src="/src/assets/20250925_1241_Medical Dashboard Interaction_simple_compose_01k60ar9mqfe28yvnmb9bpvkce.png"
                  alt="Medical Dashboard"
                  className={styles.doctorImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.doctorIllustrationFallback} style={{display: 'none'}}>
                  <Activity className={styles.activityIcon} />
                </div>
              </div>
            </div>

            {/* Today's Appointments */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  Today's Schedule
                </h2>
                <span className={styles.appointmentCount}>
                  {data.todayAppointments.length} appointments
                </span>
              </div>
              <div className={styles.sectionContent}>
                {data.todayAppointments.length > 0 ? (
                  <div className={styles.appointmentsList}>
                    {data.todayAppointments.map((appointment) => (
                      <div key={appointment.id} className={styles.appointmentItem}>
                        <div className={styles.appointmentTime}>
                          <Clock className={styles.clockIcon} />
                          <span>{formatTime(appointment.start)}</span>
                        </div>
                        
                        <div className={styles.patientInfo}>
                          <div className={styles.patientAvatar}>
                            <span>P</span>
                          </div>
                          <div className={styles.patientDetails}>
                            <h3 className={styles.patientName}>
                              Patient #{appointment.patient}
                            </h3>
                            <p className={styles.appointmentType}>
                              {appointment.visit_type === 'telehealth' ? 'Video Call' : 'In-Person'}
                            </p>
                          </div>
                        </div>

                        <div className={styles.appointmentStatus}>
                          <span 
                            className={styles.statusBadge}
                            style={{ backgroundColor: getStatusColor(appointment.status) }}
                          >
                            {appointment.status}
                          </span>
                        </div>

                        <div className={styles.appointmentActions}>
                          {appointment.status === 'scheduled' && (
                            <>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'completed')}
                                className={styles.actionButton}
                                title="Mark as completed"
                              >
                                <CheckCircle size={18} />
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(appointment.id, 'canceled')}
                                className={styles.actionButtonDanger}
                                title="Cancel appointment"
                              >
                                <XCircle size={18} />
                              </button>
                            </>
                          )}
                          <button className={styles.actionButton} title="View details">
                            <Eye size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Calendar className={styles.emptyIcon} />
                    <p>No appointments scheduled for today</p>
                    <small>Enjoy your free time!</small>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <h3>Appointments This Month</h3>
                  <TrendingUp className={styles.statCardIcon} />
                </div>
                <div className={styles.statCardValue}>
                  {data.analytics?.monthly_appointments || data.appointments.length}
                </div>
                <div className={styles.statCardChange}>
                  <span className={styles.positive}>
                    {data.analytics?.monthly_change || '+12%'} from last month
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <h3>Completed Appointments</h3>
                  <UserCheck className={styles.statCardIcon} />
                </div>
                <div className={styles.statCardValue}>
                  {data.appointments.filter(apt => apt.status === 'completed').length}
                </div>
                <div className={styles.statCardChange}>
                  <span className={styles.neutral}>Same as last month</span>
                </div>
              </div>

              <div className={styles.statCard}>
                <div className={styles.statCardHeader}>
                  <h3>Total Patients</h3>
                  <Users className={styles.statCardIcon} />
                </div>
                <div className={styles.statCardValue}>
                  {data.analytics?.total_patients || new Set(data.appointments.map(apt => apt.patient)).size}
                </div>
                <div className={styles.statCardChange}>
                  <span className={styles.positive}>
                    +{data.analytics?.new_patients || 3} new patients
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className={styles.rightSidebar}>
            
            {/* Quick Actions */}
            <div className={styles.quickActionsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Quick Actions</h2>
              </div>
              <div className={styles.cardContent}>
                <button className={styles.actionButtonLarge}>
                  <Plus className={styles.actionIcon} />
                  <span>Add Medical Record</span>
                </button>
                <button className={styles.actionButtonLarge}>
                  <Calendar className={styles.actionIcon} />
                  <span>View All Appointments</span>
                </button>
                <button className={styles.actionButtonLarge}>
                  <Users className={styles.actionIcon} />
                  <span>Manage Patients</span>
                </button>
                <button className={styles.actionButtonLarge}>
                  <Settings className={styles.actionIcon} />
                  <span>Update Availability</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.activityCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Recent Activity</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.activityList}>
                  {recentActivity.length > 0 ? (
                    recentActivity.map((activity) => (
                      <div key={activity.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          {activity.type === 'completed' && <CheckCircle size={16} />}
                          {activity.type === 'record' && <Edit3 size={16} />}
                          {activity.type === 'appointment' && <Calendar size={16} />}
                        </div>
                        <div className={styles.activityDetails}>
                          <p>{activity.description}</p>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyActivity}>
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;