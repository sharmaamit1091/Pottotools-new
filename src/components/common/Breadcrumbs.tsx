import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, onClick?: () => void) => {
    if (onClick && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 overflow-x-auto py-1">
      <a
        href={items[0]?.href || '/'}
        onClick={(e) => handleLinkClick(e, items[0]?.onClick)}
        className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors shrink-0 no-underline"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </a>

      {items.slice(1).map((item, idx) => {
        const isLast = idx === items.length - 2;
        return (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-900 dark:text-white truncate">
                {item.label}
              </span>
            ) : item.href ? (
              <a
                href={item.href}
                onClick={(e) => handleLinkClick(e, item.onClick)}
                className="hover:text-slate-900 dark:hover:text-white transition-colors truncate shrink-0 no-underline"
              >
                {item.label}
              </a>
            ) : item.onClick ? (
              <button
                onClick={item.onClick}
                className="hover:text-slate-900 dark:hover:text-white transition-colors truncate shrink-0"
              >
                {item.label}
              </button>
            ) : (
              <span className="truncate">{item.label}</span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
