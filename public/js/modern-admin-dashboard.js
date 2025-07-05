// Modern Admin Dashboard - RepairHub Pro
document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check
    if (!userRole || userRole !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // Initialize dashboard
    initializeDashboard(userName);
});

function initializeDashboard(userName) {
    // Update user info
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
        userNameElement.textContent = userName;
    }

    // Initialize modules
    initializeNavigation();
    initializeLogout();
    initializeOverview();
    initializeJobsModule();
    initializeServicesModule();
    initializeInventoryModule();
    initializeUsersModule();
    initializeReportsModule();
    
    // Load initial data
    loadOverviewData();
}

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            
            // Update active states
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            link.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Load tab data
            loadTabData(targetTab);
        });
    });
}

function loadTabData(tab) {
    switch(tab) {
        case 'overview':
            loadOverviewData();
            break;
        case 'jobs':
            loadJobsData();
            break;
        case 'services':
            loadServicesData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'reports':
            loadReportsData();
            break;
    }
}

// Logout functionality
function initializeLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '/index.html';
        });
    }
}

// Overview Module
function initializeOverview() {
    const refreshBtn = document.getElementById('refresh-overview-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOverviewData);
    }
}

async function loadOverviewData() {
    try {
        showLoadingState('metrics-grid');
        
        // Load metrics data
        const [jobsResponse, usersResponse, inventoryResponse] = await Promise.all([
            fetch('http://localhost:8080/api/admin/jobs'),
            fetch('http://localhost:8080/api/admin/users'),
            fetch('http://localhost:8080/api/admin/inventory/alerts')
        ]);
        
        const jobs = await jobsResponse.json();
        const users = await usersResponse.json();
        const lowStockItems = await inventoryResponse.json();
        
        // Calculate metrics
        const metrics = calculateMetrics(jobs, users, lowStockItems);
        
        // Update UI
        renderMetricsCards(metrics);
        
        // Load charts if available
        if (window.advancedReporting) {
            await window.advancedReporting.generateRevenueChart('overview-revenue-chart');
            await window.advancedReporting.generateServicePerformanceChart('overview-service-chart');
        }
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        showErrorState('metrics-grid', 'Failed to load dashboard data');
    }
}

function calculateMetrics(jobs, users, lowStockItems) {
    const totalRevenue = jobs
        .filter(job => job.totalCost)
        .reduce((sum, job) => sum + parseFloat(job.totalCost), 0);
    
    const completedJobs = jobs.filter(job => job.status === 'Completed').length;
    const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
    const activeCustomers = users.filter(user => user.role === 'customer').length;
    
    return {
        totalRevenue: totalRevenue.toFixed(2),
        totalJobs: jobs.length,
        completedJobs,
        inProgressJobs,
        activeCustomers,
        lowStockItems: lowStockItems.length,
        completionRate: jobs.length > 0 ? ((completedJobs / jobs.length) * 100).toFixed(1) : 0
    };
}

function renderMetricsCards(metrics) {
    const metricsGrid = document.getElementById('metrics-grid');
    
    const cards = [
        {
            title: 'Total Revenue',
            value: `$${metrics.totalRevenue}`,
            icon: '💰',
            change: '+12.5%',
            changeType: 'positive',
            class: 'revenue'
        },
        {
            title: 'Total Jobs',
            value: metrics.totalJobs,
            icon: '🔧',
            change: `${metrics.inProgressJobs} in progress`,
            changeType: 'neutral',
            class: 'jobs'
        },
        {
            title: 'Active Customers',
            value: metrics.activeCustomers,
            icon: '👥',
            change: '+5.2%',
            changeType: 'positive',
            class: 'customers'
        },
        {
            title: 'Low Stock Items',
            value: metrics.lowStockItems,
            icon: '📦',
            change: 'Needs attention',
            changeType: metrics.lowStockItems > 0 ? 'negative' : 'positive',
            class: 'inventory'
        }
    ];
    
    metricsGrid.innerHTML = cards.map(card => `
        <div class="metric-card ${card.class}">
            <div class="metric-header">
                <div class="metric-icon">${card.icon}</div>
            </div>
            <div class="metric-value">${card.value}</div>
            <div class="metric-label">${card.title}</div>
            <div class="metric-change ${card.changeType}">
                ${card.change}
            </div>
        </div>
    `).join('');
}

// Jobs Module
function initializeJobsModule() {
    const createJobBtn = document.getElementById('create-job-btn');
    if (createJobBtn) {
        createJobBtn.addEventListener('click', () => {
            showCreateJobModal();
        });
    }
}

async function loadJobsData() {
    try {
        showLoadingState('job-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/jobs');
        const jobs = await response.json();
        
        renderJobsTable(jobs);
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        showErrorState('job-table-body', 'Failed to load jobs');
    }
}

function renderJobsTable(jobs) {
    const tableBody = document.getElementById('job-table-body');
    
    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <div class="empty-state-icon">🔧</div>
                    <div class="empty-state-title">No jobs found</div>
                    <div class="empty-state-description">Create your first job to get started</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = jobs.map(job => `
        <tr>
            <td><strong>#${job.jobId}</strong></td>
            <td>${job.customerName}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${job.assignedEmployee || '<span class="text-secondary">Unassigned</span>'}</td>
            <td>${job.totalCost ? '$' + job.totalCost : '<span class="text-secondary">Pending</span>'}</td>
            <td class="actions">
                ${job.status === 'Booked' && !job.assignedEmployee ? 
                    `<button class="btn btn-sm btn-primary" onclick="assignEmployee(${job.jobId})">Assign</button>` : ''}
                ${job.status === 'Completed' && !job.totalCost ? 
                    `<button class="btn btn-sm btn-success" onclick="generateInvoice(${job.jobId})">Invoice</button>` : ''}
                <button class="btn btn-sm btn-secondary" onclick="viewJobDetails(${job.jobId})">View</button>
            </td>
        </tr>
    `).join('');
}

// Services Module
function initializeServicesModule() {
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => {
            showCreateServiceModal();
        });
    }
}

async function loadServicesData() {
    try {
        showLoadingState('services-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/services');
        const services = await response.json();
        
        renderServicesTable(services);
        
    } catch (error) {
        console.error('Error loading services:', error);
        showErrorState('services-table-body', 'Failed to load services');
    }
}

function renderServicesTable(services) {
    const tableBody = document.getElementById('services-table-body');
    
    if (services.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state">
                    <div class="empty-state-icon">⚙️</div>
                    <div class="empty-state-title">No services found</div>
                    <div class="empty-state-description">Add your first service to get started</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = services.map(service => `
        <tr>
            <td><strong>#${service.id}</strong></td>
            <td>${service.serviceName}</td>
            <td><strong>$${service.price}</strong></td>
            <td>${service.description || '<span class="text-secondary">No description</span>'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editService(${service.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Inventory Module
function initializeInventoryModule() {
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    const lowStockBtn = document.getElementById('low-stock-btn');
    
    if (addInventoryBtn) {
        addInventoryBtn.addEventListener('click', () => {
            showCreateInventoryModal();
        });
    }
    
    if (lowStockBtn) {
        lowStockBtn.addEventListener('click', showLowStockAlert);
    }
}

async function loadInventoryData() {
    try {
        showLoadingState('inventory-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        const inventory = await response.json();
        
        renderInventoryTable(inventory);
        
    } catch (error) {
        console.error('Error loading inventory:', error);
        showErrorState('inventory-table-body', 'Failed to load inventory');
    }
}

function renderInventoryTable(inventory) {
    const tableBody = document.getElementById('inventory-table-body');
    
    if (inventory.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <div class="empty-state-title">No inventory items found</div>
                    <div class="empty-state-description">Add your first inventory item to get started</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = inventory.map(item => {
        const totalValue = (item.quantity * item.pricePerUnit).toFixed(2);
        const isLowStock = item.quantity < 10;
        
        return `
            <tr ${isLowStock ? 'class="low-stock"' : ''}>
                <td><strong>#${item.id}</strong></td>
                <td>${item.partName}</td>
                <td>
                    <span class="${isLowStock ? 'text-error font-bold' : ''}">${item.quantity}</span>
                    ${isLowStock ? '<span class="text-error">⚠️</span>' : ''}
                </td>
                <td>$${item.pricePerUnit}</td>
                <td><strong>$${totalValue}</strong></td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">Edit</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Users Module
function initializeUsersModule() {
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => {
            showCreateUserModal();
        });
    }
}

async function loadUsersData() {
    try {
        showLoadingState('users-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/users');
        const users = await response.json();
        
        renderUsersTable(users);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showErrorState('users-table-body', 'Failed to load users');
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">👥</div>
                    <div class="empty-state-title">No users found</div>
                    <div class="empty-state-description">Add your first user to get started</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td><strong>#${user.id}</strong></td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
            </td>
        </tr>
    `).join('');
}

// Reports Module
function initializeReportsModule() {
    const refreshReportsBtn = document.getElementById('refresh-reports-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    if (refreshReportsBtn) {
        refreshReportsBtn.addEventListener('click', loadReportsData);
    }
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportReports);
    }
}

async function loadReportsData() {
    if (window.advancedReporting) {
        try {
            await Promise.all([
                window.advancedReporting.generateRevenueChart('revenue-chart'),
                window.advancedReporting.generatePartUsageChart('parts-usage-chart')
            ]);
            
            showNotification('Reports updated successfully', 'success');
        } catch (error) {
            console.error('Error loading reports:', error);
            showNotification('Failed to load reports', 'error');
        }
    }
}

// Utility Functions
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-skeleton">
                <div class="loading-skeleton title"></div>
                <div class="loading-skeleton text"></div>
                <div class="loading-skeleton text"></div>
            </div>
        `;
    }
}

function showErrorState(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">Error</div>
                <div class="empty-state-description">${message}</div>
            </div>
        `;
    }
}

function showNotification(message, type = 'info') {
    if (window.notificationManager) {
        window.notificationManager.addNotification({
            type: type,
            title: type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info',
            message: message
        });
    } else {
        alert(message);
    }
}

// Modal Functions (Placeholders - will be implemented with actual modals)
function showCreateJobModal() {
    showNotification('Create Job modal - Coming soon!', 'info');
}

function showCreateServiceModal() {
    showNotification('Create Service modal - Coming soon!', 'info');
}

function showCreateInventoryModal() {
    showNotification('Create Inventory modal - Coming soon!', 'info');
}

function showCreateUserModal() {
    showNotification('Create User modal - Coming soon!', 'info');
}

function assignEmployee(jobId) {
    showNotification(`Assign employee to job #${jobId} - Coming soon!`, 'info');
}

function generateInvoice(jobId) {
    showNotification(`Generate invoice for job #${jobId} - Coming soon!`, 'info');
}

function viewJobDetails(jobId) {
    showNotification(`View details for job #${jobId} - Coming soon!`, 'info');
}

function editService(serviceId) {
    showNotification(`Edit service #${serviceId} - Coming soon!`, 'info');
}

function deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service?')) {
        showNotification(`Delete service #${serviceId} - Coming soon!`, 'info');
    }
}

function editInventoryItem(itemId) {
    showNotification(`Edit inventory item #${itemId} - Coming soon!`, 'info');
}

function editUser(userId) {
    showNotification(`Edit user #${userId} - Coming soon!`, 'info');
}

function showLowStockAlert() {
    showNotification('Low stock alert - Coming soon!', 'warning');
}

function exportReports() {
    if (window.advancedReporting) {
        window.advancedReporting.exportReport('csv');
    } else {
        showNotification('Export reports - Coming soon!', 'info');
    }
}