import React from 'react';
import { Link } from 'react-router-dom';
import Card from './ui/Card';
import { formatAddress, getIPFSUrl, getTimeAgo } from '../utils/constants';
import { formatLargeNumber } from '../utils/helpers';
import { cn } from '../utils/helpers';

const TokenCard = ({ token, showStats = false, className }) => {
  const {
    tokenAddress,
    name,
    symbol,
    description,
    imageHash,
    creator,
    createdAt,
    marketCap,
    totalRaised,
    priceChange24h,
    volume24h,
    holders,
    isListed,
  } = token;

  const imageUrl = imageHash ? getIPFSUrl(imageHash) : '/api/placeholder/200/200';
  const isPositiveChange = priceChange24h >= 0;

  return (
    <Link to={`/token/${tokenAddress}`}>
      <div className={cn('token-card group', className)}>
        <div className="card overflow-hidden">
          {/* Token Image */}
          <div className="relative mb-6">
            <div className="relative overflow-hidden rounded-xl">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-48 object-cover bg-slate-800 transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.target.src = '/api/placeholder/200/200';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
            
            {/* Status Badge */}
            <div className="absolute top-3 right-3">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                  isListed
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pulse-glow'
                    : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                }`}
              >
                {isListed ? '📈 LISTED' : '🚀 LIVE'}
              </span>
            </div>

            {/* Price Change */}
            {showStats && priceChange24h !== undefined && (
              <div className="absolute top-3 left-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border ${
                    isPositiveChange
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {isPositiveChange ? '📈' : '📉'} {Math.abs(priceChange24h).toFixed(2)}%
                </span>
              </div>
            )}

            {/* Pulse effect for new tokens */}
            <div className="absolute bottom-3 left-3">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-cyan-400 text-xs font-bold">TRADING</span>
              </div>
            </div>
          </div>

          {/* Token Info */}
          <div className="space-y-4">
            {/* Title */}
            <div>
              <h3 className="text-xl font-black text-white group-hover:text-gradient transition-all duration-300">
                {name}
              </h3>
              <p className="text-cyan-400 font-bold text-lg">${symbol}</p>
            </div>

            {/* Description */}
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
              {description || 'No description provided.'}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Market Cap</div>
                <div className="text-white font-bold">
                  ${formatLargeNumber(marketCap || 0)}
                </div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                <div className="text-xs text-slate-400 mb-1">Raised</div>
                <div className="text-cyan-400 font-bold">
                  {formatLargeNumber(totalRaised || 0)} SHM
                </div>
              </div>

              {showStats && volume24h !== undefined && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">24h Volume</div>
                  <div className="text-purple-400 font-bold">
                    ${formatLargeNumber(volume24h)}
                  </div>
                </div>
              )}

              {showStats && holders !== undefined && (
                <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                  <div className="text-xs text-slate-400 mb-1">Holders</div>
                  <div className="text-emerald-400 font-bold">
                    {formatLargeNumber(holders)}
                  </div>
                </div>
              )}
            </div>

            {/* Creator & Time */}
            <div className="flex justify-between items-center pt-3 border-t border-slate-700/50">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center text-xs">
                  👤
                </div>
                <span className="text-slate-400 text-xs font-mono">
                  {formatAddress(creator)}
                </span>
              </div>
              <span className="text-slate-500 text-xs">
                🕒 {getTimeAgo(createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default TokenCard;