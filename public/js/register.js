document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        errorMessage.classList.remove('show');
        errorMessage.textContent = '';

        const fullName = registerForm.fullname.value.trim();
        const email = registerForm.email.value.trim();
        const username = registerForm.username.value.trim();
        const password = registerForm.password.value;
        const confirmPassword = registerForm['confirm-password'].value;
        const role = registerForm.role.value;

        // Client-side validation
        if (!fullName || !email || !username || !password) {
            showError('All fields are required.');
            return;
        }

        // Email format validation
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email)) {
            showError('Please enter a valid email address.');
            return;
        }

        if (password !== confirmPassword) {
            showError('Passwords do not match.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters long.');
            return;
        }

        // Add loading state
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Creating account...</span><span class="btn-arrow">⏳</span>';
        submitBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:8080/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    fullName: fullName,
                    email: email,
                    username: username, 
                    password: password,
                    role: role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Show success state
                submitBtn.innerHTML = '<span>Account created!</span><span class="btn-arrow">✅</span>';
                
                // Show success message
                showSuccess('Registration successful! Redirecting to login...');
                
                // Redirect to login
                setTimeout(() => {
                    window.location.href = '/index.html';
                }, 2000);
            } else {
                throw new Error(data.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration request failed:', error);
            
            // Show error
            showError(error.message || 'An error occurred. Please try again.');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            
            // Add shake animation to form
            registerForm.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                registerForm.style.animation = '';
            }, 500);
        }
    });

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.background = 'var(--error-50)';
        errorMessage.style.color = 'var(--error-600)';
        errorMessage.style.borderColor = 'var(--error-200)';
    }

    function showSuccess(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add('show');
        errorMessage.style.background = 'var(--success-50)';
        errorMessage.style.color = 'var(--success-600)';
        errorMessage.style.borderColor = 'var(--success-200)';
    }
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