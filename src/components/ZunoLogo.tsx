import React from 'react';

interface ZunoLogoProps {
  collapsed?: boolean;
  darkBackground?: boolean;
  compact?: boolean;
}

export const ZunoLogo: React.FC<ZunoLogoProps> = ({
  collapsed = false,
  darkBackground = true,
  compact = false,
}) => {
  return (
    <div className="flex items-center gap-2.5 select-none min-w-0">
      <div
        className={`relative shrink-0 overflow-hidden rounded-xl bg-black ring-1 ${
          darkBackground ? 'ring-white/15' : 'ring-[#0B5226]/15'
        } ${compact ? 'h-8 w-14' : 'h-9 w-16'}`}
      >
        <img
          src="/assets/aistudio/screen_f2716f55.png"
          alt="Logotipo oficial ZUNO"
          className="h-full w-full object-contain"
        />
      </div>
      {!collapsed && (
        <div className="flex flex-col min-w-0">
          <span
            className={`font-display text-base font-bold tracking-tight whitespace-nowrap ${
              darkBackground ? 'text-white' : 'text-[#0B5226]'
            }`}
          >
            ZUNO CHAT
          </span>
          <span
            className={`text-[11px] leading-tight truncate ${
              darkBackground ? 'text-[#E3F6EA]/80' : 'text-[#0B5226]/70'
            }`}
          >
            Automação WhatsApp
          </span>
        </div>
      )}
    </div>
  );
};
