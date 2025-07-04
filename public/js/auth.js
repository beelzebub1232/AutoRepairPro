document.addEventListener('DOMContentLoaded', () => {
    // If user is already logged in, redirect them
    if (sessionStorage.getItem('userRole')) {
        window.location.href = `/${sessionStorage.getItem('userRole')}.html`;
    }

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        try {
            const response = await fetch('http://localhost:8080/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store user info in session storage
                sessionStorage.setItem('userRole', data.role);
                sessionStorage.setItem('userName', data.fullName);
                sessionStorage.setItem('userId', data.userId);

                // Redirect to the appropriate dashboard
                window.location.href = `/${data.role}.html`;
            } else {
                errorMessage.textContent = data.error || 'Login failed. Please try again.';
            }
        } catch (error) {
            console.error('Login request failed:', error);
            errorMessage.textContent = 'An error occurred. Please check the console.';
        }
    });
});