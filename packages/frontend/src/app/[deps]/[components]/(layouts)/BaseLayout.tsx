import RootProvider from "@/context";
import clsx from "clsx";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

type Props = {
    children: React.ReactNode
}
function BaseLayout({ children }: Props) {
    return (
        <RootProvider>
            <div className={clsx('relative flex min-h-full')}>
            <div className={clsx('flex h-full items-stretch w-full')}>
                <aside className={clsx('w-full', 'max-w-xs')}>
                    <Sidebar />
                </aside>

                <main className={clsx('relative flex h-full grow flex-col overflow-auto bg-gray-800 pb-14')}>
                    <Navbar /> 

                    {children}
                </main>
            </div>
        </div>
        </RootProvider>
    )
}

export default BaseLayout;