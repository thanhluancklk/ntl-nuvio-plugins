const fs = require('fs');
const path = require('path');

const providersDir = path.join(__dirname, 'providers');

const payload = `
;(function() {
    var originalExports = module.exports;
    var originalGetStreams = originalExports.getStreams || (originalExports.default && originalExports.default.getStreams);
    if (!originalGetStreams) return;

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

    function parseQuality(stream) {
        var text = [stream.quality, stream.name, stream.title, stream.description].join(' ').toLowerCase();
        if (text.indexOf('4k') > -1 || text.indexOf('2160') > -1 || text.indexOf('uhd') > -1) return '4K';
        if (text.indexOf('1080') > -1 || text.indexOf('fhd') > -1) return '1080p';
        if (text.indexOf('720') > -1 || (text.indexOf('hd') > -1 && text.indexOf('uhd') === -1 && text.indexOf('fhd') === -1)) return '720p';
        if (text.indexOf('480') > -1 || text.indexOf('sd') > -1) return '480p';
        return 'Unknown';
    }

    function overrideGetStreams() {
        var args = arguments;
        var context = this;
        
        return Promise.resolve().then(function() {
            return originalGetStreams.apply(context, args);
        }).then(function(rawStreams) {
            if (!rawStreams || !rawStreams.length) return [];
            
            var bestStreams = {};
            
            for (var i = 0; i < rawStreams.length; i++) {
                var stream = rawStreams[i];
                var quality = parseQuality(stream);
                var sizeMB = parseSizeToMB(stream.size || stream.title || stream.name || stream.description);
                
                stream.quality = quality;

                if (!bestStreams[quality]) {
                    bestStreams[quality] = { stream: stream, sizeMB: sizeMB };
                } else {
                    if (sizeMB > bestStreams[quality].sizeMB) {
                        bestStreams[quality] = { stream: stream, sizeMB: sizeMB };
                    }
                }
            }
            
            var results = [];
            var order = { '4K': 1, '1080p': 2, '720p': 3, '480p': 4, 'Unknown': 99 };
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
    
    module.exports = newExports;
})();
`;

if (fs.existsSync(providersDir)) {
    const files = fs.readdirSync(providersDir);
    files.forEach(file => {
        if (file.endsWith('.js')) {
            const filePath = path.join(providersDir, file);
            let content = fs.readFileSync(filePath, 'utf8');
            if (!content.includes('overrideGetStreams')) {
                content += '\n' + payload;
                fs.writeFileSync(filePath, content, 'utf8');
            }
        }
    });
}
