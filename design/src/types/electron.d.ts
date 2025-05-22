interface IpcRenderer {
  send(channel: string, ...args: any[]): void;
  on(channel: string, func: (...args: any[]) => void): void;
  once(channel: string, func: (...args: any[]) => void): void;
  removeListener(channel: string, func: (...args: any[]) => void): void;
}

interface Electron {
  ipcRenderer: IpcRenderer;
}

declare global {
  interface Window {
    electron?: Electron;
  }
}

export {}; 