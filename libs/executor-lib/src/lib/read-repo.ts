import fs from 'fs-extra';
import klaw from 'klaw';
import path from 'node:path';
import { z } from 'zod';

import { JavaImportInfo, getImportInfo, parseFile } from './java';

/**
 * @param {string} file
 */
function filterPath(file: string) {
  return path.extname(file).endsWith('.java');
}

const Result = z
  .object({
    type: z.string(),
  })
  .strict();
type Result = z.infer<typeof Result>;

const FileResult = Result.merge(
  z.object({
    file: z.string(),
  })
).strict();
type FileResult = z.infer<typeof FileResult>;

const PackageNameResult = Result.merge(
  z.object({
    packageName: z.string(),
    type: z.literal('package_or_class').default('package_or_class'),
  })
).strict();
type PackageNameResult = z.infer<typeof PackageNameResult>;

const PackageResult = FileResult.merge(
  z.object({
    packageName: z.string(),
    type: z.literal('package_or_class').default('package_or_class'),
  })
).strict();
type PackageResult = z.infer<typeof PackageResult>;

const ClassResult = PackageResult.merge(
  z.object({
    className: z.string(),
  })
).strict();
type ClassResult = z.infer<typeof ClassResult>;

const ImportResult = PackageResult.merge(
  z.object({
    imported: z.string(),
    type: z.literal('import').default('import'),
  })
).strict();
type ImportResult = z.infer<typeof ImportResult>;

async function grabImportInfo(
  file: string
): Promise<JavaImportInfo | undefined> {
  try {
    const rootNode = parseFile(file);
    return getImportInfo(rootNode);
  } catch (err: unknown) {
    console.log(`Problem with file ${file}`);
    const fileContent = await fs.readFile(file, { encoding: 'utf-8' });
    console.log(fileContent);
    throw err;
  }
}

export async function readRepo(repositoryPath: string): Promise<Result[]> {
  if (!repositoryPath) {
    throw Error('Repository path not set');
  }
  const result: Result[] = [];
  const packageNames: Set<string> = new Set();
  for await (const file of klaw(repositoryPath, {
    depthLimit: -1,
  })) {
    if (!filterPath(file.path)) continue;

    const importInfo = await grabImportInfo(file.path);
    if (importInfo === undefined) continue;
    result.push(
      ...importInfo.imports.map((imported) =>
        ImportResult.parse({
          file: path.relative(repositoryPath, file.path),
          packageName: importInfo.packageName,
          imported,
        })
      )
    );
    result.push(
      ClassResult.parse({
        file: path.relative(repositoryPath, file.path),
        packageName: importInfo.packageName,
        className: importInfo.className,
      })
    );
    const packageNameParts = importInfo.packageName.split('.');
    const packageNameFirstPart = packageNameParts.shift();
    packageNameParts
      .reduce(
        (accumulator, currentValue) => [
          ...accumulator,
          accumulator[accumulator.length - 1] + '.' + currentValue,
        ],
        [packageNameFirstPart]
      )
      .forEach((value) => {
        if (value === undefined) return;
        packageNames.add(value);
      });
  }
  packageNames.forEach((packageName) => {
    result.push(PackageNameResult.parse({ packageName }));
  });
  return result;
}
