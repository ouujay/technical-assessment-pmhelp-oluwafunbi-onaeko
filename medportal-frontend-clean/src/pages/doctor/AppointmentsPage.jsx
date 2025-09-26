// src/pages/doctor/AppointmentsPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, CheckCircle, XCircle, Eye, Filter,
  ArrowLeft, User, Video, MapPin, Search, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../services/api';
import styles from './AppointmentsPage.module.css';

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [filteredAppointments, setFilteredAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  useEffect(() => {
    filterAppointments();
  }, [appointments, filter, searchTerm]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getDoctorAppointments();
      setAppointments(response.data || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by status
    if (filter === 'upcoming') {
      filtered = filtered.filter(apt => 
        new Date(apt.start) > new Date() && apt.status === 'scheduled'
      );
    } else if (filter === 'today') {
      const today = new Date().toISOString().split('T')[0];
      filtered = filtered.filter(apt => apt.start?.startsWith(today));
    } else if (filter === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'completed');
    } else if (filter === 'canceled') {
      filtered = filtered.filter(apt => apt.status === 'canceled');
    }

    // Filter by search
    if (searchTerm) {
      filtered = filtered.filter(apt =>
        `Patient #${apt.patient}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.start) - new Date(a.start));

    setFilteredAppointments(filtered);
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await appointmentService.updateAppointmentStatus(appointmentId, newStatus);
      
      // Update local state
      setAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
      
      alert(`Appointment ${newStatus} successfully!`);
    } catch (error) {
      console.error('Error updating appointment:', error);
      alert('Failed to update appointment status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not scheduled';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getFilterCount = (filterType) => {
    const today = new Date().toISOString().split('T')[0];
    switch (filterType) {
      case 'all':
        return appointments.length;
      case 'today':
        return appointments.filter(apt => apt.start?.startsWith(today)).length;
      case 'upcoming':
        return appointments.filter(apt => 
          new Date(apt.start) > new Date() && apt.status === 'scheduled'
        ).length;
      case 'completed':
        return appointments.filter(apt => apt.status === 'completed').length;
      case 'canceled':
        return appointments.filter(apt => apt.status === 'canceled').length;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => navigate('/doctor-dashboard')} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Appointments</h1>
          <p className={styles.subtitle}>Manage your appointments and patient schedules</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className={styles.controls}>
        <div className={styles.searchBox}>
          <Search size={20} />
          <input
            type="text"
            placeholder="Search by patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filterButtons}>
          {[
            { id: 'all', label: 'All' },
            { id: 'today', label: 'Today' },
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'completed', label: 'Completed' },
            { id: 'canceled', label: 'Canceled' }
          ].map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`${styles.filterButton} ${filter === filterOption.id ? styles.active : ''}`}
            >
              {filterOption.label}
              <span className={styles.count}>{getFilterCount(filterOption.id)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#dbeafe' }}>
            <Calendar size={24} color="#3b82f6" />
          </div>
          <div>
            <p className={styles.statLabel}>Total</p>
            <p className={styles.statValue}>{appointments.length}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} color="#10b981" />
          </div>
          <div>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>
              {appointments.filter(apt => apt.status === 'completed').length}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fef3c7' }}>
            <Clock size={24} color="#f59e0b" />
          </div>
          <div>
            <p className={styles.statLabel}>Upcoming</p>
            <p className={styles.statValue}>
              {appointments.filter(apt => 
                new Date(apt.start) > new Date() && apt.status === 'scheduled'
              ).length}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fee2e2' }}>
            <XCircle size={24} color="#ef4444" />
          </div>
          <div>
            <p className={styles.statLabel}>Canceled</p>
            <p className={styles.statValue}>
              {appointments.filter(apt => apt.status === 'canceled').length}
            </p>
          </div>
        </div>
      </div>

      {/* Appointments List */}
      <div className={styles.appointmentsList}>
        {filteredAppointments.length > 0 ? (
          filteredAppointments.map(appointment => (
            <div key={appointment.id} className={styles.appointmentCard}>
              <div className={styles.cardHeader}>
                <div className={styles.patientInfo}>
                  <div className={styles.avatar}>
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className={styles.patientName}>Patient #{appointment.patient}</h3>
                    <div className={styles.appointmentMeta}>
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        {formatDate(appointment.start)}
                      </span>
                      <span className={styles.metaItem}>
                        <Clock size={14} />
                        {formatTime(appointment.start)}
                      </span>
                      <span className={styles.metaItem}>
                        {appointment.visit_type === 'telehealth' ? (
                          <>
                            <Video size={14} />
                            Telehealth
                          </>
                        ) : (
                          <>
                            <MapPin size={14} />
                            In-Person
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(appointment.status) }}
                >
                  {appointment.status}
                </span>
              </div>

              <div className={styles.cardActions}>
                {appointment.status === 'scheduled' && new Date(appointment.start) > new Date() && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'completed')}
                      className={styles.actionBtn}
                      style={{ backgroundColor: '#10b981' }}
                    >
                      <CheckCircle size={16} />
                      Complete
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(appointment.id, 'canceled')}
                      className={styles.actionBtn}
                      style={{ backgroundColor: '#ef4444' }}
                    >
                      <XCircle size={16} />
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => navigate(`/doctor-dashboard?patient=${appointment.patient}&tab=patients`)}
                  className={styles.actionBtn}
                  style={{ backgroundColor: '#6b7280' }}
                >
                  <Eye size={16} />
                  View Records
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <Calendar size={64} />
            <h3>No appointments found</h3>
            <p>
              {searchTerm
                ? 'Try adjusting your search or filters'
                : 'No appointments match the selected filter'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;