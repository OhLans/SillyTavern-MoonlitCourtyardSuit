import { getContext, createFrameTask, createObserverRegistry, onSillyTavernEvents, setAttribute, setHidden, toggleClass } from '../../core/runtime.js';

const $ = (selector, root = document) => root.querySelector(selector);
const observers = createObserverRegistry();
const subscriptions = [];
const moved = new Map();
const attributes = new Map();
const cardAttributes = new WeakMap();
const avatarTitles = new WeakMap();
const addedClasses = new Map();
const generated = new Set();
const listeners = [];
const scheduleHero = createFrameTask(syncHero);
let panel = null;
let nativePersonas = null;
let personaImport = null;
let selectedId = '';
let view = 'portrait';
let loadedPreference = false;
let reloadImage = false;
let pendingImageReload = false;

function make(tag, className = '', text = '') {
    const node = document.createElement(tag);
    node.className = className;
    node.textContent = text;
    generated.add(node);
    return node;
}

function listen(node, name, handler) {
    node.addEventListener(name, handler);
    listeners.push(() => node.removeEventListener(name, handler));
}

function rememberAttribute(node, name) {
    if (!attributes.has(node)) attributes.set(node, new Map());
    const original = attributes.get(node);
    if (!original.has(name)) original.set(name, node.getAttribute(name));
}

function attribute(node, name, value) {
    rememberAttribute(node, name);
    setAttribute(node, name, value);
}

function mark(node, name) {
    if (node.classList.contains(name)) return;
    if (!addedClasses.has(node)) addedClasses.set(node, new Set());
    addedClasses.get(node).add(name);
    node.classList.add(name);
}

function move(node, target) {
    if (!node || !target) return;
    if (!moved.has(node)) {
        const placeholder = document.createComment(`rpp:${node.id || node.tagName}`);
        node.before(placeholder);
        moved.set(node, placeholder);
    }
    if (node.parentNode !== target) target.append(node);
}

function dropdown(id, label) {
    const details = make('details', 'rpp-dropdown');
    details.id = id;
    const summary = make('summary', '', label);
    const content = make('div', 'rpp-dropdown-content');
    content.id = `${id}-content`;
    summary.setAttribute('aria-controls', content.id);
    details.append(summary, content);
    // Native details toggles only from its own summary. No outside-click listener.
    return { details, content };
}

function gridButton() {
    const button = make('button', 'menu_button rpp-view-toggle');
    button.type = 'button';
    button.id = 'rpp-current-view-toggle';
    button.setAttribute('aria-controls', 'rpp-current-hero');
    button.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>';
    listen(button, 'click', () => {
        view = view === 'portrait' ? 'banner' : 'portrait';
        const ctx = getContext();
        if (ctx?.extensionSettings) {
            const settings = ctx.extensionSettings.moonlitCourtyardSuit ??= {};
            settings.personaHeaderView = view;
            loadedPreference = true;
            ctx.saveSettingsDebounced?.();
        }
        applyView();
    });
    return button;
}

function applyView() {
    if (!panel) return;
    const ctx = getContext();
    if (!loadedPreference && ctx?.extensionSettings) {
        view = ctx.extensionSettings.moonlitCourtyardSuit?.personaHeaderView === 'banner' ? 'banner' : 'portrait';
        loadedPreference = true;
    }
    toggleClass(panel, 'rpp-banner-header', view === 'banner');
    const button = $('#rpp-current-view-toggle', panel);
    const label = view === 'banner' ? 'Switch to portrait layout' : 'Switch to banner layout';
    setAttribute(button, 'title', label);
    setAttribute(button, 'aria-label', label);
    setAttribute(button, 'aria-pressed', String(view === 'banner'));
}

function syncListToggle() {
    const list = $('#user_avatar_block', panel);
    const toggle = $('#persona_grid_toggle', panel);
    if (!list || !toggle) return;
    const circles = list.classList.contains('gridView');
    const title = circles ? 'Switch to persona banners' : 'Switch to circular grid';
    attribute(toggle, 'title', title);
    attribute(toggle, 'aria-label', title);
    attribute(toggle, 'aria-pressed', String(circles));
}

function decorateCard(card) {
    if (!card.matches('.avatar-container')) return;
    const name = $('.ch_name', card)?.textContent?.trim() || card.dataset.avatarId || 'Persona';
    if (!cardAttributes.has(card)) {
        cardAttributes.set(card, new Map(['title', 'aria-label', 'role', 'tabindex'].map(key => [key, card.getAttribute(key)])));
    }
    // Weak references allow native pagination to discard old cards normally.
    setAttribute(card, 'title', name);
    setAttribute(card, 'aria-label', name);
    setAttribute(card, 'role', 'button');
    setAttribute(card, 'tabindex', '0');
    const avatar = $('.avatar', card);
    if (avatar) {
        if (!avatarTitles.has(avatar)) avatarTitles.set(avatar, avatar.getAttribute('title'));
        setAttribute(avatar, 'title', name);
    }
}

function syncMoreOptions() {
    const select = $('#persona-management-dropdown', panel);
    if (!select) return;
    // Expose any actions added by other extensions, even after our startup.
    const hasExtra = [...select.options].some(option => !option.disabled && option.value !== 'default' && option.id !== 'persona_lorebook_link');
    const label = select.closest('label');
    if (label) {
        rememberAttribute(label, 'hidden');
        if (hasExtra) label.removeAttribute('hidden');
        else setAttribute(label, 'hidden', '');
    }
    $('#rpp-link-lorebook', panel).hidden = !$('#persona_lorebook_link', select);
}

function syncHero() {
    if (!panel) return;
    const card = nativePersonas ? null : $('#user_avatar_block .avatar-container.selected', panel);
    const id = nativePersonas ? nativePersonas.user_avatar : selectedId || card?.dataset.avatarId || '';
    const name = $('#your_name', panel)?.textContent?.trim() || getContext()?.name1 || 'Current persona';
    const url = id ? new URL(`User Avatars/${encodeURIComponent(id)}`, document.baseURI).href : '';
    for (const img of panel.querySelectorAll('.rpp-persona-image')) {
        setAttribute(img, 'alt', name);
        if (url && (reloadImage || img.getAttribute('src') !== url)) {
            setHidden(img, false);
            img.src = url;
        } else if (!url) {
            if (img.hasAttribute('src')) img.removeAttribute('src');
            setHidden(img, true);
        }
    }
    reloadImage = false;
}

function build() {
    const currentPanel = $('#PersonaManagement');
    const current = $('.persona_management_current_persona', currentPanel || document);
    const list = $('#user_avatar_block', currentPanel || document);
    if (!currentPanel || !current || !list || panel) return;
    panel = currentPanel;
    mark(panel, 'rpp-enabled');

    const left = $('.persona_management_left_column', panel);
    const nativeTools = $('#persona_search_bar', panel)?.parentElement;
    const tools = make('div', 'rpp-list-tools');
    tools.id = 'rpp-list-tools';
    left.prepend(tools);
    const actions = dropdown('rpp-actions', 'Actions');
    tools.append(actions.details);
    for (const selector of ['#create_dummy_persona', '#personas_backup', '#personas_restore', '.user_stats_button']) {
        move($(selector, panel), actions.content);
    }
    const listToggle = $('#persona_grid_toggle', panel);
    if (listToggle) {
        move(listToggle, tools);
        attribute(listToggle, 'role', 'button');
        attribute(listToggle, 'tabindex', '0');
        attribute(listToggle, 'aria-controls', 'user_avatar_block');
    }
    if (nativeTools) {
        mark(nativeTools, 'rpp-search-tools');
        const pagination = make('div', 'rpp-pagination');
        nativeTools.after(pagination);
        move($('#persona_pagination_container', panel), pagination);
    }

    const heading = $('.standoutHeader', current);
    const headingRow = make('div', 'rpp-current-heading');
    current.prepend(headingRow);
    move(heading, headingRow);
    headingRow.append(gridButton());
    const hero = make('div', 'rpp-current-hero');
    hero.id = 'rpp-current-hero';
    headingRow.after(hero);
    const media = make('div', 'rpp-current-media');
    for (const className of ['rpp-current-image', 'rpp-current-avatar']) {
        const img = make('img', `rpp-persona-image ${className}`);
        img.decoding = 'async';
        img.draggable = false;
        listen(img, 'error', () => { img.hidden = true; });
        media.append(img);
    }
    move($('#persona_controls', panel), hero);
    hero.append(media);

    const labels = {
        persona_rename_button: 'Rename persona',
        sync_name_button: 'Set persona for all messages',
        persona_lore_button: 'Persona lore',
        persona_set_image_button: 'Change persona image',
        persona_duplicate_button: 'Duplicate persona',
        persona_delete_button: 'Delete persona',
    };
    for (const [id, text] of Object.entries(labels)) {
        const button = $(`#${id}`, panel);
        if (!button) continue;
        mark(button, 'rpp-text-action');
        attribute(button, 'role', 'button');
        attribute(button, 'tabindex', '0');
        button.append(make('span', 'rpp-action-label', text));
    }
    const link = make('button', 'menu_button rpp-text-action', 'Link to persona lorebook');
    link.id = 'rpp-link-lorebook';
    link.type = 'button';
    $('.persona_controls_buttons_block', panel)?.append(link);
    listen(link, 'click', () => {
        const select = $('#persona-management-dropdown', panel);
        const index = [...(select?.options || [])].findIndex(option => option.id === 'persona_lorebook_link');
        if (index < 0) return;
        select.selectedIndex = index;
        select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    const position = $('.persona_management_description_position_container', panel);
    const positionHeading = position?.previousElementSibling;
    const connectionsHeading = position?.nextElementSibling;
    const settings = make('div', 'rpp-settings');
    positionHeading?.before(settings);
    const positionSlot = make('div', 'rpp-position');
    settings.append(positionSlot);
    move(positionHeading, positionSlot);
    move(position, positionSlot);
    const connections = dropdown('rpp-connections', 'Connections');
    settings.append(connections.details);
    if (connectionsHeading?.matches('h4')) attribute(connectionsHeading, 'hidden', '');
    for (const id of ['persona_connections_buttons', 'persona_connections_info_block', 'persona_connections_list']) {
        move($(`#${id}`, panel), connections.content);
    }
    const global = $('.persona_management_global_settings', panel);
    if (global) {
        const globalHeading = $('h4', global);
        if (globalHeading) attribute(globalHeading, 'hidden', '');
        const globalSettings = dropdown('rpp-global-settings', 'Global Settings');
        $('.persona_management_right_column', panel).append(globalSettings.details);
        move(global, globalSettings.content);
    }

    listen(panel, 'keydown', event => {
        if (!['Enter', ' '].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
        const target = event.target.closest('.rpp-text-action, #rpp-current-view-toggle, #persona_grid_toggle, #user_avatar_block .avatar-container');
        if (!target || event.target !== target) return;
        // ST's global keyboard handler also clicks .menu_button elements.
        // Own this one activation to avoid that click plus the button default.
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat && !target.disabled && !target.classList.contains('disabled')) target.click();
    });
    const upload = $('#avatar_upload_file', panel);
    if (upload) listen(upload, 'change', () => {
        pendingImageReload = Boolean($('#avatar_upload_overwrite', panel)?.value && upload.files?.length);
    });
    const uploadForm = $('#form_upload_avatar', panel);
    if (uploadForm) listen(uploadForm, 'reset', () => {
        // Native upload/crop finishes by resetting this form. Waiting for that
        // event avoids consuming the refresh while its async crop is still open.
        if (!pendingImageReload) return;
        pendingImageReload = false;
        reloadImage = true;
        scheduleHero();
    });

    for (const card of list.children) decorateCard(card);
    observers.observe('list', list, { childList: true }, records => {
        for (const record of records) for (const node of record.addedNodes) {
            if (node.nodeType === 1) decorateCard(node);
        }
        scheduleHero();
    });
    observers.observe('grid', list, { attributes: true, attributeFilter: ['class'] }, syncListToggle);
    observers.observe('drawer', panel, { attributes: true, attributeFilter: ['class'] }, () => {
        if (panel.classList.contains('openDrawer')) scheduleHero();
    });
    observers.observe('name', $('#your_name', panel), { childList: true, characterData: true, subtree: true }, scheduleHero);
    observers.observe('more', $('#persona-management-dropdown', panel), { childList: true, subtree: true }, syncMoreOptions);
    syncListToggle();
    syncMoreOptions();
    applyView();
    syncHero();
}

export function refresh() {
    build();
    applyView();
    scheduleHero();
}

export function init() {
    subscriptions.push(onSillyTavernEvents(['PERSONA_CHANGED'], id => {
        if (typeof id === 'string') selectedId = id;
        scheduleHero();
    }));
    subscriptions.push(onSillyTavernEvents(['PERSONA_UPDATED', 'CHAT_CHANGED'], scheduleHero));
    subscriptions.push(onSillyTavernEvents(['PERSONA_CREATED', 'PERSONA_RENAMED', 'PERSONA_DELETED'], () => {
        scheduleHero();
        // Only visible cards need labels, and no layout/style reads are used.
        panel?.querySelectorAll('#user_avatar_block > .avatar-container').forEach(decorateCard);
    }));
    refresh();
    // Read the native live binding, so filtering/paging the selected card out
    // cannot replace the current-persona portrait. This module is already
    // loaded by SillyTavern; importing it does not initialize another copy.
    personaImport ??= import('../../../../../personas.js');
    personaImport.then(module => {
        nativePersonas = module;
        if (panel) scheduleHero();
    }).catch(() => {
        // Older/custom hosts can still use the selected card and native events.
        if (panel) scheduleHero();
    });
}

export function cleanup() {
    observers.disconnect();
    subscriptions.splice(0).forEach(unsubscribe => unsubscribe());
    listeners.splice(0).forEach(remove => remove());
    scheduleHero.cancel();
    for (const [node, placeholder] of [...moved].reverse()) {
        if (placeholder.parentNode) placeholder.replaceWith(node);
    }
    moved.clear();
    for (const card of panel?.querySelectorAll('#user_avatar_block > .avatar-container') || []) {
        for (const [name, value] of cardAttributes.get(card) || []) {
            if (value === null) card.removeAttribute(name);
            else card.setAttribute(name, value);
        }
        const avatar = $('.avatar', card);
        if (avatar && avatarTitles.has(avatar)) {
            const title = avatarTitles.get(avatar);
            if (title === null) avatar.removeAttribute('title');
            else avatar.setAttribute('title', title);
        }
    }
    for (const [node, original] of attributes) for (const [name, value] of original) {
        if (value === null) node.removeAttribute(name);
        else node.setAttribute(name, value);
    }
    attributes.clear();
    addedClasses.forEach((names, node) => names.forEach(name => node.classList.remove(name)));
    addedClasses.clear();
    panel?.classList.remove('rpp-banner-header');
    generated.forEach(node => node.remove());
    generated.clear();
    panel = null;
}
