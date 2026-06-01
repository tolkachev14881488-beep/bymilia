/** Панель модерации каталога */

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function previewImageSrc(path) {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `../${path.replace(/^\//, '')}`;
}

function productThumb(p) {
  const src = p.image || (Array.isArray(p.images) && p.images[0]) || '';
  if (!src) return `<div class="mod-card-thumb mod-card-thumb--empty" style="background:${esc(p.colorHex || '#eee')}"></div>`;
  return `<img class="mod-card-thumb" src="${esc(previewImageSrc(src))}" alt="" loading="lazy" onerror="this.hidden=true;this.nextElementSibling?.classList.remove('hidden')"><div class="mod-card-thumb mod-card-thumb--empty hidden" style="background:${esc(p.colorHex || '#eee')}"></div>`;
}

export function initProductModeration({ root, editorRoot, getProducts, setProducts, onSaveProduct, onQuickPublish, onDelete }) {
  let selectedId = null;
  let filter = '';
  let pendingFiles = [];

  function products() {
    return getProducts();
  }

  function setSelected(id) {
    selectedId = id;
    renderList();
    renderEditor();
  }

  function moveProduct(id, dir) {
    const list = [...products()];
    const idx = list.findIndex((p) => p.id === id);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= list.length) return;
    const [item] = list.splice(idx, 1);
    list.splice(next, 0, item);
    setProducts(list);
    renderList();
  }

  function renderList() {
    const q = filter.trim().toLowerCase();
    const list = products().filter(
      (p) => !q || p.colorName?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q),
    );

    root.innerHTML = `
      <div class="mod-toolbar">
        <input type="search" class="mod-search" id="mod-search" placeholder="Поиск по названию или ID…" value="${esc(filter)}">
        <span class="mod-count">${list.length} / ${products().length}</span>
      </div>
      <div class="mod-grid">
        ${list.length ? list.map((p) => cardHtml(p)).join('') : '<p class="hint">Ничего не найдено</p>'}
      </div>
    `;

    root.querySelector('#mod-search')?.addEventListener('input', (e) => {
      filter = e.target.value;
      renderList();
    });

    root.querySelectorAll('[data-select]').forEach((btn) => {
      btn.addEventListener('click', () => setSelected(btn.dataset.select));
    });
    root.querySelectorAll('[data-toggle]').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const p = products().find((x) => x.id === btn.dataset.toggle);
        if (!p) return;
        p.published = p.published === false;
        setProducts([...products()]);
        await onQuickPublish(p.published === false ? 'Товар скрыт с сайта' : 'Товар снова в каталоге');
        renderList();
        if (selectedId === p.id) renderEditor();
      });
    });
    root.querySelectorAll('[data-move]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        moveProduct(btn.dataset.move, Number(btn.dataset.dir));
        onQuickPublish('Порядок в каталоге обновлён');
      });
    });
  }

  function cardHtml(p) {
    const hidden = p.published === false;
    const active = p.id === selectedId ? ' is-active' : '';
    return `
      <article class="mod-card${active}${hidden ? ' is-hidden' : ''}" data-id="${esc(p.id)}">
        <button type="button" class="mod-card-hit" data-select="${esc(p.id)}">
          ${productThumb(p)}
          <div class="mod-card-body">
            <strong class="mod-card-title">${esc(p.colorName)}</strong>
            <span class="mod-card-price">${p.price} руб.${p.oldPrice ? ` <s>${p.oldPrice}</s>` : ''}</span>
            <span class="mod-card-id">${esc(p.id)}</span>
          </div>
        </button>
        <div class="mod-card-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-toggle="${esc(p.id)}">${hidden ? 'Показать' : 'Скрыть'}</button>
          <button type="button" class="btn btn-secondary btn-sm" data-move="${esc(p.id)}" data-dir="-1" aria-label="Выше">↑</button>
          <button type="button" class="btn btn-secondary btn-sm" data-move="${esc(p.id)}" data-dir="1" aria-label="Ниже">↓</button>
          <a class="btn btn-secondary btn-sm" href="../product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">Сайт</a>
        </div>
      </article>
    `;
  }

  function galleryPathsFromEditor(box) {
    return [...box.querySelectorAll('[data-gallery-path]')]
      .map((el) => el.dataset.galleryPath)
      .filter(Boolean);
  }

  function imgSrcForPath(path) {
    const pending = pendingFiles.find((u) => u.path === path);
    if (pending?.preview) return pending.preview;
    return previewImageSrc(path);
  }

  function renderGalleryEditor(box, paths) {
    const wrap = box.querySelector('#mod-gallery');
    if (!wrap) return;
    wrap.innerHTML =
      paths.length === 0
        ? '<p class="hint mod-gallery-empty">Нет фото — загрузите ниже</p>'
        : paths
            .map(
              (path, i) => `
        <div class="mod-gallery-item" draggable="true" data-idx="${i}" data-gallery-path="${esc(path)}">
          <img src="${esc(imgSrcForPath(path))}" alt="">
          <div class="mod-gallery-item-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-gal-up="${i}" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" class="btn btn-secondary btn-sm" data-gal-down="${i}" ${i === paths.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" class="btn btn-danger btn-sm" data-gal-del="${i}">×</button>
          </div>
          <span class="mod-gallery-path">${esc(path)}</span>
        </div>`,
            )
            .join('');

    let dragFrom = null;
    wrap.querySelectorAll('.mod-gallery-item').forEach((item) => {
      item.addEventListener('dragstart', () => {
        dragFrom = Number(item.dataset.idx);
        item.classList.add('is-dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('is-dragging'));
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        const to = Number(item.dataset.idx);
        if (dragFrom === null || dragFrom === to) return;
        const arr = galleryPathsFromEditor(box);
        const [moved] = arr.splice(dragFrom, 1);
        arr.splice(to, 0, moved);
        renderGalleryEditor(box, arr);
        syncMainImage(box, arr);
      });
    });

    wrap.querySelectorAll('[data-gal-del]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const arr = galleryPathsFromEditor(box);
        arr.splice(Number(btn.dataset.galDel), 1);
        renderGalleryEditor(box, arr);
        syncMainImage(box, arr);
      });
    });
    wrap.querySelectorAll('[data-gal-up]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.galUp);
        const arr = galleryPathsFromEditor(box);
        [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]];
        renderGalleryEditor(box, arr);
        syncMainImage(box, arr);
      });
    });
    wrap.querySelectorAll('[data-gal-down]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.galDown);
        const arr = galleryPathsFromEditor(box);
        [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]];
        renderGalleryEditor(box, arr);
        syncMainImage(box, arr);
      });
    });
  }

  function syncMainImage(box, paths) {
    const main = box.querySelector('[name="image"]');
    if (main && paths[0]) main.value = paths[0];
  }

  function renderEditor() {
    pendingFiles = [];
    if (!selectedId) {
      editorRoot.innerHTML = '<div class="mod-editor-empty"><p>Выберите товар слева или создайте новый</p></div>';
      return;
    }
    const p = products().find((x) => x.id === selectedId);
    if (!p) {
      editorRoot.innerHTML = '<div class="mod-editor-empty"><p>Товар не найден</p></div>';
      return;
    }

    const gallery = Array.isArray(p.images) && p.images.length ? [...p.images] : p.image ? [p.image] : [];

    editorRoot.innerHTML = `
      <div class="mod-editor">
        <header class="mod-editor-head">
          <h3>${esc(p.colorName)}</h3>
          <a class="btn btn-secondary btn-sm" href="../product.html?id=${encodeURIComponent(p.id)}" target="_blank" rel="noopener">Открыть на сайте</a>
        </header>

        <div class="mod-editor-section">
          <h4>Фотографии</h4>
          <div class="mod-gallery" id="mod-gallery"></div>
          <label class="mod-upload-zone">
            <input type="file" id="mod-upload" accept="image/png,image/jpeg,image/webp" multiple hidden>
            <span>+ Перетащите фото или нажмите для загрузки</span>
          </label>
          <p class="hint">Фото загружаются в GitHub при сохранении (нужен токен в «Подключение»)</p>
        </div>

        <div class="field-grid">
          <div class="field"><label>Название</label><input name="colorName" value="${esc(p.colorName)}"></div>
          <div class="field"><label>ID</label><input name="id" value="${esc(p.id)}"></div>
          <div class="field"><label>Цвет (hex)</label><input name="colorHex" type="color" value="${esc(p.colorHex || '#ff5500')}"></div>
          <div class="field"><label>Цена</label><input name="price" type="number" min="0" step="0.01" value="${p.price ?? ''}"></div>
          <div class="field"><label>Старая цена</label><input name="oldPrice" type="number" min="0" step="0.01" value="${p.oldPrice ?? ''}"></div>
          <div class="field"><label>Артикул</label><input name="skuPrefix" value="${esc(p.skuPrefix || '')}"></div>
          <div class="field"><label>Главное фото (путь)</label><input name="image" value="${esc(p.image || '')}"></div>
          <div class="field"><label>В каталоге</label>
            <select name="published">
              <option value="true" ${p.published !== false ? 'selected' : ''}>Показывать</option>
              <option value="false" ${p.published === false ? 'selected' : ''}>Скрыть</option>
            </select>
          </div>
        </div>

        <details class="mod-details">
          <summary>Wildberries</summary>
          <div class="field-grid">
            <div class="field"><label>Ссылка WB</label><input name="wbUrl" value="${esc(p.wbUrl || '')}"></div>
            <div class="field"><label>Артикул nm</label><input name="wbNm" type="number" value="${p.wbNm || ''}"></div>
          </div>
        </details>

        <div class="field"><label>Описание</label><textarea name="description" rows="3">${esc(p.description || '')}</textarea></div>
        <div class="field"><label>Особенности (строка = пункт)</label><textarea name="features" rows="4">${esc((p.features || []).join('\n'))}</textarea></div>

        <div class="mod-editor-footer">
          <button type="button" class="btn btn-primary" id="mod-save">Сохранить и на сайт</button>
          <button type="button" class="btn btn-danger btn-sm" id="mod-delete">Удалить</button>
        </div>
      </div>
    `;

    renderGalleryEditor(editorRoot, gallery);

    const zone = editorRoot.querySelector('.mod-upload-zone');
    const input = editorRoot.querySelector('#mod-upload');

    function addPending(files) {
      const id = editorRoot.querySelector('[name="id"]')?.value?.trim() || p.id;
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
        const path = `assets/products/${id}-${Date.now()}-${pendingFiles.length}.${ext}`;
        pendingFiles.push({ path, file, preview: URL.createObjectURL(file) });
        const paths = [...galleryPathsFromEditor(editorRoot), path];
        renderGalleryEditor(editorRoot, paths);
        syncMainImage(editorRoot, paths);
      }
    }

    zone?.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('is-dragover');
    });
    zone?.addEventListener('dragleave', () => zone.classList.remove('is-dragover'));
    zone?.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('is-dragover');
      addPending([...e.dataTransfer.files]);
    });
    input?.addEventListener('change', () => {
      addPending([...input.files]);
      input.value = '';
    });

    editorRoot.querySelector('#mod-save')?.addEventListener('click', async () => {
      const data = readEditorForm(editorRoot, p);
      const paths = galleryPathsFromEditor(editorRoot);
      data.images = paths;
      data.image = paths[0] || data.image;
      data._pendingUploads = [...pendingFiles];
      await onSaveProduct(p.id, data);
      pendingFiles = [];
    });

    editorRoot.querySelector('#mod-delete')?.addEventListener('click', () => onDelete(p.id));
  }

  function readEditorForm(box, prev) {
    const get = (n) => box.querySelector(`[name="${n}"]`)?.value?.trim() ?? '';
    return {
      ...prev,
      id: get('id') || prev.id,
      colorName: get('colorName'),
      colorHex: get('colorHex') || '#ff5500',
      price: parseFloat(get('price')) || 0,
      oldPrice: get('oldPrice') ? parseFloat(get('oldPrice')) : undefined,
      skuPrefix: get('skuPrefix'),
      image: get('image'),
      wbUrl: get('wbUrl'),
      wbNm: get('wbNm') ? Number(get('wbNm')) : undefined,
      published: get('published') !== 'false',
      description: get('description'),
      features: get('features')
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
  }

  renderList();
  renderEditor();

  return {
    refresh: () => {
      renderList();
      renderEditor();
    },
    select: setSelected,
  };
}
