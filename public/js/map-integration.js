// Map Integration for Branch Selection
class BranchMapManager {
    constructor() {
        this.map = null;
        this.branches = [
            {
                id: 1,
                name: "AutoRepairPro Downtown",
                address: "123 Main Street, Downtown",
                lat: 40.7128,
                lng: -74.0060,
                phone: "(555) 123-4567",
                services: ["Paint Jobs", "Dent Repair", "Collision Repair"],
                rating: 4.8,
                workingHours: "Mon-Fri: 8AM-6PM, Sat: 9AM-4PM"
            },
            {
                id: 2,
                name: "AutoRepairPro Uptown",
                address: "456 Oak Avenue, Uptown",
                lat: 40.7589,
                lng: -73.9851,
                phone: "(555) 234-5678",
                services: ["Paint Jobs", "Dent Repair", "Oil Change"],
                rating: 4.6,
                workingHours: "Mon-Fri: 7AM-7PM, Sat: 8AM-5PM"
            },
            {
                id: 3,
                name: "AutoRepairPro Westside",
                address: "789 Pine Road, Westside",
                lat: 40.7282,
                lng: -74.0776,
                phone: "(555) 345-6789",
                services: ["Collision Repair", "Paint Jobs", "Maintenance"],
                rating: 4.9,
                workingHours: "Mon-Sat: 8AM-6PM"
            }
        ];
        this.selectedBranch = null;
        this.userLocation = null;
    }

    async initializeMap(containerId) {
        // Create a simple map using CSS and JavaScript (no external libraries)
        const mapContainer = document.getElementById(containerId);
        if (!mapContainer) return;

        mapContainer.innerHTML = `
            <div class="map-container">
                <div class="map-header">
                    <h3>Select a Branch Location</h3>
                    <button id="detect-location" class="btn btn-sm btn-primary">📍 Use My Location</button>
                </div>
                <div class="map-view">
                    <div class="branches-list">
                        ${this.renderBranchesList()}
                    </div>
                    <div class="selected-branch-info" id="selected-branch-info">
                        <p>Select a branch to see details</p>
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
        await this.getUserLocation();
    }

    renderBranchesList() {
        return this.branches.map(branch => `
            <div class="branch-card" data-branch-id="${branch.id}">
                <div class="branch-header">
                    <h4>${branch.name}</h4>
                    <div class="branch-rating">⭐ ${branch.rating}</div>
                </div>
                <div class="branch-details">
                    <p class="branch-address">📍 ${branch.address}</p>
                    <p class="branch-phone">📞 ${branch.phone}</p>
                    <p class="branch-hours">🕒 ${branch.workingHours}</p>
                    <div class="branch-services">
                        <strong>Services:</strong>
                        <div class="services-tags">
                            ${branch.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                        </div>
                    </div>
                    <div class="branch-distance" id="distance-${branch.id}"></div>
                </div>
                <button class="btn btn-primary select-branch-btn" data-branch-id="${branch.id}">
                    Select This Branch
                </button>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Branch selection
        document.querySelectorAll('.select-branch-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const branchId = parseInt(e.target.getAttribute('data-branch-id'));
                this.selectBranch(branchId);
            });
        });

        // Branch card hover effects
        document.querySelectorAll('.branch-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('select-branch-btn')) {
                    const branchId = parseInt(card.getAttribute('data-branch-id'));
                    this.showBranchDetails(branchId);
                }
            });
        });

        // Location detection
        const detectBtn = document.getElementById('detect-location');
        if (detectBtn) {
            detectBtn.addEventListener('click', () => this.getUserLocation());
        }
    }

    async getUserLocation() {
        if (!navigator.geolocation) {
            console.log('Geolocation not supported');
            return;
        }

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            this.userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };

            this.calculateDistances();
            this.showLocationSuccess();
        } catch (error) {
            console.log('Location access denied or failed');
            this.showLocationError();
        }
    }

    calculateDistances() {
        if (!this.userLocation) return;

        this.branches.forEach(branch => {
            const distance = this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                branch.lat, branch.lng
            );

            const distanceElement = document.getElementById(`distance-${branch.id}`);
            if (distanceElement) {
                distanceElement.innerHTML = `<strong>📏 ${distance.toFixed(1)} miles away</strong>`;
                distanceElement.style.color = '#27ae60';
            }
        });

        // Sort branches by distance
        this.sortBranchesByDistance();
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 3959; // Earth's radius in miles
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    sortBranchesByDistance() {
        if (!this.userLocation) return;

        const branchesWithDistance = this.branches.map(branch => ({
            ...branch,
            distance: this.calculateDistance(
                this.userLocation.lat, this.userLocation.lng,
                branch.lat, branch.lng
            )
        })).sort((a, b) => a.distance - b.distance);

        // Re-render the sorted list
        const branchesContainer = document.querySelector('.branches-list');
        if (branchesContainer) {
            branchesContainer.innerHTML = branchesWithDistance.map(branch => `
                <div class="branch-card" data-branch-id="${branch.id}">
                    <div class="branch-header">
                        <h4>${branch.name}</h4>
                        <div class="branch-rating">⭐ ${branch.rating}</div>
                    </div>
                    <div class="branch-details">
                        <p class="branch-address">📍 ${branch.address}</p>
                        <p class="branch-phone">📞 ${branch.phone}</p>
                        <p class="branch-hours">🕒 ${branch.workingHours}</p>
                        <div class="branch-services">
                            <strong>Services:</strong>
                            <div class="services-tags">
                                ${branch.services.map(service => `<span class="service-tag">${service}</span>`).join('')}
                            </div>
                        </div>
                        <div class="branch-distance">
                            <strong>📏 ${branch.distance.toFixed(1)} miles away</strong>
                        </div>
                    </div>
                    <button class="btn btn-primary select-branch-btn" data-branch-id="${branch.id}">
                        Select This Branch
                    </button>
                </div>
            `).join('');

            this.attachEventListeners();
        }
    }

    selectBranch(branchId) {
        this.selectedBranch = this.branches.find(b => b.id === branchId);
        
        // Update UI to show selection
        document.querySelectorAll('.branch-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-branch-id="${branchId}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }

        this.showBranchDetails(branchId);
        
        // Trigger custom event for other components
        window.dispatchEvent(new CustomEvent('branchSelected', {
            detail: { branch: this.selectedBranch }
        }));
    }

    showBranchDetails(branchId) {
        const branch = this.branches.find(b => b.id === branchId);
        const infoContainer = document.getElementById('selected-branch-info');
        
        if (infoContainer && branch) {
            infoContainer.innerHTML = `
                <div class="selected-branch-details">
                    <h4>📍 ${branch.name}</h4>
                    <p><strong>Address:</strong> ${branch.address}</p>
                    <p><strong>Phone:</strong> ${branch.phone}</p>
                    <p><strong>Hours:</strong> ${branch.workingHours}</p>
                    <p><strong>Rating:</strong> ⭐ ${branch.rating}/5</p>
                    <div class="available-services">
                        <strong>Available Services:</strong>
                        <div class="services-list">
                            ${branch.services.map(service => `<span class="service-badge">${service}</span>`).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    showLocationSuccess() {
        const detectBtn = document.getElementById('detect-location');
        if (detectBtn) {
            detectBtn.innerHTML = '✅ Location Detected';
            detectBtn.classList.add('btn-success');
            detectBtn.classList.remove('btn-primary');
        }
    }

    showLocationError() {
        const detectBtn = document.getElementById('detect-location');
        if (detectBtn) {
            detectBtn.innerHTML = '❌ Location Failed';
            detectBtn.classList.add('btn-danger');
            detectBtn.classList.remove('btn-primary');
        }
    }

    getSelectedBranch() {
        return this.selectedBranch;
    }
}

// Initialize map when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.branchMapManager = new BranchMapManager();
});