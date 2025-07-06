// Employee Dashboard - Database-Driven Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Get user info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    const userName = urlParams.get('name');
    const userId = urlParams.get('id');
    
    // Auth check
    if (!userRole || userRole !== 'employee' || !userName || !userId) {
        window.location.href = '/index.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard(userName, userId);
});

function initializeDashboard(userName, userId) {
    // Update user info
    const userInfoElement = document.getElementById('user-info');
    if (userInfoElement) {
        userInfoElement.textContent = `Welcome, ${userName}!`;
    }

    // Initialize modules
    initializeNavigation();
    initializeLogout();
    initializeJobManagement();
    initializeInventoryModule();
    initializeTimeTracking();
    
    // Load initial data
    loadEmployeeData();
    loadOverviewData();
}

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const navButtons = document.querySelectorAll('.nav-button');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchToTab(targetTab);
        });
    });

    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute('data-tab');
            if (targetTab) {
                switchToTab(targetTab);
            }
        });
    });
}

function switchToTab(targetTab) {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all nav links and tab contents
    navLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target nav link and tab content
    const targetNavLink = document.querySelector(`[data-tab="${targetTab}"]`);
    const targetTabContent = document.getElementById(`${targetTab}-tab`);
    
    if (targetNavLink) {
        targetNavLink.classList.add('active');
    }
    if (targetTabContent) {
        targetTabContent.classList.add('active');
    }
    
    // Load tab data
    loadTabData(targetTab);
}

function loadTabData(tab) {
    switch(tab) {
        case 'overview':
            loadOverviewData();
            break;
        case 'assigned-jobs':
            loadAssignedJobs();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'time-tracking':
            loadTimeTrackingData();
            break;
        case 'reports':
            loadEmployeeReports();
            break;
    }
}

// Logout functionality
function initializeLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            window.location.href = '/index.html';
        });
    }
}

// Overview Data Loading
async function loadOverviewData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    try {
        // Load assigned jobs
        const jobsResponse = await fetch(`http://localhost:8080/api/admin/jobs`);
        if (!jobsResponse.ok) throw new Error('Failed to fetch jobs data');
        
        const allJobs = await jobsResponse.json();
        const assignedJobs = allJobs.filter(job => job.employeeName && job.employeeName.includes(userName));
        
        updateEmployeeMetrics(assignedJobs);
        updateRecentJobs(assignedJobs);
        
        // Load inventory alerts
        const inventoryResponse = await fetch('http://localhost:8080/api/admin/inventory/alerts');
        if (inventoryResponse.ok) {
            const lowStockItems = await inventoryResponse.json();
            updateInventoryAlerts(lowStockItems);
        }
        
        // Load performance data
        const performanceResponse = await fetch(`http://localhost:8080/api/admin/performance`);
        if (performanceResponse.ok) {
            const performanceData = await performanceResponse.json();
            updatePerformanceMetrics(performanceData, userId);
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateEmployeeMetrics(jobs) {
    const metricsGrid = document.getElementById('employee-metrics-grid');
    if (!metricsGrid) return;
    
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
    const todayJobs = jobs.filter(job => {
        const jobDate = new Date(job.bookingDate);
        const today = new Date();
        return jobDate.toDateString() === today.toDateString();
    }).length;

    const metrics = [
        {
            title: 'Total Assigned Jobs',
            value: totalJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            class: 'jobs'
        },
        {
            title: 'Active Jobs',
            value: activeJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
            class: 'active'
        },
        {
            title: 'Completed Today',
            value: todayJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`,
            class: 'completed'
        },
        {
            title: 'Total Completed',
            value: completedJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg>`,
            class: 'total-completed'
        }
    ];

    metricsGrid.innerHTML = metrics.map((metric, index) => `
        <div class="metric-card ${metric.class}" style="animation-delay: ${index * 0.1}s;">
            <div class="metric-header">
                <div class="metric-icon">${metric.icon}</div>
            </div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.title}</div>
        </div>
    `).join('');
}

function updateRecentJobs(jobs) {
    const recentJobsList = document.getElementById('recent-jobs-list');
    if (!recentJobsList) return;
    
    const recentJobs = jobs.slice(0, 3);
    
    if (recentJobs.length === 0) {
        recentJobsList.innerHTML = `
            <div class="no-data">
                <p>No assigned jobs found</p>
                <button class="btn btn-sm btn-primary" onclick="switchToTab('assigned-jobs')">View All Jobs</button>
            </div>
        `;
        return;
    }

    recentJobsList.innerHTML = recentJobs.map(job => `
        <div class="recent-job-item">
            <div class="job-header">
                <span class="job-id">#${job.jobId}</span>
                <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>
            </div>
            <div class="job-details">
                <div class="job-vehicle">${job.vehicle}</div>
                <div class="job-service">${job.service}</div>
                <div class="job-customer">${job.customerName}</div>
                <div class="job-date">${new Date(job.bookingDate).toLocaleDateString()}</div>
            </div>
            <div class="job-actions">
                <button class="btn btn-sm btn-primary" onclick="updateJobStatus(${job.jobId})">
                    Update Status
                </button>
                <button class="btn btn-sm btn-outline" onclick="viewJobDetails(${job.jobId})">
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

function updateInventoryAlerts(lowStockItems) {
    const inventoryAlerts = document.getElementById('inventory-alerts');
    if (!inventoryAlerts) return;
    
    if (lowStockItems.length === 0) {
        inventoryAlerts.innerHTML = `
            <div class="no-alerts">
                <p>No low stock alerts</p>
            </div>
        `;
        return;
    }

    inventoryAlerts.innerHTML = `
        <div class="alerts-header">
            <h4>Low Stock Alerts</h4>
            <span class="alert-count">${lowStockItems.length}</span>
        </div>
        <div class="alerts-list">
            ${lowStockItems.slice(0, 3).map(item => `
                <div class="alert-item">
                    <div class="alert-icon">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div class="alert-content">
                        <div class="alert-title">${item.partName}</div>
                        <div class="alert-description">Only ${item.quantity} remaining (Min: ${item.minQuantity})</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${lowStockItems.length > 3 ? `
            <div class="alerts-footer">
                <button class="btn btn-sm btn-primary" onclick="switchToTab('inventory')">
                    View All Alerts (${lowStockItems.length})
                </button>
            </div>
        ` : ''}
    `;
}

function updatePerformanceMetrics(performanceData, userId) {
    const performanceMetrics = document.getElementById('performance-metrics');
    if (!performanceMetrics) return;
    
    const userPerformance = performanceData.find(p => p.employeeId == userId);
    
    if (!userPerformance) {
        performanceMetrics.innerHTML = `
            <div class="no-data">
                <p>No performance data available</p>
            </div>
        `;
        return;
    }

    performanceMetrics.innerHTML = `
        <div class="performance-grid">
            <div class="performance-item">
                <div class="performance-label">Jobs Completed</div>
                <div class="performance-value">${userPerformance.jobsCompleted || 0}</div>
            </div>
            <div class="performance-item">
                <div class="performance-label">Average Rating</div>
                <div class="performance-value">${(userPerformance.avgRating || 0).toFixed(1)} ⭐</div>
            </div>
            <div class="performance-item">
                <div class="performance-label">Efficiency Score</div>
                <div class="performance-value">${(userPerformance.efficiencyScore || 0).toFixed(1)}%</div>
            </div>
        </div>
    `;
}

// Job Management
function initializeJobManagement() {
    // Add event listeners for job management features
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('update-status-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            updateJobStatus(jobId);
        }
        
        if (e.target.classList.contains('view-details-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            viewJobDetails(jobId);
        }
        
        if (e.target.classList.contains('use-parts-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            usePartsForJob(jobId);
        }
    });
}

async function loadAssignedJobs() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userName = urlParams.get('name');
    
    try {
        const response = await fetch(`http://localhost:8080/api/admin/jobs`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const allJobs = await response.json();
        const assignedJobs = allJobs.filter(job => job.employeeName && job.employeeName.includes(userName));
        
        renderAssignedJobsTable(assignedJobs);
    } catch (error) {
        console.error('Error loading assigned jobs:', error);
        showNotification('Failed to load assigned jobs', 'error');
    }
}

function renderAssignedJobsTable(jobs) {
    const tableBody = document.getElementById('assigned-jobs-table-body');
    if (!tableBody) return;
    
    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>No assigned jobs found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = jobs.map(job => `
        <tr class="job-row" data-job-id="${job.jobId}">
            <td>
                <div class="job-info">
                    <div class="job-id">#${job.jobId}</div>
                    <div class="job-customer">${job.customerName}</div>
                </div>
            </td>
            <td>
                <div class="vehicle-info">
                    <div class="vehicle-details">${job.vehicle}</div>
                </div>
            </td>
            <td>
                <div class="service-info">
                    <div class="service-name">${job.service}</div>
                </div>
            </td>
            <td>
                <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>
            </td>
            <td>
                <div class="date-info">
                    <div class="booking-date">${new Date(job.bookingDate).toLocaleDateString()}</div>
                </div>
            </td>
            <td>
                <div class="job-actions">
                    <button class="btn btn-sm btn-primary update-status-btn" data-job-id="${job.jobId}">
                        Update Status
                    </button>
                    <button class="btn btn-sm btn-outline view-details-btn" data-job-id="${job.jobId}">
                        Details
                    </button>
                    <button class="btn btn-sm btn-secondary use-parts-btn" data-job-id="${job.jobId}">
                        Use Parts
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateJobStatus(jobId) {
    // Fetch current job status and show update modal
    fetch(`http://localhost:8080/api/employee/jobs/${jobId}/details`)
        .then(response => response.json())
        .then(job => {
            createStatusUpdateModal(job);
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            showNotification('Failed to load job details', 'error');
        });
}

function viewJobDetails(jobId) {
    // Fetch job details and show modal
    fetch(`http://localhost:8080/api/employee/jobs/${jobId}/details`)
        .then(response => response.json())
        .then(job => {
            createJobDetailsModal(job);
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            showNotification('Failed to load job details', 'error');
        });
}

function usePartsForJob(jobId) {
    // Fetch available inventory and show parts usage modal
    fetch('http://localhost:8080/api/employee/inventory')
        .then(response => response.json())
        .then(inventory => {
            createPartsUsageModal(jobId, inventory);
        })
        .catch(error => {
            console.error('Error fetching inventory:', error);
            showNotification('Failed to load inventory', 'error');
        });
}

// Inventory Management
function initializeInventoryModule() {
    // Add event listeners for inventory features
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('check-stock-btn')) {
            const partId = e.target.getAttribute('data-part-id');
            checkStockLevel(partId);
        }
        
        if (e.target.classList.contains('use-part-btn')) {
            const partId = e.target.getAttribute('data-part-id');
            usePart(partId);
        }
    });
}

async function loadInventoryData() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const inventory = await response.json();
        renderInventoryTable(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Failed to load inventory data', 'error');
    }
}

function renderInventoryTable(inventory) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    
    if (inventory.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>No inventory items found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = inventory.map(item => `
        <tr class="inventory-row ${item.quantity <= item.minQuantity ? 'low-stock' : ''}" data-part-id="${item.id}">
            <td>
                <div class="part-info">
                    <div class="part-name">${item.partName}</div>
                    <div class="part-number">${item.partNumber}</div>
                </div>
            </td>
            <td>
                <div class="stock-info">
                    <div class="current-stock">${item.quantity}</div>
                    <div class="min-stock">Min: ${item.minQuantity}</div>
                </div>
            </td>
            <td>
                <div class="price-info">
                    <div class="unit-price">$${item.pricePerUnit}</div>
                </div>
            </td>
            <td>
                <div class="category-info">
                    <span class="category-badge">${item.category}</span>
                </div>
            </td>
            <td>
                <div class="supplier-info">
                    <div class="supplier-name">${item.supplier}</div>
                </div>
            </td>
            <td>
                <div class="inventory-actions">
                    <button class="btn btn-sm btn-outline check-stock-btn" data-part-id="${item.id}">
                        Check Stock
                    </button>
                    <button class="btn btn-sm btn-secondary use-part-btn" data-part-id="${item.id}">
                        Use Part
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function checkStockLevel(partId) {
    // Find the part in the inventory data
    const partRow = document.querySelector(`[data-part-id="${partId}"]`);
    if (partRow) {
        const quantity = partRow.querySelector('.current-stock')?.textContent || '0';
        const partName = partRow.querySelector('.part-name')?.textContent || `Part #${partId}`;
        const minStock = partRow.querySelector('.min-stock')?.textContent || 'Min: 0';
        showNotification(`Stock level for ${partName}: ${quantity} units available (${minStock})`, 'info');
    } else {
        showNotification(`Checking stock level for part #${partId}`, 'info');
    }
}

function usePart(partId) {
    // Find the part in the inventory data
    const partRow = document.querySelector(`[data-part-id="${partId}"]`);
    if (partRow) {
        const partName = partRow.querySelector('.part-name')?.textContent || `Part #${partId}`;
        const quantity = partRow.querySelector('.current-stock')?.textContent || '0';
        const minStock = partRow.querySelector('.min-stock')?.textContent.replace('Min: ', '') || '0';
        
        if (parseInt(quantity) > 0) {
            if (parseInt(quantity) <= parseInt(minStock)) {
                showNotification(`Using ${partName} - Low stock warning: ${quantity} units remaining`, 'warning');
            } else {
                showNotification(`Using ${partName} - ${quantity} units remaining`, 'success');
            }
            // Here you would typically open a modal to select quantity to use
        } else {
            showNotification(`${partName} is out of stock`, 'error');
        }
    } else {
        showNotification(`Opening part usage for part #${partId}`, 'info');
    }
}

// Time Tracking
function initializeTimeTracking() {
    // Initialize time tracking features
    const startTimeBtn = document.getElementById('start-time-btn');
    const stopTimeBtn = document.getElementById('stop-time-btn');
    
    if (startTimeBtn) {
        startTimeBtn.addEventListener('click', startTimeTracking);
    }
    
    if (stopTimeBtn) {
        stopTimeBtn.addEventListener('click', stopTimeTracking);
    }
}

function startTimeTracking() {
    const startTime = new Date();
    localStorage.setItem('timeTrackingStart', startTime.toISOString());
    
    const startTimeBtn = document.getElementById('start-time-btn');
    const stopTimeBtn = document.getElementById('stop-time-btn');
    
    if (startTimeBtn) startTimeBtn.disabled = true;
    if (stopTimeBtn) stopTimeBtn.disabled = false;
    
    showNotification('Time tracking started', 'success');
}

function stopTimeTracking() {
    const startTime = localStorage.getItem('timeTrackingStart');
    if (!startTime) {
        showNotification('No active time tracking session', 'error');
        return;
    }
    
    const endTime = new Date();
    const duration = endTime - new Date(startTime);
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    localStorage.removeItem('timeTrackingStart');
    
    const startTimeBtn = document.getElementById('start-time-btn');
    const stopTimeBtn = document.getElementById('stop-time-btn');
    
    if (startTimeBtn) startTimeBtn.disabled = false;
    if (stopTimeBtn) stopTimeBtn.disabled = true;
    
    showNotification(`Time tracking stopped. Duration: ${hours}h ${minutes}m`, 'success');
}

function loadTimeTrackingData() {
    // Load time tracking data
    const startTime = localStorage.getItem('timeTrackingStart');
    const timeTrackingStatus = document.getElementById('time-tracking-status');
    
    if (timeTrackingStatus) {
        if (startTime) {
            const start = new Date(startTime);
            const now = new Date();
            const duration = now - start;
            const hours = Math.floor(duration / (1000 * 60 * 60));
            const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
            
            timeTrackingStatus.innerHTML = `
                <div class="tracking-active">
                    <div class="tracking-indicator active"></div>
                    <div class="tracking-info">
                        <div class="tracking-status">Active</div>
                        <div class="tracking-duration">${hours}h ${minutes}m</div>
                    </div>
                </div>
            `;
        } else {
            timeTrackingStatus.innerHTML = `
                <div class="tracking-inactive">
                    <div class="tracking-indicator"></div>
                    <div class="tracking-info">
                        <div class="tracking-status">Inactive</div>
                        <div class="tracking-duration">Not tracking</div>
                    </div>
                </div>
            `;
        }
    }
}

// Employee Reports
function loadEmployeeReports() {
    // Load employee-specific reports
    showNotification('Loading employee reports...', 'info');
}

// Utility Functions
function closeModal() {
    const modal = document.querySelector('.modal');
    if (modal) {
        modal.remove();
    }
}

function showNotification(message, type = 'info') {
    // Get or create notification container
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'notification-container';
        container.id = 'notification-container';
        document.body.appendChild(container);
    }
    
    // Create notification toast
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
        <div class="toast-icon">
            ${type === 'success' ? '<svg viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>' :
              type === 'error' ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>' :
              type === 'warning' ? '<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' :
              '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'}
        </div>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <svg viewBox="0 0 24 24">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
        </button>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification with animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Load employee data
function loadEmployeeData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const userName = urlParams.get('name');
    
    // Update any employee-specific UI elements
    const employeeNameElement = document.getElementById('employee-name');
    if (employeeNameElement) {
        employeeNameElement.textContent = userName;
    }
    
    // Load employee profile data if needed
    // This could include contact info, skills, etc.
}

// Modal Creation Functions
function createJobDetailsModal(job) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content large-modal">
            <div class="modal-header">
                <h3 class="modal-title">Job Details - #${job.jobId}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="job-details-grid">
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                            </svg>
                            Customer Information
                        </h4>
                        <div class="detail-item">
                            <label>Customer Name:</label>
                            <span>${job.customerName || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Contact:</label>
                            <span>${job.customerPhone || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${job.customerEmail || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <rect x="1" y="3" width="15" height="13"/>
                                <polygon points="16,8 20,8 23,11 23,16 16,16"/>
                                <circle cx="5.5" cy="18.5" r="2.5"/>
                                <circle cx="18.5" cy="18.5" r="2.5"/>
                            </svg>
                            Vehicle Information
                        </h4>
                        <div class="detail-item">
                            <label>Vehicle:</label>
                            <span>${job.vehicle || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Year:</label>
                            <span>${job.vehicleYear || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>VIN:</label>
                            <span>${job.vin || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                            </svg>
                            Service Information
                        </h4>
                        <div class="detail-item">
                            <label>Service:</label>
                            <span>${job.service || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge status-${job.status?.toLowerCase().replace(' ', '-')}">${job.status || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Estimated Duration:</label>
                            <span>${job.estimatedDuration || 'N/A'} minutes</span>
                        </div>
                    </div>
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Schedule & Progress
                        </h4>
                        <div class="detail-item">
                            <label>Booking Date:</label>
                            <span>${job.bookingDate ? new Date(job.bookingDate).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Start Time:</label>
                            <span>${job.startTime ? new Date(job.startTime).toLocaleString() : 'Not started'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Completion Date:</label>
                            <span>${job.completionDate ? new Date(job.completionDate).toLocaleString() : 'Not completed'}</span>
                        </div>
                    </div>
                </div>
                ${job.notes ? `
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14,2 14,8 20,8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            Notes
                        </h4>
                        <p>${job.notes}</p>
                    </div>
                ` : ''}
                ${job.usedParts && job.usedParts.length > 0 ? `
                    <div class="details-section">
                        <h4>
                            <svg class="icon" viewBox="0 0 24 24">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                            </svg>
                            Parts Used
                        </h4>
                        <div class="parts-used-list">
                            ${job.usedParts.map(part => `
                                <div class="part-item">
                                    <span class="part-name">${part.partName}</span>
                                    <span class="part-quantity">${part.quantity} units</span>
                                    <span class="part-cost">$${part.cost}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="updateJobStatus(${job.jobId})">Update Status</button>
                <button class="btn btn-success" onclick="usePartsForJob(${job.jobId})">Use Parts</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function createStatusUpdateModal(job) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Update Job Status - #${job.jobId}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="status-update-form">
                    <div class="form-group">
                        <label for="new-status" class="form-label">New Status</label>
                        <select id="new-status" class="form-input" required>
                            <option value="In Progress" ${job.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${job.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="On Hold" ${job.status === 'On Hold' ? 'selected' : ''}>On Hold</option>
                            <option value="Waiting for Parts" ${job.status === 'Waiting for Parts' ? 'selected' : ''}>Waiting for Parts</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="status-notes" class="form-label">Status Notes</label>
                        <textarea id="status-notes" class="form-input" rows="3" placeholder="Any additional notes about the status change..."></textarea>
                    </div>
                    <div class="form-group">
                        <label for="completion-notes" class="form-label">Completion Notes (if completing)</label>
                        <textarea id="completion-notes" class="form-input" rows="3" placeholder="Work performed, issues found, recommendations..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitStatusUpdate(${job.jobId})">Update Status</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function createPartsUsageModal(jobId, inventory) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content large-modal">
            <div class="modal-header">
                <h3 class="modal-title">Use Parts for Job #${jobId}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="parts-selection">
                    <h4>Select Parts to Use</h4>
                    <div class="inventory-grid">
                        ${inventory.map(item => `
                            <div class="inventory-item" data-part-id="${item.id}">
                                <div class="item-header">
                                    <h5>${item.partName}</h5>
                                    <span class="stock-info ${item.quantity <= item.minQuantity ? 'low-stock' : 'in-stock'}">
                                        ${item.quantity} in stock
                                    </span>
                                </div>
                                <div class="item-details">
                                    <p><strong>Part #:</strong> ${item.partNumber || 'N/A'}</p>
                                    <p><strong>Category:</strong> ${item.category || 'N/A'}</p>
                                    <p><strong>Price:</strong> $${item.pricePerUnit}</p>
                                </div>
                                <div class="item-actions">
                                    <label for="quantity-${item.id}">Quantity:</label>
                                    <input type="number" id="quantity-${item.id}" class="form-input" min="0" max="${item.quantity}" value="0">
                                    <button class="btn btn-sm btn-primary" onclick="addPartToJob(${item.id}, '${item.partName}', ${item.pricePerUnit})">
                                        Add to Job
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="selected-parts">
                    <h4>Parts Selected for This Job</h4>
                    <div id="selected-parts-list">
                        <p class="no-parts">No parts selected yet</p>
                    </div>
                    <div class="parts-summary" id="parts-summary" style="display: none;">
                        <div class="summary-item">
                            <span>Total Parts:</span>
                            <span id="total-parts-count">0</span>
                        </div>
                        <div class="summary-item">
                            <span>Total Cost:</span>
                            <span id="total-parts-cost">$0.00</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitPartsUsage(${jobId})">Confirm Parts Usage</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// Form Submission Functions
function submitStatusUpdate(jobId) {
    const formData = {
        status: document.getElementById('new-status').value,
        notes: document.getElementById('status-notes').value,
        completionNotes: document.getElementById('completion-notes').value
    };

    fetch(`http://localhost:8080/api/employee/jobs/${jobId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Job status updated successfully', 'success');
            closeModal();
            loadAssignedJobs(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update job status', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating job status:', error);
        showNotification('Failed to update job status', 'error');
    });
}

// Global variables for parts usage
let selectedParts = [];

function addPartToJob(partId, partName, pricePerUnit) {
    const quantity = parseInt(document.getElementById(`quantity-${partId}`).value);
    if (quantity <= 0) {
        showNotification('Please enter a valid quantity', 'error');
        return;
    }

    // Check if part is already selected
    const existingPart = selectedParts.find(p => p.partId === partId);
    if (existingPart) {
        existingPart.quantity = quantity;
        existingPart.cost = quantity * pricePerUnit;
    } else {
        selectedParts.push({
            partId: partId,
            partName: partName,
            quantity: quantity,
            pricePerUnit: pricePerUnit,
            cost: quantity * pricePerUnit
        });
    }

    updateSelectedPartsDisplay();
    showNotification(`${partName} added to job`, 'success');
}

function updateSelectedPartsDisplay() {
    const selectedPartsList = document.getElementById('selected-parts-list');
    const partsSummary = document.getElementById('parts-summary');
    
    if (selectedParts.length === 0) {
        selectedPartsList.innerHTML = '<p class="no-parts">No parts selected yet</p>';
        partsSummary.style.display = 'none';
        return;
    }

    selectedPartsList.innerHTML = selectedParts.map(part => `
        <div class="selected-part-item">
            <div class="part-info">
                <span class="part-name">${part.partName}</span>
                <span class="part-quantity">${part.quantity} units</span>
            </div>
            <div class="part-cost">$${part.cost.toFixed(2)}</div>
            <button class="btn btn-sm btn-danger" onclick="removePartFromJob(${part.partId})">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
    `).join('');

    // Update summary
    const totalParts = selectedParts.reduce((sum, part) => sum + part.quantity, 0);
    const totalCost = selectedParts.reduce((sum, part) => sum + part.cost, 0);
    
    document.getElementById('total-parts-count').textContent = totalParts;
    document.getElementById('total-parts-cost').textContent = `$${totalCost.toFixed(2)}`;
    partsSummary.style.display = 'block';
}

function removePartFromJob(partId) {
    selectedParts = selectedParts.filter(p => p.partId !== partId);
    updateSelectedPartsDisplay();
    showNotification('Part removed from job', 'info');
}

function submitPartsUsage(jobId) {
    if (selectedParts.length === 0) {
        showNotification('Please select at least one part', 'error');
        return;
    }

    const formData = {
        parts: selectedParts
    };

    fetch(`http://localhost:8080/api/employee/jobs/${jobId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Parts usage recorded successfully', 'success');
            closeModal();
            selectedParts = []; // Reset selected parts
            loadAssignedJobs(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to record parts usage', 'error');
        }
    })
    .catch(error => {
        console.error('Error recording parts usage:', error);
        showNotification('Failed to record parts usage', 'error');
    });
}