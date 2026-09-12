import { StyleSheet, TextInput, View } from 'react-native'
import { HeroCarousel, type HeroSlide } from '../ui/HeroCarousel'
import { Icon } from '../ui/Icon'
import { useTheme } from '../../theme/ThemeProvider'

// Bundled promotional slides — no photo assets shipped (same reasoning as the
// card-backdrop feature: no scraping, no generation tool, no upload
// pipeline), so these lean on the same gradient treatment already used
// across the app's own themes and card backdrops.
const SLIDES: HeroSlide[] = [
  {
    colors: ['#4C1D95', '#6D28D9', '#8B5CF6'],
    icon: 'bank',
    title: 'Every SACCO, one app',
    subtitle: 'Browse, join, and manage all your SACCO memberships from a single place.',
  },
  {
    colors: ['#0F3D2E', '#0E7C5A', '#34D399'],
    icon: 'savings',
    title: 'Grow your savings',
    subtitle: 'BOSA and FOSA contributions, tracked in real time, wherever you are.',
  },
  {
    colors: ['#7C2D12', '#C2410C', '#FB923C'],
    icon: 'loan',
    title: 'Loans built around you',
    subtitle: 'Compare rates across your SACCOs and apply in minutes.',
  },
  {
    colors: ['#0C4A6E', '#0369A1', '#38BDF8'],
    icon: 'dividend',
    title: 'Track dividends in real time',
    subtitle: 'See what your membership earns as it is declared and paid out.',
  },
  {
    colors: ['#3B0764', '#7E22CE', '#D946EF'],
    icon: 'security',
    title: 'Bank-grade security',
    subtitle: 'SASRA-regulated SACCOs, encrypted end to end.',
  },
]

type Props = {
  search: string
  onSearchChange: (value: string) => void
  placeholder?: string
  /** Extra top padding (e.g. safe-area inset) when the hero draws edge-to-edge behind the status bar. */
  insetTop?: number
}

export function DiscoverHero({ search, onSearchChange, placeholder = 'Search SACCOs, sectors, counties...', insetTop = 0 }: Props) {
  const { colors: c } = useTheme()

  return (
    <HeroCarousel slides={SLIDES} insetTop={insetTop}>
      <View style={[styles.searchBar, { backgroundColor: c.surface }]}>
        <Icon name="search" size={16} color={c.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder={placeholder}
          placeholderTextColor={c.textMuted}
          value={search}
          onChangeText={onSearchChange}
        />
      </View>
    </HeroCarousel>
  )
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    height: '100%',
  },
})
