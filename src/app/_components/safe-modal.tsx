// src/app/_components/safe-modal.tsx
import { Modal, ModalProps } from "@heroui/modal";

export default function SafeModal(props: ModalProps) {
  return (
    <Modal
      {...props}
      classNames={{
        wrapper: "p-safe",
        ...(props.classNames ?? {}),
      }}
    />
  );
}
