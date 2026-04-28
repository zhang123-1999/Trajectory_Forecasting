document.body.classList.add("js-enabled");

const progressBar = document.querySelector(".sp-bar");
const tocLinks = Array.from(document.querySelectorAll(".paper-toc a, .topbar-nav a"));
const sections = Array.from(document.querySelectorAll("section[id]"));

function updateScrollProgress() {
  const total = document.documentElement.scrollHeight - window.innerHeight;
  const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
  if (progressBar) progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener("scroll", updateScrollProgress, { passive: true });
updateScrollProgress();

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      const id = visible.target.id;
      tocLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
      });
    },
    { rootMargin: "-24% 0px -62% 0px", threshold: [0.08, 0.2, 0.4] }
  );

  sections.forEach((section) => observer.observe(section));
}

const sganCaptions = {
  1: "k=1 时模型只能提交一条猜测，常退化为中庸轨迹。",
  5: "k=5 时候选开始覆盖主要分支，Variety Loss 只惩罚最接近真实未来的一条。",
  20: "k=20 时 Best-of-N 指标通常更低，但这同时改变了评估口径。"
};

document.querySelectorAll("[data-sgan-k]").forEach((button) => {
  button.addEventListener("click", () => {
    const k = button.dataset.sganK;
    document.querySelectorAll("[data-sgan-k]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    document.querySelectorAll("[data-sgan-set]").forEach((set) => {
      set.classList.toggle("is-active", set.dataset.sganSet === k);
    });
    const caption = document.querySelector("[data-sgan-caption]");
    if (caption) caption.textContent = sganCaptions[k] || sganCaptions[1];
  });
});

function setGraphNode(nodeName) {
  const graph = document.querySelector(".traj-graph");
  if (!graph) return;
  graph.dataset.activeNode = nodeName;

  document.querySelectorAll("[data-graph-node]").forEach((node) => {
    node.classList.toggle("is-active", node.dataset.graphNode === nodeName && node.tagName === "BUTTON");
    node.classList.toggle("is-selected", node.dataset.graphNode === nodeName && node.tagName.toLowerCase() !== "button");
  });
}

document.querySelectorAll("[data-graph-node]").forEach((node) => {
  const activate = () => setGraphNode(node.dataset.graphNode);
  node.addEventListener("mouseenter", activate);
  node.addEventListener("focus", activate);
  node.addEventListener("click", activate);
  node.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  });
});

const midCaptions = {
  noise: "noise: 从高斯噪声开始，轨迹没有清晰运动意图。",
  coarse: "coarse: 早期去噪形成粗略方向，但局部抖动仍明显。",
  refine: "refine: 条件特征开始约束路径，样本分支变得稳定。",
  clean: "clean: 最终轨迹样本贴合历史条件并保留多模态分支。"
};

document.querySelectorAll("[data-mid-stage]").forEach((button) => {
  button.addEventListener("click", () => {
    const stage = button.dataset.midStage;
    document.querySelectorAll("[data-mid-stage]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    document.querySelectorAll("[data-stage]").forEach((item) => {
      item.classList.toggle("is-active", item.dataset.stage === stage);
    });
    const caption = document.querySelector("[data-mid-caption]");
    if (caption) caption.textContent = midCaptions[stage] || midCaptions.clean;
  });
});

document.querySelectorAll("[data-method-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.methodTab;
    document.querySelectorAll("[data-method-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-method-panel]").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.methodPanel === key);
    });
  });
});

const sampleRange = document.querySelector("[data-sample-range]");
const sampleValue = document.querySelector("[data-sample-value]");
let evalMode = "full";

const baseMetrics = {
  full: {
    sgan: "0.84 / 1.55",
    traj: "0.392 / 0.828",
    mid: "0.408 / 0.728",
    factor: 1
  },
  ml: {
    sgan: "single / unstable",
    traj: "ML mode only",
    mid: "single chain",
    factor: 1.22
  },
  best: {
    sgan: "best-of-N",
    traj: "Full best-of-N",
    mid: "DDPM samples",
    factor: 0.88
  }
};

function updateMetricDemo() {
  const n = sampleRange ? Number(sampleRange.value) : 20;
  if (sampleValue) sampleValue.textContent = String(n);
  const mode = baseMetrics[evalMode] || baseMetrics.full;
  const sampleFactor = evalMode === "best" ? 1.18 - n / 100 : 1 + (20 - n) / 120;
  const factor = mode.factor * sampleFactor;
  const chartBase = 242;
  const maxHeight = 164;

  document.querySelectorAll(".metric-bar").forEach((bar) => {
    const baseHeight = Number(bar.dataset.baseHeight || "80");
    const height = Math.max(24, Math.min(maxHeight, baseHeight * factor));
    const y = chartBase - height;
    bar.setAttribute("height", height.toFixed(1));
    bar.setAttribute("y", y.toFixed(1));
  });

  Object.entries(mode).forEach(([key, value]) => {
    if (key === "factor") return;
    const label = document.querySelector(`[data-metric-label="${key}"]`);
    if (label) label.textContent = value;
  });
}

if (sampleRange) {
  sampleRange.addEventListener("input", updateMetricDemo);
}

document.querySelectorAll("[data-eval-mode]").forEach((button) => {
  button.addEventListener("click", () => {
    evalMode = button.dataset.evalMode;
    document.querySelectorAll("[data-eval-mode]").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    updateMetricDemo();
  });
});

updateMetricDemo();
