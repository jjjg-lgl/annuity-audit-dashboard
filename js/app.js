/**
 * 年金合同备案审核看板主逻辑
 */

const els = {
    folderInput: document.getElementById('folderInput'),
    importBtn: document.getElementById('importBtn'),
    historyBtn: document.getElementById('historyBtn'),
    clearBtn: document.getElementById('clearBtn'),
    reportBtn: document.getElementById('reportBtn'),
    compareBtn: document.getElementById('compareBtn'),
    comparePanel: document.getElementById('comparePanel'),
    closeCompareBtn: document.getElementById('closeCompareBtn'),
    compareSelectA: document.getElementById('compareSelectA'),
    compareSelectB: document.getElementById('compareSelectB'),
    compareFileAInput: document.getElementById('compareFileA'),
    compareFileBInput: document.getElementById('compareFileB'),
    compareNameA: document.getElementById('compareNameA'),
    compareNameB: document.getElementById('compareNameB'),
    runCompareBtn: document.getElementById('runCompareBtn'),
    compareResult: document.getElementById('compareResult'),
    projectBtn: document.getElementById('projectBtn'),
    projectPanel: document.getElementById('projectPanel'),
    closeProjectBtn: document.getElementById('closeProjectBtn'),
    projectNameInput: document.getElementById('projectNameInput'),
    saveProjectBtn: document.getElementById('saveProjectBtn'),
    batchExportBtn: document.getElementById('batchExportBtn'),
    projectList: document.getElementById('projectList'),
    basisLibBtn: document.getElementById('basisLibBtn'),
    basisPanel: document.getElementById('basisPanel'),
    closeBasisBtn: document.getElementById('closeBasisBtn'),
    basisFileInput: document.getElementById('basisFileInput'),
    addBasisBtn: document.getElementById('addBasisBtn'),
    basisList: document.getElementById('basisList'),
    emptyState: document.getElementById('emptyState'),
    dashboard: document.getElementById('dashboard'),
    historyPanel: document.getElementById('historyPanel'),
    closeHistoryBtn: document.getElementById('closeHistoryBtn'),
    historyList: document.getElementById('historyList'),
    historyInEmpty: document.getElementById('historyInEmpty'),
    historyListEmpty: document.getElementById('historyListEmpty'),
    resultList: document.getElementById('resultList'),
    searchInput: document.getElementById('searchInput'),
    exportBtn: document.getElementById('exportBtn'),
    tabs: document.querySelectorAll('.tab'),
    filters: document.querySelectorAll('.filter-btn'),
    // 信息卡
    planName: document.getElementById('planName'),
    recordType: document.getElementById('recordType'),
    trustee: document.getElementById('trustee'),
    materialCount: document.getElementById('materialCount'),
    importTime: document.getElementById('importTime'),
    sourceDir: document.getElementById('sourceDir'),
    // 结论
    conclusionCard: document.getElementById('conclusionCard'),
    conclusionText: document.getElementById('conclusionText'),
    countA: document.getElementById('countA'),
    countB: document.getElementById('countB'),
    countC: document.getElementById('countC'),
    // 统计
    statFiles: document.getElementById('statFiles'),
    statFilesSub: document.getElementById('statFilesSub'),
    statApplicable: document.getElementById('statApplicable'),
    statPassRate: document.getElementById('statPassRate'),
    statA: document.getElementById('statA'),
    statB: document.getElementById('statB'),
    statC: document.getElementById('statC'),
    statConfirm: document.getElementById('statConfirm'),
    statConfirmSub: document.getElementById('statConfirmSub'),
    statFixProgress: document.getElementById('statFixProgress'),
    statFixSub: document.getElementById('statFixSub'),
    totalItems: document.getElementById('totalItems'),
    keyInfoCard: document.getElementById('keyInfoCard'),
    keyInfoGrid: document.getElementById('keyInfoGrid'),
    filterAll: document.getElementById('filterAll'),
    filterFail: document.getElementById('filterFail'),
    filterRectify: document.getElementById('filterRectify'),
    filterImprove: document.getElementById('filterImprove'),
    filterConfirm: document.getElementById('filterConfirm'),
    filterPass: document.getElementById('filterPass'),
    filterNa: document.getElementById('filterNa')
};

let appState = {
    files: [],
    results: [],
    combinedText: '',
    fileMap: {},
    folderName: '',
    importTime: null,
    activeTab: 'all',
    activeFilter: 'all',
    search: ''
};

let pieChart = null;
let barChart = null;

const STATUS_LABELS = {
    pass: '通过',
    fail: '不通过',
    rectify: '待补正',
    improve: '提示改进',
    confirm: '需人工确认',
    na: '不适用'
};

const LEVEL_NAMES = { A: 'A类', B: 'B类', C: 'C类' };

/* Toast 通知 */
function showToast(msg, opts = {}) {
    const type = opts.type || 'info';
    const title = opts.title || '';
    const duration = opts.duration || 4000;
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };
    const titles = { success: '操作成功', warning: '温馨提示', error: '操作失败', info: '提示' };

    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-body">
            <div class="toast-title">${title || titles[type]}</div>
            <div class="toast-msg">${msg}</div>
        </div>
        <button class="toast-close">&times;</button>
    `;
    el.querySelector('.toast-close').addEventListener('click', () => {
        el.style.animation = 'toastOut 0.25s ease forwards';
        setTimeout(() => el.remove(), 250);
    });
    container.appendChild(el);
    setTimeout(() => {
        if (el.parentNode) {
            el.style.animation = 'toastOut 0.25s ease forwards';
            setTimeout(() => el.remove(), 250);
        }
    }, duration);
}

/* 自定义确认对话框（Toast 风格） */
function showConfirm(msg, opts = {}) {
    return new Promise((resolve) => {
        const title = opts.title || '请确认';
        const confirmText = opts.confirmText || '确认';
        const cancelText = opts.cancelText || '取消';
        const type = opts.type || 'warning';
        const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

        const container = document.getElementById('toastContainer');
        const el = document.createElement('div');
        el.className = `toast confirm-toast toast-${type}`;
        el.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-body">
                <div class="toast-title">${title}</div>
                <div class="toast-msg">${msg}</div>
                <div class="toast-actions">
                    <button class="toast-btn toast-btn-confirm">${confirmText}</button>
                    <button class="toast-btn toast-btn-cancel">${cancelText}</button>
                </div>
            </div>
        `;

        const close = () => {
            el.style.animation = 'toastOut 0.25s ease forwards';
            setTimeout(() => el.remove(), 250);
        };

        el.querySelector('.toast-btn-confirm').addEventListener('click', () => {
            close();
            resolve(true);
        });
        el.querySelector('.toast-btn-cancel').addEventListener('click', () => {
            close();
            resolve(false);
        });

        container.appendChild(el);
    });
}

function init() {
    try {
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
        bindEvents();
        loadFromStorage();
        if (appState.results.length) renderDashboard();
        renderHistoryList();
    } catch (err) {
        console.error('初始化错误:', err);
        const debugBox = document.createElement('div');
        debugBox.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#fee2e2;color:#991b1b;padding:16px;font-size:14px;font-family:monospace;white-space:pre-wrap;max-height:300px;overflow:auto;border-bottom:3px solid #dc2626;';
        debugBox.innerHTML = '<strong>页面初始化出错，部分功能可能不可用：</strong>\n' + (err.stack || err.message || err);
        if (window.jsErrors && window.jsErrors.length) {
            debugBox.innerHTML += '\n\n<strong>资源加载错误：</strong>\n' + window.jsErrors.map(e => e.msg + ' @ ' + e.url + ':' + e.line).join('\n');
        }
        document.body.appendChild(debugBox);
    }
}

function safeAddEvent(el, event, handler, name) {
    if (el && el.addEventListener) {
        el.addEventListener(event, handler);
    } else if (name) {
        console.warn('DOM元素未找到: ' + name);
    }
}

function bindEvents() {
    safeAddEvent(els.importBtn, 'click', () => els.folderInput.click(), 'importBtn');
    const emptyImportBtn = document.getElementById('emptyImportBtn');
    if (emptyImportBtn) emptyImportBtn.addEventListener('click', () => els.folderInput.click());
    safeAddEvent(els.folderInput, 'change', handleFolderSelect, 'folderInput');
    safeAddEvent(els.historyBtn, 'click', showHistoryPanel, 'historyBtn');
    safeAddEvent(els.closeHistoryBtn, 'click', hideHistoryPanel, 'closeHistoryBtn');
    safeAddEvent(els.clearBtn, 'click', clearData, 'clearBtn');
    safeAddEvent(els.reportBtn, 'click', generateReport, 'reportBtn');
    safeAddEvent(els.compareBtn, 'click', showComparePanel, 'compareBtn');
    safeAddEvent(els.closeCompareBtn, 'click', hideComparePanel, 'closeCompareBtn');
    safeAddEvent(els.compareSelectA, 'click', () => els.compareFileAInput.click(), 'compareSelectA');
    safeAddEvent(els.compareSelectB, 'click', () => els.compareFileBInput.click(), 'compareSelectB');
    safeAddEvent(els.compareFileAInput, 'change', (e) => handleCompareFile(e, 'A'), 'compareFileAInput');
    safeAddEvent(els.compareFileBInput, 'change', (e) => handleCompareFile(e, 'B'), 'compareFileBInput');
    safeAddEvent(els.runCompareBtn, 'click', runCompare, 'runCompareBtn');
    safeAddEvent(els.projectBtn, 'click', showProjectPanel, 'projectBtn');
    safeAddEvent(els.closeProjectBtn, 'click', hideProjectPanel, 'closeProjectBtn');
    safeAddEvent(els.saveProjectBtn, 'click', saveProject, 'saveProjectBtn');
    safeAddEvent(els.batchExportBtn, 'click', batchExportProjects, 'batchExportBtn');
    safeAddEvent(els.basisLibBtn, 'click', showBasisPanel, 'basisLibBtn');
    safeAddEvent(els.closeBasisBtn, 'click', hideBasisPanel, 'closeBasisBtn');
    safeAddEvent(els.addBasisBtn, 'click', () => els.basisFileInput.click(), 'addBasisBtn');
    safeAddEvent(els.basisFileInput, 'change', handleBasisUpload, 'basisFileInput');
    safeAddEvent(els.searchInput, 'input', (e) => {
        appState.search = e.target.value.trim();
        renderResultList();
    }, 'searchInput');
    safeAddEvent(els.exportBtn, 'click', exportResults, 'exportBtn');

    els.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            els.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            appState.activeTab = tab.dataset.filter;
            renderResultList();
        });
    });

    els.filters.forEach(btn => {
        btn.addEventListener('click', () => {
            els.filters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            appState.activeFilter = btn.dataset.status;
            renderResultList();
        });
    });

    window.addEventListener('resize', () => {
        pieChart && pieChart.resize();
        barChart && barChart.resize();
    });
}

async function handleFolderSelect(e) {
    try {
        const files = Array.from(e.target.files);
        console.log('导入原始文件数:', files.length, files.map(f => f.name));
        if (!files.length) return;

        const folderName = files[0].webkitRelativePath.split('/')[0];
        const supported = files.filter(f => isSupportedFile(f.name));
        console.log('支持格式文件数:', supported.length, supported.map(f => f.name));

        // 若当前已有数据，询问追加或新建
        let mode = 'new';
        if (appState.files.length > 0) {
            const isAppend = await showConfirm(
                '当前已有数据，点击「确认」追加到当前项目，点击「取消」新建项目（覆盖当前）。',
                { title: '数据导入方式', confirmText: '追加', cancelText: '新建' }
            );
            mode = isAppend ? 'append' : 'new';
        }

        if (mode === 'new') {
            appState = {
                files: supported,
                results: [],
                combinedText: '',
                fileMap: {},
                folderName,
                importTime: new Date(),
                activeTab: 'all',
                activeFilter: 'all',
                search: ''
            };
        } else {
            // 追加模式：合并文件，去重
            const existingNames = new Set(appState.files.map(f => f.name));
            const newFiles = supported.filter(f => !existingNames.has(f.name));
            appState.files = appState.files.concat(newFiles);
            appState.folderName = appState.folderName || folderName;
            appState.importTime = new Date();
        }

        els.emptyState.style.display = 'none';
        els.dashboard.style.display = 'block';
        els.resultList.innerHTML = '<div class="loading">正在解析材料并执行审核，请稍候…</div>';

        const parsed = await parseFiles(appState.files);
        console.log('解析完成:', parsed.map(p => ({ name: p.name, textLen: p.text.length })));
        appState.fileMap = {};
        parsed.forEach(p => { appState.fileMap[p.name] = p.text; });
        appState.combinedText = parsed.map(p => p.text).join('\n');
        console.log('合并文本长度:', appState.combinedText.length);

        const basisText = getBasisText();
        appState.results = runAudit(appState.files, appState.combinedText, appState.fileMap, basisText);
        console.log('审核结果数:', appState.results.length);

        saveToStorage();
        renderDashboard();
    } catch (err) {
        console.error('导入处理错误:', err);
        els.resultList.innerHTML = '<div class="loading" style="color:#dc2626">处理出错：' + (err.message || err) + '</div>';
    }
}

function isSupportedFile(name) {
    const ext = name.split('.').pop().toLowerCase();
    return ['docx', 'pdf', 'txt', 'doc', 'rtf'].includes(ext);
}

async function parseFiles(files) {
    const out = [];
    for (const file of files) {
        try {
            const text = await extractText(file);
            out.push({ name: file.name, text: text || '' });
        } catch (err) {
            console.warn('解析失败', file.name, err);
            out.push({ name: file.name, text: '' });
        }
    }
    return out;
}

async function extractText(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'txt' || ext === 'rtf') {
        return await file.text();
    }
    if (ext === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value || '';
    }
    if (ext === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let text = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            const pageText = content.items.map(it => it.str).join('');
            text += pageText + '\n';
        }
        const trimmed = text.trim();
        if (!trimmed || trimmed.length < pdf.numPages * 5) {
            console.warn('PDF 文本提取结果极少，可能是扫描件：', file.name);
        }
        return text;
    }
    if (ext === 'doc') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const result = await mammoth.extractRawText({ arrayBuffer });
            if (result.value && result.value.trim().length > 100) {
                return result.value;
            }
        } catch (e) {
            console.warn('mammoth 解析 .doc 失败', e);
        }
        return '';
    }
    return '';
}

function runAudit(files, text, fileMap, basisText) {
    const allFileNames = files.map(f => f.name);
    return AUDIT_RULES.map(rule => {
        const res = rule.check(text, files, fileMap, basisText);
        // 自动推断 sourceFiles
        let sourceFiles = res.sourceFiles || [];
        if (!sourceFiles.length && res.status !== 'pass' && res.status !== 'na') {
            if (rule.dim === 'A') {
                // A组材料类：返回所有文件名（无法精确定位）
                sourceFiles = allFileNames;
            } else {
                // 其他组：根据规则关键词在 fileMap 中搜索匹配的文件
                const keywords = [rule.title, ...rule.description.split(/[，。；]/)];
                const matched = new Set();
                for (const [fname, ftext] of Object.entries(fileMap || {})) {
                    for (const kw of keywords) {
                        if (kw.length > 2 && ftext && ftext.includes(kw)) {
                            matched.add(fname);
                            break;
                        }
                    }
                }
                sourceFiles = matched.size ? Array.from(matched) : allFileNames;
            }
        }
        return {
            id: rule.id,
            dim: rule.dim,
            title: rule.title,
            level: rule.level,
            description: rule.description,
            status: res.status,
            fact: res.fact,
            basis: res.basis,
            suggestion: res.suggestion,
            sourceFiles
        };
    });
}

function renderDashboard() {
    updateInfoBar();
    renderKeyInfo();
    updateConclusion();
    updateStats();
    updateFilterCounts();
    renderCharts();
    renderResultList();
}

function updateInfoBar() {
    const dim = AUDIT_DIMENSIONS.find(d => d.code === 'A');
    els.planName.textContent = appState.folderName || '未命名计划';
    els.recordType.textContent = '职业年金/企业年金';
    els.trustee.textContent = '委托托管职业年金基金财产的商业银行';
    els.materialCount.textContent = appState.files.length;
    els.importTime.textContent = appState.importTime
        ? new Date(appState.importTime).toLocaleString('zh-CN')
        : '-';
    els.sourceDir.textContent = appState.folderName || '-';
}

function getEffectiveStatus(r) {
    return r.manualStatus || r.status;
}

function updateConclusion() {
    const results = appState.results;
    const fail = results.filter(r => getEffectiveStatus(r) === 'fail').length;
    const rectify = results.filter(r => getEffectiveStatus(r) === 'rectify').length;
    const a = results.filter(r => r.level === 'A' && ['fail', 'rectify'].includes(getEffectiveStatus(r))).length;
    const b = results.filter(r => r.level === 'B' && ['rectify'].includes(getEffectiveStatus(r))).length;
    const c = results.filter(r => r.level === 'C' && ['improve'].includes(getEffectiveStatus(r))).length;

    els.countA.textContent = a;
    els.countB.textContent = b;
    els.countC.textContent = c;

    if (fail > 0) {
        els.conclusionText.textContent = '不予备案（存在硬性红线）';
        els.conclusionCard.className = 'conclusion-card card';
    } else if (rectify > 0) {
        els.conclusionText.textContent = '补正后备案';
        els.conclusionCard.className = 'conclusion-card card rectify';
    } else {
        els.conclusionText.textContent = '建议备案';
        els.conclusionCard.className = 'conclusion-card card pass';
    }
}

function updateStats() {
    const results = appState.results;
    const applicable = results.filter(r => getEffectiveStatus(r) !== 'na');
    const pass = applicable.filter(r => getEffectiveStatus(r) === 'pass').length;
    const fail = results.filter(r => getEffectiveStatus(r) === 'fail').length;
    const rectify = results.filter(r => getEffectiveStatus(r) === 'rectify').length;
    const improve = results.filter(r => getEffectiveStatus(r) === 'improve').length;
    const confirm = results.filter(r => getEffectiveStatus(r) === 'confirm').length;
    const na = results.filter(r => getEffectiveStatus(r) === 'na').length;
    const aCount = results.filter(r => r.level === 'A' && getEffectiveStatus(r) !== 'na').length;
    const bCount = results.filter(r => r.level === 'B' && getEffectiveStatus(r) !== 'na').length;
    const cCount = results.filter(r => r.level === 'C' && getEffectiveStatus(r) !== 'na').length;

    els.statFiles.textContent = appState.files.length;
    els.statFilesSub.textContent = `已解析 ${appState.files.length} 份 · 扫描件 ${appState.files.filter(f => /扫描|图片|image|scan/i.test(f.name)).length} 份`;

    els.statApplicable.textContent = applicable.length;
    const rate = applicable.length ? Math.round((pass / applicable.length) * 100) : 0;
    els.statPassRate.textContent = `通过 ${rate}%`;

    els.statA.textContent = aCount;
    els.statB.textContent = bCount;
    els.statC.textContent = cCount;
    els.statConfirm.textContent = confirm;
    els.statConfirmSub.textContent = `另有待查 ${na} 项`;

    // 整改进度
    const fixable = results.filter(r => ['fail','rectify','improve'].includes(getEffectiveStatus(r)));
    const fixed = fixable.filter(r => r.fixStatus === 'done').length;
    const fixTotal = fixable.length;
    const fixRate = fixTotal ? Math.round((fixed / fixTotal) * 100) : 0;
    els.statFixProgress.textContent = `${fixRate}%`;
    els.statFixSub.textContent = `已整改 ${fixed} / 待整改 ${fixTotal}`;

    els.totalItems.textContent = `共 ${results.length} 项`;
}

function updateFilterCounts() {
    const map = { all: 0, fail: 0, rectify: 0, improve: 0, confirm: 0, pass: 0, na: 0 };
    appState.results.forEach(r => { map[getEffectiveStatus(r)]++; map.all++; });
    els.filterAll.textContent = map.all;
    els.filterFail.textContent = map.fail;
    els.filterRectify.textContent = map.rectify;
    els.filterImprove.textContent = map.improve;
    els.filterConfirm.textContent = map.confirm;
    els.filterPass.textContent = map.pass;
    els.filterNa.textContent = map.na;
}

function renderCharts() {
    renderPieChart();
    renderBarChart();
}

function renderPieChart() {
    const map = { fail: 0, rectify: 0, improve: 0, confirm: 0, pass: 0, na: 0 };
    appState.results.forEach(r => map[r.status]++);
    const data = [
        { value: map.fail, name: '不通过', itemStyle: { color: '#dc2626' } },
        { value: map.rectify, name: '待补正', itemStyle: { color: '#f59e0b' } },
        { value: map.improve, name: '提示改进', itemStyle: { color: '#3b82f6' } },
        { value: map.confirm, name: '需人工确认', itemStyle: { color: '#6b7280' } },
        { value: map.pass, name: '通过', itemStyle: { color: '#16a34a' } },
        { value: map.na, name: '不适用', itemStyle: { color: '#d1d5db' } }
    ].filter(d => d.value > 0);

    const pass = appState.results.filter(r => r.status === 'pass').length;
    const applicable = appState.results.filter(r => r.status !== 'na').length;
    const rate = applicable.length ? Math.round((pass / applicable.length) * 100) : 0;

    if (!pieChart) pieChart = echarts.init(document.getElementById('pieChart'));
    pieChart.setOption({
        tooltip: { trigger: 'item' },
        legend: { orient: 'vertical', right: 10, top: 'center', itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
        series: [{
            name: '审核结论',
            type: 'pie',
            radius: ['45%', '70%'],
            center: ['35%', '50%'],
            avoidLabelOverlap: false,
            label: { show: true, position: 'center', formatter: `{d|${rate}%}\n{b|通过率}`, rich: { d: { fontSize: 22, fontWeight: 'bold', color: '#1f2937' }, b: { fontSize: 12, color: '#6b7280' } } },
            data
        }]
    });
}

function renderBarChart() {
    const dimData = {};
    AUDIT_DIMENSIONS.forEach(d => dimData[d.code] = { name: d.name, counts: { fail: 0, rectify: 0, improve: 0, confirm: 0, pass: 0, na: 0 } });
    appState.results.forEach(r => {
        if (dimData[r.dim]) dimData[r.dim].counts[r.status]++;
    });

    const categories = AUDIT_DIMENSIONS.map(d => `${d.code} ${d.name}`);
    const stack = ['不通过', '待补正', '提示改进', '需人工确认', '通过', '不适用'];
    const colors = ['#dc2626', '#f59e0b', '#3b82f6', '#6b7280', '#16a34a', '#d1d5db'];
    const keyMap = ['fail', 'rectify', 'improve', 'confirm', 'pass', 'na'];

    const series = stack.map((name, idx) => ({
        name,
        type: 'bar',
        stack: 'total',
        barWidth: 16,
        color: colors[idx],
        data: AUDIT_DIMENSIONS.map(d => dimData[d.code].counts[keyMap[idx]])
    }));

    if (!barChart) barChart = echarts.init(document.getElementById('barChart'));
    barChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { top: 0, right: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11 } },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '12%', containLabel: true },
        xAxis: { type: 'value', show: false },
        yAxis: { type: 'category', data: categories, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { fontSize: 11 } },
        series
    });
}

function renderResultList() {
    if (appState.activeTab === 'material') {
        renderMaterialList();
        return;
    }

    let list = appState.results;
    if (appState.activeFilter !== 'all') {
        list = list.filter(r => getEffectiveStatus(r) === appState.activeFilter);
    }
    if (appState.search) {
        const kw = appState.search.toLowerCase();
        list = list.filter(r =>
            r.id.toLowerCase().includes(kw) ||
            r.title.toLowerCase().includes(kw) ||
            r.fact.toLowerCase().includes(kw) ||
            r.basis.toLowerCase().includes(kw) ||
            r.suggestion.toLowerCase().includes(kw)
        );
    }

    if (!list.length) {
        els.resultList.innerHTML = '<div class="loading">没有符合条件的审核结果</div>';
        return;
    }

    els.resultList.innerHTML = list.map(r => {
        const effectiveStatus = r.manualStatus || r.status;
        const manualTag = r.manualStatus ? '<span class="manual-tag">人工</span>' : '';
        const showFix = ['fail','rectify','improve'].includes(effectiveStatus);
        const fixBtn = showFix ? `<button class="fix-btn ${r.fixStatus==='done'?'fixed':''}" data-id="${r.id}">${r.fixStatus==='done'?'已整改':'标为已整改'}</button>` : '';
        const basisTooltip = getBasisTooltip(r.basis);
        const basisTip = basisTooltip ? `<span class="basis-tip" title="${escapeHtml(basisTooltip)}">ℹ️</span>` : '';
        const sourceFilesHtml = (r.sourceFiles && r.sourceFiles.length)
            ? `<div class="result-files">📎 涉及文件：${r.sourceFiles.map(f => `<span class="file-tag">${escapeHtml(f)}</span>`).join('')}</div>`
            : '';
        return `
        <div class="result-item">
            <div class="result-id">${r.id}</div>
            <div class="result-body">
                <div class="result-title">${r.title}</div>
                <div class="result-fact">${r.fact}</div>
                <div class="result-basis">${r.basis}${basisTip}</div>
                <div class="result-suggest">${r.suggestion}</div>
                ${sourceFilesHtml}
                <div class="result-actions">
                    <span class="action-label">系统初判：${STATUS_LABELS[r.status]}</span>
                    ${manualTag}
                    <span class="action-label">人工判定：</span>
                    <button class="action-btn ${(r.manualStatus||r.status)==='pass'?'active':''}" data-id="${r.id}" data-status="pass">通过</button>
                    <button class="action-btn ${(r.manualStatus||r.status)==='fail'?'active':''}" data-id="${r.id}" data-status="fail">不通过</button>
                    <button class="action-btn ${(r.manualStatus||r.status)==='rectify'?'active':''}" data-id="${r.id}" data-status="rectify">待补正</button>
                    <button class="action-btn ${(r.manualStatus||r.status)==='improve'?'active':''}" data-id="${r.id}" data-status="improve">提示改进</button>
                    <button class="action-btn ${(r.manualStatus||r.status)==='na'?'active':''}" data-id="${r.id}" data-status="na">不适用</button>
                    ${fixBtn}
                </div>
            </div>
            <div class="result-status status-${effectiveStatus}">${STATUS_LABELS[effectiveStatus]}</div>
        </div>
    `}).join('');

    // 绑定人工判定事件
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => setManualStatus(e.target.dataset.id, e.target.dataset.status));
    });
    // 绑定整改事件
    document.querySelectorAll('.fix-btn').forEach(btn => {
        btn.addEventListener('click', (e) => toggleFixStatus(e.target.dataset.id));
    });
}

function setManualStatus(id, status) {
    const r = appState.results.find(x => x.id === id);
    if (!r) return;
    if (r.status === status) {
        delete r.manualStatus;
    } else {
        r.manualStatus = status;
    }
    saveToStorage();
    renderDashboard();
}

function toggleFixStatus(id) {
    const r = appState.results.find(x => x.id === id);
    if (!r) return;
    r.fixStatus = r.fixStatus === 'done' ? 'pending' : 'done';
    saveToStorage();
    renderDashboard();
}

function extractKeyInfo(text) {
    const info = [];

    const planName = text.match(/计划名称[：:]\s*([^\n；。]+)/);
    if (planName) info.push({ label: '计划名称', value: planName[1].trim() });

    const regNo = text.match(/登记号[：:]\s*([^\n；。]+)/);
    if (regNo) info.push({ label: '登记号', value: regNo[1].trim() });

    const trustee = text.match(/受托人[：:]\s*([^\n；。]+)/);
    if (trustee) info.push({ label: '受托人', value: trustee[1].trim() });

    const custodian = text.match(/托管人[：:]\s*([^\n；。]+)/);
    if (custodian) info.push({ label: '托管人', value: custodian[1].trim() });

    const invest = text.match(/投资管理人[：:]\s*([^\n；。]+)/);
    if (invest) info.push({ label: '投资管理人', value: invest[1].trim() });

    const term = text.match(/(?:合同期限|有效期|期限)[：:]?\s*(\d+)\s*年/);
    if (term) info.push({ label: '合同期限', value: `${term[1]} 年` });

    const dateRange = text.match(/(\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)[至到~](\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日)/);
    if (dateRange) info.push({ label: '合同起止', value: `${dateRange[1].replace(/\s/g,'')} 至 ${dateRange[2].replace(/\s/g,'')}` });

    const rates = [];
    const trusteeRate = text.match(/受托.*(?:费率|管理费)[：:]?\s*(\d+\.?\d*)\s*%/);
    if (trusteeRate) rates.push(`受托 ${trusteeRate[1]}%`);
    const custodyRate = text.match(/托管.*(?:费率|管理费)[：:]?\s*(\d+\.?\d*)\s*%/);
    if (custodyRate) rates.push(`托管 ${custodyRate[1]}%`);
    const investRate = text.match(/(?:投管|投资管理).*(?:费率|管理费)[：:]?\s*(\d+\.?\d*)\s*%/);
    if (investRate) rates.push(`投管 ${investRate[1]}%`);
    if (rates.length) info.push({ label: '管理费率', value: rates.join(' / ') });

    const bench = text.match(/业绩比较基准[：:]?\s*([^\n；。]+)/);
    if (bench) info.push({ label: '业绩基准', value: bench[1].trim() });

    const combos = text.match(/组合[数量]*[：:]?\s*(\d+)\s*个/);
    if (combos) info.push({ label: '组合数量', value: `${combos[1]} 个` });

    return info;
}

function renderKeyInfo() {
    const info = extractKeyInfo(appState.combinedText);
    if (!info.length) {
        els.keyInfoCard.style.display = 'none';
        return;
    }
    els.keyInfoCard.style.display = 'block';
    els.keyInfoGrid.innerHTML = info.map(item => `
        <div class="keyinfo-item">
            <div class="keyinfo-label">${escapeHtml(item.label)}</div>
            <div class="keyinfo-value">${escapeHtml(item.value)}</div>
        </div>
    `).join('');
}

function renderMaterialList() {
    if (!appState.files.length) {
        els.resultList.innerHTML = '<div class="loading">暂无材料</div>';
        return;
    }

    // 必备材料智能检查
    const checks = REQUIRED_MATERIALS.map(mat => {
        const hit = appState.files.some(f => mat.patterns.some(p => p.test(f.name)));
        return { ...mat, hit };
    });
    const missingCount = checks.filter(c => !c.hit).length;

    const checkHtml = `
        <div class="material-check card" style="margin-bottom:12px;">
            <div class="material-check-title">必备材料齐备性检查 <span style="font-size:12px;color:#6b7280;">（${checks.filter(c=>c.hit).length}/${checks.length} 项已识别）</span></div>
            <div class="material-check-grid">
                ${checks.map(c => `
                    <div class="material-check-item ${c.hit ? 'hit' : 'miss'}">
                        <span class="material-check-icon">${c.hit ? '✅' : '❌'}</span>
                        <span class="material-check-name">${c.name}</span>
                    </div>
                `).join('')}
            </div>
            ${missingCount ? `<div class="material-check-hint">缺失 ${missingCount} 项必备材料，请补充后重新审核。</div>` : ''}
        </div>
    `;

    const fileHtml = appState.files.map(f => {
        const ext = f.name.split('.').pop().toLowerCase();
        let icon = '📄';
        if (ext === 'pdf') icon = '📕';
        if (ext === 'docx' || ext === 'doc') icon = '📝';
        return `
            <div class="material-item">
                <div class="material-name"><span class="material-icon">${icon}</span>${f.name}</div>
                <div class="material-status">${(f.size / 1024).toFixed(1)} KB</div>
            </div>
        `;
    }).join('');

    els.resultList.innerHTML = checkHtml + fileHtml;
}

function exportResults() {
    if (!appState.results.length) return showToast('请先导入合同材料后再导出审核意见', { type: 'warning' });

    const rows = appState.results.map(r => ({
        '编号': r.id,
        '维度': `${r.dim} ${AUDIT_DIMENSIONS.find(d => d.code === r.dim)?.name || ''}`,
        '审核要点': r.title,
        '风险等级': r.level,
        '审核结论': STATUS_LABELS[getEffectiveStatus(r)],
        '原文/事实': r.fact,
        '依据': r.basis,
        '审核意见/建议': r.suggestion
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '审核结果');

    const fileName = `年金合同备案审核意见_${appState.folderName || '未命名'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

async function clearData() {
    if (!appState.results.length && !appState.files.length) return;
    const ok = await showConfirm('清除后将无法恢复已导入的数据和审核结果，是否继续？', {
        title: '确认清除数据', confirmText: '确认清除', type: 'error'
    });
    if (!ok) return;

    appState = {
        files: [],
        results: [],
        combinedText: '',
        fileMap: {},
        folderName: '',
        importTime: null,
        activeTab: 'all',
        activeFilter: 'all',
        search: ''
    };
    els.folderInput.value = '';
    els.searchInput.value = '';
    els.tabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    els.filters.forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));

    localStorage.removeItem('annuityAuditState');
    els.dashboard.style.display = 'none';
    els.emptyState.style.display = 'flex';
    if (pieChart) { pieChart.dispose(); pieChart = null; }
    if (barChart) { barChart.dispose(); barChart = null; }
    renderHistoryList();
}

function saveToStorage() {
    try {
        localStorage.setItem('annuityAuditState', JSON.stringify({
            files: appState.files.map(f => ({ name: f.name, size: f.size, type: f.type })),
            results: appState.results,
            combinedText: appState.combinedText,
            fileMap: appState.fileMap,
            folderName: appState.folderName,
            importTime: appState.importTime
        }));
        // 同时保存到历史记录
        saveToHistory();
    } catch (e) {
        console.warn('本地存储失败', e);
    }
}

function saveToHistory() {
    try {
        if (!appState.results.length) return;
        const raw = localStorage.getItem('annuityAuditHistory') || '[]';
        const history = JSON.parse(raw);
        const snapshot = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            folderName: appState.folderName || '未命名计划',
            importTime: appState.importTime,
            fileCount: appState.files.length,
            resultsSummary: {
                total: appState.results.length,
                fail: appState.results.filter(r => r.status === 'fail').length,
                rectify: appState.results.filter(r => r.status === 'rectify').length,
                improve: appState.results.filter(r => r.status === 'improve').length,
                confirm: appState.results.filter(r => r.status === 'confirm').length,
                pass: appState.results.filter(r => r.status === 'pass').length,
                na: appState.results.filter(r => r.status === 'na').length
            },
            files: appState.files.map(f => ({ name: f.name, size: f.size, type: f.type })),
            results: appState.results,
            combinedText: appState.combinedText
        };
        // 去重：同文件夹+同时间（5分钟内）不重复保存
        const recent = history.find(h => h.folderName === snapshot.folderName && Math.abs(new Date(h.importTime) - new Date(snapshot.importTime)) < 5 * 60 * 1000);
        if (!recent) {
            history.unshift(snapshot);
            // 最多保留 50 条
            if (history.length > 50) history.length = 50;
            localStorage.setItem('annuityAuditHistory', JSON.stringify(history));
        }
    } catch (e) {
        console.warn('保存历史记录失败', e);
    }
}

function loadFromStorage() {
    try {
        const raw = localStorage.getItem('annuityAuditState');
        if (!raw) return;
        const data = JSON.parse(raw);
        appState.files = data.files || [];
        appState.results = data.results || [];
        appState.combinedText = data.combinedText || '';
        appState.fileMap = data.fileMap || {};
        appState.folderName = data.folderName || '';
        appState.importTime = data.importTime || null;
        if (appState.results.length) {
            els.emptyState.style.display = 'none';
            els.dashboard.style.display = 'block';
        }
    } catch (e) {
        console.warn('读取本地存储失败', e);
    }
}

function getHistory() {
    try {
        const raw = localStorage.getItem('annuityAuditHistory') || '[]';
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function renderHistoryList() {
    const history = getHistory();
    const buildCard = (h) => {
        const date = h.importTime ? new Date(h.importTime).toLocaleString('zh-CN') : '-';
        const s = h.resultsSummary || {};
        const statusTags = [];
        if (s.fail) statusTags.push(`<span class="hist-tag fail">不通过 ${s.fail}</span>`);
        if (s.rectify) statusTags.push(`<span class="hist-tag rectify">待补正 ${s.rectify}</span>`);
        if (s.improve) statusTags.push(`<span class="hist-tag improve">提示改进 ${s.improve}</span>`);
        if (s.confirm) statusTags.push(`<span class="hist-tag confirm">需确认 ${s.confirm}</span>`);
        if (s.pass) statusTags.push(`<span class="hist-tag pass">通过 ${s.pass}</span>`);
        return `
            <div class="history-card" data-id="${h.id}">
                <div class="history-card-name">${escapeHtml(h.folderName)}</div>
                <div class="history-card-meta">${date} · ${h.fileCount || 0} 份材料 · 共 ${s.total || 0} 项</div>
                <div class="history-card-tags">${statusTags.join('')}</div>
                <div class="history-card-actions">
                    <button class="btn btn-primary btn-sm hist-view" data-id="${h.id}">查看</button>
                    <button class="btn btn-default btn-sm hist-delete" data-id="${h.id}">删除</button>
                </div>
            </div>
        `;
    };

    const html = history.map(buildCard).join('');
    const gridOpen = '<div class="history-grid">';
    const gridClose = '</div>';

    const emptyMsg = '<div class="loading">暂无历史审核记录</div>';
    els.historyList.innerHTML = history.length ? (gridOpen + html + gridClose) : emptyMsg;
    els.historyListEmpty.innerHTML = history.length ? (gridOpen + html + gridClose) : '';
    els.historyInEmpty.style.display = (!appState.results.length && history.length) ? 'block' : 'none';

    // 绑定查看和删除事件
    document.querySelectorAll('.hist-view').forEach(btn => {
        btn.addEventListener('click', (e) => loadHistoryItem(e.target.dataset.id));
    });
    document.querySelectorAll('.hist-delete').forEach(btn => {
        btn.addEventListener('click', (e) => deleteHistoryItem(e.target.dataset.id));
    });
}

function showHistoryPanel() {
    hideAllPanels();
    renderHistoryList();
    els.historyPanel.style.display = 'block';
    els.emptyState.style.display = 'none';
}

function hideHistoryPanel() {
    els.historyPanel.style.display = 'none';
    if (appState.results.length) {
        els.dashboard.style.display = 'block';
        els.emptyState.style.display = 'none';
    } else {
        els.emptyState.style.display = 'flex';
        renderHistoryList();
    }
}

function loadHistoryItem(id) {
    const history = getHistory();
    const item = history.find(h => h.id === id);
    if (!item) return showToast('该记录不存在或已被删除', { type: 'warning' });

    appState = {
        files: item.files || [],
        results: item.results || [],
        combinedText: item.combinedText || '',
        folderName: item.folderName || '',
        importTime: item.importTime || null,
        activeTab: 'all',
        activeFilter: 'all',
        search: ''
    };

    // 重置 UI 状态
    els.searchInput.value = '';
    els.tabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    els.filters.forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));

    els.historyPanel.style.display = 'none';
    els.emptyState.style.display = 'none';
    els.dashboard.style.display = 'block';

    saveToStorage();
    renderDashboard();
}

async function deleteHistoryItem(id) {
    const ok = await showConfirm('删除后该历史记录将无法恢复，是否继续？', {
        title: '确认删除历史记录', confirmText: '确认删除'
    });
    if (!ok) return;
    try {
        let history = getHistory();
        history = history.filter(h => h.id !== id);
        localStorage.setItem('annuityAuditHistory', JSON.stringify(history));
        renderHistoryList();
    } catch (e) {
        console.warn('删除历史记录失败', e);
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

/* ==================== 功能3: 生成审核意见书报告（机关公文格式 .docx） ==================== */
function generateReport() {
    if (!appState.results.length) return showToast('暂无审核结果，请先导入合同材料', { type: 'warning' });
    if (typeof docx === 'undefined') return showToast('文档生成库正在加载，请稍后重试', { type: 'info' });

    const info = extractKeyInfo(appState.combinedText);
    const fail = appState.results.filter(r => getEffectiveStatus(r) === 'fail');
    const rectify = appState.results.filter(r => getEffectiveStatus(r) === 'rectify');
    const improve = appState.results.filter(r => getEffectiveStatus(r) === 'improve');
    const confirm = appState.results.filter(r => getEffectiveStatus(r) === 'confirm');
    const pass = appState.results.filter(r => getEffectiveStatus(r) === 'pass');

    let conclusion = '建议备案';
    if (fail.length) conclusion = '不予备案（存在硬性红线）';
    else if (rectify.length) conclusion = '补正后备案';

    const { Document, Paragraph, TextRun, Table, TableCell, TableRow, BorderStyle, AlignmentType, Packer, WidthType, LineRuleType } = docx;

    // 公文页边距（上3.7cm 下3.5cm 左2.8cm 右2.6cm）
    const M = { top: 2098, bottom: 1984, left: 1588, right: 1474 };
    // 字体与字号（half-points）
    const F = { title: '黑体', body: '仿宋_GB2312', song: '宋体' };
    const S = { title: 44, body: 32, small: 24 }; // 二号22pt 三号16pt
    const LINE = 560; // 固定值28磅

    function bodyPara(text, opts = {}) {
        return new Paragraph({
            spacing: { line: LINE, lineRule: 'exact' },
            indent: opts.noIndent ? undefined : { firstLine: 640 },
            alignment: opts.center ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            children: [new TextRun({ text, font: F.body, size: S.body, bold: opts.bold })]
        });
    }
    function headingPara(text) {
        return new Paragraph({
            spacing: { before: 200, after: 100, line: LINE, lineRule: 'exact' },
            children: [new TextRun({ text, font: F.song, size: S.body, bold: true })]
        });
    }

    // 项目信息表格
    const infoRows = [
        ['项目名称', appState.folderName || '未命名计划'],
        ['导入时间', appState.importTime ? new Date(appState.importTime).toLocaleString('zh-CN') : '-'],
        ['材料份数', String(appState.files.length) + ' 份'],
    ];
    info.forEach(i => infoRows.push([i.label, i.value]));

    const infoTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        },
        rows: infoRows.map(([k, v]) => new TableRow({
            children: [
                new TableCell({
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: k, font: F.song, size: S.body, bold: true })] })]
                }),
                new TableCell({
                    width: { size: 75, type: WidthType.PERCENTAGE },
                    children: [new Paragraph({ children: [new TextRun({ text: v, font: F.body, size: S.body })] })]
                }),
            ]
        }))
    });

    // 分类问题
    const resultChildren = [];
    function addCategory(title, items, color) {
        if (!items.length) return;
        resultChildren.push(headingPara(`${title}（${items.length} 项）`));
        items.forEach(r => {
            resultChildren.push(new Paragraph({
                spacing: { line: LINE, lineRule: 'exact' },
                indent: { firstLine: 640 },
                children: [
                    new TextRun({ text: `${r.id} ${r.title} `, font: F.song, size: S.body, bold: true }),
                    new TextRun({ text: `[${STATUS_LABELS[getEffectiveStatus(r)]}]`, font: F.body, size: S.body, bold: true, color: color })
                ]
            }));
            resultChildren.push(bodyPara(`原文/事实：${r.fact}`));
            resultChildren.push(bodyPara(`依据：${r.basis}`));
            resultChildren.push(bodyPara(`建议：${r.suggestion}`));
            resultChildren.push(new Paragraph({ spacing: { after: 80 }, children: [] }));
        });
    }
    addCategory('一、A类 不予备案（硬性红线）', fail, 'C00000');
    addCategory('二、B类 待补正', rectify, 'ED7D31');
    addCategory('三、C类 提示改进', improve, '4472C4');
    addCategory('四、需人工确认', confirm, '000000');
    addCategory('五、通过项', pass, '000000');

    const doc = new Document({
        sections: [{
            properties: { page: { margin: M } },
            children: [
                // 红色分隔线
                new Paragraph({
                    spacing: { after: 200 },
                    border: { bottom: { color: 'C00000', space: 1, value: 'single', size: 12 } },
                    children: []
                }),
                // 标题
                new Paragraph({
                    spacing: { before: 200, after: 300, line: LINE, lineRule: 'exact' },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '年金合同备案审核意见书', font: F.title, size: S.title, bold: true })]
                }),
                // 项目信息表
                infoTable,
                new Paragraph({ spacing: { after: 200 }, children: [] }),
                // 审核结论
                new Paragraph({
                    spacing: { line: LINE, lineRule: 'exact' },
                    indent: { firstLine: 640 },
                    children: [
                        new TextRun({ text: '审核结论：', font: F.song, size: S.body, bold: true }),
                        new TextRun({ text: conclusion, font: F.body, size: S.body, bold: true })
                    ]
                }),
                new Paragraph({ spacing: { after: 200 }, children: [] }),
                // 统计汇总
                new Paragraph({
                    spacing: { line: LINE, lineRule: 'exact' },
                    indent: { firstLine: 640 },
                    children: [new TextRun({
                        text: `本次审核共 ${appState.results.length} 项，其中：A类不予备案 ${fail.length} 项，B类待补正 ${rectify.length} 项，C类提示改进 ${improve.length} 项，需人工确认 ${confirm.length} 项，通过 ${pass.length} 项。`,
                        font: F.body, size: S.body
                    })]
                }),
                new Paragraph({ spacing: { after: 200 }, children: [] }),
                // 分类问题
                ...resultChildren,
                // 落款
                new Paragraph({ spacing: { before: 400, after: 100, line: LINE, lineRule: 'exact' }, alignment: AlignmentType.RIGHT, indent: { right: 800 }, children: [new TextRun({ text: '（审核单位盖章）', font: F.body, size: S.body })] }),
                new Paragraph({ spacing: { line: LINE, lineRule: 'exact' }, alignment: AlignmentType.RIGHT, indent: { right: 800 }, children: [new TextRun({ text: new Date().toLocaleDateString('zh-CN'), font: F.body, size: S.body })] }),
                // 附注
                new Paragraph({ spacing: { before: 400 }, children: [] }),
                new Paragraph({
                    spacing: { line: 360, lineRule: 'exact' },
                    alignment: AlignmentType.CENTER,
                    children: [new TextRun({ text: '本报告由年金合同备案审核看板自动生成，仅供内部审核参考，最终结论以人工复核为准。', font: F.body, size: 18, color: '808080' })]
                }),
            ]
        }]
    });

    Packer.toBlob(doc).then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `年金合同备案审核意见书_${appState.folderName || '未命名'}_${new Date().toISOString().slice(0,10)}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }).catch(err => {
        console.error('生成文档失败', err);
        showToast('生成 Word 文档失败：' + (err.message || err), { type: 'error', duration: 6000 });
    });
}

/* ==================== 功能4: 合同版本比对 ==================== */
let compareState = { fileA: null, fileB: null };

function showComparePanel() {
    hideAllPanels();
    els.comparePanel.style.display = 'block';
    els.emptyState.style.display = 'none';
}

function hideComparePanel() {
    els.comparePanel.style.display = 'none';
    if (appState.results.length) {
        els.dashboard.style.display = 'block';
    } else {
        els.emptyState.style.display = 'flex';
    }
}

function handleCompareFile(e, side) {
    const file = e.target.files[0];
    if (!file) return;
    if (side === 'A') {
        compareState.fileA = file;
        els.compareNameA.textContent = file.name;
    } else {
        compareState.fileB = file;
        els.compareNameB.textContent = file.name;
    }
}

function computeDiff(a, b) {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const m = linesA.length, n = linesB.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (linesA[i - 1] === linesB[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1;
            else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
    }
    let i = m, j = n;
    const result = [];
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
            result.unshift({ type: 'same', line: linesA[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
            result.unshift({ type: 'add', line: linesB[j - 1] });
            j--;
        } else {
            result.unshift({ type: 'del', line: linesA[i - 1] });
            i--;
        }
    }
    return result;
}

async function runCompare() {
    if (!compareState.fileA || !compareState.fileB) {
        return showToast('请先上传两个合同文件，再点击开始比对', { type: 'warning' });
    }
    els.compareResult.innerHTML = '<div class="loading">正在解析并比对，请稍候…</div>';
    try {
        const [textA, textB] = await Promise.all([
            extractText(compareState.fileA),
            extractText(compareState.fileB)
        ]);

        const trimA = textA.trim();
        const trimB = textB.trim();
        if (!trimA || !trimB) {
            const emptyFiles = [];
            if (!trimA) emptyFiles.push(compareState.fileA.name);
            if (!trimB) emptyFiles.push(compareState.fileB.name);
            els.compareResult.innerHTML = `
                <div class="compare-empty-alert">
                    <div class="compare-empty-title">⚠️ 未能提取到有效文本</div>
                    <div class="compare-empty-body">
                        以下文件未提取到文字内容，可能是<strong>扫描件（图片型PDF）</strong>或文件本身无文字层：<br>
                        ${emptyFiles.map(f => `· ${escapeHtml(f)}`).join('<br>')}
                    </div>
                    <div class="compare-empty-hint">
                        建议：先将扫描件通过 OCR 工具（如 Adobe Acrobat、ABBYY FineReader、WPS 等）转换为可搜索 PDF 后再进行比对。
                    </div>
                </div>
            `;
            return;
        }

        const diff = computeDiff(textA, textB);
        renderCompareResult(diff);
    } catch (err) {
        els.compareResult.innerHTML = '<div class="loading" style="color:#dc2626">比对出错：' + (err.message || err) + '</div>';
    }
}

function renderCompareResult(diff) {
    // 过滤掉纯空白行，避免显示大量空行
    const nonEmpty = diff.filter(d => d.line && d.line.trim().length > 0);
    const hasContent = nonEmpty.length > 0;

    const stats = { same: 0, add: 0, del: 0 };
    diff.forEach(d => stats[d.type]++);

    let html = '';
    if (!hasContent) {
        html = `<div class="compare-empty-alert">
            <div class="compare-empty-title">⚠️ 提取到的文本均为空白</div>
            <div class="compare-empty-body">
                两个文件共识别 ${diff.length} 行，但均无实质文字内容，大概率是扫描件 PDF。
            </div>
            <div class="compare-empty-hint">
                建议：使用 OCR 工具将扫描件转换为可搜索 PDF 后再比对。
            </div>
        </div>`;
    } else {
        // 显示非空行，并在连续空行处折叠
        html = diff.map(d => {
            const isEmpty = !d.line || !d.line.trim();
            if (isEmpty) return `<div class="diff-line diff-empty">…</div>`;
            const text = escapeHtml(d.line);
            if (d.type === 'same') return `<div class="diff-line diff-same">${text}</div>`;
            if (d.type === 'add') return `<div class="diff-line diff-add">+ ${text}</div>`;
            if (d.type === 'del') return `<div class="diff-line diff-del">- ${text}</div>`;
        }).join('');
    }

    els.compareResult.innerHTML = `
        <div class="diff-stats">
            <span class="diff-stat same">相同 ${stats.same} 行</span>
            <span class="diff-stat add">新增 ${stats.add} 行</span>
            <span class="diff-stat del">删除 ${stats.del} 行</span>
            ${!hasContent ? '<span class="diff-stat warn">（无实质内容）</span>' : ''}
        </div>
        <div class="diff-content">${html}</div>
    `;
}

/* ==================== 功能6: 项目管理 ==================== */
function showProjectPanel() {
    hideAllPanels();
    els.projectPanel.style.display = 'block';
    els.emptyState.style.display = 'none';
    renderProjectList();
}

function hideProjectPanel() {
    els.projectPanel.style.display = 'none';
    if (appState.results.length) {
        els.dashboard.style.display = 'block';
    } else {
        els.emptyState.style.display = 'flex';
    }
}

/* ==================== 文件依据库 ==================== */
function showBasisPanel() {
    hideAllPanels();
    els.basisPanel.style.display = 'block';
    els.emptyState.style.display = 'none';
    renderBasisList();
}
function hideBasisPanel() {
    els.basisPanel.style.display = 'none';
    if (appState.results.length) {
        els.dashboard.style.display = 'block';
    } else {
        els.emptyState.style.display = 'flex';
    }
}

function getBasisLibrary() {
    try {
        const raw = localStorage.getItem('annuityAuditBasisLibrary') || '[]';
        return JSON.parse(raw);
    } catch (e) { return []; }
}

function saveBasisLibrary(items) {
    try {
        localStorage.setItem('annuityAuditBasisLibrary', JSON.stringify(items));
    } catch (e) {
        console.warn('依据库存储失败', e);
        showToast('依据文件内容过大，本地存储空间不足，请删除部分文件后重试', { type: 'error', duration: 6000 });
    }
}

function getBasisText() {
    const lib = getBasisLibrary();
    return lib.map(item => item.text || '').join('\n\n');
}

async function handleBasisUpload(e) {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const lib = getBasisLibrary();
    const addedNames = [];
    for (const file of files) {
        if (!isSupportedFile(file.name)) {
            console.warn('不支持的格式', file.name);
            continue;
        }
        try {
            const text = await extractText(file);
            if (!text || !text.trim()) {
                const ext = file.name.split('.').pop().toLowerCase();
                if (ext === 'doc') {
                    showToast(
                        `「${file.name}」为旧版 Word 格式，浏览器暂无法自动解析。<br><strong>解决方法：</strong>在 Word 中打开 → 文件 → 另存为 → 选择「.docx」格式后重新上传。`,
                        { type: 'warning', title: '文件格式不支持', duration: 8000 }
                    );
                } else {
                    showToast(
                        `「${file.name}」未能提取到有效文字内容，该文件可能是<strong>扫描件（图片型PDF）</strong>。<br><strong>解决方法：</strong>先用 OCR 工具（如 Adobe Acrobat、WPS）转换为可搜索的 PDF 或 Word 后再上传。`,
                        { type: 'warning', title: '未能识别文件内容', duration: 8000 }
                    );
                }
                continue;
            }
            lib.push({
                name: file.name,
                size: file.size,
                text: text,
                addedAt: new Date().toISOString()
            });
            addedNames.push(file.name);
        } catch (err) {
            console.warn('依据文件解析失败', file.name, err);
        }
    }
    saveBasisLibrary(lib);
    renderBasisList();
    e.target.value = '';
    if (addedNames.length) {
        showToast(`${addedNames.join('、')} 已加入文件依据库，审核时将自动引用这些内容。`, { type: 'success', title: `成功上传 ${addedNames.length} 个文件` });
    }
}

function renderBasisList() {
    const lib = getBasisLibrary();
    if (!lib.length) {
        els.basisList.innerHTML = '<div class="basis-empty">暂无依据文件，请点击上方按钮上传</div>';
        return;
    }
    els.basisList.innerHTML = lib.map((item, idx) => {
        const date = item.addedAt ? new Date(item.addedAt).toLocaleString('zh-CN') : '-';
        const sizeKb = item.size ? Math.round(item.size / 1024) + ' KB' : '-';
        const textLen = item.text ? item.text.length + ' 字' : '-';
        return `
            <div class="basis-item">
                <div class="basis-info">
                    <div class="basis-name">${escapeHtml(item.name)}</div>
                    <div class="basis-meta">${date} · ${sizeKb} · ${textLen}</div>
                </div>
                <div class="basis-actions">
                    <button class="btn btn-default btn-sm basis-delete" data-idx="${idx}">删除</button>
                </div>
            </div>
        `;
    }).join('');
    document.querySelectorAll('.basis-delete').forEach(btn => {
        btn.addEventListener('click', (e) => deleteBasisFile(parseInt(e.target.dataset.idx)));
    });
}

async function deleteBasisFile(idx) {
    const lib = getBasisLibrary();
    if (idx >= 0 && idx < lib.length) {
        const ok = await showConfirm(`删除后该依据文件将不再参与自动审核，是否继续？`, {
            title: `确认删除「${lib[idx].name}」`, confirmText: '确认删除'
        });
        if (!ok) return;
        lib.splice(idx, 1);
        saveBasisLibrary(lib);
        renderBasisList();
    }
}

function hideAllPanels() {
    els.historyPanel.style.display = 'none';
    els.comparePanel.style.display = 'none';
    els.projectPanel.style.display = 'none';
    els.basisPanel.style.display = 'none';
    els.dashboard.style.display = 'none';
}

function getProjects() {
    try {
        const raw = localStorage.getItem('annuityAuditProjects') || '[]';
        return JSON.parse(raw);
    } catch (e) { return []; }
}

function saveProject() {
    if (!appState.results.length) return showToast('当前无审核数据，请先导入合同材料', { type: 'warning' });
    const name = els.projectNameInput.value.trim() || appState.folderName || '未命名项目';
    const projects = getProjects();
    const project = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name,
        folderName: appState.folderName || '',
        importTime: appState.importTime,
        fileCount: appState.files.length,
        files: appState.files.map(f => ({ name: f.name, size: f.size, type: f.type })),
        results: appState.results,
        combinedText: appState.combinedText
    };
    projects.unshift(project);
    if (projects.length > 100) projects.length = 100;
    localStorage.setItem('annuityAuditProjects', JSON.stringify(projects));
    els.projectNameInput.value = '';
    renderProjectList();
    showToast(`项目「${name}」已保存，您可以在「项目管理」中查看和导出。`, { type: 'success', title: '项目保存成功' });
}

function renderProjectList() {
    const projects = getProjects();
    els.projectList.innerHTML = projects.map(p => {
        const date = p.importTime ? new Date(p.importTime).toLocaleString('zh-CN') : '-';
        const s = p.results ? {
            fail: p.results.filter(r => getEffectiveStatus(r) === 'fail').length,
            rectify: p.results.filter(r => getEffectiveStatus(r) === 'rectify').length,
            improve: p.results.filter(r => getEffectiveStatus(r) === 'improve').length,
            pass: p.results.filter(r => getEffectiveStatus(r) === 'pass').length
        } : {};
        return `
            <div class="project-item" data-id="${p.id}">
                <div class="project-info">
                    <div class="project-name">${escapeHtml(p.name)}</div>
                    <div class="project-meta">${date} · ${p.fileCount || 0} 份材料</div>
                    <div class="project-tags">
                        ${s.fail ? `<span class="hist-tag fail">不通过 ${s.fail}</span>` : ''}
                        ${s.rectify ? `<span class="hist-tag rectify">待补正 ${s.rectify}</span>` : ''}
                        ${s.improve ? `<span class="hist-tag improve">提示改进 ${s.improve}</span>` : ''}
                        ${s.pass ? `<span class="hist-tag pass">通过 ${s.pass}</span>` : ''}
                    </div>
                </div>
                <div class="project-actions">
                    <button class="btn btn-primary btn-sm proj-view" data-id="${p.id}">查看</button>
                    <button class="btn btn-default btn-sm proj-export" data-id="${p.id}">导出</button>
                    <button class="btn btn-default btn-sm proj-delete" data-id="${p.id}">删除</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.proj-view').forEach(btn => {
        btn.addEventListener('click', (e) => loadProject(e.target.dataset.id));
    });
    document.querySelectorAll('.proj-export').forEach(btn => {
        btn.addEventListener('click', (e) => exportProject(e.target.dataset.id));
    });
    document.querySelectorAll('.proj-delete').forEach(btn => {
        btn.addEventListener('click', (e) => deleteProject(e.target.dataset.id));
    });
}

function loadProject(id) {
    const projects = getProjects();
    const p = projects.find(x => x.id === id);
    if (!p) return showToast('该项目不存在或已被删除', { type: 'warning' });
    appState = {
        files: p.files || [],
        results: p.results || [],
        combinedText: p.combinedText || '',
        folderName: p.folderName || '',
        importTime: p.importTime || null,
        activeTab: 'all',
        activeFilter: 'all',
        search: ''
    };
    els.searchInput.value = '';
    els.tabs.forEach(t => t.classList.toggle('active', t.dataset.filter === 'all'));
    els.filters.forEach(b => b.classList.toggle('active', b.dataset.status === 'all'));
    els.projectPanel.style.display = 'none';
    els.emptyState.style.display = 'none';
    els.dashboard.style.display = 'block';
    saveToStorage();
    renderDashboard();
}

async function deleteProject(id) {
    const ok = await showConfirm('删除后该项目将无法恢复，是否继续？', {
        title: '确认删除项目', confirmText: '确认删除'
    });
    if (!ok) return;
    let projects = getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('annuityAuditProjects', JSON.stringify(projects));
    renderProjectList();
}

function exportProject(id) {
    const projects = getProjects();
    const p = projects.find(x => x.id === id);
    if (!p || !p.results) return;
    exportResultsFromData(p.results, p.name);
}

function exportResultsFromData(results, name) {
    const rows = results.map(r => ({
        '编号': r.id,
        '维度': `${r.dim} ${AUDIT_DIMENSIONS.find(d => d.code === r.dim)?.name || ''}`,
        '审核要点': r.title,
        '风险等级': r.level,
        '审核结论': STATUS_LABELS[r.manualStatus || r.status],
        '原文/事实': r.fact,
        '依据': r.basis,
        '审核意见/建议': r.suggestion
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '审核结果');
    const fileName = `年金合同备案审核意见_${name || '未命名'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function batchExportProjects() {
    const projects = getProjects();
    if (!projects.length) return showToast('暂无保存的项目，请先导入数据并保存项目', { type: 'warning' });
    const wb = XLSX.utils.book_new();
    projects.forEach((p, idx) => {
        if (!p.results) return;
        const rows = p.results.map(r => ({
            '编号': r.id,
            '维度': `${r.dim} ${AUDIT_DIMENSIONS.find(d => d.code === r.dim)?.name || ''}`,
            '审核要点': r.title,
            '风险等级': r.level,
            '审核结论': STATUS_LABELS[r.manualStatus || r.status],
            '原文/事实': r.fact,
            '依据': r.basis,
            '审核意见/建议': r.suggestion
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const sheetName = (p.name || `项目${idx + 1}`).slice(0, 30);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    const fileName = `年金合同备案审核_批量导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

/* ==================== 功能7: 法律依据快捷参考 ==================== */
const BASIS_DETAILS = {
    '赣人社字〔2016〕7号': '《江西省人力资源和社会保障厅关于企业年金基金管理合同备案有关问题的通知》：明确备案材料清单、格式及审核要点。',
    '人社监司函〔2013〕18号': '《人力资源社会保障部社会保险基金监督司关于企业年金计划备案有关问题的函》：规范备案申请函格式与内容。',
    '51号文': '《关于进一步加强企业年金基金管理的通知》（2025-09-12）：合同期限≥3年、业绩基准须在合同正文、不得用补充协议实质变更合同等硬性要求。',
    '赣人社发〔2018〕37号': '《江西省职业年金基金管理实施办法》：规范职业年金合同签署、报送时限及确认函出具要求。',
    '11号令': '《企业年金基金管理办法》（人社部令第11号）：规定管理人资格条件、职责及合同管理要求。',
    '35号文': '《关于规范企业年金基金管理有关问题的通知》：严禁保底收益、利益输送，要求费率等关键条款须在合同正文约定。',
    '口径说明一': '省人社厅内部口径说明：明确51号文后合同期限不足3年不予备案，且不得以临时短期延长方式充数。',
    '培训材料': '省人社厅备案审核培训材料：涵盖业绩基准、费率结构、考核淘汰等实务审核要点。',
    '会议纪要': '相关会议纪要：对过渡安排、特殊情形、补充协议定位等问题形成的一致性意见。'
};

function getBasisTooltip(basisText) {
    if (!basisText) return '';
    for (const key of Object.keys(BASIS_DETAILS)) {
        if (basisText.includes(key)) return BASIS_DETAILS[key];
    }
    return '';
}

init();
