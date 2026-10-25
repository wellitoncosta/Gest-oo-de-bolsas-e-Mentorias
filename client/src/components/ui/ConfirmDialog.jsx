import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, title, children }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      {children}
    </Modal>
  )
}
