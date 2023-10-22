import { Tab } from '@headlessui/react'
import { ProposalStatus } from '../../types/customs'
import { Fragment, useCallback } from 'react'
import tw from 'twin.macro'
import { Button } from '@chakra-ui/react'
import { useProownasDAOContext } from '@context/ProownasDAO'
import { ProposalCard } from './ProposalCard'

const TabStates = [
  ProposalStatus.Pending,
  ProposalStatus.Ongoing,
  ProposalStatus.Approved,
  ProposalStatus.Rejected,
]

export const ProposalView = () => {
  const { proposals: allProposals } = useProownasDAOContext()!

  const proposals = useCallback(
    (status: ProposalStatus | 'All') => {
      if (allProposals) {
        if (status === 'All') {
          return allProposals
        } else {
          const filteredProposals = allProposals.filter(({ status: pStat }) => status === pStat)
          return filteredProposals
        }
      }
    },
    [allProposals],
  )

  return (
    <Tab.Group>
      <Tab.List>
        {['All', ...TabStates].map((tab, tabIndex) => (
          <Tab as={Fragment} key={tab}>
            {({ selected }) => {
              return (
                <Button
                  bg="transparent"
                  px={4}
                  py={2}
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
        {['All', ...TabStates].map((tab) => {
          const filteredProposals = proposals(tab as ProposalStatus | 'All')
          return (
            <Tab.Panel key={tab} tw="grid grid-cols-2 gap-4">
              {filteredProposals && filteredProposals.length > 0 ? (
                filteredProposals?.map((proposal) => (
                  <ProposalCard key={proposal.id} {...proposal} />
                ))
              ) : (
                <p key={tab}>No {tab === 'All' ? '' : tab} Proposals</p>
              )}
            </Tab.Panel>
          )
        })}
      </Tab.Panels>
    </Tab.Group>
  )
}
