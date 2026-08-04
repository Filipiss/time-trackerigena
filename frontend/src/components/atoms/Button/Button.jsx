import './Button.css';

export default function Button({ className = '', type = 'button', children, ...props }) {
  return (
    <button type={type} className={`button-atom ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}
