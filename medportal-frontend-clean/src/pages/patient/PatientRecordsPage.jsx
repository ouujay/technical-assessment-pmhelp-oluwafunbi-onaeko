// src/pages/patient/PatientRecordsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  ArrowLeft,
  Search,
  Calendar,
  User,
  ChevronDown,
  Download,
  Eye
} from 'lucide-react';
import { recordsService } from '../../services/api';
import styles from './PatientRecordsPage.module.css';

const PatientRecordsPage = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const response = await recordsService.getMyRecords();
      setRecords(response.data || []);
    } catch (error) {
      console.error('Error fetching records:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'No date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    });
  };

  const getRecordIcon = (type) => {
    const title = type?.toLowerCase() || '';
    if (title.includes('checkup')) return '🩺';
    if (title.includes('lab')) return '🧪';
    if (title.includes('prescription')) return '💊';
    if (title.includes('consultation')) return '💬';
    if (title.includes('x-ray') || title.includes('scan')) return '🔬';
    return '📄';
  };

  const filteredRecords = records
    .filter(record => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        record.title?.toLowerCase().includes(searchLower) ||
        record.doctor_name?.toLowerCase().includes(searchLower) ||
        record.notes?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.recordsPage}>
      <div className={styles.header}>
        <button onClick={() => navigate('/patient-dashboard')} className={styles.backButton}>
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
        <h1 className={styles.pageTitle}>Medical Records</h1>
        <p className={styles.pageSubtitle}>View your complete medical history</p>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.searchBox}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search records by title, doctor, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.recordsCount}>
          <FileText size={18} />
          <span>{filteredRecords.length} records</span>
        </div>
      </div>

      <div className={styles.recordsContainer}>
        {filteredRecords.length > 0 ? (
          <div className={styles.recordsList}>
            {filteredRecords.map((record) => (
              <div 
                key={record.id} 
                className={styles.recordCard}
                onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
              >
                <div className={styles.recordHeader}>
                  <div className={styles.recordIcon}>{getRecordIcon(record.title)}</div>
                  <div className={styles.recordInfo}>
                    <h3 className={styles.recordTitle}>{record.title}</h3>
                    <div className={styles.recordMeta}>
                      <span className={styles.metaItem}>
                        <User size={14} />
                        {record.doctor_name || 'Doctor'}
                      </span>
                      <span className={styles.metaItem}>
                        <Calendar size={14} />
                        {formatDate(record.created_at)}
                      </span>
                    </div>
                  </div>
                  <button className={styles.expandButton}>
                    <ChevronDown 
                      size={20} 
                      className={`${styles.chevron} ${selectedRecord?.id === record.id ? styles.rotated : ''}`}
                    />
                  </button>
                </div>

                {selectedRecord?.id === record.id && (
                  <div className={styles.recordDetails}>
                    <div className={styles.detailsContent}>
                      <h4 className={styles.detailsLabel}>Notes</h4>
                      <p className={styles.detailsText}>{record.notes || 'No notes available'}</p>
                    </div>
                    
                    {record.diagnosis && (
                      <div className={styles.detailsContent}>
                        <h4 className={styles.detailsLabel}>Diagnosis</h4>
                        <p className={styles.detailsText}>{record.diagnosis}</p>
                      </div>
                    )}

                    {record.prescription && (
                      <div className={styles.detailsContent}>
                        <h4 className={styles.detailsLabel}>Prescription</h4>
                        <p className={styles.detailsText}>{record.prescription}</p>
                      </div>
                    )}

                    <div className={styles.recordActions}>
                      <button className={styles.actionButton}>
                        <Download size={16} />
                        Download
                      </button>
                      <button className={styles.actionButton}>
                        <Eye size={16} />
                        View Full Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FileText size={64} className={styles.emptyIcon} />
            <h3>No medical records found</h3>
            <p>
              {searchTerm 
                ? "No records match your search" 
                : "You don't have any medical records yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecordsPage;