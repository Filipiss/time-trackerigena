import './ColorDot.css';

export default function ColorDot({ className = '', color = '#06b6d4', size, style, ...props }) {
  const dotStyle = {
    backgroundColor: color,
    width: size,
    height: size,
    ...style,
  };

  return <span className={`color-dot ${className}`.trim()} style={dotStyle} {...props} />;
}
