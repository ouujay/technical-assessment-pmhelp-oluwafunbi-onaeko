// src/components/modals/BookAppointmentModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, MapPin, Video, Crown, AlertCircle } from 'lucide-react';
import { appointmentService, subscriptionService } from '../../services/api';
import styles from './BookAppointmentModal.module.css';

const BookAppointmentModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select Doctor, 2: Select Date/Time, 3: Confirm
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [visitType, setVisitType] = useState('in_person');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch doctors and subscription when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchInitialData();
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [doctorsRes, subscriptionRes] = await Promise.all([
        fetchDoctors(),
        subscriptionService.getCurrent()
      ]);
      setSubscription(subscriptionRes.data);
    } catch (err) {
      console.error('Error fetching initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get next 7 days for date selection
  const getNext7Days = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        display: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        }),
        isToday: i === 0
      });
    }
    return days;
  };

  const availableDays = getNext7Days();

  const fetchDoctors = async () => {
    try {
      setError('');
      const response = await appointmentService.getDoctors();
      setDoctors(response.data);
      return response;
    } catch (err) {
      setError('Failed to load doctors');
      setDoctors([]);
      return { data: [] };
    }
  };

  // Fetch available slots when doctor and date are selected
  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDoctor, selectedDate]);

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await appointmentService.getDoctorSlots(selectedDoctor.id, selectedDate);
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  // Check if user can book appointments
  const canBookAppointment = () => {
    if (!subscription) return { allowed: false, reason: 'Loading subscription...' };
    
    const remaining = subscription.remaining_this_month;
    if (remaining === null) return { allowed: true }; // Unlimited
    if (remaining > 0) return { allowed: true };
    
    return { 
      allowed: false, 
      reason: `You've reached your monthly limit of ${subscription.appointment_limit} appointments. Upgrade to book more.` 
    };
  };

  // Check if telehealth is available for user's subscription
  const isTelehealthAvailable = () => {
    if (!subscription) return false;
    return subscription.tier === 'basic' || subscription.tier === 'premium';
  };

  const handleDoctorSelect = (doctor) => {
    const bookingCheck = canBookAppointment();
    if (!bookingCheck.allowed) {
      setError(bookingCheck.reason);
      return;
    }
    
    setSelectedDoctor(doctor);
    setStep(2);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleVisitTypeChange = (type) => {
    if (type === 'telehealth' && !isTelehealthAvailable()) {
      setError('Telehealth appointments are available with Basic and Premium plans. Upgrade to access this feature.');
      return;
    }
    setVisitType(type);
    setError('');
  };

  const handleBookAppointment = async () => {
    if (!selectedDoctor || !selectedSlot) return;

    const bookingCheck = canBookAppointment();
    if (!bookingCheck.allowed) {
      setError(bookingCheck.reason);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const appointmentData = {
        doctor: selectedDoctor.id,
        start: selectedSlot.start,
        end: selectedSlot.end,
        visit_type: visitType
      };

      await appointmentService.bookAppointment(appointmentData);
      onSuccess();
      onClose();
      resetModal();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Failed to book appointment';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setSelectedDoctor(null);
    setSelectedSlot(null);
    setVisitType('in_person');
    setSelectedDate('');
    setAvailableSlots([]);
    setError('');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  const bookingCheck = canBookAppointment();

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {step === 1 && 'Select a Doctor'}
            {step === 2 && 'Choose Date & Time'}
            {step === 3 && 'Confirm Appointment'}
          </h2>
          <button onClick={handleClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {/* Subscription Status */}
        {subscription && (
          <div className={styles.subscriptionStatus}>
            <div className={styles.subscriptionInfo}>
              <Crown size={16} />
              <span>{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan</span>
              {subscription.appointment_limit ? (
                <span className={styles.usageInfo}>
                  {subscription.remaining_this_month}/{subscription.appointment_limit} remaining this month
                </span>
              ) : (
                <span className={styles.unlimitedBadge}>Unlimited</span>
              )}
            </div>
            {!bookingCheck.allowed && (
              <div className={styles.limitWarning}>
                <AlertCircle size={16} />
                <span>Monthly limit reached</span>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {/* Step 1: Select Doctor */}
        {step === 1 && (
          <div className={styles.modalBody}>
            {!bookingCheck.allowed && (
              <div className={styles.upgradePrompt}>
                <Crown size={24} />
                <h3>Upgrade Required</h3>
                <p>{bookingCheck.reason}</p>
                <button className={styles.upgradeButton} onClick={handleClose}>
                  View Subscription Plans
                </button>
              </div>
            )}
            
            {bookingCheck.allowed && (
              <>
                {loading ? (
                  <div className={styles.loadingSlots}>Loading doctors...</div>
                ) : (
                  <div className={styles.doctorsList}>
                    {doctors.length > 0 ? doctors.map(doctor => (
                      <div
                        key={doctor.id}
                        className={styles.doctorCard}
                        onClick={() => handleDoctorSelect(doctor)}
                      >
                        <div className={styles.doctorAvatar}>
                          {doctor.avatar || doctor.name.split(' ').map(n => n[0]).join('') || 'Dr'}
                        </div>
                        <div className={styles.doctorInfo}>
                          <h3 className={styles.doctorName}>{doctor.name}</h3>
                          <p className={styles.doctorSpecialty}>{doctor.specialty}</p>
                          <div className={styles.doctorMeta}>
                            <span className={styles.rating}>⭐ {doctor.rating}</span>
                            <span className={styles.experience}>{doctor.experience}</span>
                          </div>
                          <p className={styles.availability}>{doctor.availability}</p>
                        </div>
                        <div className={styles.selectArrow}>›</div>
                      </div>
                    )) : (
                      <div className={styles.noDoctors}>
                        <p>No doctors available at the moment.</p>
                        <p>Please try again later or contact support.</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className={styles.modalBody}>
            {/* Selected Doctor Info */}
            <div className={styles.selectedDoctorInfo}>
              <div className={styles.doctorAvatar}>
                {selectedDoctor.avatar}
              </div>
              <div>
                <h3 className={styles.doctorName}>{selectedDoctor.name}</h3>
                <p className={styles.doctorSpecialty}>{selectedDoctor.specialty}</p>
              </div>
            </div>

            {/* Date Selection */}
            <div className={styles.dateSelection}>
              <h4 className={styles.sectionTitle}>Select Date</h4>
              <div className={styles.datesGrid}>
                {availableDays.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedDate(day.date)}
                    className={`${styles.dateButton} ${
                      selectedDate === day.date ? styles.selected : ''
                    }`}
                  >
                    <span className={styles.dayName}>
                      {day.isToday ? 'Today' : day.display.split(' ')[0]}
                    </span>
                    <span className={styles.dayDate}>
                      {day.display.split(' ').slice(1).join(' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className={styles.timeSelection}>
                <h4 className={styles.sectionTitle}>Available Times</h4>
                {loading ? (
                  <div className={styles.loadingSlots}>Loading available times...</div>
                ) : availableSlots.length > 0 ? (
                  <div className={styles.timeSlotsGrid}>
                    {availableSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => handleSlotSelect(slot)}
                        className={`${styles.timeSlot} ${
                          selectedSlot?.start === slot.start ? styles.selected : ''
                        }`}
                      >
                        {new Date(slot.start).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noSlots}>
                    No available times for this date. Please select another date.
                  </div>
                )}
              </div>
            )}

            {/* Visit Type Selection */}
            {selectedSlot && (
              <div className={styles.visitTypeSelection}>
                <h4 className={styles.sectionTitle}>Visit Type</h4>
                <div className={styles.visitTypeOptions}>
                  <button
                    onClick={() => handleVisitTypeChange('in_person')}
                    className={`${styles.visitTypeButton} ${
                      visitType === 'in_person' ? styles.selected : ''
                    }`}
                  >
                    <MapPin size={20} />
                    <span>In-Person</span>
                    <small>Available for all plans</small>
                  </button>
                  <button
                    onClick={() => handleVisitTypeChange('telehealth')}
                    className={`${styles.visitTypeButton} ${
                      visitType === 'telehealth' ? styles.selected : ''
                    } ${!isTelehealthAvailable() ? styles.disabled : ''}`}
                    disabled={!isTelehealthAvailable()}
                  >
                    <Video size={20} />
                    <span>Telehealth</span>
                    {isTelehealthAvailable() ? (
                      <small>Video consultation</small>
                    ) : (
                      <div className={styles.featureRestriction}>
                        <Crown size={14} />
                        <small>Basic/Premium only</small>
                      </div>
                    )}
                  </button>
                </div>
                {!isTelehealthAvailable() && (
                  <div className={styles.upgradeNote}>
                    <AlertCircle size={16} />
                    <span>Upgrade to Basic or Premium to access telehealth appointments</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation */}
            <div className={styles.modalFooter}>
              <button
                onClick={() => setStep(1)}
                className={styles.backButton}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedSlot}
                className={styles.nextButton}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className={styles.modalBody}>
            <div className={styles.confirmationDetails}>
              <h4 className={styles.sectionTitle}>Appointment Details</h4>
              
              <div className={styles.confirmationCard}>
                <div className={styles.confirmationRow}>
                  <User size={20} />
                  <div>
                    <strong>{selectedDoctor.name}</strong>
                    <p>{selectedDoctor.specialty}</p>
                  </div>
                </div>

                <div className={styles.confirmationRow}>
                  <Calendar size={20} />
                  <div>
                    <strong>
                      {new Date(selectedSlot.start).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </strong>
                  </div>
                </div>

                <div className={styles.confirmationRow}>
                  <Clock size={20} />
                  <div>
                    <strong>
                      {new Date(selectedSlot.start).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} - {new Date(selectedSlot.end).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </strong>
                  </div>
                </div>

                <div className={styles.confirmationRow}>
                  {visitType === 'in_person' ? <MapPin size={20} /> : <Video size={20} />}
                  <div>
                    <strong>{visitType === 'in_person' ? 'In-Person Visit' : 'Telehealth Visit'}</strong>
                    <p>{visitType === 'in_person' ? 'MedPortal Clinic' : 'Video consultation'}</p>
                  </div>
                </div>

                {/* Billing Information */}
                <div className={styles.billingInfo}>
                  <div className={styles.costBreakdown}>
                    <span>Appointment Cost:</span>
                    <span>Included in {subscription?.tier} plan</span>
                  </div>
                  <div className={styles.remainingInfo}>
                    <span>Remaining this month:</span>
                    <span>
                      {subscription?.remaining_this_month === null 
                        ? 'Unlimited' 
                        : `${subscription?.remaining_this_month - 1} appointments`}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setStep(2)}
                className={styles.backButton}
              >
                Back
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={loading}
                className={styles.confirmButton}
              >
                {loading ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookAppointmentModal;