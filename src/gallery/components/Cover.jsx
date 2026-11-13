import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Handbag } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import PhotographerLink from '../../components/PhotographerLink'

const ease = [0.22, 1, 0.36, 1]

/** Full-screen cover: image, title, date, and the two ways in (gallery or store). */
export default function Cover({ gallery, photo, total, onEnter }) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const fade = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <section ref={ref} className="relative h-[100svh] min-h-[520px] overflow-hidden bg-type-0 text-white">
      <motion.img
        src={photo.src}
        alt=""
        style={{ y }}
        initial={{ scale: 1.08, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/65" />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-5 md:px-8">
        <img src={gallery.logo} alt={gallery.studio} className="h-7 w-auto brightness-0 invert md:h-8" draggable={false} />
        <Link
          to="/store"
          className="flex items-center gap-2 rounded-full border border-white/30 px-3.5 py-2 text-13-m text-white backdrop-blur-sm transition hover:bg-white/10"
        >
          <Handbag size={15} /> Print store
        </Link>
      </div>

      <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-0 px-4 pb-12 md:px-8 md:pb-16">
        <div className="mx-auto flex max-w-[1360px] flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.3 }}
            className="text-12-sb uppercase text-white/75"
          >
            {gallery.date} · {total} photos
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease, delay: 0.4 }}
            className="mt-4 max-w-[900px] text-48-sb sm:text-60-sb lg:text-72-sb"
          >
            {gallery.client}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.55 }}
            className="mt-3 text-16-r text-white/80"
          >
            Photographed by <PhotographerLink className="hover:text-white" />
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease, delay: 0.7 }}
            className="mt-8 flex flex-wrap justify-center gap-3"
          >
            <Button variant="light" size="lg" onClick={onEnter}>
              View gallery
            </Button>
            <Button
              as={Link}
              to="/store"
              size="lg"
              className="border border-white/30 bg-transparent text-white shadow-none hover:bg-white/10"
              arrow
            >
              Shop prints
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}
