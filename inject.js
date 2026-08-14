const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, 'providers');

const payload = `
;(function() {
    var originalExports = module.exports;
    var originalGetStreams = originalExports.getStreams || (originalExports.default && originalExports.default.getStreams);
    if (!originalGetStreams) return;

    // Hàm bóc tách dung lượng (Size) thành Megabytes để so sánh
    function parseSizeToMB(sizeStr) {
        if (!sizeStr) return 0;
        var match = String(sizeStr).match(/([\\d.]+)\\s*(GB|MB|KB)/i);
        if (!match) return 0;
        var val = parseFloat(match[1]);
        var unit = match[2].toUpperCase();
        if (unit === 'GB') return val * 1024;
        if (unit === 'MB') return val;
        if (unit === 'KB') return val / 1024;
        return 0;
    }

    // Hàm đánh tráo logic
    function overrideGetStreams() {
        var args = arguments;
        var context = this;
        
        return Promise.resolve().then(function() {
            return originalGetStreams.apply(context, args);
        }).then(function(rawStreams) {
            if (!rawStreams || !rawStreams.length) return [];
            
            var bestStreams = {};
            
            // Lọc thông minh: Gom nhóm theo độ phân giải và giữ lại link nặng nhất
            for (var i = 0; i < rawStreams.length; i++) {
                var stream = rawStreams[i];
                var quality = stream.quality || 'Unknown';
                
                // Tìm dung lượng từ các trường có thể chứa nó
                var sizeMB = parseSizeToMB(stream.size || stream.title || stream.name || stream.description);
                
                if (!bestStreams[quality]) {
                    bestStreams[quality] = { stream: stream, sizeMB: sizeMB };
                } else {
                    if (sizeMB > bestStreams[quality].sizeMB) {
                        bestStreams[quality] = { stream: stream, sizeMB: sizeMB };
                    }
                }
            }
            
            var results = [];
            // Sắp xếp thứ tự hiển thị: 4K -> 1080p -> 720p -> 480p
            var order = { '4K': 1, '2160p': 1, '1080p': 2, '720p': 3, '480p': 4, 'Unknown': 99 };
            var keys = Object.keys(bestStreams);
            
            keys.sort(function(a, b) {
                var weightA = order[a] || 99;
                var weightB = order[b] || 99;
                return weightA - weightB;
            });

            for (var j = 0; j < keys.length; j++) {
                results.push(bestStreams[keys[j]].stream);
            }
            
            return results;
        }).catch(function(err) {
            return [];
        });
    }

    // ĐÁNH TRÁO OBJECT: Tạo một object hoàn toàn mới để lách luật khoá Getter của esbuild
    var newExports = {};
    
    for (var key in originalExports) {
        newExports[key] = originalExports[key];
    }
    
    if (originalExports.default) {
        newExports.default = {};
        for (var dKey in originalExports.default) {
            newExports.default[dKey] = originalExports.default[dKey];
        }
        if (newExports.default.getStreams) {
            newExports.default.getStreams = overrideGetStreams;
        }
    }
    
    if (newExports.getStreams) {
        newExports.getStreams = overrideGetStreams;
    }
    
    // Ghi đè toàn bộ module
    module.exports = newExports;
})();
`;

if (fs.existsSync(providersDir)) {
    const files = fs.readdirSync(providersDir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(providersDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            // Kiểm tra xem đã bơm code chưa để tránh bơm trùng lặp
            if (!content.includes('overrideGetStreams')) {
                content += '\n' + payload;
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}
