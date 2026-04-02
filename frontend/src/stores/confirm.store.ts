import { defineStore } from 'pinia'

interface ConfirmState {
  isOpen: boolean
  title: string
  message: string
  resolve: (value: boolean) => void
}

export const useConfirmStore = defineStore('confirm', {
  state: (): ConfirmState => ({
    isOpen: false,
    title: '',
    message: '',
    resolve: () => {}
  }),

  actions: {
    ask(title: string, message: string): Promise<boolean> {
      this.title = title
      this.message = message
      this.isOpen = true

      return new Promise((resolve) => {
        this.resolve = (value: boolean) => {
          this.isOpen = false
          resolve(value)
        }
      })
    }
  }
})
