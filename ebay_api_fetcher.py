#!/usr/bin/env python3
"""
eBay Product Advertising API Fetcher
Recupera prodotti eBay reali con cache locale per evitare chiamate ripetute
"""

import os
import json
import time
import base64
from datetime import datetime, timedelta
from pathlib import Path
import requests
from dotenv import load_dotenv

# Carica le variabili d'ambiente
load_dotenv()

class eBayAPIFetcher:
    def __init__(self):
        self.app_id = os.getenv('EBAY_APP_ID')
        self.dev_id = os.getenv('EBAY_DEV_ID')
        self.cert_id = os.getenv('EBAY_CERT_ID')
        self.campaign_id = os.getenv('EBAY_CAMPAIGN_ID')
        self.cache_hours = int(os.getenv('CACHE_HOURS', '24'))
        
        # Directory per i file JSON
        self.data_dir = Path('data')
        self.data_dir.mkdir(exist_ok=True)
        
        # File di cache
        self.cache_file = self.data_dir / 'ebay_products_cache.json'
        self.token_file = self.data_dir / 'ebay_token.json'
        
        # API endpoints (Sandbox per test)
        self.token_url = 'https://api.sandbox.ebay.com/identity/v1/oauth2/token'
        self.search_url = 'https://api.sandbox.ebay.com/buy/browse/v1/item_summary/search'
        
    def get_oauth_token(self):
        """Ottiene token OAuth2 per eBay API"""
        # Verifica se il token esiste ed è ancora valido
        if self.token_file.exists():
            try:
                with open(self.token_file, 'r') as f:
                    token_data = json.load(f)
                    expires_at = datetime.fromisoformat(token_data.get('expires_at', ''))
                    
                    if datetime.now() < expires_at:
                        print(f"✅ Using cached OAuth token")
                        return token_data.get('access_token')
            except:
                pass
        
        # Richiedi nuovo token
        print(f"🔑 Requesting new OAuth token...")
        
        credentials = f"{self.app_id}:{self.cert_id}"
        encoded_credentials = base64.b64encode(credentials.encode()).decode()
        
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': f'Basic {encoded_credentials}'
        }
        
        data = {
            'grant_type': 'client_credentials',
            'scope': 'https://api.ebay.com/oauth/api_scope'
        }
        
        try:
            response = requests.post(self.token_url, headers=headers, data=data)
            response.raise_for_status()
            token_data = response.json()
            
            # Salva token con scadenza (7200 secondi = 2 ore)
            token_data['expires_at'] = (datetime.now() + timedelta(seconds=7200)).isoformat()
            
            with open(self.token_file, 'w') as f:
                json.dump(token_data, f)
            
            print(f"✅ OAuth token obtained successfully")
            return token_data.get('access_token')
            
        except Exception as e:
            print(f"❌ Error getting OAuth token: {e}")
            return None
        
    def is_api_call_allowed_today(self):
        """Verifica se è permesso chiamare l'API oggi (solo alle 7:00 AM)"""
        if not self.cache_file.exists():
            return True
        
        try:
            with open(self.cache_file, 'r') as f:
                cache_data = json.load(f)
                cache_time = datetime.fromisoformat(cache_data.get('timestamp', ''))
                today = datetime.now().date()
                
                # Se la cache è di oggi, non fare nuove chiamate
                if cache_time.date() == today:
                    print(f"⏰ API already called today at {cache_time.strftime('%H:%M')}")
                    return False
                
                return True
        except:
            return True
    
    def load_from_cache(self):
        """Carica i dati dalla cache"""
        try:
            with open(self.cache_file, 'r') as f:
                cache_data = json.load(f)
                return cache_data.get('products', [])
        except:
            return []
    
    def save_to_cache(self, products):
        """Salva i dati nella cache"""
        cache_data = {
            'timestamp': datetime.now().isoformat(),
            'products': products
        }
        with open(self.cache_file, 'w') as f:
            json.dump(cache_data, f, indent=2)
    
    def fetch_products(self, category, keywords, max_results=10):
        """Recupera prodotti dal file JSON manuale"""
        
        print(f"📂 Loading products from JSON for: {category}")
        
        try:
            with open(self.data_dir / 'products.json', 'r') as f:
                all_products = json.load(f)
                
                # Mappa categorie umane a chiavi JSON
                category_map = {
                    'Furniture': 'arredamento',
                    'Dining Table': 'arredamento',
                    'Pet Supplies': 'animali',
                    'Electronics': 'elettronica',
                    'Home': 'casa'
                }
                
                json_key = category_map.get(category, category.lower())
                
                if json_key in all_products:
                    products = all_products[json_key]['products']
                    print(f"✅ Loaded {len(products)} products from JSON")
                    return products
                else:
                    print(f"⚠️  Category '{json_key}' not found in JSON")
                    return []
                    
        except Exception as e:
            print(f"❌ Error loading products from JSON: {e}")
            return []
    
    def get_category_id(self, category):
        """Mappa categorie umane a ID categorie eBay"""
        category_map = {
            'Furniture': '20679',  # Mobili
            'Dining Table': '20679',
            'Pet Supplies': '1281',  # Accessori animali
            'Electronics': '678',  # Elettronica
            'Home': '11700',  # Casa e giardino
        }
        return category_map.get(category, '')
    
    def get_price(self, item):
        """Estrae il prezzo dall'item"""
        try:
            price = item.get('price', {})
            value = price.get('value', '0')
            currency = price.get('currency', 'EUR')
            return f"{value} {currency}"
        except:
            return 'N/A'
    
    def build_affiliate_url(self, original_url):
        """Costruisce URL affiliato con parametri tracking"""
        if not original_url:
            return '#'
        
        # Aggiungi parametri affiliati
        affiliate_params = {
            'mkcid': '1',
            'mkrid': '711-53200-19255-0',
            'siteid': '0',
            'campid': self.campaign_id,
            'toolid': '20014',
            'customid': '',
            'mkevt': '1'
        }
        
        # Costruisci URL con parametri
        separator = '&' if '?' in original_url else '?'
        params_str = '&'.join([f"{k}={v}" for k, v in affiliate_params.items()])
        
        return f"{original_url}{separator}{params_str}"
    
    def get_image_url(self, item):
        """Estrae l'URL dell'immagine"""
        try:
            images = item.get('image', {})
            if isinstance(images, dict):
                return images.get('imageUrl', '')
            elif isinstance(images, list) and len(images) > 0:
                return images[0].get('imageUrl', '')
            return ''
        except:
            return ''
    
    def get_products(self, category, keywords, force_refresh=False):
        """Ottiene prodotti con controllo di 1 chiamata al giorno"""
        
        # Se forzato refresh o API permessa oggi, fetch nuovi dati
        if force_refresh or self.is_api_call_allowed_today():
            print(f"🔄 Fetching new data from API...")
            products = self.fetch_products(category, keywords)
            self.save_to_cache(products)
            return products
        else:
            print(f"✅ Using cached data (API already called today)")
            return self.load_from_cache()

def main():
    """Funzione principale per test"""
    fetcher = eBayAPIFetcher()
    
    # Esempio: fetch prodotti per arredamento con force refresh per test
    products = fetcher.get_products(
        category='Furniture',
        keywords='dining table',
        force_refresh=True  # Forza refresh per test API reale
    )
    
    print(f"\n📦 Found {len(products)} products")
    for product in products:
        print(f"  - {product['title']}: {product['price']}")

if __name__ == '__main__':
    main()
