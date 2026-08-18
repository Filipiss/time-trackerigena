import './Select.css';

export default function Select({ className = '', children, ...props }) {
  return (
    <select className={`input select-atom ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}
