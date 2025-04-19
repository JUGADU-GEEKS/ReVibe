// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

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
        navbar.style.backgroundColor = window.scrollY > 50 ? 'rgba(26, 26, 34, 0.8)' : 'transparent';
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
    serverProducts.forEach(product => {
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
            <p class="product-material">Material: ${product.material}</p>
            <p class="product-material">${product.type}</p>
            <div class="product-price">₹${product.price.toFixed(2)}</div>
            <button class="add-to-cart" data-product-id="${product._id}">Add to Cart</button>
        </div>
    `;

    // Add 3D hover effect
    card.addEventListener('mousemove', handleCardHover);
    card.addEventListener('mouseleave', resetCardTransform);

    // Add to cart functionality
    const addToCartBtn = card.querySelector('.add-to-cart');
    addToCartBtn.addEventListener('click', async function () {
        const productId = this.dataset.productId;

        try {
            const response = await fetch('/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    credentials: 'include', // 👈 This is crucial
                },
                body: JSON.stringify({ productId })
            });

            if (response.ok) {
                alert('Product added to cart successfully!');
                const cartCount = document.querySelector('.cart-count');
                cartCount.textContent = parseInt(cartCount.textContent) + 1;
            } else {
                const error = await response.json();
                alert('Failed to add to cart: ' + error.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred while adding to cart.', error);
        }
    });

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
document.body.querySelector('.cart-btn').addEventListener('click', ()=>{
    window.location.href='/cart'
})

// Footer animations
document.addEventListener('DOMContentLoaded', () => {
    // Existing code...
    
    // Add footer animations
    gsap.from('.footer-logo', {
      scrollTrigger: {
        trigger: '.site-footer',
        start: 'top bottom-=100',
        toggleActions: 'play none none none'
      },
      y: 30,
      opacity: 0,
      duration: 0.8
    });
    
    gsap.from('.footer-column', {
      scrollTrigger: {
        trigger: '.site-footer',
        start: 'top bottom-=100',
        toggleActions: 'play none none none'
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2
    });
    
    gsap.from('.footer-newsletter', {
      scrollTrigger: {
        trigger: '.site-footer',
        start: 'top bottom-=100',
        toggleActions: 'play none none none'
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      delay: 0.4
    });
    
    gsap.from('.certification-badge', {
      scrollTrigger: {
        trigger: '.footer-middle',
        start: 'top bottom-=50',
        toggleActions: 'play none none none'
      },
      scale: 0.8,
      opacity: 0,
      duration: 0.6,
      stagger: 0.2
    });
    
    // Form submission animation
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
      newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const input = this.querySelector('input');
        const value = input.value.trim();
        
        if (value) {
          // Animate the button
          gsap.to(this.querySelector('.btn-subscribe'), {
            scale: 1.1,
            duration: 0.2,
            onComplete: () => {
              gsap.to(this.querySelector('.btn-subscribe'), {
                scale: 1,
                duration: 0.2
              });
            }
          });
          
          // Show success message
          input.value = '';
          
          const successMsg = document.createElement('p');
          successMsg.className = 'success-message';
          successMsg.textContent = 'Thank you for subscribing!';
          successMsg.style.color = '#4caf50';
          successMsg.style.fontSize = '0.9rem';
          successMsg.style.marginTop = '0.5rem';
          successMsg.style.opacity = '0';
          
          this.appendChild(successMsg);
          
          gsap.to(successMsg, {
            opacity: 1,
            duration: 0.5,
            onComplete: () => {
              setTimeout(() => {
                gsap.to(successMsg, {
                  opacity: 0,
                  duration: 0.5,
                  onComplete: () => {
                    successMsg.remove();
                  }
                });
              }, 3000);
            }
          });
        }
      });
    }
  });