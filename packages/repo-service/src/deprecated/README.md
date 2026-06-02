# Deprecated Files

This directory contains files that are no longer actively used in the current architecture but are kept for reference.

## Workers

### gitWorker.ts
- **Status**: Deprecated
- **Reason**: Git clone functionality has been integrated directly into `shellWithCloneWorker`
- **Migration**: The `cloneRepoIfNotExist` function has been moved to `src/utils/git/gitClone.ts`

### shellWorker.ts  
- **Status**: Deprecated
- **Reason**: Replaced by `shellWithCloneWorker.ts` which includes integrated git clone functionality
- **Migration**: Use `shellWithCloneWorker` for shell commands that need git repositories

## Current Active Workers

- `shellWithCloneWorker.ts` - Executes shell commands with automatic git clone

## Architecture Changes

The worker architecture has been simplified from:
```
gitWorker + shellWorker → shellWithCloneWorker
```

To a more integrated approach where the active worker handles its own git operations internally.
