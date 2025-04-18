
document.addEventListener('DOMContentLoaded', () => {
    // Toggle password visibility
    const passwordInput = document.getElementById('password');
    const togglePasswordButton = document.querySelector('.toggle-password');
    
    togglePasswordButton.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        
        // Update icon
        const eyeIcon = togglePasswordButton.querySelector('.eye-icon');
        if (type === 'password') {
            eyeIcon.innerHTML = '<path d="M12 5c-7.2 0-9 6-9 6s1.8 6 9 6 9-6 9-6-1.8-6-9-6z"/><circle cx="12" cy="11" r="3"/>';
        } else {
            eyeIcon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/>';
        }
    });
    
    // Form submission
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        // Simple form validation
        if (!email || !password) {
            alert('Please fill in all fields');
            return;
        }
        
        // You would typically send this to a server
        console.log('Login attempt:', { email, password });
        
        // Show success message
        const notification = document.createElement('div');
        notification.className = 'notification fade-in';
        notification.textContent = 'Login successful!';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    });
});

// Add dynamic styling for the animated background
const animatedBg = document.querySelector('.animated-background');
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
    
    // Subtle background movement based on mouse position
    animatedBg.style.backgroundPosition = `${mouseX * 100}% ${mouseY * 100}%`;
});
