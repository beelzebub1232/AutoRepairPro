// Advanced Reporting and Analytics System
class AdvancedReporting {
    constructor() {
        this.charts = {};
        this.reportData = {};
        this.init();
    }

    init() {
        this.loadReportingStyles();
    }

    loadReportingStyles() {
        // Inject Chart.js-like functionality without external dependencies
        if (!document.getElementById('chart-styles')) {
            const style = document.createElement('style');
            style.id = 'chart-styles';
            style.textContent = `
                .chart-container {
                    position: relative;
                    height: 300px;
                    margin: 1rem 0;
                }
                
                .simple-chart {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: end;
                    justify-content: space-around;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    position: relative;
                }
                
                .chart-bar {
                    background: linear-gradient(to top, #3498db, #5dade2);
                    border-radius: 4px 4px 0 0;
                    min-width: 30px;
                    margin: 0 2px;
                    position: relative;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }
                
                .chart-bar:hover {
                    background: linear-gradient(to top, #2980b9, #3498db);
                    transform: translateY(-2px);
                }
                
                .chart-bar-label {
                    position: absolute;
                    bottom: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.8rem;
                    color: #555;
                    white-space: nowrap;
                }
                
                .chart-bar-value {
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: #2c3e50;
                    white-space: nowrap;
                }
                
                .pie-chart {
                    width: 200px;
                    height: 200px;
                    border-radius: 50%;
                    margin: 0 auto;
                    position: relative;
                }
                
                .pie-legend {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                
                .pie-legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                }
                
                .pie-legend-color {
                    width: 16px;
                    height: 16px;
                    border-radius: 2px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async generateRevenueChart(containerId, period = 12) {
        try {
            const response = await fetch('http://localhost:8080/api/admin/reports/revenue');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.createBarChart(containerId, data, {
                title: 'Monthly Revenue',
                xField: 'month',
                yField: 'totalRevenue',
                color: '#3498db'
            });

        } catch (error) {
            console.error('Error generating revenue chart:', error);
            this.showChartError(containerId, 'Failed to load revenue data');
        }
    }

    async generatePartUsageChart(containerId) {
        try {
            const response = await fetch('http://localhost:8080/api/admin/reports/part-usage');
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            this.createBarChart(containerId, data.slice(0, 10), {
                title: 'Top 10 Parts Usage',
                xField: 'partName',
                yField: 'totalUsed',
                color: '#e74c3c'
            });

        } catch (error) {
            console.error('Error generating part usage chart:', error);
            this.showChartError(containerId, 'Failed to load part usage data');
        }
    }

    async generateServicePerformanceChart(containerId) {
        try {
            const [jobsResponse, servicesResponse] = await Promise.all([
                fetch('http://localhost:8080/api/admin/jobs'),
                fetch('http://localhost:8080/api/admin/services')
            ]);
            
            const jobs = await jobsResponse.json();
            const services = await servicesResponse.json();
            
            // Calculate service performance
            const serviceData = services.map(service => {
                const serviceJobs = jobs.filter(job => job.service === service.serviceName);
                return {
                    serviceName: service.serviceName,
                    jobCount: serviceJobs.length,
                    completedJobs: serviceJobs.filter(job => ['Completed', 'Invoiced', 'Paid'].includes(job.status)).length
                };
            });

            this.createPieChart(containerId, serviceData, {
                title: 'Service Distribution',
                labelField: 'serviceName',
                valueField: 'jobCount'
            });

        } catch (error) {
            console.error('Error generating service performance chart:', error);
            this.showChartError(containerId, 'Failed to load service performance data');
        }
    }

    createBarChart(containerId, data, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const maxValue = Math.max(...data.map(item => parseFloat(item[options.yField]) || 0));
        const chartHeight = 250;

        const chartHTML = `
            <div class="chart-header">
                <h4>${options.title}</h4>
            </div>
            <div class="simple-chart">
                ${data.map(item => {
                    const value = parseFloat(item[options.yField]) || 0;
                    const height = maxValue > 0 ? (value / maxValue) * chartHeight : 0;
                    const displayValue = options.yField.includes('revenue') || options.yField.includes('cost') 
                        ? `$${value.toFixed(2)}` 
                        : value.toString();
                    
                    return `
                        <div class="chart-bar" 
                             style="height: ${height}px; background: ${options.color};"
                             title="${item[options.xField]}: ${displayValue}">
                            <div class="chart-bar-value">${displayValue}</div>
                            <div class="chart-bar-label">${this.truncateLabel(item[options.xField])}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.innerHTML = chartHTML;
    }

    createPieChart(containerId, data, options) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const total = data.reduce((sum, item) => sum + (parseFloat(item[options.valueField]) || 0), 0);
        const colors = ['#3498db', '#e74c3c', '#f39c12', '#27ae60', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
        
        let currentAngle = 0;
        const segments = data.map((item, index) => {
            const value = parseFloat(item[options.valueField]) || 0;
            const percentage = total > 0 ? (value / total) * 100 : 0;
            const angle = (value / total) * 360;
            
            const segment = {
                ...item,
                percentage: percentage.toFixed(1),
                color: colors[index % colors.length],
                startAngle: currentAngle,
                endAngle: currentAngle + angle
            };
            
            currentAngle += angle;
            return segment;
        });

        const pieHTML = `
            <div class="chart-header">
                <h4>${options.title}</h4>
            </div>
            <div class="pie-chart" style="background: conic-gradient(${
                segments.map(segment => 
                    `${segment.color} ${segment.startAngle}deg ${segment.endAngle}deg`
                ).join(', ')
            });">
            </div>
            <div class="pie-legend">
                ${segments.map(segment => `
                    <div class="pie-legend-item">
                        <div class="pie-legend-color" style="background: ${segment.color};"></div>
                        <span>${segment[options.labelField]} (${segment.percentage}%)</span>
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = pieHTML;
    }

    truncateLabel(label, maxLength = 10) {
        if (label.length <= maxLength) return label;
        return label.substring(0, maxLength) + '...';
    }

    showChartError(containerId, message) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="chart-error">
                    <div class="error-icon">⚠️</div>
                    <div class="error-message">${message}</div>
                </div>
            `;
        }
    }

    async generateKPICards() {
        try {
            const [jobsResponse, usersResponse, inventoryResponse] = await Promise.all([
                fetch('http://localhost:8080/api/admin/jobs'),
                fetch('http://localhost:8080/api/admin/users'),
                fetch('http://localhost:8080/api/admin/inventory/alerts')
            ]);
            
            const jobs = await jobsResponse.json();
            const users = await usersResponse.json();
            const lowStockItems = await inventoryResponse.json();
            
            // Calculate KPIs
            const totalRevenue = jobs
                .filter(job => job.totalCost)
                .reduce((sum, job) => sum + parseFloat(job.totalCost), 0);
            
            const completedJobs = jobs.filter(job => job.status === 'Completed').length;
            const inProgressJobs = jobs.filter(job => job.status === 'In Progress').length;
            const activeCustomers = users.filter(user => user.role === 'customer').length;
            const totalEmployees = users.filter(user => user.role === 'employee').length;
            
            // Calculate average job completion time
            const completedJobsWithDates = jobs.filter(job => 
                job.status === 'Completed' && job.bookingDate && job.completionDate
            );
            
            let avgCompletionTime = 0;
            if (completedJobsWithDates.length > 0) {
                const totalTime = completedJobsWithDates.reduce((sum, job) => {
                    const start = new Date(job.bookingDate);
                    const end = new Date(job.completionDate);
                    return sum + (end - start);
                }, 0);
                avgCompletionTime = totalTime / completedJobsWithDates.length / (1000 * 60 * 60 * 24); // Convert to days
            }

            return {
                totalRevenue: totalRevenue.toFixed(2),
                totalJobs: jobs.length,
                completedJobs,
                inProgressJobs,
                activeCustomers,
                totalEmployees,
                lowStockItems: lowStockItems.length,
                avgCompletionTime: avgCompletionTime.toFixed(1),
                completionRate: jobs.length > 0 ? ((completedJobs / jobs.length) * 100).toFixed(1) : 0
            };

        } catch (error) {
            console.error('Error generating KPIs:', error);
            return null;
        }
    }

    async updateKPIDashboard() {
        const kpis = await this.generateKPICards();
        if (!kpis) return;

        // Update existing KPI elements
        const elements = {
            'total-revenue': `$${kpis.totalRevenue}`,
            'total-jobs': kpis.totalJobs,
            'active-customers': kpis.activeCustomers,
            'low-stock-items': kpis.lowStockItems
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });

        // Add additional KPIs if container exists
        const additionalKPIContainer = document.getElementById('additional-kpis');
        if (additionalKPIContainer) {
            additionalKPIContainer.innerHTML = `
                <div class="metric-card">
                    <div class="metric-icon">⏱️</div>
                    <div class="metric-content">
                        <h3>${kpis.avgCompletionTime} days</h3>
                        <p>Avg Completion Time</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">📊</div>
                    <div class="metric-content">
                        <h3>${kpis.completionRate}%</h3>
                        <p>Completion Rate</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">👥</div>
                    <div class="metric-content">
                        <h3>${kpis.totalEmployees}</h3>
                        <p>Total Employees</p>
                    </div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon">🔄</div>
                    <div class="metric-content">
                        <h3>${kpis.inProgressJobs}</h3>
                        <p>Jobs In Progress</p>
                    </div>
                </div>
            `;
        }
    }

    async exportReport(format = 'csv') {
        try {
            const kpis = await this.generateKPICards();
            const [jobsResponse, revenueResponse, partUsageResponse] = await Promise.all([
                fetch('http://localhost:8080/api/admin/jobs'),
                fetch('http://localhost:8080/api/admin/reports/revenue'),
                fetch('http://localhost:8080/api/admin/reports/part-usage')
            ]);
            
            const jobs = await jobsResponse.json();
            const revenue = await revenueResponse.json();
            const partUsage = await partUsageResponse.json();

            if (format === 'csv') {
                this.exportToCSV({ kpis, jobs, revenue, partUsage });
            } else if (format === 'json') {
                this.exportToJSON({ kpis, jobs, revenue, partUsage });
            }

        } catch (error) {
            console.error('Error exporting report:', error);
            alert('Failed to export report');
        }
    }

    exportToCSV(data) {
        const csvContent = [];
        
        // Add header
        csvContent.push(['AutoRepairPro - Comprehensive Report']);
        csvContent.push(['Generated on:', new Date().toLocaleDateString()]);
        csvContent.push([]);
        
        // Add KPIs
        csvContent.push(['Key Performance Indicators']);
        csvContent.push(['Metric', 'Value']);
        csvContent.push(['Total Revenue', `$${data.kpis.totalRevenue}`]);
        csvContent.push(['Total Jobs', data.kpis.totalJobs]);
        csvContent.push(['Completed Jobs', data.kpis.completedJobs]);
        csvContent.push(['Jobs In Progress', data.kpis.inProgressJobs]);
        csvContent.push(['Active Customers', data.kpis.activeCustomers]);
        csvContent.push(['Total Employees', data.kpis.totalEmployees]);
        csvContent.push(['Low Stock Items', data.kpis.lowStockItems]);
        csvContent.push(['Avg Completion Time (days)', data.kpis.avgCompletionTime]);
        csvContent.push(['Completion Rate (%)', data.kpis.completionRate]);
        csvContent.push([]);
        
        // Add revenue data
        csvContent.push(['Monthly Revenue']);
        csvContent.push(['Month', 'Jobs Completed', 'Total Revenue']);
        data.revenue.forEach(item => {
            csvContent.push([item.month, item.jobsCompleted, item.totalRevenue]);
        });
        csvContent.push([]);
        
        // Add part usage data
        csvContent.push(['Parts Usage']);
        csvContent.push(['Part Name', 'Total Used', 'Jobs Count']);
        data.partUsage.forEach(item => {
            csvContent.push([item.partName, item.totalUsed, item.jobsCount]);
        });
        
        // Convert to CSV string
        const csvString = csvContent.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');
        
        // Download
        this.downloadFile(csvString, 'autorepairpro-report.csv', 'text/csv');
    }

    exportToJSON(data) {
        const jsonData = {
            reportDate: new Date().toISOString(),
            kpis: data.kpis,
            revenue: data.revenue,
            partUsage: data.partUsage,
            summary: {
                totalJobs: data.jobs.length,
                jobsByStatus: this.groupBy(data.jobs, 'status'),
                revenueTotal: data.revenue.reduce((sum, item) => sum + parseFloat(item.totalRevenue || 0), 0)
            }
        };
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        this.downloadFile(jsonString, 'autorepairpro-report.json', 'application/json');
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }
}

// Initialize advanced reporting
document.addEventListener('DOMContentLoaded', () => {
    window.advancedReporting = new AdvancedReporting();
});