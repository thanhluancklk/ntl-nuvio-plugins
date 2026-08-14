var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/uhdmovies/index.js
var import_cheerio_without_node_native2 = __toESM(require("cheerio-without-node-native"));

// src/uhdmovies/constants.js
var DOMAINS_URL = "https://raw.githubusercontent.com/phisher98/TVVVV/refs/heads/main/domains.json";
var FALLBACK_DOMAIN = "https://uhdmovies.pink";
var TMDB_API_KEY = "1865f43a0549ca50d341dd9ab8b29f49";
var TMDB_BASE_URL = "https://api.themoviedb.org/3";
var HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "max-age=0",
  "Connection": "keep-alive",
  "Upgrade-Insecure-Requests": "1"
};

// src/uhdmovies/utils.js
var import_cheerio_without_node_native = __toESM(require("cheerio-without-node-native"));
var cachedDomain = "";
async function getMainUrl() {
  if (cachedDomain)
    return cachedDomain;
  try {
    const response = await fetch(DOMAINS_URL, { headers: { "User-Agent": "Mozilla/5.0" } });
    const data = await response.json();
    cachedDomain = data["UHDMovies"] || FALLBACK_DOMAIN;
    return cachedDomain;
  } catch (e) {
    return FALLBACK_DOMAIN;
  }
}
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.host}`;
  } catch (e) {
    return "";
  }
}
function fixUrl(url, domain) {
  if (!url)
    return "";
  if (url.startsWith("http"))
    return url;
  if (url.startsWith("//"))
    return `https:${url}`;
  if (url.startsWith("/"))
    return domain + url;
  return `${domain}/${url}`;
}
async function bypassHrefli(url) {
  const host = getBaseUrl(url);
  try {
    const res1 = await fetch(url, { headers: HEADERS });
    const html1 = await res1.text();
    const $1 = import_cheerio_without_node_native.default.load(html1);
    const formUrl1 = $1("form#landing").attr("action");
    const formData1 = {};
    $1("form#landing input").each((_, el) => {
      formData1[$1(el).attr("name")] = $1(el).attr("value") || "";
    });
    const res2 = await fetch(formUrl1, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData1).toString()
    });
    const html2 = await res2.text();
    const $2 = import_cheerio_without_node_native.default.load(html2);
    const formUrl2 = $2("form#landing").attr("action");
    const formData2 = {};
    $2("form#landing input").each((_, el) => {
      formData2[$2(el).attr("name")] = $2(el).attr("value") || "";
    });
    const res3 = await fetch(formUrl2, {
      method: "POST",
      headers: { ...HEADERS, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData2).toString()
    });
    const html3 = await res3.text();
    const $3 = import_cheerio_without_node_native.default.load(html3);
    const script = $3("script:contains(?go=)").html() || "";
    const skTokenMatch = script.match(/\?go=([^"]+)/);
    if (!skTokenMatch)
      return null;
    const skToken = skTokenMatch[1];
    const wpHttp2 = formData2["_wp_http2"] || "";
    const res4 = await fetch(`${host}?go=${skToken}`, {
      headers: { ...HEADERS, "Cookie": `${skToken}=${wpHttp2}` }
    });
    const html4 = await res4.text();
    const $4 = import_cheerio_without_node_native.default.load(html4);
    const metaRefresh = $4('meta[http-equiv="refresh"]').attr("content") || "";
    const driveUrlMatch = metaRefresh.match(/url=(.+)/);
    if (!driveUrlMatch)
      return null;
    const driveUrl = driveUrlMatch[1];
    const res5 = await fetch(driveUrl, { headers: HEADERS });
    const html5 = await res5.text();
    const pathMatch = html5.match(/replace\("([^"]+)"\)/);
    if (!pathMatch || pathMatch[1] === "/404")
      return null;
    return fixUrl(pathMatch[1], getBaseUrl(driveUrl));
  } catch (e) {
    return null;
  }
}
async function fetchTmdbDetails(tmdbId, mediaType) {
  try {
    const url = `${TMDB_BASE_URL}/${mediaType}/${tmdbId}?api_key=${TMDB_API_KEY}&append_to_response=external_ids`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });
    const data = await res.json();
    return {
      title: mediaType === "movie" ? data.title || data.original_title : data.name || data.original_name,
      year: (data.release_date || data.first_air_date || "").substring(0, 4),
      imdbId: data.external_ids?.imdb_id
    };
  } catch (e) {
    return null;
  }
}
function getIndexQuality(str) {
  if (!str)
    return "Unknown";
  const match = str.match(/(\d{3,4})[pP]/);
  if (match)
    return match[1] + "p";
  if (str.toUpperCase().includes("4K") || str.toUpperCase().includes("UHD"))
    return "2160p";
  return "Unknown";
}
async function extractVideoSeed(finallink) {
  try {
    const urlObj = new URL(finallink);
    const host = urlObj.host || "video-seed.xyz";
    const token = finallink.split("?url=")[1];
    if (!token)
      return null;
    const res = await fetch(`https://${host}/api`, {
      method: "POST",
      headers: {
        ...HEADERS,
        "Content-Type": "application/x-www-form-urlencoded",
        "x-token": host,
        "Referer": finallink
      },
      body: `keys=${encodeURIComponent(token)}`
    });
    const text = await res.text();
    const urlMatch = text.match(/url":"([^"]+)"/);
    return urlMatch ? urlMatch[1].replace(/\\\//g, "/") : null;
  } catch (e) {
    return null;
  }
}
async function extractDriveseedPage(url) {
  const streams = [];
  try {
    let pageUrl = url;
    if (url.includes("r?key=")) {
      const res2 = await fetch(url, { headers: HEADERS });
      const html2 = await res2.text();
      const redirectMatch = html2.match(/replace\("([^"]+)"\)/);
      if (redirectMatch) {
        pageUrl = getBaseUrl(url) + redirectMatch[1];
      }
    }
    const res = await fetch(pageUrl, { headers: HEADERS });
    const html = await res.text();
    const $ = import_cheerio_without_node_native.default.load(html);
    const baseDomain = getBaseUrl(pageUrl);
    const qualityText = $("li.list-group-item").first().text() || "";
    const size = $("li:nth-child(3)").text().replace("Size : ", "").trim();
    const quality = getIndexQuality(qualityText);
    const elements = $("div.text-center > a").get();
    for (const el of elements) {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr("href");
      if (!href)
        continue;
      if (text.includes("instant download")) {
        const instantRes = await fetch(href, { headers: HEADERS, redirect: "follow" });
        if (instantRes.url && instantRes.url.includes("url=")) {
          streams.push({ name: "Driveseed Instant", url: instantRes.url.split("url=")[1], quality, size });
        }
      } else if (text.includes("resume cloud")) {
        const cloudRes = await fetch(baseDomain + href, { headers: HEADERS });
        const cloudHtml = await cloudRes.text();
        const link = import_cheerio_without_node_native.default.load(cloudHtml)("a.btn-success").first().attr("href");
        if (link)
          streams.push({ name: "Driveseed Cloud", url: link, quality, size });
      } else if (text.includes("cloud download")) {
        streams.push({ name: "Driveseed Cloud", url: href, quality, size });
      }
    }
  } catch (e) {
  }
  return streams;
}

// src/uhdmovies/index.js
async function getStreams(tmdbId, mediaType, seasonNum = 1, episodeNum = 1) {
  console.log(`[UHDMovies] Querying streams for TMDB: ${tmdbId}, Type: ${mediaType}`);
  const details = await fetchTmdbDetails(tmdbId, mediaType);
  if (!details)
    return [];
  const mainUrl = await getMainUrl();
  const query = details.title;
  const searchUrl = `${mainUrl}/?s=${encodeURIComponent(query)}`;
  try {
    const searchRes = await fetch(searchUrl, { headers: { ...HEADERS, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
    const searchHtml = await searchRes.text();
    const $search = import_cheerio_without_node_native2.default.load(searchHtml);
    let targetUrl = "";
    $search("article.gridlove-post, article.latestPost").each((i, el) => {
      const title = $search(el).find("h1.sanket, h2.title a").text() || $search(el).find("a").attr("title") || "";
      const href = $search(el).find("div.entry-image > a, h2.title a, a").first().attr("href");
      if (href && (title.toLowerCase().includes(details.title.toLowerCase()) || details.imdbId && title.includes(details.imdbId))) {
        targetUrl = href;
        return false;
      }
    });
    if (!targetUrl) {
      console.log("[UHDMovies] No search result found");
      return [];
    }
    const pageRes = await fetch(targetUrl, { headers: { ...HEADERS, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" } });
    const pageHtml = await pageRes.text();
    const $ = import_cheerio_without_node_native2.default.load(pageHtml);
    const allStreams = [];
    if (mediaType === "movie") {
      const iframeRegex = /\[.*\]/;
      $("div.entry-content > p, div.entry-content > div").each((i, el) => {
        const text = $(el).text();
        if (iframeRegex.test(text)) {
          const quality = getIndexQuality(text);
          const nextHref = $(el).next().find("a.maxbutton-1, a.maxbutton").attr("href") || $(el).find("a.maxbutton-1, a.maxbutton").attr("href");
          if (nextHref) {
            allStreams.push({ url: nextHref, quality });
          }
        }
      });
    } else {
      const episodesMap = {};
      let currentSeason = seasonNum;
      $("pre, p, a, h3").each((i, el) => {
        const text = $(el).text().trim();
        const seasonMatch = text.match(/(?:season\s*|S)(\d+)/i);
        if (seasonMatch && text.length < 20) {
          currentSeason = parseInt(seasonMatch[1]);
        }
        if (($(el).is("a") || $(el).find("a").length > 0) && text.toLowerCase().includes("episode")) {
          if (text.toLowerCase().includes("zip"))
            return;
          const epMatch = text.match(/Episode\s*(\d+)/i);
          if (epMatch) {
            const realEp = parseInt(epMatch[1]);
            const epUrl = $(el).is("a") ? $(el).attr("href") : $(el).find("a").attr("href");
            if (epUrl) {
              const key = `${currentSeason}-${realEp}`;
              if (!episodesMap[key])
                episodesMap[key] = [];
              episodesMap[key].push(epUrl);
            }
          }
        }
      });
      const targetKey = `${seasonNum}-${episodeNum}`;
      const urls = episodesMap[targetKey] || [];
      urls.forEach((url) => {
        allStreams.push({ url, quality: "Unknown" });
      });
    }
    const finalResults = [];
    for (const item of allStreams) {
      let finalLink = item.url;
      if (finalLink.includes("unblockedgames")) {
        finalLink = await bypassHrefli(finalLink);
      }
      if (finalLink) {
        if (finalLink.includes("driveseed") || finalLink.includes("driveleech")) {
          const streams = await extractDriveseedPage(finalLink);
          finalResults.push(...streams.map((s) => ({
            ...s,
            name: "UHDMovies [Driveseed]",
            title: `UHDMovies - ${s.quality} ${s.size ? `[${s.size}]` : ""}`,
            quality: s.quality || item.quality,
            provider: "uhdmovies"
          })));
        } else if (finalLink.includes("video-seed")) {
          const streamUrl = await extractVideoSeed(finalLink);
          if (streamUrl) {
            finalResults.push({
              name: "UHDMovies [VideoSeed]",
              title: `UHDMovies - ${item.quality}`,
              url: streamUrl,
              quality: item.quality,
              provider: "uhdmovies"
            });
          }
        } else {
          finalResults.push({
            name: "UHDMovies",
            title: `UHDMovies - ${item.quality}`,
            url: finalLink,
            quality: item.quality,
            provider: "uhdmovies"
          });
        }
      }
    }
    return finalResults;
  } catch (e) {
    console.error("[UHDMovies] Error:", e.message);
    return [];
  }
}
module.exports = { getStreams };
