import './App.css'
import { SignedIn, SignedOut, SignInButton, UserButton, SignOutButton } from '@clerk/clerk-react'

function App() {
  return (
    <>
      <h1>Welcome to the app</h1>

      {/* This will ONLY show when the user is logged out */}
      <SignedOut>
        <SignInButton mode='modal'>
          <button>Login</button>
        </SignInButton>
      </SignedOut>

      {/* This will ONLY show when the user is logged in */}
      <SignedIn>
        <SignOutButton />
        <UserButton />
      </SignedIn>
    </>
  )
}

export default App