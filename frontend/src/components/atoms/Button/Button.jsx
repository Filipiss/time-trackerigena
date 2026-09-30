import './Button.css';

export default function Button({ className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`c-button ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
