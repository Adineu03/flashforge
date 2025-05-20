import { Link, useLocation } from "wouter";

export function MobileNavbar() {
  const [location] = useLocation();
  
  // Navigation links
  const navLinks = [
    { 
      href: "/", 
      label: "Decks", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ) 
    },
    { 
      href: "/create", 
      label: "Create", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ) 
    },
    { 
      href: "/review", 
      label: "Review", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ) 
    },
    { 
      href: "/stats", 
      label: "Stats", 
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    <div className="mobile-navbar fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex">
      {navLinks.map(link => (
        <Link 
          key={link.href} 
          href={link.href}
          className={`flex-1 text-center py-4 ${
            isActive(link.href)
              ? "text-primary border-t-2 border-primary"
              : "text-gray-500 border-t-2 border-transparent"
          }`}
        >
          {link.icon}
          <span className="text-xs">{link.label}</span>
        </Link>
      ))}
    </div>
  );
}
