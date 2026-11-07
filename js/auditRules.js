/**
 * 年金合同备案审核要点清单规则库
 * 依据：02-审核要点清单.txt（A组—I组）
 */

const AUDIT_DIMENSIONS = [
    { code: 'A', name: '材料齐备性与时限' },
    { code: 'B', name: '合同期限' },
    { code: 'C', name: '合同的唯一有效性' },
    { code: 'D', name: '业绩基准' },
    { code: 'E', name: '费率与费用结构' },
    { code: 'F', name: '考核与淘汰' },
    { code: 'G', name: '合同效力、生效时间与空档期' },
    { code: 'H', name: '主体资格与管理人设置' },
    { code: 'I', name: '江西省地方要求' }
];

const REQUIRED_MATERIALS = [
    { key: 'contract', name: '年金基金管理合同', patterns: [/年金.*(合同|协议)/i, /管理合同/i] },
    { key: 'recordForm', name: '备案申请表/备案函', patterns: [/备案.*(申请|表|函)/i, /合同备案/i] },
    { key: 'trusteeProof', name: '受托人资格证明', patterns: [/受托人.*资格/i, /受托资格/i, /牌照/i] },
    { key: 'feeSchedule', name: '费率说明/费用清单', patterns: [/费率/i, /费用.*清单/i, /管理费/i] },
    { key: 'performanceBench', name: '业绩比较基准说明', patterns: [/业绩.*基准/i, /比较基准/i] }
];

// 工具函数
function findRates(text) {
    const matches = text.match(/(\d+\.?\d*)\s*%/g) || [];
    return matches.map(m => parseFloat(m)).filter(v => !isNaN(v));
}

function hasAny(text, keywords) {
    return keywords.some(k => text.includes(k));
}

function countMatches(text, keywords) {
    return keywords.filter(k => text.includes(k)).length;
}

function getAllFileNames(files) {
    return files.map(f => f.name);
}

const AUDIT_RULES = [
    // ==================== A组 材料齐备性与时限 ====================
    {
        id: 'A0',
        dim: 'A',
        title: '报送资料清单',
        level: 'B',
        description: '受托人附资料清单（列序号、资料名、资料类型），与实收材料逐项对应；清单列有而实收无的，按缺件处理。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const found = [];
            const missing = [];
            const foundFiles = [];
            REQUIRED_MATERIALS.forEach(mat => {
                const hit = files.some(f => mat.patterns.some(p => p.test(f.name)));
                if (hit) {
                    found.push(mat.name);
                    const matched = files.filter(f => mat.patterns.some(p => p.test(f.name))).map(f => f.name);
                    foundFiles.push(...matched);
                } else {
                    missing.push(mat.name);
                }
            });
            const hasList = /资料清单|材料清单|目录|序号.*资料名/.test(text);
            const fact = `已识别 ${found.length}/${REQUIRED_MATERIALS.length} 类必备材料。` +
                (missing.length ? `缺失：${missing.join('、')}。` : '材料清单完整。') +
                (hasList ? '文本中已发现资料清单或目录表述。' : '文本中未明确发现资料清单。');
            return {
                status: missing.length ? 'rectify' : (hasList ? 'pass' : 'improve'),
                fact,
                basis: '实务惯例（三套测试材料均附清单或资料目录）。',
                suggestion: missing.length
                    ? `请补充缺失材料：${missing.join('、')}，并确保附有与实收材料逐项对应的资料清单。`
                    : '材料清单齐全，建议核对清单列示与实收材料一致。',
                sourceFiles: [...new Set(foundFiles.length ? foundFiles : allFileNames)]
            };
        }
    },
    {
        id: 'A1',
        dim: 'A',
        title: '备案申请函',
        level: 'B',
        description: '按情形（建立/顺延或续签/管理人变更）使用对应格式，加盖受托人公章；函中计划名称、登记号、管理人、组合数、合同期限与合同正文完全一致。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /备案.*申请|申请函|备案函|合同备案/.test(f.name)).map(f => f.name);
            const hasApply = matchedFiles.length > 0;
            const fact = hasApply
                ? `已识别备案申请函相关文件：${matchedFiles.join('、')}。`
                : '未识别到备案申请函相关文件。';
            return {
                status: hasApply ? 'pass' : 'rectify',
                fact,
                basis: '赣人社字〔2016〕7号 一（二）2；人社监司函〔2013〕18号。',
                suggestion: hasApply
                    ? '请人工核对函中计划名称、登记号、管理人、组合数、合同期限与合同正文完全一致，并确保加盖受托人公章。'
                    : '请按情形（建立/顺延或续签/管理人变更）提供对应格式的备案申请函。',
                sourceFiles: hasApply ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'A2',
        dim: 'A',
        title: '年金方案备案复函',
        level: 'B',
        description: '县以上人社部门出具，方案名称与合同一致。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /复函|备案.*批复|人社.*备案/.test(f.name)).map(f => f.name);
            const hasReply = matchedFiles.length > 0;
            return {
                status: hasReply ? 'pass' : 'rectify',
                fact: hasReply ? `已识别到备案复函或人社部门备案相关文件：${matchedFiles.join('、')}。` : '未识别到县以上人社部门出具的备案复函文件。',
                basis: '赣人社字〔2016〕7号 一（二）1。',
                suggestion: '请补充县以上人社部门出具的年金方案备案复函，并确保方案名称与合同一致。',
                sourceFiles: hasReply ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'A3',
        dim: 'A',
        title: '受托管理合同',
        level: 'B',
        description: '正本或按审核意见签署的补充协议正本，签章齐全。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /年金.*合同|管理合同|受托.*合同/.test(f.name)).map(f => f.name);
            const hasContract = matchedFiles.length > 0;
            return {
                status: hasContract ? 'pass' : 'rectify',
                fact: hasContract ? `已识别到受托管理合同文件：${matchedFiles.join('、')}。` : '未识别到受托管理合同文件。',
                basis: '赣人社字〔2016〕7号 一（二）3。',
                suggestion: hasContract
                    ? '请确保合同签章齐全，并核对为正本或按审核意见签署的补充协议。'
                    : '请补充受托管理合同正本或按审核意见签署的补充协议正本。',
                sourceFiles: hasContract ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'A4',
        dim: 'A',
        title: '委托管理合同（账户/托管/投管）',
        level: 'B',
        description: '三方合同齐备，逐份签章。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const accountFiles = files.filter(f => /账户.*合同|账户管理/.test(f.name)).map(f => f.name);
            const custodyFiles = files.filter(f => /托管.*合同|托管管理/.test(f.name)).map(f => f.name);
            const investFiles = files.filter(f => /投管.*合同|投资管理/.test(f.name)).map(f => f.name);
            const hasAccount = accountFiles.length > 0;
            const hasCustody = custodyFiles.length > 0;
            const hasInvest = investFiles.length > 0;
            const found = [hasAccount && '账户管理合同', hasCustody && '托管合同', hasInvest && '投资管理合同'].filter(Boolean);
            const missing = [!hasAccount && '账户管理合同', !hasCustody && '托管合同', !hasInvest && '投资管理合同'].filter(Boolean);
            const matchedFiles = [...accountFiles, ...custodyFiles, ...investFiles];
            return {
                status: (hasAccount && hasCustody && hasInvest) ? 'pass' : 'rectify',
                fact: found.length ? `已识别到：${found.join('、')}。` : '未识别到委托管理合同（账户/托管/投管）。',
                basis: '赣人社字〔2016〕7号 一（二）3。',
                suggestion: missing.length ? `请补充缺失的委托管理合同：${missing.join('、')}，并确保逐份签章。` : '三方合同齐备，请人工核对逐份签章。',
                sourceFiles: matchedFiles.length ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'A5',
        dim: 'A',
        title: '合同条款差异说明',
        level: 'B',
        description: '双方盖章，逐条列明与原合同/指引的差异。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /差异说明|差异.*对比/.test(f.name)).map(f => f.name);
            const hasDiff = /差异说明|条款差异|与原合同.*差异|与指引.*差异/.test(text) || matchedFiles.length > 0;
            const sourceFiles = matchedFiles.length ? matchedFiles : allFileNames;
            return {
                status: hasDiff ? 'pass' : 'rectify',
                fact: hasDiff ? '已识别到合同条款差异说明相关表述或文件。' : '未识别到合同条款差异说明。',
                basis: '赣人社字〔2016〕7号 一（二）3。',
                suggestion: '请补充双方盖章的合同条款差异说明，逐条列明与原合同/指引的差异。',
                sourceFiles
            };
        }
    },
    {
        id: 'A6',
        dim: 'A',
        title: '电子版',
        level: 'C',
        description: '合同正文 Word 版 + 签章页扫描件。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasDocx = files.some(f => /\.docx?$/i.test(f.name));
            const hasScan = files.some(f => /扫描|签章页|盖章页|扫描件/i.test(f.name));
            return {
                status: (hasDocx && hasScan) ? 'pass' : 'improve',
                fact: `${hasDocx ? '已' : '未'}识别到 Word 版文件；${hasScan ? '已' : '未'}识别到签章页扫描件。`,
                basis: '赣人社字〔2016〕7号 一（二）3。',
                suggestion: !(hasDocx && hasScan) ? '请同时提供合同正文 Word 版及签章页扫描件。' : '电子版材料已齐备。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A7',
        dim: 'A',
        title: '备案情况登记表',
        level: 'B',
        description: '附件1 全项填写、盖章，收费标准/合同期限/份额比例与合同一致。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /登记表|附件1/.test(f.name)).map(f => f.name);
            const hasForm = /备案情况登记表|登记表|附件1/.test(text) || matchedFiles.length > 0;
            const sourceFiles = matchedFiles.length ? matchedFiles : allFileNames;
            return {
                status: hasForm ? 'pass' : 'rectify',
                fact: hasForm ? '已识别到备案情况登记表（附件1）相关表述或文件。' : '未识别到备案情况登记表（附件1）。',
                basis: '赣人社字〔2016〕7号 附件1。',
                suggestion: '请补充附件1 备案情况登记表，确保全项填写、盖章，且收费标准/合同期限/份额比例与合同一致。',
                sourceFiles
            };
        }
    },
    {
        id: 'A8',
        dim: 'A',
        title: '理事会模式附加材料',
        level: 'C',
        description: '理事会章程、组成人员名单及简历。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasCouncil = /理事会|理事会章程|组成人员|简历/.test(text) || files.some(f => /理事会|组成人员/.test(f.name));
            const isCouncil = /理事会模式|企业年金理事会|理事会受托/.test(text);
            return {
                status: isCouncil ? (hasCouncil ? 'pass' : 'improve') : 'na',
                fact: isCouncil ? (hasCouncil ? '已识别到理事会章程或组成人员相关材料。' : '识别到理事会模式，但未发现理事会章程或组成人员名单及简历。') : '非理事会模式，本项不适用。',
                basis: '赣人社字〔2016〕7号 一（二）5。',
                suggestion: isCouncil && !hasCouncil ? '请补充理事会章程、组成人员名单及简历。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A9',
        dim: 'A',
        title: '资格证书与授权文件',
        level: 'B',
        description: '受托/账户/托管/投管资格在有效期内；证书记载的机构名称、法定代表人与签约主体不一致的，须附变更说明或登记通知书；以分支机构名义签约的，须附总行（总部）授权书。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /资格|资质|牌照|许可证|授权书/.test(f.name)).map(f => f.name);
            const hasQual = matchedFiles.length > 0;
            return {
                status: hasQual ? 'pass' : 'rectify',
                fact: hasQual ? `已识别到资格证书或资质类文件：${matchedFiles.join('、')}。` : '未识别到资格证书或资质类文件。',
                basis: '赣人社字〔2016〕7号 一（二）6。',
                suggestion: !hasQual
                    ? '请补充受托人、账户管理人、托管人、投资管理人资格证明文件。'
                    : '请核对资格证明是否在有效期内，主体名称是否与合同一致；如有变更或分支机构签约，请附变更说明/登记通知书/总行授权书。',
                sourceFiles: hasQual ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'A10',
        dim: 'A',
        title: '企业年金报送时限',
        level: 'B',
        description: '合同签订之日起 10 日内。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasDate = /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(text);
            return {
                status: 'rectify',
                fact: hasDate ? '材料中已发现日期信息，请人工核对合同签订日期与报送日期间隔是否在10日内。' : '未能自动识别日期信息，请人工核对企业年金是否在合同签订之日起10日内报送。',
                basis: '赣人社字〔2016〕7号 一（一）。',
                suggestion: '请核对企业年金备案材料是否在合同签订之日起10日内报送至人社部门。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A11',
        dim: 'A',
        title: '合同变更报送时限',
        level: 'B',
        description: '变化发生之日起 15 日内重新备案。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '报送时限需结合合同变更实际发生日期判断，请人工核对。',
                basis: '赣人社字〔2016〕7号 一（一）。',
                suggestion: '请核对合同变更是否在变化发生之日起15日内重新报送备案。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A12',
        dim: 'A',
        title: '职业年金报送时限',
        level: 'B',
        description: '签署之日起 15 个工作日内；受理后 15 个工作日内出确认函。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '职业年金报送时限及确认函出具时限需结合签署日期及受理回执判断，请人工核对。',
                basis: '赣人社发〔2018〕37号 第二十一条。',
                suggestion: '请核对职业年金是否在签署之日起15个工作日内报送，并确认受理后15个工作日内出具确认函。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A13',
        dim: 'A',
        title: '提前终止情形',
        level: 'C',
        description: '附委托人与原受托人协商终止合同的协议材料（格式无固定要求）；新合同正文已明确"原合同于本合同生效时终止"并由双方签章的，是否满足该要求，标"待请示"。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasTerm = /协商终止|终止协议|原合同.*终止|本合同生效时终止/.test(text);
            return {
                status: hasTerm ? 'improve' : 'rectify',
                fact: hasTerm ? '已识别到提前终止或原合同终止相关表述，请人工确认是否满足协商终止协议或新合同明确终止条款的要求。' : '未识别到提前终止情形的协议材料或新合同终止条款。',
                basis: '培训材料；2025-11-17 电话。',
                suggestion: '如属提前终止情形，请附委托人与原受托人协商终止合同的协议材料；或在新合同中明确"原合同于本合同生效时终止"并由双方签章。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'A14',
        dim: 'A',
        title: '跨文件一致性',
        level: 'B',
        description: '申请函、要素信息表、备案登记表、合同正文四者之间，计划名称、登记号、管理人、组合数量、合同期限与起止日、费率、业绩基准必须一致。任一处不一致，按 B 类补正要求更正后备案，不直接推定合同违规。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const items = ['计划名称', '登记号', '管理人', '组合数量', '合同期限', '起止日', '费率', '业绩基准'];
            const found = items.filter(i => text.includes(i));
            return {
                status: 'rectify',
                fact: `已识别到跨文件一致性关键字段中的 ${found.length}/${items.length} 项：${found.length ? found.join('、') : '未自动识别到关键字段'}。申请函、要素信息表、备案登记表、合同正文四者之间的上述信息必须完全一致，请人工逐项核对。`,
                basis: '赣人社字〔2016〕7号 一（二）3、附件1；要素信息表填表注。',
                suggestion: '请人工核对申请函、要素信息表、备案登记表、合同正文四者之间的计划名称、登记号、管理人、组合数量、合同期限与起止日、费率、业绩基准是否完全一致；任一处不一致，按B类补正要求更正后备案。',
                sourceFiles: allFileNames
            };
        }
    },

    // ==================== B组 合同期限 ====================
    {
        id: 'B1',
        dim: 'B',
        title: '期限下限',
        level: 'A',
        description: '合同期限 ≥ 3 年（51号文后签署的为硬性要求，不足即无法备案）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const termMatch = text.match(/(?:合同期限|有效期|期限).{0,30}(\d+)\s*年/);
            const years = termMatch ? parseInt(termMatch[1]) : 0;
            const hasTerm = years > 0;
            const is51After = /2025\s*年\s*9\s*月\s*12\s*日|2025-09-12/.test(text);
            const pass = hasTerm && years >= 3;
            return {
                status: pass ? 'pass' : 'fail',
                fact: hasTerm ? `识别到合同期限为 ${years} 年。${years < 3 ? '不足3年，不满足硬性要求。' : '满足≥3年的要求。'}` : '未能自动识别合同期限年限，请人工确认。',
                basis: '51号文二（一）；口径说明一。',
                suggestion: !hasTerm ? '请明确合同期限，并确保不少于3年。' : (years < 3 ? '合同期限不足3年，51号文后签署的无法备案，请修改合同期限。' : '合同期限满足≥3年要求，请继续核对其他条款。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'B2',
        dim: 'B',
        title: '过渡安排',
        level: 'B',
        description: '51号文（2025-09-12）前已完成招投标并签署的，可受理备案，但须 1 年内完成整改；有回冲管理费情形的除外，须立行立改。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '51号文过渡安排需结合合同签署日期及是否存在回冲管理费情形综合判断，请人工确认。',
                basis: '会议纪要 2025-11-19；培训材料。',
                suggestion: '如为51号文前已完成招投标并签署的合同，可受理备案但须1年内完成整改；存在回冲管理费情形的，须立行立改。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'B3',
        dim: 'B',
        title: '整改方式',
        level: 'B',
        description: '不得在原有合同上临时短期延长合同期限充数。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /临时延长|短期延长|临时.*延|原有合同.*延.*期限/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现"临时延长""短期延长"等疑似违规整改方式的表述。' : '未发现临时短期延长合同期限的违规表述。',
                basis: '口径说明一。',
                suggestion: bad ? '整改方式不得在原有合同上临时短期延长合同期限充数，请重新签订合规合同。' : '未发现明显违规，请继续核对。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'B4',
        dim: 'B',
        title: '新增组合/计划',
        level: 'B',
        description: '剩余合同期不足 3 年的，不得新增组合或计划；剩余期超过 3 年的，可新增期限超 3 年的组合，须有规则约定并说明新增资金来源合理性。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasNew = /新增组合|新增计划|新增.*组合|新增.*计划/.test(text);
            return {
                status: hasNew ? 'confirm' : 'na',
                fact: hasNew ? '识别到新增组合/计划相关表述，请人工确认剩余合同期是否超过3年及新增资金来源合理性。' : '未识别到新增组合或计划，本项不适用。',
                basis: '培训材料（合同期限）；会议纪要。',
                suggestion: hasNew ? '如剩余合同期不足3年，不得新增组合或计划；如超过3年，须有规则约定并说明新增资金来源合理性。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'B5',
        dim: 'B',
        title: '期限匹配',
        level: 'B',
        description: '投资管理合同期限不得超出受托合同剩余期限。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '投资管理合同期限与受托合同剩余期限的匹配关系需人工比对两份合同的具体期限条款。',
                basis: '培训材料。',
                suggestion: '请人工核对投资管理合同期限是否超出受托合同剩余期限。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'B6',
        dim: 'B',
        title: '特殊情形',
        level: 'C',
        description: '企业关停并转、停缴后补缴导致基金大幅增长等，可一事一议，须在意见中写明理由。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const special = /关停并转|停缴|补缴|基金大幅增长|一事一议/.test(text);
            return {
                status: special ? 'confirm' : 'na',
                fact: special ? '识别到企业关停并转、停缴后补缴或基金大幅增长等特殊情形表述，请人工确认是否一事一议并在意见中写明理由。' : '未识别到特殊情形，本项不适用。',
                basis: '会议纪要 2025-11-19。',
                suggestion: special ? '如属企业关停并转、停缴后补缴导致基金大幅增长等特殊情形，可一事一议，但须在审核意见中写明理由。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    // ==================== C组 合同的唯一有效性 ====================
    {
        id: 'C1',
        dim: 'C',
        title: '无替代性文件',
        level: 'A',
        description: '不存在以补充协议、考核办法、备忘录、邮件实质变更合同重要条款的情形。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /补充协议.*实质变更|考核办法.*实质变更|备忘录.*变更|邮件.*变更|另行约定.*与合同.*不一致/.test(text);
            const hasAlt = /补充协议|考核办法|备忘录|邮件.*约定/.test(text);
            return {
                status: bad ? 'fail' : (hasAlt ? 'confirm' : 'pass'),
                fact: bad ? '发现可能存在以补充协议、考核办法、备忘录或邮件实质变更合同重要条款的表述。' : (hasAlt ? '识别到补充协议、考核办法、备忘录或邮件等文件，请人工确认是否实质变更合同重要条款。' : '未发现明显的替代性文件或实质变更合同重要条款的表述。'),
                basis: '51号文三（七）；会议纪要。',
                suggestion: bad ? '请修正合同，不得通过补充协议、考核办法、备忘录、邮件等实质变更合同重要条款，否则不予备案。' : (hasAlt ? '请人工核对补充协议、考核办法、备忘录、邮件等内容是否实质变更合同重要条款。' : '请继续核查是否存在替代性文件。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'C2',
        dim: 'C',
        title: '业绩基准在合同内',
        level: 'A',
        description: '业绩基准、业绩目标写在合同正文，不得"另见考核办法"。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /业绩基准.*另见|业绩目标.*另见|详见.*考核办法|另见.*考核/.test(text);
            const hasBench = /业绩基准|业绩目标/.test(text);
            return {
                status: bad ? 'fail' : (hasBench ? 'pass' : 'rectify'),
                fact: bad ? '发现业绩基准或业绩目标"另见考核办法"等违规表述。' : (hasBench ? '合同正文中已发现业绩基准或业绩目标表述。' : '未在合同正文中识别到业绩基准或业绩目标。'),
                basis: '51号文二（一）；会议纪要。',
                suggestion: bad ? '业绩基准、业绩目标必须写在合同正文，不得"另见考核办法"，请修正。' : (hasBench ? '请核对业绩基准是否完整写在合同正文，而非引用外部文件。' : '请在合同正文中补充业绩基准、业绩目标条款。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'C3',
        dim: 'C',
        title: '无"详见"式表述',
        level: 'A',
        description: '合同中不出现"×××详见×××"，此类表述视为合同要件缺失。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /详见|详见.*附件|详见.*办法|详见.*制度/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现合同中出现"详见"式表述，此类表述视为合同要件缺失。' : '未发现合同中存在"详见"式表述。',
                basis: '会议纪要。',
                suggestion: bad ? '请删除合同中的"详见"式表述，将相关内容直接写入合同正文，否则视为合同要件缺失，不予备案。' : '未发现明显问题，请继续核查。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'C4',
        dim: 'C',
        title: '无阴阳合同',
        level: 'A',
        description: '报送文本与实际执行文本一致；无保底收益、利益输送承诺。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /保底收益|保证收益|承诺收益|利益输送|私下协议|阴阳合同/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现"保底收益""利益输送""保证收益"等疑似阴阳合同或违规承诺的表述。' : '未发现明显的保底收益、利益输送或阴阳合同表述。',
                basis: '51号文三（七）；35号文。',
                suggestion: bad ? '报送文本须与实际执行文本一致，严禁保底收益、利益输送承诺等阴阳合同行为，请修正后重新报送。' : '请继续核查报送文本与实际执行文本是否一致。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'C5',
        dim: 'C',
        title: '费率在合同内',
        level: 'A',
        description: '各项管理费的计提基数、费率、计提与支付时点均在合同正文约定。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /费率.*详见|费率.*另见|费用.*详见|费用.*另见/.test(text);
            const hasFee = /管理费|托管费|费率|计提基数|支付时点/.test(text);
            return {
                status: bad ? 'fail' : (hasFee ? 'pass' : 'rectify'),
                fact: bad ? '发现费率或费用"详见""另见"等违规表述，视为合同要件缺失。' : (hasFee ? '合同正文中已发现管理费、费率相关表述。' : '未在合同正文中识别到管理费、费率条款。'),
                basis: '11号令第四条；35号文 五（一）。',
                suggestion: bad ? '各项管理费的计提基数、费率、计提与支付时点均须在合同正文中直接约定，不得引用外部文件，请修正。' : (hasFee ? '请核对各项管理费的计提基数、费率、计提与支付时点是否均在合同正文中明确约定。' : '请在合同正文中补充各项管理费的计提基数、费率、计提与支付时点。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'C6',
        dim: 'C',
        title: '补充协议定位',
        level: 'B',
        description: '补充协议仅用于执行审核意见的修改，不得用于新增或弱化实体条款。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasSupp = /补充协议/.test(text);
            const bad = /补充协议.*新增|补充协议.*弱化|补充协议.*修改.*条款/.test(text);
            return {
                status: hasSupp ? (bad ? 'fail' : 'rectify') : 'na',
                fact: hasSupp ? (bad ? '发现补充协议可能用于新增或弱化实体条款的表述。' : '识别到补充协议，请人工确认是否仅用于执行审核意见的修改。') : '未识别到补充协议，本项不适用。',
                basis: '赣人社字〔2016〕7号 一（二）3。',
                suggestion: hasSupp ? '补充协议仅用于执行审核意见的修改，不得用于新增或弱化实体条款，请人工核对。' : '',
                sourceFiles: allFileNames
            };
        }
    },

    // ==================== D组 业绩基准 ====================
    {
        id: 'D1',
        dim: 'D',
        title: '唯一性',
        level: 'B',
        description: '一个计划（组合）只有一个业绩基准。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const benches = (text.match(/业绩基准|业绩目标|比较基准/g) || []).length;
            return {
                status: 'rectify',
                fact: `文本中识别到 ${benches} 处业绩基准/业绩目标/比较基准相关表述，请人工确认一个计划（组合）是否只约定了一个业绩基准。`,
                basis: '口径说明二（三）。',
                suggestion: '请人工核对一个计划（组合）是否只约定唯一一个业绩基准，不得设置多个基准。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'D2',
        dim: 'D',
        title: '明确性',
        level: 'B',
        description: '为确定数值或复合指数（如 3.5%、LPR、定存、国债、中债×80%+中证×20%），可计算、可验证。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasBench = /业绩基准|业绩目标|比较基准/.test(text);
            const hasValue = /\d+\.?\d*\s*%|LPR|定存|国债|中债|中证|沪深300|指数/.test(text);
            return {
                status: hasBench ? (hasValue ? 'pass' : 'rectify') : 'rectify',
                fact: hasBench ? (hasValue ? '已识别业绩基准条款及具体数值/指数/比较标的。' : '已识别业绩基准条款，但未发现具体数值或复合指数。') : '未识别到业绩比较基准条款。',
                basis: '会议纪要；口径说明二（二）。',
                suggestion: hasBench
                    ? (hasValue ? '请核对基准是否为可量化、可跟踪的市场指数或组合指标，并确保可计算、可验证。' : '请补充具体数值或复合指数（如3.5%、LPR、中债×80%+中证×20%），确保基准可计算、可验证。')
                    : '请补充业绩比较基准条款，明确比较标的、计算方式及适用周期。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'D3',
        dim: 'D',
        title: '非移动靶',
        level: 'B',
        description: '不得采用行业平均、同期同类排名、相对收益等动态基准（历史已确定值的除外）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /行业平均|同期同类排名|相对收益|动态基准|排名.*基准|同业比较/.test(text);
            const hasBench = /业绩基准|业绩目标/.test(text);
            return {
                status: bad ? 'fail' : (hasBench ? 'pass' : 'rectify'),
                fact: bad ? '发现"行业平均""同期同类排名""相对收益"等动态基准表述。' : (hasBench ? '未发现明显的动态基准表述。' : '未识别到业绩基准条款。'),
                basis: '会议纪要；培训材料。',
                suggestion: bad ? '业绩基准不得采用行业平均、同期同类排名、相对收益等动态基准（历史已确定值的除外），请修正为确定数值或复合指数。' : (hasBench ? '请继续核查基准是否为确定数值或复合指数，而非动态比较指标。' : '请补充业绩比较基准条款。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'D4',
        dim: 'D',
        title: '合理性',
        level: 'C',
        description: '结合资本市场实际与委托人风险偏好设定，不得明显过高、不得以不可能实现的基准变相末位淘汰。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '业绩基准的合理性需结合资本市场实际、委托人风险偏好及基准具体数值综合判断，请人工确认。',
                basis: '口径说明二（二）。',
                suggestion: '请人工核对业绩基准是否明显过高，或存在以不可能实现的基准变相末位淘汰的情形。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'D5',
        dim: 'D',
        title: '合同期内不变',
        level: 'B',
        description: '合同期内不得变更业绩基准；变更即需重签并重新备案。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /变更.*业绩基准|业绩基准.*变更|调整.*业绩基准|业绩基准.*调整/.test(text);
            const hasBench = /业绩基准|业绩目标/.test(text);
            return {
                status: bad ? 'fail' : (hasBench ? 'pass' : 'rectify'),
                fact: bad ? '发现合同期内变更或调整业绩基准的表述，变更即需重签并重新备案。' : (hasBench ? '未发现合同期内变更业绩基准的表述。' : '未识别到业绩基准条款。'),
                basis: '培训材料（合同期内变更条款）。',
                suggestion: bad ? '合同期内不得变更业绩基准，如确需变更，必须重签合同并重新备案，请修正。' : (hasBench ? '请继续核查合同是否明确业绩基准在合同期内保持不变。' : '请补充业绩比较基准条款。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'D6',
        dim: 'D',
        title: '与考核办法一致',
        level: 'B',
        description: '考核办法中的基准与合同一致，不得另设阈值。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasKpi = /考核办法|绩效考核|业绩考核/.test(text);
            return {
                status: hasKpi ? 'confirm' : 'na',
                fact: hasKpi ? '识别到考核办法相关表述，请人工确认考核办法中的业绩基准与合同正文是否一致，是否另设阈值。' : '未识别到考核办法，本项不适用。',
                basis: '51号文二（一）（二）。',
                suggestion: hasKpi ? '请人工核对考核办法中的业绩基准与合同正文是否完全一致，不得另设阈值。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    // ==================== E组 费率与费用结构 ====================
    {
        id: 'E1',
        dim: 'E',
        title: '结构简单',
        level: 'B',
        description: '浮动计收时只设"基本管理费 + 业绩报酬"两项；不得设第三类名目费用。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const feeTypes = (text.match(/管理费|托管费|业绩报酬|顾问费|咨询费|服务费|销售费|运营费/g) || []);
            const hasBasic = /基本管理费/.test(text);
            const hasPerf = /业绩报酬/.test(text);
            const hasThird = /顾问费|咨询费|服务费(?!.*托管)|销售费|运营费/.test(text);
            return {
                status: hasThird ? 'confirm' : ((hasBasic && hasPerf) ? 'pass' : 'rectify'),
                fact: `已识别到费用相关表述；${hasBasic ? '已' : '未'}发现"基本管理费"；${hasPerf ? '已' : '未'}发现"业绩报酬"；${hasThird ? '发现' : '未发现'}第三类名目费用。`,
                basis: '口径说明二（一）；会议纪要（审计整改）。',
                suggestion: hasThird
                    ? '浮动计收时只设"基本管理费+业绩报酬"两项，不得设顾问费、咨询费、销售费等第三类名目费用，请修正。'
                    : ((hasBasic && hasPerf) ? '费用结构符合要求，请继续核对费率及计提基础。' : '请确认浮动计收时是否只设"基本管理费+业绩报酬"两项，无第三类名目费用。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E2',
        dim: 'E',
        title: '基本管理费中性',
        level: 'B',
        description: '基本管理费只与受托/管理规模挂钩，不与业绩、净值、排名挂钩。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /基本管理费.*业绩|基本管理费.*净值|基本管理费.*排名|基本管理费.*收益/.test(text);
            const hasBasic = /基本管理费/.test(text);
            return {
                status: bad ? 'confirm' : (hasBasic ? 'pass' : 'rectify'),
                fact: bad ? '发现基本管理费与业绩、净值、排名等挂钩的表述。' : (hasBasic ? '未发现基本管理费与业绩/净值/排名挂钩的表述。' : '未识别到基本管理费相关条款。'),
                basis: '口径说明二（一）。',
                suggestion: bad ? '基本管理费只应与受托/管理规模挂钩，不得与业绩、净值、排名挂钩，请修正。' : (hasBasic ? '请继续核查基本管理费是否仅与管理规模挂钩。' : '请补充基本管理费条款，明确仅与管理规模挂钩。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E3',
        dim: 'E',
        title: '费率上限',
        level: 'A',
        description: '受托 ≤0.2%、托管 ≤0.2%、投管 ≤1.2%（年费率，按资产净值）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const rates = findRates(text);
            const highRates = rates.filter(r => r > 1.2);
            const trusteeHigh = /受托.*费率|受托.*管理费/.test(text) && rates.some(r => r > 0.2 && r <= 1.2);
            const custodyHigh = /托管.*费率|托管.*管理费/.test(text) && rates.some(r => r > 0.2 && r <= 1.2);
            const maxRate = rates.length ? Math.max(...rates) : 0;
            const hasFee = rates.length > 0;
            const fail = highRates.length > 0 || trusteeHigh || custodyHigh;
            return {
                status: fail ? 'fail' : (hasFee ? 'pass' : 'rectify'),
                fact: hasFee ? `识别到最高费率约为 ${maxRate}% 。${fail ? '存在疑似突破监管上限的费率。' : '未发现明显突破监管上限的费率。'}` : '未识别到具体费率数值。',
                basis: '11号令第五十五至五十八条；92号文第三十四条。',
                suggestion: fail
                    ? `费率突破监管上限（受托≤0.2%、托管≤0.2%、投管≤1.2%），请修正后重新备案。`
                    : (hasFee ? '请人工核对各管理人费率是否符合监管上限及招投标结果。' : '请补充具体费率数值，并确保受托≤0.2%、托管≤0.2%、投管≤1.2%。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E4',
        dim: 'E',
        title: '禁止回冲',
        level: 'A',
        description: '不得约定回冲、冲减、返还、减免基本管理费；合同中不出现"回冲""冲减"字样（结清表述可用"结算"）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /回冲|冲减|返还.*管理费|减免.*管理费|冲抵.*管理费/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现合同中存在"回冲""冲减""返还""减免"基本管理费的违规表述。' : '未发现"回冲""冲减""返还""减免"基本管理费的表述。',
                basis: '35号文；51号文三（七）；会议纪要。',
                suggestion: bad ? '合同中不得约定回冲、冲减、返还、减免基本管理费，不得出现"回冲""冲减"字样（结清表述可用"结算"），请修正后重新备案。' : '未发现明显违规，请继续核查费率结构。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E5',
        dim: 'E',
        title: '业绩报酬计提基础',
        level: 'A',
        description: '仅对超过业绩基准部分的超额收益计提；基准以下（含 0 至基准区间）不得计提任何业绩报酬。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /基准以下.*计提|0.*基准.*计提|未达基准.*报酬|负收益.*报酬|低于基准.*报酬/.test(text);
            const hasPerf = /业绩报酬|超额收益|超过.*基准/.test(text);
            return {
                status: bad ? 'fail' : (hasPerf ? 'pass' : 'rectify'),
                fact: bad ? '发现基准以下或负收益区间计提业绩报酬的违规表述。' : (hasPerf ? '已识别业绩报酬相关表述，未发现明显的违规计提基础。' : '未识别到业绩报酬计提基础相关条款。'),
                basis: '92号文；口径说明二（三）；2025-12-03、2025-12-11 电话。',
                suggestion: bad ? '业绩报酬仅可对超过业绩基准部分的超额收益计提；基准以下（含0至基准区间）不得计提任何业绩报酬，请修正。' : (hasPerf ? '请人工核对业绩报酬是否仅对超过业绩基准部分的超额收益计提，基准以下不得计提。' : '请补充业绩报酬计提基础条款，明确仅对超过业绩基准部分的超额收益计提。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E6',
        dim: 'E',
        title: '分档激励',
        level: 'B',
        description: '可在基准之上分档计提，但须以基准为唯一起点，不得在基准下设挂钩业绩的费用。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasTier = /分档|阶梯|超额.*分档|分档.*计提/.test(text);
            const bad = /基准.*以下.*分档|低于基准.*计提|分档.*基准以下/.test(text);
            return {
                status: hasTier ? (bad ? 'fail' : 'rectify') : 'na',
                fact: hasTier ? (bad ? '发现分档计提涉及基准以下的违规表述。' : '识别到分档/阶梯计提表述，请人工确认是否以基准为唯一起点。') : '未识别到分档激励相关表述，本项不适用。',
                basis: '口径说明二（三）。',
                suggestion: hasTier ? '可在基准之上分档计提业绩报酬，但须以基准为唯一起点，不得在基准下设挂钩业绩的费用，请人工核对。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E7',
        dim: 'E',
        title: '计提期间',
        level: 'B',
        description: '业绩报酬只能在当期合同期计提并结算，不得跨合同期计提或结算。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /跨合同期|跨期.*计提|跨期.*结算|下期.*计提|下期.*结算/.test(text);
            const hasPeriod = /业绩报酬.*合同期|当期.*计提|当期.*结算/.test(text);
            return {
                status: bad ? 'confirm' : (hasPeriod ? 'pass' : 'rectify'),
                fact: bad ? '发现业绩报酬跨合同期计提或结算的违规表述。' : (hasPeriod ? '已识别业绩报酬在当期合同期计提结算的相关表述。' : '未识别到业绩报酬计提期间相关条款。'),
                basis: '会议纪要。',
                suggestion: bad ? '业绩报酬只能在当期合同期计提并结算，不得跨合同期计提或结算，请修正。' : (hasPeriod ? '请继续核查业绩报酬是否明确仅在当期合同期计提并结算。' : '请补充业绩报酬计提期间条款，明确仅在当期合同期计提并结算。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E8',
        dim: 'E',
        title: '托管费',
        level: 'B',
        description: '固定费率；不得以业绩评价、绩效评估为依据向托管人计提额外报酬或扣减托管费。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /托管费.*绩效|托管费.*业绩|托管费.*评价|扣减.*托管费|托管.*额外报酬/.test(text);
            const hasCustodyFee = /托管费/.test(text);
            return {
                status: bad ? 'confirm' : (hasCustodyFee ? 'pass' : 'rectify'),
                fact: bad ? '发现托管费与业绩评价、绩效评估挂钩或扣减托管费的违规表述。' : (hasCustodyFee ? '已识别托管费相关表述，未发现明显的违规挂钩。' : '未识别到托管费相关条款。'),
                basis: '口径说明六；2025-12-11 电话。',
                suggestion: bad ? '托管费应为固定费率，不得以业绩评价、绩效评估为依据向托管人计提额外报酬或扣减托管费，请修正。' : (hasCustodyFee ? '请继续核查托管费是否为固定费率，无业绩挂钩。' : '请补充托管费条款，明确为固定费率。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E9',
        dim: 'E',
        title: '养老金产品',
        level: 'C',
        description: '提示项，不作不予备案依据。部基金监管局口径倾向把养老金产品纳入业绩报酬计算基数，但正式文件尚未见；合同若约定该部分资产不收基本管理费/业绩报酬，标 C 类提示并记入待明确事项，不判不通过。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasPension = /养老金产品|养老产品/.test(text);
            return {
                status: hasPension ? 'improve' : 'na',
                fact: hasPension ? '识别到养老金产品相关表述，本项为C类提示项，不作不予备案依据。' : '未识别到养老金产品相关表述，本项不适用。',
                basis: '培训材料；2025-12-11 电话。',
                suggestion: hasPension ? '合同若约定养老金产品部分资产不收基本管理费/业绩报酬，标C类提示并记入待明确事项，待正式文件印发后更新掌握。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E10',
        dim: 'E',
        title: '成本覆盖',
        level: 'C',
        description: '费率应覆盖运营成本、与风险匹配，不得以极低基本管理费换虚高业绩报酬。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const rates = findRates(text);
            const lowBase = rates.some(r => r < 0.05);
            const highPerf = /业绩报酬.*高|高额.*业绩报酬|极高.*业绩报酬/.test(text);
            return {
                status: (lowBase && highPerf) ? 'improve' : 'rectify',
                fact: (lowBase && highPerf) ? '识别到极低基本管理费搭配高额业绩报酬的疑似情形，标C类提示。' : '成本覆盖与费率合理性需结合具体金额及运营成本综合判断，请人工确认。',
                basis: '会议纪要；培训材料。',
                suggestion: '请人工核对费率是否覆盖运营成本、与风险匹配，是否存在以极低基本管理费换取虚高业绩报酬的情形。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E11',
        dim: 'E',
        title: '业绩报酬的计提基础（合同期区间）',
        level: 'A',
        description: '超额收益的计算应以合同期为区间：C0 取合同期期初净值、计算截止日取合同期期末；按年度预提的，须写明"按合同期清算、合同期结束后支付"，且合同期整体未达基准时不实际支付。若约定"按会计年度计提，当年年初 C0、当年年末 An"，即形成短周期取酬，标 C 类提示/待请示。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /按会计年度计提|当年年初.*当年年末|年度.*计提|年初.*C0|年末.*An/.test(text);
            const good = /按合同期清算|合同期结束后支付|合同期.*清算|合同期.*支付/.test(text);
            return {
                status: bad ? 'fail' : (good ? 'pass' : 'rectify'),
                fact: bad ? '发现"按会计年度计提""当年年初C0、当年年末An"等短周期取酬表述，形成短周期取酬。' : (good ? '已识别"按合同期清算、合同期结束后支付"的合规表述。' : '未明确识别业绩报酬计提区间约定，请人工确认。'),
                basis: '51号文二（一）（二）；口径说明二（一）（三）；2025-12-03 电话。',
                suggestion: bad
                    ? '超额收益计算应以合同期为区间，不得按会计年度短周期取酬；按年度预提的，须写明"按合同期清算、合同期结束后支付"，且合同期整体未达基准时不实际支付。'
                    : (good ? '请继续核查C0是否取合同期期初净值、计算截止日是否取合同期期末，且合同期整体未达基准时不实际支付。' : '请明确超额收益计算以合同期为区间，C0取合同期期初净值、计算截止日取合同期期末；按年度预提须写明"按合同期清算、合同期结束后支付"。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'E12',
        dim: 'E',
        title: '费用上限自洽',
        level: 'B',
        description: '合同约定"年度管理费（含基本管理费和业绩报酬）不超过 0.2% / 1.2% 上限"，且与该合同的基本管理费费率不冲突。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasCap = /年度管理费.*不超过|管理费.*上限|不超过.*0\.2%|不超过.*1\.2%/.test(text);
            return {
                status: hasCap ? 'confirm' : 'improve',
                fact: hasCap ? '已识别到年度管理费上限约定，请人工确认上限数值与基本管理费费率是否自洽、不冲突。' : '未识别到明确的年度管理费（含基本管理费和业绩报酬）上限约定。',
                basis: '11号令第五十五至五十八条；92号文第三十四条。',
                suggestion: '建议合同明确约定"年度管理费（含基本管理费和业绩报酬）不超过0.2%/1.2%上限"，并确保与该合同的基本管理费费率不冲突。',
                sourceFiles: allFileNames
            };
        }
    },
    // ==================== F组 考核与淘汰 ====================
    {
        id: 'F1',
        dim: 'F',
        title: '考核周期',
        level: 'B',
        description: '以合同期为考核周期，考核办法含 3 年以上中长期指标及定量指标。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasCycle = /合同期.*考核|考核.*合同期|中长期指标|3年以上.*指标/.test(text);
            const bad = /年度.*考核|季度.*考核|半年.*考核|月度.*考核/.test(text);
            return {
                status: hasCycle ? 'pass' : (bad ? 'confirm' : 'rectify'),
                fact: hasCycle ? '已识别到以合同期为考核周期及中长期指标相关表述。' : (bad ? '发现以年度/季度/半年/月度为考核周期的表述，与以合同期为考核周期的要求不符。' : '未明确识别考核周期约定，请人工确认。'),
                basis: '51号文二（二）。',
                suggestion: hasCycle ? '请继续核查考核办法是否含3年以上中长期指标及定量指标。' : (bad ? '考核应以合同期为周期，不得仅以年度/季度/半年/月度为考核周期，请修正并补充3年以上中长期指标及定量指标。' : '请明确考核以合同期为周期，并包含3年以上中长期指标及定量指标。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F2',
        dim: 'F',
        title: '数据期间',
        level: 'B',
        description: '不得使用上一合同期数据作为本期考核依据。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /上一合同期.*考核|上期.*考核依据|上期数据.*本期|历史.*合同期.*考核/.test(text);
            return {
                status: bad ? 'confirm' : 'pass',
                fact: bad ? '发现使用上一合同期数据作为本期考核依据的违规表述。' : '未发现使用上一合同期数据作为本期考核依据的表述。',
                basis: '会议纪要。',
                suggestion: bad ? '不得使用上一合同期数据作为本期考核依据，请修正考核办法。' : '未发现明显违规，请继续核查考核数据期间。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F3',
        dim: 'F',
        title: '年度评价口径',
        level: 'B',
        description: '按自然年度或合同运行满 12 个月；第一次年度评价后只能调增量，不能调存量。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasYear = /自然年度|满12个月|年度评价|运行满/.test(text);
            const hasAdjust = /调增量|不能调存量|只调增量|不调存量/.test(text);
            return {
                status: (hasYear && hasAdjust) ? 'pass' : 'rectify',
                fact: `${hasYear ? '已' : '未'}识别到自然年度或合同运行满12个月的表述；${hasAdjust ? '已' : '未'}识别到只能调增量不能调存量的表述。`,
                basis: '口径说明五。',
                suggestion: '请人工核对年度评价是否按自然年度或合同运行满12个月进行；第一次年度评价后是否只能调增量，不能调存量。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F4',
        dim: 'F',
        title: '调整窗口',
        level: 'B',
        description: '增量比例与存量结构只能在年度评价后约定窗口期内调整，非窗口期不得调整（重大过失等非业绩原因除外）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasWindow = /窗口期|调整窗口|约定.*调整.*期/.test(text);
            return {
                status: hasWindow ? 'pass' : 'rectify',
                fact: hasWindow ? '已识别到窗口期/调整窗口相关表述。' : '未识别到明确的调整窗口期约定。',
                basis: '口径说明五（二）。',
                suggestion: hasWindow ? '请人工核对增量比例与存量结构是否仅在年度评价后约定窗口期内调整，非窗口期不得调整。' : '请补充增量比例与存量结构调整窗口期条款，明确非窗口期不得调整（重大过失等非业绩原因除外）。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F5',
        dim: 'F',
        title: '淘汰前提',
        level: 'B',
        description: '达到业绩基准的，原则上不实施淘汰，且不得另设与业绩相关条件淘汰。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /达到基准.*淘汰|基准.*淘汰|另设.*业绩.*淘汰/.test(text);
            const good = /达到基准.*不淘汰|未达基准.*淘汰|达到.*基准.*原则上.*不淘汰/.test(text);
            return {
                status: bad ? 'confirm' : (good ? 'pass' : 'rectify'),
                fact: bad ? '发现达到业绩基准仍实施淘汰或另设与业绩相关条件淘汰的违规表述。' : (good ? '已识别到达到基准原则上不淘汰的相关表述。' : '未明确识别淘汰前提条件。'),
                basis: '口径说明三（一）。',
                suggestion: bad ? '达到业绩基准的，原则上不实施淘汰，且不得另设与业绩相关条件淘汰，请修正。' : (good ? '请继续核查是否明确达到基准原则上不淘汰，且无另设业绩相关淘汰条件。' : '请明确达到业绩基准的，原则上不实施淘汰，且不得另设与业绩相关条件淘汰。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F6',
        dim: 'F',
        title: '淘汰条件',
        level: 'B',
        description: '未达基准方可启动淘汰论证；附加条件不得含相对排名。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /排名.*淘汰|相对排名|末位淘汰|排名.*退出/.test(text);
            const good = /未达基准.*淘汰|未达.*基准.*论证/.test(text);
            return {
                status: bad ? 'confirm' : (good ? 'pass' : 'rectify'),
                fact: bad ? '发现以相对排名、末位淘汰作为淘汰条件的违规表述。' : (good ? '已识别到未达基准方可启动淘汰的相关表述。' : '未明确识别淘汰条件。'),
                basis: '口径说明三（二）。',
                suggestion: bad ? '淘汰附加条件不得含相对排名、末位淘汰，仅未达基准方可启动淘汰论证，请修正。' : (good ? '请继续核查淘汰条件是否仅基于未达基准，且附加条件不含相对排名。' : '请明确未达基准方可启动淘汰论证，附加条件不得含相对排名。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F7',
        dim: 'F',
        title: '提前考核',
        level: 'B',
        description: '启动时间不得早于合同期满前 3 个月，且须在合同或考核办法中事先约定；提前考核的续约/淘汰与剩余期业绩回撤的处理规则须写明。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasEarly = /提前考核|期满前.*考核|提前.*评价/.test(text);
            const hasRule = /剩余期.*回撤|业绩回撤|提前考核.*规则/.test(text);
            return {
                status: hasEarly ? (hasRule ? 'pass' : 'rectify') : 'na',
                fact: hasEarly ? (hasRule ? '已识别提前考核及剩余期业绩回撤处理规则。' : '识别到提前考核表述，但未发现剩余期业绩回撤处理规则。') : '未识别到提前考核相关表述，本项不适用。',
                basis: '口径说明四。',
                suggestion: hasEarly ? '如约定提前考核，启动时间不得早于合同期满前3个月，且须在合同或考核办法中事先约定；提前考核的续约/淘汰与剩余期业绩回撤的处理规则须写明。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F8',
        dim: 'F',
        title: '短期业绩约束',
        level: 'A',
        description: '不得以一年（含）以内短期业绩调减存量资金（违法违规造成损失除外）；不得频繁调度、约谈、警告。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /一年.*业绩.*调减|短期业绩.*调减|半年.*业绩.*调减|季度.*业绩.*调减|频繁调度|约谈|警告/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现以一年（含）以内短期业绩调减存量资金或频繁调度、约谈、警告的违规表述。' : '未发现以短期业绩调减存量资金或频繁调度、约谈、警告的表述。',
                basis: '51号文二（四）。',
                suggestion: bad ? '不得以一年（含）以内短期业绩调减存量资金（违法违规造成损失除外），不得频繁调度、约谈、警告，请修正。' : '未发现明显违规，请继续核查考核与资金调整条款。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F9',
        dim: 'F',
        title: '指标传导',
        level: 'A',
        description: '不得将委托人不合理的考核指标（如资金投向特定地区）传导给投资管理人。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /资金投向.*地区|投向特定|地方政府.*指标|地方.*考核.*传导/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现可能存在将委托人不合理考核指标（如资金投向特定地区）传导给投资管理人的表述。' : '未发现明显的不合理指标传导表述。',
                basis: '会议纪要。',
                suggestion: bad ? '不得将委托人不合理的考核指标（如资金投向特定地区）传导给投资管理人，请修正合同或考核办法。' : '未发现明显违规，请继续核查考核指标设置。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F10',
        dim: 'F',
        title: '涉险资产',
        level: 'B',
        description: '淘汰须妥善处理涉险资产，不得留有余量；有风险的可改为存量资金调整。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasRisky = /涉险资产|风险资产|留有余量|存量资金.*调整/.test(text);
            return {
                status: hasRisky ? 'confirm' : 'na',
                fact: hasRisky ? '识别到涉险资产或存量资金调整相关表述，请人工确认淘汰时是否妥善处理涉险资产。' : '未识别到涉险资产相关表述，本项不适用。',
                basis: '口径说明三（三）；会议纪要。',
                suggestion: hasRisky ? '淘汰须妥善处理涉险资产，不得留有余量；有风险的可改为存量资金调整，请人工核对相关安排。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'F11',
        dim: 'F',
        title: '淘汰豁免约定',
        level: 'C',
        description: '合同宜约定"触发淘汰条款但合同期最终累计（或年化）收益达到业绩基准的，可豁免淘汰"，并写明由评选委员会审议的程序；缺该约定的标 C 类提示。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasExempt = /豁免淘汰|达到基准.*豁免|累计收益.*基准.*豁免|评选委员会/.test(text);
            return {
                status: hasExempt ? 'pass' : 'improve',
                fact: hasExempt ? '已识别到淘汰豁免或评选委员会审议程序的相关表述。' : '未识别到淘汰豁免约定及评选委员会审议程序。',
                basis: '口径说明四；培训材料。',
                suggestion: hasExempt ? '请继续核查淘汰豁免条款是否完整，是否写明由评选委员会审议的程序。' : '建议合同补充约定：触发淘汰条款但合同期最终累计（或年化）收益达到业绩基准的，可豁免淘汰，并写明由评选委员会审议的程序。',
                sourceFiles: allFileNames
            };
        }
    },
    // ==================== G组 合同效力、生效时间与空档期 ====================
    {
        id: 'G1',
        dim: 'G',
        title: '生效条款',
        level: 'A',
        description: '双方签章即生效；不得约定"经人社部门备案后生效"。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /经人社.*备案.*生效|备案后生效|备案.*后.*生效|以备案为生效条件/.test(text);
            const good = /双方签章.*生效|签字盖章.*生效|签章.*生效|自.*生效|本合同.*生效/.test(text);
            return {
                status: bad ? 'fail' : (good ? 'pass' : 'rectify'),
                fact: bad ? '发现"经人社部门备案后生效"的违规表述。' : (good ? '已识别到生效条款表述，未发现以备案为生效条件的违规内容。' : '未明确识别合同生效条款。'),
                basis: '培训材料；民法典 465、502 条。',
                suggestion: bad ? '合同应约定双方签章即生效，不得约定"经人社部门备案后生效"，请修正。' : (good ? '请继续核查生效条款是否明确为双方签章即生效，无备案前置条件。' : '请补充合同生效条款，明确双方签章即生效，不得约定以人社部门备案为生效条件。'),
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'G2',
        dim: 'G',
        title: '有效期表述',
        level: 'C',
        description: '优先写具体起止日期（自×年×月×日至×年×月×日）；合同正文写"自生效之日起×年"，但要素信息表或备案登记表已载明具体起止日的，标 C 类提示改进，不单独作为不予备案理由。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasExact = /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日至\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/.test(text);
            const hasRelative = /自生效之日起\s*\d+\s*年|自.*生效.*之日起.*年/.test(text);
            return {
                status: (hasExact || hasRelative) ? (hasExact ? 'pass' : 'improve') : 'improve',
                fact: hasExact ? '合同已写明具体起止日期。' : (hasRelative ? '合同正文写"自生效之日起×年"，未写明具体起止日期。' : '未识别到明确的有效期起止表述。'),
                basis: '培训材料。',
                suggestion: hasExact ? '有效期表述合规。' : '建议优先在合同正文中写明具体起止日期（自×年×月×日至×年×月×日）；如要素信息表或备案登记表已载明具体起止日，标C类提示改进，不单独作为不予备案理由。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'G3',
        dim: 'G',
        title: '空档期',
        level: 'B',
        description: '原合同到期至新合同生效期间无真空；须提供空档期双方权利义务约定的证明文件归档备查。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasGap = /空档期|过渡期|临时.*管理|代管|资产交接|权利义务.*空档/.test(text);
            return {
                status: hasGap ? 'pass' : 'rectify',
                fact: hasGap ? '已识别到空档期/过渡期/资产交接相关表述。' : '未识别到空档期双方权利义务约定的相关条款。',
                basis: '培训材料；会议纪要。',
                suggestion: hasGap ? '请继续核查空档期安排是否充分保障资产安全，相关证明文件是否归档备查。' : '请补充空档期双方权利义务约定，确保原合同到期至新合同生效期间无真空，并提供证明文件归档备查。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'G4',
        dim: 'G',
        title: '报送及时性',
        level: 'B',
        description: '备案材料提交时间与合同签署时间间隔合理；不得向前追溯（如 1 月签署、12 月报备）。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '报送及时性需结合合同签署日期与备案材料提交日期综合判断，请人工核对。',
                basis: '会议纪要；培训材料。',
                suggestion: '请人工核对备案材料提交时间与合同签署时间间隔是否合理，不得向前追溯（如1月签署、12月报备）。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'G5',
        dim: 'G',
        title: '生效日倒签',
        level: 'B',
        description: '签署日与生效日不得倒挂（如 2 月签署、生效日回溯至上年 8 月），存在法律风险。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            return {
                status: 'rectify',
                fact: '签署日与生效日是否倒挂需人工比对合同中的签署日期与生效日期。',
                basis: '2026-01-16 电话。',
                suggestion: '请人工核对合同签署日与生效日不得倒挂（如2月签署、生效日回溯至上年8月），避免法律风险。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'G6',
        dim: 'G',
        title: '退出与终止',
        level: 'B',
        description: '明确合同终止、管理人退出、资产移交安排。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasTerm = /合同终止|终止.*安排|管理人.*退出|退出.*安排|资产移交|移交.*资产/.test(text);
            return {
                status: hasTerm ? 'pass' : 'rectify',
                fact: hasTerm ? '已识别到合同终止、管理人退出或资产移交相关表述。' : '未识别到明确的合同终止、管理人退出、资产移交安排。',
                basis: '11号令；92号文。',
                suggestion: hasTerm ? '请继续核查合同终止、管理人退出、资产移交安排是否完整、明确。' : '请补充合同终止、管理人退出、资产移交的具体安排条款。',
                sourceFiles: allFileNames
            };
        }
    },

    // ==================== H组 主体资格与管理人设置 ====================
    {
        id: 'H1',
        dim: 'H',
        title: '资格有效',
        level: 'A',
        description: '各管理人具备相应年金基金管理资格且在有效期内。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /资格|资质|牌照|备案证明|金融许可证/.test(f.name)).map(f => f.name);
            const qualification = matchedFiles.length > 0;
            return {
                status: qualification ? 'pass' : 'fail',
                fact: qualification ? `已识别管理人资格/资质类文件：${matchedFiles.join('、')}。` : '未识别管理人资格证明文件。',
                basis: '11号令第七十八条；92号文第三条。',
                suggestion: qualification
                    ? '请核对资格证明是否在有效期内，主体名称是否与合同一致。'
                    : '请补充受托人、账户管理人、托管人、投资管理人资格证明文件，否则不予备案。',
                sourceFiles: qualification ? matchedFiles : allFileNames
            };
        }
    },
    {
        id: 'H2',
        dim: 'H',
        title: '岗位分离',
        level: 'A',
        description: '同一计划中受托人与托管人、托管人与投管人不得为同一机构。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const trusteeMatch = text.match(/受托人[：:]\s*([^\n；。]+)/);
            const custodyMatch = text.match(/托管人[：:]\s*([^\n；。]+)/);
            const investMatch = text.match(/投资管理人[：:]\s*([^\n；。]+)/);
            const trustee = trusteeMatch ? trusteeMatch[1].trim() : '';
            const custody = custodyMatch ? custodyMatch[1].trim() : '';
            const invest = investMatch ? investMatch[1].trim() : '';
            const sameTC = trustee && custody && trustee === custody;
            const sameCI = custody && invest && custody === invest;
            return {
                status: (sameTC || sameCI) ? 'fail' : 'pass',
                fact: (sameTC || sameCI)
                    ? `发现同一机构兼任不同管理岗位的疑似情形：${sameTC ? '受托人与托管人为同一机构' : ''}${sameTC && sameCI ? '；' : ''}${sameCI ? '托管人与投管人为同一机构' : ''}。`
                    : '未发现同一计划中受托人与托管人、托管人与投管人为同一机构的明显表述。',
                basis: '92号文第七条。',
                suggestion: (sameTC || sameCI)
                    ? '同一计划中受托人与托管人、托管人与投管人不得为同一机构，请更换管理人后重新备案。'
                    : '请人工核对各管理人是否为不同机构，确保岗位分离。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'H3',
        dim: 'H',
        title: '人员兼任',
        level: 'A',
        description: '相关高级管理人员与从业人员不得相互兼任。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const bad = /人员兼任|高管兼任|相互兼任|兼职|同一人员.*兼任/.test(text);
            return {
                status: bad ? 'fail' : 'pass',
                fact: bad ? '发现人员兼任或高管相互兼任的表述。' : '未发现明显的人员兼任表述。',
                basis: '92号文第七条。',
                suggestion: bad ? '相关高级管理人员与从业人员不得相互兼任，请调整人员安排后重新备案。' : '请人工核对相关高级管理人员与从业人员是否存在实际兼任情形。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'H4',
        dim: 'H',
        title: '计划结构',
        level: 'A',
        description: '一个职业年金计划只有一个受托人、一个托管人；投管人数量与规模匹配。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const trustees = (text.match(/受托人/g) || []).length;
            const custodians = (text.match(/托管人/g) || []).length;
            const hasMulti = /多个受托|多家受托|多个托管|多家托管/.test(text);
            return {
                status: hasMulti ? 'fail' : 'pass',
                fact: hasMulti ? '发现存在多个受托人或多个托管人的表述。' : '未发现存在多个受托人或多个托管人的明显表述。',
                basis: '92号文第四条。',
                suggestion: hasMulti ? '一个职业年金计划只能有一个受托人、一个托管人，请修正计划结构后重新备案。' : '请人工核对计划结构是否为一个受托人、一个托管人，投管人数量与规模匹配。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'H5',
        dim: 'H',
        title: '签约主体',
        level: 'B',
        description: '职业年金由代理人（省级社保经办机构）代理委托签约；企业年金由企业或理事会签约。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasAgent = /代理人|省级社保经办机构|代理委托|社保.*代理/.test(text);
            const hasEnterprise = /企业.*签约|理事会.*签约|企业年金.*企业|委托人.*企业/.test(text);
            return {
                status: (hasAgent || hasEnterprise) ? 'pass' : 'rectify',
                fact: hasAgent ? '已识别到职业年金由代理人代理委托签约的相关表述。' : (hasEnterprise ? '已识别到企业年金由企业或理事会签约的相关表述。' : '未明确识别签约主体。'),
                basis: '92号文第五条；11号令。',
                suggestion: (hasAgent || hasEnterprise) ? '请继续核查签约主体是否符合规定（职业年金由省级社保经办机构代理，企业年金由企业或理事会签约）。' : '请明确签约主体：职业年金应由代理人（省级社保经办机构）代理委托签约；企业年金由企业或理事会签约。',
                sourceFiles: allFileNames
            };
        }
    },
    // ==================== I组 江西省地方要求 ====================
    {
        id: 'I1',
        dim: 'I',
        title: '备案登记表',
        level: 'B',
        description: '附件1 完整，收费标准、合同期限、份额比例与合同逐项一致；日期字段为可读日期（不得留 Excel 序列号）；"合同备案文号及日期"栏在出函前留空，不得填写受托人申请函文号；各组合份额比例合计为 1。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const matchedFiles = files.filter(f => /登记表|附件1/.test(f.name)).map(f => f.name);
            const hasForm = /备案登记表|附件1|收费标准|份额比例|合同备案文号/.test(text) || matchedFiles.length > 0;
            const sourceFiles = matchedFiles.length ? matchedFiles : allFileNames;
            return {
                status: hasForm ? 'confirm' : 'rectify',
                fact: hasForm ? '已识别到备案登记表（附件1）相关表述或文件，请人工逐项核对填写规范。' : '未识别到备案登记表（附件1）。',
                basis: '赣人社字〔2016〕7号 附件1。',
                suggestion: '请补充附件1备案登记表，并确保：收费标准、合同期限、份额比例与合同逐项一致；日期字段为可读日期（不得留Excel序列号）；"合同备案文号及日期"栏在出函前留空；各组合份额比例合计为1。',
                sourceFiles
            };
        }
    },
    {
        id: 'I2',
        dim: 'I',
        title: '集合计划数据（非备案事项）',
        level: 'C',
        description: '省厅不办理集合计划备案；仅按赣人社字〔2016〕7号 三 接收省内企业加入/退出集合计划的月度情况简表，作为统计资料，不进入备案审核流程。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasCollection = /集合计划|加入.*集合|退出.*集合|月度情况简表/.test(text);
            return {
                status: hasCollection ? 'improve' : 'na',
                fact: hasCollection ? '识别到集合计划相关表述，本项为C类提示，不进入备案审核流程。' : '未识别到集合计划相关表述，本项不适用。',
                basis: '赣人社字〔2016〕7号 三。',
                suggestion: hasCollection ? '省厅不办理集合计划备案，仅需按赣人社字〔2016〕7号三接收省内企业加入/退出集合计划的月度情况简表，作为统计资料。' : '',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'I3',
        dim: 'I',
        title: '数据报送',
        level: 'C',
        description: '半年报 7月20日前、年报次年1月20日前。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasReport = /半年报|年报|7月20日|1月20日|数据报送|定期报告/.test(text);
            return {
                status: hasReport ? 'improve' : 'improve',
                fact: hasReport ? '识别到定期报告/数据报送相关表述，请人工确认报送时间是否符合要求。' : '未识别到数据报送相关表述。',
                basis: '赣人社字〔2016〕7号 二。',
                suggestion: '请确保半年报于7月20日前、年报于次年1月20日前报送。',
                sourceFiles: allFileNames
            };
        }
    },
    {
        id: 'I4',
        dim: 'I',
        title: '台账',
        level: 'C',
        description: '建立监督台账，记录备案、整改、问题标签。',
        check(text, files, fileMap) {
            const allFileNames = getAllFileNames(files);
            const hasLedger = /监督台账|台账|备案.*记录|整改.*记录/.test(text);
            return {
                status: hasLedger ? 'pass' : 'improve',
                fact: hasLedger ? '已识别到监督台账或备案/整改记录相关表述。' : '未识别到监督台账相关表述。',
                basis: '会议纪要；培训材料。',
                suggestion: hasLedger ? '请继续核查监督台账是否完整记录备案、整改、问题标签。' : '建议建立监督台账，记录备案、整改、问题标签。',
                sourceFiles: allFileNames
            };
        }
    }
];

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AUDIT_DIMENSIONS, AUDIT_RULES, REQUIRED_MATERIALS };
}
