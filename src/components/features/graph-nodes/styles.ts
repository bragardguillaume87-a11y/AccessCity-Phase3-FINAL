import type React from 'react';

/** Static styles extracted from node components to avoid re-creation per render */

export const HEADER_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  marginBottom: '8px',
};

export const AVATAR_BASE_STYLE: React.CSSProperties = {
  width: '40px',
  height: '40px',
  borderRadius: '8px',
  overflow: 'hidden',
  backgroundColor: 'rgba(0,0,0,0.3)',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const AVATAR_IMG_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'cover',
};

export const SPEAKER_INFO_STYLE: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
};

export const SPEAKER_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

export const SPEAKER_NAME_GROUP_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

export const INDEX_BADGE_BASE_STYLE: React.CSSProperties = {
  fontWeight: 800,
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  minWidth: '32px',
  justifyContent: 'center',
  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
};

export const STAGE_DIRECTIONS_BASE_STYLE: React.CSSProperties = {
  fontSize: '11px',
  lineHeight: '1.4',
  margin: '0 0 6px 0',
  padding: '4px 8px',
  backgroundColor: 'rgba(0,0,0,0.2)',
  borderRadius: '6px',
  fontStyle: 'italic',
  opacity: 0.85,
};

export const ERROR_BADGE_CONTAINER_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '8px',
  right: '8px',
  display: 'flex',
  gap: '4px',
};

export const ERROR_BADGE_STYLE: React.CSSProperties = {
  borderRadius: '50%',
  width: '24px',
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export const CHOICE_PREVIEW_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  marginTop: '8px',
};

export const CHOICE_BADGE_BASE_STYLE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  borderRadius: '12px',
  padding: '4px 10px',
  fontSize: '11px',
  fontWeight: 600,
  maxWidth: '100px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

export const BRANCH_LINES_SVG_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
  opacity: 0.3,
  overflow: 'visible',
};

/** Choice handle colors (repeating pattern) */
export const CHOICE_COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#8b5cf6'];
