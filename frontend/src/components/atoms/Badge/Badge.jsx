import './Badge.css';

export default function Badge({ className = '', children, ...props }) {
  return (
    <span className={`badge-atom ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
