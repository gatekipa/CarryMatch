import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Plane, Package, MessageSquare, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

/**
 * Mobile Bottom Navigation Menu
 * Touch-friendly navigation for mobile devices
 * Fixed at bottom with safe area insets
 */

export default function MobileTouchMenu({ currentPath, user, unreadCount = 0 }) {
  const [lastTapTime, setLastTapTime] = React.useState({});
  
  const menuItems = [
    {
      name: "Home",
      icon: Home,
      path: createPageUrl("Home"),
      rootPath: createPageUrl("Home"),
      color: "text-[#9EFF00]"
    },
    {
      name: "Trips",
      icon: Plane,
      path: createPageUrl("BrowseTrips"),
      rootPath: createPageUrl("BrowseTrips"),
      color: "text-blue-400"
    },
    {
      name: "Requests",
      icon: Package,
      path: createPageUrl("BrowseRequests"),
      rootPath: createPageUrl("BrowseRequests"),
      color: "text-purple-400"
    },
    {
      name: "Messages",
      icon: MessageSquare,
      path: createPageUrl("Messages"),
      rootPath: createPageUrl("Messages"),
      color: "text-green-400",
      badge: unreadCount,
      requireAuth: true
    },
    {
      name: "Profile",
      icon: User,
      path: user ? createPageUrl("UserProfile", `email=${user.email}`) : createPageUrl("Home"),
      rootPath: user ? createPageUrl("UserProfile", `email=${user.email}`) : createPageUrl("Home"),
      color: "text-pink-400",
      requireAuth: true
    }
  ];

  // Filter menu items based on auth
  const visibleItems = user 
    ? menuItems 
    : menuItems.filter(item => !item.requireAuth);

  // Handle double-tap to navigate to tab's root
  const handleTabClick = (e, item) => {
    const now = Date.now();
    const lastTap = lastTapTime[item.name] || 0;
    const isDoubleTap = now - lastTap < 300;
    
    setLastTapTime(prev => ({ ...prev, [item.name]: now }));
    
    // If double-tapped and already on this tab, navigate to root
    if (isDoubleTap && currentPath !== item.rootPath && currentPath.includes(item.path)) {
      e.preventDefault();
      window.location.href = item.rootPath;
    }
  };

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F1D35]/95 backdrop-blur-xl border-t border-white/10"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
    >
      <nav className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const isActive = currentPath === item.path || 
            (item.path !== createPageUrl("Home") && currentPath.startsWith(item.path));
          
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={(e) => handleTabClick(e, item)}
              className={`relative flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all ${
                isActive 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              }`}
              style={{ minWidth: '64px', minHeight: '56px' }}
              title={isActive ? 'Double-tap to go to root' : ''}
            >
              <div className="relative">
                <item.icon 
                  className={`w-6 h-6 ${
                    isActive ? item.color : 'text-gray-400'
                  }`} 
                />
                {item.badge > 0 && (
                  <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-1.5 py-0.5 min-w-[1.25rem] h-5">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={`text-xs font-medium ${
                isActive ? 'text-white' : 'text-gray-400'
              }`}>
                {item.name}
              </span>
              
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#9EFF00] rounded-b-full"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </motion.div>
  );
}