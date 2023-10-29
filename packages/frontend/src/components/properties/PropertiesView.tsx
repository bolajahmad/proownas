import { Button } from '@chakra-ui/react'
import { ContractIds } from '@deployments/deployments'
import { Tab } from '@headlessui/react'
import {
  contractQuery,
  decodeOutput,
  useInkathon,
  useRegisteredContract,
} from '@scio-labs/use-inkathon'
import { truncateHash } from '@utils/truncateHash'
import { Fragment, useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import 'twin.macro'
import { PropertyCard } from './PropertyCard'

export type Property = {
  tokenCID: string
  index: number
  owner: string
}

export const PropertiesView = () => {
  const [isFetching, setFetching] = useState(false)
  const { api } = useInkathon()
  const [allProperties, setProperties] = useState<Property[]>([])
  const [assetCount, setAssetCount] = useState<number>()
  const { contract } = useRegisteredContract(ContractIds.PropertyToken)

  const fetchMintedPropertiesCount = useCallback(async () => {
    if (!contract || !api) {
      console.log({ contract, api })
      return null
    }

    try {
      const result = await contractQuery(api, '', contract, 'psp34::total_supply')
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'psp34::total_supply',
      )
      if (isError) throw new Error(decodedOutput)

      setAssetCount(Number(output))
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching property count. Try again…')
      return null
    }
  }, [contract])
  useEffect(() => {
    fetchMintedPropertiesCount()
  }, [contract, api])

  console.log({ assetCount, allProperties })

  const fetchPropertiesCIDs = useCallback(
    async (assetCount: number) => {
      if (assetCount) {
        const properties = new Array(assetCount)
        setFetching(true)
        for (let i = 0; i < assetCount; i++) {
          const proposal = await fetchTokenCID(i)
          if (proposal) {
            properties[i] = proposal
          }
        }

        console.log({ properties })
        setProperties(properties)
        setFetching(false)
      }
    },
    [contract],
  )

  const fetchTokenCID = async (index: number) => {
    if (!contract || !api) return null

    try {
      const result = await contractQuery(api, '', contract, 'PSP34Enumerable::token_by_index', {}, [
        index,
      ])
      const { output, isError, decodedOutput } = decodeOutput(
        result,
        contract,
        'PSP34Enumerable::token_by_index',
      )
      if (isError) throw new Error(decodedOutput)
      const tokenCID = output.Ok
      let owner = ''
      {
        const result = await contractQuery(api, '', contract, 'PSP34::owner_of', {}, [tokenCID])
        const { output, isError, decodedOutput } = decodeOutput(result, contract, 'PSP34::owner_of')
        if (isError) throw new Error(decodedOutput)
        owner = output
      }
      return {
        owner,
        index,
        tokenCID: tokenCID['Bytes'],
      }
    } catch (e) {
      console.error(e)
      toast.error('Error while fetching proposal count. Try again…')
      return null
    }
  }

  useEffect(() => {
    if (assetCount) fetchPropertiesCIDs(assetCount)
  }, [assetCount])

  return (
    <Tab.Group>
      <Tab.List>
        {['All'].map((tab, tabIndex) => (
          <Tab as={Fragment} key={tab}>
            {({ selected }) => {
              return (
                <Button
                  bg="transparent"
                  px={4}
                  py={2}
                  key={tabIndex + tab}
                  borderBottom="2px solid transparent"
                  borderRadius="none"
                  color={selected ? 'blue.700' : 'white'}
                  _hover={{
                    bg: 'transparent',
                    border: 'none',
                  }}
                  _focusVisible={{
                    outline: 'none',
                    border: 'none',
                  }}
                  fontWeight={selected ? 'bold' : 'normal'}
                  borderColor={selected ? 'blue.700' : 'transparent'}
                >
                  {tab}
                </Button>
              )
            }}
          </Tab>
        ))}
      </Tab.List>
      <Tab.Panels>
        {assetCount ? (
          ['All'].map((tab, index) => {
            return (
              <Tab.Panel key={tab + index} tw="grid grid-cols-2 gap-4">
                {allProperties &&
                  allProperties.length > 0 &&
                  allProperties.map((property) => (
                    <PropertyCard key={property.tokenCID} {...property} />
                  ))}
              </Tab.Panel>
            )
          })
        ) : (
          <div tw="font-bold text-blue-500 text-lg">No properties have been minted!</div>
        )}
      </Tab.Panels>
    </Tab.Group>
  )
}
