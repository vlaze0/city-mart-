const fs = require('fs');

const css = `
/* Premium City Selector */
.city-selector {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    background: #ffffff;
    padding: 8px 14px;
    border-radius: 8px;
    font-size: 0.95em;
    font-weight: 600;
    color: #333;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    transition: all 0.2s ease;
    margin-left: 10px;
}
.city-selector:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    border-color: #d0d0d0;
    background: #fafafa;
}
#current-city-display {
    white-space: nowrap;
}
`;

fs.appendFileSync('styles.css', css);
console.log('CSS Appended Successfully!');
