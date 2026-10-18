// Adapted from useLayouts Polaroid Stack (MIT); see THIRD_PARTY_NOTICES.md.
import { useId, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'

type Project = { title: string; org: string; body: string; stack: string[] }

export default function ProjectShowcase({ projects }: { projects: Project[] }) {
  const [selected, setSelected] = useState(0)
  const id = useId()
  const project = projects[selected]
  if (!project) return null

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % projects.length
    else if (event.key === 'ArrowLeft') next = (index + projects.length - 1) % projects.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = projects.length - 1
    else return
    event.preventDefault()
    setSelected(next)
    document.getElementById(`${id}-project-${next}`)?.focus()
  }

  return (
    <div className="project-showcase">
      <p className="project-hint">Choose a project to explore</p>
      <div className="project-deck" role="tablist" aria-label="Selected projects">
        {projects.map((item, index) => (
          <button type="button" role="tab" key={item.title} id={`${id}-project-${index}`}
            aria-selected={selected === index} aria-controls={`${id}-detail`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => setSelected(index)} onKeyDown={(event) => navigate(event, index)}
            className="project-card"
            style={{ '--card-angle': `${(index - (projects.length - 1) / 2) * 2}deg` } as CSSProperties}>
            <span className="project-card-art" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span>{item.stack[0]}</span>
            </span>
            <span className="project-card-org">{item.org}</span>
            <span className="project-card-title">{item.title}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${id}-detail`} aria-labelledby={`${id}-project-${selected}`} tabIndex={0} className="project-detail">
        <div key={project.title} className="project-detail-copy">
          <p className="org">{project.org}</p>
          <h3>{project.title}</h3>
          <p className="project-description">{project.body}</p>
          <div className="tags">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
        </div>
      </div>
    </div>
  )
}
