// Modern Admin Dashboard - Database-Driven Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Get user info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    const userName = urlParams.get('name');
    const userId = urlParams.get('id');
    
    // Auth check
    if (!userRole || userRole !== 'admin' || !userName || !userId) {
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
    initializeQuickActions();
    initializeSearch();
    initializeNotifications();
    
    // Load initial data
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
        case 'jobs':
            loadJobsData();
            break;
        case 'users':
            loadUsersData();
            break;
        case 'services':
            loadServicesData();
            break;
        case 'inventory':
            loadInventoryData();
            break;
        case 'branches':
            loadBranchesData();
            break;
        case 'invoices':
            loadInvoicesData();
            break;
        case 'payments':
            loadPaymentsData();
            break;
        case 'reports':
            loadReportsData();
            break;
        case 'settings':
            loadSettingsData();
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

// Quick Actions
function initializeQuickActions() {
    const quickActionButtons = document.querySelectorAll('.quick-action-btn');
    quickActionButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            handleQuickAction(action);
        });
    });
}

function handleQuickAction(action) {
    switch(action) {
        case 'add-job':
            showAddJobModal();
            break;
        case 'add-user':
            showAddUserModal();
            break;
        case 'add-service':
            showAddServiceModal();
            break;
        case 'add-inventory':
            showAddInventoryModal();
            break;
        case 'view-reports':
            switchToTab('reports');
            break;
        case 'manage-settings':
            switchToTab('settings');
            break;
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            if (query.length > 2) {
                performGlobalSearch(query);
            }
        });
    }
}

async function performGlobalSearch(query) {
    try {
        // Search across multiple endpoints
        const [jobsResponse, usersResponse, inventoryResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/admin/jobs`),
            fetch(`http://localhost:8080/api/admin/users`),
            fetch(`http://localhost:8080/api/admin/inventory`)
        ]);

        const jobs = jobsResponse.ok ? await jobsResponse.json() : [];
        const users = usersResponse.ok ? await usersResponse.json() : [];
        const inventory = inventoryResponse.ok ? await inventoryResponse.json() : [];

        // Filter results based on query
        const filteredJobs = jobs.filter(job => 
            job.customerName?.toLowerCase().includes(query.toLowerCase()) ||
            job.service?.toLowerCase().includes(query.toLowerCase()) ||
            job.jobId?.toString().includes(query)
        );

        const filteredUsers = users.filter(user => 
            user.fullName?.toLowerCase().includes(query.toLowerCase()) ||
            user.email?.toLowerCase().includes(query.toLowerCase()) ||
            user.username?.toLowerCase().includes(query.toLowerCase())
        );

        const filteredInventory = inventory.filter(item => 
            item.partName?.toLowerCase().includes(query.toLowerCase()) ||
            item.partNumber?.toLowerCase().includes(query.toLowerCase())
        );

        displaySearchResults(filteredJobs, filteredUsers, filteredInventory);
    } catch (error) {
        console.error('Error performing search:', error);
        showNotification('Search failed', 'error');
    }
}

function displaySearchResults(jobs, users, inventory) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    const totalResults = jobs.length + users.length + inventory.length;
    
    if (totalResults === 0) {
        searchResults.innerHTML = '<div class="no-results">No results found</div>';
        return;
    }

    let resultsHTML = '<div class="search-results-content">';
    
    if (jobs.length > 0) {
        resultsHTML += `
            <div class="search-section">
                <h4>Jobs (${jobs.length})</h4>
                ${jobs.slice(0, 3).map(job => `
                    <div class="search-result-item" onclick="viewJob(${job.jobId})">
                        <div class="result-title">Job #${job.jobId} - ${job.customerName}</div>
                        <div class="result-subtitle">${job.service} - ${job.status}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (users.length > 0) {
        resultsHTML += `
            <div class="search-section">
                <h4>Users (${users.length})</h4>
                ${users.slice(0, 3).map(user => `
                    <div class="search-result-item" onclick="viewUser(${user.id})">
                        <div class="result-title">${user.fullName}</div>
                        <div class="result-subtitle">${user.email} - ${user.role}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (inventory.length > 0) {
        resultsHTML += `
            <div class="search-section">
                <h4>Inventory (${inventory.length})</h4>
                ${inventory.slice(0, 3).map(item => `
                    <div class="search-result-item" onclick="viewInventory(${item.id})">
                        <div class="result-title">${item.partName}</div>
                        <div class="result-subtitle">${item.partNumber} - Stock: ${item.quantity}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    resultsHTML += '</div>';
    searchResults.innerHTML = resultsHTML;
}

// Notifications
function initializeNotifications() {
    // Check for new notifications periodically
    setInterval(checkForNotifications, 30000); // Check every 30 seconds
}

async function checkForNotifications() {
    try {
        // Check for low stock alerts
        const inventoryResponse = await fetch('http://localhost:8080/api/admin/inventory/alerts');
        if (inventoryResponse.ok) {
            const lowStockItems = await inventoryResponse.json();
            if (lowStockItems.length > 0) {
                showNotification(`${lowStockItems.length} items are running low on stock`, 'warning');
            }
        }

        // Check for overdue invoices
        const invoicesResponse = await fetch('http://localhost:8080/api/admin/invoices');
        if (invoicesResponse.ok) {
            const invoices = await invoicesResponse.json();
            const overdueInvoices = invoices.filter(invoice => 
                invoice.status === 'Sent' && new Date(invoice.dueDate) < new Date()
            );
            if (overdueInvoices.length > 0) {
                showNotification(`${overdueInvoices.length} invoices are overdue`, 'warning');
            }
        }
    } catch (error) {
        console.error('Error checking notifications:', error);
    }
}

// Overview Data Loading
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
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
    const totalCustomers = users.filter(user => user.role === 'customer').length;
    const totalEmployees = users.filter(user => user.role === 'employee').length;
    const lowStockCount = lowStockItems.length;

    return {
        totalJobs,
        activeJobs,
        completedJobs,
        totalCustomers,
        totalEmployees,
        lowStockCount
    };
}

function renderMetricsCards(metrics) {
    const metricsGrid = document.getElementById('metrics-grid');
    if (!metricsGrid) return;

    const cards = [
        {
            title: 'Total Jobs',
            value: metrics.totalJobs,
            icon: 'briefcase',
            color: 'primary',
            trend: '+12%',
            trendDirection: 'up'
        },
        {
            title: 'Active Jobs',
            value: metrics.activeJobs,
            icon: 'clock',
            color: 'warning',
            trend: '+5%',
            trendDirection: 'up'
        },
        {
            title: 'Total Customers',
            value: metrics.totalCustomers,
            icon: 'users',
            color: 'success',
            trend: '+8%',
            trendDirection: 'up'
        },
        {
            title: 'Low Stock Items',
            value: metrics.lowStockCount,
            icon: 'alert-triangle',
            color: 'danger',
            trend: '-2%',
            trendDirection: 'down'
        }
    ];

    metricsGrid.innerHTML = cards.map((card, index) => `
        <div class="metric-card" style="animation-delay: ${index * 0.1}s;">
            <div class="metric-header">
                <div class="metric-icon ${card.color}">
                    <svg class="icon" viewBox="0 0 24 24">
                        ${getIconSVG(card.icon)}
                    </svg>
                </div>
                <div class="metric-trend ${card.trendDirection}">
                    ${card.trend}
                </div>
            </div>
            <div class="metric-value">${card.value}</div>
            <div class="metric-label">${card.title}</div>
        </div>
    `).join('');
}

function getIconSVG(iconName) {
    const icons = {
        briefcase: '<path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
        clock: '<circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/>',
        users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'alert-triangle': '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>'
    };
    return icons[iconName] || '';
}

function generateSimpleCharts(jobs) {
    // Generate revenue chart
    const revenueChart = document.getElementById('overview-revenue-chart');
    if (revenueChart) {
        const revenueData = calculateRevenueData(jobs);
        createRevenueChart(revenueChart, revenueData);
    }

    // Generate service distribution chart
    const serviceChart = document.getElementById('overview-service-chart');
    if (serviceChart) {
        const serviceData = calculateServiceData(jobs);
        createServiceChart(serviceChart, serviceData);
    }
}

function calculateRevenueData(jobs) {
    // Group jobs by month and calculate revenue
    const monthlyRevenue = {};
    jobs.forEach(job => {
        if (job.totalCost) {
            const month = new Date(job.bookingDate).toLocaleDateString('en-US', { month: 'short' });
            monthlyRevenue[month] = (monthlyRevenue[month] || 0) + parseFloat(job.totalCost);
        }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
        label: month,
        value: revenue
    }));
}

function calculateStatusData(jobs) {
    const statusCount = {};
    jobs.forEach(job => {
        statusCount[job.status] = (statusCount[job.status] || 0) + 1;
    });

    return Object.entries(statusCount).map(([status, count]) => ({
        label: status,
        value: count
    }));
}

function calculateServiceData(jobs) {
    const serviceCount = {};
    jobs.forEach(job => {
        serviceCount[job.service] = (serviceCount[job.service] || 0) + 1;
    });

    return Object.entries(serviceCount).map(([service, count]) => ({
        label: service,
        value: count
    }));
}

function createRevenueChart(container, data) {
    // Clear container
    container.innerHTML = '<canvas id="revenue-chart-canvas"></canvas>';
    
    const ctx = document.getElementById('revenue-chart-canvas');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                label: 'Revenue',
                data: data.map(d => d.value),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Revenue Trend'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

function createServiceChart(container, data) {
    // Clear container
    container.innerHTML = '<canvas id="service-chart-canvas"></canvas>';
    
    const ctx = document.getElementById('service-chart-canvas');
    if (!ctx) return;

    const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(d => d.label),
            datasets: [{
                data: data.map(d => d.value),
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Service Distribution'
                },
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
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

// Data Loading Functions
async function loadJobsData() {
    try {
        showLoadingState('jobs-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        renderJobsTable(jobs);
        
    } catch (error) {
        console.error('Error loading jobs:', error);
        showErrorState('jobs-table-body', 'Failed to load jobs');
    }
}

function renderJobsTable(jobs) {
    const tableBody = document.getElementById('jobs-table-body');
    if (!tableBody) return;
    
    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>No jobs found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = jobs.map(job => `
        <tr>
            <td>#${job.jobId}</td>
            <td>${job.customerName}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td>
                <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">
                    ${job.status}
                </span>
            </td>
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewJob(${job.jobId})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editJob(${job.jobId})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="assignEmployee(${job.jobId})">Assign</button>
                </div>
            </td>
        </tr>
    `).join('');
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
    if (!tableBody) return;
    
    if (users.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>No users found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>
                <span class="role-badge role-${user.role}">${user.role}</span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewUser(${user.id})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editUser(${user.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="toggleUserStatus(${user.id})">
                        ${user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
    if (!tableBody) return;
    
    if (services.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="no-data">
                    <p>No services found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = services.map(service => `
        <tr>
            <td>${service.serviceName}</td>
            <td>$${service.price}</td>
            <td>${service.category}</td>
            <td>${service.estimatedDuration} min</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewService(${service.id})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editService(${service.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="toggleServiceStatus(${service.id})">
                        ${service.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
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
    if (!tableBody) return;
    
    if (inventory.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>No inventory items found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = inventory.map(item => `
        <tr class="${item.quantity <= item.minQuantity ? 'low-stock' : ''}">
            <td>${item.partName}</td>
            <td>${item.partNumber}</td>
            <td>${item.quantity}</td>
            <td>${item.minQuantity}</td>
            <td>$${item.pricePerUnit}</td>
            <td>${item.category}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewInventory(${item.id})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editInventory(${item.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="reorderInventory(${item.id})">Reorder</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadBranchesData() {
    try {
        showLoadingState('branches-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/branches');
        if (!response.ok) throw new Error('Failed to fetch branches');
        
        const branches = await response.json();
        renderBranchesTable(branches);
    } catch (error) {
        console.error('Error loading branches:', error);
        showErrorState('branches-table-body', 'Failed to load branches');
    }
}

function renderBranchesTable(branches) {
    const tableBody = document.getElementById('branches-table-body');
    if (!tableBody) return;
    
    if (branches.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">
                    <p>No branches found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = branches.map(branch => `
        <tr>
            <td>${branch.name}</td>
            <td>${branch.address}</td>
            <td>${branch.phone || 'N/A'}</td>
            <td>${branch.email || 'N/A'}</td>
            <td>${branch.rating || 'N/A'} ⭐</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewBranch(${branch.id})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editBranch(${branch.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="manageBranchHours(${branch.id})">Hours</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadInvoicesData() {
    try {
        showLoadingState('invoices-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/invoices');
        if (!response.ok) throw new Error('Failed to fetch invoices');
        
        const invoices = await response.json();
        renderInvoicesTable(invoices);
        
    } catch (error) {
        console.error('Error loading invoices:', error);
        showErrorState('invoices-table-body', 'Failed to load invoices');
    }
}

function renderInvoicesTable(invoices) {
    const tableBody = document.getElementById('invoices-table-body');
    if (!tableBody) return;
    
    if (invoices.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>No invoices found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = invoices.map(invoice => `
        <tr>
            <td>${invoice.invoiceNumber}</td>
            <td>${invoice.customerName}</td>
            <td>${invoice.serviceName}</td>
            <td>$${invoice.totalAmount}</td>
            <td>
                <span class="status-badge status-${invoice.status.toLowerCase()}">
                    ${invoice.status}
                </span>
            </td>
            <td>${new Date(invoice.dueDate).toLocaleDateString()}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewInvoice(${invoice.id})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editInvoice(${invoice.id})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="sendInvoice(${invoice.id})">Send</button>
                </div>
            </td>
        </tr>
    `).join('');
}

async function loadPaymentsData() {
    try {
        showLoadingState('payments-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/payments');
        if (!response.ok) throw new Error('Failed to fetch payments');
        
        const payments = await response.json();
        renderPaymentsTable(payments);
        
    } catch (error) {
        console.error('Error loading payments:', error);
        showErrorState('payments-table-body', 'Failed to load payments');
    }
}

function renderPaymentsTable(payments) {
    const tableBody = document.getElementById('payments-table-body');
    if (!tableBody) return;
    
    if (payments.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>No payments found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = payments.map(payment => `
        <tr>
            <td>${payment.transactionId || 'N/A'}</td>
            <td>${payment.customerName}</td>
            <td>${payment.invoiceNumber}</td>
            <td>$${payment.amount}</td>
            <td>${payment.paymentMethod}</td>
            <td>
                <span class="status-badge status-${payment.paymentStatus.toLowerCase()}">
                    ${payment.paymentStatus}
                </span>
            </td>
            <td>${new Date(payment.paymentDate).toLocaleDateString()}</td>
        </tr>
    `).join('');
}

async function loadReportsData() {
    try {
        console.log('Loading reports data...');
        
        // Load summary metrics
        await loadReportsSummary();
        
        // Load main charts
        await loadRevenueChart();
        await loadServiceDistributionChart();
        await loadEmployeePerformanceChart();
        await loadInventoryStatusChart();
        await loadCustomerActivityChart();
        
        // Load detailed reports
        await loadTopServicesReport();
        
        // Initialize report tabs
        initializeReportTabs();
        
        // Initialize chart buttons
        initializeChartButtons();
        
    } catch (error) {
        console.error('Error loading reports data:', error);
        showNotification('Failed to load reports data', 'error');
    }
}

async function loadReportsSummary() {
    try {
        // Load dashboard stats for summary cards
        const statsResponse = await fetch('http://localhost:8080/api/admin/dashboard');
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            
            // Update summary cards
            document.getElementById('total-revenue').textContent = '$' + (stats.totalRevenue || 0).toLocaleString();
            document.getElementById('jobs-completed').textContent = stats.completedJobs || 0;
            document.getElementById('new-customers').textContent = stats.totalCustomers || 0;
            document.getElementById('avg-rating').textContent = '4.5'; // Placeholder
            
            // Calculate changes (placeholder - would need historical data)
            document.getElementById('revenue-change').textContent = '+12.5%';
            document.getElementById('jobs-change').textContent = '+8.2%';
            document.getElementById('customers-change').textContent = '+15.3%';
            document.getElementById('rating-change').textContent = '+2.1%';
        }
    } catch (error) {
        console.error('Error loading summary data:', error);
    }
}

async function loadRevenueChart() {
    try {
        const revenueResponse = await fetch('http://localhost:8080/api/admin/reports/revenue');
        if (revenueResponse.ok) {
            const revenue = await revenueResponse.json();
            
            const revenueChart = document.getElementById('revenue-chart-canvas');
            if (revenueChart) {
                new Chart(revenueChart, {
                    type: 'line',
                    data: {
                        labels: revenue.map(r => r.month),
                        datasets: [{
                            label: 'Revenue',
                            data: revenue.map(r => parseFloat(r.totalRevenue || 0)),
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true,
                            pointBackgroundColor: '#3b82f6',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: 6
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return '$' + value.toLocaleString();
                                    }
                                }
                            }
                        },
                        elements: {
                            point: {
                                hoverRadius: 8
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading revenue chart:', error);
        showChartPlaceholder('revenue-chart', 'Revenue data unavailable');
    }
}

async function loadServiceDistributionChart() {
    try {
        const partUsageResponse = await fetch('http://localhost:8080/api/admin/reports/part-usage');
        if (partUsageResponse.ok) {
            const partUsage = await partUsageResponse.json();
            const colors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];
            
            const serviceChart = document.getElementById('parts-usage-chart-canvas');
            if (serviceChart) {
                new Chart(serviceChart, {
                    type: 'doughnut',
                    data: {
                        labels: partUsage.slice(0, 8).map(p => p.partName),
                        datasets: [{
                            data: partUsage.slice(0, 8).map(p => p.totalUsed),
                            backgroundColor: colors.slice(0, partUsage.length),
                            borderWidth: 2,
                            borderColor: '#ffffff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    padding: 20,
                                    usePointStyle: true,
                                    font: {
                                        size: 12
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading service distribution chart:', error);
        showChartPlaceholder('parts-usage-chart', 'Service data unavailable');
    }
}

async function loadEmployeePerformanceChart() {
    try {
        const performanceResponse = await fetch('http://localhost:8080/api/admin/reports/employee-performance');
        if (performanceResponse.ok) {
            const performance = await performanceResponse.json();
            
            const performanceChart = document.getElementById('employee-performance-chart-canvas');
            if (performanceChart) {
                new Chart(performanceChart, {
                    type: 'bar',
                    data: {
                        labels: performance.map(p => p.employeeName),
                        datasets: [{
                            label: 'Jobs Completed',
                            data: performance.map(p => p.jobsCompleted),
                            backgroundColor: '#3b82f6',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading employee performance chart:', error);
        showChartPlaceholder('employee-performance-chart', 'Performance data unavailable');
    }
}

async function loadInventoryStatusChart() {
    try {
        const inventoryResponse = await fetch('http://localhost:8080/api/admin/reports/inventory-status');
        if (inventoryResponse.ok) {
            const inventory = await inventoryResponse.json();
            
            if (inventory.length > 0) {
                const status = inventory[0];
                const inventoryChart = document.getElementById('inventory-chart-canvas');
                if (inventoryChart) {
                    new Chart(inventoryChart, {
                        type: 'doughnut',
                        data: {
                            labels: ['In Stock', 'Low Stock', 'Out of Stock'],
                            datasets: [{
                                data: [status.inStock, status.lowStock, status.outOfStock],
                                backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
                                borderWidth: 2,
                                borderColor: '#ffffff'
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 20,
                                        usePointStyle: true
                                    }
                                }
                            }
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error loading inventory status chart:', error);
        showChartPlaceholder('inventory-chart', 'Inventory data unavailable');
    }
}

async function loadCustomerActivityChart() {
    try {
        const activityResponse = await fetch('http://localhost:8080/api/admin/reports/customer-activity');
        if (activityResponse.ok) {
            const activity = await activityResponse.json();
            
            const activityChart = document.getElementById('customer-activity-chart-canvas');
            if (activityChart) {
                new Chart(activityChart, {
                    type: 'line',
                    data: {
                        labels: activity.map(a => a.month),
                        datasets: [{
                            label: 'New Customers',
                            data: activity.map(a => a.newCustomers),
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error loading customer activity chart:', error);
        showChartPlaceholder('customer-activity-chart', 'Customer data unavailable');
    }
}

async function loadTopServicesReport() {
    try {
        const servicesResponse = await fetch('http://localhost:8080/api/admin/reports/top-services');
        if (servicesResponse.ok) {
            const services = await servicesResponse.json();
            
            const tableBody = document.getElementById('top-services-table-body');
            if (tableBody) {
                tableBody.innerHTML = services.map(service => `
                    <tr>
                        <td>${service.serviceName}</td>
                        <td>$${service.totalRevenue.toLocaleString()}</td>
                        <td>${service.jobCount}</td>
                        <td>${service.avgRating} ⭐</td>
                        <td><span class="trend-indicator positive">↗ +12%</span></td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading top services report:', error);
    }
}

function showChartPlaceholder(containerId, message) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="chart-placeholder">
                <svg class="icon icon-xl" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10,9 9,9 8,9"/>
                </svg>
                <p>${message}</p>
            </div>
        `;
    }
}

function initializeReportTabs() {
    const tabButtons = document.querySelectorAll('.report-tab-btn');
    const reportContents = document.querySelectorAll('.report-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            reportContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show corresponding content
            const targetContent = document.getElementById(`${targetTab}-content`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
}

function initializeChartButtons() {
    const chartButtons = document.querySelectorAll('.chart-btn');
    
    chartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const chartType = button.getAttribute('data-chart');
            const buttonGroup = button.parentElement;
            
            // Remove active class from all buttons in the group
            buttonGroup.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Here you would typically reload the chart with different data
            console.log(`Switched to ${chartType} chart`);
        });
    });
}

async function loadSettingsData() {
    try {
        showLoadingState('settings-container');
        
        const response = await fetch('http://localhost:8080/api/admin/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        
        const settings = await response.json();
        renderSettingsForm(settings);
        
    } catch (error) {
        console.error('Error loading settings:', error);
        showErrorState('settings-container', 'Failed to load settings');
    }
}

function renderSettingsForm(settings) {
    const container = document.getElementById('settings-container');
    if (!container) return;
    
    const publicSettings = settings.filter(setting => setting.isPublic);
    
    container.innerHTML = `
        <div class="settings-form">
            <h3>System Settings</h3>
            ${publicSettings.map(setting => `
                <div class="form-group">
                    <label for="${setting.key}">${setting.description || setting.key}</label>
                    <input type="${getInputType(setting.type)}" 
                           id="${setting.key}" 
                           value="${setting.value}"
                           ${setting.type === 'boolean' ? 'checked="' + (setting.value === 'true') + '"' : ''}>
                </div>
            `).join('')}
            <div class="form-actions">
                <button class="btn btn-primary" onclick="saveSettings()">Save Settings</button>
                <button class="btn btn-secondary" onclick="resetSettings()">Reset to Default</button>
            </div>
        </div>
    `;
}

function getInputType(settingType) {
    switch(settingType) {
        case 'number': return 'number';
        case 'boolean': return 'checkbox';
        default: return 'text';
    }
}

// Action Functions
function viewJob(jobId) {
    // Fetch job details and show modal
    fetch(`http://localhost:8080/api/admin/jobs/${jobId}`)
        .then(response => response.json())
        .then(job => {
            createJobDetailsModal(job);
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            showNotification('Failed to load job details', 'error');
        });
}

function editJob(jobId) {
    // Fetch job details and show edit modal
    fetch(`http://localhost:8080/api/admin/jobs/${jobId}`)
        .then(response => response.json())
        .then(job => {
            createJobEditModal(job);
        })
        .catch(error => {
            console.error('Error fetching job details:', error);
            showNotification('Failed to load job details', 'error');
        });
}

function assignEmployee(jobId) {
    // Fetch available employees and show assignment modal
    fetch('http://localhost:8080/api/admin/users')
        .then(response => response.json())
        .then(users => {
            const employees = users.filter(user => user.role === 'employee');
            createEmployeeAssignmentModal(jobId, employees);
        })
        .catch(error => {
            console.error('Error fetching employees:', error);
            showNotification('Failed to load employees', 'error');
        });
}

function viewUser(userId) {
    // Fetch user details and show modal
    fetch(`http://localhost:8080/api/admin/users/${userId}`)
        .then(response => response.json())
        .then(user => {
            createUserDetailsModal(user);
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            showNotification('Failed to load user details', 'error');
        });
}

function editUser(userId) {
    // Fetch user details and show edit modal
    fetch(`http://localhost:8080/api/admin/users/${userId}`)
        .then(response => response.json())
        .then(user => {
            createUserEditModal(user);
        })
        .catch(error => {
            console.error('Error fetching user details:', error);
            showNotification('Failed to load user details', 'error');
        });
}

function toggleUserStatus(userId) {
    if (confirm('Are you sure you want to toggle this user\'s status?')) {
        fetch(`http://localhost:8080/api/admin/users/${userId}/toggle-status`, {
            method: 'PUT'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('User status updated successfully', 'success');
                loadUsersData(); // Refresh the table
            } else {
                showNotification('Failed to update user status', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating user status:', error);
            showNotification('Failed to update user status', 'error');
        });
    }
}

function viewService(serviceId) {
    // Fetch service details and show modal
    fetch(`http://localhost:8080/api/admin/services/${serviceId}`)
        .then(response => response.json())
        .then(service => {
            createServiceDetailsModal(service);
        })
        .catch(error => {
            console.error('Error fetching service details:', error);
            showNotification('Failed to load service details', 'error');
        });
}

function editService(serviceId) {
    // Fetch service details and show edit modal
    fetch(`http://localhost:8080/api/admin/services/${serviceId}`)
        .then(response => response.json())
        .then(service => {
            createServiceEditModal(service);
        })
        .catch(error => {
            console.error('Error fetching service details:', error);
            showNotification('Failed to load service details', 'error');
        });
}

function toggleServiceStatus(serviceId) {
    if (confirm('Are you sure you want to toggle this service\'s status?')) {
        fetch(`http://localhost:8080/api/admin/services/${serviceId}/toggle-status`, {
            method: 'PUT'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Service status updated successfully', 'success');
                loadServicesData(); // Refresh the table
            } else {
                showNotification('Failed to update service status', 'error');
            }
        })
        .catch(error => {
            console.error('Error updating service status:', error);
            showNotification('Failed to update service status', 'error');
        });
    }
}

function viewInventory(itemId) {
    // Fetch inventory details and show modal
    fetch(`http://localhost:8080/api/admin/inventory/${itemId}`)
        .then(response => response.json())
        .then(item => {
            createInventoryDetailsModal(item);
        })
        .catch(error => {
            console.error('Error fetching inventory details:', error);
            showNotification('Failed to load inventory details', 'error');
        });
}

function editInventory(itemId) {
    // Fetch inventory details and show edit modal
    fetch(`http://localhost:8080/api/admin/inventory/${itemId}`)
        .then(response => response.json())
        .then(item => {
            createInventoryEditModal(item);
        })
        .catch(error => {
            console.error('Error fetching inventory details:', error);
            showNotification('Failed to load inventory details', 'error');
        });
}

function reorderInventory(itemId) {
    // Fetch inventory details and show reorder modal
    fetch(`http://localhost:8080/api/admin/inventory/${itemId}`)
        .then(response => response.json())
        .then(item => {
            createInventoryReorderModal(item);
        })
        .catch(error => {
            console.error('Error fetching inventory details:', error);
            showNotification('Failed to load inventory details', 'error');
        });
}

function viewBranch(branchId) {
    // Fetch branch details and show modal
    fetch(`http://localhost:8080/api/admin/branches/${branchId}`)
        .then(response => response.json())
        .then(branch => {
            createBranchDetailsModal(branch);
        })
        .catch(error => {
            console.error('Error fetching branch details:', error);
            showNotification('Failed to load branch details', 'error');
        });
}

function editBranch(branchId) {
    // Fetch branch details and show edit modal
    fetch(`http://localhost:8080/api/admin/branches/${branchId}`)
        .then(response => response.json())
        .then(branch => {
            createBranchEditModal(branch);
        })
        .catch(error => {
            console.error('Error fetching branch details:', error);
            showNotification('Failed to load branch details', 'error');
        });
}

function manageBranchHours(branchId) {
    // Fetch branch details and show hours management modal
    fetch(`http://localhost:8080/api/admin/branches/${branchId}`)
        .then(response => response.json())
        .then(branch => {
            createBranchHoursModal(branch);
        })
        .catch(error => {
            console.error('Error fetching branch details:', error);
            showNotification('Failed to load branch details', 'error');
        });
}

function viewInvoice(invoiceId) {
    // Fetch invoice details and show modal
    fetch(`http://localhost:8080/api/admin/invoices/${invoiceId}`)
        .then(response => response.json())
        .then(invoice => {
            createInvoiceDetailsModal(invoice);
        })
        .catch(error => {
            console.error('Error fetching invoice details:', error);
            showNotification('Failed to load invoice details', 'error');
        });
}

function editInvoice(invoiceId) {
    // Fetch invoice details and show edit modal
    fetch(`http://localhost:8080/api/admin/invoices/${invoiceId}`)
        .then(response => response.json())
        .then(invoice => {
            createInvoiceEditModal(invoice);
        })
        .catch(error => {
            console.error('Error fetching invoice details:', error);
            showNotification('Failed to load invoice details', 'error');
        });
}

function sendInvoice(invoiceId) {
    if (confirm('Are you sure you want to send this invoice?')) {
        fetch(`http://localhost:8080/api/admin/invoices/${invoiceId}/send`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                showNotification('Invoice sent successfully', 'success');
                loadInvoicesData(); // Refresh the table
            } else {
                showNotification('Failed to send invoice', 'error');
            }
        })
        .catch(error => {
            console.error('Error sending invoice:', error);
            showNotification('Failed to send invoice', 'error');
        });
    }
}

// Modal Functions
function showAddJobModal() {
    showNotification('Opening add job modal', 'info');
    // Implementation for add job modal
}

function showAddUserModal() {
    showNotification('Opening add user modal', 'info');
    // Implementation for add user modal
}

function showAddServiceModal() {
    showNotification('Opening add service modal', 'info');
    // Implementation for add service modal
}

function showAddInventoryModal() {
    showNotification('Opening add inventory modal', 'info');
    // Implementation for add inventory modal
}

// Settings Functions
async function saveSettings() {
    showNotification('Saving settings...', 'info');
    // Implementation for saving settings
}

function resetSettings() {
    showNotification('Resetting settings to default', 'info');
    // Implementation for resetting settings
}

// Utility Functions
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

function showErrorState(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button class="btn btn-sm btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
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
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
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
                            <label>Assigned Employee:</label>
                            <span>${job.assignedEmployee || 'Unassigned'}</span>
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
                            Schedule & Cost
                        </h4>
                        <div class="detail-item">
                            <label>Booking Date:</label>
                            <span>${job.bookingDate ? new Date(job.bookingDate).toLocaleString() : 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Completion Date:</label>
                            <span>${job.completionDate ? new Date(job.completionDate).toLocaleString() : 'Not completed'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Cost:</label>
                            <span>${job.totalCost ? '$' + job.totalCost : 'Not calculated'}</span>
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
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="editJob(${job.jobId})">Edit Job</button>
                ${!job.assignedEmployee ? `<button class="btn btn-success" onclick="assignEmployee(${job.jobId})">Assign Employee</button>` : ''}
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

function createJobEditModal(job) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Job - #${job.jobId}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="job-edit-form">
                    <div class="form-group">
                        <label for="edit-job-status" class="form-label">Status</label>
                        <select id="edit-job-status" class="form-input" required>
                            <option value="Booked" ${job.status === 'Booked' ? 'selected' : ''}>Booked</option>
                            <option value="In Progress" ${job.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                            <option value="Completed" ${job.status === 'Completed' ? 'selected' : ''}>Completed</option>
                            <option value="Invoiced" ${job.status === 'Invoiced' ? 'selected' : ''}>Invoiced</option>
                            <option value="Paid" ${job.status === 'Paid' ? 'selected' : ''}>Paid</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-job-service" class="form-label">Service</label>
                        <input type="text" id="edit-job-service" class="form-input" value="${job.service || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-job-notes" class="form-label">Notes</label>
                        <textarea id="edit-job-notes" class="form-input" rows="3">${job.notes || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="edit-job-cost" class="form-label">Total Cost</label>
                        <input type="number" id="edit-job-cost" class="form-input" step="0.01" value="${job.totalCost || ''}" placeholder="Enter total cost">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitJobEdit(${job.jobId})">Save Changes</button>
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

function createEmployeeAssignmentModal(jobId, employees) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Assign Employee to Job #${jobId}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="employee-assignment-form">
                    <div class="form-group">
                        <label for="assign-employee" class="form-label">Select Employee</label>
                        <select id="assign-employee" class="form-input" required>
                            <option value="">Choose an employee...</option>
                            ${employees.map(emp => `
                                <option value="${emp.id}">${emp.fullName} (${emp.username})</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="assignment-notes" class="form-label">Assignment Notes</label>
                        <textarea id="assignment-notes" class="form-input" rows="3" placeholder="Any special instructions for the employee..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitEmployeeAssignment(${jobId})">Assign Employee</button>
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

function createUserDetailsModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">User Details - ${user.fullName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="user-details-grid">
                    <div class="details-section">
                        <h4>Personal Information</h4>
                        <div class="detail-item">
                            <label>Full Name:</label>
                            <span>${user.fullName}</span>
                        </div>
                        <div class="detail-item">
                            <label>Username:</label>
                            <span>${user.username}</span>
                        </div>
                        <div class="detail-item">
                            <label>Email:</label>
                            <span>${user.email || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Phone:</label>
                            <span>${user.phone || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="details-section">
                        <h4>Account Information</h4>
                        <div class="detail-item">
                            <label>Role:</label>
                            <span class="role-badge role-${user.role}">${user.role}</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">${user.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Created:</label>
                            <span>${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="editUser(${user.id})">Edit User</button>
                <button class="btn btn-warning" onclick="toggleUserStatus(${user.id})">${user.isActive ? 'Deactivate' : 'Activate'}</button>
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

function createUserEditModal(user) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit User - ${user.fullName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="user-edit-form">
                    <div class="form-group">
                        <label for="edit-user-fullname" class="form-label">Full Name</label>
                        <input type="text" id="edit-user-fullname" class="form-input" value="${user.fullName}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-email" class="form-label">Email</label>
                        <input type="email" id="edit-user-email" class="form-input" value="${user.email || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-user-phone" class="form-label">Phone</label>
                        <input type="tel" id="edit-user-phone" class="form-input" value="${user.phone || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-user-role" class="form-label">Role</label>
                        <select id="edit-user-role" class="form-input" required>
                            <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                            <option value="employee" ${user.role === 'employee' ? 'selected' : ''}>Employee</option>
                            <option value="customer" ${user.role === 'customer' ? 'selected' : ''}>Customer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="edit-user-password" class="form-label">New Password (leave blank to keep current)</label>
                        <input type="password" id="edit-user-password" class="form-input" placeholder="Enter new password">
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitUserEdit(${user.id})">Save Changes</button>
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

function createServiceDetailsModal(service) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Service Details - ${service.serviceName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="service-details-grid">
                    <div class="details-section">
                        <h4>Service Information</h4>
                        <div class="detail-item">
                            <label>Service Name:</label>
                            <span>${service.serviceName}</span>
                        </div>
                        <div class="detail-item">
                            <label>Price:</label>
                            <span>$${service.price}</span>
                        </div>
                        <div class="detail-item">
                            <label>Category:</label>
                            <span>${service.category || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Estimated Duration:</label>
                            <span>${service.estimatedDuration} minutes</span>
                        </div>
                        <div class="detail-item">
                            <label>Status:</label>
                            <span class="status-badge ${service.isActive ? 'status-active' : 'status-inactive'}">${service.isActive ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    ${service.description ? `
                        <div class="details-section">
                            <h4>Description</h4>
                            <p>${service.description}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="editService(${service.id})">Edit Service</button>
                <button class="btn btn-warning" onclick="toggleServiceStatus(${service.id})">${service.isActive ? 'Deactivate' : 'Activate'}</button>
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

function createServiceEditModal(service) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Service - ${service.serviceName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="service-edit-form">
                    <div class="form-group">
                        <label for="edit-service-name" class="form-label">Service Name</label>
                        <input type="text" id="edit-service-name" class="form-input" value="${service.serviceName}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-service-price" class="form-label">Price</label>
                        <input type="number" id="edit-service-price" class="form-input" step="0.01" value="${service.price}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-service-category" class="form-label">Category</label>
                        <input type="text" id="edit-service-category" class="form-input" value="${service.category || ''}" placeholder="e.g., Engine, Brakes, Electrical">
                    </div>
                    <div class="form-group">
                        <label for="edit-service-duration" class="form-label">Estimated Duration (minutes)</label>
                        <input type="number" id="edit-service-duration" class="form-input" value="${service.estimatedDuration}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-service-description" class="form-label">Description</label>
                        <textarea id="edit-service-description" class="form-input" rows="3">${service.description || ''}</textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitServiceEdit(${service.id})">Save Changes</button>
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

function createInventoryDetailsModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Inventory Details - ${item.partName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="inventory-details-grid">
                    <div class="details-section">
                        <h4>Part Information</h4>
                        <div class="detail-item">
                            <label>Part Name:</label>
                            <span>${item.partName}</span>
                        </div>
                        <div class="detail-item">
                            <label>Part Number:</label>
                            <span>${item.partNumber || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Category:</label>
                            <span>${item.category || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <label>Supplier:</label>
                            <span>${item.supplier || 'N/A'}</span>
                        </div>
                    </div>
                    <div class="details-section">
                        <h4>Stock Information</h4>
                        <div class="detail-item">
                            <label>Current Stock:</label>
                            <span class="${item.quantity <= item.minQuantity ? 'text-warning' : 'text-success'}">${item.quantity} units</span>
                        </div>
                        <div class="detail-item">
                            <label>Minimum Stock:</label>
                            <span>${item.minQuantity} units</span>
                        </div>
                        <div class="detail-item">
                            <label>Price per Unit:</label>
                            <span>$${item.pricePerUnit}</span>
                        </div>
                        <div class="detail-item">
                            <label>Total Value:</label>
                            <span>$${(item.quantity * item.pricePerUnit).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Close</button>
                <button class="btn btn-primary" onclick="editInventory(${item.id})">Edit Item</button>
                <button class="btn btn-warning" onclick="reorderInventory(${item.id})">Reorder</button>
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

function createInventoryEditModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Edit Inventory - ${item.partName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="inventory-edit-form">
                    <div class="form-group">
                        <label for="edit-part-name" class="form-label">Part Name</label>
                        <input type="text" id="edit-part-name" class="form-input" value="${item.partName}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-part-number" class="form-label">Part Number</label>
                        <input type="text" id="edit-part-number" class="form-input" value="${item.partNumber || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-part-category" class="form-label">Category</label>
                        <input type="text" id="edit-part-category" class="form-input" value="${item.category || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-part-supplier" class="form-label">Supplier</label>
                        <input type="text" id="edit-part-supplier" class="form-input" value="${item.supplier || ''}">
                    </div>
                    <div class="form-group">
                        <label for="edit-part-quantity" class="form-label">Current Quantity</label>
                        <input type="number" id="edit-part-quantity" class="form-input" value="${item.quantity}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-part-min-quantity" class="form-label">Minimum Quantity</label>
                        <input type="number" id="edit-part-min-quantity" class="form-input" value="${item.minQuantity}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-part-price" class="form-label">Price per Unit</label>
                        <input type="number" id="edit-part-price" class="form-input" step="0.01" value="${item.pricePerUnit}" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitInventoryEdit(${item.id})">Save Changes</button>
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

function createInventoryReorderModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Reorder Inventory - ${item.partName}</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <div class="reorder-info">
                    <p><strong>Current Stock:</strong> ${item.quantity} units</p>
                    <p><strong>Minimum Stock:</strong> ${item.minQuantity} units</p>
                    <p><strong>Recommended Order:</strong> ${Math.max(10, item.minQuantity * 2)} units</p>
                </div>
                <form id="reorder-form">
                    <div class="form-group">
                        <label for="reorder-quantity" class="form-label">Order Quantity</label>
                        <input type="number" id="reorder-quantity" class="form-input" value="${Math.max(10, item.minQuantity * 2)}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="reorder-notes" class="form-label">Order Notes</label>
                        <textarea id="reorder-notes" class="form-input" rows="3" placeholder="Any special instructions for the order..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitReorder(${item.id})">Place Order</button>
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

// Additional modal functions for branches, invoices, etc.
function createBranchDetailsModal(branch) {
    // Implementation for branch details modal
    showNotification('Branch details modal - Implementation coming soon', 'info');
}

function createBranchEditModal(branch) {
    // Implementation for branch edit modal
    showNotification('Branch edit modal - Implementation coming soon', 'info');
}

function createBranchHoursModal(branch) {
    // Implementation for branch hours modal
    showNotification('Branch hours modal - Implementation coming soon', 'info');
}

function createInvoiceDetailsModal(invoice) {
    // Implementation for invoice details modal
    showNotification('Invoice details modal - Implementation coming soon', 'info');
}

function createInvoiceEditModal(invoice) {
    // Implementation for invoice edit modal
    showNotification('Invoice edit modal - Implementation coming soon', 'info');
}

// Form Submission Functions
function submitJobEdit(jobId) {
    const formData = {
        status: document.getElementById('edit-job-status').value,
        service: document.getElementById('edit-job-service').value,
        notes: document.getElementById('edit-job-notes').value,
        totalCost: document.getElementById('edit-job-cost').value || null
    };

    fetch(`http://localhost:8080/api/admin/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Job updated successfully', 'success');
            closeModal();
            loadJobsData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update job', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating job:', error);
        showNotification('Failed to update job', 'error');
    });
}

function submitEmployeeAssignment(jobId) {
    const formData = {
        employeeId: document.getElementById('assign-employee').value,
        notes: document.getElementById('assignment-notes').value
    };

    if (!formData.employeeId) {
        showNotification('Please select an employee', 'error');
        return;
    }

    fetch(`http://localhost:8080/api/admin/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Employee assigned successfully', 'success');
            closeModal();
            loadJobsData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to assign employee', 'error');
        }
    })
    .catch(error => {
        console.error('Error assigning employee:', error);
        showNotification('Failed to assign employee', 'error');
    });
}

function submitUserEdit(userId) {
    const formData = {
        fullName: document.getElementById('edit-user-fullname').value,
        email: document.getElementById('edit-user-email').value,
        phone: document.getElementById('edit-user-phone').value,
        role: document.getElementById('edit-user-role').value,
        password: document.getElementById('edit-user-password').value || null
    };

    fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('User updated successfully', 'success');
            closeModal();
            loadUsersData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update user', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating user:', error);
        showNotification('Failed to update user', 'error');
    });
}

function submitServiceEdit(serviceId) {
    const formData = {
        serviceName: document.getElementById('edit-service-name').value,
        price: parseFloat(document.getElementById('edit-service-price').value),
        category: document.getElementById('edit-service-category').value,
        estimatedDuration: parseInt(document.getElementById('edit-service-duration').value),
        description: document.getElementById('edit-service-description').value
    };

    fetch(`http://localhost:8080/api/admin/services/${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Service updated successfully', 'success');
            closeModal();
            loadServicesData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update service', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating service:', error);
        showNotification('Failed to update service', 'error');
    });
}

function submitInventoryEdit(itemId) {
    const formData = {
        partName: document.getElementById('edit-part-name').value,
        partNumber: document.getElementById('edit-part-number').value,
        category: document.getElementById('edit-part-category').value,
        supplier: document.getElementById('edit-part-supplier').value,
        quantity: parseInt(document.getElementById('edit-part-quantity').value),
        minQuantity: parseInt(document.getElementById('edit-part-min-quantity').value),
        pricePerUnit: parseFloat(document.getElementById('edit-part-price').value)
    };

    fetch(`http://localhost:8080/api/admin/inventory/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Inventory item updated successfully', 'success');
            closeModal();
            loadInventoryData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to update inventory item', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating inventory item:', error);
        showNotification('Failed to update inventory item', 'error');
    });
}

function submitReorder(itemId) {
    const formData = {
        quantity: parseInt(document.getElementById('reorder-quantity').value),
        notes: document.getElementById('reorder-notes').value
    };

    fetch(`http://localhost:8080/api/admin/inventory/${itemId}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Reorder request submitted successfully', 'success');
            closeModal();
            loadInventoryData(); // Refresh the table
        } else {
            showNotification(result.error || 'Failed to submit reorder request', 'error');
        }
    })
    .catch(error => {
        console.error('Error submitting reorder request:', error);
        showNotification('Failed to submit reorder request', 'error');
    });
}

// Quick Action Modal Functions
function showAddJobModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New Job</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="add-job-form">
                    <div class="form-group">
                        <label for="new-job-customer" class="form-label">Customer</label>
                        <select id="new-job-customer" class="form-input" required>
                            <option value="">Select Customer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new-job-vehicle" class="form-label">Vehicle</label>
                        <select id="new-job-vehicle" class="form-input" required>
                            <option value="">Select Vehicle</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new-job-service" class="form-label">Service</label>
                        <select id="new-job-service" class="form-input" required>
                            <option value="">Select Service</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="new-job-date" class="form-label">Booking Date</label>
                        <input type="datetime-local" id="new-job-date" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-job-notes" class="form-label">Notes</label>
                        <textarea id="new-job-notes" class="form-input" rows="3" placeholder="Any special instructions..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitAddJob()">Create Job</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load form data
    loadAddJobFormData();
    
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function showAddUserModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New User</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="add-user-form">
                    <div class="form-group">
                        <label for="new-user-username" class="form-label">Username</label>
                        <input type="text" id="new-user-username" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-user-fullname" class="form-label">Full Name</label>
                        <input type="text" id="new-user-fullname" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-user-email" class="form-label">Email</label>
                        <input type="email" id="new-user-email" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="new-user-phone" class="form-label">Phone</label>
                        <input type="tel" id="new-user-phone" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="new-user-password" class="form-label">Password</label>
                        <input type="password" id="new-user-password" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-user-role" class="form-label">Role</label>
                        <select id="new-user-role" class="form-input" required>
                            <option value="">Select Role</option>
                            <option value="admin">Admin</option>
                            <option value="employee">Employee</option>
                            <option value="customer">Customer</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitAddUser()">Create User</button>
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

function showAddServiceModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add New Service</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="add-service-form">
                    <div class="form-group">
                        <label for="new-service-name" class="form-label">Service Name</label>
                        <input type="text" id="new-service-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-service-price" class="form-label">Price</label>
                        <input type="number" id="new-service-price" class="form-input" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="new-service-category" class="form-label">Category</label>
                        <input type="text" id="new-service-category" class="form-input" placeholder="e.g., Engine, Brakes, Electrical">
                    </div>
                    <div class="form-group">
                        <label for="new-service-duration" class="form-label">Estimated Duration (minutes)</label>
                        <input type="number" id="new-service-duration" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-service-description" class="form-label">Description</label>
                        <textarea id="new-service-description" class="form-input" rows="3"></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitAddService()">Create Service</button>
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

function showAddInventoryModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Add Inventory Item</h3>
                <button class="modal-close" onclick="closeModal()">
                    <svg class="icon" viewBox="0 0 24 24">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="add-inventory-form">
                    <div class="form-group">
                        <label for="new-part-name" class="form-label">Part Name</label>
                        <input type="text" id="new-part-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="new-part-number" class="form-label">Part Number</label>
                        <input type="text" id="new-part-number" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="new-part-category" class="form-label">Category</label>
                        <input type="text" id="new-part-category" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="new-part-supplier" class="form-label">Supplier</label>
                        <input type="text" id="new-part-supplier" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="new-part-quantity" class="form-label">Initial Quantity</label>
                        <input type="number" id="new-part-quantity" class="form-input" value="0" required>
                    </div>
                    <div class="form-group">
                        <label for="new-part-min-quantity" class="form-label">Minimum Quantity</label>
                        <input type="number" id="new-part-min-quantity" class="form-input" value="5" required>
                    </div>
                    <div class="form-group">
                        <label for="new-part-price" class="form-label">Price per Unit</label>
                        <input type="number" id="new-part-price" class="form-input" step="0.01" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="submitAddInventory()">Add Item</button>
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

// Helper functions for loading form data
async function loadAddJobFormData() {
    try {
        // Load customers
        const customersResponse = await fetch('http://localhost:8080/api/admin/users');
        const customers = await customersResponse.json();
        const customerSelect = document.getElementById('new-job-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>';
        customers.filter(c => c.role === 'customer').forEach(customer => {
            customerSelect.innerHTML += `<option value="${customer.id}">${customer.fullName}</option>`;
        });

        // Load services
        const servicesResponse = await fetch('http://localhost:8080/api/admin/services');
        const services = await servicesResponse.json();
        const serviceSelect = document.getElementById('new-job-service');
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        services.forEach(service => {
            serviceSelect.innerHTML += `<option value="${service.id}">${service.serviceName} - $${service.price}</option>`;
        });

        // Set default date
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('new-job-date').value = now.toISOString().slice(0, 16);
    } catch (error) {
        console.error('Error loading form data:', error);
        showNotification('Failed to load form data', 'error');
    }
}

// Submit functions for quick actions
function submitAddJob() {
    const formData = {
        customerId: document.getElementById('new-job-customer').value,
        serviceId: document.getElementById('new-job-service').value,
        bookingDate: document.getElementById('new-job-date').value,
        notes: document.getElementById('new-job-notes').value
    };

    if (!formData.customerId || !formData.serviceId) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    fetch('http://localhost:8080/api/admin/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Job created successfully', 'success');
            closeModal();
            loadJobsData();
        } else {
            showNotification(result.error || 'Failed to create job', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating job:', error);
        showNotification('Failed to create job', 'error');
    });
}

function submitAddUser() {
    const formData = {
        username: document.getElementById('new-user-username').value,
        fullName: document.getElementById('new-user-fullname').value,
        email: document.getElementById('new-user-email').value,
        phone: document.getElementById('new-user-phone').value,
        password: document.getElementById('new-user-password').value,
        role: document.getElementById('new-user-role').value
    };

    fetch('http://localhost:8080/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('User created successfully', 'success');
            closeModal();
            loadUsersData();
        } else {
            showNotification(result.error || 'Failed to create user', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating user:', error);
        showNotification('Failed to create user', 'error');
    });
}

function submitAddService() {
    const formData = {
        serviceName: document.getElementById('new-service-name').value,
        price: parseFloat(document.getElementById('new-service-price').value),
        category: document.getElementById('new-service-category').value,
        estimatedDuration: parseInt(document.getElementById('new-service-duration').value),
        description: document.getElementById('new-service-description').value
    };

    fetch('http://localhost:8080/api/admin/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Service created successfully', 'success');
            closeModal();
            loadServicesData();
        } else {
            showNotification(result.error || 'Failed to create service', 'error');
        }
    })
    .catch(error => {
        console.error('Error creating service:', error);
        showNotification('Failed to create service', 'error');
    });
}

function submitAddInventory() {
    const formData = {
        partName: document.getElementById('new-part-name').value,
        partNumber: document.getElementById('new-part-number').value,
        category: document.getElementById('new-part-category').value,
        supplier: document.getElementById('new-part-supplier').value,
        quantity: parseInt(document.getElementById('new-part-quantity').value),
        minQuantity: parseInt(document.getElementById('new-part-min-quantity').value),
        pricePerUnit: parseFloat(document.getElementById('new-part-price').value)
    };

    fetch('http://localhost:8080/api/admin/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            showNotification('Inventory item added successfully', 'success');
            closeModal();
            loadInventoryData();
        } else {
            showNotification(result.error || 'Failed to add inventory item', 'error');
        }
    })
    .catch(error => {
        console.error('Error adding inventory item:', error);
        showNotification('Failed to add inventory item', 'error');
    });
}