import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('src');
const skip = new Set([
  path.normalize('src/app/globals.css'),
  path.normalize('src/app/layout.js'),
  path.normalize('src/components/case-studies/LandingPage.jsx'),
  path.normalize('src/components/common/CustomLoader.jsx'),
  path.normalize('src/components/layout/SiteHeader.jsx'),
  path.normalize('src/components/theme/ThemeProvider.jsx'),
  path.normalize('src/components/theme/ThemeToggle.jsx'),
]);

const replacements = [
  ['min-h-screen bg-white text-gray-900', 'min-h-screen bg-background text-foreground'],
  ['min-h-screen bg-white', 'min-h-screen bg-background'],
  ['h-screen flex flex-col bg-white', 'h-screen flex flex-col bg-background'],
  ['h-screen flex flex-col bg-gray-50', 'h-screen flex flex-col bg-background'],
  ['w-full h-full flex flex-col bg-white', 'w-full h-full flex flex-col bg-background'],
  ['w-full h-screen flex flex-col bg-white', 'w-full h-screen flex flex-col bg-background'],
  ['min-h-screen bg-zinc-950 flex flex-col', 'min-h-screen bg-background flex flex-col'],
  ['min-h-screen bg-zinc-950 px-5 py-12 text-zinc-100', 'min-h-screen bg-background px-5 py-12 text-foreground'],
  ['flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans', 'flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans'],

  ['bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950', 'bg-primary hover:bg-primary/90 text-primary-foreground'],
  ['bg-gradient-to-r from-yellow-50 to-white', 'bg-muted/70'],
  ['bg-gradient-to-r from-gray-50 to-gray-100', 'bg-muted/70'],
  ['bg-gradient-to-r from-gray-900 to-gray-800 text-white', 'bg-foreground text-background'],

  ['w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500', 'w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/40'],
  ['w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100 disabled:text-gray-400', 'w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40 disabled:bg-muted disabled:text-muted-foreground'],
  ['w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 disabled:opacity-50', 'w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40 disabled:opacity-50'],
  ['w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500', 'w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:ring-2 focus:ring-ring/40'],
  ['w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-yellow-500', 'w-full px-2 py-1.5 border border-input bg-background text-foreground rounded-md text-sm focus:ring-2 focus:ring-ring/40'],
  ['h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500 disabled:opacity-50', 'h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/40 disabled:opacity-50'],
  ['h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-yellow-500', 'h-4 w-4 rounded border-input text-primary focus:ring-2 focus:ring-ring/40'],

  ['flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors', 'flex-1 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-medium py-2 px-4 rounded-lg transition-colors'],
  ['flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-md transition disabled:opacity-50', 'flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-md transition disabled:opacity-50'],
  ['px-3 py-2 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-md transition whitespace-nowrap font-semibold', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap font-semibold'],
  ['px-3 py-2 text-sm bg-pink-500 hover:bg-pink-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-purple-500 hover:bg-purple-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-fuchsia-500 hover:bg-fuchsia-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-rose-500 hover:bg-rose-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-amber-500 hover:bg-amber-600 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-red-500 hover:bg-red-600 text-white rounded-md transition disabled:opacity-50 flex items-center gap-1 whitespace-nowrap', 'px-3 py-2 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-md transition disabled:opacity-50 flex items-center gap-1 whitespace-nowrap'],
  ['px-3 py-2 text-sm bg-gray-400 hover:bg-gray-500 text-white rounded-md transition flex items-center gap-1 whitespace-nowrap', 'px-3 py-2 text-sm bg-secondary hover:bg-muted text-secondary-foreground border border-border rounded-md transition flex items-center gap-1 whitespace-nowrap'],

  ['bg-white rounded-lg border border-gray-200 w-full max-w-md shadow-lg', 'bg-card rounded-lg border border-border w-full max-w-md shadow-sm'],
  ['bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl', 'bg-card border border-border rounded-lg shadow-sm hover:shadow-md'],
  ['bg-white border-b border-gray-200', 'bg-background border-b border-border'],
  ['bg-gray-50 border-b border-gray-200', 'bg-muted/50 border-b border-border'],
  ['border-b border-gray-200 bg-white', 'border-b border-border bg-background'],
  ['border-l border-gray-200 bg-white', 'border-l border-border bg-card'],
  ['border-r border-gray-200 bg-white', 'border-r border-border bg-card'],
  ['w-full h-full bg-white border-l border-gray-200', 'w-full h-full bg-card border-l border-border'],
  ['bg-white hover:bg-gray-50', 'bg-card hover:bg-muted'],
  ['hover:bg-gray-200', 'hover:bg-muted'],
  ['hover:bg-gray-100', 'hover:bg-muted'],
  ['hover:bg-yellow-50', 'hover:bg-accent'],
  ['hover:border-yellow-400', 'hover:border-primary'],
  ['hover:border-amber-400', 'hover:border-primary'],
  ['hover:text-amber-700', 'hover:text-primary'],
  ['hover:text-amber-600', 'hover:text-primary'],
  ['hover:text-yellow-600', 'hover:text-primary'],
  ['group-hover:text-amber-600', 'group-hover:text-primary'],
  ['group-hover:text-yellow-600', 'group-hover:text-primary'],
  ['hover:text-gray-900', 'hover:text-foreground'],
  ['hover:text-gray-800', 'hover:text-foreground'],
  ['hover:text-gray-600', 'hover:text-foreground'],

  ['text-yellow-600', 'text-primary'],
  ['text-amber-600', 'text-primary'],
  ['text-amber-700', 'text-primary'],
  ['bg-yellow-50', 'bg-accent'],
  ['bg-amber-50', 'bg-accent'],
  ['border-amber-200', 'border-primary/30'],
  ['border-yellow-200', 'border-primary/30'],
  ['bg-amber-500/10', 'bg-primary/10'],
  ['bg-amber-500/20', 'bg-primary/20'],
  ['border-amber-500/20', 'border-primary/20'],
  ['border-amber-500/30', 'border-primary/30'],
  ['border-amber-500/40', 'border-primary/40'],
  ['border-amber-500/60', 'border-primary/60'],
  ['hover:border-amber-500/40', 'hover:border-primary/40'],
  ['text-amber-400', 'text-primary'],
  ['text-amber-300', 'text-primary'],
  ['bg-amber-500', 'bg-primary'],
  ['hover:bg-amber-400', 'hover:bg-primary/90'],
  ['fill-amber-400', 'fill-primary'],
  ['shadow-amber-500/20', 'shadow-primary/20'],
  ['shadow-amber-500/30', 'shadow-primary/20'],
  ['shadow-amber-500/5', 'shadow-primary/10'],

  ['bg-zinc-950/40', 'bg-background/40'],
  ['bg-zinc-950', 'bg-background'],
  ['bg-zinc-900/90', 'bg-sidebar'],
  ['bg-zinc-900/80', 'bg-card/80'],
  ['bg-zinc-900/70', 'bg-card/80'],
  ['bg-zinc-900/60', 'bg-card/80'],
  ['bg-zinc-900/50', 'bg-card/70'],
  ['bg-zinc-900', 'bg-card'],
  ['bg-zinc-800/80', 'bg-muted/80'],
  ['bg-zinc-800/60', 'bg-muted/70'],
  ['bg-zinc-800/50', 'bg-muted/60'],
  ['hover:bg-zinc-800/50', 'hover:bg-muted/70'],
  ['hover:bg-zinc-800', 'hover:bg-muted'],
  ['hover:bg-zinc-700', 'hover:bg-muted'],
  ['bg-zinc-800', 'bg-muted'],
  ['bg-zinc-700', 'bg-muted'],
  ['bg-zinc-600', 'bg-muted-foreground/30'],
  ['text-zinc-950', 'text-primary-foreground'],
  ['fill-zinc-950', 'fill-primary-foreground'],
  ['text-zinc-900', 'text-foreground'],
  ['text-zinc-100', 'text-foreground'],
  ['text-zinc-200', 'text-foreground'],
  ['text-zinc-300', 'text-foreground/80'],
  ['hover:text-zinc-100', 'hover:text-foreground'],
  ['hover:text-zinc-200', 'hover:text-foreground'],
  ['hover:text-zinc-300', 'hover:text-foreground'],
  ['hover:text-zinc-400', 'hover:text-muted-foreground'],
  ['text-zinc-400', 'text-muted-foreground'],
  ['text-zinc-500', 'text-muted-foreground'],
  ['text-zinc-600', 'text-muted-foreground'],
  ['border-zinc-800/80', 'border-border'],
  ['border-zinc-800', 'border-border'],
  ['border-zinc-700/60', 'border-border'],
  ['border-zinc-700/50', 'border-border'],
  ['border-zinc-700/40', 'border-border'],
  ['border-zinc-700', 'border-border'],
  ['placeholder-zinc-500', 'placeholder:text-muted-foreground'],
  ['placeholder:text-zinc-600', 'placeholder:text-muted-foreground'],

  ['text-gray-900', 'text-foreground'],
  ['text-gray-800', 'text-foreground'],
  ['text-gray-700', 'text-foreground/80'],
  ['text-gray-600', 'text-muted-foreground'],
  ['text-gray-500', 'text-muted-foreground'],
  ['text-gray-400', 'text-muted-foreground'],
  ['bg-gray-50', 'bg-muted/50'],
  ['bg-gray-100', 'bg-muted'],
  ['bg-gray-200', 'bg-border'],
  ['divide-gray-200', 'divide-border'],
  ['border-gray-200', 'border-border'],
  ['border-gray-300', 'border-input'],
  ['hover:bg-gray-900', 'hover:bg-foreground hover:text-background'],

  ['border-blue-200', 'border-info/40'],
  ['bg-blue-50', 'bg-info'],
  ['text-blue-900', 'text-info-foreground'],
  ['text-blue-800', 'text-info-foreground'],
  ['text-blue-700', 'text-info-foreground'],
  ['text-blue-600', 'text-info-foreground'],
  ['bg-green-50', 'bg-success'],
  ['bg-green-100', 'bg-success'],
  ['border-green-200', 'border-success-foreground/20'],
  ['text-green-800', 'text-success-foreground'],
  ['text-green-700', 'text-success-foreground'],
  ['text-green-600', 'text-success-foreground'],
  ['bg-red-50', 'bg-destructive/10'],
  ['border-red-200', 'border-destructive/30'],
  ['text-red-800', 'text-destructive'],
  ['text-red-700', 'text-destructive'],
  ['text-red-600', 'text-destructive'],
  ['bg-red-950/40', 'bg-destructive/10'],
  ['border-red-900', 'border-destructive/40'],
  ['text-red-300', 'text-destructive'],
  ['bg-red-950/60', 'bg-destructive/15'],
  ['border-red-800/40', 'border-destructive/30'],
  ['bg-emerald-950/40', 'bg-success'],
  ['border-emerald-800/30', 'border-success-foreground/20'],
  ['text-emerald-300', 'text-success-foreground'],
  ['text-emerald-400', 'text-success-foreground'],

  ['bg-white', 'bg-card'],
];

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(js|jsx|css)$/.test(entry.name)) {
      transform(full);
    }
  }
}

function transform(file) {
  const rel = path.relative(process.cwd(), file).replaceAll('\\', '/');
  if (skip.has(path.normalize(rel)) || skip.has(rel)) return;
  let source = fs.readFileSync(file, 'utf8');
  let next = source;
  for (const [from, to] of replacements) {
    next = next.split(from).join(to);
  }
  if (next !== source) {
    fs.writeFileSync(file, next);
    console.log('updated', rel);
  }
}

walk(root);
