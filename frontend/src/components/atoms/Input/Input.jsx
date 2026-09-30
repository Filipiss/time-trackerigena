import './Input.css';

export default function Input({ as = 'input', className = '', ...props }) {
  if (as === 'textarea') {
    return <textarea className={`c-input c-input-atom ${className}`.trim()} {...props} />;
  }

  return <input className={`c-input c-input-atom ${className}`.trim()} {...props} />;
}
