import '@testing-library/jest-dom';

// Mock IntersectionObserver which is not implemented in jsdom but used by framer-motion
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};
