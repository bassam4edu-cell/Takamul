import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "w-12 h-12", showText = false, light = false }) => {
  const primaryColor = light ? "#FFFFFF" : "#006847";
  const secondaryColor = light ? "rgba(255,255,255,0.8)" : "#00855c";

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <img 
        src="https://ibb.co/KjvFx7Qj" 
        alt="شعار وزارة التعليم" 
        className="w-full h-full object-contain"
        referrerPolicy="no-referrer"
      />
      {showText && (
        <div className="flex flex-col items-center text-center">
          <span className={`text-sm font-extrabold leading-none mb-1 ${light ? 'text-white' : 'text-primary'}`}>ثانوية أم القرى بالخرج</span>
          <span className={`text-xl font-extrabold leading-none ${light ? 'text-white' : 'text-primary'}`}>نظام تحويل طالب</span>
          <span className={`text-[10px] font-medium tracking-wider uppercase ${light ? 'text-white/80' : 'text-slate-500'}`}>Student Transfer System</span>
        </div>
      )}
    </div>
  );
};

export default Logo;
