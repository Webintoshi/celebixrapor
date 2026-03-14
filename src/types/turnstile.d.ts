declare global {
  interface Window {
    turnstile?: {
      render: (container: Element, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export {};
