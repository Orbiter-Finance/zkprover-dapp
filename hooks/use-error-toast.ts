import { useToast } from "./use-toast"

export function useErrorToast() {
  const { toast } = useToast()
  return (description: string) => {
    toast({
      variant: "destructive",
      title: "Uh oh! Something went wrong.",
      description,
    })
  }
}
