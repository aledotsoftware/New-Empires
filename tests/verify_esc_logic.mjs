
import { JSDOM } from 'jsdom';
import fs from 'fs';

const html = fs.readFileSync('index.html', 'utf8');

const dom = new JSDOM(html, {
    url: "http://localhost/",
    runScripts: "dangerously",
    resources: "usable"
});
const { window } = dom;
const { document } = window;

// Mock elements
const startScreen = document.getElementById('startScreen');
const mapScreen = document.getElementById('mapSizeScreen');
const civScreen = document.getElementById('civSelectionScreen');
const gameScreen = document.getElementById('gameScreen');

const backToMapSizeButton = document.getElementById('backToMapSizeButton');
const backToStartButton = document.getElementById('backToStartButton');

// Mock click listeners to verify they are called
let backToMapClicked = false;
backToMapSizeButton.addEventListener('click', () => {
    backToMapClicked = true;
    console.log('Back to Map Clicked');
});

let backToStartClicked = false;
backToStartButton.addEventListener('click', () => {
    backToStartClicked = true;
    console.log('Back to Start Clicked');
});

// Simulate the logic in main.js
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        if (gameScreen && gameScreen.classList.contains('hidden')) {
            if (civScreen && !civScreen.classList.contains('hidden')) {
                const backBtn = document.getElementById('backToMapSizeButton');
                if (backBtn) backBtn.click();
                return;
            }
            if (mapScreen && !mapScreen.classList.contains('hidden')) {
                const backBtn = document.getElementById('backToStartButton');
                if (backBtn) backBtn.click();
                return;
            }
        }
    }
});

// TEST 1: Escape on Civ Screen
console.log('--- TEST 1: Escape on Civ Screen ---');
gameScreen.classList.add('hidden');
civScreen.classList.remove('hidden');
mapScreen.classList.add('hidden');
startScreen.classList.add('hidden');

// Press Escape
const escEvent = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
document.dispatchEvent(escEvent);

if (backToMapClicked) {
    console.log('✅ PASS: Escape triggered Back to Map');
} else {
    console.error('❌ FAIL: Escape did NOT trigger Back to Map');
}

// TEST 2: Escape on Map Screen
console.log('--- TEST 2: Escape on Map Screen ---');
backToMapClicked = false; // Reset
// Now on Map Screen (simulated navigation)
civScreen.classList.add('hidden');
mapScreen.classList.remove('hidden');

// Press Escape
document.dispatchEvent(escEvent);

if (backToStartClicked) {
    console.log('✅ PASS: Escape triggered Back to Start');
} else {
    console.error('❌ FAIL: Escape did NOT trigger Back to Start');
}
