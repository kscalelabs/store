declare global {
  interface SprigFunction {
    (command: string, eventName: string, data?: Record<string, unknown>): void;
  }

  interface Window {
    Sprig: SprigFunction | undefined;
  }
}

export {};
