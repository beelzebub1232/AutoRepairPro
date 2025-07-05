// Employee Dashboard - Complete Implementation
document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check
    if (!userRole || userRole !== 'employee') {
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
    initializeJobsModule();
    initializeInventoryModule();
    
    // Load initial data
    loadAssignedJobs();
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
        case 'assigned-jobs':
            loadAssignedJobs();
            break;
        case 'inventory':
            loadInventoryData();
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

// Jobs Module
function initializeJobsModule() {
    // Initialize job details modal
    const jobDetailsModal = document.getElementById('job-details-modal');
    const jobDetailsClose = document.getElementById('job-details-close');
    const updateStatusBtn = document.getElementById('update-status-btn');
    const addPartBtn = document.getElementById('add-part-btn');

    if (jobDetailsClose) {
        jobDetailsClose.addEventListener('click', () => hideModal(jobDetailsModal));
    }

    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', updateJobStatus);
    }

    if (addPartBtn) {
        addPartBtn.addEventListener('click', showUsePartModal);
    }

    // Initialize use part modal
    const usePartModal = document.getElementById('use-part-modal');
    const usePartClose = document.getElementById('use-part-close');
    const usePartCancel = document.getElementById('use-part-cancel');
    const usePartForm = document.getElementById('use-part-form');

    if (usePartClose) {
        usePartClose.addEventListener('click', () => hideModal(usePartModal));
    }

    if (usePartCancel) {
        usePartCancel.addEventListener('click', () => hideModal(usePartModal));
    }

    if (usePartForm) {
        usePartForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await usePartForJob();
        });
    }
}

async function loadAssignedJobs() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        showLoadingState('assigned-jobs-table-body');
        
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch assigned jobs');
        
        const jobs = await response.json();
        populateAssignedJobsTable(jobs);
        updateJobStats(jobs);
    } catch (error) {
        console.error('Error loading assigned jobs:', error);
        showErrorState('assigned-jobs-table-body', 'Failed to load assigned jobs');
    }
}

function populateAssignedJobsTable(jobs) {
    const tableBody = document.getElementById('assigned-jobs-table-body');
    if (!tableBody) return;
    
    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">No assigned jobs</div>
                    <div class="empty-state-description">You don't have any jobs assigned yet</div>
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
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetailsModal(${job.jobId})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Details
                </button>
                ${job.status === 'Booked' ? `
                    <button class="btn btn-sm btn-success" onclick="quickUpdateStatus(${job.jobId}, 'In Progress')">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <polygon points="5,3 19,12 5,21"/>
                        </svg>
                        Start
                    </button>
                ` : ''}
                ${job.status === 'In Progress' ? `
                    <button class="btn btn-sm btn-success" onclick="quickUpdateStatus(${job.jobId}, 'Completed')">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="9"/>
                        </svg>
                        Complete
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function updateJobStats(jobs) {
    const totalJobs = jobs.length;
    const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
    const completedJobs = jobs.filter(job => job.status === 'Completed').length;

    const totalElement = document.getElementById('total-jobs');
    const inProgressElement = document.getElementById('in-progress-jobs');
    const completedElement = document.getElementById('completed-jobs');

    if (totalElement) totalElement.textContent = totalJobs;
    if (inProgressElement) inProgressElement.textContent = inProgressJobs;
    if (completedElement) completedElement.textContent = completedJobs;
}

async function showJobDetailsModal(jobId) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/details`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const job = await response.json();
        populateJobDetailsModal(job);
        showModal(document.getElementById('job-details-modal'));
        
        // Load used parts
        loadUsedParts(jobId);
    } catch (error) {
        console.error('Error loading job details:', error);
        showNotification('Failed to load job details', 'error');
    }
}

function populateJobDetailsModal(job) {
    document.getElementById('detail-job-id').textContent = job.jobId;
    document.getElementById('detail-customer').textContent = job.customerName;
    document.getElementById('detail-vehicle').textContent = job.vehicle;
    document.getElementById('detail-vin').textContent = job.vin || 'Not provided';
    document.getElementById('detail-service').textContent = job.service;
    document.getElementById('detail-service-description').textContent = job.serviceDescription || 'No description';
    document.getElementById('detail-service-price').textContent = '$' + job.servicePrice;
    document.getElementById('detail-status').innerHTML = `<span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>`;
    document.getElementById('detail-booking-date').textContent = new Date(job.bookingDate).toLocaleString();
    document.getElementById('detail-notes').textContent = job.notes || 'No notes';

    // Set status dropdown
    const statusSelect = document.getElementById('status-select');
    if (statusSelect) {
        statusSelect.value = job.status;
    }

    // Store job ID for updates
    const updateBtn = document.getElementById('update-status-btn');
    if (updateBtn) {
        updateBtn.setAttribute('data-job-id', job.jobId);
    }

    const addPartBtn = document.getElementById('add-part-btn');
    if (addPartBtn) {
        addPartBtn.setAttribute('data-job-id', job.jobId);
    }
}

async function loadUsedParts(jobId) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/details`);
        if (!response.ok) throw new Error('Failed to fetch used parts');
        
        const job = await response.json();
        populateUsedPartsTable(job.usedParts || []);
    } catch (error) {
        console.error('Error loading used parts:', error);
    }
}

function populateUsedPartsTable(usedParts) {
    const tableBody = document.getElementById('used-parts-table-body');
    if (!tableBody) return;

    if (usedParts.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-state-description">No parts used yet</div>
                </td>
            </tr>
        `;
        return;
    }

    let totalCost = 0;
    tableBody.innerHTML = usedParts.map(part => {
        const partTotal = parseFloat(part.totalPartCost);
        totalCost += partTotal;
        
        return `
            <tr>
                <td>${part.partName}</td>
                <td>${part.quantityUsed}</td>
                <td>$${part.pricePerUnit}</td>
                <td><strong>$${partTotal.toFixed(2)}</strong></td>
            </tr>
        `;
    }).join('');

    // Update total cost
    const totalElement = document.getElementById('total-parts-cost');
    if (totalElement) {
        totalElement.textContent = totalCost.toFixed(2);
    }
}

async function updateJobStatus() {
    const jobId = document.getElementById('update-status-btn').getAttribute('data-job-id');
    const newStatus = document.getElementById('status-select').value;

    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (response.ok) {
            showNotification('Job status updated successfully', 'success');
            hideModal(document.getElementById('job-details-modal'));
            loadAssignedJobs(); // Refresh the jobs list
        } else {
            showNotification(result.error || 'Failed to update job status', 'error');
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showNotification('Failed to update job status', 'error');
    }
}

async function quickUpdateStatus(jobId, newStatus) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (response.ok) {
            showNotification(`Job status updated to ${newStatus}`, 'success');
            loadAssignedJobs(); // Refresh the jobs list
        } else {
            showNotification(result.error || 'Failed to update job status', 'error');
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showNotification('Failed to update job status', 'error');
    }
}

async function showUsePartModal() {
    const jobId = document.getElementById('add-part-btn').getAttribute('data-job-id');
    
    try {
        // Load available inventory
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        const inventory = await response.json();
        
        const partSelect = document.getElementById('part-select');
        if (partSelect) {
            partSelect.innerHTML = '<option value="">Choose a part...</option>' +
                inventory.map(item => `<option value="${item.id}" data-quantity="${item.quantity}">${item.partName} (Available: ${item.quantity})</option>`).join('');
            
            // Update available quantity when part changes
            partSelect.addEventListener('change', () => {
                const selectedOption = partSelect.options[partSelect.selectedIndex];
                const availableQuantity = selectedOption.getAttribute('data-quantity') || 0;
                const quantitySpan = document.getElementById('available-quantity');
                if (quantitySpan) {
                    quantitySpan.textContent = availableQuantity;
                }
                
                // Set max quantity
                const quantityInput = document.getElementById('part-quantity');
                if (quantityInput) {
                    quantityInput.max = availableQuantity;
                }
            });
        }
        
        // Set job ID
        document.getElementById('use-part-job-id').value = jobId;
        
        showModal(document.getElementById('use-part-modal'));
    } catch (error) {
        console.error('Error loading inventory:', error);
        showNotification('Failed to load inventory', 'error');
    }
}

async function usePartForJob() {
    const jobId = document.getElementById('use-part-job-id').value;
    const inventoryId = document.getElementById('part-select').value;
    const quantityUsed = document.getElementById('part-quantity').value;

    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                inventoryId: parseInt(inventoryId),
                quantityUsed: parseInt(quantityUsed)
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            showNotification('Part used successfully', 'success');
            hideModal(document.getElementById('use-part-modal'));
            loadUsedParts(jobId); // Refresh used parts table
        } else {
            showNotification(result.error || 'Failed to use part', 'error');
        }
    } catch (error) {
        console.error('Error using part:', error);
        showNotification('Failed to use part', 'error');
    }
}

// Inventory Module
function initializeInventoryModule() {
    const inventorySearch = document.getElementById('inventory-search');
    
    if (inventorySearch) {
        inventorySearch.addEventListener('input', (e) => {
            filterInventory(e.target.value);
        });
    }
}

async function loadInventoryData() {
    try {
        showLoadingState('inventory-table-body');
        
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const inventory = await response.json();
        populateInventoryTable(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showErrorState('inventory-table-body', 'Failed to load inventory');
    }
}

function populateInventoryTable(inventory) {
    const tableBody = document.getElementById('inventory-table-body');
    if (!tableBody) return;
    
    if (inventory.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="empty-state">
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">No inventory items found</div>
                    <div class="empty-state-description">Contact admin to add inventory items</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = inventory.map(item => {
        const isLowStock = item.quantity < 10;
        const stockStatus = isLowStock ? 'Low Stock' : item.quantity < 20 ? 'Medium Stock' : 'In Stock';
        const statusClass = isLowStock ? 'text-error' : item.quantity < 20 ? 'text-warning' : 'text-success';
        
        return `
            <tr ${isLowStock ? 'class="low-stock"' : ''}>
                <td>
                    <div class="flex items-center gap-2">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                            <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
                            <line x1="12" y1="22.08" x2="12" y2="12"/>
                        </svg>
                        ${item.partName}
                    </div>
                </td>
                <td>
                    <span class="${isLowStock ? 'text-error font-bold' : ''}">${item.quantity}</span>
                    ${isLowStock ? '<svg class="icon icon-sm text-error inline ml-1" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' : ''}
                </td>
                <td>$${item.pricePerUnit}</td>
                <td><span class="${statusClass} font-semibold">${stockStatus}</span></td>
            </tr>
        `;
    }).join('');
}

function filterInventory(searchTerm) {
    const rows = document.querySelectorAll('#inventory-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

// Utility Functions
function showLoadingState(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="text-center py-8">
                    <div class="loading-skeleton">
                        <div class="loading-skeleton title"></div>
                        <div class="loading-skeleton text"></div>
                        <div class="loading-skeleton text"></div>
                    </div>
                </td>
            </tr>
        `;
    }
}

function showErrorState(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <tr>
                <td colspan="10" class="empty-state">
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">Error</div>
                    <div class="empty-state-description">${message}</div>
                </td>
            </tr>
        `;
    }
}

function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function hideModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
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