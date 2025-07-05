// Enhanced Customer Dashboard - Complete Implementation with Fixed Issues
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
    
    // Load initial data and set active tab
    loadCustomerData();
    
    // Fix: Ensure overview tab is active on page load/refresh
    setActiveTab('overview');
    loadTabData('overview');
}

// Enhanced Navigation System with animations
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            setActiveTab(targetTab);
            loadTabData(targetTab);
        });

        // Add hover effects
        link.addEventListener('mouseenter', () => {
            if (!link.classList.contains('active')) {
                link.style.transform = 'translateX(8px)';
                link.style.transition = 'all 0.3s ease';
            }
        });

        link.addEventListener('mouseleave', () => {
            if (!link.classList.contains('active')) {
                link.style.transform = 'translateX(0)';
            }
        });
    });
}

function setActiveTab(targetTab) {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all
    navLinks.forEach(l => {
        l.classList.remove('active');
        l.style.transform = 'translateX(0)';
    });
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.opacity = '0';
        content.style.transform = 'translateY(20px)';
    });
    
    // Add active class to target
    const activeLink = document.querySelector(`[data-tab="${targetTab}"]`);
    const activeContent = document.getElementById(`${targetTab}-tab`);
    
    if (activeLink) {
        activeLink.classList.add('active');
        activeLink.style.transform = 'translateX(8px)';
    }
    
    if (activeContent) {
        activeContent.classList.add('active');
        // Animate content appearance
        setTimeout(() => {
            activeContent.style.opacity = '1';
            activeContent.style.transform = 'translateY(0)';
            activeContent.style.transition = 'all 0.4s ease';
        }, 100);
    }
}

function loadTabData(tab) {
    switch(tab) {
        case 'overview':
            loadCustomerData();
            break;
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
            // Add loading animation
            logoutButton.innerHTML = `
                <svg class="icon animate-spin" viewBox="0 0 24 24">
                    <path d="M21 12a9 9 0 11-6.219-8.56"/>
                </svg>
                <span>Logging out...</span>
            `;
            
            setTimeout(() => {
                sessionStorage.clear();
                window.location.href = '/index.html';
            }, 1000);
        });
    }
}

// Enhanced Map Integration with animations
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
        <div class="map-container animate-slide-up">
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
                    ${branches.map((branch, index) => `
                        <div class="branch-card animate-slide-in-right" data-branch-id="${branch.id}" style="animation-delay: ${index * 0.1}s">
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
    // Branch selection with enhanced animations
    document.querySelectorAll('.select-branch-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const branchId = parseInt(e.target.getAttribute('data-branch-id'));
            selectBranch(branchId);
        });
    });

    // Enhanced branch card hover effects
    document.querySelectorAll('.branch-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = 'var(--shadow-2xl)';
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        card.addEventListener('mouseleave', () => {
            if (!card.classList.contains('selected')) {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = 'var(--shadow-sm)';
            }
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
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = 'var(--shadow-sm)';
    });
    
    const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
        selectedCard.style.transform = 'translateY(-8px) scale(1.05)';
        selectedCard.style.boxShadow = 'var(--shadow-2xl)';
        
        // Pulse effect
        selectedCard.style.animation = 'pulse 0.6s ease-in-out';
        setTimeout(() => {
            selectedCard.style.animation = '';
        }, 600);
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
        { id: 1, name: "RepairHub Pro Downtown", address: "123 Main Street, Downtown" },
        { id: 2, name: "RepairHub Pro Uptown", address: "456 Oak Avenue, Uptown" },
        { id: 3, name: "RepairHub Pro Westside", address: "789 Pine Road, Westside" }
    ];
    
    const branch = branches.find(b => b.id === branchId);
    const infoContainer = document.getElementById('selected-branch-info');
    
    if (infoContainer && branch) {
        // Fade out animation
        infoContainer.style.opacity = '0';
        infoContainer.style.transform = 'translateY(20px)';
        
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
                            <strong>Status:</strong>
                            <span class="status-success">✓ Selected</span>
                        </div>
                    </div>
                </div>
            `;
            
            // Fade in animation
            infoContainer.style.opacity = '1';
            infoContainer.style.transform = 'translateY(0)';
            infoContainer.style.transition = 'all 0.4s ease';
        }, 200);
    }
}

function detectUserLocation() {
    const detectBtn = document.getElementById('detect-location');
    
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }

    // Enhanced loading state
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
            detectBtn.disabled = false;
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
            detectBtn.disabled = false;
            showNotification('Failed to detect location', 'error');
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
    
    // Clear existing options
    vehicleSelect.innerHTML = '<option value="">Choose your vehicle...</option>';
    
    vehicles.forEach(vehicle => {
        const option = document.createElement('option');
        option.value = vehicle.id;
        option.textContent = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
        vehicleSelect.appendChild(option);
    });

    // Add enhanced styling and animation
    vehicleSelect.addEventListener('change', () => {
        if (vehicleSelect.value) {
            vehicleSelect.style.borderColor = 'var(--success-500)';
            vehicleSelect.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
        } else {
            vehicleSelect.style.borderColor = 'var(--secondary-200)';
            vehicleSelect.style.boxShadow = 'none';
        }
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
    
    // Clear existing options
    serviceSelect.innerHTML = '<option value="">Choose a service...</option>';
    
    services.forEach(service => {
        const option = document.createElement('option');
        option.value = service.id;
        option.textContent = `${service.serviceName} - $${service.price}`;
        option.setAttribute('data-price', service.price);
        option.setAttribute('data-description', service.description || '');
        serviceSelect.appendChild(option);
    });

    // Add enhanced styling and animation
    serviceSelect.addEventListener('change', () => {
        if (serviceSelect.value) {
            serviceSelect.style.borderColor = 'var(--success-500)';
            serviceSelect.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
        } else {
            serviceSelect.style.borderColor = 'var(--secondary-200)';
            serviceSelect.style.boxShadow = 'none';
        }
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
        
        // Animate service details appearance
        serviceDetails.style.display = 'block';
        serviceDetails.style.opacity = '0';
        serviceDetails.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            serviceDetails.style.opacity = '1';
            serviceDetails.style.transform = 'translateY(0)';
            serviceDetails.style.transition = 'all 0.4s ease';
        }, 100);
    } else {
        serviceDetails.style.opacity = '0';
        serviceDetails.style.transform = 'translateY(20px)';
        setTimeout(() => {
            serviceDetails.style.display = 'none';
        }, 300);
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
            
            showNotification('Appointment booked successfully!', 'success');
            
            // Reset form after delay
            setTimeout(() => {
                document.getElementById('booking-form').reset();
                document.getElementById('service-details').style.display = 'none';
                document.getElementById('selected-branch-name').textContent = 'Please select a branch above';
                submitBtn.innerHTML = originalText;
                submitBtn.classList.remove('btn-success');
                submitBtn.classList.add('btn-primary');
                submitBtn.disabled = false;
                
                // Clear branch selection
                document.querySelectorAll('.branch-card').forEach(card => {
                    card.classList.remove('selected');
                    card.style.transform = 'translateY(0) scale(1)';
                    card.style.boxShadow = 'var(--shadow-sm)';
                });
                
                // Reset selected branch info
                document.getElementById('selected-branch-info').innerHTML = `
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
                `;
            }, 2000);
            
            loadCustomerData(); // Refresh stats
        } else {
            throw new Error(result.error || 'Failed to book appointment');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification(error.message || 'Failed to book appointment', 'error');
        
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

    // Show loading state
    const submitBtn = document.querySelector('#vehicle-form button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = `
        <svg class="icon icon-sm animate-spin" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Adding Vehicle...
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
        showNotification(error.message || 'Failed to add vehicle', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
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
        showNotification('Failed to load vehicles', 'error');
    }
}

function populateVehiclesGrid(vehicles) {
    const vehiclesGrid = document.getElementById('vehicles-grid');
    if (!vehiclesGrid) return;
    
    if (vehicles.length === 0) {
        vehiclesGrid.innerHTML = `
            <div class="empty-state animate-fade-in">
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
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = vehicles.map((vehicle, index) => `
        <div class="vehicle-card animate-slide-up" style="animation-delay: ${index * 0.1}s">
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
                    <span class="status-badge">Active</span>
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
                <button class="btn btn-primary" onclick="bookForVehicle(${vehicle.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Book Service
                </button>
            </div>
        </div>
    `).join('');

    // Add hover effects to vehicle cards
    document.querySelectorAll('.vehicle-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-8px) scale(1.02)';
            card.style.boxShadow = 'var(--shadow-2xl)';
            card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
            card.style.boxShadow = 'var(--shadow-sm)';
        });
    });
}

function bookForVehicle(vehicleId) {
    // Switch to booking tab and pre-select vehicle with animation
    setActiveTab('book-appointment');
    loadTabData('book-appointment');
    
    setTimeout(() => {
        const vehicleSelect = document.getElementById('booking-vehicle');
        if (vehicleSelect) {
            vehicleSelect.value = vehicleId;
            vehicleSelect.style.borderColor = 'var(--success-500)';
            vehicleSelect.style.boxShadow = '0 0 0 3px rgba(34, 197, 94, 0.1)';
            
            // Scroll to booking form
            document.querySelector('.booking-container').scrollIntoView({ 
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, 500);
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
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        populateJobsTable(jobs.filter(job => job.status !== 'Paid'));
    } catch (error) {
        console.error('Error loading jobs:', error);
        showNotification('Failed to load jobs', 'error');
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
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = jobs.map((job, index) => `
        <tr class="job-row animate-slide-in-right" data-status="${job.status.toLowerCase().replace(' ', '-')}" style="animation-delay: ${index * 0.05}s">
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

    // Add hover effects to table rows
    document.querySelectorAll('.job-row').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = 'var(--primary-50)';
            row.style.transform = 'translateX(4px)';
            row.style.transition = 'all 0.2s ease';
        });

        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
            row.style.transform = 'translateX(0)';
        });
    });
}

function filterJobs(searchTerm) {
    const rows = document.querySelectorAll('#my-jobs-table-body tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const isVisible = text.includes(searchTerm.toLowerCase());
        row.style.display = isVisible ? '' : 'none';
        
        if (isVisible && searchTerm) {
            row.style.backgroundColor = 'var(--warning-50)';
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

    // Enhanced payment section
    const paymentSection = document.getElementById('payment-section');
    if (job.status === 'Invoiced') {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <div class="payment-amount-display">
                    <span class="amount-label">Amount Due</span>
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
                    <p>Amount Paid: <strong>$${job.totalCost}</strong></p>
                    <p>Payment Date: ${job.completionDate ? new Date(job.completionDate).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
        `;
    } else {
        paymentSection.innerHTML = `
            <div class="payment-info">
                <div class="payment-pending">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
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
            showNotification('Payment processed successfully!', 'success');
            loadMyJobs(); // Refresh jobs table
            loadServiceHistory(); // Refresh history
            loadCustomerData(); // Refresh stats
        } else {
            throw new Error(result.error || 'Payment failed');
        }
    } catch (error) {
        hideProcessingMessage(processingOverlay);
        console.error('Error processing payment:', error);
        showNotification('Payment processing failed', 'error');
    }
}

// Enhanced Service History Module
async function loadServiceHistory() {
    const userId = sessionStorage.getItem('userId');
    
    try {
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
        showNotification('Failed to load service history', 'error');
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

    tableBody.innerHTML = jobs.map((job, index) => `
        <tr class="history-row status-${job.status.toLowerCase().replace(' ', '-')} animate-slide-in-right" style="animation-delay: ${index * 0.05}s">
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

    // Add hover effects to history rows
    document.querySelectorAll('.history-row').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.backgroundColor = 'var(--primary-50)';
            row.style.transform = 'translateX(4px)';
            row.style.transition = 'all 0.2s ease';
        });

        row.addEventListener('mouseleave', () => {
            row.style.backgroundColor = '';
            row.style.transform = 'translateX(0)';
        });
    });
}

function filterServiceHistory(jobs) {
    const filter = document.getElementById('history-filter').value;
    const filteredJobs = filter === 'all' ? jobs : jobs.filter(job => job.status.toLowerCase() === filter);
    populateServiceHistoryTable(filteredJobs);
}

// Enhanced Customer Data Loading
async function loadCustomerData() {
    const userId = sessionStorage.getItem('userId');
    
    try {
        const [jobsResponse, vehiclesResponse] = await Promise.all([
            fetch(`http://localhost:8080/api/customer/jobs/${userId}`),
            fetch(`http://localhost:8080/api/customer/vehicles/${userId}`)
        ]);
        
        if (!jobsResponse.ok || !vehiclesResponse.ok) {
            throw new Error('Failed to fetch customer data');
        }
        
        const jobs = await jobsResponse.json();
        const vehicles = await vehiclesResponse.json();
        
        updateCustomerStats(jobs, vehicles);
        updateRecentJobsSummary(jobs);
        updateVehiclesSummary(vehicles);
    } catch (error) {
        console.error('Error loading customer data:', error);
    }
}

function updateCustomerStats(jobs, vehicles) {
    const pendingJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
    const totalSpent = jobs
        .filter(job => job.totalCost && job.status === 'Paid')
        .reduce((sum, job) => sum + parseFloat(job.totalCost), 0);

    // Enhanced metrics cards with animations
    const metricsGrid = document.getElementById('customer-metrics-grid');
    if (metricsGrid) {
        const metrics = [
            {
                title: 'Active Jobs',
                value: pendingJobs,
                icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
                class: 'jobs',
                change: pendingJobs > 0 ? 'In progress' : 'All caught up!'
            },
            {
                title: 'Completed Jobs',
                value: completedJobs,
                icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>',
                class: 'completed',
                change: `${jobs.length} total jobs`
            },
            {
                title: 'My Vehicles',
                value: vehicles.length,
                icon: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/><path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/></svg>',
                class: 'vehicles',
                change: 'Registered'
            },
            {
                title: 'Total Spent',
                value: `$${totalSpent.toFixed(2)}`,
                icon: '<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
                class: 'spent',
                change: 'This year'
            }
        ];

        metricsGrid.innerHTML = metrics.map((metric, index) => `
            <div class="metric-card ${metric.class} animate-slide-up" style="animation-delay: ${index * 0.1}s">
                <div class="metric-header">
                    <div class="metric-icon">${metric.icon}</div>
                </div>
                <div class="metric-value">${metric.value}</div>
                <div class="metric-label">${metric.title}</div>
                <div class="metric-change">${metric.change}</div>
            </div>
        `).join('');

        // Add hover effects to metric cards
        document.querySelectorAll('.metric-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-8px) scale(1.05)';
                card.style.boxShadow = 'var(--shadow-2xl)';
                card.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
                card.style.boxShadow = 'var(--shadow-md)';
            });
        });
    }
}

function updateRecentJobsSummary(jobs) {
    const recentJobsList = document.getElementById('recent-jobs-list');
    if (!recentJobsList) return;

    const recentJobs = jobs.slice(0, 3);
    
    if (recentJobs.length === 0) {
        recentJobsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-description">No recent jobs</div>
            </div>
        `;
        return;
    }

    recentJobsList.innerHTML = recentJobs.map((job, index) => `
        <div class="job-summary-item animate-slide-in-right" style="animation-delay: ${index * 0.1}s">
            <div class="job-summary-header">
                <span class="job-id">#${job.jobId}</span>
                <span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span>
            </div>
            <div class="job-summary-details">
                <div class="job-vehicle">${job.vehicle}</div>
                <div class="job-service">${job.service}</div>
                <div class="job-date">${new Date(job.bookingDate).toLocaleDateString()}</div>
            </div>
        </div>
    `).join('');

    // Add hover effects
    document.querySelectorAll('.job-summary-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(8px)';
            item.style.transition = 'all 0.2s ease';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
        });
    });
}

function updateVehiclesSummary(vehicles) {
    const vehiclesSummary = document.getElementById('vehicles-summary');
    if (!vehiclesSummary) return;

    if (vehicles.length === 0) {
        vehiclesSummary.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-description">No vehicles registered</div>
            </div>
        `;
        return;
    }

    vehiclesSummary.innerHTML = vehicles.slice(0, 3).map((vehicle, index) => `
        <div class="vehicle-summary-item animate-slide-in-right" style="animation-delay: ${index * 0.1}s">
            <div class="vehicle-summary-icon">
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
                </svg>
            </div>
            <div class="vehicle-summary-details">
                <div class="vehicle-name">${vehicle.make} ${vehicle.model}</div>
                <div class="vehicle-year">${vehicle.year}</div>
            </div>
        </div>
    `).join('');

    // Add hover effects
    document.querySelectorAll('.vehicle-summary-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateX(8px)';
            item.style.transition = 'all 0.2s ease';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateX(0)';
        });
    });
}

// Enhanced Utility Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Add backdrop blur effect
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            z-index: 1040;
        `;
        document.body.appendChild(backdrop);
        
        // Animate modal appearance
        setTimeout(() => {
            modal.style.opacity = '1';
            modal.style.transform = 'scale(1)';
        }, 10);
    }
}

function hideModal(modal) {
    if (modal) {
        // Animate modal disappearance
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Remove backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }, 200);
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
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 16px;
            border-radius: 12px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            max-width: 300px;
            border-left: 4px solid var(--${type === 'success' ? 'success' : type === 'error' ? 'error' : 'primary'}-500);
            animation: slideInRight 0.3s ease;
        `;
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">${type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Info'}</div>
            <div>${message}</div>
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
        }, 200);
    }
}