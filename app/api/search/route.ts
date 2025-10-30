import { NextRequest, NextResponse } from 'next/server';

const MOCK_NAMES = [
  'Alice Anderson', 'Bob Brown', 'Charlie Chen', 'Diana Davis', 'Edward Evans',
  'Fiona Foster', 'George Garcia', 'Hannah Harris', 'Isaac Ibrahim', 'Julia Johnson',
  'Kevin Kim', 'Laura Lee', 'Michael Miller', 'Nancy Nguyen', 'Oliver O\'Brien',
  'Patricia Patel', 'Quinn Quinn', 'Rachel Rodriguez', 'Samuel Singh', 'Taylor Thomas',
];

function generateMockNames(count: number): string[] {
  const firstNames = [
    'James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda',
    'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
    'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
    'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
    'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  ];

  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
    const suffix = i >= firstNames.length * lastNames.length ? ` ${Math.floor(i / (firstNames.length * lastNames.length)) + 1}` : '';
    names.push(`${firstName} ${lastName}${suffix}`);
  }

  return names;
}

const MILLION_NAMES = generateMockNames(1000000);

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q')?.toLowerCase() || '';
  const type = searchParams.get('type') || 'general';
  const limit = parseInt(searchParams.get('limit') || '10');

  await new Promise(resolve => setTimeout(resolve, 100));

  if (type === 'person') {
    const filtered = MILLION_NAMES
      .filter(name => name.toLowerCase().includes(query))
      .slice(0, limit)
      .map((name, idx) => ({
        id: `person-${idx}`,
        text: name,
        type: 'person' as const,
      }));

    return NextResponse.json({ results: filtered });
  }

  const generalResults = [
    'How to build a web application',
    'Best practices for React development',
    'TypeScript advanced patterns',
    'Database optimization techniques',
    'API design principles',
    'Machine learning fundamentals',
    'Cloud architecture patterns',
    'Security best practices',
  ]
    .filter(item => item.toLowerCase().includes(query))
    .slice(0, limit)
    .map((text, idx) => ({
      id: `general-${idx}`,
      text,
      type: 'general' as const,
    }));

  return NextResponse.json({ results: generalResults });
}
