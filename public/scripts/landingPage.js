
document.addEventListener('DOMContentLoaded', () => {
    // Animate background based on mouse movement
    const animatedBg = document.querySelector('.animated-background');
    let mouseX = 0;
    let mouseY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX / window.innerWidth;
        mouseY = e.clientY / window.innerHeight;
        
        // Subtle background movement based on mouse position
        animatedBg.style.backgroundPosition = `${mouseX * 100}% ${mouseY * 100}%`;
    });
});
