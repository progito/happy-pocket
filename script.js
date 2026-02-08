// ====================================
// HAPPY POCKET v3.0 - FULL APPLICATION
// Based on "Happy Pocket Full of Money"
// ====================================

// ============ STORAGE KEYS ============
const STORAGE_KEYS = {
    GOALS: 'hp_goals',
    PHRASES: 'hp_phrases',
    GRATITUDE: 'hp_gratitude',
    STATES: 'hp_states',
    BEING: 'hp_being',
    SETTINGS: 'hp_settings',
    LAST_SAVE: 'hp_lastSave'
};

// ============ FORBIDDEN WORDS ============
const FORBIDDEN_WORDS = [
    'хочу', 'хотел', 'хотела', 'хотелось', 'хочется',
    'нужно', 'надо', 'должен', 'должна', 'должны',
    'если получится', 'когда-нибудь', 'постараюсь',
    'мечтаю', 'мечта', 'нет денег', 'избавиться',
    'буду', 'будет', 'будут', 'стану', 'станет', 'получу',
    'попробую', 'может быть', 'наверное'
];

// ============ STATUS CONFIG ============
const STATUS_CONFIG = {
    forming: { label: 'Формируется', icon: 'circle' },
    living: { label: 'Проживаю', icon: 'play' },
    embodied: { label: 'Воплощено', icon: 'star' },
    released: { label: 'Отпущено', icon: 'wind' }
};

// ============ STATE ============
let data = {
    goals: [],
    phrases: [],
    gratitude: [],
    states: [],
    being: [],
    settings: { theme: 'dark' }
};

let currentGoalId = null;
let currentWizardStep = 1;
let wizardData = { images: [] };
let emotionScore = null;
let antiNeedAnswer = null;
let selectedState = null;

// ============ DOM ELEMENTS ============
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ============ ICONS ============
const icons = {
    check: `<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`,
    x: `<svg class="icon icon-sm" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
    edit: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
    trash: `<svg class="icon icon-sm" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
    arrow: `<svg class="icon" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
    star: `<svg class="icon" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    play: `<svg class="icon icon-sm" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>`,
    wind: `<svg class="icon icon-sm" viewBox="0 0 24 24"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>`,
    image: `<svg class="icon icon-xl" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`
};

// ============ INITIALIZATION ============
function init() {
    loadData();
    applyTheme();
    bindEvents();
    navigateTo('state');
    checkAutoBackup();
    updateAllStats();
}

// ============ DATA MANAGEMENT ============
function loadData() {
    try {
        Object.keys(STORAGE_KEYS).forEach(key => {
            const stored = localStorage.getItem(STORAGE_KEYS[key]);
            if (stored && key !== 'LAST_SAVE') {
                const parsed = JSON.parse(stored);
                if (key === 'SETTINGS') {
                    data.settings = { ...data.settings, ...parsed };
                } else {
                    data[key.toLowerCase()] = parsed;
                }
            }
        });
    } catch (e) {
        console.error('Error loading data:', e);
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(data.goals));
        localStorage.setItem(STORAGE_KEYS.PHRASES, JSON.stringify(data.phrases));
        localStorage.setItem(STORAGE_KEYS.GRATITUDE, JSON.stringify(data.gratitude));
        localStorage.setItem(STORAGE_KEYS.STATES, JSON.stringify(data.states));
        localStorage.setItem(STORAGE_KEYS.BEING, JSON.stringify(data.being));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(data.settings));
    } catch (e) {
        console.error('Error saving data:', e);
        showToast('Ошибка сохранения', 'error');
    }
}

// ============ THEME ============
function applyTheme() {
    if (data.settings.theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        $('themeToggle')?.classList.add('active');
    } else {
        document.documentElement.removeAttribute('data-theme');
        $('themeToggle')?.classList.remove('active');
    }
}

function toggleTheme() {
    data.settings.theme = data.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveData();
    showToast(`Тема: ${data.settings.theme === 'light' ? 'светлая' : 'тёмная'}`, 'success');
}

// ============ NAVIGATION ============
function navigateTo(pageId) {
    // Update nav items
    $$('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.page === pageId);
    });
    
    // Update pages
    $$('.page').forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageId}`);
    });
    
    // Render page content
    switch(pageId) {
        case 'goals':
            renderGoals();
            break;
        case 'speech':
            renderPhrases();
            break;
        case 'gratitude':
            renderGratitude();
            break;
        case 'history':
            renderHistory();
            break;
    }
    
    // Close mobile sidebar
    $('sidebar')?.classList.remove('open');
}

// ============ STATS ============
function updateAllStats() {
    // Goals count in nav
    const goalsCount = $('goalsCount');
    if (goalsCount) goalsCount.textContent = data.goals.length;
    
    // State page stats
    const expandedDays = data.states.filter(s => s.state === 'expanded').length;
    const statExpanded = $('statExpanded');
    if (statExpanded) statExpanded.textContent = expandedDays;
    
    const statGoalsTotal = $('statGoalsTotal');
    if (statGoalsTotal) statGoalsTotal.textContent = data.goals.length;
    
    const embodiedCount = data.goals.filter(g => g.status === 'embodied').length;
    const statEmbodied = $('statEmbodied');
    if (statEmbodied) statEmbodied.textContent = embodiedCount;
    
    const statGratitude = $('statGratitude');
    if (statGratitude) statGratitude.textContent = data.gratitude.length;
}

// ============ STATE TRACKER ============
function selectState(state) {
    selectedState = state;
    $$('.state-option').forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.state === state);
    });
}

function saveState() {
    if (!selectedState) {
        showToast('Выберите состояние', 'warning');
        return;
    }
    
    const stateEntry = {
        id: generateId(),
        state: selectedState,
        timestamp: Date.now()
    };
    
    data.states.push(stateEntry);
    saveData();
    updateAllStats();
    showToast('Состояние зафиксировано', 'success');
    
    // Reset selection
    selectedState = null;
    $$('.state-option').forEach(opt => opt.classList.remove('selected'));
}

function saveBeing() {
    const who = $('beingWho')?.value?.trim();
    const action = $('beingAction')?.value?.trim();
    
    if (!who && !action) {
        showToast('Заполните хотя бы одно поле', 'warning');
        return;
    }
    
    const beingEntry = {
        id: generateId(),
        who: who,
        action: action,
        timestamp: Date.now()
    };
    
    data.being.push(beingEntry);
    saveData();
    showToast('Практика сохранена', 'success');
    
    // Clear inputs
    if ($('beingWho')) $('beingWho').value = '';
    if ($('beingAction')) $('beingAction').value = '';
}

// ============ GOALS ============
function renderGoals() {
    const grid = $('goalsGrid');
    const empty = $('goalsEmpty');
    
    if (!grid) return;
    
    if (data.goals.length === 0) {
        grid.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    
    empty?.classList.add('hidden');
    
    // Sort: forming → living → embodied → released
    const sorted = [...data.goals].sort((a, b) => {
        const order = { forming: 0, living: 1, embodied: 2, released: 3 };
        return (order[a.status] || 0) - (order[b.status] || 0);
    });
    
    grid.innerHTML = sorted.map(goal => `
        <div class="goal-card status-${goal.status}" data-id="${goal.id}" onclick="viewGoal('${goal.id}')">
            <div class="goal-images">
                ${goal.images?.length 
                    ? `<img src="${goal.images[0]}" alt="">` 
                    : `<div class="goal-images-placeholder">${icons.image}</div>`}
            </div>
            <div class="goal-content">
                <span class="goal-status ${goal.status}">
                    ${STATUS_CONFIG[goal.status]?.label || goal.status}
                </span>
                <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
                <p class="goal-excerpt">${escapeHtml(goal.feelings || '')}</p>
                <p class="goal-date">${formatDate(goal.createdAt)}</p>
            </div>
        </div>
    `).join('');
}

function openGoalModal(goalId = null) {
    currentGoalId = goalId;
    currentWizardStep = 1;
    wizardData = { images: [] };
    emotionScore = null;
    antiNeedAnswer = null;
    
    // Reset form
    ['goalTitle', 'goalFeelings', 'goalConfidence', 'goalIdentity', 'goalGratitude'].forEach(id => {
        const el = $(id);
        if (el) el.value = '';
    });
    
    const previewGrid = $('imagePreviewGrid');
    if (previewGrid) previewGrid.innerHTML = '';
    
    $$('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
    $$('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    
    // Reset anti-need buttons
    const antiYes = $('antiNeedYes');
    const antiNo = $('antiNeedNo');
    if (antiYes) {
        antiYes.classList.add('btn-primary');
        antiYes.classList.remove('btn-secondary');
    }
    if (antiNo) {
        antiNo.classList.remove('btn-primary');
        antiNo.classList.add('btn-secondary');
    }
    
    if (goalId) {
        const goal = data.goals.find(g => g.id === goalId);
        if (goal) {
            $('goalModalTitle').textContent = 'Редактировать цель';
            $('goalTitle').value = goal.title || '';
            $('goalFeelings').value = goal.feelings || '';
            $('goalConfidence').value = goal.confidence || '';
            $('goalIdentity').value = goal.identity || '';
            $('goalGratitude').value = goal.gratitude || '';
            wizardData.images = [...(goal.images || [])];
            emotionScore = goal.emotionScore || 5;
            antiNeedAnswer = true;
            renderImagePreviews();
            
            $$('.emotion-btn').forEach(btn => {
                if (parseInt(btn.dataset.value) === emotionScore) {
                    btn.classList.add('selected');
                }
            });
        }
    } else {
        $('goalModalTitle').textContent = 'Новая цель изобилия';
    }
    
    updateWizardStep();
    openModal('goalModal');
}

function updateWizardStep() {
    $$('.wizard-step').forEach((step, i) => {
        step.classList.remove('active', 'completed');
        if (i + 1 === currentWizardStep) step.classList.add('active');
        else if (i + 1 < currentWizardStep) step.classList.add('completed');
    });
    
    $$('.wizard-panel').forEach(panel => {
        panel.classList.toggle('active', parseInt(panel.dataset.panel) === currentWizardStep);
    });
    
    const prevBtn = $('wizardPrev');
    const nextBtn = $('wizardNext');
    
    if (prevBtn) prevBtn.style.display = currentWizardStep === 1 ? 'none' : 'flex';
    
    if (nextBtn) {
        if (currentWizardStep === 5) {
            nextBtn.innerHTML = `${icons.check} Сохранить`;
            generateValidationReport();
        } else {
            nextBtn.innerHTML = `Далее ${icons.arrow}`;
        }
    }
}

function validateCurrentStep() {
    clearErrors();
    
    switch (currentWizardStep) {
        case 1:
            const title = $('goalTitle')?.value?.trim();
            const result = GoalValidator.validateTitle(title);
            if (!result.valid) {
                showError('titleError', result.message);
                $('goalTitle')?.classList.add('error');
                return false;
            }
            wizardData.title = title;
            return true;
            
        case 2:
            const feelings = $('goalFeelings')?.value?.trim();
            const confidence = $('goalConfidence')?.value?.trim();
            const identity = $('goalIdentity')?.value?.trim();
            
            const descResult = GoalValidator.validateDescription(feelings, confidence, identity);
            if (!descResult.valid) {
                showError('feelingsError', descResult.messages.join('. '));
                return false;
            }
            wizardData.feelings = feelings;
            wizardData.confidence = confidence;
            wizardData.identity = identity;
            return true;
            
        case 3:
            const imgResult = GoalValidator.validateImages(wizardData.images);
            if (!imgResult.valid) {
                showError('imagesError', imgResult.message);
                return false;
            }
            return true;
            
        case 4:
            let valid = true;
            
            const emotionResult = GoalValidator.validateEmotion(emotionScore);
            if (!emotionResult.valid) {
                showError('emotionError', emotionResult.message);
                valid = false;
            }
            
            const needResult = GoalValidator.validateAntiNeed(antiNeedAnswer);
            if (!needResult.valid) {
                showError('antiNeedError', needResult.message);
                valid = false;
            }
            
            const gratitude = $('goalGratitude')?.value?.trim();
            const gratResult = GoalValidator.validateGratitude(gratitude);
            if (!gratResult.valid) {
                showError('gratitudeError', gratResult.message);
                valid = false;
            }
            
            if (valid) {
                wizardData.emotionScore = emotionScore;
                wizardData.antiNeedAnswer = antiNeedAnswer;
                wizardData.gratitude = gratitude;
            }
            return valid;
            
        case 5:
            return true;
    }
    return true;
}

function generateValidationReport() {
    const validation = GoalValidator.validateAll(wizardData);
    const report = $('validationReport');
    if (!report) return;
    
    const items = [
        { key: 'title', label: 'Формулировка', hint: 'Настоящее время, без нужды' },
        { key: 'description', label: 'Состояние', hint: 'Ощущения, уверенность, идентичность' },
        { key: 'images', label: 'Визуализация', hint: 'Образы-якоря' },
        { key: 'emotion', label: 'Эмоциональный резонанс', hint: 'Ощущение реальности' },
        { key: 'antiNeed', label: 'Отсутствие нужды', hint: 'Внутреннее равновесие' },
        { key: 'gratitude', label: 'Благодарность', hint: 'Признательность' }
    ];
    
    report.innerHTML = items.map(item => {
        const res = validation.results[item.key];
        const pass = res.valid;
        return `
            <div class="validation-item">
                <div class="validation-icon ${pass ? 'pass' : 'fail'}">
                    ${pass ? icons.check : icons.x}
                </div>
                <div class="validation-text">
                    <div class="validation-label">${item.label}</div>
                    <div class="validation-hint">${pass ? item.hint : (res.message || res.messages?.join('. '))}</div>
                </div>
            </div>
        `;
    }).join('');
    
    const nextBtn = $('wizardNext');
    if (nextBtn) {
        nextBtn.disabled = !validation.allValid;
        nextBtn.style.opacity = validation.allValid ? '1' : '0.5';
    }
}

function saveGoal() {
    const validation = GoalValidator.validateAll(wizardData);
    if (!validation.allValid) {
        showToast('Не все критерии пройдены', 'error');
        return;
    }
    
    const now = Date.now();
    
    if (currentGoalId) {
        const index = data.goals.findIndex(g => g.id === currentGoalId);
        if (index !== -1) {
            data.goals[index] = { ...data.goals[index], ...wizardData, updatedAt: now };
        }
        showToast('Цель обновлена', 'success');
    } else {
        data.goals.push({
            id: generateId(),
            ...wizardData,
            status: 'forming',
            createdAt: now,
            updatedAt: now
        });
        showToast('Цель создана!', 'success');
    }
    
    saveData();
    renderGoals();
    updateAllStats();
    closeModal('goalModal');
}

function viewGoal(goalId) {
    const goal = data.goals.find(g => g.id === goalId);
    if (!goal) return;
    
    $('viewGoalTitle').textContent = goal.title;
    
    $('viewGoalBody').innerHTML = `
        ${goal.images?.length ? `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-bottom: 24px;">
                ${goal.images.map(img => `<img src="${img}" style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px;">`).join('')}
            </div>
        ` : ''}
        
        <div style="margin-bottom: 16px;">
            <span class="goal-status ${goal.status}">${STATUS_CONFIG[goal.status]?.label}</span>
        </div>
        
        ${renderViewSection('Мои ощущения', goal.feelings)}
        ${renderViewSection('Почему это естественно', goal.confidence)}
        ${renderViewSection('Кто я в этом состоянии', goal.identity)}
        ${renderViewSection('Благодарность', goal.gratitude)}
        ${renderViewSection('Создано', formatDate(goal.createdAt))}
        
        <div style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;">
            ${goal.status === 'forming' ? `
                <button class="btn btn-success btn-sm" onclick="updateGoalStatus('${goal.id}', 'living')">
                    ${icons.play} Начать проживать
                </button>
            ` : ''}
            ${goal.status === 'living' ? `
                <button class="btn btn-primary btn-sm" onclick="updateGoalStatus('${goal.id}', 'embodied')">
                    ${icons.star} Воплощено!
                </button>
            ` : ''}
            ${goal.status !== 'released' ? `
                <button class="btn btn-secondary btn-sm" onclick="updateGoalStatus('${goal.id}', 'released')">
                    ${icons.wind} Отпустить
                </button>
            ` : ''}
            <button class="btn btn-secondary btn-sm" onclick="editGoal('${goal.id}')">
                ${icons.edit} Редактировать
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteGoal('${goal.id}')">
                ${icons.trash} Удалить
            </button>
        </div>
    `;
    
    openModal('viewGoalModal');
}

function renderViewSection(label, text) {
    if (!text) return '';
    return `
        <div style="margin-bottom: 20px;">
            <div style="font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">${label}</div>
            <p style="line-height: 1.6;">${escapeHtml(text)}</p>
        </div>
    `;
}

function editGoal(goalId) {
    closeModal('viewGoalModal');
    setTimeout(() => openGoalModal(goalId), 300);
}

function updateGoalStatus(goalId, newStatus) {
    const goal = data.goals.find(g => g.id === goalId);
    if (goal) {
        goal.status = newStatus;
        goal.updatedAt = Date.now();
        saveData();
        renderGoals();
        updateAllStats();
        closeModal('viewGoalModal');
        
        const messages = {
            living: 'Вы начали проживать цель',
            embodied: 'Поздравляем! Цель воплощена!',
            released: 'Цель отпущена с благодарностью'
        };
        showToast(messages[newStatus] || 'Статус обновлён', 'success');
    }
}

function deleteGoal(goalId) {
    if (confirm('Удалить эту цель?')) {
        data.goals = data.goals.filter(g => g.id !== goalId);
        saveData();
        renderGoals();
        updateAllStats();
        closeModal('viewGoalModal');
        showToast('Цель удалена', 'success');
    }
}

// ============ IMAGE HANDLING ============
function handleImageUpload(e) {
    const files = Array.from(e.target.files);
    const remaining = 7 - wizardData.images.length;
    
    if (files.length > remaining) {
        showToast(`Максимум ещё ${remaining} изображений`, 'warning');
    }
    
    files.slice(0, remaining).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            wizardData.images.push(ev.target.result);
            renderImagePreviews();
        };
        reader.readAsDataURL(file);
    });
    
    e.target.value = '';
}

function renderImagePreviews() {
    const grid = $('imagePreviewGrid');
    if (!grid) return;
    
    grid.innerHTML = wizardData.images.map((img, i) => `
        <div class="image-preview-item">
            <img src="${img}" alt="">
            <button class="image-remove" onclick="removeImage(${i})">${icons.x}</button>
        </div>
    `).join('');
}

function removeImage(index) {
    wizardData.images.splice(index, 1);
    renderImagePreviews();
}

// ============ GOAL VALIDATOR ============
const GoalValidator = {
    validateTitle(title) {
        if (!title || title.trim().length < 5) {
            return { valid: false, message: 'Слишком короткая формулировка' };
        }
        const lower = title.toLowerCase();
        for (const word of FORBIDDEN_WORDS) {
            if (lower.includes(word)) {
                return { valid: false, message: `Слово из нужды: «${word}». Переформулируйте.` };
            }
        }
        return { valid: true };
    },
    
    validateDescription(feelings, confidence, identity) {
        const errors = [];
        if (!feelings || feelings.length < 10) errors.push('Опишите ощущения подробнее');
        if (!confidence || confidence.length < 10) errors.push('Объясните, почему это естественно');
        if (!identity || identity.length < 10) errors.push('Опишите, кем вы являетесь');
        return errors.length === 0 ? { valid: true } : { valid: false, messages: errors };
    },
    
    validateImages(images) {
        if (!images?.length) return { valid: false, message: 'Добавьте хотя бы одно изображение' };
        if (images.length > 7) return { valid: false, message: 'Максимум 7 изображений' };
        return { valid: true };
    },
    
    validateEmotion(score) {
        if (!score) return { valid: false, message: 'Оцените эмоциональный резонанс' };
        if (score < 3) return { valid: false, message: 'Минимальный уровень — 3' };
        return { valid: true };
    },
    
    validateAntiNeed(answer) {
        if (answer === null) return { valid: false, message: 'Ответьте на вопрос' };
        if (answer === false) return { valid: false, message: 'Цель из нужды не может быть сохранена' };
        return { valid: true };
    },
    
    validateGratitude(text) {
        if (!text || text.length < 10) return { valid: false, message: 'Благодарность обязательна' };
        return { valid: true };
    },
    
    validateAll(data) {
        const results = {
            title: this.validateTitle(data.title),
            description: this.validateDescription(data.feelings, data.confidence, data.identity),
            images: this.validateImages(data.images),
            emotion: this.validateEmotion(data.emotionScore),
            antiNeed: this.validateAntiNeed(data.antiNeedAnswer),
            gratitude: this.validateGratitude(data.gratitude)
        };
        return { results, allValid: Object.values(results).every(r => r.valid) };
    }
};

// ============ PHRASES ============
function renderPhrases() {
    const list = $('phrasesList');
    const empty = $('phrasesEmpty');
    if (!list) return;
    
    if (data.phrases.length === 0) {
        list.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    
    empty?.classList.add('hidden');
    
    list.innerHTML = data.phrases.map(phrase => `
        <div class="phrase-card" data-id="${phrase.id}">
            <div class="phrase-transform">
                <div class="phrase-old">${escapeHtml(phrase.old)}</div>
                <div class="phrase-arrow">${icons.arrow}</div>
                <div class="phrase-new">${escapeHtml(phrase.new)}</div>
            </div>
            <div class="phrase-actions">
                <button class="btn btn-ghost btn-icon" onclick="deletePhrase('${phrase.id}')">
                    ${icons.trash}
                </button>
            </div>
        </div>
    `).join('');
}

function openPhraseModal() {
    $('phraseOld').value = '';
    $('phraseNew').value = '';
    openModal('phraseModal');
}

function savePhrase() {
    const oldText = $('phraseOld')?.value?.trim();
    const newText = $('phraseNew')?.value?.trim();
    
    if (!oldText || !newText) {
        showToast('Заполните оба поля', 'warning');
        return;
    }
    
    data.phrases.push({
        id: generateId(),
        old: oldText,
        new: newText,
        createdAt: Date.now()
    });
    
    saveData();
    renderPhrases();
    closeModal('phraseModal');
    showToast('Трансформация добавлена', 'success');
}

function deletePhrase(id) {
    data.phrases = data.phrases.filter(p => p.id !== id);
    saveData();
    renderPhrases();
    showToast('Удалено', 'success');
}

// ============ GRATITUDE ============
function renderGratitude() {
    const list = $('gratitudeList');
    const empty = $('gratitudeEmpty');
    if (!list) return;
    
    if (data.gratitude.length === 0) {
        list.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    
    empty?.classList.add('hidden');
    
    const sorted = [...data.gratitude].sort((a, b) => b.timestamp - a.timestamp);
    
    list.innerHTML = sorted.map(item => `
        <div class="gratitude-card">
            <p class="gratitude-text">${escapeHtml(item.text)}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="gratitude-date">${formatDate(item.timestamp)}</span>
                <button class="btn btn-ghost btn-icon" onclick="deleteGratitude('${item.id}')">
                    ${icons.trash}
                </button>
            </div>
        </div>
    `).join('');
}

function openGratitudeModal() {
    $('gratitudeText').value = '';
    openModal('gratitudeModal');
}

function saveGratitudeEntry() {
    const text = $('gratitudeText')?.value?.trim();
    
    if (!text) {
        showToast('Напишите благодарность', 'warning');
        return;
    }
    
    data.gratitude.push({
        id: generateId(),
        text: text,
        timestamp: Date.now()
    });
    
    saveData();
    renderGratitude();
    updateAllStats();
    closeModal('gratitudeModal');
    showToast('Благодарность добавлена', 'success');
}

function saveGratitudePrompt() {
    const works = $('gratitudeWorks')?.value?.trim();
    const abundance = $('gratitudeAbundance')?.value?.trim();
    
    if (works) {
        data.gratitude.push({ id: generateId(), text: works, timestamp: Date.now() });
    }
    if (abundance) {
        data.gratitude.push({ id: generateId(), text: abundance, timestamp: Date.now() });
    }
    
    if (works || abundance) {
        saveData();
        renderGratitude();
        updateAllStats();
        showToast('Сохранено', 'success');
        $('gratitudeWorks').value = '';
        $('gratitudeAbundance').value = '';
    } else {
        showToast('Заполните хотя бы одно поле', 'warning');
    }
}

function deleteGratitude(id) {
    data.gratitude = data.gratitude.filter(g => g.id !== id);
    saveData();
    renderGratitude();
    updateAllStats();
}

// ============ HISTORY ============
function renderHistory() {
    const timeline = $('historyTimeline');
    const empty = $('historyEmpty');
    if (!timeline) return;
    
    // Combine all entries
    const entries = [
        ...data.states.map(s => ({ ...s, type: 'state' })),
        ...data.being.map(b => ({ ...b, type: 'being' })),
        ...data.gratitude.map(g => ({ ...g, type: 'gratitude' }))
    ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 50);
    
    if (entries.length === 0) {
        timeline.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    
    empty?.classList.add('hidden');
    
    const stateLabels = {
        expanded: 'Расширенность',
        calm: 'Спокойствие',
        neutral: 'Нейтральность',
        tense: 'Напряжение',
        contracted: 'Сжатость'
    };
    
    timeline.innerHTML = entries.map(entry => {
        let content = '';
        if (entry.type === 'state') {
            content = `<strong>Состояние:</strong> ${stateLabels[entry.state] || entry.state}`;
        } else if (entry.type === 'being') {
            content = `<strong>Практика «Бытие»</strong><br>`;
            if (entry.who) content += `Кто я: ${escapeHtml(entry.who)}<br>`;
            if (entry.action) content += `Из чего действую: ${escapeHtml(entry.action)}`;
        } else if (entry.type === 'gratitude') {
            content = `<strong>Благодарность:</strong> ${escapeHtml(entry.text)}`;
        }
        
        return `
            <div class="timeline-item">
                <div class="timeline-date">${formatDateTime(entry.timestamp)}</div>
                <div class="timeline-content">${content}</div>
            </div>
        `;
    }).join('');
}

// ============ IMPORT/EXPORT ============
function exportData() {
    const exportObj = {
        goals: data.goals,
        phrases: data.phrases,
        gratitude: data.gratitude,
        states: data.states,
        being: data.being,
        settings: data.settings,
        exportedAt: new Date().toISOString(),
        version: '3.0'
    };
    
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `happy-pocket-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    localStorage.setItem(STORAGE_KEYS.LAST_SAVE, Date.now().toString());
    showToast('Данные экспортированы', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            
            if (confirm('Заменить все данные импортированными?')) {
                data.goals = imported.goals || [];
                data.phrases = imported.phrases || [];
                data.gratitude = imported.gratitude || [];
                data.states = imported.states || [];
                data.being = imported.being || [];
                if (imported.settings) data.settings = { ...data.settings, ...imported.settings };
                
                saveData();
                applyTheme();
                updateAllStats();
                navigateTo('state');
                showToast('Данные импортированы', 'success');
            }
        } catch (err) {
            showToast('Ошибка: неверный формат', 'error');
        }
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm('Удалить ВСЕ данные приложения? Это действие необратимо.')) {
        Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
        data = { goals: [], phrases: [], gratitude: [], states: [], being: [], settings: { theme: 'dark' } };
        applyTheme();
        updateAllStats();
        navigateTo('state');
        showToast('Все данные удалены', 'success');
    }
}

function checkAutoBackup() {
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    const TWENTY_DAYS = 20 * 24 * 60 * 60 * 1000;
    
    if (!lastSave || (Date.now() - parseInt(lastSave)) > TWENTY_DAYS) {
        if (data.goals.length > 0 || data.gratitude.length > 0) {
            exportData();
        }
    }
    
    updateBackupInfo();
}

function updateBackupInfo() {
    const lastSave = localStorage.getItem(STORAGE_KEYS.LAST_SAVE);
    const info = $('lastBackupInfo');
    if (info && lastSave) {
        info.textContent = `Последнее: ${formatDate(parseInt(lastSave))}`;
    }
}

// ============ MODAL HELPERS ============
function openModal(id) {
    $(id)?.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(id) {
    $(id)?.classList.remove('active');
    document.body.style.overflow = '';
}

// ============ UI HELPERS ============
function showError(id, msg) {
    const el = $(id);
    if (el) {
        el.textContent = msg;
        el.classList.add('visible');
    }
}

function clearErrors() {
    $$('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    $$('.form-input, .form-textarea').forEach(el => el.classList.remove('error'));
}

function showToast(message, type = 'success') {
    const container = $('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconMap = { success: icons.check, error: icons.x, warning: icons.x };
    
    toast.innerHTML = `
        <div class="toast-icon">${iconMap[type] || icons.check}</div>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============ UTILITIES ============
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(ts) {
    return new Date(ts).toLocaleString('ru-RU', { 
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============ EVENT BINDINGS ============
function bindEvents() {
    // Navigation
    $$('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', () => navigateTo(item.dataset.page));
    });
    
    // Mobile menu
    $('mobileMenuBtn')?.addEventListener('click', () => {
        $('sidebar')?.classList.toggle('open');
    });
    
    // State tracker
    $$('.state-option').forEach(opt => {
        opt.addEventListener('click', () => selectState(opt.dataset.state));
    });
    $('saveStateBtn')?.addEventListener('click', saveState);
    $('saveBeingBtn')?.addEventListener('click', saveBeing);
    
    // Goals
    $('addGoalBtn')?.addEventListener('click', () => openGoalModal());
    $('goalModalClose')?.addEventListener('click', () => closeModal('goalModal'));
    $('goalModal')?.addEventListener('click', e => { if (e.target.id === 'goalModal') closeModal('goalModal'); });
    
    // Wizard navigation
    $('wizardPrev')?.addEventListener('click', () => {
        if (currentWizardStep > 1) { currentWizardStep--; updateWizardStep(); }
    });
    $('wizardNext')?.addEventListener('click', () => {
        if (currentWizardStep === 5) saveGoal();
        else if (validateCurrentStep()) { currentWizardStep++; updateWizardStep(); }
    });
    
    // Images
    $('imageUpload')?.addEventListener('click', () => $('imageInput')?.click());
    $('imageInput')?.addEventListener('change', handleImageUpload);
    
    // Emotion scale
    $('emotionScale')?.addEventListener('click', e => {
        if (e.target.classList.contains('emotion-btn')) {
            $$('.emotion-btn').forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            emotionScore = parseInt(e.target.dataset.value);
        }
    });
    
    // Anti-need
    $('antiNeedYes')?.addEventListener('click', () => {
        antiNeedAnswer = true;
        $('antiNeedYes').classList.add('btn-primary');
        $('antiNeedYes').classList.remove('btn-secondary');
        $('antiNeedNo').classList.remove('btn-primary');
        $('antiNeedNo').classList.add('btn-secondary');
    });
    $('antiNeedNo')?.addEventListener('click', () => {
        antiNeedAnswer = false;
        $('antiNeedNo').classList.add('btn-primary');
        $('antiNeedNo').classList.remove('btn-secondary');
        $('antiNeedYes').classList.remove('btn-primary');
        $('antiNeedYes').classList.add('btn-secondary');
        showToast('Цель из нужды не может быть сохранена', 'warning');
    });
    
    // View goal modal
    $('viewGoalClose')?.addEventListener('click', () => closeModal('viewGoalModal'));
    $('viewGoalModal')?.addEventListener('click', e => { if (e.target.id === 'viewGoalModal') closeModal('viewGoalModal'); });
    
    // Phrases
    $('addPhraseBtn')?.addEventListener('click', openPhraseModal);
    $('phraseModalClose')?.addEventListener('click', () => closeModal('phraseModal'));
    $('phraseCancelBtn')?.addEventListener('click', () => closeModal('phraseModal'));
    $('phraseSaveBtn')?.addEventListener('click', savePhrase);
    $('phraseModal')?.addEventListener('click', e => { if (e.target.id === 'phraseModal') closeModal('phraseModal'); });
    
    // Gratitude
    $('addGratitudeBtn')?.addEventListener('click', openGratitudeModal);
    $('gratitudeModalClose')?.addEventListener('click', () => closeModal('gratitudeModal'));
    $('gratitudeCancelBtn')?.addEventListener('click', () => closeModal('gratitudeModal'));
    $('gratitudeSaveBtn')?.addEventListener('click', saveGratitudeEntry);
    $('gratitudeModal')?.addEventListener('click', e => { if (e.target.id === 'gratitudeModal') closeModal('gratitudeModal'); });
    $('saveGratitudePromptBtn')?.addEventListener('click', saveGratitudePrompt);
    
    // Settings
    $('themeToggle')?.addEventListener('click', toggleTheme);
    $('exportBtn')?.addEventListener('click', exportData);
    $('importBtn')?.addEventListener('click', () => $('importInput')?.click());
    $('importInput')?.addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); e.target.value = ''; });
    $('clearDataBtn')?.addEventListener('click', clearAllData);
}

// ============ GLOBAL FUNCTIONS ============
window.viewGoal = viewGoal;
window.editGoal = editGoal;
window.deleteGoal = deleteGoal;
window.updateGoalStatus = updateGoalStatus;
window.removeImage = removeImage;
window.deletePhrase = deletePhrase;
window.deleteGratitude = deleteGratitude;

// ============ START ============
document.addEventListener('DOMContentLoaded', init);
