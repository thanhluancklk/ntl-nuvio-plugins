const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, 'providers');

const payload = `
;(function() {
    var originalExports = module.exports;
    var originalGetStreams = originalExports.getStreams || (originalExports.default && originalExports.default.getStreams);
    if (!originalGetStreams) return;

    function checkAliveMobile(url, headers) {
        return new Promise(function(resolve) {
            var fetchOpts = { 
                method: 'GET', 
                headers: Object.assign({}, headers || {}) 
            };
            // Mẹo: Chỉ tải 1 byte đầu tiên của video để test, không bị CDN chặn như method HEAD
            fetchOpts.headers['Range'] = 'bytes=0-1';

            var timeoutId = setTimeout(function() {
                resolve(false);
            }, 3000);

            // Kiểm tra an toàn xem môi trường có hỗ trợ AbortController không
            if (typeof AbortController !== 'undefined') {
                var controller = new AbortController();
                fetchOpts.signal = controller.signal;
                clearTimeout(timeoutId);
                timeoutId = setTimeout(function() {
                    controller.abort();
                    resolve(false);
                }, 3000);
            }

            fetch(url, fetchOpts).then(function(res) {
                clearTimeout(timeoutId);
                // Chấp nhận 200 (OK), 206 (Partial), và các mã lỗi nhẹ dưới 404
                resolve(res.status >= 200 && res.status < 404);
            }).catch(function() {
                clearTimeout(timeoutId);
                resolve(false);
            });
        });
    }

    function overrideGetStreams() {
        var args = arguments;
        return Promise.resolve(originalGetStreams.apply(this, args)).then(function(rawStreams) {
            if (!rawStreams || !rawStreams.length) return [];
            
            var bestStreams = {};
            var checkPromises = [];

            rawStreams.forEach(function(stream) {
                var quality = stream.quality || 'Unknown';
                var p = checkAliveMobile(stream.url, stream.headers).then(function(isAlive) {
                    if (isAlive && !bestStreams[quality]) {
                        bestStreams[quality] = stream;
                    }
                });
                checkPromises.push(p);
            });

            return Promise.all(checkPromises).then(function() {
                var results = [];
                for (var k in bestStreams) {
                    results.push(bestStreams[k]);
                }
                
                // BẢO HIỂM: Nếu Ping giết sạch link, tự động lấy 1 link/1 độ phân giải từ danh sách gốc
                if (results.length === 0) {
                    var fallback = {};
                    rawStreams.forEach(function(stream) {
                        var q = stream.quality || 'Unknown';
                        if (!fallback[q]) fallback[q] = stream;
                    });
                    for (var f in fallback) {
                        results.push(fallback[f]);
                    }
                }
                
                return results;
            });
        }).catch(function(err) {
            return [];
        });
    }

    if (originalExports.getStreams) {
        originalExports.getStreams = overrideGetStreams;
    } else if (originalExports.default && originalExports.default.getStreams) {
        originalExports.default.getStreams = overrideGetStreams;
    }
})();
`;

if (fs.existsSync(providersDir)) {
    const files = fs.readdirSync(providersDir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(providersDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('checkAliveMobile')) {
                content += '\n' + payload;
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}
