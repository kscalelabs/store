interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: any): void;
      prompt(callback: (notification: any) => void): void;
    };
  };
}

interface Window {
  google: GoogleIdentity;
}
