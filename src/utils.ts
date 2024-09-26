export function isGitHubAction(): boolean {
  // https://docs.github.com/en/actions/writing-workflows/choosing-what-your-workflow-does/store-information-in-variables#default-environment-variables
  return process.env.GITHUB_ACTIONS === 'true'
}
