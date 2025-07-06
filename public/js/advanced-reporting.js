// Advanced Reporting System for Admin Dashboard
class AdvancedReporting {
    constructor() {
        this.charts = {};
        this.currentPeriod = 'month';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadChartLibrary();
    }

    setupEventListeners() {
        // Period selector
        const periodSelect = document.getElementById('report-period');
        if (periodSelect) {
            periodSelect.addEventListener('change', (e) => {
                this.currentPeriod = e.target.value;
                this.refreshAllCharts();
            });
        }

        // Export buttons
        const exportBtn = document.getElementById('export-csv-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportData());
        }
    }

    async loadChartLibrary() {
        // Load Chart.js if not already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.initializeCharts();
            document.head.appendChild(script);
        } else {
            this.initializeCharts();
        }
    }

    async initializeCharts() {
        await this.createRevenueChart();
        await this.createServiceDistributionChart();
        await this.createEmployeePerformanceChart();
        await this.createInventoryChart();
        await this.createCustomerActivityChart();
    }

    async createRevenueChart() {
        const ctx = document.getElementById('revenue-chart-canvas');
        if (!ctx) {
            console.warn('Revenue chart canvas not found');
            return;
        }

        try {
            const data = await this.fetchRevenueData();
            
            this.charts.revenue = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Revenue',
                        data: data.values,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `Revenue: $${context.parsed.y.toLocaleString()}`;
                                }
                            }
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
                    },
                    interaction: {
                        mode: 'nearest',
                        axis: 'x',
                        intersect: false
                    }
                }
            });
        } catch (error) {
            console.error('Error creating revenue chart:', error);
            this.showChartError(ctx, 'Failed to load revenue data');
        }
    }

    async createServiceDistributionChart() {
        const ctx = document.getElementById('parts-usage-chart-canvas');
        if (!ctx) {
            console.warn('Service distribution chart canvas not found');
            return;
        }

        try {
            const data = await this.fetchServiceDistributionData();
            
            this.charts.serviceDistribution = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: data.labels,
                    datasets: [{
                        data: data.values,
                        backgroundColor: [
                            '#3b82f6',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444',
                            '#8b5cf6',
                            '#06b6d4'
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((context.parsed / total) * 100).toFixed(1);
                                    return `${context.label}: ${context.parsed} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating service distribution chart:', error);
            this.showChartError(ctx, 'Failed to load service data');
        }
    }

    async createEmployeePerformanceChart() {
        const ctx = document.getElementById('employee-performance-chart-canvas');
        if (!ctx) {
            console.warn('Employee performance chart canvas not found');
            return;
        }

        try {
            const data = await this.fetchEmployeePerformanceData();
            
            this.charts.employeePerformance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Jobs Completed',
                        data: data.jobsCompleted,
                        backgroundColor: '#3b82f6',
                        borderColor: '#2563eb',
                        borderWidth: 1
                    }, {
                        label: 'Customer Rating',
                        data: data.ratings,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Jobs Completed'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Rating (1-5)'
                            },
                            grid: {
                                drawOnChartArea: false
                            },
                            min: 0,
                            max: 5
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating employee performance chart:', error);
            this.showChartError(ctx, 'Failed to load employee data');
        }
    }

    async createInventoryChart() {
        const ctx = document.getElementById('inventory-chart-canvas');
        if (!ctx) {
            console.warn('Inventory chart canvas not found');
            return;
        }

        try {
            const data = await this.fetchInventoryData();
            
            this.charts.inventory = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Current Stock',
                        data: data.currentStock,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1
                    }, {
                        label: 'Minimum Required',
                        data: data.minRequired,
                        backgroundColor: '#f59e0b',
                        borderColor: '#d97706',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Quantity'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating inventory chart:', error);
            this.showChartError(ctx, 'Failed to load inventory data');
        }
    }

    async createCustomerActivityChart() {
        const ctx = document.getElementById('customer-activity-chart-canvas');
        if (!ctx) {
            console.warn('Customer activity chart canvas not found');
            return;
        }

        try {
            const data = await this.fetchCustomerActivityData();
            
            this.charts.customerActivity = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'New Customers',
                        data: data.newCustomers,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: false
                    }, {
                        label: 'Returning Customers',
                        data: data.returningCustomers,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        fill: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Customers'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error creating customer activity chart:', error);
            this.showChartError(ctx, 'Failed to load customer data');
        }
    }

    async fetchRevenueData() {
        try {
            const response = await fetch(`http://localhost:8080/api/admin/reports/revenue?period=${this.currentPeriod}`);
            if (!response.ok) {
                console.error('Revenue API response:', response.status, response.statusText);
                throw new Error(`Failed to fetch revenue data: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching revenue data:', error);
            // Return mock data for development
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                values: [12000, 15000, 18000, 14000, 22000, 25000]
            };
        }
    }

    async fetchServiceDistributionData() {
        try {
            const response = await fetch(`http://localhost:8080/api/admin/reports/part-usage?period=${this.currentPeriod}`);
            if (!response.ok) {
                console.error('Service distribution API response:', response.status, response.statusText);
                throw new Error(`Failed to fetch service data: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching service distribution data:', error);
            // Return mock data for development
            return {
                labels: ['Body Repair', 'Paint Job', 'Engine Service', 'Brake Service', 'Oil Change'],
                values: [25, 30, 15, 20, 10]
            };
        }
    }

    async fetchEmployeePerformanceData() {
        try {
            const response = await fetch(`http://localhost:8080/api/admin/reports/employee-performance?period=${this.currentPeriod}`);
            if (!response.ok) {
                console.error('Employee performance API response:', response.status, response.statusText);
                throw new Error(`Failed to fetch employee data: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching employee performance data:', error);
            // Return mock data for development
            return {
                labels: ['John Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown'],
                jobsCompleted: [15, 12, 18, 10],
                ratings: [4.5, 4.2, 4.8, 4.0]
            };
        }
    }

    async fetchInventoryData() {
        try {
            const response = await fetch('http://localhost:8080/api/admin/inventory');
            if (!response.ok) {
                console.error('Inventory API response:', response.status, response.statusText);
                throw new Error(`Failed to fetch inventory data: ${response.status}`);
            }
            const inventory = await response.json();
            
            // Process inventory data for chart
            const labels = inventory.slice(0, 10).map(item => item.partName);
            const currentStock = inventory.slice(0, 10).map(item => item.quantity);
            const minRequired = inventory.slice(0, 10).map(item => item.minQuantity || 5);
            
            return { labels, currentStock, minRequired };
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            // Return mock data for development
            return {
                labels: ['Oil Filter', 'Brake Pads', 'Air Filter', 'Spark Plugs', 'Tires'],
                currentStock: [50, 30, 25, 40, 15],
                minRequired: [10, 5, 8, 12, 3]
            };
        }
    }

    async fetchCustomerActivityData() {
        try {
            const response = await fetch(`http://localhost:8080/api/admin/reports/customer-activity?period=${this.currentPeriod}`);
            if (!response.ok) {
                console.error('Customer activity API response:', response.status, response.statusText);
                throw new Error(`Failed to fetch customer data: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching customer activity data:', error);
            // Return mock data for development
            return {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                newCustomers: [15, 20, 18, 25, 22, 30],
                returningCustomers: [45, 50, 48, 55, 52, 60]
            };
        }
    }

    showChartError(canvas, message) {
        if (!canvas || typeof canvas.getContext !== 'function') {
            console.error('Invalid canvas element:', canvas);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Could not get 2D context from canvas');
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#6b7280';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, canvas.width / 2, canvas.height / 2);
    }

    async refreshAllCharts() {
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) {
                chart.destroy();
            }
        });
        
        this.charts = {};
        
        // Recreate charts with new data
        await this.initializeCharts();
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
            
            // Show success notification
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

    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Real-time updates
    startRealTimeUpdates() {
        setInterval(() => {
            this.refreshAllCharts();
        }, 300000); // Refresh every 5 minutes
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

// Initialize advanced reporting when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('reports-tab')) {
        window.advancedReporting = new AdvancedReporting();
    }
});

// Export for use in other modules
window.AdvancedReporting = AdvancedReporting; 