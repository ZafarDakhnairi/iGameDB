const loginForm = document.getElementById('loginForm');

// Validation Rules
const loginValidators = {
    email: (value) => {
        if (!value.trim()) return 'Email or Username is required';
        return null;
    },

    password: (value) => {
        if (!value) return 'Password is required';
        return null;
    }
};

// Display Error Message
function displayLoginError(fieldName, message) {
    const errorElement = document.getElementById(`login${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}Error`);
    const inputElement = document.getElementById(`login${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);

    if (message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    } else {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }
}

// Validate Login Form
function validateLoginForm() {
    let isValid = true;

    // Validate Email or Username
    const loginInput = document.getElementById('loginEmail');
    const email = loginInput ? loginInput.value.trim() : '';
    const emailError = loginValidators.email(email);
    displayLoginError('email', emailError);
    if (emailError) isValid = false;

    // Validate Password
    const passwordInput = document.getElementById('loginPassword');
    const password = passwordInput ? passwordInput.value : '';
    const passwordError = loginValidators.password(password);
    displayLoginError('password', passwordError);
    if (passwordError) isValid = false;

    return isValid;
}

// Real-time Validation
if (loginForm) {
    document.getElementById('loginEmail').addEventListener('blur', () => {
        const value = document.getElementById('loginEmail').value;
        const error = loginValidators.email(value);
        displayLoginError('email', error);
    });

    document.getElementById('loginPassword').addEventListener('blur', () => {
        const value = document.getElementById('loginPassword').value;
        const error = loginValidators.password(value);
        displayLoginError('password', error);
    });
}

// Forgot Password Link
const forgotPasswordLink = document.getElementById('forgotPassword');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Password reset feature coming soon!', 'success');
    });
}

// Form Submission
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateLoginForm()) {
            showToast('Please fix the errors above', 'error');
            return;
        }

        const formData = {
            login: document.getElementById('loginEmail').value, // Can be email or username
            password: document.getElementById('loginPassword').value
        };

        try {
            // Send to backend
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Login successful! Redirecting...', 'success');
                // Store user info in localStorage
                localStorage.setItem('currentUser', data.user.email);
                localStorage.setItem('currentUserName', data.user.fullName);
                localStorage.setItem('currentUsername', data.user.username);
                localStorage.setItem('currentUserId', data.user.id);
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            } else {
                showToast(data.message || 'Login failed. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Please check your connection.', 'error');
        }
    });
}
