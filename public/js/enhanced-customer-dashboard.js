// Enhanced Customer Dashboard - Complete Implementation with Database Integration
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
}

// Navigation System
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const navButtons = document.querySelectorAll('.nav-button');
    const tabContents = document.querySelectorAll('.tab-content');

    // Handle sidebar navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.getAttribute('data-tab');
            switchToTab(targetTab, navLinks, tabContents);
        });
    });

    // Handle navigation buttons (View All, Manage, etc.)
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = button.getAttribute('data-tab');
            switchToTab(targetTab, navLinks, tabContents);
        });
    });

    // Quick book button
    const quickBookBtn = document.getElementById('quick-book-btn');
    if (quickBookBtn) {
        quickBookBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchToTab('book-appointment', navLinks, tabContents);
        });
    }
}

function switchToTab(targetTab, navLinks, tabContents) {
    // Remove active class from all nav links and contents
    navLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to target nav link and content
    const targetNavLink = document.querySelector(`[data-tab="${targetTab}"]`);
    if (targetNavLink) {
        targetNavLink.classList.add('active');
    }
    
    const targetContent = document.getElementById(`${targetTab}-tab`);
    if (targetContent) {
        targetContent.classList.add('active');
    }
    
    // Load data for the active tab
    loadTabData(targetTab);
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
            sessionStorage.clear();
            window.location.href = '/index.html';
        });
    }
}

// Map Integration with Enhanced Location Detection
function initializeMapIntegration() {
    const mapContainer = document.getElementById('branch-map-container');
    if (mapContainer) {
        mapContainer.innerHTML = createMapInterface();
        attachMapEventListeners();
        initializeLeafletMap();
    }
}

let map = null;
let userLocation = null;
let branchMarkers = [];

const branches = [
    {
        id: 1,
        name: "RepairHub Pro Downtown",
        address: "123 Main Street, Downtown",
        phone: "(555) 123-4567",
        services: ["Paint Jobs", "Dent Repair", "Collision Repair"],
        rating: 4.8,
        hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM",
        lat: 40.7128,
        lng: -74.0060
    },
    {
        id: 2,
        name: "RepairHub Pro Uptown",
        address: "456 Oak Avenue, Uptown",
        phone: "(555) 234-5678",
        services: ["Paint Jobs", "Dent Repair", "Oil Change"],
        rating: 4.6,
        hours: "Mon-Fri: 7AM-7PM, Sat: 8AM-5PM",
        lat: 40.7831,
        lng: -73.9712
    },
    {
        id: 3,
        name: "RepairHub Pro Westside",
        address: "789 Pine Road, Westside",
        phone: "(555) 345-6789",
        services: ["Collision Repair", "Paint Jobs", "Maintenance"],
        rating: 4.9,
        hours: "Mon-Sat: 8AM-6PM",
        lat: 40.7589,
        lng: -73.9851
    }
];

function createMapInterface() {
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
                    ${renderBranchesList()}
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
            <div id="map" style="height: 400px; border-radius: var(--radius-xl); margin-top: var(--space-6);"></div>
        </div>
    `;
}

function renderBranchesList() {
    return branches.map(branch => `
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
                <div class="branch-distance" id="distance-${branch.id}" style="display: none;"></div>
            </div>
            <button class="btn btn-primary select-branch-btn" data-branch-id="${branch.id}">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                Select This Branch
            </button>
        </div>
    `).join('');
}

function initializeLeafletMap() {
    // Initialize map centered on NYC
    map = L.map('map').setView([40.7128, -74.0060], 12);

    // Add tile layer without attribution
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '' // Remove attribution
    }).addTo(map);

    // Add branch markers
    branches.forEach(branch => {
        const marker = L.marker([branch.lat, branch.lng])
            .addTo(map)
            .bindPopup(`
                <div style="text-align: center;">
                    <h4 style="margin: 0 0 8px 0;">${branch.name}</h4>
                    <p style="margin: 0 0 8px 0; font-size: 12px;">${branch.address}</p>
                    <button onclick="selectBranchFromMap(${branch.id})" style="background: #2563eb; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">Select Branch</button>
                </div>
            `);
        
        branchMarkers.push({ id: branch.id, marker });
    });
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

function detectUserLocation() {
    const detectBtn = document.getElementById('detect-location');
    
    if (!navigator.geolocation) {
        showNotification('Geolocation is not supported by this browser', 'error');
        return;
    }

    // Update button to loading state
    detectBtn.innerHTML = `
        <svg class="icon icon-sm animate-spin" viewBox="0 0 24 24">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Detecting...
    `;
    detectBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            // Update button to success state
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
            
            // Calculate distances and update UI
            updateBranchDistances();
            
            // Add user location marker to map
            if (map) {
                L.marker([userLocation.lat, userLocation.lng])
                    .addTo(map)
                    .bindPopup('Your Location')
                    .openPopup();
                
                // Fit map to show user location and all branches
                const allPoints = [
                    [userLocation.lat, userLocation.lng],
                    ...branches.map(b => [b.lat, b.lng])
                ];
                map.fitBounds(allPoints, { padding: [20, 20] });
            }
            
            showNotification('Location detected successfully! Branches sorted by distance.', 'success');
        },
        (error) => {
            // Update button to error state
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
            
            let errorMessage = 'Failed to detect location';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
            }
            
            showNotification(errorMessage, 'error');
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000 // 5 minutes
        }
    );
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
}

function updateBranchDistances() {
    if (!userLocation) return;
    
    // Calculate distances for all branches
    const branchesWithDistance = branches.map(branch => ({
        ...branch,
        distance: calculateDistance(userLocation.lat, userLocation.lng, branch.lat, branch.lng)
    }));
    
    // Sort by distance
    branchesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Update distance display
    branchesWithDistance.forEach(branch => {
        const distanceElement = document.getElementById(`distance-${branch.id}`);
        if (distanceElement) {
            distanceElement.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 11H1l6-6v4.5c11 0 20 7.5 20 15-.9-6.5-8-10.5-18-13.5z"/>
                </svg>
                ${branch.distance.toFixed(1)}km away
            `;
            distanceElement.style.display = 'block';
        }
    });
    
    // Re-render branches list in sorted order
    const branchesList = document.querySelector('.branches-list');
    if (branchesList) {
        branchesList.innerHTML = branchesWithDistance.map(branch => `
            <div class="branch-card ${branch.distance <= branchesWithDistance[0].distance + 0.1 ? 'nearest-branch' : ''}" data-branch-id="${branch.id}">
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
                    <div class="branch-distance" style="color: var(--success-600); font-weight: 600;">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M9 11H1l6-6v4.5c11 0 20 7.5 20 15-.9-6.5-8-10.5-18-13.5z"/>
                        </svg>
                        ${branch.distance.toFixed(1)}km away
                    </div>
                </div>
                <button class="btn btn-primary select-branch-btn" data-branch-id="${branch.id}">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4"/>
                        <circle cx="12" cy="12" r="9"/>
                    </svg>
                    Select This Branch
                </button>
                ${branch.distance <= branchesWithDistance[0].distance + 0.1 ? `
                    <button class="btn btn-success btn-sm quick-select-btn" data-branch-id="${branch.id}" style="margin-top: var(--space-2);">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                        </svg>
                        Quick Select Nearest
                    </button>
                ` : ''}
            </div>
        `).join('');
        
        // Re-attach event listeners
        attachMapEventListeners();
        
        // Add quick select functionality
        document.querySelectorAll('.quick-select-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const branchId = parseInt(e.target.getAttribute('data-branch-id'));
                selectBranch(branchId);
                showNotification('Nearest branch selected automatically!', 'success');
            });
        });
    }
    
    // Auto-select nearest branch
    if (branchesWithDistance.length > 0) {
        selectBranch(branchesWithDistance[0].id);
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
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            branchNameElement.textContent = branch.name;
            branchNameElement.style.color = 'var(--success-600)';
        }
    }
    
    // Center map on selected branch
    if (map) {
        const branch = branches.find(b => b.id === branchId);
        if (branch) {
            map.setView([branch.lat, branch.lng], 15);
        }
    }
}

function selectBranchFromMap(branchId) {
    selectBranch(branchId);
    showNotification('Branch selected from map!', 'success');
}

function updateSelectedBranchInfo(branchId) {
    const branch = branches.find(b => b.id === branchId);
    const infoContainer = document.getElementById('selected-branch-info');
    
    if (infoContainer && branch) {
        const distance = userLocation ? 
            calculateDistance(userLocation.lat, userLocation.lng, branch.lat, branch.lng) : null;
        
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
                        <strong>Hours:</strong>
                        <span>${branch.hours}</span>
                    </div>
                    <div class="info-item">
                        <strong>Rating:</strong>
                        <span>${branch.rating}/5.0 ⭐</span>
                    </div>
                    ${distance ? `
                        <div class="info-item">
                            <strong>Distance:</strong>
                            <span class="status-success">${distance.toFixed(1)}km away</span>
                        </div>
                    ` : ''}
                    <div class="info-item">
                        <strong>Status:</strong>
                        <span class="status-success">Selected ✓</span>
                    </div>
                </div>
                <div class="branch-actions">
                    <button class="btn btn-secondary btn-sm" onclick="getDirections(${branch.lat}, ${branch.lng})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M9 11H1l6-6v4.5c11 0 20 7.5 20 15-.9-6.5-8-10.5-18-13.5z"/>
                        </svg>
                        Get Directions
                    </button>
                </div>
            </div>
        `;
    }
}

function getDirections(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Booking Module
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
        serviceDetails.classList.add('animate-slide-up');
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

    try {
        const response = await fetch('http://localhost:8080/api/customer/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();
        
        if (response.ok) {
            showNotification('Appointment booked successfully!', 'success');
            
            // Notify chatbot about booking
            if (window.enhancedChatbot) {
                const serviceName = document.getElementById('booking-service').options[document.getElementById('booking-service').selectedIndex].textContent.split(' - $')[0];
                window.enhancedChatbot.notifyBooking(serviceName);
            }
            
            document.getElementById('booking-form').reset();
            document.getElementById('service-details').style.display = 'none';
            document.getElementById('selected-branch-name').textContent = 'Please select a branch above';
            
            // Clear branch selection
            document.querySelectorAll('.branch-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            loadCustomerData(); // Refresh stats
        } else {
            showNotification(result.error || 'Failed to book appointment', 'error');
        }
    } catch (error) {
        console.error('Error booking appointment:', error);
        showNotification('Failed to book appointment', 'error');
    }
}

// Vehicle Module
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
            loadCustomerData(); // Refresh overview stats
        } else {
            showNotification(result.error || 'Failed to add vehicle', 'error');
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification('Failed to add vehicle', 'error');
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
            </div>
        `;
        return;
    }

    vehiclesGrid.innerHTML = vehicles.map((vehicle, index) => `
        <div class="vehicle-card" style="animation-delay: ${index * 0.1}s;">
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
                <button class="btn btn-primary btn-sm" onclick="bookForVehicle(${vehicle.id})">
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
}

function bookForVehicle(vehicleId) {
    // Switch to booking tab and pre-select vehicle
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    switchToTab('book-appointment', navLinks, tabContents);
    
    setTimeout(() => {
        const vehicleSelect = document.getElementById('booking-vehicle');
        if (vehicleSelect) {
            vehicleSelect.value = vehicleId;
        }
    }, 100);
}

// Jobs Module
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
        <tr class="job-row" data-status="${job.status.toLowerCase().replace(' ', '-')}" style="animation-delay: ${index * 0.1}s;">
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
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
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
                <div class="payment-amount-display">
                    <span class="amount-label">Amount Due</span>
                    <span class="amount-value">$${job.totalCost}</span>
                </div>
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
            <div class="payment-status-paid">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                Payment Completed
            </div>
            <div class="payment-details">
                <div>Amount Paid: $${job.totalCost}</div>
                <div>Payment Date: ${job.completionDate ? new Date(job.completionDate).toLocaleDateString() : 'N/A'}</div>
            </div>
        `;
    } else {
        paymentSection.innerHTML = `
            <div class="payment-pending">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 6v6l4 2"/>
                </svg>
                Payment will be available once the job is completed and invoiced.
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
            
            // Notify chatbot about payment
            if (window.enhancedChatbot) {
                const amount = document.getElementById('payment-amount').textContent;
                window.enhancedChatbot.notifyPayment(amount);
            }
            
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
        <tr class="history-row status-${job.status.toLowerCase().replace(' ', '-')}" style="animation-delay: ${index * 0.1}s;">
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
        updateRecentJobsList(jobs);
        updateVehiclesSummary(vehicles);
    } catch (error) {
        console.error('Error loading customer data:', error);
    }
}

function updateCustomerStats(jobs, vehicles) {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
    const totalSpent = jobs
        .filter(job => job.totalCost && job.status === 'Paid')
        .reduce((sum, job) => sum + parseFloat(job.totalCost), 0);

    const metricsGrid = document.getElementById('customer-metrics-grid');
    if (metricsGrid) {
        metricsGrid.innerHTML = `
            <div class="metric-card jobs">
                <div class="metric-header">
                    <div class="metric-icon">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${totalJobs}</div>
                <div class="metric-label">Total Jobs</div>
            </div>
            <div class="metric-card active">
                <div class="metric-header">
                    <div class="metric-icon">
                        <svg class="icon" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <path d="M12 6v6l4 2"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${activeJobs}</div>
                <div class="metric-label">Active Jobs</div>
            </div>
            <div class="metric-card completed">
                <div class="metric-header">
                    <div class="metric-icon">
                        <svg class="icon" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="9"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">${completedJobs}</div>
                <div class="metric-label">Completed Jobs</div>
            </div>
            <div class="metric-card spent">
                <div class="metric-header">
                    <div class="metric-icon">
                        <svg class="icon" viewBox="0 0 24 24">
                            <line x1="12" y1="1" x2="12" y2="23"/>
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                    </div>
                </div>
                <div class="metric-value">$${totalSpent.toFixed(2)}</div>
                <div class="metric-label">Total Spent</div>
            </div>
        `;
    }
}

function updateRecentJobsList(jobs) {
    const recentJobsList = document.getElementById('recent-jobs-list');
    if (!recentJobsList) return;
    
    const recentJobs = jobs.slice(0, 3);
    
    if (recentJobs.length === 0) {
        recentJobsList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-description">No recent jobs found</div>
            </div>
        `;
        return;
    }
    
    recentJobsList.innerHTML = recentJobs.map((job, index) => `
        <div class="job-summary-item" style="animation-delay: ${index * 0.1}s;">
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
        <div class="vehicle-summary-item" style="animation-delay: ${index * 0.1}s;">
            <div class="vehicle-summary-icon">
                <svg class="icon" viewBox="0 0 24 24">
                    <path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>
                    <path d="M5 17h-2v-6l2-5h9l4 5h1a2 2 0 0 1 2 2v4h-2"/>
                    <path d="M9 17v-6h8"/>
                    <path d="M2 6h15"/>
                </svg>
            </div>
            <div class="vehicle-summary-details">
                <div class="vehicle-name">${vehicle.make} ${vehicle.model}</div>
                <div class="vehicle-year">${vehicle.year}</div>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function showModal(modal) {
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Add animation class to modal content
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.add('animate-slide-up');
        }
    }
}

function hideModal(modal) {
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Remove animation class
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.classList.remove('animate-slide-up');
        }
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
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            max-width: 300px;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
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

// Make functions globally available
window.selectBranchFromMap = selectBranchFromMap;
window.getDirections = getDirections;
window.bookForVehicle = bookForVehicle;
window.showJobDetails = showJobDetails;
window.showPaymentModal = showPaymentModal;