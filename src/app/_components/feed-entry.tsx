"use client";

import setCategory from "@/lib/actions/set-category";
import { formatAsGBP } from "@/lib/currency-format";
import {
  CategoryIcons,
  SpendingCategory,
  Transactions,
} from "@/lib/starling-types";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { startTransition, useOptimistic, useState } from "react";
import DateDisplay from "./date";
import TimeDisplay from "./time";

interface Props {
  feedItem: Transactions["feedItems"][number];
  orderedCategories: SpendingCategory[];
}

export default function FeedEntry({ feedItem, orderedCategories }: Props) {
  const [optimisticFeedItem, updateOptimisticFeedItem] = useOptimistic(
    feedItem,
    (_state, newFeedItem: typeof feedItem) => newFeedItem,
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");

  const closeModal = () => {
    setModalOpen(false);
    setCategoryFilter("");
  };

  const updateCategoryHandler = async (category: SpendingCategory) => {
    startTransition(() => {
      updateOptimisticFeedItem({ ...feedItem, spendingCategory: category });
    });
    closeModal();
    await setCategory({ category, transactionId: feedItem.feedItemUid });
  };

  const CategoryIcon = CategoryIcons[optimisticFeedItem.spendingCategory];

  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={`cursor-pointer border-b border-foreground-200 p-3 transition-colors duration-100 last:border-b-0 hover:bg-foreground-50 ${feedItem.status === "UPCOMING" && "opacity-60"}`}
      >
        <div className="flex justify-between">
          <div className="font-bold">{optimisticFeedItem.counterPartyName}</div>
          <div
            className={`font-bold ${
              optimisticFeedItem.direction === "IN" &&
              "text-blue-600 dark:text-blue-400"
            }`}
          >
            {formatAsGBP(
              (optimisticFeedItem.amount.minorUnits / 100) *
                (optimisticFeedItem.direction === "IN" ? 1 : -1),
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-foreground-500">
          <div className="flex gap-3">
            <div className="flex items-center gap-1 font-bold capitalize">
              {CategoryIcon && <CategoryIcon size={10} />}
              {optimisticFeedItem.spendingCategory
                .replaceAll("_", " ")
                .toLowerCase()}
            </div>
            <div>{optimisticFeedItem.reference}</div>
          </div>
          <div className="flex gap-0.5">
            <DateDisplay date={new Date(optimisticFeedItem.transactionTime)} />,
            <TimeDisplay date={new Date(optimisticFeedItem.transactionTime)} />
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        scrollBehavior="inside"
        size="sm"
      >
        <ModalContent>
          <ModalHeader>Select a category...</ModalHeader>
          <ModalBody>
            <Input
              label="Filter"
              value={categoryFilter}
              size="lg"
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
            <div className="h-dvh max-h-72">
              {orderedCategories
                .filter((c) =>
                  c
                    .toLocaleLowerCase()
                    .includes(categoryFilter.toLocaleLowerCase()),
                )
                .map((c) => (
                  <Button
                    className="my-1 capitalize"
                    variant="light"
                    fullWidth
                    key={c}
                    onPress={() => updateCategoryHandler(c)}
                  >
                    {c.replaceAll("_", " ").toLocaleLowerCase()}
                  </Button>
                ))}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
