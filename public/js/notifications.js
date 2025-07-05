// Modern Notification System
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.loadStoredNotifications();
        this.startPolling();
    }

    createNotificationContainer() {
        // Create notification container
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
        this.container = container;

        // Create notification bell icon in header
        this.createNotificationBell();
    }

    createNotificationBell() {
        // Look for the user info section in the header
        const userInfo = document.querySelector('.user-info, .header-user');
        if (userInfo && userInfo.parentElement) {
            const bellContainer = document.createElement('div');
            bellContainer.className = 'notification-bell-container';
            bellContainer.innerHTML = `
                <button id="notification-bell" class="notification-bell">
                    <svg class="icon bell-icon" viewBox="0 0 24 24">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    <div class="notification-count" id="notification-count">0</div>
                </button>
            `;
            
            // Insert before user info
            userInfo.parentElement.insertBefore(bellContainer, userInfo);

            // Add click handler for bell
            document.getElementById('notification-bell').addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleNotificationPanel();
            });
        }
    }

    toggleNotificationPanel() {
        const existingPanel = document.getElementById('notification-panel');
        
        if (existingPanel) {
            existingPanel.remove();
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'notification-panel';
        panel.className = 'notification-panel';
        
        // Position panel relative to the bell
        const bell = document.getElementById('notification-bell');
        const bellRect = bell.getBoundingClientRect();
        
        panel.innerHTML = `
            <div class="notification-header">
                <h4>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    Notifications
                </h4>
                <button id="mark-all-read" class="btn btn-sm btn-secondary">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                    Mark All Read
                </button>
            </div>
            <div class="notification-list" id="notification-list">
                ${this.renderNotificationList()}
            </div>
            <div class="notification-footer">
                <button id="clear-all-notifications" class="btn btn-sm btn-danger">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Clear All
                </button>
            </div>
        `;

        // Position the panel correctly
        panel.style.position = 'fixed';
        panel.style.top = (bellRect.bottom + 10) + 'px';
        panel.style.left = Math.max(20, bellRect.left - 300) + 'px'; // Ensure it doesn't go off-screen

        document.body.appendChild(panel);

        // Add event listeners
        document.getElementById('mark-all-read').addEventListener('click', () => this.markAllAsRead());
        document.getElementById('clear-all-notifications').addEventListener('click', () => this.clearAllNotifications());

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && !document.getElementById('notification-bell').contains(e.target)) {
                panel.remove();
            }
        });
    }

    renderNotificationList() {
        if (this.notifications.length === 0) {
            return `
                <div class="no-notifications">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg class="icon icon-xl" viewBox="0 0 24 24">
                                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">No notifications</div>
                        <div class="empty-state-description">You're all caught up!</div>
                    </div>
                </div>
            `;
        }

        return this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <button class="notification-close" onclick="notificationManager.removeNotification('${notification.id}')">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'job_update': '<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
            'payment': '<svg class="icon" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
            'booking': '<svg class="icon" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
            'inventory': '<svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
            'system': '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
            'success': '<svg class="icon" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
            'warning': '<svg class="icon" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            'error': '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
        };
        return icons[type] || '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
    }

    formatTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        
        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return time.toLocaleDateString();
    }

    addNotification(notification) {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };

        this.notifications.unshift(newNotification);
        this.updateNotificationCount();
        this.saveNotifications();
        this.showToast(newNotification);

        // Keep only last 50 notifications
        if (this.notifications.length > 50) {
            this.notifications = this.notifications.slice(0, 50);
        }
    }

    showToast(notification) {
        const toast = document.createElement('div');
        toast.className = `notification-toast ${notification.type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <svg class="icon" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        this.container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);

        // Add click to remove
        toast.addEventListener('click', () => toast.remove());
    }

    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        const countElement = document.getElementById('notification-count');
        
        if (countElement) {
            countElement.textContent = unreadCount;
            countElement.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationCount();
        this.saveNotifications();
        
        // Update panel if open
        const panel = document.getElementById('notification-panel');
        if (panel) {
            const list = document.getElementById('notification-list');
            list.innerHTML = this.renderNotificationList();
        }
    }

    clearAllNotifications() {
        this.notifications = [];
        this.updateNotificationCount();
        this.saveNotifications();
        
        // Update panel if open
        const panel = document.getElementById('notification-panel');
        if (panel) {
            panel.remove();
        }
    }

    removeNotification(id) {
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.updateNotificationCount();
        this.saveNotifications();
        
        // Update panel if open
        const panel = document.getElementById('notification-panel');
        if (panel) {
            const list = document.getElementById('notification-list');
            list.innerHTML = this.renderNotificationList();
        }
    }

    saveNotifications() {
        localStorage.setItem('repairhub_notifications', JSON.stringify(this.notifications));
    }

    loadStoredNotifications() {
        const stored = localStorage.getItem('repairhub_notifications');
        if (stored) {
            this.notifications = JSON.parse(stored);
            this.updateNotificationCount();
        }
    }

    // Simulate real-time notifications by polling
    startPolling() {
        const userRole = sessionStorage.getItem('userRole');
        const userId = sessionStorage.getItem('userId');
        
        if (!userRole || !userId) return;

        // Poll every 30 seconds for new notifications
        setInterval(() => {
            this.checkForNewNotifications(userRole, userId);
        }, 30000);
    }

    async checkForNewNotifications(userRole, userId) {
        try {
            // This would typically call a backend endpoint
            // For now, we'll simulate with random notifications
            if (Math.random() < 0.1) { // 10% chance every 30 seconds
                this.simulateNotification(userRole, userId);
            }
        } catch (error) {
            console.error('Error checking for notifications:', error);
        }
    }

    simulateNotification(userRole, userId) {
        const notifications = {
            customer: [
                {
                    type: 'job_update',
                    title: 'Job Status Updated',
                    message: 'Your vehicle repair is now in progress.'
                },
                {
                    type: 'booking',
                    title: 'Appointment Reminder',
                    message: 'Your appointment is scheduled for tomorrow at 10:00 AM.'
                },
                {
                    type: 'payment',
                    title: 'Invoice Ready',
                    message: 'Your repair invoice is ready for payment.'
                }
            ],
            employee: [
                {
                    type: 'job_update',
                    title: 'New Job Assigned',
                    message: 'You have been assigned a new repair job.'
                },
                {
                    type: 'inventory',
                    title: 'Low Stock Alert',
                    message: 'Oil filters are running low in inventory.'
                }
            ],
            admin: [
                {
                    type: 'system',
                    title: 'Daily Report',
                    message: 'Your daily operations report is ready.'
                },
                {
                    type: 'booking',
                    title: 'New Booking',
                    message: 'A new appointment has been booked.'
                },
                {
                    type: 'inventory',
                    title: 'Inventory Alert',
                    message: 'Multiple items are below minimum stock levels.'
                }
            ]
        };

        const roleNotifications = notifications[userRole] || [];
        if (roleNotifications.length > 0) {
            const randomNotification = roleNotifications[Math.floor(Math.random() * roleNotifications.length)];
            this.addNotification(randomNotification);
        }
    }

    // Public methods for other parts of the application
    notifyJobUpdate(jobId, status) {
        this.addNotification({
            type: 'job_update',
            title: 'Job Status Updated',
            message: `Job #${jobId} status changed to ${status}`
        });
    }

    notifyPayment(amount) {
        this.addNotification({
            type: 'payment',
            title: 'Payment Processed',
            message: `Payment of $${amount} has been processed successfully`
        });
    }

    notifyBooking(service) {
        this.addNotification({
            type: 'booking',
            title: 'Booking Confirmed',
            message: `Your ${service} appointment has been confirmed`
        });
    }

    notifyInventoryLow(item) {
        this.addNotification({
            type: 'inventory',
            title: 'Low Stock Alert',
            message: `${item} is running low in inventory`
        });
    }
}

// Initialize notification manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});