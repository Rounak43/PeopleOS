/**
 * PeopleOS — Header Component
 * Styled exactly to match the AegisFlow Employee Portal design.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getNotifications, markNotificationsAsRead } from '../../services/notificationService';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const popoverRef = useRef(null);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await getNotifications();
      const payload = res?.data || res || {};
      setNotifications(payload.notifications || []);
      setUnreadCount(payload.unreadCount || 0);
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  const handleToggleNotif = async () => {
    const nextState = !isNotifOpen;
    setIsNotifOpen(nextState);
    if (nextState && unreadCount > 0) {
      try {
        await markNotificationsAsRead();
        setUnreadCount(0);
      } catch (err) {
        console.warn('Could not mark notifications read:', err);
      }
    }
  };

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const displayName = (user?.name || user?.email?.split('@')[0] || 'samarth suryavamshi').toLowerCase();
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'SS';

  const roleLabel = (user?.role || 'employee').toUpperCase();

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const isHRRoute = location.pathname.startsWith('/hr');
  const portalTitle = isHRRoute ? 'HR Portal' : 'Employee Portal';

  return (
    <header className="aegis-header">
      <div className="aegis-header-left">
        {/* Hamburger button */}
        <button type="button" className="aegis-menu-btn" aria-label="Menu">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <h1 className="aegis-header-title">{portalTitle}</h1>

        {/* Date Chip */}
        <div className="aegis-date-chip">
          <span className="aegis-date-dot" />
          <span>{dateStr}</span>
        </div>
      </div>

      <div className="aegis-header-right" ref={popoverRef} style={{ position: 'relative' }}>
        {/* Notification Bell */}
        <button
          type="button"
          className="aegis-bell-btn"
          title="Notifications"
          onClick={handleToggleNotif}
          style={{ position: 'relative' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span className="aegis-bell-badge">{unreadCount}</span>
          )}
        </button>

        {/* Notifications Popover Dropdown */}
        {isNotifOpen && (
          <div
            className="notif-popover"
            style={{
              position: 'absolute',
              top: '48px',
              right: '0',
              width: '320px',
              maxHeight: '400px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              overflowY: 'auto',
              padding: '12px 0',
            }}
          >
            <div style={{ padding: '8px 16px 12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>Notifications</span>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Recent</span>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
                No notifications right now.
              </div>
            ) : (
              notifications.map((n) => {
                const isApproved = n.type === 'time_off_approved';
                const isRejected = n.type === 'time_off_rejected';
                const isRequest = n.type === 'time_off_request';

                const badgeBg = isApproved ? '#dcfce7' : isRejected ? '#fee2e2' : '#e0f2fe';
                const badgeColor = isApproved ? '#15803d' : isRejected ? '#b91c1c' : '#0369a1';

                return (
                  <div
                    key={n._id}
                    style={{
                      padding: '12px 16px',
                      borderBottom: '1px solid #f8fafc',
                      backgroundColor: n.isRead ? '#ffffff' : '#f8fafc',
                      display: 'flex',
                      gap: '10px',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: badgeBg,
                        color: badgeColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isApproved ? '✅' : isRejected ? '❌' : '📋'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* User Pill Dropdown */}
        <button
          type="button"
          className="aegis-user-pill"
          onClick={handleLogout}
          title="Click to sign out"
        >
          <div className="aegis-avatar-circle">{initials}</div>
          <div className="aegis-user-info">
            <span className="aegis-user-name">{displayName}</span>
            <span className="aegis-user-role">{roleLabel}</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aegis-chevron">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>
    </header>
  );
};

export default Header;
