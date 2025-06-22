const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');

async function scrapeGlassons() {
    const url = 'https://www.glassons.com/new-arrivals';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const items = [];

        $('.product-tile').each((i, el) => {
            if (i < 10) { // Limit to 10 items for this example
                const product = $(el);
                const name = product.find('.product-tile__name').text().trim();
                const priceText = product.find('.product-tile__price').text().trim();
                const productUrl = 'https://www.glassons.com' + product.find('.product-tile__image-link').attr('href');
                const imageUrl = product.find('.product-tile__image').attr('src');
                
                if (name && priceText && productUrl && imageUrl) {
                    items.push({
                        id: uuidv4(),
                        name,
                        brand: 'Glassons',
                        price: parseFloat(priceText.replace('$', '')),
                        purchaseUrl: productUrl,
                        imageUrl: `https:${imageUrl}`,
                        category: 'tops', // Placeholder category
                        color: 'unknown', // Placeholder color
                        description: 'Scraped from Glassons New Arrivals.',
                        materials: [],
                        tags: ['new-arrival', 'glassons'],
                        retailer: { id: 'glassons', name: 'Glassons' },
                    });
                }
            }
        });

        return items;
    } catch (error) {
        console.error('Error scraping Glassons:', error);
        return []; // Return empty array on error
    }
}

module.exports = { scrapeGlassons }; 