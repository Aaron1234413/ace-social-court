
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/components/AuthProvider'

const Home = () => {
  const navigate = useNavigate()
  const { user, isLoading } = useAuth()

  // Redirect to feed if already logged in
  React.useEffect(() => {
    if (user && !isLoading) {
      navigate('/feed')
    }
  }, [user, isLoading, navigate])

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to Tennis Connect</h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl">
          Connect with other tennis players, track your progress, and improve your game.
        </p>
        <div className="flex gap-4 mt-8">
          <Button onClick={() => navigate('/auth')} size="lg">
            Get Started
          </Button>
          <Button onClick={() => navigate('/feed')} variant="outline" size="lg">
            Explore Feed
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Home
