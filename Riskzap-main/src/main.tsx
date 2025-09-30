import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getConfiguredCompanyWallet, setConfiguredCompanyWallet } from './services/web3';

// Company wallet is now hardcoded in web3.ts
// No need to initialize at runtime
try {
	const current = getConfiguredCompanyWallet();
	if (current) {
		console.log('✅ Company wallet configured:', current);
	}
} catch (e) {
	// non-fatal; ignore in environments without window/localStorage
	// eslint-disable-next-line no-console
	console.debug('runtime init failed', e);
}

createRoot(document.getElementById("root")!).render(<App />);
