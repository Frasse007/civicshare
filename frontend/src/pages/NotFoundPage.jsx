import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <section className="center-card" aria-labelledby="nf-title">
      <p className="center-card__emoji" aria-hidden="true">🔩</p>
      <h1 id="nf-title">404 - We can&apos;t find that page</h1>
      <p>Looks like this one got lent out and never returned.</p>
      <Link to="/catalog" className="btn btn--primary">Browse the tool library</Link>
    </section>
  );
}
