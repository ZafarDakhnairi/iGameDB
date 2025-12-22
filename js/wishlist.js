const wishlistForm = document.getElementById('wishlistForm');
let wishlists = [];

// Load wishlist from backend for current user
function loadWishlist() {
    const currentUserId = localStorage.getItem('currentUserId');
    if (!currentUserId) {
        wishlists = [];
        displayWishlistItems();
        return;
    }

    fetch(`http://localhost:3000/wishlist/${currentUserId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                wishlists = data.data;
                displayWishlistItems();
            }
        })
        .catch(error => {
            console.error('Error loading wishlist:', error);
            wishlists = [];
            displayWishlistItems();
        });
}

// Validation Rules
const wishlistValidators = {
    gameTitle: (value) => {
        if (!value.trim()) return 'Game Title is required';
        if (value.trim().length < 2) return 'Game Title must be at least 2 characters';
        return null;
    },

    platform: (value) => {
        if (!value) return 'Please select a platform';
        return null;
    },

    genre: (genres) => {
        if (genres.length === 0) return 'Please select at least one genre';
        return null;
    },

    reason: (value) => {
        if (!value.trim()) return 'Reason is required';
        if (value.trim().length < 10) return 'Reason must be at least 10 characters';
        if (value.length > 200) return 'Reason cannot exceed 200 characters';
        return null;
    }
};

// Display Error Message
function displayWishlistError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);

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

// Validate Wishlist Form
function validateWishlistForm() {
    let isValid = true;

    // Validate Game Title
    const gameTitle = document.getElementById('gameTitle').value;
    const gameTitleError = wishlistValidators.gameTitle(gameTitle);
    displayWishlistError('gameTitle', gameTitleError);
    if (gameTitleError) isValid = false;

    // Validate Platform
    const platform = document.getElementById('gamePlatform').value;
    const platformError = wishlistValidators.platform(platform);
    displayWishlistError('gamePlatform', platformError);
    if (platformError) isValid = false;

    // Validate Genre
    const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(e => e.value);
    const genreError = wishlistValidators.genre(selectedGenres);
    displayWishlistError('genre', genreError);
    if (genreError) isValid = false;

    // Validate Reason
    const reason = document.getElementById('reason').value;
    const reasonError = wishlistValidators.reason(reason);
    displayWishlistError('reason', reasonError);
    if (reasonError) isValid = false;

    return isValid;
}

// Real-time Validation
if (wishlistForm) {
    document.getElementById('gameTitle').addEventListener('blur', () => {
        const value = document.getElementById('gameTitle').value;
        const error = wishlistValidators.gameTitle(value);
        displayWishlistError('gameTitle', error);
    });

    document.getElementById('gamePlatform').addEventListener('change', () => {
        const value = document.getElementById('gamePlatform').value;
        const error = wishlistValidators.platform(value);
        displayWishlistError('gamePlatform', error);
    });

    document.getElementById('reason').addEventListener('blur', () => {
        const value = document.getElementById('reason').value;
        const error = wishlistValidators.reason(value);
        displayWishlistError('reason', error);
    });
}

// Display Wishlist Items
function displayWishlistItems() {
    const wishlistItems = document.getElementById('wishlistItems');
    
    if (wishlists.length === 0) {
        wishlistItems.innerHTML = '<p class="empty-message">No games in your wishlist yet. Add one above!</p>';
        return;
    }

    wishlistItems.innerHTML = wishlists.map((item, index) => `
        <div class="wishlist-item">
            <div class="wishlist-item-title">${item.gameTitle}</div>
            <div class="wishlist-item-info">
                <span class="wishlist-item-platform">${item.platform}</span>
                <span>Genres: ${item.genre.join(', ')}</span>
            </div>
            <div class="wishlist-item-reason">
                <strong>Why:</strong> ${item.reason}
            </div>
            <button class="btn btn-small" style="background-color: #E74C3C; margin-top: 10px;" onclick="removeWishlistItem(${index})">Remove</button>
        </div>
    `).join('');
}

// Remove Wishlist Item
function removeWishlistItem(index) {
    wishlists.splice(index, 1);
    localStorage.setItem('wishlists', JSON.stringify(wishlists));
    displayWishlistItems();
    showToast('Game removed from wishlist', 'success');
}

// Form Submission
if (wishlistForm) {
    wishlistForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!validateWishlistForm()) {
            showToast('Please fix the errors above', 'error');
            return;
        }

        // Collect form data
        const selectedGenres = Array.from(document.querySelectorAll('input[name="genre"]:checked')).map(e => e.value);
        const currentUserId = localStorage.getItem('currentUserId');

        const formData = {
            gameTitle: document.getElementById('gameTitle').value,
            platform: document.getElementById('gamePlatform').value,
            genre: selectedGenres,
            reason: document.getElementById('reason').value,
            userId: parseInt(currentUserId),
            dateAdded: new Date().toLocaleDateString()
        };

        try {
            // Send to backend
            const response = await fetch('http://localhost:3000/wishlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Add to local wishlists
                wishlists.push(formData);
                localStorage.setItem('wishlists', JSON.stringify(wishlists));
                
                // Reset form
                wishlistForm.reset();
                document.getElementById('charCount').textContent = '0';

                // Clear errors
                document.querySelectorAll('.error-message').forEach(el => {
                    el.textContent = '';
                    el.classList.remove('show');
                });
                document.querySelectorAll('.form-input').forEach(el => {
                    el.classList.remove('error');
                });

                // Display updated wishlist
                displayWishlistItems();

                // Show success modal
                openModal('successModal');

                showToast('Game added to wishlist successfully!', 'success');
            } else {
                showToast(data.message || 'Failed to add game. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            // Still save locally even if backend fails
            wishlists.push(formData);
            localStorage.setItem('wishlists', JSON.stringify(wishlists));
            wishlistForm.reset();
            document.getElementById('charCount').textContent = '0';
            displayWishlistItems();
            openModal('successModal');
            showToast('Game added to your local wishlist!', 'success');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadWishlist();
});
