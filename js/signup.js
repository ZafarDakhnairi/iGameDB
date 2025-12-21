const signupForm = document.getElementById('signupForm');

// --- 1. Validation Rules ---
const validators = {
    fullName: (value) => {
        if (!value.trim()) return 'Full Name is required';
        if (value.trim().length < 2) return 'Full Name must be at least 2 characters';
        return null;
    },
    username: (value) => {
        if (!value.trim()) return 'Username is required';
        if (value.trim().length < 3) return 'Username must be at least 3 characters';
        if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Username can only contain letters, numbers, and underscores';
        return null;
    },
    email: (value) => {
        if (!value.trim()) return 'Email is required';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Please enter a valid email address';
        return null;
    },
    password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/\d/.test(value)) return 'Password must contain at least one number';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
        return null;
    },
    confirmPassword: (value, password) => {
        if (!value) return 'Confirm Password is required';
        if (value !== password) return 'Passwords do not match';
        return null;
    },
    gender: (value) => {
        if (!value) return 'Please select a gender';
        return null;
    },
    platform: (platforms) => {
        if (platforms.length === 0) return 'Please select at least one gaming platform';
        return null;
    },
    terms: (checked) => {
        if (!checked) return 'You must agree to the Terms & Conditions';
        return null;
    }
};

// --- 2. Helper Functions ---

// Display Error Message
function displayError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = document.querySelector(`[name="${fieldName}"]`) || document.getElementById(fieldName);

    if (message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
            errorElement.style.display = 'block'; // Ensure it becomes visible
        }
        if (inputElement) {
            inputElement.classList.add('error');
        }
    } else {
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.classList.remove('show');
            errorElement.style.display = 'none';
        }
        if (inputElement) {
            inputElement.classList.remove('error');
        }
    }
}

// Show Toast Notification (Missing in your original code)
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = `toast ${type}`; // Reset classes
    toast.style.display = 'block';
    
    // Style based on type
    if(type === 'error') {
        toast.style.borderColor = '#ff6b6b';
        toast.style.color = '#ff6b6b';
    } else {
        toast.style.borderColor = '#f5c518';
        toast.style.color = '#ffffff';
    }

    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Validate Entire Form
function validateSignupForm() {
    let isValid = true;

    // Validate inputs
    const username = document.getElementById('username').value;
    if (validators.username(username)) { displayError('username', validators.username(username)); isValid = false; }

    const email = document.getElementById('email').value;
    if (validators.email(email)) { displayError('email', validators.email(email)); isValid = false; }

    const password = document.getElementById('password').value;
    if (validators.password(password)) { displayError('password', validators.password(password)); isValid = false; }

    const confirmPassword = document.getElementById('confirmPassword').value;
    if (validators.confirmPassword(confirmPassword, password)) { displayError('confirmPassword', validators.confirmPassword(confirmPassword, password)); isValid = false; }

    // Validate Gender
    const selectedGender = document.querySelector('input[name="gender"]:checked');
    const genderVal = selectedGender ? selectedGender.value : '';
    if (validators.gender(genderVal)) { displayError('gender', validators.gender(genderVal)); isValid = false; }

    // Validate Platform
    const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(e => e.value);
    if (validators.platform(selectedPlatforms)) { displayError('platform', validators.platform(selectedPlatforms)); isValid = false; }

    // Validate Terms
    const termsChecked = document.getElementById('terms').checked;
    if (validators.terms(termsChecked)) { displayError('terms', validators.terms(termsChecked)); isValid = false; }

    return isValid;
}

// --- 3. Event Listeners ---

if (signupForm) {
    // Real-time Validation Listeners
    document.getElementById('username').addEventListener('blur', (e) => displayError('username', validators.username(e.target.value)));
    document.getElementById('email').addEventListener('blur', (e) => displayError('email', validators.email(e.target.value)));
    document.getElementById('password').addEventListener('blur', (e) => displayError('password', validators.password(e.target.value)));
    
    document.getElementById('confirmPassword').addEventListener('blur', (e) => {
        const password = document.getElementById('password').value;
        displayError('confirmPassword', validators.confirmPassword(e.target.value, password));
    });

    document.getElementById('terms').addEventListener('change', (e) => displayError('terms', validators.terms(e.target.checked)));

    // Password Toggle Visibility
    document.getElementById('togglePassword').addEventListener('click', function() {
        const input = document.getElementById('password');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });

    document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
        const input = document.getElementById('confirmPassword');
        const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
        input.setAttribute('type', type);
        this.textContent = type === 'password' ? '👁️' : '🙈';
    });

    // --- Form Submission ---
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateSignupForm()) {
            showToast('Please fix the errors above', 'error');
            return;
        }

        // Collect form data
        const selectedPlatforms = Array.from(document.querySelectorAll('input[name="platform"]:checked')).map(e => e.value);
        const selectedGender = document.querySelector('input[name="gender"]:checked').value;
        
        // **FIXED: Added 'terms' here**
        const formData = {
            username: document.getElementById('username').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            gender: selectedGender,
            platforms: selectedPlatforms,
            terms: document.getElementById('terms').checked // <--- THIS WAS MISSING
        };

        try {
            // Send to backend
            const response = await fetch('http://localhost:3000/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                showToast('Account created successfully! Redirecting...', 'success');
                setTimeout(() => {
                    // Redirect to signin.html (matching your HTML navigation)
                    window.location.href = 'signin.html'; 
                }, 2000);
            } else {
                showToast(data.message || 'Signup failed.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Network error. Check connection.', 'error');
        }
    });
}