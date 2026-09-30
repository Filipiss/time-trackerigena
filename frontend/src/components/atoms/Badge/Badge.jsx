import './Badge.css';

export default function Badge({ className = '', children, ...props }) {
  return (
    <span className={`o-badge-atom ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
