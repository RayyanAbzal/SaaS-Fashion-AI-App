import requests
from bs4 import BeautifulSoup
import firebase_admin
from firebase_admin import credentials, firestore
import hashlib
import os
import time

# Path to your Firebase service account key
FIREBASE_KEY_PATH = os.path.abspath('./stylematev2-firebase-adminsdk-fbsvc-385a67ccdb.json')

# Initialize Firebase
if not firebase_admin._apps:
    cred = credentials.Certificate(FIREBASE_KEY_PATH)
    firebase_admin.initialize_app(cred)
db = firestore.client()

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

CATEGORY_KEYWORDS = {
    'tops': ['shirt', 't-shirt', 'tee', 'polo', 'knit', 'sweat', 'jumper', 'crew', 'henley', 'singlet', 'tank', 'top'],
    'bottoms': ['pant', 'pants', 'jean', 'short', 'trouser', 'chino', 'track', 'jogger', 'suit'],
    'shoes': ['shoe', 'sneaker', 'boot', 'loafer', 'slide', 'thong'],
    'outerwear': ['jacket', 'coat', 'blazer', 'overshirt', 'duffle'],
    'accessories': ['belt', 'bag', 'duffle', 'wallet', 'tie', 'sock', 'scarf', 'hat']
}

SUBCATEGORY_URLS = [
    'https://www.countryroad.co.nz/man-clothing-chinos/',
    'https://www.countryroad.co.nz/man-clothing-pants/',
    'https://www.countryroad.co.nz/man-clothing-denim-jeans/',
    'https://www.countryroad.co.nz/man-clothing-shorts/',
    'https://www.countryroad.co.nz/man-clothing-suits-tailoring/',
    'https://www.countryroad.co.nz/man-clothing-knitwear/',
    'https://www.countryroad.co.nz/man-clothing-t-shirts/',
    'https://www.countryroad.co.nz/man-clothing-polos/',
    'https://www.countryroad.co.nz/man-clothing-casual-shirts/',
    'https://www.countryroad.co.nz/man-clothing-business-shirts/',
    'https://www.countryroad.co.nz/man-clothing-jackets-coats/',
    'https://www.countryroad.co.nz/man-clothing-blazers/',
    'https://www.countryroad.co.nz/man-clothing-sweats/',
    'https://www.countryroad.co.nz/man-clothing-swimwear/',
]

def map_category(name: str) -> str:
    name_lower = name.lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in name_lower:
                return category
    return 'tops'

def save_product_to_firestore(product):
    doc_id = hashlib.md5(product['productUrl'].encode()).hexdigest()
    db.collection('retailer_products').document(doc_id).set(product, merge=True)

def scrape_page(url, page_number):
    if page_number == 1:
        page_url = url
    else:
        page_url = f'{url}?src=i&page={page_number}'
    print(f'Scraping {page_url}')
    try:
        resp = requests.get(page_url, headers=HEADERS, timeout=15)
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"Failed to fetch {page_url}: {e}")
        return 0
    soup = BeautifulSoup(resp.text, 'html.parser')
    products_found = 0
    for section in soup.find_all('section', {'data-type': 'ProductCard'}):
        try:
            name_tag = section.find(['h2', 'a'], string=True)
            name = name_tag.get_text(strip=True) if name_tag else None
            link_tag = section.find('a', href=True)
            product_url = link_tag['href'] if link_tag else None
            if product_url and not product_url.startswith('http'):
                product_url = 'https://www.countryroad.co.nz' + product_url
            img_tag = section.find('img')
            image_url = img_tag['src'] if img_tag and img_tag.has_attr('src') else None
            if image_url and not image_url.startswith('http'):
                image_url = 'https://www.countryroad.co.nz' + image_url
            price_tag = section.find('span', class_='value')
            price_text = price_tag.get_text(strip=True) if price_tag else None
            price = float(price_text.replace('NZD', '').replace('$', '').replace(',', '').strip()) if price_text else None
            category = map_category(name) if name else 'tops'
            color = '' # Placeholder
            if name and product_url and image_url and price is not None:
                product = {
                    'name': name,
                    'brand': 'Country Road',
                    'price': price,
                    'imageUrl': image_url,
                    'productUrl': product_url,
                    'category': category,
                    'color': color,
                    'retailer': {'id': 'countryroad', 'name': 'Country Road'},
                    'scrapedAt': firestore.SERVER_TIMESTAMP
                }
                save_product_to_firestore(product)
                products_found += 1
        except Exception as e:
            print(f"Error parsing product: {e}")
    print(f"Found {products_found} products on {page_url}.")
    return products_found

def main():
    total_products = 0
    for subcat_url in SUBCATEGORY_URLS:
        print(f'=== Scraping subcategory: {subcat_url} ===')
        for page_num in range(1, 8):  # Try up to 7 pages per subcategory
            num_scraped = scrape_page(subcat_url, page_num)
            if num_scraped == 0:
                print(f"No more products or failed to load page {page_num} for {subcat_url}, moving to next subcategory.")
                break
            total_products += num_scraped
            time.sleep(2)
    print(f"\nFinished scraping all subcategories. Total products saved or updated: {total_products}")

if __name__ == '__main__':
    main() 