import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageSquare, GitBranch, ExternalLink, AlertCircle, AlertTriangle } from 'lucide-react';
import { getNodeColorTheme } from '../../hooks/useDialogueGraph';
import type { DialogueNodeData, TerminalNodeData, ValidationProblem } from '@/types';

/**
 * Props for DialogueNode component
 */
interface DialogueNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * DialogueNode - Standard dialogue node
 *
 * Features:
 * - Shows speaker name with mood icon
 * - Shows dialogue text (truncated)
 * - Shows dialogue index number
 * - Error/warning badges
 * - Handles for connections (top + bottom)
 */
export function DialogueNode({ data, selected }: DialogueNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, issues = [] } = data;
  const colors = getNodeColorTheme('dialogueNode', issues);

  const hasErrors = issues.some((issue: ValidationProblem) => issue.type === 'error');
  const hasWarnings = issues.some((issue: ValidationProblem) => issue.type === 'warning');

  // Truncate text for display
  const displayText = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : '(Empty dialogue)';

  return (
    <div
      className="dialogue-node"
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? '#06b6d4' : colors.border,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'solid',
        borderRadius: '12px',
        padding: '12px',
        width: '320px',
        minHeight: '140px',
        boxShadow: selected ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: `2px solid ${colors.bg}`
        }}
      />

      {/* Header: Speaker + Index */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={16} color={colors.text} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>
            {speaker || 'Narrator'}
          </span>
          {speakerMood && (
            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
              ({speakerMood})
            </span>
          )}
        </div>

        {/* Index badge */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#1e293b',
            backgroundColor: colors.text,
            padding: '2px 8px',
            borderRadius: '12px'
          }}
        >
          D{index + 1}
        </span>
      </div>

      {/* Dialogue text */}
      <p
        style={{
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#e2e8f0',
          margin: '0',
          wordWrap: 'break-word'
        }}
      >
        {displayText}
      </p>

      {/* Error/Warning badges */}
      {(hasErrors || hasWarnings) && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          {hasErrors && (
            <div
              style={{
                backgroundColor: '#dc2626',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'error').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertCircle size={14} color="#fff" />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{
                backgroundColor: '#f59e0b',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'warning').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertTriangle size={14} color="#fff" />
            </div>
          )}
        </div>
      )}

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: `2px solid ${colors.bg}`
        }}
      />
    </div>
  );
}

/**
 * Props for ChoiceNode component
 */
interface ChoiceNodeProps {
  data: DialogueNodeData;
  selected?: boolean;
}

/**
 * ChoiceNode - Dialogue node with branching choices
 *
 * Features:
 * - Shows speaker and text like DialogueNode
 * - Badge showing number of choices
 * - Different color scheme (purple)
 * - GitBranch icon
 */
export function ChoiceNode({ data, selected }: ChoiceNodeProps): React.JSX.Element {
  const { index, speaker, text, speakerMood, choices = [], issues = [] } = data;
  const colors = getNodeColorTheme('choiceNode', issues);

  const hasErrors = issues.some((issue: ValidationProblem) => issue.type === 'error');
  const hasWarnings = issues.some((issue: ValidationProblem) => issue.type === 'warning');

  // Truncate text for display
  const displayText = text ? (text.length > 80 ? text.substring(0, 80) + '...' : text) : '(Empty dialogue)';
  const choiceCount = choices.length;

  return (
    <div
      className="choice-node"
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? '#06b6d4' : colors.border,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'solid',
        borderRadius: '12px',
        padding: '12px',
        width: '320px',
        minHeight: '140px',
        boxShadow: selected ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}
    >
      {/* Top handle */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: `2px solid ${colors.bg}`
        }}
      />

      {/* Header: Speaker + Index */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={16} color={colors.text} />
          <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>
            {speaker || 'Narrator'}
          </span>
          {speakerMood && (
            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>
              ({speakerMood})
            </span>
          )}
        </div>

        {/* Index badge */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: '700',
            color: '#1e293b',
            backgroundColor: colors.text,
            padding: '2px 8px',
            borderRadius: '12px'
          }}
        >
          D{index + 1}
        </span>
      </div>

      {/* Dialogue text */}
      <p
        style={{
          fontSize: '13px',
          lineHeight: '1.5',
          color: '#e2e8f0',
          margin: '0 0 8px 0',
          wordWrap: 'break-word'
        }}
      >
        {displayText}
      </p>

      {/* Choices badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          border: '1px solid #8b5cf6',
          borderRadius: '16px',
          padding: '4px 10px',
          fontSize: '12px',
          fontWeight: '600',
          color: '#c4b5fd'
        }}
      >
        <GitBranch size={12} />
        {choiceCount} {choiceCount === 1 ? 'choice' : 'choices'}
      </div>

      {/* Error/Warning badges */}
      {(hasErrors || hasWarnings) && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '4px' }}>
          {hasErrors && (
            <div
              style={{
                backgroundColor: '#dc2626',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'error').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertCircle size={14} color="#fff" />
            </div>
          )}
          {hasWarnings && (
            <div
              style={{
                backgroundColor: '#f59e0b',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={issues.filter((i: ValidationProblem) => i.type === 'warning').map((i: ValidationProblem) => i.message).join(', ')}
            >
              <AlertTriangle size={14} color="#fff" />
            </div>
          )}
        </div>
      )}

      {/* Bottom handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: `2px solid ${colors.bg}`
        }}
      />
    </div>
  );
}

/**
 * Props for TerminalNode component
 */
interface TerminalNodeProps {
  data: TerminalNodeData;
  selected?: boolean;
}

/**
 * TerminalNode - Node representing a scene jump
 *
 * Features:
 * - Smaller node (200x60)
 * - Shows target scene ID
 * - Orange/amber color scheme
 * - External link icon
 * - Only has input handle (no output)
 */
export function TerminalNode({ data, selected }: TerminalNodeProps): React.JSX.Element {
  const { sceneId, label, choiceText } = data;
  const colors = getNodeColorTheme('terminalNode', []);

  return (
    <div
      className="terminal-node"
      style={{
        backgroundColor: colors.bg,
        borderColor: selected ? '#06b6d4' : colors.border,
        borderWidth: selected ? '3px' : '2px',
        borderStyle: 'dashed',
        borderRadius: '12px',
        padding: '12px',
        width: '200px',
        minHeight: '60px',
        boxShadow: selected ? '0 8px 16px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px'
      }}
    >
      {/* Top handle (only input) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: colors.border,
          width: '12px',
          height: '12px',
          border: `2px solid ${colors.bg}`
        }}
      />

      <ExternalLink size={16} color={colors.text} />
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: '13px',
            fontWeight: '600',
            color: colors.text,
            margin: '0'
          }}
        >
          {label}
        </p>
        {choiceText && (
          <p
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              margin: '4px 0 0 0',
              fontStyle: 'italic'
            }}
          >
            "{choiceText.substring(0, 30)}..."
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Node types configuration for ReactFlow
 */
export const nodeTypes = {
  dialogueNode: DialogueNode,
  choiceNode: ChoiceNode,
  terminalNode: TerminalNode
} as const;
