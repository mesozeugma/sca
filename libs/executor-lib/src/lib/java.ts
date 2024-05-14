import fs from 'fs';
import Parser from 'tree-sitter';
import Java from 'tree-sitter-java';
import { z } from 'zod';

export function parseFile(file: fs.PathOrFileDescriptor): Parser.SyntaxNode {
  const content = fs.readFileSync(file, { encoding: 'utf8' });
  const parser = new Parser();
  parser.setLanguage(Java);
  return parser.parse(content).rootNode;
}

export function getAllChildren(node: Parser.SyntaxNode): Parser.SyntaxNode[] {
  return [
    ...node.children,
    ...node.children.flatMap((value) => getAllChildren(value)),
  ];
}

const NodeInfo = z
  .object({
    text: z.string(),
    type: z.string(),
  })
  .strict();
type NodeInfo = z.infer<typeof NodeInfo>;

export function getNodeInfo(node: Parser.SyntaxNode): NodeInfo {
  return NodeInfo.strip().parse(node);
}

export function getImportedScopedIdentifiers(
  node: Parser.SyntaxNode
): Parser.SyntaxNode[] {
  const allChildren = getAllChildren(node);
  const importDeclarations = allChildren.filter(
    (node) => node.type === 'import_declaration'
  );
  const importScopedIdentifiersWithIdentifier = importDeclarations
    .flatMap((node) => node.children)
    .filter((node) => node.type === 'scoped_identifier');
  return importScopedIdentifiersWithIdentifier
    .flatMap((node) => node.children)
    .filter((node) => node.type === 'scoped_identifier');
}

export function getPackageName(
  node: Parser.SyntaxNode
): Parser.SyntaxNode | undefined {
  const allChildren = getAllChildren(node);
  const packageDeclaration = allChildren.find(
    (node) => node.type === 'package_declaration'
  );
  // TODO: add test
  if (packageDeclaration === undefined) {
    const moduleDeclaration = allChildren.find(
      (node) => node.type === 'module_declaration'
    );
    // file contains module instead of package
    if (moduleDeclaration !== undefined) {
      return undefined;
    }
    throw Error('Unable to get package name: package declaration not found');
  }
  const indentifier = packageDeclaration.children.find(
    (node) => ['scoped_identifier', 'identifier'].indexOf(node.type) !== -1
  );
  if (indentifier === undefined) {
    throw Error('Unable to get package name: identifier not found');
  }
  return indentifier;
}

export function getClassName(node: Parser.SyntaxNode): Parser.SyntaxNode {
  const directChildren = node.children;
  const classDeclaration = directChildren.find(
    (node) =>
      [
        'class_declaration',
        'enum_declaration',
        'interface_declaration',
      ].indexOf(node.type) !== -1
  );
  if (classDeclaration === undefined) {
    throw Error(`No class found in ${node.text}`);
  }
  const result = classDeclaration.children.find(
    (node) => node.type === 'identifier'
  );
  if (result === undefined) {
    throw Error(`No class found in ${node.text}`);
  }
  return result;
}

const JavaImportInfo = z
  .object({
    className: z.string(),
    imports: z
      .array(z.string())
      .refine((items) => new Set(items).size === items.length, {
        message: 'Array must contain unique items',
      }),
    packageName: z.string(),
  })
  .strict();
export type JavaImportInfo = z.infer<typeof JavaImportInfo>;

export function getImportInfo(
  node: Parser.SyntaxNode
): JavaImportInfo | undefined {
  const packageName = getPackageName(node);
  // TODO: add test
  if (packageName === undefined) {
    return undefined;
  }
  const importedScopedIdentifiers = getImportedScopedIdentifiers(node);
  const importNames = importedScopedIdentifiers.map((node) => node.text);
  const className = getClassName(node);
  const result: JavaImportInfo = {
    className: className.text,
    imports: [...new Set(importNames)],
    packageName: packageName.text,
  };
  return JavaImportInfo.parse(result);
}
