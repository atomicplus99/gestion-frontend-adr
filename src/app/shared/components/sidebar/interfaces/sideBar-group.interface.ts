import { SidebarItem } from "./sideBar-item.interface";

export interface SidebarGroup {
    title?: string;
    items: SidebarItem[];
  }