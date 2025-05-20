import { Link, useLocation } from "wouter";

export function Sidebar() {
  const [location] = useLocation();
  
  // Navigation links
  const navLinks = [
    { 
      href: "/", 
      label: "My Decks", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) 
    },
    { 
      href: "/create", 
      label: "Create Cards", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ) 
    },
    { 
      href: "/review", 
      label: "Review Cards", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ) 
    },
    { 
      href: "/stats", 
      label: "Statistics", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ) 
    }
  ];
  
  // Determine if a link is active
  const isActive = (href: string) => {
    if (href === "/") return location === href;
    return location.startsWith(href);
  };
  
  return (
    <div className="desktop-sidebar w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
      <div className="h-16 flex items-center px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-primary">FlashForge</h1>
      </div>
      <nav className="px-4 py-6 space-y-1">
        {navLinks.map(link => (
          <Link 
            key={link.href} 
            href={link.href}
            className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
              isActive(link.href)
                ? "text-primary border-l-4 border-primary bg-primary-50 dark:bg-primary-900/20"
                : "text-gray-500 border-l-4 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-primary"
            }`}
          >
            {link.icon}
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6 mt-auto border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-primary-200 dark:bg-primary-700 text-primary-700 dark:text-primary-200 rounded-full flex items-center justify-center">
            <span className="font-medium text-sm">FF</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">FlashForge User</p>
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
