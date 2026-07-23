/**
 * Image Diff Overlay Component
 *
 * Provides side-by-side and onion-skin comparison functionality
 * for comparing platform screenshots or DOM elements from URL A and URL B.
 */

(function() {
  'use strict';

  /**
   * Create an image diff overlay component
   * @param {Object} options - Configuration options
   * @param {string|HTMLElement} options.before - URL of "before" image or HTML element
   * @param {string|HTMLElement} options.after - URL of "after" image or HTML element
   * @param {string} options.platformId - Platform ID for labeling
   * @param {string} options.platformName - Platform name for display
   * @param {string} options.mode - Comparison mode: 'overlay' (default), 'side-by-side', or 'slider'
   * @param {number} options.initialPosition - Initial slider position (0-100, default: 50)
   * @returns {HTMLElement} The container element with the diff component
   */
  function createImageDiff(options) {
    const {
      before = '',
      after = '',
      platformId = '',
      platformName = '',
      mode = 'overlay',
      initialPosition = 50
    } = options;

    // Validate required parameters
    if (!before && !after) {
      console.warn('createImageDiff requires before and after parameters');
      return null;
    }

    // Determine if inputs are DOM elements or URLs
    const isBeforeElement = before instanceof HTMLElement;
    const isAfterElement = after instanceof HTMLElement;

    // Create container
    const container = document.createElement('div');
    container.className = 'image-diff-container';
    container.dataset.platformId = platformId;

    // Create header
    const header = document.createElement('div');
    header.className = 'image-diff-header';
    header.innerHTML = `
      <span class="image-diff-title">${escHtml(platformName)} Visual Comparison</span>
      <div class="image-diff-controls">
        <button class="image-diff-toggle active" data-mode="overlay" title="Onion-skin overlay">Overlay</button>
        <button class="image-diff-toggle" data-mode="side-by-side" title="Side-by-side">Side-by-Side</button>
        <button class="image-diff-toggle" data-mode="slider" title="Slider comparison">Slider</button>
      </div>
    `;
    container.appendChild(header);

    // Create comparison wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'image-diff-wrapper';

    // Create overlay/slider view
    const overlayView = createOverlayView(before, after, initialPosition, isBeforeElement, isAfterElement);
    wrapper.appendChild(overlayView);

    // Create side-by-side view (hidden by default)
    const sideBySideView = createSideBySideView(before, after, isBeforeElement, isAfterElement);
    sideBySideView.classList.add('hidden');
    wrapper.appendChild(sideBySideView);

    container.appendChild(wrapper);

    // Add event listeners for mode toggles
    const toggles = header.querySelectorAll('.image-diff-toggle');
    toggles.forEach(toggle => {
      toggle.addEventListener('click', () => {
        const selectedMode = toggle.dataset.mode;

        // Update active state
        toggles.forEach(t => t.classList.remove('active'));
        toggle.classList.add('active');

        // Show/hide views
        if (selectedMode === 'side-by-side') {
          overlayView.classList.add('hidden');
          sideBySideView.classList.remove('hidden');
        } else if (selectedMode === 'slider') {
          overlayView.classList.remove('hidden');
          overlayView.classList.add('slider-mode');
          overlayView.classList.remove('overlay-mode');
        } else {
          overlayView.classList.remove('hidden');
          overlayView.classList.remove('slider-mode');
          overlayView.classList.add('overlay-mode');
        }
      });
    });

    return container;
  }

  /**
   * Create overlay/slider view
   */
  function createOverlayView(before, after, initialPosition, isBeforeElement, isAfterElement) {
    const view = document.createElement('div');
    view.className = 'image-diff-overlay overlay-mode';

    // Create slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'image-diff-slider-container';

    // Before content (bottom layer)
    const beforeContent = isBeforeElement
      ? cloneElement(before)
      : createImgElement(before);

    beforeContent.className = 'image-diff-before';
    sliderContainer.appendChild(beforeContent);

    // After content (top layer, clipped)
    const afterContent = isAfterElement
      ? cloneElement(after)
      : createImgElement(after);

    afterContent.className = 'image-diff-after';
    afterContent.style.clipPath = `inset(0 ${100 - initialPosition}% 0 0)`;
    sliderContainer.appendChild(afterContent);

    // Slider handle
    const slider = document.createElement('div');
    slider.className = 'image-diff-slider';
    slider.style.left = initialPosition + '%';

    const sliderHandle = document.createElement('div');
    sliderHandle.className = 'image-diff-slider-handle';
    sliderHandle.innerHTML = '<span class="slider-icon">&harr;</span>';
    slider.appendChild(sliderHandle);

    sliderContainer.appendChild(slider);
    view.appendChild(sliderContainer);

    // Add slider interaction
    let isDragging = false;

    const updateSlider = (clientX) => {
      const rect = sliderContainer.getBoundingClientRect();
      let position = ((clientX - rect.left) / rect.width) * 100;
      position = Math.max(0, Math.min(100, position));

      slider.style.left = position + '%';
      afterContent.style.clipPath = `inset(0 ${100 - position}% 0 0)`;
    };

    const startDrag = (e) => {
      isDragging = true;
      e.preventDefault();
      slider.classList.add('active');
      sliderContainer.style.cursor = 'grabbing';
    };

    const onDrag = (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updateSlider(clientX);
    };

    const endDrag = () => {
      isDragging = false;
      slider.classList.remove('active');
      sliderContainer.style.cursor = '';
    };

    // Mouse events
    sliderHandle.addEventListener('mousedown', startDrag);
    sliderContainer.addEventListener('mousedown', (e) => {
      if (e.target !== sliderHandle) {
        isDragging = true;
        updateSlider(e.clientX);
      }
    });

    // Touch events
    sliderHandle.addEventListener('touchstart', startDrag);
    sliderContainer.addEventListener('touchstart', (e) => {
      if (e.target !== sliderHandle) {
        isDragging = true;
        updateSlider(e.touches[0].clientX);
      }
    });

    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDrag, { passive: false });
    document.addEventListener('touchend', endDrag);

    // Store cleanup function
    view._cleanup = () => {
      document.removeEventListener('mousemove', onDrag);
      document.removeEventListener('mouseup', endDrag);
      document.removeEventListener('touchmove', onDrag);
      document.removeEventListener('touchend', endDrag);
    };

    return view;
  }

  /**
   * Create side-by-side view
   */
  function createSideBySideView(before, after, isBeforeElement, isAfterElement) {
    const view = document.createElement('div');
    view.className = 'image-diff-side-by-side';

    // Before content container
    const beforeContainer = document.createElement('div');
    beforeContainer.className = 'image-diff-side image-diff-side-before';
    beforeContainer.innerHTML = '<div class="image-diff-side-label">Before (URL A)</div>';

    const beforeContent = isBeforeElement
      ? cloneElement(before)
      : createImgElement(before);

    beforeContent.className = 'image-diff-side-img';
    beforeContainer.appendChild(beforeContent);

    // After content container
    const afterContainer = document.createElement('div');
    afterContainer.className = 'image-diff-side image-diff-side-after';
    afterContainer.innerHTML = '<div class="image-diff-side-label">After (URL B)</div>';

    const afterContent = isAfterElement
      ? cloneElement(after)
      : createImgElement(after);

    afterContent.className = 'image-diff-side-img';
    afterContainer.appendChild(afterContent);

    view.appendChild(beforeContainer);
    view.appendChild(afterContainer);

    return view;
  }

  /**
   * Clone a DOM element for use in comparison
   */
  function cloneElement(element) {
    const clone = element.cloneNode(true);

    // Reset loading states
    clone.classList.remove('loaded', 'error');

    // Handle images
    const imgs = clone.querySelectorAll('img');
    imgs.forEach(img => {
      img.classList.remove('loaded', 'error');
    });

    return clone;
  }

  /**
   * Create an img element from URL
   */
  function createImgElement(src) {
    const img = document.createElement('img');
    img.src = src;
    img.alt = 'Screenshot';
    img.onload = () => img.classList.add('loaded');
    img.onerror = () => img.classList.add('error');
    return img;
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Export API
  window.imageDiff = {
    create: createImageDiff
  };

  // Auto-initialize any image-diff-container elements
  document.addEventListener('DOMContentLoaded', () => {
    console.log('image-diff module loaded');
  };

})();
