import { ipcRenderer } from 'electron';

export default class StoreBase {

  listeners = []

  listenTo = (channel, listener) => {
    ipcRenderer.on(channel, listener);
    this.listeners.push([channel, listener]);
  }

  unlisten = () => {
    while (!this.listeners.length > 0) {
      const [channel, listener] = this.listeners.pop();
      ipcRenderer.removeListener(channel, listener);
    }
  }

  dispose = () => {
    this.unlisten();
  }
}
