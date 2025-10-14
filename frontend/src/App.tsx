import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Map as MapIcon, MapPin, Grid3x3 } from 'lucide-react';
import HomePage from './components/HomePage';
import AlbumPage from './components/AlbumPage';
import LocationsPage from './components/LocationsPage';

function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="AquaSpot Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-xl font-semibold text-gray-900">AquaSpot</span>
          </Link>

          <div className="flex gap-2">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                location.pathname === '/'
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MapIcon className="w-5 h-5" />
              Map
            </Link>
            <Link
              to="/album"
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                location.pathname === '/album'
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Grid3x3 className="w-5 h-5" />
              Album
            </Link>
            <Link
              to="/locations"
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                location.pathname === '/locations'
                  ? 'bg-primary-light text-primary'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <MapPin className="w-5 h-5" />
              Locations
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-gray-50">
        <Navigation />
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/album" element={<AlbumPage />} />
            <Route path="/locations" element={<LocationsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
