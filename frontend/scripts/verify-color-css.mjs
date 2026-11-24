import { readdirSync, readFileSync } from "node:fs";
import { resolve, join } from "node:path";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const postcss = require("postcss");
const root = resolve(import.meta.dirname, "..");
const files = readdirSync(join(root, "site/out/_next/static/css")).filter((x) =>
  x.endsWith(".css"),
);
const rules = new Map();
for (const file of files)
  postcss
    .parse(readFileSync(join(root, "site/out/_next/static/css", file), "utf8"))
    .walkRules((rule) => rules.set(rule.selector, rule));
for (const [name, prop, channel, alpha] of [
  ["bg-base-bg/95", "background-color", "--background-rgb", ".95"],
  ["bg-base-void/95", "background-color", "--surface-recess-rgb", ".95"],
  ["border-base-border/70", "border-color", "--color-border-rgb", ".7"],
  ["bg-emphasis/25", "background-color", "--color-interactive-rgb", ".25"],
  ["ring-emphasis/70", "--tw-ring-color", "--color-interactive-rgb", ".7"],
]) {
  const selector = "." + name.replace("/", "\\/");
  const rule = rules.get(selector);
  assert.ok(rule, `Missing production selector ${selector}`);
  const value = rule.nodes.find((n) => n.prop === prop)?.value;
  assert.ok(
    value?.includes(`var(${channel})`),
    `${selector}: wrong channel ${value}`,
  );
  assert.ok(
    value.replaceAll(" ", "").endsWith("/" + alpha + ")") ||
      value.replaceAll(" ", "").endsWith("/0" + alpha + ")"),
    `${selector}: wrong alpha ${value}`,
  );
  console.log(`${selector} ${prop}: ${value}`);
}
const load = require("tailwindcss/loadConfig");
const tw = require("tailwindcss");
const config = load(join(root, "tailwind.config.ts"));
const classes = [];
function collect(obj, path = []) {
  for (const [key, val] of Object.entries(obj)) {
    const next = key === "DEFAULT" ? path : [...path, key];
    if (typeof val === "object") collect(val, next);
    else if (val.includes("var(")) classes.push("bg-" + next.join("-") + "/70");
  }
}
collect(config.theme.extend.colors);
config.content = [{ raw: classes.join(" ") }];
const generated = await postcss([tw(config)]).process("@tailwind utilities;", {
  from: undefined,
});
for (const cls of classes)
  assert.ok(
    generated.css.includes("." + cls.replace("/", "\\/")),
    `Missing alpha utility for ${cls}`,
  );
console.log(
  `Verified ${classes.length} variable-backed color aliases support slash opacity.`,
);

// Font variables must never be rewritten as color-channel expressions.
for (const name of ['mono', 'display']) {
  const rule = rules.get('.font-' + name);
  assert.ok(rule, `Missing font-${name}`);
  const value = rule.nodes.find(n => n.prop === 'font-family')?.value;
  assert.ok(value?.includes(`var(--font-${name})`) && !value.includes('rgb('), `Invalid font-${name}: ${value}`);
}
console.log('Verified mono/display font variables remain font-family values.');
