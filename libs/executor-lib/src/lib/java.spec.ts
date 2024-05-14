/**
 * "TypeError: illegal invocation" when imported in multiple tests
 * see https://github.com/tree-sitter/node-tree-sitter/issues/53
 */
import {
  getAllChildren,
  getClassName,
  getImportInfo,
  getImportedScopedIdentifiers,
  getNodeInfo,
  getPackageName,
  parseFile,
} from './java';

describe('exampleHelloWorld', () => {
  const rootNode = parseFile(
    './libs/executor-lib/code-samples/java/HelloWorld.java'
  );

  test('allChildren', () => {
    const children = getAllChildren(rootNode);
    expect(children.map(getNodeInfo)).toMatchSnapshot();
  });

  test('importedScopedIdentifiers', () => {
    const importedScopedIdentifiers = getImportedScopedIdentifiers(rootNode);
    expect(importedScopedIdentifiers.map(getNodeInfo)).toMatchSnapshot();
  });

  test('packageName', () => {
    const packageName = getPackageName(rootNode);
    if (packageName !== undefined) {
      expect(getNodeInfo(packageName)).toMatchSnapshot();
    } else {
      expect(packageName).toBeDefined();
    }
  });

  test('className', () => {
    const className = getClassName(rootNode);
    expect(getNodeInfo(className)).toMatchSnapshot();
  });

  test('importInfo', () => {
    const importInfo = getImportInfo(rootNode);
    expect(importInfo).toMatchSnapshot();
  });
});
