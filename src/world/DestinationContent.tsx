import { profile } from "../data/profile";
import { useState } from "react";
import { destinations } from "./config";
export default function DestinationContent({ index }: { index: number }) {
  const d = destinations[index];
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <>
      <p className="park-eyebrow">
        {d.number} / {d.label}
      </p>
      <h2>{d.name}</h2>
      {index === 0 && (
        <>
          <p className="panel-lead">
            Hi, I’m Karthik.
            <br />I build platforms that move brands forward.
          </p>
          {profile.about.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <div className="profile-numbers">
            {profile.stats.slice(0, 2).map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
      {index === 1 && (
        <div className="cinematic-timeline">
          <p className="panel-lead">From hands-on engineering to enterprise platform architecture.</p>
          {profile.career.slice().reverse().map((job, i) => (
            <article className="timeline-chapter" key={job.company}>
              <span className="chapter-count">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <small>{job.period}</small>
                <h3>{job.company}</h3>
                <strong>{job.role}</strong>
                <p>{job.points[0]}</p>
                <button type="button" className="chapter-toggle" aria-expanded={expanded === job.company} onClick={() => setExpanded(expanded === job.company ? null : job.company)}>
                  {expanded === job.company ? "Hide highlights −" : "Explore chapter +"}
                </button>
                {expanded === job.company && <ul>{job.points.map((point) => <li key={point}>{point}</li>)}</ul>}
              </div>
            </article>
          ))}
        </div>
      )}
      {index === 2 && (
        <div className="cinematic-projects">
          <p className="panel-lead">Ideas into products. Engineering into impact.</p>
          {[
            { title: "Fluxa", type: "AI WEBSITE LIFECYCLE", description: "A product initiative for website discovery, migration, validation and delivery.", stages: ["Discover", "Transform", "Validate", "Deliver"], status: "In development" },
            { title: "Sitecraft", type: "ENTERPRISE CONTENT EXPERIENCE", description: "An enterprise CMS concept bringing content authoring, branching and human approval into one experience.", stages: ["Author", "Review", "Approve", "Release"], status: "In development" },
            { title: "Tomorrow AI Land", type: "AI EDUCATION", description: "Hands-on AI learning through lessons, labs and real projects.", stages: ["Learn", "Build", "Test", "Share"], status: "Live learning site", url: "https://www.tomorrowailand.us/" },
            { title: "AEM Modernization", type: "CLOUD PLATFORM ARCHITECTURE", description: "Enterprise-scale content architecture, cloud migrations, observability and reliable delivery.", stages: ["Architect", "Migrate", "Operate", "Improve"], status: "Professional experience" }
          ].map((project, i) => (
            <article className="cinematic-project" key={project.title}>
              <div className="project-topline"><small>PROJECT {String(i + 1).padStart(2, "0")}</small><small>{project.type}</small></div>
              <h3>{project.title}</h3>
              <p>{project.description}</p>
              <div className="project-journey" aria-label={project.title + " process"}>
                {project.stages.map((stage, j) => <span key={stage}><small>{String(j + 1).padStart(2, "0")}</small>{stage}</span>)}
              </div>
              <div className="project-bottomline"><small>{project.status}</small>{"url" in project && project.url && <a href={project.url} target="_blank" rel="noopener noreferrer">Visit project ↗</a>}</div>
            </article>
          ))}
          <h3>Selected enterprise work</h3>
          {profile.work.map((project) => (
            <article className="work-detail" key={project.title}>
              <small>{project.org}</small><h3>{project.title}</h3><p>{project.body}</p>
              <div className="project-tags">{project.stack.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </article>
          ))}
        </div>
      )}
      {index === 3 && (
        <>
          <p className="panel-lead">Engineering platforms, not just pages.</p>
          <div className="architecture-map" aria-label="Platform architecture with connected capabilities">
            <div className="architecture-center"><small>PLATFORM CORE</small><strong>AEM + CLOUD</strong></div>
            <div className="architecture-spokes">
              {["Digital experiences", "Content operations", "Cloud delivery", "Observability", "AI workflows", "Governance"].map((name, i) => (
                <div className="architecture-node" key={name}><span className="node-light" /><small>0{i + 1}</small><strong>{name}</strong></div>
              ))}
            </div>
          </div>
          <h3>How I build</h3>
          <div className="capability-grid">
            {profile.whatIDo.map((item, i) => <article key={item.title}><small>CAPABILITY 0{i + 1}</small><h3>{item.title}</h3><p>{item.body}</p><div className="project-tags">{item.tags.map(t => <span key={t}>{t}</span>)}</div></article>)}
          </div>
          <div className="profile-numbers">{profile.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div>
          <h3>Education</h3>
          {profile.education.map((item) => <p key={item.degree}>{item.degree} · {item.place}</p>)}
        </>
      )}
      {index === 4 && (
        <>
          <p className="panel-lead">
            Great ideas deserve
            <br />a great starting grid.
          </p>
          <p>
            Let’s talk about content platforms, cloud architecture, and building
            with AI.
          </p>
          <a className="panel-cta" href={`mailto:${profile.email}`}>
            Say hello ↗
          </a>
          <p>
            <a href={profile.linkedin} target="_blank" rel="noreferrer">
              Find me on LinkedIn ↗
            </a>
          </p>
          {!profile.resumeUrl && <p>Résumé available upon request — email me for the latest copy.</p>}
          {profile.github && <p><a href={profile.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a></p>}
          {profile.resumeUrl && (
            <p>
              <a href={profile.resumeUrl} target="_blank" rel="noreferrer">
                Download my résumé ↗
              </a>
            </p>
          )}
        </>
      )}
    </>
  );
}
