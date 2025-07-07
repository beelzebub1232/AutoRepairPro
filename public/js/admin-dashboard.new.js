// Admin Dashboard - New Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Simulate fetching user details from session or URL parameters
    // In a real app, this would come from a secure session
    const urlParams = new URLSearchParams(window.location.search);
    let userRole = urlParams.get('role');
    let userName = urlParams.get('name');
    let userId = urlParams.get('id');

    // If not in URL, try sessionStorage (e.g. after a login redirect)
    if (!userRole && sessionStorage.getItem('userRole')) {
        userRole = sessionStorage.getItem('userRole');
        userName = sessionStorage.getItem('userName');
        userId = sessionStorage.getItem('userId');
    } else if (userRole) {
        // If found in URL, store in sessionStorage for persistence across reloads
        sessionStorage.setItem('userRole', userRole);
        sessionStorage.setItem('userName', userName);
        sessionStorage.setItem('userId', userId);
    }

    // Auth check
    if (!userRole || userRole !== 'admin') {
        // Redirect to login if not admin or no role identified
        // Keep query params if they exist for potential login forwarding
        const query = window.location.search;
        window.location.href = `/index.html${query}`;
        return;
    }

    // Initialize dashboard
    initializeAdminDashboard(userName, userId);
});

function initializeAdminDashboard(userName, userId) {
    // Update user info in the sidebar
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && userName) {
        userNameElement.textContent = userName;
    } else if (userNameElement) {
        userNameElement.textContent = 'Admin User'; // Fallback
    }

    initializeNavigation();
    initializeLogout();
    initializeGlobalEventDelegation(); // For dynamic buttons
    initializeHeaderActionButtons(); // For static header buttons

    // Load data for the default active tab (Overview)
    loadTabData('overview');
}

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const tabContents = document.querySelectorAll('.main-content .tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');

            // Update active states for links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update active states for tab content
            tabContents.forEach(content => {
                if (content.id === `${targetTab}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });

            loadTabData(targetTab);

            // Close sidebar on mobile after navigation
            const sidebar = document.getElementById('sidebar');
            const sidebarOverlay = document.getElementById('sidebar-overlay');
            if (sidebar && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('show');
            }
        });
    });
}

function loadTabData(tab) {
    console.log(`Loading data for tab: ${tab}`);
    const contentAreaId = `${tab}-content`; // e.g., overview-content, jobs-content
    // For overview, content is now directly in #overview-tab, not #overview-content
    const contentArea = (tab === 'overview') ? document.getElementById('overview-tab') : document.getElementById(contentAreaId);


    if (!contentArea) {
        console.error(`Content area for tab ${tab} not found!`);
        return;
    }

    // Clear previous content only if it's not the main overview tab structure
    if (tab !== 'overview') {
        contentArea.innerHTML = `<p>Loading ${tab} data...</p>`;
    }


    switch(tab) {
        case 'overview':
            loadAdminOverviewData(); // Specific function for the new overview
            break;
        case 'jobs':
            loadJobsData(contentArea);
            break;
        case 'services':
            loadServicesData(contentArea);
            break;
        case 'inventory':
            loadInventoryData(contentArea);
            break;
        case 'branches':
            loadBranchesData(contentArea);
            break;
        case 'users':
            loadUsersData(contentArea);
            break;
        case 'invoices':
            loadInvoicesData(contentArea);
            break;
        case 'reports':
            loadReportsData(contentArea);
            break;
        case 'settings':
            loadSettingsData(contentArea);
            break;
        default:
            if (contentArea) contentArea.innerHTML = `<p>This section (${tab}) is under construction.</p>`;
            console.warn(`No data loading function defined for tab: ${tab}`);
    }
}

// Logout functionality
function initializeLogout() {
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear(); // Clear any session data
            window.location.href = '/index.html'; // Redirect to login page
        });
    }
}

// Data Loading Functions
function loadAdminOverviewData() {
    const metricsGrid = document.getElementById('admin-metrics-grid');
    const recentActivityList = document.getElementById('admin-recent-activity-list');
    const quickActionsContainer = document.getElementById('admin-quick-actions');

    if (!metricsGrid || !recentActivityList || !quickActionsContainer) {
        console.error('One or more admin overview containers not found.');
        return;
    }

    metricsGrid.innerHTML = '<p>Loading metrics...</p>';
    recentActivityList.innerHTML = '<p>Loading recent activity...</p>';
    quickActionsContainer.innerHTML = ''; // Clear for new buttons

    // Fetch dashboard summary stats
    fetch('/api/admin/dashboard')
        .then(response => response.json())
        .then(data => {
            let metricsHtml = '';
            // Define icons for each metric to mimic customer dashboard
            const metricDefinitions = [
                { key: 'totalJobs', title: 'Total Jobs', icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>', class: 'jobs' },
                { key: 'totalRevenue', title: 'Total Revenue', icon: '<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>', class: 'revenue', format: val => `$${parseFloat(val).toFixed(2)}` },
                { key: 'totalCustomers', title: 'Active Customers', icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', class: 'customers' },
                { key: 'totalEmployees', title: 'Active Employees', icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>', class: 'employees' }, // Placeholder icon for employees
                { key: 'lowStockItems', title: 'Low Stock Items', icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>', class: 'inventory' }
            ];

            metricDefinitions.forEach(def => {
                if (data[def.key] !== undefined) {
                    const value = def.format ? def.format(data[def.key]) : data[def.key];
                    metricsHtml += `<div class="metric-card ${def.class || ''}">
                                      <div class="metric-icon">${def.icon}</div>
                                      <div class="metric-value">${value}</div>
                                      <div class="metric-label">${def.title}</div>
                                   </div>`;
                }
            });
            metricsGrid.innerHTML = metricsHtml || '<p>No metrics to display.</p>';
        })
        .catch(error => {
            console.error('Error loading admin overview metrics:', error);
            metricsGrid.innerHTML = '<p class="text-error">Failed to load metrics.</p>';
        });

    // Fetch recent jobs for "Recent System Activity"
    fetch('/api/admin/jobs') // Assuming this gets all jobs, sorted by date desc by default
        .then(response => response.json())
        .then(jobs => {
            if (!Array.isArray(jobs)) {
                recentActivityList.innerHTML = '<p class="text-error">Error loading recent activity.</p>';
                return;
            }
            const recentJobs = jobs.slice(0, 5); // Display latest 5 jobs
            if (recentJobs.length === 0) {
                recentActivityList.innerHTML = '<p>No recent job activity.</p>';
            } else {
                let activityHtml = '<ul class="item-list">'; // Use a generic item-list class
                recentJobs.forEach(job => {
                    activityHtml += `
                        <li class="item-list-entry">
                            <div class="item-icon job-icon">
                                <svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                            </div>
                            <div class="item-details">
                                <span class="item-title">New Job: #${job.jobId} for ${job.customerName || 'N/A'}</span>
                                <span class="item-subtitle">${job.service || 'N/A'} - Status: ${job.status || 'N/A'}</span>
                            </div>
                            <span class="item-timestamp">${new Date(job.bookingDate).toLocaleDateString()}</span>
                        </li>`;
                });
                activityHtml += '</ul>';
                recentActivityList.innerHTML = activityHtml;
            }
        })
        .catch(error => {
            console.error('Error loading recent jobs for admin overview:', error);
            recentActivityList.innerHTML = '<p class="text-error">Failed to load recent activity.</p>';
        });

    // Populate Quick Actions
    // These are static for now, but could be dynamic
    quickActionsContainer.innerHTML = `
        <div class="quick-actions-grid">
            <button class="btn btn-primary quick-action-btn" data-tab-target="jobs" data-sub-action="create">
                <svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                <span>Create New Job</span>
            </button>
            <button class="btn btn-primary quick-action-btn" data-tab-target="users" data-sub-action="add">
                <svg class="icon" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                <span>Add New User</span>
            </button>
            <button class="btn btn-primary quick-action-btn" data-tab-target="services" data-sub-action="add">
                 <svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                <span>Manage Services</span>
            </button>
             <button class="btn btn-primary quick-action-btn" data-tab-target="inventory" data-sub-action="add">
                <svg class="icon" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                <span>Add Inventory</span>
            </button>
        </div>
    `;
    // Add event listeners for these new quick action buttons
    quickActionsContainer.querySelectorAll('.quick-action-btn').forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tabTarget;
            const subAction = button.dataset.subAction; // e.g., 'create', 'add'

            // Navigate to the tab
            const navLink = document.querySelector(`.sidebar-nav .nav-link[data-tab='${targetTab}']`);
            if (navLink) navLink.click();

            // After tab loads, trigger the sub-action (e.g., open the 'add' modal)
            // This might need a slight delay or a callback system if tab loading is slow
            setTimeout(() => {
                if (targetTab === 'jobs' && subAction === 'create') {
                    document.getElementById('create-job-btn')?.click();
                } else if (targetTab === 'users' && subAction === 'add') {
                    document.getElementById('add-user-btn')?.click();
                } else if (targetTab === 'services' && subAction === 'add') {
                    document.getElementById('add-service-btn')?.click();
                } else if (targetTab === 'inventory' && subAction === 'add') {
                    document.getElementById('add-inventory-item-btn')?.click();
                }
            }, 200); // Small delay to allow tab content to potentially render
        });
    });
}


// Global Caches
let allJobsData = [];
let allServicesData = [];
let allInventoryData = [];
let allUsersData = [];
let allBranchesData = [];
let allInvoicesData = [];


function loadJobsData(contentArea) {
    fetch('/api/admin/jobs')
        .then(response => response.json())
        .then(jobs => {
            if (!Array.isArray(jobs)) throw new Error("Jobs data is not an array");
            allJobsData = jobs;
            let tableHtml = `<div class="table-container"><table class="table"><thead><tr>
                                <th>Job ID</th><th>Customer</th><th>Vehicle</th><th>Service</th><th>Status</th>
                                <th>Employee</th><th>Cost</th><th>Actions</th>
                             </tr></thead><tbody id="admin-job-table-body">`;
            if (jobs.length === 0) {
                tableHtml += `<tr><td colspan="8" class="text-center">No jobs found.</td></tr>`;
            } else {
                jobs.forEach(job => {
                    tableHtml += `<tr>
                            <td>#${job.jobId}</td>
                            <td>${job.customerName || 'N/A'}</td>
                            <td>${job.vehicle || 'N/A'}</td>
                            <td>${job.service || 'N/A'}</td>
                            <td><span class="status-badge status-${(job.status || 'unknown').toLowerCase().replace(' ', '-')}">${job.status || 'Unknown'}</span></td>
                            <td>${job.employeeName || 'Unassigned'}</td>
                            <td>${job.totalCost ? '$' + parseFloat(job.totalCost).toFixed(2) : 'Pending'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary view-job-btn" data-job-id="${job.jobId}">View</button>
                                <button class="btn btn-sm btn-primary edit-job-btn" data-job-id="${job.jobId}">Edit</button>
                            </td>
                        </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
            contentArea.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading jobs data:', error);
            allJobsData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load jobs data. Please try again.</p>';
        });
}

function loadServicesData(contentArea) {
     fetch('/api/admin/services')
        .then(response => response.json())
        .then(services => {
            if (!Array.isArray(services)) throw new Error("Services data is not an array");
            allServicesData = services;
            let tableHtml = `<div class="table-container"><table class="table"><thead><tr>
                                <th>ID</th><th>Service Name</th><th>Price</th><th>Description</th><th>Actions</th>
                             </tr></thead><tbody id="admin-services-table-body">`;
            if (services.length === 0) {
                tableHtml += `<tr><td colspan="5" class="text-center">No services found.</td></tr>`;
            } else {
                services.forEach(service => {
                    tableHtml += `<tr>
                            <td>#${service.id}</td>
                            <td>${service.serviceName || 'N/A'}</td>
                            <td>${service.price ? '$' + parseFloat(service.price).toFixed(2) : 'N/A'}</td>
                            <td>${service.description || 'No description'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary edit-service-btn" data-service-id="${service.id}">Edit</button>
                                <button class="btn btn-sm btn-danger delete-service-btn" data-service-id="${service.id}">Delete</button>
                            </td>
                        </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
            contentArea.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading services data:', error);
            allServicesData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load services data. Please try again.</p>';
        });
}

function loadInventoryData(contentArea) {
    fetch('/api/admin/inventory')
        .then(response => response.json())
        .then(inventoryItems => {
            if (!Array.isArray(inventoryItems)) throw new Error("Inventory data is not an array");
            allInventoryData = inventoryItems;
            let tableHtml = `<div class="table-container"><table class="table"><thead><tr>
                                <th>ID</th><th>Part Name</th><th>Quantity</th><th>Min. Quantity</th>
                                <th>Price/Unit</th><th>Category</th><th>Actions</th>
                             </tr></thead><tbody id="admin-inventory-table-body">`;
            if (inventoryItems.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No inventory items found.</td></tr>`;
            } else {
                inventoryItems.forEach(item => {
                    tableHtml += `<tr class="${item.quantity <= item.minQuantity ? 'low-stock-warning' : ''}">
                            <td>#${item.id}</td>
                            <td>${item.partName || 'N/A'}</td>
                            <td>${item.quantity !== undefined ? item.quantity : 'N/A'}</td>
                            <td>${item.minQuantity !== undefined ? item.minQuantity : 'N/A'}</td>
                            <td>${item.pricePerUnit ? '$' + parseFloat(item.pricePerUnit).toFixed(2) : 'N/A'}</td>
                            <td>${item.category || 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary edit-inventory-btn" data-item-id="${item.id}">Edit</button>
                                <button class="btn btn-sm btn-primary adjust-stock-btn" data-item-id="${item.id}">Adjust Stock</button>
                            </td>
                        </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
            contentArea.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading inventory data:', error);
            allInventoryData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load inventory data. Please try again.</p>';
        });
}

function loadBranchesData(contentArea) {
    fetch('/api/admin/branches')
        .then(response => response.json())
        .then(branches => {
            if (!Array.isArray(branches)) throw new Error("Branches data is not an array");
            allBranchesData = branches;
            let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
            if (branches.length === 0) {
                html = `<p class="text-center col-span-full">No branches found.</p>`;
            } else {
                branches.forEach(branch => {
                    html += `<div class="card">
                            <div class="card-header"><h3 class="card-title">${branch.name || 'Unnamed Branch'}</h3></div>
                            <div class="card-body">
                                <p><strong>ID:</strong> ${branch.id}</p>
                                <p><strong>Address:</strong> ${branch.address || 'N/A'}</p>
                                <p><strong>Phone:</strong> ${branch.contact?.phone || branch.phone || 'N/A'}</p>
                                <p><strong>Email:</strong> ${branch.contact?.email || branch.email || 'N/A'}</p>
                                <p><strong>Rating:</strong> ${branch.rating ? branch.rating + ' ⭐' : 'N/A'}</p>
                                <p><strong>Hours:</strong> ${branch.hours || 'N/A'}</p>
                            </div>
                            <div class="card-footer">
                                <button class="btn btn-sm btn-secondary edit-branch-btn" data-branch-id="${branch.id}">Edit</button>
                            </div>
                        </div>`;
                });
            }
            html += '</div>';
            contentArea.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading branches data:', error);
            allBranchesData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load branches data. Please try again.</p>';
        });
}

function loadUsersData(contentArea) {
    fetch('/api/admin/users')
        .then(response => response.json())
        .then(users => {
            if (!Array.isArray(users)) throw new Error("Users data is not an array");
            allUsersData = users;
            let tableHtml = `<div class="table-container"><table class="table"><thead><tr>
                                <th>ID</th><th>Username</th><th>Full Name</th><th>Email</th>
                                <th>Role</th><th>Active</th><th>Actions</th>
                             </tr></thead><tbody id="admin-users-table-body">`;
            if (users.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No users found.</td></tr>`;
            } else {
                users.forEach(user => {
                    tableHtml += `<tr>
                            <td>#${user.id}</td>
                            <td>${user.username || 'N/A'}</td>
                            <td>${user.fullName || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td><span class="role-badge role-${(user.role || 'unknown').toLowerCase()}">${user.role || 'Unknown'}</span></td>
                            <td>${user.isActive ? 'Yes' : 'No'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary edit-user-btn" data-user-id="${user.id}">Edit</button>
                                <button class="btn btn-sm btn-${user.isActive ? 'danger' : 'success'} toggle-user-status-btn" data-user-id="${user.id}" data-current-status="${user.isActive}">
                                    ${user.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                            </td>
                        </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
            contentArea.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading users data:', error);
            allUsersData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load users data. Please try again.</p>';
        });
}

function loadInvoicesData(contentArea) {
    fetch('/api/admin/invoices')
        .then(response => response.json())
        .then(invoices => {
            if (!Array.isArray(invoices)) throw new Error("Invoices data is not an array");
            allInvoicesData = invoices;
            let tableHtml = `<div class="table-container"><table class="table"><thead><tr>
                                <th>Invoice ID</th><th>Customer</th><th>Job ID</th><th>Amount</th>
                                <th>Status</th><th>Due Date</th><th>Actions</th>
                             </tr></thead><tbody id="admin-invoices-table-body">`;
            if (invoices.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No invoices found.</td></tr>`;
            } else {
                invoices.forEach(invoice => {
                    tableHtml += `<tr>
                            <td>#${invoice.invoiceNumber || invoice.id}</td>
                            <td>${invoice.customerName || 'N/A'}</td>
                            <td>#${invoice.jobId || 'N/A'}</td>
                            <td>${invoice.totalAmount ? '$' + parseFloat(invoice.totalAmount).toFixed(2) : 'N/A'}</td>
                            <td><span class="status-badge status-${(invoice.status || 'unknown').toLowerCase()}">${invoice.status || 'Unknown'}</span></td>
                            <td>${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary view-invoice-btn" data-invoice-id="${invoice.id || invoice.invoiceNumber}">View</button>
                                <button class="btn btn-sm btn-primary edit-invoice-btn" data-invoice-id="${invoice.id || invoice.invoiceNumber}">Edit</button>
                            </td>
                        </tr>`;
                });
            }
            tableHtml += `</tbody></table></div>`;
            contentArea.innerHTML = tableHtml;
        })
        .catch(error => {
            console.error('Error loading invoices data:', error);
            allInvoicesData = [];
            contentArea.innerHTML = '<p class="text-error">Failed to load invoices data. Please try again.</p>';
        });
}

async function loadReportsData(contentArea) {
    contentArea.innerHTML = `<h3>Reports & Analytics</h3>
        <p>Summary data fetched from the backend.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="card" id="revenue-report-card">
                <div class="card-header"><h4 class="card-title">Monthly Revenue (Last 6 Months)</h4></div>
                <div class="card-body"><p>Loading revenue data...</p></div>
            </div>
            <div class="card" id="part-usage-report-card">
                <div class="card-header"><h4 class="card-title">Top 10 Part Usage</h4></div>
                <div class="card-body"><p>Loading part usage data...</p></div>
            </div>
            <div class="card" id="employee-performance-card">
                <div class="card-header"><h4 class="card-title">Employee Performance</h4></div>
                <div class="card-body"><p>Loading employee performance...</p></div>
            </div>
             <div class="card" id="customer-activity-card">
                <div class="card-header"><h4 class="card-title">New Customer Activity (Last 6 Months)</h4></div>
                <div class="card-body"><p>Loading customer activity...</p></div>
            </div>
        </div>`;

    try {
        // Revenue Report
        const revenueResponse = await fetch('/api/admin/reports/revenue');
        const revenueData = await revenueResponse.json();
        const revenueCardBody = document.querySelector('#revenue-report-card .card-body');
        if (revenueResponse.ok && Array.isArray(revenueData)) {
            let revenueHtml = '<ul>';
            revenueData.forEach(r => {
                revenueHtml += `<li>Month: ${r.month}, Revenue: $${parseFloat(r.totalRevenue || 0).toFixed(2)}</li>`;
            });
            revenueHtml += '</ul>';
            revenueCardBody.innerHTML = revenueData.length > 0 ? revenueHtml : '<p>No revenue data available.</p>';
        } else {
            revenueCardBody.innerHTML = '<p class="text-error">Could not load revenue data.</p>';
        }

        // Part Usage Report
        const partUsageResponse = await fetch('/api/admin/reports/part-usage');
        const partUsageData = await partUsageResponse.json();
        const partUsageCardBody = document.querySelector('#part-usage-report-card .card-body');
        if (partUsageResponse.ok && Array.isArray(partUsageData)) {
            let partUsageHtml = '<ul>';
            partUsageData.forEach(p => {
                partUsageHtml += `<li>Part: ${p.partName}, Used: ${p.totalUsed} times</li>`;
            });
            partUsageHtml += '</ul>';
            partUsageCardBody.innerHTML = partUsageData.length > 0 ? partUsageHtml : '<p>No part usage data available.</p>';
        } else {
            partUsageCardBody.innerHTML = '<p class="text-error">Could not load part usage data.</p>';
        }

        // Employee Performance
        const empPerfResponse = await fetch('/api/admin/reports/employee-performance');
        const empPerfData = await empPerfResponse.json();
        const empPerfCardBody = document.querySelector('#employee-performance-card .card-body');
        if (empPerfResponse.ok && Array.isArray(empPerfData)) {
            let empPerfHtml = '<ul>';
            empPerfData.forEach(e => {
                empPerfHtml += `<li>${e.employeeName}: ${e.jobsCompleted} jobs completed, Avg Rating: ${parseFloat(e.avgRating || 0).toFixed(1)}⭐</li>`;
            });
            empPerfHtml += '</ul>';
            empPerfCardBody.innerHTML = empPerfData.length > 0 ? empPerfHtml : '<p>No employee performance data.</p>';
        } else {
            empPerfCardBody.innerHTML = '<p class="text-error">Could not load employee performance.</p>';
        }

        // Customer Activity
        const custActivityResponse = await fetch('/api/admin/reports/customer-activity');
        const custActivityData = await custActivityResponse.json();
        const custActivityCardBody = document.querySelector('#customer-activity-card .card-body');
        if (custActivityResponse.ok && Array.isArray(custActivityData)) {
            let custActHtml = '<ul>';
            custActivityData.forEach(c => {
                custActHtml += `<li>Month: ${c.month}, New Customers: ${c.newCustomers}</li>`;
            });
            custActHtml += '</ul>';
            custActivityCardBody.innerHTML = custActivityData.length > 0 ? custActHtml : '<p>No customer activity data.</p>';
        } else {
            custActivityCardBody.innerHTML = '<p class="text-error">Could not load customer activity.</p>';
        }

    } catch (error) {
        console.error('Error loading one or more reports:', error);
        showAdminNotification('Failed to load some report data.', 'error');
    }
}


function loadSettingsData(contentArea) {
    fetch('/api/admin/settings')
        .then(response => response.json())
        .then(settings => {
            if (!Array.isArray(settings)) throw new Error("Settings data is not an array");
            let formHtml = '<h3>System Settings</h3><form id="settings-form">';
            if (settings.length === 0) {
                formHtml = `<p>No settings available for configuration.</p>`;
            } else {
                settings.filter(s => s.isPublic).forEach(setting => {
                    formHtml += `<div class="form-group">
                            <label for="setting-${setting.key}" class="form-label">${setting.description || setting.key}</label>
                            <input type="${setting.type === 'boolean' ? 'checkbox' : (setting.type === 'number' ? 'number' : 'text')}"
                                   id="setting-${setting.key}"
                                   name="${setting.key}"
                                   value="${setting.type !== 'boolean' ? setting.value : 'true'}"
                                   class="form-${setting.type === 'boolean' ? 'checkbox' : 'input'}"
                                   ${setting.type === 'boolean' && setting.value === 'true' ? 'checked' : ''}>
                        </div>`;
                });
                formHtml += `<div class="form-actions"><button type="submit" class="btn btn-primary">Save Settings</button></div>`;
            }
            formHtml += '</form>';
            contentArea.innerHTML = formHtml;

            const settingsForm = document.getElementById('settings-form');
            if (settingsForm) {
                settingsForm.addEventListener('submit', submitSettingsForm);
            }
        })
        .catch(error => {
            console.error('Error loading settings data:', error);
            contentArea.innerHTML = '<p class="text-error">Failed to load settings data. Please try again.</p>';
        });
}

async function submitSettingsForm(event) {
    event.preventDefault();
    const form = event.target;
    const settingsPayload = [];
    form.querySelectorAll('input[id^="setting-"], select[id^="setting-"]').forEach(input => {
        const key = input.name;
        let value;
        if (input.type === 'checkbox') {
            value = input.checked.toString();
        } else {
            value = input.value;
        }
        settingsPayload.push({ key, value });
    });

    if (settingsPayload.length === 0) {
        showAdminNotification('No settings to save.', 'info');
        return;
    }

    try {
        const response = await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(settingsPayload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to save settings.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Settings saved successfully!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showAdminNotification(`Error saving settings: ${error.message}`, 'error');
    }
}


// Utility to show notification
function showAdminNotification(message, type = 'info') {
    if (window.notificationManager && window.notificationManager.addNotification) {
        window.notificationManager.addNotification({ title: type.toUpperCase(), message, type });
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Modal Functions
function createModal(modalId, title, bodyHtml, footerHtml = '') {
    const existingModal = document.getElementById(modalId);
    if (existingModal) existingModal.remove();

    const modalWrapper = document.createElement('div');
    modalWrapper.id = modalId;
    modalWrapper.className = 'admin-modal';
    modalWrapper.style.display = 'none';
    modalWrapper.innerHTML = `<div class="admin-modal-content">
            <div class="admin-modal-header">
                <h3 class="admin-modal-title">${title}</h3>
                <button class="admin-modal-close-btn" data-modal-id="${modalId}">&times;</button>
            </div>
            <div class="admin-modal-body">${bodyHtml}</div>
            ${footerHtml ? `<div class="admin-modal-footer">${footerHtml}</div>` : ''}
        </div>`;
    document.body.appendChild(modalWrapper);
    modalWrapper.querySelector('.admin-modal-close-btn').addEventListener('click', () => closeModal(modalId));
    modalWrapper.addEventListener('click', function(event) {
        if (event.target === modalWrapper) closeModal(modalId);
    });
    return modalWrapper;
}

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// --- Create Job Functionality ---
function handleCreateJobClick() {
    const modalId = 'createJobModal';
    const title = 'Create New Job';
    const bodyHtml = `<form id="create-job-form">
            <div class="form-group">
                <label for="job-customer" class="form-label">Customer</label>
                <select id="job-customer" class="form-input" required><option value="">Loading customers...</option></select>
            </div>
            <div class="form-group">
                <label for="job-vehicle" class="form-label">Vehicle</label>
                <select id="job-vehicle" class="form-input" required disabled><option value="">Select a customer first...</option></select>
            </div>
            <div class="form-group">
                <label for="job-service" class="form-label">Service</label>
                <select id="job-service" class="form-input" required><option value="">Loading services...</option></select>
            </div>
            <div class="form-group">
                <label for="job-date" class="form-label">Booking Date</label>
                <input type="datetime-local" id="job-date" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="job-notes" class="form-label">Notes (Optional)</label>
                <textarea id="job-notes" class="form-textarea" rows="3"></textarea>
            </div>
            <div id="create-job-error" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>`;
    const footerHtml = `<button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
                        <button type="submit" form="create-job-form" class="btn btn-primary">Create Job</button>`;
    createModal(modalId, title, bodyHtml, footerHtml);
    populateJobFormDropdowns();
    const jobDateInput = document.getElementById('job-date');
    if (jobDateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        jobDateInput.value = now.toISOString().slice(0,16);
        jobDateInput.min = now.toISOString().slice(0,16);
    }
    document.getElementById('create-job-form').onsubmit = submitCreateJobForm;
    showModal(modalId);
}

async function submitCreateJobForm(event) {
    event.preventDefault();
    const modalId = 'createJobModal';
    const customerId = document.getElementById('job-customer').value;
    const vehicleId = document.getElementById('job-vehicle').value;
    const serviceId = document.getElementById('job-service').value;
    const bookingDate = document.getElementById('job-date').value;
    const notes = document.getElementById('job-notes').value;
    const errorDiv = document.getElementById('create-job-error');
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!customerId || !vehicleId || !serviceId || !bookingDate) {
        errorDiv.textContent = 'Please fill in all required fields.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/admin/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerId, vehicleId, serviceId, bookingDate, notes })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to create job.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Job created successfully!', 'success');
        closeModal(modalId);
        loadTabData('jobs');
    } catch (error) {
        console.error('Error creating job:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error creating job: ${error.message}`, 'error');
    }
}

async function populateJobFormDropdowns() {
    const customerSelect = document.getElementById('job-customer');
    const serviceSelect = document.getElementById('job-service');
    const vehicleSelect = document.getElementById('job-vehicle');
    try {
        const usersResponse = await fetch('/api/admin/users');
        const users = await usersResponse.json();
        const customers = users.filter(user => user.role === 'customer' && user.isActive);
        customerSelect.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(cust => customerSelect.innerHTML += `<option value="${cust.id}">${cust.fullName} (ID: ${cust.id})</option>`);
    } catch (error) { console.error("Failed to load customers:", error); customerSelect.innerHTML = '<option value="">Error loading customers</option>'; }
    try {
        const servicesResponse = await fetch('/api/admin/services');
        const services = await servicesResponse.json();
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        services.forEach(serv => serviceSelect.innerHTML += `<option value="${serv.id}">${serv.serviceName} - $${serv.price}</option>`);
    } catch (error) { console.error("Failed to load services:", error); serviceSelect.innerHTML = '<option value="">Error loading services</option>'; }
    customerSelect.onchange = async function() {
        const customerId = this.value;
        vehicleSelect.innerHTML = '<option value="">Loading vehicles...</option>';
        vehicleSelect.disabled = true;
        if (customerId) {
            try {
                const vehiclesResponse = await fetch(`/api/customer/vehicles/${customerId}`);
                const vehicles = await vehiclesResponse.json();
                vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
                if (vehicles.length > 0) {
                    vehicles.forEach(veh => vehicleSelect.innerHTML += `<option value="${veh.id}">${veh.make} ${veh.model} (${veh.year})</option>`);
                    vehicleSelect.disabled = false;
                } else { vehicleSelect.innerHTML = '<option value="">No vehicles for this customer</option>'; }
            } catch (error) { console.error("Failed to load vehicles:", error); vehicleSelect.innerHTML = '<option value="">Error loading vehicles</option>'; }
        } else { vehicleSelect.innerHTML = '<option value="">Select a customer first...</option>'; }
    };
}

// --- View Job Functionality ---
async function handleViewJobClick(jobId) {
    const modalId = `viewJobModal-${jobId}`;
    const title = `View Job Details (ID: #${jobId})`;
    const jobData = allJobsData.find(j => j.jobId == jobId);

    if (!jobData) {
        showAdminNotification(`Could not find details for Job ID ${jobId}. Try refreshing.`, 'error');
        return;
    }

    const bodyHtml = `<div class="job-details-view">
            <p><strong>Job ID:</strong> #${jobData.jobId}</p>
            <p><strong>Customer:</strong> ${jobData.customerName || 'N/A'}</p>
            <p><strong>Vehicle:</strong> ${jobData.vehicle || 'N/A'}</p>
            <p><strong>Service:</strong> ${jobData.service || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${(jobData.status || 'unknown').toLowerCase().replace(' ', '-')}">${jobData.status || 'Unknown'}</span></p>
            <p><strong>Assigned Employee:</strong> ${jobData.employeeName || 'Unassigned'}</p>
            <p><strong>Booking Date:</strong> ${jobData.bookingDate ? new Date(jobData.bookingDate).toLocaleString() : 'N/A'}</p>
            <p><strong>Total Cost:</strong> ${jobData.totalCost ? '$' + parseFloat(jobData.totalCost).toFixed(2) : 'Pending'}</p>
            <p><strong>Notes:</strong> ${jobData.notes || 'None'}</p>
            <p><strong>Branch:</strong> ${jobData.branchName || 'N/A'}</p>
        </div>`;
    const footerHtml = `<button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Close</button>`;
    createModal(modalId, title, bodyHtml, footerHtml);
    showModal(modalId);
}

// --- Edit Job Functionality ---
async function handleEditJobClick(jobId) {
    const modalId = `editJobModal-${jobId}`;
    const title = `Edit Job (ID: #${jobId})`;
    const jobData = allJobsData.find(j => j.jobId == jobId);

    if (!jobData) {
        showAdminNotification(`Could not find details for Job ID ${jobId} to edit. Try refreshing.`, 'error');
        return;
    }

    let employeeOptions = '<option value="">Unassign</option>';
    try {
        const usersResponse = await fetch('/api/admin/users');
        const users = await usersResponse.json();
        const employees = users.filter(user => user.role === 'employee' && user.isActive);
        const currentEmployee = employees.find(emp => emp.fullName === jobData.employeeName);
        const currentEmployeeId = currentEmployee ? currentEmployee.id : (jobData.employeeId || null) ;


        employees.forEach(emp => {
            employeeOptions += `<option value="${emp.id}" ${currentEmployeeId == emp.id ? 'selected' : ''}>${emp.fullName}</option>`;
        });
    } catch (error) { console.error("Failed to load employees for edit job form:", error); employeeOptions = '<option value="">Error loading employees</option>'; }

    const jobStatuses = ['Booked', 'In Progress', 'Hold', 'Awaiting Parts', 'Completed', 'Invoiced', 'Cancelled'];
    let statusOptions = '';
    jobStatuses.forEach(status => {
        statusOptions += `<option value="${status}" ${jobData.status === status ? 'selected' : ''}>${status}</option>`;
    });

    let formattedBookingDate = '';
    if (jobData.bookingDate) {
        const date = new Date(jobData.bookingDate);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - timezoneOffset).toISOString().slice(0,16);
        formattedBookingDate = localISOTime;
    }

    const bodyHtml = `
        <form id="edit-job-form-${jobId}">
            <input type="hidden" id="edit-job-id" value="${jobData.jobId}">
            <p><strong>Customer:</strong> ${jobData.customerName || 'N/A'} (${jobData.vehicle || 'N/A'})</p>
            <p><strong>Service:</strong> ${jobData.service || 'N/A'}</p>
            <div class="form-group">
                <label for="edit-job-status-${jobId}" class="form-label">Status</label>
                <select id="edit-job-status-${jobId}" class="form-input" required>${statusOptions}</select>
            </div>
            <div class="form-group">
                <label for="edit-job-employee-${jobId}" class="form-label">Assigned Employee</label>
                <select id="edit-job-employee-${jobId}" class="form-input">${employeeOptions}</select>
            </div>
            <div class="form-group">
                <label for="edit-job-booking-date-${jobId}" class="form-label">Booking Date</label>
                <input type="datetime-local" id="edit-job-booking-date-${jobId}" class="form-input" value="${formattedBookingDate}" required>
            </div>
            <div class="form-group">
                <label for="edit-job-notes-${jobId}" class="form-label">Admin Notes</label>
                <textarea id="edit-job-notes-${jobId}" class="form-textarea" rows="3">${jobData.notes || ''}</textarea>
            </div>
            <div id="edit-job-error-${jobId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-job-form-${jobId}" class="btn btn-primary">Save Changes</button>
    `;

    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-job-form-${jobId}`).onsubmit = submitEditJobForm;
    showModal(modalId);
}

async function submitEditJobForm(event) {
    event.preventDefault();
    const form = event.target;
    const jobId = form.querySelector('input[type="hidden"]').value;
    const modalId = `editJobModal-${jobId}`;

    const status = form.querySelector(`#edit-job-status-${jobId}`).value;
    const employeeIdValue = form.querySelector(`#edit-job-employee-${jobId}`).value;
    const bookingDate = form.querySelector(`#edit-job-booking-date-${jobId}`).value;
    const notes = form.querySelector(`#edit-job-notes-${jobId}`).value;

    const errorDiv = form.querySelector(`#edit-job-error-${jobId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    const payload = {
        jobId: parseInt(jobId),
        status,
        assignedEmployeeId: employeeIdValue ? parseInt(employeeIdValue) : null,
        bookingDate,
        notes
    };

    try {
        const response = await fetch(`/api/admin/jobs`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update job.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Job updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('jobs');
    } catch (error) {
        console.error('Error updating job:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating job: ${error.message}`, 'error');
    }
}

// --- Services Management CRUD ---
function handleAddServiceClick() {
    const modalId = 'addServiceModal';
    const title = 'Add New Service';
    const bodyHtml = `
        <form id="add-service-form">
            <div class="form-group">
                <label for="service-name" class="form-label">Service Name</label>
                <input type="text" id="service-name" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="service-price" class="form-label">Price</label>
                <input type="number" id="service-price" class="form-input" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="service-description" class="form-label">Description</label>
                <textarea id="service-description" class="form-textarea" rows="3"></textarea>
            </div>
            <div id="add-service-error" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="add-service-form" class="btn btn-primary">Add Service</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById('add-service-form').onsubmit = submitAddServiceForm;
    showModal(modalId);
}

async function submitAddServiceForm(event) {
    event.preventDefault();
    const modalId = 'addServiceModal';
    const serviceName = document.getElementById('service-name').value;
    const price = document.getElementById('service-price').value;
    const description = document.getElementById('service-description').value;
    const errorDiv = document.getElementById('add-service-error');
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!serviceName || !price) {
        errorDiv.textContent = 'Service Name and Price are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/admin/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceName, price: parseFloat(price), description })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to add service.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Service added successfully!', 'success');
        closeModal(modalId);
        loadTabData('services');
    } catch (error) {
        console.error('Error adding service:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error adding service: ${error.message}`, 'error');
    }
}

function handleEditServiceClick(serviceId) {
    const serviceData = allServicesData.find(s => s.id == serviceId);
    if (!serviceData) {
        showAdminNotification('Service not found.', 'error');
        return;
    }
    const modalId = `editServiceModal-${serviceId}`;
    const title = `Edit Service (ID: #${serviceId})`;
    const bodyHtml = `
        <form id="edit-service-form-${serviceId}">
            <input type="hidden" id="edit-service-id" value="${serviceData.id}">
            <div class="form-group">
                <label for="edit-service-name-${serviceId}" class="form-label">Service Name</label>
                <input type="text" id="edit-service-name-${serviceId}" class="form-input" value="${serviceData.serviceName || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-service-price-${serviceId}" class="form-label">Price</label>
                <input type="number" id="edit-service-price-${serviceId}" class="form-input" step="0.01" min="0" value="${serviceData.price || 0}" required>
            </div>
            <div class="form-group">
                <label for="edit-service-description-${serviceId}" class="form-label">Description</label>
                <textarea id="edit-service-description-${serviceId}" class="form-textarea" rows="3">${serviceData.description || ''}</textarea>
            </div>
            <div id="edit-service-error-${serviceId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-service-form-${serviceId}" class="btn btn-primary">Save Changes</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-service-form-${serviceId}`).onsubmit = submitEditServiceForm;
    showModal(modalId);
}

async function submitEditServiceForm(event) {
    event.preventDefault();
    const form = event.target;
    const serviceId = form.querySelector('input[type="hidden"]').value;
    const modalId = `editServiceModal-${serviceId}`;
    const serviceName = form.querySelector(`#edit-service-name-${serviceId}`).value;
    const price = form.querySelector(`#edit-service-price-${serviceId}`).value;
    const description = form.querySelector(`#edit-service-description-${serviceId}`).value;
    const errorDiv = form.querySelector(`#edit-service-error-${serviceId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!serviceName || !price) {
        errorDiv.textContent = 'Service Name and Price are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch(`/api/admin/services`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(serviceId), serviceName, price: parseFloat(price), description })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update service.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Service updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('services');
    } catch (error) {
        console.error('Error updating service:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating service: ${error.message}`, 'error');
    }
}

async function handleDeleteServiceClick(serviceId) {
    if (!confirm(`Are you sure you want to delete Service ID: #${serviceId}? This action cannot be undone.`)) {
        return;
    }
    try {
        const response = await fetch(`/api/admin/services`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(serviceId) })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to delete service.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Service deleted successfully!', 'success');
        loadTabData('services');
    } catch (error) {
        console.error('Error deleting service:', error);
        showAdminNotification(`Error deleting service: ${error.message}`, 'error');
    }
}

// --- Inventory Management CRUD ---
function handleAddInventoryItemClick() {
    const modalId = 'addInventoryModal';
    const title = 'Add New Inventory Item';
    const bodyHtml = `
        <form id="add-inventory-form">
            <div class="form-group">
                <label for="inv-partName" class="form-label">Part Name</label>
                <input type="text" id="inv-partName" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="inv-quantity" class="form-label">Quantity</label>
                <input type="number" id="inv-quantity" class="form-input" min="0" required>
            </div>
            <div class="form-group">
                <label for="inv-minQuantity" class="form-label">Minimum Quantity</label>
                <input type="number" id="inv-minQuantity" class="form-input" min="0" required>
            </div>
            <div class="form-group">
                <label for="inv-pricePerUnit" class="form-label">Price Per Unit</label>
                <input type="number" id="inv-pricePerUnit" class="form-input" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="inv-category" class="form-label">Category</label>
                <input type="text" id="inv-category" class="form-input">
            </div>
            <div id="add-inventory-error" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="add-inventory-form" class="btn btn-primary">Add Item</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById('add-inventory-form').onsubmit = submitAddInventoryItemForm;
    showModal(modalId);
}

async function submitAddInventoryItemForm(event) {
    event.preventDefault();
    const modalId = 'addInventoryModal';
    const partName = document.getElementById('inv-partName').value;
    const quantity = document.getElementById('inv-quantity').value;
    const minQuantity = document.getElementById('inv-minQuantity').value;
    const pricePerUnit = document.getElementById('inv-pricePerUnit').value;
    const category = document.getElementById('inv-category').value;
    const errorDiv = document.getElementById('add-inventory-error');
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!partName || !quantity || !minQuantity || !pricePerUnit) {
        errorDiv.textContent = 'Part Name, Quantity, Min. Quantity, and Price are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/admin/inventory', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ partName, quantity: parseInt(quantity), minQuantity: parseInt(minQuantity), pricePerUnit: parseFloat(pricePerUnit), category })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to add inventory item.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Inventory item added successfully!', 'success');
        closeModal(modalId);
        loadTabData('inventory');
    } catch (error) {
        console.error('Error adding inventory item:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error adding item: ${error.message}`, 'error');
    }
}

function handleEditInventoryItemClick(itemId) {
    const itemData = allInventoryData.find(item => item.id == itemId);
    if (!itemData) {
        showAdminNotification('Inventory item not found.', 'error');
        return;
    }
    const modalId = `editInventoryModal-${itemId}`;
    const title = `Edit Inventory Item (ID: #${itemId})`;
    const bodyHtml = `
        <form id="edit-inventory-form-${itemId}">
            <input type="hidden" value="${itemData.id}">
            <div class="form-group">
                <label for="edit-inv-partName-${itemId}" class="form-label">Part Name</label>
                <input type="text" id="edit-inv-partName-${itemId}" class="form-input" value="${itemData.partName || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-inv-quantity-${itemId}" class="form-label">Quantity</label>
                <input type="number" id="edit-inv-quantity-${itemId}" class="form-input" value="${itemData.quantity || 0}" min="0" required>
            </div>
            <div class="form-group">
                <label for="edit-inv-minQuantity-${itemId}" class="form-label">Minimum Quantity</label>
                <input type="number" id="edit-inv-minQuantity-${itemId}" class="form-input" value="${itemData.minQuantity || 0}" min="0" required>
            </div>
            <div class="form-group">
                <label for="edit-inv-pricePerUnit-${itemId}" class="form-label">Price Per Unit</label>
                <input type="number" id="edit-inv-pricePerUnit-${itemId}" class="form-input" value="${itemData.pricePerUnit || 0}" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="edit-inv-category-${itemId}" class="form-label">Category</label>
                <input type="text" id="edit-inv-category-${itemId}" class="form-input" value="${itemData.category || ''}">
            </div>
            <div id="edit-inventory-error-${itemId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-inventory-form-${itemId}" class="btn btn-primary">Save Changes</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-inventory-form-${itemId}`).onsubmit = submitEditInventoryItemForm;
    showModal(modalId);
}

async function submitEditInventoryItemForm(event) {
    event.preventDefault();
    const form = event.target;
    const itemId = form.querySelector('input[type="hidden"]').value;
    const modalId = `editInventoryModal-${itemId}`;

    const partName = form.querySelector(`#edit-inv-partName-${itemId}`).value;
    const quantity = form.querySelector(`#edit-inv-quantity-${itemId}`).value;
    const minQuantity = form.querySelector(`#edit-inv-minQuantity-${itemId}`).value;
    const pricePerUnit = form.querySelector(`#edit-inv-pricePerUnit-${itemId}`).value;
    const category = form.querySelector(`#edit-inv-category-${itemId}`).value;
    const errorDiv = form.querySelector(`#edit-inventory-error-${itemId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!partName || !quantity || !minQuantity || !pricePerUnit) {
        errorDiv.textContent = 'Part Name, Quantity, Min. Quantity, and Price are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch(`/api/admin/inventory`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(itemId), partName, quantity: parseInt(quantity), minQuantity: parseInt(minQuantity), pricePerUnit: parseFloat(pricePerUnit), category })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update inventory item.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Inventory item updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('inventory');
    } catch (error) {
        console.error('Error updating inventory item:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating item: ${error.message}`, 'error');
    }
}

function handleAdjustStockClick(itemId) {
    const itemData = allInventoryData.find(item => item.id == itemId);
    if (!itemData) {
        showAdminNotification('Inventory item not found.', 'error');
        return;
    }
    const modalId = `adjustStockModal-${itemId}`;
    const title = `Adjust Stock for ${itemData.partName} (Current: ${itemData.quantity})`;
    const bodyHtml = `
        <form id="adjust-stock-form-${itemId}">
             <input type="hidden" value="${itemData.id}">
            <p>Current Quantity: ${itemData.quantity}</p>
            <div class="form-group">
                <label for="adj-inv-newQuantity-${itemId}" class="form-label">New Quantity</label>
                <input type="number" id="adj-inv-newQuantity-${itemId}" class="form-input" value="${itemData.quantity}" min="0" required>
            </div>
            <div id="adjust-stock-error-${itemId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="adjust-stock-form-${itemId}" class="btn btn-primary">Update Quantity</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`adjust-stock-form-${itemId}`).onsubmit = submitAdjustStockForm;
    showModal(modalId);
}

async function submitAdjustStockForm(event) {
    event.preventDefault();
    const form = event.target;
    const itemId = form.querySelector('input[type="hidden"]').value;
    const modalId = `adjustStockModal-${itemId}`;
    const newQuantity = form.querySelector(`#adj-inv-newQuantity-${itemId}`).value;
    const errorDiv = form.querySelector(`#adjust-stock-error-${itemId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    const itemData = allInventoryData.find(item => item.id == itemId);

    if (newQuantity === null || newQuantity === '' || parseInt(newQuantity) < 0) {
        errorDiv.textContent = 'New quantity must be a non-negative number.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const payload = { ...itemData, id: parseInt(itemId), quantity: parseInt(newQuantity) };
        delete payload.lowStock;

        const response = await fetch(`/api/admin/inventory`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to adjust stock.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Stock adjusted successfully!', 'success');
        closeModal(modalId);
        loadTabData('inventory');
    } catch (error) {
        console.error('Error adjusting stock:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error adjusting stock: ${error.message}`, 'error');
    }
}

// --- User Management CRUD ---
function handleAddUserClick() {
    const modalId = 'addUserModal';
    const title = 'Add New User';
    const roles = ['customer', 'employee', 'admin'];
    let roleOptions = '';
    roles.forEach(role => roleOptions += `<option value="${role}">${role.charAt(0).toUpperCase() + role.slice(1)}</option>`);

    const bodyHtml = `
        <form id="add-user-form">
            <div class="form-group">
                <label for="user-username" class="form-label">Username</label>
                <input type="text" id="user-username" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-fullName" class="form-label">Full Name</label>
                <input type="text" id="user-fullName" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-email" class="form-label">Email</label>
                <input type="email" id="user-email" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-phone" class="form-label">Phone (Optional)</label>
                <input type="tel" id="user-phone" class="form-input">
            </div>
            <div class="form-group">
                <label for="user-password" class="form-label">Password</label>
                <input type="password" id="user-password" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="user-role" class="form-label">Role</label>
                <select id="user-role" class="form-input" required>${roleOptions}</select>
            </div>
            <div id="add-user-error" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="add-user-form" class="btn btn-primary">Add User</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById('add-user-form').onsubmit = submitAddUserForm;
    showModal(modalId);
}

async function submitAddUserForm(event) {
    event.preventDefault();
    const modalId = 'addUserModal';
    const username = document.getElementById('user-username').value;
    const fullName = document.getElementById('user-fullName').value;
    const email = document.getElementById('user-email').value;
    const phone = document.getElementById('user-phone').value;
    const password = document.getElementById('user-password').value;
    const role = document.getElementById('user-role').value;
    const errorDiv = document.getElementById('add-user-error');
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!username || !fullName || !email || !password || !role) {
        errorDiv.textContent = 'Username, Full Name, Email, Password, and Role are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, fullName, email, phone, password, role })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to add user.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('User added successfully!', 'success');
        closeModal(modalId);
        loadTabData('users');
    } catch (error) {
        console.error('Error adding user:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error adding user: ${error.message}`, 'error');
    }
}

function handleEditUserClick(userId) {
    const userData = allUsersData.find(u => u.id == userId);
    if (!userData) {
        showAdminNotification('User not found.', 'error');
        return;
    }
    const modalId = `editUserModal-${userId}`;
    const title = `Edit User (ID: #${userId})`;
    const roles = ['customer', 'employee', 'admin'];
    let roleOptions = '';
    roles.forEach(role => {
        roleOptions += `<option value="${role}" ${userData.role === role ? 'selected' : ''}>${role.charAt(0).toUpperCase() + role.slice(1)}</option>`;
    });

    const bodyHtml = `
        <form id="edit-user-form-${userId}">
            <input type="hidden" value="${userData.id}">
            <div class="form-group">
                <label for="edit-user-username-${userId}" class="form-label">Username</label>
                <input type="text" id="edit-user-username-${userId}" class="form-input" value="${userData.username || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-user-fullName-${userId}" class="form-label">Full Name</label>
                <input type="text" id="edit-user-fullName-${userId}" class="form-input" value="${userData.fullName || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-user-email-${userId}" class="form-label">Email</label>
                <input type="email" id="edit-user-email-${userId}" class="form-input" value="${userData.email || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-user-phone-${userId}" class="form-label">Phone (Optional)</label>
                <input type="tel" id="edit-user-phone-${userId}" class="form-input" value="${userData.phone || ''}">
            </div>
            <div class="form-group">
                <label for="edit-user-role-${userId}" class="form-label">Role</label>
                <select id="edit-user-role-${userId}" class="form-input" required>${roleOptions}</select>
            </div>
            <div class="form-group">
                <label for="edit-user-password-${userId}" class="form-label">New Password (Optional)</label>
                <input type="password" id="edit-user-password-${userId}" class="form-input" placeholder="Leave blank to keep current password">
            </div>
            <div id="edit-user-error-${userId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-user-form-${userId}" class="btn btn-primary">Save Changes</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-user-form-${userId}`).onsubmit = submitEditUserForm;
    showModal(modalId);
}

async function submitEditUserForm(event) {
    event.preventDefault();
    const form = event.target;
    const userId = form.querySelector('input[type="hidden"]').value;
    const modalId = `editUserModal-${userId}`;

    const username = form.querySelector(`#edit-user-username-${userId}`).value;
    const fullName = form.querySelector(`#edit-user-fullName-${userId}`).value;
    const email = form.querySelector(`#edit-user-email-${userId}`).value;
    const phone = form.querySelector(`#edit-user-phone-${userId}`).value;
    const role = form.querySelector(`#edit-user-role-${userId}`).value;
    const password = form.querySelector(`#edit-user-password-${userId}`).value;
    const errorDiv = form.querySelector(`#edit-user-error-${userId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!username || !fullName || !email || !role) {
        errorDiv.textContent = 'Username, Full Name, Email, and Role are required.';
        errorDiv.style.display = 'block';
        return;
    }

    const payload = { id: parseInt(userId), username, fullName, email, phone, role };
    if (password) {
        payload.password = password;
    }

    try {
        const response = await fetch(`/api/admin/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update user.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('User updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('users');
    } catch (error) {
        console.error('Error updating user:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating user: ${error.message}`, 'error');
    }
}

async function handleToggleUserStatusClick(userId, currentStatusString) {
    const currentStatus = currentStatusString === 'true';
    const newStatus = !currentStatus;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} User ID: #${userId}?`)) {
        return;
    }
    try {
        const payload = { id: parseInt(userId), isActive: newStatus };
        const response = await fetch(`/api/admin/users`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: `Failed to ${action} user.` }));
            throw new Error(errorResult.message);
        }
        showAdminNotification(`User ${action}d successfully!`, 'success');
        loadTabData('users');
    } catch (error) {
        console.error(`Error ${action}ing user:`, error);
        showAdminNotification(`Error ${action}ing user: ${error.message}`, 'error');
    }
}

// --- Branch Management CRUD ---
function handleAddBranchClick() {
    const modalId = 'addBranchModal';
    const title = 'Add New Branch';
    const bodyHtml = `
        <form id="add-branch-form">
            <div class="form-group">
                <label for="branch-name" class="form-label">Branch Name</label>
                <input type="text" id="branch-name" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="branch-address" class="form-label">Address</label>
                <input type="text" id="branch-address" class="form-input" required>
            </div>
            <div class="form-group">
                <label for="branch-phone" class="form-label">Phone</label>
                <input type="tel" id="branch-phone" class="form-input">
            </div>
            <div class="form-group">
                <label for="branch-email" class="form-label">Email</label>
                <input type="email" id="branch-email" class="form-input">
            </div>
            <div id="add-branch-error" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="add-branch-form" class="btn btn-primary">Add Branch</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById('add-branch-form').onsubmit = submitAddBranchForm;
    showModal(modalId);
}

async function submitAddBranchForm(event) {
    event.preventDefault();
    const modalId = 'addBranchModal';
    const name = document.getElementById('branch-name').value;
    const address = document.getElementById('branch-address').value;
    const phone = document.getElementById('branch-phone').value;
    const email = document.getElementById('branch-email').value;
    const errorDiv = document.getElementById('add-branch-error');
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!name || !address) {
        errorDiv.textContent = 'Branch Name and Address are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch('/api/admin/branches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, address, phone, email })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to add branch.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Branch added successfully!', 'success');
        closeModal(modalId);
        loadTabData('branches');
    } catch (error) {
        console.error('Error adding branch:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error adding branch: ${error.message}`, 'error');
    }
}

function handleEditBranchClick(branchId) {
    const branchData = allBranchesData.find(b => b.id == branchId);
    if (!branchData) {
        showAdminNotification('Branch not found.', 'error');
        return;
    }
    const modalId = `editBranchModal-${branchId}`;
    const title = `Edit Branch (ID: #${branchId})`;
    const bodyHtml = `
        <form id="edit-branch-form-${branchId}">
            <input type="hidden" value="${branchData.id}">
            <div class="form-group">
                <label for="edit-branch-name-${branchId}" class="form-label">Branch Name</label>
                <input type="text" id="edit-branch-name-${branchId}" class="form-input" value="${branchData.name || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-branch-address-${branchId}" class="form-label">Address</label>
                <input type="text" id="edit-branch-address-${branchId}" class="form-input" value="${branchData.address || ''}" required>
            </div>
            <div class="form-group">
                <label for="edit-branch-phone-${branchId}" class="form-label">Phone</label>
                <input type="tel" id="edit-branch-phone-${branchId}" class="form-input" value="${branchData.phone || branchData.contact?.phone || ''}">
            </div>
            <div class="form-group">
                <label for="edit-branch-email-${branchId}" class="form-label">Email</label>
                <input type="email" id="edit-branch-email-${branchId}" class="form-input" value="${branchData.email || branchData.contact?.email || ''}">
            </div>
             <div id="edit-branch-error-${branchId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-branch-form-${branchId}" class="btn btn-primary">Save Changes</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-branch-form-${branchId}`).onsubmit = submitEditBranchForm;
    showModal(modalId);
}

async function submitEditBranchForm(event) {
    event.preventDefault();
    const form = event.target;
    const branchId = form.querySelector('input[type="hidden"]').value;
    const modalId = `editBranchModal-${branchId}`;

    const name = form.querySelector(`#edit-branch-name-${branchId}`).value;
    const address = form.querySelector(`#edit-branch-address-${branchId}`).value;
    const phone = form.querySelector(`#edit-branch-phone-${branchId}`).value;
    const email = form.querySelector(`#edit-branch-email-${branchId}`).value;
    const errorDiv = form.querySelector(`#edit-branch-error-${branchId}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    if (!name || !address) {
        errorDiv.textContent = 'Branch Name and Address are required.';
        errorDiv.style.display = 'block';
        return;
    }
    try {
        const response = await fetch(`/api/admin/branches`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: parseInt(branchId), name, address, phone, email })
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update branch.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Branch updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('branches');
    } catch (error) {
        console.error('Error updating branch:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating branch: ${error.message}`, 'error');
    }
}

// --- Invoice Management ---
function handleViewInvoiceClick(invoiceIdFromButton) {
    const invoiceData = allInvoicesData.find(inv => (inv.id == invoiceIdFromButton || inv.invoiceNumber == invoiceIdFromButton));
    if (!invoiceData) {
        showAdminNotification('Invoice not found.', 'error');
        return;
    }
    const modalId = `viewInvoiceModal-${invoiceData.id || invoiceData.invoiceNumber}`;
    const title = `View Invoice Details (ID: #${invoiceData.invoiceNumber || invoiceData.id})`;

    const bodyHtml = `
        <div class="invoice-details-view">
            <p><strong>Invoice Number:</strong> #${invoiceData.invoiceNumber || invoiceData.id}</p>
            <p><strong>Customer:</strong> ${invoiceData.customerName || 'N/A'}</p>
            <p><strong>Job ID:</strong> #${invoiceData.jobId || 'N/A'}</p>
            <p><strong>Service:</strong> ${invoiceData.serviceName || 'N/A'}</p>
            <p><strong>Amount:</strong> ${invoiceData.amount ? '$' + parseFloat(invoiceData.amount).toFixed(2) : 'N/A'}</p>
            <p><strong>Tax:</strong> ${invoiceData.taxAmount ? '$' + parseFloat(invoiceData.taxAmount).toFixed(2) : 'N/A'}</p>
            <p><strong>Total Amount:</strong> ${invoiceData.totalAmount ? '$' + parseFloat(invoiceData.totalAmount).toFixed(2) : 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status-badge status-${(invoiceData.status || 'unknown').toLowerCase()}">${invoiceData.status || 'Unknown'}</span></p>
            <p><strong>Due Date:</strong> ${invoiceData.dueDate ? new Date(invoiceData.dueDate).toLocaleDateString() : 'N/A'}</p>
            <p><strong>Created At:</strong> ${invoiceData.createdAt ? new Date(invoiceData.createdAt).toLocaleString() : 'N/A'}</p>
        </div>
    `;
    const footerHtml = `<button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Close</button>`;
    createModal(modalId, title, bodyHtml, footerHtml);
    showModal(modalId);
}

function handleEditInvoiceClick(invoiceIdFromButton) {
    const invoiceData = allInvoicesData.find(inv => (inv.id == invoiceIdFromButton || inv.invoiceNumber == invoiceIdFromButton));
    if (!invoiceData) {
        showAdminNotification('Invoice not found.', 'error');
        return;
    }
    const actualId = invoiceData.id || invoiceData.invoiceNumber;
    const modalId = `editInvoiceModal-${actualId}`;
    const title = `Edit Invoice (ID: #${invoiceData.invoiceNumber || invoiceData.id})`;
    const statuses = ['Draft', 'Sent', 'Paid', 'Void', 'Overdue'];
    let statusOptions = '';
    statuses.forEach(s => {
        statusOptions += `<option value="${s}" ${invoiceData.status === s ? 'selected' : ''}>${s}</option>`;
    });

    const bodyHtml = `
        <form id="edit-invoice-form-${actualId}">
            <input type="hidden" value="${invoiceData.id}">
            <p><strong>Invoice:</strong> #${invoiceData.invoiceNumber || invoiceData.id} <strong>Customer:</strong> ${invoiceData.customerName}</p>
            <div class="form-group">
                <label for="edit-invoice-status-${actualId}" class="form-label">Status</label>
                <select id="edit-invoice-status-${actualId}" class="form-input">${statusOptions}</select>
            </div>
            <div id="edit-invoice-error-${actualId}" class="text-error" style="display:none; margin-bottom: var(--space-3);"></div>
        </form>
    `;
    const footerHtml = `
        <button type="button" class="btn btn-secondary" onclick="closeModal('${modalId}')">Cancel</button>
        <button type="submit" form="edit-invoice-form-${actualId}" class="btn btn-primary">Save Changes</button>
    `;
    createModal(modalId, title, bodyHtml, footerHtml);
    document.getElementById(`edit-invoice-form-${actualId}`).onsubmit = submitEditInvoiceForm;
    showModal(modalId);
}

async function submitEditInvoiceForm(event) {
    event.preventDefault();
    const form = event.target;
    const dbId = form.querySelector('input[type="hidden"]').value;
    const formIdSuffix = form.id.split('-').pop();
    const modalId = `editInvoiceModal-${formIdSuffix}`;
    const status = form.querySelector(`#edit-invoice-status-${formIdSuffix}`).value;
    const errorDiv = form.querySelector(`#edit-invoice-error-${formIdSuffix}`);
    errorDiv.style.display = 'none'; errorDiv.textContent = '';

    try {
        const payload = { id: parseInt(dbId), status };
        const response = await fetch(`/api/admin/invoices`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            const errorResult = await response.json().catch(() => ({ message: 'Failed to update invoice.' }));
            throw new Error(errorResult.message);
        }
        showAdminNotification('Invoice updated successfully!', 'success');
        closeModal(modalId);
        loadTabData('invoices');
    } catch (error) {
        console.error('Error updating invoice:', error);
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
        showAdminNotification(`Error updating invoice: ${error.message}`, 'error');
    }
}


// Global Event Delegation for dynamic buttons
function initializeGlobalEventDelegation() {
    document.addEventListener('click', function(event) {
        if (event.target.matches('.view-job-btn')) {
            handleViewJobClick(event.target.dataset.jobId);
        } else if (event.target.matches('.edit-job-btn')) {
            handleEditJobClick(event.target.dataset.jobId);
        } else if (event.target.matches('.edit-service-btn')) {
            handleEditServiceClick(event.target.dataset.serviceId);
        } else if (event.target.matches('.delete-service-btn')) {
            handleDeleteServiceClick(event.target.dataset.serviceId);
        } else if (event.target.matches('.edit-inventory-btn')) {
            handleEditInventoryItemClick(event.target.dataset.itemId);
        } else if (event.target.matches('.adjust-stock-btn')) {
            handleAdjustStockClick(event.target.dataset.itemId);
        } else if (event.target.matches('.edit-user-btn')) {
            handleEditUserClick(event.target.dataset.userId);
        } else if (event.target.matches('.toggle-user-status-btn')) {
            handleToggleUserStatusClick(event.target.dataset.userId, event.target.dataset.currentStatus);
        } else if (event.target.matches('.edit-branch-btn')) {
            handleEditBranchClick(event.target.dataset.branchId);
        } else if (event.target.matches('.view-invoice-btn')) {
            handleViewInvoiceClick(event.target.dataset.invoiceId);
        } else if (event.target.matches('.edit-invoice-btn')) {
            handleEditInvoiceClick(event.target.dataset.invoiceId);
        }
    });
}

// Event listeners for header action buttons (static)
function initializeHeaderActionButtons() {
    const createJobBtn = document.getElementById('create-job-btn');
    if (createJobBtn) createJobBtn.addEventListener('click', handleCreateJobClick);

    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) addServiceBtn.addEventListener('click', handleAddServiceClick);

    const addInventoryItemBtn = document.getElementById('add-inventory-item-btn');
    if (addInventoryItemBtn) addInventoryItemBtn.addEventListener('click', handleAddInventoryItemClick);

    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) addUserBtn.addEventListener('click', handleAddUserClick);

    const addBranchBtn = document.getElementById('add-branch-btn');
    if (addBranchBtn) addBranchBtn.addEventListener('click', handleAddBranchClick);

    const refreshOverviewBtn = document.getElementById('refresh-overview-btn');
    if(refreshOverviewBtn) refreshOverviewBtn.addEventListener('click', () => loadTabData('overview'));

    const refreshInvoicesBtn = document.getElementById('refresh-invoices-btn');
    if(refreshInvoicesBtn) refreshInvoicesBtn.addEventListener('click', () => loadTabData('invoices'));

    const generateReportBtn = document.getElementById('generate-report-btn');
    if(generateReportBtn) generateReportBtn.addEventListener('click', () => alert('Generate Report functionality (Not implemented yet)'));
}
