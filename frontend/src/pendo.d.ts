interface PendoVisitor {
  id: string;
}

interface PendoAccount {
  id: string;
}

interface Pendo {
  initialize: (options: {
    visitor: PendoVisitor;
    account?: PendoAccount;
  }) => void;
  pageLoad: () => void;
}

declare global {
  interface Window {
    pendo: Pendo;
  }
}

export {};
