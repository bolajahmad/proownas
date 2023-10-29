import { Button } from '@chakra-ui/react'
import { TextArea, TextInput } from '@components/utils/InputArea'
import { makeWeb3StorageClient } from '@config/getSupportedChains'
import { ContractIds } from '@deployments/deployments'
import { Dialog } from '@headlessui/react'
import { useInkathon, useRegisteredContract } from '@scio-labs/use-inkathon'
import { contractTxWithToast } from '@utils/contractTxWithToast'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { AiOutlinePlusCircle } from 'react-icons/ai'
import { FiPlus, FiX } from 'react-icons/fi'
import 'twin.macro'

export const CreatePropertiesView = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Fragment>
      <Button
        onClick={() => setIsOpen(true)}
        tw="flex items-center gap-3 bg-blue-500 text-lg hover:bg-blue-700"
      >
        <AiOutlinePlusCircle size={20} />
        Add Owner&apos;s Asset
      </Button>

      <Dialog open={!!isOpen} onClose={() => setIsOpen(false)} tw="relative z-50">
        <div
          tw="fixed inset-0 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          aria-hidden="true"
        >
          <Dialog.Panel tw="relative max-h-full w-full max-w-2xl overflow-auto rounded-lg bg-gray-950/75 p-10">
            <Button
              variant="ghost"
              onClick={() => setIsOpen(false)}
              tw="absolute right-0 top-0 text-black"
            >
              <FiX size={18} />
            </Button>
            <Dialog.Title tw="font-bold text-4xl">Mint owner&apos;s property</Dialog.Title>

            <div tw="mt-4">
              <p>
                <span tw="font-bold">Complete the form...</span>
              </p>
            </div>

            <div tw="mt-4 w-full">
              {isOpen && (
                <ProposalDetailForm
                  onComplete={() => setIsOpen(false)}
                  onCancel={() => setIsOpen(false)}
                />
              )}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </Fragment>
  )
}

const ProposalDetailForm = ({
  onCancel,
  onComplete,
}: {
  onCancel?: () => void
  onComplete: (values?: any) => void
}) => {
  const [isSubmitting, setSubmitting] = useState(false)
  const { api, activeAccount, activeSigner } = useInkathon()
  const { contract } = useRegisteredContract(ContractIds.Dao)
  const { handleSubmit, register, watch, setValue } = useForm({
    reValidateMode: 'onBlur',
  })

  const addResourcetoForm = () => {
    const reference = watch('reference')
    const id = (reference?.length ?? 0) + 1
    const new_reference = reference?.length
      ? [...reference, { desc: '', href: '', id }]
      : [{ desc: '', href: '', id }]
    setValue('reference', new_reference)
  }

  const removeResourceFromForm = (index: number) => {
    const reference = watch('reference')
    const new_reference = reference?.filter(({ id }: any) => id !== index)
    setValue('reference', new_reference)
  }

  const onSubmit = async (values: any) => {
    // convert eact file into an CIDs
    const files = values.files
    const client = makeWeb3StorageClient()
    const filesCid = await client.put(files)

    const proposalToStore = {
      description: values.description,
      filesCID: filesCid,
      references: values.reference,
    }
    const proposal_blob = new Blob([JSON.stringify(proposalToStore)], { type: 'application/json' })
    const proposal_files = [new File([proposal_blob], `proposal.json`)]
    const proposalCID = await client.put(proposal_files)

    if (!activeAccount || !contract || !activeSigner || !api) {
      toast.error('Wallet not connected. Try again…')
      return
    }

    // send submit_new_asset message
    setSubmitting(true)
    try {
      await contractTxWithToast(api, activeAccount.address, contract, 'set_default_assets', {}, [
        [proposalCID],
      ])
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form action="" tw="flex w-full flex-col gap-10" onSubmit={handleSubmit(onSubmit)}>
      <TextInput
        name="files"
        label="Choose files to upload"
        placeholder="choose at least 1 file"
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        register={register}
      />
      <TextArea
        name="description"
        label="Description"
        placeholder="Enter short description"
        register={register}
      />
      {watch('reference')?.length
        ? watch('reference')?.map(({ id }: any, index: number) => (
            <div key={id} tw="mt-5 flex items-end justify-between gap-5">
              <TextInput
                name={`reference[${index}].desc`}
                placeholder="Type here"
                register={register}
                label="Description"
              />
              <TextInput
                label="URL destination"
                placeholder="Type here"
                name={`reference[${index}].href`}
                register={register}
                type="url"
              />
              <Button
                onClick={() => removeResourceFromForm(id!)}
                type="button"
                variant="ghost"
                tw="text-red-700 text-xl"
              >
                <FiX size={48} />
              </Button>
            </div>
          ))
        : null}
      <Button tw="mt-5" type="button" onClick={() => addResourcetoForm()}>
        <FiPlus size={24} />
        Add reference URL(s)
      </Button>

      <div tw="mt-6 flex w-full items-center justify-end gap-4">
        <Button
          variant="ghost"
          type="reset"
          tw="text-blue-500 hover:text-blue-700"
          onClick={() => onCancel?.()}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          isLoading={isSubmitting}
          tw="bg-blue-500 text-white hover:bg-blue-700"
        >
          Submit
        </Button>
      </div>
    </form>
  )
}
