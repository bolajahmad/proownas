'use client'

import { truncateString } from '@/app/lib/[utils]/string-manipulation';
import { envConfig } from '@/config/environment';
import { Menu } from '@headlessui/react';
import type { InjectedAccount } from '@polkadot/extension-inject/types';
import { encodeAddress } from "@polkadot/util-crypto";
import { SubstrateWalletPlatform, allSubstrateWallets, getSubstrateChain, isWalletInstalled, useBalance, useInkathon, type SubstrateChain } from '@scio-labs/use-inkathon';
import clsx from 'clsx';
import { AiOutlineCheckCircle } from 'react-icons/ai';
import { FaWallet } from "react-icons/fa6";
import { FiChevronDown } from 'react-icons/fi';

type ActiveBtnProps = {
    activeAccount: InjectedAccount
    activeChain?: SubstrateChain
}

const ActiveButton = ({ activeAccount, activeChain }: ActiveBtnProps) => {
    const {accounts} = useInkathon()
    const { balanceFormatted: balance } = useBalance(activeAccount.address, true, {
        fixedDecimals: 2,
        forceUnit: false,
        removeTrailingZeros: true
    })
    const supportedChains = envConfig.supportedChains.map((networkId) => getSubstrateChain(networkId) as SubstrateChain);
    
    return (
        <Menu>
            <div className={clsx('flex items-stretch text-sm justify-end gap-4 text-white')}>
                {balance ? (
                    <button type="button" className="rounded-2xl py-1 px-4 bg-gray-700">
                        {balance}
                    </button>
                ) : null}

                <Menu.Button className="rounded-2xl py-1 px-4  bg-gray-700 flex items-center justify-start">
                    <div className="flex flex-col w-fit pl-2 pr-4 flex-1">
                        {activeAccount.name}
                        <span className="text-xs text-slate-400 font-semibold">{truncateString(encodeAddress(activeAccount.address, activeChain?.ss58Prefix || 42), 6)}</span>
                    </div>
                    <FiChevronDown size={22} />
                </Menu.Button>
            </div>

            <Menu.Items as="nav">
                    {supportedChains.map((chain) => (
                        <Menu.Item key={chain.rpcUrls.toString()}>
                            <div>
                                <div className="flex">
                                    <span>{chain.name}</span>
                                    {chain.network === activeChain?.network ? (
                                        <AiOutlineCheckCircle size={16} />
                                    ) : null}
                                </div>
                            </div>
                        </Menu.Item>
                    ))}

                    <hr />
                    {(accounts || []).map((account) => {
                        const encodedAddress = encodeAddress(account.address, activeChain?.ss58Prefix || 42);
                        const truncatedAddress = truncateString(encodedAddress, 5);

                        return (
                            <Menu.Item key={account.address}>
                                <div>
                                    <div className="flex">
                                        {account.name}
                                        {account.address === activeAccount.address ? (
                                            <AiOutlineCheckCircle size={16} />
                                        ) : null}
                                        <span>{truncatedAddress}</span>
                                    </div>
                                </div>
                            </Menu.Item>
                        )
                    })}

                    <hr />
                    <Menu.Item as="button">
                        <span>Disconnect</span>
                    </Menu.Item>
            </Menu.Items>
        </Menu>
    )
}

function ConnectWalletButton() {
    const { connect, activeAccount, activeChain } = useInkathon();
    const wallets = allSubstrateWallets.filter(
        (wallet) => wallet.platforms.includes(SubstrateWalletPlatform.Browser) && 
            isWalletInstalled(wallet)
    )

    if (activeAccount) {
        return <ActiveButton activeAccount={activeAccount} activeChain={activeChain} />
    }

    return (
        <Menu>
            <Menu.Button className={clsx('rounded-2xl font-bold bg-purple-300 flex items-center gap-2 p-3')}>
                Connect Wallet
                <FaWallet size={22} />
            </Menu.Button>

            <Menu.Items className={clsx('bg-gray-800 border mt-1 absolute z-1 w-fit border-gray-600 rounded-2xl py-3 flex flex-col gap-3 items-start')}>
                {wallets.map((wallet) => {
                    return (
                        <Menu.Item className="block pl-3 pr-10" as="button" onClick={() => connect?.(undefined, wallet)} key={wallet.id}>
                                {wallet.name}
                        </Menu.Item>
                    )
                })}
            </Menu.Items>
        </Menu>
    )
}

export default ConnectWalletButton