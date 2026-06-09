/* Smart Choices Guide - JavaScript Unificato */

// Inizializzazione quando il DOM è caricato
document.addEventListener('DOMContentLoaded', function() {
    // Inizializza AI Assistant se presente
    if (window.SmartChoicesAI) {
        SmartChoicesAI.init();
    }
    
    // Lazy loading per immagini
    initLazyLoading();
    
    // Smooth scroll per link interni
    initSmoothScroll();
    
    // Animazioni on scroll
    initScrollAnimations();
    
    // Split Screen Navigation
    initSplitScreenNav();
});

// Lazy Loading per immagini
function initLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Smooth Scroll per link interni
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Animazioni on scroll
function initScrollAnimations() {
    const animatedElements = document.querySelectorAll('.bento-item, .product-card');
    
    const scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        scrollObserver.observe(el);
    });
}

// Utility per debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Utility per throttling
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Performance monitoring
if ('performance' in window) {
    window.addEventListener('load', function() {
        setTimeout(function() {
            const perfData = performance.getEntriesByType('navigation')[0];
            if (perfData) {
                console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }
        }, 0);
    });
}

// Split Screen Navigation
function initSplitScreenNav() {
    const splitNav = document.getElementById('splitScreenNav');
    const openBtn = document.getElementById('openSplitNav');
    const closeBtn = document.getElementById('splitClose');
    const overlay = document.getElementById('splitOverlay');
    const categoryItems = document.querySelectorAll('.split-category-item');
    const subcategoriesContainer = document.getElementById('splitSubcategories');

    // Dati sottocategorie
    const subcategoriesData = {
        casa: [
            { name: 'Cucina', icon: 'fa-utensils', link: 'casa/cucina/index.html' },
            { name: 'Soggiorno', icon: 'fa-couch', link: 'casa/soggiorno/index.html' },
            { name: 'Bagno', icon: 'fa-bath', link: 'casa/bagno/index.html' },
            { name: 'Camera', icon: 'fa-bed', link: 'casa/camera/index.html' },
            { name: 'Pulizia', icon: 'fa-broom', link: 'casa/pulizia/index.html' }
        ],
        elettronica: [
            { name: 'RAM', icon: 'fa-memory', link: 'elettronica/index.html#ram' },
            { name: 'GPU', icon: 'fa-microchip', link: 'elettronica/index.html#gpu' },
            { name: 'SSD', icon: 'fa-hdd', link: 'elettronica/index.html#ssd' },
            { name: 'CPU', icon: 'fa-server', link: 'elettronica/index.html#cpu' }
        ],
        animali: [
            { name: 'Gatti', icon: 'fa-cat', link: 'animali/index.html#gatti' },
            { name: 'Cani', icon: 'fa-dog', link: 'animali/index.html#cani' }
        ],
        alcol: [
            { name: 'Rum', icon: 'fa-wine-bottle', link: 'alcol/index.html#rum' },
            { name: 'Whisky', icon: 'fa-glass-whiskey', link: 'alcol/index.html#whisky' },
            { name: 'Vodka', icon: 'fa-glass-cheers', link: 'alcol/index.html#vodka' }
        ]
    };

    // Apri navigazione
    openBtn.addEventListener('click', function() {
        splitNav.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    // Chiudi navigazione
    function closeNav() {
        splitNav.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset sottocategorie
        setTimeout(() => {
            subcategoriesContainer.innerHTML = '<p class="text-muted">Seleziona una categoria</p>';
            categoryItems.forEach(item => item.classList.remove('active'));
        }, 500);
    }

    closeBtn.addEventListener('click', closeNav);
    overlay.addEventListener('click', closeNav);

    // Chiudi con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && splitNav.classList.contains('active')) {
            closeNav();
        }
    });

    // Click su categoria
    categoryItems.forEach(item => {
        item.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Rimuovi active da tutti
            categoryItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            // Mostra sottocategorie
            const subcategories = subcategoriesData[category] || [];
            subcategoriesContainer.innerHTML = '';

            subcategories.forEach((sub, index) => {
                const subItem = document.createElement('a');
                subItem.className = 'split-subcategory-item';
                subItem.href = sub.link;
                subItem.style.transitionDelay = `${index * 0.1}s`;
                subItem.innerHTML = `
                    <i class="fas ${sub.icon}"></i>
                    <span>${sub.name}</span>
                `;
                subcategoriesContainer.appendChild(subItem);
            });
        });
    });
}

