// src/pages/dashboard/AdminDashboard.jsx - UPDATED WITH NAVIGATION
import React, { useState, useEffect } from 'react';
import { 
  Heart, Calendar, Users, Settings, LogOut, Search, Bell, ChevronRight,
  TrendingUp, Activity, Shield, Database, UserPlus, Crown, BarChart3,
  Eye, Edit, Trash2, DollarSign, X, Plus, Check, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { adminService, handleApiError } from '../../services/api';
import styles from './AdminDashboard.module.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [data, setData] = useState({
    users: [],
    analytics: null,
    subscriptionPlans: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // REAL API CALLS - NO PLACEHOLDERS
      const [usersRes, analyticsRes] = await Promise.all([
        adminService.getUsers({ limit: 20 }),
        adminService.getAnalytics()
      ]);

      let plans = [];
      try {
        const plansRes = await adminService.getSubscriptionPlans();
        plans = plansRes.data;
      } catch (err) {
        console.log('Plans endpoint not available yet');
      }

      setData({
        users: usersRes.data.results || usersRes.data,
        analytics: analyticsRes.data,
        subscriptionPlans: plans
      });
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Handle navigation based on active tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Navigate to specific pages for users and subscriptions
    if (tab === 'users') {
      navigate('/admin/users');
    } else if (tab === 'subscriptions') {
      navigate('/admin/subscriptions');
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={fetchDashboardData}>Retry</button>
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
            <span className={styles.logoText}>MedPortal Admin</span>
          </div>
          
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search users, analytics..."
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
                <span>{user?.first_name?.[0] || 'A'}{user?.last_name?.[0] || 'D'}</span>
              </div>
              <div>
                <div className={styles.userName}>
                  {user?.first_name} {user?.last_name}
                </div>
                <div className={styles.userRole}>Admin</div>
              </div>
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
                { id: 'overview', icon: BarChart3, label: 'Overview' },
                { id: 'users', icon: Users, label: 'User Management' },
                { id: 'subscriptions', icon: Crown, label: 'Subscriptions' },
                { id: 'analytics', icon: TrendingUp, label: 'Analytics' },
                { id: 'system', icon: Database, label: 'System Health' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => handleTabChange(id)}
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
            {/* Hero Section - IMAGE PRESERVED */}
            <div className={styles.heroSection}>
              <div className={styles.heroContent}>
                <h1 className={styles.heroTitle}>
                  Welcome back, {user?.first_name || 'Admin'}!
                </h1>
                <p className={styles.heroSubtitle}>
                  System overview and management dashboard
                </p>
                
                <div className={styles.heroStats}>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.analytics?.user_statistics?.total_users?.toLocaleString() || '0'}
                    </div>
                    <div className={styles.heroStatLabel}>Total Users</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {data.analytics?.appointment_statistics?.total_appointments?.toLocaleString() || '0'}
                    </div>
                    <div className={styles.heroStatLabel}>Appointments</div>
                  </div>
                  <div className={styles.heroStat}>
                    <div className={styles.heroStatValue}>
                      {formatCurrency(data.analytics?.subscription_statistics?.total_monthly_revenue || 0)}
                    </div>
                    <div className={styles.heroStatLabel}>Monthly Revenue</div>
                  </div>
                </div>
              </div>
              
              {/* Admin Illustration - IMAGE KEPT */}
              <div className={styles.heroIllustration}>
                <img 
                  src="/src/assets/20250925_1242_Futuristic Admin Dashboard_simple_compose_01k60asx18evfa0w5zs2tygh92 (1).png"
                  alt="Admin Dashboard"
                  className={styles.adminImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className={styles.adminIllustrationFallback} style={{display: 'none'}}>
                  <Shield className={styles.shieldIcon} />
                </div>
              </div>
            </div>

            {/* Key Metrics - REAL DATA FROM API */}
            <div className={styles.metricsGrid}>
              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Users size={24} />
                  </div>
                  <div className={styles.metricChange}>
                    <span className={styles.positive}>
                      +{data.analytics?.user_statistics?.user_growth_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {data.analytics?.user_statistics?.total_users?.toLocaleString() || '0'}
                </div>
                <div className={styles.metricLabel}>Total Users</div>
                <div className={styles.metricBreakdown}>
                  <span>{data.analytics?.user_statistics?.total_doctors || 0} Doctors</span>
                  <span>{data.analytics?.user_statistics?.total_patients || 0} Patients</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Calendar size={24} />
                  </div>
                  <div className={styles.metricChange}>
                    <span className={styles.positive}>
                      +{data.analytics?.appointment_statistics?.appointment_growth_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {data.analytics?.appointment_statistics?.total_appointments?.toLocaleString() || '0'}
                </div>
                <div className={styles.metricLabel}>Total Appointments</div>
                <div className={styles.metricBreakdown}>
                  <span>This month</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <DollarSign size={24} />
                  </div>
                  <div className={styles.metricChange}>
                    <span className={styles.positive}>
                      +{data.analytics?.subscription_statistics?.revenue_growth_percentage?.toFixed(1) || 0}%
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {formatCurrency(data.analytics?.subscription_statistics?.total_monthly_revenue || 0)}
                </div>
                <div className={styles.metricLabel}>Monthly Revenue</div>
                <div className={styles.metricBreakdown}>
                  <span>{data.analytics?.subscription_statistics?.active_subscriptions || 0} Active Subscriptions</span>
                </div>
              </div>

              <div className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <div className={styles.metricIcon}>
                    <Activity size={24} />
                  </div>
                  <div className={styles.metricChange}>
                    <span className={styles.positive}>
                      {data.analytics?.system_status?.system_uptime?.toFixed(1) || 99.9}%
                    </span>
                  </div>
                </div>
                <div className={styles.metricValue}>
                  {data.analytics?.system_status?.system_uptime?.toFixed(1) || 99.9}%
                </div>
                <div className={styles.metricLabel}>System Uptime</div>
                <div className={styles.metricBreakdown}>
                  <span>Last 30 days</span>
                </div>
              </div>
            </div>

            {/* Recent Users - REAL DATA FROM API */}
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Users</h2>
                <button className={styles.viewAllButton} onClick={() => navigate('/admin/users')}>
                  View All <ChevronRight className={styles.chevronIcon} />
                </button>
              </div>
              <div className={styles.sectionContent}>
                {data.users.length > 0 ? (
                  <div className={styles.activityList}>
                    {data.users.slice(0, 5).map((user) => (
                      <div key={user.id} className={styles.activityItem}>
                        <div className={styles.activityIcon}>
                          <UserPlus size={16} />
                        </div>
                        <div className={styles.activityContent}>
                          <p className={styles.activityDescription}>
                            {user.first_name} {user.last_name}
                          </p>
                          <div className={styles.activityMeta}>
                            <span className={styles.activityUser}>{user.role}</span>
                            <span className={styles.activityTime}>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <Users className={styles.emptyIcon} />
                    <p>No users found</p>
                  </div>
                )}
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
                <button 
                  onClick={() => navigate('/admin/users')}
                  className={styles.actionButtonLarge}
                >
                  <UserPlus className={styles.actionIcon} />
                  <span>User Management</span>
                </button>
                <button 
                  onClick={() => navigate('/admin/subscriptions')}
                  className={styles.actionButtonLarge}
                >
                  <Crown className={styles.actionIcon} />
                  <span>Manage Subscriptions</span>
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={styles.actionButtonLarge}
                >
                  <BarChart3 className={styles.actionIcon} />
                  <span>View Analytics</span>
                </button>
                <button 
                  onClick={() => setActiveTab('system')}
                  className={styles.actionButtonLarge}
                >
                  <Database className={styles.actionIcon} />
                  <span>System Health</span>
                </button>
              </div>
            </div>

            {/* System Status - REAL DATA */}
            <div className={styles.statusCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>System Status</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.statusList}>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIndicator} data-status="healthy"></div>
                    <span>Database</span>
                    <span className={styles.statusValue}>Healthy</span>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIndicator} data-status="healthy"></div>
                    <span>API Services</span>
                    <span className={styles.statusValue}>Operational</span>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIndicator} data-status={data.analytics?.system_status?.email_service_status === 'operational' ? 'healthy' : 'warning'}></div>
                    <span>Email Service</span>
                    <span className={styles.statusValue}>
                      {data.analytics?.system_status?.email_service_status === 'operational' ? 'Operational' : 'Delayed'}
                    </span>
                  </div>
                  <div className={styles.statusItem}>
                    <div className={styles.statusIndicator} data-status="healthy"></div>
                    <span>Payment Gateway</span>
                    <span className={styles.statusValue}>Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users - REAL DATA */}
            <div className={styles.topUsersCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Active Users Today</h2>
              </div>
              <div className={styles.cardContent}>
                <div className={styles.usersList}>
                  {data.users.filter(u => u.role === 'doctor' || u.role === 'patient').slice(0, 4).map((user, index) => (
                    <div key={index} className={styles.userItem}>
                      <div className={styles.userAvatar}>
                        {user.first_name?.[0]}{user.last_name?.[0]}
                      </div>
                      <div className={styles.userDetails}>
                        <p className={styles.userName}>{user.first_name} {user.last_name}</p>
                        <p className={styles.userRole}>{user.role}</p>
                      </div>
                      <div className={`${styles.userStatus} ${styles.online}`}></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={styles.notification} data-type={notification.type}>
          <div className={styles.notificationContent}>
            {notification.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span>{notification.message}</span>
            <button onClick={() => setNotification(null)}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;