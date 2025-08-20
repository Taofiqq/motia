import { useEffect, useState } from 'react'

export const useGithubStars = () => {
  const [starCount, setStarCount] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Fetch star count from GitHub API
    fetch('https://api.github.com/repos/MotiaDev/motia')
      .then((response) => response.json())
      .then((data) => {
        setStarCount(data?.stargazers_count ?? null)
        setIsLoading(false)
      })
      .catch((error) => {
        console.error('Error fetching GitHub stars:', error)
        setStarCount(null)
        setIsLoading(false)
      })
  }, [])

  return { starCount, isLoading }
}
