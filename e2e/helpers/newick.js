/**
 * @typedef {{ name: string, length: number | null, children: Node[] }} Node
 */

/**
 * Parse a Newick string. Support values on internal nodes are read as names.
 * @param {string} text
 * @returns {Node}
 */
function parseNewick(text) {
  const s = text.trim();
  let i = 0;

  const readLabel = () => {
    let out = '';
    if (s[i] === "'") {
      i++;
      while (i < s.length && s[i] !== "'") out += s[i++];
      i++;
      return out;
    }
    while (i < s.length && !'(),:;'.includes(s[i])) out += s[i++];
    return out.trim();
  };

  /** @returns {Node} */
  const readNode = () => {
    /** @type {Node[]} */
    const children = [];
    if (s[i] === '(') {
      do {
        i++;
        children.push(readNode());
      } while (s[i] === ',');
      if (s[i] !== ')') throw new Error(`Newick: expected ')' at ${i}`);
      i++;
    }
    const name = readLabel();
    let length = null;
    if (s[i] === ':') {
      i++;
      const start = i;
      while (i < s.length && !'(),;'.includes(s[i])) i++;
      length = Number(s.slice(start, i));
      if (Number.isNaN(length)) throw new Error(`Newick: bad length at ${start}`);
    }
    return { name, length, children };
  };

  const root = readNode();
  if (s[i] === ';') i++;
  if (i < s.length) throw new Error(`Newick: unexpected '${s[i]}' at ${i}`);
  return root;
}

/** @param {Node} node @returns {string[]} */
function leafNames(node) {
  return node.children.length
    ? node.children.flatMap(leafNames)
    : [node.name];
}

/** @param {string | Node} tree @returns {string[]} sorted taxa */
function getTaxa(tree) {
  return leafNames(typeof tree === 'string' ? parseNewick(tree) : tree).sort();
}

/**
 * Edges of the unrooted tree as split key -> length. A split key is the
 * sorted taxa on the side without the first taxon, joined by ','. Leaf edges
 * use the taxon name as key. The two root edges of a rooted tree merge.
 * @param {Node} root
 * @returns {Map<string, number | null>}
 */
function edges(root) {
  const first = getTaxa(root)[0];
  /** @type {Map<string, number | null>} */
  const out = new Map();
  /** @param {Node} node */
  const walk = (node, isRoot) => {
    const leaves = leafNames(node).sort();
    if (!isRoot) {
      const key = node.children.length
        ? (leaves.includes(first)
            ? getTaxa(root).filter((t) => !leaves.includes(t))
            : leaves
          ).join(',')
        : node.name;
      const prev = out.get(key);
      out.set(
        key,
        prev === undefined
          ? node.length
          : prev === null || node.length === null
            ? null
            : prev + node.length,
      );
    }
    node.children.forEach((c) => walk(c, false));
  };
  walk(root, true);
  return out;
}

/** @param {Node} root @returns {Set<string>} non-trivial splits */
function splits(root) {
  return new Set([...edges(root).keys()].filter((k) => k.includes(',')));
}

/**
 * @param {string} a Newick
 * @param {string} b Newick
 * @returns {{ taxaMismatch: { onlyInA: string[], onlyInB: string[] } }
 *   | { rf: number, uniqueA: string[], uniqueB: string[] }}
 */
function compareTopologies(a, b) {
  const ta = parseNewick(a);
  const tb = parseNewick(b);
  const taxaA = getTaxa(ta);
  const taxaB = getTaxa(tb);
  const onlyInA = taxaA.filter((t) => !taxaB.includes(t));
  const onlyInB = taxaB.filter((t) => !taxaA.includes(t));
  if (onlyInA.length || onlyInB.length) {
    return { taxaMismatch: { onlyInA, onlyInB } };
  }
  const sa = splits(ta);
  const sb = splits(tb);
  const uniqueA = [...sa].filter((k) => !sb.has(k)).sort();
  const uniqueB = [...sb].filter((k) => !sa.has(k)).sort();
  return { rf: uniqueA.length + uniqueB.length, uniqueA, uniqueB };
}

/**
 * Compare matching branch lengths. Two lengths agree when they differ by at
 * most max(atol, rtol * larger); atol keeps near-zero branches from failing.
 * @param {string} a Newick
 * @param {string} b Newick
 * @param {{ rtol?: number, atol?: number }} [options]
 * @returns {{ ok: boolean, mismatches: string[] }}
 */
function compareBranchLengths(a, b, { rtol = 0.01, atol = 1e-6 } = {}) {
  const ea = edges(parseNewick(a));
  const eb = edges(parseNewick(b));
  /** @type {string[]} */
  const mismatches = [];
  for (const [key, la] of ea) {
    if (!eb.has(key)) {
      mismatches.push(`${key}: missing in second tree`);
      continue;
    }
    const lb = eb.get(key);
    if (la === null || lb === null || lb === undefined) {
      if (la !== lb) mismatches.push(`${key}: length present in one tree only`);
      continue;
    }
    if (Math.abs(la - lb) > Math.max(atol, rtol * Math.max(Math.abs(la), Math.abs(lb)))) {
      mismatches.push(`${key}: ${la} vs ${lb}`);
    }
  }
  for (const key of eb.keys()) {
    if (!ea.has(key)) mismatches.push(`${key}: missing in first tree`);
  }
  return { ok: mismatches.length === 0, mismatches };
}

module.exports = {
  parseNewick,
  getTaxa,
  edges,
  compareTopologies,
  compareBranchLengths,
};
