import { render } from 'preact';
import App from './App.jsx';
import '../styles.css';

// Einfaches, zuverlässiges Auto-Update
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onOfflineReady() {
    console.log('✅ Beobachtungsprotokoll ist offline-fähig');
  },
  // onNeedRefresh wird bewusst nicht verwendet → automatisches Update
});

render(<App />, document.getElementById('app'));