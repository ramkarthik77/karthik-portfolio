import { profile } from "../data/profile";
import { destinations } from "./config";
export default function DestinationContent({ index }: { index: number }) {
  const d = destinations[index];
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
        <div className="career-stops">
          {profile.career.map((job) => (
            <article key={job.company}>
              <small>{job.period}</small>
              <h3>{job.company}</h3>
              <p>{job.role}</p>
              <ul>
                {job.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
      {index === 2 && (
        <>
          <article className="featured-project">
            <small>PERSONAL PROJECT / AI EDUCATION</small>
            <h3>Tomorrow AI Land</h3>
            <p>
              A place to learn AI by building, one practical step at a time.
            </p>
            <a
              href="https://www.tomorrowailand.us/"
              target="_blank"
              rel="noreferrer"
            >
              Explore the learning platform ↗
            </a>
          </article>
          {profile.work.map((p) => (
            <article key={p.title}>
              <small>{p.org}</small>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <div className="project-tags">
                {p.stack.map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            </article>
          ))}
        </>
      )}
      {index === 3 && (
        <>
          <p className="panel-lead">
            Engineering at scale.
            <br />
            Always learning.
          </p>
          <div className="profile-numbers">
            {profile.stats.map((s) => (
              <div key={s.label}>
                <strong>{s.value}</strong>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <h3>Education</h3>
          {profile.education.map((e) => (
            <p key={e.degree}>
              {e.degree} · {e.place}
            </p>
          ))}
          <h3>Tools of the trade</h3>
          <div className="project-tags">
            {profile.stack.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
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
