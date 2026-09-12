import packageJson from '../../../package.json'

export const repositoryURL = packageJson.repository.url

export const repositoryPath = new URL(repositoryURL).pathname.slice(1)

export const repositoryReleasesURL = `${repositoryURL}/releases`

export const upstreamRepositoryURL = 'https://github.com/Ciensprog/Aerial-Launcher'

export const supportURL = `${repositoryURL}/issues`

export const repositoryRawURL = `https://raw.githubusercontent.com/${repositoryPath}/main`

export const repositoryAssetsURL = `${repositoryRawURL}/assets`
