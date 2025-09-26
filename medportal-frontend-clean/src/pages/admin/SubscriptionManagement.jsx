// src/pages/admin/SubscriptionManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Crown, DollarSign, Users, TrendingUp, Search, Filter, 
  Edit, Trash2, Plus, X, ArrowLeft, Check, AlertCircle,
  Percent, Ban, Calendar, CreditCard, UserCog
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { adminService, handleApiError } from '../../services/api';
import styles from './SubscriptionManagement.module.css';

const SubscriptionManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('subscribers');
  const [plans, setPlans] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeSubscribers: 0,
    growthRate: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch plans - this works
      const plansRes = await adminService.getSubscriptionPlans();
      const plansData = plansRes.data;

      console.log('Plans Data:', plansData);

      // Try to fetch user subscriptions from Django admin endpoint
      let subscriptionsData = [];
      
      try {
        // Try the user-subscriptions endpoint directly
        const subsRes = await api.get('/api/admin/user-subscriptions/');
        subscriptionsData = subsRes.data;
        console.log('Subscriptions from /api/admin/user-subscriptions/:', subscriptionsData);
      } catch (err) {
        console.log('No /api/admin/user-subscriptions/ endpoint, trying users with subscriptions...');
        
        // Fallback: Get all users and check for subscription data
        const usersRes = await adminService.getUsers({ limit: 1000 });
        const usersData = usersRes.data.results || usersRes.data;
        
        console.log('Sample user data:', usersData[0]);
        
        // Extract subscriptions from users
        usersData.forEach(user => {
          if (user.usersubscription_set && user.usersubscription_set.length > 0) {
            user.usersubscription_set.forEach(sub => {
              subscriptionsData.push({
                ...sub,
                user: user.id,
                user_details: {
                  username: user.username,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email
                }
              });
            });
          }
        });
      }

      console.log('All subscriptions:', subscriptionsData);

      // Calculate stats
      let totalRevenue = 0;
      let activeCount = 0;

      // Map subscriptions with user and plan details
      const subscribersData = subscriptionsData.map(subscription => {
        const planTier = subscription.plan || subscription.tier;
        const plan = plansData.find(p => p.tier === planTier);
        
        if (plan && subscription.status === 'active') {
          totalRevenue += parseFloat(plan.price);
          activeCount++;
        }

        return {
          id: subscription.user,
          username: subscription.user_details?.username || `user_${subscription.user}`,
          first_name: subscription.user_details?.first_name || '',
          last_name: subscription.user_details?.last_name || '',
          email: subscription.user_details?.email || '',
          subscription: {
            id: subscription.id,
            tier: planTier,
            status: subscription.status,
            starts_at: subscription.starts_at,
            ends_at: subscription.ends_at
          },
          planDetails: plan
        };
      });

      console.log('Processed Subscribers:', subscribersData);
      console.log('Active Count:', activeCount);
      console.log('Total Revenue:', totalRevenue);

      setPlans(plansData);
      setSubscribers(subscribersData);
      setStats({
        totalRevenue,
        activeSubscribers: activeCount,
        growthRate: 15.3
      });
    } catch (err) {
      console.error('Fetch error:', err);
      showNotification('error', handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreatePlan = async (planData) => {
    try {
      await adminService.createSubscriptionPlan(planData);
      showNotification('success', 'Plan created successfully');
      setShowModal(null);
      fetchData();
    } catch (err) {
      showNotification('error', handleApiError(err));
    }
  };

  const handleUpdatePlan = async (planId, planData) => {
    try {
      await adminService.updateSubscriptionPlan(planId, planData);
      showNotification('success', 'Plan updated successfully');
      setShowModal(null);
      setSelectedItem(null);
      fetchData();
    } catch (err) {
      showNotification('error', handleApiError(err));
    }
  };

  const handleDeletePlan = async (planId) => {
    if (window.confirm('Are you sure you want to delete this plan? Active subscribers will not be affected.')) {
      try {
        await adminService.deleteSubscriptionPlan(planId);
        showNotification('success', 'Plan deleted successfully');
        fetchData();
      } catch (err) {
        showNotification('error', handleApiError(err));
      }
    }
  };

  const handleAssignSubscription = async (userId, planTier) => {
    try {
      await adminService.assignUserSubscription(userId, planTier);
      showNotification('success', 'Subscription assigned successfully');
      setShowModal(null);
      fetchData();
    } catch (err) {
      showNotification('error', handleApiError(err));
    }
  };

  const handleCancelSubscription = async (userId) => {
    if (window.confirm('Are you sure you want to cancel this subscription?')) {
      try {
        await adminService.cancelUserSubscription(userId);
        showNotification('success', 'Subscription cancelled');
        fetchData();
      } catch (err) {
        showNotification('error', handleApiError(err));
      }
    }
  };

  const handleApplyDiscount = async (userId, discountPercent) => {
    try {
      await adminService.applyDiscount(userId, discountPercent);
      showNotification('success', `${discountPercent}% discount applied`);
      setShowModal(null);
      fetchData();
    } catch (err) {
      showNotification('error', handleApiError(err));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPlanColor = (tier) => {
    switch(tier) {
      case 'free': return '#6B7280';
      case 'basic': return '#3B82F6';
      case 'premium': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <div className={styles.subscriptionManagement}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button onClick={() => navigate('/admin-dashboard')} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <button onClick={() => navigate('/admin/users')} className={styles.navButton}>
            <UserCog size={20} />
            User Management
          </button>
        </div>
        
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Subscription Management</h1>
            <p className={styles.subtitle}>Manage plans, subscribers, and billing</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#DCFCE7' }}>
            <DollarSign size={24} color="#16A34A" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.totalRevenue)}</div>
            <div className={styles.statLabel}>Monthly Revenue</div>
            <div className={styles.statChange}>+{stats.growthRate}% from last month</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#E0E7FF' }}>
            <Users size={24} color="#4F46E5" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.activeSubscribers}</div>
            <div className={styles.statLabel}>Active Subscribers</div>
            <div className={styles.statChange}>Total paying users</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#FEF3C7' }}>
            <Crown size={24} color="#F59E0B" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{plans.length}</div>
            <div className={styles.statLabel}>Active Plans</div>
            <div className={styles.statChange}>Available subscription tiers</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#DBEAFE' }}>
            <TrendingUp size={24} color="#3B82F6" />
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{formatCurrency(stats.totalRevenue / (stats.activeSubscribers || 1))}</div>
            <div className={styles.statLabel}>Avg Revenue Per User</div>
            <div className={styles.statChange}>ARPU metric</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={activeTab === 'subscribers' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('subscribers')}
        >
          <Users size={20} />
          Subscribers ({subscribers.length})
        </button>
        <button 
          className={activeTab === 'plans' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('plans')}
        >
          <Crown size={20} />
          Plans ({plans.length})
        </button>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeTab === 'subscribers' ? (
          <SubscribersView
            subscribers={subscribers}
            plans={plans}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterPlan={filterPlan}
            setFilterPlan={setFilterPlan}
            loading={loading}
            onAssign={(user) => {
              setSelectedItem(user);
              setShowModal('assign');
            }}
            onDiscount={(user) => {
              setSelectedItem(user);
              setShowModal('discount');
            }}
            onCancel={handleCancelSubscription}
            formatCurrency={formatCurrency}
            getPlanColor={getPlanColor}
          />
        ) : (
          <PlansView
            plans={plans}
            loading={loading}
            onAdd={() => setShowModal('createPlan')}
            onEdit={(plan) => {
              setSelectedItem(plan);
              setShowModal('editPlan');
            }}
            onDelete={handleDeletePlan}
            formatCurrency={formatCurrency}
            getPlanColor={getPlanColor}
          />
        )}
      </div>

      {/* Modals */}
      {showModal === 'createPlan' && (
        <PlanFormModal
          isOpen={true}
          onClose={() => setShowModal(null)}
          onSubmit={handleCreatePlan}
          title="Create Subscription Plan"
        />
      )}

      {showModal === 'editPlan' && selectedItem && (
        <PlanFormModal
          isOpen={true}
          onClose={() => {
            setShowModal(null);
            setSelectedItem(null);
          }}
          onSubmit={(data) => handleUpdatePlan(selectedItem.id, data)}
          plan={selectedItem}
          title="Edit Subscription Plan"
        />
      )}

      {showModal === 'assign' && selectedItem && (
        <AssignSubscriptionModal
          isOpen={true}
          onClose={() => {
            setShowModal(null);
            setSelectedItem(null);
          }}
          user={selectedItem}
          plans={plans}
          onAssign={handleAssignSubscription}
        />
      )}

      {showModal === 'discount' && selectedItem && (
        <DiscountModal
          isOpen={true}
          onClose={() => {
            setShowModal(null);
            setSelectedItem(null);
          }}
          user={selectedItem}
          onApply={handleApplyDiscount}
        />
      )}

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

// Subscribers View Component
const SubscribersView = ({ 
  subscribers, plans, searchTerm, setSearchTerm, filterPlan, setFilterPlan,
  loading, onAssign, onDiscount, onCancel, formatCurrency, getPlanColor 
}) => {
  const filteredSubscribers = subscribers.filter(sub => {
    const matchesSearch = sub.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlan = !filterPlan || sub.subscription?.tier === filterPlan;
    return matchesSearch && matchesPlan;
  });

  return (
    <>
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search subscribers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">All Plans</option>
          {plans.map(plan => (
            <option key={plan.tier} value={plan.tier}>{plan.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading subscribers...</p>
        </div>
      ) : filteredSubscribers.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <h3>No subscribers found</h3>
          <p>No users with active subscriptions</p>
        </div>
      ) : (
        <div className={styles.subscribersGrid}>
          {filteredSubscribers.map(subscriber => (
            <div key={subscriber.id} className={styles.subscriberCard}>
              <div className={styles.subscriberHeader}>
                <div className={styles.subscriberInfo}>
                  <div className={styles.subscriberAvatar}>
                    {subscriber.first_name?.[0]}{subscriber.last_name?.[0]}
                  </div>
                  <div>
                    <h3>{subscriber.first_name} {subscriber.last_name}</h3>
                    <p>{subscriber.email}</p>
                  </div>
                </div>
                <span 
                  className={styles.planBadge}
                  style={{ backgroundColor: getPlanColor(subscriber.subscription?.tier) }}
                >
                  {subscriber.planDetails?.name || subscriber.subscription?.tier}
                </span>
              </div>

              <div className={styles.subscriberDetails}>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Monthly Payment</span>
                  <span className={styles.detailValue}>
                    {formatCurrency(subscriber.planDetails?.price || 0)}
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Status</span>
                  <span className={`${styles.statusBadge} ${styles[subscriber.subscription?.status]}`}>
                    {subscriber.subscription?.status}
                  </span>
                </div>
                <div className={styles.detail}>
                  <span className={styles.detailLabel}>Started</span>
                  <span className={styles.detailValue}>
                    {new Date(subscriber.subscription?.starts_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className={styles.subscriberActions}>
                <button 
                  onClick={() => onAssign(subscriber)}
                  className={styles.actionBtn}
                  title="Change plan"
                >
                  <Edit size={18} />
                  Change Plan
                </button>
                <button 
                  onClick={() => onDiscount(subscriber)}
                  className={styles.actionBtn}
                  title="Apply discount"
                >
                  <Percent size={18} />
                  Discount
                </button>
                <button 
                  onClick={() => onCancel(subscriber.id)}
                  className={`${styles.actionBtn} ${styles.danger}`}
                  title="Cancel subscription"
                >
                  <Ban size={18} />
                  Cancel
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Plans View Component
const PlansView = ({ plans, loading, onAdd, onEdit, onDelete, formatCurrency, getPlanColor }) => {
  return (
    <>
      <div className={styles.plansHeader}>
        <h2>Subscription Plans</h2>
        <button onClick={onAdd} className={styles.addButton}>
          <Plus size={20} />
          Create Plan
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading plans...</p>
        </div>
      ) : (
        <div className={styles.plansGrid}>
          {plans.map(plan => (
            <div key={plan.id} className={styles.planCard}>
              <div className={styles.planHeader} style={{ borderTopColor: getPlanColor(plan.tier) }}>
                <Crown size={24} style={{ color: getPlanColor(plan.tier) }} />
                <h3>{plan.name}</h3>
              </div>

              <div className={styles.planPrice}>
                <span className={styles.price}>{formatCurrency(plan.price)}</span>
                <span className={styles.period}>/month</span>
              </div>

              <div className={styles.planFeatures}>
                <div className={styles.feature}>
                  <Calendar size={16} />
                  <span>
                    {plan.appointment_limit ? `${plan.appointment_limit} appointments/month` : 'Unlimited appointments'}
                  </span>
                </div>
                <div className={styles.feature}>
                  <Users size={16} />
                  <span>{plan.active_subscribers || 0} active subscribers</span>
                </div>
                <div className={styles.feature}>
                  <CreditCard size={16} />
                  <span>{formatCurrency((plan.price || 0) * (plan.active_subscribers || 0))} MRR</span>
                </div>
              </div>

              <div className={styles.planActions}>
                <button onClick={() => onEdit(plan)} className={styles.editBtn}>
                  <Edit size={18} />
                  Edit
                </button>
                <button onClick={() => onDelete(plan.id)} className={styles.deleteBtn}>
                  <Trash2 size={18} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// Plan Form Modal
const PlanFormModal = ({ isOpen, onClose, onSubmit, plan, title }) => {
  const [formData, setFormData] = useState({
    tier: plan?.tier || '',
    name: plan?.name || '',
    price: plan?.price || 0,
    appointment_limit: plan?.appointment_limit || null
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{title}</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Plan Tier</label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              required
              disabled={!!plan}
            >
              <option value="">Select tier</option>
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Plan Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="e.g., Premium Plan"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Monthly Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
              placeholder="19.99"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Appointment Limit (leave empty for unlimited)</label>
            <input
              type="number"
              min="1"
              value={formData.appointment_limit || ''}
              onChange={(e) => setFormData({ ...formData, appointment_limit: e.target.value ? parseInt(e.target.value) : null })}
              placeholder="Unlimited"
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className={styles.submitBtn}>
              {loading ? 'Saving...' : plan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Assign Subscription Modal
const AssignSubscriptionModal = ({ isOpen, onClose, user, plans, onAssign }) => {
  const [selectedPlan, setSelectedPlan] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    await onAssign(user.id, selectedPlan);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Assign Subscription</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h3>{user.first_name} {user.last_name}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Select Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className={styles.select}
            >
              <option value="">Choose a plan</option>
              {plans.map(plan => (
                <option key={plan.tier} value={plan.tier}>
                  {plan.name} - ${plan.price}/month
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formActions}>
            <button onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button 
              onClick={handleAssign} 
              disabled={!selectedPlan || loading}
              className={styles.submitBtn}
            >
              {loading ? 'Assigning...' : 'Assign Plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Discount Modal
const DiscountModal = ({ isOpen, onClose, user, onApply }) => {
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (discount <= 0 || discount > 100) {
      alert('Please enter a discount between 1 and 100');
      return;
    }
    setLoading(true);
    await onApply(user.id, discount);
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Apply Discount</h2>
          <button onClick={onClose} className={styles.closeBtn}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.first_name?.[0]}{user.last_name?.[0]}
            </div>
            <div>
              <h3>{user.first_name} {user.last_name}</h3>
              <p>Current: {user.planDetails?.name} - ${user.planDetails?.price}/month</p>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Discount Percentage</label>
            <div className={styles.discountInput}>
              <input
                type="number"
                min="1"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseInt(e.target.value) || 0)}
                placeholder="20"
              />
              <span>%</span>
            </div>
            {discount > 0 && user.planDetails && (
              <div className={styles.discountPreview}>
                New price: ${((user.planDetails.price * (100 - discount)) / 100).toFixed(2)}/month
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button onClick={onClose} className={styles.cancelBtn}>
              Cancel
            </button>
            <button 
              onClick={handleApply} 
              disabled={loading || discount <= 0}
              className={styles.submitBtn}
            >
              {loading ? 'Applying...' : `Apply ${discount}% Discount`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Notification Component
const Notification = ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={styles.notification} data-type={type}>
      <div className={styles.notificationContent}>
        {type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
        <span>{message}</span>
        <button onClick={onClose}>
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default SubscriptionManagement;