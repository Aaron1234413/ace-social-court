
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  FileText,
  MapPin,
  UserCheck
} from 'lucide-react';

export function AdminSidebar() {
  return (
    <aside className="w-64 bg-white border-r hidden md:flex flex-col">
      <div className="py-6 px-4 border-b">
        <h1 className="text-lg font-bold text-primary">Tennis App Admin</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        <NavItem to="/admin" icon={<LayoutDashboard size={20} />} exact>
          Dashboard
        </NavItem>
        <NavItem to="/admin/users" icon={<Users size={20} />}>
          Users
        </NavItem>
        <NavItem to="/admin/ambassadors" icon={<UserCheck size={20} />}>
          Ambassadors
        </NavItem>
        <NavItem to="/admin/content" icon={<FileText size={20} />}>
          Content
        </NavItem>
        <NavItem to="/admin/messages" icon={<MessageSquare size={20} />}>
          Messages
        </NavItem>
        <NavItem to="/admin/courts" icon={<MapPin size={20} />}>
          Tennis Courts
        </NavItem>
      </nav>
      
      <div className="p-4 border-t">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Users size={14} className="text-primary" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium">Admin User</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  exact?: boolean;
}

function NavItem({ to, icon, children, exact = false }: NavItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
          isActive
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-gray-700 hover:bg-gray-100'
        }`
      }
    >
      <span className="mr-3 text-current opacity-75">{icon}</span>
      {children}
    </NavLink>
  );
}
