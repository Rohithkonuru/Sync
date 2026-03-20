import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHome, FiBriefcase, FiUsers, FiMessageSquare, FiUser } from 'react-icons/fi';

const tabs = [
  { id: 'home', label: 'Home', icon: FiHome, route: '/feed', match: ['/feed', '/home'] },
  { id: 'jobs', label: 'Jobs', icon: FiBriefcase, route: '/jobs', match: ['/jobs'] },
  { id: 'network', label: 'Network', icon: FiUsers, route: '/network', match: ['/network', '/connections', '/search-connections'] },
  { id: 'messages', label: 'Messages', icon: FiMessageSquare, route: '/messages', match: ['/messages'] },
  { id: 'profile', label: 'Profile', icon: FiUser, route: '/profile', match: ['/profile'] },
];

const isActiveTab = (pathname, tab) => tab.match.some((prefix) => pathname.startsWith(prefix));

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white shadow-lg border-t border-neutral-200">
      <div className="flex justify-around items-stretch">
        {tabs.map((tab) => {
          const active = isActiveTab(location.pathname, tab);
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(tab.route)}
              className={`relative flex-1 min-h-[44px] py-2 px-1 flex flex-col items-center justify-center gap-1 ${
                active ? 'text-blue-600' : 'text-neutral-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] font-medium">{tab.label}</span>
              {active && (
                <motion.div
                  layoutId="mobile-nav-active"
                  className="absolute top-0 h-0.5 w-8 rounded-full bg-blue-600"
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;