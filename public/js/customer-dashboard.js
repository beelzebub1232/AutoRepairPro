// Customer Dashboard - Complete Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Try to get from sessionStorage first
    let userRole = sessionStorage.getItem('userRole');
    let userName = sessionStorage.getItem('userName');
    let userId = sessionStorage.getItem('userId');

    // If not in sessionStorage, try to get from URL params (for login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (!userRole || !userName || !userId) {
        userRole = urlParams.get('role');
        userName = urlParams.get('name');
        userId = urlParams.get('id');
        if (userRole && userName && userId) {
            sessionStorage.setItem('userRole', userRole);
            sessionStorage.setItem('userName', userName);
            sessionStorage.setItem('userId', userId);
        }
    }

    // Auth check
    if (!userRole || userRole !== 'customer') {
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
    initializeBookingModule();
    initializeVehicleModule();
    initializeJobsModule();
    initializePaymentModule();
    initializeMapIntegration();
    initializeServiceHistoryModule();
    
    // Load initial data
    loadCustomerData();

    // Initialize dashboard overview on load
    loadDashboardOverview();
}

// Navigation System
function initializeNavigation() {
    console.log('[DEBUG] Initializing navigation');
    // Support both sidebar .nav-link and in-content .nav-button
    const navLinks = document.querySelectorAll('.nav-link, .nav-button');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            console.log(`[DEBUG] Clicked nav link: data-tab="${targetTab}"`);
            if (!targetTab) return;
            // Remove active class from all links and contents
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            // Add active class to clicked link and corresponding content
            link.classList.add('active');
            const targetTabContent = document.getElementById(`${targetTab}-tab`);
            if (targetTabContent) {
                targetTabContent.classList.add('active');
                console.log(`[DEBUG] Activated tab content: #${targetTab}-tab`);
            } else {
                console.warn(`[DEBUG] No tab content found for #${targetTab}-tab`);
            }
            // Load data for the active tab
            loadTabData(targetTab);
        });
    });
}

function loadTabData(tab) {
    switch(tab) {
        case 'book-appointment':
            loadBookingData();
            break;
        case 'my-jobs':
            loadMyJobs();
            break;
        case 'my-vehicles':
            loadMyVehicles();
            break;
        case 'service-history':
            loadServiceHistory();
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

// Map Integration
function initializeMapIntegration() {
    const mapContainer = document.getElementById('branch-map-container');
    if (mapContainer) {
        mapContainer.innerHTML = createMapInterface();
        attachMapEventListeners();
    }
}

function createMapInterface() {
    const branches = [
        {
            id: 1,
            name: "RepairHub Pro Downtown",
            address: "123 Main Street, Downtown",
            phone: "(555) 123-4567",
            services: ["Paint Jobs", "Dent Repair", "Collision Repair"],
            rating: 4.8,
            hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM"
        },
        {
            id: 2,
            name: "RepairHub Pro Uptown",
            address: "456 Oak Avenue, Uptown",
            phone: "(555) 234-5678",
            services: ["Paint Jobs", "Dent Repair", "Oil Change"],
            rating: 4.6,
            hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-5PM"
        },
        {
            id: 3,
            name: "RepairHub Pro Westside",
            address: "789 Pine Road, Westside",
            phone: "(555) 345-6789",
            services: ["Collision Repair", "Paint Jobs", "Maintenance"],
            rating: 4.9,
            hours: "Mon-Sat: 8AM-6PM"
        }
    ];

    return `
        <div class="map-container">
            <div class="map-header">
                <h3>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Select a Branch Location
                </h3>
                <button id="detect-location" class="btn btn-sm btn-primary">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <polygon points="3,11 22,2 13,21 11,13 3,11"/>
                    </svg>
                    Use My Location
                </button>
            </div>
            <div class="map-view">
                <div class="branches-list">
                    ${branches.map(branch => `
                        <div class="branch-card" data-branch-id="${branch.id}">
                            <div class="branch-header">
                                <h4>${branch.name}</h4>
                                <div class="branch-rating">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                                    </svg>
                                    ${branch.rating}
                                </div>
                            </div>
                            <div class="branch-details">
                                <p class="branch-address">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                        <circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    ${branch.address}
                                </p>
                                <p class="branch-phone">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                    ${branch.phone}
                                </p>
                                <p class="branch-hours">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12,6 12,12 16,14"/>
                                    </svg>
                                    ${branch.hours}
                                </p>
                                <div class="branch-services">
                                    <strong>Services:</strong>
                                    <div class="services-tags">
                                        ${branch.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-primary select-branch-btn" data-branch-id="${branch.id}">
                                <svg class="icon icon-sm" viewBox="0 0 24 24">
                                    <path d="M9 12l2 2 4-4"/>
                                    <circle cx="12" cy="12" r="9"/>
                                </svg>
                                Select This Branch
                            </button>
                        </div>
                    `).join('')}
                </div>
                <div class="selected-branch-info" id="selected-branch-info">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <svg class="icon icon-xl" viewBox="0 0 24 24">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                                <circle cx="12" cy="10" r="3"/>
                            </svg>
                        </div>
                        <div class="empty-state-title">Select a branch</div>
                        <div class="empty-state-description">Choose a location to see details</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachMapEventListeners() {
    // Branch selection
    document.querySelectorAll('.select-branch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const branchId = parseInt(e.target.getAttribute('data-branch-id'));
            selectBranch(branchId);
        });
    });

    // Location detection
    const detectBtn = document.getElementById('detect-location');
    if (detectBtn) {
        detectBtn.addEventListener('click', detectUserLocation);
    }
}

function selectBranch(branchId) {
    // Update UI to show selection
    document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }

    // Update selected branch info
    updateSelectedBranchInfo(branchId);
    
    // Update booking form
    const branchNameElement = document.getElementById('selected-branch-name');
    if (branchNameElement) {
        const branchName = selectedCard.querySelector('h4').textContent;
        branchNameElement.textContent = branchName;
        branchNameElement.style.color = 'var(--success-600)';
    }
}

function updateSelectedBranchInfo(branchId) {
    const branches = [
        { id: 1, name: "RepairHub Pro Downtown", address: "123 Main Street, Downtown" },
        { id: 2, name: "RepairHub Pro Uptown", address: "456 Oak Avenue, Uptown" },
        { id: 3, name: "RepairHub Pro Westside", address: "789 Pine Road, Westside" }
    ];
    
    const branch = branches.find(b => b.id === branchId);
    const infoContainer = document.getElementById('selected-branch-info');
    
    if (infoContainer && branch) {
        infoContainer.innerHTML = `
            <div class="selected-branch-details">
                <h4>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${branch.name}
                </h4>
                <p><strong>Address:</strong> ${branch.address}</p>
                <p><strong>Status:</strong> <span class="text-success">Selected</span></p>
            </div>
        `;
    }
}

function detectUserLocation() {
    const detectBtn = document.getElementById('detect-location');
    
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }

    detectBtn.innerHTML = `
        <svg class="icon icon-sm animate-spin" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Detecting...
    `;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            detectBtn.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                Location Detected
            `;
            detectBtn.classList.remove('btn-primary');
            detectBtn.classList.add('btn-success');
            showNotification('Location detected successfully', 'success');
        },
        (error) => {
            detectBtn.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Location Failed
            `;
            detectBtn.classList.remove('btn-primary');
            detectBtn.classList.add('btn-danger');
            showNotification('Failed to detect location', 'error');
        }
    );
}

// Booking Module
function initializeBookingModule() {
    loadBookingData();
}

async function loadBookingData() {
    // Fetch branches, vehicles, and services in parallel
    const [branches, vehicles, services] = await Promise.all([
        fetchData('/api/customer/branches', []),
        fetchData('/api/customer/vehicles', []),
        fetchData('/api/services', [])
    ]);
    renderBranchList(branches);
    renderVehicleDropdown(vehicles);
    renderServiceDropdown(services);
    setupBookingForm(branches, vehicles, services);
}

async function fetchData(url, fallback) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to fetch');
        return await res.json();
    } catch (err) {
        showNotification('Error loading data', 'error');
        return fallback;
    }
}

function renderBranchList(branches) {
    const branchList = document.getElementById('branch-list');
    if (!branchList) return;
    branchList.innerHTML = '';
    if (!branches.length) {
        branchList.innerHTML = '<div class="no-data">No branches available</div>';
        return;
    }
    branches.forEach(branch => {
        const card = document.createElement('div');
        card.className = 'branch-card animate-slide-in-up';
        card.setAttribute('data-branch-id', branch.id);
        card.innerHTML = `
            <div class="branch-header">
                <h4>${branch.name}</h4>
                <div class="branch-rating">${branch.rating || ''}</div>
            </div>
            <div class="branch-details">
                <p class="branch-address">${branch.address}</p>
                <p class="branch-phone">${branch.phone}</p>
                <p class="branch-hours">${branch.hours}</p>
                <div class="branch-services">
                    <strong>Services:</strong>
                    <div class="services-tags">${(branch.services||[]).map(s => `<span class='service-tag'>${s}</span>`).join('')}</div>
                </div>
            </div>
        `;
        card.addEventListener('click', () => selectBranch(branch.id));
        branchList.appendChild(card);
    });
}

function renderVehicleDropdown(vehicles) {
    const vehicleSelect = document.getElementById('booking-vehicle-select');
    if (!vehicleSelect) return;
    vehicleSelect.innerHTML = '<option value="">Select Vehicle</option>';
    vehicles.forEach(vehicle => {
        const opt = document.createElement('option');
        opt.value = vehicle.id;
        opt.textContent = `${vehicle.name} (${vehicle.year})`;
        vehicleSelect.appendChild(opt);
    });
}

function renderServiceDropdown(services) {
    const serviceSelect = document.getElementById('booking-service-select');
    if (!serviceSelect) return;
    serviceSelect.innerHTML = '<option value="">Select Service</option>';
    services.forEach(service => {
        const opt = document.createElement('option');
        opt.value = service.id;
        opt.textContent = `${service.name} - $${service.price}`;
        serviceSelect.appendChild(opt);
    });
}

function setupBookingForm(branches, vehicles, services) {
    const form = document.getElementById('booking-form');
    if (!form) return;
    form.onsubmit = async (e) => {
        e.preventDefault();
        const branchId = form['branch'].value;
        const vehicleId = form['vehicle'].value;
        const serviceId = form['service'].value;
        const date = form['date'].value;
        if (!branchId || !vehicleId || !serviceId || !date) {
            showNotification('Please fill all fields', 'warning');
            return;
        }
        try {
            const res = await fetch('/api/customer/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchId, vehicleId, serviceId, date })
            });
            if (!res.ok) throw new Error('Booking failed');
            ModalManager.show(`<div class='modal-content'><button class='modal-close'>&times;</button><div class='modal-body'><h3>Booking Confirmed!</h3><p>Your appointment has been booked successfully.</p></div></div>`);
            showNotification('Appointment booked successfully', 'success');
            loadDashboardOverview(); // Refresh dashboard
        } catch (err) {
            showNotification('Booking failed', 'error');
        }
    };
    // Live summary update
    ['branch','vehicle','service','date'].forEach(id => {
        form[id]?.addEventListener('change', updateBookingSummary);
    });
}

function updateBookingSummary() {
    const form = document.getElementById('booking-form');
    if (!form) return;
    const summary = document.getElementById('booking-summary');
    if (!summary) return;
    const branch = form['branch'].selectedOptions[0]?.textContent || '';
    const vehicle = form['vehicle'].selectedOptions[0]?.textContent || '';
    const service = form['service'].selectedOptions[0]?.textContent || '';
    const date = form['date'].value || '';
    summary.innerHTML = `
        <div><strong>Branch:</strong> ${branch}</div>
        <div><strong>Vehicle:</strong> ${vehicle}</div>
        <div><strong>Service:</strong> ${service}</div>
        <div><strong>Date:</strong> ${date}</div>
    `;
}

// Vehicle Module
function initializeVehicleModule() {
    loadMyVehicles();
    setupAddVehicleButton();
}

async function loadMyVehicles() {
    await fetchWithSkeleton('/api/customer/vehicles', 'vehicles-grid', renderVehiclesGrid, 'Failed to load vehicles');
}

function renderVehiclesGrid(vehicles) {
    const grid = document.getElementById('vehicles-grid');
    if (!grid) return;
    grid.innerHTML = '';
    if (!vehicles.length) {
        grid.innerHTML = '<div class="no-data">No vehicles found</div>';
        return;
    }
    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'vehicle-card animate-slide-in-up';
        card.innerHTML = `
            <div class="vehicle-header">
                <div class="vehicle-icon"><svg class="icon"><use href="#car"/></svg></div>
                <div class="vehicle-actions">
                    <button class="btn btn-sm btn-secondary" onclick="showEditVehicleModal(${vehicle.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteVehicle(${vehicle.id})">Delete</button>
                </div>
            </div>
            <div class="vehicle-info">
                <h3>${vehicle.name}</h3>
                <div class="vehicle-details">
                    <div class="detail-item"><span class="detail-label">Year:</span> <span class="detail-value">${vehicle.year}</span></div>
                    <div class="detail-item"><span class="detail-label">VIN:</span> <span class="detail-value">${vehicle.vin || '-'}</span></div>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setupAddVehicleButton() {
    const addBtn = document.getElementById('add-vehicle-btn');
    if (addBtn) {
        addBtn.addEventListener('click', showAddVehicleModal);
    }
}

window.showAddVehicleModal = function() {
    const modalHtml = `
        <div class='modal-content animate-slide-up'>
            <button class='modal-close'>&times;</button>
            <div class='modal-body'>
                <h3>Add Vehicle</h3>
                <form id='add-vehicle-form'>
                    <div class='form-group'><label>Name</label><input name='name' required></div>
                    <div class='form-group'><label>Year</label><input name='year' required type='number'></div>
                    <div class='form-group'><label>VIN</label><input name='vin'></div>
                    <button class='btn btn-primary' type='submit'>Add</button>
                </form>
            </div>
        </div>`;
    const modal = ModalManager.show(modalHtml);
    document.getElementById('add-vehicle-form').onsubmit = async (e) => {
        e.preventDefault();
        const form = e.target;
        const data = {
            name: form.name.value,
            year: form.year.value,
            vin: form.vin.value
        };
        try {
            const res = await fetch('/api/customer/vehicles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Failed to add vehicle');
            showNotification('Vehicle added', 'success');
            ModalManager.hide(modal);
            loadMyVehicles();
        } catch (err) {
            showNotification('Failed to add vehicle', 'error');
        }
    };
};

window.showEditVehicleModal = function(vehicleId) {
    fetch(`/api/customer/vehicles/${vehicleId}`)
        .then(res => res.json())
        .then(vehicle => {
            const modalHtml = `
                <div class='modal-content animate-slide-up'>
                    <button class='modal-close'>&times;</button>
                    <div class='modal-body'>
                        <h3>Edit Vehicle</h3>
                        <form id='edit-vehicle-form'>
                            <div class='form-group'><label>Name</label><input name='name' value='${vehicle.name}' required></div>
                            <div class='form-group'><label>Year</label><input name='year' value='${vehicle.year}' required type='number'></div>
                            <div class='form-group'><label>VIN</label><input name='vin' value='${vehicle.vin || ''}'></div>
                            <button class='btn btn-primary' type='submit'>Save</button>
                        </form>
                    </div>
                </div>`;
            const modal = ModalManager.show(modalHtml);
            document.getElementById('edit-vehicle-form').onsubmit = async (e) => {
                e.preventDefault();
                const form = e.target;
                const data = {
                    name: form.name.value,
                    year: form.year.value,
                    vin: form.vin.value
                };
                try {
                    const res = await fetch(`/api/customer/vehicles/${vehicleId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                    if (!res.ok) throw new Error('Failed to update vehicle');
                    showNotification('Vehicle updated', 'success');
                    ModalManager.hide(modal);
                    loadMyVehicles();
                } catch (err) {
                    showNotification('Failed to update vehicle', 'error');
                }
            };
        });
};

window.deleteVehicle = async function(vehicleId) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
        const res = await fetch(`/api/customer/vehicles/${vehicleId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete vehicle');
        showNotification('Vehicle deleted', 'success');
        loadMyVehicles();
    } catch (err) {
        showNotification('Failed to delete vehicle', 'error');
    }
};

// Jobs Module
function initializeJobsModule() {
    loadMyJobs();
    setupJobsFilter();
}

async function loadMyJobs() {
    await fetchWithSkeleton('/api/customer/jobs', 'my-jobs-table-body', renderJobsTable, 'Failed to load jobs');
}

function renderJobsTable(jobs) {
    const tbody = document.getElementById('my-jobs-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!jobs.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No jobs found</td></tr>';
        return;
    }
    jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.className = 'job-row animate-slide-in-up';
        tr.innerHTML = `
            <td>#${job.id}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge ${job.status.toLowerCase()}">${job.status}</span></td>
            <td>${job.date}</td>
            <td>$${job.totalCost || '-'}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="showJobDetailsModal(${job.id})">Details</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function setupJobsFilter() {
    const filterInput = document.getElementById('jobs-filter-input');
    if (filterInput) {
        filterInput.addEventListener('input', () => filterJobs(filterInput.value));
    }
}

async function filterJobs(searchTerm) {
    // Fetch jobs and filter client-side for now
    const res = await fetch('/api/customer/jobs');
    if (!res.ok) return;
    const jobs = await res.json();
    const filtered = jobs.filter(job =>
        job.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderJobsTable(filtered);
}

window.showJobDetailsModal = async function(jobId) {
    try {
        const res = await fetch(`/api/customer/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to load job details');
        const job = await res.json();
        const modalHtml = `
            <div class='modal-content animate-slide-up'>
                <button class='modal-close'>&times;</button>
                <div class='modal-body'>
                    <h3>Job #${job.id}</h3>
                    <div><strong>Vehicle:</strong> ${job.vehicle}</div>
                    <div><strong>Service:</strong> ${job.service}</div>
                    <div><strong>Status:</strong> <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span></div>
                    <div><strong>Date:</strong> ${job.date}</div>
                    <div><strong>Total Cost:</strong> $${job.totalCost || '-'}</div>
                    ${job.status === 'Invoiced' ? `<button class='btn btn-primary' onclick='payForJob(${job.id}, ${job.totalCost})'>Pay Now</button>` : ''}
                </div>
            </div>
        `;
        ModalManager.show(modalHtml);
    } catch (err) {
        showNotification('Failed to load job details', 'error');
    }
}

window.payForJob = async function(jobId, amount) {
    try {
        const res = await fetch(`/api/customer/jobs/${jobId}/pay`, { method: 'POST' });
        if (!res.ok) throw new Error('Payment failed');
        ModalManager.show(`<div class='modal-content'><button class='modal-close'>&times;</button><div class='modal-body'><h3>Payment Successful!</h3><p>Your payment of $${amount} was processed.</p></div></div>`);
        showNotification('Payment successful', 'success');
        loadMyJobs();
        loadDashboardOverview();
    } catch (err) {
        showNotification('Payment failed', 'error');
    }
}

// Payment Module
function initializePaymentModule() {
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalClose = document.getElementById('payment-modal-close');
    const paymentCancelBtn = document.getElementById('payment-cancel-btn');
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const jobDetailsModal = document.getElementById('job-details-modal');
    const jobDetailsClose = document.getElementById('job-details-close');

    if (paymentModalClose) {
        paymentModalClose.addEventListener('click', () => hideModal(paymentModal));
    }
    
    if (paymentCancelBtn) {
        paymentCancelBtn.addEventListener('click', () => hideModal(paymentModal));
    }
    
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', processPayment);
    }
    
    if (jobDetailsClose) {
        jobDetailsClose.addEventListener('click', () => hideModal(jobDetailsModal));
    }
}

async function showJobDetails(jobId) {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const jobs = await response.json();
        const job = jobs.find(j => j.jobId === jobId);
        
        if (job) {
            populateJobDetailsModal(job);
            showModal(document.getElementById('job-details-modal'));
        }
    } catch (error) {
        console.error('Error loading job details:', error);
        showNotification('Failed to load job details', 'error');
    }
}

function populateJobDetailsModal(job) {
    document.getElementById('detail-job-id').textContent = job.jobId;
    document.getElementById('detail-vehicle').textContent = job.vehicle;
    document.getElementById('detail-service').textContent = job.service;
    document.getElementById('detail-status').innerHTML = `<span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>`;
    document.getElementById('detail-booking-date').textContent = new Date(job.bookingDate).toLocaleString();
    document.getElementById('detail-completion-date').textContent = job.completionDate ? new Date(job.completionDate).toLocaleString() : 'Not completed';
    document.getElementById('detail-total-cost').textContent = job.totalCost ? '$' + job.totalCost : 'Not calculated';
    document.getElementById('detail-notes').textContent = job.notes || 'No notes';

    // Payment section
    const paymentSection = document.getElementById('payment-section');
    if (job.status === 'Invoiced') {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <p><strong>Amount Due: $${job.totalCost}</strong></p>
                <button class="btn btn-success" onclick="showPaymentModal(${job.jobId})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                        <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Pay Now
                </button>
            </div>
        `;
    } else if (job.status === 'Paid') {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <p class="payment-status-paid">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                    Payment Completed
                </p>
                <p>Amount Paid: $${job.totalCost}</p>
            </div>
        `;
    } else {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <p>Payment will be available once the job is completed and invoiced.</p>
            </div>
        `;
    }
}

async function showPaymentModal(jobId) {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const jobs = await response.json();
        const job = jobs.find(j => j.jobId === jobId);
        
        if (job && job.status === 'Invoiced') {
            document.getElementById('payment-job-id').textContent = job.jobId;
            document.getElementById('payment-service').textContent = job.service;
            document.getElementById('payment-amount').textContent = '$' + job.totalCost;
            
            // Store job ID for payment processing
            document.getElementById('process-payment-btn').setAttribute('data-job-id', jobId);
            
            showModal(document.getElementById('payment-modal'));
        } else {
            showNotification('Job is not ready for payment', 'error');
        }
    } catch (error) {
        console.error('Error loading job for payment:', error);
        showNotification('Failed to load payment details', 'error');
    }
}

async function processPayment() {
    const jobId = document.getElementById('process-payment-btn').getAttribute('data-job-id');
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // Show processing state
    const processingOverlay = showProcessingMessage('Processing payment...');
    
    try {
        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(`http://localhost:8080/api/customer/payment/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethod: selectedPaymentMethod })
        });

        const result = await response.json();
        
        hideProcessingMessage(processingOverlay);
        
        if (response.ok) {
            hideModal(document.getElementById('payment-modal'));
            showNotification('Payment processed successfully!', 'success');
            loadMyJobs(); // Refresh jobs table
            loadServiceHistory(); // Refresh history
            loadCustomerData(); // Refresh stats
        } else {
            showNotification(result.error || 'Payment failed', 'error');
        }
    } catch (error) {
        hideProcessingMessage(processingOverlay);
        console.error('Error processing payment:', error);
        showNotification('Payment processing failed', 'error');
    }
}

// Service History Module
function initializeServiceHistoryModule() {
    loadServiceHistory();
    setupServiceHistoryFilter();
}

async function loadServiceHistory() {
    await fetchWithSkeleton('/api/customer/service-history', 'service-history-table-body', renderServiceHistoryTable, 'Failed to load service history');
}

function renderServiceHistoryTable(jobs) {
    const tbody = document.getElementById('service-history-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    if (!jobs.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">No service history found</td></tr>';
        return;
    }
    jobs.forEach(job => {
        const tr = document.createElement('tr');
        tr.className = 'job-row animate-slide-in-up';
        tr.innerHTML = `
            <td>#${job.id}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge ${job.status.toLowerCase()}">${job.status}</span></td>
            <td>${job.date}</td>
            <td>$${job.totalCost || '-'}</td>
            <td><button class="btn btn-sm btn-secondary" onclick="showServiceHistoryDetailsModal(${job.id})">Details</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function setupServiceHistoryFilter() {
    const filterInput = document.getElementById('service-history-filter-input');
    if (filterInput) {
        filterInput.addEventListener('input', () => filterServiceHistory(filterInput.value));
    }
}

async function filterServiceHistory(searchTerm) {
    const res = await fetch('/api/customer/service-history');
    if (!res.ok) return;
    const jobs = await res.json();
    const filtered = jobs.filter(job =>
        job.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    renderServiceHistoryTable(filtered);
}

window.showServiceHistoryDetailsModal = async function(jobId) {
    try {
        const res = await fetch(`/api/customer/service-history/${jobId}`);
        if (!res.ok) throw new Error('Failed to load service details');
        const job = await res.json();
        const modalHtml = `
            <div class='modal-content animate-slide-up'>
                <button class='modal-close'>&times;</button>
                <div class='modal-body'>
                    <h3>Service #${job.id}</h3>
                    <div><strong>Vehicle:</strong> ${job.vehicle}</div>
                    <div><strong>Service:</strong> ${job.service}</div>
                    <div><strong>Status:</strong> <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span></div>
                    <div><strong>Date:</strong> ${job.date}</div>
                    <div><strong>Total Cost:</strong> $${job.totalCost || '-'}</div>
                    <div><strong>Notes:</strong> ${job.notes || '-'}</div>
                </div>
            </div>
        `;
        ModalManager.show(modalHtml);
    } catch (err) {
        showNotification('Failed to load service details', 'error');
    }
}

// Customer Data Loading
async function loadCustomerData() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch customer data');
        
        const jobs = await response.json();
        updateCustomerStats(jobs);
    } catch (error) {
        console.error('Error loading customer data:', error);
    }
}

function updateCustomerStats(jobs) {
    const pendingJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;

    const pendingElement = document.getElementById('pending-jobs');
    const completedElement = document.getElementById('completed-jobs');
    
    if (pendingElement) pendingElement.textContent = pendingJobs;
    if (completedElement) completedElement.textContent = completedJobs;
}

// Utility Functions
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

function showProcessingMessage(message) {
    const overlay = document.createElement('div');
    overlay.className = 'processing-overlay';
    overlay.innerHTML = `
        <div class="processing-message">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function hideProcessingMessage(overlay) {
    if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
    }
}

// --- Modular Managers ---
class NotificationManager {
    constructor(containerId = 'notification-container') {
        this.container = document.getElementById(containerId);
    }
    show(message, type = 'info') {
        if (!this.container) return;
        const toast = document.createElement('div');
        toast.className = `notification-toast ${type} animate-fade-in`;
        toast.innerHTML = `<span class="toast-message">${message}</span>`;
        this.container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
}

class ModalManager {
    static show(modalHtml) {
        let modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = modalHtml;
        document.body.appendChild(modal);
        modal.querySelector('.modal-close')?.addEventListener('click', () => modal.remove());
        return modal;
    }
    static hide(modal) {
        if (modal) modal.remove();
    }
}

class DropdownManager {
    static init() {
        document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
            toggle.addEventListener('click', e => {
                e.stopPropagation();
                const menu = toggle.nextElementSibling;
                if (menu) menu.classList.toggle('show');
            });
        });
        document.addEventListener('click', () => {
            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('show'));
        });
    }
}

// --- Notification & Chatbot Integration ---
const notificationManager = new NotificationManager();
function showNotification(message, type = 'info') {
    notificationManager.show(message, type);
}

// Chatbot integration (assume chatbot.js provides ModernChatbot class)
document.addEventListener('DOMContentLoaded', () => {
    if (window.ModernChatbot) {
        // Only initialize once
        if (!window._chatbotInitialized) {
            new ModernChatbot('chatbot-container').init();
            window._chatbotInitialized = true;
        }
    }
});

// --- Animate DOM Updates Helper ---
function animateIn(element, animation = 'animate-fade-in') {
    if (element) element.classList.add(animation);
}

// --- Async Data Fetching with Loading Skeletons & Error Handling ---
async function fetchWithSkeleton(url, skeletonId, renderFn, errorMsg) {
    const skeleton = document.getElementById(skeletonId);
    if (skeleton) skeleton.innerHTML = '<div class="loading-skeleton"></div>';
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(errorMsg || 'Failed to fetch data');
        const data = await res.json();
        renderFn(data);
    } catch (err) {
        if (skeleton) skeleton.innerHTML = `<div class="no-data">${errorMsg || err.message}</div>`;
        showNotification(errorMsg || err.message, 'error');
    }
}

// --- Dashboard Overview Implementation ---
async function loadDashboardOverview() {
    // Metrics
    await fetchWithSkeleton('/api/customer/jobs/overview', 'customer-metrics-grid', renderMetricsGrid, 'Failed to load metrics');
    // Recent Jobs
    await fetchWithSkeleton('/api/customer/jobs/recent', 'recent-jobs-list', renderRecentJobs, 'Failed to load recent jobs');
    // Vehicles Summary
    await fetchWithSkeleton('/api/customer/vehicles/summary', 'vehicles-summary', renderVehiclesSummary, 'Failed to load vehicles');
}

function renderMetricsGrid(metrics) {
    const grid = document.getElementById('customer-metrics-grid');
    if (!grid) return;
    grid.innerHTML = '';
    metrics.forEach((metric, i) => {
        const card = document.createElement('div');
        card.className = `metric-card ${metric.class || ''}`;
        card.style.animationDelay = `${i * 0.1}s`;
        card.innerHTML = `
            <div class="metric-header">
                <div class="metric-icon">${metric.icon || ''}</div>
            </div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.title}</div>
        `;
        animateIn(card, 'animate-slide-up');
        grid.appendChild(card);
    });
}

function renderRecentJobs(jobs) {
    const list = document.getElementById('recent-jobs-list');
    if (!list) return;
    list.innerHTML = '';
    if (!jobs.length) {
        list.innerHTML = '<div class="no-data">No recent jobs found</div>';
        return;
    }
    jobs.forEach(job => {
        const item = document.createElement('div');
        item.className = 'job-summary-item animate-slide-in-right';
        item.innerHTML = `
            <div class="job-summary-header">
                <span class="job-id">#${job.id}</span>
                <span class="job-date">${job.date}</span>
            </div>
            <div class="job-summary-details">
                <span class="job-vehicle">${job.vehicle}</span>
                <span class="job-service">${job.service}</span>
                <span class="status-badge ${job.status.toLowerCase()}">${job.status}</span>
            </div>
        `;
        list.appendChild(item);
    });
}

function renderVehiclesSummary(vehicles) {
    const summary = document.getElementById('vehicles-summary');
    if (!summary) return;
    summary.innerHTML = '';
    if (!vehicles.length) {
        summary.innerHTML = '<div class="no-data">No vehicles found</div>';
        return;
    }
    vehicles.forEach(vehicle => {
        const item = document.createElement('div');
        item.className = 'vehicle-summary-item animate-slide-in-left';
        item.innerHTML = `
            <div class="vehicle-summary-icon"><svg class="icon"><use href="#car"/></svg></div>
            <div class="vehicle-summary-details">
                <span class="vehicle-name">${vehicle.name}</span>
                <span class="vehicle-year">${vehicle.year}</span>
            </div>
        `;
        summary.appendChild(item);
    });
}

// Quick Book button event
const quickBookBtn = document.getElementById('quick-book-btn');
if (quickBookBtn) {
    quickBookBtn.addEventListener('click', () => {
        // Switch to booking tab
        const bookingTab = document.querySelector('[data-tab="book-appointment"]');
        if (bookingTab) bookingTab.click();
    });
}

// --- Notification System Integration ---
function notifyAction(type, message) {
    showNotification(message, type);
    // Optionally, trigger chatbot or other UI feedback here
}

// Example: Use notifyAction in all major actions
// Replace showNotification('...', ...) with notifyAction(...)
// For booking
// notifyAction('success', 'Appointment booked successfully');
// For payment
// notifyAction('success', 'Payment successful');
// For vehicle add/edit/delete
// notifyAction('success', 'Vehicle added');
// For errors
// notifyAction('error', 'Failed to ...');