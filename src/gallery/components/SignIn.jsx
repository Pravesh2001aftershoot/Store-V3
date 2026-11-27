import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Briefcase, CalendarX, CaretRight, EnvelopeSimple, LockSimple, UserCircle, UsersThree } from '@phosphor-icons/react'
import { Button } from '../../components/ui'
import { cn } from '../../lib/utils'
import { rolePlural } from '../../photographer-dashboard/gallery/access'
import { formatDate } from '../../photographer-dashboard/gallery/share'
import { SCAN_MATCH, personById, withFaces } from '../data/faces'
import { emailOk, isApproved } from '../lib/visitor'
import { FaceAvatar, ScanStep } from './FacePane'

const ease = [0.22, 1, 0.36, 1]

const ROLE_INFO = {
  client: { icon: UserCircle, hint: (g) => `The gallery is for you: ${g.client}` },
  guest: { icon: UsersThree, hint: () => 'You were there and want to see the photos' },
  vendor: { icon: Briefcase, hint: () => 'You worked on the day, e.g. planner, florist or venue' },
}

/**
 * The sign-in screen in front of a client gallery, built from the photographer's Settings step
 * (lib/visitor.js decides which steps apply): pick a role → email → password → face scan. Each step
 * saves to the visitor's session as it's passed; the gallery opens once none are left.
 * An expired link shows a dead end instead.
 *
 * Desktop / tablet: the cover photo on the left, the form on the right. Phone: the photo on top.
 */
export default function SignIn({ gallery, cover, photos, state }) {
  const { visitor, session, setSession } = state
  const step = visitor.expired ? 'expired' : visitor.steps[0]
  const [dir, setDir] = useState(1)
  const canChangeRole = visitor.mode === 'roles' && !visitor.roleFixed && !!visitor.aud && step !== 'role'

  const pass = (patch) => { setDir(1); setSession(patch) }
  const changeRole = () => { setDir(-1); setSession({ role: null, email: null, password: null, face: null }) }

  const focus = cover?.focus ?? { x: 50, y: 50 }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-surface-1 md:flex-row">
      {/* Cover photo */}
      <div className="relative h-[34vh] min-h-[220px] shrink-0 overflow-hidden bg-type-0 md:sticky md:top-0 md:h-[100dvh] md:flex-1">
        {cover && (
          <motion.img
            src={cover.src}
            alt=""
            initial={{ scale: 1.06, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease }}
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: `${focus.x}% ${focus.y}%` }}
            draggable={false}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white md:p-10">
          <p className="text-11-sb uppercase tracking-wider text-white/70">{gallery.photographer}</p>
          <h1 className="mt-1.5 text-24-m md:text-30-m">{gallery.title}</h1>
          {gallery.date && <p className="mt-1 text-13-r text-white/70">{gallery.date}</p>}
        </div>
      </div>

      {/* Form */}
      <div className="relative z-10 -mt-4 flex flex-1 flex-col rounded-t-2xl bg-surface-1 md:mt-0 md:w-[480px] md:flex-none md:rounded-none lg:w-[540px]">
        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-5 py-8 md:px-8 md:py-12">
          {canChangeRole && (
            <button
              onClick={changeRole}
              className="mb-6 flex items-center gap-1.5 self-start rounded-full py-1 pr-2 text-13-r text-type-2 transition hover:text-type-0"
            >
              <ArrowLeft size={14} /> Not {articled(visitor.aud)}? Change
            </button>
          )}
          <AnimatePresence mode="wait" initial={false} custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.3, ease }}
            >
              {step === 'expired' && <Expired gallery={gallery} expiry={visitor.expiry} />}
              {step === 'role' && <RoleStep gallery={gallery} roles={visitor.roles} onPick={(role) => pass({ role })} />}
              {step === 'email' && (
                <EmailStep
                  gallery={gallery}
                  aud={visitor.aud}
                  d={visitor.d}
                  approved={visitor.d.signIn === 'approved'}
                  initial={session?.email ?? ''}
                  onPass={(email) => pass({ email })}
                />
              )}
              {step === 'password' && <PasswordStep gallery={gallery} code={visitor.d.pin.value} onPass={(password) => pass({ password })} />}
              {step === 'face' && <FaceStep photos={photos} scope={visitor.d.faceSearch.scope} onPass={(face) => pass({ face })} />}
            </motion.div>
          </AnimatePresence>
        </div>
        <p className="px-5 pb-6 text-center text-12-r text-type-3 md:pb-8">
          Shared privately by {gallery.photographer}
        </p>
      </div>
    </div>
  )
}

const articled = (role) => (role === 'client' ? 'the client' : `a ${role}`)

function Heading({ icon: Icon, title, body }) {
  return (
    <div>
      {Icon && (
        <span className="mb-5 grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-type-0">
          <Icon size={22} />
        </span>
      )}
      <h2 className="text-24-m text-type-0">{title}</h2>
      {body && <p className="mt-1.5 text-14-r-p text-type-2">{body}</p>}
    </div>
  )
}

// ── Steps ───────────────────────────────────────────────────────────────────

function Expired({ gallery, expiry }) {
  return (
    <Heading
      icon={CalendarX}
      title="This link has expired"
      body={`The link to ${gallery.title} stopped working on ${formatDate(expiry)}. Ask ${gallery.photographer} for a new one.`}
    />
  )
}

/** One link for every role: the visitor says who they are. A tap moves straight on. */
function RoleStep({ gallery, roles, onPick }) {
  return (
    <>
      <Heading title="Welcome" body={`How do you know ${gallery.client}? Pick one to open the gallery.`} />
      <div role="list" className="mt-6 grid gap-2">
        {roles.map((r) => {
          const info = ROLE_INFO[r]
          const Icon = info?.icon ?? UserCircle
          return (
            <button
              key={r}
              role="listitem"
              onClick={() => onPick(r)}
              className="group flex items-center gap-3.5 rounded-xl border border-border bg-surface-1 p-4 text-left transition hover:border-type-3 hover:bg-surface-0 active:scale-[0.99]"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-type-0">
                <Icon size={20} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-14-m text-type-0">I’m {articled(r)}</span>
                <span className="block text-12-r text-type-2">{info?.hint(gallery)}</span>
              </span>
              <CaretRight size={16} className="shrink-0 text-type-3 transition group-hover:translate-x-0.5 group-hover:text-type-0" />
            </button>
          )
        })}
      </div>
    </>
  )
}

/**
 * Email. With an approved list only listed emails get in (case doesn't matter); otherwise any valid
 * email is collected. A wrong address keeps what was typed and says why.
 */
function EmailStep({ gallery, aud, d, approved, initial, onPass }) {
  const [email, setEmail] = useState(initial)
  const [error, setError] = useState(null)
  const submit = (e) => {
    e.preventDefault()
    const v = email.trim()
    if (!emailOk(v)) return setError('Enter a valid email address')
    if (approved && !isApproved(d, v)) {
      return setError(`This email isn’t on the list for ${rolePlural(aud).toLowerCase()}. Use the address the link was sent to, or ask ${gallery.photographer} to add you.`)
    }
    onPass(v)
  }
  return (
    <form onSubmit={submit} noValidate>
      <Heading
        icon={EnvelopeSimple}
        title={approved ? 'Sign in with your email' : 'Enter your email'}
        body={approved
          ? `Use the email address ${gallery.photographer} sent this gallery to.`
          : `${gallery.photographer} asks for your email before you view ${gallery.title}.`}
      />
      <label className="mt-6 block">
        <span className="mb-1.5 block text-13-m text-type-1">Email</span>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(e) => { setEmail(e.target.value.slice(0, 120)); setError(null) }}
          placeholder="you@example.com"
          aria-invalid={!!error}
          // 16px on phones so iOS doesn't zoom the page when the field takes focus.
          className={cn(
            'h-12 w-full rounded-lg border bg-surface-1 px-3.5 text-16-r text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0 focus:ring-4 focus:ring-black/5 md:text-14-r',
            error ? 'border-destructive' : 'border-input'
          )}
        />
      </label>
      <p className="mt-1.5 min-h-[18px] text-12-r text-destructive" aria-live="polite">{error}</p>
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={!email.trim()}>
        Continue
      </Button>
      {!approved && <p className="mt-4 text-12-r-p text-type-3">{gallery.photographer} will see that you visited. Your email isn’t shared with anyone else.</p>}
    </form>
  )
}

/** Letters and numbers, 4–20. Checked on Open gallery; a wrong one shakes, clears and says so. */
function PasswordStep({ gallery, code: expected, onPass }) {
  const [code, setCode] = useState('')
  const [wrong, setWrong] = useState(0) // bumped per wrong try: remounts the field to replay the shake

  const tryCode = (c) => {
    if (c.length < 4) return
    if (c === expected) return onPass(c)
    setWrong((w) => w + 1)
    setCode('')
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); tryCode(code) }}>
      <Heading icon={LockSimple} title="Enter the password" body={`${gallery.photographer} shared a password for this gallery with you.`} />
      <motion.input
        key={wrong}
        autoFocus
        value={code}
        onChange={(e) => {
          setCode(e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 20))
        }}
        animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4, ease }}
        type="password"
        autoComplete="off"
        aria-label="Gallery password"
        aria-invalid={wrong > 0 && !code}
        placeholder="Password"
        className={cn(
          'mt-6 h-14 w-full rounded-xl border bg-surface-1 text-center text-20-m tracking-wider text-type-0 outline-none transition placeholder:text-type-3 focus:border-type-0',
          wrong > 0 && !code ? 'border-destructive' : 'border-input'
        )}
      />
      <p className="mt-2 min-h-[18px] text-12-r text-destructive" aria-live="polite">
        {wrong > 0 && !code ? `That password isn’t right. Check the message from ${gallery.photographer}.` : ''}
      </p>
      <Button type="submit" size="lg" className="mt-3 w-full" disabled={code.length < 4}>
        Open gallery
      </Button>
    </form>
  )
}

/**
 * Face scan sign-in: the same camera / selfie scan as Find people, then "Is this you?".
 * The scan is simulated (data/faces.js): it always finds SCAN_MATCH.
 */
function FaceStep({ photos, scope, onPass }) {
  const [found, setFound] = useState(null) // the selfie, once the scan has run
  const [attempt, setAttempt] = useState(0)
  const person = personById[SCAN_MATCH]
  const count = withFaces(photos, [SCAN_MATCH]).length

  if (found && person) {
    return (
      <div className="flex flex-col items-center text-center">
        <div className="flex items-center justify-center">
          <img src={found} alt="Your selfie" className="h-20 w-20 rounded-full object-cover ring-4 ring-surface-1" />
          <FaceAvatar person={person} className="-ml-4 h-24 w-24 ring-4 ring-surface-1" />
        </div>
        <h2 className="mt-6 text-24-m text-type-0">Is this you?</h2>
        <p className="mt-1.5 text-14-r-p text-type-2">
          {scope === 'own'
            ? `We found you in ${count} photo${count === 1 ? '' : 's'}. You’ll see the photos you’re in.`
            : `We found you in ${count} photo${count === 1 ? '' : 's'}. You can show just those from People.`}
        </p>
        <div className="mt-6 grid w-full gap-2">
          <Button size="lg" onClick={() => onPass(SCAN_MATCH)}>Yes, that’s me</Button>
          <Button variant="ghost" onClick={() => { setFound(null); setAttempt((a) => a + 1) }}>That’s not me, scan again</Button>
        </div>
      </div>
    )
  }
  return (
    <>
      <Heading title="Scan your face to sign in" body={scope === 'own' ? 'We’ll open the gallery on the photos you’re in.' : 'We’ll use it to find the photos you’re in.'} />
      <div className="mt-6">
        <ScanStep key={attempt} total={photos.length} onFound={setFound} />
      </div>
    </>
  )
}
