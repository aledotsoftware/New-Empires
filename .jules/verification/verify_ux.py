
from playwright.sync_api import sync_playwright

def verify_ux_styles():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to index.html using the local server
        page.goto("http://localhost:8080/index.html")

        # Inject HTML to test the new styles directly
        # We create a container with examples of the new classes
        page.evaluate("""
            const container = document.createElement('div');
            container.id = 'ux-verification';
            container.style.position = 'fixed';
            container.style.top = '0';
            container.style.left = '0';
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.background = '#1a1612';
            container.style.zIndex = '99999';
            container.style.padding = '50px';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '20px';

            // 1. Loading Spinner
            const spinnerDiv = document.createElement('div');
            spinnerDiv.innerHTML = '<span class="spinner"></span> <span>Loading Spinner Test</span>';
            spinnerDiv.style.color = 'white';
            container.appendChild(spinnerDiv);

            // 2. Button Loading State
            const btnLoading = document.createElement('button');
            btnLoading.className = 'btn-start btn-loading';
            btnLoading.textContent = 'Loading Button State';
            btnLoading.style.width = '200px';
            btnLoading.style.position = 'relative'; // For spinner
            // Add spinner to button manually as per JS logic
            const btnSpinner = document.createElement('span');
            btnSpinner.className = 'spinner';
            btnLoading.prepend(btnSpinner);
            container.appendChild(btnLoading);

            // 3. Tooltip Error
            const tooltipContainer = document.createElement('div');
            tooltipContainer.className = 'btn-tooltip';
            tooltipContainer.style.position = 'relative';
            tooltipContainer.style.display = 'block';
            tooltipContainer.style.width = '200px';
            tooltipContainer.innerHTML = `
                <div class="tooltip-header">Test Action <span class="tooltip-hotkey">[Q]</span></div>
                <div class="tooltip-desc">Description of action</div>
                <div class="tooltip-error">❌ Error: Missing Resources</div>
            `;
            container.appendChild(tooltipContainer);

            // 4. Build Warning
            const buildOption = document.createElement('div');
            buildOption.className = 'build-option';
            buildOption.style.width = '120px';
            buildOption.style.border = '2px solid #c53030';
            buildOption.innerHTML = `
                <div class="build-name" style="color:#c53030">House</div>
                <div class="build-warning">⚠️ Faltan recursos</div>
            `;
            container.appendChild(buildOption);

            // 5. Cursor Badge (Simulated)
            const cursorContainer = document.createElement('div');
            cursorContainer.style.position = 'relative';
            cursorContainer.style.width = '50px';
            cursorContainer.style.height = '50px';
            cursorContainer.style.border = '1px dashed white';
            const badge = document.createElement('img');
            badge.className = 'cursor-badge';
            badge.src = 'assets/icons/swords.png';
            badge.style.display = 'block';
            cursorContainer.appendChild(badge);
            container.appendChild(cursorContainer);

            document.body.appendChild(container);
        """)

        # Wait a bit for animations
        page.wait_for_timeout(1000)

        # Screenshot
        page.screenshot(path=".jules/verification/ux_styles.png")

        browser.close()

if __name__ == "__main__":
    verify_ux_styles()
