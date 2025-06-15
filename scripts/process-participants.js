// 活動一參與者數據處理腳本（修正版）
// 用於處理社群分享抽獎的參與者名單

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

/**
 * 從CSV檔案載入參與者數據（支援Google試算表格式）
 */
function loadParticipantsFromCSV(csvPath) {
    if (!fs.existsSync(csvPath)) {
        console.error(`CSV檔案不存在: ${csvPath}`);
        return [];
    }
    
    try {
        const csvContent = fs.readFileSync(csvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());
        const participants = [];
        
        console.log(`處理CSV檔案: ${csvPath}`);
        console.log(`總行數: ${lines.length}`);
        
        if (lines.length < 2) {
            console.error('CSV檔案格式錯誤：至少需要標題行和一行數據');
            return [];
        }
        
        // 解析標題行（第一行）
        const headers = parseCSVLine(lines[0]);
        console.log('檔案標題:', headers);
        
        // 尋找相關欄位的位置（更精確的匹配）
        const colIndexes = {
            lineAccount: findColumnIndex(headers, ['LINE帳號']),
            username: findColumnIndex(headers, ['社群帳號']),
            instagram: findColumnIndex(headers, ['Instagram']),
            threads: findColumnIndex(headers, ['Threads'])
        };
        
        console.log('欄位對應:', colIndexes);
        
        // 驗證必要欄位
        if (colIndexes.username === -1) {
            console.error('找不到"社群帳號"欄位，請檢查CSV格式');
            return [];
        }
        
        if (colIndexes.instagram === -1 && colIndexes.threads === -1) {
            console.error('找不到"Instagram"或"Threads"欄位，請檢查CSV格式');
            return [];
        }
        
        console.log('\n開始處理數據行...');
        
        // 處理數據行（從第2行開始）
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = parseCSVLine(line);
            console.log(`\n處理第 ${i + 1} 行:`, cols);
            
            // 獲取各欄位值
            const lineAccount = cols[colIndexes.lineAccount] || '';
            const username = cols[colIndexes.username] || '';
            const instagramValue = colIndexes.instagram >= 0 ? (cols[colIndexes.instagram] || '') : '';
            const threadsValue = colIndexes.threads >= 0 ? (cols[colIndexes.threads] || '') : '';
            
            console.log(`LINE帳號: "${lineAccount}"`);
            console.log(`社群帳號: "${username}"`);
            console.log(`Instagram: "${instagramValue}"`);
            console.log(`Threads: "${threadsValue}"`);
            
            // 檢查社群帳號是否有效
            if (!username || !username.trim()) {
                console.log(`❌ 跳過：社群帳號為空`);
                continue;
            }
            
            // 檢查平台參與狀況
            const instagramChecked = isChecked(instagramValue);
            const threadsChecked = isChecked(threadsValue);
            
            console.log(`Instagram 勾選: ${instagramChecked}`);
            console.log(`Threads 勾選: ${threadsChecked}`);
            
            // 至少要參與一個平台
            if (!instagramChecked && !threadsChecked) {
                console.log(`❌ 跳過：${username} 沒有參與任何平台`);
                continue;
            }
            
            const participant = {
                id: participants.length + 1,
                username: username.replace('@', '').trim(),
                name: username.replace('@', '').trim(),
                instagram: instagramChecked,
                threads: threadsChecked,
                submitTime: new Date().toISOString(),
                status: 'registered'
            };
            
            participants.push(participant);
            console.log(`✅ 新增參與者: ${participant.username} (IG: ${participant.instagram ? '✅' : '❌'}, Threads: ${participant.threads ? '✅' : '❌'})`);
        }
        
        console.log(`\n成功載入 ${participants.length} 位參與者`);
        
        // 顯示平台統計
        const instagramCount = participants.filter(p => p.instagram).length;
        const threadsCount = participants.filter(p => p.threads).length;
        const bothCount = participants.filter(p => p.instagram && p.threads).length;
        console.log(`\n平台統計:`);
        console.log(`  - Instagram: ${instagramCount} 人`);
        console.log(`  - Threads: ${threadsCount} 人`);
        console.log(`  - 兩個平台都參與: ${bothCount} 人`);
        
        return participants;
        
    } catch (error) {
        console.error('處理CSV檔案時發生錯誤:', error.message);
        return [];
    }
}

/**
 * 檢查是否為勾選狀態（修正版）
 */
function isChecked(value) {
    if (!value) return false;
    const trimmed = value.toString().trim();
    // 支援多種勾選格式
    return trimmed === '✅' || 
           trimmed === '✓' || 
           trimmed === 'TRUE' || 
           trimmed === '1' || 
           trimmed.toLowerCase() === 'yes' || 
           trimmed.toLowerCase() === 'y';
}

/**
 * 尋找欄位索引（精確匹配版）
 */
function findColumnIndex(headers, possibleNames) {
    console.log(`尋找欄位: ${possibleNames.join(', ')}`);
    
    for (let i = 0; i < headers.length; i++) {
        const header = headers[i].trim();
        console.log(`  檢查 [${i}]: "${header}"`);
        
        for (const name of possibleNames) {
            // 使用精確匹配或包含匹配
            if (header === name || header.includes(name) || name.includes(header)) {
                console.log(`    ✅ 匹配: "${header}" 對應 "${name}"`);
                return i;
            }
        }
    }
    
    console.log(`    ❌ 未找到匹配的欄位`);
    return -1;
}

/**
 * 解析CSV行（處理逗號和引號）
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

/**
 * 從Excel檔案載入參與者數據
 */
function loadParticipantsFromExcel(excelPath) {
    if (!fs.existsSync(excelPath)) {
        console.error(`Excel檔案不存在: ${excelPath}`);
        return [];
    }
    
    try {
        console.log(`處理Excel檔案: ${excelPath}`);
        
        const workbook = XLSX.readFile(excelPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const participants = [];
        
        if (jsonData.length < 2) {
            console.error('Excel檔案格式錯誤：至少需要標題行和一行數據');
            return [];
        }
        
        const headers = jsonData[0];
        console.log('Excel標題:', headers);
        
        // 尋找欄位位置
        const colIndexes = {
            lineAccount: headers.findIndex(h => h && h.toString().includes('LINE')),
            username: headers.findIndex(h => h && h.toString().includes('社群帳號')),
            instagram: headers.findIndex(h => h && h.toString().includes('Instagram')),
            threads: headers.findIndex(h => h && h.toString().includes('Threads'))
        };
        
        console.log('Excel欄位對應:', colIndexes);
        
        // 處理數據行
        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;
            
            const username = colIndexes.username >= 0 ? (row[colIndexes.username] || '').toString().trim() : '';
            const instagramValue = colIndexes.instagram >= 0 ? (row[colIndexes.instagram] || '').toString().trim() : '';
            const threadsValue = colIndexes.threads >= 0 ? (row[colIndexes.threads] || '').toString().trim() : '';
            
            if (!username) continue;
            
            const instagramChecked = isChecked(instagramValue);
            const threadsChecked = isChecked(threadsValue);
            
            if (!instagramChecked && !threadsChecked) continue;
            
            const participant = {
                id: participants.length + 1,
                username: username.replace('@', '').trim(),
                name: username.replace('@', '').trim(),
                instagram: instagramChecked,
                threads: threadsChecked,
                submitTime: new Date().toISOString(),
                status: 'registered'
            };
            
            participants.push(participant);
        }
        
        console.log(`成功載入 ${participants.length} 位參與者`);
        return participants;
        
    } catch (error) {
        console.error('處理Excel檔案時發生錯誤:', error.message);
        return [];
    }
}

/**
 * 生成參與者JSON數據
 */
function generateParticipantsData(participants) {
    // 按ID排序
    const sortedParticipants = participants.sort((a, b) => a.id - b.id);
    
    // 統計各平台參與人數
    const platformStats = {
        instagram: participants.filter(p => p.instagram).length,
        threads: participants.filter(p => p.threads).length,
        both: participants.filter(p => p.instagram && p.threads).length,
        total: participants.length
    };
    
    return {
        lastUpdate: new Date().toISOString(),
        lastUpdateLocal: new Date().toLocaleString('zh-TW', {
            timeZone: 'Asia/Taipei',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }),
        totalParticipants: participants.length,
        platformStats: platformStats,
        prizeInfo: {
            totalPrizes: 14,
            prizeList: [
                { name: 'Apple iPad 11 2025 WiFi', value: 11490, quantity: 1 },
                { name: 'AirPods Pro 2', value: 7490, quantity: 1 },
                { name: '2000 遊戲幣', value: 2000, quantity: 3 },
                { name: '1000 遊戲幣', value: 1000, quantity: 4 },
                { name: '500 遊戲幣', value: 500, quantity: 5 }
            ]
        },
        drawInfo: {
            drawDate: '2025-07-05',
            drawPlatform: 'IG @longbei_poker',
            drawType: 'live_stream'
        },
        participants: sortedParticipants
    };
}

/**
 * 主要處理函數
 */
function processParticipants(inputPath, outputPath) {
    console.log('開始處理活動一參與者數據...');
    console.log(`輸入檔案: ${inputPath}`);
    console.log(`輸出路徑: ${outputPath}`);
    
    let participants = [];
    
    // 根據檔案副檔名決定處理方式
    const ext = path.extname(inputPath).toLowerCase();
    
    if (ext === '.csv') {
        participants = loadParticipantsFromCSV(inputPath);
    } else if (ext === '.xlsx' || ext === '.xls') {
        participants = loadParticipantsFromExcel(inputPath);
    } else {
        console.error('不支援的檔案格式，請使用CSV或Excel檔案');
        return null;
    }
    
    if (participants.length === 0) {
        console.error('未載入到任何參與者數據');
        return null;
    }
    
    // 生成最終數據
    const outputData = generateParticipantsData(participants);
    
    // 確保輸出目錄存在
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 寫入JSON檔案
    fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf8');
    
    console.log('\n=== 處理完成 ===');
    console.log(`總參與者: ${outputData.totalParticipants} 位`);
    console.log(`平台分佈:`);
    console.log(`  - Instagram: ${outputData.platformStats.instagram} 人`);
    console.log(`  - Threads: ${outputData.platformStats.threads} 人`);
    console.log(`  - 兩個平台都參與: ${outputData.platformStats.both} 人`);
    console.log(`輸出檔案: ${outputPath}`);
    
    // 顯示所有參與者
    if (participants.length > 0) {
        console.log('\n=== 參與者名單 ===');
        participants.forEach((participant, index) => {
            const platforms = [];
            if (participant.instagram) platforms.push('IG');
            if (participant.threads) platforms.push('Threads');
            
            console.log(`${(index + 1).toString().padStart(2, '0')}. ${participant.username} (${platforms.join(', ')})`);
        });
    }
    
    return outputData;
}

// 如果直接執行此腳本
if (require.main === module) {
    const args = process.argv.slice(2);
    const inputPath = args[0] || './participants.csv';
    const outputPath = args[1] || './data/participants.json';
    
    try {
        const result = processParticipants(inputPath, outputPath);
        if (!result) {
            console.error('參與者數據處理失敗');
            process.exit(1);
        }
        console.log('✅ 參與者數據處理成功完成！');
    } catch (error) {
        console.error('❌ 執行失敗:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

module.exports = {
    processParticipants,
    loadParticipantsFromCSV,
    loadParticipantsFromExcel,
    generateParticipantsData
};