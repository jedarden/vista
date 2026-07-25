/**
 * Shared Theme Switcher Module
 * Provides synchronous theme switching across all platform frames
 * with persistent state storage
 */

(function(window) {
  'use strict';

  let currentTheme = 'dark';
  const THEME_STORAGE_KEY = 'vista-theme';

  /**
   * Initialize the theme system
   * @param {string[]} frameIds - Array of frame element IDs to update
   */
  function initializeTheme(frameIds = []) {
    // Load saved theme preference
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme) {
      currentTheme = savedTheme;
    } else {
      // Use system preference as default
      currentTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    // Apply initial theme
    applyTheme(currentTheme, frameIds);

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      if (!localStorage.getItem(THEME_STORAGE_KEY)) {
        currentTheme = e.matches ? 'dark' : 'light';
        applyTheme(currentTheme, frameIds);
      }
    });
  }

  /**
   * Apply theme to document and frames
   * @param {string} theme - 'dark' or 'light'
   * @param {string[]} frameIds - Array of frame element IDs to update
   */
  function applyTheme(theme, frameIds = []) {
    // Update document attribute
    document.documentElement.setAttribute('data-theme', theme);

    // Update all frame elements
    frameIds.forEach(frameId => {
      const frame = document.getElementById(frameId);
      if (frame) {
        if (theme === 'light') {
          frame.classList.add('light-theme');
        } else {
          frame.classList.remove('light-theme');
        }
      }
    });

    // Dispatch custom event for other components to listen
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme } }));
  }

  /**
   * Toggle between dark and light themes
   * @param {string[]} frameIds - Array of frame element IDs to update
   * @returns {string} The new theme
   */
  function toggleTheme(frameIds = []) {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Save preference
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);

    // Apply theme
    applyTheme(currentTheme, frameIds);

    return currentTheme;
  }

  /**
   * Set a specific theme
   * @param {string} theme - 'dark' or 'light'
   * @param {string[]} frameIds - Array of frame element IDs to update
   */
  function setTheme(theme, frameIds = []) {
    if (theme !== 'dark' && theme !== 'light') {
      console.warn('Invalid theme specified. Use "dark" or "light".');
      return;
    }

    currentTheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    applyTheme(currentTheme, frameIds);
  }

  /**
   * Get the current theme
   * @returns {string} The current theme ('dark' or 'light')
   */
  function getCurrentTheme() {
    return currentTheme;
  }

  /**
   * Clear saved theme preference (revert to system preference)
   * @param {string[]} frameIds - Array of frame element IDs to update
   */
  function clearThemePreference(frameIds = []) {
    localStorage.removeItem(THEME_STORAGE_KEY);

    // Revert to system preference
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    currentTheme = systemTheme;
    applyTheme(currentTheme, frameIds);
  }

  // Export API
  window.ThemeSwitcher = {
    initialize: initializeTheme,
    toggle: toggleTheme,
    set: setTheme,
    get: getCurrentTheme,
    clear: clearThemePreference,
    apply: applyTheme
  };

  // Auto-initialize with common frame IDs if data attribute exists
  document.addEventListener('DOMContentLoaded', () => {
    const autoInit = document.documentElement.getAttribute('data-theme-auto-init');
    if (autoInit !== 'false') {
      const frameIdsAttr = document.documentElement.getAttribute('data-theme-frame-ids');
      const frameIds = frameIdsAttr ? frameIdsAttr.split(',').map(id => id.trim()) : [];
      initializeTheme(frameIds);
    }
  });

})(window);
