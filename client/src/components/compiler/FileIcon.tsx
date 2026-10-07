import React from 'react';
import { cn } from '../../utils/cn';

export interface FileIconProps {
  fileName?: string;
  language?: string;
  className?: string;
  size?: number;
}

export interface FolderIconProps {
  isOpen?: boolean;
  className?: string;
  size?: number;
}

/**
 * Ultra-Premium, Crisp Vector Folder Icon (VS Code Style)
 */
export const FolderIcon: React.FC<FolderIconProps> = ({
  isOpen = false,
  className = '',
  size = 16,
}) => {
  if (isOpen) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        {/* Back flap & tab */}
        <path
          d="M2 5.5C2 4.67 2.67 4 3.5 4H8.5L10.5 6.5H20.5C21.33 6.5 22 7.17 22 8V16C22 16.83 21.33 17.5 20.5 17.5H3.5C2.67 17.5 2 16.83 2 16V5.5Z"
          fill="#D97706"
        />
        {/* Interior paper files */}
        <path
          d="M5 8.5H19V14H5V8.5Z"
          fill="#FEF3C7"
          opacity="0.9"
        />
        {/* Open tilted front flap */}
        <path
          d="M1.5 11.2C1.8 10.5 2.5 10 3.3 10H21.7C22.5 10 23.2 10.5 23.5 11.2L21.8 18.7C21.6 19.4 21 20 20.2 20H3.8C3 20 2.4 19.4 2.2 18.7L1.5 11.2Z"
          fill="#FBBF24"
        />
        {/* Front flap rim highlight */}
        <path
          d="M2.5 10.8H21.5"
          stroke="#FDE68A"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0 select-none', className)}
      style={{ minWidth: size, minHeight: size }}
    >
      {/* Back tab */}
      <path
        d="M2 5.5C2 4.67 2.67 4 3.5 4H8.5L10.5 6.5H20.5C21.33 6.5 22 7.17 22 8V18.5C22 19.33 21.33 20 20.5 20H3.5C2.67 20 2 19.33 2 18.5V5.5Z"
        fill="#D97706"
      />
      {/* Front pocket */}
      <path
        d="M2 9.5C2 8.67 2.67 8 3.5 8H20.5C21.33 8 22 8.67 22 9.5V18.5C22 19.33 21.33 20 20.5 20H3.5C2.67 20 2 19.33 2 18.5V9.5Z"
        fill="#F59E0B"
      />
      {/* Front flap highlight line */}
      <path
        d="M3.5 8.5H20.5"
        stroke="#FDE68A"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
};

/**
 * Ultra-Premium, Crisp Vector File Icon (VS Code / Material Design)
 */
export const FileIcon: React.FC<FileIconProps> = ({
  fileName = '',
  language = '',
  className = '',
  size = 16,
}) => {
  const lowerName = fileName.toLowerCase();
  const ext = lowerName.includes('.') ? lowerName.split('.').pop() || '' : '';
  const lang = language.toLowerCase();

  // 1. React / JSX / TSX
  if (
    ext === 'jsx' ||
    ext === 'tsx' ||
    lowerName.endsWith('.jsx') ||
    lowerName.endsWith('.tsx') ||
    lang === 'react' ||
    lang === 'jsx' ||
    lang === 'tsx'
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <ellipse cx="12" cy="12" rx="2.2" ry="2.2" fill="#00D8FF" />
        <g stroke="#00D8FF" strokeWidth="1.5" fill="none">
          <ellipse cx="12" cy="12" rx="9" ry="3.5" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(120 12 12)" />
        </g>
      </svg>
    );
  }

  // 2. HTML (.html, .htm) - Official W3C HTML5 Shield with sharp white 5
  if (ext === 'html' || ext === 'htm' || lang === 'html') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <path d="M4 3L5.8 20.2L12 22L18.2 20.2L20 3H4Z" fill="#E44D26" />
        <path d="M12 20.4V4.6H18.5L17.1 19L12 20.4Z" fill="#F16529" />
        <path
          d="M7.8 7.5H16.2L15.9 10.2H10.6L10.9 12.8H15.6L15.1 17.5L12 18.4L8.9 17.5L8.7 15H10.5L10.6 16.2L12 16.6L13.4 16.2L13.6 14.5H8.3L7.8 7.5Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 3. CSS / SCSS / SASS / LESS - Official CSS3 Blue Shield with sharp white 3
  if (ext === 'css' || ext === 'scss' || ext === 'sass' || ext === 'less' || lang === 'css') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <path d="M4 3L5.8 20.2L12 22L18.2 20.2L20 3H4Z" fill="#1572B6" />
        <path d="M12 20.4V4.6H18.5L17.1 19L12 20.4Z" fill="#33A9DC" />
        <path
          d="M7.8 7.5H16.2L15.8 11.2H12V11.2H15.6L15.1 17.5L12 18.4L8.9 17.5L8.7 15H10.5L10.6 16.2L12 16.6L13.4 16.2L13.7 13H8.2L7.8 7.5Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 4. NPM package.json - Official NPM Badge
  if (lowerName === 'package.json' || lowerName === 'package-lock.json') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#CB3837" />
        <path
          fill="#FFFFFF"
          d="M5 6H19V18H14V10.5H10.5V18H5V6ZM14 10.5H15.5V15H14V10.5Z"
        />
      </svg>
    );
  }

  // 5. JSON (.json) - Gold Curly Brackets Card
  if (ext === 'json' || lowerName.endsWith('.json') || lang === 'json') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="4" fill="#FBC02D" />
        <path
          d="M9.5 8C8.5 8 8 8.6 8 9.5V10.8C8 11.5 7.4 11.8 7 12C7.4 12.2 8 12.5 8 13.2V14.5C8 15.4 8.5 16 9.5 16M14.5 8C15.5 8 16 8.6 16 9.5V10.8C16 11.5 16.6 11.8 17 12C16.6 12.2 16 12.5 16 13.2V14.5C16 15.4 15.5 16 14.5 16"
          stroke="#000000"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 6. JavaScript (.js, .mjs, .cjs) - Crisp Pure Vector JS Badge
  if (
    ext === 'js' ||
    ext === 'mjs' ||
    ext === 'cjs' ||
    (lang === 'javascript' && ext !== 'json')
  ) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#F7DF1E" />
        {/* J */}
        <path
          d="M7 10.5H9.2V15.5C9.2 16.2 8.7 16.8 7.9 16.8C7.3 16.8 6.8 16.4 6.5 15.8L8 15C8.1 15.3 8.3 15.5 8.5 15.5C8.7 15.5 8.8 15.4 8.8 15V10.5H7Z"
          fill="#000000"
        />
        {/* S */}
        <path
          d="M11.8 15.5L13.3 15.2C13.5 16 14 16.3 14.7 16.3C15.3 16.3 15.7 16 15.7 15.5C15.7 15 15.3 14.8 14.4 14.4L13.7 14.1C12.6 13.6 12 13 12 12C12 10.9 13 10.1 14.5 10.1C15.8 10.1 16.7 10.8 17 11.8L15.5 12.3C15.4 11.7 15 11.4 14.5 11.4C13.9 11.4 13.6 11.7 13.6 12C13.6 12.5 13.9 12.7 14.7 13L15.4 13.3C16.7 13.8 17.4 14.5 17.4 15.5C17.4 16.7 16.3 17.7 14.6 17.7C13.1 17.7 12.1 16.8 11.8 15.5Z"
          fill="#000000"
        />
      </svg>
    );
  }

  // 7. TypeScript (.ts) - Crisp Pure Vector TS Badge
  if (ext === 'ts' || lang === 'typescript') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#3178C6" />
        {/* T */}
        <path
          d="M5.5 9.5H11.5V11.2H9.3V17.5H7.7V11.2H5.5V9.5Z"
          fill="#FFFFFF"
        />
        {/* S */}
        <path
          d="M12.8 15.5L14.3 15.2C14.5 16 15 16.3 15.7 16.3C16.3 16.3 16.7 16 16.7 15.5C16.7 15 16.3 14.8 15.4 14.4L14.7 14.1C13.6 13.6 13 13 13 12C13 10.9 14 10.1 15.5 10.1C16.8 10.1 17.7 10.8 18 11.8L16.5 12.3C16.4 11.7 16 11.4 15.5 11.4C14.9 11.4 14.6 11.7 14.6 12C14.6 12.5 14.9 12.7 15.7 13L16.4 13.3C17.7 13.8 18.4 14.5 18.4 15.5C18.4 16.7 17.3 17.7 15.6 17.7C14.1 17.7 13.1 16.8 12.8 15.5Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 8. Java (.java, .jar) - Authentic Java Coffee Cup & Blue Steam
  if (ext === 'java' || ext === 'jar' || lang === 'java') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        {/* Steam */}
        <path
          d="M10 2.8C11 4.2 9.2 5.6 10.5 7M13.5 2C14.5 3.5 12.8 5 14 6.5"
          stroke="#5382A1"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        {/* Cup body */}
        <path
          d="M5 9H16V15C16 17.2 14.2 19 12 19H9C6.8 19 5 17.2 5 15V9Z"
          fill="#E76F00"
        />
        {/* Cup handle */}
        <path
          d="M16 10.5H18C19.1 10.5 20 11.4 20 12.5C20 13.6 19.1 14.5 18 14.5H16"
          stroke="#E76F00"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Saucer */}
        <path
          d="M3.5 20.5H18.5"
          stroke="#5382A1"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  // 9. Python (.py, .ipynb) - Official Dual Snakes
  if (ext === 'py' || ext === 'ipynb' || lang === 'python') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <path
          d="M11.9 2C6.9 2 7.2 4.2 7.2 4.2L7.2 6.5H12.1V7.2H5.2S2 6.9 2 12C2 17.1 4.7 16.9 4.7 16.9H6.3V14.5S6.2 11.7 9.1 11.7H14S16.7 11.7 16.7 9V4.2S17 2 11.9 2Z"
          fill="#387EB8"
        />
        <circle cx="9.2" cy="4.2" r="1" fill="#FFFFFF" />
        <path
          d="M12.1 22C17.1 22 16.8 19.8 16.8 19.8L16.8 17.5H11.9V16.8H18.8S22 17.1 22 12C22 6.9 19.3 7.1 19.3 7.1H17.7V9.5S17.8 12.3 14.9 12.3H10S7.3 12.3 7.3 15V19.8S7 22 12.1 22Z"
          fill="#FFE873"
        />
        <circle cx="14.8" cy="19.8" r="1" fill="#387EB8" />
      </svg>
    );
  }

  // 10. C++ (.cpp, .cc, .hpp) - Navy Blue C++ Vector Badge
  if (ext === 'cpp' || ext === 'cc' || ext === 'cxx' || ext === 'hpp' || lang === 'cpp') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#00599C" />
        {/* C */}
        <path
          d="M9.5 8.5C6.5 8.5 5 10.5 5 12C5 13.5 6.5 15.5 9.5 15.5C10.5 15.5 11.2 15.2 11.6 14.8L10.8 13.8C10.5 14.1 10.1 14.3 9.5 14.3C7.5 14.3 6.8 12.8 6.8 12C6.8 11.2 7.5 9.7 9.5 9.7C10.1 9.7 10.5 9.9 10.8 10.2L11.6 9.2C11.2 8.8 10.5 8.5 9.5 8.5Z"
          fill="#FFFFFF"
        />
        {/* First + */}
        <path d="M14 10.5V13.5M12.5 12H15.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        {/* Second + */}
        <path d="M18 10.5V13.5M16.5 12H19.5" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // 11. C (.c, .h) - Steel Blue C Vector Badge
  if (ext === 'c' || ext === 'h' || lang === 'c') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#659AD2" />
        <path
          d="M15.5 8C11 8 8.5 10.8 8.5 12C8.5 13.2 11 16 15.5 16C16.8 16 17.8 15.6 18.5 15L17.2 13.5C16.7 14 16.1 14.3 15.3 14.3C12.3 14.3 11 12.8 11 12C11 11.2 12.3 9.7 15.3 9.7C16.1 9.7 16.7 10 17.2 10.5L18.5 9C17.8 8.4 16.8 8 15.5 8Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 12. SQL (.sql, .db) - Glowing Database Cylinder
  if (ext === 'sql' || ext === 'db' || lang === 'sql') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <ellipse cx="12" cy="5.5" rx="8" ry="2.5" fill="#00B0FF" />
        <path d="M20 5.5V11.5C20 13 16.4 14 12 14C7.6 14 4 13 4 11.5V5.5" fill="#0288D1" stroke="#00B0FF" strokeWidth="1" />
        <path d="M20 11.5V17.5C20 19 16.4 20 12 20C7.6 20 4 19 4 17.5V11.5" fill="#01579B" stroke="#00B0FF" strokeWidth="1" />
      </svg>
    );
  }

  // 13. Markdown (.md) - Azure Blue with M and Down-Arrow
  if (ext === 'md' || ext === 'markdown' || lang === 'markdown') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="22" height="22" x="1" y="1" rx="3.5" fill="#087EA4" />
        <path
          d="M4.5 16V8H7L9.5 11.5L12 8H14.5V16H12.5V11.5L10.2 14.5H8.8L6.5 11.5V16H4.5ZM17.5 16L15 12.5H16.5V8H18.5V12.5H20L17.5 16Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 14. Git (.gitignore, .git) - Official Git Orange Circle with Branch
  if (lowerName.startsWith('.git') || ext === 'gitignore') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <circle cx="12" cy="12" r="10" fill="#F05032" />
        <path
          d="M17.5 10.5L13.5 6.5a1 1 0 00-1.4 0L10.8 7.8l2.2 2.2a1.5 1.5 0 011.8 1.8l2.1 2.1a1.5 1.5 0 11-.7.7l-2-2a1.5 1.5 0 01-2-.4l-2.2 2.2a1.5 1.5 0 11-.7-.7l6.8-6.8a1 1 0 011.4 0l3.7 3.7a1 1 0 010 1.4z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  // 15. Image files (.png, .jpg, .jpeg, .svg, .webp, .ico)
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'ico', 'gif', 'bmp'].includes(ext)) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <rect width="20" height="18" x="2" y="3" rx="3" fill="#8B5CF6" />
        <circle cx="7.5" cy="7.5" r="1.5" fill="#F3E8FF" />
        <path d="M3 17L8 11L13 16L16 13L21 17H3Z" fill="#F3E8FF" />
      </svg>
    );
  }

  // 16. Text file (.txt, input.txt)
  if (ext === 'txt' || lang === 'text') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className={cn('shrink-0 select-none', className)}
        style={{ minWidth: size, minHeight: size }}
      >
        <path d="M5 3H14L19 8V21H5V3Z" fill="#ECEFF1" />
        <path d="M14 3V8H19" fill="#CFD8DC" />
        <path d="M8 11H16M8 14H16M8 17H13" stroke="#78909C" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  // Default clean code file document
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={cn('shrink-0 select-none', className)}
      style={{ minWidth: size, minHeight: size }}
    >
      <path d="M5 3H14.5L19 7.5V21H5V3Z" fill="#2A2D2E" stroke="#525866" strokeWidth="1" />
      <path d="M14.5 3V7.5H19" fill="#3E4451" />
      <path d="M8 12L10 14L8 16M13 16H16" stroke="#94A3B8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
