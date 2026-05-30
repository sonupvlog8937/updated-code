/**
 * Header System - Global Index
 * Export all header components and context
 */

export { default as GlobalHeader } from './GlobalHeader';
export { default as HeaderMain } from './HeaderMain';
export { default as MobileNav } from './MobileNav';
export { default as Navigation } from './Navigation';
export { default as CategoryPanel } from './CategoryPanel';
export { default as QuickMenu } from './QuickMenu';

// Context & Hooks
export { 
  GlobalHeaderProvider, 
  useGlobalHeader,
  type GlobalHeaderContextType 
} from './GlobalHeaderContext';

// Default export for backward compatibility
export { default } from './GlobalHeader';
