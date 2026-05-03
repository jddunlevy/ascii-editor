import { z } from 'zod';
import { SPEC_VERSION } from './types';

// ─── Primitives ───────────────────────────────────────────────────────────────

const ThemeNameSchema = z.enum([
  'notebook',
  'avocado',
  'sakura',
  'blood-orange',
  'blue-bird',
]);

const FontNameSchema = z.enum([
  'jetbrains-mono',
  'ibm-plex-mono',
  'geist-mono',
  'fira-code',
  'vt323',
]);

const AlignSchema = z.enum(['left', 'center', 'right']);

const BorderStyleSchema = z.enum(['single', 'double', 'dashed', 'none']);

const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);

// ─── Base element ─────────────────────────────────────────────────────────────

const BaseElementSchema = z.object({
  id: z.string().min(1),
  position: z.object({ x: z.number(), y: z.number() }),
  size: z.object({ w: z.number().positive(), h: z.number().positive() }),
  z: z.number().int(),
  rotation: z.number().optional(),
  locked: z.boolean().optional(),
});

// ─── Element schemas ──────────────────────────────────────────────────────────

const TextElementSchema = BaseElementSchema.extend({
  type: z.literal('text'),
  semantic: z.enum(['h1', 'h2', 'h3', 'body', 'caption', 'code', 'label']),
  content: z.string(),
  font: FontNameSchema,
  fontSize: z.number().positive(),
  color: HexColorSchema,
  align: AlignSchema,
});

const ConversionParamsSchema = z.object({
  width: z.number().int().min(1),
  charset: z.string().min(1),
  brightness: z.number().min(-100).max(100),
  contrast: z.number().min(-100).max(100),
  inverted: z.boolean(),
});

const AsciiArtElementSchema = BaseElementSchema.extend({
  type: z.literal('ascii_art'),
  source: z.enum(['pasted', 'converted', 'builtin']),
  builtinId: z.string().optional(),
  content: z.string(),
  font: FontNameSchema,
  fontSize: z.number().positive(),
  color: HexColorSchema,
  conversionParams: ConversionParamsSchema.optional(),
});

const DividerElementSchema = BaseElementSchema.extend({
  type: z.literal('divider'),
  pattern: z.string().min(1),
  color: HexColorSchema,
});

const DecorativeElementSchema = BaseElementSchema.extend({
  type: z.literal('decorative'),
  builtinId: z.string().min(1),
  color: HexColorSchema,
});

const StructuralElementSchema = BaseElementSchema.extend({
  type: z.literal('structural'),
  semantic: z.enum(['nav', 'card', 'section', 'button', 'input', 'modal']),
  label: z.string().optional(),
  borderStyle: BorderStyleSchema,
  children: z.array(z.string()).optional(),
});

const ElementSchema = z.discriminatedUnion('type', [
  TextElementSchema,
  AsciiArtElementSchema,
  DividerElementSchema,
  DecorativeElementSchema,
  StructuralElementSchema,
]);

// ─── Page spec schema ─────────────────────────────────────────────────────────

const CanvasConfigSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  grid: z.number().int().positive(),
  theme: ThemeNameSchema,
});

const PageConfigSchema = z.object({
  title: z.string().min(1),
  canvas: CanvasConfigSchema,
  elements: z.array(ElementSchema),
});

export const PageSpecSchema = z.object({
  spec_version: z.literal(SPEC_VERSION),
  page: PageConfigSchema,
});

export type ValidatedPageSpec = z.infer<typeof PageSpecSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function validatePageSpec(data: unknown): ValidatedPageSpec {
  return PageSpecSchema.parse(data);
}

export function safeValidatePageSpec(
  data: unknown,
): { success: true; data: ValidatedPageSpec } | { success: false; error: z.ZodError } {
  const result = PageSpecSchema.safeParse(data);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: result.error };
}
