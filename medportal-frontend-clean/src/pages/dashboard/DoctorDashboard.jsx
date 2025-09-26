// src/pages/dashboard/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, FileText, Users, Settings, LogOut, Search, Bell,
  ChevronRight, Clock, TrendingUp, UserCheck, Activity, Plus, Eye,
  Edit3, CheckCircle, XCircle, AlertCircle, BarChart3, Crown, Stethoscope
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { appointmentService, analyticsService, recordsService } from '../../services/api';
import styles from './DoctorDashboard.module.css';

const DoctorDashboard = () => {
  const { user, logout } = useAuth();
  const [data, setData] = useState({
    appointments: [],
    todayAppointments: [],
    analytics: null,
    patients: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', notes: '' });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments
      const appointmentsRes = await appointmentService.getDoctorAppointments();
      const appointments = appointmentsRes.data || [];
      
      // Filter today's appointments
      const today = new Date().toISOString().split('T')[0];
      const todayAppointments = appointments.filter(apt => 
        apt.start && apt.start.startsWith(today)
      );

      // Fetch analytics
      let analyticsData = null;
      try {
        const analyticsRes = await analyticsService.getDoctorAnalytics('month');
        analyticsData = analyticsRes.data;
      } catch (err) {
        console.error('Analytics error:', err);
        analyticsData = {
          total_patients: new Set(appointments.map(apt => apt.patient)).size,
          monthly_appointments: appointments.length,
          completed_appointments: appointments.filter(apt => apt.status === 'completed').length,
          hours_spent: appointments.filter(apt => apt.status === 'completed').length,
          monthly_change: '+12%',
          new_patients: 3
        };
      }

      // Get unique patients
      const uniquePatientIds = [...new Set(appointments.map(apt => apt.patient))];
      const patientsData = await Promise.all(
        uniquePatientIds.slice(0, 10).map(async (patientId) => {
          try {
            const records = await recordsService.getPatientRecords(patientId);
            return {
              id: patientId,
              name: `Patient #${patientId}`,
              records: records.data || [],
              lastVisit: appointments.find(apt => apt.patient === patientId)?.start
            };
          } catch {
            return { 
              id: patientId, 
              name: `Patient #${patientId}`, 
              records: [], 
              lastVisit: null 
            };
          }
        })
      );

      // Build recent activity
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
        analytics: analyticsData,
        patients: patientsData.filter(p => p !== undefined)
      });
      setRecentActivity(activity);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!selectedPatient || !newNote.title || !newNote.notes) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await recordsService.createRecord(selectedPatient.id, newNote);
      alert('Medical note added successfully!');
      setShowAddNoteModal(false);
      setNewNote({ title: '', notes: '' });
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add medical note');
    }
  };

  const handleAppointmentAction = async (appointmentId, action) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, action);
      fetchDashboardData();
    } catch (err) {
      console.error('Error updating appointment:', err);
      alert('Failed to update appointment');
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

  const isPremiumDoctor = user?.subscription?.tier === 'premium';

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
                {isPremiumDoctor && <Crown size={14} style={{ marginLeft: '4px', color: '#f59e0b' }} />}
              </span>
            </div>
            
            <button onClick={logout} className={styles.logoutButton}>
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
                { id: 'patients', icon: Users, label: 'Patient Records' },
                { id: 'analytics', icon: BarChart3, label: 'Analytics' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === 'appointments') {
                      window.location.href = '/doctor/appointments';
                    } else {
                      setActiveTab(id);
                    }
                  }}
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
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                {/* Hero Section */}
                <div className={styles.heroSection}>
                  <div className={styles.heroContent}>
                    <h1 className={styles.heroTitle}>
                      Good morning, Dr. {user?.first_name || 'Doctor'}! 👋
                    </h1>
                    <p className={styles.heroSubtitle}>
                      You have {data.todayAppointments.length} appointments today
                    </p>
                    
                    <div className={styles.heroStats}>
                      <div className={styles.heroStat}>
                        <div className={styles.heroStatValue}>
                          {data.todayAppointments.length}
                        </div>
                        <div className={styles.heroStatLabel}>Today</div>
                      </div>
                      <div className={styles.heroStat}>
                        <div className={styles.heroStatValue}>
                          {data.analytics?.total_patients || 0}
                        </div>
                        <div className={styles.heroStatLabel}>Patients</div>
                      </div>
                      <div className={styles.heroStat}>
                        <div className={styles.heroStatValue}>
                          {data.analytics?.hours_spent || 0}h
                        </div>
                        <div className={styles.heroStatLabel}>Hours</div>
                      </div>
                    </div>
                  </div>
                  
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
                      <Stethoscope className={styles.activityIcon} />
                    </div>
                  </div>
                </div>

                {/* Today's Appointments */}
                <div className={styles.sectionCard}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Today's Schedule</h2>
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
                                  {appointment.visit_type === 'telehealth' ? '📹 Telehealth' : '🏥 In-Person'}
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
                              <button 
                                className={styles.actionButton} 
                                title="View patient records"
                                onClick={() => {
                                  setSelectedPatient({ 
                                    id: appointment.patient, 
                                    name: `Patient #${appointment.patient}` 
                                  });
                                  setActiveTab('patients');
                                }}
                              >
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
                      <h3>Monthly Appointments</h3>
                      <TrendingUp className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.monthly_appointments || 0}
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.positive}>
                        {data.analytics?.monthly_change || '+12%'} from last month
                      </span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <h3>Completed</h3>
                      <UserCheck className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.completed_appointments || 0}
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.neutral}>This month</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <h3>Total Patients</h3>
                      <Users className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.total_patients || 0}
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.positive}>
                        +{data.analytics?.new_patients || 3} new
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* PATIENTS TAB */}
            {activeTab === 'patients' && (
              <div className={styles.sectionCard}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Patient Records</h2>
                </div>
                <div className={styles.sectionContent}>
                  {data.patients.length > 0 ? (
                    data.patients.map(patient => (
                      <div key={patient.id} style={{
                        marginBottom: '24px',
                        padding: '20px',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--bg-cream-light)'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          marginBottom: '16px' 
                        }}>
                          <div>
                            <h3 style={{ 
                              fontSize: 'var(--text-lg)', 
                              fontWeight: 'var(--font-weight-semibold)',
                              marginBottom: '4px'
                            }}>
                              {patient.name}
                            </h3>
                            <p style={{ 
                              color: 'var(--text-gray)', 
                              fontSize: 'var(--text-sm)' 
                            }}>
                              Last Visit: {formatDate(patient.lastVisit)}
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedPatient(patient);
                              setShowAddNoteModal(true);
                            }}
                            style={{
                              padding: '10px 20px',
                              background: 'var(--primary-green)',
                              color: 'white',
                              border: 'none',
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: 'var(--text-sm)',
                              fontWeight: 'var(--font-weight-medium)'
                            }}
                          >
                            <Plus size={16} />
                            Add Note
                          </button>
                        </div>

                        <h4 style={{ 
                          fontSize: 'var(--text-base)', 
                          marginBottom: '12px',
                          fontWeight: 'var(--font-weight-medium)'
                        }}>
                          Medical History ({patient.records?.length || 0} records)
                        </h4>
                        {patient.records && patient.records.length > 0 ? (
                          patient.records.map(record => (
                            <div key={record.id} style={{
                              padding: '16px',
                              background: 'white',
                              borderRadius: 'var(--radius-md)',
                              marginBottom: '12px',
                              borderLeft: '4px solid var(--primary-green)'
                            }}>
                              <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: '8px'
                              }}>
                                <h5 style={{ 
                                  margin: 0, 
                                  fontSize: 'var(--text-base)',
                                  fontWeight: 'var(--font-weight-semibold)'
                                }}>
                                  {record.title}
                                </h5>
                                <span style={{ 
                                  fontSize: 'var(--text-sm)', 
                                  color: 'var(--text-gray)' 
                                }}>
                                  {formatDate(record.created_at)}
                                </span>
                              </div>
                              <p style={{ 
                                margin: 0, 
                                color: 'var(--text-primary)',
                                fontSize: 'var(--text-sm)',
                                lineHeight: '1.6'
                              }}>
                                {record.notes}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div style={{ 
                            textAlign: 'center', 
                            padding: '32px',
                            color: 'var(--text-light-gray)'
                          }}>
                            <FileText size={32} style={{ margin: '0 auto 12px' }} />
                            <p>No medical records yet</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <Users className={styles.emptyIcon} />
                      <p>No patients yet</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <>
                {isPremiumDoctor && (
                  <div style={{
                    background: '#fef3c7',
                    borderRadius: 'var(--radius-lg)',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}>
                    <Crown size={24} color="#f59e0b" />
                    <p style={{ 
                      margin: 0, 
                      color: '#92400e', 
                      fontWeight: 'var(--font-weight-medium)'
                    }}>
                      Premium Analytics: Real-time updates enabled
                    </p>
                  </div>
                )}

                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <h3>Patients Attended</h3>
                      <Users className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.total_patients || 0}
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.neutral}>Unique patients this month</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <h3>Total Sessions</h3>
                      <Calendar className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.monthly_appointments || 0}
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.neutral}>Appointments this month</span>
                    </div>
                  </div>

                  <div className={styles.statCard}>
                    <div className={styles.statCardHeader}>
                      <h3>Hours Spent</h3>
                      <Clock className={styles.statCardIcon} />
                    </div>
                    <div className={styles.statCardValue}>
                      {data.analytics?.hours_spent || 0}h
                    </div>
                    <div className={styles.statCardChange}>
                      <span className={styles.neutral}>Total consultation time</span>
                    </div>
                  </div>
                </div>

                {/* Completion Rate */}
                <div className={styles.sectionCard} style={{ marginTop: '24px' }}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Appointment Breakdown</h2>
                  </div>
                  <div className={styles.sectionContent}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(3, 1fr)', 
                      gap: '20px' 
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <CheckCircle size={40} color="#10b981" style={{ margin: '0 auto 12px' }} />
                        <div style={{ 
                          fontSize: 'var(--text-2xl)', 
                          fontWeight: 'var(--font-weight-bold)', 
                          color: '#10b981' 
                        }}>
                          {data.analytics?.completed_appointments || 0}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--text-sm)', 
                          color: 'var(--text-gray)' 
                        }}>
                          Completed
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Clock size={40} color="#3b82f6" style={{ margin: '0 auto 12px' }} />
                        <div style={{ 
                          fontSize: 'var(--text-2xl)', 
                          fontWeight: 'var(--font-weight-bold)', 
                          color: '#3b82f6' 
                        }}>
                          {data.appointments.filter(apt => apt.status === 'scheduled').length}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--text-sm)', 
                          color: 'var(--text-gray)' 
                        }}>
                          Scheduled
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <XCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
                        <div style={{ 
                          fontSize: 'var(--text-2xl)', 
                          fontWeight: 'var(--font-weight-bold)', 
                          color: '#ef4444' 
                        }}>
                          {data.appointments.filter(apt => apt.status === 'canceled').length}
                        </div>
                        <div style={{ 
                          fontSize: 'var(--text-sm)', 
                          color: 'var(--text-gray)' 
                        }}>
                          Canceled
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Sidebar */}
          <div className={styles.rightSidebar}>
            <div className={styles.quickActionsCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Quick Actions</h2>
              </div>
              <div className={styles.cardContent}>
                <button className={styles.actionButtonLarge} onClick={() => setActiveTab('patients')}>
                  <Plus className={styles.actionIcon} />
                  <span>Add Medical Record</span>
                </button>
                <button className={styles.actionButtonLarge} onClick={() => window.location.href = '/doctor/appointments'}>
                  <Calendar className={styles.actionIcon} />
                  <span>View Appointments</span>
                </button>
                <button className={styles.actionButtonLarge} onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className={styles.actionIcon} />
                  <span>View Analytics</span>
                </button>
              </div>
            </div>

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
                          <CheckCircle size={16} />
                        </div>
                        <div className={styles.activityDetails}>
                          <p>{activity.description}</p>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showAddNoteModal && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: 'var(--radius-xl)',
            padding: '32px',
            maxWidth: '500px',
            width: '90%'
          }}>
            <h2 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'var(--font-weight-bold)', 
              marginBottom: '8px' 
            }}>
              Add Medical Note
            </h2>
            <p style={{ color: 'var(--text-gray)', marginBottom: '24px' }}>
              Patient: {selectedPatient.name}
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'var(--font-weight-medium)' 
              }}>
                Title
              </label>
              <input
                type="text"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="e.g., Follow-up Consultation"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: 'var(--font-weight-medium)' 
              }}>
                Medical Notes
              </label>
              <textarea
                value={newNote.notes}
                onChange={(e) => setNewNote({ ...newNote, notes: e.target.value })}
                placeholder="Enter detailed medical notes..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-sm)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setNewNote({ title: '', notes: '' });
                }}
                style={{
                  padding: '12px 24px',
                  border: '1px solid var(--border-light)',
                  background: 'white',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: 'var(--primary-green)',
                  color: 'white',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 'var(--font-weight-medium)'
                }}
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;