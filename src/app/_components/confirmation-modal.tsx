"use client";

import { Button } from "@heroui/button";
import {
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { type ReactNode, useTransition } from "react";
import SafeModal from "./safe-modal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  danger?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  onConfirm,
  danger = false,
}: Props) {
  const [pending, startTransition] = useTransition();

  const confirm = () => {
    startTransition(async () => {
      await onConfirm();
      onClose();
    });
  };

  return (
    <SafeModal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalBody>{description}</ModalBody>
        <ModalFooter>
          <div className="flex items-center justify-end gap-1">
            <Button onPress={onClose} isDisabled={pending}>
              Cancel
            </Button>
            <Button
              color={danger ? "danger" : "primary"}
              onPress={confirm}
              isDisabled={pending}
              isLoading={pending}
            >
              {confirmLabel}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </SafeModal>
  );
}
