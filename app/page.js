'use client'
import React, { useState, useEffect } from 'react';
import { Trophy, Target, Zap, AlertCircle, RefreshCw, Moon, Sun, ChevronDown, Wifi, WifiOff, RotateCcw } from 'lucide-react';

const Home = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);

  // Initialize dark mode and online status
  useEffect(() => {
    // Check for saved theme preference or default to system preference
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setDarkMode(savedTheme === 'dark');
    } else {
      setDarkMode(systemPrefersDark);
    }

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    fetchLeaderboardData();
    const interval = setInterval(fetchLeaderboardData, 10 * 60 * 1000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Apply dark mode class to document
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  const fetchLeaderboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(false);
      
      const response = await fetch('/api/getData');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setLeaderboardData(data.leaderboard || []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(true);
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };


  const togglePlayerExpansion = (playerId) => {
    setExpandedPlayer(expandedPlayer === playerId ? null : playerId);
  };

  // Pull to refresh handlers
  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e) => {
    if (touchStart && window.scrollY === 0) {
      const currentTouch = e.touches[0].clientY;
      const distance = currentTouch - touchStart;
      if (distance > 0) {
        setPullDistance(Math.min(distance, 100));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullDistance > 60) {
      fetchLeaderboardData(true);
    }
    setTouchStart(0);
    setPullDistance(0);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'from-emerald-400 to-teal-500';
    if (accuracy >= 60) return 'from-yellow-400 to-orange-500';
    if (accuracy >= 40) return 'from-orange-400 to-red-500';
    return 'from-red-400 to-pink-500';
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 0: return { text: 'Truth Seeker Supreme', icon: '🕵️' };
      case 1: return { text: 'Master Detective', icon: '🎯' };
      case 2: return { text: 'Sharp Investigator', icon: '👁️' };
      case 3: return { text: 'Keen Observer', icon: '🔍' };
      case 4: return { text: 'Amateur Sleuth', icon: '🧐' };
      default: return null;
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <div className="w-6 h-6 bg-gray-400 dark:bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">2</div>;
      case 2: return <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>;
      default: return <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-200 font-bold text-sm">{index + 1}</div>;
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          <div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="w-16 h-10 bg-gray-300 dark:bg-gray-600 rounded-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
          </div>
          <div className="text-center">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
          <div className="text-center">
            <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-12 mb-1"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-gray-300 dark:bg-gray-600 rounded-full h-2 w-3/4"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900' 
          : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100'
      } py-8 px-4`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      >
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Lie Detector Leaderboard
              </h1>
            </div>
            <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Who&apos;s the ultimate truth seeker?</p>
          </div>
          
          {/* Loading skeletons */}
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900' 
          : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100'
      } flex items-center justify-center px-4`}>
        <div className={`text-center rounded-2xl p-8 shadow-xl max-w-md w-full ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className={`text-2xl font-bold mb-2 ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>Oops! Something went wrong</h2>
          <p className={`mb-6 ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>There was an error fetching the leaderboard. Please check back later!</p>
          <button
            onClick={() => fetchLeaderboardData(false)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 mx-auto hover:scale-105 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const sortedData = [...leaderboardData].sort((a, b) => {
    const aAccuracy = a.totalGuesses > 0 ? (a.correctGuesses / a.totalGuesses) * 100 : 0;
    const bAccuracy = b.totalGuesses > 0 ? (b.correctGuesses / b.totalGuesses) * 100 : 0;
    
    // Sort by correct guesses first, then by accuracy as tiebreaker
    if (b.correctGuesses !== a.correctGuesses) {
      return b.correctGuesses - a.correctGuesses;
    }
    return bAccuracy - aAccuracy;
  });

  return (
    <div 
      className={`min-h-screen transition-all duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-900' 
          : 'bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-100'
      } py-4 sm:py-8 px-4`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: pullDistance > 0 ? `translateY(${pullDistance * 0.5}px)` : 'none',
        transition: pullDistance > 0 ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Pull to refresh indicator */}
        {pullDistance > 0 && (
          <div className={`text-center py-2 transition-opacity duration-200 ${
            pullDistance > 60 ? 'opacity-100' : 'opacity-50'
          }`}>
            <RotateCcw className={`w-6 h-6 mx-auto ${
              darkMode ? 'text-gray-300' : 'text-gray-600'
            } ${pullDistance > 60 ? 'animate-spin' : ''}`} />
            <p className={`text-sm mt-1 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-full">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Lie Detector Leaderboard
            </h1>
          </div>
          <p className={`text-base sm:text-lg ${
            darkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Who&apos;s the ultimate truth seeker?</p>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>Ranked by correct guesses</p>
          
          {/* Controls */}
          <div className="flex items-center justify-center mt-6 gap-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 focus:ring-4 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400 focus:ring-yellow-400/50' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md focus:ring-purple-300'
              }`}
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {/* Manual refresh */}
            <button
              onClick={() => fetchLeaderboardData(true)}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 focus:ring-4 ${
                darkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300 focus:ring-gray-500' 
                  : 'bg-white hover:bg-gray-50 text-gray-700 shadow-md focus:ring-purple-300'
              } ${isRefreshing ? 'cursor-not-allowed opacity-50' : ''}`}
              aria-label="Refresh leaderboard"
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            
            {/* Online status */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline 
                ? (darkMode ? 'bg-green-900/50 text-green-300' : 'bg-green-100 text-green-700')
                : (darkMode ? 'bg-red-900/50 text-red-300' : 'bg-red-100 text-red-700')
            }`}>
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center justify-center gap-2 mt-4">
              {isRefreshing && <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />}
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-4">
          {sortedData.map((player, index) => {
            const accuracy = player.totalGuesses > 0 ? Math.round((player.correctGuesses / player.totalGuesses) * 100) : 0;
            const badge = getRankBadge(index);
            const isExpanded = expandedPlayer === player.id;
            const maxCorrectGuesses = Math.max(...sortedData.map(p => p.correctGuesses), 1);
            
            return (
              <div
                key={player.id}
                className={`rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                  darkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50'
                } ${
                  index === 0 ? 'ring-4 ring-yellow-400 ring-opacity-50' : ''
                }`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: 'fadeInUp 0.6s ease-out forwards'
                }}
                onClick={() => togglePlayerExpansion(player.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePlayerExpansion(player.id);
                  }
                }}
                aria-expanded={isExpanded}
              >
                {/* Main content - responsive layout */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                    {getRankIcon(index)}
                    <div className="min-w-0 flex-1">
                      <h3 className={`text-lg sm:text-xl font-bold truncate ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>{player.name}</h3>
                      <p className={`text-xs sm:text-sm truncate ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>{player.recentActivity}</p>
                    </div>
                  </div>
                  
                  {/* Stats - responsive grid */}
                  <div className="grid grid-cols-3 sm:flex sm:items-center gap-3 sm:gap-6">
                    {/* Correct Guesses - Primary stat */}
                    <div className="text-center">
                      <div className={`text-2xl sm:text-3xl font-bold mb-1 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
                        {player.correctGuesses}
                      </div>
                      <div className={`text-sm sm:text-base font-semibold ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Correct
                      </div>
                    </div>
                    
                    {/* Total Guesses */}
                    <div className="text-center">
                      <div className={`text-lg sm:text-2xl font-bold mb-1 ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>
                        {player.totalGuesses}
                      </div>
                      <div className={`text-xs sm:text-sm ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        Total
                      </div>
                    </div>
                    
                    {/* Badge or Accuracy */}
                    <div className="text-center">
                      {badge ? (
                        <>
                          <div className={`bg-gradient-to-r ${getAccuracyColor(accuracy)} rounded-lg px-2 sm:px-3 py-1 text-white font-medium text-xs sm:text-sm mb-1 flex items-center justify-center gap-1`}>
                            <span className="text-xs">{badge.icon}</span>
                            <span className="hidden sm:inline">{accuracy}%</span>
                            <span className="sm:hidden">{accuracy}%</span>
                          </div>
                          <div className={`text-xs font-medium ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          } truncate`}>
                            <span className="hidden sm:inline">{badge.text}</span>
                            <span className="sm:hidden">Badge</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`bg-gradient-to-r ${getAccuracyColor(accuracy)} rounded-lg px-2 sm:px-3 py-1 text-white font-medium text-xs sm:text-sm mb-1`}>
                            {accuracy}%
                          </div>
                          <div className={`text-xs ${
                            darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            Accuracy
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Expand indicator */}
                  <ChevronDown className={`w-5 h-5 transition-transform duration-200 ml-auto sm:ml-2 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  } ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
                
                {/* Progress Bar - Now represents correct guesses progress */}
                <div className="mt-4">
                  <div className={`rounded-full h-2 ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    <div
                      className={`bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full h-2 transition-all duration-1000 ease-out`}
                      style={{ width: `${Math.max((player.correctGuesses / maxCorrectGuesses) * 100, 2)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Expanded content */}
                {isExpanded && (
                  <div className={`mt-4 pt-4 border-t transition-all duration-300 ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                  }`}>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Accuracy</div>
                        <div className={`text-xl font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{accuracy}%</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Rank</div>
                        <div className={`text-xl font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>#{index + 1}</div>
                      </div>
                      {badge && (
                        <div className="text-center">
                          <div className={`text-sm font-medium ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>Badge</div>
                          <div className={`text-sm font-medium flex items-center justify-center gap-1 ${
                            darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            <span>{badge.icon}</span>
                            <span className="truncate">{badge.text}</span>
                          </div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className={`text-sm font-medium ${
                          darkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>Wrong</div>
                        <div className={`text-xl font-bold ${
                          darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{player.totalGuesses - player.correctGuesses}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {sortedData.length === 0 && (
          <div className={`text-center py-12 rounded-2xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-lg`}>
            <Zap className={`w-16 h-16 mx-auto mb-4 ${
              darkMode ? 'text-gray-500' : 'text-gray-400'
            }`} />
            <h3 className={`text-xl font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-gray-600'
            }`}>No games played yet!</h3>
            <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
              Start playing to see the leaderboard come alive.
            </p>
            <button
              onClick={() => fetchLeaderboardData(true)}
              className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105 focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800"
            >
              <RefreshCw className="w-4 h-4 inline mr-2" />
              Check for Updates
            </button>
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @media (max-width: 640px) {
          .card-stats {
            gap: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Home;