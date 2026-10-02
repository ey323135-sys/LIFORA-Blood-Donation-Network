import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import { 
  HeartHandshake, 
  Activity, 
  User as UserIcon, 
  LogOut, 
  Shield, 
  Building2, 
  Droplet, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'donor': return '/dashboard/donor';
      case 'requester': return '/dashboard/requester';
      case 'hospital': return '/dashboard/hospital';
      case 'bloodbank': return '/dashboard/bloodbank';
      case 'admin': return '/dashboard/admin';
      default: return '/dashboard';
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Shield className="w-3 h-3" /> Admin</span>;
      case 'hospital': return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Building2 className="w-3 h-3" /> Hospital</span>;
      case 'bloodbank': return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Droplet className="w-3 h-3" /> Blood Bank</span>;
      case 'donor': return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><HeartHandshake className="w-3 h-3" /> Donor</span>;
      default: return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><Activity className="w-3 h-3" /> Requester</span>;
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform duration-200">
              <Droplet className="w-6 h-6 text-white fill-white" />
            </div>
            <div>
              <span className="font-heading font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                LIFORA
              </span>
              <span className="block text-[10px] tracking-wider uppercase font-semibold text-red-400 -mt-1">
                Emergency Blood Network
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors ${isActive('/') ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              Home
            </Link>
            <Link 
              to="/about" 
              className={`text-sm font-medium transition-colors ${isActive('/about') ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              About Us
            </Link>
            <Link 
              to="/how-it-works" 
              className={`text-sm font-medium transition-colors ${isActive('/how-it-works') ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              How It Works
            </Link>
            <Link 
              to="/contact" 
              className={`text-sm font-medium transition-colors ${isActive('/contact') ? 'text-red-400 font-semibold' : 'text-slate-300 hover:text-white'}`}
            >
              Contact
            </Link>
          </nav>

          {/* Right Action Menu */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <NotificationBell />

                {/* Dashboard Button */}
                <Link
                  to={getDashboardLink()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 transition-all flex items-center gap-2"
                >
                  <Activity className="w-4 h-4 text-red-400" />
                  Dashboard
                </Link>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-600/20 text-red-400 flex items-center justify-center font-bold text-sm border border-red-500/30">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left leading-tight hidden lg:block">
                      <span className="text-xs font-semibold text-white block max-w-[120px] truncate">{user.name}</span>
                      {getRoleBadge(user.role)}
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
                  </button>

                  {userDropdownOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-64 glass-panel p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2"
                      onMouseLeave={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800 mb-1">
                        <p className="text-xs font-semibold text-white">{user.name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        <div className="mt-1.5">{getRoleBadge(user.role)}</div>
                      </div>
                      <Link
                        to={getDashboardLink()}
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Activity className="w-4 h-4 text-red-400" />
                        My Role Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link to="/register" className="btn-primary text-xs !py-2.5 !px-5">
                  Become a Donor
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 px-4 pt-2 pb-6 space-y-3">
          <Link to="/" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 font-medium">Home</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 font-medium">About Us</Link>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 font-medium">How It Works</Link>
          <Link to="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-sm text-slate-300 font-medium">Contact</Link>
          
          <div className="pt-4 border-t border-slate-800 space-y-2">
            {user ? (
              <>
                <Link 
                  to={getDashboardLink()} 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="btn-primary w-full text-xs text-center justify-center"
                >
                  Open Dashboard ({user.role.toUpperCase()})
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="btn-secondary w-full text-xs text-center justify-center text-red-400 border-red-900/40"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="btn-secondary text-xs text-center justify-center">Sign In</Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="btn-primary text-xs text-center justify-center">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
