import type { ComplexityLevel } from '@/types';
import { T, FONTS, TYPE_TABS } from '../constants';

interface TypeTabBarProps {
  activeType: ComplexityLevel | null;
  onTypeChange: (level: ComplexityLevel) => void;
}

export function TypeTabBar({ activeType, onTypeChange }: TypeTabBarProps) {
  return (
    <div
      style={{
        padding: '14px 16px 20px',
        display: 'flex',
        gap: 8,
        borderBottom: `1.5px solid ${T.border}`,
        background: 'rgba(0,0,0,0.10)',
        flexShrink: 0,
      }}
      role="tablist"
      aria-label="Type de dialogue"
    >
      {TYPE_TABS.map((tab) => {
        const isActive = activeType === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTypeChange(tab.id)}
            style={{
              flex: '1 1 0',
              maxWidth: 160,
              borderRadius: 13,
              padding: '12px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              position: 'relative',
              background: isActive ? `${tab.c}c0` : T.card,
              border: `1.5px solid ${isActive ? tab.c : T.border}`,
              transform: isActive ? 'translateY(-4px)' : 'none',
              boxShadow: isActive ? `0 8px 24px ${tab.c}55` : 'none',
              transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              cursor: 'pointer',
              minWidth: 80,
            }}
          >
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: -9,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(255,255,255,0.92)',
                  color: tab.c,
                  fontSize: 8,
                  fontWeight: 900,
                  padding: '2px 7px',
                  borderRadius: 5,
                  whiteSpace: 'nowrap',
                }}
              >
                actif
              </div>
            )}
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: isActive ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.07)',
                border: `1px solid ${isActive ? 'rgba(0,0,0,0.12)' : 'transparent'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg
                viewBox="0 0 20 20"
                fill="none"
                width={16}
                height={16}
                dangerouslySetInnerHTML={{ __html: tab.svgPath }}
              />
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                lineHeight: 1.4,
                color: isActive ? tab.tc : T.t2,
                whiteSpace: 'nowrap',
                fontFamily: FONTS.display,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
