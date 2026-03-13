import fs from 'node:fs';
import path from 'node:path';
import { globSync } from 'glob';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default;

const root = process.cwd();
const files = globSync('**/*.{js,mjs,cjs,ts}', {
  cwd: root,
  absolute: true,
  ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**']
});

function isFrontendFile(fp) {
  return fp.includes(`${path.sep}frontend${path.sep}js${path.sep}`);
}

function getAssignedGlobalName(left) {
  if (
    left?.type === 'MemberExpression' &&
    !left.computed &&
    left.object?.type === 'Identifier' &&
    ['window', 'globalThis', 'self'].includes(left.object.name) &&
    left.property?.type === 'Identifier'
  ) {
    return left.property.name;
  }
  return null;
}

function getModuleExportedName(left) {
  if (
    left?.type === 'MemberExpression' &&
    !left.computed &&
    left.object?.type === 'Identifier' &&
    left.object.name === 'exports' &&
    left.property?.type === 'Identifier'
  ) {
    return left.property.name;
  }

  if (
    left?.type === 'MemberExpression' &&
    !left.computed &&
    left.object?.type === 'MemberExpression' &&
    !left.object.computed &&
    left.object.object?.type === 'Identifier' &&
    left.object.object.name === 'module' &&
    left.object.property?.type === 'Identifier' &&
    left.object.property.name === 'exports' &&
    left.property?.type === 'Identifier'
  ) {
    return left.property.name;
  }

  return null;
}

const report = [];

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;

  try {
    ast = parse(code, {
      sourceType: 'unambiguous',
      plugins: ['jsx', 'typescript'],
      errorRecovery: true
    });
  } catch {
    continue;
  }

  const declared = new Map();
  const exposedGlobal = new Set();
  const exported = new Set();

  traverse(ast, {
    Program(p) {
      for (const node of p.node.body) {
        if (node.type === 'FunctionDeclaration' && node.id?.name) {
          declared.set(node.id.name, node.loc?.start?.line ?? 0);
        }

        if (node.type === 'VariableDeclaration') {
          for (const d of node.declarations || []) {
            if (
              d.id?.type === 'Identifier' &&
              (d.init?.type === 'ArrowFunctionExpression' ||
                d.init?.type === 'FunctionExpression')
            ) {
              declared.set(d.id.name, d.loc?.start?.line ?? 0);
            }
          }
        }

        if (node.type === 'ExportNamedDeclaration') {
          if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id?.name) {
            exported.add(node.declaration.id.name);
          }
          if (node.declaration?.type === 'VariableDeclaration') {
            for (const d of node.declaration.declarations || []) {
              if (d.id?.type === 'Identifier') exported.add(d.id.name);
            }
          }
          for (const s of node.specifiers || []) {
            if (s.exported?.name) exported.add(s.exported.name);
          }
        }

        if (node.type === 'ExportDefaultDeclaration') {
          if (node.declaration?.type === 'Identifier') exported.add(node.declaration.name);
          if (node.declaration?.type === 'FunctionDeclaration' && node.declaration.id?.name) {
            exported.add(node.declaration.id.name);
          }
        }
      }
    },

    AssignmentExpression(p) {
      const left = p.node.left;
      const right = p.node.right;

      const g = getAssignedGlobalName(left);
      if (g) exposedGlobal.add(g);

      const m = getModuleExportedName(left);
      if (m) exported.add(m);

      if (
        left?.type === 'MemberExpression' &&
        !left.computed &&
        left.object?.type === 'Identifier' &&
        left.object.name === 'module' &&
        left.property?.type === 'Identifier' &&
        left.property.name === 'exports' &&
        right?.type === 'ObjectExpression'
      ) {
        for (const prop of right.properties || []) {
          if (prop.type === 'ObjectProperty') {
            if (prop.key?.type === 'Identifier') exported.add(prop.key.name);
            if (prop.key?.type === 'StringLiteral') exported.add(prop.key.value);
          }
        }
      }
    },

    CallExpression(p) {
      const c = p.node;
      if (
        c.callee?.type === 'MemberExpression' &&
        c.callee.object?.type === 'Identifier' &&
        c.callee.object.name === 'Object' &&
        c.callee.property?.type === 'Identifier' &&
        c.callee.property.name === 'assign' &&
        c.arguments?.length >= 2 &&
        c.arguments[0]?.type === 'Identifier' &&
        ['window', 'globalThis', 'self'].includes(c.arguments[0].name) &&
        c.arguments[1]?.type === 'ObjectExpression'
      ) {
        for (const prop of c.arguments[1].properties || []) {
          if (prop.type === 'ObjectProperty') {
            if (prop.key?.type === 'Identifier') exposedGlobal.add(prop.key.name);
            if (prop.key?.type === 'StringLiteral') exposedGlobal.add(prop.key.value);
          }
        }
      }
    }
  });

  const treatAsModule = isFrontendFile(file) || ast.program.sourceType === 'module';

  for (const [name, line] of declared) {
    const isGlobal = !treatAsModule || exposedGlobal.has(name);
    const isExported = exported.has(name);

    if (!isGlobal && !isExported) {
      report.push({
        file: path.relative(root, file),
        line,
        name
      });
    }
  }
}

report
  .sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line)
  .forEach((r) => {
    console.log(`${r.file}:${r.line}  ${r.name}`);
  });