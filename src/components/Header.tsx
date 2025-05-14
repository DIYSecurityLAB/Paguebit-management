import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CreditCard, Users, Wallet, Bell, Sun, Moon, Menu, X, Home, Search } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { AnimatePresence, motion } from 'framer-motion';
import logo from '../assets/PagueBit_black.svg';
import logoDark from '../assets/PagueBit_white.svg';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fechar o menu quando a rota mudar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevenir scroll quando o menu móvel estiver aberto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home, key: 'd' },
    { path: '/payments', label: 'Pagamentos', icon: CreditCard, key: 'p' },
    { path: '/users', label: 'Usuários', icon: Users, key: 'u' },
    { path: '/withdrawals', label: 'Saques', icon: Wallet, key: 's' },
    { path: '/logs', label: 'Atividade', icon: Search, key: 'a' },
    { path: '/notifications', label: 'Notificações', icon: Bell, key: 'n' },
  ];

  // Adicionar atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey) {
        navItems.forEach(item => {
          if (e.key === item.key) {
            location.pathname !== item.path && window.location.assign(item.path);
            e.preventDefault();
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Brand - largura fixa em desktop */}
          <div className="flex-shrink-0 flex items-center pl-0 lg:w-1/6">
            <Link 
              to="/" 
              className="text-xl font-bold text-foreground flex items-center group"
            >
              <img
                src={theme === 'dark' ? logoDark : logo}
                alt="Pague Bit Logo"
                className="h-9 w-auto mr-2"
                style={{ display: 'inline-block' }}
              />
            </Link>
          </div>

          {/* Desktop Navigation - centralizado e largura fixa */}
          <nav className="hidden lg:flex items-center justify-center lg:w-4/6 space-x-2">
            {navItems.map(({ path, label, icon: Icon, key }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 relative group
                  ${isActive(path) 
                    ? 'text-primary bg-primary/10' 
                    : 'text-foreground/80 hover:text-foreground hover:bg-muted'
                  }`}
              >
                <Icon className="mr-1 h-4 w-4" />
                {label}
                <span className="text-[10px] opacity-50 ml-0.5">(Alt+{key})</span>
                
                {/* Animated underline on hover and active */}
                {isActive(path) ? (
                  <motion.span 
                    className="absolute bottom-0 left-0 h-0.5 bg-primary rounded-full w-full"
                    layoutId="activeNav"
                  />
                ) : (
                  <span className="absolute bottom-0 left-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform rounded-full w-full origin-left" />
                )}
              </Link>
            ))}
          </nav>

          {/* Right controls - largura fixa e padding ajustado */}
          <div className="flex items-center space-x-2 lg:w-1/6 justify-end pr-4">
            {/* Theme Toggle */}
            <motion.button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-muted transition-colors"
              aria-label="Toggle Theme"
              whileTap={{ scale: 0.9 }}
              whileHover={{ rotate: 15 }}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-yellow-400" />
              ) : (
                <Moon className="h-5 w-5 text-slate-600" />
              )}
            </motion.button>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle Menu"
                initial={{ scale: 1 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6 text-foreground" />
                ) : (
                  <Menu className="h-6 w-6 text-foreground" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Panel with animation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="lg:hidden bg-background border-t border-border"
          >
            <div className="shadow-lg">
              <div className="grid grid-cols-2 divide-x divide-border">
                {navItems.map(({ path, label, icon: Icon }, index) => (
                  <motion.div 
                    key={path}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.2 }}
                    className={index >= 2 ? "border-t border-border" : ""}
                  >
                    <Link
                      to={path}
                      className={`flex flex-col items-center justify-center py-3 px-2 transition-colors
                        ${isActive(path) 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-foreground/80 hover:bg-muted'
                        }`}
                    >
                      <Icon className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">{label}</span>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Expanded menu overlay for tablets */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="sm:hidden py-3 px-4 bg-muted/50 border-t border-border"
              >
                <div className="flex justify-center">
                  <div className="text-center text-muted-foreground text-xs">
                    <p>© {new Date().getFullYear()} PagueBit Admin</p>
                    <button 
                      onClick={toggleTheme}
                      className="mt-2 flex items-center justify-center mx-auto px-3 py-1 rounded-full bg-background border border-border hover:bg-muted transition-colors"
                    >
                      {theme === 'dark' ? (
                        <><Sun className="h-3.5 w-3.5 mr-1" /> Modo Claro</>
                      ) : (
                        <><Moon className="h-3.5 w-3.5 mr-1" /> Modo Escuro</>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
