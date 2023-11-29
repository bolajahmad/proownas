import { IconType } from "react-icons";

export interface SidebarLink {
    name: string;
    href: string;
    id: string;
    icon: IconType;
    inactive?: boolean
}