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
		// Note: Using a properly checksummed address to avoid validation errors
		const devFallbackWallet = import.meta.env.VITE_COMPANY_WALLET || '0x742d35Cc6634C9c5a8A8D2a8b9542Ab43E2Ce9234';
		setConfiguredCompanyWallet(devFallbackWallet);
	}
} catch (e) {
	// non-fatal; ignore in environments without window/localStorage
	// eslint-disable-next-line no-console
	console.debug('runtime init failed', e);
}

createRoot(document.getElementById("root")!).render(<App />);
