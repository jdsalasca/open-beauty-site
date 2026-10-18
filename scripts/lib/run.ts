export function runScript(main: () => Promise<void>): void {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
