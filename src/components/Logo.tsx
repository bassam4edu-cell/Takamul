import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
  variant?: 'login' | 'internal';
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false, light = false, variant = 'internal' }) => {
  const primaryColor = light ? "#FFFFFF" : "#006847";
  const secondaryColor = light ? "rgba(255,255,255,0.8)" : "#00855c";

  // Using different logo files for login vs internal UI as requested
  const logoUrl = variant === 'login' 
    ? "https://i.ibb.co/ZzPTFG3y/222.png"
    : "https://i.ibb.co/QFwrvnqF/photo-2026-02-20-15-16-20.jpg";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <img 
        src={logoUrl} 
        alt="شعار وزارة التعليم" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
      {showText && (
        <div className="flex flex-col items-center text-center">
          <span className={`text-sm font-extrabold leading-none mb-1 ${light ? 'text-white' : 'text-primary'}`}>ثانوية أم القرى بالخرج</span>
          <span className={`text-xl font-extrabold leading-none ${light ? 'text-white' : 'text-primary'}`}>بوابة تكامل</span>
          <span className={`text-[10px] font-medium tracking-wider uppercase ${light ? 'text-white/80' : 'text-slate-500'}`}>Student Transfer System</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
