export interface SidebarItem {
  icon?: string;
  label?: string;
  link?: string;
  badge?: string;
  external?: boolean;
  isSeparator?: boolean;
  allowedRoles?: string[]; 
  children?: SidebarItem[]; // 👈 Subítems opcionales
}
