import './App.css'
import { SignedIn, SignedOut, SignInButton, UserButton, SignOutButton } from '@clerk/clerk-react'

function App() {

  return (
    <>
      <h1>Welcome to the app</h1>

      <SignInButton mode='modal'>
        <button>Login</button>
      </SignInButton>


      <SignedIn>
        <SignOutButton />
      </SignedIn>

      <UserButton />

    </>
  )
}

export default App
