document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = '';

        const fullName = registerForm.fullname.value.trim();
        const username = registerForm.username.value.trim();
        const password = registerForm.password.value;
        const confirmPassword = registerForm['confirm-password'].value;

        // Client-side validation
        if (!fullName || !username || !password) {
            errorMessage.textContent = 'All fields are required.';
            return;
        }

        if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match.';
            return;
        }

        if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long.';
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    fullName: fullName,
                    username: username, 
                    password: password 
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Registration successful
                alert('Registration successful! Please login with your credentials.');
                window.location.href = '/index.html';
            } else {
                errorMessage.textContent = data.error || 'Registration failed. Please try again.';
            }
        } catch (error) {
            console.error('Registration request failed:', error);
            errorMessage.textContent = 'An error occurred. Please check the console.';
        }
    });
});