// Scroll Reveal Animations using Intersection Observer
document.addEventListener('DOMContentLoaded', function() {
    // Reveal on scroll
    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));
    
    // Parallax effect for hero sections
    const heroSections = document.querySelectorAll('.hero, .elettronica-hero, .animali-hero, .casa-hero, .salotto-hero, .moda-hero, .sport-hero');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        
        heroSections.forEach(hero => {
            const speed = 0.5;
            const offset = hero.offsetTop;
            const height = hero.offsetHeight;
            
            if (scrolled > offset - window.innerHeight && scrolled < offset + height) {
                const yPos = (scrolled - offset) * speed;
                hero.style.transform = `translateY(${yPos}px)`;
            }
        });
    });
    
    // Pulse animation for trust icons
    const trustIcons = document.querySelectorAll('.trust-icon, .guide-icon');
    
    trustIcons.forEach((icon, index) => {
        icon.style.animation = `pulse 2s ease-in-out ${index * 0.2}s infinite`;
    });
    
    // Smooth scroll for anchor links
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
    
    // Typing Effect for Hero Title
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) {
        const text = heroTitle.innerText;
        heroTitle.innerHTML = '';
        let i = 0;
        
        const typeWriter = () => {
            if (i < text.length) {
                heroTitle.innerHTML += text.charAt(i);
                i++;
                setTimeout(typeWriter, 50);
            }
        };
        
        // Start typing after a short delay
        setTimeout(typeWriter, 500);
    }
    
    // Mouse Parallax Effect on Hero Section
    const heroSection = document.getElementById('heroSection');
    if (heroSection) {
        heroSection.addEventListener('mousemove', (e) => {
            const rect = heroSection.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const moveX = (x - centerX) / 50;
            const moveY = (y - centerY) / 50;
            
            const particles = heroSection.querySelector('.particles');
            if (particles) {
                particles.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
        });
    }
    
    // Scroll Indicator Click
    const scrollIndicator = document.querySelector('.scroll-indicator');
    if (scrollIndicator) {
        scrollIndicator.addEventListener('click', () => {
            const nextSection = document.querySelector('.container.my-5');
            if (nextSection) {
                nextSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    }
    
    // Staggered Reveal for Hero Elements
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .btn-glow');
    heroElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'all 0.6s ease';
        
        setTimeout(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 600 + (index * 200));
    });
});
