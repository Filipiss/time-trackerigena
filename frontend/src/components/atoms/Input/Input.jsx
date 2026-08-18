import './Input.css';

export default function Input({ as = 'input', className = '', ...props }) {
  if (as === 'textarea') {
    return <textarea className={`input input-atom ${className}`.trim()} {...props} />;
  }

  return <input className={`input input-atom ${className}`.trim()} {...props} />;
}
