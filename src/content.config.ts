import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const localizedText = z.object({
  zh: z.string().min(1),
  en: z.string().optional().default('')
});

const optionalLocalizedText = z.object({
  zh: z.string().optional().default(''),
  en: z.string().optional().default('')
});

const linkMap = z.record(z.string(), z.string().optional().default('')).optional().default({});

const evidenceItem = z.object({
  type: z.enum(['link', 'screenshot', 'photo', 'slides', 'recording', 'article', 'profile']).default('link'),
  src: z.string().default(''),
  href: z.string().optional().default(''),
  alt: z.string().optional().default(''),
  label: z.string().optional().default('')
});

const contribution = defineCollection({
  loader: glob({
    pattern: '**/*.{yml,yaml,json,md,mdx}',
    base: './content/contributions'
  }),
  schema: z.object({
    id: z.string().min(1),
    legacyPath: z.string().startsWith('/').endsWith('.html'),
    type: z.enum([
      'speaking',
      'workshop',
      'community',
      'writing',
      'book',
      'media',
      'open-source',
      'research',
      'certification',
      'mentoring'
    ]),
    date: z.coerce.date(),
    title: localizedText,
    summary: optionalLocalizedText.default({ zh: '', en: '' }),
    event: z.string().optional().default(''),
    location: z.string().optional().default(''),
    role: z.string().optional().default(''),
    format: z.enum(['in-person', 'online', 'hybrid', 'published', 'other']).optional().default('other'),
    topics: z.array(z.string()).optional().default([]),
    microsoftProducts: z.array(z.string()).optional().default([]),
    links: linkMap,
    evidence: z.array(evidenceItem).optional().default([]),
    impact: z
      .object({
        audience: z.number().nullable().optional().default(null),
        views: z.number().nullable().optional().default(null),
        notes: z.string().optional().default('')
      })
      .optional()
      .default({ audience: null, views: null, notes: '' }),
    proofStatus: z.record(z.string(), z.string()).optional().default({}),
    language: z.enum(['zh-Hant', 'en', 'mixed']).optional().default('zh-Hant')
  })
});

const communityPeriods = defineCollection({
  loader: glob({
    pattern: '**/*.{yml,yaml,json,md,mdx}',
    base: './content/community-periods'
  }),
  schema: z.object({
    id: z.string().min(1),
    legacyPath: z.string().startsWith('/').endsWith('.html'),
    kind: z.enum(['period', 'index']).optional().default('period'),
    year: z.number().int().optional(),
    period: z
      .object({
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional()
      })
      .optional()
      .default({}),
    title: localizedText,
    sections: z.array(
      z.object({
        communityId: z.string().min(1),
        role: z.string().optional().default(''),
        summary: z.string().optional().default(''),
        evidence: z.array(evidenceItem).optional().default([]),
        relatedContributionIds: z.array(z.string()).optional().default([])
      })
    ),
    sitemap: z.boolean().optional().default(true),
    noindex: z.boolean().optional().default(false)
  })
});

const profile = defineCollection({
  loader: glob({
    pattern: 'profile.yml',
    base: './content'
  }),
  schema: z.object({
    name: localizedText,
    personName: localizedText,
    headline: localizedText,
    shortBio: localizedText,
    legacyBrand: z
      .object({
        name: z.string(),
        story: z.string()
      })
      .optional(),
    contact: z.object({
      email: z.email(),
      phoneDisplay: z.boolean().default(false)
    }),
    specialties: z.array(z.string()).default([]),
    certifications: z
      .array(
        z.object({
          name: z.string(),
          issuer: z.string().optional().default(''),
          url: z.string().optional().default(''),
          year: z.number().int().optional()
        })
      )
      .optional()
      .default([]),
    brandPrinciples: z.array(z.string()).default([])
  })
});

const externalLinks = defineCollection({
  loader: glob({
    pattern: 'external-links.yml',
    base: './content'
  }),
  schema: z.object({
    links: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        url: z.string(),
        category: z.enum(['profile', 'social', 'writing', 'speaking', 'book', 'credential', 'source']).default('profile'),
        primary: z.boolean().optional().default(false)
      })
    )
  })
});

const books = defineCollection({
  loader: glob({
    pattern: 'books.yml',
    base: './content'
  }),
  schema: z.object({
    books: z.array(
      z.object({
        title: z.string(),
        publisher: z.string().optional().default(''),
        url: z.string().optional().default(''),
        year: z.number().int().optional(),
        topics: z.array(z.string()).optional().default([])
      })
    )
  })
});

const writing = defineCollection({
  loader: glob({
    pattern: 'writing.yml',
    base: './content'
  }),
  schema: z.object({
    items: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        type: z.enum(['blog', 'series', 'article', 'deck', 'course']).default('article'),
        url: z.string(),
        year: z.number().int().optional(),
        publisher: z.string().optional().default(''),
        summary: z.string().optional().default(''),
        topics: z.array(z.string()).optional().default([])
      })
    )
  })
});

const authority = defineCollection({
  loader: glob({
    pattern: 'authority.yml',
    base: './content'
  }),
  schema: z.object({
    records: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        category: z.enum(['brand', 'speaking', 'writing', 'teaching', 'credential', 'source']),
        url: z.string(),
        summary: z.string().optional().default(''),
        verifiedAt: z.coerce.date().optional()
      })
    )
  })
});

export const collections = {
  contributions: contribution,
  communityPeriods,
  profile,
  externalLinks,
  books,
  writing,
  authority
};
