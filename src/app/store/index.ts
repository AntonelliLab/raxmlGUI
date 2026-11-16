import RunList from './RunList';

const store = new RunList();

window.store = store;
const { rendererBridge } = /** @type {any} */ ( window );
rendererBridge.provideStateReport( () => store.generateReport() );
export default store;
