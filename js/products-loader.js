/**
 * Caricatore prodotti dinamici da JSON
 * Carica prodotti dal file data/products.json e li renderizza nelle pagine
 */

class ProductsLoader {
    constructor() {
        this.productsData = null;
        this.cacheFile = 'data/ebay_products_cache.json';
    }

    async loadProducts() {
        try {
            // Prima prova a caricare dalla cache
            const cached = await this.loadFromCache();
            if (cached) {
                console.log('✅ Loaded products from cache');
                this.productsData = cached;
                return cached;
            }

            // Se cache non disponibile, carica dal JSON manuale
            const response = await fetch('data/products.json');
            if (!response.ok) throw new Error('Failed to load products');
            
            this.productsData = await response.json();
            console.log('✅ Loaded products from JSON');
            return this.productsData;
        } catch (error) {
            console.error('❌ Error loading products:', error);
            return null;
        }
    }

    async loadFromCache() {
        try {
            const response = await fetch(this.cacheFile);
            if (!response.ok) return null;
            
            const cacheData = await response.json();
            const cacheTime = new Date(cacheData.timestamp);
            const now = new Date();
            const hoursDiff = (now - cacheTime) / (1000 * 60 * 60);
            
            // Cache valida per 24 ore
            if (hoursDiff < 24) {
                return cacheData.products;
            }
            return null;
        } catch {
            return null;
        }
    }

    getProductsByCategory(category) {
        if (!this.productsData) return [];
        
        const categoryMap = {
            'arredamento': 'arredamento',
            'animali': 'animali',
            'elettronica': 'elettronica',
            'casa': 'casa'
        };
        
        const key = categoryMap[category] || category;
        return this.productsData[key]?.products || [];
    }

    renderProductCard(product, container) {
        const card = document.createElement('div');
        card.className = `col-lg-4 col-md-6 ${product.featured ? '' : 'offset-lg-0 offset-md-3'}`;
        
        const badgeClass = product.badge_class || 'badge-low';
        const featuredClass = product.featured ? 'featured' : '';
        
        card.innerHTML = `
            <div class="product-card ${featuredClass}">
                <div class="text-center">
                    <i class="fas fa-table product-icon"></i>
                    ${product.tier ? `<h3 class="mb-3">${product.tier}</h3>` : ''}
                    <span class="${badgeClass} mb-3 d-inline-block">${product.badge}</span>
                </div>
                <p class="text-muted mb-4">${product.description}</p>
                <div class="text-center">
                    <a href="${product.url}" target="_blank" rel="noopener noreferrer" class="btn btn-ebay">
                        <i class="fab fa-ebay me-2"></i>${product.price ? product.price : 'Vedi su eBay'}
                    </a>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    }

    async renderCategoryProducts(category, containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error(`❌ Container not found: ${containerSelector}`);
            return;
        }

        // Carica prodotti se non già caricati
        if (!this.productsData) {
            await this.loadProducts();
        }

        const products = this.getProductsByCategory(category);
        if (products.length === 0) {
            console.warn(`⚠️  No products found for category: ${category}`);
            return;
        }

        // Svuota container
        container.innerHTML = '';

        // Renderizza prodotti
        products.forEach(product => {
            this.renderProductCard(product, container);
        });

        console.log(`✅ Rendered ${products.length} products for ${category}`);
    }
}

// Inizializza globalmente
window.ProductsLoader = ProductsLoader;

// Auto-inizializzazione per pagine specifiche
document.addEventListener('DOMContentLoaded', async () => {
    const loader = new ProductsLoader();
    
    // Rileva la pagina corrente e carica prodotti appropriati
    const path = window.location.pathname;
    
    if (path.includes('arredamento')) {
        await loader.renderCategoryProducts('arredamento', '#products-container');
    } else if (path.includes('animali')) {
        await loader.renderCategoryProducts('animali', '#products-container');
    }
});
