import { Link } from 'react-router-dom'
import { gallery } from '../data/gallery'
import { cn } from '../lib/utils'

/** The photographer's name, linked to their portfolio. Inherits the surrounding text style. */
export default function PhotographerLink({ className }) {
  return (
    <Link
      to="/portfolio"
      title={`View ${gallery.photographer}’s portfolio`}
      className={cn('underline-offset-2 transition hover:underline', className)}
    >
      {gallery.photographer}
    </Link>
  )
}
