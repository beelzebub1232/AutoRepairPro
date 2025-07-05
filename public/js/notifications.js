// Real-time Notifications System
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

        // Create notification bell icon
        const bellIcon = document.createElement('div');
        bellIcon.id = 'notification-bell';
        bellIcon.className = 'notification-bell';
        bellIcon.innerHTML = `
            <div class="bell-icon">🔔</div>
            <div class="notification-count" id="notification-count">0</div>
        `;
        
        // Add to header if it exists
        const header = document.querySelector('header');
        if (header) {
            const userInfo = document.getElementById('user-info');
            if (userInfo) {
                userInfo.parentNode.insertBefore(bellIcon, userInfo);
            }
        }

        // Add click handler for bell
        bellIcon.addEventListener('click', () => this.toggleNotificationPanel());
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
        
        panel.innerHTML = `
            <div class="notification-header">
                <h4>Notifications</h4>
                <button id="mark-all-read" class="btn btn-sm btn-secondary">Mark All Read</button>
            </div>
            <div class="notification-list" id="notification-list">
                ${this.renderNotificationList()}
            </div>
            <div class="notification-footer">
                <button id="clear-all-notifications" class="btn btn-sm btn-danger">Clear All</button>
            </div>
        `;

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
            return '<div class="no-notifications">No notifications</div>';
        }

        return this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.timestamp)}</div>
                </div>
                <button class="notification-close" onclick="notificationManager.removeNotification('${notification.id}')">×</button>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'job_update': '🔧',
            'payment': '💳',
            'booking': '📅',
            'inventory': '📦',
            'system': '⚙️',
            'success': '✅',
            'warning': '⚠️',
            'error': '❌'
        };
        return icons[type] || '📢';
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
        toast.className = 'notification-toast';
        toast.innerHTML = `
            <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
            <div class="toast-content">
                <div class="toast-title">${notification.title}</div>
                <div class="toast-message">${notification.message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
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
            countElement.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Update bell animation
        const bellIcon = document.querySelector('.bell-icon');
        if (bellIcon && unreadCount > 0) {
            bellIcon.classList.add('has-notifications');
        } else if (bellIcon) {
            bellIcon.classList.remove('has-notifications');
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
        localStorage.setItem('autorepairpro_notifications', JSON.stringify(this.notifications));
    }

    loadStoredNotifications() {
        const stored = localStorage.getItem('autorepairpro_notifications');
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