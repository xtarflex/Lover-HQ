export function LoverHQLogo({ className = 'w-6 h-6', size }) {
  const finalSize = size || 24;
  return (
    <svg
      className={className}
      width={finalSize}
      height={finalSize}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* House outline */}
      <path
        d="M3 10L12 3L21 10V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V10Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Heart shape integrated into roof */}
      <path
        d="M12 8C10.5 6.5 8 7 8 9C8 10.5 9.5 11.5 12 13.5C14.5 11.5 16 10.5 16 9C16 7 13.5 6.5 12 8Z"
        fill="currentColor"
      />
    </svg>
  );
}
