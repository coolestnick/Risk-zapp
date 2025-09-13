import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3Provider } from './context/Web3Context';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateToken from './pages/CreateToken';
import TokenDetail from './pages/TokenDetail';
import Portfolio from './pages/Portfolio';

function App() {
  return (
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-dark-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateToken />} />
              <Route path="/token/:address" element={<TokenDetail />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="border-t border-dark-700 bg-dark-900 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-400">
                <p>&copy; 2024 ShardeumPump. Built on Shardeum Network.</p>
                <div className="flex justify-center space-x-6 mt-4">
                  <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Terms
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Privacy
                  </a>
                  <a href="#" className="text-gray-400 hover:text-primary-400 transition-colors">
                    Docs
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </Router>
    </Web3Provider>
  );
}

export default App;
