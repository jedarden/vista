/**
 * TypeScript Definitions for Theme Subscription Utility
 */

/**
 * Theme mode values
 */
export type ThemeMode = 'dark' | 'light';

/**
 * Callback function type for theme change notifications
 * @param theme - The new theme value
 */
export type ThemeChangeCallback = (theme: ThemeMode) => void;

/**
 * Subscriber ID type (opaque string)
 */
export type SubscriberId = string;

/**
 * Unsubscribe function type
 */
export type UnsubscribeFunction = () => void;

/**
 * Theme Subscription Utility API
 *
 * Provides subscribe/unsubscribe interface for platform frame components
 * to receive and react to theme changes.
 */
export interface ThemeSubscriptionAPI {
  /**
   * Subscribe to theme changes
   * @param callback - Function to call when theme changes
   * @returns Subscriber ID (use this ID to unsubscribe)
   */
  subscribe(callback: ThemeChangeCallback): SubscriberId;

  /**
   * Unsubscribe from theme changes
   * @param subscriberId - The subscriber ID returned from subscribe()
   * @returns True if subscriber was found and removed, false otherwise
   */
  unsubscribe(subscriberId: SubscriberId): boolean;

  /**
   * Get the current theme value
   * @returns Current theme ('dark' or 'light')
   */
  getCurrentTheme(): ThemeMode;

  /**
   * Apply theme to a platform frame element
   * Updates CSS classes and CSS variables for the platform
   *
   * @param frameElement - The frame DOM element
   * @param platform - Platform ID (e.g., 'twitter', 'facebook')
   * @param theme - Theme ('dark' or 'light')
   */
  applyThemeToFrame(frameElement: HTMLElement, platform: string, theme: ThemeMode): void;

  /**
   * Create a theme subscription for a specific platform frame
   * This is a convenience function that combines subscription with theme application
   *
   * @param platform - Platform ID (e.g., 'twitter', 'facebook')
   * @param frameId - The DOM element ID of the frame
   * @returns Unsubscribe function
   */
  subscribePlatformFrame(platform: string, frameId: string): UnsubscribeFunction;

  /**
   * Number of active subscribers (readonly)
   */
  readonly subscriberCount: number;
}

/**
 * Global ThemeSubscription utility instance
 */
declare const ThemeSubscription: ThemeSubscriptionAPI;

// Browser global
declare global {
  interface Window {
    ThemeSubscription: ThemeSubscriptionAPI;
  }
}

export default ThemeSubscription;
