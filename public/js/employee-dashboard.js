document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check: if no user role or not employee, redirect to login
    if (!userRole || userRole !== 'employee') {
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

    // Initialize modules
    initializeTabNavigation();
    initializeJobDetailsModal();
    initializeUsePartModal();
    
    // Load initial data
    loadAssignedJobs();
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
                case 'assigned-jobs':
                    loadAssignedJobs();
                    break;
                case 'inventory':
                    loadInventory();
                    break;
            }
        });
    });
}

// Assigned Jobs Module
async function loadAssignedJobs() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch assigned jobs');
        
        const jobs = await response.json();
        populateAssignedJobsTable(jobs);
        updateJobStats(jobs);
    } catch (error) {
        console.error('Error loading assigned jobs:', error);
        showError('Failed to load assigned jobs');
    }
}

function populateAssignedJobsTable(jobs) {
    const tableBody = document.getElementById('assigned-jobs-table-body');
    tableBody.innerHTML = '';

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No jobs assigned to you.</td></tr>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.jobId}</td>
            <td>${job.customerName}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td>
                <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>
            </td>
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetails(${job.jobId})">Details</button>
                <select class="status-dropdown-inline" onchange="updateJobStatus(${job.jobId}, this.value)">
                    <option value="">Update Status</option>
                    <option value="In Progress" ${job.status === 'In Progress' ? 'disabled' : ''}>In Progress</option>
                    <option value="Completed" ${job.status === 'Completed' ? 'disabled' : ''}>Completed</option>
                </select>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateJobStats(jobs) {
    const totalJobs = jobs.length;
    const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
    const completedJobs = jobs.filter(job => job.status === 'Completed').length;

    document.getElementById('total-jobs').textContent = totalJobs;
    document.getElementById('in-progress-jobs').textContent = inProgressJobs;
    document.getElementById('completed-jobs').textContent = completedJobs;
}

async function updateJobStatus(jobId, newStatus) {
    if (!newStatus) return;
    
    if (!confirm(`Update job status to "${newStatus}"?`)) {
        // Reset the dropdown
        event.target.value = '';
        return;
    }

    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess(`Job status updated to "${newStatus}"`);
            loadAssignedJobs(); // Refresh the table
        } else {
            showError(result.error || 'Failed to update job status');
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showError('Failed to update job status');
    }
    
    // Reset the dropdown
    event.target.value = '';
}

// Job Details Modal
function initializeJobDetailsModal() {
    const modal = document.getElementById('job-details-modal');
    const closeBtn = document.getElementById('job-details-close');
    const updateStatusBtn = document.getElementById('update-status-btn');
    const addPartBtn = document.getElementById('add-part-btn');

    closeBtn.addEventListener('click', () => hideModal(modal));
    
    updateStatusBtn.addEventListener('click', async () => {
        const jobId = document.getElementById('detail-job-id').textContent;
        const newStatus = document.getElementById('status-select').value;
        
        if (await updateJobStatusFromModal(jobId, newStatus)) {
            hideModal(modal);
        }
    });

    addPartBtn.addEventListener('click', () => {
        const jobId = document.getElementById('detail-job-id').textContent;
        showUsePartModal(jobId);
    });
}

async function showJobDetails(jobId) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/details`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const jobDetails = await response.json();
        populateJobDetailsModal(jobDetails);
        showModal(document.getElementById('job-details-modal'));
    } catch (error) {
        console.error('Error loading job details:', error);
        showError('Failed to load job details');
    }
}

function populateJobDetailsModal(jobDetails) {
    // Populate job information
    document.getElementById('detail-job-id').textContent = jobDetails.jobId;
    document.getElementById('detail-customer').textContent = jobDetails.customerName;
    document.getElementById('detail-vehicle').textContent = jobDetails.vehicle;
    document.getElementById('detail-vin').textContent = jobDetails.vin || 'N/A';
    document.getElementById('detail-service').textContent = jobDetails.service;
    document.getElementById('detail-service-description').textContent = jobDetails.serviceDescription || 'N/A';
    document.getElementById('detail-service-price').textContent = `$${jobDetails.servicePrice}`;
    document.getElementById('detail-status').innerHTML = `<span class="status-badge status-${jobDetails.status.toLowerCase().replace(' ', '-')}">${jobDetails.status}</span>`;
    document.getElementById('detail-booking-date').textContent = new Date(jobDetails.bookingDate).toLocaleString();
    document.getElementById('detail-notes').textContent = jobDetails.notes || 'No notes';

    // Set status dropdown
    document.getElementById('status-select').value = jobDetails.status;

    // Populate used parts
    populateUsedPartsTable(jobDetails.usedParts);
}

function populateUsedPartsTable(usedParts) {
    const tableBody = document.getElementById('used-parts-table-body');
    tableBody.innerHTML = '';

    let totalPartsCost = 0;

    if (usedParts.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No parts used yet.</td></tr>';
    } else {
        usedParts.forEach(part => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${part.partName}</td>
                <td>${part.quantityUsed}</td>
                <td>$${part.pricePerUnit}</td>
                <td>$${part.totalPartCost}</td>
            `;
            tableBody.appendChild(row);
            totalPartsCost += parseFloat(part.totalPartCost);
        });
    }

    document.getElementById('total-parts-cost').textContent = totalPartsCost.toFixed(2);
}

async function updateJobStatusFromModal(jobId, newStatus) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess(`Job status updated to "${newStatus}"`);
            loadAssignedJobs(); // Refresh the main table
            return true;
        } else {
            showError(result.error || 'Failed to update job status');
            return false;
        }
    } catch (error) {
        console.error('Error updating job status:', error);
        showError('Failed to update job status');
        return false;
    }
}

// Use Part Modal
function initializeUsePartModal() {
    const modal = document.getElementById('use-part-modal');
    const closeBtn = document.getElementById('use-part-close');
    const cancelBtn = document.getElementById('use-part-cancel');
    const form = document.getElementById('use-part-form');
    const partSelect = document.getElementById('part-select');

    closeBtn.addEventListener('click', () => hideModal(modal));
    cancelBtn.addEventListener('click', () => hideModal(modal));

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await usePartForJob();
    });

    // Update available quantity when part is selected
    partSelect.addEventListener('change', () => {
        const selectedOption = partSelect.options[partSelect.selectedIndex];
        const availableQuantity = selectedOption.getAttribute('data-quantity') || 0;
        document.getElementById('available-quantity').textContent = availableQuantity;
        document.getElementById('part-quantity').max = availableQuantity;
    });
}

async function showUsePartModal(jobId) {
    document.getElementById('use-part-job-id').value = jobId;
    
    // Load available inventory
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const inventory = await response.json();
        populatePartSelect(inventory);
        showModal(document.getElementById('use-part-modal'));
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Failed to load inventory');
    }
}

function populatePartSelect(inventory) {
    const partSelect = document.getElementById('part-select');
    partSelect.innerHTML = '<option value="">Choose a part...</option>';

    inventory.forEach(item => {
        if (item.quantity > 0) { // Only show parts that are in stock
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.partName} - $${item.pricePerUnit} (${item.quantity} available)`;
            option.setAttribute('data-quantity', item.quantity);
            partSelect.appendChild(option);
        }
    });
}

async function usePartForJob() {
    const jobId = document.getElementById('use-part-job-id').value;
    const inventoryId = document.getElementById('part-select').value;
    const quantityUsed = parseInt(document.getElementById('part-quantity').value);

    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${jobId}/inventory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                inventoryId: inventoryId, 
                quantityUsed: quantityUsed 
            })
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('use-part-modal'));
            showSuccess('Part used successfully');
            
            // Refresh job details if modal is open
            const jobDetailsModal = document.getElementById('job-details-modal');
            if (jobDetailsModal.style.display === 'block') {
                showJobDetails(jobId);
            }
            
            // Reset form
            document.getElementById('use-part-form').reset();
        } else {
            showError(result.error || 'Failed to use part');
        }
    } catch (error) {
        console.error('Error using part:', error);
        showError('Failed to use part');
    }
}

// Inventory Module
async function loadInventory() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) throw new Error('Failed to fetch inventory');
        
        const inventory = await response.json();
        populateInventoryTable(inventory);
        initializeInventorySearch(inventory);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showError('Failed to load inventory');
    }
}

function populateInventoryTable(inventory) {
    const tableBody = document.getElementById('inventory-table-body');
    tableBody.innerHTML = '';

    if (inventory.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="no-data">No inventory items found.</td></tr>';
        return;
    }

    inventory.forEach(item => {
        const stockStatus = getStockStatus(item.quantity);
        const row = document.createElement('tr');
        row.className = item.quantity < 10 ? 'low-stock' : '';
        row.innerHTML = `
            <td>${item.partName}</td>
            <td class="${item.quantity < 10 ? 'low-stock' : ''}">${item.quantity}</td>
            <td>$${item.pricePerUnit}</td>
            <td><span class="status-badge ${stockStatus.class}">${stockStatus.text}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getStockStatus(quantity) {
    if (quantity === 0) {
        return { class: 'status-out-of-stock', text: 'Out of Stock' };
    } else if (quantity < 10) {
        return { class: 'status-low-stock', text: 'Low Stock' };
    } else {
        return { class: 'status-in-stock', text: 'In Stock' };
    }
}

function initializeInventorySearch(inventory) {
    const searchInput = document.getElementById('inventory-search');
    
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredInventory = inventory.filter(item => 
            item.partName.toLowerCase().includes(searchTerm)
        );
        populateInventoryTable(filteredInventory);
    });
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
    // Simple success notification - you can enhance this
    alert('Success: ' + message);
}

function showError(message) {
    // Simple error notification - you can enhance this
    alert('Error: ' + message);
}