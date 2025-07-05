// Enhanced Customer Dashboard - Modern UI/UX Implementation
document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
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
    
    // Load initial data
    loadCustomerData();
    
    // Add smooth animations
    addPageAnimations();
}

// Add smooth page animations
function addPageAnimations() {
    // Animate cards on load
    const cards = document.querySelectorAll('.card, .stat-card, .metric-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Navigation System with smooth transitions
function initializeNavigation() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.opacity = '0';
                content.style.transform = 'translateX(20px)';
            });
            
            // Add active class to clicked button
            button.classList.add('active');
            
            // Show target content with animation
            setTimeout(() => {
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                    targetContent.style.transition = 'all 0.4s ease';
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateX(0)';
                }
                
                // Load data for the active tab
                loadTabData(targetTab);
            }, 100);
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

// Enhanced Map Integration with animations
function initializeMapIntegration() {
    const mapContainer = document.getElementById('branch-map-container');
    if (mapContainer) {
        mapContainer.innerHTML = createMapInterface();
        attachMapEventListeners();
        animateMapElements();
    }
}

function animateMapElements() {
    const branchCards = document.querySelectorAll('.branch-card');
    branchCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
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
            hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM",
            distance: "2.3 km"
        },
        {
            id: 2,
            name: "RepairHub Pro Uptown",
            address: "456 Oak Avenue, Uptown",
            phone: "(555) 234-5678",
            services: ["Paint Jobs", "Dent Repair", "Oil Change"],
            rating: 4.6,
            hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-5PM",
            distance: "4.1 km"
        },
        {
            id: 3,
            name: "RepairHub Pro Westside",
            address: "789 Pine Road, Westside",
            phone: "(555) 345-6789",
            services: ["Collision Repair", "Paint Jobs", "Maintenance"],
            rating: 4.9,
            hours: "Mon-Sat: 8AM-6PM",
            distance: "6.7 km"
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
                    Select Your Preferred Branch
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
                                    <strong>Available Services:</strong>
                                    <div class="services-tags">
                                        ${branch.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                                    </div>
                                </div>
                                <div class="branch-distance">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0"/>
                                        <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z"/>
                                    </svg>
                                    ${branch.distance} away
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
                        <div class="empty-state-description">Choose a location to see details and book your appointment</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachMapEventListeners() {
    // Branch selection with smooth animations
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
    // Update UI to show selection with animations
    document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('selected');
        card.style.transform = 'scale(1)';
    });
    
    const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.style.transform = 'scale(1.02)';
        selectedCard.style.transition = 'all 0.3s ease';
    }

    // Update selected branch info with animation
    updateSelectedBranchInfo(branchId);
    
    // Update booking form
    const branchNameElement = document.getElementById('selected-branch-name');
    if (branchNameElement) {
        const branchName = selectedCard.querySelector('h4').textContent;
        branchNameElement.textContent = branchName;
        branchNameElement.style.color = 'var(--success-600)';
        branchNameElement.style.fontWeight = '600';
    }
}

function updateSelectedBranchInfo(branchId) {
    const branches = [
        { id: 1, name: "RepairHub Pro Downtown", address: "123 Main Street, Downtown", phone: "(555) 123-4567" },
        { id: 2, name: "RepairHub Pro Uptown", address: "456 Oak Avenue, Uptown", phone: "(555) 234-5678" },
        { id: 3, name: "RepairHub Pro Westside", address: "789 Pine Road, Westside", phone: "(555) 345-6789" }
    ];
    
    const branch = branches.find(b => b.id === branchId);
    const infoContainer = document.getElementById('selected-branch-info');
    
    if (infoContainer && branch) {
        infoContainer.style.opacity = '0';
        setTimeout(() => {
            infoContainer.innerHTML = `
                <div class="selected-branch-details">
                    <h4>
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                        </svg>
                        ${branch.name}
                    </h4>
                    <div class="branch-info-grid">
                        <div class="info-item">
                            <strong>Address:</strong>
                            <span>${branch.address}</span>
                        </div>
                        <div class="info-item">
                            <strong>Phone:</strong>
                            <span>${branch.phone}</span>
                        </div>
                        <div class="info-item">
                            <strong>Status:</strong>
                            <span class="status-success">✓ Selected</span>
                        </div>
                    </div>
                    <div class="branch-actions">
                        <button class="btn btn-sm btn-secondary" onclick="viewBranchDetails(${branch.id})">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            View Details
                        </button>
                        <button class="btn btn-sm btn-primary" onclick="scrollToBooking()">
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            Book Now
                        </button>
                    </div>
                </div>
            `;
            infoContainer.style.transition = 'opacity 0.3s ease';
            infoContainer.style.opacity = '1';
        }, 200);
    }
}

function scrollToBooking() {
    const bookingForm = document.querySelector('.booking-container');
    if (bookingForm) {
        bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    detectBtn.disabled = true;

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
            showNotification('Location detected successfully! Showing nearest branches.', 'success');
            
            // Simulate sorting branches by distance
            setTimeout(() => {
                animateMapElements();
            }, 1000);
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
            showNotification('Failed to detect location. Please select a branch manually.', 'error');
        }
    );
}

// Enhanced Booking Module
function initializeBookingModule() {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('booking-service');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await bookAppointment();
        });
    }

    if (serviceSelect) {
        serviceSelect.addEventListener('change', showServiceDetails);
    }

    if (addVehicleBtn) {
        addVehicleBtn.addEventListener('click', () => showVehicleModal());
    }

    // Set minimum date to today
    const bookingDateInput = document.getElementById('booking-date');
    if (bookingDateInput) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        bookingDateInput.min = now.toISOString().slice(0, 16);
        bookingDateInput.value = now.toISOString().slice(0, 16);
    }
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
        showNotification('Failed to load vehicles', 'error');
    }
}

function populateVehicleSelect(vehicles) {
    const vehicleSelect = document.getElementById('booking-vehicle');
    if (!vehicleSelect) return;
    
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
        showNotification('Failed to load services', 'error');
    }
}

function populateServiceSelect(services) {
    const serviceSelect = document.getElementById('booking-service');
    if (!serviceSelect) return;
    
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
        serviceDetails.style.opacity = '0';
        serviceDetails.style.transform = 'translateY(20px)';
        setTimeout(() => {
            serviceDetails.style.transition = 'all 0.4s ease';
            serviceDetails.style.opacity = '1';
            serviceDetails.style.transform = 'translateY(0)';
        }, 100);
    } else {
        serviceDetails.style.display = 'none';
    }
}

async function bookAppointment() {
    const userId = sessionStorage.getItem('userId');
    const selectedBranch = document.querySelector('.branch-card.selected');
    
    if (!selectedBranch) {
        showNotification('Please select a branch location before booking', 'error');
        return;
    }
    
    const formData = {
        customerId: userId,
        vehicleId: document.getElementById('booking-vehicle').value,
        serviceId: document.getElementById('booking-service').value,
        bookingDate: document.getElementById('booking-date').value,
        notes: document.getElementById('booking-notes').value,
        branchId: selectedBranch.getAttribute('data-branch-id')
    };

    // Show loading state
    const submitBtn = document.querySelector('#booking-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg class="icon icon-sm animate-spin" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Booking...
    `;
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:8080/api/customer/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            submitBtn.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                Booked Successfully!
            `;
            submitBtn.classList.remove('btn-primary');
            submitBtn.classList.add('btn-success');
            
            showNotification('Appointment booked successfully! You will receive a confirmation shortly.', 'success');
            
            // Reset form after delay
            setTimeout(() => {
                document.getElementById('booking-form').reset();
                document.getElementById('service-details').style.display = 'none';
                document.getElementById('selected-branch-name').textContent = 'Please select a branch above';
                submitBtn.innerHTML = originalText;
                submitBtn.classList.remove('btn-success');
                submitBtn.classList.add('btn-primary');
                submitBtn.disabled = false;
            }, 3000);
            
            loadCustomerData(); // Refresh stats
        } else {
            throw new Error(result.error || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification(error.message, 'error');
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Enhanced Vehicle Module
function initializeVehicleModule() {
    const vehicleModal = document.getElementById('vehicle-modal');
    const vehicleForm = document.getElementById('vehicle-form');
    const vehicleModalClose = document.getElementById('vehicle-modal-close');
    const vehicleCancelBtn = document.getElementById('vehicle-cancel-btn');
    const addVehicleMainBtn = document.getElementById('add-vehicle-main-btn');

    if (addVehicleMainBtn) {
        addVehicleMainBtn.addEventListener('click', () => showVehicleModal());
    }
    
    if (vehicleModalClose) {
        vehicleModalClose.addEventListener('click', () => hideModal(vehicleModal));
    }
    
    if (vehicleCancelBtn) {
        vehicleCancelBtn.addEventListener('click', () => hideModal(vehicleModal));
    }

    if (vehicleForm) {
        vehicleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await addVehicle();
        });
    }
}

function showVehicleModal() {
    const vehicleForm = document.getElementById('vehicle-form');
    if (vehicleForm) {
        vehicleForm.reset();
    }
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

    const submitBtn = document.querySelector('#vehicle-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg class="icon icon-sm animate-spin" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Adding...
    `;
    submitBtn.disabled = true;

    try {
        const response = await fetch('http://localhost:8080/api/customer/vehicles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            hideModal(document.getElementById('vehicle-modal'));
            showNotification('Vehicle added successfully!', 'success');
            loadMyVehicles();
            loadCustomerVehicles(); // Refresh booking dropdown
        } else {
            throw new Error(result.error || 'Failed to add vehicle');
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadMyVehicles() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        showLoadingState('vehicles-grid');
        
        const response = await fetch(`http://localhost:8080/api/customer/vehicles/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch vehicles');
        
        const vehicles = await response.json();
        populateVehiclesGrid(vehicles);
    } catch (error) {
        console.error('Error loading vehicles:', error);
        showErrorState('vehicles-grid', 'Failed to load vehicles');
    }
}

function populateVehiclesGrid(vehicles) {
    const vehiclesGrid = document.getElementById('vehicles-grid');
    if (!vehiclesGrid) return;
    
    if (vehicles.length === 0) {
        vehiclesGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg class="icon icon-xl" viewBox="0 0 24 24">
                        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                        <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
                        <path d="M9 17v-6h8"/>
                        <path d="M2 6h15"/>
                    </svg>
                </div>
                <div class="empty-state-title">No vehicles found</div>
                <div class="empty-state-description">Add your first vehicle to get started!</div>
                <button class="btn btn-primary" onclick="showVehicleModal()">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    Add Vehicle
                </button>
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = vehicles.map((vehicle, index) => `
        <div class="vehicle-card" style="animation-delay: ${index * 100}ms">
            <div class="vehicle-header">
                <div class="vehicle-icon">
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                        <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                        <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
                        <path d="M9 17v-6h8"/>
                        <path d="M2 6h15"/>
                    </svg>
                </div>
                <div class="vehicle-status">
                    <span class="status-badge status-active">Active</span>
                </div>
            </div>
            <div class="vehicle-info">
                <h3>${vehicle.make} ${vehicle.model}</h3>
                <div class="vehicle-details">
                    <div class="detail-item">
                        <span class="detail-label">Year:</span>
                        <span class="detail-value">${vehicle.year}</span>
                    </div>
                    ${vehicle.vin ? `
                        <div class="detail-item">
                            <span class="detail-label">VIN:</span>
                            <span class="detail-value">${vehicle.vin}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="vehicle-actions">
                <button class="btn btn-sm btn-primary" onclick="bookForVehicle(${vehicle.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Book Service
                </button>
                <button class="btn btn-sm btn-secondary" onclick="viewVehicleHistory(${vehicle.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M3 3v5h5"/>
                        <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
                        <path d="M12 7v5l4 2"/>
                    </svg>
                    History
                </button>
            </div>
        </div>
    `).join('');

    // Animate vehicle cards
    const vehicleCards = vehiclesGrid.querySelectorAll('.vehicle-card');
    vehicleCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 150);
    });
}

function bookForVehicle(vehicleId) {
    // Switch to booking tab and pre-select vehicle
    document.querySelector('[data-tab="book-appointment"]').click();
    setTimeout(() => {
        const vehicleSelect = document.getElementById('booking-vehicle');
        if (vehicleSelect) {
            vehicleSelect.value = vehicleId;
            vehicleSelect.dispatchEvent(new Event('change'));
        }
        // Scroll to booking form
        scrollToBooking();
    }, 500);
}

function viewVehicleHistory(vehicleId) {
    showNotification('Vehicle history feature coming soon!', 'info');
}

// Enhanced Jobs Module
function initializeJobsModule() {
    const jobsSearch = document.getElementById('jobs-search');
    
    if (jobsSearch) {
        jobsSearch.addEventListener('input', (e) => {
            filterJobs(e.target.value);
        });
    }
}

async function loadMyJobs() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        showLoadingState('my-jobs-table-body');
        
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        populateJobsTable(jobs.filter(job => job.status !== 'Paid'));
    } catch (error) {
        console.error('Error loading jobs:', error);
        showErrorState('my-jobs-table-body', 'Failed to load jobs');
    }
}

function populateJobsTable(jobs) {
    const tableBody = document.getElementById('my-jobs-table-body');
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
                    <div class="empty-state-title">No current jobs found</div>
                    <div class="empty-state-description">Book your first appointment to get started</div>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-tab=\\'book-appointment\\']').click()">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Book Appointment
                    </button>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = jobs.map(job => `
        <tr class="job-row" data-status="${job.status.toLowerCase()}">
            <td><strong>#${job.jobId}</strong></td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.totalCost ? '$' + job.totalCost : '<span class="text-secondary">Pending</span>'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetails(${job.jobId})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Details
                </button>
                ${job.status === 'Invoiced' ? `
                    <button class="btn btn-sm btn-success" onclick="showPaymentModal(${job.jobId})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                            <line x1="1" y1="10" x2="23" y2="10"/>
                        </svg>
                        Pay Now
                    </button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function filterJobs(searchTerm) {
    const rows = document.querySelectorAll('#my-jobs-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm.toLowerCase());
        row.style.display = isVisible ? '' : 'none';
        
        if (isVisible && searchTerm) {
            row.style.backgroundColor = 'var(--primary-50)';
        } else {
            row.style.backgroundColor = '';
        }
    });
}

// Enhanced Payment Module
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
                <div class="payment-amount-display">
                    <span class="amount-label">Amount Due:</span>
                    <span class="amount-value">$${job.totalCost}</span>
                </div>
                <button class="btn btn-success btn-full" onclick="showPaymentModal(${job.jobId})">
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
                <div class="payment-status-paid">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                    Payment Completed
                </div>
                <div class="payment-details">
                    <span>Amount Paid: $${job.totalCost}</span>
                    <span>Payment Date: ${job.completionDate ? new Date(job.completionDate).toLocaleDateString() : 'N/A'}</span>
                </div>
            </div>
        `;
    } else {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <div class="payment-pending">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12,6 12,12 16,14"/>
                    </svg>
                    Payment will be available once the job is completed and invoiced.
                </div>
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
            showNotification('Payment processed successfully! Thank you for your business.', 'success');
            loadMyJobs(); // Refresh jobs table
            loadServiceHistory(); // Refresh history
            loadCustomerData(); // Refresh stats
        } else {
            throw new Error(result.error || 'Payment failed');
        }
    } catch (error) {
        hideProcessingMessage(processingOverlay);
        console.error('Error processing payment:', error);
        showNotification('Payment processing failed. Please try again.', 'error');
    }
}

// Service History Module
async function loadServiceHistory() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        showLoadingState('service-history-table-body');
        
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch service history');
        
        const jobs = await response.json();
        populateServiceHistoryTable(jobs);
        
        // Initialize filter
        const historyFilter = document.getElementById('history-filter');
        if (historyFilter) {
            historyFilter.addEventListener('change', () => filterServiceHistory(jobs));
        }
    } catch (error) {
        console.error('Error loading service history:', error);
        showErrorState('service-history-table-body', 'Failed to load service history');
    }
}

function populateServiceHistoryTable(jobs) {
    const tableBody = document.getElementById('service-history-table-body');
    if (!tableBody) return;

    if (jobs.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-state">
                    <div class="empty-state-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <path d="M3 3v5h5"/>
                            <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
                            <path d="M12 7v5l4 2"/>
                        </svg>
                    </div>
                    <div class="empty-state-title">No service history found</div>
                    <div class="empty-state-description">Your completed services will appear here</div>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = jobs.map(job => `
        <tr class="history-row status-${job.status.toLowerCase().replace(' ', '-')}">
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${job.totalCost ? '$' + job.totalCost : '<span class="text-secondary">Pending</span>'}</td>
            <td class="actions">
                <button class="btn btn-sm btn-primary" onclick="showJobDetails(${job.jobId})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                    </svg>
                    View
                </button>
            </td>
        </tr>
    `).join('');
}

function filterServiceHistory(jobs) {
    const filter = document.getElementById('history-filter').value;
    const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status.toLowerCase() === filter);
    populateServiceHistoryTable(filteredJobs);
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
    
    if (pendingElement) {
        pendingElement.textContent = pendingJobs;
        animateNumber(pendingElement, 0, pendingJobs, 1000);
    }
    if (completedElement) {
        completedElement.textContent = completedJobs;
        animateNumber(completedElement, 0, completedJobs, 1000);
    }
}

function animateNumber(element, start, end, duration) {
    const range = end - start;
    const increment = range / (duration / 16);
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= end) {
            current = end;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

// Utility Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Add animation
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'scale(0.9) translateY(-20px)';
            content.style.opacity = '0';
            setTimeout(() => {
                content.style.transition = 'all 0.3s ease';
                content.style.transform = 'scale(1) translateY(0)';
                content.style.opacity = '1';
            }, 10);
        }
    }
}

function hideModal(modal) {
    if (modal) {
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.style.transform = 'scale(0.9) translateY(-20px)';
            content.style.opacity = '0';
        }
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
        }, 300);
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
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="toast-content">
                <div class="toast-title">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
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
        overlay.style.opacity = '0';
        setTimeout(() => {
            overlay.parentNode.removeChild(overlay);
        }, 300);
    }
}

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

// Additional utility functions
function viewBranchDetails(branchId) {
    showNotification('Branch details feature coming soon!', 'info');
}