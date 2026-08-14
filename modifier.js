const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const TARGET_PLUGINS = ['goated', 'videasy', 'cinefreak', '4khdhub', 'uhdmovies', 'netmirro', 'onlykdrama'];

const filterLogic = `
function parseSizeToMB(sizeStr) {
    if (!sizeStr) return 0;
    const match = String(sizeStr).match(/([\\d.]+)\\s*(GB|MB|KB)/i);
    if (!match) return 0;
    const val = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === 'GB') return val * 1024;
    if (unit === 'MB') return val;
    if (unit === 'KB') return val / 1024;
    return 0;
}

export async function getStreams(tmdbId, mediaType, season, episode) {
    try {
        console.log(\`[SmartFilter] Bắt đầu cào dữ liệu cho TMDB: \${tmdbId} | Type: \${mediaType}\`);
        const rawStreams = await originalGetStreams(tmdbId, mediaType, season, episode);
        
        if (!rawStreams || !rawStreams.length) {
            console.log(\`[SmartFilter] Không tìm thấy luồng thô nào.\`);
            return [];
        }

        console.log(\`[SmartFilter] Nhận được \${rawStreams.length} luồng thô. Bắt đầu lọc...\`);

        const bestStreams = {};
        for (const stream of rawStreams) {
            const quality = stream.quality || 'Unknown';
            const sizeMB = parseSizeToMB(stream.size || stream.title || stream.name || stream.description);

            if (!bestStreams[quality]) {
                bestStreams[quality] = { stream, sizeMB };
            } else {
                if (sizeMB > bestStreams[quality].sizeMB) {
                    bestStreams[quality] = { stream, sizeMB };
                }
            }
        }

        const results = [];
        const order = { '4K': 1, '2160p': 1, '1080p': 2, '720p': 3, '480p': 4, 'Unknown': 99 };
        const keys = Object.keys(bestStreams).sort((a, b) => (order[a] || 99) - (order[b] || 99));

        for (const key of keys) {
            const best = bestStreams[key];
            console.log(\`[SmartFilter] Giữ lại: [\${key}] - Size: \${best.sizeMB.toFixed(2)} MB - URL: \${best.stream.url}\`);
            results.push(best.stream);
        }

        console.log(\`[SmartFilter] Hoàn tất! Trả về \${results.length} luồng phát tốt nhất.\`);
        return results;
    } catch (err) {
        console.error("[SmartFilter] Lỗi trong quá trình lọc:", err);
        return [];
    }
}
`;

if (fs.existsSync(srcDir)) {
    TARGET_PLUGINS.forEach(provider => {
        const indexPath = path.join(srcDir, provider, 'index.js');
        if (fs.existsSync(indexPath)) {
            let content = fs.readFileSync(indexPath, 'utf8');
            
            if (content.includes('export async function getStreams')) {
                content = content.replace('export async function getStreams', 'async function originalGetStreams');
                content += '\n' + filterLogic;
                fs.writeFileSync(indexPath, content, 'utf8');
                console.log(`[Modifier] Đã bơm bộ lọc vào: ${provider}`);
            } else if (content.includes('export function getStreams')) {
                content = content.replace('export function getStreams', 'async function originalGetStreams');
                content += '\n' + filterLogic;
                fs.writeFileSync(indexPath, content, 'utf8');
                console.log(`[Modifier] Đã bơm bộ lọc vào: ${provider}`);
            }
        }
    });
}
