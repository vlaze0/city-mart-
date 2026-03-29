const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', err => console.log('ERROR:', err.message));
        
        // Wait until network is idle
        await page.goto('http://localhost:3000/index.html', { waitUntil: 'networkidle0' });
        
        console.log('Page loaded successfully.');
        
        // Let's click it
        console.log('Clicking the city selector...');
        const clicked = await page.evaluate(() => {
            const el = document.querySelector('.city-selector');
            if (el) {
                el.click();
                return true;
            }
            return false;
        });
        
        console.log('Button clicked? ', clicked);
        await new Promise(r => setTimeout(r, 1000));
        
        await browser.close();
    } catch (e) {
        console.error('Script failed:', e);
    }
})();
