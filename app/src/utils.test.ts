import { expect, test } from 'vitest'
import { cn } from './utils'

test('cn merges classes correctly', () => {
    // Basic concatenation
    expect(cn('p-4', 'bg-red-500')).toBe('p-4 bg-red-500')

    // Tailwind Merge conflict resolution (last wins)
    expect(cn('p-4', 'p-8')).toBe('p-8')

    // Conditional rendering
    expect(cn('text-red-500', null, undefined, false && 'hidden')).toBe('text-red-500')

    // Array input (clsx behavior)
    expect(cn(['text-slate-900', 'font-bold'])).toBe('text-slate-900 font-bold')
})
