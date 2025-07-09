// Employee Dashboard - Database-Driven Implementation
let EMPLOYEE_ID = null;
document.addEventListener('DOMContentLoaded', () => {
    // Get user info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    const userName = urlParams.get('name');
    const userId = urlParams.get('id');
    EMPLOYEE_ID = userId;
    
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
    loadAssignedJobs(); // Load assigned jobs data instead of overview

    // Ensure the correct tab's data is loaded on refresh
    const defaultTab = document.querySelector('.nav-link.active')?.getAttribute('data-tab') || 'assigned-jobs';
    switchToTab(defaultTab);
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
    const userName = urlParams.get('name');
    
    try {
        // Load assigned jobs
        const jobsResponse = await fetch(`http://localhost:8080/api/admin/jobs`);
        if (!jobsResponse.ok) throw new Error('Failed to fetch jobs data');
        
        const allJobs = await jobsResponse.json();
        const assignedJobs = allJobs.filter(job => String(job.assignedEmployeeId) === String(userId));
        
        updateEmployeeMetrics(assignedJobs);
        
        // Load inventory data for the inventory tab
        const inventoryResponse = await fetch('http://localhost:8080/api/admin/inventory');
        if (inventoryResponse.ok) {
            const inventoryData = await inventoryResponse.json();
            // Store inventory data for the inventory tab
            window.inventoryData = inventoryData;
        }
        
    } catch (error) {
        console.error('Error loading overview data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateEmployeeMetrics(jobs) {
    // Update the existing stat cards in the assigned jobs tab
    const totalJobsElement = document.getElementById('total-jobs');
    const inProgressJobsElement = document.getElementById('in-progress-jobs');
    const completedJobsElement = document.getElementById('completed-jobs');
    
    if (totalJobsElement) {
        totalJobsElement.textContent = jobs.length;
    }
    
    if (inProgressJobsElement) {
        const activeJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
        inProgressJobsElement.textContent = activeJobs;
    }
    
    if (completedJobsElement) {
        const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
        completedJobsElement.textContent = completedJobs;
    }
}

// Job Management
function initializeJobManagement() {
    // Add event listeners for job management features
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('update-status-btn')) {
            const jobId = e.target.getAttribute('data-job-id');
            // Instead of calling updateJobStatus, find the job object and call openUpdateStatusModal
            const job = window._assignedJobs?.find(j => String(j.jobId) === String(jobId));
            if (job) {
                // Safety check: prevent updating paid jobs
                if (job.status === 'Paid') {
                    showNotification('Cannot update status for paid jobs', 'error');
                    return;
                }
                openUpdateStatusModal(job);
            }
        }
        // Fix: Use closest for details button
        const detailsBtn = e.target.closest('.view-details-btn');
        if (detailsBtn) {
            const jobId = detailsBtn.getAttribute('data-job-id');
            console.log('Details button clicked', jobId);
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
    
    try {
        const response = await fetch(`http://localhost:8080/api/admin/jobs`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const allJobs = await response.json();
        const assignedJobs = allJobs.filter(job => String(job.assignedEmployeeId) === String(userId));
        
        renderAssignedJobsTable(assignedJobs);
        updateEmployeeMetrics(assignedJobs); // Update metrics when jobs are loaded
    } catch (error) {
        console.error('Error loading assigned jobs:', error);
        showNotification('Failed to load assigned jobs', 'error');
    }
}

function renderAssignedJobsTable(jobs) {
    window._assignedJobs = jobs; // Store for later use
    const tableBody = document.getElementById('assigned-jobs-table-body');
    if (!tableBody) return;
    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-data">
                    <p>No assigned jobs found</p>
                </td>
            </tr>
        `;
        return;
    }
    tableBody.innerHTML = jobs.map(job => {
        const isPaid = job.status === 'Paid';
        const updateStatusButton = isPaid 
            ? `<button class="btn btn-sm btn-secondary" disabled title="Status cannot be changed for paid jobs">
                   Status Locked
               </button>`
            : `<button class="btn btn-sm btn-primary update-status-btn" data-job-id="${job.jobId}" data-current-status="${job.status}">
                   Update Status
               </button>`;
        
        return `
        <tr class="job-row" data-job-id="${job.jobId}" data-current-status="${job.status}">
            <td class="job-id">#${job.jobId}</td>
            <td class="job-customer">${job.customerName}</td>
            <td class="vehicle-details">${job.vehicle}</td>
            <td class="service-name">${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td class="booking-date">${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>
                <div class="job-actions">
                    ${updateStatusButton}
                    <button class="btn btn-sm btn-outline view-details-btn" data-job-id="${job.jobId}">
                    Details
                    </button>
                    <button class="btn btn-sm btn-secondary use-parts-btn" data-job-id="${job.jobId}">
                        Use Parts
                    </button>
                </div>
            </td>
        </tr>
    `}).join('');
    // No need to attach event listeners here; handled by initializeJobManagement
}

function openUpdateStatusModal(job) {
    // Safety check: prevent updating paid jobs
    if (job.status === 'Paid') {
        showNotification('Cannot update status for paid jobs', 'error');
        return;
    }
    
    document.getElementById('update-status-job-id').value = job.jobId;
    // Restrict status dropdown to only 'In Progress' and 'Completed'
    const statusSelect = document.getElementById('new-status');
    statusSelect.innerHTML = '';
    const allowedStatuses = ['In Progress', 'Completed'];
    allowedStatuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = status;
        if (job.status === status) option.selected = true;
        statusSelect.appendChild(option);
    });
    document.getElementById('status-notes').value = '';
    // Store the full job object for use on submit
    window._currentJobForStatusUpdate = job;
    document.getElementById('update-status-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

document.getElementById('update-status-close').onclick = closeUpdateStatusModal;
document.getElementById('update-status-cancel').onclick = closeUpdateStatusModal;

function closeUpdateStatusModal() {
    document.getElementById('update-status-modal').classList.remove('show');
    document.body.style.overflow = '';
    window._currentJobForStatusUpdate = null;
}

document.getElementById('update-status-form').onsubmit = async function(e) {
    e.preventDefault();
    const job = window._currentJobForStatusUpdate;
    if (!job) return;
    const newStatus = document.getElementById('new-status').value;
    const notes = document.getElementById('status-notes').value;
    // Send all required fields, including assignedEmployeeId
    const payload = {
        jobId: job.jobId,
        status: newStatus,
        notes: notes,
        bookingDate: job.bookingDate, // required by backend
        customerName: job.customerName,
        vehicle: job.vehicle,
        service: job.service,
        assignedEmployeeId: EMPLOYEE_ID, // always preserve assignment by ID
        branchName: job.branchName,
        totalCost: job.totalCost
    };
    try {
        const response = await fetch(`http://localhost:8080/api/admin/jobs`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (response.ok) {
            showNotification('Job status updated successfully', 'success');
            closeUpdateStatusModal();
            // Reload jobs and metrics after update
            await loadAssignedJobs();
            await loadOverviewData();
        } else {
            throw new Error('Failed to update job status');
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showNotification('Failed to update job status', 'error');
    }
};

function viewJobDetails(jobId) {
    fetch(`/api/employee/jobs/${jobId}/details`)
        .then(response => response.json())
        .then(data => {
            console.log('Job Details API response:', data);
            if (data.error) {
                showNotification(data.error, 'error');
                return;
            }
            // Populate modal fields
            document.getElementById('detail-job-id').textContent = data.jobId || '';
            document.getElementById('detail-customer').textContent = data.customerName || '';
            document.getElementById('detail-vehicle').textContent = data.vehicle || '';
            document.getElementById('detail-vin').textContent = data.vin || '';
            document.getElementById('detail-service').textContent = data.service || '--';
            document.getElementById('detail-service-price').textContent = (data.servicePrice !== undefined && data.servicePrice !== null) ? `₹${data.servicePrice}` : '--';
            document.getElementById('detail-status').textContent = data.status || '';
            document.getElementById('detail-booking-date').textContent = data.bookingDate ? new Date(data.bookingDate).toLocaleString() : '';
            document.getElementById('detail-notes').textContent = data.notes || '';

            // Populate used parts table
            const partsBody = document.getElementById('used-parts-table-body');
            let totalPartsCost = 0;
            if (Array.isArray(data.usedParts) && data.usedParts.length > 0) {
                partsBody.innerHTML = data.usedParts.map(part => {
                    totalPartsCost += part.totalPrice ? parseFloat(part.totalPrice) : 0;
                    return `<tr>
                        <td>${part.partName || ''}</td>
                        <td>${part.quantityUsed || 0}</td>
                        <td>₹${part.unitPrice !== undefined && part.unitPrice !== null ? part.unitPrice : ''}</td>
                        <td>₹${part.totalPrice !== undefined && part.totalPrice !== null ? part.totalPrice : ''}</td>
                    </tr>`;
                }).join('');
            } else {
                partsBody.innerHTML = `<tr><td colspan="4">No parts used for this job</td></tr>`;
            }
            document.getElementById('total-parts-cost').textContent = totalPartsCost.toFixed(2);

            // Hide any other modals that might be open, except the one we're about to show
            const modal = document.getElementById('job-details-modal');
            document.querySelectorAll('.admin-modal.show, .modal.show').forEach(m => {
                if (m !== modal) m.classList.remove('show');
            });
            document.body.style.overflow = '';

            // Show the job details modal
            if (modal) {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            } else {
                showNotification('Job details modal not found in DOM', 'error');
            }
        })
        .catch(err => {
            showNotification('Failed to load job details', 'error');
            console.error('Error fetching job details:', err);
        });
}

// Modal close logic
['job-details-close', 'job-details-close-footer'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.onclick = () => {
            const modal = document.getElementById('job-details-modal');
            if (modal) {
                modal.classList.remove('show');
                modal.style.display = '';
            }
            document.body.style.overflow = '';
        };
    }
});

function usePartsForJob(jobId) {
    document.getElementById('use-part-job-id').value = jobId;
    document.getElementById('part-quantity').value = '';
    document.getElementById('available-quantity').textContent = '0';

    // Fetch available parts from backend
    fetch('http://localhost:8080/api/admin/inventory')
        .then(response => response.json())
        .then(parts => {
            const partSelect = document.getElementById('part-select');
            partSelect.innerHTML = '<option value="">Choose a part...</option>';
            parts.forEach(part => {
                partSelect.innerHTML += `<option value="${part.id}" data-quantity="${part.quantity}">${part.partName} (Available: ${part.quantity})</option>`;
            });
        });

    // Show the modal
    document.getElementById('use-part-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

// Update available quantity when a part is selected
// (Place this after the function definitions to ensure it runs after DOM is ready)
document.getElementById('part-select').onchange = function() {
    const selected = this.options[this.selectedIndex];
    const available = selected.getAttribute('data-quantity') || '0';
    document.getElementById('available-quantity').textContent = available;
};

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
                <td colspan="5" class="no-data">
                    <p>No inventory items found</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = inventory.map(item => `
        <tr class="inventory-row${item.quantity <= item.minQuantity ? ' low-stock' : ''}" data-part-id="${item.id}" data-part-name="${item.partName}" data-quantity="${item.quantity}" data-min-quantity="${item.minQuantity}" data-price="${item.pricePerUnit}">
            <td>${item.partName}</td>
            <td>${item.quantity} <span class="min-stock">(Min: ${item.minQuantity})</span></td>
            <td>₹${item.pricePerUnit}</td>
            <td>${item.status || (item.quantity <= item.minQuantity ? 'Low Stock' : 'In Stock')}</td>
            <td>
                <button class="btn btn-sm btn-outline check-stock-btn" data-part-id="${item.id}">Check Stock</button>
                <button class="btn btn-sm btn-primary use-part-btn" data-part-id="${item.id}">Use Part</button>
            </td>
        </tr>
    `).join('');

    // Attach event listeners for action buttons
    document.querySelectorAll('.check-stock-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const partId = btn.getAttribute('data-part-id');
            showStockModal(partId);
        });
    });
    document.querySelectorAll('.use-part-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const partId = btn.getAttribute('data-part-id');
            openUsePartModal(partId);
        });
    });
}

function showStockModal(partId) {
    const row = document.querySelector(`tr[data-part-id='${partId}']`);
    if (!row) return;
    const partName = row.getAttribute('data-part-name');
    const quantity = row.getAttribute('data-quantity');
    const minQuantity = row.getAttribute('data-min-quantity');
    alert(`Stock for ${partName}: ${quantity} units (Min: ${minQuantity})`);
}

function openUsePartModal(partId) {
    const row = document.querySelector(`tr[data-part-id='${partId}']`);
    if (!row) return;
    const partName = row.getAttribute('data-part-name');
    const quantity = row.getAttribute('data-quantity');
    const minQuantity = row.getAttribute('data-min-quantity');
    const price = row.getAttribute('data-price');

    // Populate modal fields
    document.getElementById('part-select').innerHTML = `<option value="${partId}">${partName}</option>`;
    document.getElementById('part-quantity').value = '';
    document.getElementById('available-quantity').textContent = quantity;
    document.getElementById('use-part-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

document.getElementById('use-part-close').onclick = closeUsePartModal;
document.getElementById('use-part-cancel').onclick = closeUsePartModal;

function closeUsePartModal() {
    document.getElementById('use-part-modal').classList.remove('show');
    document.body.style.overflow = '';
}

document.getElementById('use-part-form').onsubmit = async function(e) {
    e.preventDefault();
    const jobId = document.getElementById('use-part-job-id').value;
    const partId = document.getElementById('part-select').value;
    const quantityToUse = parseInt(document.getElementById('part-quantity').value, 10);
    const available = parseInt(document.getElementById('available-quantity').textContent, 10);
    if (!quantityToUse || quantityToUse < 1) {
        alert('Please enter a valid quantity.');
        return;
    }
    if (quantityToUse > available) {
        alert('Cannot use more than available quantity.');
        return;
    }

    // Actual API call to update inventory for the job
    try {
        const response = await fetch(`/api/employee/jobs/${jobId}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                inventoryId: partId,
                quantityUsed: quantityToUse
            })
        });
        if (response.ok) {
            showNotification('Part used successfully!', 'success');
            closeUsePartModal();
            // Refresh inventory data
            loadInventoryData();
        } else {
            const error = await response.json();
            showNotification(error.error || 'Failed to use part', 'error');
        }
    } catch (err) {
        showNotification('Failed to use part', 'error');
    }
};

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