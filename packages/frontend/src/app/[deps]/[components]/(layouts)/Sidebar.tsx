import { SidebarLink } from "@/models/utils";
import clsx from "clsx";
import Link from "next/link";
import { AiTwotonePropertySafety } from 'react-icons/ai';
import { RxActivityLog, RxHome } from 'react-icons/rx';

const sidebarLinks: SidebarLink[] = [
    { name: 'Dashboard', href: '/', id: 'dashboard', icon: RxHome },
    { name: 'Proposals', href: '/proposals', id: 'proposals', icon: RxActivityLog },
    { name: 'Assets', href: '/assets', id: 'assets', icon: AiTwotonePropertySafety },
  ]

function Sidebar() {
    return (
        <div>
            <h1 className={clsx('px-6 py-3 text-2xl')}>Proownas DAO</h1>

            <nav className="mt-20">
                <ul className={clsx('flex flex-col gap-6')}>
                    {sidebarLinks.map(({ id, href, name, icon: Icon }) => (
                        <li key={id} className="pl-3 pr-7">
                            <Link href={href} className={clsx('flex items-center gap-4 text-lg')}>
                                <Icon size={24} />
                                {name}
                            </Link>
                        </li>
                    ))}
                </ul>
            </nav>
        </div>
    )
}

export default Sidebar;