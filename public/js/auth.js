document.addEventListener('DOMContentLoaded', () => {
    // If user is already logged in, redirect them
    if (sessionStorage.getItem('userRole')) {
        window.location.href = `/${sessionStorage.getItem('userRole')}.html`;
    }

    const loginForm = document.getElementById('login-form');
    const errorMessage = document.getElementById('error-message');

    // Demo account click handlers
    const demoAccounts = document.querySelectorAll('.demo-account');
    demoAccounts.forEach(account => {
        account.addEventListener('click', () => {
            const username = account.getAttribute('data-username');
            const password = account.getAttribute('data-password');
            
            document.getElementById('username').value = username;
            document.getElementById('password').value = password;
            
            // Add visual feedback
            account.style.background = 'var(--primary-50)';
            account.style.borderColor = 'var(--primary-300)';
            
            setTimeout(() => {
                account.style.background = '';
                account.style.borderColor = '';
            }, 1000);
        });
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        const username = loginForm.username.value;
        const password = loginForm.password.value;

        // Add loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Signing in...</span><span class="btn-arrow">⏳</span>';
        submitBtn.disabled = true;

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

                // Show success state
                submitBtn.innerHTML = '<span>Success!</span><span class="btn-arrow">✅</span>';
                
                // Redirect to the appropriate dashboard
                setTimeout(() => {
                    window.location.href = `/${data.role}.html`;
                }, 500);
            } else {
                throw new Error(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login request failed:', error);
            
            // Show error
            errorMessage.textContent = error.message || 'An error occurred. Please try again.';
            errorMessage.classList.add('show');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Add shake animation to form
            loginForm.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                loginForm.style.animation = '';
            }, 500);
        }
    });
});

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);