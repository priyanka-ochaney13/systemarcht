'use client';

import React from 'react';
import { formatUSD } from '@/lib/chatbotUtils';
import { AlertTriangle, CheckCircle, Zap, Cloud, Database } from 'lucide-react';

const SERVICE_ICON = {
  lambda: <Zap className="w-3.5 h-3.5" />,
  api_gateway: <Cloud className="w-3.5 h-3.5" />,
  s3: <Database className="w-3.5 h-3.5" />,
};

function renderInlineMarkdown(text, keyPrefix) {
  const tokens =
    /(\*\*[^*]+\*\*|__[^_]+__|(?<!\*)\*[^*\n]+\*|(?<!_)_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\(https?:\/\/[^)\s]+\)|<br\s*\/?>)/gi;
  const nodes = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = tokens.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (/^<br\s*\/?>$/i.test(token)) {
      nodes.push(<br key={`${keyPrefix}-${key++}`} />);
    } else if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong key={`${keyPrefix}-${key++}`}>
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={`${keyPrefix}-${key++}`}
          className="rounded bg-background/70 px-1 py-0.5 font-mono text-[0.9em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const link = token.match(/^\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)$/);
      if (link) {
        nodes.push(
          <a
            key={`${keyPrefix}-${key++}`}
            href={link[2]}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
          >
            {link[1]}
          </a>
        );
      }
    } else {
      nodes.push(
        <em key={`${keyPrefix}-${key++}`}>{token.slice(1, -1)}</em>
      );
    }

    lastIndex = tokens.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function splitTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
}

function isUnorderedListItem(line) {
  return /^\s*[-*+]\s+/.test(line);
}

function isOrderedListItem(line) {
  return /^\s*\d+[.)]\s+/.test(line);
}

function isBlockStart(lines, index) {
  const line = lines[index];
  return (
    /^\s{0,3}#{1,6}\s+/.test(line) ||
    /^\s*([-*_]\s*){3,}$/.test(line) ||
    /^\s*>\s?/.test(line) ||
    isUnorderedListItem(line) ||
    isOrderedListItem(line) ||
    (index + 1 < lines.length && isTableSeparator(lines[index + 1]))
  );
}

function MarkdownMessage({ content }) {
  const lines = content.replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const level = heading[1].length;
      const className =
        level <= 2
          ? 'text-base font-semibold'
          : 'text-sm font-semibold';
      blocks.push(
        <h3 key={`heading-${index}`} className={`${className} mb-2`}>
          {renderInlineMarkdown(heading[2], `heading-${index}`)}
        </h3>
      );
      index += 1;
      continue;
    }

    if (index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const headers = splitTableRow(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim() && lines[index].includes('|')) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }

      blocks.push(
        <div
          key={`table-${index}`}
          className="mb-3 overflow-x-auto rounded-md border border-border"
        >
          <table className="w-full min-w-max border-collapse text-left text-xs">
            <thead className="bg-background/70">
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th
                    key={`header-${cellIndex}`}
                    className="border-b border-border px-3 py-2 font-semibold"
                  >
                    {renderInlineMarkdown(cell, `table-header-${index}-${cellIndex}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`} className="border-b border-border last:border-0">
                  {headers.map((_, cellIndex) => (
                    <td key={`cell-${cellIndex}`} className="px-3 py-2 align-top">
                      {renderInlineMarkdown(
                        row[cellIndex] || '',
                        `table-cell-${index}-${rowIndex}-${cellIndex}`
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    if (isUnorderedListItem(line) || isOrderedListItem(line)) {
      const ordered = isOrderedListItem(line);
      const items = [];
      while (
        index < lines.length &&
        (ordered ? isOrderedListItem(lines[index]) : isUnorderedListItem(lines[index]))
      ) {
        const itemText = lines[index]
          .replace(ordered ? /^\s*\d+[.)]\s+/ : /^\s*[-*+]\s+/, '')
          .trim();
        items.push(
          <li key={`list-item-${index}`}>
            {renderInlineMarkdown(itemText, `list-item-${index}`)}
          </li>
        );
        index += 1;
      }
      const List = ordered ? 'ol' : 'ul';
      blocks.push(
        <List
          key={`list-${index}`}
          className={`mb-3 space-y-1 pl-5 ${
            ordered ? 'list-decimal' : 'list-disc'
          }`}
        >
          {items}
        </List>
      );
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const quoteLines = [];
      while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^\s*>\s?/, '').trim());
        index += 1;
      }
      blocks.push(
        <blockquote
          key={`quote-${index}`}
          className="mb-3 border-l-2 border-primary/50 pl-3 text-muted-foreground"
        >
          {quoteLines.map((quoteLine, quoteIndex) => (
            <p key={`quote-line-${quoteIndex}`}>
              {renderInlineMarkdown(quoteLine, `quote-${index}-${quoteIndex}`)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (/^\s*([-*_]\s*){3,}$/.test(line)) {
      blocks.push(<hr key={`rule-${index}`} className="my-3 border-border" />);
      index += 1;
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !isBlockStart(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`} className="mb-3 last:mb-0">
        {renderInlineMarkdown(paragraph.join(' '), `paragraph-${index}`)}
      </p>
    );
  }

  return <div className="break-words text-sm leading-relaxed">{blocks}</div>;
}

function AnalysisCard({ payload }) {
  const {
    totalCost,
    servicesCost,
    transferCost,
    services,
    connections,
    warnings = [],
    architectureName,
  } = payload;
  const hasCalculationWarnings = warnings.length > 0;

  return (
    <div className="space-y-3 text-sm">
      {/* Summary Banner */}
      <div
        className={`rounded-lg border p-3 ${
          hasCalculationWarnings
            ? 'border-warning/40 bg-warning/20'
            : 'border-primary/30 bg-primary/10'
        }`}
      >
        <p className="text-xs text-primary font-mono uppercase tracking-widest mb-1">
          {hasCalculationWarnings
            ? 'Partial monthly estimate'
            : 'Monthly estimate'}{' '}
          · {architectureName}
        </p>
        <p className="text-3xl font-bold text-primary font-mono">{formatUSD(totalCost)}</p>
        {hasCalculationWarnings && (
          <p className="mt-1 text-xs text-warning-foreground">
            Some costs could not be calculated; this total excludes them.
          </p>
        )}
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span>Services: <span className="text-foreground">{formatUSD(servicesCost)}</span></span>
          <span>Data Transfer: <span className="text-foreground">{formatUSD(transferCost)}</span></span>
        </div>
      </div>

      {/* Service Breakdown */}
      {services.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Breakdown</p>
          <div className="space-y-1.5">
            {services.map((svc) => (
              <div
                key={svc.node_id}
                className="flex items-center justify-between bg-muted/70 rounded-md px-3 py-2 border border-border"
              >
                <div className="flex items-center gap-2 text-foreground/80">
                  <span className="text-primary">
                    {SERVICE_ICON[svc.service_type] ?? <Cloud className="w-3.5 h-3.5" />}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{svc.name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{svc.region}</span>
                    </div>
                  </div>
                </div>
                <span className="font-mono font-semibold text-foreground">{formatUSD(svc.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data Transfer */}
      {connections.some(
        (connection) =>
          connection.cost > 0 ||
          connection.transfer_type === 'cloudfront_origin_free'
      ) && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Data Transfer</p>
          <div className="space-y-1.5">
            {connections.map((conn) => (
              <div
                key={conn.connection_id}
                className="flex items-center justify-between bg-muted/70 rounded-md px-3 py-2 border border-border"
              >
                <div className="text-muted-foreground text-xs">
                  <span className="text-foreground/80">{conn.source_name}</span>
                  <span className="mx-1.5">→</span>
                  <span className="text-foreground/80">{conn.target_name}</span>
                  <span className="ml-2 text-muted-foreground">
                    ({conn.transfer_type === 'cloudfront_origin_free'
                      ? 'CloudFront origin transfer — free'
                      : conn.transfer_type?.replace(/_/g, ' ')})
                  </span>
                </div>
                <span className="font-mono text-xs text-foreground/80">{formatUSD(conn.cost)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings & Optimizations */}
      {hasCalculationWarnings && (
        <div>
          <p className="text-xs font-semibold text-warning-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Calculation warnings
          </p>
          <div className="space-y-1.5">
            {warnings.map((w, i) => (
              <div key={i} className="flex gap-2 bg-warning/20 border border-warning/40 rounded-md px-3 py-2">
                <p className="break-words text-xs text-warning-foreground">{w}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasCalculationWarnings && (
        <div className="flex items-center gap-2 text-xs text-success-foreground">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>
            Estimate uses the configured usage and current pricing data; actual AWS charges may vary.
          </span>
        </div>
      )}
    </div>
  );
}

export function ChatMessage({ message }) {
  const isUser = message.role === 'user';
  const isError = message.type === 'error';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center mr-2 flex-shrink-0 mt-0.5 shadow-md shadow-primary/20">
          <span className="text-xs font-black text-foreground">A</span>
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-muted text-foreground rounded-tr-sm'
            : isError
            ? 'bg-destructive/15 border border-destructive/30 text-destructive rounded-tl-sm'
            : 'bg-muted/80 border border-border text-foreground rounded-tl-sm'
        }`}
      >
        {message.type === 'analysis' ? (
          <AnalysisCard payload={message.payload} />
        ) : (
          isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <MarkdownMessage content={message.content} />
          )
        )}

        {message.timestamp && (
          <p className="text-[10px] text-muted-foreground mt-1.5 text-right font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-muted-foreground/30 flex items-center justify-center ml-2 flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-foreground">U</span>
        </div>
      )}
    </div>
  );
}
