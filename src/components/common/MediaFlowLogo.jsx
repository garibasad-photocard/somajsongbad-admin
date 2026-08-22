
// SVG Icon Component
const LogoIcon = () => (
  <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
    {/* 4 Colored Segments of the Circle */}
    {/* Bottom Right: Purple */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="#8E24AA" strokeWidth="8" strokeLinecap="round" strokeDasharray="55 196.32" transform="rotate(5 50 50)" />
    {/* Bottom Left: Orange */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="#F4511E" strokeWidth="8" strokeLinecap="round" strokeDasharray="55 196.32" transform="rotate(95 50 50)" />
    {/* Top Left: Blue */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="#1E88E5" strokeWidth="8" strokeLinecap="round" strokeDasharray="55 196.32" transform="rotate(185 50 50)" />
    {/* Top Right: Green */}
    <circle cx="50" cy="50" r="40" fill="none" stroke="#2EAD3A" strokeWidth="8" strokeLinecap="round" strokeDasharray="55 196.32" transform="rotate(275 50 50)" />

    {/* Center Text "MF" */}
    <text x="49" y="48" fontFamily="Poppins, sans-serif" fontWeight="900" fontStyle="italic" fontSize="28" textAnchor="middle" fill="currentColor" className="text-[#071B45] dark:text-white" letterSpacing="-2">
      MF
    </text>
    {/* Center Text "360" */}
    <text x="50" y="74" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="20" textAnchor="middle" fill="#1E88E5">
      360
    </text>
  </svg>
);

export default function MediaFlowLogo({ variant = 'horizontal', className = '' }) {

  if (variant === 'icon') {
    return (
      <div className={`w-10 h-10 ${className}`}>
        <LogoIcon />
      </div>
    );
  }

  if (variant === 'vertical') {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div className="w-24 h-24 mb-4">
          <LogoIcon />
        </div>
        <div className="flex flex-col items-center">
          <h1 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-1">
            MediaFlow <span className="text-[#1E88E5]">360</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Newsroom Management ERP</p>
        </div>
      </div>
    );
  }

  // horizontal (default)
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-9 h-9 shrink-0">
        <LogoIcon />
      </div>
      <div className="flex flex-col">
        <h1 className="text-[17px] font-black tracking-tight leading-tight text-gray-900 dark:text-white">
          MediaFlow <span className="text-[#1E88E5]">360</span>
        </h1>
        <p className="text-[9px] text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider leading-none mt-0.5">
          Newsroom ERP
        </p>
      </div>
    </div>
  );
}
