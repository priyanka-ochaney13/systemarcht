import fs from 'node:fs';
import path from 'node:path';

const reps = [
  ['bg-accent0', 'bg-primary'],
  ['hover:bg-gray-300', 'hover:bg-muted'],
  ['hover:bg-gray-400', 'hover:bg-muted'],
  ['bg-gray-300', 'bg-muted'],
  ['hover:bg-yellow-600', 'hover:bg-primary/90'],
  ['bg-yellow-100', 'bg-accent'],
  ['text-yellow-700', 'text-primary'],
  ['text-amber-500', 'text-primary'],
  ['text-gray-950', 'text-primary-foreground'],
  ['text-gray-300', 'text-background/70'],
  [
    'flex-1 bg-border hover:bg-muted text-foreground font-semibold py-2 px-4 rounded-md transition',
    'flex-1 bg-secondary hover:bg-muted text-secondary-foreground font-semibold py-2 px-4 rounded-md transition',
  ],
  [
    'flex-1 bg-border hover:bg-muted text-foreground font-medium py-2 px-4 rounded-lg transition-colors',
    'flex-1 bg-secondary hover:bg-muted text-secondary-foreground font-medium py-2 px-4 rounded-lg transition-colors',
  ],
];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx)$/.test(entry.name)) {
      let source = fs.readFileSync(full, 'utf8');
      let next = source;
      for (const [from, to] of reps) next = next.split(from).join(to);
      if (next !== source) {
        fs.writeFileSync(full, next);
        console.log('fixed', path.relative(process.cwd(), full));
      }
    }
  }
}

walk(path.resolve('src'));
