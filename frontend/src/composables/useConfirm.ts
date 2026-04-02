import { useConfirmStore } from '../stores/confirm.store'

export function useConfirm() {
  const store = useConfirmStore()

  /**
   * Triggers a global confirmation dialog.
   * @param title The title of the dialog
   * @param message The message to display
   * @returns A promise that resolves to true (Confirm) or false (Cancel)
   */
  async function confirm(title: string, message: string): Promise<boolean> {
    return await store.ask(title, message)
  }

  return {
    confirm
  }
}
