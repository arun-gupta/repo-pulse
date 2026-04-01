import { RepoInputClient } from '@/components/repo-input/RepoInputClient'

export default function Home() {
  const hasServerToken = Boolean(process.env.GITHUB_TOKEN)

  return <RepoInputClient hasServerToken={hasServerToken} />
}
