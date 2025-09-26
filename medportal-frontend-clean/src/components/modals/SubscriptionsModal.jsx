// src/components/modals/SubscriptionsModal.jsx
import React, { useState } from 'react';
import { 
  X, 
  Check, 
  Crown, 
  Zap,
  Shield,
  Users,
  Calendar,
  Video,
  Clock,
  HeadphonesIcon
} from 'lucide-react';
import styles from './SubscriptionsModal.module.css';

const SubscriptionsModal = ({ isOpen, onClose, currentTier, onUpgrade }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  if (!isOpen) return null;

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      icon: Shield,
      color: '#6b7280',
      features: [
        { text: '2 appointments per month', icon: Calendar },
        { text: 'Basic medical record access', icon: Check },
        { text: 'Standard support', icon: HeadphonesIcon },
        { text: 'Email notifications', icon: Check }
      ],
      limitations: [
        'No telehealth appointments',
        'No priority booking',
        'Limited analytics'
      ]
    },
    {
      id: 'basic',
      name: 'Basic',
      price: '$9.99',
      period: 'per month',
      icon: Zap,
      color: '#3b82f6',
      popular: true,
      features: [
        { text: '5 appointments per month', icon: Calendar },
        { text: 'Priority booking', icon: Clock },
        { text: 'Email reminders', icon: Check },
        { text: 'Telehealth appointments', icon: Video },
        { text: 'Extended medical history', icon: Check },
        { text: 'Email support', icon: HeadphonesIcon }
      ]
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$19.99',
      period: 'per month',
      icon: Crown,
      color: '#f59e0b',
      features: [
        { text: 'Unlimited appointments', icon: Calendar },
        { text: 'Advanced medical analytics', icon: Check },
        { text: '24/7 priority support', icon: HeadphonesIcon },
        { text: 'Telehealth appointments', icon: Video },
        { text: 'Family account sharing', icon: Users },
        { text: 'Prescription management', icon: Check },
        { text: 'Health insights & reports', icon: Check }
      ]
    }
  ];

  const handleUpgrade = async (planId) => {
    if (planId === currentTier) {
      return;
    }

    setIsUpgrading(true);
    try {
      await onUpgrade(planId);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <X size={24} />
        </button>

        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Choose Your Plan</h2>
          <p className={styles.modalSubtitle}>
            Select the perfect plan for your healthcare needs
          </p>
        </div>

        <div className={styles.plansGrid}>
          {plans.map((plan) => {
            const PlanIcon = plan.icon;
            const isCurrentPlan = plan.id === currentTier;
            const isSelected = selectedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`${styles.planCard} ${isCurrentPlan ? styles.currentPlan : ''} ${isSelected ? styles.selected : ''} ${plan.popular ? styles.popular : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>Most Popular</div>
                )}

                <div className={styles.planHeader}>
                  <div className={styles.planIcon} style={{ background: `${plan.color}15` }}>
                    <PlanIcon size={24} style={{ color: plan.color }} />
                  </div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <div className={styles.planPrice}>
                    <span className={styles.price}>{plan.price}</span>
                    <span className={styles.period}>{plan.period}</span>
                  </div>
                </div>

                <div className={styles.planFeatures}>
                  {plan.features.map((feature, index) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div key={index} className={styles.feature}>
                        <FeatureIcon size={16} className={styles.featureIcon} />
                        <span>{feature.text}</span>
                      </div>
                    );
                  })}
                  
                  {plan.limitations && (
                    <>
                      {plan.limitations.map((limitation, index) => (
                        <div key={`limit-${index}`} className={styles.limitation}>
                          <X size={16} className={styles.limitIcon} />
                          <span>{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <button
                  className={`${styles.selectButton} ${isCurrentPlan ? styles.currentButton : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpgrade(plan.id);
                  }}
                  disabled={isCurrentPlan || isUpgrading}
                >
                  {isUpgrading && selectedPlan === plan.id ? (
                    <span className={styles.spinner}></span>
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : (
                    `Select ${plan.name}`
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            All plans include secure data storage and HIPAA compliance
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsModal;