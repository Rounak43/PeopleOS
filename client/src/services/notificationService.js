/**
 * PeopleOS — Notification Service
 */

import http from './common/http';

export const getNotifications = () => http.get('/api/notifications');
export const markNotificationsAsRead = () => http.put('/api/notifications/read-all', {});

const notificationService = {
  getNotifications,
  markNotificationsAsRead,
};

export default notificationService;
