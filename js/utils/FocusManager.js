/**
 * FocusManager - Helper for managing keyboard focus for accessibility
 * Handles focus saving/restoring and focus trapping for modals.
 */
export const FocusManager = {
    focusStack: [],
    trapStack: [],
    trapElement: null,
    _boundHandleTrapKey: null,

    /**
     * Stores the currently focused element to restore it later
     */
    saveFocus() {
        if (document.activeElement) {
            this.focusStack.push(document.activeElement);
        }
    },

    /**
     * Restores focus to the previously saved element
     */
    restoreFocus() {
        const element = this.focusStack.pop();
        if (element && document.body.contains(element)) {
            element.focus();
        }
    },

    /**
     * Moves focus to the first focusable element inside a container
     * @param {HTMLElement|string} container - The container element or its ID
     */
    focusFirst(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const focusable = this.getFocusableElements(el);

        if (focusable.length > 0) {
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
     * Helper to get all focusable elements within a container
     * @param {HTMLElement} container
     * @returns {HTMLElement[]}
     */
    getFocusableElements(container) {
        if (!container) return [];
        return Array.from(container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )).filter(el => !el.hasAttribute('disabled') && !el.getAttribute('aria-hidden'));
    },

    /**
     * Traps focus within a container.
     * Supports nested traps via a stack.
     * @param {HTMLElement|string} container - The container to trap focus in
     */
    trapFocus(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        // Ensure we have a bound handler (created once)
        if (!this._boundHandleTrapKey) {
            this._boundHandleTrapKey = this._handleTrapKey.bind(this);
        }

        // Add to stack
        this.trapStack.push(el);
        this.updateTrapState();

        // Initial focus
        this.focusFirst(el);
    },

    /**
     * Releases the current focus trap.
     * If there was a previous trap (nested), it restores that one.
     */
    releaseTrap() {
        this.trapStack.pop();
        this.updateTrapState();
    },

    /**
     * Internal method to manage the event listener based on stack state
     */
    updateTrapState() {
        // Always remove first to avoid duplicates
        if (this._boundHandleTrapKey) {
            document.removeEventListener('keydown', this._boundHandleTrapKey);
        }

        if (this.trapStack.length > 0) {
            this.trapElement = this.trapStack[this.trapStack.length - 1];
            document.addEventListener('keydown', this._boundHandleTrapKey);
        } else {
            this.trapElement = null;
        }
    },

    /**
     * Keydown handler to keep focus within the active trap element
     */
    _handleTrapKey(e) {
        if (e.key !== 'Tab' || !this.trapElement) return;

        const focusable = this.getFocusableElements(this.trapElement);
        if (focusable.length === 0) {
            e.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
            // Shift + Tab: Wrap from first to last
            if (document.activeElement === first) {
                e.preventDefault();
                last.focus();
            }
        } else {
            // Tab: Wrap from last to first
            if (document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        }
    }
};
