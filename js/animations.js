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
});
