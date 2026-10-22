import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { profile } from './data/profile'
import './motorsport.css'
const Profile = lazy(() => import('./Profile'))
const Circuit = lazy(() => import('./components/Circuit'))
export type Mood = 'sunset' | 'night' | 'day'
export type Vehicle = 'car' | 'bike'
export type Mode = 'garage' | 'tour' | 'drive'
const stops = ['Starting grid', 'Career pit lane', 'Innovation paddock', 'Trophy garage', 'Contact lounge']
class SceneBoundary extends Component<{children: ReactNode}, {failed: boolean}> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <div className="scene-fallback">The 3D garage is unavailable on this device. Explore every destination below, or open Quick Profile.</div> : this.props.children }
}
function preference<T extends string>(key: string, allowed: T[], fallback: T): T {
  try { const value = localStorage.getItem(key) as T; return allowed.includes(value) ? value : fallback } catch { return fallback }
}
export default function App() {
  const [classic, setClassic] = useState(false)
  const [vehicle, setVehicle] = useState<Vehicle>(() => preference('kg.vehicle.v1', ['car', 'bike'], 'car'))
  const [mood, setMood] = useState<Mood>(() => preference('kg.mood.v1', ['sunset', 'night', 'day'], 'sunset'))
  const [mode, setMode] = useState<Mode>('garage')
  const [stop, setStop] = useState<number | null>(null)
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches)
  const input = useRef({ throttle: 0, steering: 0 })
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  useEffect(() => { try { localStorage.setItem('kg.vehicle.v1', vehicle); localStorage.setItem('kg.mood.v1', mood) } catch { /* optional persistence */ } }, [vehicle, mood])
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    if (stop !== null) { opener.current = document.activeElement as HTMLElement; dialog.current?.showModal() }
    else { dialog.current?.close(); opener.current?.focus() }
    input.current = { throttle: 0, steering: 0 }
  }, [stop])
  useEffect(() => {
    const keys = new Set<string>()
    const sync = () => { input.current = { throttle: +(keys.has('ArrowUp') || keys.has('w')) - +(keys.has('ArrowDown') || keys.has('s')), steering: +(keys.has('ArrowRight') || keys.has('d')) - +(keys.has('ArrowLeft') || keys.has('a')) } }
    const down = (e: KeyboardEvent) => {
      if (mode !== 'drive' || stop !== null || classic || /INPUT|SELECT|TEXTAREA|BUTTON/.test((e.target as HTMLElement).tagName)) return
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)) { e.preventDefault(); keys.add(e.key); sync() }
    }
    const up = (e: KeyboardEvent) => { keys.delete(e.key); sync() }
    const reset = () => { keys.clear(); sync() }
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', reset)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', reset); reset() }
  }, [mode, stop, classic])
  if (classic) return <><button className="back-to-track" onClick={() => setClassic(false)}>← Back to the circuit</button><Suspense fallback={<p>Loading profile…</p>}><Profile disableScene /></Suspense></>
  return <div className={`motorsport mood-${mood}`}>
    <a className="race-skip" href="#destinations">Skip to destinations</a>
    <div className="race-world"><SceneBoundary><Suspense fallback={<div className="scene-fallback">Preparing your garage…</div>}><Circuit vehicle={vehicle} mood={mood} mode={mode} paused={stop !== null} reduced={reduced} input={input} onStop={setStop} /></Suspense></SceneBoundary></div>
    <div className="race-vignette" />
    <header className="race-nav"><a className="race-brand" href="#" onClick={() => setMode('garage')}>KG<span>/</span><small>THE PERSONAL CIRCUIT</small></a><button onClick={() => setClassic(true)}>Quick Profile ↗</button></header>
    <main className="race-overlay">
      <div className="race-intro"><p className="race-kicker"><span /> {mode === 'garage' ? 'WELCOME TO MY WORLD' : mode === 'tour' ? 'GUIDED LAP · STOPS AT EACH DESTINATION' : 'DRIVE · ARROWS OR WASD'}</p><h1>KARTHIK<br /><em>GUDURI.</em></h1><p className="race-subtitle">AEM Cloud Architect. AI Product Builder.<br />Driven by what comes next.</p></div>
      <aside className="race-config" aria-label="Garage configuration"><p className="race-label">01 / CHOOSE YOUR RIDE</p><div className="race-segment">{(['car','bike'] as Vehicle[]).map(v => <button key={v} aria-pressed={vehicle === v} onClick={() => setVehicle(v)}>{v === 'car' ? 'Sports car' : 'Superbike'}<small>{v === 'car' ? 'PRECISION / POWER' : 'FREEDOM / FOCUS'}</small></button>)}</div><p className="race-label">02 / SET THE ATMOSPHERE</p><div className="race-moods">{(['day','sunset','night'] as Mood[]).map(m => <button key={m} aria-pressed={mood === m} onClick={() => setMood(m)}>{m === 'night' ? 'Neon night' : m}</button>)}</div><div className="race-actions"><button className="race-primary" onClick={() => {setMode('tour'); (document.activeElement as HTMLElement)?.blur()}}>Take a guided lap ↗</button><button onClick={() => {setMode('drive'); (document.activeElement as HTMLElement)?.blur()}}>Drive yourself →</button></div>{mode !== 'garage' && <button className="race-return" onClick={() => setMode('garage')}>Return to garage</button>}<label className="motion-option"><input type="checkbox" checked={reduced} onChange={e => setReduced(e.target.checked)} /> Reduced camera motion</label></aside>
    </main>
    {mode === 'drive' && <div className="touch-drive" aria-label="Driving controls">{(['left','accelerate','brake','right'] as const).map(action => <button key={action} onPointerDown={e => {e.currentTarget.setPointerCapture(e.pointerId); if(action==='left'||action==='right') input.current.steering=action==='left'?-1:1; else input.current.throttle=action==='accelerate'?1:-1}} onPointerUp={() => {input.current={throttle:0,steering:0}}} onPointerCancel={() => {input.current={throttle:0,steering:0}}}>{action === 'left' ? '←' : action === 'right' ? '→' : action === 'accelerate' ? 'Accelerate' : 'Brake'}</button>)}</div>}
    <nav id="destinations" className="race-stops" aria-label="Portfolio destinations">{stops.map((name,i) => <button key={name} onClick={() => setStop(i)}><span>0{i+1}</span>{name}<b>↗</b></button>)}</nav>
    <div className="race-footer"><span>14+ YEARS OF ENGINEERING / 100+ BRAND SITES</span><span>EXPLORE AT YOUR OWN PACE</span></div>
    <dialog ref={dialog} className="race-dialog" onCancel={() => setStop(null)} onClose={() => setStop(null)}><button className="dialog-close" autoFocus onClick={() => setStop(null)}>Close ×</button>{stop !== null && <><p className="race-label">DESTINATION 0{stop+1}</p><h2>{stops[stop]}</h2>{stop===0 && <>{profile.about.map(p=><p key={p}>{p}</p>)}</>}{stop===1 && profile.career.map(job=><article key={job.company}><small>{job.period}</small><h3>{job.company}</h3><p>{job.role}</p><ul>{job.points.map(p=><li key={p}>{p}</li>)}</ul></article>)}{stop===2 && <><article><h3>Tomorrow AI Land</h3><p>My space for learning and building with AI.</p><a href="https://www.tomorrowailand.us/" target="_blank" rel="noreferrer">Explore Tomorrow AI Land ↗</a></article>{profile.work.map(p=><article key={p.title}><h3>{p.title}</h3><p>{p.body}</p></article>)}</>}{stop===3 && <>{profile.stats.map(s=><article key={s.label}><h3>{s.value}</h3><p>{s.label}</p></article>)}{profile.education.map(e=><p key={e.degree}>{e.degree} · {e.place}</p>)}</>}{stop===4 && <><p>Let’s build something that scales.</p><p><a href={`mailto:${profile.email}`}>{profile.email}</a></p><a href={profile.linkedin} target="_blank" rel="noreferrer">Connect on LinkedIn ↗</a>{profile.resumeUrl && <p><a href={profile.resumeUrl}>Download résumé</a></p>}</>}</>}</dialog>
  </div>
}
