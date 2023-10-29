import Image from 'next/image'
import Link from 'next/link'
import inkathonLogo from 'public/brand/inkathon-logo.png'
import githubIcon from 'public/icons/github-button.svg'
import sponsorIcon from 'public/icons/sponsor-button.svg'
import telegramIcon from 'public/icons/telegram-button.svg'
import vercelIcon from 'public/icons/vercel-button.svg'
import { FC } from 'react'
import 'twin.macro'
import tw, { styled } from 'twin.macro'

const StyledIconLink = styled(Link)(() => [
  tw`opacity-90 transition-all hover:(-translate-y-0.5 opacity-100)`,
])

export const HomePageTitle: FC = () => {
  const desc = 'Full-Stack DApp Boilerplate for Substrate and ink! Smart Contracts'
  const githubHref = 'https://github.com/bolajahmad/proownas'
  const deployHref = 'https://github.com/scio-labs/inkathon#deployment'
  const sponsorHref = 'mailto:bjahmad4tech@gmail.com'

  return (
    <>
      <div tw="flex flex-col items-center text-center font-mono">
        <div
          className="group"
          tw="flex cursor-pointer items-center gap-4 rounded-3xl bg-gray-900 py-1.5 px-3.5 transition-all"
        >
          <Image src={inkathonLogo} priority width={60} alt="ink!athon Logo" />
          <h1 tw="font-black text-[2.5rem]">Proownas DAO</h1>
        </div>

        <p tw="mt-4 mb-6 text-gray-300 md:max-w-[40rem]">
          The community of synthetic real estate owners looking to earn liquid rewards on their
          tokens. Join the DAO and immediately start earning!
        </p>

        {/* Github & Vercel Buttons */}
        <div tw="flex space-x-2">
          <StyledIconLink href={githubHref} target="_blank">
            <Image src={githubIcon} priority height={32} alt="Github Repository" />
          </StyledIconLink>
          <StyledIconLink href={deployHref} target="_blank">
            <Image src={vercelIcon} priority height={32} alt="Deploy with Vercel" />
          </StyledIconLink>
          <StyledIconLink href={sponsorHref} target="_blank">
            <Image src={sponsorIcon} priority height={32} alt="Sponsor the Project" />
          </StyledIconLink>
        </div>

        {/* <div tw="my-14 w-14 bg-gray-800 h-[2px]" ></div>/ */}
      </div>
    </>
  )
}
