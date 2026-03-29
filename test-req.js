const { execSync } = require('child_process');
const fs = require('fs');
const http = require('http');

http.get('http://localhost:3000/script.js', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (!data.includes('initCitySelection')) {
            console.log("SERVER IS SERVING OLD SCRIPT!");
        } else {
            console.log("SERVER IS SERVING NEW SCRIPT!");
        }
    });
});
