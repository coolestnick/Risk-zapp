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
      <Card className={cn('hover:scale-105 transition-transform cursor-pointer group', className)}>
        {/* Token Image */}
        <div className="relative mb-4">
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-48 object-cover rounded-lg bg-dark-700"
            onError={(e) => {
              e.target.src = '/api/placeholder/200/200';
            }}
          />
          
          {/* Status Badge */}
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                isListed
                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                  : 'bg-primary-600/20 text-primary-400 border border-primary-600/30'
              }`}
            >
              {isListed ? '📈 Listed' : '🚀 Bonding'}
            </span>
          </div>

          {/* Price Change */}
          {showStats && priceChange24h !== undefined && (
            <div className="absolute top-2 left-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isPositiveChange
                    ? 'bg-green-600/20 text-green-400'
                    : 'bg-red-600/20 text-red-400'
                }`}
              >
                {isPositiveChange ? '↗' : '↘'} {Math.abs(priceChange24h).toFixed(2)}%
              </span>
            </div>
          )}
        </div>

        {/* Token Info */}
        <div className="space-y-3">
          {/* Title */}
          <div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">
              {name}
            </h3>
            <p className="text-primary-400 font-medium">${symbol}</p>
          </div>

          {/* Description */}
          <p className="text-gray-400 text-sm line-clamp-2">
            {description || 'No description provided.'}
          </p>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Market Cap</span>
              <span className="text-white font-medium">
                ${formatLargeNumber(marketCap || 0)}
              </span>
            </div>
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Raised</span>
              <span className="text-white font-medium">
                {formatLargeNumber(totalRaised || 0)} SHM
              </span>
            </div>

            {showStats && volume24h !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">24h Volume</span>
                <span className="text-white font-medium">
                  ${formatLargeNumber(volume24h)}
                </span>
              </div>
            )}

            {showStats && holders !== undefined && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Holders</span>
                <span className="text-white font-medium">
                  {formatLargeNumber(holders)}
                </span>
              </div>
            )}
          </div>

          {/* Creator & Time */}
          <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t border-dark-700">
            <span>
              👤 {formatAddress(creator)}
            </span>
            <span>
              🕒 {getTimeAgo(createdAt)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default TokenCard;