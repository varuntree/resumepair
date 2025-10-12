import path from 'path'
import { promises as fs } from 'fs'
import { ArtboardDocument } from '../types'
import type { ResumeData, SectionKey } from '../schema'
import { getTemplateRenderer } from '../templates'
import { buildArtboardStyles } from '../styles'
import { PAGE_SIZE_MM, MM_TO_PX } from '../constants/page'
import { setArtboardResume, resetArtboardResume } from '../store/artboard'

let cachedTailwindCss: string | null = null

async function loadTailwindCss(): Promise<string> {
  if (cachedTailwindCss !== null) {
    return cachedTailwindCss
  }

  const filePath = path.join(process.cwd(), 'public', 'artboard', 'tailwind.css')
  try {
    cachedTailwindCss = await fs.readFile(filePath, 'utf8')
  } catch {
    cachedTailwindCss = ''
  }

  return cachedTailwindCss
}

export async function renderArtboardToHtml(
  document: ArtboardDocument,
  resumeData?: ResumeData
): Promise<string> {
  const React = await import('react')
  const { renderToStaticMarkup } = await import('react-dom/server')
  const Template = getTemplateRenderer(document.template)
  if (resumeData) {
    setArtboardResume(resumeData)
  }
  const columnCount = document.layout?.[0]?.length ?? 0
  const measurementColumns: SectionKey[][] =
    columnCount > 0
      ? Array.from({ length: columnCount }, (_, index) => {
          const collected: SectionKey[] = []
          document.layout.forEach((pageColumns) => {
            const column = pageColumns[index]
          if (column) {
            collected.push(...(column as SectionKey[]))
            }
          })
          return collected
        })
      : [[]]

  const styles = buildArtboardStyles(document.metadata, { includePageRule: true })
  const tailwindCss = await loadTailwindCss()

  const flowRootMarkup = renderToStaticMarkup(
    React.createElement(
      'div',
      {
        'data-flow-root': 'true',
        style: {
          position: 'absolute',
          inset: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
        },
      },
      React.createElement(Template, {
        columns: measurementColumns as SectionKey[][],
        isFirstPage: true,
        document,
      })
    )
  )

  if (resumeData) {
    resetArtboardResume()
  }

  const format = document.metadata.page.format
  const size = PAGE_SIZE_MM[format] ?? PAGE_SIZE_MM.letter
  const pageWidthPx = size.width * MM_TO_PX
  const pageHeightPx = size.height * MM_TO_PX
  const margin = document.metadata.page.margin ?? 48

  const paginationScript = String.raw`
(function () {
  const root = document.querySelector('[data-artboard-root]');
  if (!root) return;
  const flowRoot = root.querySelector('[data-flow-root]');
  const container = root.querySelector('[data-page-container]');
  if (!flowRoot || !container) return;

  const margin = Number(root.getAttribute('data-page-margin')) || 0;
  const pageHeight = Number(root.getAttribute('data-page-height')) || 0;
  const innerHeight = Math.max(pageHeight - margin * 2, 0);
  const TRUE_VALUES = new Set(['true', '1', 'yes']);
  const ITEM_SELECTOR = '[data-flow-item]';
  const SUB_SELECTOR = '[data-flow-subitem]';
  const GROUP_ATTR = 'flowGroup';

  const parseNumber = (value) => {
    const parsed = Number.parseFloat(value || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const getGroupId = (element) => {
    const groupEl = element.closest('[data-flow-group]');
    if (!groupEl) return undefined;
    const attr = groupEl.dataset[GROUP_ATTR];
    return attr || undefined;
  };

  const measureItems = (rootEl) =>
    Array.from(rootEl.querySelectorAll(ITEM_SELECTOR)).map((element) => {
      const rect = element.getBoundingClientRect();
      const styles = window.getComputedStyle(element);
      return {
        element,
        height: rect.height,
        marginTop: parseNumber(styles.marginTop),
        marginBottom: parseNumber(styles.marginBottom),
        splittable: TRUE_VALUES.has((element.getAttribute('data-flow-splittable') || '').toLowerCase()),
        groupId: getGroupId(element),
      };
    });

  const measureSubItems = (element) =>
    Array.from(element.querySelectorAll(SUB_SELECTOR)).map((sub, index) => {
      const rect = sub.getBoundingClientRect();
      const styles = window.getComputedStyle(sub);
      const marginTop = parseNumber(styles.marginTop);
      const marginBottom = parseNumber(styles.marginBottom);
      return {
        element: sub,
        index,
        height: rect.height + marginTop + marginBottom,
      };
    });

  const sumSubItemHeights = (subItems, from, to) => {
    let total = 0;
    for (let i = from; i < to; i += 1) {
      total += subItems[i]?.height || 0;
    }
    return total;
  };

  const paginate = (items) => {
    const EPSILON = 0.001;
    const pages = [];
    let page = { slices: [], contentHeight: 0 };

    const ensurePage = () => {
      if (page.slices.length > 0) {
        pages.push(page);
      }
    };

    const pushPage = () => {
      ensurePage();
      page = { slices: [], contentHeight: 0 };
    };

    const fits = (addition) => page.contentHeight + addition <= innerHeight + EPSILON;

    items.forEach((item) => {
      const baseHeight = item.height + item.marginTop + item.marginBottom;
      const remaining = innerHeight - page.contentHeight;

      if (item.groupId && page.slices.length > 0 && baseHeight > remaining + EPSILON) {
        pushPage();
      }

      if (fits(baseHeight)) {
        page.slices.push({ type: 'whole', item, height: baseHeight });
        page.contentHeight += baseHeight;
        return;
      }

      if (!item.splittable) {
        if (page.slices.length > 0) pushPage();
        page.slices.push({ type: 'whole', item, height: baseHeight });
        page.contentHeight += baseHeight;
        pushPage();
        return;
      }

      const subItems = measureSubItems(item.element);
      if (subItems.length === 0) {
        if (page.slices.length > 0) pushPage();
        page.slices.push({ type: 'whole', item, height: baseHeight });
        page.contentHeight += baseHeight;
        pushPage();
        return;
      }

      let start = 0;
      while (start < subItems.length) {
        if (page.contentHeight >= innerHeight - EPSILON) {
          pushPage();
        }
        const available = innerHeight - page.contentHeight;
        if (available <= 0) {
          pushPage();
          continue;
        }

        let end = start;
        let sliceHeight = 0;
        while (end < subItems.length) {
          const candidate = sumSubItemHeights(subItems, start, end + 1);
          const marginTop = start === 0 ? item.marginTop : 0;
          const marginBottom = end + 1 === subItems.length ? item.marginBottom : 0;
          const total = candidate + marginTop + marginBottom;
          if (total > available + EPSILON) break;
          sliceHeight = total;
          end += 1;
        }

        if (end === start) {
          end = start + 1;
          sliceHeight =
            sumSubItemHeights(subItems, start, end) +
            (start === 0 ? item.marginTop : 0) +
            (end === subItems.length ? item.marginBottom : 0);
        }

        page.slices.push({ type: 'subslice', item, from: start, to: end, height: sliceHeight });
        page.contentHeight += sliceHeight;

        if (end >= subItems.length) {
          break;
        }

        start = end;
        pushPage();
      }
    });

    ensurePage();
    return pages;
  };

  const cloneSlice = (slice) => {
    if (slice.type === 'whole') {
      return slice.item.element.cloneNode(true);
    }
    const clone = slice.item.element.cloneNode(true);
    const subItems = clone.querySelectorAll(SUB_SELECTOR);
    subItems.forEach((node, index) => {
      if (index < slice.from || index >= slice.to) {
        node.remove();
      }
    });
    return clone;
  };

  const buildPages = () => {
    const items = measureItems(flowRoot);
    const pages = paginate(items);
    container.innerHTML = '';

    if (!pages.length) {
      const fallbackPage = document.createElement('div');
      fallbackPage.setAttribute('data-page', '1');
      fallbackPage.className = 'artboard-page';
      fallbackPage.style.padding = margin + 'px';
      container.appendChild(fallbackPage);
      return;
    }

    pages.forEach((pageData, index) => {
      const pageElement = document.createElement('div');
      pageElement.setAttribute('data-page', String(index + 1));
      pageElement.className = 'artboard-page';
      pageElement.style.padding = margin + 'px';

      pageData.slices.forEach((slice) => {
        pageElement.appendChild(cloneSlice(slice));
      });

      container.appendChild(pageElement);
    });
  };

  const run = () => {
    buildPages();
    document.body.dataset.paginationReady = 'true';
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(run).catch(run);
  } else {
    window.addEventListener('load', run, { once: true });
  }
})();
`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>${tailwindCss}</style>
<style>${styles}</style>
</head>
<body data-pagination-ready="false">
<div
  class="artboard-root"
  data-artboard-root="true"
  data-page-width="${pageWidthPx}"
  data-page-height="${pageHeightPx}"
  data-page-margin="${margin}"
  style="background-color: var(--artboard-color-background); position: relative;"
>
  <div data-page-container></div>
  ${flowRootMarkup}
</div>
<script>${paginationScript}</script>
</body>
</html>`
}
