import { motion } from 'framer-motion'
import { Button, Reveal, SplitText } from '../../components/ui'
import { usePortfolio } from '../data/config'

const ease = [0.22, 1, 0.36, 1]

/** Intro: oversized greeting, disciplines, bio and portrait, then a one-line facts strip. */
export default function Hero() {
  const { profile, intro, greeting } = usePortfolio()
  const facts = [
    { id: 'availability', k: 'Availability', v: profile.availability, live: true },
    { id: 'focus', k: 'Focus', v: profile.role },
    { id: 'location', k: 'Location', v: profile.location },
    { id: 'experience', k: 'Experience', v: `Since ${profile.since}` },
  ].filter((f) => intro.factList[f.id])

  return (
    <section id="about" className="mx-auto max-w-[1800px] scroll-mt-16 px-4 pt-10 md:px-8 md:pt-16 lg:pt-20">
      <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <SplitText key={greeting} text={greeting} className="text-48-sb text-type-0 md:text-72-sb xl:text-96-sb" />
          <Reveal delay={0.25} y={16}>
            <p className="mt-5 text-20-m text-type-2 md:mt-6">{profile.disciplines.join(', ')}</p>
          </Reveal>
          <Reveal delay={0.35} y={16}>
            <p className="mt-6 max-w-[580px] text-16-r-p text-type-1 md:text-18-r">{profile.bio}</p>
          </Reveal>
          {intro.buttons && <Reveal delay={0.45} y={16} className="mt-8 flex flex-wrap gap-2">
            <Button as="a" href="#work" size="lg" arrow>
              View work
            </Button>
            <Button as="a" href="#contact" size="lg" variant="outline">
              Get in touch
            </Button>
          </Reveal>}
        </div>

        <motion.figure
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="overflow-hidden rounded-lg bg-surface-2 lg:col-span-5 xl:col-span-4"
        >
          <img src={profile.photo} alt={`Portrait of ${profile.name}`} className="aspect-[4/5] w-full object-cover sm:aspect-[4/3] lg:aspect-[4/5]" />
        </motion.figure>
      </div>

      {intro.facts && facts.length > 0 && <Reveal y={12} className="mt-12 grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-6 md:mt-16 lg:grid-cols-4">
        {facts.map((f) => (
          <div key={f.k} className="min-w-0">
            <p className="text-11-sb uppercase text-type-3">{f.k}</p>
            <p className="mt-1.5 flex items-center gap-2 text-14-m text-type-0">
              {f.live && <span className="h-2 w-2 shrink-0 rounded-full bg-success" />}
              {f.v}
            </p>
          </div>
        ))}
      </Reveal>}
    </section>
  )
}
