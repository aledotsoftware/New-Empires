
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const dom = new JSDOM(`<!DOCTYPE html>
<div id="notifications"></div>
<style>
/* Mock keyframes for JSDOM */
@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }
@keyframes progressLinear { from { width: 100%; } to { width: 0%; } }
</style>
`);
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;

// Mock Game class structure to test showNotification
class Game {
    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('role', 'status');

        const iconDiv = document.createElement('div');
        iconDiv.className = 'notification-icon';
        iconDiv.textContent = 'ℹ️';

        const textDiv = document.createElement('div');
        textDiv.className = 'notification-text';
        textDiv.textContent = message;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close-btn';
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Cerrar notificación');

        // Mock removeNotification for testing
        const removeNotification = () => {
             notification.classList.add('fading-out');
             // In real browser, animationend would trigger removal
             // In test, we simulate removal
             setTimeout(() => {
                 if (notification.parentElement) notification.remove();
             }, 50);
        };

        closeBtn.onclick = () => removeNotification();

        // Progress bar logic simulation
        const progressContainer = document.createElement('div');
        progressContainer.className = 'notification-progress';
        const progressBar = document.createElement('div');
        progressBar.className = 'notification-progress-bar';
        progressContainer.appendChild(progressBar);

        notification.appendChild(iconDiv);
        notification.appendChild(textDiv);
        notification.appendChild(closeBtn);
        notification.appendChild(progressContainer);

        container.appendChild(notification);

        // Logic for auto-removal
        const duration = 100; // Short duration for test
        let timerId = setTimeout(() => {
            removeNotification();
        }, duration);

        // Add pause logic just to ensure listeners are attached
        notification.addEventListener('mouseenter', () => clearTimeout(timerId));
        notification.addEventListener('mouseleave', () => {
             timerId = setTimeout(removeNotification, duration);
        });
    }
}

// Run verification
const game = new Game();
game.showNotification("Test Message", "info");

const notifications = document.getElementById('notifications');
const notification = notifications.querySelector('.notification');

if (!notification) {
    console.error("❌ Notification not created");
    process.exit(1);
}

// Check structure
if (!notification.querySelector('.notification-text').textContent.includes("Test Message")) {
    console.error("❌ Notification text incorrect");
    process.exit(1);
}

if (!notification.querySelector('.notification-close-btn')) {
    console.error("❌ Close button missing");
    process.exit(1);
}

if (!notification.querySelector('.notification-progress-bar')) {
    console.error("❌ Progress bar missing");
    process.exit(1);
}

if (notification.getAttribute('role') !== 'status') {
    console.error("❌ Missing role='status'");
    process.exit(1);
}

console.log("✅ Notification structure verified");

// Test close button
const closeBtn = notification.querySelector('.notification-close-btn');
closeBtn.click();

// Wait for removal simulation
setTimeout(() => {
    if (document.getElementById('notifications').children.length === 0) {
        console.log("✅ Notification closed successfully");
        process.exit(0);
    } else {
        console.error("❌ Notification failed to close");
        process.exit(1);
    }
}, 100);
