import type { LocaleDefinition } from '@faker-js/faker';
import { Faker, en, zh_CN } from '@faker-js/faker';
import { OpenAPIRoute } from 'chanfana';
import { Context } from 'hono';
import { z } from 'zod';

export class GenerateContactRoute extends OpenAPIRoute {
  schema = {
    tags: ['Contact'],
    summary: 'Generate Random Contact(s)',
    description: 'Generates one or more fake contact information entries using optional locale and count.',
    parameters: [
      {
        name: 'count',
        in: 'query',
        description: 'Number of contacts to generate (1 to 200). Defaults to 1.',
        required: false,
        schema: { type: 'integer', minimum: 1, maximum: 200, default: 1 },
      },
      {
        name: 'locale',
        in: 'query',
        description: 'Locale to use for data generation (e.g., en, zh_CN). Defaults to en.',
        required: false,
        schema: { type: 'string', default: 'en', enum: ['en', 'zh_CN'] },
      },
    ],
    responses: {
      '200': {
        description: 'Successfully generated contact(s)',
        content: {
          'application/json': {
            schema: z.object({
              contacts: z.array(
                z.object({
                  name: z.string(),
                  phone: z.string(),
                  address: z.object({
                    street: z.string(),
                    city: z.string(),
                    state: z.string(),
                    zipCode: z.string(),
                    country: z.string(),
                  }),
                }),
              ),
            }),
          },
        },
      },
      '400': {
        description: 'Invalid request parameters',
      },
      '500': {
        description: 'Internal Server Error',
      },
    },
  };

  async handle(c: Context) {
    try {
      const countParam = c.req.query('count');
      const localeParam = c.req.query('locale') || 'en';

      const count = countParam ? parseInt(countParam, 10) : 1;
      if (isNaN(count) || count < 1 || count > 200) {
        return c.text('Invalid "count" parameter. Must be an integer between 1 and 200.', 400);
      }

      const faker = new Faker({ locale: LocaleDefinitionMap[localeParam] ?? LocaleDefinitionMap['en'] });

      const contacts: ContactInfo[] = [];
      for (let i = 0; i < count; i++) {
        contacts.push(generateRandomContact(faker));
      }

      return c.json({ contacts });
    } catch (error) {
      console.error('Error generating contacts:', error);
      return c.text('Internal Server Error', 500);
    }
  }
}

function generateRandomContact(faker: Faker): ContactInfo {
  return {
    name: faker.person.fullName(),
    phone: faker.phone.number(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      state: faker.location.state(),
      zipCode: faker.location.zipCode(),
      country: faker.location.country(),
    },
  };
}

interface ContactInfo {
  name: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const LocaleDefinitionMap: { [key: string]: LocaleDefinition } = {
  en: en,
  zh_CN: zh_CN,
};
