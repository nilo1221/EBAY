/**
 * Caricatore prodotti dinamici da JSON
 * Carica prodotti dal file data/products.json e li renderizza nelle pagine
 * Con funzionalità avanzate: filtro, ordinamento, paginazione, ricerca
 */

class ProductsLoader {
    constructor() {
        this.productsData = null;
        this.cacheFile = 'data/ebay_products_cache.json';
        this.filteredProducts = [];
        this.currentPage = 1;
        this.productsPerPage = 6;
        this.currentSort = 'default';
        this.currentCategory = 'all';
        this.searchQuery = '';
    }

    async loadProducts() {
        try {
            // Prima prova a caricare dalla cache
            const cached = await this.loadFromCache();
            if (cached) {
                console.log('✅ Loaded products from cache');
                this.productsData = cached;
                this.filteredProducts = this.getAllProducts();
                return cached;
            }

            // Se cache non disponibile, carica dal JSON manuale
            const response = await fetch('data/products.json');
            if (!response.ok) throw new Error('Failed to load products');
            
            this.productsData = await response.json();
            this.filteredProducts = this.getAllProducts();
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

    getAllProducts() {
        if (!this.productsData) return [];
        
        let allProducts = [];
        
        // Raccogli tutti i prodotti da tutte le categorie
        Object.keys(this.productsData).forEach(categoryKey => {
            const categoryData = this.productsData[categoryKey];
            if (categoryData.products) {
                categoryData.products.forEach(product => {
                    allProducts.push({
                        ...product,
                        category: categoryData.category,
                        categoryKey: categoryKey
                    });
                });
            }
        });
        
        return allProducts;
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

    // Funzionalità di ricerca
    searchProducts(query) {
        this.searchQuery = query.toLowerCase();
        this.applyFilters();
    }

    // Funzionalità di filtro per categoria
    filterByCategory(category) {
        this.currentCategory = category;
        this.applyFilters();
    }

    // Funzionalità di ordinamento
    sortProducts(sortType) {
        this.currentSort = sortType;
        this.applyFilters();
    }

    // Applica tutti i filtri
    applyFilters() {
        let products = this.getAllProducts();
        
        // Filtro ricerca
        if (this.searchQuery) {
            products = products.filter(product => 
                product.title.toLowerCase().includes(this.searchQuery) ||
                product.description.toLowerCase().includes(this.searchQuery)
            );
        }
        
        // Filtro categoria
        if (this.currentCategory !== 'all') {
            products = products.filter(product => 
                product.categoryKey === this.currentCategory
            );
        }
        
        // Ordinamento
        switch (this.currentSort) {
            case 'price-asc':
                products.sort((a, b) => this.extractPrice(a.price) - this.extractPrice(b.price));
                break;
            case 'price-desc':
                products.sort((a, b) => this.extractPrice(b.price) - this.extractPrice(a.price));
                break;
            case 'name-asc':
                products.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'name-desc':
                products.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'tier':
                const tierOrder = { 'Entry Level': 1, 'Top Quality': 2, 'High': 3 };
                products.sort((a, b) => tierOrder[a.tier] - tierOrder[b.tier]);
                break;
            default:
                // Mantieni ordine originale
                break;
        }
        
        this.filteredProducts = products;
        this.currentPage = 1; // Reset alla prima pagina dopo filtro
    }

    extractPrice(priceString) {
        if (!priceString) return 0;
        const match = priceString.match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    // Funzionalità di paginazione
    getPaginatedProducts() {
        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        return this.filteredProducts.slice(startIndex, endIndex);
    }

    getTotalPages() {
        return Math.ceil(this.filteredProducts.length / this.productsPerPage);
    }

    goToPage(page) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.renderProducts();
        }
    }

    nextPage() {
        if (this.currentPage < this.getTotalPages()) {
            this.currentPage++;
            this.renderProducts();
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderProducts();
        }
    }

    renderProductCard(product, container) {
        const card = document.createElement('div');
        card.className = `col-lg-4 col-md-6`;
        
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

    renderPagination(container) {
        const totalPages = this.getTotalPages();
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '<nav aria-label="Page navigation"><ul class="pagination justify-content-center">';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage - 1}">Previous</a>
            </li>
        `;
        
        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${this.currentPage === i ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
        }
        
        // Next button
        paginationHTML += `
            <li class="page-item ${this.currentPage === totalPages ? 'disabled' : ''}">
                <a class="page-link" href="#" data-page="${this.currentPage + 1}">Next</a>
            </li>
        `;
        
        paginationHTML += '</ul></nav>';
        container.innerHTML = paginationHTML;
        
        // Add event listeners
        container.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                this.goToPage(page);
            });
        });
    }

    renderFilters(container) {
        const categories = Object.keys(this.productsData || {});
        
        let filtersHTML = `
            <div class="filters-container mb-4">
                <div class="row g-3">
                    <!-- Search -->
                    <div class="col-md-4">
                        <div class="input-group">
                            <span class="input-group-text"><i class="fas fa-search"></i></span>
                            <input type="text" class="form-control" id="search-input" placeholder="Cerca prodotti...">
                        </div>
                    </div>
                    
                    <!-- Category Filter -->
                    <div class="col-md-3">
                        <select class="form-select" id="category-filter">
                            <option value="all">Tutte le categorie</option>
                            ${categories.map(cat => `
                                <option value="${cat}">${this.productsData[cat].category}</option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <!-- Sort -->
                    <div class="col-md-3">
                        <select class="form-select" id="sort-filter">
                            <option value="default">Ordinamento predefinito</option>
                            <option value="price-asc">Prezzo: crescente</option>
                            <option value="price-desc">Prezzo: decrescente</option>
                            <option value="name-asc">Nome: A-Z</option>
                            <option value="name-desc">Nome: Z-A</option>
                            <option value="tier">Livello (Entry/Top/High)</option>
                        </select>
                    </div>
                    
                    <!-- Reset -->
                    <div class="col-md-2">
                        <button class="btn btn-outline-secondary w-100" id="reset-filters">
                            <i class="fas fa-undo me-2"></i>Reset
                        </button>
                    </div>
                </div>
                
                <!-- Results count -->
                <div class="mt-2 text-muted">
                    <small>Mostrando ${this.filteredProducts.length} prodotti</small>
                </div>
            </div>
        `;
        
        container.innerHTML = filtersHTML;
        
        // Add event listeners
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
            this.renderProducts();
        });
        
        document.getElementById('category-filter').addEventListener('change', (e) => {
            this.filterByCategory(e.target.value);
            this.renderProducts();
        });
        
        document.getElementById('sort-filter').addEventListener('change', (e) => {
            this.sortProducts(e.target.value);
            this.renderProducts();
        });
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.currentCategory = 'all';
            this.currentSort = 'default';
            this.searchQuery = '';
            document.getElementById('search-input').value = '';
            document.getElementById('category-filter').value = 'all';
            document.getElementById('sort-filter').value = 'default';
            this.applyFilters();
            this.renderProducts();
        });
    }

    renderProducts() {
        const container = document.querySelector('#products-container');
        const paginationContainer = document.querySelector('#pagination-container');
        
        if (!container) return;
        
        // Svuota container
        container.innerHTML = '';
        
        // Renderizza prodotti paginati
        const paginatedProducts = this.getPaginatedProducts();
        paginatedProducts.forEach(product => {
            this.renderProductCard(product, container);
        });
        
        // Renderizza paginazione
        if (paginationContainer) {
            this.renderPagination(paginationContainer);
        }
        
        // Aggiorna contatore risultati
        const resultsCount = document.querySelector('#results-count');
        if (resultsCount) {
            resultsCount.textContent = `Mostrando ${paginatedProducts.length} di ${this.filteredProducts.length} prodotti`;
        }
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

        // Se categoria specifica, filtra per quella
        if (category && category !== 'all') {
            this.currentCategory = category;
            this.applyFilters();
        }

        // Renderizza filtri
        const filtersContainer = document.querySelector('#filters-container');
        if (filtersContainer) {
            this.renderFilters(filtersContainer);
        }

        // Renderizza prodotti
        this.renderProducts();

        console.log(`✅ Rendered products for ${category || 'all categories'}`);
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
    } else {
        // Home page - mostra tutte le categorie
        await loader.renderCategoryProducts('all', '#products-container');
    }
});
