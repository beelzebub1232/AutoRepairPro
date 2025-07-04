document.addEventListener('DOMContentLoaded', () => {
    const userRole = sessionStorage.getItem('userRole');
    const userName = sessionStorage.getItem('userName');
    const userId = sessionStorage.getItem('userId');
    
    // Auth check: if no user role, redirect to login
    if (!userRole) {
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

    // Load data based on role
    if (userRole === 'admin') {
        loadAdminData();
    } else if (userRole === 'employee') {
        loadEmployeeData(userId);
    } else if (userRole === 'customer') {
        // loadCustomerData(userId); // Not implemented yet
    }
});

async function loadAdminData() {
    try {
        const response = await fetch('http://localhost:8080/api/admin/jobs');
        if (!response.ok) throw new Error('Failed to fetch jobs');
        
        const jobs = await response.json();
        populateJobTable(jobs);
    } catch (error) {
        console.error('Error loading admin data:', error);
        document.getElementById('job-table-body').innerHTML = `<tr><td colspan="5" class="error-text">Failed to load jobs.</td></tr>`;
    }
}

async function loadEmployeeData(employeeId) {
    try {
        const response = await fetch(`http://localhost:8080/api/employee/jobs/${employeeId}`);
        if (!response.ok) throw new Error('Failed to fetch assigned jobs');

        const jobs = await response.json();
        populateJobTable(jobs);
    } catch (error) {
        console.error('Error loading employee data:', error);
        document.getElementById('job-table-body').innerHTML = `<tr><td colspan="5" class="error-text">Failed to load assigned jobs.</td></tr>`;
    }
}

function populateJobTable(jobs) {
    const tableBody = document.getElementById('job-table-body');
    tableBody.innerHTML = ''; // Clear existing data

    if (jobs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5">No jobs found.</td></tr>';
        return;
    }

    jobs.forEach(job => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.jobId}</td>
            <td>${job.customerName}</td>
            <td>${job.vehicle}</td>
            <td>${job.service}</td>
            <td>${job.status}</td>
        `;
        tableBody.appendChild(row);
    });
}