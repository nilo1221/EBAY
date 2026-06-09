/* ========== SMART CHOICES AI ASSISTANT - JS ISOLATO ========== */
/* Namespace: SmartChoicesAI */
/* Version: 2.0.0 - Bottone Flottante */
/* Last Updated: 2024-06-07 */

// ========== NAMESPACE ISOLATO ==========
(function() {
    'use strict';
    
    // Verifica che il namespace non esista già
    if (window.SmartChoicesAI) {
        console.warn('SmartChoicesAI già caricato - versione:', window.SmartChoicesAI.version);
        return;
    }
    
    // Creazione namespace isolato
    window.SmartChoicesAI = {
        version: '2.0.0',
        lastUpdated: '2024-06-07',
        isInitialized: false,
        
        // Configurazione
        config: {
            cssPrefix: 'sc-ai-',
            debugMode: false
        },
        
        // Stato interno
        state: {
            modalOpen: false,
            nichesData: null,
            combosData: null,
            pathDepth: 0,
            currentPageProducts: [],
            selectedMacroCategory: null,
            comboTimer: null,
            proactiveTimer: null
        },
        
        // ========== FUNZIONE DI INIZIALIZZAZIONE ==========
        init: function() {
            try {
                if (this.isInitialized) {
                    this.log('Già inizializzato');
                    return;
                }
                
                this.log('Inizializzazione SmartChoicesAI v' + this.version);
                
                // Calcola profondità directory corrente
                this.calculatePathDepth();
                
                // Inizializza tracking Analytics
                this.initAnalytics();
                
                // Carica prodotti dalla pagina corrente
                this.loadPageProducts();
                
                // Genera contenuto banner sidebar combo
                this.generateSidebarComboContent();
                
                // Crea bottone flottante
                this.createFloatButton();
                
                // Crea modal
                this.createModal();
                
                // Crea toast
                this.createToast();
                
                // Mostra toast dopo 3 secondi
                setTimeout(() => {
                    this.showToast();
                }, 3000);
                
                // Carica dati
                this.loadNiches();
                this.loadCombos();
                
                // Inizializza event listeners
                this.initEventListeners();
                
                // Inizializza timer aiuto proattivo
                this.initProactiveHelp();
                
                // Avvia timer combo periodiche
                this.startComboTimer();
                
                this.isInitialized = true;
                this.log('Inizializzazione completata');
                
            } catch (error) {
                this.error('Errore inizializzazione:', error);
                this.hideAllComponents();
            }
        },
        
        // ========== CALCOLA PROFONDITÀ PERCORSO ==========
        calculatePathDepth: function() {
            let path = window.location.pathname;
            
            // Rimuovi filename se presente (es. /lifestyle/viaggi-vacanze/index.html)
            if (path.includes('.html')) {
                path = path.substring(0, path.lastIndexOf('/'));
            }
            
            // Assicurati che il percorso finisca con /
            if (!path.endsWith('/')) {
                path += '/';
            }
            
            // Conta gli slash (es. /lifestyle/viaggi-vacanze/ = 3 slash → depth 2)
            const depth = (path.match(/\//g) || []).length - 1;
            this.state.pathDepth = depth;
            this.log('Percorso:', path, 'Profondità:', depth);
        },
        
        // ========== GET PERCORSO RELATIVO ALLA ROOT ==========
        getRootPath: function() {
            if (this.state.pathDepth === 0) {
                return ''; // Root
            } else if (this.state.pathDepth === 1) {
                return '../'; // 1 livello (es. tech/)
            } else if (this.state.pathDepth === 2) {
                return '../../'; // 2 livelli (es. benessere/fitness-casa/)
            } else {
                return Array(this.state.pathDepth).fill('../').join('');
            }
        },
        
        // ========== INIZIALIZZA ANALYTICS ==========
        initAnalytics: function() {
            // Verifica se gtag è disponibile (caricato dalle pagine)
            if (typeof gtag === 'function') {
                this.log('Google Analytics disponibile');
                this.state.analyticsEnabled = true;
                
                // Traccia inizializzazione bot
                this.trackEvent('bot_initialized', {
                    page: window.location.pathname,
                    version: this.version
                });
            } else {
                this.log('Google Analytics non disponibile');
                this.state.analyticsEnabled = false;
            }
        },
        
        // ========== TRACCIA EVENTO ANALYTICS ==========
        trackEvent: function(eventName, parameters) {
            if (this.state.analyticsEnabled && typeof gtag === 'function') {
                try {
                    gtag('event', eventName, parameters);
                    this.log('Analytics event:', eventName, parameters);
                } catch (error) {
                    this.error('Errore tracking evento:', error);
                }
            }
        },
        
        // ========== TRACCIA CLICK NICCHIA ==========
        trackNicheClick: function(nicheId, nicheName, nicheUrl) {
            // Traccia evento
            this.trackEvent('bot_niche_clicked', {
                niche_id: nicheId,
                niche_name: nicheName,
                page: window.location.pathname
            });
            
            // Correggi il percorso per navigazione corretta
            const correctedUrl = this.getCorrectedPath(nicheUrl);
            
            // Naviga alla nicchia
            window.location.href = correctedUrl;
        },
        
        // ========== CREAZIONE BOTTONE FLOTTANTE ==========
        createFloatButton: function() {
            const button = document.createElement('button');
            button.className = this.config.cssPrefix + 'float-button';
            button.setAttribute('aria-label', 'Apri assistente IA');
            button.innerHTML = '<i class="fas fa-fire ' + this.config.cssPrefix + 'float-icon"></i>';
            document.body.appendChild(button);
            
            this.state.floatButton = button;
        },
        
        // ========== CREAZIONE MODAL ==========
        createModal: function() {
            const modal = document.createElement('div');
            modal.className = this.config.cssPrefix + 'modal-container';
            const rootPath = this.getRootPath();
            modal.innerHTML = `
                <div class="${this.config.cssPrefix}modal-content">
                    <div class="${this.config.cssPrefix}modal-header">
                        <span class="${this.config.cssPrefix}modal-title">
                            <div class="${this.config.cssPrefix}phoenix-logo">
                                <img src="${rootPath}images/logo.png" alt="Smart Choices Logo">
                            </div>
                            Smart Choices AI
                        </span>
                        <button class="${this.config.cssPrefix}close-button" aria-label="Chiudi">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="${this.config.cssPrefix}modal-body">
                        <div class="${this.config.cssPrefix}loading">
                            <div class="${this.config.cssPrefix}spinner"></div>
                            Caricamento...
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            this.state.modal = modal;
        },
        
        // ========== CREAZIONE TOAST ==========
        createToast: function() {
            const toast = document.createElement('div');
            toast.className = this.config.cssPrefix + 'toast';
            toast.innerHTML = `
                <i class="fas fa-fire ${this.config.cssPrefix}toast-icon"></i>
                <div class="${this.config.cssPrefix}toast-content">
                    <div class="${this.config.cssPrefix}toast-title">Ciao!</div>
                    <div class="${this.config.cssPrefix}toast-message">Ti posso aiutare?</div>
                </div>
                <button class="${this.config.cssPrefix}toast-close" aria-label="Chiudi">
                    <i class="fas fa-times"></i>
                </button>
            `;
            document.body.appendChild(toast);
            
            this.state.toast = toast;
        },
        
        // ========== CARICAMENTO DATI NICCHIE ==========
        loadNiches: function() {
            try {
                const categoriesPath = this.getRootPath() + 'data/categories.json';
                this.log('Caricamento nicchie da:', categoriesPath);
                
                fetch(categoriesPath)
                    .then(response => response.json())
                    .then(data => {
                        this.state.nichesData = data.categories;
                        this.log('Nicchie caricate:', this.state.nichesData.length);
                        
                        // Tracking GA4
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'niches_loaded', {
                                count: this.state.nichesData.length,
                                path: categoriesPath
                            });
                        }
                    })
                    .catch(error => {
                        this.error('Errore caricamento nicchie:', error);
                        this.state.nichesData = this.getDefaultNiches();
                    });
            } catch (error) {
                this.error('Errore fetch nicchie:', error);
                this.state.nichesData = this.getDefaultNiches();
            }
        },
        
        // ========== ESTRAZIONE MACRO-CATEGORIE UNICHE ==========
        getMacroCategories: function() {
            if (!this.state.nichesData) {
                return [];
            }
            
            // Estrai macro-categorie uniche
            const macroCategories = new Set();
            this.state.nichesData.forEach(category => {
                if (category.macroCategory) {
                    macroCategories.add(category.macroCategory);
                }
            });
            
            // Converti in array e mappa con icone
            const macroCategoryMap = {
                'moda': { name: 'Moda', icon: 'fa-tshirt' },
                'tech': { name: 'Tech', icon: 'fa-laptop' },
                'casa': { name: 'Casa', icon: 'fa-home' },
                'benessere': { name: 'Benessere', icon: 'fa-heart' },
                'lifestyle': { name: 'Lifestyle', icon: 'fa-umbrella-beach' },
                'intrattenimento': { name: 'Intrattenimento', icon: 'fa-film' }
            };
            
            return Array.from(macroCategories).map(macro => ({
                id: macro,
                name: macroCategoryMap[macro]?.name || macro,
                icon: macroCategoryMap[macro]?.icon || 'fa-folder'
            }));
        },
        
        // ========== CARICAMENTO DATI COMBO ==========
        loadCombos: function() {
            try {
                const combosPath = this.getRootPath() + 'ai-assistant/product-combos.json';
                this.log('Caricamento combo da:', combosPath);
                
                fetch(combosPath)
                    .then(response => response.json())
                    .then(data => {
                        // Salva le combo dalla nuova struttura
                        this.state.combosData = data.combos || data;
                        this.log('Combo caricate:', Object.keys(this.state.combosData).length);
                        
                        // Log metadata se disponibili
                        if (data._metadata) {
                            this.log('Combo metadata:', data._metadata);
                        }
                        
                        // Tracking GA4
                        if (typeof gtag !== 'undefined') {
                            gtag('event', 'combos_loaded', {
                                count: Object.keys(this.state.combosData).length,
                                path: combosPath
                            });
                        }
                    })
                    .catch(error => {
                        this.error('Errore caricamento combo:', error);
                        this.state.combosData = this.getDefaultCombos();
                    });
            } catch (error) {
                this.error('Errore fetch combo:', error);
                this.state.combosData = this.getDefaultCombos();
            }
        },
        
        // ========== CARICAMENTO PRODOTTI DALLA PAGINA ==========
        loadPageProducts: function() {
            try {
                // Cerca tutti i link Amazon nella pagina
                const amazonLinks = document.querySelectorAll('a[href*="amazon.it"]');
                const products = [];
                
                amazonLinks.forEach(link => {
                    const linkText = link.textContent.trim();
                    // Evita link vuoti o duplicati
                    if (linkText && linkText !== 'Vedi su Amazon' && linkText !== 'Acquista su Amazon') {
                        // Estrai il nome del prodotto dal testo vicino al link
                        const card = link.closest('.product-card, .guida-scelta-product');
                        if (card) {
                            const titleElement = card.querySelector('h3, h4, h5, .product-title, .guida-scelta-product-title');
                            if (titleElement) {
                                const productName = titleElement.textContent.trim();
                                const href = link.href;
                                
                                // Verifica che il link abbia il tag affiliate
                                if (href.includes('tag=l0c39-21')) {
                                    products.push({
                                        name: productName,
                                        link: href
                                    });
                                }
                            }
                        }
                    }
                });
                
                this.state.currentPageProducts = products;
                this.log('Prodotti caricati dalla pagina:', products.length);
                
            } catch (error) {
                this.error('Errore caricamento prodotti pagina:', error);
                this.state.currentPageProducts = [];
            }
        },
        
        // ========== EVENT LISTENERS ==========
        initEventListeners: function() {
            try {
                // Click bottone flottante
                this.state.floatButton.addEventListener('click', () => {
                    this.openModal();
                });
                
                // Click close button
                this.state.modal.querySelector('.' + this.config.cssPrefix + 'close-button').addEventListener('click', () => {
                    this.closeModal();
                });
                
                // Click toast per aprire modal
                this.state.toast.addEventListener('click', () => {
                    this.hideToast();
                    this.openModal();
                });
                
                // Click toast close
                this.state.toast.querySelector('.' + this.config.cssPrefix + 'toast-close').addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.hideToast();
                });
                
                // ESC per chiudere
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.state.modalOpen) {
                        this.closeModal();
                    }
                });
                
                this.log('Event listeners inizializzati');
            } catch (error) {
                this.error('Errore inizializzazione event listeners:', error);
            }
        },
        
        // ========== APERTURA MODAL ==========
        openModal: function() {
            try {
                this.state.modalOpen = true;
                this.state.modal.classList.add(this.config.cssPrefix + 'open');
                
                // Nascondi toast se aperto
                this.hideToast();
                
                // Traccia apertura modal
                this.trackEvent('bot_modal_opened', {
                    page: window.location.pathname
                });
                
                // Genera contenuto
                this.generateModalContent();
                
                // Avvia timer combo periodiche (30-60 secondi)
                this.startComboTimer();
                
            } catch (error) {
                this.error('Errore apertura modal:', error);
            }
        },
        
        // ========== CHIUSURA MODAL ==========
        closeModal: function() {
            try {
                this.state.modalOpen = false;
                this.state.modal.classList.remove(this.config.cssPrefix + 'open');
                
                // Ferma timer combo periodiche
                this.stopComboTimer();
                
                // Traccia chiusura modal
                this.trackEvent('bot_modal_closed', {
                    page: window.location.pathname
                });
            } catch (error) {
                this.error('Errore chiusura modal:', error);
            }
        },
        
        // ========== MOSTRA TOAST ==========
        showToast: function() {
            try {
                this.state.toast.classList.add(this.config.cssPrefix + 'show');
            } catch (error) {
                this.error('Errore mostra toast:', error);
            }
        },
        
        // ========== NASCONDI TOAST ==========
        hideToast: function() {
            try {
                this.state.toast.classList.remove(this.config.cssPrefix + 'show');
            } catch (error) {
                this.error('Errore nascondi toast:', error);
            }
        },
        
        // ========== GENERAZIONE CONTENUTO WIDGET COMBO ==========
        generateSidebarComboContent: function() {
            try {
                const widgetContent = document.getElementById('combo-widget-content');
                if (!widgetContent) {
                    this.log('Elemento widget combo non trovato');
                    return;
                }

                // Simula caricamento
                setTimeout(() => {
                    const combo = this.getThemedCombo();
                    if (combo) {
                        widgetContent.innerHTML = combo;
                    }
                    this.log('Contenuto widget combo generato');
                }, 500);
            } catch (error) {
                this.error('Errore generazione contenuto sidebar combo:', error);
            }
        },
        
        // ========== GENERAZIONE CONTENUTO MODAL ==========
        generateModalContent: function() {
            try {
                const body = this.state.modal.querySelector('.' + this.config.cssPrefix + 'modal-body');
                body.innerHTML = `
                    <div class="${this.config.cssPrefix}loading">
                        <div class="${this.config.cssPrefix}spinner"></div>
                        Caricamento...
                    </div>
                `;
                
                // Simula caricamento
                setTimeout(() => {
                    const greeting = this.getGreeting();
                    const niches = this.getSuggestedNiches();
                    const combo = this.getThemedCombo();
                    
                    body.innerHTML = `
                        ${greeting}
                        ${niches}
                        ${combo}
                        ${this.getMusicLinks()}
                        ${this.getBountyLink()}
                    `;
                }, 500);
                
            } catch (error) {
                this.error('Errore generazione contenuto:', error);
                this.showError('Errore nel caricamento del contenuto');
            }
        },
        
        // ========== SALUTO ORARIO ==========
        getGreeting: function() {
            const hour = new Date().getHours();
            let greeting = '';
            
            if (hour >= 5 && hour < 12) {
                greeting = 'Buongiorno.';
            } else if (hour >= 12 && hour < 18) {
                greeting = 'Buon pomeriggio.';
            } else {
                greeting = 'Buonasera.';
            }
            
            return `
                <div class="${this.config.cssPrefix}greeting">
                    <strong>${greeting}</strong><br>
                    Cosa ti serve oggi? Ho selezionato il meglio per la tua categoria.
                </div>
            `;
        },
        
        // ========== SUGGERIMENTO MACRO-CATEGORIE ==========
        getSuggestedNiches: function() {
            // Se nessuna macro-categoria è selezionata, mostra le macro-categorie
            if (!this.state.selectedMacroCategory) {
                return this.getMacroCategoriesSection();
            }
            
            // Se una macro-categoria è selezionata, mostra le nicchie di quella categoria
            return this.getNichesByMacroCategory(this.state.selectedMacroCategory);
        },
        
        // ========== SEZIONE MACRO-CATEGORIE ==========
        getMacroCategoriesSection: function() {
            const macroCategories = this.getMacroCategories();
            
            if (macroCategories.length === 0) {
                return '';
            }
            
            const macroHTML = macroCategories.map(macro => `
                <div class="${this.config.cssPrefix}niche-card" onclick="SmartChoicesAI.selectMacroCategory('${macro.id}')">
                    <div class="${this.config.cssPrefix}niche-name">
                        <i class="fas ${macro.icon}"></i>
                        ${macro.name}
                    </div>
                </div>
            `).join('');
            
            return `
                <div class="${this.config.cssPrefix}niches-section">
                    <div class="${this.config.cssPrefix}section-title">
                        <i class="fas fa-th-large"></i>
                        Categorie
                    </div>
                    ${macroHTML}
                </div>
            `;
        },
        
        // ========== SELEZIONE MACRO-CATEGORIA ==========
        selectMacroCategory: function(macroCategoryId) {
            this.state.selectedMacroCategory = macroCategoryId;
            this.regenerateContent();
        },
        
        // ========== NICCHIE PER MACRO-CATEGORIA ==========
        getNichesByMacroCategory: function(macroCategoryId) {
            if (!this.state.nichesData || this.state.nichesData.length === 0) {
                return '';
            }
            
            const rootPath = this.getRootPath();
            
            // Filtra le nicchie per la macro-categoria selezionata
            const filteredNiches = this.state.nichesData.filter(niche => 
                niche.macroCategory === macroCategoryId
            );
            
            if (filteredNiches.length === 0) {
                return '';
            }
            
            const nichesHTML = filteredNiches.map(niche => {
                const fullPath = this.state.pathDepth === 0 ? niche.url : rootPath + niche.url;
                return `
                <div class="${this.config.cssPrefix}niche-card" onclick="SmartChoicesAI.selectNiche('${niche.id}', '${niche.name}', '${fullPath}')">
                    <div class="${this.config.cssPrefix}niche-name">
                        <i class="fas ${niche.icon}"></i>
                        ${niche.name}
                    </div>
                    <div class="${this.config.cssPrefix}niche-description">${niche.description}</div>
                </div>
            `}).join('');
            
            return `
                <div class="${this.config.cssPrefix}niches-section">
                    <div class="${this.config.cssPrefix}section-title">
                        <i class="fas fa-arrow-left" onclick="SmartChoicesAI.backToCategories()" style="cursor: pointer; margin-right: 10px;"></i>
                        Nicchie
                    </div>
                    ${nichesHTML}
                </div>
            `;
        },
        
        // ========== TORNA INDIETRO ALLE CATEGORIE ==========
        backToCategories: function() {
            this.state.selectedMacroCategory = null;
            this.regenerateContent();
        },
        
        // ========== SELEZIONE NICCHIA ==========
        selectNiche: function(nicheId, nicheName, nicheUrl) {
            // Trova la nicchia nei dati
            const niche = this.state.nichesData.find(n => n.id === nicheId);
            if (!niche) {
                return;
            }
            
            // Correggi il percorso per navigazione corretta
            const correctedUrl = this.getCorrectedPath(nicheUrl);
            
            // Mostra i link della nicchia
            this.showNicheLinks(niche, correctedUrl);
        },
        
        // ========== GET CORRECTED PATH ==========
        getCorrectedPath: function(relativePath) {
            const rootPath = this.getRootPath();
            // Rimuovi slash iniziale se presente nel percorso relativo
            const cleanPath = relativePath.startsWith('/') ? relativePath.substring(1) : relativePath;
            return rootPath + cleanPath;
        },
        
        // ========== RIGENERA CONTENUTO ==========
        regenerateContent: function() {
            const body = this.state.modal.querySelector('.' + this.config.cssPrefix + 'modal-body');
            if (!body) {
                return;
            }
            
            const greeting = this.getGreeting();
            const niches = this.getSuggestedNiches();
            const combo = this.getRandomCombo();
            
            body.innerHTML = `
                ${greeting}
                ${niches}
                ${combo}
                ${this.getMusicLinks()}
                ${this.getBountyLink()}
            `;
        },
        
        // ========== MOSTRA LINK NICCHIA ==========
        showNicheLinks: function(niche, nicheUrl) {
            const body = this.state.modal.querySelector('.' + this.config.cssPrefix + 'modal-body');
            if (!body) {
                return;
            }
            
            // Genera link contestuali
            let contextualLinks = '';
            
            // Link Spotify
            if (niche.song && niche.songLinkSpotify) {
                contextualLinks += `
                    <div class="${this.config.cssPrefix}niche-link-card">
                        <a href="${niche.songLinkSpotify}" target="_blank" class="${this.config.cssPrefix}niche-link-btn" style="background: linear-gradient(135deg, #1DB954 0%, #1ed760 100%);">
                            <i class="fab fa-spotify"></i>
                            Ascolta: ${niche.song}
                        </a>
                    </div>
                `;
            }
            
            // Link Amazon (contestuale al tipo di servizio)
            if (niche.amazonServiceLink) {
                const amazonServiceIcon = this.getAmazonServiceIcon(niche.amazonServiceType);
                const amazonServiceName = this.getAmazonServiceName(niche.amazonServiceType);
                contextualLinks += `
                    <div class="${this.config.cssPrefix}niche-link-card">
                        <a href="${niche.amazonServiceLink}" target="_blank" class="${this.config.cssPrefix}niche-link-btn" style="background: linear-gradient(135deg, #ff9900 0%, #ffad33 100%);">
                            <i class="${amazonServiceIcon}"></i>
                            ${amazonServiceName}
                        </a>
                    </div>
                `;
            }
            
            const linksHTML = `
                <div class="${this.config.cssPrefix}niche-links-section">
                    <div class="${this.config.cssPrefix}section-title">
                        <i class="fas fa-link"></i>
                        Link per ${niche.name}
                    </div>
                    <div class="${this.config.cssPrefix}niche-link-card">
                        <a href="${nicheUrl}" target="_blank" class="${this.config.cssPrefix}niche-link-btn">
                            <i class="fas fa-external-link-alt"></i>
                            Vedi ${niche.name}
                        </a>
                    </div>
                    ${contextualLinks}
                    <div class="${this.config.cssPrefix}back-btn" onclick="SmartChoicesAI.backToCategories()">
                        <i class="fas fa-arrow-left"></i>
                        Torna alle categorie
                    </div>
                </div>
            `;
            
            // Genera Pitch se la nicchia ha selling_point
            const pitchHTML = this.renderPitch(niche);
            
            // Combo dinamica (se presente)
            const combo = this.getThemedCombo();
            
            body.innerHTML = `
                ${this.getGreeting()}
                ${pitchHTML}
                ${linksHTML}
                ${combo}
            `;
        },
        
        // ========== RENDER PITCH ==========
        renderPitch: function(niche) {
            // Se la nicchia non ha selling_point, non mostrare il Pitch
            if (!niche.selling_point || niche.selling_point.length === 0) {
                return '';
            }
            
            // Genera lista di selling points
            const sellingPointsHTML = niche.selling_point.map(point => `
                <div class="${this.config.cssPrefix}pitch-point">
                    <i class="fas fa-check"></i>
                    ${point}
                </div>
            `).join('');
            
            // Genera social proof se presente
            const socialProofHTML = niche.social_proof ? `
                <div class="${this.config.cssPrefix}pitch-social-proof">
                    <i class="fas fa-users"></i>
                    ${niche.social_proof}
                </div>
            ` : '';
            
            // Genera bottone CTA
            const ctaHTML = `
                <a href="${niche.url}" target="_blank" class="${this.config.cssPrefix}pitch-cta">
                    VEDI LA SELEZIONE SU AMAZON
                </a>
            `;
            
            // Applica colore dinamico alla card
            const nicheColor = niche.color || '#667eea';
            const cardStyle = `border-left: 4px solid ${nicheColor};`;
            
            return `
                <div class="${this.config.cssPrefix}pitch-card" style="${cardStyle}">
                    <div class="${this.config.cssPrefix}pitch-header">
                        <i class="fas fa-bullseye"></i>
                        Consiglio dell'esperto
                    </div>
                    ${socialProofHTML}
                    <div class="${this.config.cssPrefix}pitch-points">
                        ${sellingPointsHTML}
                    </div>
                    ${ctaHTML}
                </div>
            `;
        },
        
        // ========== GET AMAZON SERVICE ICON ==========
        getAmazonServiceIcon: function(serviceType) {
            const icons = {
                'music': 'fab fa-amazon',
                'prime-video': 'fab fa-amazon',
                'kindle': 'fab fa-amazon',
                'audible': 'fab fa-amazon',
                'prime-student': 'fab fa-amazon',
                'wedding': 'fab fa-amazon',
                'baby-registry': 'fab fa-amazon'
            };
            return icons[serviceType] || 'fab fa-amazon';
        },
        
        // ========== GET AMAZON SERVICE NAME ==========
        getAmazonServiceName: function(serviceType) {
            const names = {
                'music': 'Amazon Music Unlimited',
                'prime-video': 'Prime Video',
                'kindle': 'Kindle Unlimited',
                'audible': 'Audible',
                'prime-student': 'Prime Student',
                'wedding': 'Amazon Wedding',
                'baby-registry': 'Amazon Baby Registry'
            };
            return names[serviceType] || 'Amazon';
        },
        
        // ========== COMBO DINAMICA DAI PRODOTTI DELLA PAGINA ==========
        // ========== GET COMBO TEMATICA ==========
        getThemedCombo: function() {
            // Usa i prodotti caricati dalla pagina corrente
            if (!this.state.currentPageProducts || this.state.currentPageProducts.length === 0) {
                return '';
            }
            
            // Identifica la nicchia corrente dal pathname
            const currentPath = window.location.pathname;
            const currentNiche = this.state.nichesData?.find(n => currentPath.includes(n.url));
            
            // Se la nicchia non ha combos, usa fallback random
            if (!currentNiche || !currentNiche.combos || currentNiche.combos.length === 0) {
                return this.getRandomCombo();
            }
            
            // Seleziona una combo casuale tra quelle definite
            const selectedCombo = currentNiche.combos[Math.floor(Math.random() * currentNiche.combos.length)];
            
            // Tracking GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'combo_themed_view', {
                    niche_id: currentNiche.id,
                    niche_name: currentNiche.name,
                    combo_id: selectedCombo.id,
                    combo_theme: selectedCombo.nome_tema
                });
            }
            
            // Mappa product_ids ai prodotti reali dalla pagina
            const selectedProducts = selectedCombo.product_ids.map(id => {
                // Per ora, usiamo i prodotti dalla pagina in ordine
                // In futuro, quando avremo product_ids reali, mapperemo correttamente
                const index = parseInt(id.replace('prod_', '')) - 1;
                return this.state.currentPageProducts[index] || this.state.currentPageProducts[0];
            }).filter(p => p);
            
            if (selectedProducts.length === 0) {
                return this.getRandomCombo();
            }
            
            // Aggiungi jolly (bevanda o snack)
            const jollies = [
                { name: 'Acqua', icon: 'fa-tint' },
                { name: 'Tè', icon: 'fa-mug-hot' },
                { name: 'Caffè', icon: 'fa-coffee' },
                { name: 'Snack', icon: 'fa-cookie' },
                { name: 'Frutta', icon: 'fa-apple-alt' }
            ];
            const jolly = jollies[Math.floor(Math.random() * jollies.length)];
            
            // Genera HTML per i prodotti selezionati con selling point
            const itemsHTML = selectedProducts.map(product => {
                const sellingPoint = currentNiche?.selling_point?.[Math.floor(Math.random() * (currentNiche.selling_point?.length || 1))] || '';
                return `
                <span class="${this.config.cssPrefix}combo-item">
                    <i class="fas fa-box"></i>
                    ${product.name}
                    ${sellingPoint ? `<small class="${this.config.cssPrefix}selling-point">${sellingPoint}</small>` : ''}
                </span>
            `}).join('');
            
            const jollyHTML = `
                <span class="${this.config.cssPrefix}combo-item jolly">
                    <i class="fas ${jolly.icon}"></i>
                    ${jolly.name} (Jolly)
                </span>
            `;
            
            // Social proof
            const socialProofHTML = currentNiche?.social_proof ? `
                <div class="${this.config.cssPrefix}social-proof">
                    <i class="fas fa-users"></i>
                    ${currentNiche.social_proof}
                </div>
            ` : '';
            
            // Urgency message specifico della combo
            const urgencyHTML = `
                <div class="${this.config.cssPrefix}urgency-message">
                    <i class="fas fa-clock"></i>
                    ${selectedCombo.urgency_message}
                </div>
            `;
            
            return `
                <div class="${this.config.cssPrefix}combo-section">
                    <div class="${this.config.cssPrefix}combo-card">
                        <div class="${this.config.cssPrefix}combo-title">
                            <i class="fas fa-boxes"></i>
                            ${selectedCombo.nome_tema}
                        </div>
                        ${socialProofHTML}
                        <div class="${this.config.cssPrefix}combo-items">
                            ${itemsHTML}
                            ${jollyHTML}
                        </div>
                        ${urgencyHTML}
                    </div>
                </div>
            `;
        },
        
        // ========== GET COMBO CON PRIORITÀ 80/20 ==========
        getComboWithPriority: function() {
            // 80% nicchia corrente, 20% cross-nicchia
            const useCurrentNiche = Math.random() < 0.8;
            
            if (useCurrentNiche) {
                return this.getThemedCombo();
            } else {
                return this.getCrossNicheCombo();
            }
        },
        
        // ========== GET CROSS NICHE COMBO ==========
        getCrossNicheCombo: function() {
            // Usa i prodotti caricati dalla pagina corrente
            if (!this.state.currentPageProducts || this.state.currentPageProducts.length === 0) {
                return '';
            }
            
            // Identifica la nicchia corrente
            const currentPath = window.location.pathname;
            const currentNiche = this.state.nichesData?.find(n => currentPath.includes(n.url));
            
            // Seleziona una nicchia diversa dalla corrente
            const otherNiches = this.state.nichesData?.filter(n => n.id !== currentNiche?.id) || [];
            if (otherNiches.length === 0) {
                return this.getThemedCombo();
            }
            
            const randomNiche = otherNiches[Math.floor(Math.random() * otherNiches.length)];
            
            // Se la nicchia selezionata non ha combos, usa fallback random
            if (!randomNiche.combos || randomNiche.combos.length === 0) {
                return this.getRandomCombo();
            }
            
            // Seleziona una combo casuale dalla nicchia cross
            const selectedCombo = randomNiche.combos[Math.floor(Math.random() * randomNiche.combos.length)];
            
            // Tracking GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'combo_cross_niche_view', {
                    current_niche_id: currentNiche?.id || 'unknown',
                    current_niche_name: currentNiche?.name || 'unknown',
                    cross_niche_id: randomNiche.id,
                    cross_niche_name: randomNiche.name,
                    combo_id: selectedCombo.id,
                    combo_theme: selectedCombo.nome_tema
                });
            }
            
            // Usa prodotti della pagina corrente (per semplicità)
            const shuffled = [...this.state.currentPageProducts].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffled.slice(0, Math.min(3, shuffled.length));
            
            if (selectedProducts.length === 0) {
                return this.getRandomCombo();
            }
            
            // Aggiungi jolly
            const jollies = [
                { name: 'Acqua', icon: 'fa-tint' },
                { name: 'Tè', icon: 'fa-mug-hot' },
                { name: 'Caffè', icon: 'fa-coffee' },
                { name: 'Snack', icon: 'fa-cookie' },
                { name: 'Frutta', icon: 'fa-apple-alt' }
            ];
            const jolly = jollies[Math.floor(Math.random() * jollies.length)];
            
            // Genera HTML
            const itemsHTML = selectedProducts.map(product => {
                const sellingPoint = randomNiche?.selling_point?.[Math.floor(Math.random() * (randomNiche.selling_point?.length || 1))] || '';
                return `
                <span class="${this.config.cssPrefix}combo-item">
                    <i class="fas fa-box"></i>
                    ${product.name}
                    ${sellingPoint ? `<small class="${this.config.cssPrefix}selling-point">${sellingPoint}</small>` : ''}
                </span>
            `}).join('');
            
            const jollyHTML = `
                <span class="${this.config.cssPrefix}combo-item jolly">
                    <i class="fas ${jolly.icon}"></i>
                    ${jolly.name} (Jolly)
                </span>
            `;
            
            const socialProofHTML = randomNiche?.social_proof ? `
                <div class="${this.config.cssPrefix}social-proof">
                    <i class="fas fa-users"></i>
                    ${randomNiche.social_proof}
                </div>
            ` : '';
            
            const urgencyHTML = `
                <div class="${this.config.cssPrefix}urgency-message">
                    <i class="fas fa-clock"></i>
                    ${selectedCombo.urgency_message}
                </div>
            `;
            
            return `
                <div class="${this.config.cssPrefix}combo-section">
                    <div class="${this.config.cssPrefix}combo-card">
                        <div class="${this.config.cssPrefix}combo-title">
                            <i class="fas fa-boxes"></i>
                            ${selectedCombo.nome_tema}
                            <small style="color: #667eea; margin-left: 10px;">(${randomNiche.name})</small>
                        </div>
                        ${socialProofHTML}
                        <div class="${this.config.cssPrefix}combo-items">
                            ${itemsHTML}
                            ${jollyHTML}
                        </div>
                        ${urgencyHTML}
                    </div>
                </div>
            `;
        },
        
        // ========== START COMBO TIMER ==========
        startComboTimer: function() {
            // Ferma timer esistente se presente
            this.stopComboTimer();
            
            // Avvia nuovo timer (30-60 secondi)
            const interval = 30000 + Math.random() * 30000; // 30-60 secondi
            
            this.state.comboTimer = setInterval(() => {
                this.addNewCombo();
            }, interval);
            
            this.log('Timer combo avviato:', Math.round(interval / 1000), 'secondi');
        },
        
        // ========== STOP COMBO TIMER ==========
        stopComboTimer: function() {
            if (this.state.comboTimer) {
                clearInterval(this.state.comboTimer);
                this.state.comboTimer = null;
                this.log('Timer combo fermato');
            }
        },
        
        // ========== ADD NEW COMBO ==========
        addNewCombo: function() {
            try {
                const widgetContent = document.getElementById('combo-widget-content');
                if (!widgetContent) {
                    return;
                }

                // Genera nuova combo con priorità 80/20
                const combo = this.getComboWithPriority();

                if (combo) {
                    // Sostituisci combo esistente (widget: una combo alla volta)
                    widgetContent.innerHTML = combo;
                    widgetContent.style.animation = 'fadeIn 0.5s ease';
                    
                    this.log('Nuova combo aggiunta al sidebar');
                }
            } catch (error) {
                this.error('Errore aggiunta combo:', error);
            }
        },
        
        // ========== GET RANDOM COMBO (FALLBACK) ==========
        getRandomCombo: function() {
            // Usa i prodotti caricati dalla pagina corrente
            if (!this.state.currentPageProducts || this.state.currentPageProducts.length === 0) {
                return '';
            }
            
            // Identifica la nicchia corrente dal pathname
            const currentPath = window.location.pathname;
            const currentNiche = this.state.nichesData?.find(n => currentPath.includes(n.url));
            
            // Tracking GA4
            if (typeof gtag !== 'undefined') {
                gtag('event', 'combo_random_view', {
                    niche_id: currentNiche?.id || 'unknown',
                    niche_name: currentNiche?.name || 'unknown'
                });
            }
            
            // Seleziona 3 prodotti casuali dalla pagina
            const shuffled = [...this.state.currentPageProducts].sort(() => 0.5 - Math.random());
            const selectedProducts = shuffled.slice(0, Math.min(3, shuffled.length));
            
            if (selectedProducts.length === 0) {
                return '';
            }
            
            // Aggiungi jolly (bevanda o snack)
            const jollies = [
                { name: 'Acqua', icon: 'fa-tint' },
                { name: 'Tè', icon: 'fa-mug-hot' },
                { name: 'Caffè', icon: 'fa-coffee' },
                { name: 'Snack', icon: 'fa-cookie' },
                { name: 'Frutta', icon: 'fa-apple-alt' }
            ];
            const jolly = jollies[Math.floor(Math.random() * jollies.length)];
            
            // Genera HTML per i prodotti selezionati con selling point
            const itemsHTML = selectedProducts.map(product => {
                const sellingPoint = currentNiche?.selling_point?.[Math.floor(Math.random() * (currentNiche.selling_point?.length || 1))] || '';
                return `
                <span class="${this.config.cssPrefix}combo-item">
                    <i class="fas fa-box"></i>
                    ${product.name}
                    ${sellingPoint ? `<small class="${this.config.cssPrefix}selling-point">${sellingPoint}</small>` : ''}
                </span>
            `}).join('');
            
            const jollyHTML = `
                <span class="${this.config.cssPrefix}combo-item jolly">
                    <i class="fas ${jolly.icon}"></i>
                    ${jolly.name} (Jolly)
                </span>
            `;
            
            // Social proof
            const socialProofHTML = currentNiche?.social_proof ? `
                <div class="${this.config.cssPrefix}social-proof">
                    <i class="fas fa-users"></i>
                    ${currentNiche.social_proof}
                </div>
            ` : '';
            
            // Urgency message
            const urgencyHTML = `
                <div class="${this.config.cssPrefix}urgency-message">
                    <i class="fas fa-clock"></i>
                    La combinazione preferita dagli utenti oggi.
                </div>
            `;
            
            return `
                <div class="${this.config.cssPrefix}combo-section">
                    <div class="${this.config.cssPrefix}combo-card">
                        <div class="${this.config.cssPrefix}combo-title">
                            <i class="fas fa-boxes"></i>
                            Combo del Momento
                        </div>
                        ${socialProofHTML}
                        <div class="${this.config.cssPrefix}combo-items">
                            ${itemsHTML}
                            ${jollyHTML}
                        </div>
                        ${urgencyHTML}
                    </div>
                </div>
            `;
        },
        
        // ========== LINK MUSICA ==========
        getMusicLinks: function() {
            return `
                <div class="${this.config.cssPrefix}music-section">
                    <div class="${this.config.cssPrefix}section-title">
                        <i class="fas fa-music"></i>
                        Ascolta mentre acquisti
                    </div>
                    <div class="${this.config.cssPrefix}music-links">
                        <a href="https://open.spotify.com" target="_blank" class="${this.config.cssPrefix}music-link spotify">
                            <i class="fab fa-spotify"></i>
                            Spotify
                        </a>
                        <a href="https://music.amazon.it" target="_blank" class="${this.config.cssPrefix}music-link amazon-music">
                            <i class="fab fa-amazon"></i>
                            Amazon Music
                        </a>
                    </div>
                </div>
            `;
        },
        
        // ========== LINK BOUNTY ==========
        getBountyLink: function() {
            return `
                <div class="${this.config.cssPrefix}bounty-section">
                    <a href="bounty.html" class="${this.config.cssPrefix}bounty-link" target="_blank">
                        <i class="fas fa-gift"></i>
                        Scopri i Servizi Amazon
                    </a>
                </div>
            `;
        },
        
        // ========== SHOW ERROR ==========
        showError: function(message) {
            const body = this.state.modal.querySelector('.' + this.config.cssPrefix + 'modal-body');
            if (body) {
                body.innerHTML = `
                    <div class="${this.config.cssPrefix}error">
                        <i class="fas fa-exclamation-triangle"></i>
                        ${message}
                    </div>
                `;
            }
        },
        
        // ========== HIDE ALL COMPONENTS ==========
        hideAllComponents: function() {
            if (this.state.floatButton) this.state.floatButton.style.display = 'none';
            if (this.state.modal) this.state.modal.style.display = 'none';
            if (this.state.toast) this.state.toast.style.display = 'none';
        },
        
        // ========== AIUTO PROATTIVO ==========
        initProactiveHelp: function() {
            let inactiveTime = 0;
            const INACTIVE_THRESHOLD = 30; // secondi
            
            // Reset timer quando l'utente interagisce
            const resetInactiveTimer = () => {
                inactiveTime = 0;
            };
            
            // Reset timer su click o scroll
            document.addEventListener('click', resetInactiveTimer);
            document.addEventListener('scroll', resetInactiveTimer);
            document.addEventListener('keydown', resetInactiveTimer);
            
            // Reset timer quando modal è aperto
            this.state.modal.addEventListener('click', resetInactiveTimer);
            
            // Timer che controlla l'inattività ogni secondo
            setInterval(() => {
                if (!this.state.modalOpen) {
                    inactiveTime++;
                    
                    if (inactiveTime === INACTIVE_THRESHOLD) {
                        this.showProactiveHelp();
                    }
                } else {
                    inactiveTime = 0;
                }
            }, 1000);
        },
        
        showProactiveHelp: function() {
            const message = "Il catalogo è vasto, ma la scelta migliore è sotto i tuoi occhi. Ti serve un consiglio su quale prodotto chiude meglio la tua selezione?";
            
            this.state.toast.querySelector(`.${this.config.cssPrefix}toast-message`).textContent = message;
            this.showToast();
        },
        
        // ========== DEFAULT NICHES ==========
        getDefaultNiches: function() {
            return [
                { name: 'Fitness Casa', icon: 'fa-dumbbell', description: 'Allenati a casa', url: 'benessere/fitness-casa/index.html' },
                { name: 'Cucina Moderna', icon: 'fa-fire-burner', description: 'Elettrodomestici smart', url: 'casa/cucina-elettrodomestici/index.html' },
                { name: 'Ventilatori', icon: 'fa-wind', description: 'Raffreddamento per la casa', url: 'casa/ventilatori/index.html' },
                { name: 'Tech Gadgets', icon: 'fa-microchip', description: 'Ultima tecnologia', url: 'tech/gadget-tech/index.html' }
            ];
        },
        
        // ========== DEFAULT COMBOS ==========
        getDefaultCombos: function() {
            return {
                'default': {
                    products: [
                        { name: 'Prodotto 1', icon: 'fa-box' },
                        { name: 'Prodotto 2', icon: 'fa-box' }
                    ]
                }
            };
        },
        
        // ========== LOG ==========
        log: function(message, data) {
            if (this.config.debugMode) {
                console.log('[SmartChoicesAI]', message, data || '');
            }
        },
        
        // ========== ERROR ==========
        error: function(message, error) {
            console.error('[SmartChoicesAI ERROR]', message, error);
        }
    };
    
    // Auto-inizializzazione quando DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            window.SmartChoicesAI.init();
        });
    } else {
        window.SmartChoicesAI.init();
    }
    
})();
