const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const js = fs.readFileSync(path.join(root, "script.js"), "utf8");

const requiredSections = [
  "hero",
  "problem",
  "unified",
  "sgan",
  "trajectron",
  "mid",
  "compare",
  "results",
  "video",
  "references",
];

function count(pattern, source) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match ? match[1] : "";
}

for (const id of requiredSections) {
  assert(
    new RegExp(`<section[^>]+id=["']${id}["']`).test(html),
    `missing section #${id}`
  );
}

assert(/<article\b/.test(html), "page should use a semantic article wrapper");
assert(/class=["'][^"']*paper-toc/.test(html), "missing sticky paper table of contents");
const figureCount = count(/<figure\b/g, html);
const textUnitCount = count(/<(p|li)\b/g, html);
const visibleText = html
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .replace(/<style[\s\S]*?<\/style>/g, "")
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, "");

assert(/class=["'][^"']*longform-body/.test(html), "missing text-first longform body wrapper");
assert(figureCount >= 4, "expected a small set of supporting figures");
assert(figureCount <= 6, "too many figures for the requested text-first article");
assert(count(/<figcaption\b/g, html) === figureCount, "each major figure needs exactly one caption");
assert(textUnitCount / figureCount >= 4, "text units should outnumber figures by at least 4:1");
assert(visibleText.length >= 9000, "article text is too short for a paper-style review");
assert(visibleText.length <= 14000, "article text should stay concise for an expert-facing paper page");
assert(/p\(Y\s*\|\s*X,\s*C\)/.test(html), "missing core conditional distribution formula");

assert(/data-sgan-k=["']1["']/.test(html), "missing SGAN k=1 control");
assert(/data-sgan-k=["']5["']/.test(html), "missing SGAN k=5 control");
assert(/data-sgan-k=["']20["']/.test(html), "missing SGAN k=20 control");
assert(/data-mid-stage=/.test(html), "missing MID denoising stage controls");
assert(/data-method-tab=/.test(html), "missing comparison method tabs");
assert(/data-graph-node=/.test(html), "missing Trajectron++ graph node hooks");
assert(/Directed spatiotemporal graph|有向时空图/.test(html), "missing Trajectron++ graph explanation");
assert(/Motion Indeterminacy Diffusion|运动不确定性扩散/.test(html), "missing MID source-paper concept");
assert(/socially acceptable|社会可接受/.test(html), "missing Social GAN source-paper concept");
assert(/本小组围绕行人轨迹预测开展论文复现工作/.test(html), "missing opening summary of group reproduction work");
assert(/href=["']#video["'][^>]*>\s*8\.\s*视频展示/.test(html), "missing video section table-of-contents entry");
assert(/<video\b[\s\S]*202604290010\.mp4/.test(html), "missing updated trajectory forecasting video embed");
assert(!/class=["'][^"']*hero-equation/.test(html), "opening Target/X/Y/C definition block should be removed");
assert(!/Gaussian BP|Gaussian Belief Propagation|参考站点|没有复制|网页设计/.test(html), "page should not include off-topic design commentary");
assert(!/不是手写规则|谁影响谁|不要把三种方法|阅读重点/.test(html), "headings should use formal paper-style language");

assert(!/heroCanvas/.test(html + js), "particle canvas should be removed");
assert(!/challenge-card/.test(html), "old card-heavy challenge UI should be removed");

assert(/--paper:\s*#ffffff/.test(css), "page should use a white paper background");
assert(/--content:\s*43rem/.test(css), "content axis should use a narrow centered measure");
assert(/\.chapters\s*\{[\s\S]*?width:\s*min\(calc\(100% - 2rem\),\s*var\(--content\)\)[\s\S]*?margin:\s*0 auto/.test(css), "chapters should be centered on the page axis");
assert(/\.paper-figure\s*\{[\s\S]*?margin:\s*1\.5rem auto 0[\s\S]*?background:\s*transparent/.test(css), "figures should align to the same centered axis without framed panels");
assert(/\.table-scroll\s*\{[\s\S]*?background:\s*transparent/.test(css), "tables should not sit inside framed panels");
assert(!/border-(left|right):/.test(rule(".paper-article")), "article should not have vertical frame borders");
assert(!/border-bottom:/.test(rule(".chapter")), "chapters should not be separated by gray frame lines");
assert(!/border:/.test(rule(".paper-figure")), "figures should not have gray container borders");
assert(!/border:/.test(rule(".table-scroll")), "table wrapper should not have gray container borders");
assert(/max-width:\s*43rem/.test(css), "reading column should be narrow");
assert(/\.paper-layout/.test(css), "missing paper reading layout styles");
assert(/\.paper-toc/.test(css), "missing table-of-contents styles");
assert(/@media\s*\(min-width:\s*768px\)/.test(css), "missing tablet breakpoint");
assert(/@media\s*\(min-width:\s*1024px\)/.test(css), "missing desktop breakpoint");

assert(/IntersectionObserver/.test(js), "TOC active state should use IntersectionObserver");
assert(/data-sgan-k/.test(js), "script should wire SGAN k controls");
assert(/data-mid-stage/.test(js), "script should wire MID stage controls");
assert(/data-method-tab/.test(js), "script should wire method tabs");
assert(/data-graph-node/.test(js), "script should wire graph node highlighting");

console.log("site contract passed");
