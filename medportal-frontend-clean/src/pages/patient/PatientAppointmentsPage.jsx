// src/pages/patient/PatientAppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Video, 
  MapPin, 
  ArrowLeft,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { appointmentService } from '../../services/api';
import styles from './PatientAppointmentsPage.module.css';

const PatientAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getMyAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
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

  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircle size={20} />;
      case 'canceled':
        return <XCircle size={20} />;
      default:
        return <AlertCircle size={20} />;
    }
  };

  const filteredAppointments = appointments
    .filter(apt => {
      if (filterStatus === 'all') return true;
      return apt.status === filterStatus;
    })
    .filter(apt => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        apt.doctor_name?.toLowerCase().includes(searchLower) ||
        apt.specialty?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.start) - new Date(a.start));

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.appointmentsPage}>
      <div className={styles.header}>
        <button onClick={() => navigate('/patient-dashboard')} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className={styles.pageTitle}>My Appointments</h1>
        <p className={styles.pageSubtitle}>View and manage all your appointments</p>
      </div>

      <div className={styles.filterSection}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by doctor or specialty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterButtons}>
          <button
            onClick={() => setFilterStatus('all')}
            className={`${styles.filterButton} ${filterStatus === 'all' ? styles.active : ''}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('scheduled')}
            className={`${styles.filterButton} ${filterStatus === 'scheduled' ? styles.active : ''}`}
          >
            Scheduled
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`${styles.filterButton} ${filterStatus === 'completed' ? styles.active : ''}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('canceled')}
            className={`${styles.filterButton} ${filterStatus === 'canceled' ? styles.active : ''}`}
          >
            Canceled
          </button>
        </div>
      </div>

      <div className={styles.appointmentsList}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map((appointment) => (
            <div key={appointment.id} className={`${styles.appointmentCard} ${styles[appointment.status]}`}>
              <div className={styles.statusIndicator}>
                {getStatusIcon(appointment.status)}
                <span className={styles.statusText}>{appointment.status}</span>
              </div>

              <div className={styles.appointmentContent}>
                <div className={styles.doctorInfo}>
                  <div className={styles.doctorAvatar}>
                    <span>{appointment.doctor_name?.[0] || 'D'}</span>
                  </div>
                  <div className={styles.doctorDetails}>
                    <h3 className={styles.doctorName}>
                      {appointment.doctor_name || `Doctor #${appointment.doctor}`}
                    </h3>
                    <p className={styles.specialty}>{appointment.specialty || 'General Practice'}</p>
                  </div>
                </div>

                <div className={styles.appointmentInfo}>
                  <div className={styles.infoItem}>
                    <Calendar size={18} />
                    <span>{formatDate(appointment.start)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <Clock size={18} />
                    <span>{formatTime(appointment.start)}</span>
                  </div>
                  <div className={styles.infoItem}>
                    {appointment.visit_type === 'telehealth' ? (
                      <>
                        <Video size={18} />
                        <span>Telehealth</span>
                      </>
                    ) : (
                      <>
                        <MapPin size={18} />
                        <span>In-person</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {appointment.notes && (
                <div className={styles.appointmentNotes}>
                  <strong>Notes:</strong> {appointment.notes}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Calendar size={64} className={styles.emptyIcon} />
            <h3>No appointments found</h3>
            <p>
              {filterStatus === 'all' 
                ? "You don't have any appointments yet" 
                : `No ${filterStatus} appointments`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAppointmentsPage;