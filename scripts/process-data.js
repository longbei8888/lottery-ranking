// 龍北俱樂部數據處理腳本
// 用於將Excel文件轉換為JSON格式，供GitHub Pages使用
// 
// 重要規則：
// 1. 只計算現金桌（Cash Game）手牌數
// 2. SNG（坐滿即玩錦標賽）不參與活動積分計算
// 3. MTT（多桌錦標賽）不參與活動積分計算
// 4. MAU BINH、PUSOY、十三支都使用 ×0.6 權重

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 模式倍率設定
const modeWeights = {
    'NLH': 1.0,
    'PLO': 1.0,
    '十三支': 0.6,
    '13Poker': 0.6,
    'MAU BINH': 0.6,  // MAU BINH 也是十三支
    'PUSOY': 0.6,     // PUSOY 也是十三支變種
    'OFC': 0.7,
    'AoF': 0.3
};

// 俱樂部配置
const clubConfigs = {
    'flower': {
        name: '花順龍北🌸',
        identifier: '花順龍北',
        filePattern: /flower|花順|xp.*龍北/i
    },
    'taiwan': {
        name: '寶島龍北🇹🇼',
        identifier: '寶島龍北',
        filePattern: /taiwan|寶島|formosa/i
    },
    'black': {
        name: '黑海龍北♠️',
        identifier: '黑海龍北',
        filePattern: /black|黑海|black.*sea/i
    }
};

/**
 * 處理花順龍北的數據格式（有Local和Super分欄）
 */
function processFlowerClubData(row, player, clubName) {
    let score = 0;
    
    // NLH (Local + Super) - 通常在列4和32
    const nlhLocal = Number(row[4]) || 0;
    const nlhSuper = Number(row[32]) || 0;
    const nlhTotal = nlhLocal + nlhSuper;
    if (nlhTotal > 0) {
        player.breakdown['NLH'] = (player.breakdown['NLH'] || 0) + nlhTotal;
        score += nlhTotal * modeWeights.NLH;
    }
    
    // AoF (Local + Super) - 通常在列5和33
    const aofLocal = Number(row[5]) || 0;
    const aofSuper = Number(row[33]) || 0;
    const aofTotal = aofLocal + aofSuper;
    if (aofTotal > 0) {
        player.breakdown['AoF'] = (player.breakdown['AoF'] || 0) + aofTotal;
        score += aofTotal * modeWeights.AoF;
    }
    
    // PLO4 (Local + Super) - 通常在列7和35
    const plo4Local = Number(row[7]) || 0;
    const plo4Super = Number(row[35]) || 0;
    const plo4Total = plo4Local + plo4Super;
    if (plo4Total > 0) {
        player.breakdown['PLO4'] = (player.breakdown['PLO4'] || 0) + plo4Total;
        score += plo4Total * modeWeights.PLO;
    }
    
    // PLO5 (Local + Super) - 通常在列8和36
    const plo5Local = Number(row[8]) || 0;
    const plo5Super = Number(row[36]) || 0;
    const plo5Total = plo5Local + plo5Super;
    if (plo5Total > 0) {
        player.breakdown['PLO5'] = (player.breakdown['PLO5'] || 0) + plo5Total;
        score += plo5Total * modeWeights.PLO;
    }
    
    // PLO6 (Local + Super) - 通常在列9和37
    const plo6Local = Number(row[9]) || 0;
    const plo6Super = Number(row[37]) || 0;
    const plo6Total = plo6Local + plo6Super;
    if (plo6Total > 0) {
        player.breakdown['PLO6'] = (player.breakdown['PLO6'] || 0) + plo6Total;
        score += plo6Total * modeWeights.PLO;
    }
    
    // OFC (Local + Super) - 通常在列20和47
    const ofcLocal = Number(row[20]) || 0;
    const ofcSuper = Number(row[47]) || 0;
    const ofcTotal = ofcLocal + ofcSuper;
    if (ofcTotal > 0) {
        player.breakdown['OFC'] = (player.breakdown['OFC'] || 0) + ofcTotal;
        score += ofcTotal * modeWeights.OFC;
    }
    
    // MAU BINH (Local + Super) - 通常在列21和48
    const mauBinhLocal = Number(row[21]) || 0;
    const mauBinhSuper = Number(row[48]) || 0;
    const mauBinhTotal = mauBinhLocal + mauBinhSuper;
    if (mauBinhTotal > 0) {
        player.breakdown['MAU BINH'] = (player.breakdown['MAU BINH'] || 0) + mauBinhTotal;
        score += mauBinhTotal * modeWeights['MAU BINH'];
    }
    
    // PUSOY (Local + Super) - 通常在列22和49
    const pusoyLocal = Number(row[22]) || 0;
    const pusoySuper = Number(row[49]) || 0;
    const pusoyTotal = pusoyLocal + pusoySuper;
    if (pusoyTotal > 0) {
        player.breakdown['PUSOY'] = (player.breakdown['PUSOY'] || 0) + pusoyTotal;
        score += pusoyTotal * modeWeights.PUSOY;
    }
    
    // 十三支 (Local + Super) - 通常在列23和50
    const pokerLocal = Number(row[23]) || 0;
    const pokerSuper = Number(row[50]) || 0;
    const pokerTotal = pokerLocal + pokerSuper;
    if (pokerTotal > 0) {
        player.breakdown['十三支'] = (player.breakdown['十三支'] || 0) + pokerTotal;
        score += pokerTotal * modeWeights['十三支'];
    }
    
    // 注意：只計算現金桌手牌數，排除所有SNG和MTT
    
    return score;
}

/**
 * 處理標準俱樂部數據格式（寶島龍北、黑海龍北）
 */
function processStandardClubData(row, player, clubName) {
    let score = 0;
    
    // NLH - 通常在列3
    const nlh = Number(row[3]) || 0;
    if (nlh > 0) {
        player.breakdown['NLH'] = (player.breakdown['NLH'] || 0) + nlh;
        score += nlh * modeWeights.NLH;
    }
    
    // AoF-NLH - 通常在列4
    const aofNlh = Number(row[4]) || 0;
    if (aofNlh > 0) {
        player.breakdown['AoF'] = (player.breakdown['AoF'] || 0) + aofNlh;
        score += aofNlh * modeWeights.AoF;
    }
    
    // 6+ - 通常在列5
    const sixPlus = Number(row[5]) || 0;
    if (sixPlus > 0) {
        player.breakdown['6+'] = (player.breakdown['6+'] || 0) + sixPlus;
        score += sixPlus * modeWeights.NLH; // 6+ 使用NLH權重
    }
    
    // PLO4 - 通常在列6
    const plo4 = Number(row[6]) || 0;
    if (plo4 > 0) {
        player.breakdown['PLO4'] = (player.breakdown['PLO4'] || 0) + plo4;
        score += plo4 * modeWeights.PLO;
    }
    
    // PLO5 - 通常在列7
    const plo5 = Number(row[7]) || 0;
    if (plo5 > 0) {
        player.breakdown['PLO5'] = (player.breakdown['PLO5'] || 0) + plo5;
        score += plo5 * modeWeights.PLO;
    }
    
    // PLO6 - 通常在列8
    const plo6 = Number(row[8]) || 0;
    if (plo6 > 0) {
        player.breakdown['PLO6'] = (player.breakdown['PLO6'] || 0) + plo6;
        score += plo6 * modeWeights.PLO;
    }
    
    // AoF-PLO4 - 通常在列10
    const aofPlo4 = Number(row[10]) || 0;
    if (aofPlo4 > 0) {
        player.breakdown['AoF'] = (player.breakdown['AoF'] || 0) + aofPlo4;
        score += aofPlo4 * modeWeights.AoF;
    }
    
    // AoF-PLO5 - 通常在列11
    const aofPlo5 = Number(row[11]) || 0;
    if (aofPlo5 > 0) {
        player.breakdown['AoF'] = (player.breakdown['AoF'] || 0) + aofPlo5;
        score += aofPlo5 * modeWeights.AoF;
    }
    
    // SNG-NLH - 通常在列14（只計算SNG，排除MTT）
    const sngNlh = Number(row[14]) || 0;
    if (sngNlh > 0) {
        player.breakdown['SNG-NLH'] = (player.breakdown['SNG-NLH'] || 0) + sngNlh;
        score += sngNlh * modeWeights.NLH;
    }
    
    // SNG-PLO4 - 通常在列16（只計算SNG，排除MTT）
    const sngPlo4 = Number(row[16]) || 0;
    if (sngPlo4 > 0) {
        player.breakdown['SNG-PLO4'] = (player.breakdown['SNG-PLO4'] || 0) + sngPlo4;
        score += sngPlo4 * modeWeights.PLO;
    }
    
    // SNG-PLO5 - 通常在列18（只計算SNG，排除MTT）
    const sngPlo5 = Number(row[18]) || 0;
    if (sngPlo5 > 0) {
        player.breakdown['SNG-PLO5'] = (player.breakdown['SNG-PLO5'] || 0) + sngPlo5;
        score += sngPlo5 * modeWeights.PLO;
    }
    
    // 注意：所有MTT相關的手牌數都不計入活動積分
    // MTT-NLH (列15)、MTT-PLO4 (列17)、MTT-PLO5 (列19) 等都排除
    
    // OFC - 通常在列28
    const ofc = Number(row[28]) || 0;
    if (ofc > 0) {
        player.breakdown['OFC'] = (player.breakdown['OFC'] || 0) + ofc;
        score += ofc * modeWeights.OFC;
    }
    
    // MAU BINH - 通常在列29
    const mauBinh = Number(row[29]) || 0;
    if (mauBinh > 0) {
        player.breakdown['MAU BINH'] = (player.breakdown['MAU BINH'] || 0) + mauBinh;
        score += mauBinh * modeWeights['MAU BINH'];
    }
    
    // PUSOY - 通常在列30
    const pusoy = Number(row[30]) || 0;
    if (pusoy > 0) {
        player.breakdown['PUSOY'] = (player.breakdown['PUSOY'] || 0) + pusoy;
        score += pusoy * modeWeights.PUSOY;
    }
    
    // 十三支/13Poker - 通常在列31
    const poker13 = Number(row[31]) || 0;
    if (poker13 > 0) {
        player.breakdown['十三支'] = (player.breakdown['十三支'] || 0) + poker13;
        score += poker13 * modeWeights['十三支'];
    }
    
    // Flash/NLH - 通常在列37
    const flashNlh = Number(row[37]) || 0;
    if (flashNlh > 0) {
        player.breakdown['NLH'] = (player.breakdown['NLH'] || 0) + flashNlh;
        score += flashNlh * modeWeights.NLH;
    }
    
    return score;
}

/**
 * 自動識別俱樂部類型
 */
function identifyClubType(filePath, worksheetData) {
    const fileName = path.basename(filePath).toLowerCase();
    
    // 優先根據檔案名稱判斷
    for (const [clubType, config] of Object.entries(clubConfigs)) {
        if (config.filePattern.test(fileName)) {
            return clubType;
        }
    }
    
    // 如果檔案名稱無法判斷，嘗試從工作表內容判斷
    if (worksheetData && worksheetData.length > 2) {
        const clubInfoRow = worksheetData[2]; // 第3行通常包含俱樂部資訊
        if (clubInfoRow && typeof clubInfoRow[0] === 'string') {
            const clubInfo = clubInfoRow[0].toLowerCase();
            
            for (const [clubType, config] of Object.entries(clubConfigs)) {
                if (clubInfo.includes(config.identifier)) {
                    return clubType;
                }
            }
        }
    }
    
    // 預設為花順龍北
    console.log(`無法識別俱樂部類型，檔案: ${filePath}，使用預設值: flower`);
    return 'flower';
}

/**
 * 處理單個Excel文件
 */
function processExcelFile(filePath, allPlayers) {
    console.log(`處理檔案: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`檔案不存在: ${filePath}`);
        return 0;
    }
    
    try {
        const workbook = XLSX.readFile(filePath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // 自動識別俱樂部類型
        const clubType = identifyClubType(filePath, jsonData);
        const clubInfo = clubConfigs[clubType];
        
        console.log(`識別為: ${clubInfo.name}`);
        
        let processedCount = 0;
        
        // 尋找數據開始行（通常從第4行開始，但可能會有變化）
        let dataStartRow = 3;
        for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i];
            if (row && row[0] && row[1] && typeof row[1] === 'number' && row[1] > 1000) {
                dataStartRow = i;
                break;
            }
        }
        
        console.log(`數據開始行: ${dataStartRow + 1}`);
        
        // 處理玩家數據
        for (let i = dataStartRow; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || !row[0] || !row[1]) continue;
            
            const playerName = String(row[0]).trim();
            const playerId = Number(row[1]);
            
            if (!playerName || !playerId || playerId < 1000) continue;
            
            const playerKey = playerId; // 使用ID作為唯一標識
            
            if (!allPlayers.has(playerKey)) {
                allPlayers.set(playerKey, {
                    name: playerName,
                    id: playerId,
                    clubs: [],
                    totalHands: 0,
                    breakdown: {},
                    score: 0
                });
            }
            
            const player = allPlayers.get(playerKey);
            
            // 更新玩家名稱（以最新的為準）
            player.name = playerName;
            
            // 添加俱樂部（避免重複）
            if (!player.clubs.includes(clubInfo.name)) {
                player.clubs.push(clubInfo.name);
            }
            
            // 計算積分
            let additionalScore = 0;
            const handsBefore = player.totalHands;
            
            if (clubType === 'flower') {
                additionalScore = processFlowerClubData(row, player, clubInfo.name);
            } else {
                additionalScore = processStandardClubData(row, player, clubInfo.name);
            }
            
            player.score += additionalScore;
            player.totalHands += Number(row[2]) || 0;
            
            // 驗證數據合理性
            if (player.totalHands > handsBefore) {
                processedCount++;
            }
        }
        
        console.log(`${clubInfo.name} 處理完成，共 ${processedCount} 位玩家`);
        return processedCount;
        
    } catch (error) {
        console.error(`處理 ${filePath} 時發生錯誤:`, error.message);
        return 0;
    }
}

/**
 * 主要處理函數
 */
function processAllData(inputDir, outputPath) {
    console.log('開始處理龍北俱樂部數據...');
    console.log(`輸入目錄: ${inputDir}`);
    console.log(`輸出路徑: ${outputPath}`);
    
    const allPlayers = new Map();
    let totalProcessed = 0;
    
    // 確保輸入目錄存在
    if (!fs.existsSync(inputDir)) {
        console.error(`輸入目錄不存在: ${inputDir}`);
        return null;
    }
    
    // 獲取所有Excel檔案
    const files = fs.readdirSync(inputDir).filter(file => 
        file.match(/\.(xlsx|xls)$/i)
    );
    
    if (files.length === 0) {
        console.error(`在 ${inputDir} 目錄中未找到Excel檔案`);
        return null;
    }
    
    console.log(`找到 ${files.length} 個Excel檔案:`, files);
    
    // 處理每個Excel檔案
    for (const file of files) {
        const filePath = path.join(inputDir, file);
        const count = processExcelFile(filePath, allPlayers);
        totalProcessed += count;
    }
    
    if (allPlayers.size === 0) {
        console.error('未處理到任何玩家數據');
        return null;
    }
    
    // 轉換為陣列並排序
    const playerArray = Array.from(allPlayers.values());
    const sortedPlayers = playerArray.sort((a, b) => b.score - a.score);
    
    // 計算統計資訊
    const stats = {
        totalPlayers: sortedPlayers.length,
        totalRecords: totalProcessed,
        maxScore: sortedPlayers.length > 0 ? sortedPlayers[0].score : 0,
        minScore: sortedPlayers.length > 0 ? sortedPlayers[sortedPlayers.length - 1].score : 0,
        avgScore: sortedPlayers.length > 0 ? 
            sortedPlayers.reduce((sum, p) => sum + p.score, 0) / sortedPlayers.length : 0
    };
    
    // 生成最終JSON數據
    const outputData = {
        lastUpdate: new Date().toISOString(),
        lastUpdateLocal: new Date().toLocaleString('zh-TW', { 
            timeZone: 'Asia/Taipei',
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit', 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        totalPlayers: stats.totalPlayers,
        totalRecords: stats.totalRecords,
        stats: stats,
        eventInfo: {
            startDate: '2025-06-02',
            endDate: '2025-06-29',
            drawDate: '2025-07-05',
            timezone: 'Asia/Taipei'
        },
        modeWeights: modeWeights,
        clubInfo: Object.values(clubConfigs).map(config => ({
            name: config.name,
            identifier: config.identifier
        })),
        players: sortedPlayers.slice(0, 200) // 保留前200名
    };
    
    // 確保輸出目錄存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 寫入JSON檔案
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log('\n=== 處理完成 ===');
    console.log(`總玩家數: ${stats.totalPlayers}`);
    console.log(`總處理記錄: ${stats.totalRecords}`);
    console.log(`最高積分: ${stats.maxScore.toFixed(1)}`);
    console.log(`平均積分: ${stats.avgScore.toFixed(1)}`);
    console.log(`輸出檔案: ${outputPath}`);
    
    if (sortedPlayers.length > 0) {
        console.log('\n=== 前10名玩家 ===');
        sortedPlayers.slice(0, 10).forEach((player, index) => {
            const clubsStr = player.clubs.join(', ');
            const breakdownStr = Object.entries(player.breakdown)
                .filter(([mode, hands]) => hands > 0)
                .map(([mode, hands]) => `${mode}:${hands}`)
                .join(' | ');
            console.log(`${(index + 1).toString().padStart(2, '0')}. ${player.name} (ID: ${player.id})`);
            console.log(`    俱樂部: ${clubsStr}`);
            console.log(`    積分: ${player.score.toFixed(1)} | 手牌: ${player.totalHands}`);
            console.log(`    明細: ${breakdownStr}`);
            console.log('');
        });
    }
    
    return outputData;
}

// 如果直接執行此腳本
if (require.main === module) {
    // 命令行參數
    const args = process.argv.slice(2);
    const inputDir = args[0] || './excel_files';
    const outputPath = args[1] || './data/ranking.json';
    
    try {
        const result = processAllData(inputDir, outputPath);
        if (!result) {
            console.error('數據處理失敗');
            process.exit(1);
        }
        console.log('✅ 數據處理成功完成！');
    } catch (error) {
        console.error('❌ 執行失敗:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = {
    processAllData,
    modeWeights,
    clubConfigs,
    processExcelFile
};