import * as React from 'react';
import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

// Valeur résolue pour la particle (motion.span ne supporte pas les CSS var())
const PARTICLE_COLOR = '#8b5cf6';
const PARTICLE_GLOW = 'rgba(139,92,246,0.6)';
import { cn } from '@/lib/utils';

/**
 * CollapsibleSection - Accordion component for organizing properties
 *
 * Inspiration: Unity/Godot Inspector, Carbon Design System
 *
 * Features:
 * - Smooth expand/collapse animation
 * - Keyboard accessible (Enter/Space to toggle)
 * - Custom icon support
 * - Preview text in header when collapsed
 * - Open/Collapsed state management
 * - variant="flat" : style section plate (AudioSection, BackgroundsSection)
 * - badge prop : texte d'info à côté du titre (ex: "2 pistes")
 *
 * Usage:
 * <CollapsibleSection title="Basic Info" defaultOpen={true}>
 *   <input ... />
 * </CollapsibleSection>
 *
 * // Flat variant for panel sections
 * <CollapsibleSection title="Ambiance" variant="flat" badge="2 pistes" icon={<Wind />}>
 *   ...
 * </CollapsibleSection>
 */
export interface CollapsibleSectionProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'onToggle'
> {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: React.ReactNode;
  preview?: string;
  /** Badge informatif affiché à côté du titre (ex : "2 pistes") */
  badge?: string;
  /** 'card' (défaut) : bordure + fond. 'flat' : en-tête texte simple pour les panneaux latéraux. */
  variant?: 'card' | 'flat';
  headerClassName?: string;
  contentClassName?: string;
  onToggle?: (isOpen: boolean) => void;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = false,
  icon,
  preview,
  badge,
  variant = 'card',
  className,
  headerClassName,
  contentClassName,
  onToggle,
  ...props
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    onToggle?.(newState);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const sectionId = `section-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // ── Variante "flat" (panneaux latéraux AudioSection, BackgroundsSection) ─────
  if (variant === 'flat') {
    return (
      <section className={className} {...(props as React.HTMLAttributes<HTMLElement>)}>
        <button
          type="button"
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          className={cn(
            'w-full flex items-center justify-between py-2.5',
            'text-[13px] font-semibold text-[var(--color-text-secondary)]',
            'hover:text-[var(--color-text-primary)] transition-colors',
            headerClassName
          )}
          aria-expanded={isOpen}
          aria-controls={sectionId}
        >
          <span className="flex items-center gap-2">
            {icon}
            {title}
            {badge && (
              <span className="normal-case font-normal text-[var(--color-text-muted)]">
                {badge}
              </span>
            )}
          </span>
          {/* Chevron */}
          <svg
            className={cn(
              'w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          id={sectionId}
          className={cn(
            'grid transition-all duration-200 ease-in-out',
            isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          )}
        >
          <div className={cn('overflow-hidden', contentClassName)}>{children}</div>
        </div>
      </section>
    );
  }

  // ── Variante "card" (défaut — Inspector style) ─────────────────────────────
  return (
    <div
      className={cn('border border-border rounded-lg overflow-hidden bg-card/50', className)}
      {...props}
    >
      {/* Header (always visible) */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors',
          'hover:bg-muted/50 active:bg-muted',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-inset',
          headerClassName
        )}
        aria-expanded={isOpen}
        aria-controls={sectionId}
      >
        {/* Expand/Collapse indicator */}
        <span
          className={cn(
            'flex-shrink-0 w-4 h-4 flex items-center justify-center text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-90'
          )}
          aria-hidden="true"
        >
          ▶
        </span>

        {/* Icon (optional) */}
        {icon && (
          <span className="flex-shrink-0 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-foreground">{title}</span>

        {/* Badge */}
        {badge && <span className="flex-shrink-0 text-xs text-muted-foreground">{badge}</span>}

        {/* Preview text when collapsed */}
        {!isOpen && preview && (
          <span className="flex-shrink-0 text-xs text-muted-foreground truncate max-w-[150px]">
            {preview}
          </span>
        )}
      </button>

      {/* Content (collapsible) */}
      <div
        id={sectionId}
        className={cn(
          'grid transition-all duration-200 ease-in-out',
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        )}
      >
        <div className="overflow-hidden">
          <div className={cn('p-3 space-y-3 border-t border-border', contentClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * CollapsibleGroup - Wrapper for multiple CollapsibleSections with "Expand All" button
 *
 * Usage:
 * <CollapsibleGroup>
 *   <CollapsibleSection title="Section 1">...</CollapsibleSection>
 *   <CollapsibleSection title="Section 2">...</CollapsibleSection>
 * </CollapsibleGroup>
 */
export interface CollapsibleGroupProps {
  children: React.ReactNode;
  className?: string;
  showExpandAll?: boolean;
}

export function CollapsibleGroup({
  children,
  className,
  showExpandAll = true,
}: CollapsibleGroupProps) {
  const [expandAll, setExpandAll] = useState(false);

  // Clone children and inject expandAll state
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.type === CollapsibleSection) {
      return React.cloneElement(child, {
        key: (child.props as CollapsibleSectionProps).title,
        defaultOpen: expandAll || (child.props as CollapsibleSectionProps).defaultOpen,
      } as Partial<CollapsibleSectionProps>);
    }
    return child;
  });

  return (
    <div className={cn('space-y-3', className)}>
      {/* Expand All / Collapse All button */}
      {showExpandAll && (
        <div className="flex justify-end">
          <button
            onClick={() => setExpandAll(!expandAll)}
            className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
          >
            {expandAll ? '⏶ Collapse All' : '⏷ Expand All'}
          </button>
        </div>
      )}

      {enhancedChildren}
    </div>
  );
}

/**
 * PanelSection — Section accordéon pour les panneaux latéraux (UnifiedPanel).
 *
 * Utilise les classes CSS `sp-sec` / `sp-lbl` définies dans studio.css.
 * Remplace les définitions locales dupliquées dans AudioSection, BackgroundsSection, TextSection.
 *
 * @example
 * <PanelSection title="Musique" id="audio-music" badge="2 pistes">
 *   ...
 * </PanelSection>
 */
/**
 * PanelSectionHeader — Header animé premium pour PanelSection.
 *
 * Animation séquencée à l'ouverture :
 * 1. Particle lumineuse qui parcourt le trait de gauche à droite
 * 2. Trait qui reste allumé (violet + glow via --shadow-game-glow)
 * 3. Titre qui monte en luminosité + text-shadow violet
 *
 * À la fermeture : extinction douce, asymétrique (pas de particle).
 * Toutes les couleurs viennent des CSS variables tokens.css.
 */
function PanelSectionHeader({
  title,
  id,
  badge,
  open,
  onToggle,
}: {
  title: string;
  id: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
}) {
  const [firing, setFiring] = useState(false);
  const particleKey = useRef(0);

  const handleClick = useCallback(() => {
    onToggle();
    if (!open) {
      particleKey.current += 1;
      setFiring(true);
      setTimeout(() => setFiring(false), 500);
    }
  }, [open, onToggle]);

  return (
    <button
      type="button"
      className={`sp-lbl sp-lbl--animated w-full${open ? ' is-open' : ''}`}
      onClick={handleClick}
      aria-expanded={open}
      aria-controls={`${id}-panel`}
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px' }}
    >
      {/* Titre — transitions via CSS classes .sp-lbl-title / .is-open */}
      <span className="sp-lbl-title">{title}</span>

      {badge && (
        <span
          style={{ flexShrink: 0 }}
          className="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-10)] px-2 py-0.5 rounded-full normal-case tracking-normal"
        >
          {badge}
        </span>
      )}

      {/* Pill +/− — entre le titre et la ligne pour que la ligne aille jusqu'au bord */}
      <motion.span
        aria-hidden="true"
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 18,
          height: 18,
          borderRadius: '50%',
          border: `1.5px solid ${open ? PARTICLE_COLOR : 'rgba(255,255,255,0.18)'}`,
          background: open ? 'rgba(139,92,246,0.15)' : 'transparent',
          color: open ? PARTICLE_COLOR : 'rgba(255,255,255,0.45)',
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1,
          transition: 'border-color 0.25s ease, background 0.25s ease, color 0.25s ease',
          userSelect: 'none',
        }}
      >
        +
      </motion.span>

      {/* Trait + particle — position relative pour la particle absolue */}
      <span
        style={{ position: 'relative', flex: 1, height: 2, overflow: 'visible' }}
        aria-hidden="true"
      >
        {/* Ligne — transitions via CSS classes .sp-lbl-line / .is-open */}
        <span className="sp-lbl-line" />
        {/* Particle one-shot — seul élément piloté par React */}
        {firing && (
          <motion.span
            key={particleKey.current}
            initial={{ left: '-2%', opacity: 1, scale: 1 }}
            animate={{ left: '102%', opacity: [1, 1, 0], scale: [1, 1.5, 0.5] }}
            transition={{ duration: 0.44, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: 'absolute',
              top: '50%',
              y: '-50%',
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff 0%, ${PARTICLE_COLOR} 55%, transparent 100%)`,
              boxShadow: `0 0 8px 3px ${PARTICLE_GLOW}`,
              pointerEvents: 'none',
            }}
          />
        )}
      </span>
    </button>
  );
}

export function PanelSection({
  title,
  id,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  id: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const handleToggle = useCallback(() => setOpen((o) => !o), []);

  return (
    <section className="sp-sec">
      <PanelSectionHeader title={title} id={id} badge={badge} open={open} onToggle={handleToggle} />
      <div
        id={`${id}-panel`}
        className="grid transition-[grid-template-rows] duration-200 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <div className="pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

/**
 * FormField - Reusable form field with label, error, and description
 * Works great inside CollapsibleSection
 */
export interface FormFieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  htmlFor,
  error,
  description,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {/* Label */}
      {label && (
        <label htmlFor={htmlFor} className="block text-xs font-semibold text-muted-foreground">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}

      {/* Input/Select/Textarea */}
      {children}

      {/* Description or Error */}
      {error ? (
        <p className="text-xs text-red-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      ) : description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}
