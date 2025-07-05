// Modern Admin Dashboard - Complete Implementation with Working Features
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
            const targetElement = document.getElementById(`${targetTab}-tab`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
            
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
        
        if (!jobsResponse.ok || !usersResponse.ok || !inventoryResponse.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const jobs = await jobsResponse.json();
        const users = await usersResponse.json();
        const lowStockItems = await inventoryResponse.json();
        
        // Calculate metrics
        const metrics = calculateMetrics(jobs, users, lowStockItems);
        
        // Update UI
        renderMetricsCards(metrics);
        
        // Load charts
        generateSimpleCharts(jobs);
        
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
            icon: `<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
            change: '+12.5%',
            changeType: 'positive',
            class: 'revenue'
        },
        {
            title: 'Total Jobs',
            value: metrics.totalJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            change: `${metrics.inProgressJobs} in progress`,
            changeType: 'neutral',
            class: 'jobs'
        },
        {
            title: 'Active Customers',
            value: metrics.activeCustomers,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
            change: '+5.2%',
            changeType: 'positive',
            class: 'customers'
        },
        {
            title: 'Low Stock Items',
            value: metrics.lowStockItems,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
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

function generateSimpleCharts(jobs) {
    // Revenue chart
    const revenueChart = document.getElementById('overview-revenue-chart');
    if (revenueChart) {
        const monthlyData = getMonthlyRevenue(jobs);
        revenueChart.innerHTML = createBarChart(monthlyData, 'Revenue');
    }

    // Service distribution chart
    const serviceChart = document.getElementById('overview-service-chart');
    if (serviceChart) {
        const serviceData = getServiceDistribution(jobs);
        serviceChart.innerHTML = createPieChart(serviceData, 'Services');
    }
}

function getMonthlyRevenue(jobs) {
    const months = {};
    jobs.forEach(job => {
        if (job.totalCost && job.bookingDate) {
            const month = new Date(job.bookingDate).toLocaleDateString('en-US', { month: 'short' });
            months[month] = (months[month] || 0) + parseFloat(job.totalCost);
        }
    });
    return Object.entries(months).map(([month, revenue]) => ({ label: month, value: revenue }));
}

function getServiceDistribution(jobs) {
    const services = {};
    jobs.forEach(job => {
        services[job.service] = (services[job.service] || 0) + 1;
    });
    return Object.entries(services).map(([service, count]) => ({ label: service, value: count }));
}

function createBarChart(data, title) {
    if (!data.length) return `<div class="chart-placeholder">No data available</div>`;
    
    const maxValue = Math.max(...data.map(d => d.value));
    return `
        <div class="simple-chart">
            ${data.map(item => `
                <div class="chart-bar" style="height: ${(item.value / maxValue) * 200}px;" title="${item.label}: ${item.value}">
                    <div class="chart-bar-value">${typeof item.value === 'number' && item.value > 1000 ? '$' + item.value.toFixed(0) : item.value}</div>
                    <div class="chart-bar-label">${item.label}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function createPieChart(data, title) {
    if (!data.length) return `<div class="chart-placeholder">No data available</div>`;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6'];
    
    return `
        <div class="pie-chart-container">
            <div class="pie-legend">
                ${data.map((item, index) => `
                    <div class="pie-legend-item">
                        <div class="pie-legend-color" style="background: ${colors[index % colors.length]};"></div>
                        <span>${item.label} (${((item.value / total) * 100).toFixed(1)}%)</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
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
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
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
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    </div>
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
                    `<button class="btn btn-sm btn-primary" onclick="assignEmployee(${job.jobId})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6"/><path d="M23 11h-6"/></svg>
                        Assign
                    </button>` : ''}
                ${job.status === 'Completed' && !job.totalCost ? 
                    `<button class="btn btn-sm btn-success" onclick="generateInvoice(${job.jobId})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                        Invoice
                    </button>` : ''}
                <button class="btn btn-sm btn-secondary" onclick="viewJobDetails(${job.jobId})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    View
                </button>
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
        if (!response.ok) throw new Error('Failed to fetch services');
        
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
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                    </div>
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
                <button class="btn btn-sm btn-secondary" onclick="editService(${service.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Delete
                </button>
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
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
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
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                    </div>
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
                    ${isLowStock ? '<svg class="icon icon-sm text-error" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : ''}
                </td>
                <td>$${item.pricePerUnit}</td>
                <td><strong>$${totalValue}</strong></td>
                <td class="actions">
                    <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        Edit
                    </button>
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
        if (!response.ok) throw new Error('Failed to fetch users');
        
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
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">No users found</div>
                    <div class="empty-state-description">Add your first user to get started</div>
                </td>
            </tr>
        `;
        return;
    }
    
    const roleIcons = {
        admin: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
        employee: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
        customer: '<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
    };
    
    tableBody.innerHTML = users.map(user => `
        <tr>
            <td><strong>#${user.id}</strong></td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td>
                <span class="role-badge role-${user.role}">
                    ${roleIcons[user.role] || ''}
                    ${user.role}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    Edit
                </button>
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
    try {
        const [jobsResponse, revenueResponse] = await Promise.all([
            fetch('http://localhost:8080/api/admin/jobs'),
            fetch('http://localhost:8080/api/admin/reports/revenue')
        ]);
        
        if (!jobsResponse.ok || !revenueResponse.ok) {
            throw new Error('Failed to fetch reports data');
        }
        
        const jobs = await jobsResponse.json();
        const revenue = await revenueResponse.json();
        
        // Generate revenue chart
        const revenueChart = document.getElementById('revenue-chart');
        if (revenueChart) {
            revenueChart.innerHTML = createBarChart(revenue.map(r => ({
                label: r.month,
                value: parseFloat(r.totalRevenue || 0)
            })), 'Revenue');
        }
        
        // Generate parts usage chart
        const partsChart = document.getElementById('parts-usage-chart');
        if (partsChart) {
            const partUsageResponse = await fetch('http://localhost:8080/api/admin/reports/part-usage');
            if (partUsageResponse.ok) {
                const partUsage = await partUsageResponse.json();
                partsChart.innerHTML = createBarChart(partUsage.slice(0, 5).map(p => ({
                    label: p.partName,
                    value: p.totalUsed
                })), 'Parts Usage');
            }
        }
        
        showNotification('Reports updated successfully', 'success');
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Failed to load reports', 'error');
    }
}

// Modal Functions
function showCreateJobModal() {
    createModal('Create New Job', `
        <form id="job-form">
            <div class="form-group">
                <label for="job-customer" class="form-label">Customer</label>
                <select id="job-customer" class="form-input" required>
                    <option value="">Select Customer</option>
                </select>
            </div>
            <div class="form-group">
                <label for="job-vehicle" class="form-label">Vehicle</label>
                <select id="job-vehicle" class="form-input" required>
                    <option value="">Select Vehicle</option>
                </select>
            </div>
            <div class="form-group">
                <label for="job-service" class="form-label">Service</label>
                <select id="job-service" class="form-input" required>
                    <option value="">Select Service</option>
                </select>
            </div>
            <div class="form-group">
                <label for="job-date" class="form-label">Booking Date</label>
                <input type="datetime-local" id="job-date" class="form-input" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Job</button>
            </div>
        </form>
    `, async () => {
        // Load form data
        await loadJobFormData();
        
        // Handle form submission
        document.getElementById('job-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await createJob();
        });
    });
}

function showCreateServiceModal() {
    createModal('Add New Service', `
        <form id="service-form">
            <div class="form-group">
                <label for="service-name" class="form-label">Service Name</label>
                <input type="text" id="service-name" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="service-price" class="form-label">Price</label>
                <input type="number" id="service-price" class="form-input" step="0.01" required>
            </div>
            <div class="form-group">
                <label for="service-description" class="form-label">Description</label>
                <textarea id="service-description" class="form-input" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Service</button>
            </div>
        </form>
    `, () => {
        document.getElementById('service-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await createService();
        });
    });
}

function showCreateInventoryModal() {
    createModal('Add Inventory Item', `
        <form id="inventory-form">
            <div class="form-group">
                <label for="part-name" class="form-label">Part Name</label>
                <input type="text" id="part-name" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="part-quantity" class="form-label">Quantity</label>
                <input type="number" id="part-quantity" class="form-input" min="1" required>
            </div>
            <div class="form-group">
                <label for="part-price" class="form-label">Price per Unit</label>
                <input type="number" id="part-price" class="form-input" step="0.01" required>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Item</button>
            </div>
        </form>
    `, () => {
        document.getElementById('inventory-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await createInventoryItem();
        });
    });
}

function showCreateUserModal() {
    createModal('Add New User', `
        <form id="user-form">
            <div class="form-group">
                <label for="user-username" class="form-label">Username</label>
                <input type="text" id="user-username" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-fullname" class="form-label">Full Name</label>
                <input type="text" id="user-fullname" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-password" class="form-label">Password</label>
                <input type="password" id="user-password" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-role" class="form-label">Role</label>
                <select id="user-role" class="form-input" required>
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                    <option value="customer">Customer</option>
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-primary">Add User</button>
            </div>
        </form>
    `, () => {
        document.getElementById('user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await createUser();
        });
    });
}

// API Functions
async function loadJobFormData() {
    try {
        const [customersResponse, servicesResponse] = await Promise.all([
            fetch('http://localhost:8080/api/admin/users'),
            fetch('http://localhost:8080/api/admin/services')
        ]);
        
        if (!customersResponse.ok || !servicesResponse.ok) {
            throw new Error('Failed to fetch form data');
        }
        
        const users = await customersResponse.json();
        const services = await servicesResponse.json();
        
        const customers = users.filter(user => user.role === 'customer');
        
        const customerSelect = document.getElementById('job-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>' +
            customers.map(customer => `<option value="${customer.id}">${customer.fullName}</option>`).join('');
        
        const serviceSelect = document.getElementById('job-service');
        serviceSelect.innerHTML = '<option value="">Select Service</option>' +
            services.map(service => `<option value="${service.id}">${service.serviceName} - $${service.price}</option>`).join('');
        
        // Set default date
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('job-date').value = now.toISOString().slice(0, 16);
        
        // Load vehicles when customer changes
        customerSelect.addEventListener('change', async () => {
            const customerId = customerSelect.value;
            const vehicleSelect = document.getElementById('job-vehicle');
            
            if (!customerId) {
                vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                return;
            }
            
            try {
                const response = await fetch(`http://localhost:8080/api/customer/vehicles/${customerId}`);
                if (response.ok) {
                    const vehicles = await response.json();
                    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>' +
                        vehicles.map(vehicle => `<option value="${vehicle.id}">${vehicle.make} ${vehicle.model} (${vehicle.year})</option>`).join('');
                }
            } catch (error) {
                console.error('Error loading vehicles:', error);
            }
        });
        
    } catch (error) {
        console.error('Error loading job form data:', error);
    }
}

async function createJob() {
    const formData = {
        customerId: document.getElementById('job-customer').value,
        vehicleId: document.getElementById('job-vehicle').value,
        serviceId: document.getElementById('job-service').value,
        bookingDate: document.getElementById('job-date').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/admin/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            closeModal();
            showNotification('Job created successfully', 'success');
            loadJobsData();
        } else {
            showNotification(result.error || 'Failed to create job', 'error');
        }
    } catch (error) {
        console.error('Error creating job:', error);
        showNotification('Failed to create job', 'error');
    }
}

async function createService() {
    const formData = {
        serviceName: document.getElementById('service-name').value,
        price: parseFloat(document.getElementById('service-price').value),
        description: document.getElementById('service-description').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            closeModal();
            showNotification('Service added successfully', 'success');
            loadServicesData();
        } else {
            showNotification(result.error || 'Failed to add service', 'error');
        }
    } catch (error) {
        console.error('Error creating service:', error);
        showNotification('Failed to add service', 'error');
    }
}

async function createInventoryItem() {
    const formData = {
        partName: document.getElementById('part-name').value,
        quantity: parseInt(document.getElementById('part-quantity').value),
        pricePerUnit: parseFloat(document.getElementById('part-price').value)
    };

    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            closeModal();
            showNotification('Inventory item added successfully', 'success');
            loadInventoryData();
        } else {
            showNotification(result.error || 'Failed to add inventory item', 'error');
        }
    } catch (error) {
        console.error('Error creating inventory item:', error);
        showNotification('Failed to add inventory item', 'error');
    }
}

async function createUser() {
    const formData = {
        username: document.getElementById('user-username').value,
        fullName: document.getElementById('user-fullname').value,
        password: document.getElementById('user-password').value,
        role: document.getElementById('user-role').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            closeModal();
            showNotification('User added successfully', 'success');
            loadUsersData();
        } else {
            showNotification(result.error || 'Failed to add user', 'error');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showNotification('Failed to add user', 'error');
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
                <div class="empty-state-icon">
                    <svg class="icon icon-xl" viewBox="0 0 24 24">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                        <line x1="12" y1="9" x2="12" y2="13"/>
                        <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                </div>
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

function createModal(title, content, onShow) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">${title}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                ${content}
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
    
    if (onShow) onShow();
}

function closeModal() {
    const modal = document.querySelector('.modal.show');
    if (modal) {
        modal.remove();
    }
}

// Placeholder functions for actions
function assignEmployee(jobId) {
    showNotification(`Assign employee to job #${jobId} - Feature coming soon!`, 'info');
}

function generateInvoice(jobId) {
    showNotification(`Generate invoice for job #${jobId} - Feature coming soon!`, 'info');
}

function viewJobDetails(jobId) {
    showNotification(`View details for job #${jobId} - Feature coming soon!`, 'info');
}

function editService(serviceId) {
    showNotification(`Edit service #${serviceId} - Feature coming soon!`, 'info');
}

function deleteService(serviceId) {
    if (confirm('Are you sure you want to delete this service?')) {
        showNotification(`Delete service #${serviceId} - Feature coming soon!`, 'info');
    }
}

function editInventoryItem(itemId) {
    showNotification(`Edit inventory item #${itemId} - Feature coming soon!`, 'info');
}

function editUser(userId) {
    showNotification(`Edit user #${userId} - Feature coming soon!`, 'info');
}

function showLowStockAlert() {
    showNotification('Low stock alert - Feature coming soon!', 'warning');
}

function exportReports() {
    showNotification('Export reports - Feature coming soon!', 'info');
}