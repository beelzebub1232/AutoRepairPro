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
    const contentArea = document.getElementById(contentAreaId);

    if (!contentArea) {
        console.error(`Content area for tab ${tab} not found!`);
        return;
    }

    // Placeholder: Clear content and show loading message
    contentArea.innerHTML = `<p>Loading ${tab} data...</p>`;

    switch(tab) {
        case 'overview':
            loadOverviewData(contentArea);
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
            contentArea.innerHTML = `<p>This section (${tab}) is under construction.</p>`;
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

// Placeholder data loading functions
// These will be expanded in subsequent steps

function loadOverviewData(contentArea) {
    // Example: Fetch and render overview stats
    fetch('/api/admin/dashboard') // Assuming AdminHandler.java has a /dashboard endpoint
        .then(response => response.json())
        .then(data => {
            let html = '<h3>Dashboard Metrics</h3><div class="metrics-grid">';
            // Example: Displaying a few key metrics from AdminHandler's getDashboardStats
            if (data.totalJobs !== undefined) {
                 html += `<div class="metric-card"><h4>Total Jobs</h4><p>${data.totalJobs}</p></div>`;
            }
            if (data.totalRevenue !== undefined) {
                 html += `<div class="metric-card"><h4>Total Revenue</h4><p>$${data.totalRevenue.toFixed(2)}</p></div>`;
            }
            if (data.totalCustomers !== undefined) {
                 html += `<div class="metric-card"><h4>Active Customers</h4><p>${data.totalCustomers}</p></div>`;
            }
            if (data.lowStockItems !== undefined) {
                 html += `<div class="metric-card"><h4>Low Stock Items</h4><p>${data.lowStockItems}</p></div>`;
            }
            html += '</div>';
            contentArea.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading overview data:', error);
            contentArea.innerHTML = '<p class="text-error">Failed to load overview data. Please try again.</p>';
        });
}

function loadJobsData(contentArea) {
    fetch('/api/admin/jobs')
        .then(response => response.json())
        .then(jobs => {
            if (!Array.isArray(jobs)) {
                throw new Error("Jobs data is not an array");
            }
            let tableHtml = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Job ID</th>
                                <th>Customer</th>
                                <th>Vehicle</th>
                                <th>Service</th>
                                <th>Status</th>
                                <th>Employee</th>
                                <th>Cost</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-job-table-body">`;

            if (jobs.length === 0) {
                tableHtml += `<tr><td colspan="8" class="text-center">No jobs found.</td></tr>`;
            } else {
                jobs.forEach(job => {
                    tableHtml += `
                        <tr>
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
            contentArea.innerHTML = '<p class="text-error">Failed to load jobs data. Please try again.</p>';
        });
}

function loadServicesData(contentArea) {
     fetch('/api/admin/services')
        .then(response => response.json())
        .then(services => {
            if (!Array.isArray(services)) {
                throw new Error("Services data is not an array");
            }
            let tableHtml = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Service Name</th>
                                <th>Price</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-services-table-body">`;

            if (services.length === 0) {
                tableHtml += `<tr><td colspan="5" class="text-center">No services found.</td></tr>`;
            } else {
                services.forEach(service => {
                    tableHtml += `
                        <tr>
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
            contentArea.innerHTML = '<p class="text-error">Failed to load services data. Please try again.</p>';
        });
}

function loadInventoryData(contentArea) {
    fetch('/api/admin/inventory')
        .then(response => response.json())
        .then(inventoryItems => {
            if (!Array.isArray(inventoryItems)) {
                throw new Error("Inventory data is not an array");
            }
            let tableHtml = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Part Name</th>
                                <th>Quantity</th>
                                <th>Min. Quantity</th>
                                <th>Price/Unit</th>
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-inventory-table-body">`;

            if (inventoryItems.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No inventory items found.</td></tr>`;
            } else {
                inventoryItems.forEach(item => {
                    tableHtml += `
                        <tr class="${item.quantity <= item.minQuantity ? 'low-stock-warning' : ''}">
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
            contentArea.innerHTML = '<p class="text-error">Failed to load inventory data. Please try again.</p>';
        });
}

function loadBranchesData(contentArea) {
    fetch('/api/admin/branches')
        .then(response => response.json())
        .then(branches => {
            if (!Array.isArray(branches)) {
                throw new Error("Branches data is not an array");
            }
            let html = '<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">';
            if (branches.length === 0) {
                html = `<p class="text-center col-span-full">No branches found.</p>`;
            } else {
                branches.forEach(branch => {
                    html += `
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">${branch.name || 'Unnamed Branch'}</h3>
                            </div>
                            <div class="card-body">
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
            contentArea.innerHTML = '<p class="text-error">Failed to load branches data. Please try again.</p>';
        });
}

function loadUsersData(contentArea) {
    fetch('/api/admin/users')
        .then(response => response.json())
        .then(users => {
            if (!Array.isArray(users)) {
                throw new Error("Users data is not an array");
            }
            let tableHtml = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-users-table-body">`;
            if (users.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No users found.</td></tr>`;
            } else {
                users.forEach(user => {
                    tableHtml += `
                        <tr>
                            <td>#${user.id}</td>
                            <td>${user.username || 'N/A'}</td>
                            <td>${user.fullName || 'N/A'}</td>
                            <td>${user.email || 'N/A'}</td>
                            <td><span class="role-badge role-${(user.role || 'unknown').toLowerCase()}">${user.role || 'Unknown'}</span></td>
                            <td>${user.isActive ? 'Yes' : 'No'}</td>
                            <td>
                                <button class="btn btn-sm btn-secondary edit-user-btn" data-user-id="${user.id}">Edit</button>
                                <button class="btn btn-sm btn-${user.isActive ? 'danger' : 'success'} toggle-user-status-btn" data-user-id="${user.id}">
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
            contentArea.innerHTML = '<p class="text-error">Failed to load users data. Please try again.</p>';
        });
}

function loadInvoicesData(contentArea) {
    fetch('/api/admin/invoices')
        .then(response => response.json())
        .then(invoices => {
            if (!Array.isArray(invoices)) {
                throw new Error("Invoices data is not an array");
            }
            let tableHtml = `
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Invoice ID</th>
                                <th>Customer</th>
                                <th>Job ID</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Due Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="admin-invoices-table-body">`;
            if (invoices.length === 0) {
                tableHtml += `<tr><td colspan="7" class="text-center">No invoices found.</td></tr>`;
            } else {
                invoices.forEach(invoice => {
                    tableHtml += `
                        <tr>
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
            contentArea.innerHTML = '<p class="text-error">Failed to load invoices data. Please try again.</p>';
        });
}

function loadReportsData(contentArea) {
    // For now, just a placeholder. More complex report rendering can be added.
    contentArea.innerHTML = `
        <h3>Reports & Analytics</h3>
        <p>This section will display various business reports and analytics.</p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="card">
                <div class="card-header"><h4 class="card-title">Revenue Report (Placeholder)</h4></div>
                <div class="card-body"><p>Chart or data for revenue will go here.</p></div>
            </div>
            <div class="card">
                <div class="card-header"><h4 class="card-title">Service Distribution (Placeholder)</h4></div>
                <div class="card-body"><p>Chart or data for service distribution.</p></div>
            </div>
        </div>`;
}

function loadSettingsData(contentArea) {
    fetch('/api/admin/settings')
        .then(response => response.json())
        .then(settings => {
            if (!Array.isArray(settings)) {
                throw new Error("Settings data is not an array");
            }
            let formHtml = '<h3>System Settings</h3><form id="settings-form">';
            if (settings.length === 0) {
                formHtml = `<p>No settings available for configuration.</p>`;
            } else {
                settings.filter(s => s.isPublic).forEach(setting => { // Only show public settings as per AdminHandler
                    formHtml += `
                        <div class="form-group">
                            <label for="setting-${setting.key}" class="form-label">${setting.description || setting.key}</label>`;
                    if (setting.type === 'boolean') {
                        formHtml += `<input type="checkbox" id="setting-${setting.key}" name="${setting.key}" class="form-checkbox" ${setting.value === 'true' ? 'checked' : ''}>`;
                    } else if (setting.type === 'number') {
                        formHtml += `<input type="number" id="setting-${setting.key}" name="${setting.key}" value="${setting.value}" class="form-input">`;
                    } else { // text or other
                        formHtml += `<input type="text" id="setting-${setting.key}" name="${setting.key}" value="${setting.value}" class="form-input">`;
                    }
                    formHtml += `</div>`;
                });
                formHtml += `<div class="form-actions">
                                <button type="submit" class="btn btn-primary">Save Settings</button>
                             </div>`;
            }
            formHtml += '</form>';
            contentArea.innerHTML = formHtml;

            if (document.getElementById('settings-form')) {
                document.getElementById('settings-form').addEventListener('submit', (e) => {
                    e.preventDefault();
                    // Add logic to save settings (POST/PUT to /api/admin/settings)
                    alert('Saving settings... (Not implemented yet)');
                });
            }
        })
        .catch(error => {
            console.error('Error loading settings data:', error);
            contentArea.innerHTML = '<p class="text-error">Failed to load settings data. Please try again.</p>';
        });
}

// Utility to show notification (can be expanded)
function showAdminNotification(message, type = 'info') {
    // Assuming notifications.js provides a global way to show notifications
    if (window.notificationManager && window.notificationManager.addNotification) {
        window.notificationManager.addNotification({ title: type.toUpperCase(), message, type });
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Event listeners for dynamically added buttons
document.addEventListener('click', function(event) {
    // View buttons
    if (event.target.matches('.view-job-btn')) {
        alert(`View Job ID: ${event.target.dataset.jobId} (Not implemented yet)`);
    }
    if (event.target.matches('.view-invoice-btn')) {
        alert(`View Invoice ID: ${event.target.dataset.invoiceId} (Not implemented yet)`);
    }

    // Edit buttons
    if (event.target.matches('.edit-job-btn')) {
        alert(`Edit Job ID: ${event.target.dataset.jobId} (Not implemented yet)`);
    }
    if (event.target.matches('.edit-service-btn')) {
        alert(`Edit Service ID: ${event.target.dataset.serviceId} (Not implemented yet)`);
    }
    if (event.target.matches('.edit-inventory-btn')) {
        alert(`Edit Inventory Item ID: ${event.target.dataset.itemId} (Not implemented yet)`);
    }
    if (event.target.matches('.edit-branch-btn')) {
        alert(`Edit Branch ID: ${event.target.dataset.branchId} (Not implemented yet)`);
    }
    if (event.target.matches('.edit-user-btn')) {
        alert(`Edit User ID: ${event.target.dataset.userId} (Not implemented yet)`);
    }
    if (event.target.matches('.edit-invoice-btn')) {
        alert(`Edit Invoice ID: ${event.target.dataset.invoiceId} (Not implemented yet)`);
    }

    // Delete buttons
    if (event.target.matches('.delete-service-btn')) {
        if (confirm(`Are you sure you want to delete Service ID: ${event.target.dataset.serviceId}?`)) {
            alert(`Delete Service ID: ${event.target.dataset.serviceId} (Not implemented yet)`);
        }
    }

    // Other actions
    if (event.target.matches('.adjust-stock-btn')) {
        alert(`Adjust Stock for Item ID: ${event.target.dataset.itemId} (Not implemented yet)`);
    }
    if (event.target.matches('.toggle-user-status-btn')) {
        alert(`Toggle Status for User ID: ${event.target.dataset.userId} (Not implemented yet)`);
    }
});


// Event listeners for header action buttons (Add/Create)
document.addEventListener('DOMContentLoaded', () => {
    // This will run after the main DOMContentLoaded for dashboard initialization
    // Ensure these elements are present in admin.html
    const createJobBtn = document.getElementById('create-job-btn');
    if (createJobBtn) {
        createJobBtn.addEventListener('click', () => alert('Create New Job form/modal (Not implemented yet)'));
    }

    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => alert('Add New Service form/modal (Not implemented yet)'));
    }

    const addInventoryItemBtn = document.getElementById('add-inventory-item-btn');
    if (addInventoryItemBtn) {
        addInventoryItemBtn.addEventListener('click', () => alert('Add New Inventory Item form/modal (Not implemented yet)'));
    }

    const addBranchBtn = document.getElementById('add-branch-btn');
    if (addBranchBtn) {
        addBranchBtn.addEventListener('click', () => alert('Add New Branch form/modal (Not implemented yet)'));
    }

    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => alert('Add New User form/modal (Not implemented yet)'));
    }

    const refreshOverviewBtn = document.getElementById('refresh-overview-btn');
    if(refreshOverviewBtn) {
        refreshOverviewBtn.addEventListener('click', () => loadTabData('overview'));
    }

    const refreshInvoicesBtn = document.getElementById('refresh-invoices-btn');
    if(refreshInvoicesBtn) {
        refreshInvoicesBtn.addEventListener('click', () => loadTabData('invoices'));
    }

    const generateReportBtn = document.getElementById('generate-report-btn');
    if(generateReportBtn) {
        generateReportBtn.addEventListener('click', () => alert('Generate Report functionality (Not implemented yet)'));
    }
});
