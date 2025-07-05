// Modern Notification System with Fixed Positioning
class NotificationManager {
    constructor() {
        this.notifications = [];
        this.container = null;
        this.floatingIcon = null;
        this.init();
    }

    init() {
        this.createNotificationContainer();
        this.createFloatingNotificationIcon();
        this.loadStoredNotifications();
        this.startPolling();
    }

    createNotificationContainer() {
        // Create notification container for toasts
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            pointer-events: none;
            max-width: 400px;
        `;
        document.body.appendChild(container);
        this.container = container;
    }

    createFloatingNotificationIcon() {
        // Create floating notification icon above chatbot
        const floatingIcon = document.createElement('div');
        floatingIcon.className = 'notification-floating-icon';
        floatingIcon.innerHTML = `
            <svg class="icon" viewBox="0 0 24 24">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <div class="notification-count" id="floating-notification-count">0</div>
        `;
        
        document.body.appendChild(floatingIcon);
        this.floatingIcon = floatingIcon;

        // Add click handler for floating icon
        floatingIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleNotificationPanel();
        });

        // Also create notification bell in header if user info exists
        this.createNotificationBell();
    }

    createNotificationBell() {
        // Look for the user info section in the header
        const userInfo = document.querySelector('.user-info, .header-user, .user-profile');
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
            this.hideNotificationPanel(existingPanel);
            return;
        }

        this.showNotificationPanel();
    }

    showNotificationPanel() {
        const panel = document.createElement('div');
        panel.id = 'notification-panel';
        panel.className = 'notification-panel';
        
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

        document.body.appendChild(panel);

        // Add event listeners
        document.getElementById('mark-all-read').addEventListener('click', () => this.markAllAsRead());
        document.getElementById('clear-all-notifications').addEventListener('click', () => this.clearAllNotifications());

        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && 
                !this.floatingIcon.contains(e.target) && 
                !document.getElementById('notification-bell')?.contains(e.target)) {
                this.hideNotificationPanel(panel);
            }
        });

        // Animate panel appearance
        setTimeout(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0) scale(1)';
        }, 10);
    }

    hideNotificationPanel(panel) {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-20px) scale(0.95)';
        
        setTimeout(() => {
            if (panel.parentNode) {
                panel.remove();
            }
        }, 200);
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
            'error': '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            'info': '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>'
        };
        return icons[type] || icons['info'];
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
        toast.style.cssText = `
            background: white;
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-lg);
            margin-bottom: var(--space-4);
            padding: var(--space-4);
            display: flex;
            align-items: flex-start;
            max-width: 380px;
            cursor: pointer;
            transition: all var(--transition-fast);
            pointer-events: all;
            animation: toastSlideIn 0.3s ease;
            border: 1px solid var(--secondary-200);
            gap: var(--space-3);
            border-left: 4px solid var(--${this.getToastColor(notification.type)});
        `;
        
        toast.innerHTML = `
            <div class="toast-icon" style="
                flex-shrink: 0;
                width: 36px;
                height: 36px;
                background: var(--${this.getToastColor(notification.type)}-100);
                border-radius: var(--radius-lg);
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--${this.getToastColor(notification.type)}-600);
            ">${this.getNotificationIcon(notification.type)}</div>
            <div class="toast-content" style="flex: 1; min-width: 0;">
                <div class="toast-title" style="
                    font-weight: 600;
                    color: var(--secondary-900);
                    margin-bottom: var(--space-1);
                    font-size: var(--text-sm);
                ">${notification.title}</div>
                <div class="toast-message" style="
                    color: var(--secondary-600);
                    font-size: var(--text-sm);
                    line-height: 1.4;
                ">${notification.message}</div>
            </div>
            <button class="toast-close" style="
                background: none;
                border: none;
                color: var(--secondary-400);
                cursor: pointer;
                padding: var(--space-1);
                border-radius: var(--radius-sm);
                transition: all var(--transition-fast);
                flex-shrink: 0;
            " onclick="this.parentElement.remove()">
                <svg class="icon" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        `;

        // Add hover effect
        toast.addEventListener('mouseenter', () => {
            toast.style.transform = 'translateY(-2px)';
            toast.style.boxShadow = 'var(--shadow-xl)';
        });

        toast.addEventListener('mouseleave', () => {
            toast.style.transform = 'translateY(0)';
            toast.style.boxShadow = 'var(--shadow-lg)';
        });

        this.container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 5000);

        // Add click to remove
        toast.addEventListener('click', () => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.remove();
                }
            }, 300);
        });
    }

    getToastColor(type) {
        const colors = {
            'success': 'success-500',
            'warning': 'warning-500',
            'error': 'error-500',
            'info': 'primary-500',
            'job_update': 'primary-500',
            'payment': 'success-500',
            'booking': 'primary-500',
            'inventory': 'warning-500',
            'system': 'secondary-500'
        };
        return colors[type] || 'primary-500';
    }

    updateNotificationCount() {
        const unreadCount = this.notifications.filter(n => !n.read).length;
        
        // Update floating icon count
        const floatingCount = document.getElementById('floating-notification-count');
        if (floatingCount) {
            floatingCount.textContent = unreadCount;
            floatingCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }
        
        // Update header bell count
        const headerCount = document.getElementById('notification-count');
        if (headerCount) {
            headerCount.textContent = unreadCount;
            headerCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        }

        // Add bounce animation when new notification arrives
        if (unreadCount > 0) {
            if (this.floatingIcon) {
                this.floatingIcon.style.animation = 'notificationBounce 0.5s ease';
                setTimeout(() => {
                    this.floatingIcon.style.animation = '';
                }, 500);
            }
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
            this.hideNotificationPanel(panel);
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

        // Add some initial demo notifications after 5 seconds
        setTimeout(() => {
            this.addDemoNotifications(userRole);
        }, 5000);
    }

    addDemoNotifications(userRole) {
        const demoNotifications = {
            customer: [
                {
                    type: 'booking',
                    title: 'Welcome to RepairHub Pro!',
                    message: 'Your account has been set up successfully. You can now book appointments and track your vehicle repairs.'
                }
            ],
            employee: [
                {
                    type: 'job_update',
                    title: 'Welcome to RepairHub Pro!',
                    message: 'You have access to job management and inventory tools. Check your assigned jobs to get started.'
                }
            ],
            admin: [
                {
                    type: 'system',
                    title: 'Welcome to RepairHub Pro!',
                    message: 'You have full administrative access. Monitor operations, manage users, and view comprehensive reports.'
                }
            ]
        };

        const roleNotifications = demoNotifications[userRole] || [];
        roleNotifications.forEach(notification => {
            this.addNotification(notification);
        });
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

// Add required CSS for toast animations
const style = document.createElement('style');
style.textContent = `
    @keyframes toastSlideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes notificationBounce {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .notification-panel {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
        transition: all 0.3s ease;
    }

    .notification-floating-icon {
        animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-5px); }
    }

    .notification-item {
        transition: all 0.3s ease;
    }

    .notification-item:hover {
        background: var(--primary-50);
        transform: translateX(4px);
    }

    .notification-item.unread {
        background: var(--primary-50);
        border-left: 4px solid var(--primary-500);
    }

    .notification-header {
        background: var(--secondary-50);
        padding: var(--space-4) var(--space-6);
        border-bottom: 1px solid var(--secondary-200);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .notification-header h4 {
        margin: 0;
        color: var(--secondary-900);
        font-size: var(--text-lg);
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    .notification-list {
        max-height: 350px;
        overflow-y: auto;
    }

    .notification-item {
        display: flex;
        align-items: flex-start;
        padding: var(--space-4) var(--space-6);
        border-bottom: 1px solid var(--secondary-100);
        transition: background-color var(--transition-fast);
        cursor: pointer;
        gap: var(--space-3);
    }

    .notification-item:last-child {
        border-bottom: none;
    }

    .notification-icon {
        flex-shrink: 0;
        width: 40px;
        height: 40px;
        background: var(--primary-100);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--primary-600);
    }

    .notification-content {
        flex: 1;
        min-width: 0;
    }

    .notification-title {
        font-weight: 600;
        color: var(--secondary-900);
        margin-bottom: var(--space-1);
        font-size: var(--text-sm);
    }

    .notification-message {
        color: var(--secondary-600);
        font-size: var(--text-sm);
        line-height: 1.4;
        margin-bottom: var(--space-1);
    }

    .notification-time {
        color: var(--secondary-400);
        font-size: var(--text-xs);
    }

    .notification-close {
        background: none;
        border: none;
        color: var(--secondary-400);
        cursor: pointer;
        padding: var(--space-1);
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
        flex-shrink: 0;
    }

    .notification-close:hover {
        background: var(--error-100);
        color: var(--error-600);
    }

    .notification-footer {
        background: var(--secondary-50);
        padding: var(--space-4) var(--space-6);
        border-top: 1px solid var(--secondary-200);
        text-align: center;
    }

    .no-notifications {
        padding: var(--space-8) var(--space-6);
    }

    .empty-state {
        text-align: center;
        color: var(--secondary-500);
    }

    .empty-state-icon {
        margin-bottom: var(--space-4);
        opacity: 0.5;
    }

    .empty-state-title {
        font-weight: 600;
        margin-bottom: var(--space-2);
        color: var(--secondary-700);
    }

    .empty-state-description {
        font-size: var(--text-sm);
    }

    /* Scrollbar Styling */
    .notification-list::-webkit-scrollbar {
        width: 4px;
    }

    .notification-list::-webkit-scrollbar-track {
        background: transparent;
    }

    .notification-list::-webkit-scrollbar-thumb {
        background: var(--secondary-300);
        border-radius: 2px;
    }

    .notification-list::-webkit-scrollbar-thumb:hover {
        background: var(--secondary-400);
    }
`;
document.head.appendChild(style);

// Initialize notification manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});