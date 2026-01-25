import { useState, useEffect } from "react";
import { useAccount, useBalance } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { Button, Card, CardContent, CardHeader, CardTitle, toast } from "@skola/ui";
import { useUSDCBalance, useUSDCAllowance, useApproveUSDC } from "../hooks/useUSDC";
import {
  useCreatorInfo,
  useRegistrationFee,
  useRegisterWithETH,
  useRegisterWithUSDC,
  useEthPrice,
} from "../hooks/useCreatorRegistry";
import { useContractConfig } from "../hooks/useContracts";
import { api } from "../lib/api";

type CreatorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type PaymentMethod = "ETH" | "USDC";

export function CreatorModal({ isOpen, onClose, onSuccess }: CreatorModalProps) {
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { creatorRegistry } = useContractConfig();
  const { data: ethBalance } = useBalance({ address });
  const { balance: usdcBalance, balanceRaw: usdcBalanceRaw } = useUSDCBalance(address);
  const { priceUsd: ethPriceUsd } = useEthPrice();
  const { allowance, refetch: refetchAllowance } = useUSDCAllowance(address, creatorRegistry.address);
  const { isRegistered } = useCreatorInfo(address);
  const { feeUsd, feeUsdc, feeEth, feeEthFormatted } = useRegistrationFee();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ETH");
  const [showSuccess, setShowSuccess] = useState(false);

  const ethBalanceNum = ethBalance ? Number(formatEther(ethBalance.value)) : 0;
  const ethBalanceUsd = ethPriceUsd ? ethBalanceNum * ethPriceUsd : null;

  const needsApproval = paymentMethod === "USDC" && allowance < feeUsdc;
  const hasEnoughBalance =
    paymentMethod === "ETH"
      ? (ethBalance?.value ?? 0n) >= feeEth
      : usdcBalanceRaw >= feeUsdc;

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveUSDC();
  const { 
    register: registerEth, 
    isPending: isRegisteringEth, 
    isConfirming: isConfirmingEth,
    isSuccess: registerEthSuccess 
  } = useRegisterWithETH();
  const { 
    register: registerUsdc, 
    isPending: isRegisteringUsdc, 
    isConfirming: isConfirmingUsdc,
    isSuccess: registerUsdcSuccess 
  } = useRegisterWithUSDC();

  const isPending = isApproving || isRegisteringEth || isRegisteringUsdc;
  const isConfirming = isConfirmingEth || isConfirmingUsdc;
  const isSuccess = registerEthSuccess || registerUsdcSuccess;

  useEffect(() => {
    if (approveSuccess) {
      toast.success("USDC approved! Click again to complete registration.");
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Transaction pending...", { id: "registration" });
    }
  }, [isConfirming]);

  useEffect(() => {
    if (isSuccess) {
      api.post("/users/sync-creator")
        .then(() => {
          toast.success("Welcome to Skola! You're now a creator.", { id: "registration" });
          setShowSuccess(true);
          queryClient.invalidateQueries({ queryKey: ["readContract"] });
          queryClient.invalidateQueries({ queryKey: ["balance"] });
          onSuccess?.();
        })
        .catch(() => {
          toast.success("Registration complete! Please sign in again to sync.", { id: "registration" });
          setShowSuccess(true);
          onSuccess?.();
        });
    }
  }, [isSuccess, onSuccess, queryClient]);

  if (!isOpen) return null;

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckIcon className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">You're a Creator!</h2>
              <p className="text-muted-foreground mt-2">
                You can now create unlimited courses and start earning.
              </p>
            </div>
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-4 text-left">
              <div className="flex items-start gap-3">
                <GiftIcon className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Airdrop Eligible</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive $SKOLA tokens when we launch. Thank you for being an early supporter!
                  </p>
                </div>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={onClose}>
              Start Creating
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isRegistered) return null;

  const handleAction = () => {
    if (paymentMethod === "USDC") {
      if (needsApproval) {
        toast.loading("Approving USDC...", { id: "approve" });
        approve(creatorRegistry.address, feeUsdc);
      } else {
        registerUsdc();
      }
    } else {
      const ethWithBuffer = (feeEth * 102n) / 100n;
      registerEth(ethWithBuffer);
    }
  };

  const getButtonText = () => {
    if (isConfirming) return "Confirming...";
    if (isPending) return "Confirm in wallet...";
    if (paymentMethod === "USDC" && needsApproval) return "Approve USDC";
    if (paymentMethod === "ETH") {
      return `Pay ${feeEthFormatted}`;
    }
    return `Pay $${feeUsd} USDC`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Become a Creator</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              One-time fee. Unlimited courses forever.
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <XIcon className="h-5 w-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-primary/50 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <GiftIcon className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-sm">Early Supporter Airdrop</p>
                <p className="text-xs text-muted-foreground mt-1">
                  All ETH/USDC payers will receive $SKOLA tokens when we launch.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center py-4">
            <div className="text-4xl font-bold">${feeUsd}</div>
            <div className="text-sm text-muted-foreground mt-1">
              ~{feeEthFormatted}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPaymentMethod("ETH")}
              className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                paymentMethod === "ETH" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <span className="font-medium">ETH</span>
            </button>
            <button
              onClick={() => setPaymentMethod("USDC")}
              className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                paymentMethod === "USDC" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
            >
              <span className="font-medium">USDC</span>
            </button>
          </div>

          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ETH Balance</span>
              <div className="text-right">
                <span className="font-medium">{ethBalanceNum.toFixed(4)} ETH</span>
                {ethBalanceUsd !== null && (
                  <span className="text-muted-foreground ml-1">(${ethBalanceUsd.toFixed(2)})</span>
                )}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">USDC Balance</span>
              <span className="font-medium">${Number(usdcBalance).toFixed(2)}</span>
            </div>
          </div>

          {!hasEnoughBalance && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              Insufficient {paymentMethod} balance.
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            disabled={!hasEnoughBalance || isPending || isConfirming}
            onClick={handleAction}
          >
            {getButtonText()}
          </Button>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>One-time payment. No recurring fees.</p>
            <p>Create unlimited courses. Keep 92% of every sale.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
