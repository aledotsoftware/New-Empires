/**
 * FocusManager - Helper for managing keyboard focus for accessibility
 */
export const FocusManager = {
    previousActiveElement: null,

    /**
     * Stores the currently focused element to restore it later
     */
    saveFocus() {
        this.previousActiveElement = document.activeElement;
    },

    /**
     * Restores focus to the previously saved element
     */
    restoreFocus() {
        if (this.previousActiveElement && document.body.contains(this.previousActiveElement)) {
            this.previousActiveElement.focus();
        }
        this.previousActiveElement = null;
    },

    /**
     * Moves focus to the first focusable element inside a container
     * @param {HTMLElement|string} container - The container element or its ID
     */
    focusFirst(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        // Find focusable elements
        const focusable = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');

        if (focusable.length > 0) {
            // Check for a close button or similar primary action to focus first, or just the first element
            // Prioritize elements with 'autofocus' if any
            const autofocus = el.querySelector('[autofocus]');
            if (autofocus) {
                autofocus.focus();
            } else {
                focusable[0].focus();
            }
        } else {
            // If no focusable elements, focus the container itself if it has tabindex
            if (el.hasAttribute('tabindex')) {
                el.focus();
            }
        }
    },

    /**
     * Traps focus within a container (simple implementation for now)
     * Note: Full focus trap requires event listeners, this just sets initial focus
     */
    trapFocus(containerId) {
        this.saveFocus();
        this.focusFirst(containerId);
    }
};
