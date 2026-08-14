404: Not Found
;(function() {
    var originalExports = module.exports;
    var originalGetStreams = originalExports.getStreams || (originalExports.default && originalExports.default.getStreams);
    if (!originalGetStreams) return;
    function parseSizeToMB(sizeStr) {
        if (!sizeStr) return 0;
        var cleaned = String(sizeStr).replace(/,/g, '');
        var match = cleaned.match(/([\d.]+)\s*(GB|MB|KB|G|M|K)/i);
        if (!match) return 0;
        var val = parseFloat(match[1]);
        var unit = match[2].toUpperCase();
        if (unit === 'GB' || unit === 'G') return val * 1024;
        if (unit === 'MB' || unit === 'M') return val;
        if (unit === 'KB' || unit === 'K') return val / 1024;
        return 0;
    }
    function parseQuality(stream) {
        var text = (stream.quality + ' ' + stream.name + ' ' + stream.title + ' ' + stream.description).toLowerCase();
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
                var text = (stream.quality + ' ' + stream.name + ' ' + stream.title + ' ' + stream.description).toLowerCase();
                var sizeMB = parseSizeToMB(stream.size || stream.title || stream.name || stream.description);
                var score = sizeMB;
                if (text.indexOf('eng') > -1 || text.indexOf('english') > -1) score += 1000000;
                if (text.indexOf('dual') > -1 || text.indexOf('multi') > -1) score += 500000;
                if (text.indexOf('h265') > -1 || text.indexOf('hevc') > -1) score += 100000;
                stream.quality = quality;
                if (!bestStreams[quality] || score > bestStreams[quality].score) {
                    bestStreams[quality] = { stream: stream, score: score };
                }
            }
            if (bestStreams['4K'] && bestStreams['1080p']) {
                delete bestStreams['720p'];
                delete bestStreams['480p'];
            }
            var results = [];
            var order = ['4K', '1080p', '720p', '480p', 'Unknown'];
            for (var k = 0; k < order.length; k++) {
                var q = order[k];
                if (bestStreams[q]) {
                    results.push(bestStreams[q].stream);
                }
            }
            return results;
        }).catch(function() {
            return [];
        });
    }
    var newExports = Object.create(originalExports);
    for (var key in originalExports) {
        newExports[key] = originalExports[key];
    }
    if (originalExports.default) {
        newExports.default = Object.create(originalExports.default);
        for (var dKey in originalExports.default) {
            newExports.default[dKey] = originalExports.default[dKey];
        }
        if (newExports.default.getStreams) newExports.default.getStreams = overrideGetStreams;
    }
    if (newExports.getStreams) newExports.getStreams = overrideGetStreams;
    module.exports = newExports;
})();