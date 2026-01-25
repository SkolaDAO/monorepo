import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAccount } from "wagmi";
import { Button, Card, CardContent, CardHeader, CardTitle, Container, Badge } from "@skola/ui";
import { useCourse as useApiCourse } from "../hooks/useApiCourses";
import {
  useCourse as useOnChainCourse,
  useHasAccess,
  usePurchaseWithETH,
  usePurchaseWithUSDC,
} from "../hooks/useCourseMarketplace";
import { useUSDCAllowance, useApproveUSDC } from "../hooks/useUSDC";
import { useContractConfig } from "../hooks/useContracts";

type PaymentMethod = "ETH" | "USDC";

export function CoursePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { course: apiCourse, isLoading: apiLoading } = useApiCourse(id!);
  
  const onChainId = apiCourse?.onChainId ? BigInt(apiCourse.onChainId) : null;
  const { course: onChainCourse, priceUsd, priceEth, priceEthRaw, isLoading: chainLoading, refetch } = useOnChainCourse(onChainId ?? 0n);

  if (apiLoading) {
    return <LoadingState />;
  }

  if (!apiCourse) {
    return <NotFoundState />;
  }

  if (apiCourse.isFree) {
    navigate(`/course/${id}/learn`, { replace: true });
    return <LoadingState />;
  }

  if (!onChainId) {
    return <NotFoundState message="This course is not available for purchase yet. The creator hasn't listed it on-chain." />;
  }

  if (chainLoading) {
    return <LoadingState />;
  }

  if (!onChainCourse) {
    return <NotFoundState message={`Course #${onChainId.toString()} not found on-chain. It may have been removed.`} />;
  }

  if (!onChainCourse.active) {
    return <NotFoundState message="This course has been deactivated by the creator." />;
  }

  return (
    <CourseDetail
      courseId={onChainId}
      apiCourse={apiCourse}
      onChainCourse={onChainCourse}
      priceUsd={priceUsd}
      priceEth={priceEth}
      priceEthRaw={priceEthRaw}
      refetch={refetch}
    />
  );
}

type CourseDetailProps = {
  courseId: bigint;
  apiCourse: {
    id: string;
    title: string;
    description: string | null;
    thumbnail: string | null;
    priceUsd: string;
    creator?: {
      id: string;
      address: string;
      username: string | null;
    };
  };
  onChainCourse: {
    creator: `0x${string}`;
    priceUsd: bigint;
    metadataURI: string;
    active: boolean;
    totalSales: bigint;
    totalRevenue: bigint;
  };
  priceUsd: string;
  priceEth: string;
  priceEthRaw: bigint;
  refetch: () => void;
};

function CourseDetail({
  courseId,
  apiCourse,
  onChainCourse,
  priceUsd,
  priceEth,
  priceEthRaw,
  refetch,
}: CourseDetailProps) {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { courseMarketplace } = useContractConfig();

  const { hasAccess, refetch: refetchAccess } = useHasAccess(courseId, address);
  const { allowance, refetch: refetchAllowance } = useUSDCAllowance(
    address,
    courseMarketplace.address
  );

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("ETH");
  const [referrer] = useState<`0x${string}`>("0x0000000000000000000000000000000000000000");

  const needsApproval = paymentMethod === "USDC" && allowance < onChainCourse.priceUsd;

  const { approve, isPending: isApproving, isSuccess: approveSuccess } = useApproveUSDC();
  const {
    purchase: purchaseEth,
    isPending: isPurchasingEth,
    isConfirming: isConfirmingEth,
    isSuccess: purchaseEthSuccess,
  } = usePurchaseWithETH();
  const {
    purchase: purchaseUsdc,
    isPending: isPurchasingUsdc,
    isConfirming: isConfirmingUsdc,
    isSuccess: purchaseUsdcSuccess,
  } = usePurchaseWithUSDC();

  const isPending = isApproving || isPurchasingEth || isPurchasingUsdc;
  const isConfirming = isConfirmingEth || isConfirmingUsdc;
  const purchaseSuccess = purchaseEthSuccess || purchaseUsdcSuccess;

  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  useEffect(() => {
    if (purchaseSuccess) {
      refetch();
      refetchAccess();
    }
  }, [purchaseSuccess, refetch, refetchAccess]);

  const handlePurchase = () => {
    if (paymentMethod === "USDC") {
      if (needsApproval) {
        approve(courseMarketplace.address, onChainCourse.priceUsd);
      } else {
        purchaseUsdc(courseId, referrer);
      }
    } else {
      const ethWithBuffer = (priceEthRaw * 101n) / 100n;
      purchaseEth(courseId, ethWithBuffer, referrer);
    }
  };

  const getButtonText = () => {
    if (!isConnected) return "Connect Wallet";
    if (hasAccess) return "You Own This Course";
    if (isPending) return "Confirm in Wallet...";
    if (isConfirming) return "Processing...";
    if (paymentMethod === "USDC" && needsApproval) return "Approve USDC";
    if (paymentMethod === "ETH") return `Buy for ${Number(priceEth).toFixed(4)} ETH`;
    return `Buy for $${priceUsd} USDC`;
  };

  const isCreator = address?.toLowerCase() === onChainCourse.creator.toLowerCase();

  return (
    <div className="py-8">
      <Container>
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="aspect-video overflow-hidden rounded-xl border border-border">
              <img
                src={
                  apiCourse.thumbnail ||
                  "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=450&fit=crop"
                }
                alt={apiCourse.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div>
              <div className="mb-4 flex flex-wrap gap-2">
                {hasAccess && <Badge variant="default">Owned</Badge>}
                {isCreator && <Badge variant="outline">Your Course</Badge>}
              </div>

              <h1 className="mb-4 text-3xl font-bold">
                {apiCourse.title}
              </h1>

              <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                  By {apiCourse.creator?.username || `${onChainCourse.creator.slice(0, 6)}...${onChainCourse.creator.slice(-4)}`}
                </span>
                <span>{Number(onChainCourse.totalSales)} students</span>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>About This Course</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {apiCourse.description || "No description available."}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-8">
              <CardContent className="pt-6 space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold">${priceUsd}</div>
                  <div className="text-sm text-muted-foreground">
                    ~{Number(priceEth).toFixed(4)} ETH
                  </div>
                </div>

                {hasAccess ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <CheckIcon className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-medium">You have access to this course</p>
                    </div>
                    <Button className="w-full" size="lg">
                      Start Learning
                    </Button>
                  </div>
                ) : isCreator ? (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-muted p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        This is your course
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate("/dashboard")}
                    >
                      Manage Course
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPaymentMethod("ETH")}
                        className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                          paymentMethod === "ETH"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">ETH</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("USDC")}
                        className={`flex-1 rounded-lg border-2 p-3 text-center transition-all ${
                          paymentMethod === "USDC"
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <span className="font-medium">USDC</span>
                      </button>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      disabled={!isConnected || isPending || isConfirming}
                      onClick={handlePurchase}
                    >
                      {getButtonText()}
                    </Button>

                    {!isConnected && (
                      <p className="text-center text-sm text-muted-foreground">
                        Connect your wallet to purchase
                      </p>
                    )}
                  </>
                )}

                <div className="border-t border-border pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Creator receives</span>
                    <span className="text-emerald-500 font-medium">92-95%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Platform fee</span>
                    <span>5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Referrer fee</span>
                    <span>3% (if applicable)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
            <p className="text-muted-foreground">Loading course...</p>
          </div>
        </div>
      </Container>
    </div>
  );
}

function NotFoundState({ message }: { message?: string }) {
  const navigate = useNavigate();

  return (
    <div className="py-8">
      <Container>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <div className="mb-6 rounded-full bg-muted p-6">
            <BookIcon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Course Not Found</h1>
          <p className="mb-8 max-w-md text-muted-foreground">
            {message || "This course doesn't exist or has been deactivated."}
          </p>
          <Button onClick={() => navigate("/")}>Browse Courses</Button>
        </div>
      </Container>
    </div>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 19l-7-7m0 0l7-7m-7 7h18"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function BookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}
