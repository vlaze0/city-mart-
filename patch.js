const fs = require('fs');
const path = require('path');

const scriptPath = path.join(__dirname, '..', 'c:\\Users\\DMC\\Desktop\\citymart\\script.js');
let content = fs.readFileSync('c:\\Users\\DMC\\Desktop\\citymart\\script.js', 'utf8');

// 1. Prepend City Logic
const cityLogic = `
// --- City Selection Logic ---
let selectedCity = localStorage.getItem('citymart_user_city') || 'Global';

function initCitySelection() {
    const displays = document.querySelectorAll('#current-city-display');
    displays.forEach(d => {
        d.textContent = selectedCity === 'Global' ? '🌍 Global' : selectedCity;
    });
}

function openCityModal() {
    const modal = document.getElementById('city-modal');
    if (modal) modal.style.display = 'block';
}

function closeCityModal() {
    const modal = document.getElementById('city-modal');
    if (modal) modal.style.display = 'none';
}

function selectCity(city) {
    selectedCity = city;
    localStorage.setItem('citymart_user_city', city);
    initCitySelection();
    closeCityModal();
    if (window.location.pathname.includes('products.html')) {
        window.location.reload();
    } else if (typeof fetchProducts === 'function') {
        window.location.reload(); 
    }
}

function filterCities() {
    const input = document.getElementById('city-search');
    if (!input) return;
    const filter = input.value.toUpperCase();
    const ul = document.getElementById('city-list');
    if (!ul) return;
    const li = ul.getElementsByTagName('li');
    for (let i = 0; i < li.length; i++) {
        const txtValue = li[i].textContent || li[i].innerText;
        if (txtValue.toUpperCase().indexOf(filter) > -1) {
            li[i].style.display = '';
        } else {
            li[i].style.display = 'none';
        }
    }
}

document.addEventListener('DOMContentLoaded', initCitySelection);
// -----------------------------

`;

if (!content.includes('initCitySelection')) {
    content = cityLogic + content;
}

// 2. Patch updateAuthUI
content = content.replace(/if \(nameInput\) \{([\s\S]*?)nameInput\.required = authMode === 'signup';\s*\}/g, `if (nameInput) {
        nameInput.style.display = authMode === 'signup' ? 'block' : 'none';
        nameInput.required = authMode === 'signup';
    }
    const cityContainer = document.getElementById('login-city-container');
    const cityInput = document.getElementById('login-city');
    if (cityContainer) {
        cityContainer.style.display = authMode === 'signup' ? 'block' : 'none';
    }
    if (cityInput) {
        cityInput.required = authMode === 'signup' && loginContext === 'vendor';
    }`);

// 3. Patch handleSignupFlow
content = content.replace(/body: JSON\.stringify\(\{ username, email, password, role \}\),/g, `body: JSON.stringify({ username, email, password, role, city: (document.getElementById('login-city') ? document.getElementById('login-city').value : '') }),`);

fs.writeFileSync('c:\\Users\\DMC\\Desktop\\citymart\\script.js', content);
console.log('script.js patched successfully');
