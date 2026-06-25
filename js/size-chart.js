import { getSizeChart } from './data-store.js';

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderSizeChart() {
  const chart = getSizeChart();
  if (!chart?.rows?.length) return '';

  const columns = chart.columns || [
    { key: 'size', label: 'Размер' },
    { key: 'footLength', label: 'Длина стопы' },
    { key: 'insoleLength', label: 'Длина по стельке' },
    { key: 'height', label: 'Высота от пола' },
  ];

  return `
    <div class="size-chart" aria-label="${escapeHtml(chart.title || 'Размерная сетка')}">
      <p class="size-chart-kicker">${escapeHtml(chart.title || 'Размерная сетка')}</p>
      ${chart.fitNote ? `<p class="size-chart-fit">${escapeHtml(chart.fitNote)}</p>` : ''}
      <div class="size-chart-scroll">
        <table class="size-chart-table">
          <thead>
            <tr>${columns.map((col) => `<th scope="col">${escapeHtml(col.label)}</th>`).join('')}</tr>
          </thead>
          <tbody>
            ${chart.rows
              .map(
                (row) =>
                  `<tr>${columns
                    .map((col) => `<td>${escapeHtml(row[col.key] || '')}</td>`)
                    .join('')}</tr>`,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      ${
        chart.importantNote
          ? `<p class="size-chart-important"><strong>Важно:</strong> ${escapeHtml(chart.importantNote)}</p>`
          : ''
      }
    </div>`;
}

export function mountSizeCharts(root = document) {
  root.querySelectorAll('[data-size-chart]').forEach((slot) => {
    slot.outerHTML = renderSizeChart();
  });
}
