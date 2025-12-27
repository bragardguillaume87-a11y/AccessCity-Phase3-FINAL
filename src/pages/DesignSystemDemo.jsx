import React, { useState } from 'react';
import { ButtonV2 } from '@/components/ui/button-v2';
import { InputV2 } from '@/components/ui/input-v2';
import {
  CardV2,
  CardHeaderV2,
  CardTitleV2,
  CardDescriptionV2,
  CardContentV2,
  CardFooterV2,
} from '@/components/ui/card-v2';
import { BadgeV2 } from '@/components/ui/badge-v2';
import { Save, Search, Mail, Trash2, Download, ArrowRight, Check } from 'lucide-react';

/**
 * DesignSystemDemo - Demo page for testing v2 components
 *
 * This page showcases all v2 components and can be used for:
 * - Visual testing
 * - Accessibility testing (keyboard nav, screen readers, contrast)
 * - Manual QA
 *
 * Access via: /design-system-demo (add route in App.jsx)
 */
export default function DesignSystemDemo() {
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [inputError, setInputError] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [cardClickCount, setCardClickCount] = useState(0);
  const [removableBadges, setRemovableBadges] = useState([
    { id: 1, label: 'Removable Tag', variant: 'primary' },
    { id: 2, label: 'Active', variant: 'success' },
    { id: 3, label: 'Error', variant: 'danger' },
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setInputError('This field is required');
      return;
    }
    setInputError('');
    setFormSuccess(false);
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setFormSuccess(true);
    setInputValue('');
    // Auto-hide success message after 3 seconds
    setTimeout(() => setFormSuccess(false), 3000);
  };

  const handleRemoveBadge = (id) => {
    setRemovableBadges(badges => badges.filter(badge => badge.id !== id));
  };

  return (
    <div className="min-h-screen bg-secondary-v2-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <header>
          <h1 className="text-4xl-v2 font-bold text-secondary-v2-50 mb-2">
            Design System v2 Demo
          </h1>
          <p className="text-lg-v2 text-secondary-v2-300">
            WCAG AA compliant components with design tokens
          </p>
        </header>

        {/* Buttons Section */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Buttons</h2>
          <CardV2 variant="default" className="p-6">
            <div className="space-y-6">
              {/* Variants */}
              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Variants</h3>
                <div className="flex gap-3 flex-wrap">
                  <ButtonV2 variant="primary">Primary</ButtonV2>
                  <ButtonV2 variant="secondary">Secondary</ButtonV2>
                  <ButtonV2 variant="danger">Danger</ButtonV2>
                  <ButtonV2 variant="ghost">Ghost</ButtonV2>
                  <ButtonV2 variant="outline">Outline</ButtonV2>
                </div>
              </div>

              {/* Sizes */}
              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Sizes</h3>
                <div className="flex gap-3 flex-wrap items-center">
                  <ButtonV2 size="sm">Small</ButtonV2>
                  <ButtonV2 size="md">Medium</ButtonV2>
                  <ButtonV2 size="lg">Large</ButtonV2>
                </div>
              </div>

              {/* With Icons & States */}
              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Icons & States</h3>
                <div className="flex gap-3 flex-wrap">
                  <ButtonV2 iconLeft={<Save />}>Save</ButtonV2>
                  <ButtonV2 variant="secondary" iconRight={<ArrowRight />}>Next</ButtonV2>
                  <ButtonV2 variant="danger" iconLeft={<Trash2 />}>Delete</ButtonV2>
                  <ButtonV2 variant="outline" loading>Loading...</ButtonV2>
                  <ButtonV2 variant="ghost" disabled>Disabled</ButtonV2>
                </div>
              </div>

              {/* Full Width */}
              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Full Width</h3>
                <ButtonV2 fullWidth iconLeft={<Download />}>
                  Download Report
                </ButtonV2>
              </div>
            </div>
          </CardV2>
        </section>

        {/* Inputs Section */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Inputs</h2>
          <CardV2 variant="default" className="p-6 max-w-2xl">
            <div className="space-y-4">
              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  Default Input
                </label>
                <InputV2 placeholder="Enter text..." />
              </div>

              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  With Icon (Left)
                </label>
                <InputV2 iconLeft={<Search />} placeholder="Search..." />
              </div>

              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  With Icon (Right)
                </label>
                <InputV2
                  type="email"
                  iconRight={<Mail />}
                  placeholder="Email address"
                />
              </div>

              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  Error State
                </label>
                <InputV2
                  state="error"
                  error="This field is required"
                  placeholder="Input with error"
                />
              </div>

              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  Success State
                </label>
                <InputV2
                  state="success"
                  iconRight={<Check className="text-success-v2" />}
                  placeholder="Valid input"
                />
              </div>

              <div>
                <label className="block text-sm-v2 font-medium mb-2">
                  Disabled
                </label>
                <InputV2 disabled placeholder="Disabled input" />
              </div>
            </div>
          </CardV2>
        </section>

        {/* Cards Section */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Cards</h2>

          <div>
            <h3 className="text-lg-v2 font-medium mb-3 text-secondary-v2-300">Card Variants</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <CardV2 variant="default">
                <CardHeaderV2>
                  <CardTitleV2>Default Card</CardTitleV2>
                  <CardDescriptionV2>
                    With border and subtle shadow
                  </CardDescriptionV2>
                </CardHeaderV2>
                <CardContentV2>
                  <p className="text-sm-v2 text-secondary-v2-400">
                    This is the default card variant with minimal styling.
                  </p>
                </CardContentV2>
              </CardV2>

              <CardV2 variant="elevated">
                <CardHeaderV2>
                  <CardTitleV2>Elevated Card</CardTitleV2>
                  <CardDescriptionV2>
                    With larger shadow for emphasis
                  </CardDescriptionV2>
                </CardHeaderV2>
                <CardContentV2>
                  <p className="text-sm-v2 text-secondary-v2-400">
                    This variant uses a larger shadow to create depth.
                  </p>
                </CardContentV2>
              </CardV2>

              <CardV2 variant="outlined">
                <CardHeaderV2>
                  <CardTitleV2>Outlined Card</CardTitleV2>
                  <CardDescriptionV2>
                    With thick border
                  </CardDescriptionV2>
                </CardHeaderV2>
                <CardContentV2>
                  <p className="text-sm-v2 text-secondary-v2-400">
                    This variant emphasizes the border for clarity.
                  </p>
                </CardContentV2>
              </CardV2>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg-v2 font-medium mb-3 text-secondary-v2-300">Interactive Card</h3>
            <CardV2 variant="default" interactive onClick={() => setCardClickCount(count => count + 1)}>
              <CardHeaderV2>
                <CardTitleV2>Clickable Card</CardTitleV2>
                <CardDescriptionV2>
                  Try clicking or pressing Enter when focused
                </CardDescriptionV2>
              </CardHeaderV2>
              <CardContentV2>
                <p className="text-sm-v2 text-secondary-v2-400">
                  This card has hover effects and is keyboard accessible.
                </p>
                {cardClickCount > 0 && (
                  <p className="text-sm-v2 text-primary-v2 font-medium mt-2">
                    Card clicked {cardClickCount} time{cardClickCount > 1 ? 's' : ''}!
                  </p>
                )}
              </CardContentV2>
              <CardFooterV2>
                <ButtonV2 size="sm" variant="outline" onClick={(e) => e.stopPropagation()}>
                  Learn More
                </ButtonV2>
              </CardFooterV2>
            </CardV2>
          </div>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Badges</h2>
          <CardV2 variant="default" className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Variants</h3>
                <div className="flex gap-2 flex-wrap">
                  <BadgeV2 variant="primary">Primary</BadgeV2>
                  <BadgeV2 variant="secondary">Secondary</BadgeV2>
                  <BadgeV2 variant="success">Success</BadgeV2>
                  <BadgeV2 variant="warning">Warning</BadgeV2>
                  <BadgeV2 variant="danger">Danger</BadgeV2>
                  <BadgeV2 variant="outline">Outline</BadgeV2>
                </div>
              </div>

              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Sizes</h3>
                <div className="flex gap-2 flex-wrap items-center">
                  <BadgeV2 size="sm">Small Badge</BadgeV2>
                  <BadgeV2 size="md">Medium Badge</BadgeV2>
                </div>
              </div>

              <div>
                <h3 className="text-lg-v2 font-medium mb-3">Removable Badges</h3>
                <div className="flex gap-2 flex-wrap">
                  {removableBadges.map(badge => (
                    <BadgeV2
                      key={badge.id}
                      variant={badge.variant}
                      onRemove={() => handleRemoveBadge(badge.id)}
                    >
                      {badge.label}
                    </BadgeV2>
                  ))}
                  {removableBadges.length === 0 && (
                    <p className="text-sm-v2 text-secondary-v2-400 italic">
                      All badges removed! Refresh the page to reset.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardV2>
        </section>

        {/* Form Example Section */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Form Example</h2>
          <CardV2 variant="default" className="max-w-md">
            <form onSubmit={handleSubmit}>
              <CardHeaderV2>
                <CardTitleV2>Contact Form</CardTitleV2>
                <CardDescriptionV2>
                  Fill out the form below to get in touch
                </CardDescriptionV2>
              </CardHeaderV2>
              <CardContentV2 className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm-v2 font-medium mb-2">
                    Name *
                  </label>
                  <InputV2
                    id="name"
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (inputError) setInputError('');
                    }}
                    error={inputError}
                    state={inputError ? 'error' : 'default'}
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm-v2 font-medium mb-2">
                    Email
                  </label>
                  <InputV2
                    id="email"
                    type="email"
                    iconRight={<Mail />}
                    placeholder="your@email.com"
                  />
                </div>
              </CardContentV2>
              <CardFooterV2 className="gap-3">
                <ButtonV2 type="submit" loading={loading}>
                  {loading ? 'Submitting...' : 'Submit'}
                </ButtonV2>
                <ButtonV2 variant="ghost" type="button" onClick={() => {
                  setInputValue('');
                  setInputError('');
                }}>
                  Reset
                </ButtonV2>
              </CardFooterV2>
            </form>
          </CardV2>
          {formSuccess && (
            <div className="mt-4 p-4 bg-success-v2-light border-2 border-success-v2 rounded-lg-v2 flex items-center gap-2">
              <Check className="h-5 w-5 text-success-v2" />
              <p className="text-sm-v2 font-medium text-success-v2-dark">
                Form submitted successfully! All fields have been reset.
              </p>
            </div>
          )}
        </section>

        {/* WCAG AA Compliance Info */}
        <section>
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">WCAG AA Compliance</h2>
          <CardV2 variant="outlined">
            <CardHeaderV2>
              <CardTitleV2>Accessibility Features</CardTitleV2>
            </CardHeaderV2>
            <CardContentV2>
              <ul className="space-y-2 text-sm-v2">
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>All text has minimum 4.5:1 contrast ratio (normal text)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>Focus indicators are 2px solid with 2px offset (4px total)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>Keyboard navigation is fully supported (Tab, Enter, Space, Escape)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>ARIA attributes are properly implemented (aria-label, aria-describedby, aria-invalid)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>Non-text elements have 3:1 contrast (borders, UI components)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-success-v2 flex-shrink-0 mt-0.5" />
                  <span>All interactive elements are keyboard accessible</span>
                </li>
              </ul>
            </CardContentV2>
          </CardV2>
        </section>

        {/* Testing Instructions */}
        <section className="pb-8">
          <h2 className="text-2xl-v2 font-semibold mb-4 text-secondary-v2-50">Testing Instructions</h2>
          <CardV2 variant="default">
            <CardHeaderV2>
              <CardTitleV2>How to Test</CardTitleV2>
            </CardHeaderV2>
            <CardContentV2>
              <div className="space-y-4 text-sm-v2">
                <div>
                  <h4 className="font-semibold mb-2">Keyboard Navigation</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-v2-400">
                    <li>Press Tab to navigate through interactive elements</li>
                    <li>Press Enter or Space to activate buttons</li>
                    <li>Check that focus indicators are clearly visible</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Screen Readers</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-v2-400">
                    <li>Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)</li>
                    <li>Verify all buttons have descriptive labels</li>
                    <li>Check error messages are announced</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Color Contrast</h4>
                  <ul className="list-disc list-inside space-y-1 text-secondary-v2-400">
                    <li>Use Chrome DevTools (Inspect → Accessibility tab)</li>
                    <li>Install axe DevTools extension</li>
                    <li>Verify all ratios meet WCAG AA (4.5:1 for text, 3:1 for UI)</li>
                  </ul>
                </div>
              </div>
            </CardContentV2>
          </CardV2>
        </section>

      </div>
    </div>
  );
}
