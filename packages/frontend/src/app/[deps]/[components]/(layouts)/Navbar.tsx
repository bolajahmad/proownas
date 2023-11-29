import clsx from "clsx"
import ConnectWalletButton from "../(basic)/ConnectWalletButton"

function Navbar() {
    return (
        <div className={clsx('sticky top-0 left-0 right-0 z-10 px-6 py-2')}>
            <div className="ml-auto w-fit">
                <ConnectWalletButton />
            </div>
        </div>
    )
}

export default Navbar