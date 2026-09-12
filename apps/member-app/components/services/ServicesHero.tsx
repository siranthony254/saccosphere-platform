import { Alert } from 'react-native'
import { HeroCarousel, type HeroSlide } from '../ui/HeroCarousel'

type ServiceAction = 'contribute' | 'withdraw' | 'loan' | 'statement' | 'dividends'

type Props = {
  onSelectService: (action: ServiceAction) => void
  insetTop?: number
}

/**
 * Promotional hero for the Services tab — sells what a member can do here
 * and, until the "What's New" API exists, ends with a clearly-labeled
 * placeholder slide rather than fabricated announcements.
 */
export function ServicesHero({ onSelectService, insetTop = 0 }: Props) {
  const slides: HeroSlide[] = [
    {
      colors: ['#0F3D2E', '#0E7C5A', '#34D399'],
      icon: 'card',
      title: 'Contribute in seconds',
      subtitle: 'Deposit savings or share capital instantly via M-Pesa STK push.',
      cta: { label: 'Contribute now', onPress: () => onSelectService('contribute') },
    },
    {
      colors: ['#7C2D12', '#C2410C', '#FB923C'],
      icon: 'loan',
      title: 'Loans built around you',
      subtitle: 'Compare rates across your SACCOs and apply in minutes.',
      cta: { label: 'Apply for a loan', onPress: () => onSelectService('loan') },
    },
    {
      colors: ['#7C1D6F', '#BE185D', '#F472B6'],
      icon: 'withdraw',
      title: 'Withdraw when you need to',
      subtitle: 'Send eligible savings straight to your M-Pesa number.',
      cta: { label: 'Withdraw savings', onPress: () => onSelectService('withdraw') },
    },
    {
      colors: ['#0C4A6E', '#0369A1', '#38BDF8'],
      icon: 'dividend',
      title: 'Your dividends, tracked',
      subtitle: 'See what your membership earns as it is declared and paid out.',
      cta: { label: 'View dividends', onPress: () => onSelectService('dividends') },
    },
    {
      colors: ['#3B0764', '#7E22CE', '#D946EF'],
      icon: 'bulb',
      title: "What's New",
      subtitle: 'A running feed of app and SACCO updates is coming to this space soon.',
      cta: {
        label: 'Coming soon',
        onPress: () => Alert.alert("What's New", "We're building a live feed of app and SACCO updates for this space. Check back soon!"),
      },
    },
  ]

  return <HeroCarousel slides={slides} insetTop={insetTop} />
}
