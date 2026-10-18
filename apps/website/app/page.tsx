import { Nav } from '@/components/Nav'
import { Hero } from '@/components/Hero'
import { Problem } from '@/components/Problem'
import { Solution } from '@/components/Solution'
import { NetworkEffect } from '@/components/NetworkEffect'
import { TrustSecurity } from '@/components/TrustSecurity'
import { SaccoDirectory } from '@/components/SaccoDirectory'
import { RoadmapTeaser } from '@/components/RoadmapTeaser'
import { ClosingCta } from '@/components/ClosingCta'
import { Footer } from '@/components/Footer'

export default function HomePage() {
  return (
    <main>
      <Nav />
      <Hero />
      <Problem />
      <Solution />
      <NetworkEffect />
      <TrustSecurity />
      <SaccoDirectory />
      <RoadmapTeaser />
      <ClosingCta />
      <Footer />
    </main>
  )
}
