const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const filterLogic = `
// --- INJECTED SMART FILTER ---
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
        const rawStreams = await originalGetStreams(tmdbId, mediaType, season, episode);
        if (!rawStreams || !rawStreams.length) return [];

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
            results.push(bestStreams[key].stream);
        }

        return results;
    } catch (err) {
        console.error("Filter Error:", err);
        return [];
    }
}
`;

if (fs.existsSync(srcDir)) {
    const providers = fs.readdirSync(srcDir);
    providers.forEach(provider => {
        const indexPath = path.join(srcDir, provider, 'index.js');
        if (fs.existsSync(indexPath)) {
            let content = fs.readFileSync(indexPath, 'utf8');
            
            // Đổi tên hàm gốc để nhường chỗ cho hàm lọc của chúng ta
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
