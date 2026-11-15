import React, { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

const SIZE_CLASSES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const Avatar: React.FC<AvatarProps> = ({
  name,
  src,
  size = 'md',
  online,
}) => {
  const [imgFailed, setImgFailed] = useState(false);

  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={`relative shrink-0 rounded-full ${SIZE_CLASSES[size]}`}>
      {src && !imgFailed ? (
        <img
          src={src}
          alt={name}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full rounded-full object-cover ring-1 ring-[#0B5226]/15"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0B5226] font-display font-semibold text-white ring-1 ring-[#178A3F]/30">
          {initials}
        </div>
      )}
      {typeof online === 'boolean' && (
        <span
          title={online ? 'Online' : 'Offline'}
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
            online ? 'bg-[#178A3F]' : 'bg-[#D63B3A]'
          }`}
        />
      )}
    </div>
  );
};
