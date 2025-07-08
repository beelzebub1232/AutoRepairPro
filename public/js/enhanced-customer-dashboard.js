// Enhanced Customer Dashboard - Database-Driven Implementation
document.addEventListener('DOMContentLoaded', () => {
    // Get user info from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const userRole = urlParams.get('role');
    const userName = urlParams.get('name');
    const userId = urlParams.get('id');
    
    // Auth check
    if (!userRole || userRole !== 'customer' || !userName || !userId) {
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
    
    // Load initial data
    loadCustomerData();
    loadOverviewData();
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
        case 'overview':
            loadOverviewData();
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
            window.location.href = '/index.html';
        });
    }
}

// Overview Data Loading
async function loadOverviewData() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch customer data');
        
        const jobs = await response.json();
        updateCustomerMetrics(jobs);
        updateRecentJobs(jobs);
        
        // Load vehicles for summary
        const vehiclesResponse = await fetch(`http://localhost:8080/api/customer/vehicles/${userId}`);
        if (vehiclesResponse.ok) {
            const vehicles = await vehiclesResponse.json();
            updateVehiclesSummary(vehicles);
        }
    } catch (error) {
        console.error('Error loading overview data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateCustomerMetrics(jobs) {
    const metricsGrid = document.getElementById('customer-metrics-grid');
    if (!metricsGrid) return;
    
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => ['Booked', 'In Progress'].includes(job.status)).length;
    const completedJobs = jobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length;
    const totalSpent = jobs
        .filter(job => job.totalCost && job.status === 'Paid')
        .reduce((sum, job) => sum + parseFloat(job.totalCost), 0);

    const metrics = [
        {
            title: 'Total Jobs',
            value: totalJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
            class: 'jobs'
        },
        {
            title: 'Active Jobs',
            value: activeJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>`,
            class: 'active'
        },
        {
            title: 'Completed Jobs',
            value: completedJobs,
            icon: `<svg class="icon" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>`,
            class: 'completed'
        },
        {
            title: 'Total Spent',
            value: `₹${totalSpent.toFixed(2)}`,
            icon: `<svg class="icon" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
            class: 'spent'
        }
    ];

    metricsGrid.innerHTML = metrics.map((metric, index) => `
        <div class="metric-card ${metric.class}" style="animation-delay: ${index * 0.1}s;">
            <div class="metric-header">
                <div class="metric-icon">${metric.icon}</div>
            </div>
            <div class="metric-value">${metric.value}</div>
            <div class="metric-label">${metric.title}</div>
        </div>
    `).join('');
}

function updateRecentJobs(jobs) {
    const recentJobsList = document.getElementById('recent-jobs-list');
    if (!recentJobsList) return;
    const recentJobs = jobs.slice(0, 3);
    if (recentJobs.length === 0) {
        recentJobsList.innerHTML = `
            <div class="no-data">
                <p>No recent jobs found</p>
            </div>
        `;
        return;
    }
    recentJobsList.innerHTML = recentJobs.map(job => `
        <div class="card recent-job-card animate-fade-in" style="margin-bottom: var(--space-4);">
            <div class="flex justify-between items-center" style="margin-bottom: var(--space-2);">
                <div class="flex items-center gap-2">
                    <span class="job-id font-semibold text-primary" style="font-size: var(--text-lg);">#${job.jobId}</span>
                    <span class="status-badge status-${job.status.toLowerCase().replace(/ /g, '-')}">${job.status}</span>
                </div>
                <button class="btn btn-sm btn-ghost" onclick="showJobDetails(${job.jobId})" title="View Details">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
                </button>
            </div>
            <div class="flex flex-wrap gap-4 job-details" style="margin-bottom: var(--space-2);">
                <div class="flex items-center gap-2">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="6" rx="3"/><circle cx="7.5" cy="14" r="2.5"/><circle cx="16.5" cy="14" r="2.5"/></svg>
                    <span class="job-vehicle text-secondary">${job.vehicle}</span>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M4 7V4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3"/><path d="M4 7v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7"/><path d="M9 10h6"/></svg>
                    <span class="job-service text-secondary">${job.service}</span>
                </div>
                <div class="flex items-center gap-2">
                    <svg class="icon icon-sm" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
                    <span class="job-date text-secondary">${new Date(job.bookingDate).toLocaleDateString()}</span>
                </div>
            </div>
            <div class="flex justify-end">
                <span class="font-medium text-success" style="font-size: var(--text-base);">₹${job.totalCost || '--'}</span>
            </div>
        </div>
    `).join('');
}

function updateVehiclesSummary(vehicles) {
    const vehiclesSummary = document.getElementById('vehicles-summary');
    if (!vehiclesSummary) return;
    
    if (vehicles.length === 0) {
        vehiclesSummary.innerHTML = `
            <div class="no-data">
                <p>No vehicles registered</p>
                <button class="btn btn-sm btn-primary" onclick="showVehicleModal()">Add Vehicle</button>
            </div>
        `;
        return;
    }

    vehiclesSummary.innerHTML = `
        <div class="vehicles-summary-premium-grid${vehicles.length > 3 ? ' scrollable' : ''}">
            ${vehicles.slice(0, 5).map(vehicle => `
                <div class="vehicle-summary-premium-card">
                    <div class="vehicle-icon-wrap">
                        <svg class="icon icon-xl vehicle-icon-premium" viewBox="0 0 24 24">
                            <rect x="3" y="11" width="18" height="6" rx="2"/>
                            <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"/>
                            <circle cx="7.5" cy="17.5" r="1.5"/>
                            <circle cx="16.5" cy="17.5" r="1.5"/>
                        </svg>
                    </div>
                    <div class="vehicle-main-info">
                        <div class="vehicle-make-model-premium">${vehicle.make} ${vehicle.model}</div>
                        <div class="vehicle-meta-premium">${vehicle.year}${vehicle.vin ? ` &bull; <span class='vehicle-vin-premium'>VIN: ${vehicle.vin}</span>` : ''}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        ${vehicles.length > 5 ? `
            <div class="vehicles-summary-footer">
                <button class="btn btn-sm btn-primary" onclick="switchToTab('my-vehicles')">
                    View All Vehicles (${vehicles.length})
                </button>
            </div>
        ` : ''}
    `;
}

// Map Integration with Dynamic Branch Data
async function initializeMapIntegration() {
    const mapContainer = document.getElementById('branch-map-container');
    if (mapContainer) {
        try {
            // Fetch branch data from database
            const response = await fetch('http://localhost:8080/api/customer/branches');
            if (!response.ok) throw new Error('Failed to fetch branch data');
            
            const branches = await response.json();
            mapContainer.innerHTML = createMapInterface(branches);
            attachMapEventListeners();
            
        // Initialize map after DOM is ready
        setTimeout(() => {
            initializeLeafletMap();
                addBranchMarkers(branches);
        }, 100);
        } catch (error) {
            console.error('Error loading branch data:', error);
            mapContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div class="error-message">Failed to load branch locations</div>
                    <button class="btn btn-primary" onclick="initializeMapIntegration()">Retry</button>
                </div>
            `;
        }
    }
}

function createMapInterface(branches) {
    if (!branches || branches.length === 0) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <svg class="icon icon-xl" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                </div>
                <div class="empty-state-title">No branches available</div>
                <div class="empty-state-description">Please contact support for assistance</div>
            </div>
        `;
    }

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
                <div class="map-header-actions">
                    <button id="detect-location" class="btn btn-sm btn-primary">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <polygon points="3,11 22,2 13,21 11,13 3,11"/>
                        </svg>
                        Use My Location
                    </button>
                </div>
            </div>
            <div id="leaflet-map" style="height: 400px; width: 100%; margin-top: 20px; border-radius: 12px; overflow: hidden;"></div>
            <div class="section-divider"></div>
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
                                    ${branch.rating || 'N/A'}
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
                                ${branch.contact && branch.contact.phone ? `
                                <p class="branch-phone">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                                    </svg>
                                        ${branch.contact.phone}
                                </p>
                                ` : ''}
                                ${branch.hours ? `
                                <p class="branch-hours">
                                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12,6 12,12 16,14"/>
                                    </svg>
                                    ${branch.hours}
                                </p>
                                ` : ''}
                                ${branch.services && branch.services.length > 0 ? `
                                <div class="branch-services">
                                    <strong>Services:</strong>
                                    <div class="services-tags">
                                            ${branch.services.slice(0, 3).map(service => `<span class="service-tag">${service}</span>`).join('')}
                                            ${branch.services.length > 3 ? `<span class="service-tag">+${branch.services.length - 3} more</span>` : ''}
                                    </div>
                                </div>
                                ` : ''}
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
                        <div class="empty-state-description">Choose a branch to view details and book services</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Map Integration with Proper Leaflet Implementation
let map = null;
let userLocation = null;
let branchMarkers = [];

function initializeLeafletMap() {
    const mapElement = document.getElementById('leaflet-map');
    if (!mapElement) return;

    try {
        // Initialize map with proper options
        map = L.map('leaflet-map', {
            center: [10.0168, 76.3118], // Center on Edappally, Kochi, India
            zoom: 13,
            zoomControl: true,
            attributionControl: false, // Remove attribution
            scrollWheelZoom: true,
            doubleClickZoom: true,
            boxZoom: true,
            keyboard: true,
            dragging: true,
            touchZoom: true
        });

        // Add tile layer with proper error handling
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            minZoom: 3,
            attribution: '', // Remove attribution
            errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            detectRetina: true,
            updateWhenIdle: false,
            keepBuffer: 2,
            updateWhenZooming: false
        });

        tileLayer.addTo(map);

        // Force map to resize properly
        setTimeout(() => {
            map.invalidateSize();
        }, 100);

        // Handle map events
        map.on('load', () => {
            console.log('Map loaded successfully');
        });

        map.on('error', (e) => {
            console.error('Map error:', e);
        });

    } catch (error) {
        console.error('Error initializing map:', error);
        showNotification('Failed to load map', 'error');
    }
}

function addBranchMarkers(branches) {
    if (!map) return;

    // Clear existing markers
    branchMarkers.forEach(marker => map.removeLayer(marker));
    branchMarkers = [];

    branches.forEach(branch => {
        if (branch.latitude && branch.longitude) {
            const marker = L.marker([branch.latitude, branch.longitude])
            .bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="margin: 0 0 8px 0; color: #1f2937;">${branch.name}</h4>
                    <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">${branch.address}</p>
                        ${branch.contact && branch.contact.phone ? 
                            `<p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${branch.contact.phone}</p>` : ''}
                    <button onclick="selectBranchFromMap(${branch.id})" 
                            style="background: #2563eb; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                        Select This Branch
                    </button>
                </div>
            `)
            .addTo(map);

        branchMarkers.push(marker);

        // Add click event to marker
        marker.on('click', () => {
            highlightBranchCard(branch.id);
        });
        }
    });
}

function selectBranchFromMap(branchId) {
    selectBranch(branchId);
    map.closePopup();
}

function highlightBranchCard(branchId) {
    // Remove highlight from all cards
    document.querySelectorAll('.branch-card').forEach(card => {
        card.classList.remove('highlighted');
    });

    // Highlight the selected card
    const card = document.querySelector(`[data-branch-id="${branchId}"]`);
    if (card) {
        card.classList.add('highlighted');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
        const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
        if (selectedCard) {
            const branchName = selectedCard.querySelector('h4').textContent;
            branchNameElement.textContent = branchName;
            branchNameElement.style.color = 'var(--success-600)';
        }
    }

    // Center map on selected branch
    if (map) {
        const branchMarker = branchMarkers.find(marker => {
            const popupContent = marker.getPopup().getContent();
            return popupContent.includes(`selectBranchFromMap(${branchId})`);
        });
        
        if (branchMarker) {
            const latLng = branchMarker.getLatLng();
            map.setView([latLng.lat, latLng.lng], 15);
            branchMarker.openPopup();
        }
    }

    // Show success notification only if branch was found
    if (selectedCard) {
        const branchName = selectedCard.querySelector('h4').textContent;
        showNotification(`Selected ${branchName}`, 'success');
    } else {
        showNotification('Branch selection failed', 'error');
    }
}

function updateSelectedBranchInfo(branchId) {
    const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
    const infoContainer = document.getElementById('selected-branch-info');
    
    if (infoContainer && selectedCard) {
        const branchName = selectedCard.querySelector('h4').textContent;
        const branchAddress = selectedCard.querySelector('.branch-address').textContent;
        const branchPhone = selectedCard.querySelector('.branch-phone')?.textContent || '';
        const branchHours = selectedCard.querySelector('.branch-hours')?.textContent || '';
        const branchRating = selectedCard.querySelector('.branch-rating')?.textContent || '4.5/5';
        const branchServices = selectedCard.querySelector('.branch-services')?.textContent || 'General Repairs';
        
        infoContainer.innerHTML = `
            <div class="selected-branch-details">
                <h4>
                    <svg class="icon" viewBox="0 0 24 24">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                    </svg>
                    ${branchName}
                </h4>
                <div class="branch-info-grid">
                    <div class="info-item">
                        <strong>Address:</strong>
                        <span>${branchAddress}</span>
                    </div>
                    ${branchPhone ? `
                    <div class="info-item">
                        <strong>Phone:</strong>
                            <span>${branchPhone}</span>
                    </div>
                    ` : ''}
                    ${branchHours ? `
                    <div class="info-item">
                        <strong>Hours:</strong>
                            <span>${branchHours}</span>
                    </div>
                    ` : ''}
                    <div class="info-item">
                        <strong>Rating:</strong>
                        <span class="status-success">${branchRating}</span>
                    </div>
                </div>
                <div class="available-services">
                    <strong>Available Services:</strong>
                    <div class="services-list">
                        ${branchServices}
                    </div>
                </div>
                <div class="branch-actions">
                    <button class="btn btn-primary" onclick="selectBranch(${branchId})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="9"/>
                        </svg>
                        Confirm Selection
                    </button>
                    <button class="btn btn-secondary" onclick="getDirections(${branchId})">
                        <svg class="icon icon-sm" viewBox="0 0 24 24">
                            <polygon points="3,11 22,2 13,21 11,13 3,11"/>
                        </svg>
                        Get Directions
                    </button>
                </div>
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
    detectBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            detectBtn.innerHTML = `
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <path d="M9 12l2 2 4-4"/>
                    <circle cx="12" cy="12" r="9"/>
                </svg>
                Location Detected
            `;
            detectBtn.classList.remove('btn-primary');
            detectBtn.classList.add('btn-success');

            // Calculate distances and sort branches
            const branchesWithDistance = branchMarkers.map((marker, index) => {
                const latLng = marker.getLatLng();
                const distance = calculateDistance(userLocation.lat, userLocation.lng, latLng.lat, latLng.lng);
                // Extract branch ID from marker popup content
                const popupContent = marker.getPopup().getContent();
                const branchIdMatch = popupContent.match(/selectBranchFromMap\((\d+)\)/);
                const branchId = branchIdMatch ? parseInt(branchIdMatch[1]) : null;
                
                return {
                    marker,
                    branchId,
                    distance,
                    latLng
                };
            }).sort((a, b) => a.distance - b.distance);

            // Update distance displays
            branchesWithDistance.forEach(branch => {
                if (branch.branchId) {
                    const distanceElement = document.getElementById(`distance-${branch.branchId}`);
                    if (distanceElement) {
                        distanceElement.innerHTML = `
                            <svg class="icon icon-sm" viewBox="0 0 24 24">
                                <polygon points="3,11 22,2 13,21 11,13 3,11"/>
                            </svg>
                            ${branch.distance.toFixed(1)} km away
                        `;
                        distanceElement.style.display = 'flex';
                    }
                }
            });

            // Add user location marker to map
            if (map) {
                const userMarker = L.marker([userLocation.lat, userLocation.lng], {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '<div style="background: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                    })
                }).addTo(map);

                userMarker.bindPopup('Your Location').openPopup();
                map.setView([userLocation.lat, userLocation.lng], 13);
            }

            // Show quick select for nearest branch
            const nearestBranch = branchesWithDistance[0];
            if (nearestBranch && nearestBranch.branchId) {
                showQuickSelectNearest(nearestBranch);
            }

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
            maximumAge: 300000
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
    return R * c;
}

function showQuickSelectNearest(nearestBranch) {
    const mapHeaderActions = document.querySelector('.map-header-actions');
    if (mapHeaderActions && !document.getElementById('quick-select-nearest')) {
        const quickSelectBtn = document.createElement('button');
        quickSelectBtn.id = 'quick-select-nearest';
        quickSelectBtn.className = 'btn btn-sm btn-success quick-select-btn';
        quickSelectBtn.innerHTML = `
            <svg class="icon icon-sm" viewBox="0 0 24 24">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            Select Nearest (${nearestBranch.distance.toFixed(1)}km)
        `;
        quickSelectBtn.addEventListener('click', () => {
            selectBranch(nearestBranch.branchId);
            quickSelectBtn.remove();
        });
        mapHeaderActions.appendChild(quickSelectBtn);
    }
}

function getDirections(branchId) {
    const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
    if (selectedCard) {
        const branchAddress = selectedCard.querySelector('.branch-address').textContent;
        const encodedAddress = encodeURIComponent(branchAddress);
        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
    window.open(url, '_blank');
    }
}

// Booking Module
function initializeBookingModule() {
    const bookingForm = document.getElementById('booking-form');
    const serviceSelect = document.getElementById('booking-service');
    const addVehicleBtn = document.getElementById('add-vehicle-btn');
    const quickBookBtn = document.getElementById('quick-book-btn');

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

    if (quickBookBtn) {
        quickBookBtn.addEventListener('click', () => switchToTab('book-appointment'));
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
    
    // Initialize map when booking tab is loaded
    if (!map) {
        initializeMapIntegration();
    }
}

async function loadCustomerVehicles() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
        option.textContent = `${service.serviceName} - ₹${service.price}`;
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
        document.getElementById('selected-service-name').textContent = selectedOption.textContent.split(' - ₹')[0];
        document.getElementById('selected-service-price').textContent = '₹' + selectedOption.getAttribute('data-price');
        document.getElementById('selected-service-description').textContent = selectedOption.getAttribute('data-description') || 'No description available';
        serviceDetails.style.display = 'block';
        serviceDetails.classList.add('animate-slide-up');
    } else {
        serviceDetails.style.display = 'none';
    }
}

async function bookAppointment() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
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
            document.getElementById('booking-form').reset();
            document.getElementById('service-details').style.display = 'none';
            document.getElementById('selected-branch-name').textContent = 'Please select a branch above';
            
            // Clear branch selection
            document.querySelectorAll('.branch-card').forEach(card => {
                card.classList.remove('selected');
            });
            
            // Refresh overview data
            loadOverviewData();
            
            // Notify chatbot
            if (window.enhancedChatbot) {
                window.enhancedChatbot.notifyBooking(document.getElementById('booking-service').options[document.getElementById('booking-service').selectedIndex].text);
            }
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    const formData = {
        make: document.getElementById('vehicle-make').value,
        model: document.getElementById('vehicle-model').value,
        year: parseInt(document.getElementById('vehicle-year').value),
        vin: document.getElementById('vehicle-vin').value
    };
    try {
        const response = await fetch(`http://localhost:8080/api/customer/vehicles/${userId}`, {
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
            loadOverviewData(); // Refresh overview
        } else {
            showNotification(result.error || 'Failed to add vehicle', 'error');
        }
    } catch (error) {
        console.error('Error adding vehicle:', error);
        showNotification('Failed to add vehicle', 'error');
    }
}

async function loadMyVehicles() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
                <button class="btn btn-sm btn-primary" onclick="bookForVehicle(${vehicle.id})">
                    <svg class="icon icon-sm" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    Book
                </button>
            </div>
        </div>
    `).join('');
}

function bookForVehicle(vehicleId) {
    // Switch to booking tab and pre-select vehicle
    switchToTab('book-appointment');
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
        <tr class="job-row" data-status="${job.status.toLowerCase().replace(' ', '-')}" style="animation-delay: ${index * 0.05}s;">
            <td><strong>#${job.jobId}</strong></td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.totalCost ? '₹' + job.totalCost : '<span class="text-secondary">Pending</span>'}</td>
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
    document.getElementById('detail-total-cost').textContent = job.totalCost ? '₹' + job.totalCost : 'Not calculated';
    document.getElementById('detail-notes').textContent = job.notes || 'No notes';

    // Payment section
    const paymentSection = document.getElementById('payment-section');
    if (job.status === 'Invoiced') {
        paymentSection.innerHTML = `
            <div class="payment-amount-display">
                <span class="amount-label">Amount Due</span>
                <span class="amount-value">₹${job.totalCost}</span>
            </div>
            <button class="btn btn-success btn-full" onclick="showPaymentModal(${job.jobId})">
                <svg class="icon icon-sm" viewBox="0 0 24 24">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Pay Now
            </button>
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
                <p>Amount Paid: <strong>₹${job.totalCost}</strong></p>
                <p>Payment Date: ${job.completionDate ? new Date(job.completionDate).toLocaleDateString() : 'N/A'}</p>
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
    try {
        const response = await fetch(`http://localhost:8080/api/customer/jobs/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch job details');
        
        const jobs = await response.json();
        const job = jobs.find(j => j.jobId === jobId);
        
        if (job && job.status === 'Invoiced') {
            document.getElementById('payment-job-id').textContent = job.jobId;
            document.getElementById('payment-service').textContent = job.service;
            document.getElementById('payment-amount').textContent = '₹' + job.totalCost;
            
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
        
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('id');
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
            loadOverviewData(); // Refresh overview
            
            // Notify chatbot
            if (window.enhancedChatbot) {
                const amount = document.getElementById('payment-amount').textContent;
                window.enhancedChatbot.notifyPayment(amount);
            }
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
        <tr class="history-row status-${job.status.toLowerCase().replace(' ', '-')}" style="animation-delay: ${index * 0.05}s;">
            <td>${new Date(job.bookingDate).toLocaleDateString()}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td><span class="status-badge status-${job.status.toLowerCase().replace(' ', '-')}">${job.status}</span></td>
            <td>${job.totalCost ? '₹' + job.totalCost : '<span class="text-secondary">Pending</span>'}</td>
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
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('id');
    
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
        
        // Add animation
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
        // Fallback for when notification manager isn't available
        console.log(`${type.toUpperCase()}: ${message}`);
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