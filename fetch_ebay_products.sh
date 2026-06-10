#!/bin/bash
# Script wrapper per aggiornare prodotti eBay
# Uso: ./fetch_ebay_products.sh

cd /home/lollo/eBay
python3 ebay_api_fetcher.py

echo "✅ Products updated successfully"
