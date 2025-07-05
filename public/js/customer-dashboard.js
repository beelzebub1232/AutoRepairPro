document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check: if no user role or not customer, redirect to login
    if (!userRole || userRole !== 'customer') {
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
    initializeBookingModule();
    initializeVehicleModule();
    initializeJobsModule();
    initializePaymentModule();
    
    // Load initial data
    loadCustomerData();
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
        });
    });
}

// Booking Module
function initializeBookingModule() {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('booking-service');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');

    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await bookAppointment();
    });

    serviceSelect.addEventListener('change', showServiceDetails);
    addVehicleBtn.addEventListener('click', () => showVehicleModal());

    // Set minimum date to today
    const bookingDateInput = document.getElementById('booking-date');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    bookingDateInput.min = now.toISOString().slice(0, 16);
    bookingDateInput.value = now.toISOString().slice(0, 16);
}

async function loadBookingData() {
    await Promise.all([
        loadCustomerVehicles(),
        loadAvailableServices()
    ]);
}

async function loadCustomerVehicles() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/vehicles/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        
        const vehicles = await response.json();
        populateVehicleSelect(vehicles);
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showError('Failed to load vehicles');
    }
}

function populateVehicleSelect(vehicles) {
    const vehicleSelect = document.getElementById('booking-vehicle');
    vehicleSelect.innerHTML = '<option value="">Choose your vehicle...</option>';
    
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
        vehicleSelect.appendChild(option);
    });
}

async function loadAvailableServices() {
    try {
        const response = await fetch('http://localhost:8080/api/services');
        if (!response.ok) throw new Error('Failed to fetch services');
        
        const services = await response.json();
        populateServiceSelect(services);
    } catch (error) {
        console.error('Error loading services:', error);
        showError('Failed to load services');
    }
}

function populateServiceSelect(services) {
    const serviceSelect = document.getElementById('booking-service');
    serviceSelect.innerHTML = '<option value="">Choose a service...</option>';
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.serviceName} - $${service.price}`;
        option.setAttribute('data-price', service.price);
        option.setAttribute('data-description', service.description || '');
        serviceSelect.appendChild(option);
    });
}

function showServiceDetails() {
    const serviceSelect = document.getElementById('booking-service');
    const serviceDetails = document.getElementById('service-details');
    const selectedOption = serviceSelect.options[serviceSelect.selectedIndex];
    
    if (selectedOption.value) {
        document.getElementById('selected-service-name').textContent = selectedOption.textContent.split(' - $')[0];
        document.getElementById('selected-service-price').textContent = '$' + selectedOption.getAttribute('data-price');
        document.getElementById('selected-service-description').textContent = selectedOption.getAttribute('data-description') || 'No description available';
        serviceDetails.style.display = 'block';
    } else {
        serviceDetails.style.display = 'none';
    }
}

async function bookAppointment() {
    const userId = sessionStorage.getItem('userId');
    const formData = {
        customerId: userId,
        vehicleId: document.getElementById('booking-vehicle').value,
        serviceId: document.getElementById('booking-service').value,
        bookingDate: document.getElementById('booking-date').value,
        notes: document.getElementById('booking-notes').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/customer/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showSuccess('Appointment booked successfully!');
            document.getElementById('booking-form').reset();
            document.getElementById('service-details').style.display = 'none';
            loadCustomerData(); // Refresh stats
        } else {
            showError(result.error || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showError('Failed to book appointment');
    }
}

// Vehicle Module
function initializeVehicleModule() {
    const vehicleModal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('vehicle-form');
    const vehicleModalClose = document.getElementById('vehicle-modal-close');
    const vehicleCancelBtn = document.getElementById('vehicle-cancel-btn');
    const addVehicleMainBtn = document.getElementById('add-vehicle-main-btn');

    addVehicleMainBtn.addEventListener('click', () => showVehicleModal());
    vehicleModalClose.addEventListener('click', () => hideModal(vehicleModal));
    vehicleCancelBtn.addEventListener('click', () => hideModal(vehicleModal));

    vehicleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await addVehicle();
    });
}

function showVehicleModal() {
    document.getElementById('vehicle-form').reset();
    showModal(document.getElementById('vehicle-modal'));
}

async function addVehicle() {
    const userId = sessionStorage.getItem('userId');
    const formData = {
        customerId: userId,
        make: document.getElementById('vehicle-make').value,
        model: document.getElementById('vehicle-model').value,
        year: parseInt(document.getElementById('vehicle-year').value),
        vin: document.getElementById('vehicle-vin').value
    };

    try {
        const response = await fetch('http://localhost:8080/api/customer/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('vehicle-modal'));
            showSuccess('Vehicle added successfully!');
            loadMyVehicles();
            loadCustomerVehicles(); // Refresh booking dropdown
        } else {
            showError(result.error || 'Failed to add vehicle');
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showError('Failed to add vehicle');
    }
}

async function loadMyVehicles() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/vehicles/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        
        const vehicles = await response.json();
        populateVehiclesGrid(vehicles);
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showError('Failed to load vehicles');
    }
}

function populateVehiclesGrid(vehicles) {
    const vehiclesGrid = document.getElementById('vehicles-grid');
    vehiclesGrid.innerHTML = '';

    if (vehicles.length === 0) {
        vehiclesGrid.innerHTML = '<div class="no-data">No vehicles found. Add your first vehicle to get started!</div>';
        return;
    }

    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement('div');
        vehicleCard.className = 'vehicle-card';
        vehicleCard.innerHTML = `
            <div class="vehicle-info">
                <h3>${vehicle.make} ${vehicle.model}</h3>
                <p class="vehicle-year">Year: ${vehicle.year}</p>
                ${vehicle.vin ? `<p class="vehicle-vin">VIN: ${vehicle.vin}</p>` : ''}
            </div>
            <div class="vehicle-actions">
                <button class="btn btn-sm btn-primary" onclick="bookForVehicle(${vehicle.id})">Book Service</button>
            </div>
        `;
        vehiclesGrid.appendChild(vehicleCard);
    });
}

function bookForVehicle(vehicleId) {
    // Switch to booking tab and pre-select vehicle
    document.querySelector('[data-tab="book-appointment"]').click();
    setTimeout(() => {
        document.getElementById('booking-vehicle').value = vehicleId;
    }, 100);
}

// Jobs Module
function initializeJobsModule() {
    const jobsSearch = document.getElementById('jobs-search');
    
    jobsSearch.addEventListener('input', (e) => {
        filterJobs(e.target.value);
    });
}

async function loadMyJobs() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        populateJobsTable(jobs.filter(job => job.status !== 'Paid'));
    } catch (error) {
        console.error('Error loading jobs:', error);
        showError('Failed to load jobs');
    }
}

function populateJobsTable(jobs) {
    const tableBody = document.getElementById('my-jobs-table-body');
    tableBody.innerHTML = '';

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="no-data">No current jobs found.</td></tr>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.jobId}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.totalCost ? '$' + job.totalCost : 'Pending'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetails(${job.jobId})">Details</button>
                ${job.status === 'Invoiced' ? `<button class="btn btn-sm btn-success" onclick="showPaymentModal(${job.jobId})">Pay Now</button>` : ''}
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterJobs(searchTerm) {
    const rows = document.querySelectorAll('#my-jobs-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
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
        showError('Failed to load job details');
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
                <button class="btn btn-success" onclick="showPaymentModal(${job.jobId})">Pay Now</button>
            </div>
        `;
    } else if (job.status === 'Paid') {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <p class="payment-status-paid">✓ Payment Completed</p>
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

// Service History Module
async function loadServiceHistory() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch service history');
        
        const jobs = await response.json();
        populateServiceHistoryTable(jobs);
        
        // Initialize filter
        const historyFilter = document.getElementById('history-filter');
        historyFilter.addEventListener('change', () => filterServiceHistory(jobs));
    } catch (error) {
        console.error('Error loading service history:', error);
        showError('Failed to load service history');
    }
}

function populateServiceHistoryTable(jobs) {
    const tableBody = document.getElementById('service-history-table-body');
    tableBody.innerHTML = '';

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No service history found.</td></tr>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.className = `history-row status-${job.status.toLowerCase().replace(' ', '-')}`;
        row.innerHTML = `
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${job.totalCost ? '$' + job.totalCost : 'Pending'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetails(${job.jobId})">View</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function filterServiceHistory(jobs) {
    const filter = document.getElementById('history-filter').value;
    const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status.toLowerCase() === filter);
    populateServiceHistoryTable(filteredJobs);
}

// Payment Module
function initializePaymentModule() {
    const paymentModal = document.getElementById('payment-modal');
    const paymentModalClose = document.getElementById('payment-modal-close');
    const paymentCancelBtn = document.getElementById('payment-cancel-btn');
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const jobDetailsModal = document.getElementById('job-details-modal');
    const jobDetailsClose = document.getElementById('job-details-close');

    paymentModalClose.addEventListener('click', () => hideModal(paymentModal));
    paymentCancelBtn.addEventListener('click', () => hideModal(paymentModal));
    processPaymentBtn.addEventListener('click', processPayment);
    jobDetailsClose.addEventListener('click', () => hideModal(jobDetailsModal));
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
            showError('Job is not ready for payment');
        }
    } catch (error) {
        console.error('Error loading job for payment:', error);
        showError('Failed to load payment details');
    }
}

async function processPayment() {
    const jobId = document.getElementById('process-payment-btn').getAttribute('data-job-id');
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    // Simulate payment processing
    const processingMessage = showProcessingMessage('Processing payment...');
    
    try {
        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await fetch(`http://localhost:8080/api/customer/payment/${jobId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentMethod: selectedPaymentMethod })
        });

        const result = await response.json();
        
        hideProcessingMessage(processingMessage);
        
        if (response.ok) {
            hideModal(document.getElementById('payment-modal'));
            showSuccess('Payment processed successfully!');
            loadMyJobs(); // Refresh jobs table
            loadServiceHistory(); // Refresh history
            loadCustomerData(); // Refresh stats
        } else {
            showError(result.error || 'Payment failed');
        }
    } catch (error) {
        hideProcessingMessage(processingMessage);
        console.error('Error processing payment:', error);
        showError('Payment processing failed');
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

    document.getElementById('pending-jobs').textContent = pendingJobs;
    document.getElementById('completed-jobs').textContent = completedJobs;
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