import { useReveal } from '../hooks/useReveal.js';

// Wraps children in a scroll-triggered entrance animation. `delay` staggers siblings.
export default function Reveal({ children, delay = 0, as: Tag = 'div', className = '' }) {
  const [ref, visible] = useReveal();
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'reveal--in' : ''} ${className}`} style={{ '--reveal-delay': `${delay}ms` }}>
      {children}
    </Tag>
  );
}
