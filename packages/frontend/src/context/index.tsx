'use client'

import { getDeployments } from "@/config/deployed-contracts"
import { envConfig } from "@/config/environment"
import { UseInkathonProvider } from "@scio-labs/use-inkathon"

const RootProvider = ({ children }: { children: any}) => (
    <UseInkathonProvider
        appName="PROOWNAS DAO"
        connectOnInit={true}
        defaultChain={envConfig.defaultChain}
        deployments={getDeployments()}
    >
        {children}
    </UseInkathonProvider>
)

export default RootProvider