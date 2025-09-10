# TypeScript Compilation Checks - Guide

## Overview

The TypeScript compilation checking system has been configured to ensure code quality and early detection of type errors in your Nx monorepo. This system allows you to check TypeScript types without actually compiling the code to JavaScript.

## What Was Implemented

### 1. Added type checking targets to project.json files

A new `typecheck` target was added for each project that runs the TypeScript compiler in `--noEmit` mode (check only without generating files).

#### Frontend (apps/frontend/project.json)
```json
"typecheck": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit -p apps/frontend/tsconfig.app.json"
  }
}
```

#### API (apps/api/project.json)
```json
"typecheck": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit -p apps/api/tsconfig.app.json"
  }
}
```

#### Libraries (libs/models/project.json and libs/utils/project.json)
```json
"typecheck": {
  "executor": "nx:run-commands",
  "options": {
    "command": "tsc --noEmit -p libs/[library-name]/tsconfig.lib.json"
  }
}
```

### 2. Added npm scripts to package.json

Convenient scripts were added to the root `package.json` for quick check execution:

```json
"scripts": {
  "typecheck:frontend": "nx run frontend:typecheck",
  "typecheck:api": "nx run api:typecheck",
  "typecheck:libs": "nx run-many --target=typecheck --projects=models,utils",
  "typecheck:all": "nx run-many --target=typecheck --all",
  "lint:all": "nx run-many --target=lint --all && nx run-many --target=eslint:lint --all",
  "check:all": "npm run typecheck:all && npm run lint:all"
}
```

## How to Use

### Checking Individual Projects

#### Via npm scripts:
```bash
# Check frontend only
npm run typecheck:frontend

# Check API only
npm run typecheck:api

# Check libraries only
npm run typecheck:libs
```

#### Via Nx directly:
```bash
# Check specific project
npx nx run frontend:typecheck
npx nx run api:typecheck
npx nx run models:typecheck
npx nx run utils:typecheck
```

### Checking All Projects

```bash
# Check types in all projects
npm run typecheck:all

# Or via Nx
npx nx run-many --target=typecheck --all
```

### Comprehensive Check (typecheck + lint)

```bash
# Run full code quality check
npm run check:all
```

This command will sequentially execute:
1. TypeScript type checking in all projects
2. ESLint checking in all projects

### Check with Parallel Execution

```bash
# Run check with specified number of parallel processes
npx nx run-many --target=typecheck --all --parallel=4
```

## Manual Check via TypeScript CLI

If you want to run the check directly through the TypeScript compiler:

```bash
# Frontend
npx tsc --noEmit -p apps/frontend/tsconfig.app.json

# API
npx tsc --noEmit -p apps/api/tsconfig.app.json

# Models library
npx tsc --noEmit -p libs/models/tsconfig.lib.json

# Utils library
npx tsc --noEmit -p libs/utils/tsconfig.lib.json
```

### TypeScript Compiler Parameters

- `--noEmit` - don't generate output files, only check types
- `-p <path>` - path to the project's tsconfig.json file
- `--pretty` - colorized error output (enabled by default)
- `--watch` - watch mode for file changes

Example with watch mode:
```bash
npx tsc --noEmit -p apps/frontend/tsconfig.app.json --watch
```

## Workflow Integration

### Pre-commit Check

It's recommended to add type checking before commits. You can use git hooks or husky:

```bash
# In .husky/pre-commit or in git hook
npm run check:all
```

### CI/CD Pipeline

Add a type checking step to your CI/CD pipeline:

```yaml
# Example for GitHub Actions
- name: Type Check
  run: npm run typecheck:all

- name: Lint
  run: npm run lint:all
```

## Troubleshooting

### If type checking doesn't work

1. **Check TypeScript version:**
   ```bash
   npx tsc --version
   ```
   Should be version 5.5.x or higher.

2. **Check for tsconfig files:**
   - `apps/frontend/tsconfig.app.json`
   - `apps/api/tsconfig.app.json`
   - `libs/models/tsconfig.lib.json`
   - `libs/utils/tsconfig.lib.json`

3. **Clear Nx cache:**
   ```bash
   npx nx reset
   ```

4. **Reinstall dependencies:**
   ```bash
   npm ci
   ```

### Common Compilation Errors and Solutions

1. **Cannot find module:**
   - Check imports and module paths
   - Ensure all dependencies are installed

2. **Type errors:**
   - Use proper types instead of `any`
   - Check type compatibility between libraries

3. **Missing declarations:**
   - Install @types packages for third-party libraries
   - Create d.ts files for modules without types

## System Benefits

1. **Early error detection** - type errors are caught before runtime
2. **Improved IDE support** - better integration with autocomplete and refactoring
3. **Documentation through types** - types serve as code documentation
4. **Safe refactoring** - type changes immediately show all places requiring updates
5. **Accelerated development** - fewer runtime errors, more confidence in code

## Additional Features

### Generate Error Report

```bash
# Save output to file
npx tsc --noEmit -p apps/frontend/tsconfig.app.json > typecheck-report.txt 2>&1
```

### Check Only Changed Files

```bash
# Use Nx affected to check only changed projects
npx nx affected --target=typecheck
```

### Configure Strictness Level

You can configure the strictness level in tsconfig.json files:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

## Conclusion

The TypeScript compilation checking system is now fully integrated into your project. Use `npm run typecheck:*` commands for regular code quality checks and preventing type errors.

It's recommended to run `npm run check:all` before each commit and mandatorily in the CI/CD pipeline to maintain high code quality.
