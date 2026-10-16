import { lazy, Suspense, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { profile } from './data/profile'

gsap.registerPlugin(ScrollTrigger, useGSAP)
const Scene = lazy(() => import('./components/Scene'))

export default function App() {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.hero-line', { y: 40, opacity: 0, duration: 1, stagger: 0.12, ease: 'power3.out' })
        gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
          gsap.from(el, {
            y: 50,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%' },
          })
        })
        gsap.to('.hero-canvas', {
          yPercent: 25,
          opacity: 0.25,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        })
      })
    },
    { scope: root },
  )

  const year = new Date().getFullYear()

  return (
    <div ref={root}>
      <nav className="nav">
        <a href="#top" className="logo">KG<span>.</span></a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#career">Career</a>
          <a href="#work">Work</a>
          <a href="#contact">Contact</a>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-canvas" aria-hidden="true">
          <Suspense fallback={null}>
            <Scene />
          </Suspense>
        </div>
        <div className="hero-copy">
          <p className="eyebrow hero-line">{profile.role}</p>
          <h1 className="hero-line">{profile.name}</h1>
          <p className="lede hero-line">{profile.tagline}</p>
          <div className="cta hero-line">
            <a className="btn primary" href="#work">See my work</a>
            <a className="btn" href={`mailto:${profile.email}`}>Get in touch</a>
          </div>
        </div>
        <div className="scroll-cue" aria-hidden="true">scroll</div>
      </header>

      <main>
        <section id="about" className="section">
          <p className="section-label reveal">01 — About</p>
          <div className="about-grid">
            <div className="reveal">
              {profile.about.map((p, i) => (
                <p key={i} className="body-lg">{p}</p>
              ))}
            </div>
            <ul className="stats reveal">
              {profile.stats.map((s) => (
                <li key={s.label}>
                  <strong>{s.value}</strong>
                  <span>{s.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {profile.introVideo && (
          <section className="section intro-video">
            <p className="section-label reveal">Meet Karthik</p>
            <div className="video-frame reveal">
              <video
                src={profile.introVideo}
                poster={profile.introPoster ?? undefined}
                controls
                playsInline
                preload="metadata"
              />
            </div>
          </section>
        )}

        <section className="section">
          <p className="section-label reveal">02 — What I do</p>
          <div className="cards">
            {profile.whatIDo.map((c) => (
              <article key={c.title} className="card reveal">
                <h3>{c.title}</h3>
                <p>{c.body}</p>
                <div className="tags">{c.tags.map((t) => <span key={t}>{t}</span>)}</div>
              </article>
            ))}
          </div>
        </section>

        <section id="career" className="section">
          <p className="section-label reveal">03 — Career</p>
          <ol className="timeline">
            {profile.career.map((job) => (
              <li key={job.company + job.period} className="reveal">
                <div className="when">{job.period}</div>
                <div>
                  <h3>{job.company}</h3>
                  <p className="job-role">{job.role}</p>
                  <ul>{job.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="work" className="section">
          <p className="section-label reveal">04 — Selected work</p>
          <div className="work">
            {profile.work.map((w, i) => (
              <article key={w.title} className="work-item reveal">
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <p className="org">{w.org}</p>
                  <h3>{w.title}</h3>
                  <p>{w.body}</p>
                  <div className="tags">{w.stack.map((t) => <span key={t}>{t}</span>)}</div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section">
          <p className="section-label reveal">05 — Stack</p>
          <div className="marquee reveal" aria-label="Technologies">
            <div className="marquee-track">
              {[...profile.stack, ...profile.stack].map((t, i) => (
                <span key={i} aria-hidden={i >= profile.stack.length}>{t}</span>
              ))}
            </div>
          </div>
          <div className="edu reveal">
            {profile.education.map((e) => (
              <div key={e.degree}><strong>{e.degree}</strong> · {e.place}</div>
            ))}
          </div>
        </section>

        <section id="contact" className="section contact">
          <p className="section-label reveal">06 — Contact</p>
          <h2 className="reveal">Let’s build something that scales.</h2>
          <a className="mail reveal" href={`mailto:${profile.email}`}>{profile.email}</a>
          <div className="socials reveal">
            {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn ↗</a>}
            {profile.github && <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>}
            {profile.resumeUrl && <a href={profile.resumeUrl} target="_blank" rel="noreferrer">Résumé ↗</a>}
          </div>
        </section>
      </main>

      <footer className="footer">
        <span>© {year} {profile.fullName}</span>
        <span>{profile.location}</span>
      </footer>
    </div>
  )
}
