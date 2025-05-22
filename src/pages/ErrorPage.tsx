
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home } from 'lucide-react'

const ErrorPage = () => {
  const navigate = useNavigate()

  return (
    <div className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-md">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-muted-foreground">
          We apologize for the inconvenience. An unexpected error has occurred.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.reload()} variant="default">
            Try again
          </Button>
          <Button onClick={() => navigate('/')} variant="outline">
            <Home className="mr-2 h-4 w-4" />
            Go home
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ErrorPage
