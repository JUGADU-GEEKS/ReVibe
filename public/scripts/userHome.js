
// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Sample product data
const products = [
    {
        id: 1,
        name: "Upcycled Denim Jacket",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea",
        carbonFootprint: 1.2
    },
    {
        id: 2,
        name: "Eco-Friendly Bamboo Chair",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1592078615290-033ee584e267",
        carbonFootprint: 3.5
    },
    {
        id: 3,
        name: "Recycled Glass Vase",
        price: 45.99,
        image: "https://images.unsplash.com/photo-1602666346781-a5ea09d5ad8a",
        carbonFootprint: 1.8
    },
    {
        id: 4,
        name: "Upcycled Vinyl Record Bowl",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1545454675-3531b543be5d",
        carbonFootprint: 0.3
    }
];

// Initialize page animations
document.addEventListener('DOMContentLoaded', () => {
    // Hero animations
    gsap.to('.hero h1', {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out'
    });

    gsap.to('.hero p', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out'
    });

    gsap.to('.hero-buttons', {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.6,
        ease: 'power3.out'
    });

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        const navbar = document.querySelector('.navbar');
        if (window.scrollY > 50) {
            navbar.style.backgroundColor = 'rgba(26, 26, 34, 0.8)';
        } else {
            navbar.style.backgroundColor = 'transparent';
        }
    });

    // Animate background elements
    gsap.to('.cube', {
        rotationY: 360,
        rotationX: 360,
        duration: 20,
        repeat: -1,
        ease: 'none'
    });

    // Render products
    const productsGrid = document.querySelector('.products-grid');
    products.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });

    // Animate products on scroll
    gsap.from('.product-card', {
        scrollTrigger: {
            trigger: '.products-grid',
            start: 'top center',
            toggleActions: 'play none none reverse'
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2
    });
});

// Create product card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <div class="product-image">
            <img src="${product.image}" alt="${product.name}">
            <div class="carbon-badge">
                🌱 ${product.carbonFootprint} kg CO₂
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <div class="product-price">$${product.price.toFixed(2)}</div>
            <button class="add-to-cart">Add to Cart</button>
        </div>
    `;

    // Add 3D hover effect
    card.addEventListener('mousemove', handleCardHover);
    card.addEventListener('mouseleave', resetCardTransform);

    return card;
}

// Handle card hover effect
function handleCardHover(e) {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;
    
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
}

// Reset card transform
function resetCardTransform(e) {
    const card = e.currentTarget;
    card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
}
