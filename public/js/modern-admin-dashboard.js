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
    const revenueChart = document.getElementById('revenue-chart');
    if (revenueChart) {
        const revenueData = calculateRevenueData(jobs);
        revenueChart.innerHTML = createBarChart(revenueData, 'Revenue');
    }

    // Generate job status chart
    const statusChart = document.getElementById('status-chart');
    if (statusChart) {
        const statusData = calculateStatusData(jobs);
        statusChart.innerHTML = createPieChart(statusData, 'Job Status');
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
    console.log("Jobs data received:", jobs);
    const tableBody = document.getElementById('job-table-body');
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
    const html = jobs.map(job => `
        <tr>
            <td>#${job.jobId ?? ''}</td>
            <td>${job.customerName ?? ''}</td>
            <td>${job.vehicle ?? ''}</td>
            <td>${job.service ?? ''}</td>
            <td>
                <span class="status-badge status-${job.status ? job.status.toLowerCase().replace(' ', '-') : ''}">
                    ${job.status ?? ''}
                </span>
            </td>
            <td>${job.bookingDate ? new Date(job.bookingDate).toLocaleDateString() : ''}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewJob(${job.jobId})">View</button>
                    <button class="btn btn-sm btn-outline" onclick="editJob(${job.jobId})">Edit</button>
                    <button class="btn btn-sm btn-secondary" onclick="assignEmployee(${job.jobId})">Assign</button>
                </div>
            </td>
        </tr>
    `).join('');
    console.log("Generated jobs HTML:", html);
    tableBody.innerHTML = html;
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
        
        // Initialize advanced reporting if available
        if (window.advancedReporting) {
            console.log('Using advanced reporting system');
            await window.advancedReporting.initializeCharts();
        } else {
            console.warn('Advanced reporting not available, using fallback');
            
            // Fallback to simple charts
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
        }
        
    } catch (error) {
        console.error('Error loading reports data:', error);
        showNotification('Failed to load reports data', 'error');
    }
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
    showNotification(`Viewing job #${jobId}`, 'info');
    // Implementation for viewing job details
}

function editJob(jobId) {
    showNotification(`Editing job #${jobId}`, 'info');
    // Implementation for editing job
}

function assignEmployee(jobId) {
    showNotification(`Assigning employee to job #${jobId}`, 'info');
    // Implementation for assigning employee
}

function viewUser(userId) {
    showNotification(`Viewing user #${userId}`, 'info');
    // Implementation for viewing user details
}

function editUser(userId) {
    showNotification(`Editing user #${userId}`, 'info');
    // Implementation for editing user
}

function toggleUserStatus(userId) {
    showNotification(`Toggling user status #${userId}`, 'info');
    // Implementation for toggling user status
}

function viewService(serviceId) {
    showNotification(`Viewing service #${serviceId}`, 'info');
    // Implementation for viewing service details
}

function editService(serviceId) {
    showNotification(`Editing service #${serviceId}`, 'info');
    // Implementation for editing service
}

function toggleServiceStatus(serviceId) {
    showNotification(`Toggling service status #${serviceId}`, 'info');
    // Implementation for toggling service status
}

function viewInventory(itemId) {
    showNotification(`Viewing inventory item #${itemId}`, 'info');
    // Implementation for viewing inventory details
}

function editInventory(itemId) {
    showNotification(`Editing inventory item #${itemId}`, 'info');
    // Implementation for editing inventory
}

function reorderInventory(itemId) {
    showNotification(`Reordering inventory item #${itemId}`, 'info');
    // Implementation for reordering inventory
}

function viewBranch(branchId) {
    showNotification(`Viewing branch #${branchId}`, 'info');
    // Implementation for viewing branch details
}

function editBranch(branchId) {
    showNotification(`Editing branch #${branchId}`, 'info');
    // Implementation for editing branch
}

function manageBranchHours(branchId) {
    showNotification(`Managing hours for branch #${branchId}`, 'info');
    // Implementation for managing branch hours
}

function viewInvoice(invoiceId) {
    showNotification(`Viewing invoice #${invoiceId}`, 'info');
    // Implementation for viewing invoice details
}

function editInvoice(invoiceId) {
    showNotification(`Editing invoice #${invoiceId}`, 'info');
    // Implementation for editing invoice
}

function sendInvoice(invoiceId) {
    showNotification(`Sending invoice #${invoiceId}`, 'info');
    // Implementation for sending invoice
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
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
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