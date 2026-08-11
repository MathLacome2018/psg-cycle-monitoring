(() => {
  'use strict';

  const SYMPTOMS = [
    { key: 'menstruations', label: 'Menstruations', tag: 'FLUX', sev: 'Intensité du flux' },
    { key: 'tete', label: 'Mal de tête', tag: 'DOULEUR', sev: 'Sévérité' },
    { key: 'ventre', label: 'Mal de ventre', tag: 'DOULEUR', sev: 'Sévérité' },
    { key: 'fatigue', label: 'Sensation de fatigue', tag: 'RESSENTI', sev: 'Sévérité' },
  ];
  const RAMP = ['#C1D1EF', '#7799DE', '#315FCA', '#213F83', '#112242'];
  const WD = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  const sevBg = (v) => RAMP[Math.min(4, Math.ceil(v / 2) - 1)];
  const sevFg = (v) => (v >= 5 ? '#ffffff' : '#213F83');
  const noise = (d, k) => {
    const x = Math.sin(d * 12.9898 + k * 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const symptomByKey = (key) => SYMPTOMS.find((s) => s.key === key) || SYMPTOMS[0];

  const state = {
    route: 'checkin',
    picker: false,
    saved: false,
    seq: 3,
    entries: [
      { uid: 1, key: 'ventre', present: true, severity: 6, note: "Depuis le réveil, gêne pendant l'échauffement." },
      { uid: 2, key: 'fatigue', present: true, severity: 4, note: '' },
    ],
  };

  function patch(uid, fields) {
    state.saved = false;
    const e = state.entries.find((x) => x.uid === uid);
    if (e) Object.assign(e, fields);
    render();
  }

  function addSymptom(key) {
    state.picker = false;
    state.saved = false;
    state.entries.push({ uid: state.seq, key, present: true, severity: null, note: '' });
    state.seq += 1;
    render();
  }

  function removeEntry(uid) {
    state.saved = false;
    state.entries = state.entries.filter((x) => x.uid !== uid);
    render();
  }

  function calendarRows() {
    const rows = SYMPTOMS.map((s) => ({ key: s.key, label: s.label, cells: [], avg: '–' }));
    for (let d = 1; d <= daysInMonth; d++) {
      const cyc = (d + 17) % 28;
      const flow = cyc < 5 ? [7, 8, 5, 3, 2][cyc] : 0;
      const vals = {
        menstruations: flow,
        tete: noise(d, 1) > 0.74 ? 2 + Math.floor(noise(d, 2) * 5) : 0,
        ventre: flow > 0 ? Math.max(3, flow - 1) : (noise(d, 3) > 0.8 ? 2 + Math.floor(noise(d, 4) * 3) : 0),
        fatigue: noise(d, 5) > 0.45 ? 2 + Math.floor(noise(d, 6) * 6) : 0,
      };
      rows.forEach((r) => {
        const v = vals[r.key];
        r.cells.push({
          v,
          bg: v ? sevBg(v) : 'var(--canvas-soft)',
          fg: v ? sevFg(v) : 'transparent',
          label: v ? String(v) : '',
          title: r.label + ' · ' + d + ' ' + MONTHS[month] + ' · ' + (v ? v + '/10' : 'non déclaré'),
        });
      });
    }
    rows.forEach((r) => {
      const hits = r.cells.filter((c) => c.v > 0);
      r.avg = hits.length ? (hits.reduce((a, c) => a + c.v, 0) / hits.length).toFixed(1) : '–';
    });
    return rows;
  }

  function el(tag, props, children) {
    const node = document.createElement(tag);
    if (props) {
      for (const [k, v] of Object.entries(props)) {
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v);
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => c && node.appendChild(c));
    return node;
  }

  function renderCheckin() {
    const dateLabel = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(today);
    document.getElementById('checkin-date').textContent = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

    document.getElementById('stat-cycle-day').textContent = '14';
    document.getElementById('stat-last-period').textContent = '29 juil.';
    document.getElementById('stat-checkin-count').textContent = '9';

    const count = state.entries.length;
    document.getElementById('entry-count').textContent = count + (count === 1 ? ' entrée' : ' entrées');

    const wrap = document.getElementById('entry-list-wrap');
    wrap.innerHTML = '';

    if (count === 0) {
      wrap.appendChild(el('div', { class: 'empty-state', text: 'Aucun symptôme déclaré pour aujourd\'hui.' }));
    } else {
      const list = el('div', { class: 'entry-list' });
      state.entries.forEach((e) => list.appendChild(renderEntryCard(e)));
      wrap.appendChild(list);
    }

    const savedFlag = document.getElementById('saved-flag');
    savedFlag.style.display = state.saved ? '' : 'none';

    const picker = document.getElementById('symptom-picker');
    picker.style.display = state.picker ? '' : 'none';
    const optionsWrap = document.getElementById('symptom-picker-options');
    optionsWrap.innerHTML = '';
    SYMPTOMS.forEach((s) => {
      optionsWrap.appendChild(el('button', {
        type: 'button', class: 'picker-option', text: s.label,
        onClick: () => addSymptom(s.key),
      }));
    });
  }

  function renderEntryCard(e) {
    const def = symptomByKey(e.key);
    const on = e.present === true;
    const off = e.present === false;

    const head = el('div', { class: 'entry-head' }, [
      el('span', { class: 'entry-label', text: def.label }),
      el('span', { class: 'ds-status ds-status-grey', text: def.tag }),
      el('div', { style: 'flex:1' }),
      el('button', { type: 'button', class: 'entry-remove', text: 'Retirer', onClick: () => removeEntry(e.uid) }),
    ]);

    const yesBtn = el('button', {
      type: 'button', class: 'presence-btn' + (on ? ' is-on' : ''), text: 'Oui',
      onClick: () => patch(e.uid, { present: true }),
    });
    const noBtn = el('button', {
      type: 'button', class: 'presence-btn' + (off ? ' is-on' : ''), text: 'Non',
      onClick: () => patch(e.uid, { present: false, severity: null }),
    });
    const presence = el('div', {}, [
      el('div', { class: 'eyebrow', text: 'Présence', style: 'font-size:10px;margin-bottom:8px;' }),
      el('div', { class: 'presence-toggle' }, [yesBtn, noBtn]),
    ]);

    const severityRead = on ? (e.severity ? e.severity + ' / 10' : 'à renseigner') : 'sans objet';
    const chipRow = el('div', { class: 'chip-row' });
    for (let n = 1; n <= 10; n++) {
      const sel = on && e.severity === n;
      const chip = el('button', {
        type: 'button', class: 'chip' + (sel ? ' is-selected' : ''), text: String(n),
        onClick: () => { if (on) patch(e.uid, { severity: n }); },
      });
      if (!on) chip.disabled = true;
      if (sel) {
        chip.style.background = sevBg(n);
        chip.style.color = sevFg(n);
      }
      chipRow.appendChild(chip);
    }
    const severity = el('div', { class: 'severity-block' }, [
      el('div', { class: 'severity-block-head' }, [
        el('div', { class: 'eyebrow', text: def.sev, style: 'font-size:10px;' }),
        el('span', { class: 'severity-read', text: severityRead }),
      ]),
      chipRow,
    ]);

    const body = el('div', { class: 'entry-body' }, [presence, severity]);

    const textarea = el('textarea', {
      class: 'comment-box', rows: '2',
      placeholder: 'Optionnel : contexte, durée, ce qui soulage…',
      onChange: (ev) => patch(e.uid, { note: ev.target.value }),
    });
    textarea.value = e.note || '';
    const comment = el('div', {}, [
      el('div', { class: 'eyebrow comment-label', text: 'Commentaire', style: 'font-size:10px;' }),
      textarea,
    ]);

    return el('div', { class: 'entry-card' }, [head, body, comment]);
  }

  function renderCalendar() {
    const monthLabel = MONTHS[month].charAt(0).toUpperCase() + MONTHS[month].slice(1);
    document.getElementById('calendar-title').textContent = 'Symptômes, ' + monthLabel + ' ' + year;

    const rangeEnd = daysInMonth < 10 ? '0' + daysInMonth : String(daysInMonth);
    document.getElementById('calendar-range').textContent = '01 – ' + rangeEnd + ' ' + monthLabel.toLowerCase() + ' ' + year;

    const legend = document.getElementById('legend-swatches');
    legend.innerHTML = '';
    ['var(--canvas-soft)', ...RAMP].forEach((bg) => {
      legend.appendChild(el('span', { class: 'legend-swatch', style: 'background:' + bg + ';' }));
    });

    const daysRow = document.getElementById('calendar-days-row');
    daysRow.innerHTML = '';
    daysRow.appendChild(el('div', { class: 'calendar-row-label-spacer' }));
    for (let d = 1; d <= daysInMonth; d++) {
      const wd = WD[new Date(year, month, d).getDay()];
      const isWeekend = wd === 'S' || wd === 'D';
      daysRow.appendChild(el('div', { class: 'calendar-day-head' }, [
        el('div', { class: 'wd', text: wd }),
        el('div', { class: 'n' + (isWeekend ? ' is-weekend' : ''), text: String(d) }),
      ]));
    }
    daysRow.appendChild(el('div', { class: 'calendar-avg-spacer' }));

    const rowsWrap = document.getElementById('calendar-rows');
    rowsWrap.innerHTML = '';
    calendarRows().forEach((r) => {
      const row = el('div', { class: 'calendar-row' });
      row.appendChild(el('div', { class: 'calendar-row-label', text: r.label }));
      r.cells.forEach((c) => {
        row.appendChild(el('div', {
          class: 'calendar-cell', title: c.title, text: c.label,
          style: 'background:' + c.bg + ';color:' + c.fg + ';',
        }));
      });
      row.appendChild(el('div', { class: 'calendar-row-avg', text: r.avg }));
      rowsWrap.appendChild(row);
    });
  }

  function render() {
    document.querySelectorAll('.nav-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.route === state.route);
    });
    document.getElementById('view-checkin').classList.toggle('is-active', state.route === 'checkin');
    document.getElementById('view-calendar').classList.toggle('is-active', state.route === 'calendar');

    if (state.route === 'checkin') renderCheckin();
    else renderCalendar();
  }

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.route = btn.dataset.route;
      state.picker = false;
      render();
    });
  });

  document.getElementById('btn-add-symptom').addEventListener('click', () => {
    state.picker = !state.picker;
    render();
  });

  document.getElementById('btn-save').addEventListener('click', () => {
    state.saved = true;
    state.picker = false;
    render();
  });

  render();
})();
