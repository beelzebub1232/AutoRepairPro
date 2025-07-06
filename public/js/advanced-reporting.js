// Advanced Reporting System - Database-Driven Implementation
class AdvancedReporting {
    constructor() {
        this.currentPeriod = '6months';
        this.charts = {};
        this.init();
    }

    init() {
        this.initializePeriodSelector();
        this.initializeCharts();
        this.attachEventListeners();
    }

    initializePeriodSelector() {
        const periodSelector = document.getElementById('period-selector');
        if (periodSelector) {
            periodSelector.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.refreshAllCharts();
            });
        }
    }

    async initializeCharts() {
        try {
            await this.loadAllChartData();
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.showErrorState('Failed to load chart data');
        }
    }

    async loadAllChartData() {
        const chartContainers = {
            'revenue-chart': this.fetchRevenueData.bind(this),
            'service-distribution-chart': this.fetchServiceDistributionData.bind(this),
            'employee-performance-chart': this.fetchEmployeePerformanceData.bind(this),
            'inventory-chart': this.fetchInventoryData.bind(this),
            'customer-activity-chart': this.fetchCustomerActivityData.bind(this)
        };

        for (const [containerId, fetchFunction] of Object.entries(chartContainers)) {
            try {
                const data = await fetchFunction();
                this.renderChart(containerId, data);
            } catch (error) {
                console.error(`Error loading ${containerId}:`, error);
                this.showChartError(containerId, 'Failed to load data');
            }
        }
    }

    async fetchRevenueData() {
        const response = await fetch(`http://localhost:8080/api/admin/reports/revenue?period=${this.currentPeriod}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch revenue data: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform data for chart
        return {
            labels: data.map(item => item.month),
            values: data.map(item => parseFloat(item.totalRevenue || 0))
        };
    }

    async fetchServiceDistributionData() {
        const response = await fetch(`http://localhost:8080/api/admin/reports/part-usage?period=${this.currentPeriod}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch service data: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform data for chart
        return {
            labels: data.map(item => item.partName),
            values: data.map(item => item.totalUsed)
        };
    }

    async fetchEmployeePerformanceData() {
        const response = await fetch(`http://localhost:8080/api/admin/reports/employee-performance?period=${this.currentPeriod}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch employee data: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform data for chart
        return {
            labels: data.map(item => item.employeeName),
            jobsCompleted: data.map(item => item.jobsCompleted),
            ratings: data.map(item => parseFloat(item.avgRating || 0))
        };
    }

    async fetchInventoryData() {
        const response = await fetch('http://localhost:8080/api/admin/inventory');
        if (!response.ok) {
            throw new Error(`Failed to fetch inventory data: ${response.status}`);
        }
        const inventory = await response.json();
        
        // Process inventory data for chart
        const labels = inventory.slice(0, 10).map(item => item.partName);
        const currentStock = inventory.slice(0, 10).map(item => item.quantity);
        const minRequired = inventory.slice(0, 10).map(item => item.minQuantity || 5);
        
        return { labels, currentStock, minRequired };
    }

    async fetchCustomerActivityData() {
        const response = await fetch(`http://localhost:8080/api/admin/reports/customer-activity?period=${this.currentPeriod}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch customer data: ${response.status}`);
        }
        const data = await response.json();
        
        // Transform data for chart
        return {
            labels: data.map(item => item.month),
            newCustomers: data.map(item => item.newCustomers),
            returningCustomers: data.map(item => item.returningCustomers || 0)
        };
    }

    renderChart(containerId, data) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || (Array.isArray(data.labels) && data.labels.length === 0)) {
            container.innerHTML = this.createEmptyState('No data available');
            return;
        }

        switch (containerId) {
            case 'revenue-chart':
                this.renderRevenueChart(container, data);
                break;
            case 'service-distribution-chart':
                this.renderServiceDistributionChart(container, data);
                break;
            case 'employee-performance-chart':
                this.renderEmployeePerformanceChart(container, data);
                break;
            case 'inventory-chart':
                this.renderInventoryChart(container, data);
                break;
            case 'customer-activity-chart':
                this.renderCustomerActivityChart(container, data);
                break;
        }
    }

    renderRevenueChart(container, data) {
        const ctx = this.createCanvas(container, 'revenue-chart-canvas');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Revenue',
                    data: data.values,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Revenue Trend'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderServiceDistributionChart(container, data) {
        const ctx = this.createCanvas(container, 'service-distribution-chart-canvas');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6',
                        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Service Distribution'
                    },
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderEmployeePerformanceChart(container, data) {
        const ctx = this.createCanvas(container, 'employee-performance-chart-canvas');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Jobs Completed',
                    data: data.jobsCompleted,
                    backgroundColor: '#3b82f6',
                    yAxisID: 'y'
                }, {
                    label: 'Average Rating',
                    data: data.ratings,
                    backgroundColor: '#f59e0b',
                    yAxisID: 'y1',
                    type: 'line'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Employee Performance'
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        max: 5,
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                }
            }
        });
    }

    renderInventoryChart(container, data) {
        const ctx = this.createCanvas(container, 'inventory-chart-canvas');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Current Stock',
                    data: data.currentStock,
                    backgroundColor: '#22c55e'
                }, {
                    label: 'Minimum Required',
                    data: data.minRequired,
                    backgroundColor: '#ef4444'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Inventory Levels'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    renderCustomerActivityChart(container, data) {
        const ctx = this.createCanvas(container, 'customer-activity-chart-canvas');
        if (!ctx) return;

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'New Customers',
                    data: data.newCustomers,
                    backgroundColor: '#3b82f6'
                }, {
                    label: 'Returning Customers',
                    data: data.returningCustomers,
                    backgroundColor: '#22c55e'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Customer Activity'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createCanvas(container, canvasId) {
        // Clear container
        container.innerHTML = '';
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.id = canvasId;
        canvas.style.width = '100%';
        canvas.style.height = '300px';
        container.appendChild(canvas);
        
        return canvas.getContext('2d');
    }

    createEmptyState(message) {
        return `
            <div class="chart-empty-state">
                <div class="empty-state-icon">
                    <svg class="icon icon-xl" viewBox="0 0 24 24">
                        <path d="M3 3v18h18"/>
                        <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
                    </svg>
                </div>
                <div class="empty-state-message">${message}</div>
            </div>
        `;
    }

    showChartError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error-state">
                    <div class="error-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div class="error-message">${message}</div>
                    <button class="btn btn-sm btn-primary" onclick="window.advancedReporting.refreshChart('${containerId}')">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    showErrorState(message) {
        const errorContainer = document.getElementById('reports-error-container');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <svg class="icon icon-xl" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="15" y1="9" x2="9" y2="15"/>
                            <line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                    </div>
                    <div class="error-message">${message}</div>
                    <button class="btn btn-primary" onclick="window.advancedReporting.initializeCharts()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    async refreshChart(containerId) {
        const fetchFunctions = {
            'revenue-chart': this.fetchRevenueData.bind(this),
            'service-distribution-chart': this.fetchServiceDistributionData.bind(this),
            'employee-performance-chart': this.fetchEmployeePerformanceData.bind(this),
            'inventory-chart': this.fetchInventoryData.bind(this),
            'customer-activity-chart': this.fetchCustomerActivityData.bind(this)
        };

        const fetchFunction = fetchFunctions[containerId];
        if (fetchFunction) {
            try {
                const data = await fetchFunction();
                this.renderChart(containerId, data);
            } catch (error) {
                console.error(`Error refreshing ${containerId}:`, error);
                this.showChartError(containerId, 'Failed to refresh data');
            }
        }
    }

    async refreshAllCharts() {
        await this.loadAllChartData();
    }

    attachEventListeners() {
        // Export button
        const exportBtn = document.getElementById('export-reports-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }

        // Refresh button
        const refreshBtn = document.getElementById('refresh-reports-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllCharts());
        }
    }

    async exportData() {
        try {
            const [revenueData, serviceData, employeeData, inventoryData, customerData] = await Promise.all([
                this.fetchRevenueData(),
                this.fetchServiceDistributionData(),
                this.fetchEmployeePerformanceData(),
                this.fetchInventoryData(),
                this.fetchCustomerActivityData()
            ]);

            const csvData = this.convertToCSV({
                revenue: revenueData,
                services: serviceData,
                employees: employeeData,
                inventory: inventoryData,
                customers: customerData
            });

            this.downloadCSV(csvData, `autorepairpro-reports-${this.currentPeriod}-${new Date().toISOString().split('T')[0]}.csv`);
            
            if (window.showNotification) {
                window.showNotification('Reports exported successfully!', 'success');
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            if (window.showNotification) {
                window.showNotification('Failed to export reports', 'error');
            }
        }
    }

    convertToCSV(data) {
        let csv = '';
        
        // Revenue data
        csv += 'Revenue Report\n';
        csv += 'Period,Revenue\n';
        data.revenue.labels.forEach((label, index) => {
            csv += `${label},${data.revenue.values[index]}\n`;
        });
        csv += '\n';
        
        // Service distribution
        csv += 'Service Distribution\n';
        csv += 'Service,Count\n';
        data.services.labels.forEach((label, index) => {
            csv += `${label},${data.services.values[index]}\n`;
        });
        csv += '\n';
        
        // Employee performance
        csv += 'Employee Performance\n';
        csv += 'Employee,Jobs Completed,Rating\n';
        data.employees.labels.forEach((label, index) => {
            csv += `${label},${data.employees.jobsCompleted[index]},${data.employees.ratings[index]}\n`;
        });
        
        return csv;
    }

    downloadCSV(csvData, filename) {
        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Generate summary report
    async generateSummaryReport() {
        try {
            const [revenueData, serviceData, employeeData] = await Promise.all([
                this.fetchRevenueData(),
                this.fetchServiceDistributionData(),
                this.fetchEmployeePerformanceData()
            ]);

            const totalRevenue = revenueData.values.reduce((sum, val) => sum + val, 0);
            const totalServices = serviceData.values.reduce((sum, val) => sum + val, 0);
            const avgEmployeeRating = employeeData.ratings.reduce((sum, val) => sum + val, 0) / employeeData.ratings.length;

            return {
                totalRevenue,
                totalServices,
                avgEmployeeRating: avgEmployeeRating.toFixed(2),
                period: this.currentPeriod,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error generating summary report:', error);
            throw error;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Chart !== 'undefined') {
        window.advancedReporting = new AdvancedReporting();
    } else {
        console.error('Chart.js not loaded');
    }
});

// Export for use in other modules
window.AdvancedReporting = AdvancedReporting; 