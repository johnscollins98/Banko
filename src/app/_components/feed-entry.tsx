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
import { ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { addToast } from "@heroui/react";
import { startTransition, useOptimistic, useState } from "react";
import { FaChevronLeft, FaLink, FaShare } from "react-icons/fa6";
import DateDisplay from "./date";
import SafeModal from "./safe-modal";
import TimeDisplay from "./time";

interface Props {
  feedItem: Transactions["feedItems"][number];
  orderedCategories: SpendingCategory[];
  settleUpProfile: { settleUpLink: string; status: string };
}

export default function FeedEntry({
  feedItem,
  orderedCategories,
  settleUpProfile,
}: Props) {
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

  const [settleUp, setSettleUp] = useState(false);
  const [settleUpMessage, setSettleUpMessage] = useState(
    feedItem.counterPartyName,
  );
  const [split, setSplit] = useState<string>("1");

  const [settleUpAmount, setSettleUpAmount] = useState(
    (feedItem.amount.minorUnits / 2 / 100).toLocaleString(undefined, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }),
  );

  const onSetAmount = (amount: string) => {
    setSettleUpAmount(amount);
    setSplit("");
  };

  const onSetSplit = (split: string) => {
    const splitNum = parseFloat(split) + 1;

    if (!isNaN(splitNum) && splitNum > 0) {
      const newAmount = (
        feedItem.amount.minorUnits /
        splitNum /
        100
      ).toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
      });
      setSettleUpAmount(newAmount);
    }
    setSplit(split);
  };

  const onSettleUp = async (share: boolean) => {
    const url = new URL(`https://${settleUpProfile.settleUpLink}`);
    url.searchParams.set("amount", settleUpAmount);
    url.searchParams.set("message", settleUpMessage);

    if (share && navigator.share) {
      try {
        await navigator.share({
          url: url.toString(),
          text: `Asking for £${settleUpAmount} for ${settleUpMessage}`,
          title: `Asking for £${settleUpAmount} for ${settleUpMessage}`,
        });
        addToast({
          title: "Shared successfully",
          color: "success",
        });
      } catch {
        addToast({
          title: "Failed to share",
          color: "danger",
        });
      }
    } else {
      await navigator.clipboard.writeText(url.toString());
      addToast({
        title: "Copied to clipboard",
        color: "success",
      });
    }
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
      <SafeModal
        isOpen={modalOpen}
        onClose={closeModal}
        scrollBehavior="inside"
        size="sm"
        placement="bottom-center"
      >
        <ModalContent>
          <ModalHeader className="flex items-baseline gap-2">
            {settleUp && (
              <Button
                isIconOnly
                onPress={() => setSettleUp(false)}
                size="sm"
                variant="light"
              >
                <FaChevronLeft />
              </Button>
            )}{" "}
            {settleUp ? "Settle Up" : "Set Category"}
          </ModalHeader>
          <ModalBody>
            {!settleUp && (
              <Button onPress={() => setSettleUp(!settleUp)}>Settle Up</Button>
            )}
            {settleUp && (
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-4">
                  <div className="text-sm text-foreground-500">
                    Transaction Amount
                  </div>
                  <div className="text-lg font-bold">
                    {formatAsGBP(
                      feedItem.amount.minorUnits / 100,
                      false,
                      false,
                    )}
                  </div>
                </div>
                <Input
                  label="Split with X people"
                  value={split}
                  type="number"
                  validate={(e) => {
                    const value = parseFloat(e);

                    if (e === "") {
                      return true;
                    }

                    if (isNaN(value) || value < 0) {
                      return "Please enter a valid positive number";
                    }

                    return true;
                  }}
                  onChange={(e) => onSetSplit(e.target.value)}
                  size="lg"
                />
                <Input
                  label="Requested Amount"
                  value={settleUpAmount}
                  onChange={(e) => onSetAmount(e.target.value)}
                  size="lg"
                />
                <Input
                  label="Message"
                  value={settleUpMessage}
                  onChange={(e) => setSettleUpMessage(e.target.value)}
                  size="lg"
                />
                <div className="flex gap-2">
                  <Button
                    className="flex flex-1 items-center gap-2"
                    onPress={() => onSettleUp(false)}
                  >
                    <FaLink />
                    Copy Link
                  </Button>
                  <Button
                    className="flex flex-1 items-center gap-2"
                    color="primary"
                    onPress={() => onSettleUp(true)}
                  >
                    <FaShare />
                    Share
                  </Button>
                </div>
              </div>
            )}
            {!settleUp && (
              <>
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
              </>
            )}
          </ModalBody>
        </ModalContent>
      </SafeModal>
    </>
  );
}
