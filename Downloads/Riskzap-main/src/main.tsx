import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { getConfiguredCompanyWallet, setConfiguredCompanyWallet } from './services/web3';

// Ensure a runtime default company wallet exists so flows work in dev without
// requiring the admin settings UI to be opened first.
try {
	const current = getConfiguredCompanyWallet();
	if (!current) {
		// Set a development fallback wallet if none is configured
		// In production, this should be set via admin settings or environment variables
		const devFallbackWallet = import.meta.env.VITE_COMPANY_WALLET || '0x742d35Cc6B8C9C5A8A8d2A8B9542aB43e2cE9234';
		setConfiguredCompanyWallet(devFallbackWallet);
	}
} catch (e) {
	// non-fatal; ignore in environments without window/localStorage
	// eslint-disable-next-line no-console
	console.debug('runtime init failed', e);
}

createRoot(document.getElementById("root")!).render(<App />);
