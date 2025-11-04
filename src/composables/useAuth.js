import { ref } from 'vue'
import { Clerk } from '@clerk/clerk-js'

const clerk = ref(null)
const isAuthenticated = ref(false)
const user = ref(null)

export function useAuth() {
  const initClerk = async () => {
    const clerkInstance = new Clerk(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)
    await clerkInstance.load()
    clerk.value = clerkInstance
    
    if (clerkInstance.user) {
      isAuthenticated.value = true
      user.value = clerkInstance.user
    }
  }

  const signIn = async () => {
    await clerk.value.openSignIn()
  }

  const signOut = async () => {
    await clerk.value.signOut()
    isAuthenticated.value = false
    user.value = null
  }

  return {
    clerk,
    isAuthenticated,
    user,
    initClerk,
    signIn,
    signOut
  }
}