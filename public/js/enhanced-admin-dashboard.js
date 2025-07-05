// Enhanced Admin Dashboard with Advanced Features
document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check: if no user role or not admin, redirect to login
    if (!userRole || userRole !== 'admin') {
        window.location.href = '/index.html';
        return;
    }

    // Personalize the dashboard
    const userInfoSpan = document.getElementById('user-info');
    if (userInfoSpan) {
        userInfoSpan.textContent = `Welcome, ${userName}!`;
    }

    // Logout functionality
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = '/index.html';
        });
    }

    // Initialize all modules
    initializeTabNavigation();
    initializeOverviewModule();
    initializeJobsModule();
    initializeServicesModule();
    initializeInventoryModule();
    initializeUsersModule();
    initializeReportsModule();
    
    // Load initial data
    loadOverviewData();
});

// Tab Navigation System
function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            document.getElementById(`${targetTab}-tab`).classList.add('active');
            
            // Load data for the active tab
            switch(targetTab) {
                case 'overview':
                    loadOverviewData();
                    break;
                case 'jobs':
                    loadAllJobs();
                    break;
                case 'services':
                    loadServices();
                    break;
                case 'inventory':
                    loadInventory();
                    break;
                case 'users':
                    loadUsers();
                    break;
                case 'reports':
                    loadReports();
                    break;
            }
        });
    });
}

// Overview Module
function initializeOverviewModule() {
    const refreshBtn = document.getElementById('refresh-overview-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadOverviewData);
    }
}

async function loadOverviewData() {
    try {
        // Update KPIs
        if (window.advancedReporting) {
            await window.advancedReporting.updateKPIDashboard();
            
            // Generate overview charts
            await window.advancedReporting.generateRevenueChart('overview-revenue-chart');
            await window.advancedReporting.generateServicePerformanceChart('overview-service-chart');
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
    }
}

// Jobs Module (Enhanced from existing)
function initializeJobsModule() {
    const createJobBtn = document.getElementById('create-job-btn');
    const jobModal = document.getElementById('job-modal');
    const jobForm = document.getElementById('job-form');
    const jobModalClose = document.getElementById('job-modal-close');
    const jobCancelBtn = document.getElementById('job-cancel-btn');

    createJobBtn.addEventListener('click', () => {
        loadJobFormData();
        showModal(jobModal);
    });

    jobModalClose.addEventListener('click', () => hideModal(jobModal));
    jobCancelBtn.addEventListener('click', () => hideModal(jobModal));

    jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createJob();
    });

    // Customer selection change handler
    document.getElementById('job-customer').addEventListener('change', loadCustomerVehicles);
}

async function loadAllJobs() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        populateJobTable(jobs);
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs');
    }
}

function populateJobTable(jobs) {
    const tableBody = document.getElementById('job-table-body');
    tableBody.innerHTML = '';

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="no-data">No jobs found.</td></tr>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.jobId}</td>
            <td>${job.customerName}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${job.assignedEmployee || 'Unassigned'}</td>
            <td>${job.totalCost ? '$' + job.totalCost : 'Not calculated'}</td>
            <td class="actions">
                ${job.status === 'Booked' && !job.assignedEmployee ? 
                    `<button class="btn btn-sm btn-primary" onclick="showAssignModal(${job.jobId})">Assign</button>` : ''}
                ${job.status === 'Completed' && !job.totalCost ? 
                    `<button class="btn btn-sm btn-success" onclick="generateInvoice(${job.jobId})">Invoice</button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadJobFormData() {
    try {
        // Load customers
        const customersResponse = await fetch('http://localhost:8080/api/admin/users');
        const users = await customersResponse.json();
        const customers = users.filter(user => user.role === 'customer');
        
        const customerSelect = document.getElementById('job-customer');
        customerSelect.innerHTML = '<option value="">Select Customer</option>';
        customers.forEach(customer => {
            customerSelect.innerHTML += `<option value="${customer.id}">${customer.fullName}</option>`;
        });

        // Load services
        const servicesResponse = await fetch('http://localhost:8080/api/admin/services');
        const services = await servicesResponse.json();
        
        const serviceSelect = document.getElementById('job-service');
        serviceSelect.innerHTML = '<option value="">Select Service</option>';
        services.forEach(service => {
            serviceSelect.innerHTML += `<option value="${service.id}">${service.serviceName} - $${service.price}</option>`;
        });

        // Set default booking date to now
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        document.getElementById('job-booking-date').value = now.toISOString().slice(0, 16);

    } catch (error) {
        console.error('Error loading job form data:', error);
        showError('Failed to load form data');
    }
}

async function loadCustomerVehicles() {
    const customerId = document.getElementById('job-customer').value;
    const vehicleSelect = document.getElementById('job-vehicle');
    
    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
    
    if (!customerId) return;

    try {
        const response = await fetch(`http://localhost:8080/api/customer/vehicles/${customerId}`);
        const vehicles = await response.json();
        
        vehicles.forEach(vehicle => {
            vehicleSelect.innerHTML += `<option value="${vehicle.id}">${vehicle.make} ${vehicle.model} (${vehicle.year})</option>`;
        });
    } catch (error) {
        console.error('Error loading customer vehicles:', error);
        showError('Failed to load customer vehicles');
    }
}

async function createJob() {
    const formData = {
        customerId: document.getElementById('job-customer').value,
        vehicleId: document.getElementById('job-vehicle').value,
        serviceId: document.getElementById('job-service').value,
        bookingDate: document.getElementById('job-booking-date').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/admin/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('job-modal'));
            showSuccess('Job created successfully');
            loadAllJobs();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: 'Job Created',
                    message: `New job #${result.jobId} has been created successfully`
                });
            }
        } else {
            showError(result.error || 'Failed to create job');
        }
    } catch (error) {
        console.error('Error creating job:', error);
        showError('Failed to create job');
    }
}

// Services Module (Enhanced from existing)
function initializeServicesModule() {
    const addServiceBtn = document.getElementById('add-service-btn');
    const serviceModal = document.getElementById('service-modal');
    const serviceForm = document.getElementById('service-form');
    const serviceModalClose = document.getElementById('service-modal-close');
    const serviceCancelBtn = document.getElementById('service-cancel-btn');

    addServiceBtn.addEventListener('click', () => {
        resetServiceForm();
        document.getElementById('service-modal-title').textContent = 'Add New Service';
        showModal(serviceModal);
    });

    serviceModalClose.addEventListener('click', () => hideModal(serviceModal));
    serviceCancelBtn.addEventListener('click', () => hideModal(serviceModal));

    serviceForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveService();
    });
}

async function loadServices() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        
        const services = await response.json();
        populateServicesTable(services);
    } catch (error) {
        console.error('Error loading services:', error);
        showError('Failed to load services');
    }
}

function populateServicesTable(services) {
    const tableBody = document.getElementById('services-table-body');
    tableBody.innerHTML = '';

    if (services.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="no-data">No services found.</td></tr>';
        return;
    }

    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.id}</td>
            <td>${service.serviceName}</td>
            <td>$${service.price}</td>
            <td>${service.description || ''}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editService(${service.id})">Edit</button>
                <button class="btn btn-sm btn-danger" onclick="deleteService(${service.id})">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function resetServiceForm() {
    document.getElementById('service-form').reset();
    document.getElementById('service-id').value = '';
}

async function saveService() {
    const serviceId = document.getElementById('service-id').value;
    const formData = {
        serviceName: document.getElementById('service-name').value,
        price: parseFloat(document.getElementById('service-price').value),
        description: document.getElementById('service-description').value
    };

    const isEdit = serviceId !== '';
    const url = isEdit ? 
        `http://localhost:8080/api/admin/services/${serviceId}` : 
        'http://localhost:8080/api/admin/services';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('service-modal'));
            showSuccess(isEdit ? 'Service updated successfully' : 'Service added successfully');
            loadServices();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: isEdit ? 'Service Updated' : 'Service Added',
                    message: `Service "${formData.serviceName}" has been ${isEdit ? 'updated' : 'added'} successfully`
                });
            }
        } else {
            showError(result.error || 'Failed to save service');
        }
    } catch (error) {
        console.error('Error saving service:', error);
        showError('Failed to save service');
    }
}

async function editService(serviceId) {
    try {
        const response = await fetch('http://localhost:8080/api/admin/services');
        const services = await response.json();
        const service = services.find(s => s.id === serviceId);
        
        if (service) {
            document.getElementById('service-id').value = service.id;
            document.getElementById('service-name').value = service.serviceName;
            document.getElementById('service-price').value = service.price;
            document.getElementById('service-description').value = service.description || '';
            document.getElementById('service-modal-title').textContent = 'Edit Service';
            showModal(document.getElementById('service-modal'));
        }
    } catch (error) {
        console.error('Error loading service for edit:', error);
        showError('Failed to load service details');
    }
}

async function deleteService(serviceId) {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/services/${serviceId}`, {
            method: 'DELETE'
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Service deleted successfully');
            loadServices();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'warning',
                    title: 'Service Deleted',
                    message: 'A service has been removed from the system'
                });
            }
        } else {
            showError(result.error || 'Failed to delete service');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        showError('Failed to delete service');
    }
}

// Inventory Module (Enhanced from existing)
function initializeInventoryModule() {
    const addInventoryBtn = document.getElementById('add-inventory-btn');
    const lowStockBtn = document.getElementById('low-stock-btn');
    const inventoryModal = document.getElementById('inventory-modal');
    const inventoryForm = document.getElementById('inventory-form');
    const inventoryModalClose = document.getElementById('inventory-modal-close');
    const inventoryCancelBtn = document.getElementById('inventory-cancel-btn');

    addInventoryBtn.addEventListener('click', () => {
        resetInventoryForm();
        document.getElementById('inventory-modal-title').textContent = 'Add New Inventory Item';
        showModal(inventoryModal);
    });

    lowStockBtn.addEventListener('click', loadLowStockAlerts);

    inventoryModalClose.addEventListener('click', () => hideModal(inventoryModal));
    inventoryCancelBtn.addEventListener('click', () => hideModal(inventoryModal));

    inventoryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveInventoryItem();
    });
}

async function loadInventory() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const inventory = await response.json();
        populateInventoryTable(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Failed to load inventory');
    }
}

function populateInventoryTable(inventory) {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';

    if (inventory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No inventory items found.</td></tr>';
        return;
    }

    inventory.forEach(item => {
        const totalValue = (item.quantity * item.pricePerUnit).toFixed(2);
        const lowStock = item.quantity < 10 ? 'low-stock' : '';
        
        const row = document.createElement('tr');
        row.className = lowStock;
        row.innerHTML = `
            <td>${item.id}</td>
            <td>${item.partName}</td>
            <td class="${lowStock}">${item.quantity}</td>
            <td>$${item.pricePerUnit}</td>
            <td>$${totalValue}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editInventoryItem(${item.id})">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadLowStockAlerts() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory/alerts');
        if (!response.ok) throw new Error('Failed to fetch low stock alerts');
        
        const lowStockItems = await response.json();
        
        if (lowStockItems.length === 0) {
            showSuccess('No low stock items found!');
        } else {
            const itemsList = lowStockItems.map(item => 
                `${item.partName}: ${item.quantity} remaining`
            ).join('\n');
            alert(`Low Stock Alert!\n\n${itemsList}`);
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'warning',
                    title: 'Low Stock Alert',
                    message: `${lowStockItems.length} items are running low in inventory`
                });
            }
        }
    } catch (error) {
        console.error('Error loading low stock alerts:', error);
        showError('Failed to load low stock alerts');
    }
}

function resetInventoryForm() {
    document.getElementById('inventory-form').reset();
    document.getElementById('inventory-id').value = '';
}

async function saveInventoryItem() {
    const inventoryId = document.getElementById('inventory-id').value;
    const formData = {
        partName: document.getElementById('part-name').value,
        quantity: parseInt(document.getElementById('part-quantity').value),
        pricePerUnit: parseFloat(document.getElementById('part-price').value)
    };

    const isEdit = inventoryId !== '';
    const url = isEdit ? 
        `http://localhost:8080/api/admin/inventory/${inventoryId}` : 
        'http://localhost:8080/api/admin/inventory';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('inventory-modal'));
            showSuccess(isEdit ? 'Inventory item updated successfully' : 'Inventory item added successfully');
            loadInventory();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: isEdit ? 'Inventory Updated' : 'Inventory Added',
                    message: `Part "${formData.partName}" has been ${isEdit ? 'updated' : 'added'} successfully`
                });
            }
        } else {
            showError(result.error || 'Failed to save inventory item');
        }
    } catch (error) {
        console.error('Error saving inventory item:', error);
        showError('Failed to save inventory item');
    }
}

async function editInventoryItem(inventoryId) {
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        const inventory = await response.json();
        const item = inventory.find(i => i.id === inventoryId);
        
        if (item) {
            document.getElementById('inventory-id').value = item.id;
            document.getElementById('part-name').value = item.partName;
            document.getElementById('part-quantity').value = item.quantity;
            document.getElementById('part-price').value = item.pricePerUnit;
            document.getElementById('inventory-modal-title').textContent = 'Edit Inventory Item';
            showModal(document.getElementById('inventory-modal'));
        }
    } catch (error) {
        console.error('Error loading inventory item for edit:', error);
        showError('Failed to load inventory item details');
    }
}

// Users Module (Enhanced from existing)
function initializeUsersModule() {
    const addUserBtn = document.getElementById('add-user-btn');
    const userModal = document.getElementById('user-modal');
    const userForm = document.getElementById('user-form');
    const userModalClose = document.getElementById('user-modal-close');
    const userCancelBtn = document.getElementById('user-cancel-btn');

    addUserBtn.addEventListener('click', () => {
        resetUserForm();
        document.getElementById('user-modal-title').textContent = 'Add New User';
        showModal(userModal);
    });

    userModalClose.addEventListener('click', () => hideModal(userModal));
    userCancelBtn.addEventListener('click', () => hideModal(userModal));

    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveUser();
    });
}

async function loadUsers() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        
        const users = await response.json();
        populateUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Failed to load users');
    }
}

function populateUsersTable(users) {
    const tableBody = document.getElementById('users-table-body');
    tableBody.innerHTML = '';

    if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No users found.</td></tr>';
        return;
    }

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.fullName}</td>
            <td><span class="role-badge role-${user.role}">${user.role}</span></td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-sm btn-secondary" onclick="editUser(${user.id})">Edit</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function resetUserForm() {
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
}

async function saveUser() {
    const userId = document.getElementById('user-id').value;
    const formData = {
        username: document.getElementById('user-username').value,
        fullName: document.getElementById('user-fullname').value,
        role: document.getElementById('user-role').value
    };

    const password = document.getElementById('user-password').value;
    if (password) {
        formData.password = password;
    }

    const isEdit = userId !== '';
    const url = isEdit ? 
        `http://localhost:8080/api/admin/users/${userId}` : 
        'http://localhost:8080/api/admin/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('user-modal'));
            showSuccess(isEdit ? 'User updated successfully' : 'User added successfully');
            loadUsers();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: isEdit ? 'User Updated' : 'User Added',
                    message: `User "${formData.fullName}" has been ${isEdit ? 'updated' : 'added'} successfully`
                });
            }
        } else {
            showError(result.error || 'Failed to save user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        showError('Failed to save user');
    }
}

async function editUser(userId) {
    try {
        const response = await fetch('http://localhost:8080/api/admin/users');
        const users = await response.json();
        const user = users.find(u => u.id === userId);
        
        if (user) {
            document.getElementById('user-id').value = user.id;
            document.getElementById('user-username').value = user.username;
            document.getElementById('user-fullname').value = user.fullName;
            document.getElementById('user-role').value = user.role;
            document.getElementById('user-password').value = ''; // Don't populate password
            document.getElementById('user-modal-title').textContent = 'Edit User';
            showModal(document.getElementById('user-modal'));
        }
    } catch (error) {
        console.error('Error loading user for edit:', error);
        showError('Failed to load user details');
    }
}

// Reports Module (Enhanced)
function initializeReportsModule() {
    const refreshReportsBtn = document.getElementById('refresh-reports-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const exportJsonBtn = document.getElementById('export-json-btn');
    
    if (refreshReportsBtn) {
        refreshReportsBtn.addEventListener('click', loadReports);
    }
    
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            if (window.advancedReporting) {
                window.advancedReporting.exportReport('csv');
            }
        });
    }
    
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', () => {
            if (window.advancedReporting) {
                window.advancedReporting.exportReport('json');
            }
        });
    }
}

async function loadReports() {
    if (window.advancedReporting) {
        try {
            await Promise.all([
                window.advancedReporting.generateRevenueChart('revenue-chart'),
                window.advancedReporting.generatePartUsageChart('parts-usage-chart'),
                window.advancedReporting.generateServicePerformanceChart('service-performance-chart'),
                window.advancedReporting.updateKPIDashboard()
            ]);
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: 'Reports Updated',
                    message: 'All reports have been refreshed with the latest data'
                });
            }
        } catch (error) {
            console.error('Error loading reports:', error);
            showError('Failed to load reports');
        }
    }
}

// Assignment and Invoice Functions (Enhanced from existing)
async function showAssignModal(jobId) {
    try {
        // Load employees
        const response = await fetch('http://localhost:8080/api/admin/users');
        const users = await response.json();
        const employees = users.filter(user => user.role === 'employee');
        
        const employeeSelect = document.getElementById('assign-employee');
        employeeSelect.innerHTML = '<option value="">Select Employee</option>';
        employees.forEach(employee => {
            employeeSelect.innerHTML += `<option value="${employee.id}">${employee.fullName}</option>`;
        });

        document.getElementById('assign-job-id').value = jobId;
        showModal(document.getElementById('assign-modal'));
    } catch (error) {
        console.error('Error loading employees:', error);
        showError('Failed to load employees');
    }
}

// Initialize assignment modal
document.addEventListener('DOMContentLoaded', () => {
    const assignModal = document.getElementById('assign-modal');
    const assignForm = document.getElementById('assign-form');
    const assignModalClose = document.getElementById('assign-modal-close');
    const assignCancelBtn = document.getElementById('assign-cancel-btn');

    if (assignModalClose) assignModalClose.addEventListener('click', () => hideModal(assignModal));
    if (assignCancelBtn) assignCancelBtn.addEventListener('click', () => hideModal(assignModal));

    if (assignForm) {
        assignForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await assignEmployee();
        });
    }
});

async function assignEmployee() {
    const jobId = document.getElementById('assign-job-id').value;
    const employeeId = document.getElementById('assign-employee').value;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/jobs/${jobId}/assign`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employeeId: employeeId })
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('assign-modal'));
            showSuccess('Employee assigned successfully');
            loadAllJobs();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: 'Employee Assigned',
                    message: `Job #${jobId} has been assigned to an employee`
                });
            }
        } else {
            showError(result.error || 'Failed to assign employee');
        }
    } catch (error) {
        console.error('Error assigning employee:', error);
        showError('Failed to assign employee');
    }
}

async function generateInvoice(jobId) {
    if (!confirm('Generate invoice for this job?')) return;

    try {
        const response = await fetch(`http://localhost:8080/api/admin/jobs/${jobId}/invoice`, {
            method: 'POST'
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess(`Invoice generated successfully. Total cost: $${result.totalCost}`);
            loadAllJobs();
            
            // Send notification
            if (window.notificationManager) {
                window.notificationManager.addNotification({
                    type: 'success',
                    title: 'Invoice Generated',
                    message: `Invoice for job #${jobId} has been generated. Total: $${result.totalCost}`
                });
            }
        } else {
            showError(result.error || 'Failed to generate invoice');
        }
    } catch (error) {
        console.error('Error generating invoice:', error);
        showError('Failed to generate invoice');
    }
}

// Utility Functions
function showModal(modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideModal(modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function showSuccess(message) {
    alert('Success: ' + message);
}

function showError(message) {
    alert('Error: ' + message);
}