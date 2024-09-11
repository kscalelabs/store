interface GoogleIdentity {
  accounts: {
    id: {
      initialize(options: any): void; // eslint-disable-line
      prompt(callback: (notification: any) => void): void; // eslint-disable-line
    };
  };
}

interface Window {
  google: GoogleIdentity;
}
