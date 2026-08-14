const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, 'providers');

const payload = `
(function() {
    var originalExports = module.exports;
    var originalGetStreams = originalExports.getStreams || (originalExports.default && originalExports.default.getStreams);
    if (!originalGetStreams) return;

    function checkAliveMobile(url, headers) {
        return new Promise(function(resolve) {
            var controller = new AbortController();
            var timeoutId = setTimeout(function() {
                controller.abort();
                resolve(false);
            }, 3000);

            fetch(url, {
                method: 'HEAD',
                headers: headers || {},
                signal: controller.signal
            }).then(function(res) {
                clearTimeout(timeoutId);
                resolve(res.status === 200 || res.status === 206 || res.status === 403);
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
                return results;
            });
        }).catch(function() {
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
