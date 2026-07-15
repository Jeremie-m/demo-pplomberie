(() => {
  const fallback = window.SITE_FALLBACK || {};
  const at = (object, path) => path.split('.').reduce((value, key) => value && value[key], object);
  const clean = value => typeof value === 'string' ? value.trim() : value;
  const phoneHref = value => `tel:${String(value).replace(/[^+\d]/g, '')}`;
  const phoneLabel = value => String(value).replace(/^\+33/, '0').replace(/(\d{2})(?=\d)/g, '$1 ').trim();

  function render(input = {}) {
    const previewPalette = new URLSearchParams(window.location.search).get('palette');
    const data = {
      business: { ...(fallback.business || {}), ...(input.business || {}) },
      content: { ...(fallback.content || {}), ...(input.content || {}) },
      images: input.images || {},
      palette: clean(previewPalette) || clean(input.palette) || fallback.palette || 'default'
    };

    document.documentElement.dataset.palette = data.palette;
    document.querySelectorAll('[data-field]').forEach(node => {
      const value = clean(at(data, node.dataset.field));
      node.textContent = value || at(fallback, node.dataset.field) || '';
    });

    const phone = clean(data.business.phone);
    document.querySelectorAll('[data-phone-link]').forEach(node => {
      if (!phone) { node.hidden = true; return; }
      node.href = phoneHref(phone);
      node.querySelectorAll('[data-phone-text]').forEach(label => { label.textContent = phoneLabel(phone); });
      if (node.matches('[data-phone-text]')) node.textContent = phoneLabel(phone);
    });

    const services = Array.isArray(data.content.services) ? data.content.services.map(clean).filter(Boolean) : [];
    const finalServices = services.length ? services : fallback.content.services;
    document.querySelectorAll('[data-services]').forEach(list => {
      list.replaceChildren(...finalServices.map((service, index) => {
        const item = document.createElement('li');
        const number = document.createElement('span');
        const name = document.createElement('strong');
        number.textContent = String(index + 1).padStart(2, '0');
        name.textContent = service;
        item.append(number, name);
        return item;
      }));
    });

    const faqs = Array.isArray(data.content.faq) ? data.content.faq.filter(item => clean(item?.question) && clean(item?.answer)) : [];
    document.querySelectorAll('[data-faq]').forEach(list => {
      if (!faqs.length) { list.hidden = true; return; }
      list.replaceChildren(...faqs.map(item => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        const answer = document.createElement('p');
        summary.textContent = clean(item.question);
        answer.textContent = clean(item.answer);
        details.append(summary, answer);
        return details;
      }));
    });

    const prices = Array.isArray(data.content.prices) ? data.content.prices.filter(item => clean(item?.label) && clean(item?.price)) : [];
    document.querySelectorAll('[data-prices]').forEach(list => {
      if (!prices.length) { list.hidden = true; return; }
      list.replaceChildren(...prices.map(item => {
        const row = document.createElement('li');
        const label = document.createElement('span');
        const price = document.createElement('strong');
        label.textContent = clean(item.label);
        price.textContent = clean(item.price);
        row.append(label, price);
        return row;
      }));
    });

    const rating = Number(data.business.rating);
    const reviews = Number(data.business.reviews);
    document.querySelectorAll('[data-proof]').forEach(proof => {
      if (!(rating > 0 && reviews > 0)) { proof.hidden = true; return; }
      proof.querySelectorAll('[data-rating]').forEach(node => { node.textContent = rating.toLocaleString('fr-FR', { maximumFractionDigits: 1 }); });
      proof.querySelectorAll('[data-reviews]').forEach(node => { node.textContent = `${reviews.toLocaleString('fr-FR')} avis Google`; });
    });

    document.querySelectorAll('[data-image-wrap]').forEach(wrap => {
      const slot = wrap.dataset.imageWrap;
      const image = wrap.querySelector('[data-image]');
      const source = clean(data.images[slot]);
      const hide = () => { wrap.hidden = true; document.documentElement.classList.add(`no-${slot}-image`); };
      image.addEventListener('error', hide, { once: true });
      if (source) {
        image.src = source;
        if (image.complete && !image.naturalWidth) hide();
      } else hide();
    });

    document.querySelectorAll('[data-year]').forEach(node => { node.textContent = new Date().getFullYear(); });
    document.title = `${data.business.name || fallback.business.name} — Plombier chauffagiste`;
  }

  fetch('site.json').then(response => response.ok ? response.json() : {}).then(render).catch(() => render());
})();
