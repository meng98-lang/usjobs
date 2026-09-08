// 伺服器轉址端點：/api/go?type=wa&campaign=xxx
// 1) 記錄點擊（含 gclid/ttclid/utm 廣告參數）
// 2) 302 直接導向 WhatsApp（無空白頁）
const { getTrackParams, getClientIp, genRefCode, insertRow } = require("../lib/track");

const SITE = "usjobs";
const DEFAULT_WA = "19432626236";

module.exports = async (req, res) => {
  const query = req.query || {};
  const type = "wa"; // 本站僅 WhatsApp

  const ref = query.ref || genRefCode("U");
  const track = getTrackParams(query);

  const phone = (process.env.WA_NUMBER || DEFAULT_WA).replace(/\D/g, "");
  const msg =
    query.msg ||
    `您好，我看到美國代購員招聘廣告，想應徵瞭解詳情。我的諮詢編號：${ref}`;
  const target = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;

  // 記錄點擊（不擋跳轉）
  insertRow("ad_clicks", {
    ref_code: ref,
    site: SITE,
    type,
    campaign: query.campaign ? String(query.campaign).slice(0, 100) : "recruit",
    gclid: track.gclid || null,
    ttclid: track.ttclid || null,
    utm_source: track.utm_source || null,
    utm_medium: track.utm_medium || null,
    utm_campaign: track.utm_campaign || null,
    landing: query.landing ? String(query.landing).slice(0, 300) : null,
    ip: getClientIp(req),
    ua: (req.headers["user-agent"] || "").toString().slice(0, 300),
  });

  res.writeHead(302, { Location: target, "Cache-Control": "no-store" });
  res.end();
};
